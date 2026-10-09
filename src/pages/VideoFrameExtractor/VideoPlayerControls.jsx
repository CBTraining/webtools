import { 
  ArrowDownTrayIcon as Download, 
  ClipboardDocumentIcon, 
  CheckIcon as Check, 
  PlayIcon, 
  PauseIcon, 
  ForwardIcon, 
  BackwardIcon 
} from '@heroicons/react/24/solid';
import SendToDropdown from '../../components/SendToDropdown';
import { formatFrameTime } from '../../utils/formatters';

export default function VideoPlayerControls({
  currentTime,
  duration,
  onSeek,
  isPlaying,
  onTogglePlay,
  onStepFrame,
  onDownload,
  onCopy,
  copySuccess,
  canvasRef
}) {
  return (
    <>
      {/* Custom Controls */}
      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: '800px', 
          padding: '1rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem', 
          background: 'var(--bg-tertiary)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', minWidth: '60px' }}>
            {formatFrameTime(currentTime)}
          </span>
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            step="0.001" 
            value={currentTime} 
            onChange={onSeek}
            style={{ flex: 1, accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', minWidth: '60px' }}>
            {formatFrameTime(duration)}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <button className="btn" onClick={() => onStepFrame(false)} title="Previous Frame (-1/30s)">
            <BackwardIcon style={{ width: '20px', height: '20px' }} />
          </button>
          <button className="btn btn-primary" onClick={onTogglePlay} style={{ padding: '0.75rem', borderRadius: '50%' }}>
            {isPlaying ? (
              <PauseIcon style={{ width: '24px', height: '24px' }} />
            ) : (
              <PlayIcon style={{ width: '24px', height: '24px', marginLeft: '4px' }} />
            )}
          </button>
          <button className="btn" onClick={() => onStepFrame(true)} title="Next Frame (+1/30s)">
            <ForwardIcon style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          className="btn btn-primary" 
          onClick={onDownload} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          <Download style={{ width: '18px', height: '18px' }} />
          Download PNG Frame
        </button>
        <button 
          className="btn" 
          onClick={onCopy} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
        >
          {copySuccess ? (
            <Check style={{ width: '18px', height: '18px', color: '#10b981' }} />
          ) : (
            <ClipboardDocumentIcon style={{ width: '18px', height: '18px' }} />
          )}
          {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <SendToDropdown 
          imageUrl={() => canvasRef.current ? canvasRef.current.toDataURL('image/png') : undefined}
          mediaType="image"
        />
      </div>
    </>
  );
}
