import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon as Download, ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/solid';
import { renderLottieToGif } from '../../utils/lottieGifRenderer';

export default function LottieGifExportCard({ parsedLottieData }) {
  const [gifJob, setGifJob] = useState({ status: 'idle', progress: 0, log: '', resultUrl: '', error: '' });

  useEffect(() => {
    return () => {
      if (gifJob.resultUrl) {
        URL.revokeObjectURL(gifJob.resultUrl);
      }
    };
  }, [gifJob.resultUrl]);

  const handleConvertToGif = async () => {
    if (!parsedLottieData || gifJob.status === 'running') return;

    setGifJob({ status: 'running', progress: 0, log: 'Starting conversion...', resultUrl: '', error: '' });

    try {
      const blob = await renderLottieToGif({
        lottieData: parsedLottieData,
        scale: 1,
        quality: 10,
        background: 'transparent',
        onProgress: (progress, log) => {
          setGifJob(prev => ({ ...prev, progress, log }));
        }
      });

      const rUrl = URL.createObjectURL(blob);
      setGifJob({ status: 'success', progress: 100, log: 'Ready!', resultUrl: rUrl, error: '' });
    } catch (err) {
      console.error(err);
      setGifJob({ status: 'error', progress: 0, log: '', resultUrl: '', error: err?.message || 'Failed to render GIF.' });
    }
  };

  const handleDiscardGif = () => {
    if (gifJob.resultUrl) URL.revokeObjectURL(gifJob.resultUrl);
    setGifJob({ status: 'idle', progress: 0, log: '', resultUrl: '', error: '' });
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Lottie Export Controls</h3>
      <p style={{ margin: 0, fontSize: '0.9rem' }}>Convert this Lottie animation into a high-quality GIF directly from your editor data.</p>
      
      {gifJob.status === 'idle' && (
        <button className="btn btn-primary" onClick={handleConvertToGif} style={{ width: '100%', padding: '1rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, marginRight: 8, display: 'inline-block', verticalAlign: 'middle' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Convert to GIF
        </button>
      )}

      {gifJob.status === 'running' && (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{gifJob.log}</div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${gifJob.progress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.2s ease' }} />
          </div>
        </div>
      )}

      {gifJob.status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
            <AlertCircle style={{ width: 20, height: 20 }} /> Conversion Failed
          </span>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger-color)', textAlign: 'center' }}>{gifJob.error}</p>
          <button className="btn btn-primary" onClick={handleConvertToGif} style={{ width: '100%' }}>
            Retry Conversion
          </button>
        </div>
      )}

      {gifJob.status === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-primary)', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
            <img src={gifJob.resultUrl} alt="Generated GIF" style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }} />
          </div>
          <div className="button-group" style={{ width: '100%', gap: '0.5rem' }}>
            <a href={gifJob.resultUrl} download={`lottie-export-${Date.now()}.gif`} className="btn btn-primary" style={{ flex: 1 }}>
              <Download style={{ width: "18px", height: "18px" }} /> Download GIF
            </a>
            <button className="btn" onClick={handleDiscardGif}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
