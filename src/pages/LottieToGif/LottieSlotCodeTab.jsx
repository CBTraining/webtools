import { CheckIcon } from '@heroicons/react/24/solid';
import { downloadJsonFile } from '../../utils/lottieSamples';

export default function LottieSlotCodeTab({
  rawCode,
  setRawCode,
  codeError,
  setCodeError,
  onFormatCode,
  onApplyCode,
  fileName
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Edit Lottie JSON and apply to update preview:
        </span>
        <button 
          type="button" 
          className="btn" 
          onClick={onFormatCode} 
          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
        >
          Format JSON
        </button>
      </div>

      <textarea 
        className="input-field" 
        style={{ 
          minHeight: '220px', 
          fontFamily: '"Fira Code", monospace, Consolas', 
          fontSize: '0.78rem',
          resize: 'vertical',
          lineHeight: 1.4,
          tabSize: 2
        }}
        value={rawCode}
        onChange={(e) => {
          setRawCode(e.target.value);
          setCodeError(null);
        }}
        spellCheck="false"
      />

      {codeError && (
        <div style={{ color: 'var(--danger-color)', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--danger-color)' }}>
          ⚠️ {codeError}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={onApplyCode}
          style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.8rem', justifyContent: 'center' }}
        >
          <CheckIcon style={{ width: 14, height: 14, marginRight: 4 }} />
          Apply to Preview
        </button>
        <button 
          type="button" 
          className="btn" 
          onClick={() => downloadJsonFile(rawCode, fileName || 'edited-lottie.json')}
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        >
          Save as JSON
        </button>
      </div>
    </div>
  );
}
