import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Bars3Icon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
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
import SaveImageModal from './components/SaveImageModal';
import CommandPalette from './components/CommandPalette';
import { getAllTools } from './config/navigation';
import { useGlobalClipboard } from './hooks/useGlobalClipboard';
import { isVideoFile, isImageFile, compressImageUnder20MB } from './utils/fileTypes';
import { convertBlobToPng, convertImageAndDownload, downloadBlob } from './utils/imageConversion';

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

    // Dynamic document title & recent tools tracking
    const tools = getAllTools();
    const matchedTool = tools.find(t => t.to === location.pathname);

    if (matchedTool) {
      document.title = `${matchedTool.title} | WebTools`;
      try {
        const saved = JSON.parse(localStorage.getItem('webtools-recent') || '[]');
        const next = [matchedTool.to, ...saved.filter(p => p !== matchedTool.to)].slice(0, 5);
        localStorage.setItem('webtools-recent', JSON.stringify(next));
      } catch {
        // Ignore storage errors in private browsing
      }
    } else if (location.pathname === '/') {
      document.title = 'WebTools - Offline Client-Side Utilities';
    } else {
      document.title = 'WebTools';
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
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isClockMode, setIsClockMode] = useState(() => localStorage.getItem('isClockMode') === 'true');
  const [globalToast, setGlobalToast] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

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

  // High-performance pointer tracking for glowing card effect (delegated to active card only)
  useEffect(() => {
    const handlePointerMove = (e) => {
      const card = e.target.closest('.glass-panel, .nav-link, .glow-card');
      if (card) {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
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

  // Hook for global & manual paste handling
  const handleImageExtracted = useCallback((blob, resolvedFilename, targetType) => {
    const preview = URL.createObjectURL(blob);
    setPendingBlob(blob);
    setBlobType(targetType);
    setPreviewUrl(preview);
    setFilename(resolvedFilename);
    setShowModal(true);
  }, []);

  const showToast = useCallback((msg) => {
    setGlobalToast(msg);
  }, []);

  const { processImageBlob, handleManualPaste } = useGlobalClipboard({
    onImageExtracted: handleImageExtracted,
    onToast: showToast
  });

  const handleDownload = async () => {
    if (pendingBlob && filename) {
      window.dispatchEvent(new CustomEvent('burst', { detail: { type: 'vertical', x: 0 } }));

      const isGif = blobType === 'gif' || pendingBlob.type === 'image/gif' || filename.toLowerCase().endsWith('.gif');
      const cleanName = filename.replace(/\.(png|gif|jpe?g|webp|bmp|svg)$/i, '');
      const ext = isGif ? '.gif' : '.png';
      const downloadFilename = `${cleanName}${ext}`;

      let downloadTargetBlob = pendingBlob;
      if (!isGif && pendingBlob.type !== 'image/png') {
        try {
          downloadTargetBlob = await convertBlobToPng(pendingBlob);
        } catch (err) {
          console.warn("Conversion to PNG fallback:", err);
          downloadTargetBlob = pendingBlob;
        }
      }

      downloadBlob(downloadTargetBlob, downloadFilename);
      setGlobalToast({ text: `Saved ${downloadFilename}!`, type: 'success' });
    }
    setShowModal(false);
    setPendingBlob(null);
  };

  const handleCancelModal = () => {
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
              <Bars3Icon style={{ width: '28px', height: '28px' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '1rem' }}>
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="WebTools Logo" width="24" height="24" />
              <span style={{ fontWeight: 'normal', fontSize: '1.2rem' }}>Web<span className="text-gradient">Tools</span></span>
            </div>
            <button 
              onClick={() => setIsCommandPaletteOpen(true)}
              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px' }}
              title="Quick Search (Ctrl+K)"
            >
              <MagnifyingGlassIcon style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
          
          {globalToast && (
            <div className="toast animate-fade-in" style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000, background: typeof globalToast === 'object' && globalToast.type === 'success' ? 'var(--success-color, #52c41a)' : '#ff4444', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
              {typeof globalToast === 'object' ? globalToast.text : globalToast}
            </div>
          )}

          {isClockMode && (
            <ClockModeOverlay 
              onClose={() => setIsClockMode(false)} 
              onDropFile={async (file) => {
                if (isImageFile(file) || file.type.startsWith('image/')) {
                  try {
                    await convertImageAndDownload(file, 'png');
                    setGlobalToast({ text: "Image auto-converted to PNG and downloaded!", type: 'success' });
                  } catch (e) {
                    setGlobalToast({ text: "Failed to convert image.", type: 'error' });
                  }
                } else if (isVideoFile(file)) {
                  alert('Passive Video to GIF conversion via ffmpeg.wasm will trigger here!');
                } else {
                  alert('Unsupported file type for passive conversion.');
                }
              }}
            />
          )}

          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            onOpenSearch={() => setIsCommandPaletteOpen(true)}
            onManualPaste={handleManualPaste} 
            onClockClick={() => setIsClockMode(true)} 
            showDiagnostics={showDiagnostics} 
            onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)} 
          />
          
          <MainContentWrapper>
            <Suspense fallback={<RouteLoading />}>
              <Routes>
                <Route path="/" element={<Home onOpenSearch={() => setIsCommandPaletteOpen(true)} />} />
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </MainContentWrapper>
          
          <DragDropOverlay 
            onDropImageToModal={(file) => processImageBlob(file, file.name)}
            onDirectDownload={async (file, format = 'png') => {
              try {
                await convertImageAndDownload(file, format);
                setGlobalToast({ text: `Image auto-converted to ${format.toUpperCase()} and downloaded!`, type: 'success' });
              } catch (err) {
                setGlobalToast({ text: `Error: ${err.message}`, type: 'error' });
              }
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

          <SaveImageModal 
            isOpen={showModal}
            blobType={blobType}
            previewUrl={previewUrl}
            filename={filename}
            onFilenameChange={setFilename}
            onSave={handleDownload}
            onCancel={handleCancelModal}
          />

          <CommandPalette 
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onOpen={() => setIsCommandPaletteOpen(true)}
          />
        </div>
      </Router>
    </ProcessingProvider>
  );
}

export default App;
