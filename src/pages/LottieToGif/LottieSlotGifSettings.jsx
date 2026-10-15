import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/solid';

export default function LottieSlotGifSettings({
  showGifSettings,
  setShowGifSettings,
  stats,
  gifScale,
  setGifScale,
  gifFps,
  setGifFps,
  gifBg,
  setGifBg,
  gifQuality,
  setGifQuality
}) {
  return (
    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <button 
        type="button"
        onClick={() => setShowGifSettings(!showGifSettings)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '0.78rem',
          padding: '0.45rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AdjustmentsHorizontalIcon style={{ width: 14, height: 14 }} />
          GIF Output Settings
        </span>
        {showGifSettings ? <ChevronUpIcon style={{ width: 14, height: 14 }} /> : <ChevronDownIcon style={{ width: 14, height: 14 }} />}
      </button>

      {showGifSettings && (
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem' }}>
          {/* Scale */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Resolution Scale:</label>
            <select 
              className="input-field" 
              value={gifScale} 
              onChange={(e) => setGifScale(Number(e.target.value))}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value={0.5}>0.5x ({Math.round((stats?.w || 300)*0.5)}×{Math.round((stats?.h || 300)*0.5)})</option>
              <option value={1}>1.0x (Original {stats?.w || 300}×{stats?.h || 300})</option>
              <option value={1.5}>1.5x ({Math.round((stats?.w || 300)*1.5)}×{Math.round((stats?.h || 300)*1.5)})</option>
              <option value={2}>2.0x ({Math.round((stats?.w || 300)*2)}×{Math.round((stats?.h || 300)*2)})</option>
            </select>
          </div>

          {/* Frame Rate */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Frame Rate (FPS):</label>
            <select 
              className="input-field" 
              value={gifFps} 
              onChange={(e) => setGifFps(e.target.value)}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value="auto">Native ({stats?.fr || 30} FPS)</option>
              <option value={30}>30 FPS</option>
              <option value={20}>20 FPS (Optimized)</option>
              <option value={15}>15 FPS (Small Size)</option>
            </select>
          </div>

          {/* Background */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Background:</label>
            <select 
              className="input-field" 
              value={gifBg} 
              onChange={(e) => setGifBg(e.target.value)}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value="transparent">Transparent</option>
              <option value="#ffffff">White (#ffffff)</option>
              <option value="#000000">Black (#000000)</option>
              <option value="#1e293b">Dark Slate (#1e293b)</option>
            </select>
          </div>

          {/* Quality */}
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Encoding Quality:</label>
            <select 
              className="input-field" 
              value={gifQuality} 
              onChange={(e) => setGifQuality(Number(e.target.value))}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', width: '100%' }}
            >
              <option value={10}>Fast (Quality 10)</option>
              <option value={5}>Balanced (Quality 5)</option>
              <option value={1}>Highest (Quality 1)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
