import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  QrCodeIcon, 
  BookmarkSquareIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/solid';
import QRCodeStyling from 'qr-code-styling';
import { copyBlobToClipboard } from '../utils/downloadUtils';
import PresetGallery from './QrGenerator/PresetGallery';
import LogoControls from './QrGenerator/LogoControls';
import QrPreview from './QrGenerator/QrPreview';
import { processQrLogo } from './QrGenerator/qrLogoProcessor';

export default function QrGenerator() {
  const location = useLocation();
  const [data, setData] = useState('https://google.com');
  const [size, setSize] = useState(320);
  const [isGradient, setIsGradient] = useState(true);
  const [singleColor, setSingleColor] = useState('#ffffff');
  const [color1, setColor1] = useState('#40E0D0');
  const [color2, setColor2] = useState('#12a5d1');
  const bgColor = 'transparent';
  const [isRounded, setIsRounded] = useState(true);
  const [dotType, setDotType] = useState('rounded'); // 'rounded', 'dots', 'classy-rounded', 'square', 'extra-rounded'
  
  // Center Logo / SVG Options
  const [rawLogoUrl, setRawLogoUrl] = useState(location.state?.logoUrl || '');
  const [processedLogoUrl, setProcessedLogoUrl] = useState('');
  const [logoFileName, setLogoFileName] = useState(location.state?.logoFileName || '');
  const [logoSize, setLogoSize] = useState(0.26); // 26% of QR size (safe threshold)
  const [logoMargin, setLogoMargin] = useState(4); // 4px safe margin
  const [logoShape, setLogoShape] = useState('auto'); // 'auto', 'circle', 'rounded', 'square'
  const [logoBgColor, setLogoBgColor] = useState('#ffffff'); // White background badge by default for maximum scan contrast
  const logoBgPadding = 10; // 10% padding
  const [hideDotsBehindLogo, setHideDotsBehindLogo] = useState(true);
  const [errorCorrection, setErrorCorrection] = useState('H'); // 'H' (30%) is essential for reliable logo scanning!
  
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const savedP = localStorage.getItem('qrPresetsHistory');
      if (savedP) return JSON.parse(savedP);
    } catch {
      // ignore JSON parse error
    }
    return [
      {
        id: 'default-black',
        isGradient: false,
        singleColor: '#000000',
        color1: '#000000',
        color2: '#000000',
        isRounded: true,
        dotType: 'rounded'
      },
      {
        id: 'default-cyan',
        isGradient: true,
        singleColor: '#40E0D0',
        color1: '#40E0D0',
        color2: '#12a5d1',
        isRounded: true,
        dotType: 'rounded'
      }
    ];
  });
  const [isCopied, setIsCopied] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  
  const qrRef = useRef(null);
  const qrCodeInstance = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (location.state?.logoUrl) {
      setRawLogoUrl(location.state.logoUrl);
      if (location.state.logoFileName) setLogoFileName(location.state.logoFileName);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.logoUrl]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (rawLogoUrl && rawLogoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(rawLogoUrl);
      }
    };
  }, [rawLogoUrl]);

  // Pre-process Logo to match QR Code Roundness & Shape
  useEffect(() => {
    let isCurrent = true;
    processQrLogo({ rawLogoUrl, logoShape, logoBgColor, logoBgPadding, dotType })
      .then((processedUrl) => {
        if (isCurrent) setProcessedLogoUrl(processedUrl);
      });
    return () => {
      isCurrent = false;
    };
  }, [rawLogoUrl, logoShape, logoBgColor, logoBgPadding, dotType, isRounded]);

  // Initialize QR Code instance
  useEffect(() => {

    qrCodeInstance.current = new QRCodeStyling({
      width: size,
      height: size,
      data: data || ' ',
      image: processedLogoUrl || '',
      qrOptions: {
        errorCorrectionLevel: errorCorrection
      },
      imageOptions: {
        hideBackgroundDots: hideDotsBehindLogo,
        imageSize: logoSize,
        margin: logoMargin,
        crossOrigin: 'anonymous'
      },
      dotsOptions: {
        type: dotType,
        ...(isGradient ? {
          gradient: {
            type: 'linear',
            rotation: 0.785398, // 45 degrees
            colorStops: [
              { offset: 0, color: color1 },
              { offset: 1, color: color2 }
            ]
          }
        } : {
          color: singleColor
        })
      },
      cornersSquareOptions: {
        type: isRounded ? 'extra-rounded' : 'square'
      },
      backgroundOptions: {
        color: bgColor
      }
    });

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCodeInstance.current.append(qrRef.current);
    }
  }, []);

  // Update QR Code on state changes
  useEffect(() => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.update({
        width: size,
        height: size,
        data: data || ' ',
        image: processedLogoUrl || '',
        qrOptions: {
          errorCorrectionLevel: errorCorrection
        },
        imageOptions: {
          hideBackgroundDots: hideDotsBehindLogo,
          imageSize: logoSize,
          margin: logoMargin,
          crossOrigin: 'anonymous'
        },
        dotsOptions: {
          type: dotType,
          ...(isGradient ? {
            gradient: {
              type: 'linear',
              rotation: 0.785398,
              colorStops: [
                { offset: 0, color: color1 },
                { offset: 1, color: color2 }
              ]
            }
          } : {
            gradient: null,
            color: singleColor
          })
        },
        cornersSquareOptions: {
          type: isRounded ? 'extra-rounded' : 'square'
        },
        backgroundOptions: {
          color: bgColor
        }
      });
    }
  }, [data, size, color1, color2, isRounded, isGradient, singleColor, bgColor, dotType, processedLogoUrl, logoSize, logoMargin, hideDotsBehindLogo, errorCorrection]);

  const handleColorBlur = () => {
    setTimeout(() => {
      window.focus();
      if (document.activeElement) document.activeElement.blur();
    }, 50);
  };

  const handleLogoFile = (file) => {
    if (!file) return;
    if (rawLogoUrl && rawLogoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(rawLogoUrl);
    }

    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgText = e.target.result;
        const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        setRawLogoUrl(url);
        setLogoFileName(file.name);
        setErrorCorrection('H'); // Auto boost error correction to High (30%) for reliable scanning!
      };
      reader.readAsText(file);
    } else {
      const url = URL.createObjectURL(file);
      setRawLogoUrl(url);
      setLogoFileName(file.name);
      setErrorCorrection('H'); // Auto boost error correction to High (30%) for reliable scanning!
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) handleLogoFile(file);
  };

  const handleRemoveLogo = () => {
    if (rawLogoUrl && rawLogoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(rawLogoUrl);
    }
    setRawLogoUrl('');
    setProcessedLogoUrl('');
    setLogoFileName('');
    if (logoInputRef.current) logoInputRef.current.value = null;
  };

  const downloadQR = (ext) => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({ name: `qrcode-${Date.now()}`, extension: ext });
    }
  };

  const handleCopyQR = async () => {
    if (!qrRef.current) return;
    try {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const success = await copyBlobToClipboard(blob);
          if (success) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          } else {
            alert("Unable to copy to clipboard directly. Please use Download PNG.");
          }
        });
      }
    } catch (err) {
      console.error("Failed to copy QR code", err);
      alert("Unable to copy to clipboard directly. Please use Download PNG.");
    }
  };

  const handleSavePreset = () => {
    const newPreset = {
      id: Date.now().toString(),
      isGradient,
      singleColor,
      color1,
      color2,
      isRounded,
      dotType
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem('qrPresetsHistory', JSON.stringify(updated));
  };

  const handleDeletePreset = (id) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('qrPresetsHistory', JSON.stringify(updated));
  };

  const handleApplyPreset = (preset) => {
    setIsGradient(preset.isGradient);
    setSingleColor(preset.singleColor);
    setColor1(preset.color1);
    setColor2(preset.color2);
    setIsRounded(preset.isRounded);
    if (preset.dotType) setDotType(preset.dotType);
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCodeIcon style={{ width: 32, height: 32 }} /> QR Code Generator
          </h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            Create scannable, high-resolution QR codes with custom SVG/image center logos matching QR roundness, gradients, and custom styles.
          </p>
        </div>
      </header>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '2rem', alignItems: 'start' }}>
        <div className="glass-panel controls">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Customization</h3>
            <button className="btn" onClick={handleSavePreset} title="Save current styles as a preset" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              <BookmarkSquareIcon width={16} /> Save Preset
            </button>
          </div>
          
          {/* Payload */}
          <div className="control-group">
            <label>Payload (URL or Text)</label>
            <input 
              type="text" 
              className="text-input" 
              value={data} 
              onChange={(e) => setData(e.target.value)} 
              placeholder="https://example.com"
              style={{ width: '100%' }}
            />
          </div>

          {/* Center Logo / SVG Section */}
          <LogoControls
            rawLogoUrl={rawLogoUrl}
            processedLogoUrl={processedLogoUrl}
            logoFileName={logoFileName}
            logoShape={logoShape}
            setLogoShape={setLogoShape}
            logoBgColor={logoBgColor}
            setLogoBgColor={setLogoBgColor}
            logoSize={logoSize}
            setLogoSize={setLogoSize}
            logoMargin={logoMargin}
            setLogoMargin={setLogoMargin}
            hideDotsBehindLogo={hideDotsBehindLogo}
            setHideDotsBehindLogo={setHideDotsBehindLogo}
            isLogoDragging={isLogoDragging}
            setIsLogoDragging={setIsLogoDragging}
            logoInputRef={logoInputRef}
            onRemoveLogo={handleRemoveLogo}
            onLogoFile={handleLogoFile}
            onLogoUpload={handleLogoUpload}
            dotType={dotType}
          />

          {/* Error Correction Level */}
          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheckIcon style={{ width: 16, height: 16, color: '#10b981' }} /> Error Correction Level
              </label>
              <span style={{ fontSize: '0.75rem', color: errorCorrection === 'H' ? '#10b981' : 'var(--text-secondary)' }}>
                {errorCorrection === 'H' ? 'High (30% - Best for Logos)' : errorCorrection === 'Q' ? 'Quartile (25%)' : errorCorrection === 'M' ? 'Medium (15%)' : 'Low (7%)'}
              </span>
            </div>
            <select 
              className="input-field" 
              value={errorCorrection} 
              onChange={(e) => setErrorCorrection(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-tertiary)' }}
            >
              <option value="H">High (H - 30% recovery, Essential for Logos)</option>
              <option value="Q">Quartile (Q - 25% recovery)</option>
              <option value="M">Medium (M - 15% recovery)</option>
              <option value="L">Low (L - 7% recovery, No Logo)</option>
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              High level allows up to 30% of the QR code to be covered by a logo while remaining 100% readable.
            </div>
          </div>

          {/* Colors */}
          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              QR Pattern Colors
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'normal' }}>
                <input 
                  type="checkbox" 
                  checked={isGradient} 
                  onChange={(e) => setIsGradient(e.target.checked)} 
                  className="accent-primary"
                />
                Use Gradient
              </label>
            </label>
            
            {isGradient ? (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <input 
                    type="color" 
                    value={color1} 
                    onChange={(e) => setColor1(e.target.value)} 
                    onBlur={handleColorBlur}
                    style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="color" 
                    value={color2} 
                    onChange={(e) => setColor2(e.target.value)} 
                    onBlur={handleColorBlur}
                    style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                <input 
                  type="color" 
                  value={singleColor} 
                  onChange={(e) => setSingleColor(e.target.value)} 
                  onBlur={handleColorBlur}
                  style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none', borderRadius: 'var(--border-radius)', overflow: 'hidden' }}
                />
              </div>
            )}
          </div>

          {/* Dot Pattern Shapes */}
          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <label style={{ marginBottom: '0.5rem', display: 'block' }}>Dot Pattern Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { label: 'Rounded', value: 'rounded' },
                { label: 'Dots', value: 'dots' },
                { label: 'Classy', value: 'classy-rounded' },
                { label: 'Square', value: 'square' },
                { label: 'Extra Round', value: 'extra-rounded' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className="btn"
                  onClick={() => {
                    setDotType(opt.value);
                    setIsRounded(opt.value !== 'square');
                  }}
                  style={{
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.75rem',
                    background: dotType === opt.value ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                    color: 'white',
                    border: dotType === opt.value ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Download Size */}
          <div className="control-group" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <label>Export Resolution</label>
              <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{size} x {size} px</span>
            </div>
            <input 
              type="range" 
              min="200" 
              max="2000" 
              step="40"
              value={size} 
              onChange={(e) => setSize(Number(e.target.value))} 
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <PresetGallery presets={savedPresets} onApply={handleApplyPreset} onDelete={handleDeletePreset} />
        </div>

        {/* Live Preview Panel */}
        <QrPreview
          qrRef={qrRef}
          errorCorrection={errorCorrection}
          rawLogoUrl={rawLogoUrl}
          onDownload={downloadQR}
          onCopy={handleCopyQR}
          isCopied={isCopied}
        />
      </div>
    </div>
  );
}
