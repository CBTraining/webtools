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

function DropZoneCard({ title, subtitle, icon, action, onDropAction }) {
  return (
    <div 
      className="dropzone"
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('active'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('active'); }}
      onDrop={(e) => { e.currentTarget.classList.remove('active'); onDropAction(e, action); }}
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
}

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
      dragCounter.current = Math.max(0, dragCounter.current - 1);
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

  return (
    <div style={overlayStyle} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); dragCounter.current = 0; setIsDragging(false); setDragType('none'); }}>
      <div style={{ width: '100%', maxWidth: '950px', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {dragType === 'gif' && (
          <>
            <DropZoneCard title="Crop & Compress GIF" subtitle="Auto-compress under 50MB, crop dimensions, and trim duration" icon={<GifIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-gif" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Extract Frame" subtitle="Extract individual PNG frames from animated GIF" icon={<FilmIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="extract-frame" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Create Photo Collage" icon={<Square3Stack3DIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="create-collage" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Download as PNG" icon={<ArrowDownTrayIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="download-png" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Compress (<20MB)" icon={<ArrowsPointingInIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-image" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Image Editor" icon={<AdjustmentsHorizontalIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="edit-image" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'image' && (
          <>
            <DropZoneCard title="Create Photo Collage" icon={<Square3Stack3DIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="create-collage" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Remove background" icon={<SparklesIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="remove-bg" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Upscale" icon={<PhotoIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="upscale" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Download as PNG" icon={<ArrowDownTrayIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="download-png" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Compress (<20MB)" icon={<ArrowsPointingInIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-image" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Image Editor" icon={<AdjustmentsHorizontalIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="edit-image" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'video' && (
          <>
            <DropZoneCard title="Convert & Crop to GIF" subtitle="Target under 50MB, crop dimensions, and trim" icon={<GifIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="convert-gif" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Compress Video" icon={<FilmIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="compress-video" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Extract Frame" icon={<FilmIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="extract-frame" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'pdf' && (
          <DropZoneCard 
            title="Content Extractor (PDF)" 
            subtitle="Extract all embedded images, diagrams, and figures across all PDF pages"
            icon={<DocumentArrowDownIcon style={{ width: 52, height: 52, color: 'var(--primary-color)' }} />} 
            action="content-extract" 
            onDropAction={handleZoneDrop}
          />
        )}
        {dragType === 'doc' && (
          <DropZoneCard 
            title="Content Extractor (PPTX / DOCX / ZIP)" 
            subtitle="Extract all embedded raw animated GIFs, images, videos, and audio clips"
            icon={<DocumentArrowDownIcon style={{ width: 52, height: 52, color: 'var(--primary-color)' }} />} 
            action="content-extract" 
            onDropAction={handleZoneDrop}
          />
        )}
        {dragType === 'svg' && (
          <DropZoneCard title="SVG Converter" subtitle="Scale vector graphics, apply color fills, and export PNGs" icon={<CodeBracketIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="svg-convert" onDropAction={handleZoneDrop} />
        )}
        {dragType === 'json' && (
          <>
            <DropZoneCard title="Format & Save JSON" icon={<CodeBracketIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="json-editor" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Convert Lottie to GIF" icon={<GifIcon style={{ width: 44, height: 44, color: 'var(--primary-color)' }} />} action="lottie-convert" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'unknown' && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Unsupported file type. Drop anywhere to cancel.</div>
        )}
      </div>
    </div>
  );
}
