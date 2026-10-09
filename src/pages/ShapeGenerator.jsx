import { useState, useEffect, useCallback } from 'react';
import { RectangleGroupIcon, ArrowDownTrayIcon as Download, ClipboardDocumentIcon, CheckIcon as Check } from '@heroicons/react/24/solid';
import GradientEditor from '../components/GradientEditor';
import { downloadUrl, copyBlobToClipboard } from '../utils/downloadUtils';
import { renderShapeToTrimmedCanvas } from './ShapeGenerator/shapeCanvasUtils';
import ShapePresetsBar from './ShapeGenerator/ShapePresetsBar';

export default function ShapeGenerator() {
  const [shapeWidth, setShapeWidth] = useState(() => {
    const saved = localStorage.getItem('sg_shapeWidth');
    return saved !== null ? Number(saved) : 800;
  });
  const [shapeHeight, setShapeHeight] = useState(() => {
    const saved = localStorage.getItem('sg_shapeHeight');
    return saved !== null ? Number(saved) : 30;
  });
  const [borderRadius, setBorderRadius] = useState(() => {
    const saved = localStorage.getItem('sg_borderRadius');
    return saved !== null ? Number(saved) : 64;
  });
  const [blurRadius, setBlurRadius] = useState(() => {
    const saved = localStorage.getItem('sg_blurRadius');
    return saved !== null ? Number(saved) : 0;
  });
  const [glowMode, setGlowMode] = useState(() => {
    return localStorage.getItem('sg_glowMode') === 'true';
  });

  const [tintMode, setTintMode] = useState(() => {
    return localStorage.getItem('sg_tintMode') || 'gradient';
  });
  const [solidColor, setSolidColor] = useState(() => {
    return localStorage.getItem('sg_solidColor') || '#3b82f6';
  });
  
  const [gradStops, setGradStops] = useState(() => {
    const saved = localStorage.getItem('sg_gradStops');
    return saved ? JSON.parse(saved) : [
      { color: '#ef4444', position: 0 },
      { color: '#3b82f6', position: 1 }
    ];
  });
  const [gradDirection, setGradDirection] = useState(() => {
    return localStorage.getItem('sg_gradDirection') || 'to-bottom-right';
  });

  const [savedPresets, setSavedPresets] = useState(() => {
    const saved = localStorage.getItem('sg_savedPresets');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('sg_shapeWidth', shapeWidth);
    localStorage.setItem('sg_shapeHeight', shapeHeight);
    localStorage.setItem('sg_borderRadius', borderRadius);
    localStorage.setItem('sg_blurRadius', blurRadius);
    localStorage.setItem('sg_glowMode', glowMode);
    localStorage.setItem('sg_tintMode', tintMode);
    localStorage.setItem('sg_solidColor', solidColor);
    localStorage.setItem('sg_gradStops', JSON.stringify(gradStops));
    localStorage.setItem('sg_gradDirection', gradDirection);
  }, [shapeWidth, shapeHeight, borderRadius, blurRadius, glowMode, tintMode, solidColor, gradStops, gradDirection]);

  useEffect(() => {
    localStorage.setItem('sg_savedPresets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [actualWidth, setActualWidth] = useState(0);
  const [actualHeight, setActualHeight] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const renderShape = useCallback(() => {
    const trimmed = renderShapeToTrimmedCanvas({
      shapeWidth,
      shapeHeight,
      borderRadius,
      blurRadius,
      glowMode,
      tintMode,
      solidColor,
      gradStops,
      gradDirection
    });
    setActualWidth(trimmed.width);
    setActualHeight(trimmed.height);
    setPreviewUrl(trimmed.toDataURL('image/png'));
  }, [shapeWidth, shapeHeight, borderRadius, blurRadius, glowMode, tintMode, solidColor, gradStops, gradDirection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      renderShape();
    }, 150);
    return () => clearTimeout(timer);
  }, [renderShape]);

  const handleCopy = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const success = await copyBlobToClipboard(blob);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    downloadUrl(previewUrl, 'generated-shape.png');
  };

  const applyGooglePreset = () => {
    setTintMode('gradient');
    setGradStops([
      { color: '#4285F4', position: 0 },
      { color: '#4285F4', position: 0.4 },
      { color: '#34A853', position: 0.6 },
      { color: '#FBBC04', position: 0.8 },
      { color: '#EA4335', position: 0.9 }
    ]);
  };

  const applyNotebookLMPreset = () => {
    setTintMode('gradient');
    setGradStops([
      { color: '#42f067', position: 0 },
      { color: '#7182ff', position: 1 }
    ]);
  };

  const saveCurrentAsPreset = () => {
    const name = prompt('Enter a name for this preset:');
    if (!name) return;
    const newPreset = {
      id: Date.now().toString(),
      name,
      tintMode,
      solidColor,
      gradStops,
      gradDirection
    };
    setSavedPresets([...savedPresets, newPreset]);
  };

  const applyCustomPreset = (preset) => {
    setTintMode(preset.tintMode);
    if (preset.solidColor) setSolidColor(preset.solidColor);
    if (preset.gradStops) setGradStops(preset.gradStops);
    if (preset.gradDirection) setGradDirection(preset.gradDirection);
  };

  const deletePreset = (id) => {
    setSavedPresets(savedPresets.filter(p => p.id !== id));
  };

  const applyOceanPreset = () => {
    setTintMode('gradient');
    setGradStops([
      { color: '#2E3192', position: 0 },
      { color: '#1BFFFF', position: 1 }
    ]);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '0' }}>
        <h1>Shape Generator</h1>
      </div>

      {/* TOP: Preview Area */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', minHeight: '300px' }}>
        <div className="checkerboard-bg" style={{ 
          borderRadius: '8px', 
          overflow: 'hidden', 
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
          aspectRatio: actualWidth / actualHeight
        }}>
          {previewUrl && (
            <img 
              src={previewUrl} 
              alt="Shape Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '500px' }}
            />
          )}
        </div>
        
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', width: '100%', justifyContent: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Output Size: <strong>{actualWidth} x {actualHeight}</strong>
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="primary-btn" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              {copySuccess ? <Check style={{width: '16px', height: '16px'}} /> : <ClipboardDocumentIcon style={{width: '16px', height: '16px'}} />}
              {copySuccess ? 'Copied!' : 'Copy PNG'}
            </button>
            <button className="primary-btn outline" onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <Download style={{width: '16px', height: '16px'}} />
              Save PNG
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM: Controls (Grid Layout) */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          <RectangleGroupIcon style={{ width: '20px', height: '20px' }} />
          Shape Properties
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="slider-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Width:</label>
              <input type="number" min="1" max="4096" value={shapeWidth} onChange={e => setShapeWidth(Number(e.target.value))} className="text-input" style={{ width: '80px', padding: '0.2rem 0.5rem' }} />
            </div>
            <input type="range" min="16" max="2048" step="1" value={shapeWidth} onChange={e => setShapeWidth(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div className="slider-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Height:</label>
              <input type="number" min="1" max="4096" value={shapeHeight} onChange={e => setShapeHeight(Number(e.target.value))} className="text-input" style={{ width: '80px', padding: '0.2rem 0.5rem' }} />
            </div>
            <input type="range" min="16" max="2048" step="1" value={shapeHeight} onChange={e => setShapeHeight(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div className="slider-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Rounding:</label>
              <input type="number" min="0" max="2048" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} className="text-input" style={{ width: '80px', padding: '0.2rem 0.5rem' }} />
            </div>
            <input type="range" min="0" max={Math.max(1, Math.min(shapeWidth, shapeHeight)/2)} step="1" value={borderRadius} onChange={e => setBorderRadius(Number(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div className="slider-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Blur:</label>
              <input type="number" min="0" max="500" value={blurRadius} onChange={e => setBlurRadius(Number(e.target.value))} className="text-input" style={{ width: '80px', padding: '0.2rem 0.5rem' }} />
            </div>
            <input type="range" min="0" max="200" step="1" value={blurRadius} onChange={e => setBlurRadius(Number(e.target.value))} style={{ width: '100%' }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={glowMode} onChange={e => setGlowMode(e.target.checked)} style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px' }} />
              Keep shape solid over blur (Glow Effect)
            </label>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent-color)' }}>
          Fill Style
        </h3>
        
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="tintMode" 
              value="solid" 
              checked={tintMode === 'solid'} 
              onChange={() => setTintMode('solid')}
              style={{ accentColor: 'var(--accent-color)' }}
            />
            Solid
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="tintMode" 
              value="gradient" 
              checked={tintMode === 'gradient'} 
              onChange={() => setTintMode('gradient')}
              style={{ accentColor: 'var(--accent-color)' }}
            />
            Gradient
          </label>
        </div>

        {tintMode === 'solid' ? (
          <div className="color-picker-group" style={{ maxWidth: '300px' }}>
            <label>Color</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="color" value={solidColor} onChange={e => setSolidColor(e.target.value)} style={{ width: '50px', height: '40px', padding: '0', cursor: 'pointer', background: 'none', border: 'none' }} />
              <input type="text" value={solidColor} onChange={e => setSolidColor(e.target.value)} className="text-input" style={{ flex: 1 }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ShapePresetsBar
              onApplyGooglePreset={applyGooglePreset}
              onApplyNotebookLMPreset={applyNotebookLMPreset}
              onApplyOceanPreset={applyOceanPreset}
              savedPresets={savedPresets}
              onApplyCustomPreset={applyCustomPreset}
              onDeletePreset={deletePreset}
              onSaveCurrentAsPreset={saveCurrentAsPreset}
              gradDirection={gradDirection}
              setGradDirection={setGradDirection}
            />

            <GradientEditor stops={gradStops} onChange={setGradStops} />
          </div>
        )}
      </div>
    </div>
  );
}
