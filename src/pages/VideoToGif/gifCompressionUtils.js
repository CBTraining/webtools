export const TARGET_SIZE_OPTIONS = [
  { value: '50', label: 'Under 50 MB (Slack / Nitro / Web)', mb: 50 },
  { value: '25', label: 'Under 25 MB (Discord Free / Email)', mb: 25 },
  { value: '10', label: 'Under 10 MB (Fast Web)', mb: 10 },
  { value: '5', label: 'Under 5 MB (Ultra Compact)', mb: 5 },
  { value: 'custom', label: 'Custom MB Limit...', mb: null },
  { value: 'none', label: 'Manual Quality (No Auto Limit)', mb: null }
];

/**
 * Calculates pixel bounds for FFmpeg crop filter from percentage crop rect and video natural dimensions.
 */
export function calculateCropPixelBounds(cropRect, naturalWidth, naturalHeight) {
  if (!naturalWidth || !naturalHeight) return null;
  if (!cropRect) return null;

  // If crop is full frame (approx 0,0,100,100), return null to avoid unnecessary filter
  if (
    cropRect.x <= 0.5 && 
    cropRect.y <= 0.5 && 
    cropRect.width >= 99.5 && 
    cropRect.height >= 99.5
  ) {
    return null;
  }

  let w = Math.floor((cropRect.width / 100) * naturalWidth);
  let h = Math.floor((cropRect.height / 100) * naturalHeight);
  let x = Math.floor((cropRect.x / 100) * naturalWidth);
  let y = Math.floor((cropRect.y / 100) * naturalHeight);

  // FFmpeg requires even dimensions
  if (w % 2 !== 0) w -= 1;
  if (h % 2 !== 0) h -= 1;
  if (x % 2 !== 0) x -= 1;
  if (y % 2 !== 0) y -= 1;

  w = Math.max(16, Math.min(naturalWidth, w));
  h = Math.max(16, Math.min(naturalHeight, h));
  x = Math.max(0, Math.min(naturalWidth - w, x));
  y = Math.max(0, Math.min(naturalHeight - h, y));

  return { w, h, x, y };
}

/**
 * Calculates budget constraints to automatically hit under target MB.
 */
export function computeAutoBudgetParameters({
  targetMb,
  duration,
  naturalWidth = 640,
  naturalHeight = 360,
  cropBounds,
  requestedFps = 15,
  requestedQuality = 80
}) {
  if (!targetMb || targetMb <= 0) {
    // Normal estimation without cap
    const baseW = cropBounds ? cropBounds.w : naturalWidth;
    const baseH = cropBounds ? cropBounds.h : naturalHeight;
    const aspect = baseH / (baseW || 1);
    const targetScale = Math.floor(240 + ((requestedQuality - 1) / 99) * 560);
    const targetH = Math.round(targetScale * aspect);
    const estimatedBytes = (targetScale * targetH * requestedFps * duration) / 3.5;
    return {
      targetScale,
      fps: requestedFps,
      estimatedBytes,
      maxColors: 256,
      statsMode: 'full',
      dither: 'bayer:bayer_scale=1'
    };
  }

  const targetBytes = targetMb * 1024 * 1024;
  const safeTargetBytes = targetBytes * 0.85; // 15% safety buffer

  const baseW = cropBounds ? cropBounds.w : naturalWidth;
  const baseH = cropBounds ? cropBounds.h : naturalHeight;
  const aspect = baseH / (baseW || 1);

  let fps = requestedFps;
  let targetScale = Math.floor(240 + ((requestedQuality - 1) / 99) * 560);

  // Check baseline raw bytes
  let estH = targetScale * aspect;
  let estimatedBytes = (targetScale * estH * fps * duration) / 3.8;

  // Step 1: If over budget, clamp FPS
  if (estimatedBytes > safeTargetBytes) {
    if (fps > 20) fps = 18;
    else if (fps > 15) fps = 15;
    else if (fps > 12) fps = 12;
    estimatedBytes = (targetScale * estH * fps * duration) / 3.8;
  }

  // Step 2: If still over budget, calculate scale reduction
  if (estimatedBytes > safeTargetBytes) {
    const scaleFactor = Math.sqrt(safeTargetBytes / estimatedBytes);
    targetScale = Math.max(180, Math.floor(targetScale * scaleFactor));
    // Ensure even scale
    if (targetScale % 2 !== 0) targetScale -= 1;
    estH = targetScale * aspect;
    estimatedBytes = (targetScale * estH * fps * duration) / 4.2;
  }

  // Optimized palette settings when target size is enabled
  const maxColors = targetMb <= 10 ? 128 : targetMb <= 25 ? 192 : 224;
  const dither = targetMb <= 10 ? 'bayer:bayer_scale=3' : 'bayer:bayer_scale=2';

  return {
    targetScale,
    fps,
    estimatedBytes: Math.min(estimatedBytes, targetBytes * 0.95),
    maxColors,
    statsMode: 'diff',
    dither
  };
}

/**
 * Builds the complete FFmpeg command array for GIF generation.
 */
export function buildFfmpegGifArgs({
  inputName,
  outputName,
  startTime = 0,
  endTime = 5,
  enableDurationTrim = false,
  cropBounds = null,
  finalFps = 15,
  targetScale = 480,
  maxColors = 256,
  statsMode = 'diff',
  dither = 'bayer:bayer_scale=2'
}) {
  const args = ['-y'];

  if (enableDurationTrim) {
    args.push('-ss', startTime.toString(), '-to', endTime.toString());
  }

  args.push('-i', inputName);

  const filters = [];

  // 1. Spatial Crop
  if (cropBounds) {
    filters.push(`crop=${cropBounds.w}:${cropBounds.h}:${cropBounds.x}:${cropBounds.y}`);
  }

  // 2. Framerate
  filters.push(`fps=${finalFps}`);

  // 3. Scaling
  filters.push(`scale=${targetScale}:-2:flags=lanczos`);

  const filterPrefix = filters.join(',');
  const filterComplex = `${filterPrefix},split[s0][s1];[s0]palettegen=max_colors=${maxColors}:stats_mode=${statsMode}[p];[s1][p]paletteuse=dither=${dither}`;

  args.push('-vf', filterComplex, '-loop', '0', outputName);

  return args;
}
