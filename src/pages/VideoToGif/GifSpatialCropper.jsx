import { useState, useRef, useEffect, useCallback } from 'react';

const ASPECT_RATIOS = [
  { label: 'Free', value: 'free' },
  { label: '1:1 Square', value: '1:1', ratio: 1 },
  { label: '16:9 Landscape', value: '16:9', ratio: 16 / 9 },
  { label: '9:16 Story/Reel', value: '9:16', ratio: 9 / 16 },
  { label: '4:3 Standard', value: '4:3', ratio: 4 / 3 },
  { label: '4:5 Social', value: '4:5', ratio: 4 / 5 }
];

export default function GifSpatialCropper({
  videoRef,
  cropRect = { x: 0, y: 0, width: 100, height: 100 },
  onChangeCrop,
  aspectRatio = 'free',
  onChangeAspectRatio
}) {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(null); // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startRect: null });

  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDims = () => {
      if (video.videoWidth && video.videoHeight) {
        setNaturalDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
    };

    updateDims();
    video.addEventListener('loadedmetadata', updateDims);
    return () => video.removeEventListener('loadedmetadata', updateDims);
  }, [videoRef]);

  const applyAspectRatio = useCallback((rect, targetRatio) => {
    if (!targetRatio || targetRatio === 'free' || !naturalDimensions.width || !naturalDimensions.height) {
      return rect;
    }

    const found = ASPECT_RATIOS.find(r => r.value === targetRatio);
    if (!found || !found.ratio) return rect;

    const videoAspect = naturalDimensions.width / naturalDimensions.height;
    // targetRatio = (w_pixels) / (h_pixels)
    // w_pixels = rect.width * naturalDimensions.width / 100
    // h_pixels = rect.height * naturalDimensions.height / 100
    // ratio = (rect.width * videoAspect) / rect.height
    // rect.height = (rect.width * videoAspect) / ratio
    let newHeight = (rect.width * videoAspect) / found.ratio;
    let newWidth = rect.width;

    if (newHeight > 100) {
      newHeight = 100;
      newWidth = (newHeight * found.ratio) / videoAspect;
    }

    let newX = Math.max(0, Math.min(100 - newWidth, rect.x));
    let newY = Math.max(0, Math.min(100 - newHeight, rect.y));

    return {
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: Math.round(newWidth * 10) / 10,
      height: Math.round(newHeight * 10) / 10
    };
  }, [naturalDimensions]);

  const handleSetRatio = (ratioValue) => {
    onChangeAspectRatio(ratioValue);
    if (ratioValue !== 'free') {
      const adjusted = applyAspectRatio(cropRect, ratioValue);
      onChangeCrop(adjusted);
    }
  };

  const handleResetCrop = () => {
    onChangeAspectRatio('free');
    onChangeCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  const handleMouseDown = (e, handleType) => {
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = handleType;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startRect: { ...cropRect }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const bounds = containerRef.current.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return;

    const deltaXPercent = ((e.clientX - dragStartRef.current.mouseX) / bounds.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartRef.current.mouseY) / bounds.height) * 100;
    const start = dragStartRef.current.startRect;

    let newRect = { ...start };
    const mode = isDraggingRef.current;

    if (mode === 'move') {
      newRect.x = Math.max(0, Math.min(100 - start.width, start.x + deltaXPercent));
      newRect.y = Math.max(0, Math.min(100 - start.height, start.y + deltaYPercent));
    } else {
      // Resizing logic
      if (mode.includes('e')) {
        newRect.width = Math.max(10, Math.min(100 - start.x, start.width + deltaXPercent));
      }
      if (mode.includes('s')) {
        newRect.height = Math.max(10, Math.min(100 - start.y, start.height + deltaYPercent));
      }
      if (mode.includes('w')) {
        const potentialWidth = start.width - deltaXPercent;
        if (potentialWidth >= 10 && start.x + deltaXPercent >= 0) {
          newRect.x = start.x + deltaXPercent;
          newRect.width = potentialWidth;
        }
      }
      if (mode.includes('n')) {
        const potentialHeight = start.height - deltaYPercent;
        if (potentialHeight >= 10 && start.y + deltaYPercent >= 0) {
          newRect.y = start.y + deltaYPercent;
          newRect.height = potentialHeight;
        }
      }

      if (aspectRatio !== 'free') {
        newRect = applyAspectRatio(newRect, aspectRatio);
      }
    }

    // Clamp coordinates
    newRect.x = Math.max(0, Math.min(100 - newRect.width, newRect.x));
    newRect.y = Math.max(0, Math.min(100 - newRect.height, newRect.y));

    onChangeCrop({
      x: Math.round(newRect.x * 10) / 10,
      y: Math.round(newRect.y * 10) / 10,
      width: Math.round(newRect.width * 10) / 10,
      height: Math.round(newRect.height * 10) / 10
    });
  }, [aspectRatio, applyAspectRatio, cropRect, onChangeCrop]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const pixelWidth = naturalDimensions.width ? Math.round((cropRect.width / 100) * naturalDimensions.width) : 0;
  const pixelHeight = naturalDimensions.height ? Math.round((cropRect.height / 100) * naturalDimensions.height) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
      {/* Aspect Ratio Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
          Crop Preset:
        </span>
        {ASPECT_RATIOS.map(r => (
          <button
            key={r.value}
            type="button"
            className={`btn ${aspectRatio === r.value ? 'btn-primary' : ''}`}
            onClick={() => handleSetRatio(r.value)}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          className="btn"
          onClick={handleResetCrop}
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', marginLeft: 'auto' }}
          title="Reset to full frame"
        >
          Reset Full Frame
        </button>
      </div>

      {/* Overlay interactive frame directly mounted onto video */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
          zIndex: 5,
          cursor: 'crosshair',
          overflow: 'hidden'
        }}
      >
        {/* Shaded backdrop masks */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${cropRect.y}%`, background: 'rgba(0, 0, 0, 0.6)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${100 - (cropRect.y + cropRect.height)}%`, background: 'rgba(0, 0, 0, 0.6)' }} />
        <div style={{ position: 'absolute', top: `${cropRect.y}%`, left: 0, width: `${cropRect.x}%`, height: `${cropRect.height}%`, background: 'rgba(0, 0, 0, 0.6)' }} />
        <div style={{ position: 'absolute', top: `${cropRect.y}%`, right: 0, width: `${100 - (cropRect.x + cropRect.width)}%`, height: `${cropRect.height}%`, background: 'rgba(0, 0, 0, 0.6)' }} />

        {/* Selected Crop Box */}
        <div
          style={{
            position: 'absolute',
            left: `${cropRect.x}%`,
            top: `${cropRect.y}%`,
            width: `${cropRect.width}%`,
            height: `${cropRect.height}%`,
            border: '2px solid var(--accent-color)',
            boxShadow: '0 0 12px rgba(64, 224, 208, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
            cursor: 'move',
            boxSizing: 'border-box'
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Rule of thirds grid lines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.3)', borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
            <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)' }} />
          </div>

          {/* Dimension pill */}
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              background: 'rgba(0, 0, 0, 0.75)',
              color: '#fff',
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: '4px',
              pointerEvents: 'none',
              fontFamily: 'monospace',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {pixelWidth} × {pixelHeight} px ({Math.round(cropRect.width)}% × {Math.round(cropRect.height)}%)
          </div>

          {/* Corner Resize Handles */}
          <div
            style={{ position: 'absolute', top: -6, left: -6, width: 12, height: 12, background: 'var(--accent-color)', borderRadius: '2px', cursor: 'nwse-resize', border: '1px solid white' }}
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12, background: 'var(--accent-color)', borderRadius: '2px', cursor: 'nesw-resize', border: '1px solid white' }}
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            style={{ position: 'absolute', bottom: -6, left: -6, width: 12, height: 12, background: 'var(--accent-color)', borderRadius: '2px', cursor: 'nesw-resize', border: '1px solid white' }}
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            style={{ position: 'absolute', bottom: -6, right: -6, width: 12, height: 12, background: 'var(--accent-color)', borderRadius: '2px', cursor: 'nwse-resize', border: '1px solid white' }}
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Edge Midpoint Handles */}
          <div
            style={{ position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)', width: 16, height: 8, background: 'white', borderRadius: '2px', cursor: 'ns-resize' }}
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          <div
            style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 16, height: 8, background: 'white', borderRadius: '2px', cursor: 'ns-resize' }}
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          <div
            style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 8, height: 16, background: 'white', borderRadius: '2px', cursor: 'ew-resize' }}
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          <div
            style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 8, height: 16, background: 'white', borderRadius: '2px', cursor: 'ew-resize' }}
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />
        </div>
      </div>
    </div>
  );
}
