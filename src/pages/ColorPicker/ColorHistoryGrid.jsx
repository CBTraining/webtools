import { 
  EyeDropperIcon as EyeDropper, 
  DocumentDuplicateIcon as CopyIcon, 
  CheckIcon as Check, 
  TrashIcon as Trash 
} from '@heroicons/react/24/solid';

export default function ColorHistoryGrid({ colors, copiedColor, onCopy, onDelete, onClearAll }) {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Color History</h3>
        {colors.length > 0 && (
          <button className="btn" onClick={onClearAll} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            Clear All
          </button>
        )}
      </div>
      
      {colors.length === 0 ? (
        <div className="empty-state">
          <EyeDropper style={{ width: 48, height: 48, opacity: 0.5, marginBottom: '1rem' }} />
          <p>Your saved colors will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
          {colors.map((color, i) => (
            <div 
              key={`${color}-${i}`}
              onClick={() => onCopy(color)}
              style={{ 
                background: color, 
                height: '80px', 
                borderRadius: 'var(--border-radius-sm)', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                fontWeight: 'bold',
                fontSize: '1rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                const btn = e.currentTarget.querySelector('.delete-btn');
                if (btn) btn.style.opacity = '1';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
                const btn = e.currentTarget.querySelector('.delete-btn');
                if (btn) btn.style.opacity = '0';
              }}
            >
              <button 
                className="delete-btn"
                onClick={(e) => onDelete(color, e)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  padding: '4px'
                }}
                title="Remove color"
              >
                <Trash />
              </button>
              
              {copiedColor === color ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Check style={{ width: 20, height: 20 }} /> Copied!
                </span>
              ) : (
                color
              )}
              
              <span style={{
                fontSize: '0.8rem', 
                opacity: 0.8, 
                marginTop: '0.5rem',
                fontWeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <CopyIcon style={{ width: 14, height: 14 }} /> Click to copy
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
