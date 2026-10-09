import { useState, useMemo, useEffect } from 'react';
import { 
  ScissorsIcon as Scissors, 
  ArrowDownTrayIcon as Download, 
  CheckIcon,
  CodeBracketIcon 
} from '@heroicons/react/24/solid';
import { SAMPLE_LOTTIE_ANIMATIONS, isValidLottie, downloadJsonFile } from '../../utils/lottieSamples';
import LottieInteractivePlayer from './LottieInteractivePlayer';

export default function LottieCodeEditorMode({ onAddSlot, initialSample }) {
  // Direct Code Input State
  const [inputCode, setInputCode] = useState(() => JSON.stringify(SAMPLE_LOTTIE_ANIMATIONS[0].data, null, 2));
  const [inputName, setInputName] = useState('custom-animation.json');
  const [copiedInput, setCopiedInput] = useState(false);

  useEffect(() => {
    if (initialSample) {
      setInputCode(JSON.stringify(initialSample.data, null, 2));
      setInputName(`${initialSample.id}.json`);
    }
  }, [initialSample]);

  // Compute parsed Lottie data and validation error via useMemo
  const { parsedLottie, inputError } = useMemo(() => {
    if (!inputCode.trim()) {
      return { parsedLottie: null, inputError: null };
    }
    try {
      const parsed = JSON.parse(inputCode);
      if (isValidLottie(parsed)) {
        return { parsedLottie: parsed, inputError: null };
      }
      return {
        parsedLottie: null,
        inputError: "Valid JSON, but not a recognized Lottie animation (requires layers, op, ip, fr)."
      };
    } catch (err) {
      return { parsedLottie: null, inputError: `Syntax Error: ${err.message}` };
    }
  }, [inputCode]);

  const handleFormatInput = () => {
    try {
      if (!inputCode.trim()) return;
      const parsed = JSON.parse(inputCode);
      setInputCode(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error("Format error:", e);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputCode(text);
      }
    } catch {
      alert("Could not read clipboard. Please paste manually into the editor.");
    }
  };

  const handleLoadSample = (sample) => {
    setInputCode(JSON.stringify(sample.data, null, 2));
    setInputName(`${sample.id}.json`);
  };

  const handleCopyInput = async () => {
    try {
      await navigator.clipboard.writeText(inputCode);
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const handleAddFromCode = () => {
    if (!parsedLottie || !onAddSlot) return;
    onAddSlot(parsedLottie, inputName || 'animation.json');
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CodeBracketIcon style={{ width: 20, height: 20, color: 'var(--accent-color)' }} />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Lottie Code Input & Live Preview</h2>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn" 
            onClick={handlePasteClipboard}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
          >
            📋 Paste from Clipboard
          </button>

          <button 
            type="button" 
            className="btn" 
            onClick={handleFormatInput}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
          >
            Format Code
          </button>

          <button 
            type="button" 
            className="btn" 
            onClick={handleCopyInput}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
          >
            {copiedInput ? '✓ Copied' : 'Copy Code'}
          </button>

          <button 
            type="button" 
            className="btn" 
            onClick={() => setInputCode('')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Quick preset selector pill row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Quick Presets:</span>
        {SAMPLE_LOTTIE_ANIMATIONS.map((sample) => (
          <button 
            key={sample.id}
            type="button" 
            className="btn" 
            onClick={() => handleLoadSample(sample)}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: 'var(--bg-tertiary)' }}
          >
            {sample.name}
          </button>
        ))}
      </div>

      {/* Split Pane: Code Editor on Left, Live Preview on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* Editor Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Lottie JSON Code:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filename:</span>
              <input 
                type="text" 
                value={inputName} 
                onChange={(e) => setInputName(e.target.value)}
                className="input-field"
                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: '150px' }}
                placeholder="animation.json"
              />
            </div>
          </div>

          <textarea 
            className="input-field" 
            style={{ 
              minHeight: '320px', 
              fontFamily: '"Fira Code", monospace, Consolas', 
              fontSize: '0.82rem',
              resize: 'vertical',
              lineHeight: 1.4,
              tabSize: 2
            }}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder='Paste valid Lottie JSON code here...'
            spellCheck="false"
          />

          {/* Validation Status Indicator */}
          {parsedLottie && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', fontSize: '0.8rem', background: 'rgba(82, 196, 26, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(82, 196, 26, 0.3)' }}>
              <CheckIcon style={{ width: 16, height: 16 }} />
              <span>Valid Lottie: <strong>{parsedLottie.nm || 'Animation'}</strong> ({parsedLottie.w || 300}×{parsedLottie.h || 300}px, {parsedLottie.fr || 30} FPS)</span>
            </div>
          )}

          {inputError && (
            <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid var(--danger-color)' }}>
              ⚠️ {inputError}
            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              Live Interactive Preview:
            </label>
            {parsedLottie && (
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>
                Ready to Export
              </span>
            )}
          </div>

          {parsedLottie ? (
            <>
              <LottieInteractivePlayer animationData={parsedLottie} height="240px" />

              {/* Actions for this previewed code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAddFromCode}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', justifyContent: 'center' }}
                >
                  <Scissors style={{ width: 16, height: 16, marginRight: 6 }} />
                  Open in Workspace
                </button>

                <button 
                  type="button"
                  className="btn"
                  onClick={() => downloadJsonFile(parsedLottie, inputName || 'animation.json')}
                  style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', justifyContent: 'center' }}
                >
                  <Download style={{ width: 16, height: 16, marginRight: 6 }} />
                  Save as JSON
                </button>
              </div>
            </>
          ) : (
            <div 
              style={{ 
                height: '240px', 
                borderRadius: 'var(--border-radius-sm)', 
                border: '1px dashed var(--border-color)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '1.5rem', 
                textAlign: 'center', 
                gap: '0.5rem', 
                background: 'var(--bg-tertiary)' 
              }}
            >
              <CodeBracketIcon style={{ width: 36, height: 36, color: 'var(--text-secondary)', opacity: 0.6 }} />
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Paste valid Lottie JSON code on the left to see live animation preview.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
