export default function HtmlPreviewFrame({ previewHtml, refreshKey, device }) {
  let previewWidth = '100%';
  if (device === 'tablet') previewWidth = 'min(768px, 100%, calc((100vh - 140px) * (3/4)))';
  if (device === 'mobile') previewWidth = 'min(375px, 100%, calc((100vh - 140px) * (9/19.5)))';

  return (
    <div 
      style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'var(--bg-tertiary)',
        overflow: device === 'desktop' ? 'hidden' : 'auto',
        padding: device === 'desktop' ? '0' : '2rem',
        transition: 'padding 0.3s ease'
      }} 
      className="custom-scrollbar"
    >
      <div 
        className="preview-iframe-wrapper"
        data-darkreader-inline-bgcolor
        style={{
          width: previewWidth,
          height: device === 'desktop' ? '100%' : 'auto',
          aspectRatio: device === 'mobile' ? '9/19.5' : device === 'tablet' ? '3/4' : 'auto',
          maxHeight: device === 'desktop' ? '100%' : 'none',
          backgroundColor: '#ffffff',
          borderRadius: device === 'desktop' ? '0px' : '24px',
          boxShadow: device === 'desktop' ? 'none' : 'var(--panel-shadow)',
          border: device === 'desktop' ? 'none' : '12px solid var(--border-color)',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <iframe
          key={refreshKey}
          srcDoc={previewHtml}
          title="HTML Preview"
          data-darkreader-inline-bgcolor
          style={{
            width: '100%',
            flex: 1,
            border: 'none',
            backgroundColor: '#ffffff',
            colorScheme: 'light'
          }}
          sandbox="allow-scripts allow-modals allow-same-origin"
        />
      </div>
    </div>
  );
}
