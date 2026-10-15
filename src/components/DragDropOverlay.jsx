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
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon
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
        flex: '1 1 0',
        minHeight: '62px',
        maxHeight: '115px',
        padding: '0.7rem 0.9rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: '0.75rem',
        cursor: 'pointer'
      }}
    >
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '10px',
        background: 'var(--accent-transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.2 }}>{title}</h3>
        {subtitle && (
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.74rem', lineHeight: 1.25 }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

const iconStyle = { width: 22, height: 22, color: 'var(--primary-color)', flexShrink: 0 };

export default function DragDropOverlay({ onDropImageToModal, onDirectDownload, onCompressImage }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [dragType, setDragType] = useState('none');
  const [dockSide, setDockSide] = useState(() => localStorage.getItem('webtools-dropdock-side') || 'left');
  const navigate = useNavigate();
  const { addSlot } = useProcessing();
  const dragCounter = useRef(0);
  const closeTimeoutRef = useRef(null);

  const toggleDockSide = () => {
    setDockSide(prev => {
      const next = prev === 'left' ? 'right' : 'left';
      localStorage.setItem('webtools-dropdock-side', next);
      return next;
    });
  };
  
  useEffect(() => {
    const resetDragState = () => {
      dragCounter.current = 0;
      setIsClosing(true);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = setTimeout(() => {
        if (dragCounter.current === 0) {
          setIsDragging(false);
          setIsClosing(false);
          setDragType('none');
        }
      }, 140);
    };

    const handleDragEnter = (e) => {
      e.preventDefault();
      dragCounter.current++;
      if (dragCounter.current === 1) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setIsClosing(false);
        setIsDragging(true);
        const detected = detectDragType(e.dataTransfer);
        setDragType(detected);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0 || (!e.relatedTarget && (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight))) {
        resetDragState();
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      // Defer state cleanup slightly so any page dropzone or card target finishes its onDrop handler first
      setTimeout(resetDragState, 0);
    };

    const handleDragEnd = () => {
      resetDragState();
    };

    window.addEventListener('dragenter', handleDragEnter, true);
    window.addEventListener('dragleave', handleDragLeave, true);
    window.addEventListener('dragover', handleDragOver, true);
    window.addEventListener('drop', handleDrop, true);
    window.addEventListener('dragend', handleDragEnd, true);

    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      window.removeEventListener('dragenter', handleDragEnter, true);
      window.removeEventListener('dragleave', handleDragLeave, true);
      window.removeEventListener('dragover', handleDragOver, true);
      window.removeEventListener('drop', handleDrop, true);
      window.removeEventListener('dragend', handleDragEnd, true);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('global-drag-active', isDragging && !isClosing);
    return () => document.body.classList.remove('global-drag-active');
  }, [isDragging, isClosing]);

  if (!isDragging || dragType === 'none') return null;

  const closeDockGracefully = () => {
    dragCounter.current = 0;
    setIsClosing(true);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
      setIsClosing(false);
      setDragType('none');
    }, 140);
  };

  const handleZoneDrop = async (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    closeDockGracefully();

    // Extract real File objects (handles Desktop files + folders + Google Chat / Slack web image drag)
    const files = await extractDroppedFiles(e);

    await routeDroppedFiles(files, action, dragType, {
      navigate,
      addSlot,
      onCompressImage,
      onDirectDownload,
      onDropImageToModal
    });
  };

  const dockAnimClass = dockSide === 'left'
    ? (isClosing ? 'animate-dock-left-out' : 'animate-dock-left-in')
    : (isClosing ? 'animate-dock-right-out' : 'animate-dock-right-in');

  const dockStyle = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    [dockSide]: 0,
    width: '280px',
    maxWidth: '85vw',
    backgroundColor: 'var(--bg-secondary)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRight: dockSide === 'left' ? '2px solid var(--accent-color)' : 'none',
    borderLeft: dockSide === 'right' ? '2px solid var(--accent-color)' : 'none',
    boxShadow: '0 0 35px rgba(0, 0, 0, 0.65), 0 0 15px var(--accent-glow)',
    zIndex: 9998,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 0.85rem',
    gap: '0.75rem',
    pointerEvents: isClosing ? 'none' : 'auto'
  };

  return (
    <aside
      className={dockAnimClass}
      style={dockStyle}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        closeDockGracefully();
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.6rem',
        borderBottom: '1px solid var(--border-color)',
        flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-color)', letterSpacing: '0.3px' }}>
            Quick Drop Actions
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Or drop directly onto the page
          </div>
        </div>
        <button
          type="button"
          onClick={toggleDockSide}
          onDragEnter={toggleDockSide}
          title={`Move dock to ${dockSide === 'left' ? 'right' : 'left'} side`}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--text-secondary)',
            padding: '0.3rem 0.5rem',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer'
          }}
        >
          <ArrowsRightLeftIcon style={{ width: 13, height: 13 }} />
          {dockSide === 'left' ? 'Right' : 'Left'}
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '0.6rem',
        minHeight: 0,
        overflowY: 'auto'
      }}>
        {dragType === 'gif' && (
          <>
            <DropZoneCard title="Crop & Compress GIF" subtitle="Under 50MB, crop & trim" icon={<GifIcon style={iconStyle} />} action="compress-gif" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Extract Frame" subtitle="Save PNG frames from GIF" icon={<FilmIcon style={iconStyle} />} action="extract-frame" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Create Photo Collage" subtitle="Add to collage workspace" icon={<Square3Stack3DIcon style={iconStyle} />} action="create-collage" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Download as PNG" subtitle="Instant PNG conversion" icon={<ArrowDownTrayIcon style={iconStyle} />} action="download-png" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Compress (<20MB)" subtitle="Full-res size reduction" icon={<ArrowsPointingInIcon style={iconStyle} />} action="compress-image" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Image Editor" subtitle="Blur, lighting & resize" icon={<AdjustmentsHorizontalIcon style={iconStyle} />} action="edit-image" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'image' && (
          <>
            <DropZoneCard title="Create Photo Collage" subtitle="Add to collage workspace" icon={<Square3Stack3DIcon style={iconStyle} />} action="create-collage" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Remove Background" subtitle="AI background removal" icon={<SparklesIcon style={iconStyle} />} action="remove-bg" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Upscale" subtitle="2x / 4x AI enhancement" icon={<PhotoIcon style={iconStyle} />} action="upscale" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Download as PNG" subtitle="Instant PNG conversion" icon={<ArrowDownTrayIcon style={iconStyle} />} action="download-png" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Compress (<20MB)" subtitle="Full-res size reduction" icon={<ArrowsPointingInIcon style={iconStyle} />} action="compress-image" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Image Editor" subtitle="Blur, lighting & resize" icon={<AdjustmentsHorizontalIcon style={iconStyle} />} action="edit-image" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'video' && (
          <>
            <DropZoneCard title="Convert & Crop to GIF" subtitle="Target under 50MB, crop & trim" icon={<GifIcon style={iconStyle} />} action="convert-gif" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Compress Video" subtitle="Shrink MP4, MOV & AVI" icon={<FilmIcon style={iconStyle} />} action="compress-video" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Extract Frame" subtitle="Grab high-res video stills" icon={<FilmIcon style={iconStyle} />} action="extract-frame" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'pdf' && (
          <DropZoneCard 
            title="Content Extractor (PDF)" 
            subtitle="Extract embedded images & figures across pages"
            icon={<DocumentArrowDownIcon style={iconStyle} />} 
            action="content-extract" 
            onDropAction={handleZoneDrop}
          />
        )}
        {dragType === 'doc' && (
          <DropZoneCard 
            title="Content Extractor" 
            subtitle="Extract GIFs, images & media from PPTX/DOCX/ZIP"
            icon={<DocumentArrowDownIcon style={iconStyle} />} 
            action="content-extract" 
            onDropAction={handleZoneDrop}
          />
        )}
        {dragType === 'svg' && (
          <DropZoneCard title="SVG Converter" subtitle="Scale vectors, recolor & export PNGs" icon={<CodeBracketIcon style={iconStyle} />} action="svg-convert" onDropAction={handleZoneDrop} />
        )}
        {dragType === 'json' && (
          <>
            <DropZoneCard title="Format & Save JSON" subtitle="Beautify & inspect JSON" icon={<CodeBracketIcon style={iconStyle} />} action="json-editor" onDropAction={handleZoneDrop} />
            <DropZoneCard title="Convert Lottie to GIF" subtitle="Render Lottie JSON to GIF" icon={<GifIcon style={iconStyle} />} action="lottie-convert" onDropAction={handleZoneDrop} />
          </>
        )}
        {dragType === 'unknown' && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem' }}>
            Drop onto the page workspace or release anywhere to cancel.
          </div>
        )}
      </div>
    </aside>
  );
}
