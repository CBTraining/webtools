import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'componentGeneratorPresets';

/**
 * Custom hook for managing ComponentGenerator user presets in localStorage.
 */
export function useComponentPresets(currentProps, applyProps) {
  const [presets, setPresets] = useState({});
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets:", e);
      }
    }
  }, []);

  const savePreset = useCallback(() => {
    if (!presetName.trim()) {
      alert("Enter a preset name");
      return;
    }
    const newPresets = {
      ...presets,
      [presetName]: { ...currentProps }
    };
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    setPresetName('');
  }, [presetName, presets, currentProps]);

  const deletePreset = useCallback(() => {
    if (!presetName.trim()) {
      alert("Enter the name of the preset to delete, or load it first.");
      return;
    }
    if (!presets[presetName]) {
      alert("Preset not found.");
      return;
    }
    if (!window.confirm(`Delete preset "${presetName}"?`)) return;
    const newPresets = { ...presets };
    delete newPresets[presetName];
    setPresets(newPresets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPresets));
    setPresetName('');
  }, [presetName, presets]);

  const loadPreset = useCallback((name) => {
    if (!name || !presets[name]) return;
    applyProps(presets[name]);
  }, [presets, applyProps]);

  return {
    presets,
    presetName,
    setPresetName,
    savePreset,
    deletePreset,
    loadPreset
  };
}
