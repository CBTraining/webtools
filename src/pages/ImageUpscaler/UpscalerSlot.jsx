import { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon as XMark } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon as Download } from '@heroicons/react/24/outline';
import SendToDropdown from '../../components/SendToDropdown';
import { useProcessing } from '../../contexts/ProcessingContext';

const TOOL_ID = 'ai-upscaler';

const MODEL_OPTIONS = [
  {
    key: 'realworld',
    label: 'Real-World HD (BSRGAN)',
    badge: 'Recommended',
    description: 'Removes JPEG blockiness, sensor noise & blur while upscaling real photos and web images.'
  },
  {
    key: 'lightweight',
    label: 'Fast Lightweight',
    badge: 'Fastest (7.7 MB)',
    description: 'Compact 2x Swin2SR model for fast upscaling on CPU or GPU.'
  },
  {
    key: 'compressed',
    label: 'Compressed Web Restore',
    badge: 'De-artifact',
    description: 'Specialized in recovering heavily compressed JPEGs and screenshots.'
  },
  {
    key: 'classical',
    label: 'Classical Clean',
    badge: 'Sharp',
    description: 'Standard super-resolution for uncompressed digital art, UI assets & icons.'
  }
];

const TILE_SIZE = 192;
const TILE_OVERLAP = 16;

function estimateTileCount(width, height) {
  if (!width || !height) return 1;
  const countAxis = (len) => {
    if (len <= TILE_SIZE) return 1;
    const stride = TILE_SIZE - TILE_OVERLAP;
    return Math.ceil((len - TILE_OVERLAP) / stride);
  };
  return countAxis(width) * countAxis(height);
}

export default function UpscalerSlot({ slot }) {
  const { jobs, addJob, updateJob, removeJob, updateSlot, removeSlot } = useProcessing();
  const workerRef = useRef(null);
  const activeSettingsRef = useRef({ modelKey: 'realworld', targetScale: 2 });

  const myJobId = slot.id;
  const myJob = jobs.find(j => j.id === myJobId);
  const isProcessing = myJob?.status === 'running';
  const resultUrl = myJob?.resultUrl;

  const { imageFile, previewUrl } = slot;
  const modelKey = slot.modelKey || 'realworld';
  const targetScale = slot.targetScale || 2;

  const [resolution, setResolution] = useState(null);

  useEffect(() => {
    activeSettingsRef.current = { modelKey, targetScale };
  }, [modelKey, targetScale]);

  useEffect(() => {
    if (previewUrl && !resolution) {
      const img = new Image();
      img.onload = () => {
        setResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = previewUrl;
    }
  }, [previewUrl, resolution]);

  const initWorker = useCallback(function setupWorker() {
    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker(new URL('../../workers/upscalerWorker.js', import.meta.url), {
      type: 'module'
    });

    worker.onerror = (err) => {
      console.error('Worker initialization or runtime error:', err);
      updateJob(myJobId, { status: 'error', error: 'Worker crashed: ' + err.message });
    };

    worker.onmessage = (event) => {
      const { jobId, status, progress, progressData, log, resultBlob, outputResolution, error } = event.data;
      if (jobId !== myJobId) return;

      if (status === 'init') {
        updateJob(myJobId, { log, progress: progress ?? 2 });
      } else if (status === 'progress') {
        if (progressData && progressData.status === 'downloading') {
          const dlPct = Math.round(progressData.progress || 0);
          updateJob(myJobId, {
            progress: Math.max(2, Math.round(dlPct * 0.15)),
            log: `Downloading AI Model (${progressData.file || 'weights'}): ${dlPct}%`
          });
        }
      } else if (status === 'processing') {
        updateJob(myJobId, { log, ...(typeof progress === 'number' ? { progress } : {}) });
      } else if (status === 'success') {
        const nextResultUrl = URL.createObjectURL(resultBlob);
        const scaleUsed = activeSettingsRef.current.targetScale;
        updateJob(myJobId, {
          status: 'success',
          progress: 100,
          resultUrl: nextResultUrl,
          outputResolution,
          downloadName: `upscaled-${scaleUsed}x-${Date.now()}.png`
        });
      } else if (status === 'error') {
        updateJob(myJobId, { status: 'error', error });
      } else if (status === 'webgpu_error') {
        updateJob(myJobId, {
          log: 'Hardware acceleration unavailable, retrying on CPU (WASM)...',
          progress: 5
        });
        setupWorker();
        workerRef.current.postMessage({
          jobId: myJobId,
          imageBlobUrl: previewUrl,
          modelKey: activeSettingsRef.current.modelKey,
          targetScale: activeSettingsRef.current.targetScale,
          useWasm: true
        });
      }
    };

    workerRef.current = worker;
  }, [myJobId, previewUrl, updateJob]);

  useEffect(() => {
    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initWorker]);

  const processImage = async () => {
    if (!imageFile || isProcessing) return;

    if (resolution) {
      const outMaxSide = Math.max(resolution.width, resolution.height) * targetScale;
      if (outMaxSide > 12288) {
        alert(`Target output (${resolution.width * targetScale}×${resolution.height * targetScale}px) exceeds the 12,288px browser canvas limit. Try 2x scale or a smaller source image.`);
        return;
      }
    }

    removeJob(myJobId);
    addJob({ id: myJobId, title: `Upscaling Image (${targetScale}x)`, type: 'ai-upscaler' });

    workerRef.current.postMessage({
      jobId: myJobId,
      imageBlobUrl: previewUrl,
      modelKey,
      targetScale
    });
  };

  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => removeSlot(TOOL_ID, slot.id), 200);
  };

  const selectedModelInfo = MODEL_OPTIONS.find(m => m.key === modelKey) || MODEL_OPTIONS[0];
  const tileCount = resolution ? estimateTileCount(resolution.width, resolution.height) : 1;
  const finalWidth = myJob?.outputResolution?.width || (resolution ? resolution.width * targetScale : null);
  const finalHeight = myJob?.outputResolution?.height || (resolution ? resolution.height * targetScale : null);

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
        <div style={{ position: 'relative', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img
            src={previewUrl}
            alt="Original"
            style={{
              maxWidth: '100%',
              width: '100%',
              minHeight: '150px',
              maxHeight: '50vh',
              objectFit: 'contain',
              borderRadius: 'var(--border-radius-sm)',
              display: 'block',
              margin: '0 auto',
              filter: isProcessing ? 'blur(4px) brightness(0.65)' : 'none'
            }}
          />
          {isProcessing && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              <div className="spinner"></div>
              <div style={{ background: 'rgba(0,0,0,0.75)', padding: '0.6rem 1rem', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center', maxWidth: '90%', width: '280px' }}>
                <div>{myJob?.log || 'Processing...'}</div>
                {typeof myJob?.progress === 'number' && myJob.progress > 0 && (
                  <div style={{ marginTop: '0.5rem', height: '6px', width: '100%', background: 'rgba(255,255,255,0.2)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.max(2, myJob.progress))}%`, background: 'var(--accent-color)', transition: 'width 0.25s ease' }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {!isProcessing && !resultUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {resolution && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', background: 'var(--bg-tertiary)', padding: '0.6rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                <div>Original: <strong>{resolution.width} × {resolution.height}px</strong></div>
                <div style={{ color: 'var(--accent-color)', fontWeight: 'bold', marginTop: '2px' }}>
                  Target ({targetScale}x): {resolution.width * targetScale} × {resolution.height * targetScale}px
                </div>
                {tileCount > 1 && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>
                    Tiled AI mode: {tileCount} overlapping tiles (seamless feather blend)
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AI Model Preset</label>
              <select
                className="select-input"
                value={modelKey}
                onChange={(e) => updateSlot(TOOL_ID, slot.id, { modelKey: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              >
                {MODEL_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} — {opt.badge}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {selectedModelInfo.description}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Upscale Factor</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[2, 4].map(scale => (
                  <button
                    key={scale}
                    type="button"
                    className={`btn ${targetScale === scale ? 'btn-primary' : ''}`}
                    onClick={() => updateSlot(TOOL_ID, slot.id, { targetScale: scale })}
                    style={{ padding: '0.45rem', fontSize: '0.85rem' }}
                  >
                    {scale}x ({resolution ? `${resolution.width * scale}×${resolution.height * scale}` : `${scale}x HD`})
                  </button>
                ))}
              </div>
            </div>

            {myJob?.status === 'error' && (
              <div style={{ color: '#ff4d4f', fontSize: '0.8rem', background: 'rgba(255,77,79,0.1)', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid rgba(255,77,79,0.3)' }}>
                Error: {myJob.error}
              </div>
            )}

            <button className="btn btn-primary" onClick={processImage} style={{ width: '100%' }}>
              Upscale {targetScale}x
            </button>
          </div>
        )}
      </div>

      {resultUrl && (
        <div className="glass-panel preview-panel" style={{ marginTop: '1.5rem', background: 'var(--bg-tertiary)' }}>
          <h3 style={{ marginTop: 0 }}>
            Result ({finalWidth && finalHeight ? `${finalWidth}×${finalHeight}` : `${targetScale}x`})
          </h3>
          <div className="canvas-container">
            <img src={resultUrl} alt="Upscaled" style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>
          <div className="button-group" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <a href={resultUrl} download={`upscaled-${targetScale}x-${imageFile?.name || 'image'}.png`} className="btn btn-primary">
              <Download style={{ width: '18px', height: '18px' }} /> Download HD
            </a>
            <SendToDropdown imageUrl={resultUrl} file={imageFile} mediaType="image" />
            <button className="btn" onClick={() => removeJob(myJobId)}>
              Change Settings / Re-run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

