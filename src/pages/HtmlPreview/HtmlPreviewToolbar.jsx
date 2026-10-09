import { 
  SparklesIcon, 
  DevicePhoneMobileIcon, 
  DeviceTabletIcon, 
  ComputerDesktopIcon, 
  EyeSlashIcon, 
  EyeIcon, 
  ArrowPathIcon, 
  ViewColumnsIcon, 
  Bars4Icon 
} from '@heroicons/react/24/outline';

export default function HtmlPreviewToolbar({
  showCode,
  setShowCode,
  onRefresh,
  onCleanUp,
  layout,
  setLayout,
  device,
  setDevice
}) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '1rem',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      flexShrink: 0,
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => setShowCode(!showCode)} title="Toggle Code Editor">
          {showCode ? <EyeSlashIcon width={20} /> : <EyeIcon width={20} />}
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>
        
        {showCode && (
          <>
            <button className="btn" onClick={onRefresh} title="Force Refresh Preview">
              <ArrowPathIcon width={20} />
              Refresh
            </button>
            <button className="btn btn-primary" onClick={onCleanUp}>
              <SparklesIcon width={20} />
              Clean Up
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)' }}>
          <button 
            className="btn" 
            style={{ 
              background: layout === 'landscape' ? 'var(--accent-color)' : 'transparent',
              color: layout === 'landscape' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setLayout('landscape')}
            title="Landscape Layout (Code on Left)"
          >
            <ViewColumnsIcon width={20} />
          </button>
          <button 
            className="btn" 
            style={{ 
              background: layout === 'portrait' ? 'var(--accent-color)' : 'transparent',
              color: layout === 'portrait' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setLayout('portrait')}
            title="Portrait Layout (Code on Bottom)"
          >
            <Bars4Icon width={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)' }}>
          <button 
            className="btn" 
            style={{ 
              background: device === 'desktop' ? 'var(--accent-color)' : 'transparent',
              color: device === 'desktop' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setDevice('desktop')}
            title="Desktop View"
          >
            <ComputerDesktopIcon width={20} />
          </button>
          <button 
            className="btn" 
            style={{ 
              background: device === 'tablet' ? 'var(--accent-color)' : 'transparent',
              color: device === 'tablet' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setDevice('tablet')}
            title="Tablet View"
          >
            <DeviceTabletIcon width={20} />
          </button>
          <button 
            className="btn" 
            style={{ 
              background: device === 'mobile' ? 'var(--accent-color)' : 'transparent',
              color: device === 'mobile' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setDevice('mobile')}
            title="Mobile View"
          >
            <DevicePhoneMobileIcon width={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
