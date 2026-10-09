export const hexToHSL = (hex) => {
  if (!hex || hex.length < 7) return [0, 0, 0];
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

export const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

export const generateScheme = (baseHex) => {
  if (!baseHex) return [];
  const [h, s, l] = hexToHSL(baseHex);
  
  return [
    { label: 'Complementary', hex: hslToHex((h + 180) % 360, s, l) },
    { label: 'Analogous', hex: hslToHex((h + 30) % 360, s, l) },
    { label: 'Analogous', hex: hslToHex((h + 330) % 360, s, l) },
    { label: 'Triadic', hex: hslToHex((h + 120) % 360, s, l) },
    { label: 'Triadic', hex: hslToHex((h + 240) % 360, s, l) }
  ];
};
