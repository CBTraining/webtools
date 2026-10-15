import {
  TrashIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';
import { formatBytes } from '../../utils/formatters';
import { formatItemDateAndTime } from './historyUtils';
import SendToDropdown from '../../components/SendToDropdown';

export default function HistoryItemCard({
  item,
  copiedId,
  onDownload,
  onCopy,
  onDelete
}) {
  const { dateStr, timeStr } = formatItemDateAndTime(item.timestamp);
  const isImage =
    (item.mimeType && item.mimeType.startsWith('image/')) ||
    ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'BMP', 'AVIF'].includes(item.formatBadge);
  const isVideo =
    (item.mimeType && item.mimeType.startsWith('video/')) ||
    ['MP4', 'MOV', 'WEBM', 'AVI'].includes(item.formatBadge);
  const isSvg =
    item.mimeType === 'image/svg+xml' || item.formatBadge === 'SVG';

  const fileObject =
    item.blob instanceof File
      ? item.blob
      : item.blob instanceof Blob
      ? new File([item.blob], item.filename || 'file', {
          type: item.mimeType || item.blob.type
        })
      : null;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '0.9rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.75rem',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Thumbnail / Media Preview */}
      <div
        style={{
          position: 'relative',
          height: '165px',
          borderRadius: 'var(--border-radius-sm)',
          overflow: 'hidden',
          background: isImage
            ? 'repeating-conic-gradient(rgba(128,128,128,0.12) 0% 25%, transparent 0% 50%) 50% / 16px 16px, var(--bg-tertiary)'
            : 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-color)'
        }}
      >
        {isImage && item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt={item.filename}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        ) : isVideo && item.previewUrl ? (
          <video
            src={item.previewUrl}
            controls
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              background: '#000'
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-secondary)'
            }}
          >
            {isVideo ? (
              <FilmIcon style={{ width: 40, height: 40, color: 'var(--accent-color)' }} />
            ) : isImage ? (
              <PhotoIcon style={{ width: 40, height: 40, color: 'var(--accent-color)' }} />
            ) : (
              <DocumentTextIcon style={{ width: 40, height: 40, color: 'var(--accent-color)' }} />
            )}
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {item.formatBadge || 'FILE'}
            </span>
          </div>
        )}

        {/* Format Badge Pill in Top-Left */}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(10, 10, 10, 0.78)',
            color: 'var(--accent-color)',
            fontSize: '0.68rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            border: '1px solid rgba(64, 224, 208, 0.35)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {item.formatBadge || 'FILE'}
        </span>

        {/* Delete Single Item Button in Top-Right */}
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(10, 10, 10, 0.72)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Delete this item from history"
        >
          <TrashIcon style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Item Info: What it is, Filename, Date & Time */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--accent-color)',
              background: 'var(--accent-transparent)',
              padding: '0.12rem 0.45rem',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={item.categoryLabel}
          >
            {item.categoryLabel || 'Saved File'}
          </span>
          <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
            {formatBytes(item.size || 0)}
          </span>
        </div>

        <div
          style={{
            fontWeight: 600,
            fontSize: '0.88rem',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={item.filename}
        >
          {item.filename}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '0.1rem'
          }}
        >
          <span>{dateStr}</span>
          <span style={{ fontWeight: 500 }}>{timeStr}</span>
        </div>
      </div>

      {/* Item Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onDownload(item)}
          style={{
            flex: 1,
            padding: '0.4rem 0.65rem',
            fontSize: '0.8rem',
            justifyContent: 'center'
          }}
          title={`Download ${item.filename}`}
        >
          <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
          Download
        </button>

        {isImage && !isSvg && (
          <button
            type="button"
            className="btn"
            onClick={() => onCopy(item)}
            style={{
              padding: '0.4rem 0.6rem',
              fontSize: '0.8rem',
              border: '1px solid var(--border-color)'
            }}
            title="Copy image to clipboard"
          >
            {copiedId === item.id ? (
              <ClipboardDocumentCheckIcon style={{ width: 15, height: 15, color: 'var(--success-color)' }} />
            ) : (
              <ClipboardDocumentIcon style={{ width: 15, height: 15 }} />
            )}
          </button>
        )}

        {(isImage || isVideo) && fileObject && (
          <SendToDropdown
            file={fileObject}
            imageUrl={isImage ? item.previewUrl : undefined}
            videoFile={isVideo ? fileObject : undefined}
            mediaType={isVideo ? 'video' : isSvg ? 'svg' : 'image'}
          />
        )}
      </div>
    </div>
  );
}
