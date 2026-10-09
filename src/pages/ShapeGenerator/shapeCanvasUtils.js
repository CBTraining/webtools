/**
 * Trims transparent outer edges from a canvas to perfectly bound its non-empty pixels.
 */
export function trimCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  
  let x, y, bound = {
    top: height,
    left: width,
    right: 0,
    bottom: 0
  };

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (y < bound.top) bound.top = y;
        if (y > bound.bottom) bound.bottom = y;
        if (x < bound.left) bound.left = x;
        if (x > bound.right) bound.right = x;
      }
    }
  }

  if (bound.top > bound.bottom || bound.left > bound.right) return canvas;

  const trimHeight = bound.bottom - bound.top + 1;
  const trimWidth = bound.right - bound.left + 1;

  const trimmed = document.createElement('canvas');
  trimmed.width = trimWidth;
  trimmed.height = trimHeight;
  const tCtx = trimmed.getContext('2d');
  tCtx.drawImage(canvas, bound.left, bound.top, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);
  
  return trimmed;
}

/**
 * Renders a shaped rounded rectangle with optional blur, glow, solid color, or gradient,
 * and returns the trimmed canvas.
 */
export function renderShapeToTrimmedCanvas({
  shapeWidth,
  shapeHeight,
  borderRadius,
  blurRadius,
  glowMode,
  tintMode,
  solidColor,
  gradStops,
  gradDirection
}) {
  const canvas = document.createElement('canvas');
  const padding = blurRadius * 4 + 20; 
  canvas.width = shapeWidth + padding * 2;
  canvas.height = shapeHeight + padding * 2;
  const ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (tintMode === 'solid') {
    ctx.fillStyle = solidColor;
  } else {
    let x0, y0, x1, y1;
    switch(gradDirection) {
      case 'to-bottom': x0 = 0; y0 = 0; x1 = 0; y1 = canvas.height; break;
      case 'to-top': x0 = 0; y0 = canvas.height; x1 = 0; y1 = 0; break;
      case 'to-right': x0 = 0; y0 = 0; x1 = canvas.width; y1 = 0; break;
      case 'to-left': x0 = canvas.width; y0 = 0; x1 = 0; y1 = 0; break;
      case 'to-bottom-right': x0 = 0; y0 = 0; x1 = canvas.width; y1 = canvas.height; break;
      case 'to-top-left': x0 = canvas.width; y0 = canvas.height; x1 = 0; y1 = 0; break;
      case 'to-top-right': x0 = 0; y0 = canvas.height; x1 = canvas.width; y1 = 0; break;
      case 'to-bottom-left': x0 = canvas.width; y0 = 0; x1 = 0; y1 = canvas.height; break;
      default: x0 = 0; y0 = 0; x1 = canvas.width; y1 = canvas.height;
    }
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    
    const sortedStops = [...gradStops].sort((a, b) => a.position - b.position);
    sortedStops.forEach(stop => {
      gradient.addColorStop(stop.position, stop.color);
    });
    
    ctx.fillStyle = gradient;
  }

  const x = padding;
  const y = padding;
  
  const drawPath = () => {
    ctx.beginPath();
    ctx.roundRect(x, y, shapeWidth, shapeHeight, borderRadius);
    ctx.fill();
  };

  if (glowMode && blurRadius > 0) {
    ctx.filter = `blur(${blurRadius}px)`;
    drawPath();
    
    ctx.filter = 'none';
    drawPath();
  } else {
    ctx.filter = blurRadius > 0 ? `blur(${blurRadius}px)` : 'none';
    drawPath();
  }

  ctx.filter = 'none';

  return trimCanvas(canvas);
}
