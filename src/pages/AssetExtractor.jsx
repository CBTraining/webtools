import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDownTrayIcon as Download, 
  GlobeAltIcon, 
  SparklesIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import JSZip from 'jszip';
import { playDing } from '../utils/audio';
import { downloadBlob } from '../utils/downloadUtils';
import { 
  SAMPLE_SITES, 
  fetchHtmlWithProxies, 
  extractAssetsFromHtml 
} from './AssetExtractor/webScraper';
import AssetCard from './AssetExtractor/AssetCard';
import AssetPreviewModal from './AssetExtractor/AssetPreviewModal';

export default function AssetExtractor() {
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [assets, setAssets] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [zipping, setZipping] = useState(false);
  const [previewModalAsset, setPreviewModalAsset] = useState(null);
  const navigate = useNavigate();

  // Cleanup object URLs when assets change or component unmounts
  useEffect(() => {
    return () => {
      assets.forEach(asset => {
        if (asset.url && asset.url.startsWith('blob:')) {
          URL.revokeObjectURL(asset.url);
        }
      });
    };
  }, [assets]);

  const handleExtract = async (urlToFetch) => {
    const inputUrl = urlToFetch || targetUrl;
    if (!inputUrl.trim()) return;

    let formattedUrl = inputUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setTargetUrl(formattedUrl);

    // Revoke previous blob URLs before clearing list
    assets.forEach(asset => {
      if (asset.url && asset.url.startsWith('blob:')) {
        URL.revokeObjectURL(asset.url);
      }
    });

    setLoading(true);
    setLoadingStatus('Working...');
    setErrorMsg('');
    setAssets([]);

    try {
      const htmlText = await fetchHtmlWithProxies(formattedUrl, setLoadingStatus);
      setLoadingStatus('Working...');
      const extractedList = extractAssetsFromHtml(htmlText, formattedUrl);
      setAssets(extractedList);
      playDing();
    } catch (err) {
      console.error("Asset Parsing/Fetch Error:", err);
      setErrorMsg(err.message || 'Failed to extract assets.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered asset list
  const filteredAssets = assets.filter(asset => {
    const matchesTab = activeTab === 'all' || asset.type === activeTab;
    const matchesSearch = !searchQuery || asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || asset.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadAsset = async (asset) => {
    try {
      if (asset.rawSvg) {
        const blob = new Blob([asset.rawSvg], { type: 'image/svg+xml' });
        downloadBlob(blob, asset.name);
        return;
      }
      const response = await fetch(asset.url);
      const blob = await response.blob();
      downloadBlob(blob, asset.name);
    } catch {
      window.open(asset.url, '_blank');
    }
  };

  const openInSvgConverter = async (asset) => {
    let svgText = asset.rawSvg;
    if (!svgText) {
      try {
        const res = await fetch(asset.url);
        svgText = await res.text();
      } catch (e) {
        console.error("Failed fetching SVG for Converter tool:", e);
        return;
      }
    }
    navigate('/svg-converter', { state: { svgText, fileName: asset.name } });
  };

  const downloadAllZip = async () => {
    if (assets.length === 0 || zipping) return;
    setZipping(true);

    try {
      const zip = new JSZip();
      const svgFolder = zip.folder("svg_vectors");
      const imgFolder = zip.folder("images");
      const videoFolder = zip.folder("videos");
      const iconFolder = zip.folder("icons");
      const lottieFolder = zip.folder("lottie_animations");

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        try {
          let folder = imgFolder;
          if (asset.type === 'svg') folder = svgFolder;
          else if (asset.type === 'video') folder = videoFolder;
          else if (asset.type === 'icon') folder = iconFolder;
          else if (asset.type === 'lottie') folder = lottieFolder;

          if (asset.rawSvg) {
            folder.file(asset.name, asset.rawSvg);
          } else {
            const res = await fetch(asset.url);
            const blob = await res.blob();
            folder.file(asset.name, blob);
          }
        } catch (e) {
          console.warn(`Could not add ${asset.name} to zip:`, e);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `extracted_website_assets_${Date.now()}.zip`);
      playDing();
    } catch (err) {
      console.error("Zip generation error:", err);
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <SparklesIcon style={{ width: 32, height: 32, color: 'var(--accent-color)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem' }}>Website Asset Extractor</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Extract all SVG vectors, high-res images, icons, CSS backgrounds, videos, and Lottie animations from any website.
            </p>
          </div>
        </div>
      </div>

      {/* URL Input Glass Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleExtract(); }}
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <GlobeAltIcon style={{ width: 20, height: 20, position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter website URL (e.g. google.com or https://stripe.com)" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={loading}
              style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.95rem' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !targetUrl.trim()}
            style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <ArrowPathIcon className="spin" style={{ width: 18, height: 18 }} />
                Extracting...
              </>
            ) : (
              <>
                <SparklesIcon style={{ width: 18, height: 18 }} />
                Extract Assets
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Site Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span>Try quick sample:</span>
          {SAMPLE_SITES.map(site => (
            <button
              key={site.name}
              type="button"
              className="btn"
              onClick={() => handleExtract(site.url)}
              disabled={loading}
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '12px' }}
            >
              {site.name}
            </button>
          ))}
        </div>

        {/* Loading Progress Feedback */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent-color)', fontSize: '0.85rem' }}>
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            <span>{loadingStatus}</span>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger-color)', borderRadius: 'var(--border-radius-sm)', color: '#f87171', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Main Results Container */}
      {assets.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Bar: Count, Search, Download All */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Found {assets.length} Assets</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>From {targetUrl}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', width: '220px' }}>
                <MagnifyingGlassIcon style={{ width: 16, height: 16, position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search assets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.5rem', fontSize: '0.8rem', height: '32px' }}
                />
              </div>

              {/* Bulk Download All Zip */}
              <button 
                className="btn btn-primary"
                onClick={downloadAllZip}
                disabled={zipping}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download style={{ width: 16, height: 16 }} />
                {zipping ? 'Zipping...' : 'Download All (.ZIP)'}
              </button>
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
            {[
              { id: 'all', label: `All (${assets.length})` },
              { id: 'svg', label: `SVG Vectors (${assets.filter(a => a.type === 'svg').length})` },
              { id: 'image', label: `Images (${assets.filter(a => a.type === 'image').length})` },
              { id: 'video', label: `Videos (${assets.filter(a => a.type === 'video').length})` },
              { id: 'icon', label: `Icons (${assets.filter(a => a.type === 'icon').length})` },
              { id: 'lottie', label: `Lottie (${assets.filter(a => a.type === 'lottie').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                className="btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  background: activeTab === tab.id ? 'var(--accent-color)' : 'rgba(255,255,255,0.04)',
                  color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Media Asset Gallery Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {filteredAssets.map((asset, index) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                index={index}
                onPreview={setPreviewModalAsset}
                onDownload={handleDownloadAsset}
                onOpenInSvgConverter={openInSvgConverter}
                onCopy={copyToClipboard}
                copiedIndex={copiedIndex}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expanded High-Res Preview Modal */}
      <AssetPreviewModal
        asset={previewModalAsset}
        onClose={() => setPreviewModalAsset(null)}
        onOpenInSvgConverter={openInSvgConverter}
        onDownload={handleDownloadAsset}
      />

    </div>
  );
}
