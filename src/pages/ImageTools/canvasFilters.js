export function applyImageCanvasFilters({
  canvas,
  img,
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
}) {
  if (!img || !canvas) return;

  const ctx = canvas.getContext('2d');
  const isSideways = rotation === 90 || rotation === 270;
  const targetW = isSideways ? height : width;
  const targetH = isSideways ? width : height;

  canvas.width = targetW;
  canvas.height = targetH;

  ctx.clearRect(0, 0, targetW, targetH);

  // Rounded corners clipping
  if (radius > 0) {
    const r = Math.min(radius, targetW / 2, targetH / 2);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(targetW - r, 0);
    ctx.quadraticCurveTo(targetW, 0, targetW, r);
    ctx.lineTo(targetW, targetH - r);
    ctx.quadraticCurveTo(targetW, targetH, targetW - r, targetH);
    ctx.lineTo(r, targetH);
    ctx.quadraticCurveTo(0, targetH, 0, targetH - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();
  }

  // Apply Canvas Standard Filters
  const filterParts = [];
  if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`);
  if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`);
  if (saturation !== 100) filterParts.push(`saturate(${saturation}%)`);
  if (gaussianBlur > 0) filterParts.push(`blur(${gaussianBlur}px)`);
  if (grayscale > 0) filterParts.push(`grayscale(${grayscale}%)`);
  if (sepia > 0) filterParts.push(`sepia(${sepia}%)`);
  if (hue !== 0) filterParts.push(`hue-rotate(${hue}deg)`);
  if (invert > 0) filterParts.push(`invert(${invert}%)`);

  ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  // Transformations (Rotate, Flip)
  ctx.save();
  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  const drawW = isSideways ? targetH : targetW;
  const drawH = isSideways ? targetW : targetH;
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Reset filter for secondary custom passes
  ctx.filter = 'none';

  // Apply Radial / Zoom Blur Pass if enabled
  if (radialBlur > 0) {
    const steps = Math.min(18, Math.max(6, Math.round(radialBlur * 0.7)));
    const cx = (targetW * radialCenterX) / 100;
    const cy = (targetH * radialCenterY) / 100;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);

    ctx.save();
    const maxScale = 1 + (radialBlur * 0.007);
    ctx.globalAlpha = 1 / steps;

    for (let i = 1; i <= steps; i++) {
      const scale = 1 + ((maxScale - 1) * (i / steps));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.drawImage(tempCanvas, -cx, -cy);
      ctx.restore();
    }
    ctx.restore();
  }
}
