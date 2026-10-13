import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const DOT_TYPE_OPTIONS = [
  { label: 'Rounded', value: 'rounded' },
  { label: 'Dots', value: 'dots' },
  { label: 'Classy', value: 'classy-rounded' },
  { label: 'Square', value: 'square' },
  { label: 'Extra Round', value: 'extra-rounded' }
];

export default function QrStyleControls({
  errorCorrection,
  setErrorCorrection,
  isGradient,
  setIsGradient,
  color1,
  setColor1,
  color2,
  setColor2,
  singleColor,
  setSingleColor,
  dotType,
  setDotType,
  setIsRounded,
  size,
  setSize
}) {
  const handleColorBlur = () => {
    setTimeout(() => {
      window.focus();
      if (document.activeElement) document.activeElement.blur();
    }, 50);
  };

  return (
    <>
      {/* Error Correction Level */}
      <div className="control-group" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheckIcon style={{ width: 16, height: 16, color: '#10b981' }} /> Error Correction Level
          </label>
          <span style={{ fontSize: '0.75rem', color: errorCorrection === 'H' ? '#10b981' : 'var(--text-secondary)' }}>
            {errorCorrection === 'H' ? 'High (30% - Best for Logos)' : errorCorrection === 'Q' ? 'Quartile (25%)' : errorCorrection === 'M' ? 'Medium (15%)' : 'Low (7%)'}
          </span>
        </div>
        <select 
          className="input-field" 
          value={errorCorrection} 
          onChange={(e) => setErrorCorrection(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)' }}
        >
          <option value="H">High (H - 30% recovery, Essential for Logos)</option>
          <option value="Q">Quartile (Q - 25% recovery)</option>
          <option value="M">Medium (M - 15% recovery)</option>
          <option value="L">Low (L - 7% recovery, No Logo)</option>
        </select>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          High level allows up to 30% of the QR code to be covered by a logo while remaining 100% readable.
        </div>
      </div>

      {/* Colors */}
      <div className="control-group" style={{ marginTop: '1.5rem' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          QR Pattern Colors
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'normal' }}>
            <input 
              type="checkbox" 
              checked={isGradient} 
              onChange={(e) => setIsGradient(e.target.checked)} 
              className="accent-primary"
            />
            Use Gradient
          </label>
        </label>
        
        {isGradient ? (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <input 
                type="color" 
                value={color1} 
                onChange={(e) => setColor1(e.target.value)} 
                onBlur={handleColorBlur}
                style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input 
                type="color" 
                value={color2} 
                onChange={(e) => setColor2(e.target.value)} 
                onBlur={handleColorBlur}
                style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '0.5rem' }}>
            <input 
              type="color" 
              value={singleColor} 
              onChange={(e) => setSingleColor(e.target.value)} 
              onBlur={handleColorBlur}
              style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}
            />
          </div>
        )}
      </div>

      {/* Dot Pattern Shapes */}
      <div className="control-group" style={{ marginTop: '1.5rem' }}>
        <label style={{ marginBottom: '0.5rem', display: 'block' }}>Dot Pattern Style</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {DOT_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className="btn"
              onClick={() => {
                setDotType(opt.value);
                setIsRounded(opt.value !== 'square');
              }}
              style={{
                padding: '0.35rem 0.5rem',
                fontSize: '0.75rem',
                background: dotType === opt.value ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                color: 'white',
                border: dotType === opt.value ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Download Size */}
      <div className="control-group" style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <label>Export Resolution</label>
          <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{size} x {size} px</span>
        </div>
        <input 
          type="range" 
          min="200" 
          max="2000" 
          step="40"
          value={size} 
          onChange={(e) => setSize(Number(e.target.value))} 
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>
    </>
  );
}
