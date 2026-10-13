export default function DimensionControls({
  maxWidth,
  setMaxWidth,
  maxWidthUnit,
  setMaxWidthUnit,
  minHeight,
  setMinHeight,
  minHeightUnit,
  setMinHeightUnit,
  borderRadius,
  setBorderRadius,
  innerShadowColor,
  setInnerShadowColor,
  backgroundColor,
  setBackgroundColor,
  enableLuminance,
  setEnableLuminance
}) {
  return (
    <div className="control-group" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <label style={{ fontWeight: 'bold' }}>Dimensions & Base</label>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label>Max Width</label>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{maxWidth}</span>
            <select className="input-field" value={maxWidthUnit} onChange={e => setMaxWidthUnit(e.target.value)} style={{ padding: '2px 4px', fontSize: '0.7rem' }}>
              <option value="px">px</option>
              <option value="%">%</option>
              <option value="vw">vw</option>
            </select>
          </div>
        </div>
        <input type="range" min={maxWidthUnit === 'px' ? 100 : 10} max={maxWidthUnit === 'px' ? 1000 : 100} value={maxWidth} onChange={e => setMaxWidth(Number(e.target.value))} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label>Min Height</label>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{minHeight}</span>
            <select className="input-field" value={minHeightUnit} onChange={e => setMinHeightUnit(e.target.value)} style={{ padding: '2px 4px', fontSize: '0.7rem' }}>
              <option value="px">px</option>
              <option value="%">%</option>
              <option value="vh">vh</option>
            </select>
          </div>
        </div>
        <input type="range" min={minHeightUnit === 'px' ? 50 : 10} max={minHeightUnit === 'px' ? 800 : 100} value={minHeight} onChange={e => setMinHeight(Number(e.target.value))} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label>Corner Radius</label>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{borderRadius}px</span>
        </div>
        <input type="range" min="0" max="200" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} />
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label>Border / Inner Glow</label>
          <input type="color" value={innerShadowColor} onChange={e => setInnerShadowColor(e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label>Card Base Color</label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="color" value={backgroundColor !== 'transparent' && !backgroundColor.startsWith('rgba') ? backgroundColor : '#000000'} onChange={e => setBackgroundColor(e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
            <input type="text" className="input-field" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} style={{ width: '90px', padding: '4px 8px', fontSize: '0.8rem' }} />
          </div>
        </div>
        <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input type="checkbox" checked={backgroundColor === 'transparent'} onChange={e => setBackgroundColor(e.target.checked ? 'transparent' : '#111827')} />
          Transparent Base
        </label>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
        <input type="checkbox" checked={enableLuminance} onChange={e => setEnableLuminance(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
        <label style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setEnableLuminance(!enableLuminance)}>Interactive Luminance</label>
      </div>
    </div>
  );
}
