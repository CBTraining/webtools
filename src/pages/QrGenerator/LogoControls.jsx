import { PhotoIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function LogoControls({
  rawLogoUrl,
  processedLogoUrl,
  logoFileName,
  logoShape,
  setLogoShape,
  logoBgColor,
  setLogoBgColor,
  logoSize,
  setLogoSize,
  logoMargin,
  setLogoMargin,
  hideDotsBehindLogo,
  setHideDotsBehindLogo,
  isLogoDragging,
  setIsLogoDragging,
  logoInputRef,
  onRemoveLogo,
  onLogoFile,
  onLogoUpload,
  dotType
}) {
  return (
    <div className="control-group" style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <PhotoIcon style={{ width: 18, height: 18, color: 'var(--accent-color)' }} /> Center Logo / SVG
        </label>
        {rawLogoUrl && (
          <button 
            type="button"
            onClick={onRemoveLogo}
            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            <XMarkIcon style={{ width: 14, height: 14 }} /> Remove Logo
          </button>
        )}
      </div>

      {!rawLogoUrl ? (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsLogoDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsLogoDragging(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setIsLogoDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              onLogoFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => logoInputRef.current && logoInputRef.current.click()}
          style={{
            border: isLogoDragging ? '2px dashed var(--accent-color)' : '2px dashed var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '1.25rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: isLogoDragging ? 'rgba(59,130,246,0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          }}
        >
          <input 
            ref={logoInputRef}
            type="file" 
            accept=".svg,.png,.jpg,.jpeg,.webp,.ico" 
            onChange={onLogoUpload}
            style={{ display: 'none' }} 
          />
          <PhotoIcon style={{ width: 32, height: 32, margin: '0 auto 0.5rem', color: 'var(--text-secondary)' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>Click to upload SVG or Image logo</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Supports .SVG, .PNG, .JPG, .WEBP</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)' }}>
            <img 
              src={processedLogoUrl || rawLogoUrl} 
              alt="Center Logo Preview" 
              style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#ffffff', borderRadius: logoShape === 'circle' || (logoShape === 'auto' && dotType === 'dots') ? '50%' : '6px', padding: '2px', border: '1px solid var(--border-color)' }} 
            />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {logoFileName || 'Custom Logo'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <SparklesIcon style={{ width: 12, height: 12 }} /> Auto-shaped to QR roundness
              </div>
            </div>
            <label className="btn" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>
              Change
              <input 
                type="file" 
                accept=".svg,.png,.jpg,.jpeg,.webp,.ico" 
                onChange={onLogoUpload}
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {/* Logo Shape & Roundness Matching */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Logo Corner Roundness
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              {[
                { label: 'Auto (Match QR)', value: 'auto' },
                { label: 'Circle', value: 'circle' },
                { label: 'Rounded', value: 'rounded' },
                { label: 'Square', value: 'square' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className="btn"
                  onClick={() => setLogoShape(opt.value)}
                  style={{
                    padding: '0.3rem 0.35rem',
                    fontSize: '0.7rem',
                    background: logoShape === opt.value ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: 'white',
                    border: logoShape === opt.value ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logo Background Badge Color */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Logo Background Badge</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>High contrast for dark/light themes</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {[
                { label: 'White', color: '#ffffff' },
                { label: 'Dark', color: '#090d16' },
                { label: 'Transparent', color: 'transparent' }
              ].map(bg => (
                <button
                  key={bg.color}
                  type="button"
                  className="btn"
                  onClick={() => setLogoBgColor(bg.color)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.75rem',
                    background: logoBgColor === bg.color ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: 'white',
                    border: logoBgColor === bg.color ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
                  }}
                >
                  {bg.label}
                </button>
              ))}
              {logoBgColor !== 'transparent' && (
                <input 
                  type="color" 
                  value={logoBgColor.startsWith('#') ? logoBgColor : '#ffffff'} 
                  onChange={(e) => setLogoBgColor(e.target.value)} 
                  style={{ width: '32px', height: '28px', border: 'none', background: 'none', cursor: 'pointer' }}
                  title="Custom badge color"
                />
              )}
            </div>
          </div>

          {/* Logo Size */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Logo Size</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{Math.round(logoSize * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.10" 
              max="0.55" 
              step="0.01" 
              value={logoSize} 
              onChange={(e) => setLogoSize(parseFloat(e.target.value))} 
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              {[0.20, 0.26, 0.34, 0.40, 0.50].map(s => (
                <button
                  key={s}
                  type="button"
                  className="btn"
                  onClick={() => setLogoSize(s)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    background: Math.abs(logoSize - s) < 0.01 ? 'var(--accent-color)' : 'var(--bg-secondary)',
                    color: 'white',
                    border: Math.abs(logoSize - s) < 0.01 ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
                  }}
                >
                  {Math.round(s * 100)}%
                </button>
              ))}
            </div>
            <div style={{ fontSize: '0.7rem', color: logoSize > 0.35 ? '#f59e0b' : 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {logoSize > 0.35 ? '⚠️ Large logo (>35%): Ensure payload is short for best scanner compatibility.' : 'Standard range (20–34%): Optimal for instant camera scanning.'}
            </div>
          </div>

          {/* Logo Margin */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Logo Safe Margin</span>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{logoMargin}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="16" 
              step="1" 
              value={logoMargin} 
              onChange={(e) => setLogoMargin(parseInt(e.target.value))} 
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Hide Background Dots */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={hideDotsBehindLogo} 
              onChange={(e) => setHideDotsBehindLogo(e.target.checked)} 
              className="accent-primary"
            />
            Clear QR dots behind logo (Recommended)
          </label>
        </div>
      )}
    </div>
  );
}
