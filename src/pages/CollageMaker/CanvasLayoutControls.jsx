import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export default function CanvasLayoutControls({
  preset,
  onPresetChange,
  resolutionPresets,
  canvasWidth,
  setCanvasWidth,
  canvasHeight,
  setCanvasHeight,
  layoutType,
  setLayoutType,
  layoutTemplates,
  fillMode,
  setFillMode
}) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AdjustmentsHorizontalIcon style={{ width: 20, height: 20, color: 'var(--primary-color)' }} />
        Canvas & Layout
      </h3>

      {/* Resolution Preset */}
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Resolution Preset</label>
        <select 
          className="input-field" 
          value={preset} 
          onChange={(e) => onPresetChange(e.target.value)}
          style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
        >
          {resolutionPresets.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Custom W x H */}
      {preset === 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Width (px)</label>
            <input 
              type="number" 
              className="input-field" 
              value={canvasWidth} 
              onChange={(e) => setCanvasWidth(Math.max(100, parseInt(e.target.value) || 100))}
              style={{ width: '100%', padding: '0.4rem' }} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Height (px)</label>
            <input 
              type="number" 
              className="input-field" 
              value={canvasHeight} 
              onChange={(e) => setCanvasHeight(Math.max(100, parseInt(e.target.value) || 100))}
              style={{ width: '100%', padding: '0.4rem' }} 
            />
          </div>
        </div>
      )}

      {/* Layout Template Selector */}
      <div>
        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Layout Setup</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginTop: '0.4rem' }}>
          {layoutTemplates.map(t => (
            <button 
              key={t.id}
              className={`btn ${layoutType === t.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setLayoutType(t.id)}
              style={{ padding: '0.4rem 0.2rem', fontSize: '0.75rem', textAlign: 'center' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fill Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Photo Fit Mode</span>
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)' }}>
          <button 
            className={`btn ${fillMode === 'cover' ? 'btn-primary' : ''}`}
            onClick={() => setFillMode('cover')}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          >Crop (Cover)</button>
          <button 
            className={`btn ${fillMode === 'contain' ? 'btn-primary' : ''}`}
            onClick={() => setFillMode('contain')}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
          >Fit (Contain)</button>
        </div>
      </div>
    </div>
  );
}
