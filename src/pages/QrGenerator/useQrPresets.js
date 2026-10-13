import { useState } from 'react';

const DEFAULT_PRESETS = [
  {
    id: 'default-black',
    isGradient: false,
    singleColor: '#000000',
    color1: '#000000',
    color2: '#000000',
    isRounded: true,
    dotType: 'rounded'
  },
  {
    id: 'default-cyan',
    isGradient: true,
    singleColor: '#40E0D0',
    color1: '#40E0D0',
    color2: '#12a5d1',
    isRounded: true,
    dotType: 'rounded'
  }
];

export function useQrPresets() {
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      const savedP = localStorage.getItem('qrPresetsHistory');
      if (savedP) return JSON.parse(savedP);
    } catch {
      // ignore
    }
    return DEFAULT_PRESETS;
  });

  const savePreset = (presetData) => {
    const newPreset = {
      id: Date.now().toString(),
      ...presetData
    };
    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    try {
      localStorage.setItem('qrPresetsHistory', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const deletePreset = (id) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem('qrPresetsHistory', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return { savedPresets, savePreset, deletePreset };
}
