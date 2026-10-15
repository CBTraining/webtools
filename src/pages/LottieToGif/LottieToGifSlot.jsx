import { useState, useMemo } from 'react';
import { 
  ScissorsIcon as Scissors, 
  ArrowDownTrayIcon as Download, 
  XMarkIcon as XMark,
  CodeBracketIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/solid';
import SendToDropdown from '../../components/SendToDropdown';
import { useProcessing } from '../../contexts/ProcessingContext';
import { isValidLottie, downloadJsonFile } from '../../utils/lottieSamples';
import { renderLottieToGif } from '../../utils/lottieGifRenderer';
import LottieInteractivePlayer from './LottieInteractivePlayer';
import LottieSlotGifSettings from './LottieSlotGifSettings';
import LottieSlotCodeTab from './LottieSlotCodeTab';

const TOOL_ID = 'lottie-to-gif';

/**
 * Slot Workspace Component (Card representing one active Lottie animation).
 */
export default function LottieToGifSlot({ slot }) {
  const { jobs, addJob, updateJob, removeJob, removeSlot, updateSlot } = useProcessing();
  
  const myJobId = slot.id;
  const myJob = jobs.find(j => j.id === myJobId);
  const isProcessing = myJob?.status === 'running';
  const resultUrl = myJob?.resultUrl;

  const { lottieData, fileName } = slot;

  // Active view tab in this slot
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);

  // In-slot code editor state
  const [rawCode, setRawCode] = useState(() => JSON.stringify(lottieData, null, 2));
  const [codeError, setCodeError] = useState(null);

  // GIF conversion settings
  const [showGifSettings, setShowGifSettings] = useState(false);
  const [gifFps, setGifFps] = useState('auto'); // 'auto' | 15 | 20 | 30
  const [gifScale, setGifScale] = useState(1); // 0.5 | 1 | 1.5 | 2
  const [gifBg, setGifBg] = useState('transparent'); // 'transparent' | '#ffffff' | '#000000' | '#1e293b'
  const [gifQuality, setGifQuality] = useState(10); // 1 to 10 (10 is fast, 1 is best)

  // Handle in-slot code update
  const handleApplyCode = () => {
    try {
      const parsed = JSON.parse(rawCode);
      if (!isValidLottie(parsed)) {
        throw new Error("Missing required Lottie properties (layers, op, ip, fr).");
      }
      setCodeError(null);
      updateSlot(TOOL_ID, slot.id, { lottieData: parsed });
      setActiveTab('preview');
    } catch (err) {
      setCodeError(err.message);
    }
  };

  const handleFormatCode = () => {
    try {
      const parsed = JSON.parse(rawCode);
      setRawCode(JSON.stringify(parsed, null, 2));
      setCodeError(null);
    } catch (err) {
      setCodeError(err.message);
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = typeof lottieData === 'string' ? lottieData : JSON.stringify(lottieData, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const handleConvert = async () => {
    if (!lottieData || isProcessing) return;
    
    addJob({ 
      id: myJobId, 
      title: `Converting ${fileName || 'Lottie'} to GIF`, 
      type: 'lottie-to-gif' 
    });

    try {
      const blob = await renderLottieToGif({
        lottieData,
        scale: gifScale,
        fps: gifFps,
        background: gifBg,
        quality: gifQuality,
        onProgress: (pct, msg) => {
          updateJob(myJobId, { progress: pct, log: msg });
        }
      });

      const rUrl = URL.createObjectURL(blob);
      const baseName = fileName ? fileName.replace(/\.json$/i, '') : 'lottie';
      const downloadName = `${baseName}-${Date.now()}.gif`;
      updateJob(myJobId, { 
        status: 'success', 
        resultUrl: rUrl, 
        resultBlob: blob,
        downloadName: downloadName 
      });
    } catch (err) {
      console.error("Lottie convert error:", e => e);
      updateJob(myJobId, { status: 'error', error: err?.message || 'Failed to convert Lottie.' });
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => removeSlot(TOOL_ID, slot.id), 200);
  };

  const stats = useMemo(() => {
    if (!lottieData) return null;
    const w = lottieData.w || 300;
    const h = lottieData.h || 300;
    const fr = lottieData.fr || 30;
    const frames = Math.max(1, Math.round((lottieData.op || 60) - (lottieData.ip || 0)));
    const sec = (frames / fr).toFixed(1);
    return { w, h, fr, frames, sec };
  }, [lottieData]);

  return (
    <div className={`glass-panel controls animate-pop-in ${isClosing ? 'animate-pop-out' : ''}`} style={{ position: 'relative', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <CodeBracketIcon style={{ width: 18, height: 18, color: 'var(--accent-color)', flexShrink: 0 }} />
          <span style={{ fontWeight: '600', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileName || 'Animation'}>
            {fileName || 'Lottie Animation'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button 
            type="button"
            className="btn" 
            onClick={() => downloadJsonFile(lottieData, fileName || 'animation.json')}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Save as JSON file"
          >
            <DocumentArrowDownIcon style={{ width: 14, height: 14 }} />
            Save JSON
          </button>
          
          <button 
            type="button"
            className="btn" 
            onClick={handleCopy}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            title="Copy JSON code"
          >
            {copied ? <ClipboardDocumentCheckIcon style={{ width: 14, height: 14, color: 'var(--success-color)' }} /> : <ClipboardDocumentIcon style={{ width: 14, height: 14 }} />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button 
            type="button"
            onClick={handleClose} 
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close Slot"
          >
            <XMark style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Tab Switcher: Preview & Convert vs Edit Code */}
      <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)' }}>
        <button 
          type="button"
          className={`btn ${activeTab === 'preview' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('preview')}
          style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
        >
          Preview & Convert
        </button>
        <button 
          type="button"
          className={`btn ${activeTab === 'code' ? 'btn-primary' : ''}`}
          onClick={() => {
            setRawCode(JSON.stringify(lottieData, null, 2));
            setCodeError(null);
            setActiveTab('code');
          }}
          style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
        >
          Edit JSON Code
        </button>
      </div>

      {/* Tab 1: Live Preview & Conversion */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Metadata Badges */}
          {stats && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
              <span style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                📐 {stats.w}×{stats.h}px
              </span>
              <span style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                ⚡ {stats.fr} FPS
              </span>
              <span style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                🎞️ {stats.frames} frames ({stats.sec}s)
              </span>
            </div>
          )}

          {/* Interactive Player */}
          <LottieInteractivePlayer animationData={lottieData} height="220px" />

          {/* GIF Settings Expander */}
          <LottieSlotGifSettings
            showGifSettings={showGifSettings}
            setShowGifSettings={setShowGifSettings}
            stats={stats}
            gifScale={gifScale}
            setGifScale={setGifScale}
            gifFps={gifFps}
            setGifFps={setGifFps}
            gifBg={gifBg}
            setGifBg={setGifBg}
            gifQuality={gifQuality}
            setGifQuality={setGifQuality}
          />

          {/* Convert to GIF Action */}
          {!isProcessing && !resultUrl && (
            <button 
              className="btn btn-primary" 
              onClick={handleConvert}
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              <Scissors style={{ width: 18, height: 18, marginRight: 6 }} />
              Convert to GIF
            </button>
          )}

          {isProcessing && (
            <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.4rem', color: 'var(--accent-color)' }}>
                {myJob?.log || 'Rendering GIF frames...'}
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${myJob?.progress || 0}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.2s ease' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                Processing in background. Feel free to use other tools.
              </div>
            </div>
          )}

          {myJob?.status === 'error' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', padding: '0.6rem 0.8rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem' }}>
              <strong>Error:</strong> {myJob.error || 'Failed to render GIF'}
              <button className="btn" onClick={() => removeJob(myJobId)} style={{ marginTop: '0.4rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Code Editor */}
      {activeTab === 'code' && (
        <LottieSlotCodeTab
          rawCode={rawCode}
          setRawCode={setRawCode}
          codeError={codeError}
          setCodeError={setCodeError}
          onFormatCode={handleFormatCode}
          onApplyCode={handleApplyCode}
          fileName={fileName}
        />
      )}

      {/* Result Section (When GIF has been generated) */}
      {resultUrl && (
        <div className="glass-panel preview-panel animate-pop-in" style={{ marginTop: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--accent-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--accent-color)' }}>GIF Result</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ready for download</span>
          </div>

          <div className="canvas-container" style={{ background: 'repeating-conic-gradient(#333 0% 25%, #1c1c1e 0% 50%) 50% / 16px 16px', borderRadius: 'var(--border-radius-sm)', padding: '0.5rem', overflow: 'hidden' }}>
            <img 
              src={resultUrl} 
              alt="GIF Result" 
              style={{ maxWidth: '100%', maxHeight: '40vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
            />
          </div>

          <div className="button-group" style={{ marginTop: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <a 
              href={resultUrl} 
              download={myJob?.downloadName || `lottie-${fileName || 'animation'}.gif`} 
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
            >
              <Download style={{ width: 16, height: 16, marginRight: 4 }} /> 
              Download GIF
            </a>

            {/* Pipeline to Image Editor / Upscaler */}
            <SendToDropdown 
              mediaType="image"
              imageUrl={resultUrl}
              file={myJob?.resultBlob ? new File([myJob.resultBlob], myJob.downloadName || 'lottie.gif', { type: 'image/gif' }) : null}
            />

            <button 
              className="btn" 
              onClick={() => removeJob(myJobId)}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
