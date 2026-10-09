import { 
  XMarkIcon, 
  EyeIcon, 
  CommandLineIcon, 
  ArrowDownTrayIcon as Download 
} from '@heroicons/react/24/solid';

export default function AssetPreviewModal({
  asset,
  onClose,
  onOpenInSvgConverter,
  onDownload
}) {
  if (!asset) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#0b0f19', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
        <button 
          type="button"
          onClick={onClose}
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <XMarkIcon style={{ width: 20, height: 20 }} />
        </button>

        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <EyeIcon style={{ width: 20, height: 20, color: 'var(--accent-color)' }} />
          High-Res Asset Preview: {asset.name}
        </h3>

        {/* High-Res Preview Box */}
        <div style={{ 
          width: '100%', 
          height: '340px', 
          background: 'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%) #090d16',
          backgroundSize: '20px 20px',
          borderRadius: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '1.5rem',
          overflow: 'hidden'
        }}>
          {asset.type === 'svg' ? (
            asset.rawSvg ? (
              <div dangerouslySetInnerHTML={{ __html: asset.rawSvg }} style={{ width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }} />
            ) : (
              <img src={asset.url} alt={asset.name} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
            )
          ) : asset.type === 'video' ? (
            <video src={asset.url} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '6px' }} />
          ) : (
            <img src={asset.url} alt={asset.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Source: {asset.source}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {asset.type === 'svg' && (
              <button 
                type="button"
                className="btn btn-primary" 
                onClick={() => { onClose(); onOpenInSvgConverter(asset); }}
              >
                <CommandLineIcon style={{ width: 16, height: 16 }} /> Open in SVG Converter
              </button>
            )}
            <button 
              type="button"
              className="btn" 
              onClick={() => onDownload(asset)}
            >
              <Download style={{ width: 16, height: 16 }} /> Download Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
