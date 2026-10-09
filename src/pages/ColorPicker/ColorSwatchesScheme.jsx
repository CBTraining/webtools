import { SwatchIcon, CheckIcon as Check } from '@heroicons/react/24/solid';
import { generateScheme } from './colorMath';

export default function ColorSwatchesScheme({ baseColor, copiedColor, onCopy }) {
  if (!baseColor) return null;
  const scheme = generateScheme(baseColor);
  if (!scheme || scheme.length === 0) return null;

  return (
    <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <SwatchIcon style={{ width: 24, height: 24, color: 'var(--accent-color)' }} />
        <h3 style={{ margin: 0 }}>Color Swatches</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
        {scheme.map((item, i) => (
          <div 
            key={`${item.hex}-${i}`}
            onClick={() => onCopy(item.hex)}
            style={{ 
              background: item.hex, 
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
              fontSize: '1.1rem',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
            }}
          >
            {copiedColor === item.hex ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Check style={{ width: 20, height: 20 }} /> Copied!
              </span>
            ) : (
              item.hex
            )}
            
            <span style={{
              fontSize: '0.8rem', 
              opacity: 0.9, 
              marginTop: '0.5rem',
              fontWeight: 'normal',
              background: 'rgba(0,0,0,0.3)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
