import { useState, useRef, useEffect } from 'react';
import { XMarkIcon as XMark } from '@heroicons/react/24/solid';
import { playDing } from '../../utils/audio';
import { useProcessing } from '../../contexts/ProcessingContext';
import { probeVideoMetadata, isAviFile } from '../../utils/videoProbe';
import GifSpatialCropper from './GifSpatialCropper';
import { calculateCropPixelBounds, computeAutoBudgetParameters } from './gifCompressionUtils';
import { executeGifConversion, executeMp4Trim } from './videoGifServices';
import VideoSlotControls from './VideoSlotControls';
import VideoSlotResult from './VideoSlotResult';

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
    quality = 100, 
    enableCrop = false, 
    startTime = 0, 
    endTime = 5, 
    fps = '15',
    enableSpatialCrop = false,
    cropRect = { x: 0, y: 0, width: 100, height: 100 },
    cropAspectRatio = 'free',
    targetSizeLimit = '50',
    customTargetMb = 50
  } = slot;

  const isGif = Boolean(
    videoFile && (videoFile.type === 'image/gif' || videoFile.name?.toLowerCase().endsWith('.gif'))
  );

  const [isPlayingLoop, setIsPlayingLoop] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Compute effective target MB
  const effectiveTargetMb = targetSizeLimit === 'none' 
    ? null 
    : (targetSizeLimit === 'custom' ? (Number(customTargetMb) || 50) : Number(targetSizeLimit));

  // Determine crop pixel bounds if spatial crop is enabled (safe access, no ref during render)
  const naturalWidth = slot.videoWidth || 640;
  const naturalHeight = slot.videoHeight || 360;
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

  // Immediately read native GIF dimensions via browser Image decoder so Resolution Scale has exact original size right away
  useEffect(() => {
    if (!isGif || !previewUrl || (slot.videoWidth && slot.videoHeight)) return;
    let active = true;
    const img = new Image();
    img.onload = () => {
      if (active && img.naturalWidth > 0 && img.naturalHeight > 0) {
        updateSlot(TOOL_ID, slot.id, {
          videoWidth: img.naturalWidth,
          videoHeight: img.naturalHeight
        });
      }
    };
    img.src = previewUrl;
    return () => {
      active = false;
    };
  }, [isGif, previewUrl, slot.id, slot.videoWidth, slot.videoHeight, updateSlot]);

  // Initial Probe for FPS, Duration, Dimensions, and AVI MP4 Preview
  useEffect(() => {
    if (isFfmpegLoaded && videoFile && originalFps === null && !slot.isProbing) {
      updateSlot(TOOL_ID, slot.id, { isProbing: true });
      const probe = async () => {
        const metadata = await probeVideoMetadata(createFfmpegInstance, slot.id, videoFile);
        const detectedFps = metadata?.fps;
        const roundedFps = detectedFps ? Math.round(detectedFps) : (isGif ? 15 : 30);
        let newFps = fps;
        if (fps !== 'original' && parseInt(fps) > roundedFps) {
          if (roundedFps >= 15) newFps = '15';
          else newFps = '10';
        }

        const updates = { 
          originalFps: roundedFps, 
          fps: newFps,
          isProbing: false
        };

        if (metadata?.duration) {
          updates.videoDuration = metadata.duration;
          const initialEnd = (endTime === 5 && metadata.duration > 0)
            ? Math.min(metadata.duration, Math.floor(metadata.duration * 10) / 10)
            : Math.min(metadata.duration, endTime);
          updates.endTime = initialEnd;
        }

        if (metadata?.width) updates.videoWidth = metadata.width;
        if (metadata?.height) updates.videoHeight = metadata.height;
        if (metadata?.previewUrl) {
          updates.previewUrl = metadata.previewUrl;
          updates.isTranscodedPreview = true;
        }

        updateSlot(TOOL_ID, slot.id, updates);
      };
      probe();
    }
  }, [isFfmpegLoaded, videoFile, isGif, originalFps, slot.isProbing, slot.id, updateSlot, createFfmpegInstance, fps, endTime]);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      const initialEnd = (endTime === 5 && dur > 0) ? Math.min(dur, Math.floor(dur * 10) / 10) : endTime;
      const updates = {};
      if (dur > 0 && Number.isFinite(dur)) {
        updates.videoDuration = dur;
        updates.endTime = Math.min(dur, initialEnd);
      }
      // Do not overwrite original probed dimensions with a downscaled 720p transcoded preview
      if (!slot.isTranscodedPreview) {
        if (videoRef.current.videoWidth) {
          updates.videoWidth = videoRef.current.videoWidth;
        }
        if (videoRef.current.videoHeight) {
          updates.videoHeight = videoRef.current.videoHeight;
        }
      }
      if (Object.keys(updates).length > 0) {
        updateSlot(TOOL_ID, slot.id, updates);
      }
    }
  };

  const handleGifImageLoad = (e) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      if (slot.videoWidth !== img.naturalWidth || slot.videoHeight !== img.naturalHeight) {
        updateSlot(TOOL_ID, slot.id, {
          videoWidth: img.naturalWidth,
          videoHeight: img.naturalHeight
        });
      }
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

    try {
      const { blob, bytes } = await executeGifConversion({
        createFfmpegInstance,
        slotId: slot.id,
        videoFile,
        budgetParams,
        startTime,
        endTime,
        enableCrop,
        cropBounds,
        effectiveTargetMb,
        onLog: (msg) => updateJob(myJobId, { log: msg }),
        onProgress: (pct) => updateJob(myJobId, { progress: pct })
      });

      const rUrl = URL.createObjectURL(blob);
      updateJob(myJobId, { 
        status: 'success', 
        resultUrl: rUrl, 
        isMp4: false, 
        resultBytes: bytes,
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
    }
  };

  // Export Trimmed Video (MP4) with Spatial Crop
  const processTrimmedVideo = async () => {
    if (!videoFile || !isFfmpegLoaded || isProcessing) return;
    
    addJob({ id: myJobId, title: 'Trimming & Exporting MP4 Video', type: 'video-trim' });

    try {
      const { blob, bytes } = await executeMp4Trim({
        createFfmpegInstance,
        slotId: slot.id,
        videoFile,
        startTime,
        endTime,
        enableCrop,
        cropBounds,
        onLog: (msg) => updateJob(myJobId, { log: msg }),
        onProgress: (pct) => updateJob(myJobId, { progress: pct })
      });

      const rUrl = URL.createObjectURL(blob);
      updateJob(myJobId, { 
        status: 'success', 
        resultUrl: rUrl, 
        isMp4: true, 
        resultBytes: bytes,
        downloadName: `trimmed-${Date.now()}.mp4` 
      });
      playDing();
    } catch (err) {
      console.error(err);
      updateJob(myJobId, { status: 'error', error: err.message });
    }
  };

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
        
        {/* Video / GIF Preview Container with Spatial Cropper Overlay */}
        <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', background: '#000' }}>
          {isGif && !slot.isTranscodedPreview ? (
            <img
              src={previewUrl}
              alt={videoFile?.name || 'GIF Preview'}
              onLoad={handleGifImageLoad}
              style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <video 
              ref={videoRef}
              src={previewUrl} 
              controls 
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block' }} 
            />
          )}

          {slot.isProbing && isAviFile(videoFile) && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(4px)',
              zIndex: 15,
              gap: '0.75rem',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div className="loader" style={{ width: '32px', height: '32px', borderTopColor: 'var(--accent-color)' }} />
              <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
                Decoding AVI Video...
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '320px' }}>
                Preparing video preview for timeline trimming, spatial cropping, and conversion.
              </div>
            </div>
          )}

          {enableSpatialCrop && (
            <GifSpatialCropper
              videoRef={videoRef}
              naturalWidth={naturalWidth}
              naturalHeight={naturalHeight}
              cropRect={cropRect}
              onChangeCrop={(newRect) => updateSlot(TOOL_ID, slot.id, { cropRect: newRect })}
              aspectRatio={cropAspectRatio}
              onChangeAspectRatio={(newRatio) => updateSlot(TOOL_ID, slot.id, { cropAspectRatio: newRatio })}
            />
          )}
        </div>
        
        {!isProcessing && !resultUrl && (
          <VideoSlotControls 
            slot={slot}
            onUpdate={(updates) => updateSlot(TOOL_ID, slot.id, updates)}
            effectiveTargetMb={effectiveTargetMb}
            budgetParams={budgetParams}
            estimatedBytes={estimatedBytes}
            cropBounds={cropBounds}
            seekToTime={seekToTime}
            isPlayingLoop={isPlayingLoop}
            toggleLoopPlay={toggleLoopPlay}
            isFfmpegLoaded={isFfmpegLoaded}
            onProcessVideo={processVideo}
            onProcessTrimmedVideo={processTrimmedVideo}
          />
        )}

        {isProcessing && (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Processing in background... You can safely navigate to other tools!
          </div>
        )}

        {resultUrl && (
          <VideoSlotResult 
            resultUrl={resultUrl}
            downloadName={myJob?.downloadName}
            isResultMp4={isResultMp4}
            resultBytes={resultBytes}
            effectiveTargetMb={effectiveTargetMb}
            onDiscard={() => removeJob(myJobId)}
          />
        )}
      </div>
    </div>
  );
}
