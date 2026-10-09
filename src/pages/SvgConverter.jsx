import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  CommandLineIcon as FileCode2, 
  ArrowDownTrayIcon as Download, 
  ClipboardDocumentIcon, 
  CheckIcon as Check 
} from '@heroicons/react/24/solid';
import SendToDropdown from '../components/SendToDropdown';
import { downloadUrl, copyBlobToClipboard } from '../utils/downloadUtils';
import { parseSvgDimensions } from './SvgConverter/svgParser';
import { rasterizeSvgToBlob } from './SvgConverter/svgRasterizer';
import DimensionControls from './SvgConverter/DimensionControls';
import ColorTintControls from './SvgConverter/ColorTintControls';

export default function SvgConverter() {
  const location = useLocation();
  const [svgText, setSvgText] = useState(location.state?.svgText || '');
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [keepProportions, setKeepProportions] = useState(true);
  const canvasRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [applyTint, setApplyTint] = useState(false);
  const [tintMode, setTintMode] = useState('solid'); // 'solid' or 'gradient'
  const [solidColor, setSolidColor] = useState('#3b82f6');
  const [gradStart, setGradStart] = useState('#ef4444');
  const [gradEnd, setGradEnd] = useState('#3b82f6');
  const [gradDirection, setGradDirection] = useState('to-bottom-right');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (location.state?.svgText) {
      setSvgText(location.state.svgText);
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.svgText]);

  // Robust SVG Dimension & Native Aspect Ratio Parser
  useEffect(() => {
    const dims = parseSvgDimensions(svgText);
    if (dims.width && dims.height && dims.aspectRatio) {
      setAspectRatio(dims.aspectRatio);
      const targetW = 512;
      const targetH = Math.round(targetW / dims.aspectRatio);
      setWidth(targetW);
      setHeight(targetH);
    }
  }, [svgText]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleConvert = useCallback(() => {
    rasterizeSvgToBlob({
      canvas: canvasRef.current,
      svgText,
      width,
      height,
      keepProportions,
      applyTint,
      tintMode,
      solidColor,
      gradStart,
      gradEnd,
      gradDirection
    }).then((pngBlob) => {
      if (!pngBlob) return;
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(pngBlob);
      });
    });
  }, [svgText, width, height, keepProportions, applyTint, tintMode, solidColor, gradStart, gradEnd, gradDirection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleConvert();
    }, 150);
    return () => clearTimeout(timer);
  }, [handleConvert]);

  const handleDownload = () => {
    if (!previewUrl) return;
    downloadUrl(previewUrl, `vector-${width}x${height}.png`);
  };

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const success = await copyBlobToClipboard(blob);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } else {
        alert("Failed to copy image to clipboard.");
      }
    } catch (err) {
      console.error("Failed to copy", err);
      alert("Failed to copy image to clipboard.");
    }
  };

  const loadSvgFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSvgText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    loadSvgFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    let file = null;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      if (e.dataTransfer.items[0].kind === 'file') {
        file = e.dataTransfer.items[0].getAsFile();
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    }
    
    if (file) {
      loadSvgFile(file);
      return;
    }
    
    const textData = e.dataTransfer.getData('text');
    if (textData) {
      setSvgText(textData);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <FileCode2 />
        <h1>SVG Converter</h1>
      </div>
      <p>Upload or paste SVG vector graphics, scale to any resolution without stretching, apply solid/gradient color overrides, and export as transparent PNGs.</p>

      <div className="grid-container">
        <div 
          className="glass-panel controls"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ 
            border: isDragging ? '2px dashed var(--primary-color)' : '',
            backgroundColor: isDragging ? 'var(--bg-tertiary)' : ''
          }}
        >
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>SVG Code</label>
              <label className="btn" style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem', cursor: 'pointer', background: 'var(--bg-tertiary)' }}>
                Upload .svg File
                <input 
                  type="file" 
                  accept=".svg" 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
            <textarea 
              className="input-field"
              style={{ 
                minHeight: '200px', 
                fontFamily: 'monospace'
              }}
              value={svgText}
              onChange={(e) => setSvgText(e.target.value)}
              placeholder="<svg>...</svg> or drag & drop a .svg file anywhere in this panel"
            />
          </div>

          {/* Width, Height, Height Presets & Keep Proportions */}
          <DimensionControls
            width={width}
            setWidth={setWidth}
            height={height}
            setHeight={setHeight}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            keepProportions={keepProportions}
            setKeepProportions={setKeepProportions}
          />

          {/* Color Tint Controls */}
          <ColorTintControls
            applyTint={applyTint}
            setApplyTint={setApplyTint}
            tintMode={tintMode}
            setTintMode={setTintMode}
            solidColor={solidColor}
            setSolidColor={setSolidColor}
            gradStart={gradStart}
            setGradStart={setGradStart}
            gradEnd={gradEnd}
            setGradEnd={setGradEnd}
            gradDirection={gradDirection}
            setGradDirection={setGradDirection}
          />
        </div>

        <div className="glass-panel preview-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {previewUrl ? (
            <div className="preview-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div 
                className="canvas-container"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '400px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.08) 75%) #090d16',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                }}
              >
                <img 
                  src={previewUrl} 
                  alt="Converted SVG PNG Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '360px', 
                    objectFit: 'contain'
                  }} 
                />
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Resolution: <strong>{width} x {height} px</strong>
              </div>

              <div className="button-group" style={{ width: '100%', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleDownload}>
                  <Download style={{ width: 18, height: 18 }} /> Download PNG
                </button>
                <button className="btn" onClick={handleCopy}>
                  {copySuccess ? <Check style={{ width: 18, height: 18, color: '#10b981' }} /> : <ClipboardDocumentIcon style={{ width: 18, height: 18 }} />}
                  {copySuccess ? 'Copied!' : 'Copy PNG'}
                </button>
                <SendToDropdown svgText={svgText} imageUrl={previewUrl} mediaType="svg" />
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              Enter SVG code or upload a file to generate a live PNG preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
