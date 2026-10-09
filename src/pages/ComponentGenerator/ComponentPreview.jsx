import React from 'react';
import { 
  DocumentArrowDownIcon, 
  PhotoIcon, 
  ClipboardDocumentIcon, 
  CheckIcon as Check 
} from '@heroicons/react/24/solid';

/**
 * Preview panel for ComponentGenerator with interactive hover card and export buttons.
 */
export default function ComponentPreview({
  previewRef,
  cssCode,
  materialLink,
  innerHtml,
  iconLink,
  onMouseMove,
  onMouseLeave,
  onDownloadPdf,
  onDownloadSvg,
  onCopySvg,
  onCopyImage,
  onCopyCode,
  copySvgSuccess,
  copyImageSuccess,
  copySuccess
}) {
  return (
    <div style={{ position: 'sticky', top: '1.5rem', zIndex: 10 }}>
      {/* Top action buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className="btn" 
          onClick={onDownloadPdf} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)' }}
        >
          <DocumentArrowDownIcon style={{ width: '16px', height: '16px' }} />
          Download PDF
        </button>

        <button 
          className="btn" 
          onClick={onDownloadSvg} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
          </svg>
          Download SVG
        </button>

        <button 
          className="btn" 
          onClick={onCopySvg} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)' }}
        >
          {copySvgSuccess ? <Check style={{ width: '16px', height: '16px' }} /> : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
              <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
            </svg>
          )}
          {copySvgSuccess ? 'Copied SVG!' : 'Copy SVG'}
        </button>

        <button 
          className="btn" 
          onClick={onCopyImage} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)' }}
        >
          {copyImageSuccess ? <Check style={{ width: '16px', height: '16px' }} /> : <PhotoIcon style={{ width: '16px', height: '16px' }} />}
          {copyImageSuccess ? 'Copied Image!' : 'Copy Image'}
        </button>

        <button 
          className="btn btn-primary" 
          onClick={onCopyCode} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
        >
          {copySuccess ? <Check style={{ width: '16px', height: '16px' }} /> : <ClipboardDocumentIcon style={{ width: '16px', height: '16px' }} />}
          {copySuccess ? 'Copied Code!' : 'Copy Code'}
        </button>
      </div>

      {/* Visual Canvas Area */}
      <div className="checkerboard-bg" style={{ 
        borderRadius: '16px', 
        minHeight: '350px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '2rem', 
        backgroundColor: '#000', 
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' 
      }}>
        <style>{cssCode}</style>
        <div dangerouslySetInnerHTML={{ __html: materialLink }} />
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {iconLink?.trim() ? (
            <a 
              ref={previewRef} 
              href={iconLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="glow-card" 
              dangerouslySetInnerHTML={{ __html: innerHtml }} 
              style={{ textDecoration: 'none', color: 'inherit' }} 
              onMouseMove={onMouseMove} 
              onMouseLeave={onMouseLeave} 
            />
          ) : (
            <div 
              ref={previewRef} 
              className="glow-card" 
              dangerouslySetInnerHTML={{ __html: innerHtml }} 
              onMouseMove={onMouseMove} 
              onMouseLeave={onMouseLeave} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
