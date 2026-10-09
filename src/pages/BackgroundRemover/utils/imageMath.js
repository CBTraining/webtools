/**
 * Pure image manipulation algorithms for Background Remover canvas editing:
 * morphological erosion (edge inset), defringe (anti-halo), color sampling, and color keying.
 */

/**
 * Samples non-transparent colors along a line segment between (x0, y0) and (x1, y1).
 */
export function sampleColorsAlongLine(x0, y0, x1, y1, data, width, height, targetArray) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const steps = Math.max(Math.ceil(Math.max(dx, dy)), 1);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = Math.round(x0 + (x1 - x0) * t);
    const py = Math.round(y0 + (y1 - y0) * t);
    
    if (px >= 0 && px < width && py >= 0 && py < height) {
      const idx = (py * width + px) * 4;
      if (data[idx + 3] > 0) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        let isDuplicate = false;
        for (let c = 0; c < targetArray.length; c++) {
          const sc = targetArray[c];
          const dist = Math.sqrt((r - sc.r)**2 + (g - sc.g)**2 + (b - sc.b)**2);
          if (dist < 4) { isDuplicate = true; break; }
        }
        
        if (!isDuplicate) {
          targetArray.push({ r, g, b });
        }
      }
    }
  }
}

/**
 * Applies morphological erosion (inset / contract) to the alpha channel.
 * @param {Uint8ClampedArray} src Raw RGBA data
 * @param {Uint8ClampedArray} dst Output RGBA data
 * @param {number} w Width
 * @param {number} h Height
 * @param {number} edgeInset Negative pixel value (e.g. -1 to -5)
 */
export function applyEdgeInset(src, dst, w, h, edgeInset) {
  if (edgeInset >= 0) return;
  const radius = Math.abs(edgeInset);
  const rInt = Math.ceil(radius);
  const alphaCopy = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alphaCopy[i] = src[i * 4 + 3];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const a = alphaCopy[idx];
      if (a > 0 && a < 255) {
        let minA = a;
        for (let dy = -rInt; dy <= rInt; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -rInt; dx <= rInt; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (dx * dx + dy * dy <= radius * radius) {
              const neighborA = alphaCopy[ny * w + nx];
              if (neighborA < minA) minA = neighborA;
            }
          }
        }
        dst[idx * 4 + 3] = minA;
      }
    }
  }
}

/**
 * Applies defringe / anti-halo reduction to edge pixels by desaturating background color bleed.
 * @param {Uint8ClampedArray} dst Output RGBA data
 * @param {number} w Width
 * @param {number} h Height
 * @param {number} defringe 0-100 percentage
 * @param {Uint8ClampedArray} [orig] Original image data
 */
export function applyDefringe(dst, w, h, defringe, orig) {
  if (defringe <= 0 || !orig) return;
  const factor = defringe / 100;
  for (let i = 0; i < w * h; i++) {
    const pi = i * 4;
    const a = dst[pi + 3];
    if (a > 5 && a < 250) {
      const alphaFrac = a / 255;
      const desat = (dst[pi] + dst[pi + 1] + dst[pi + 2]) / 3;
      dst[pi] = Math.round(dst[pi] * (1 - factor * (1 - alphaFrac)) + desat * factor * (1 - alphaFrac));
      dst[pi + 1] = Math.round(dst[pi + 1] * (1 - factor * (1 - alphaFrac)) + desat * factor * (1 - alphaFrac));
      dst[pi + 2] = Math.round(dst[pi + 2] * (1 - factor * (1 - alphaFrac)) + desat * factor * (1 - alphaFrac));
    }
  }
}

/**
 * Computes color-key transparency across an image given sample colors, tolerance, and feathering.
 */
export function computeColorKeyImageData(baseImageData, colors, currentTolerance, currentFeather, ctx) {
  const w = baseImageData.width;
  const h = baseImageData.height;
  const imgData = ctx.createImageData(w, h);
  const src = baseImageData.data;
  const dst = imgData.data;

  if (!colors || colors.length === 0) {
    for (let i = 0; i < src.length; i++) dst[i] = src[i];
    return imgData;
  }
  
  const tolSq = currentTolerance * currentTolerance * 3;
  const featherDist = currentFeather * 1.5;
  const outerTolSq = (currentTolerance + featherDist) * (currentTolerance + featherDist) * 3;
  
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3];
    if (a === 0) {
      dst[i] = src[i]; dst[i+1] = src[i+1]; dst[i+2] = src[i+2]; dst[i+3] = 0;
      continue;
    }
    
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    
    let minDistanceSq = Infinity;
    for (let j = 0; j < colors.length; j++) {
      const sc = colors[j];
      const dSq = (r - sc.r)**2 + (g - sc.g)**2 + (b - sc.b)**2;
      if (dSq < minDistanceSq) {
        minDistanceSq = dSq;
        if (minDistanceSq <= tolSq) break;
      }
    }
    
    dst[i] = r; dst[i + 1] = g; dst[i + 2] = b;
    
    if (minDistanceSq <= tolSq) {
      dst[i + 3] = 0;
    } else if (minDistanceSq < outerTolSq && currentFeather > 0) {
      const dist = Math.sqrt(minDistanceSq);
      const factor = (dist - currentTolerance * Math.sqrt(3)) / (featherDist * Math.sqrt(3));
      dst[i + 3] = Math.round(a * Math.max(0, Math.min(1, factor)));
    } else {
      dst[i + 3] = a;
    }
  }
  
  return imgData;
}
