/**
 * Renders photos onto an offscreen/export canvas according to cell geometries and layout properties.
 */
export function renderCollageToCanvas(canvas, {
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
}) {
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
    if (ctx.roundRect) {
      ctx.roundRect(cell.x, cell.y, cell.width, cell.height, r);
    } else {
      ctx.rect(cell.x, cell.y, cell.width, cell.height);
    }
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
}
