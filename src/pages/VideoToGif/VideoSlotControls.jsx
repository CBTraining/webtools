import { 
  GifIcon as Gif, 
  FilmIcon,
  ScissorsIcon,
  SparklesIcon
} from '@heroicons/react/24/solid';
import { formatBytes } from '../../utils/formatters';
import DirectTimelineTrimmer from '../../components/DirectTimelineTrimmer';
import { TARGET_SIZE_OPTIONS } from './gifCompressionUtils';

export default function VideoSlotControls({
  slot,
  onUpdate,
  effectiveTargetMb,
  budgetParams,
  estimatedBytes,
  cropBounds,
  seekToTime,
  isPlayingLoop,
  toggleLoopPlay,
  isFfmpegLoaded,
  onProcessVideo,
  onProcessTrimmedVideo
}) {
  const {
    originalFps = null,
    quality = 80,
    enableCrop = false,
    startTime = 0,
    endTime = 5,
    fps = '15',
    videoDuration = 0,
    enableSpatialCrop = false,
    targetSizeLimit = '50',
    customTargetMb = 50
  } = slot;

  return (
    <div>
      {/* Auto Compression & Target File Size Control */}
      <div className="input-group" style={{ marginBottom: '1.25rem', background: 'rgba(64, 224, 208, 0.06)', border: '1px solid var(--accent-color)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            <SparklesIcon style={{ width: 18, height: 18, color: 'var(--accent-color)' }} />
            Target Size & Auto-Compression
          </label>
          {effectiveTargetMb && (
            <span style={{ fontSize: '0.75rem', background: 'var(--accent-gradient)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              Guaranteed ≤ {effectiveTargetMb} MB
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={targetSizeLimit}
            onChange={(e) => onUpdate({ targetSizeLimit: e.target.value })}
            style={{ flex: '1 1 200px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
          >
            {TARGET_SIZE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {targetSizeLimit === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min="1"
                max="500"
                value={customTargetMb}
                onChange={(e) => onUpdate({ customTargetMb: Number(e.target.value) || 50 })}
                style={{ width: '80px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>MB</span>
            </div>
          )}
        </div>
        
        <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.5rem', fontSize: '0.8rem' }}>
          {effectiveTargetMb 
            ? `Automatically balances resolution, framerate, and palette compression to ensure the generated GIF stays within ${effectiveTargetMb} MB.`
            : "Manual mode: file size is determined purely by the quality and framerate sliders below."}
        </small>
      </div>

      {/* Spatial Cropping Toggle & Controls */}
      <div className="input-group" style={{ marginBottom: '1.25rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={enableSpatialCrop} 
            onChange={(e) => onUpdate({ enableSpatialCrop: e.target.checked })} 
            style={{ width: 'auto' }}
          />
          <ScissorsIcon style={{ width: 18, height: 18, color: 'var(--accent-color)' }} />
          <span style={{ fontWeight: '500' }}>Spatial Frame Cropping</span>
          {enableSpatialCrop && cropBounds && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--accent-color)', fontFamily: 'monospace' }}>
              {cropBounds.w} × {cropBounds.h} px
            </span>
          )}
        </label>

        {enableSpatialCrop && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Use the handles on the video player above to adjust the visual crop area, or choose an aspect ratio preset.
          </div>
        )}
      </div>

      {/* Quality Slider (Resolution base) */}
      <div className="input-group" style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>Quality (Resolution Scale)</span>
          <span style={{ color: 'var(--accent-color)' }}>
            {effectiveTargetMb ? `Auto-adjusted (~${budgetParams.targetScale}px)` : `${quality}% (~${budgetParams.targetScale}px)`}
          </span>
        </label>
        <input 
          type="range" 
          min="1" 
          max="100" 
          value={quality} 
          onChange={(e) => onUpdate({ quality: Number(e.target.value) })}
          style={{ width: '100%', cursor: 'pointer' }}
        />
      </div>

      {/* Framerate Selection */}
      <div className="input-group" style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Framerate (FPS)</label>
        <select 
          value={fps} 
          onChange={(e) => onUpdate({ fps: e.target.value })}
          style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
        >
          <option value="original">Original{originalFps ? ` (${originalFps}fps)` : ''}</option>
          {(!originalFps || originalFps >= 30) && <option value="30">30 FPS</option>}
          {(!originalFps || originalFps >= 24) && <option value="24">24 FPS</option>}
          {(!originalFps || originalFps >= 20) && <option value="20">20 FPS</option>}
          {(!originalFps || originalFps >= 15) && <option value="15">15 FPS</option>}
          {(!originalFps || originalFps >= 10) && <option value="10">10 FPS</option>}
          {(!originalFps || originalFps >= 5) && <option value="5">5 FPS</option>}
        </select>
      </div>

      {/* Duration Trimming & Timeline Trimmer */}
      <div className="input-group" style={{ marginBottom: '1.5rem', background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: enableCrop ? '1rem' : '0' }}>
          <input 
            type="checkbox" 
            checked={enableCrop} 
            onChange={(e) => onUpdate({ enableCrop: e.target.checked })} 
            style={{ width: 'auto' }}
          />
          <span style={{ fontWeight: '500' }}>Crop Duration & Timeline Trimmer</span>
        </label>

        {enableCrop && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <DirectTimelineTrimmer 
              videoDuration={videoDuration}
              startTime={startTime}
              endTime={endTime}
              onUpdateTimes={(newStart, newEnd) => {
                onUpdate({ startTime: newStart, endTime: newEnd });
              }}
              onSeek={seekToTime}
              isPlayingLoop={isPlayingLoop}
              onToggleLoop={toggleLoopPlay}
            />

            {/* Manual Numeric Input Fields */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Time (m:s)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="MM"
                    value={Math.floor(startTime / 60) || 0} 
                    onChange={(e) => {
                      const val = (Number(e.target.value) * 60) + (startTime % 60);
                      onUpdate({ startTime: val });
                      seekToTime(val);
                    }}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                  />
                  <span>:</span>
                  <input 
                    type="number" 
                    min="0"
                    max="59.9"
                    step="0.1"
                    placeholder="SS.s"
                    value={Number((startTime % 60).toFixed(1))} 
                    onChange={(e) => {
                      const val = (Math.floor(startTime / 60) * 60) + Number(e.target.value);
                      onUpdate({ startTime: val });
                      seekToTime(val);
                    }}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>End Time (m:s)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="MM"
                    value={Math.floor(endTime / 60) || 0} 
                    onChange={(e) => {
                      const val = (Number(e.target.value) * 60) + (endTime % 60);
                      onUpdate({ endTime: val });
                      seekToTime(val);
                    }}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                  />
                  <span>:</span>
                  <input 
                    type="number" 
                    min="0"
                    max="59.9"
                    step="0.1"
                    placeholder="SS.s"
                    value={Number((endTime % 60).toFixed(1))} 
                    onChange={(e) => {
                      const val = (Math.floor(endTime / 60) * 60) + Number(e.target.value);
                      onUpdate({ endTime: val });
                      seekToTime(val);
                    }}
                    style={{ width: '100%', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '4px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estimated Size Card with Target Status */}
      <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Estimated GIF Size:</span>
          <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
            ~{formatBytes(estimatedBytes)}
            {effectiveTargetMb && estimatedBytes <= effectiveTargetMb * 1024 * 1024 && (
              <span style={{ marginLeft: '0.5rem', color: 'var(--success-color)', fontSize: '0.8rem' }}>
                (Under {effectiveTargetMb} MB)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-group" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onProcessVideo} disabled={!isFfmpegLoaded}>
          <Gif style={{ width: '18px', height: '18px' }} /> Convert & Compress to GIF
        </button>
        <button className="btn" onClick={onProcessTrimmedVideo} disabled={!isFfmpegLoaded} style={{ background: 'rgba(255,255,255,0.08)' }}>
          <FilmIcon style={{ width: '18px', height: '18px', color: '#3b82f6' }} /> Export Video (MP4)
        </button>
      </div>
    </div>
  );
}
