export default function ColorKeyTab({
  sampledColors,
  onClearColors,
  tolerance,
  setTolerance,
  feather,
  setFeather,
  onApplyColorKey
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          type="button"
          className="btn"
          onClick={onClearColors}
          style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
        >
          Clear Sampled Colors ({sampledColors.length})
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '130px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Tolerance: {tolerance}</span>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={tolerance} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setTolerance(val);
              onApplyColorKey(sampledColors, val, feather);
            }}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '130px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Feather: {feather}%</span>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={feather} 
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setFeather(val);
              onApplyColorKey(sampledColors, tolerance, val);
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
