import { useState, useCallback } from 'react';

const DEFAULT_HOVER_ANIMATIONS = {
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
};

const DEFAULT_GRAD_STOPS = [
  { color: '#4285F4', position: 0 },
  { color: '#4285F4', position: 0.35 },
  { color: '#EA4335', position: 0.65 },
  { color: '#FBBC04', position: 0.82 },
  { color: '#34A853', position: 1.0 }
];

const DEFAULT_ICON_SVG = `<svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style="color: white;">
  <path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clip-rule="evenodd" />
</svg>`;

export function useComponentState() {
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
  const [hoverAnimations, setHoverAnimations] = useState(DEFAULT_HOVER_ANIMATIONS);
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
  const [iconSvg, setIconSvg] = useState(DEFAULT_ICON_SVG);
  const [iconLink, setIconLink] = useState('');
  const [showText, setShowText] = useState(true);
  const [showIcon, setShowIcon] = useState(true);
  const [iconType, setIconType] = useState('material');
  const [iconName, setIconName] = useState('star');
  const [iconSize, setIconSize] = useState(50);
  const [iconFill, setIconFill] = useState(true);
  const [gradStops, setGradStops] = useState(DEFAULT_GRAD_STOPS);

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

  return {
    state: currentPresetData,
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
  };
}
