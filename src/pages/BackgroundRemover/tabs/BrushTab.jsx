export default function BrushTab({
  mode,
  setMode,
  brushSize,
  setBrushSize,
  overlayOpacity,
  setOverlayOpacity
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className={`btn ${mode === 'erase' ? 'btn-primary' : ''}`}
            onClick={() => setMode('erase')}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
          >Erase</button>
          <button 
            className={`btn ${mode === 'restore' ? 'btn-primary' : ''}`}
            onClick={() => setMode('restore')}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
          >Restore Original</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Brush: {brushSize}px</span>
          <input 
            type="range" 
            min="5" 
            max="150" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '150px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Guide Opacity: {Math.round(overlayOpacity * 100)}%</span>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={overlayOpacity} 
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
