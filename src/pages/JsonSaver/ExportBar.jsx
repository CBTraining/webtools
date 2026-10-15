import {
  ArrowDownTrayIcon as Download,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  FolderOpenIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import { EXPORT_FORMATS, QUICK_EXPORT_EXTS } from './textStudioConstants';

export default function ExportBar({
  fileName,
  onFileNameChange,
  selectedExt,
  onExtChange,
  customExt,
  onCustomExtChange,
  lineEnding,
  onLineEndingChange,
  validateJsonOnSave,
  setValidateJsonOnSave,
  onSave,
  onQuickExportExt,
  onCopy,
  copied,
  onOpenFileClick,
  onClear,
  parsedLottieData,
  onConvertToGifClick
}) {
  const effectiveExt = selectedExt === 'custom'
    ? (customExt.replace(/^\.+/, '') || 'txt')
    : selectedExt;

  const cleanBaseName = (fileName || 'document').replace(/\.[^/.]+$/, '');
  const fullPreviewName = `${cleanBaseName}.${effectiveExt}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'var(--bg-tertiary)',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Top Row: Filename, Format Dropdown, Custom Ext, Line Ending, Primary Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        {/* Filename Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 200px', minWidth: '180px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            File Name:
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
            <input
              type="text"
              className="input-field"
              value={fileName}
              onChange={(e) => onFileNameChange(e.target.value)}
              placeholder="document"
              style={{
                width: '100%',
                padding: '0.42rem 0.65rem',
                paddingRight: '3.5rem',
                fontSize: '0.88rem',
                fontWeight: 500
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '8px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: 'var(--accent-color)',
                background: 'var(--bg-primary)',
                padding: '0.1rem 0.4rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                pointerEvents: 'none'
              }}
            >
              .{effectiveExt}
            </span>
          </div>
        </div>

        {/* Format / Extension Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            Export Format:
          </label>
          <select
            className="input-field"
            value={selectedExt}
            onChange={(e) => onExtChange(e.target.value)}
            style={{ padding: '0.42rem 0.6rem', fontSize: '0.84rem', width: 'auto', minWidth: '215px', fontWeight: 500 }}
          >
            {EXPORT_FORMATS.map(fmt => (
              <option key={fmt.ext} value={fmt.ext}>{fmt.label}</option>
            ))}
          </select>

          {selectedExt === 'custom' && (
            <input
              type="text"
              className="input-field"
              value={customExt}
              onChange={(e) => onCustomExtChange(e.target.value)}
              placeholder=".ext (e.g. vbs, env)"
              style={{ width: '115px', padding: '0.42rem 0.5rem', fontSize: '0.84rem' }}
              title="Enter any custom file extension"
            />
          )}
        </div>

        {/* Line Endings Selector (Important for .bat / .sh) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }} title="Line Ending Format (CRLF is recommended for Windows .bat/.txt; LF for Unix .sh)">
            EOL:
          </label>
          <select
            className="input-field"
            value={lineEnding}
            onChange={(e) => onLineEndingChange(e.target.value)}
            style={{ padding: '0.38rem 0.45rem', fontSize: '0.78rem', width: 'auto' }}
            title="Line Ending Format"
          >
            <option value="CRLF">CRLF (Windows \r\n)</option>
            <option value="LF">LF (Unix/Mac \n)</option>
          </select>
        </div>

        {/* JSON Validation Checkbox when .json is selected */}
        {effectiveExt === 'json' && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            title="Verify JSON syntax before downloading"
          >
            <input
              type="checkbox"
              checked={validateJsonOnSave}
              onChange={(e) => setValidateJsonOnSave(e.target.checked)}
              style={{ width: 14, height: 14 }}
            />
            Validate JSON
          </label>
        )}

        {/* Primary Download Button */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          style={{
            padding: '0.48rem 1.1rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            marginLeft: 'auto',
            whiteSpace: 'nowrap'
          }}
          title="Save / Export File (Ctrl+S)"
        >
          <Download style={{ width: 18, height: 18 }} />
          Download {fullPreviewName}
        </button>
      </div>

      {/* Bottom Row: Quick 1-Click Format Pills + Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-color)'
        }}
      >
        {/* Quick Format Selector & Instant Export Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.15rem' }}>
            Quick Export As:
          </span>
          {QUICK_EXPORT_EXTS.map(ext => {
            const isSelected = selectedExt === ext;
            return (
              <button
                key={ext}
                type="button"
                className={`btn ${isSelected ? 'btn-primary' : ''}`}
                onClick={() => onQuickExportExt(ext)}
                style={{
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.75rem',
                  borderRadius: '5px',
                  background: isSelected ? undefined : 'var(--bg-primary)',
                  border: isSelected ? undefined : '1px solid var(--border-color)',
                  fontFamily: 'monospace'
                }}
                title={`Switch format to .${ext} (Double-click to immediately download as .${ext})`}
                onDoubleClick={() => onQuickExportExt(ext, true)}
              >
                .{ext}
              </button>
            );
          })}
        </div>

        {/* Secondary Actions: Open File, Copy, Clear, Convert Lottie */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn"
            onClick={onOpenFileClick}
            style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            title="Open a local text, JSON, batch, or script file"
          >
            <FolderOpenIcon style={{ width: 15, height: 15, color: 'var(--accent-color)' }} />
            Open File...
          </button>

          <button
            type="button"
            className="btn"
            onClick={onCopy}
            style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            title="Copy document content to clipboard"
          >
            {copied ? (
              <>
                <ClipboardDocumentCheckIcon style={{ width: 15, height: 15, color: 'var(--success-color)' }} />
                Copied!
              </>
            ) : (
              <>
                <ClipboardDocumentIcon style={{ width: 15, height: 15 }} />
                Copy Text
              </>
            )}
          </button>

          <button
            type="button"
            className="btn"
            onClick={onClear}
            style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--danger-color)' }}
            title="Clear current document content"
          >
            <TrashIcon style={{ width: 14, height: 14 }} />
            Clear
          </button>

          {parsedLottieData && (
            <button
              type="button"
              className="btn"
              onClick={onConvertToGifClick}
              style={{
                padding: '0.28rem 0.75rem',
                fontSize: '0.78rem',
                background: 'var(--accent-gradient)',
                color: 'white',
                boxShadow: '0 0 12px var(--accent-glow)'
              }}
            >
              🎬 Convert Lottie to GIF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
