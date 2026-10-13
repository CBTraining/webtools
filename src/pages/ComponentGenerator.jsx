import { useState, useRef } from 'react';
import { CodeBracketSquareIcon } from '@heroicons/react/24/solid';
import { 
  buildGradientString, 
  buildAnimationCss, 
  generateComponentCss, 
  generateJsSnippet 
} from './ComponentGenerator/generators';
import { useComponentPresets } from './ComponentGenerator/useComponentPresets';
import { useComponentState } from './ComponentGenerator/useComponentState';
import ComponentPreview from './ComponentGenerator/ComponentPreview';
import { downloadComponentPdf, downloadSvgFile, copyComponentImage } from './ComponentGenerator/exportUtils';
import { generateNativeSvg } from './ComponentGenerator/nativeSvgGenerator';

import ContentControls from './ComponentGenerator/controls/ContentControls';
import IconControls from './ComponentGenerator/controls/IconControls';
import DimensionControls from './ComponentGenerator/controls/DimensionControls';
import EffectsControls from './ComponentGenerator/controls/EffectsControls';

export default function ComponentGenerator() {
  const componentState = useComponentState();
  const {
    maxWidth, setMaxWidth,
    maxWidthUnit, setMaxWidthUnit,
    minHeight, setMinHeight,
    minHeightUnit, setMinHeightUnit,
    borderRadius, setBorderRadius,
    innerShadowColor, setInnerShadowColor,
    backgroundColor, setBackgroundColor,
    glowHeight, setGlowHeight,
    glowBlur, setGlowBlur,
    showBottomGlow, setShowBottomGlow,
    enableLuminance, setEnableLuminance,
    hoverAnimations, setHoverAnimations,
    animIntensity, setAnimIntensity,
    bgImageUrl, setBgImageUrl,
    bgImagePosition, setBgImagePosition,
    bgBrightness, setBgBrightness,
    bgContrast, setBgContrast,
    bgTint, setBgTint,
    fontFamily, setFontFamily,
    cardTitle, setCardTitle,
    cardSubtitle, setCardSubtitle,
    cardTitleColor, setCardTitleColor,
    cardSubtitleColor, setCardSubtitleColor,
    cardTitleSize, setCardTitleSize,
    cardSubtitleSize, setCardSubtitleSize,
    iconSvg, setIconSvg,
    iconLink, setIconLink,
    showText, setShowText,
    showIcon, setShowIcon,
    iconType, setIconType,
    iconName, setIconName,
    iconSize, setIconSize,
    iconFill, setIconFill,
    gradStops, setGradStops,
    applyPresetData,
    currentPresetData
  } = componentState;

  const previewRef = useRef(null);

  const [copySuccess, setCopySuccess] = useState(false);
  const [copyImageSuccess, setCopyImageSuccess] = useState(false);
  const [copySvgSuccess, setCopySvgSuccess] = useState(false);

  const { presetName, setPresetName, presets, savePreset, loadPreset, deletePreset } = useComponentPresets(currentPresetData, applyPresetData);

  // Gradient string & Animation CSS
  const sortedStops = [...(gradStops || [])].sort((a, b) => a.position - b.position);
  const gradientString = buildGradientString(gradStops, hoverAnimations?.colorCycle);
  const animationCss = buildAnimationCss({
    hoverAnimations,
    animIntensity,
    sortedStops,
    showBottomGlow,
    glowBlur,
    glowHeight
  });

  // CSS Code generation
  const cssCode = generateComponentCss({
    fontFamily,
    maxWidth,
    maxWidthUnit,
    minHeight,
    minHeightUnit,
    backgroundColor,
    borderRadius,
    innerShadowColor,
    showBottomGlow,
    glowHeight,
    glowBlur,
    gradientString,
    hoverAnimations,
    bgImageUrl,
    bgImagePosition,
    bgBrightness,
    bgContrast,
    bgTint,
    enableLuminance,
    iconSize,
    cardTitleSize,
    cardTitleColor,
    cardSubtitleSize,
    cardSubtitleColor,
    animationCss
  });

  const iconContent = iconType === 'svg' 
    ? iconSvg.trim().split('\n').join('\n    ')
    : `<span class="material-symbols-rounded" style="font-size: ${iconSize}px; color: white; font-variation-settings: 'FILL' ${iconFill ? 1 : 0};">${iconName}</span>`;

  const materialLink = iconType === 'material' && showIcon
    ? `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0..1,0" />\n` 
    : '';

  const innerHtml = `
  ${enableLuminance ? `<div class="luminance-overlay"></div>\n  ` : ''}${bgImageUrl ? `<div class="glow-card-bg"></div>\n  ` : ''}${showIcon ? `<div class="glow-card-icon">
    ${iconContent}
  </div>\n  ` : ''}${showText ? `<div class="glow-card-content">
    <h3 class="glow-card-title">${cardTitle}</h3>
    <p class="glow-card-subtitle">${cardSubtitle}</p>
  </div>` : ''}
`.trim();

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (enableLuminance) {
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }

    if (hoverAnimations?.tilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -15 * animIntensity;
      const rotateY = ((x - centerX) / centerX) * 15 * animIntensity;

      let transformStr = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      if (hoverAnimations.expand) transformStr += ` scale(${1 + (0.02 * animIntensity)})`;
      if (hoverAnimations.float) transformStr += ` translateY(${-5 * animIntensity}px)`;
      if (hoverAnimations.shiftRight) transformStr += ` translateX(${8 * animIntensity}px)`;

      card.style.transform = transformStr;
    }
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    if (enableLuminance) {
      card.style.setProperty('--mouse-x', `-999px`);
      card.style.setProperty('--mouse-y', `-999px`);
    }
    if (hoverAnimations?.tilt) {
      card.style.transform = '';
    }
  };

  const handleCopyCode = async () => {
    try {
      const jsSnippet = generateJsSnippet({ enableLuminance, hoverAnimations, animIntensity });
      const htmlCode = iconLink.trim()
        ? `${materialLink}<a href="${iconLink}" target="_blank" rel="noopener noreferrer" class="glow-card" style="text-decoration: none; color: inherit;">\n  ${innerHtml}\n</a>${jsSnippet}`.trim()
        : `${materialLink}<div class="glow-card">\n  ${innerHtml}\n</div>${jsSnippet}`.trim();
      const fullCode = `<style>\n${cssCode}\n</style>\n\n${htmlCode}`;
      await navigator.clipboard.writeText(fullCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy code", err);
    }
  };

  const getComponentSvg = async () => {
    if (!previewRef.current) return '';
    const originalTransform = previewRef.current.style.transform;
    previewRef.current.style.transform = 'none';

    try {
      const svgStr = await generateNativeSvg({
        previewEl: previewRef.current,
        maxWidth,
        maxWidthUnit,
        minHeight,
        minHeightUnit,
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
      });

      previewRef.current.style.transform = originalTransform;
      return svgStr;
    } catch (err) {
      console.warn("generateNativeSvg failed", err);
      return '';
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const svgStr = await getComponentSvg();
      if (svgStr) downloadSvgFile(svgStr, 'component.svg');
    } catch (err) {
      console.error("Failed to download SVG", err);
    }
  };

  const handleCopySvg = async () => {
    try {
      const svgStr = await getComponentSvg();
      if (svgStr) {
        await navigator.clipboard.writeText(svgStr);
        setCopySvgSuccess(true);
        setTimeout(() => setCopySvgSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy SVG", err);
    }
  };

  const handleCopyImage = async () => {
    if (!previewRef.current) return;
    try {
      const success = await copyComponentImage(previewRef.current);
      if (success) {
        setCopyImageSuccess(true);
        setTimeout(() => setCopyImageSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy image", err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      await downloadComponentPdf(previewRef.current, 'component.pdf');
    } catch (err) {
      console.error("Failed to export PDF", err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '0' }}>
        <CodeBracketSquareIcon />
        <h1>Component Generator</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Preview Area Component */}
        <ComponentPreview 
          previewRef={previewRef}
          cssCode={cssCode}
          materialLink={materialLink}
          innerHtml={innerHtml}
          iconLink={iconLink}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onDownloadPdf={handleDownloadPdf}
          onDownloadSvg={handleDownloadSvg}
          onCopySvg={handleCopySvg}
          onCopyImage={handleCopyImage}
          onCopyCode={handleCopyCode}
          copySvgSuccess={copySvgSuccess}
          copyImageSuccess={copyImageSuccess}
          copySuccess={copySuccess}
        />

        {/* Controls Area */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Properties
          </h2>

          {/* Preset Management Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
            <span style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Presets:</span>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Preset Name" 
              value={presetName} 
              onChange={e => setPresetName(e.target.value)} 
              style={{ width: '200px', padding: '0.5rem' }} 
            />
            <button className="btn" onClick={savePreset}>Save</button>
            <button className="btn" onClick={deletePreset} style={{ color: '#ff4444', borderColor: 'rgba(255,68,68,0.3)' }}>Delete</button>
            <div style={{ flex: 1 }}></div>
            <select 
              className="input-field" 
              style={{ padding: '0.5rem', width: '200px' }} 
              onChange={e => { loadPreset(e.target.value); setPresetName(e.target.value); }} 
              value=""
            >
              <option value="" disabled>Load Preset...</option>
              {Object.keys(presets).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
            {/* Column 1: Content & Link */}
            <ContentControls
              showText={showText}
              setShowText={setShowText}
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              cardTitle={cardTitle}
              setCardTitle={setCardTitle}
              cardTitleSize={cardTitleSize}
              setCardTitleSize={setCardTitleSize}
              cardTitleColor={cardTitleColor}
              setCardTitleColor={setCardTitleColor}
              cardSubtitle={cardSubtitle}
              setCardSubtitle={setCardSubtitle}
              cardSubtitleSize={cardSubtitleSize}
              setCardSubtitleSize={setCardSubtitleSize}
              cardSubtitleColor={cardSubtitleColor}
              setCardSubtitleColor={setCardSubtitleColor}
              iconLink={iconLink}
              setIconLink={setIconLink}
            />

            {/* Column 2: Icon Settings */}
            <IconControls
              showIcon={showIcon}
              setShowIcon={setShowIcon}
              iconType={iconType}
              setIconType={setIconType}
              iconSvg={iconSvg}
              setIconSvg={setIconSvg}
              iconName={iconName}
              setIconName={setIconName}
              iconFill={iconFill}
              setIconFill={setIconFill}
              iconSize={iconSize}
              setIconSize={setIconSize}
            />

            {/* Column 3: Dimensions & Shape */}
            <DimensionControls
              maxWidth={maxWidth}
              setMaxWidth={setMaxWidth}
              maxWidthUnit={maxWidthUnit}
              setMaxWidthUnit={setMaxWidthUnit}
              minHeight={minHeight}
              setMinHeight={setMinHeight}
              minHeightUnit={minHeightUnit}
              setMinHeightUnit={setMinHeightUnit}
              borderRadius={borderRadius}
              setBorderRadius={setBorderRadius}
              innerShadowColor={innerShadowColor}
              setInnerShadowColor={setInnerShadowColor}
              backgroundColor={backgroundColor}
              setBackgroundColor={setBackgroundColor}
              enableLuminance={enableLuminance}
              setEnableLuminance={setEnableLuminance}
            />

            {/* Column 4: Lighting & Effects */}
            <EffectsControls
              showBottomGlow={showBottomGlow}
              setShowBottomGlow={setShowBottomGlow}
              gradStops={gradStops}
              setGradStops={setGradStops}
              glowHeight={glowHeight}
              setGlowHeight={setGlowHeight}
              glowBlur={glowBlur}
              setGlowBlur={setGlowBlur}
              bgImageUrl={bgImageUrl}
              setBgImageUrl={setBgImageUrl}
              bgImagePosition={bgImagePosition}
              setBgImagePosition={setBgImagePosition}
              bgBrightness={bgBrightness}
              setBgBrightness={setBgBrightness}
              bgContrast={bgContrast}
              setBgContrast={setBgContrast}
              bgTint={bgTint}
              setBgTint={setBgTint}
              animIntensity={animIntensity}
              setAnimIntensity={setAnimIntensity}
              hoverAnimations={hoverAnimations}
              setHoverAnimations={setHoverAnimations}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
