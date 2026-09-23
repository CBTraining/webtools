export const RESOLUTION_PRESETS = [
  { id: 'landscape-1080p', label: 'Landscape FHD (1920×1080)', width: 1920, height: 1080 },
  { id: 'landscape-qhd', label: 'Landscape QHD 2K (2560×1440)', width: 2560, height: 1440 },
  { id: 'landscape-4k', label: 'Landscape 4K UHD (3840×2160)', width: 3840, height: 2160 },
  { id: 'ultrawide-qhd', label: 'Ultrawide 21:9 QHD (3440×1440)', width: 3440, height: 1440 },
  { id: 'ultrawide-5k', label: 'Ultrawide 21:9 5K (5120×2160)', width: 5120, height: 2160 },
  { id: 'square', label: 'Square (1:1 - 1080×1080)', width: 1080, height: 1080 },
  { id: 'square-qhd', label: 'Square 2K (2048×2048)', width: 2048, height: 2048 },
  { id: 'square-4k', label: 'Square 4K (3840×3840)', width: 3840, height: 3840 },
  { id: 'portrait-1080p', label: 'Portrait FHD (1080×1920)', width: 1080, height: 1920 },
  { id: 'portrait-qhd', label: 'Portrait QHD 2K (1440×2560)', width: 1440, height: 2560 },
  { id: 'portrait-4k', label: 'Portrait 4K UHD (2160×3840)', width: 2160, height: 3840 },
  { id: 'social-post', label: 'Social Post 4:5 (1080×1350)', width: 1080, height: 1350 },
  { id: 'social-post-qhd', label: 'Social Post 4:5 QHD (1440×1800)', width: 1440, height: 1800 },
  { id: 'social-post-4k', label: 'Social Post 4:5 4K (2160×2700)', width: 2160, height: 2700 },
  { id: 'twitter-cover', label: 'Cover Banner (1200×630)', width: 1200, height: 630 },
  { id: 'print-letter', label: 'Print 300 DPI Letter (2550×3300)', width: 2550, height: 3300 },
  { id: 'print-tabloid', label: 'Print 300 DPI Tabloid (3300×5100)', width: 3300, height: 5100 },
  { id: 'custom', label: 'Custom Resolution...', width: 1920, height: 1080 }
];

export const LAYOUT_TEMPLATES = [
  { id: 'justified', label: 'Smart Pack (No Crop)', description: 'Auto-adjusts for wide & tall photos without cropping' },
  { id: 'masonry', label: 'Masonry Columns', description: 'Staggered columns' },
  { id: 'grid', label: 'Equal Grid', description: 'Uniform grid cells' },
  { id: 'split-2v', label: '2 Splits (V)', description: 'Side by side' },
  { id: 'split-2h', label: '2 Splits (H)', description: 'Stacked rows' },
  { id: 'split-3v', label: '1 Big + 2 Side', description: 'Hero focus' },
  { id: 'grid-4', label: '2x2 Grid', description: '4 equal quadrants' },
  { id: 'scattered', label: 'Photo Pile', description: 'Rotated polaroids' },
  { id: 'strip-h', label: 'Filmstrip (H)', description: 'Horizontal strip' },
  { id: 'strip-v', label: 'Filmstrip (V)', description: 'Vertical strip' }
];

export function isLightColor(hex) {
  if (!hex || typeof hex !== 'string') return false;
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substr(0, 2), 16) || 0;
  const g = parseInt(c.substr(2, 2), 16) || 0;
  const b = parseInt(c.substr(4, 2), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export function calculateCellGeometries(count, width, height, { layoutType, margin, gap, photos }) {
  if (count === 0) return [];
  const cells = new Array(count);
  const usableW = width - margin * 2;
  const usableH = height - margin * 2;

  if (layoutType === 'justified' || layoutType === 'auto-fit') {
    const numPhotos = photos.length;
    if (numPhotos === 0) return [];

    const totalAR = photos.reduce((acc, p) => acc + (p.width && p.height ? p.width / p.height : 1.33), 0);
    const targetCanvasAR = usableW / (usableH || 1);
    
    let numRows = Math.max(1, Math.round(Math.sqrt(totalAR / (targetCanvasAR || 1))));
    if (numPhotos <= 3) numRows = 1;
    else if (numPhotos <= 8 && numRows > 3) numRows = 2;

    const rows = Array.from({ length: numRows }, () => []);
    photos.forEach((photo, i) => {
      const rowIdx = Math.min(numRows - 1, Math.floor((i / numPhotos) * numRows));
      rows[rowIdx].push({ photo, idx: i });
    });

    const rowData = rows.map(rowItems => {
      const rowAspectSum = rowItems.reduce((sum, item) => sum + (item.photo.width && item.photo.height ? item.photo.width / item.photo.height : 1.33), 0);
      const gapsWidth = Math.max(0, rowItems.length - 1) * gap;
      const rawHeight = (usableW - gapsWidth) / (rowAspectSum || 1);
      return { rowItems, rowAspectSum, rawHeight };
    });

    const totalRawHeight = rowData.reduce((sum, r) => sum + r.rawHeight, 0) + Math.max(0, numRows - 1) * gap;
    const heightScale = usableH / (totalRawHeight || 1);

    let currentY = margin;
    rowData.forEach(rData => {
      const scaledRowHeight = rData.rawHeight * heightScale;
      let currentX = margin;

      rData.rowItems.forEach(item => {
        const ar = item.photo.width && item.photo.height ? item.photo.width / item.photo.height : 1.33;
        const cellWidth = scaledRowHeight * ar;
        cells[item.idx] = {
          x: currentX,
          y: currentY,
          width: cellWidth,
          height: scaledRowHeight,
          angle: 0
        };
        currentX += cellWidth + gap;
      });

      currentY += scaledRowHeight + gap;
    });

    return cells;
  } else if (layoutType === 'grid') {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellW = (usableW - (cols - 1) * gap) / cols;
    const cellH = (usableH - (rows - 1) * gap) / rows;

    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      cells[i] = {
        x: margin + c * (cellW + gap),
        y: margin + r * (cellH + gap),
        width: cellW,
        height: cellH,
        angle: 0
      };
    }
  } else if (layoutType === 'masonry') {
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const cellW = (usableW - (cols - 1) * gap) / cols;
    const colHeights = new Array(cols).fill(margin);

    for (let i = 0; i < count; i++) {
      const photo = photos[i];
      const ar = photo && photo.width && photo.height ? photo.width / photo.height : 1.33;
      const cellH = cellW / ar;

      let minCol = 0;
      for (let c = 1; c < cols; c++) {
        if (colHeights[c] < colHeights[minCol]) minCol = c;
      }

      cells[i] = {
        x: margin + minCol * (cellW + gap),
        y: colHeights[minCol],
        width: cellW,
        height: cellH,
        angle: 0
      };

      colHeights[minCol] += cellH + gap;
    }
  } else if (layoutType === 'split-2v') {
    const cols = 2;
    const cellW = (usableW - gap) / cols;
    for (let i = 0; i < count; i++) {
      const c = i % 2;
      cells[i] = {
        x: margin + c * (cellW + gap),
        y: margin,
        width: cellW,
        height: usableH,
        angle: 0
      };
    }
  } else if (layoutType === 'split-2h') {
    const cellH = (usableH - gap) / 2;
    for (let i = 0; i < count; i++) {
      const r = i % 2;
      cells[i] = {
        x: margin,
        y: margin + r * (cellH + gap),
        width: usableW,
        height: cellH,
        angle: 0
      };
    }
  } else if (layoutType === 'split-3v') {
    const mainW = (usableW - gap) * 0.6;
    const sideW = (usableW - gap) * 0.4;
    const sideH = (usableH - gap) / 2;

    for (let i = 0; i < count; i++) {
      if (i === 0) {
        cells[i] = { x: margin, y: margin, width: mainW, height: usableH, angle: 0 };
      } else if (i === 1) {
        cells[i] = { x: margin + mainW + gap, y: margin, width: sideW, height: sideH, angle: 0 };
      } else {
        cells[i] = { x: margin + mainW + gap, y: margin + sideH + gap, width: sideW, height: sideH, angle: 0 };
      }
    }
  } else if (layoutType === 'grid-4') {
    const cellW = (usableW - gap) / 2;
    const cellH = (usableH - gap) / 2;
    for (let i = 0; i < count; i++) {
      const r = Math.floor((i % 4) / 2);
      const c = (i % 4) % 2;
      cells[i] = {
        x: margin + c * (cellW + gap),
        y: margin + r * (cellH + gap),
        width: cellW,
        height: cellH,
        angle: 0
      };
    }
  } else if (layoutType === 'scattered') {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cellW = (usableW - (cols - 1) * gap) / cols;
    const cellH = (usableH - (rows - 1) * gap) / rows;

    const angles = [-5, 4, -3, 6, -4, 3, -6, 5];
    for (let i = 0; i < count; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const angle = angles[i % angles.length];
      cells[i] = {
        x: margin + c * (cellW + gap),
        y: margin + r * (cellH + gap),
        width: cellW,
        height: cellH,
        angle
      };
    }
  } else if (layoutType === 'strip-h') {
    const cellW = (usableW - (count - 1) * gap) / count;
    for (let i = 0; i < count; i++) {
      cells[i] = {
        x: margin + i * (cellW + gap),
        y: margin,
        width: cellW,
        height: usableH,
        angle: 0
      };
    }
  } else if (layoutType === 'strip-v') {
    const cellH = (usableH - (count - 1) * gap) / count;
    for (let i = 0; i < count; i++) {
      cells[i] = {
        x: margin,
        y: margin + i * (cellH + gap),
        width: usableW,
        height: cellH,
        angle: 0
      };
    }
  }

  return cells;
}
