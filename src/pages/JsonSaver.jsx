import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CodeBracketSquareIcon as FileJson } from '@heroicons/react/24/solid';
import { downloadBlob } from '../utils/downloadUtils';
import LottiePreview from './JsonSaver/LottiePreview';
import LottieGifExportCard from './JsonSaver/LottieGifExportCard';
import JsonEditorPanel from './JsonSaver/JsonEditorPanel';

export default function JsonSaver() {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Lottie and preview state
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'preview'
  const [parsedLottieData, setParsedLottieData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const location = useLocation();

  // Load state if navigated with state (e.g., from drag and drop overlay)
  useEffect(() => {
    if (location.state?.jsonText) {
      setJsonText(location.state.jsonText);
    }
  }, [location.state]);

  // Check if pasted JSON is Lottie animation whenever JSON text changes
  useEffect(() => {
    if (!jsonText.trim()) {
      setParsedLottieData(null);
      setActiveTab('editor');
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof parsed.v === 'string' &&
        typeof parsed.fr === 'number' &&
        typeof parsed.ip === 'number' &&
        typeof parsed.op === 'number' &&
        Array.isArray(parsed.layers)
      ) {
        setParsedLottieData(parsed);
      } else {
        setParsedLottieData(null);
        setActiveTab('editor');
      }
    } catch {
      setParsedLottieData(null);
      setActiveTab('editor');
    }
  }, [jsonText]);

  const handleFormat = () => {
    try {
      if (!jsonText.trim()) return;
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSave = () => {
    try {
      if (!jsonText.trim()) return;
      JSON.parse(jsonText); // Validate before saving
      setError(null);
      
      const blob = new Blob([jsonText], { type: 'application/json' });
      downloadBlob(blob, `data-${Date.now()}.json`);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError('Cannot save invalid JSON: ' + e.message);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <FileJson />
        <h1>JSON File Saver</h1>
      </div>
      <p>Format, validate, and download your JSON data effortlessly.</p>

      {parsedLottieData && (
        <div 
          className="glass-panel" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1rem', 
            padding: '0.75rem 1.25rem', 
            background: 'var(--accent-transparent)', 
            borderColor: 'var(--accent-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ animation: 'pulse 2s infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-color)' }}></span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>
              Lottie Animation detected in JSON!
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn ${activeTab === 'editor' ? 'btn-primary' : ''}`} 
              onClick={() => setActiveTab('editor')}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
            >
              JSON Editor
            </button>
            <button 
              className={`btn ${activeTab === 'preview' ? 'btn-primary' : ''}`} 
              onClick={() => setActiveTab('preview')}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
            >
              Animation Preview
            </button>
          </div>
        </div>
      )}

      {activeTab === 'editor' ? (
        <JsonEditorPanel
          jsonText={jsonText}
          setJsonText={setJsonText}
          error={error}
          setError={setError}
          success={success}
          handleFormat={handleFormat}
          handleSave={handleSave}
          parsedLottieData={parsedLottieData}
          onConvertToGifClick={() => setActiveTab('preview')}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--accent-color)' }}>Animation Preview</h3>
            <LottiePreview 
              animationData={parsedLottieData} 
              isPlaying={isPlaying} 
              onTogglePlay={() => setIsPlaying(!isPlaying)} 
            />
          </div>

          <LottieGifExportCard parsedLottieData={parsedLottieData} />
        </div>
      )}
    </div>
  );
}
