import { useState, useEffect, useMemo } from 'react';
import { 
  DocumentArrowDownIcon as DocumentIcon, 
  ArrowDownTrayIcon as DownloadIcon, 
  XMarkIcon as XMark,
  MagnifyingGlassIcon,
  SparklesIcon,
  PlayIcon,
  FilmIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import JSZip from 'jszip';
import Dropzone from '../components/Dropzone';
import { playDing } from '../utils/audio';
import { formatBytes } from '../utils/formatters';
import { downloadBlob, copyBlobToClipboard } from '../utils/downloadUtils';
import { useLocation } from 'react-router-dom';
import { extractZipArchive, extractPdf } from './ContentExtractor/extractors';
import ExtractedItemCard from './ContentExtractor/ExtractedItemCard';

export default function ContentExtractor() {
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filter & Search States
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'gif', 'png', 'jpg', 'svg', 'video', 'audio', 'other'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const extractContent = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setItems([]);
    setSelectedIds(new Set());
    setErrorMsg('');
    
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    setFileName(baseName);
    const ext = file.name.split('.').pop().toLowerCase();

    try {
      let extractedList = [];
      if (ext === 'pdf' || file.type === 'application/pdf') {
        extractedList = await extractPdf(file, {
          onProgress: setProgress,
          onStatus: setStatusText
        });
      } else {
        // PPTX, DOCX, XLSX, ZIP, KEY, ODP, ODT
        extractedList = await extractZipArchive(file, {
          onProgress: setProgress,
          onStatus: setStatusText
        });
      }

      setItems(extractedList);
      setSelectedIds(new Set(extractedList.map(item => item.id)));

      if (extractedList.length === 0) {
        setErrorMsg(`No embedded images, GIFs, or media found in this ${ext.toUpperCase()} file.`);
      } else {
        playDing();
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setErrorMsg("Failed to extract content: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatusText('');
    }
  };

  // Handle incoming file from drag and drop or router state
  useEffect(() => {
    const file = location.state?.file || location.state?.pdfFile;
    if (file && !isProcessing && items.length === 0) {
      extractContent(file);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [items]);

  const handleDrop = (files) => {
    const file = Array.isArray(files) ? files[0] : files;
    if (file) extractContent(file);
  };

  // Filter Categories & Counts
  const counts = useMemo(() => {
    const c = { all: items.length, gif: 0, png: 0, jpg: 0, svg: 0, video: 0, audio: 0, other: 0 };
    items.forEach(item => {
      if (c[item.category] !== undefined) c[item.category]++;
      else c.other++;
    });
    return c;
  }, [items]);

  // Filtered items based on category and search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = activeFilter === 'all' || item.category === activeFilter;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.ext.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, activeFilter, searchQuery]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredItems.map(i => i.id);
    const allFilteredSelected = filteredIds.every(id => selectedIds.has(id));

    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (allFilteredSelected) {
        filteredIds.forEach(id => newSet.delete(id));
      } else {
        filteredIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const copyToClipboard = async (blob, id) => {
    const success = await copyBlobToClipboard(blob);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      alert("Failed to copy image to clipboard.");
    }
  };

  const downloadZip = async () => {
    if (selectedIds.size === 0) return;
    const zip = new JSZip();
    const folder = zip.folder(`${fileName}_extracted_media`);
    
    items.forEach(item => {
      if (selectedIds.has(item.id)) {
        folder.file(item.name, item.blob);
      }
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${fileName}_extracted_media.zip`);
  };

  const reset = () => {
    items.forEach(item => URL.revokeObjectURL(item.url));
    setItems([]);
    setSelectedIds(new Set());
    setFileName('');
    setErrorMsg('');
    setActiveFilter('all');
    setSearchQuery('');
  };

  return (
    <div className="animate-fade-in page-container">
      <div className="page-header">
        <DocumentIcon style={{ width: 32, height: 32, stroke: "url(#accent-grad)" }} />
        <h1>Content Extractor</h1>
      </div>
      
      <p style={{ marginTop: '-0.5rem', color: 'var(--text-secondary)' }}>
        Extract all raw embedded GIFs, images, videos, audio, and vector graphics from <strong>PPTX, PDF, DOCX, XLSX, ODP, and ZIP</strong> files locally in your browser.
      </p>

      {errorMsg && (
        <div className="glass-panel" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
          {errorMsg}
        </div>
      )}

      {items.length === 0 && !isProcessing && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', borderStyle: 'dashed', borderColor: 'var(--border-color)', borderWidth: '2px', background: 'transparent' }}>
          <Dropzone 
            onDrop={handleDrop}
            accept=".pptx,.pdf,.docx,.xlsx,.zip,.key,.odp,.odt"
            title="Upload Presentation or Document"
            subtitle="Drop a PowerPoint (.pptx), PDF (.pdf), Word (.docx), or ZIP file here"
            icon={<DocumentIcon style={{ width: 48, height: 48, color: 'var(--accent-color)' }} />}
          />
        </div>
      )}

      {isProcessing && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.25rem auto' }}></div>
          <h3>Extracting Media & Assets...</h3>
          <div className="progress-bar-bg" style={{ marginTop: '1rem', maxWidth: '400px', margin: '1rem auto 0 auto' }}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {statusText || `Processing... ${progress}%`}
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="results-container animate-slide-up">
          {/* Top Control Bar */}
          <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                  Found {items.length} Extracted File{items.length !== 1 ? 's' : ''}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {selectedIds.size} of {items.length} selected for export
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={toggleSelectAllFiltered}>
                  {filteredItems.every(i => selectedIds.has(i.id)) ? 'Deselect Shown' : 'Select Shown'}
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={downloadZip}
                  disabled={selectedIds.size === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <DownloadIcon style={{ width: 18, height: 18 }} />
                  Download Selected (.ZIP)
                </button>
                <button className="btn btn-secondary" onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <XMark style={{ width: 18, height: 18 }} />
                  New File
                </button>
              </div>
            </div>

            {/* Category Filter Chips & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All', icon: SparklesIcon, count: counts.all },
                  { id: 'gif', label: 'GIFs', icon: PlayIcon, count: counts.gif },
                  { id: 'png', label: 'PNG', icon: PhotoIcon, count: counts.png },
                  { id: 'jpg', label: 'JPG', icon: PhotoIcon, count: counts.jpg },
                  { id: 'svg', label: 'SVG', icon: DocumentIcon, count: counts.svg },
                  { id: 'video', label: 'Video', icon: FilmIcon, count: counts.video },
                  { id: 'audio', label: 'Audio', icon: DocumentIcon, count: counts.audio }
                ].filter(tab => tab.id === 'all' || tab.count > 0).map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      className="btn"
                      onClick={() => setActiveFilter(tab.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.8rem',
                        borderRadius: '20px',
                        background: isActive ? 'var(--accent-color)' : 'var(--bg-tertiary)',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Icon style={{ width: 14, height: 14 }} />
                      <span>{tab.label}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        opacity: 0.8,
                        background: isActive ? 'rgba(0,0,0,0.2)' : 'var(--bg-primary)',
                        padding: '0.1rem 0.35rem',
                        borderRadius: '10px'
                      }}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: '200px' }}>
                <MagnifyingGlassIcon style={{ width: 14, height: 14, position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="Filter by name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.35rem 0.6rem 0.35rem 2rem', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {/* Extracted Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {filteredItems.map((item) => (
              <ExtractedItemCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                onCopyToClipboard={copyToClipboard}
                onDownloadBlob={downloadBlob}
                copiedId={copiedId}
                formatBytes={formatBytes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
