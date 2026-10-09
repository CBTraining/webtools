import { 
  ArrowDownTrayIcon as Download, 
  CommandLineIcon, 
  ClipboardDocumentIcon, 
  CheckIcon 
} from '@heroicons/react/24/solid';
import SendToDropdown from '../../components/SendToDropdown';

export default function AssetCard({
  asset,
  index,
  onPreview,
  onDownload,
  onOpenInSvgConverter,
  onCopy,
  copiedIndex
}) {
  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '0.85rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.75rem', 
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        position: 'relative'
      }}
    >
      {/* Media Preview Box with Checkerboard Background */}
      <div 
        onClick={() => onPreview(asset)}
        style={{ 
          height: '140px', 
          background: asset.type === 'svg' 
            ? 'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%) #080c16'
            : '#090d16',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          borderRadius: '6px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.05)',
          padding: '8px'
        }}
        title="Click to expand high-res preview"
      >
        {asset.type === 'svg' ? (
          asset.rawSvg ? (
            <div 
              dangerouslySetInnerHTML={{ __html: asset.rawSvg }} 
              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }} 
            />
          ) : (
            <img 
              src={asset.url} 
              alt={asset.name} 
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )
        ) : asset.type === 'video' ? (
          <video 
            src={asset.url} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            muted 
            loop 
            onMouseOver={e => e.target.play()} 
            onMouseOut={e => e.target.pause()} 
          />
        ) : (
          <img 
            src={asset.url} 
            alt={asset.name} 
            style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        )}

        <span style={{ 
          position: 'absolute', 
          top: '6px', 
          left: '6px', 
          background: 'rgba(0,0,0,0.75)', 
          color: 'var(--accent-color)', 
          fontSize: '0.65rem', 
          padding: '0.15rem 0.4rem', 
          borderRadius: '4px', 
          textTransform: 'uppercase', 
          fontWeight: 'bold' 
        }}>
          {asset.type}
        </span>
      </div>

      {/* Info Text */}
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={asset.name}>
          {asset.name}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          {asset.source}
        </div>
      </div>

      {/* Interactive Action Buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', flexWrap: 'wrap' }}>
        {/* Download Button */}
        <button 
          type="button"
          className="btn" 
          onClick={() => onDownload(asset)}
          style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
          title="Download Asset"
        >
          <Download style={{ width: 14, height: 14 }} /> Download
        </button>

        {/* Direct Bridge to SVG Converter */}
        {asset.type === 'svg' && (
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => onOpenInSvgConverter(asset)}
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Convert, recolor, tint, or resize this SVG vector!"
          >
            <CommandLineIcon style={{ width: 14, height: 14 }} /> Convert SVG
          </button>
        )}

        {/* Copy Code / URL */}
        <button 
          type="button"
          className="btn" 
          onClick={() => onCopy(asset.rawSvg || asset.url, index)}
          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
          title="Copy Code or URL"
        >
          {copiedIndex === index ? <CheckIcon style={{ width: 14, height: 14, color: '#10b981' }} /> : <ClipboardDocumentIcon style={{ width: 14, height: 14 }} />}
        </button>

        <SendToDropdown 
          svgText={asset.rawSvg} 
          imageUrl={asset.type === 'svg' ? undefined : asset.url} 
          mediaType={asset.type === 'svg' ? 'svg' : asset.type === 'video' ? 'video' : 'image'} 
        />
      </div>
    </div>
  );
}
