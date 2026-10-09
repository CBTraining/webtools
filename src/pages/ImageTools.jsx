import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  PhotoIcon as ImageIcon, 
  CloudArrowUpIcon as UploadCloud 
} from '@heroicons/react/24/solid';
import Dropzone from '../components/Dropzone';
import { downloadBlob, copyBlobToClipboard } from '../utils/downloadUtils';
import { applyImageCanvasFilters } from './ImageTools/canvasFilters';
import BlurControls from './ImageTools/BlurControls';
import ColorAdjustControls from './ImageTools/ColorAdjustControls';
import TransformControls from './ImageTools/TransformControls';
import ImagePreviewPanel from './ImageTools/ImagePreviewPanel';

export default function ImageTools() {
  const location = useLocation();
  const [imageFile, setImageFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [naturalWidth, setNaturalWidth] = useState(800);
  const [naturalHeight, setNaturalHeight] = useState(600);
  
  // Dimensions & Aspect Ratio
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [radius, setRadius] = useState(0);

  // Blur Effects
  const [gaussianBlur, setGaussianBlur] = useState(0);   // 0px - 40px
  const [radialBlur, setRadialBlur] = useState(0);       // 0 - 40
  const [radialCenterX, setRadialCenterX] = useState(50); // 0% - 100%
  const [radialCenterY, setRadialCenterY] = useState(50); // 0% - 100%

  // Light & Color Adjustments
  const [brightness, setBrightness] = useState(100);     // 0% - 200%
  const [contrast, setContrast] = useState(100);         // 0% - 200%
  const [saturation, setSaturation] = useState(100);     // 0% - 200%
  const [grayscale, setGrayscale] = useState(0);         // 0% - 100%
  const [sepia, setSepia] = useState(0);                 // 0% - 100%
  const [hue, setHue] = useState(0);                     // -180deg to +180deg
  const [invert, setInvert] = useState(0);               // 0% - 100%

  // Transform
  const [rotation, setRotation] = useState(0);           // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Output
  const [quality, setQuality] = useState(0.92);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const canvasRef = useRef(null);
  const loadedImgRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  // Load a file into memory and cache the image element
  const loadFile = (file) => {
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImgRef.current = img;
      const nw = img.naturalWidth || img.width;
      const nh = img.naturalHeight || img.height;
      setNaturalWidth(nw);
      setNaturalHeight(nh);
      setWidth(nw);
      setHeight(nh);
    };
    img.src = url;
  };

  // Load from location.state if navigated via drag or Send To
  useEffect(() => {
    if (location.state?.imageFile) {
      loadFile(location.state.imageFile);
      window.history.replaceState({}, document.title);
    } else if (location.state?.previewUrl || location.state?.imageUrl) {
      const url = location.state.previewUrl || location.state.imageUrl;
      setImageSrc(url);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImgRef.current = img;
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        setNaturalWidth(nw);
        setNaturalHeight(nh);
        setWidth(nw);
        setHeight(nh);
      };
      img.src = url;
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleWidthChange = (newWidth) => {
    setWidth(newWidth);
    if (lockAspect && naturalWidth > 0) {
      setHeight(Math.round(newWidth * (naturalHeight / naturalWidth)));
    }
  };

  const handleHeightChange = (newHeight) => {
    setHeight(newHeight);
    if (lockAspect && naturalHeight > 0) {
      setWidth(Math.round(newHeight * (naturalWidth / naturalHeight)));
    }
  };

  // Reset all adjustments
  const resetFilters = () => {
    setGaussianBlur(0);
    setRadialBlur(0);
    setRadialCenterX(50);
    setRadialCenterY(50);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
    setHue(0);
    setInvert(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setRadius(0);
    if (naturalWidth > 0) {
      setWidth(naturalWidth);
      setHeight(naturalHeight);
    }
  };

  // 60fps instant direct canvas rendering
  const renderCanvas = useCallback(() => {
    applyImageCanvasFilters({
      canvas: canvasRef.current,
      img: loadedImgRef.current,
      width,
      height,
      radius,
      gaussianBlur,
      radialBlur,
      radialCenterX,
      radialCenterY,
      brightness,
      contrast,
      saturation,
      grayscale,
      sepia,
      hue,
      invert,
      rotation,
      flipH,
      flipV
    });
  }, [width, height, radius, gaussianBlur, radialBlur, radialCenterX, radialCenterY, brightness, contrast, saturation, grayscale, sepia, hue, invert, rotation, flipH, flipV]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas, naturalWidth, naturalHeight]);

  const handleCanvasClick = (e) => {
    if (radialBlur <= 0 || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const pctY = Math.max(0, Math.min(100, Math.round((clickY / rect.height) * 100)));
    setRadialCenterX(pctX);
    setRadialCenterY(pctY);
  };

  const handleDownload = (format = 'png') => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : format;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const baseName = imageFile?.name ? imageFile.name.replace(/\.[^/.]+$/, "") : 'edited-image';
      downloadBlob(blob, `${baseName}_edited.${ext}`);
    }, mime, quality);
  };

  const handleCopy = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const success = await copyBlobToClipboard(blob);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }, 'image/png');
  };

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div className="page-header">
        <ImageIcon style={{ width: 32, height: 32, fill: "url(#accent-grad)" }} />
        <h1>Image Editor</h1>
      </div>
      <p style={{ marginTop: '-0.5rem', color: 'var(--text-secondary)' }}>
        Adjust blur (Gaussian & Radial), lighting, colors, rotation, and dimensions in one unified editor with instant 60fps preview.
      </p>

      {!imageSrc ? (
        <div className="glass-panel" style={{ padding: '3rem 2rem', borderStyle: 'dashed', borderColor: 'var(--border-color)', borderWidth: '2px', background: 'transparent' }}>
          <Dropzone 
            onDrop={(files) => {
              const file = Array.isArray(files) ? files[0] : files;
              loadFile(file);
            }}
            accept="image/*"
            title="Upload Image to Edit"
            subtitle="Drag & drop any JPG, PNG, WEBP, or SVG, or click to browse"
            icon={<UploadCloud style={{ width: 48, height: 48, color: 'var(--accent-color)' }} />}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(330px, 400px) 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Single Unified Controls Column */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '85vh', overflowY: 'auto' }}>
            
            {/* Section 1: Blur Effects */}
            <BlurControls
              gaussianBlur={gaussianBlur}
              setGaussianBlur={setGaussianBlur}
              radialBlur={radialBlur}
              setRadialBlur={setRadialBlur}
              radialCenterX={radialCenterX}
              setRadialCenterX={setRadialCenterX}
              radialCenterY={radialCenterY}
              setRadialCenterY={setRadialCenterY}
            />

            {/* Section 2: Light & Color Adjustments */}
            <ColorAdjustControls
              brightness={brightness}
              setBrightness={setBrightness}
              contrast={contrast}
              setContrast={setContrast}
              saturation={saturation}
              setSaturation={setSaturation}
              grayscale={grayscale}
              setGrayscale={setGrayscale}
              sepia={sepia}
              setSepia={setSepia}
              hue={hue}
              setHue={setHue}
              invert={invert}
              setInvert={setInvert}
            />

            {/* Section 3: Transform, Scaling & Corners */}
            <TransformControls
              width={width}
              height={height}
              naturalWidth={naturalWidth}
              naturalHeight={naturalHeight}
              lockAspect={lockAspect}
              setLockAspect={setLockAspect}
              onWidthChange={handleWidthChange}
              onHeightChange={handleHeightChange}
              setWidth={setWidth}
              setHeight={setHeight}
              radius={radius}
              setRadius={setRadius}
              rotation={rotation}
              setRotation={setRotation}
              flipH={flipH}
              setFlipH={setFlipH}
              flipV={flipV}
              setFlipV={setFlipV}
              quality={quality}
              setQuality={setQuality}
              onResetFilters={resetFilters}
              onNewImage={() => { setImageSrc(null); setImageFile(null); loadedImgRef.current = null; }}
            />

          </div>

          {/* Preview & Export Column */}
          <ImagePreviewPanel
            rotation={rotation}
            width={width}
            height={height}
            showOriginal={showOriginal}
            setShowOriginal={setShowOriginal}
            onCanvasClick={handleCanvasClick}
            radialBlur={radialBlur}
            imageSrc={imageSrc}
            canvasRef={canvasRef}
            onDownload={handleDownload}
            onCopy={handleCopy}
            copySuccess={copySuccess}
            imageFile={imageFile}
          />

        </div>
      )}
    </div>
  );
}
