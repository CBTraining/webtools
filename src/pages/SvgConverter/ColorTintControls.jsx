export default function ColorTintControls({
  applyTint,
  setApplyTint,
  tintMode,
  setTintMode,
  solidColor,
  setSolidColor,
  gradStart,
  setGradStart,
  gradEnd,
  setGradEnd,
  gradDirection,
  setGradDirection
}) {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)', marginBottom: '1.5rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 'bold' }}>
        <input 
          type="checkbox" 
          checked={applyTint}
          onChange={(e) => setApplyTint(e.target.checked)}
          className="accent-primary"
        />
        Override Colors
      </label>
      
      {applyTint && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="radio" checked={tintMode === 'solid'} onChange={() => setTintMode('solid')} className="accent-primary" /> Solid
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <input type="radio" checked={tintMode === 'gradient'} onChange={() => setTintMode('gradient')} className="accent-primary" /> Gradient
            </label>
          </div>

          {tintMode === 'solid' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="color" value={solidColor} onChange={(e) => setSolidColor(e.target.value)} style={{ width: '40px', height: '30px', padding: 0, border: 'none' }} />
              <span>Color</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="color" value={gradStart} onChange={(e) => setGradStart(e.target.value)} style={{ width: '40px', height: '30px', padding: 0, border: 'none' }} />
                  <span>Start</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="color" value={gradEnd} onChange={(e) => setGradEnd(e.target.value)} style={{ width: '40px', height: '30px', padding: 0, border: 'none' }} />
                  <span>End</span>
                </div>
              </div>
              <select 
                className="input-field" 
                value={gradDirection} 
                onChange={(e) => setGradDirection(e.target.value)}
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <option value="to-bottom">Top to Bottom</option>
                <option value="to-right">Left to Right</option>
                <option value="to-bottom-right">Diagonal (TL to BR)</option>
                <option value="to-top-right">Diagonal (BL to TR)</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
