import { PhotoIcon, CheckIcon } from '@heroicons/react/24/solid';
import GradientEditor from '../../../components/GradientEditor';

export default function EffectsControls({
  showBottomGlow,
  setShowBottomGlow,
  gradStops,
  setGradStops,
  glowHeight,
  setGlowHeight,
  glowBlur,
  setGlowBlur,
  bgImageUrl,
  setBgImageUrl,
  bgImagePosition = 'center',
  setBgImagePosition,
  bgBrightness,
  setBgBrightness,
  bgContrast,
  setBgContrast,
  bgTint,
  setBgTint,
  animIntensity,
  setAnimIntensity,
  hoverAnimations,
  setHoverAnimations
}) {
  return (
    <div className="control-group" style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <label style={{ fontWeight: 'bold' }}>Lighting & Effects</label>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input type="checkbox" checked={showBottomGlow} onChange={e => setShowBottomGlow(e.target.checked)} style={{ accentColor: 'var(--primary-color)' }} />
        <label>Bottom Glow</label>
      </div>

      {showBottomGlow && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px' }}>
          <GradientEditor stops={gradStops} onChange={setGradStops} />
          
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Glow Height</label>
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{glowHeight}px</span>
            </div>
            <input type="range" min="5" max="150" value={glowHeight} onChange={e => setGlowHeight(Number(e.target.value))} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem' }}>Glow Blur</label>
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{glowBlur}px</span>
            </div>
            <input type="range" min="0" max="100" value={glowBlur} onChange={e => setGlowBlur(Number(e.target.value))} />
          </div>
        </div>
      )}

      {/* Background Image Setup */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Background Image</label>
          {setBgImagePosition && (
            <select className="input-field" value={bgImagePosition} onChange={e => setBgImagePosition(e.target.value)} style={{ padding: '2px 8px', fontSize: '0.75rem', width: 'auto' }}>
              <option value="top">Align Top</option>
              <option value="center">Align Center</option>
              <option value="bottom">Align Bottom</option>
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" className="input-field" placeholder="https://images.unsplash.com/..." value={bgImageUrl} onChange={e => setBgImageUrl(e.target.value)} style={{ flex: 1, fontSize: '0.8rem' }} />
          <label className="btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.6rem', fontSize: '0.8rem', flexShrink: 0 }}>
            <PhotoIcon style={{ width: '14px', height: '14px' }} /> Upload
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => setBgImageUrl(event.target.result);
                reader.readAsDataURL(file);
              }
            }} />
          </label>
        </div>
      </div>

      {bgImageUrl && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
          <div>
            <label style={{ fontSize: '0.75rem' }}>Brightness: {bgBrightness}%</label>
            <input type="range" min="0" max="200" value={bgBrightness} onChange={e => setBgBrightness(Number(e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem' }}>Contrast: {bgContrast}%</label>
            <input type="range" min="0" max="200" value={bgContrast} onChange={e => setBgContrast(Number(e.target.value))} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8rem' }}>Tint Overlay</label>
            <input type="text" className="input-field" value={bgTint} onChange={e => setBgTint(e.target.value)} style={{ width: '100px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} />
          </div>
        </div>
      )}

      {/* Hover Animations */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <label>Hover Effects</label>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Intensity: {animIntensity.toFixed(1)}x</span>
        </div>
        <input type="range" min="0.1" max="10" step="0.1" value={animIntensity} onChange={e => setAnimIntensity(Number(e.target.value))} style={{ marginBottom: '1rem' }} />
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {Object.entries({ 
            float: 'Float', 
            pulse: 'Pulse', 
            expand: 'Expand', 
            tilt: 'Tilt', 
            shiftRight: 'Shift', 
            jiggle: 'Jiggle', 
            shake: 'Shake',
            bounce: 'Bounce',
            glowFlash: 'Flash',
            colorCycle: 'Color Cycle',
            outerGlow: 'Outer Glow',
            edgeGlow: 'Edge Glow'
          }).map(([key, label]) => {
            const isSelected = Boolean(hoverAnimations?.[key]);
            return (
              <label key={key} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                cursor: 'pointer', 
                background: isSelected ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                border: isSelected ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent',
                color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                padding: '6px 12px', 
                borderRadius: '16px', 
                fontSize: '0.8rem', 
                transition: 'all 0.2s ease',
                fontWeight: isSelected ? '600' : '400',
                boxShadow: isSelected ? '0 0 10px rgba(255,255,255,0.2)' : 'none'
              }}>
                <input 
                  type="checkbox" 
                  style={{ display: 'none' }} 
                  checked={isSelected} 
                  onChange={e => setHoverAnimations({ ...hoverAnimations, [key]: e.target.checked })} 
                />
                {isSelected && <CheckIcon style={{ width: '12px', height: '12px' }} />}
                {label}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
