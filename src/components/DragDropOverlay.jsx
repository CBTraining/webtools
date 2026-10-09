import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProcessing } from '../contexts/ProcessingContext';
import { 
  SparklesIcon, 
  PhotoIcon, 
  ArrowDownTrayIcon, 
  FilmIcon, 
  GifIcon, 
  DocumentArrowDownIcon, 
  CodeBracketIcon, 
  Square3Stack3DIcon, 
  ArrowsPointingInIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

import { extractDroppedFiles } from '../utils/fileTypes';
import { detectDragType } from './DragDropOverlay/dragTypeDetector';
import { routeDroppedFiles } from './DragDropOverlay/dragDropRouter';

export default function DragDropOverlay({ onDropImageToModal, onDirectDownload, onCompressImage }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState('none');
  const navigate = useNavigate();
  const { addSlot } = useProcessing();
  const dragCounter = useRef(0);
  
  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragging(true);
        const detected = detectDragType(e.dataTransfer);
        setDragType(detected);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
        setDragType('none');
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      setDragType('none');
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('global-drag-active', isDragging);
    return () => document.body.classList.remove('global-drag-active');
  }, [isDragging]);

  if (!isDragging || dragType === 'none') return null;

  const handleZoneDrop = async (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    setDragType('none');
    window.dispatchEvent(new CustomEvent('burst', { detail: { type: 'radial', x: e.clientX, y: e.clientY } }));

    // Extract real File objects (handles Desktop files + Google Chat / Slack web image drag)
    const files = await extractDroppedFiles(e);

    await routeDroppedFiles(files, action, dragType, {
      navigate,
      addSlot,
      onCompressImage,
      onDirectDownload,
      onDropImageToModal
    });
  };

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    zIndex: 9998,
    display: 'flex',
    padding: '2rem',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto'
  };

  const Card = ({ title, subtitle, icon, action }) => (
    <div 
      className="dropzone"
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('active'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('active'); }}
      onDrop={(e) => { e.currentTarget.classList.remove('active'); handleZoneDrop(e, action); }}
      style={{
        minHeight: '230px',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        cursor: 'pointer'
      }}
    >
      {icon}
      <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>{title}</h3>
      {subtitle && (
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '280px' }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div style={overlayStyle} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}>
      <div style={{ width: '100%', maxWidth: '950px', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {dragType === 'gif' && (
          <>
            <Card title="Crop & Compress GIF" subtitle="Auto-compress under 50MB, crop dimensions, and trim duration" icon={<GifIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-gif" />
            <Card title="Extract Frame" subtitle="Extract individual PNG frames from animated GIF" icon={<FilmIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="extract-frame" />
            <Card title="Create Photo Collage" icon={<Square3Stack3DIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="create-collage" />
            <Card title="Download as PNG" icon={<ArrowDownTrayIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="download-png" />
            <Card title="Compress (<20MB)" icon={<ArrowsPointingInIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-image" />
            <Card title="Image Editor" icon={<AdjustmentsHorizontalIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="edit-image" />
          </>
        )}
        {dragType === 'image' && (
          <>
            <Card title="Create Photo Collage" icon={<Square3Stack3DIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="create-collage" />
            <Card title="Remove background" icon={<SparklesIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="remove-bg" />
            <Card title="Upscale" icon={<PhotoIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="upscale" />
            <Card title="Download as PNG" icon={<ArrowDownTrayIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="download-png" />
            <Card title="Compress (<20MB)" icon={<ArrowsPointingInIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-image" />
            <Card title="Image Editor" icon={<AdjustmentsHorizontalIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="edit-image" />
          </>
        )}
        {dragType === 'video' && (
          <>
            <Card title="Convert & Crop to GIF" subtitle="Target under 50MB, crop dimensions, and trim" icon={<GifIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="convert-gif" />
            <Card title="Compress Video" icon={<FilmIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-video" />
            <Card title="Extract Frame" icon={<FilmIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="extract-frame" />
          </>
        )}
        {dragType === 'pdf' && (
          <Card 
            title="Content Extractor (PDF)" 
            subtitle="Extract all embedded images, diagrams, and figures across all PDF pages"
            icon={<DocumentArrowDownIcon style={{ width: 52, height: 52, color: 'var(--primary-color)' }} />} 
            action="content-extract" 
          />
        )}
        {dragType === 'doc' && (
          <Card 
            title="Content Extractor (PPTX / DOCX / ZIP)" 
            subtitle="Extract all embedded raw animated GIFs, images, videos, and audio clips"
            icon={<DocumentArrowDownIcon style={{ width: 52, height: 52, color: 'var(--primary-color)' }} />} 
            action="content-extract" 
          />
        )}
        {dragType === 'svg' && (
          <Card title="SVG Converter" subtitle="Scale vector graphics, apply color fills, and export PNGs" icon={<CodeBracketIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="svg-convert" />
        )}
        {dragType === 'json' && (
          <>
            <Card title="Format & Save JSON" icon={<CodeBracketIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="json-editor" />
            <Card title="Convert Lottie to GIF" icon={<GifIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="lottie-convert" />
          </>
        )}
        {dragType === 'unknown' && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Unsupported file type. Drop anywhere to cancel.</div>
        )}
      </div>
    </div>
  );
}
