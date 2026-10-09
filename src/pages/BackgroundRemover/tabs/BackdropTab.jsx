export default function BackdropTab({
  backdropType,
  setBackdropType,
  solidColor,
  setSolidColor,
  gradientPreset,
  setGradientPreset,
  bokehBlur,
  setBokehBlur
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { id: 'transparent', label: 'Transparent' },
          { id: 'solid', label: 'Studio Solid' },
          { id: 'gradient', label: 'Gradient' },
          { id: 'bokeh', label: 'Portrait Bokeh Blur' }
        ].map(b => (
          <button
            key={b.id}
            type="button"
            className="btn"
            onClick={() => setBackdropType(b.id)}
            style={{
              padding: '0.3rem 0.6rem', fontSize: '0.78rem',
              background: backdropType === b.id ? 'var(--accent-color)' : 'var(--bg-tertiary)',
              color: backdropType === b.id ? 'white' : 'var(--text-secondary)',
              border: backdropType === b.id ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {backdropType === 'solid' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color Preset:</span>
          {['#ffffff', '#0b0f19', '#f1f5f9', '#ef4444', '#3b82f6', '#10b981'].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSolidColor(c)}
              style={{
                width: '24px', height: '24px', borderRadius: '50%', background: c,
                border: solidColor === c ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer'
              }}
            />
          ))}
          <input 
            type="color" 
            value={solidColor} 
            onChange={(e) => setSolidColor(e.target.value)} 
            style={{ width: '32px', height: '26px', border: 'none', background: 'none', cursor: 'pointer', marginLeft: '0.5rem' }}
            title="Custom Color"
          />
        </div>
      )}

      {backdropType === 'gradient' && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Style:</span>
          {[
            { id: 'studio', label: 'Studio Minimal' },
            { id: 'tech', label: 'Cyber Tech' },
            { id: 'sunset', label: 'Sunset Glow' },
            { id: 'dark', label: 'Dark Charcoal' }
          ].map(g => (
            <button
              key={g.id}
              type="button"
              className="btn"
              onClick={() => setGradientPreset(g.id)}
              style={{
                padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                background: gradientPreset === g.id ? 'var(--accent-color)' : 'var(--bg-tertiary)'
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {backdropType === 'bokeh' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Background Blur: {bokehBlur}px</span>
          <input 
            type="range" 
            min="0" 
            max="30" 
            value={bokehBlur} 
            onChange={(e) => setBokehBlur(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>
      )}
    </div>
  );
}
