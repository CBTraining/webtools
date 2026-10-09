import { SparklesIcon } from '@heroicons/react/24/outline';

export default function StyleControls({
  gap,
  setGap,
  margin,
  setMargin,
  borderRadius,
  setBorderRadius,
  shadow,
  setShadow,
  bgType,
  setBgType,
  bgColor,
  setBgColor,
  setUserHasCustomBg
}) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <SparklesIcon style={{ width: 20, height: 20, color: 'var(--primary-color)' }} />
        Style & Spacing
      </h3>

      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Photo Spacing</span>
            <span>{gap}px</span>
          </div>
          <input type="range" min="0" max="60" value={gap} onChange={(e) => setGap(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Outer Margin</span>
            <span>{margin}px</span>
          </div>
          <input type="range" min="0" max="80" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Corner Rounding</span>
            <span>{borderRadius}px</span>
          </div>
          <input type="range" min="0" max="60" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Photo Shadow</span>
            <span>{shadow}px</span>
          </div>
          <input type="range" min="0" max="30" value={shadow} onChange={(e) => setShadow(parseInt(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>

      {/* Background Style Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Background</span>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)' }}>
            <button 
              className={`btn ${bgType === 'transparent' ? 'btn-primary' : ''}`}
              onClick={() => setBgType('transparent')}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >Transparent</button>
            <button 
              className={`btn ${bgType === 'solid' ? 'btn-primary' : ''}`}
              onClick={() => setBgType('solid')}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >Color Hex</button>
          </div>
        </div>

        {bgType === 'solid' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color Hex</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => { setBgColor(e.target.value); setUserHasCustomBg(true); }} 
                style={{ border: 'none', background: 'transparent', width: 28, height: 28, cursor: 'pointer' }}
              />
              <input 
                type="text" 
                className="input-field"
                value={bgColor} 
                onChange={(e) => { setBgColor(e.target.value); setUserHasCustomBg(true); }} 
                style={{ width: 85, padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
