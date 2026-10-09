import { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon as Download, 
  XMarkIcon as XMark 
} from '@heroicons/react/24/solid';
import { fetchFile } from '@ffmpeg/util';
import { playDing } from '../../utils/audio';
import { useProcessing } from '../../contexts/ProcessingContext';
import { formatBytes } from '../../utils/formatters';
import { probeVideoFps } from '../../utils/videoProbe';

const TOOL_ID = 'video-compress';

export default function VideoCompressorSlot({ slot }) {
  const { jobs, addJob, updateJob, removeJob, isFfmpegLoaded, updateSlot, removeSlot, createFfmpegInstance } = useProcessing();

  const myJobId = slot.id; // Job ID is exactly the slot ID!
  const myJob = jobs.find(j => j.id === myJobId);
  const isProcessing = myJob?.status === 'running';
  const resultUrl = myJob?.resultUrl;

  const { videoFile, previewUrl, originalFps, quality, preset, fps } = slot;

  // Estimation Logic
  const estimatedCrf = 38 - Math.round(((quality - 1) / 99) * 20);
  let estimatedSizeFactor = 0.1 + ((quality - 1) / 99) * 0.8;
  
  const presetMultipliers = {
    ultrafast: 1.8, superfast: 1.4, veryfast: 1.2,
    faster: 1.1, fast: 1.0, medium: 0.9, slow: 0.7
  };
  estimatedSizeFactor *= presetMultipliers[preset];
  
  if (fps !== 'original' && originalFps) {
    const targetFps = parseInt(fps);
    if (targetFps < originalFps) {
      estimatedSizeFactor *= (targetFps / originalFps);
    }
  }

  const estimatedSize = videoFile ? videoFile.size * estimatedSizeFactor : 0;

  // Initial Probe (runs once when slot is added if it hasn't been probed yet)
  useEffect(() => {
    if (isFfmpegLoaded && videoFile && originalFps === null && !slot.isProbing) {
      updateSlot(TOOL_ID, slot.id, { isProbing: true });
      const probe = async () => {
        const detectedFps = await probeVideoFps(createFfmpegInstance, slot.id, videoFile);
        updateSlot(TOOL_ID, slot.id, { originalFps: detectedFps ? Math.round(detectedFps) : 30 });
      };
      probe();
    }
  }, [isFfmpegLoaded, videoFile, originalFps, slot.isProbing, slot.id, updateSlot, createFfmpegInstance]);

  const processVideo = async () => {
    if (!videoFile || !isFfmpegLoaded || isProcessing) return;
    
    addJob({ id: myJobId, title: 'Compressing Video', type: 'video-compress' });

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

      const ext = videoFile.name.split('.').pop() || 'mp4';
      const inputName = `input_${slot.id}.${ext}`;
      
      // Write file to memory
      await localFfmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Compress Video
      let args = [
        '-y', 
        '-i', inputName, 
        '-vcodec', 'libx264', 
        '-crf', estimatedCrf.toString(), 
        '-preset', preset
      ];

      // Enforce FPS limit
      if (fps !== 'original') {
        let targetFps = parseInt(fps);
        if (originalFps && targetFps > originalFps) {
          targetFps = originalFps;
        }
        args.push('-r', targetFps.toString());
      }

      const outputName = `output_${slot.id}.mp4`;
      args.push(outputName);

      const execResult = await localFfmpeg.exec(args);
      
      if (execResult !== 0) {
        throw new Error(`FFmpeg exited with code ${execResult}. Last logs:\n${fullLog.substring(fullLog.length - 400)}`);
      }

      const data = await localFfmpeg.readFile(outputName);
      if (data.length === 0) throw new Error("Generated video is 0 bytes");

      const blob = new Blob([data], { type: 'video/mp4' });
      const rUrl = URL.createObjectURL(blob);
      updateJob(myJobId, { status: 'success', resultUrl: rUrl, downloadName: `compressed_${videoFile.name}` });
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
      
      <video src={previewUrl} controls style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 'var(--border-radius-sm)', background: '#000', marginBottom: '1rem' }} />
      
      {!isProcessing && !resultUrl && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Quality</span>
              <span style={{ color: 'var(--accent-color)' }}>{quality}%</span>
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

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Compression Speed</label>
              <select 
                value={preset} 
                onChange={(e) => updateSlot(TOOL_ID, slot.id, { preset: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
              >
                <option value="ultrafast">Ultrafast (Largest File, Fastest)</option>
                <option value="superfast">Superfast</option>
                <option value="veryfast">Veryfast</option>
                <option value="faster">Faster</option>
                <option value="fast">Fast (Recommended)</option>
                <option value="medium">Medium</option>
                <option value="slow">Slow (Smallest File, Slowest)</option>
              </select>
            </div>

            <div className="input-group" style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Framerate (FPS)</label>
              <select 
                value={fps} 
                onChange={(e) => updateSlot(TOOL_ID, slot.id, { fps: e.target.value })}
                style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
              >
                <option value="original">Original{originalFps ? ` (${originalFps}fps)` : ''}</option>
                {(!originalFps || originalFps >= 60) && <option value="60">60 FPS</option>}
                {(!originalFps || originalFps >= 30) && <option value="30">30 FPS</option>}
                {(!originalFps || originalFps >= 24) && <option value="24">24 FPS</option>}
                {(!originalFps || originalFps >= 15) && <option value="15">15 FPS</option>}
                {(!originalFps || originalFps >= 10) && <option value="10">10 FPS</option>}
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Original Size:</span>
              <span style={{ fontWeight: 'bold' }}>{formatBytes(videoFile.size)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Size:</span>
              <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>~{formatBytes(estimatedSize)}</span>
            </div>
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={processVideo} disabled={!isFfmpegLoaded}>
              Compress Video
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
        <div className="result-container animate-fade-in" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)' }}>
          <h3 style={{ marginTop: 0 }}>Compressed Video</h3>
          <video src={resultUrl} controls style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain', borderRadius: 'var(--border-radius-sm)', background: '#000', marginBottom: '1rem' }} />
          <div className="button-group" style={{ marginTop: '1rem' }}>
            <a href={resultUrl} download={`compressed_${videoFile.name}`} className="btn btn-primary">
              <Download style={{ width: 20, height: 20 }} /> Download
            </a>
            <button className="btn" onClick={() => removeJob(myJobId)}>
              Discard Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
