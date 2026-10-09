export default function ColorAdjustControls({
  brightness,
  setBrightness,
  contrast,
  setContrast,
  saturation,
  setSaturation,
  grayscale,
  setGrayscale,
  sepia,
  setSepia,
  hue,
  setHue,
  invert,
  setInvert
}) {
  return (
    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>☀️</span> Color & Lighting
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Brightness */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Brightness</span>
            <span style={{ color: brightness !== 100 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{brightness}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="200" 
            value={brightness} 
            onChange={(e) => setBrightness(parseInt(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Contrast */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Contrast</span>
            <span style={{ color: contrast !== 100 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{contrast}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="200" 
            value={contrast} 
            onChange={(e) => setContrast(parseInt(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Saturation */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Saturation</span>
            <span style={{ color: saturation !== 100 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{saturation}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="200" 
            value={saturation} 
            onChange={(e) => setSaturation(parseInt(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Grayscale & Sepia */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Black & White</span>
              <span style={{ color: grayscale > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{grayscale}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={grayscale} 
              onChange={(e) => setGrayscale(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sepia</span>
              <span style={{ color: sepia > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{sepia}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sepia} 
              onChange={(e) => setSepia(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Hue Rotate & Invert */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hue Tint</span>
              <span style={{ color: hue !== 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{hue}°</span>
            </div>
            <input 
              type="range" 
              min="-180" 
              max="180" 
              value={hue} 
              onChange={(e) => setHue(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Invert</span>
              <span style={{ color: invert > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{invert}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={invert} 
              onChange={(e) => setInvert(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
