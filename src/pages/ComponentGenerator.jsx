import { useState, useRef, useCallback } from 'react';
import { CodeBracketSquareIcon } from '@heroicons/react/24/solid';
import { 
  buildGradientString, 
  buildAnimationCss, 
  generateComponentCss, 
  generateJsSnippet 
} from './ComponentGenerator/generators';
import { useComponentPresets } from './ComponentGenerator/useComponentPresets';
import ComponentPreview from './ComponentGenerator/ComponentPreview';
import { downloadComponentPdf, downloadSvgFile, copyComponentImage } from './ComponentGenerator/exportUtils';
import { generateNativeSvg } from './ComponentGenerator/nativeSvgGenerator';

import ContentControls from './ComponentGenerator/controls/ContentControls';
import IconControls from './ComponentGenerator/controls/IconControls';
import DimensionControls from './ComponentGenerator/controls/DimensionControls';
import EffectsControls from './ComponentGenerator/controls/EffectsControls';

export default function ComponentGenerator() {
  // State variables for component properties
  const [maxWidth, setMaxWidth] = useState(400);
  const [maxWidthUnit, setMaxWidthUnit] = useState('px');
  const [minHeight, setMinHeight] = useState(250);
  const [minHeightUnit, setMinHeightUnit] = useState('px');
  const [borderRadius, setBorderRadius] = useState(32);
  const [innerShadowColor, setInnerShadowColor] = useState('#13243f');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [glowHeight, setGlowHeight] = useState(30);
  const [glowBlur, setGlowBlur] = useState(15);
  const [showBottomGlow, setShowBottomGlow] = useState(true);
  const [enableLuminance, setEnableLuminance] = useState(true);
  const [hoverAnimations, setHoverAnimations] = useState({
    float: false,
    pulse: false,
    expand: true,
    tilt: true,
    shiftRight: false,
    jiggle: false,
    glowFlash: false,
    colorCycle: true,
    outerGlow: false,
    edgeGlow: false,
    shake: false,
    bounce: false
  });
  const [animIntensity, setAnimIntensity] = useState(1.0);

  const [bgImageUrl, setBgImageUrl] = useState('');
  const [bgImagePosition, setBgImagePosition] = useState('center');
  const [bgBrightness, setBgBrightness] = useState(100);
  const [bgContrast, setBgContrast] = useState(100);
  const [bgTint, setBgTint] = useState('transparent');
  const [fontFamily, setFontFamily] = useState('system-ui, -apple-system, sans-serif');
  const [cardTitle, setCardTitle] = useState('Content Title');
  const [cardSubtitle, setCardSubtitle] = useState('Content description.');
  const [cardTitleColor, setCardTitleColor] = useState('#ffffff');
  const [cardSubtitleColor, setCardSubtitleColor] = useState('#ffffff');
  const [cardTitleSize, setCardTitleSize] = useState(1.1);
  const [cardSubtitleSize, setCardSubtitleSize] = useState(0.9);
  const [iconSvg, setIconSvg] = useState(`<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style="color: white;">
  <path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clip-rule="evenodd" />
</svg>`);
  const [iconLink, setIconLink] = useState('');
  const [showText, setShowText] = useState(true);
  const [showIcon, setShowIcon] = useState(true);
  const [iconType, setIconType] = useState('material');
  const [iconName, setIconName] = useState('star');
  const [iconSize, setIconSize] = useState(50);
  const [iconFill, setIconFill] = useState(true);

  const previewRef = useRef(null);
  
  const [gradStops, setGradStops] = useState([
    { color: '#4285F4', position: 0 },
    { color: '#4285F4', position: 0.35 },
    { color: '#EA4335', position: 0.65 },
    { color: '#FBBC04', position: 0.82 },
    { color: '#34A853', position: 1.0 }
  ]);

  const [copySuccess, setCopySuccess] = useState(false);
  const [copyImageSuccess, setCopyImageSuccess] = useState(false);
  const [copySvgSuccess, setCopySvgSuccess] = useState(false);

  // Hook for user-saved presets
  const applyPresetData = useCallback((p) => {
    if (p.maxWidth !== undefined) setMaxWidth(p.maxWidth);
    if (p.maxWidthUnit !== undefined) setMaxWidthUnit(p.maxWidthUnit);
    if (p.minHeight !== undefined) setMinHeight(p.minHeight);
    if (p.minHeightUnit !== undefined) setMinHeightUnit(p.minHeightUnit);
    if (p.borderRadius !== undefined) setBorderRadius(p.borderRadius);
    if (p.innerShadowColor !== undefined) setInnerShadowColor(p.innerShadowColor);
    if (p.backgroundColor !== undefined) setBackgroundColor(p.backgroundColor);
    if (p.glowHeight !== undefined) setGlowHeight(p.glowHeight);
    if (p.glowBlur !== undefined) setGlowBlur(p.glowBlur);
    if (p.showBottomGlow !== undefined) setShowBottomGlow(p.showBottomGlow);
    if (p.enableLuminance !== undefined) setEnableLuminance(p.enableLuminance);
    if (p.hoverAnimations !== undefined) setHoverAnimations(prev => ({ ...prev, ...p.hoverAnimations }));
    if (p.animIntensity !== undefined) setAnimIntensity(p.animIntensity);
    if (p.bgImageUrl !== undefined) setBgImageUrl(p.bgImageUrl);
    if (p.bgBrightness !== undefined) setBgBrightness(p.bgBrightness);
    if (p.bgContrast !== undefined) setBgContrast(p.bgContrast);
    if (p.bgTint !== undefined) setBgTint(p.bgTint);
    if (p.bgImagePosition !== undefined) setBgImagePosition(p.bgImagePosition);
    if (p.fontFamily !== undefined) setFontFamily(p.fontFamily);
    if (p.cardTitle !== undefined) setCardTitle(p.cardTitle);
    if (p.cardSubtitle !== undefined) setCardSubtitle(p.cardSubtitle);
    if (p.iconSvg !== undefined) setIconSvg(p.iconSvg);
    if (p.iconLink !== undefined) setIconLink(p.iconLink);
    if (p.iconType !== undefined) setIconType(p.iconType);
    if (p.iconName !== undefined) setIconName(p.iconName);
    if (p.iconSize !== undefined) setIconSize(p.iconSize);
    if (p.iconFill !== undefined) setIconFill(p.iconFill);
    if (p.showText !== undefined) setShowText(p.showText);
    if (p.showIcon !== undefined) setShowIcon(p.showIcon);
    if (p.cardTitleColor !== undefined) setCardTitleColor(p.cardTitleColor);
    if (p.cardSubtitleColor !== undefined) setCardSubtitleColor(p.cardSubtitleColor);
    if (p.cardTitleSize !== undefined) setCardTitleSize(p.cardTitleSize);
    if (p.cardSubtitleSize !== undefined) setCardSubtitleSize(p.cardSubtitleSize);
    if (p.gradStops !== undefined) setGradStops(p.gradStops);
  }, []);

  const currentPresetData = {
    maxWidth, maxWidthUnit, minHeight, minHeightUnit, borderRadius, innerShadowColor, backgroundColor,
    glowHeight, glowBlur, showBottomGlow, enableLuminance, hoverAnimations, animIntensity, bgImageUrl,
    bgBrightness, bgContrast, bgTint, bgImagePosition, fontFamily, cardTitle, cardSubtitle, iconSvg,
    iconLink, iconType, iconName, iconSize, iconFill, showText, showIcon, cardTitleColor, cardSubtitleColor,
    cardTitleSize, cardSubtitleSize, gradStops
  };

  const { presetName, setPresetName, presets, savePreset, loadPreset, deletePreset } = useComponentPresets(currentPresetData, applyPresetData);

  // Gradient string & Animation CSS
  const gradientString = buildGradientString(gradStops);
  const animationCss = buildAnimationCss(hoverAnimations, animIntensity, gradientString);

  // CSS Code generation
  const cssCode = generateComponentCss({
    maxWidth, maxWidthUnit, minHeight, minHeightUnit, borderRadius,
    innerShadowColor, backgroundColor, showBottomGlow, glowBlur, glowHeight,
    gradientString, enableLuminance, bgImageUrl, bgImagePosition, bgBrightness,
    bgContrast, bgTint, showText, showIcon, iconLink, fontFamily, cardTitleColor,
    cardSubtitleColor, cardTitleSize, cardSubtitleSize, iconSize, animationCss
  });

  const materialLink = iconType === 'material' && showIcon ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />' : '';

  const innerHtml = `
  <div class="glow-container">
    <div class="inner-glow"></div>
    <div class="outer-glow"></div>
  </div>
  ${showIcon ? `
  <div class="icon-container">
    ${iconType === 'svg' ? iconSvg : `<span class="material-symbols-outlined">${iconName}</span>`}
  </div>` : ''}
  ${showText ? `
  <div class="text-container">
    <h3 class="card-title">${cardTitle}</h3>
    <p class="card-subtitle">${cardSubtitle}</p>
  </div>` : ''}
`;

  const handleMouseMove = (e) => {
    if (!enableLuminance || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    previewRef.current.style.setProperty('--mouse-x', `${x}px`);
    previewRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    if (!enableLuminance || !previewRef.current) return;
    previewRef.current.style.setProperty('--mouse-x', `-999px`);
    previewRef.current.style.setProperty('--mouse-y', `-999px`);
  };

  const handleCopyCode = () => {
    const jsSnippet = generateJsSnippet(enableLuminance);
    const fullHtml = `<!-- Required CSS -->
<style>
${cssCode}
</style>
${materialLink ? `\n<!-- Google Material Symbols -->\n${materialLink}\n` : ''}
<!-- Component Markup -->
${iconLink ? `<a href="${iconLink}" class="animated-card" target="_blank" rel="noopener noreferrer">${innerHtml}</a>` : `<div class="animated-card">${innerHtml}</div>`}
${jsSnippet ? `\n<!-- Luminance Script -->\n<script>\n${jsSnippet}\n</script>` : ''}`;

    navigator.clipboard.writeText(fullHtml);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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
