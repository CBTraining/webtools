export default function BlurControls({
  gaussianBlur,
  setGaussianBlur,
  radialBlur,
  setRadialBlur,
  radialCenterX,
  setRadialCenterX,
  radialCenterY,
  setRadialCenterY
}) {
  return (
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>🌫️</span> Blur Effects
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Gaussian Blur */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Gaussian Blur</span>
            <span style={{ color: gaussianBlur > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{gaussianBlur}px</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="40" 
            step="0.5" 
            value={gaussianBlur} 
            onChange={(e) => setGaussianBlur(parseFloat(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Radial Blur */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Radial / Zoom Blur</span>
            <span style={{ color: radialBlur > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{radialBlur}</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="40" 
            value={radialBlur} 
            onChange={(e) => setRadialBlur(parseInt(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
        </div>

        {/* Radial Center Position (shown when radial blur > 0) */}
        {radialBlur > 0 && (
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.75rem', borderRadius: 'var(--border-radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Radial Center (or click on image)</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{radialCenterX}%, {radialCenterY}%</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Center X: {radialCenterX}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={radialCenterX} 
                  onChange={(e) => setRadialCenterX(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Center Y: {radialCenterY}%</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={radialCenterY} 
                  onChange={(e) => setRadialCenterY(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => { setRadialCenterX(50); setRadialCenterY(50); }}
                style={{ flex: 1, padding: '0.2rem', fontSize: '0.7rem' }}
              >
                Reset Center (50%, 50%)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
