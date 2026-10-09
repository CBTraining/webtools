/**
 * Generates standalone, pixel-perfect native SVG markup for the generated component.
 */
export async function generateNativeSvg({
  element,
  gradStops,
  glowBlur,
  glowHeight,
  showBottomGlow,
  borderRadius,
  innerShadowColor,
  backgroundColor,
  hoverAnimations,
  animIntensity,
  bgImageUrl,
  bgTint,
  showIcon,
  iconType,
  iconSvg,
  iconName,
  iconFill,
  iconSize,
  showText,
  cardTitle,
  cardSubtitle,
  cardTitleColor,
  cardSubtitleColor,
  fontFamily
}) {
  if (!element) return '';
  const cardRect = element.getBoundingClientRect();
  const w = cardRect.width;
  const h = cardRect.height;
  const r = borderRadius;

  const hasOuterGlow = hoverAnimations.outerGlow || hoverAnimations.edgeGlow;
  const pad = hasOuterGlow ? Math.round(40 * animIntensity + 20) : 0;

  let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + pad * 2}" viewBox="-${pad} -${pad} ${w + pad * 2} ${h + pad * 2}">`;
  svgStr += `<defs>`;
  
  svgStr += `<linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">`;
  const sortedStops = [...gradStops].sort((a, b) => a.position - b.position);
  sortedStops.forEach(stop => {
    svgStr += `<stop offset="${stop.position * 100}%" stop-color="${stop.color}" />`;
  });
  svgStr += `</linearGradient>`;

  svgStr += `<filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="${glowBlur}" />
  </filter>`;

  if (hoverAnimations.outerGlow) {
    svgStr += `<filter id="outerGlowFilter" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="${25 * animIntensity}" />
    </filter>`;
  }

  if (hoverAnimations.edgeGlow) {
    svgStr += `<filter id="edgeGlowFilter" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="${15 * animIntensity}" />
    </filter>`;
  }

  svgStr += `<clipPath id="cardClip">
    <rect x="0" y="0" width="${w}" height="${h}" rx="${r}" />
  </clipPath>`;
  svgStr += `</defs>`;

  // Outer Glow behind card
  if (hoverAnimations.outerGlow) {
    const glowCol = sortedStops.length > 0 ? sortedStops[0].color : '#4285F4';
    svgStr += `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="${glowCol}" filter="url(#outerGlowFilter)" opacity="0.85" />`;
  }

  // Edge Glow behind card
  if (hoverAnimations.edgeGlow) {
    const edgeCol = sortedStops.length > 0 ? sortedStops[0].color : '#ffffff';
    svgStr += `<rect x="-4" y="-4" width="${w+8}" height="${h+8}" rx="${r+4}" fill="none" stroke="${edgeCol}" stroke-width="${4 * animIntensity}" filter="url(#edgeGlowFilter)" opacity="0.9" />`;
  }

  // Background (use innerShadowColor as card base if backgroundColor is transparent)
  const cardBaseFill = (backgroundColor && backgroundColor !== 'transparent') ? backgroundColor : innerShadowColor;
  svgStr += `<rect x="0" y="0" width="${w}" height="${h}" rx="${r}" fill="${cardBaseFill}" />`;
  
  if (bgImageUrl) {
    svgStr += `<g clip-path="url(#cardClip)">
      <image href="${bgImageUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />
      <rect x="0" y="0" width="${w}" height="${h}" fill="${bgTint}" />
    </g>`;
  }

  // Glow
  if (showBottomGlow) {
    svgStr += `<g clip-path="url(#cardClip)">
      <rect x="-${w}" y="${h - glowHeight}" width="${w * 3}" height="${glowHeight + 100}" fill="url(#glowGrad)" filter="url(#glowBlur)" />
    </g>`;
  }

  // Crisp 1px inner border
  svgStr += `<rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="${r}" fill="none" stroke="${innerShadowColor}" stroke-width="1.5" />`;

  // Elements
  const iconNode = element.querySelector('.glow-card-icon');
  if (iconNode && showIcon) {
    const iRect = iconNode.getBoundingClientRect();
    const dx = iRect.left - cardRect.left;
    const dy = iRect.top - cardRect.top;
    if (iconType === 'svg') {
       svgStr += `<g transform="translate(${dx}, ${dy})">${iconSvg}</g>`;
    } else {
       try {
         const cleanName = iconName.toLowerCase().trim().replace(/_/g, '-');
         const suffix = iconFill ? '-rounded' : '-outline-rounded';
         let queryName = cleanName;
         if (!queryName.endsWith('-rounded')) queryName += suffix;
         
         const res = await fetch(`https://api.iconify.design/material-symbols/${queryName}.svg`);
         if (res.ok) {
           const svgText = await res.text();
           const sizedSvg = svgText.replace(/width="[^"]*"/, `width="${iconSize}"`).replace(/height="[^"]*"/, `height="${iconSize}"`).replace('<svg ', '<svg color="white" ');
           svgStr += `<g transform="translate(${dx}, ${dy})">${sizedSvg}</g>`;
         } else {
           throw new Error('Icon fetch failed');
         }
       } catch (e) {
         svgStr += `<text x="${dx}" y="${dy}" dominant-baseline="hanging" font-family="Material Symbols Rounded" font-size="${iconSize}px" fill="white" font-weight="400">${iconName}</text>`;
       }
    }
  }

  const titleNode = element.querySelector('.glow-card-title');
  if (titleNode && showText) {
    const tRect = titleNode.getBoundingClientRect();
    const dx = tRect.left - cardRect.left;
    const dy = tRect.top - cardRect.top;
    const computedStyle = window.getComputedStyle(titleNode);
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight;
    svgStr += `<text x="${dx}" y="${dy + parseFloat(fontSize) * 0.1}" dominant-baseline="hanging" font-family="${fontFamily.replace(/"/g, "'")}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${cardTitleColor}">${cardTitle}</text>`;
  }

  const subNode = element.querySelector('.glow-card-subtitle');
  if (subNode && showText) {
    const sRect = subNode.getBoundingClientRect();
    const dx = sRect.left - cardRect.left;
    const dy = sRect.top - cardRect.top;
    const computedStyle = window.getComputedStyle(subNode);
    const fontSize = computedStyle.fontSize;
    const fontWeight = computedStyle.fontWeight;
    svgStr += `<text x="${dx}" y="${dy + parseFloat(fontSize) * 0.1}" dominant-baseline="hanging" font-family="${fontFamily.replace(/"/g, "'")}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${cardSubtitleColor}" opacity="0.8">${cardSubtitle}</text>`;
  }

  svgStr += `</svg>`;
  return svgStr;
}
