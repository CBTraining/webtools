export function buildGradientString(gradStops, colorCycle) {
  const sortedStops = [...gradStops].sort((a, b) => a.position - b.position);
  const loopStops = [];
  sortedStops.forEach(s => { loopStops.push(`${s.color} ${Math.round(s.position * 50)}%`); });
  sortedStops.forEach(s => { loopStops.push(`${s.color} ${Math.round(50 + s.position * 50)}%`); });

  return colorCycle
    ? `linear-gradient(90deg, ${loopStops.join(', ')})`
    : `linear-gradient(90deg, ${sortedStops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')})`;
}

export function buildAnimationCss({ hoverAnimations, animIntensity, sortedStops, showBottomGlow, glowBlur, glowHeight }) {
  let animationCss = '';
  let transformStr = `perspective(1000px) rotateX(0deg) rotateY(0deg) `;
  if (hoverAnimations.expand) transformStr += `scale(${1 + (0.02 * animIntensity)}) `;
  else transformStr += `scale(1) `;

  if (hoverAnimations.float) transformStr += `translateY(${-5 * animIntensity}px) `;
  else transformStr += `translateY(0px) `;

  if (hoverAnimations.shiftRight) transformStr += `translateX(${8 * animIntensity}px) `;
  else transformStr += `translateX(0px) `;

  const hasTransform = hoverAnimations.expand || hoverAnimations.float || hoverAnimations.shiftRight;
  const cardAnimations = [];
  if (hoverAnimations.jiggle) cardAnimations.push(`jiggle 0.3s ease-in-out infinite`);
  if (hoverAnimations.shake) cardAnimations.push(`shake 0.4s ease-in-out infinite`);
  if (hoverAnimations.bounce) cardAnimations.push(`bounce 0.5s ease-in-out infinite`);

  if (hoverAnimations.tilt) {
    animationCss += `\n.glow-card:hover { transition: all 0.3s ease, transform 0.1s ease-out; }`;
  }
  if (hasTransform || hoverAnimations.float || hoverAnimations.outerGlow || hoverAnimations.edgeGlow || cardAnimations.length > 0) {
    animationCss += `\n.glow-card:hover {`;
    if (hasTransform) animationCss += `\n  transform: ${transformStr.trim()};`;

    const shadows = [];
    if (hoverAnimations.float) shadows.push(`0 ${10 * animIntensity}px ${20 * animIntensity}px rgba(0,0,0,0.5)`);
    if (hoverAnimations.outerGlow) {
      const glowCol = sortedStops.length > 0 ? sortedStops[0].color : 'rgba(255,255,255,0.5)';
      shadows.push(`0 0 ${40 * animIntensity}px ${glowCol}`);
    }
    if (hoverAnimations.edgeGlow) {
      const edgeCol = sortedStops.length > 0 ? sortedStops[0].color : 'white';
      shadows.push(`inset 0 0 0 2px ${edgeCol}`, `0 0 ${20 * animIntensity}px ${edgeCol}`);
    }
    if (shadows.length > 0) {
      animationCss += `\n  box-shadow: \n    ${shadows.join(',\n    ')};`;
    }

    if (cardAnimations.length > 0) animationCss += `\n  animation: ${cardAnimations.join(', ')};`;
    animationCss += `\n}`;
  }

  if (hoverAnimations.jiggle) {
    animationCss += `\n@keyframes jiggle {
  0% { transform: rotate(${-3 * animIntensity}deg); }
  50% { transform: rotate(${3 * animIntensity}deg); }
  100% { transform: rotate(${-3 * animIntensity}deg); }
}`;
  }

  if (hoverAnimations.shake) {
    animationCss += `\n@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(${-4 * animIntensity}px); }
  75% { transform: translateX(${4 * animIntensity}px); }
}`;
  }

  if (hoverAnimations.bounce) {
    animationCss += `\n@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(${-10 * animIntensity}px); }
}`;
  }

  if (hoverAnimations.colorCycle) {
    animationCss += `\n@keyframes colorCycle {
  0% { background-position: 0% 50%; background-size: 200% 100%; }
  50% { background-size: 300% 150%; }
  100% { background-position: 200% 50%; background-size: 200% 100%; }
}`;
  }

  if (showBottomGlow) {
    const afterAnimations = [];
    if (hoverAnimations.glowFlash) afterAnimations.push(`glowFlash 1s infinite`);
    if (hoverAnimations.colorCycle) afterAnimations.push(`colorCycle ${5 / animIntensity}s linear infinite`);

    if (hoverAnimations.pulse || hoverAnimations.float || afterAnimations.length > 0) {
      animationCss += `\n.glow-card:hover::after {`;
      if (hoverAnimations.float) animationCss += `\n  opacity: 0.8;`;
      if (hoverAnimations.pulse) animationCss += `\n  filter: blur(${glowBlur + (10 * animIntensity)}px) saturate(${100 + (glowBlur * 2)}%);\n  height: ${glowHeight + (10 * animIntensity)}px;`;
      if (afterAnimations.length > 0) animationCss += `\n  animation: ${afterAnimations.join(', ')};`;
      animationCss += `\n}`;
    }
  }

  if (hoverAnimations.glowFlash) {
    animationCss += `\n@keyframes glowFlash {
  0% { filter: blur(${glowBlur}px) saturate(${100 + (glowBlur * 2)}%); height: ${glowHeight}px; opacity: 0.5; }
  50% { filter: blur(${glowBlur + (15 * animIntensity)}px) saturate(${100 + (glowBlur * 2)}%); height: ${glowHeight + (15 * animIntensity)}px; opacity: 1; }
  100% { filter: blur(${glowBlur}px) saturate(${100 + (glowBlur * 2)}%); height: ${glowHeight}px; opacity: 0.5; }
}`;
  }

  return animationCss;
}

export function generateComponentCss(props) {
  const {
    fontFamily, maxWidth, maxWidthUnit, minHeight, minHeightUnit,
    backgroundColor, borderRadius, innerShadowColor, showBottomGlow,
    glowHeight, glowBlur, gradientString, hoverAnimations, bgImageUrl,
    bgImagePosition, bgBrightness, bgContrast, bgTint, enableLuminance,
    iconSize, cardTitleSize, cardTitleColor, cardSubtitleSize, cardSubtitleColor,
    animationCss
  } = props;

  return `
.glow-card {
  width: 100%;
  font-family: ${fontFamily};
  max-width: ${maxWidth}${maxWidthUnit};
  min-height: ${minHeight}${minHeightUnit};
  background-color: ${backgroundColor};
  border-radius: ${borderRadius}px;
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: all 0.3s ease;
  transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateY(0px) translateX(0px);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 24px;
}

.glow-card::before {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: 
    inset 0 4px 30px ${innerShadowColor},
    inset 0 0 0 1px ${innerShadowColor};
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  transition: all 0.3s ease;
}

.glow-card:hover::before {
  box-shadow: 
    inset 0 4px 50px ${innerShadowColor},
    inset 0 0 0 2px ${innerShadowColor};
}
${showBottomGlow ? `
.glow-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: ${glowHeight}px;
  background: ${gradientString};
  background-size: ${hoverAnimations.colorCycle ? '200% 100%' : '100% 100%'};
  background-position: 0% 50%;
  filter: blur(${glowBlur}px) saturate(${100 + (glowBlur * 2)}%);
  z-index: 2;
  pointer-events: none;
  opacity: 1;
  clip-path: inset(-200px 0 0 0 round 0 0 ${borderRadius}px ${borderRadius}px);
  transition: opacity 0.3s ease, filter 0.3s ease, height 0.3s ease, background-position 1.5s ease-out, background-size 1.5s ease-out;
}
` : ''}
${bgImageUrl ? `
.glow-card-bg {
  position: absolute;
  inset: 0;
  background-image: url('${bgImageUrl}');
  background-size: cover;
  background-position: ${bgImagePosition};
  filter: brightness(${bgBrightness}%) contrast(${bgContrast}%);
  z-index: 1;
}

.glow-card-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: ${bgTint};
}
` : ''}
${enableLuminance ? `
.luminance-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle 200px at var(--mouse-x, -200px) var(--mouse-y, -200px),
    rgba(255, 255, 255, 0.08),
    transparent 80%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}
.glow-card:hover .luminance-overlay {
  opacity: 1;
}` : ''}

.glow-card-icon, .glow-card-content {
  position: relative;
  z-index: 3;
}

.glow-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.glow-card-icon svg {
  width: ${iconSize}px;
  height: ${iconSize}px;
}

.glow-card-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: white;
  font-family: system-ui, -apple-system, sans-serif;
}

.glow-card-title {
  font-weight: 700;
  font-size: ${cardTitleSize}rem;
  color: ${cardTitleColor};
  margin: 0;
}

.glow-card-subtitle {
  font-weight: 400;
  font-size: ${cardSubtitleSize}rem;
  opacity: 0.8;
  color: ${cardSubtitleColor};
  margin: 0;
}${animationCss}`.trim();
}

export function generateJsSnippet({ enableLuminance, hoverAnimations, animIntensity }) {
  if (!enableLuminance && !hoverAnimations.tilt) return '';

  return `
<script>
  document.querySelectorAll('.glow-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ${enableLuminance ? `
      card.style.setProperty('--mouse-x', \`\${x}px\`);
      card.style.setProperty('--mouse-y', \`\${y}px\`);
      ` : ''}
      ${hoverAnimations.tilt ? `
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -${15 * animIntensity};
      const rotateY = ((x - centerX) / centerX) * ${15 * animIntensity};
      
      let transformStr = \`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) \`;
      ${hoverAnimations.expand ? `transformStr += \`scale(${1 + (0.02 * animIntensity)}) \`;` : 'transformStr += `scale(1) `;'}
      ${hoverAnimations.float ? `transformStr += \`translateY(${-5 * animIntensity}px) \`;` : 'transformStr += `translateY(0px) `;'}
      ${hoverAnimations.shiftRight ? `transformStr += \`translateX(${8 * animIntensity}px) \`;` : 'transformStr += `translateX(0px) `;'}
      
      card.style.transform = transformStr;
      ` : ''}
    });
    ${hoverAnimations.tilt ? `
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
    ` : ''}
  });
</script>`.trim();
}
