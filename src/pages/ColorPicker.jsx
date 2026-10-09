import { useState, useEffect, useRef } from 'react';
import { EyeDropperIcon as EyeDropper, CheckIcon as Check } from '@heroicons/react/24/solid';
import ColorHistoryGrid from './ColorPicker/ColorHistoryGrid';
import ColorSwatchesScheme from './ColorPicker/ColorSwatchesScheme';

export default function ColorPicker() {
  const [colors, setColors] = useState(() => {
    try {
      const saved = localStorage.getItem('colorPickerHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedColor, setCopiedColor] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isDropping, setIsDropping] = useState(false);
  const [useNative, setUseNative] = useState(true);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    // Check API support and OS
    const isWindows = navigator.userAgent.toLowerCase().includes('windows');
    if (!window.EyeDropper || isWindows) {
      setUseNative(false);
    }
  }, []);

  const saveColors = (newColors) => {
    setColors(newColors);
    localStorage.setItem('colorPickerHistory', JSON.stringify(newColors));
  };

  const handleFallbackColorChange = (e) => {
    const hex = e.target.value.toUpperCase();
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Add to history
      setColors(prev => {
        if (prev[0] === hex) return prev; // avoid immediate duplicate
        const newColors = [hex, ...prev.filter(c => c !== hex)];
        localStorage.setItem('colorPickerHistory', JSON.stringify(newColors));
        return newColors;
      });
      setSelectedColor(null);
      // Copy to clipboard
      navigator.clipboard.writeText(hex).then(() => {
        setCopiedColor(hex);
        setTimeout(() => setCopiedColor(null), 2000);
      }).catch(err => console.error("Clipboard copy failed", err));
    }, 600); // 600ms pause means they have finalized their color
  };

  const pickColor = async () => {
    if (!window.EyeDropper) {
      alert("Your browser does not support the EyeDropper API. Try using Chrome or Edge.");
      return;
    }
    
    setIsDropping(true);
    const abortController = new AbortController();
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open({ signal: abortController.signal });
      abortController.abort(); // Force cleanup of native modal window handle on Windows 11
      const hex = result.sRGBHex.toUpperCase();
      const newColors = [hex, ...colors.filter(c => c !== hex)];
      saveColors(newColors);
      setSelectedColor(null);
    } catch (e) {
      // User canceled the picker
      console.log("EyeDropper canceled", e);
    } finally {
      // Small timeout ensures the native picker fully closes before we re-enable the button
      setTimeout(() => setIsDropping(false), 200);
    }
  };

  const copyToClipboard = (color, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(color).then(() => {
      setCopiedColor(color);
      setSelectedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    });
  };

  const deleteColor = (colorToDelete, e) => {
    if (e) e.stopPropagation();
    const newColors = colors.filter(c => c !== colorToDelete);
    saveColors(newColors);
    if (selectedColor === colorToDelete) {
      setSelectedColor(null);
    }
  };

  const clearAll = () => {
    saveColors([]);
    setSelectedColor(null);
  };

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <EyeDropper style={{ width: 32, height: 32 }} /> Color Picker
          </h1>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            Pick any color from your screen using the native eyedropper, and save your palette history.
          </p>
        </div>
      </header>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div className="glass-panel" style={{ textAlign: 'center', padding: '1.5rem 2rem' }}>
          {!useNative && !window.EyeDropper && (
            <div style={{ background: 'rgba(255, 50, 50, 0.1)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '2rem', color: '#ff6b6b' }}>
              <strong>Browser Unsupported:</strong> The EyeDropper API is currently only supported in Chromium browsers (Chrome, Edge, Opera).
            </div>
          )}
          
          {useNative ? (
            <button 
              className="btn btn-primary" 
              onClick={pickColor}
              disabled={isDropping}
              style={{ fontSize: '1rem', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', borderRadius: '50px' }}
            >
              <EyeDropper style={{ width: 24, height: 24 }} /> 
              {isDropping ? 'Picking...' : 'Pick Color'}
            </button>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <input 
                type="color" 
                onChange={handleFallbackColorChange}
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  width: '100%', 
                  height: '100%', 
                  opacity: 0, 
                  cursor: 'pointer',
                  zIndex: 10
                }}
              />
              <button 
                className="btn btn-primary" 
                style={{ fontSize: '1rem', padding: '0.75rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', borderRadius: '50px', pointerEvents: 'none' }}
              >
                <EyeDropper style={{ width: 24, height: 24 }} /> 
                Pick Color
              </button>
            </div>
          )}
          
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>
            {useNative 
              ? "Clicking the button will open a magnifying glass. Click anywhere on your screen to capture the color."
              : "Click the button to open the color picker. You can use the eyedropper icon inside the dialog to pick from your screen."}
          </p>
        </div>

        <ColorHistoryGrid
          colors={colors}
          copiedColor={copiedColor}
          onCopy={copyToClipboard}
          onDelete={deleteColor}
          onClearAll={clearAll}
        />
      </div>
      
      {/* Toast Notification */}
      {copiedColor && (
        <div className="glass-panel animate-fade-in" style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          padding: '0.75rem 1.5rem',
          borderRadius: '50px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--accent-gradient)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          <Check style={{ width: 24, height: 24 }} />
          {copiedColor} copied to clipboard!
        </div>
      )}
      
      {colors.length > 0 && (
        <ColorSwatchesScheme
          baseColor={selectedColor || colors[0]}
          copiedColor={copiedColor}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  );
}
