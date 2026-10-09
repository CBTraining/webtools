import { ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/solid';

export default function QrPreview({
  qrRef,
  errorCorrection,
  rawLogoUrl,
  onDownload,
  onCopy,
  isCopied
}) {
  return (
    <div className="glass-panel preview" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ width: '100%', textAlign: 'left', marginTop: 0 }}>Live Preview</h3>
      
      <div 
        className="qr-preview-container" 
        style={{ 
          marginTop: '1rem', 
          background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%) #090d16',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          padding: '1.5rem', 
          borderRadius: 'var(--border-radius)', 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        <div ref={qrRef} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', maxWidth: '100%' }}></div>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Error Correction: <strong style={{ color: '#10b981' }}>{errorCorrection} (30% Recovery)</strong> {rawLogoUrl ? '• Logo Active' : ''}
      </div>
      
      <div className="button-group" style={{ marginTop: '1.5rem', width: '100%', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => onDownload('png')}>
          <ArrowDownTrayIcon style={{ width: 18, height: 18 }} /> Download PNG
        </button>
        <button className="btn" onClick={() => onDownload('svg')}>
          <ArrowDownTrayIcon style={{ width: 18, height: 18 }} /> Download SVG
        </button>
        <button className="btn" onClick={onCopy}>
          {isCopied ? <CheckIcon style={{ width: 18, height: 18, color: '#10b981' }} /> : <ClipboardDocumentIcon style={{ width: 18, height: 18 }} />}
          {isCopied ? 'Copied!' : 'Copy PNG'}
        </button>
      </div>
    </div>
  );
}
