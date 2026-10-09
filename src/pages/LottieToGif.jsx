import { useState } from 'react';
import { 
  ScissorsIcon as Scissors, 
  CloudArrowUpIcon as UploadCloud, 
  CodeBracketIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import Dropzone from '../components/Dropzone';
import { useProcessing } from '../contexts/ProcessingContext';
import { SAMPLE_LOTTIE_ANIMATIONS, isValidLottie } from '../utils/lottieSamples';
import LottieInteractivePlayer from './LottieToGif/LottieInteractivePlayer';
import LottieToGifSlot from './LottieToGif/LottieToGifSlot';
import LottieCodeEditorMode from './LottieToGif/LottieCodeEditorMode';

const TOOL_ID = 'lottie-to-gif';

/**
 * Main LottieToGif Page Component:
 * Allows pasting/editing Lottie JSON code, drag-and-drop JSON uploading,
 * previewing sample presets, and managing active conversion workspaces.
 */
export default function LottieToGif() {
  const { workspaces, addSlot } = useProcessing();
  const slots = workspaces[TOOL_ID] || [];

  // Top creation mode: 'code' | 'upload' | 'presets'
  const [creationMode, setCreationMode] = useState('code');
  const [editorSample, setEditorSample] = useState(null);

  const handleAddSlot = (lottieData, fileName) => {
    const slotId = `${TOOL_ID}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    addSlot(TOOL_ID, {
      id: slotId,
      lottieData,
      fileName: fileName || 'animation.json'
    });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '0.75rem' }}>
        <Scissors style={{ width: 32, height: 32, fill: "url(#accent-grad)" }} />
        <h1>Lottie to GIF & Inspector</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Paste or edit Lottie JSON code, preview live animations in real-time, save your JSON files, or convert them into high-quality GIFs.
      </p>

      {/* Mode Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          type="button"
          className={`btn ${creationMode === 'code' ? 'btn-primary' : ''}`}
          onClick={() => setCreationMode('code')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
        >
          <CodeBracketIcon style={{ width: 18, height: 18 }} />
          Input & Preview Code
        </button>

        <button 
          type="button"
          className={`btn ${creationMode === 'upload' ? 'btn-primary' : ''}`}
          onClick={() => setCreationMode('upload')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
        >
          <UploadCloud style={{ width: 18, height: 18 }} />
          Upload JSON File
        </button>

        <button 
          type="button"
          className={`btn ${creationMode === 'presets' ? 'btn-primary' : ''}`}
          onClick={() => setCreationMode('presets')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
        >
          <SparklesIcon style={{ width: 18, height: 18 }} />
          Sample Presets
        </button>
      </div>

      {/* Mode 1: Code Input & Instant Live Preview */}
      {creationMode === 'code' && (
        <LottieCodeEditorMode 
          onAddSlot={handleAddSlot} 
          initialSample={editorSample} 
        />
      )}

      {/* Mode 2: File Upload (Dropzone) */}
      {creationMode === 'upload' && (
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud style={{ width: 20, height: 20, color: 'var(--accent-color)' }} />
            Upload Lottie JSON Files
          </h2>
          <div style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)', borderWidth: '2px', borderRadius: 'var(--border-radius-sm)', background: 'transparent' }}>
            <Dropzone 
              onDrop={(files) => {
                const fileList = Array.isArray(files) ? files : [files];
                fileList.forEach(file => {
                  if (file && file.name.endsWith('.json')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const json = JSON.parse(e.target.result);
                        if (!isValidLottie(json)) {
                          alert(`"${file.name}" is a JSON file but does not match Lottie animation format.`);
                          return;
                        }
                        handleAddSlot(json, file.name);
                      } catch (err) {
                        alert(`Invalid JSON in "${file.name}": ` + err.message);
                      }
                    };
                    reader.readAsText(file);
                  }
                });
              }}
              accept=".json"
              title="Upload Lottie JSON"
              subtitle="Drag & drop or click to select .json animations"
              icon={<UploadCloud style={{ width: 48, height: 48, color: 'var(--text-secondary)' }} />}
            />
          </div>
        </div>
      )}

      {/* Mode 3: Sample Presets */}
      {creationMode === 'presets' && (
        <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SparklesIcon style={{ width: 20, height: 20, color: 'var(--accent-color)' }} />
            Ready-to-Use Animation Presets
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Choose a preset to inspect its code, preview it, or immediately open it in a conversion workspace.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
            {SAMPLE_LOTTIE_ANIMATIONS.map((sample) => (
              <div 
                key={sample.id}
                className="glass-panel"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}
              >
                <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--accent-color)' }}>
                  {sample.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {sample.description}
                </div>

                <LottieInteractivePlayer animationData={sample.data} height="150px" />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.25rem' }}>
                  <button 
                    type="button" 
                    className="btn" 
                    onClick={() => {
                      setEditorSample(sample);
                      setCreationMode('code');
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
                  >
                    View Code
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={() => handleAddSlot(sample.data, `${sample.id}.json`)}
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.5rem', justifyContent: 'center' }}
                  >
                    Open Slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Workspaces / Slots Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
            Active Animation Workspaces {slots.length > 0 && `(${slots.length})`}
          </h2>
          {slots.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Each slot can be previewed, edited, converted, or saved independently.
            </span>
          )}
        </div>

        {slots.length === 0 ? (
          <div 
            style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              color: 'var(--text-secondary)', 
              background: 'var(--bg-secondary)', 
              borderRadius: 'var(--border-radius)', 
              border: '1px dashed var(--border-color)',
              marginBottom: '2rem'
            }}
          >
            No active animation workspaces open. Use the code editor or dropzone above to add an animation!
          </div>
        ) : (
          <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}>
            {slots.map(slot => (
              <LottieToGifSlot key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
