/**
 * Parses an SVG markup string to detect native width, height, and viewBox aspect ratio.
 *
 * @param {string} svgText
 * @returns {{ width: number|null, height: number|null, aspectRatio: number|null }}
 */
export function parseSvgDimensions(svgText) {
  if (!svgText || !svgText.trim() || !svgText.includes('<svg')) {
    return { width: null, height: null, aspectRatio: null };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return { width: null, height: null, aspectRatio: null };

    const wAttr = svgEl.getAttribute('width');
    const hAttr = svgEl.getAttribute('height');
    const viewBox = svgEl.getAttribute('viewBox');
    
    let parsedW = null;
    let parsedH = null;

    // Parse viewBox first for accurate aspect ratio
    if (viewBox) {
      const parts = viewBox.split(/[ ,\n\t]+/).filter(Boolean).map(parseFloat);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        parsedW = parts[2];
        parsedH = parts[3];
      }
    }

    // If width/height attributes are explicit numeric pixels, use them
    if (wAttr && !wAttr.includes('%')) {
      const wVal = parseFloat(wAttr);
      if (wVal > 0) parsedW = wVal;
    }
    if (hAttr && !hAttr.includes('%')) {
      const hVal = parseFloat(hAttr);
      if (hVal > 0) parsedH = hVal;
    }

    if (parsedW && parsedH && parsedW > 0 && parsedH > 0) {
      return {
        width: parsedW,
        height: parsedH,
        aspectRatio: parsedW / parsedH
      };
    }
  } catch (e) {
    console.error("Failed to parse SVG dimensions", e);
  }

  return { width: null, height: null, aspectRatio: null };
}
