export default function IconControls({
  showIcon,
  setShowIcon,
  iconType,
  setIconType,
  iconSvg,
  setIconSvg,
  iconName,
  setIconName,
  iconFill,
  setIconFill,
  iconSize,
  setIconSize
}) {
  return (
    <div className="control-group" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <input type="checkbox" checked={showIcon} onChange={e => setShowIcon(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
        <label style={{ fontWeight: 'bold' }}>Enable Icon</label>
      </div>
      <div style={{ opacity: showIcon ? 1 : 0.5, pointerEvents: showIcon ? 'auto' : 'none', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label>Icon Type</label>
            <select className="input-field" value={iconType} onChange={e => setIconType(e.target.value)} style={{ padding: '4px 8px', width: 'auto', fontSize: '0.8rem' }}>
              <option value="svg">SVG Code</option>
              <option value="material">Google Font (Material)</option>
            </select>
          </div>
          {iconType === 'svg' ? (
            <textarea className="input-field" value={iconSvg} onChange={e => setIconSvg(e.target.value)} style={{ width: '100%', minHeight: '90px', fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.5rem', borderRadius: '8px' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input type="text" className="input-field" placeholder="e.g. star, home" value={iconName} onChange={e => setIconName(e.target.value)} style={{ width: '100%' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={iconFill} onChange={e => setIconFill(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
                <label style={{ fontSize: '0.85rem' }}>Filled Icon</label>
              </div>
            </div>
          )}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label>Icon Size</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="number" className="input-field" value={iconSize} onChange={e => setIconSize(Number(e.target.value))} style={{ width: '60px', padding: '0.25rem' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>px</span>
            </div>
          </div>
          <input type="range" min="16" max="100" value={iconSize} onChange={e => setIconSize(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}
