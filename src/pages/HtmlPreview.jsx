import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import beautify from 'js-beautify';
import ErrorBoundary from '../components/ErrorBoundary';
import HtmlPreviewToolbar from './HtmlPreview/HtmlPreviewToolbar';
import HtmlPreviewFrame from './HtmlPreview/HtmlPreviewFrame';
import { DEFAULT_HTML, preparePreviewHtml } from './HtmlPreview/htmlPreviewUtils';

export default function HtmlPreviewWrapper() {
  return (
    <ErrorBoundary name="HTML Preview">
      <HtmlPreview />
    </ErrorBoundary>
  );
}

function HtmlPreview() {
  const [htmlCode, setHtmlCode] = useState(() => {
    return localStorage.getItem('html-preview-code') || DEFAULT_HTML;
  });
  const [debouncedHtmlCode, setDebouncedHtmlCode] = useState(htmlCode);
  const [refreshKey, setRefreshKey] = useState(0);
  const [device, setDevice] = useState('desktop'); // desktop, tablet, mobile
  const [layout, setLayout] = useState('landscape'); // landscape, portrait
  const [showCode, setShowCode] = useState(true);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          setTheme(document.documentElement.getAttribute('data-theme') || 'dark');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem('html-preview-code', htmlCode);
    
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedHtmlCode(htmlCode);
    }, 500); // 500ms debounce
    
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [htmlCode]);

  const handleForceRefresh = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setDebouncedHtmlCode(htmlCode);
    setRefreshKey(prev => prev + 1);
  };

  const handleCleanUp = () => {
    const formatted = beautify.html(htmlCode, {
      indent_size: 2,
      preserve_newlines: true,
      max_preserve_newlines: 2,
      wrap_line_length: 0,
      end_with_newline: true
    });
    setHtmlCode(formatted);
  };

  const previewHtml = preparePreviewHtml(debouncedHtmlCode);

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: 0, overflow: 'hidden' }}>
      <HtmlPreviewToolbar
        showCode={showCode}
        setShowCode={setShowCode}
        onRefresh={handleForceRefresh}
        onCleanUp={handleCleanUp}
        layout={layout}
        setLayout={setLayout}
        device={device}
        setDevice={setDevice}
      />

      {/* Main Content Split */}
      <div className="html-preview-split" style={{ flexDirection: layout === 'portrait' ? 'column-reverse' : 'row' }}>
        {/* Code Editor Side */}
        <div 
          className={`html-preview-code-side ${showCode ? 'is-visible' : 'is-hidden'}`}
          style={{ 
            width: layout === 'portrait' ? '100%' : (showCode ? '50%' : '0%'), 
            height: layout === 'portrait' ? (showCode ? '50%' : '0%') : '100%',
            minWidth: layout === 'portrait' ? '0px' : (showCode ? '300px' : '0px'),
            minHeight: layout === 'portrait' ? (showCode ? '150px' : '0px') : '0px',
            opacity: showCode ? 1 : 0,
            borderRight: showCode && layout !== 'portrait' ? '1px solid var(--border-color)' : 'none',
            borderTop: showCode && layout === 'portrait' ? '1px solid var(--border-color)' : 'none'
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Editor
              height="100%"
              defaultLanguage="html"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={htmlCode}
              onChange={value => setHtmlCode(value || '')}
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                formatOnPaste: true,
                fontSize: 14,
                fontFamily: '"Fira Code", "Consolas", monospace'
              }}
            />
          </div>
        </div>

        {/* Preview Side */}
        <HtmlPreviewFrame
          previewHtml={previewHtml}
          refreshKey={refreshKey}
          device={device}
        />
      </div>
    </div>
  );
}
