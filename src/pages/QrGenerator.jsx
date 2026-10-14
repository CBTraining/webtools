import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  QrCodeIcon, 
  BookmarkSquareIcon 
} from '@heroicons/react/24/solid';
import QRCodeStyling from 'qr-code-styling';
import { copyBlobToClipboard } from '../utils/downloadUtils';
import PresetGallery from './QrGenerator/PresetGallery';
import LogoControls from './QrGenerator/LogoControls';
import QrPreview from './QrGenerator/QrPreview';
import QrStyleControls from './QrGenerator/QrStyleControls';
import { processQrLogo } from './QrGenerator/qrLogoProcessor';
import { buildQrStylingOptions } from './QrGenerator/qrConfigBuilder';
import { useQrPresets } from './QrGenerator/useQrPresets';

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
  
  const { savedPresets, savePreset, deletePreset } = useQrPresets();
  const [isCopied, setIsCopied] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);
  
  const qrRef = useRef(null);
  const qrCodeInstance = useRef(null);
  const logoInputRef = useRef(null);

  const [prevNavLogo, setPrevNavLogo] = useState(location.state?.logoUrl);
  if (location.state?.logoUrl && location.state.logoUrl !== prevNavLogo) {
    setPrevNavLogo(location.state.logoUrl);
    setRawLogoUrl(location.state.logoUrl);
    if (location.state.logoFileName) setLogoFileName(location.state.logoFileName);
  }

  useEffect(() => {
    if (location.state?.logoUrl) {
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
  }, [rawLogoUrl, logoShape, logoBgColor, logoBgPadding, dotType]);

  // Standard options generator
  const qrOptions = useMemo(() => buildQrStylingOptions({
    size,
    data,
    processedLogoUrl,
    errorCorrection,
    hideDotsBehindLogo,
    logoSize,
    logoMargin,
    dotType,
    isGradient,
    color1,
    color2,
    singleColor,
    isRounded,
    bgColor
  }), [size, data, processedLogoUrl, errorCorrection, hideDotsBehindLogo, logoSize, logoMargin, dotType, isGradient, color1, color2, singleColor, isRounded, bgColor]);

  // Initialize QR Code instance
  useEffect(() => {
    qrCodeInstance.current = new QRCodeStyling(qrOptions);

    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCodeInstance.current.append(qrRef.current);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update QR Code on state changes
  useEffect(() => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.update(qrOptions);
    }
  }, [qrOptions]);

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

  const downloadQR = async (ext) => {
    if (qrCodeInstance.current) {
      const name = `qrcode-${Date.now()}`;
      qrCodeInstance.current.download({ name, extension: ext });
      try {
        const blob = await qrCodeInstance.current.getRawData(ext);
        if (blob) {
          const { saveToHistory } = await import('../utils/historyStorage');
          saveToHistory(blob, `${name}.${ext}`, { categoryLabel: 'Generated QR Code' });
        }
      } catch {
        // ignore if getRawData unsupported
      }
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

  const handleSaveCurrentPreset = () => {
    savePreset({
      isGradient,
      singleColor,
      color1,
      color2,
      isRounded,
      dotType
    });
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
            <button className="btn" onClick={handleSaveCurrentPreset} title="Save current styles as a preset" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
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

          {/* Color, Pattern, and Resolution Controls */}
          <QrStyleControls
            errorCorrection={errorCorrection}
            setErrorCorrection={setErrorCorrection}
            isGradient={isGradient}
            setIsGradient={setIsGradient}
            color1={color1}
            setColor1={setColor1}
            color2={color2}
            setColor2={setColor2}
            singleColor={singleColor}
            setSingleColor={setSingleColor}
            dotType={dotType}
            setDotType={setDotType}
            setIsRounded={setIsRounded}
            size={size}
            setSize={setSize}
          />

          <PresetGallery presets={savedPresets} onApply={handleApplyPreset} onDelete={deletePreset} />
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
