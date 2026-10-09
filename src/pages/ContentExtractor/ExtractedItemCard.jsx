import { 
  SpeakerWaveIcon, 
  ArrowDownTrayIcon as DownloadIcon, 
  ClipboardDocumentCheckIcon as CopyIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid, CheckIcon } from '@heroicons/react/24/solid';
import SendToDropdown from '../../components/SendToDropdown';

export default function ExtractedItemCard({
  item,
  isSelected,
  onToggleSelect,
  onCopyToClipboard,
  onDownloadBlob,
  copiedId,
  formatBytes
}) {
  const isGif = item.category === 'gif';
  const isVideo = item.category === 'video';
  const isAudio = item.category === 'audio';
  const isSvg = item.category === 'svg';

  return (
    <div 
      className="glass-panel hover-glow" 
      style={{ 
        padding: '0.75rem', 
        cursor: 'pointer',
        position: 'relative',
        border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.6rem'
      }}
      onClick={() => onToggleSelect(item.id)}
    >
      {/* Selection Checkbox Badge */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        {isSelected ? (
          <CheckSolid style={{ width: 22, height: 22, color: 'var(--accent-color)', background: 'var(--bg-primary)', borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 20, height: 20, border: '2px solid var(--text-muted)', borderRadius: '50%', background: 'rgba(0,0,0,0.4)' }} />
        )}
      </div>

      {/* Format Badge */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: 'bold', 
          background: isGif ? 'rgba(234, 179, 8, 0.9)' : isVideo ? 'rgba(239, 68, 68, 0.9)' : isAudio ? 'rgba(168, 85, 247, 0.9)' : 'rgba(0, 0, 0, 0.75)', 
          color: isGif ? '#000' : '#fff', 
          padding: '0.15rem 0.45rem', 
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {item.ext}
        </span>
      </div>

      {/* Media Preview Box */}
      <div style={{ 
        width: '100%', 
        aspectRatio: '1', 
        background: 'var(--bg-tertiary)', 
        borderRadius: 'var(--border-radius-sm)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {isVideo ? (
          <video 
            src={item.url} 
            controls 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()} 
          />
        ) : isAudio ? (
          <div style={{ textAlign: 'center', padding: '1rem' }} onClick={(e) => e.stopPropagation()}>
            <SpeakerWaveIcon style={{ width: 44, height: 44, color: 'var(--accent-color)', margin: '0 auto 0.5rem auto' }} />
            <audio src={item.url} controls style={{ width: '100%', maxWidth: '180px' }} />
          </div>
        ) : (
          <img 
            src={item.url} 
            alt={item.name} 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            loading="lazy"
          />
        )}
      </div>
      
      {/* File Metadata */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          {item.width > 0 ? `${item.width} × ${item.height} px • ` : ''}{formatBytes(item.size)}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
        {!isVideo && !isAudio && (
          <button 
            type="button"
            className="btn" 
            style={{ flex: 1, padding: '0.35rem', background: 'var(--bg-tertiary)', fontSize: '0.75rem' }}
            onClick={() => onCopyToClipboard(item.blob, item.id)}
            title="Copy to Clipboard"
          >
            {copiedId === item.id ? <CheckIcon style={{ width: 14, height: 14, color: '#10b981' }} /> : <CopyIcon style={{ width: 14, height: 14 }} />}
          </button>
        )}
        
        <button 
          type="button"
          className="btn" 
          style={{ flex: 1, padding: '0.35rem', background: 'var(--bg-tertiary)', fontSize: '0.75rem' }}
          onClick={() => onDownloadBlob(item.blob, item.name)}
          title={`Download ${item.ext.toUpperCase()}`}
        >
          <DownloadIcon style={{ width: 14, height: 14 }} />
        </button>

        <SendToDropdown 
          file={new File([item.blob], item.name, { type: item.blob.type })}
          imageUrl={!isVideo && !isAudio ? item.url : undefined}
          videoFile={isVideo ? new File([item.blob], item.name, { type: item.blob.type }) : undefined}
          mediaType={isVideo ? 'video' : isSvg ? 'svg' : 'image'}
          style={{ padding: '0.35rem', fontSize: '0.75rem' }}
        />
      </div>
    </div>
  );
}
