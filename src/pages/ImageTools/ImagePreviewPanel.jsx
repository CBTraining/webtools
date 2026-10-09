import { 
  EyeIcon, 
  ArrowDownTrayIcon as Download, 
  ClipboardDocumentIcon, 
  CheckIcon 
} from '@heroicons/react/24/solid';
import SendToDropdown from '../../components/SendToDropdown';

export default function ImagePreviewPanel({
  rotation,
  width,
  height,
  showOriginal,
  setShowOriginal,
  onCanvasClick,
  radialBlur,
  imageSrc,
  canvasRef,
  onDownload,
  onCopy,
  copySuccess,
  imageFile
}) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Top Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Resolution: <strong style={{ color: 'var(--text-primary)' }}>{rotation === 90 || rotation === 270 ? height : width} × {rotation === 90 || rotation === 270 ? width : height} px</strong>
        </div>

        {/* Hold to View Original */}
        <button
          type="button"
          className="btn"
          onMouseDown={() => setShowOriginal(true)}
          onMouseUp={() => setShowOriginal(false)}
          onTouchStart={() => setShowOriginal(true)}
          onTouchEnd={() => setShowOriginal(false)}
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.75rem',
            background: showOriginal ? 'var(--accent-color)' : 'var(--bg-tertiary)',
            gap: '0.35rem'
          }}
          title="Press and hold to compare with original image"
        >
          <EyeIcon style={{ width: 14, height: 14 }} />
          {showOriginal ? 'Showing Original' : 'Hold to View Original'}
        </button>
      </div>

      {/* Direct Canvas Preview Container */}
      <div 
        className="checkerboard-bg"
        onClick={onCanvasClick}
        style={{
          borderRadius: 'var(--border-radius-sm)',
          overflow: 'hidden',
          maxHeight: '62vh',
          minHeight: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          border: '1px solid var(--border-color)',
          position: 'relative',
          cursor: radialBlur > 0 ? 'crosshair' : 'default'
        }}
        title={radialBlur > 0 ? "Click anywhere to reposition radial blur focal point" : ""}
      >
        {showOriginal && (
          <img 
            src={imageSrc} 
            alt="Original Source" 
            style={{ maxWidth: '100%', maxHeight: '58vh', objectFit: 'contain' }} 
          />
        )}

        {/* Visible Live Working Canvas */}
        <canvas 
          ref={canvasRef} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '58vh', 
            objectFit: 'contain',
            display: showOriginal ? 'none' : 'block'
          }} 
        />
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          type="button"
          className="btn btn-primary" 
          onClick={() => onDownload('png')}
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
        >
          <Download style={{ width: 16, height: 16 }} /> Download PNG
        </button>
        <button 
          type="button"
          className="btn" 
          onClick={() => onDownload('jpeg')}
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
        >
          <Download style={{ width: 16, height: 16 }} /> Download JPG
        </button>
        <button 
          type="button"
          className="btn" 
          onClick={() => onDownload('webp')}
          style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
        >
          <Download style={{ width: 16, height: 16 }} /> Download WEBP
        </button>
        <button 
          type="button"
          className="btn" 
          onClick={onCopy}
          style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
        >
          {copySuccess ? <CheckIcon style={{ width: 16, height: 16, color: '#10b981' }} /> : <ClipboardDocumentIcon style={{ width: 16, height: 16 }} />}
          {copySuccess ? 'Copied!' : 'Copy'}
        </button>

        <SendToDropdown 
          imageUrl={() => canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined} 
          file={imageFile} 
          mediaType="image" 
        />
      </div>

    </div>
  );
}
