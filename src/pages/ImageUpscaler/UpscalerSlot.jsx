import { useState, useEffect, useRef } from 'react';
import { XMarkIcon as XMark } from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon as Download } from '@heroicons/react/24/outline';
import SendToDropdown from '../../components/SendToDropdown';
import { useProcessing } from '../../contexts/ProcessingContext';

const TOOL_ID = 'ai-upscaler';

export default function UpscalerSlot({ slot }) {
  const { jobs, addJob, updateJob, removeJob, removeSlot } = useProcessing();
  const workerRef = useRef(null);

  const myJobId = slot.id;
  const myJob = jobs.find(j => j.id === myJobId);
  const isProcessing = myJob?.status === 'running';
  const resultUrl = myJob?.resultUrl;

  const { imageFile, previewUrl } = slot;
  const [resolution, setResolution] = useState(null);

  useEffect(() => {
    if (previewUrl && !resolution) {
      const img = new Image();
      img.onload = () => {
        setResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = previewUrl;
    }
  }, [previewUrl, resolution]);

  const initWorker = () => {
    if (workerRef.current) workerRef.current.terminate();

    const worker = new Worker(new URL('../../workers/upscalerWorker.js', import.meta.url), {
      type: 'module'
    });

    worker.onerror = (err) => {
      console.error('Worker initialization or runtime error:', err);
      updateJob(myJobId, { status: 'error', error: 'Worker crashed: ' + err.message });
    };

    worker.onmessage = (event) => {
      const { jobId, status, progressData, log, resultBlob, error } = event.data;
      if (jobId !== myJobId) return;

      if (status === 'init') {
        updateJob(myJobId, { log });
      } else if (status === 'progress') {
        if (progressData && progressData.status === 'downloading') {
          updateJob(myJobId, { 
            log: `Downloading AI Model (${progressData.file || 'weights'}): ${Math.round(progressData.progress || 0)}%` 
          });
        }
      } else if (status === 'processing') {
        updateJob(myJobId, { log });
      } else if (status === 'success') {
        const resultUrl = URL.createObjectURL(resultBlob);
        updateJob(myJobId, { status: 'success', resultUrl, downloadName: `upscaled-${Date.now()}.png` });
      } else if (status === 'error') {
        updateJob(myJobId, { status: 'error', error });
      } else if (status === 'webgpu_error') {
        updateJob(myJobId, { log: 'Hardware acceleration failed, restarting with CPU... This will be slower.' });
        // Recreate worker to completely clear corrupted memory
        initWorker();
        // Automatically retry with WASM
        workerRef.current.postMessage({
          jobId: myJobId,
          imageBlobUrl: previewUrl,
          useWasm: true
        });
      }
    };

    workerRef.current = worker;
  };

  useEffect(() => {
    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [myJobId, updateJob]);

  const processImage = async () => {
    if (!imageFile || isProcessing) return;
    
    if (resolution && Math.max(resolution.width, resolution.height) > 800) {
      alert("Image is too large for on-device AI upscaling. Please use an image where the longest side is 800 pixels or less.");
      return;
    }
    
    addJob({ id: myJobId, title: 'Upscaling Image', type: 'ai-upscaler' });

    workerRef.current.postMessage({
      jobId: myJobId,
      imageBlobUrl: previewUrl
    });
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
        <div style={{ position: 'relative', minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={previewUrl} alt="Original" style={{ maxWidth: '100%', width: '100%', minHeight: '150px', maxHeight: '50vh', objectFit: 'contain', borderRadius: 'var(--border-radius-sm)', display: 'block', margin: '0 auto', filter: isProcessing ? 'blur(4px) brightness(0.7)' : 'none' }} />
          {isProcessing && (
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div className="spinner"></div>
              <span style={{ background: 'rgba(0,0,0,0.6)', padding: '0.5rem 1rem', borderRadius: '20px', color: 'white', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                {myJob?.log || 'Processing...'}
              </span>
            </div>
          )}
        </div>
        
        {!isProcessing && !resultUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {resolution && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Original: {resolution.width} x {resolution.height}px<br/>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Upscaled: {resolution.width * 2} x {resolution.height * 2}px</span>
              </div>
            )}
            <button className="btn btn-primary" onClick={processImage} style={{ width: '100%' }}>
              Upscale 2x
            </button>
          </div>
        )}
      </div>

      {resultUrl && (
        <div className="glass-panel preview-panel" style={{ marginTop: '1.5rem', background: 'var(--bg-tertiary)' }}>
          <h3 style={{ marginTop: 0 }}>Result ({resolution ? `${resolution.width * 2}x${resolution.height * 2}` : '2x'})</h3>
          <div className="canvas-container">
            <img src={resultUrl} alt="Upscaled" style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
          </div>
          <div className="button-group" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <a href={resultUrl} download={`upscaled-${imageFile?.name || 'image'}.png`} className="btn btn-primary">
              <Download style={{ width: "18px", height: "18px" }} /> Download HD
            </a>
            <SendToDropdown imageUrl={resultUrl} file={imageFile} mediaType="image" />
            <button className="btn" onClick={() => removeJob(myJobId)}>
              Discard Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
