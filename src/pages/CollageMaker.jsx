import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Squares2X2Icon } from '@heroicons/react/24/outline';
import { 
  RESOLUTION_PRESETS, 
  LAYOUT_TEMPLATES, 
  isLightColor, 
  calculateCellGeometries 
} from './CollageMaker/collageLayouts';
import { renderCollageToCanvas } from './CollageMaker/renderCollageToCanvas';
import { downloadBlob } from '../utils/downloadUtils';
import PhotoPoolCard from './CollageMaker/PhotoPoolCard';
import CanvasLayoutControls from './CollageMaker/CanvasLayoutControls';
import StyleControls from './CollageMaker/StyleControls';
import CollageWorkspace from './CollageMaker/CollageWorkspace';

export default function CollageMaker() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewContainerRef = useRef(null);

  // Theme Detection State
  const [, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
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

  const [borderWidth] = useState(0);
  const [borderColor] = useState('#ffffff');
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

  // Add Files helper
  const addFiles = useCallback((files) => {
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
  }, []);

  // Process dropped files from location state on mount
  useEffect(() => {
    if (location.state?.droppedFiles && location.state.droppedFiles.length > 0) {
      addFiles(location.state.droppedFiles);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addFiles]);

  // Handle Preset Resolution Changes
  const handlePresetChange = (newPreset) => {
    setPreset(newPreset);
    const found = RESOLUTION_PRESETS.find(p => p.id === newPreset);
    if (found && newPreset !== 'custom') {
      setCanvasWidth(found.width);
      setCanvasHeight(found.height);
    }
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

  // Re-render canvas whenever dependencies change
  useEffect(() => {
    renderCollageToCanvas(canvasRef.current, {
      photos,
      canvasWidth,
      canvasHeight,
      bgType,
      bgColor,
      borderRadius,
      borderWidth,
      borderColor,
      shadow,
      fillMode,
      computeCellGeometries
    });
  }, [photos, canvasWidth, canvasHeight, bgType, bgColor, borderRadius, borderWidth, borderColor, shadow, fillMode, computeCellGeometries]);

  // Export Download Handler
  const handleDownload = (format = 'png') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      downloadBlob(blob, `collage-${canvasWidth}x${canvasHeight}-${Date.now()}.${format}`);
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
          <PhotoPoolCard
            photos={photos}
            selectedPhotoId={selectedPhotoId}
            setSelectedPhotoId={setSelectedPhotoId}
            onShuffle={handleShuffle}
            onClearAll={handleClearAll}
            onAddFiles={addFiles}
            onRemovePhoto={handleRemovePhoto}
            fileInputRef={fileInputRef}
            folderInputRef={folderInputRef}
          />

          <CanvasLayoutControls
            preset={preset}
            onPresetChange={handlePresetChange}
            resolutionPresets={RESOLUTION_PRESETS}
            canvasWidth={canvasWidth}
            setCanvasWidth={setCanvasWidth}
            canvasHeight={canvasHeight}
            setCanvasHeight={setCanvasHeight}
            layoutType={layoutType}
            setLayoutType={setLayoutType}
            layoutTemplates={LAYOUT_TEMPLATES}
            fillMode={fillMode}
            setFillMode={setFillMode}
          />

          <StyleControls
            gap={gap}
            setGap={setGap}
            margin={margin}
            setMargin={setMargin}
            borderRadius={borderRadius}
            setBorderRadius={setBorderRadius}
            shadow={shadow}
            setShadow={setShadow}
            bgType={bgType}
            setBgType={setBgType}
            bgColor={bgColor}
            setBgColor={setBgColor}
            setUserHasCustomBg={setUserHasCustomBg}
          />
        </div>

        {/* RIGHT WORKSPACE / INTERACTIVE PREVIEW */}
        <CollageWorkspace
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          photos={photos}
          onDownload={handleDownload}
          canvasRef={canvasRef}
          previewContainerRef={previewContainerRef}
          previewBgStyle={previewBgStyle}
          fileInputRef={fileInputRef}
          emptyTitleColor={emptyTitleColor}
          emptySubtitleColor={emptySubtitleColor}
          previewCells={previewCells}
          selectedPhotoId={selectedPhotoId}
          setSelectedPhotoId={setSelectedPhotoId}
          isPanning={isPanning}
          panningPhotoId={panningPhotoId}
          onCellPointerDown={handleCellPointerDown}
          onCellPointerMove={handleCellPointerMove}
          onCellPointerUp={handleCellPointerUp}
          onCellWheel={handleCellWheel}
          borderRadius={borderRadius}
          shadow={shadow}
          borderWidth={borderWidth}
          borderColor={borderColor}
          fillMode={fillMode}
          updatePhoto={updatePhoto}
          onRemovePhoto={handleRemovePhoto}
        />

      </div>
    </div>
  );
}
