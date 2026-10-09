export default function DimensionControls({
  width,
  setWidth,
  height,
  setHeight,
  aspectRatio,
  setAspectRatio,
  keepProportions,
  setKeepProportions
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div className="control-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Output Width (px)</label>
          <input 
            type="number" 
            className="input-field" 
            value={width || ''} 
            onChange={(e) => {
              const val = Number(e.target.value);
              setWidth(val);
              if (keepProportions && aspectRatio) setHeight(Math.round(val / aspectRatio));
            }} 
          />
        </div>
        <div className="control-group" style={{ flex: 1, marginBottom: 0 }}>
          <label>Output Height (px)</label>
          <input 
            type="number" 
            className="input-field" 
            value={height || ''} 
            onChange={(e) => {
              const val = Number(e.target.value);
              setHeight(val);
              if (keepProportions && aspectRatio) setWidth(Math.round(val * aspectRatio));
            }} 
          />
        </div>
      </div>
      
      <div style={{ marginBottom: '1rem', marginTop: '0.75rem' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
          Vertical Height Presets:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[500, 1000, 1500, 2000].map(size => (
            <button 
              key={size}
              type="button"
              className="btn" 
              style={{ 
                padding: '0.3rem 0.75rem', 
                fontSize: '0.8rem', 
                background: height === size ? 'var(--accent-color)' : 'var(--bg-tertiary)', 
                color: 'white',
                border: height === size ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
              }}
              onClick={() => {
                setHeight(size);
                if (keepProportions && aspectRatio) setWidth(Math.round(size * aspectRatio));
              }}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        <input 
          type="checkbox" 
          checked={keepProportions}
          onChange={(e) => {
            setKeepProportions(e.target.checked);
            if (e.target.checked && width && height) {
              setAspectRatio(width / height);
            }
          }}
          className="accent-primary"
        />
        Keep proportions
      </label>
    </>
  );
}
