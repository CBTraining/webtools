import { ArrowPathIcon } from '@heroicons/react/24/solid';

export default function TransformControls({
  width,
  height,
  naturalWidth,
  naturalHeight,
  lockAspect,
  setLockAspect,
  onWidthChange,
  onHeightChange,
  setWidth,
  setHeight,
  radius,
  setRadius,
  rotation,
  setRotation,
  flipH,
  setFlipH,
  flipV,
  setFlipV,
  quality,
  setQuality,
  onResetFilters,
  onNewImage
}) {
  return (
    <>
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>📐</span> Transform & Dimensions
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Dimensions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Dimensions (px)</span>
              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', color: lockAspect ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                <input 
                  type="checkbox" 
                  checked={lockAspect} 
                  onChange={(e) => setLockAspect(e.target.checked)} 
                />
                Lock Aspect Ratio
              </label>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <input 
                type="number" 
                className="input-field" 
                value={width} 
                onChange={(e) => onWidthChange(parseInt(e.target.value) || 10)} 
                style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                title="Width"
              />
              <input 
                type="number" 
                className="input-field" 
                value={height} 
                onChange={(e) => onHeightChange(parseInt(e.target.value) || 10)} 
                style={{ width: '100%', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                title="Height"
              />
            </div>

            {/* Preset Scale Buttons */}
            <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
              {[0.25, 0.5, 0.75, 1, 1.5, 2].map(scale => (
                <button
                  key={scale}
                  type="button"
                  className="btn"
                  onClick={() => {
                    setWidth(Math.round(naturalWidth * scale));
                    setHeight(Math.round(naturalHeight * scale));
                  }}
                  style={{ flex: 1, padding: '0.2rem', fontSize: '0.68rem', background: 'var(--bg-tertiary)' }}
                >
                  {scale * 100}%
                </button>
              ))}
            </div>
          </div>

          {/* Corner Radius */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Corner Radius</span>
              <span style={{ color: radius > 0 ? 'var(--accent-color)' : 'var(--text-muted)', fontWeight: 'bold' }}>{radius}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={Math.min(width, height) / 2} 
              value={radius} 
              onChange={(e) => setRadius(parseInt(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>

          {/* Rotation & Flip */}
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
              Orientation & Flip
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setRotation(r => (r + 270) % 360)}
                style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                title="Rotate 90° Counter-Clockwise"
              >
                ↺ -90°
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setRotation(r => (r + 90) % 360)}
                style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                title="Rotate 90° Clockwise"
              >
                ↻ +90°
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setFlipH(f => !f)}
                style={{ padding: '0.35rem', fontSize: '0.75rem', background: flipH ? 'var(--accent-color)' : 'var(--bg-tertiary)' }}
                title="Flip Horizontal"
              >
                ⇄ Flip H
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setFlipV(f => !f)}
                style={{ padding: '0.35rem', fontSize: '0.75rem', background: flipV ? 'var(--accent-color)' : 'var(--bg-tertiary)' }}
                title="Flip Vertical"
              >
                ⇅ Flip V
              </button>
            </div>
          </div>

          {/* JPEG / WEBP Quality Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>JPEG / WEBP Quality</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{Math.round(quality * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.1" 
              max="1.0" 
              step="0.05"
              value={quality} 
              onChange={(e) => setQuality(parseFloat(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Global Reset & Actions */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          className="btn" 
          onClick={onResetFilters} 
          style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
        >
          <ArrowPathIcon style={{ width: 14, height: 14 }} /> Reset All Adjustments
        </button>
        <button 
          type="button" 
          className="btn" 
          onClick={onNewImage} 
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#ff4444' }}
        >
          New Image
        </button>
      </div>
    </>
  );
}
