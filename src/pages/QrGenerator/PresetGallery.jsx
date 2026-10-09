import { TrashIcon } from '@heroicons/react/24/solid';

export default function PresetGallery({ presets, onApply, onDelete }) {
  if (!presets || presets.length === 0) return null;
  return (
    <div style={{ marginTop: '2rem' }}>
      <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Your Saved Presets
      </h4>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {presets.map(preset => (
          <div 
            key={preset.id} 
            className="glass-panel" 
            style={{ 
              padding: '0.5rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem', 
              alignItems: 'center', 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--border-radius-sm)' 
            }}
          >
            <div 
              style={{
                width: '40px', 
                height: '40px', 
                borderRadius: preset.isRounded ? '50%' : '4px',
                background: preset.isGradient 
                  ? `linear-gradient(135deg, ${preset.color1}, ${preset.color2})` 
                  : preset.singleColor,
                border: '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
              onClick={() => onApply(preset)}
              title="Apply preset"
            />
            <button 
              className="btn" 
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#ff4444' }} 
              onClick={() => onDelete(preset.id)} 
              title="Delete preset"
            >
              <TrashIcon width={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
