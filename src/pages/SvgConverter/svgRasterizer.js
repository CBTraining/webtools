function sanitizeSvgForRaster(svgText) {
  try {
    const doc = new DOMParser().parseFromString(String(svgText || ''), 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg || doc.querySelector('parsererror')) return '';
    [svg, ...svg.querySelectorAll('*')].forEach((el) => {
      const tag = (el.tagName || el.nodeName || '').toLowerCase();
      if (['script', 'foreignobject', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'base', 'form', 'set', 'animate', 'animatetransform', 'animatemotion'].includes(tag)) {
        el.remove();
        return;
      }
      if (!el.attributes) return;
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        // eslint-disable-next-line no-control-regex
        const val = (attr.value || '').replace(/[\x00-\x20]+/g, '').toLowerCase();
        if (
          name.startsWith('on') ||
          ((name === 'href' || name === 'xlink:href' || name === 'src') &&
            (val.startsWith('javascript:') || val.startsWith('vbscript:') || val.startsWith('data:')))
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });
    return svg.outerHTML;
  } catch {
    return '';
  }
}

/**
 * Rasterizes an SVG string onto a canvas with contain-fit scaling and optional tint/gradient fills.
 *
 * @param {Object} options
 * @returns {Promise<Blob|null>}
 */
export function rasterizeSvgToBlob({
  canvas,
  svgText,
  width,
  height,
  keepProportions,
  applyTint,
  tintMode,
  solidColor,
  gradStart,
  gradEnd,
  gradDirection
}) {
  return new Promise((resolve) => {
    if (!svgText || !svgText.trim() || !canvas || !svgText.includes('<svg')) {
      resolve(null);
      return;
    }

    const cleanSvg = sanitizeSvgForRaster(svgText);
    if (!cleanSvg) {
      resolve(null);
      return;
    }

    const safeW = Math.max(1, Math.min(8192, Number(width) || 512));
    const safeH = Math.max(1, Math.min(8192, Number(height) || 512));

    const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const img = new Image();
    img.onload = () => {
      canvas.width = safeW;
      canvas.height = safeH;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, safeW, safeH);

      // Calculate Contain-Fit Aspect Ratio so vector never stretches
      const imgW = img.naturalWidth || img.width || safeW;
      const imgH = img.naturalHeight || img.height || safeH;
      const imgAspect = imgW / imgH;

      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (keepProportions && imgAspect > 0) {
        const canvasAspect = width / height;
        if (imgAspect > canvasAspect) {
          drawH = width / imgAspect;
          drawY = (height - drawH) / 2;
        } else {
          drawW = height * imgAspect;
          drawX = (width - drawW) / 2;
        }
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      
      if (applyTint) {
        ctx.globalCompositeOperation = 'source-in';
        if (tintMode === 'solid') {
          ctx.fillStyle = solidColor;
        } else {
          let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
          if (gradDirection === 'to-bottom') { y1 = height; }
          else if (gradDirection === 'to-right') { x1 = width; }
          else if (gradDirection === 'to-bottom-right') { x1 = width; y1 = height; }
          else if (gradDirection === 'to-top-right') { y0 = height; x1 = width; }
          
          const grad = ctx.createLinearGradient(x0, y0, x1, y1);
          grad.addColorStop(0, gradStart);
          grad.addColorStop(1, gradEnd);
          ctx.fillStyle = grad;
        }
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }
      
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(url);
        resolve(pngBlob);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}
