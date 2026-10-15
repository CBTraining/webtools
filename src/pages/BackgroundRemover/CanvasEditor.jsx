import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AdjustmentsHorizontalIcon,
  SwatchIcon,
  PaintBrushIcon
} from '@heroicons/react/24/solid';
import { ArrowDownTrayIcon as Download } from '@heroicons/react/24/outline';
import SendToDropdown from '../../components/SendToDropdown';
import { downloadBlob } from '../../utils/downloadUtils';
import {
  sampleColorsAlongLine,
  computeColorKeyImageData,
  renderCutoutComposite
} from './utils/imageMath';
import RefineTab from './tabs/RefineTab';
import BackdropTab from './tabs/BackdropTab';
import BrushTab from './tabs/BrushTab';
import ColorKeyTab from './tabs/ColorKeyTab';

const EDITOR_TABS = [
  { id: 'refine', label: 'Edge Refine (Anti-Halo)', Icon: AdjustmentsHorizontalIcon },
  { id: 'backdrop', label: 'Studio Backdrop & Blur', Icon: SwatchIcon },
  { id: 'brush', label: 'Manual Brush', Icon: PaintBrushIcon },
  { id: 'colorkey', label: '🎯 3D Color Keyer', Icon: null }
];

export default function CanvasEditor({ originalUrl, resultUrl, fileName, onDiscard }) {
  const canvasRef = useRef(null);
  const [editorTab, setEditorTab] = useState('refine'); // 'refine', 'backdrop', 'brush', 'colorkey'

  // Edge Refinement States
  const [edgeInset, setEdgeInset] = useState(0);       // -5px to +5px (Erode/Contract)
  const [edgeFeather, setEdgeFeather] = useState(0);   // 0px to 10px
  const [defringe, setDefringe] = useState(30);        // 0% to 100% (De-fringe halo reduction)

  // Backdrop States
  const [backdropType, setBackdropType] = useState('transparent'); // 'transparent', 'solid', 'gradient', 'bokeh'
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [gradientPreset, setGradientPreset] = useState('studio'); // 'studio', 'tech', 'sunset', 'dark'
  const [bokehBlur, setBokehBlur] = useState(12);       // 0px to 30px Gaussian blur on original background

  // Brush states
  const [mode, setMode] = useState('erase'); // 'erase' or 'restore'
  const [brushSize, setBrushSize] = useState(40);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);

  // Color Key states
  const [baseImageData, setBaseImageData] = useState(null);
  const [sampledColors, setSampledColors] = useState([]);
  const [tolerance, setTolerance] = useState(10);
  const [feather, setFeather] = useState(5);
  
  // Line drawing and sampling states
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [strokePath, setStrokePath] = useState([]);
  const [preStrokeImageData, setPreStrokeImageData] = useState(null);
  const [tempStrokeColors, setTempStrokeColors] = useState([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [rawCutoutImage, setRawCutoutImage] = useState(null);
  const [rawCutoutData, setRawCutoutData] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // Load original image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
      setOriginalData(cx.getImageData(0, 0, img.width, img.height));
    };
    img.src = originalUrl;
  }, [originalUrl]);

  // Load raw cutout result
  useEffect(() => {
    if (!resultUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setRawCutoutImage(img);
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0);
      const data = cx.getImageData(0, 0, img.width, img.height);
      setRawCutoutData(data);
      setBaseImageData(data);
    };
    img.src = resultUrl;
  }, [resultUrl]);

  // Render edge refinement and backdrops onto canvas
  const renderComposite = useCallback(() => {
    renderCutoutComposite(canvasRef.current, {
      rawCutoutImage,
      rawCutoutData,
      originalImage,
      originalData,
      backdropType,
      solidColor,
      gradientPreset,
      bokehBlur,
      edgeInset,
      edgeFeather,
      defringe
    });
  }, [rawCutoutImage, rawCutoutData, originalImage, originalData, backdropType, solidColor, gradientPreset, bokehBlur, edgeInset, edgeFeather, defringe]);

  useEffect(() => {
    if (editorTab === 'refine' || editorTab === 'backdrop') {
      renderComposite();
    }
  }, [renderComposite, editorTab]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const applyColorKey = useCallback((colors, currentTolerance, currentFeather) => {
    if (!canvasRef.current || !baseImageData) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imgData = computeColorKeyImageData(baseImageData, colors, currentTolerance, currentFeather, ctx);
    ctx.putImageData(imgData, 0, 0);
    setRawCutoutData(imgData);
  }, [baseImageData]);

  const drawBrush = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (originalImage) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(originalImage, 0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.restore();
    }
  };

  const handleCanvasPointerDown = (e) => {
    if (editorTab !== 'brush' && editorTab !== 'colorkey') return;
    if (e.cancelable) e.preventDefault();
    
    if (editorTab === 'colorkey') {
      if (!canvasRef.current || !baseImageData) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      setIsDrawingLine(true);
      const coords = getCanvasCoords(e);
      const currentImgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setPreStrokeImageData(currentImgData);
      
      const newPath = [coords];
      setStrokePath(newPath);
      
      const tempColors = [];
      sampleColorsAlongLine(coords.x, coords.y, coords.x, coords.y, baseImageData.data, baseImageData.width, baseImageData.height, tempColors);
      setTempStrokeColors(tempColors);
    } else if (editorTab === 'brush') {
      setIsDrawing(true);
      const { x, y } = getCanvasCoords(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(x, y);
      drawBrush(e);
    }
  };

  const handleCanvasPointerMove = (e) => {
    if (editorTab === 'colorkey') {
      if (!isDrawingLine || !canvasRef.current || !preStrokeImageData || !baseImageData) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const coords = getCanvasCoords(e);
      
      const lastPoint = strokePath[strokePath.length - 1];
      const newPath = [...strokePath, coords];
      setStrokePath(newPath);
      
      ctx.putImageData(preStrokeImageData, 0, 0);
      
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(newPath[0].x, newPath[0].y);
      for (let i = 1; i < newPath.length; i++) {
        ctx.lineTo(newPath[i].x, newPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
      
      const updatedColors = [...tempStrokeColors];
      sampleColorsAlongLine(
        lastPoint.x, lastPoint.y,
        coords.x, coords.y,
        baseImageData.data,
        baseImageData.width,
        baseImageData.height,
        updatedColors
      );
      setTempStrokeColors(updatedColors);
    } else if (editorTab === 'brush') {
      drawBrush(e);
    }
  };

  const stopDrawing = () => {
    if (editorTab === 'colorkey' && isDrawingLine) {
      setIsDrawingLine(false);
      const finalColors = [...sampledColors, ...tempStrokeColors];
      setSampledColors(finalColors);
      applyColorKey(finalColors, tolerance, feather);
      setStrokePath([]);
      setPreStrokeImageData(null);
      setTempStrokeColors([]);
    } else if (editorTab === 'brush') {
      setIsDrawing(false);
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        if (backdropType === 'transparent') {
          const updatedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setRawCutoutData(updatedData);
          setBaseImageData(updatedData);
        }
      }
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, fileName ? `nobg-${fileName.replace(/\.[^/.]+$/, "")}.png` : `nobg-${Date.now()}.png`);
    }, 'image/png');
  };

  const handleResetCanvas = () => {
    setEdgeInset(0);
    setEdgeFeather(0);
    setDefringe(30);
    setBackdropType('transparent');
    setSampledColors([]);
    if (rawCutoutImage) {
      const c = document.createElement('canvas');
      c.width = rawCutoutImage.width;
      c.height = rawCutoutImage.height;
      const cx = c.getContext('2d');
      cx.drawImage(rawCutoutImage, 0, 0);
      const freshData = cx.getImageData(0, 0, rawCutoutImage.width, rawCutoutImage.height);
      setRawCutoutData(freshData);
      setBaseImageData(freshData);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(rawCutoutImage, 0, 0);
      }
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
       {/* Tab Switcher */}
       <div style={{display: 'flex', gap: '0.4rem', background: 'var(--bg-primary)', padding: '0.3rem', borderRadius: 'var(--border-radius-sm)', flexWrap: 'wrap'}}>
          {EDITOR_TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className="btn"
              onClick={() => setEditorTab(id)}
              style={{
                flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.8rem',
                background: editorTab === id ? 'var(--accent-color)' : 'transparent',
                color: editorTab === id ? 'white' : 'var(--text-secondary)',
                border: 'none', fontWeight: editorTab === id ? 'bold' : 'normal'
              }}
            >
              {Icon && <Icon style={{ width: 14, height: 14 }} />} {label}
            </button>
          ))}
       </div>

       {/* Tab 1: Edge Refinement */}
       {editorTab === 'refine' && (
         <RefineTab
           edgeInset={edgeInset}
           setEdgeInset={setEdgeInset}
           defringe={defringe}
           setDefringe={setDefringe}
           edgeFeather={edgeFeather}
           setEdgeFeather={setEdgeFeather}
         />
       )}

       {/* Tab 2: Studio Backdrop */}
       {editorTab === 'backdrop' && (
         <BackdropTab
           backdropType={backdropType}
           setBackdropType={setBackdropType}
           solidColor={solidColor}
           setSolidColor={setSolidColor}
           gradientPreset={gradientPreset}
           setGradientPreset={setGradientPreset}
           bokehBlur={bokehBlur}
           setBokehBlur={setBokehBlur}
         />
       )}

       {/* Tab 3: Brush Controls */}
       {editorTab === 'brush' && (
         <BrushTab
           mode={mode}
           setMode={setMode}
           brushSize={brushSize}
           setBrushSize={setBrushSize}
           overlayOpacity={overlayOpacity}
           setOverlayOpacity={setOverlayOpacity}
         />
       )}

       {/* Tab 4: Color Key Controls */}
       {editorTab === 'colorkey' && (
         <ColorKeyTab
           sampledColors={sampledColors}
           onClearColors={() => {
             setSampledColors([]);
             applyColorKey([], tolerance, feather);
           }}
           tolerance={tolerance}
           setTolerance={setTolerance}
           feather={feather}
           setFeather={setFeather}
           onApplyColorKey={applyColorKey}
         />
       )}

       {/* Canvas Display */}
       <div 
         style={{ 
           width: '100%', 
           overflow: 'hidden',
           background: backdropType === 'transparent' ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'><rect width=\'10\' height=\'10\' fill=\'%23ddd\'/><rect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ddd\'/><rect x=\'10\' width=\'10\' height=\'10\' fill=\'%23eee\'/><rect y=\'10\' width=\'10\' height=\'10\' fill=\'%23eee\'/></svg>")' : 'transparent',
           borderRadius: 'var(--border-radius-sm)',
           border: '1px solid var(--border-color)',
           touchAction: 'none',
           position: 'relative'
         }}
       >
         {editorTab === 'brush' && originalImage && (
           <img 
             src={originalUrl} 
             alt="Guide Overlay" 
             style={{
               position: 'absolute',
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)',
               maxWidth: '100%',
               maxHeight: '60vh',
               width: 'auto',
               height: 'auto',
               objectFit: 'contain',
               pointerEvents: 'none',
               opacity: overlayOpacity,
               zIndex: 1,
               display: 'block'
             }}
           />
         )}
         <canvas 
           ref={canvasRef}
           onPointerDown={handleCanvasPointerDown}
           onPointerMove={handleCanvasPointerMove}
           onPointerUp={stopDrawing}
           onPointerOut={stopDrawing}
           style={{ 
             maxWidth: '100%', 
             maxHeight: '60vh', 
             objectFit: 'contain', 
             display: 'block', 
             margin: '0 auto',
             cursor: (editorTab === 'brush' || editorTab === 'colorkey') ? 'crosshair' : 'default',
             position: 'relative',
             zIndex: 2
           }}
         />
       </div>

       {/* Bottom Export & Actions */}
       <div className="button-group" style={{marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
         <button onClick={handleDownload} className="btn btn-primary">
            <Download style={{width: "18px", height: "18px"}} /> Download Cutout (PNG)
         </button>
         <SendToDropdown imageUrl={() => canvasRef.current ? canvasRef.current.toDataURL('image/png') : resultUrl} mediaType="image" />
         <button className="btn" onClick={handleResetCanvas}>
            Reset Adjustments
         </button>
         <button className="btn" onClick={onDiscard}>
            Discard Result
         </button>
       </div>
    </div>
  );
}
