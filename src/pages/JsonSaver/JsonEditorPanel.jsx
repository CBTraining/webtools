import { ArrowDownTrayIcon as Download, CheckIcon as Check, ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/solid';

export default function JsonEditorPanel({
  jsonText,
  setJsonText,
  error,
  setError,
  success,
  handleFormat,
  handleSave,
  parsedLottieData,
  onConvertToGifClick
}) {
  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>JSON Content:</label>
        {error && (
          <span style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle style={{ width: "16px", height: "16px" }} /> {error}
          </span>
        )}
        {success && (
          <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Check style={{ width: "16px", height: "16px" }} /> Saved Successfully!
          </span>
        )}
      </div>
      
      <textarea 
        className="input-field" 
        style={{ minHeight: '400px', fontFamily: 'monospace', resize: 'vertical' }}
        value={jsonText}
        onChange={(e) => { setJsonText(e.target.value); setError(null); }}
        placeholder='{"key": "value"}'
        spellCheck="false"
      />

      <div className="button-group">
        <button className="btn" onClick={handleFormat}>
          Format JSON
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          <Download style={{ width: "18px", height: "18px" }} /> Download .json
        </button>
        {parsedLottieData && (
          <button 
            className="btn" 
            onClick={onConvertToGifClick} 
            style={{ 
              background: 'var(--accent-gradient)', 
              color: 'white', 
              boxShadow: '0 0 15px var(--accent-glow)' 
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18, marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Convert Lottie to GIF
          </button>
        )}
      </div>
    </div>
  );
}
