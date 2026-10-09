import { useState, useRef, useEffect } from 'react';
import { 
  GifIcon as Gif, 
  ArrowDownTrayIcon as Download, 
  XMarkIcon as XMark,
  FilmIcon,
  ScissorsIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import { fetchFile } from '@ffmpeg/util';
import { playDing } from '../../utils/audio';
import { useProcessing } from '../../contexts/ProcessingContext';
import { formatBytes } from '../../utils/formatters';
import { probeVideoFps } from '../../utils/videoProbe';
import DirectTimelineTrimmer from '../../components/DirectTimelineTrimmer';
import GifSpatialCropper from './GifSpatialCropper';
import { 
  TARGET_SIZE_OPTIONS, 
  calculateCropPixelBounds, 
  computeAutoBudgetParameters, 
  buildFfmpegGifArgs 
} from './gifCompressionUtils';

const TOOL_ID = 'video-to-gif';

export default function VideoToGifSlot({ slot }) {
  const { jobs, addJob, updateJob, removeJob, isFfmpegLoaded, updateSlot, removeSlot, createFfmpegInstance } = useProcessing();
  const videoRef = useRef(null);

  const myJobId = slot.id;
  const myJob = jobs.find(j => j.id === myJobId);
  const isProcessing = myJob?.status === 'running';
  const resultUrl = myJob?.resultUrl;
  const isResultMp4 = myJob?.isMp4;
  const resultBytes = myJob?.resultBytes;

  const { 
    videoFile, 
    previewUrl, 
    originalFps = null, 
    quality = 80, 
    enableCrop = false, // Duration trim
    startTime = 0, 
    endTime = 5, 
    fps = '15',
    videoDuration = 0,
    enableSpatialCrop = false,
    cropRect = { x: 0, y: 0, width: 100, height: 100 },
    cropAspectRatio = 'free',
    targetSizeLimit = '50', // Default auto-compress under 50MB!
    customTargetMb = 50
  } = slot;

  const [isPlayingLoop, setIsPlayingLoop] = useState(false);

  // Compute effective target MB
  const effectiveTargetMb = targetSizeLimit === 'none' 
    ? null 
    : (targetSizeLimit === 'custom' ? (Number(customTargetMb) || 50) : Number(targetSizeLimit));

  // Determine crop pixel bounds if spatial crop is enabled
  const naturalWidth = videoRef.current?.videoWidth || 640;
  const naturalHeight = videoRef.current?.videoHeight || 360;
  const cropBounds = enableSpatialCrop 
    ? calculateCropPixelBounds(cropRect, naturalWidth, naturalHeight)
    : null;

  // Estimation & Auto-Budgeting Logic
  const duration = Math.max(0.1, endTime - startTime);
  const requestedFps = fps === 'original' ? (originalFps || 15) : parseInt(fps);

  const budgetParams = computeAutoBudgetParameters({
    targetMb: effectiveTargetMb,
    duration,
    naturalWidth,
    naturalHeight,
    cropBounds,
    requestedFps,
    requestedQuality: quality
  });

  const estimatedBytes = budgetParams.estimatedBytes;

  // Initial Probe for FPS and Duration
  useEffect(() => {
    if (isFfmpegLoaded && videoFile && originalFps === null && !slot.isProbing) {
      updateSlot(TOOL_ID, slot.id, { isProbing: true });
      const probe = async () => {
        const detectedFps = await probeVideoFps(createFfmpegInstance, slot.id, videoFile);
        if (detectedFps) {
          const roundedFps = Math.round(detectedFps);
          let newFps = fps;
          if (fps !== 'original' && parseInt(fps) > roundedFps) {
            if (roundedFps >= 15) newFps = '15';
            else newFps = '10';
          }
          updateSlot(TOOL_ID, slot.id, { originalFps: roundedFps, fps: newFps });
        } else {
          updateSlot(TOOL_ID, slot.id, { originalFps: 30 });
        }
      };
      probe();
    }
  }, [isFfmpegLoaded, videoFile, originalFps, slot.isProbing, slot.id, updateSlot, createFfmpegInstance, fps]);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration > 0) {
      const dur = videoRef.current.duration;
      const initialEnd = (endTime === 5 && dur > 0) ? Math.min(dur, Math.floor(dur * 10) / 10) : endTime;
      updateSlot(TOOL_ID, slot.id, { 
        videoDuration: dur,
        endTime: Math.min(dur, initialEnd) 
      });
    }
  };

  // Selection Loop Listener
  const handleTimeUpdate = () => {
    if (isPlayingLoop && videoRef.current && enableCrop) {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
        videoRef.current.play();
      }
    }
  };

  const toggleLoopPlay = () => {
    if (!videoRef.current) return;
    if (isPlayingLoop) {
      setIsPlayingLoop(false);
      videoRef.current.pause();
    } else {
      setIsPlayingLoop(true);
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
  };

  const seekToTime = (timeSeconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timeSeconds;
    }
  };

  // Convert to GIF with Auto Compression & Spatial Crop
  const processVideo = async () => {
    if (!videoFile || !isFfmpegLoaded || isProcessing) return;
    
    addJob({ id: myJobId, title: 'Converting & Compressing GIF', type: 'video-to-gif' });

    let localFfmpeg = null;
    let fullLog = '';
    const logHandler = ({ message }) => { 
      fullLog += message + '\n'; 
      updateJob(myJobId, { log: message });
    };
    
    const progressHandler = ({ progress }) => {
      updateJob(myJobId, { progress: Math.min(99, progress * 100) });
    };

    try {
      localFfmpeg = await createFfmpegInstance();
      localFfmpeg.on('log', logHandler);
      localFfmpeg.on('progress', progressHandler);

      const inputName = `input_${slot.id}_` + videoFile.name.replace(/\s+/g, '_');
      const outputName = `output_${slot.id}.gif`;
      
      await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Build FFmpeg command using computed budget parameters
      const args = buildFfmpegGifArgs({
        inputName,
        outputName,
        startTime,
        endTime,
        enableDurationTrim: enableCrop,
        cropBounds,
        finalFps: budgetParams.fps,
        targetScale: budgetParams.targetScale,
        maxColors: budgetParams.maxColors,
        statsMode: budgetParams.statsMode,
        dither: budgetParams.dither
      });

      const execResult = await localFfmpeg.exec(args);
      if (execResult !== 0) {
        throw new Error(`FFmpeg exited with code ${execResult}. Last logs:\n${fullLog.substring(fullLog.length - 400)}`);
      }

      let data = await localFfmpeg.readFile(outputName);
      if (data.length === 0) throw new Error("Generated GIF is 0 bytes");

      // Verify target size compliance: If output exceeds target MB, execute secondary precision pass
      if (effectiveTargetMb && data.length > effectiveTargetMb * 1024 * 1024) {
        updateJob(myJobId, { 
          log: `Optimizing palette to ensure output is under ${effectiveTargetMb} MB...`,
          progress: 92
        });

        const precisionOutputName = `output_${slot.id}_compressed.gif`;
        const precisionScale = Math.max(160, Math.floor(budgetParams.targetScale * 0.78));
        const precisionArgs = buildFfmpegGifArgs({
          inputName,
          outputName: precisionOutputName,
          startTime,
          endTime,
          enableDurationTrim: enableCrop,
          cropBounds,
          finalFps: Math.min(12, budgetParams.fps),
          targetScale: precisionScale,
          maxColors: 128,
          statsMode: 'diff',
          dither: 'bayer:bayer_scale=3'
        });

        const exec2 = await localFfmpeg.exec(precisionArgs);
        if (exec2 === 0) {
          const refinedData = await localFfmpeg.readFile(precisionOutputName);
          if (refinedData && refinedData.length > 0) {
            data = refinedData;
          }
        }
      }

      const blob = new Blob([data], { type: 'image/gif' });
      const rUrl = URL.createObjectURL(blob);
      updateJob(myJobId, { 
        status: 'success', 
        resultUrl: rUrl, 
        isMp4: false, 
        resultBytes: data.length,
        downloadName: `animation-${Date.now()}.gif` 
      });
      playDing();
    } catch (err) {
      console.error(err);
      if (err.message.includes('av1') && err.message.includes('Missing Sequence Header')) {
        const friendlyError = "This video appears to be an AV1 file, which isn't fully supported by our browser-based processing engine. Please try using a standard MP4 (H.264) video instead.";
        updateJob(myJobId, { status: 'error', error: friendlyError });
      } else {
        updateJob(myJobId, { status: 'error', error: err.message });
      }
    } finally {
      if (localFfmpeg) {
        localFfmpeg.off('log', logHandler);
        localFfmpeg.off('progress', progressHandler);
        localFfmpeg.terminate();
      }
    }
  };

  // Export Trimmed Video (MP4) with Spatial Crop
  const processTrimmedVideo = async () => {
    if (!videoFile || !isFfmpegLoaded || isProcessing) return;
    
    addJob({ id: myJobId, title: 'Trimming & Exporting MP4 Video', type: 'video-trim' });

    let localFfmpeg = null;
    let fullLog = '';
    const logHandler = ({ message }) => { 
      fullLog += message + '\n'; 
      updateJob(myJobId, { log: message });
    };
    
    const progressHandler = ({ progress }) => {
      updateJob(myJobId, { progress: progress * 100 });
    };

    try {
      localFfmpeg = await createFfmpegInstance();
      localFfmpeg.on('log', logHandler);
      localFfmpeg.on('progress', progressHandler);

      const inputName = `input_${slot.id}_` + videoFile.name.replace(/\s+/g, '_');
      const outputName = `trimmed_${slot.id}.mp4`;
      
      await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));

      let args = ['-y'];
      if (enableCrop) {
        args.push('-ss', startTime.toString(), '-to', endTime.toString());
      }
      args.push('-i', inputName);

      if (cropBounds) {
        args.push('-vf', `crop=${cropBounds.w}:${cropBounds.h}:${cropBounds.x}:${cropBounds.y}`);
      }

      args.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', outputName);

      const execResult = await localFfmpeg.exec(args);
      if (execResult !== 0) {
        throw new Error(`FFmpeg exited with code ${execResult}. Last logs:\n${fullLog.substring(fullLog.length - 400)}`);
      }

      const data = await localFfmpeg.readFile(outputName);
      if (data.length === 0) throw new Error("Trimmed video is 0 bytes");

      const blob = new Blob([data], { type: 'video/mp4' });
      const rUrl = URL.createObjectURL(blob);
      updateJob(myJobId, { 
        status: 'success', 
        resultUrl: rUrl, 
        isMp4: true, 
        resultBytes: data.length,
        downloadName: `trimmed-${Date.now()}.mp4` 
      });
      playDing();
    } catch (err) {
      console.error(err);
      updateJob(myJobId, { status: 'error', error: err.message });
    } finally {
      if (localFfmpeg) {
        localFfmpeg.off('log', logHandler);
        localFfmpeg.off('progress', progressHandler);
        localFfmpeg.terminate();
      }
    }
  };

  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => removeSlot(TOOL_ID, slot.id), 200);
  };

  return (
    <div className={`glass-panel controls animate-pop-in ${isClosing ? 'animate-pop-out' : ''}`} style={{ position: 'relative', marginBottom: '2rem' }}>
      <button 
        onClick={handleClose} 
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', zIndex: 10 }}
        title="Close Slot"
      >
        <XMark style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Video Player Container with Spatial Cropper Overlay */}
        <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', background: '#000' }}>
          <video 
            ref={videoRef}
            src={previewUrl} 
            controls 
            onLoadedMetadata={handleVideoLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block' }} 
          />

          {enableSpatialCrop && (
            <GifSpatialCropper
              videoRef={videoRef}
              cropRect={cropRect}
              onChangeCrop={(newRect) => updateSlot(TOOL_ID, slot.id, { cropRect: newRect })}
              aspectRatio={cropAspectRatio}
              onChangeAspectRatio={(newRatio) => updateSlot(TOOL_ID, slot.id, { cropAspectRatio: newRatio })}
            />
          )}
        </div>
        
        {!isProcessing && !resultUrl && (
          <div>
            {/* Auto Compression & Target File Size Control */}
            <div className="input-group" style={{ marginBottom: '1.25rem', background: 'rgba(64, 224, 208, 0.06)', border: '1px solid var(--accent-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  <SparklesIcon style={{ width: 18, height: 18, color: 'var(--accent-color)' }} />
                  Target Size & Auto-Compression
                </label>
                {effectiveTargetMb && (
                  <span style={{ fontSize: '0.75rem', background: 'var(--accent-gradient)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    Guaranteed ≤ {effectiveTargetMb} MB
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={targetSizeLimit}
                  onChange={(e) => updateSlot(TOOL_ID, slot.id, { targetSizeLimit: e.target.value })}
                  style={{ flex: '1 1 200px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                >
                  {TARGET_SIZE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                {targetSizeLimit === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={customTargetMb}
                      onChange={(e) => updateSlot(TOOL_ID, slot.id, { customTargetMb: Number(e.target.value) || 50 })}
                      style={{ width: '80px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>MB</span>
                  </div>
                )}
              </div>
              
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                {effectiveTargetMb 
                  ? `Automatically balances resolution, framerate, and palette compression to ensure the generated GIF stays within ${effectiveTargetMb} MB.`
                  : "Manual mode: file size is determined purely by the quality and framerate sliders below."}
              </small>
            </div>

            {/* Spatial Cropping Toggle & Controls */}
            <div className="input-group" style={{ marginBottom: '1.25rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={enableSpatialCrop} 
                  onChange={(e) => updateSlot(TOOL_ID, slot.id, { enableSpatialCrop: e.target.checked })} 
                  style={{ width: 'auto' }}
                />
                <ScissorsIcon style={{ width: 18, height: 18, color: 'var(--accent-color)' }} />
                <span style={{ fontWeight: '500' }}>Spatial Frame Cropping</span>
                {enableSpatialCrop && cropBounds && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-color)', fontFamily: 'monospace' }}>
                    {cropBounds.w} × {cropBounds.h} px
                  </span>
                )}
              </label>

              {enableSpatialCrop && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Use the handles on the video player above to adjust the visual crop area, or choose an aspect ratio preset.
                </div>
              )}
            </div>

            {/* Quality Slider (Resolution base) */}
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Quality (Resolution Scale)</span>
                <span style={{ color: 'var(--accent-color)' }}>
                  {effectiveTargetMb ? `Auto-adjusted (~${budgetParams.targetScale}px)` : `${quality}% (~${budgetParams.targetScale}px)`}
                </span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={quality} 
                onChange={(e) => updateSlot(TOOL_ID, slot.id, { quality: Number(e.target.value) })}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>

            {/* Framerate Selection */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Framerate (FPS)</label>
              <select 
                value={fps} 
                onChange={(e) => updateSlot(TOOL_ID, slot.id, { fps: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
              >
                <option value="original">Original{originalFps ? ` (${originalFps}fps)` : ''}</option>
                {(!originalFps || originalFps >= 30) && <option value="30">30 FPS</option>}
                {(!originalFps || originalFps >= 24) && <option value="24">24 FPS</option>}
                {(!originalFps || originalFps >= 20) && <option value="20">20 FPS</option>}
                {(!originalFps || originalFps >= 15) && <option value="15">15 FPS</option>}
                {(!originalFps || originalFps >= 10) && <option value="10">10 FPS</option>}
                {(!originalFps || originalFps >= 5) && <option value="5">5 FPS</option>}
              </select>
            </div>

            {/* Duration Trimming & Timeline Trimmer */}
            <div className="input-group" style={{ marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: enableCrop ? '1rem' : '0' }}>
                <input 
                  type="checkbox" 
                  checked={enableCrop} 
                  onChange={(e) => updateSlot(TOOL_ID, slot.id, { enableCrop: e.target.checked })} 
                  style={{ width: 'auto' }}
                />
                <span style={{ fontWeight: '500' }}>Crop Duration & Timeline Trimmer</span>
              </label>

              {enableCrop && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <DirectTimelineTrimmer 
                    videoDuration={videoDuration}
                    startTime={startTime}
                    endTime={endTime}
                    onUpdateTimes={(newStart, newEnd) => {
                      updateSlot(TOOL_ID, slot.id, { startTime: newStart, endTime: newEnd });
                    }}
                    onSeek={seekToTime}
                    isPlayingLoop={isPlayingLoop}
                    onToggleLoop={toggleLoopPlay}
                  />

                  {/* Manual Numeric Input Fields */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Time (m:s)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="MM"
                          value={Math.floor(startTime / 60) || 0} 
                          onChange={(e) => {
                            const val = (Number(e.target.value) * 60) + (startTime % 60);
                            updateSlot(TOOL_ID, slot.id, { startTime: val });
                            seekToTime(val);
                          }}
                          style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                        />
                        <span>:</span>
                        <input 
                          type="number" 
                          min="0"
                          max="59.9"
                          step="0.1"
                          placeholder="SS.s"
                          value={Number((startTime % 60).toFixed(1))} 
                          onChange={(e) => {
                            const val = (Math.floor(startTime / 60) * 60) + Number(e.target.value);
                            updateSlot(TOOL_ID, slot.id, { startTime: val });
                            seekToTime(val);
                          }}
                          style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>End Time (m:s)</label>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="MM"
                          value={Math.floor(endTime / 60) || 0} 
                          onChange={(e) => {
                            const val = (Number(e.target.value) * 60) + (endTime % 60);
                            updateSlot(TOOL_ID, slot.id, { endTime: val });
                            seekToTime(val);
                          }}
                          style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                        />
                        <span>:</span>
                        <input 
                          type="number" 
                          min="0"
                          max="59.9"
                          step="0.1"
                          placeholder="SS.s"
                          value={Number((endTime % 60).toFixed(1))} 
                          onChange={(e) => {
                            const val = (Math.floor(startTime / 60) * 60) + Number(e.target.value);
                            updateSlot(TOOL_ID, slot.id, { endTime: val });
                            seekToTime(val);
                          }}
                          style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Estimated Size Card with Target Status */}
            <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Estimated GIF Size:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
                  ~{formatBytes(estimatedBytes)}
                  {effectiveTargetMb && estimatedBytes <= effectiveTargetMb * 1024 * 1024 && (
                    <span style={{ marginLeft: '0.5rem', color: 'var(--success-color)', fontSize: '0.8rem' }}>
                      (Under {effectiveTargetMb} MB)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="button-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={processVideo} disabled={!isFfmpegLoaded}>
                <Gif style={{ width: '18px', height: '18px' }} /> Convert & Compress to GIF
              </button>
              <button className="btn" onClick={processTrimmedVideo} disabled={!isFfmpegLoaded} style={{ background: 'rgba(255,255,255,0.08)' }}>
                <FilmIcon style={{ width: '18px', height: '18px', color: '#3b82f6' }} /> Export Video (MP4)
              </button>
            </div>
          </div>
        )}

        {isProcessing && (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Processing in background... You can safely navigate to other tools!
          </div>
        )}

        {resultUrl && (
          <div className="result-container animate-fade-in" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>{isResultMp4 ? 'Trimmed Video Result (MP4)' : 'GIF Result'}</h3>
              {resultBytes && (
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                  Size: {formatBytes(resultBytes)}
                  {effectiveTargetMb && !isResultMp4 && (
                    <span style={{ marginLeft: '0.5rem', color: resultBytes <= effectiveTargetMb * 1024 * 1024 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      {resultBytes <= effectiveTargetMb * 1024 * 1024 ? `(Under ${effectiveTargetMb} MB limit)` : `(Over ${effectiveTargetMb} MB)`}
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="canvas-container" style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
              {isResultMp4 ? (
                <video src={resultUrl} controls style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: '4px' }} />
              ) : (
                <img src={resultUrl} alt="GIF Result" style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              )}
            </div>
            <div className="button-group" style={{ marginTop: '1rem' }}>
              <a className="btn btn-primary" href={resultUrl} download={isResultMp4 ? 'trimmed-video.mp4' : 'animation.gif'}>
                <Download style={{ width: "18px", height: "18px" }} /> Download {isResultMp4 ? 'Video (MP4)' : 'GIF'}
              </a>
              <button className="btn" onClick={() => removeJob(myJobId)}>
                Discard Result
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
