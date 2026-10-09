export default function ShapePresetsBar({
  onApplyGooglePreset,
  onApplyNotebookLMPreset,
  onApplyOceanPreset,
  savedPresets,
  onApplyCustomPreset,
  onDeletePreset,
  onSaveCurrentAsPreset,
  gradDirection,
  setGradDirection
}) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Presets:</span>
      <button type="button" className="primary-btn outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={onApplyGooglePreset}>Google</button>
      <button type="button" className="primary-btn outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={onApplyNotebookLMPreset}>NotebookLM</button>
      <button type="button" className="primary-btn outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={onApplyOceanPreset}>Ocean</button>
      
      {savedPresets.map(preset => (
        <div key={preset.id} style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            type="button"
            className="primary-btn outline" 
            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderTopRightRadius: 0, borderBottomRightRadius: 0 }} 
            onClick={() => onApplyCustomPreset(preset)}
          >
            {preset.name}
          </button>
          <button 
            type="button"
            className="primary-btn outline" 
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none', color: 'var(--error-color)' }} 
            onClick={() => onDeletePreset(preset.id)}
            title="Delete Preset"
          >
            ×
          </button>
        </div>
      ))}
      
      <button type="button" className="primary-btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', marginLeft: '0.5rem' }} onClick={onSaveCurrentAsPreset}>
        + Save Custom Preset
      </button>
      
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Direction:</label>
        <select className="text-input" value={gradDirection} onChange={e => setGradDirection(e.target.value)} style={{ padding: '0.25rem 0.5rem' }}>
          <option value="to-bottom-right">Top-Left to Bottom-Right</option>
          <option value="to-top-left">Bottom-Right to Top-Left</option>
          <option value="to-top-right">Bottom-Left to Top-Right</option>
          <option value="to-bottom-left">Top-Right to Bottom-Left</option>
          <option value="to-right">Left to Right</option>
          <option value="to-left">Right to Left</option>
          <option value="to-bottom">Top to Bottom</option>
          <option value="to-top">Bottom to Top</option>
        </select>
      </div>
    </div>
  );
}
