import { ArrowDownTrayIcon as Download } from '@heroicons/react/24/solid';
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
        gap: '0.55rem',
        background: 'var(--bg-tertiary)',
        padding: '0.65rem 0.8rem',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Row 1: Single-line Export Controls (Filename + Format + EOL + Download Button) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {/* Filename Input with inline .ext badge */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 150px', minWidth: '140px' }}>
          <input
            type="text"
            className="input-field"
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            placeholder="filename"
            title="Document File Name"
            style={{
              width: '100%',
              padding: '0.38rem 0.6rem',
              paddingRight: '3.2rem',
              fontSize: '0.84rem',
              fontWeight: 500
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '7px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--accent-color)',
              background: 'var(--bg-primary)',
              padding: '0.08rem 0.35rem',
              borderRadius: '4px',
              border: '1px solid var(--border-color)',
              pointerEvents: 'none'
            }}
          >
            .{effectiveExt}
          </span>
        </div>

        {/* Format Dropdown */}
        <select
          className="input-field"
          value={selectedExt}
          onChange={(e) => onExtChange(e.target.value)}
          title="Export File Format"
          style={{ padding: '0.38rem 0.5rem', fontSize: '0.82rem', width: '190px', fontWeight: 500 }}
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
            placeholder=".ext"
            style={{ width: '76px', padding: '0.38rem 0.45rem', fontSize: '0.82rem' }}
            title="Custom file extension (e.g. vbs, env, toml)"
          />
        )}

        {/* Compact Line Ending Selector */}
        <select
          className="input-field"
          value={lineEnding}
          onChange={(e) => onLineEndingChange(e.target.value)}
          style={{ padding: '0.38rem 0.4rem', fontSize: '0.78rem', width: '84px' }}
          title="Line Endings: CRLF (\r\n) for Windows .bat/.txt, LF (\n) for Unix .sh/.json"
        >
          <option value="CRLF">CRLF</option>
          <option value="LF">LF</option>
        </select>

        {/* Primary Download Button */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSave}
          style={{
            padding: '0.4rem 0.95rem',
            fontSize: '0.84rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title="Save / Export File (Ctrl+S)"
        >
          <Download style={{ width: 16, height: 16 }} />
          Save {fullPreviewName}
        </button>

        {parsedLottieData && (
          <button
            type="button"
            className="btn"
            onClick={onConvertToGifClick}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '0.8rem',
              background: 'var(--accent-gradient)',
              color: 'white',
              whiteSpace: 'nowrap'
            }}
          >
            🎬 Lottie to GIF
          </button>
        )}
      </div>

      {/* Row 2: Quick Format Pills + JSON validation toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginRight: '0.15rem' }}>
            Quick Format:
          </span>
          {QUICK_EXPORT_EXTS.map(ext => {
            const isSelected = selectedExt === ext;
            return (
              <button
                key={ext}
                type="button"
                className={`btn ${isSelected ? 'btn-primary' : ''}`}
                onClick={() => onQuickExportExt(ext)}
                onDoubleClick={() => onQuickExportExt(ext, true)}
                style={{
                  padding: '0.15rem 0.48rem',
                  fontSize: '0.73rem',
                  borderRadius: '5px',
                  background: isSelected ? undefined : 'var(--bg-primary)',
                  border: isSelected ? undefined : '1px solid var(--border-color)',
                  fontFamily: 'monospace'
                }}
                title={`Click to select .${ext} • Double-click to immediately download`}
              >
                .{ext}
              </button>
            );
          })}
        </div>

        {effectiveExt === 'json' ? (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.74rem',
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
              style={{ width: 13, height: 13 }}
            />
            Validate JSON
          </label>
        ) : (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.75 }}>
            Tip: Ctrl+S to save • Double-click a format pill for instant download
          </span>
        )}
      </div>
    </div>
  );
}
