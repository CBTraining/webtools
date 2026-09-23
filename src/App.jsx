import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Bars3Icon } from '@heroicons/react/24/solid';
import Sidebar from './components/Sidebar';
import BackgroundDots from './components/BackgroundDots';
import RightPanel from './components/RightPanel/RightPanel';
import { ProcessingProvider } from './contexts/ProcessingContext';
import BackgroundJobsWidget from './components/BackgroundJobsWidget';
import ClockModeOverlay from './components/ClockModeOverlay';
import DiagnosticsOverlay from './components/DiagnosticsOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import DragDropOverlay from './components/DragDropOverlay';
import RouteLoading from './components/RouteLoading';
import { isVideoFile, isImageFile, compressImageUnder20MB } from './utils/fileTypes';
import { isGifBlob, processHtmlPaste } from './utils/clipboardExtract';

// Lazy-loaded routes for code splitting and instant initial page load
const Home = lazy(() => import('./pages/Home'));
const ImageTools = lazy(() => import('./pages/ImageTools'));
const BackgroundRemover = lazy(() => import('./pages/BackgroundRemover'));
const VideoCompressor = lazy(() => import('./pages/VideoCompressor'));
const VideoToGif = lazy(() => import('./pages/VideoToGif'));
const LottieToGif = lazy(() => import('./pages/LottieToGif'));
const SvgConverter = lazy(() => import('./pages/SvgConverter'));
const JsonSaver = lazy(() => import('./pages/JsonSaver'));
const ColorPicker = lazy(() => import('./pages/ColorPicker'));
const QrGenerator = lazy(() => import('./pages/QrGenerator'));
const ImageUpscaler = lazy(() => import('./pages/ImageUpscaler'));
const ContentExtractor = lazy(() => import('./pages/ContentExtractor'));
const TimezoneConverter = lazy(() => import('./pages/TimezoneConverter'));
const HtmlPreview = lazy(() => import('./pages/HtmlPreview'));
const ShapeGenerator = lazy(() => import('./pages/ShapeGenerator'));
const ComponentGenerator = lazy(() => import('./pages/ComponentGenerator'));
const VideoFrameExtractor = lazy(() => import('./pages/VideoFrameExtractor'));
const CollageMaker = lazy(() => import('./pages/CollageMaker'));
const AssetExtractor = lazy(() => import('./pages/AssetExtractor'));

function MainContentWrapper({ children }) {
  const location = useLocation();
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div ref={wrapperRef} className="main-content">
      {children}
    </div>
  );
}

function App() {
  const [showModal, setShowModal] = useState(false);
  const [filename, setFilename] = useState('clipboard_image');
  const [pendingBlob, setPendingBlob] = useState(null);
  const [blobType, setBlobType] = useState('png'); // 'png' or 'gif'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClockMode, setIsClockMode] = useState(() => localStorage.getItem('isClockMode') === 'true');
  const [globalToast, setGlobalToast] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showModal]);

  // Persist clock mode
  useEffect(() => {
    localStorage.setItem('isClockMode', String(isClockMode));
  }, [isClockMode]);

  // Clear global toast after 3 seconds
  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => setGlobalToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  // Revoke preview URL on close
  useEffect(() => {
    if (!showModal && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [showModal, previewUrl]);

  // Track mouse position for glowing card effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const elements = document.querySelectorAll('.glass-panel, .nav-link, .sidebar, .glow-card');
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        el.style.setProperty('--mouse-x', `${x}px`);
        el.style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Double-click background to toggle fullscreen
  useEffect(() => {
    const handleDoubleClick = (e) => {
      if (
        e.target.tagName.toLowerCase() === 'input' || 
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.tagName.toLowerCase() === 'textarea' ||
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.tagName.toLowerCase() === 'select' ||
        e.target.closest('.glass-panel') ||
        e.target.closest('.sidebar') ||
        e.target.closest('.sidebar-overlay') ||
        e.target.closest('.right-panel')
      ) {
        return;
      }

      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, []);

  const convertBlobToPng = (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) resolve(pngBlob);
            else resolve(blob);
          }, 'image/png');
        } catch (e) {
          resolve(blob);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(blob);
      };
      img.src = url;
    });
  };

  const processImageBlob = useCallback(async (blob, defaultName = 'clipboard_image') => {
    if (!blob) return;

    let isGif = false;
    try {
      isGif = await isGifBlob(blob);
    } catch (e) {
      console.warn("GIF check failed:", e);
    }

    const cleanName = defaultName ? defaultName.replace(/\.(png|gif|jpe?g|webp|bmp|svg)$/i, '') : 'clipboard_image';
    const targetType = isGif ? 'gif' : 'png';
    const preview = URL.createObjectURL(blob);

    setPendingBlob(blob);
    setBlobType(targetType);
    setPreviewUrl(preview);
    setFilename(`${cleanName}.${targetType}`);
    setShowModal(true);
  }, []);

  // Global Clipboard Listener
  useEffect(() => {
    const handlePaste = async (e) => {
      // Don't intercept paste when typing in inputs/textareas/contenteditable
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.isContentEditable ||
        e.target.closest('input') ||
        e.target.closest('textarea') ||
        e.target.closest('[contenteditable="true"]')
      ) {
        return;
      }

      const clipboardData = e.clipboardData || e.originalEvent?.clipboardData;
      if (!clipboardData) return;

      // 1. Direct files check (handles files copied from Windows Explorer / Desktop or dropped)
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (isImageFile(file) || file.type.startsWith('image/')) {
            e.preventDefault();
            processImageBlob(file, file.name);
            return;
          }
        }
      }

      // 2. Synchronously extract direct image item & html/text items
      const items = clipboardData.items;
      let directImageFile = null;
      let htmlItem = null;
      let textItem = null;

      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            // Must extract synchronously before any async tick clears clipboardData!
            directImageFile = item.getAsFile();
          } else if (item.type === 'text/html') {
            htmlItem = item;
          } else if (item.type === 'text/plain') {
            textItem = item;
          }
        }
      }

      // 3. If direct image is present
      if (directImageFile) {
        e.preventDefault();

        // If Google Slides HTML is also present, try to extract original GIF/asset from Google CDN
        if (htmlItem) {
          htmlItem.getAsString(async (html) => {
            if (html && (html.includes('googleusercontent.com') || html.includes('docs.google.com'))) {
              const res = await processHtmlPaste(html, processImageBlob);
              if (res?.success) return;
            }
            // For standard web images or if Google extraction failed, use our direct synchronous image blob
            processImageBlob(directImageFile);
          });
          return;
        }

        // Screenshots, Snipping tool, or native images without HTML
        processImageBlob(directImageFile);
        return;
      }

      // 4. No direct image blob, but HTML item exists (e.g. copied from web without binary image)
      if (htmlItem) {
        e.preventDefault();
        htmlItem.getAsString(async (html) => {
          const res = await processHtmlPaste(html, processImageBlob);
          if (!res?.success) {
            setGlobalToast("No image could be extracted from copied content.");
            window.dispatchEvent(new Event('paste-error'));
          }
        });
        return;
      }

      // 5. Plain text fallback: data URI or direct image URL
      if (textItem) {
        textItem.getAsString(async (text) => {
          if (text) {
            const trimmed = text.trim();
            if (trimmed.startsWith('data:image/')) {
              e.preventDefault();
              try {
                const resp = await fetch(trimmed);
                const b = await resp.blob();
                processImageBlob(b, 'pasted_data_uri');
                return;
              } catch (err) {
                console.warn("Failed to parse data URI:", err);
              }
            } else if (/^https?:\/\/.*\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
              e.preventDefault();
              const res = await processHtmlPaste(`<img src="${trimmed}" />`, processImageBlob);
              if (res?.success) return;
            }
          }
          window.dispatchEvent(new Event('paste-error'));
        });
        return;
      }

      window.dispatchEvent(new Event('paste-error'));
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processImageBlob]);

  const handleManualPaste = async () => {
    try {
      // 1. Try modern navigator.clipboard.read()
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();

        for (const clipboardItem of clipboardItems) {
          const imageType = clipboardItem.types.find(t => t.startsWith('image/'));
          const hasHtml = clipboardItem.types.includes('text/html');

          // Check if Google Slides HTML with animated GIF is available
          if (hasHtml) {
            try {
              const htmlBlob = await clipboardItem.getType('text/html');
              const html = await htmlBlob.text();
              if (html && (html.includes('googleusercontent.com') || html.includes('docs.google.com'))) {
                const res = await processHtmlPaste(html, processImageBlob);
                if (res?.success) return;
              }
            } catch (e) {
              console.warn("HTML read failed:", e);
            }
          }

          // If direct image is available on clipboard, read and display immediately
          if (imageType) {
            const blob = await clipboardItem.getType(imageType);
            if (blob) {
              processImageBlob(blob);
              return;
            }
          }

          // If HTML is present without direct image
          if (hasHtml) {
            try {
              const htmlBlob = await clipboardItem.getType('text/html');
              const html = await htmlBlob.text();
              const res = await processHtmlPaste(html, processImageBlob);
              if (res?.success) return;
            } catch (e) {
              console.warn("HTML fallback failed:", e);
            }
          }
        }
      }

      // 2. Try text/plain fallback (data URI or direct image URL)
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const trimmed = text.trim();
          if (trimmed.startsWith('data:image/')) {
            const resp = await fetch(trimmed);
            const b = await resp.blob();
            processImageBlob(b, 'pasted_data_uri');
            return;
          }
          if (/^https?:\/\/.*\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
            const res = await processHtmlPaste(`<img src="${trimmed}" />`, processImageBlob);
            if (res?.success) return;
          }
        }
      }

      setGlobalToast("No image found on clipboard. Copy an image or screenshot first!");
      window.dispatchEvent(new Event('paste-error'));
    } catch (err) {
      console.warn("Clipboard API failed:", err);
      setGlobalToast("Clipboard access blocked by browser. Please use Ctrl+V instead!");
      window.dispatchEvent(new Event('paste-error'));
    }
  };

  const handleDownload = async () => {
    if (pendingBlob && filename) {
      window.dispatchEvent(new CustomEvent('burst', { detail: { type: 'vertical', x: 0 } }));

      const isGif = blobType === 'gif' || pendingBlob.type === 'image/gif' || filename.toLowerCase().endsWith('.gif');
      const cleanName = filename.replace(/\.(png|gif|jpe?g|webp|bmp|svg)$/i, '');
      const ext = isGif ? '.gif' : '.png';
      const downloadFilename = `${cleanName}${ext}`;

      let downloadBlob = pendingBlob;
      if (!isGif && pendingBlob.type !== 'image/png') {
        try {
          downloadBlob = await convertBlobToPng(pendingBlob);
        } catch (err) {
          console.warn("Conversion to PNG fallback:", err);
          downloadBlob = pendingBlob;
        }
      }

      const url = URL.createObjectURL(downloadBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setGlobalToast({ text: `Saved ${downloadFilename}!`, type: 'success' });
    }
    setShowModal(false);
    setPendingBlob(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingBlob(null);
  };

  return (
    <ProcessingProvider>
      <Router>
        <BackgroundDots />
        <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <defs>
            <linearGradient id="accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#40E0D0" />
              <stop offset="100%" stopColor="#12a5d1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="app-layout">
          <div className="mobile-header">
            <button onClick={() => setIsSidebarOpen(true)}>
              <Bars3Icon style={{width: '28px', height: '28px'}} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="WebTools Logo" width="24" height="24" />
              <span style={{ fontWeight: 'normal', fontSize: '1.2rem' }}>Web<span className="text-gradient">Tools</span></span>
            </div>
          </div>
          
          {globalToast && (
            <div className="toast animate-fade-in" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: typeof globalToast === 'object' && globalToast.type === 'success' ? 'var(--success-color, #52c41a)' : '#ff4444', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {typeof globalToast === 'object' ? globalToast.text : globalToast}
            </div>
          )}

          {isClockMode && <ClockModeOverlay 
            onClose={() => setIsClockMode(false)} 
            onDropFile={(file) => {
              if (isImageFile(file) || file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width;
                  canvas.height = img.height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0);
                  
                  canvas.toBlob((blob) => {
                    if (!blob) return;
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = file.name ? file.name.replace(/\.[^/.]+$/, "") + ".png" : 'pngconvert.png';
                    a.click();
                    URL.revokeObjectURL(url);
                    setGlobalToast({ text: "Image auto-converted to PNG and downloaded!", type: 'success' });
                  }, 'image/png');
                };
                img.src = URL.createObjectURL(file);
              } else if (isVideoFile(file)) {
                alert('Passive Video to GIF conversion via ffmpeg.wasm will trigger here!');
              } else {
                alert('Unsupported file type for passive conversion.');
              }
            }}
          />}

          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onManualPaste={handleManualPaste} onClockClick={() => setIsClockMode(true)} showDiagnostics={showDiagnostics} onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)} />
          
          <MainContentWrapper>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/image-tools" element={<ImageTools />} />
                <Route path="/bg-remover" element={<BackgroundRemover />} />
                <Route path="/video-compressor" element={<VideoCompressor />} />
                <Route path="/video-to-gif" element={<VideoToGif />} />
                <Route path="/lottie-to-gif" element={<LottieToGif />} />
                <Route path="/svg-converter" element={<SvgConverter />} />
                <Route path="/json-saver" element={<JsonSaver />} />
                <Route path="/color-picker" element={<ColorPicker />} />
                <Route path="/qr-generator" element={<QrGenerator />} />
                <Route path="/image-upscaler" element={<ImageUpscaler />} />
                <Route path="/content-extractor" element={<ContentExtractor />} />
                <Route path="/pdf-image-extractor" element={<ContentExtractor />} />
                <Route path="/timezone-converter" element={<TimezoneConverter />} />
                <Route path="/html-preview" element={<HtmlPreview />} />
                <Route path="/shape-generator" element={<ShapeGenerator />} />
                <Route path="/component-generator" element={<ComponentGenerator />} />
                <Route path="/video-frame-extractor" element={<VideoFrameExtractor />} />
                <Route path="/collage-maker" element={<CollageMaker />} />
                <Route path="/asset-extractor" element={<AssetExtractor />} />
              </Routes>
            </Suspense>
          </MainContentWrapper>
          
          <DragDropOverlay 
            onDropImageToModal={(file) => processImageBlob(file, file.name)}
            onDirectDownload={(file, format = 'png') => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                  if (!blob) return;
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = file.name ? file.name.replace(/\.[^/.]+$/, "") + `.${format}` : `converted.${format}`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setGlobalToast({ text: `Image auto-converted to ${format.toUpperCase()} and downloaded!`, type: 'success' });
                }, `image/${format}`);
              };
              img.onerror = () => {
                setGlobalToast({ text: "Error: The dragged file is not a valid image.", type: 'error' });
              };
              img.src = URL.createObjectURL(file);
            }}
            onCompressImage={async (file) => {
              try {
                setGlobalToast({ text: "Compressing image under 20MB (preserving full resolution)...", type: 'success' });
                const res = await compressImageUnder20MB(file);
                setGlobalToast({ 
                  text: `Compressed to ${res.sizeMB} MB (${res.format}, ${res.width}x${res.height}px) and downloaded!`, 
                  type: 'success' 
                });
              } catch (err) {
                console.error(err);
                setGlobalToast({ text: `Compression failed: ${err.message}`, type: 'error' });
              }
            }}
          />

          {showDiagnostics && (
            <ErrorBoundary name="Diagnostics">
              <DiagnosticsOverlay />
            </ErrorBoundary>
          )}

          <RightPanel />

          <BackgroundJobsWidget />

          {showModal && (
            <div className="modal-overlay">
              <div className="modal glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '90%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0 }}>Save {blobType === 'gif' ? 'Animated GIF' : 'Image'}</h3>
                  {blobType === 'gif' && (
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 'bold', 
                      background: 'rgba(64, 224, 208, 0.15)', 
                      color: 'var(--accent-color)', 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '12px',
                      border: '1px solid var(--accent-color)',
                      letterSpacing: '0.5px'
                    }}>
                      ✨ ANIMATED GIF
                    </span>
                  )}
                </div>
                <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {blobType === 'gif' 
                    ? 'Animated GIF detected! We preserved all frames and original animation.' 
                    : 'Enter a name for your pasted image.'}
                </p>

                {previewUrl && (
                  <div style={{ 
                    maxHeight: '160px', 
                    borderRadius: 'var(--border-radius-sm)', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginBottom: '1rem',
                    background: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\'><rect width=\'8\' height=\'8\' fill=\'%23222\'/><rect x=\'8\' y=\'8\' width=\'8\' height=\'8\' fill=\'%23222\'/><rect x=\'8\' width=\'8\' height=\'8\' fill=\'%23333\'/><rect y=\'8\' width=\'8\' height=\'8\' fill=\'%23333\'/></svg>")',
                    border: '1px solid var(--border-color)',
                    padding: '0.5rem'
                  }}>
                    <img 
                      src={previewUrl} 
                      alt="Pasted Preview" 
                      style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain' }} 
                    />
                  </div>
                )}

                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Filename ({blobType === 'gif' ? '.gif' : '.png'}):
                </label>
                <input 
                  ref={inputRef}
                  type="text" 
                  className="input-field" 
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDownload();
                    if (e.key === 'Escape') handleCancel();
                  }}
                  style={{ width: '100%' }}
                />
                <div className="button-group" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button className="btn" onClick={handleCancel}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    Save {blobType === 'gif' ? 'as GIF' : 'as PNG'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Router>
    </ProcessingProvider>
  );
}

export default App;
