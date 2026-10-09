/**
 * Pre-processes a QR code center logo image or SVG into an offscreen canvas badge
 * that matches the QR code's dot roundness, style, and contrast settings.
 *
 * @param {Object} options
 * @param {string} options.rawLogoUrl
 * @param {'auto'|'circle'|'rounded'|'square'} options.logoShape
 * @param {string} options.logoBgColor
 * @param {number} options.logoBgPadding
 * @param {string} options.dotType
 * @returns {Promise<string>} Data URL of the processed logo badge
 */
export function processQrLogo({ rawLogoUrl, logoShape, logoBgColor, logoBgPadding, dotType }) {
  return new Promise((resolve) => {
    if (!rawLogoUrl) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const sz = 512; // High-resolution logo badge
      canvas.width = sz;
      canvas.height = sz;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, sz, sz);

      // Determine corner radius matching QR style
      let effectiveShape = logoShape;
      if (effectiveShape === 'auto') {
        if (dotType === 'dots') {
          effectiveShape = 'circle';
        } else if (dotType === 'square') {
          effectiveShape = 'square';
        } else {
          effectiveShape = 'rounded';
        }
      }

      let radius = 0;
      if (effectiveShape === 'circle') {
        radius = sz / 2;
      } else if (effectiveShape === 'rounded') {
        radius = sz * 0.22;
      } else if (effectiveShape === 'square') {
        radius = 0;
      }

      // Draw background badge if not transparent
      if (logoBgColor !== 'transparent') {
        ctx.fillStyle = logoBgColor;
        ctx.beginPath();
        if (radius > 0 && ctx.roundRect) {
          ctx.roundRect(0, 0, sz, sz, radius);
        } else if (radius > 0) {
          ctx.arc(sz / 2, sz / 2, radius, 0, Math.PI * 2);
        } else {
          ctx.rect(0, 0, sz, sz);
        }
        ctx.fill();
      }

      // Clip inner logo to the matching radius
      ctx.save();
      ctx.beginPath();
      if (radius > 0 && ctx.roundRect) {
        ctx.roundRect(0, 0, sz, sz, radius);
      } else if (radius > 0) {
        ctx.arc(sz / 2, sz / 2, radius, 0, Math.PI * 2);
      } else {
        ctx.rect(0, 0, sz, sz);
      }
      ctx.clip();

      // Contain-fit aspect ratio for the logo inside the padded area
      const imgAspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      const pad = logoBgColor !== 'transparent' ? (logoBgPadding * (sz / 100)) : 0;
      const drawArea = sz - pad * 2;
      let dW = drawArea;
      let dH = drawArea;
      let dX = pad;
      let dY = pad;

      if (imgAspect > 1) {
        dH = drawArea / imgAspect;
        dY = pad + (drawArea - dH) / 2;
      } else {
        dW = drawArea * imgAspect;
        dX = pad + (drawArea - dW) / 2;
      }

      ctx.drawImage(img, dX, dY, dW, dH);
      ctx.restore();

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve('');
    };

    img.src = rawLogoUrl;
  });
}
