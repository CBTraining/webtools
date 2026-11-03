import { ArrowDownTrayIcon as Download } from '@heroicons/react/24/solid';
import { formatBytes } from '../../utils/formatters';
import SendToDropdown from '../../components/SendToDropdown';

export default function VideoSlotResult({
  resultUrl,
  resultBlob,
  downloadName,
  isResultMp4,
  resultBytes,
  effectiveTargetMb,
  onDiscard
}) {
  const defaultFileName = downloadName || (isResultMp4 ? 'trimmed-video.mp4' : 'animation.gif');
  const resultFile =
    resultBlob instanceof Blob
      ? new File([resultBlob], defaultFileName, {
          type: isResultMp4 ? 'video/mp4' : 'image/gif'
        })
      : undefined;

  return (
    <div className="result-container animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>{isResultMp4 ? 'Trimmed Video Result (MP4)' : 'GIF Result'}</h3>
        {resultBytes && (
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
            Size: {formatBytes(resultBytes)}
            {effectiveTargetMb && !isResultMp4 && (
              <span style={{ marginLeft: '0.5rem', color: resultBytes <= effectiveTargetMb * 1024 * 1024 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {resultBytes <= effectiveTargetMb * 1024 * 1024 ? `(Under ${effectiveTargetMb} MB limit)` : `(Over ${effectiveTargetMb} MB)`}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="canvas-container" style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
        {isResultMp4 ? (
          <video src={resultUrl} controls style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: '4px' }} />
        ) : (
          <img src={resultUrl} alt="GIF Result" style={{ maxWidth: '100%', maxHeight: '50vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        )}
      </div>
      <div className="button-group" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <a className="btn btn-primary" href={resultUrl} download={defaultFileName}>
          <Download style={{ width: "18px", height: "18px" }} /> Download {isResultMp4 ? 'Video (MP4)' : 'GIF'}
        </a>
        <SendToDropdown
          file={resultFile}
          videoFile={isResultMp4 ? resultFile : undefined}
          imageUrl={!isResultMp4 ? resultUrl : undefined}
          mediaType={isResultMp4 ? 'video' : 'image'}
        />
        <button className="btn" onClick={onDiscard}>
          Discard Result
        </button>
      </div>
    </div>
  );
}
