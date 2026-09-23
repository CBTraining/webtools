import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  PhotoIcon, 
  PlusIcon, 
  ArrowPathIcon, 
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  Squares2X2Icon,
  FolderPlusIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';
import { 
  RESOLUTION_PRESETS, 
  LAYOUT_TEMPLATES, 
  isLightColor, 
  calculateCellGeometries 
} from './CollageMaker/collageLayouts';

export default function CollageMaker() {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewContainerRef = useRef(null);

  // Theme Detection State
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  const [userHasCustomBg, setUserHasCustomBg] = useState(false);

  // Photos State: array of { id, file, url, width, height, panX, panY, zoom }
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);

  // Resolution State
  const [preset, setPreset] = useState('landscape-1080p');
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);

  // Layout & Styling State
  const [layoutType, setLayoutType] = useState('justified');
  const [gap, setGap] = useState(0);
  const [margin, setMargin] = useState(0);
  const [borderRadius, setBorderRadius] = useState(0);
  const [fillMode, setFillMode] = useState('cover'); // 'cover' | 'contain'
  const [bgType, setBgType] = useState('transparent'); // 'transparent' | 'solid'
  
  // Default background color adapts to theme unless user explicitly picks a custom color
  const [bgColor, setBgColor] = useState(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    return currentTheme === 'light' ? '#ffffff' : '#0f172a';
  });

  const [borderWidth, setBorderWidth] = useState(0);
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [shadow, setShadow] = useState(0);

  // Interactive Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panningPhotoId, setPanningPhotoId] = useState(null);

  // Observe theme changes on documentElement
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
      if (!userHasCustomBg) {
        setBgColor(currentTheme === 'light' ? '#ffffff' : '#0f172a');
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [userHasCustomBg]);

  // Process dropped files from location state on mount
  useEffect(() => {
    if (location.state?.droppedFiles && location.state.droppedFiles.length > 0) {
      addFiles(location.state.droppedFiles);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle Preset Resolution Changes
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    const found = RESOLUTION_PRESETS.find(p => p.id === newPreset);
    if (found && newPreset !== 'custom') {
      setCanvasWidth(found.width);
      setCanvasHeight(found.height);
    }
  };

  // Add Files helper
  const addFiles = (files) => {
    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(file.name));
    if (fileArray.length === 0) return;

    fileArray.forEach(file => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setPhotos(prev => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            url,
            width: img.width,
            height: img.height,
            panX: 0,
            panY: 0,
            zoom: 1.0
          }
        ]);
      };
      img.src = url;
    });
  };

  // Remove Photo
  const handleRemovePhoto = (id, e) => {
    if (e) e.stopPropagation();
    setPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === id);
      if (photoToRemove?.url) URL.revokeObjectURL(photoToRemove.url);
      return prev.filter(p => p.id !== id);
    });
    if (selectedPhotoId === id) setSelectedPhotoId(null);
  };

  // Clear All Photos
  const handleClearAll = () => {
    photos.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
    setPhotos([]);
    setSelectedPhotoId(null);
  };

  // Shuffle Photo Order
  const handleShuffle = () => {
    setPhotos(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  // Update specific photo state (pan/zoom)
  const updatePhoto = (id, key, val) => {
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, [key]: val } : p));
  };

  // Calculate cell geometries based on layout template, count, and photos' aspect ratios
  const computeCellGeometries = useCallback((count, width, height) => {
    return calculateCellGeometries(count, width, height, { layoutType, margin, gap, photos });
  }, [layoutType, gap, margin, photos]);

  // Offscreen Canvas Renderer
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear Canvas (Leaves 100% transparent PNG background if bgType === 'transparent')
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render Background if Solid Color is selected
    if (bgType === 'solid') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    const cells = computeCellGeometries(photos.length, canvasWidth, canvasHeight);

    // Draw cells
    photos.forEach((photo, idx) => {
      const cell = cells[idx];
      if (!cell) return;

      const img = new Image();
      img.src = photo.url;
      if (!img.complete) return;

      ctx.save();

      // Translate to cell center for rotation
      const cx = cell.x + cell.width / 2;
      const cy = cell.y + cell.height / 2;
      ctx.translate(cx, cy);
      if (cell.angle) ctx.rotate((cell.angle * Math.PI) / 180);
      ctx.translate(-cx, -cy);

      // Draw Shadow if enabled
      if (shadow > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = shadow * 2;
        ctx.shadowOffsetY = shadow;
      }

      // Rounded Corner Path
      ctx.beginPath();
      const r = Math.min(borderRadius, cell.width / 2, cell.height / 2);
      ctx.roundRect(cell.x, cell.y, cell.width, cell.height, r);
      ctx.clip();

      // Draw Photo within Cell (Fill Mode & Crop Pan)
      const imgAspect = img.width / img.height;
      const cellAspect = cell.width / cell.height;

      let drawW, drawH;
      if (fillMode === 'cover') {
        if (imgAspect > cellAspect) {
          drawH = cell.height * photo.zoom;
          drawW = drawH * imgAspect;
        } else {
          drawW = cell.width * photo.zoom;
          drawH = drawW / imgAspect;
        }
      } else { // contain
        if (imgAspect > cellAspect) {
          drawW = cell.width * photo.zoom;
          drawH = drawW / imgAspect;
        } else {
          drawH = cell.height * photo.zoom;
          drawW = drawH * imgAspect;
        }
      }

      const drawX = cell.x + (cell.width - drawW) / 2 + (photo.panX * cell.width) / 100;
      const drawY = cell.y + (cell.height - drawH) / 2 + (photo.panY * cell.height) / 100;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Draw Border
      if (borderWidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth * 2;
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [photos, canvasWidth, canvasHeight, bgType, bgColor, borderRadius, borderWidth, borderColor, shadow, fillMode, computeCellGeometries]);

  // Re-render canvas whenever dependencies change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Export Download Handler
  const handleDownload = (format = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collage-${canvasWidth}x${canvasHeight}-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    }, `image/${format}`);
  };

  // Cell Geometries for CSS Overlay preview
  const previewCells = computeCellGeometries(photos.length, canvasWidth, canvasHeight);

  // Pan / Crop Drag Handlers
  const handleCellPointerDown = (photoId, e) => {
    e.stopPropagation();
    setIsPanning(true);
    setPanningPhotoId(photoId);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleCellPointerMove = (e) => {
    if (!isPanning || !panningPhotoId) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    setPanStart({ x: e.clientX, y: e.clientY });

    const photo = photos.find(p => p.id === panningPhotoId);
    if (photo) {
      updatePhoto(panningPhotoId, 'panX', Math.max(-100, Math.min(100, photo.panX + dx * 0.15)));
      updatePhoto(panningPhotoId, 'panY', Math.max(-100, Math.min(100, photo.panY + dy * 0.15)));
    }
  };

  const handleCellPointerUp = () => {
    setIsPanning(false);
    setPanningPhotoId(null);
  };

  // Mouse Wheel Zoom Handler
  const handleCellWheel = (photoId, e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const newZoom = Math.max(0.4, Math.min(4.0, photo.zoom + delta));
    updatePhoto(photoId, 'zoom', parseFloat(newZoom.toFixed(2)));
  };

  // Contrast calculation for empty state text
  const emptyTitleColor = bgType === 'transparent' ? 'var(--text-primary)' : (isLightColor(bgColor) ? '#0f172a' : '#f8fafc');
  const emptySubtitleColor = bgType === 'transparent' ? 'var(--text-secondary)' : (isLightColor(bgColor) ? '#475569' : '#94a3b8');

  // Preview container background style
  const previewBgStyle = bgType === 'transparent' ? {
    backgroundImage: 'conic-gradient(#80808022 90deg, transparent 90deg 180deg, #80808022 180deg 270deg, transparent 270deg)',
    backgroundSize: '24px 24px',
    backgroundColor: 'var(--bg-secondary)'
  } : {
    backgroundColor: bgColor
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Squares2X2Icon style={{ width: 32, height: 32, color: 'var(--primary-color)' }} />
          <div>
            <h1 style={{ margin: 0 }}>Collage Maker</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Create stunning custom photo collages with interactive layouts, custom resolutions, and fine cropping.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT CONTROL SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* PHOTO POOL & UPLOAD CARD */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PhotoIcon style={{ width: 20, height: 20, color: 'var(--primary-color)' }} />
                Photos ({photos.length})
              </h3>
              {photos.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary" onClick={handleShuffle} title="Shuffle layout order" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>
                    <ArrowPathIcon style={{ width: 14, height: 14 }} />
                  </button>
                  <button className="btn btn-secondary" onClick={handleClearAll} title="Clear all photos" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)' }}>
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Dropzone Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => fileInputRef.current?.click()} 
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
              >
                <PlusIcon style={{ width: 16, height: 16 }} /> Add Photos
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => folderInputRef.current?.click()} 
                style={{ padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Add entire folder of photos"
              >
                <FolderPlusIcon style={{ width: 16, height: 16 }} /> Folder
              </button>

              <input 
                ref={fileInputRef} 
                type="file" 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => addFiles(e.target.files)} 
              />
              <input 
                ref={folderInputRef} 
                type="file" 
                multiple 
                accept="image/*" 
                webkitdirectory="" 
                style={{ display: 'none' }} 
                onChange={(e) => addFiles(e.target.files)} 
              />
            </div>

            {/* Thumbnail Grid Pool with X Delete buttons */}
            {photos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {photos.map((photo, idx) => (
                  <div 
                    key={photo.id} 
                    onClick={() => setSelectedPhotoId(photo.id)}
                    style={{ 
                      position: 'relative', 
                      aspectRatio: '1', 
                      borderRadius: 'var(--border-radius-sm)', 
                      overflow: 'hidden', 
                      border: selectedPhotoId === photo.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <img src={photo.url} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      onClick={(e) => handleRemovePhoto(photo.id, e)} 
                      style={{
                        position: 'absolute',
                        top: 2, right: 2,
                        background: 'rgba(0,0,0,0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        color: '#fff',
                        width: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                      title="Remove Photo"
                    >
                      <XMarkIcon style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '1.5rem 1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Drop photos or folders anywhere, or click Add Photos to begin.
              </div>
            )}
          </div>

          {/* RESOLUTION & LAYOUT CARD */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AdjustmentsHorizontalIcon style={{ width: 20, height: 20, color: 'var(--primary-color)' }} />
              Canvas & Layout
            </h3>

            {/* Resolution Preset */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Resolution Preset</label>
              <select 
                className="input-field" 
                value={preset} 
                onChange={(e) => handlePresetChange(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
              >
                {RESOLUTION_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Custom W x H */}
            {preset === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Width (px)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={canvasWidth} 
                    onChange={(e) => setCanvasWidth(Math.max(100, parseInt(e.target.value) || 100))}
                    style={{ width: '100%', padding: '0.4rem' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Height (px)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={canvasHeight} 
                    onChange={(e) => setCanvasHeight(Math.max(100, parseInt(e.target.value) || 100))}
                    style={{ width: '100%', padding: '0.4rem' }} 
                  />
                </div>
              </div>
            )}

            {/* Layout Template Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Layout Setup</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', marginTop: '0.4rem' }}>
                {LAYOUT_TEMPLATES.map(t => (
                  <button 
                    key={t.id}
                    className={`btn ${layoutType === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setLayoutType(t.id)}
                    style={{ padding: '0.4rem 0.2rem', fontSize: '0.75rem', textAlign: 'center' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fill Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Photo Fit Mode</span>
              <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)' }}>
                <button 
                  className={`btn ${fillMode === 'cover' ? 'btn-primary' : ''}`}
                  onClick={() => setFillMode('cover')}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >Crop (Cover)</button>
                <button 
                  className={`btn ${fillMode === 'contain' ? 'btn-primary' : ''}`}
                  onClick={() => setFillMode('contain')}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >Fit (Contain)</button>
              </div>
            </div>
          </div>

          {/* STYLING & MARGINS CARD */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SparklesIcon style={{ width: 20, height: 20, color: 'var(--primary-color)' }} />
              Style & Spacing
            </h3>

            {/* Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Photo Spacing</span>
                  <span>{gap}px</span>
                </div>
                <input type="range" min="0" max="60" value={gap} onChange={(e) => setGap(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Outer Margin</span>
                  <span>{margin}px</span>
                </div>
                <input type="range" min="0" max="80" value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Corner Rounding</span>
                  <span>{borderRadius}px</span>
                </div>
                <input type="range" min="0" max="60" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Photo Shadow</span>
                  <span>{shadow}px</span>
                </div>
                <input type="range" min="0" max="30" value={shadow} onChange={(e) => setShadow(parseInt(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>

            {/* Background Style Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Background</span>
                <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-primary)', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)' }}>
                  <button 
                    className={`btn ${bgType === 'transparent' ? 'btn-primary' : ''}`}
                    onClick={() => setBgType('transparent')}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  >Transparent</button>
                  <button 
                    className={`btn ${bgType === 'solid' ? 'btn-primary' : ''}`}
                    onClick={() => setBgType('solid')}
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  >Color Hex</button>
                </div>
              </div>

              {bgType === 'solid' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color Hex</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => { setBgColor(e.target.value); setUserHasCustomBg(true); }} 
                      style={{ border: 'none', background: 'transparent', width: 28, height: 28, cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="input-field"
                      value={bgColor} 
                      onChange={(e) => { setBgColor(e.target.value); setUserHasCustomBg(true); }} 
                      style={{ width: 85, padding: '0.2rem 0.4rem', fontSize: '0.75rem', fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT WORKSPACE / INTERACTIVE PREVIEW */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Action Bar & Resolution Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Canvas Output: {canvasWidth} × {canvasHeight} px
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>
                ({photos.length} photo{photos.length !== 1 ? 's' : ''})
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => handleDownload('png')}
                disabled={photos.length === 0}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <ArrowDownTrayIcon style={{ width: 18, height: 18 }} /> Save PNG
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => handleDownload('jpeg')}
                disabled={photos.length === 0}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                Save JPG
              </button>
            </div>
          </div>

          {/* Hidden Offscreen Export Canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Interactive Preview Work Area */}
          <div 
            ref={previewContainerRef}
            onPointerMove={handleCellPointerMove}
            onPointerUp={handleCellPointerUp}
            style={{ 
              width: '100%', 
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              maxHeight: '70vh',
              ...previewBgStyle,
              borderRadius: 'var(--border-radius-sm)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              border: '1px solid var(--border-color)',
              margin: '0 auto',
              userSelect: 'none'
            }}
          >
            {photos.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  padding: '2rem'
                }}
              >
                <PhotoIcon style={{ width: 64, height: 64, color: 'var(--primary-color)', opacity: 0.8 }} />
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: 0, color: emptyTitleColor, transition: 'color 0.2s' }}>Your Collage Canvas</h3>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: emptySubtitleColor, transition: 'color 0.2s' }}>Click or drop photos/folders to assemble your collage.</p>
                </div>
              </div>
            ) : (
              previewCells.map((cell, idx) => {
                const photo = photos[idx];
                if (!photo) return null;
                const isSelected = selectedPhotoId === photo.id;

                // Scale percent to parent container width
                const pctX = (cell.x / canvasWidth) * 100;
                const pctY = (cell.y / canvasHeight) * 100;
                const pctW = (cell.width / canvasWidth) * 100;
                const pctH = (cell.height / canvasHeight) * 100;

                return (
                  <div
                    key={photo.id}
                    onPointerDown={(e) => handleCellPointerDown(photo.id, e)}
                    onWheel={(e) => handleCellWheel(photo.id, e)}
                    onClick={() => setSelectedPhotoId(photo.id)}
                    style={{
                      position: 'absolute',
                      left: `${pctX}%`,
                      top: `${pctY}%`,
                      width: `${pctW}%`,
                      height: `${pctH}%`,
                      borderRadius: `${(borderRadius / canvasWidth) * 100}%`,
                      transform: cell.angle ? `rotate(${cell.angle}deg)` : 'none',
                      overflow: 'hidden',
                      cursor: isPanning && panningPhotoId === photo.id ? 'grabbing' : 'grab',
                      boxShadow: shadow > 0 ? `0 ${shadow}px ${shadow*2}px rgba(0,0,0,0.3)` : 'none',
                      border: isSelected ? '2px solid var(--primary-color)' : borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none'
                    }}
                  >
                    {/* Render Image with Pan & Zoom transform */}
                    <img 
                      src={photo.url} 
                      alt={`Collage Item ${idx}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: fillMode,
                        transform: `translate(${photo.panX}%, ${photo.panY}%) scale(${photo.zoom})`,
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Cell Overlay Controls on Selection */}
                    {isSelected && (
                      <div 
                        style={{
                          position: 'absolute',
                          top: 6, right: 6,
                          display: 'flex',
                          gap: '0.3rem',
                          background: 'rgba(0,0,0,0.7)',
                          padding: '0.2rem 0.4rem',
                          borderRadius: 'var(--border-radius-sm)',
                          zIndex: 10
                        }}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); updatePhoto(photo.id, 'zoom', Math.min(4, photo.zoom + 0.15)); }}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                          title="Zoom In"
                        >
                          <MagnifyingGlassPlusIcon style={{ width: 14, height: 14 }} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updatePhoto(photo.id, 'zoom', Math.max(0.4, photo.zoom - 0.15)); }}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                          title="Zoom Out"
                        >
                          <MagnifyingGlassMinusIcon style={{ width: 14, height: 14 }} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); updatePhoto(photo.id, 'panX', 0); updatePhoto(photo.id, 'panY', 0); updatePhoto(photo.id, 'zoom', 1.0); }}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                          title="Reset Crop & Pan"
                        >
                          <ArrowPathIcon style={{ width: 14, height: 14 }} />
                        </button>
                        <button 
                          onClick={(e) => handleRemovePhoto(photo.id, e)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                          title="Remove Photo"
                        >
                          <XMarkIcon style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Tip: Drag directly on any photo to adjust pan, or use your mouse scroll wheel over a photo to zoom in & out.
          </div>
        </div>

      </div>
    </div>
  );
}
