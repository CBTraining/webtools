import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';
import { formatTime } from '../utils/formatters';

/**
 * Interactive Timeline Trimmer with draggable start, end, and range handles.
 */
export default function DirectTimelineTrimmer({ 
  videoDuration, 
  startTime, 
  endTime, 
  onUpdateTimes, 
  onSeek, 
  isPlayingLoop, 
  onToggleLoop 
}) {
  const trackRef = useRef(null);
  const [draggingHandle, setDraggingHandle] = useState(null); // 'start', 'end', or 'range'
  const dragStartRef = useRef({ mouseX: 0, startVal: 0, endVal: 0 });

  const totalDur = videoDuration || 10;
  const startPct = Math.min(100, Math.max(0, (startTime / totalDur) * 100));
  const endPct = Math.min(100, Math.max(0, (endTime / totalDur) * 100));

  const handlePointerDown = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingHandle(type);
    dragStartRef.current = {
      mouseX: e.clientX,
      startVal: startTime,
      endVal: endTime
    };
  };

  useEffect(() => {
    if (!draggingHandle) return;

    const handlePointerMove = (e) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaSec = (deltaX / rect.width) * totalDur;

      if (draggingHandle === 'start') {
        const newStart = Math.max(0, Math.min(dragStartRef.current.endVal - 0.1, dragStartRef.current.startVal + deltaSec));
        onUpdateTimes(newStart, endTime);
        onSeek(newStart);
      } else if (draggingHandle === 'end') {
        const newEnd = Math.min(totalDur, Math.max(dragStartRef.current.startVal + 0.1, dragStartRef.current.endVal + deltaSec));
        onUpdateTimes(startTime, newEnd);
        onSeek(newEnd);
      } else if (draggingHandle === 'range') {
        const rangeLen = dragStartRef.current.endVal - dragStartRef.current.startVal;
        let newStart = dragStartRef.current.startVal + deltaSec;
        if (newStart < 0) newStart = 0;
        if (newStart + rangeLen > totalDur) newStart = totalDur - rangeLen;
        onUpdateTimes(newStart, newStart + rangeLen);
        onSeek(newStart);
      }
    };

    const handlePointerUp = () => {
      setDraggingHandle(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingHandle, startTime, endTime, totalDur, onUpdateTimes, onSeek]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleLoop();
            }}
            style={{
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              borderRadius: '4px',
              border: 'none',
              background: isPlayingLoop ? '#ef4444' : 'var(--accent-color)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
            }}
          >
            {isPlayingLoop ? (
              <>
                <PauseIcon style={{ width: '12px', height: '12px' }} /> Pause Loop
              </>
            ) : (
              <>
                <PlayIcon style={{ width: '12px', height: '12px' }} /> Play Crop Loop
              </>
            )}
          </button>
          <span style={{ fontWeight: '500' }}>Timeline Trimmer:</span>
        </div>
        <span>
          <strong style={{ color: 'var(--accent-color)' }}>{formatTime(startTime)}</strong> to <strong style={{ color: 'var(--accent-color)' }}>{formatTime(endTime)}</strong> ({(endTime - startTime).toFixed(1)}s)
        </span>
      </div>

      <div 
        ref={trackRef}
        style={{
          position: 'relative',
          height: '36px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onClick={(e) => {
          if (!trackRef.current || draggingHandle) return;
          const rect = trackRef.current.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * totalDur);
        }}
      >
        {/* Highlighted Crop Range Bar */}
        <div 
          onPointerDown={(e) => handlePointerDown('range', e)}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${startPct}%`,
            width: `${Math.max(0, endPct - startPct)}%`,
            background: 'rgba(59, 130, 246, 0.35)',
            borderTop: '2px solid var(--accent-color)',
            borderBottom: '2px solid var(--accent-color)',
            cursor: draggingHandle === 'range' ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Drag middle bar to slide crop window"
        >
          <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 'bold', pointerEvents: 'none', opacity: 0.85 }}>
            {(endTime - startTime).toFixed(1)}s
          </span>
        </div>

        {/* Left Start Handle */}
        <div 
          onPointerDown={(e) => handlePointerDown('start', e)}
          style={{
            position: 'absolute',
            top: '-2px',
            bottom: '-2px',
            left: `${startPct}%`,
            width: '16px',
            marginLeft: '-8px',
            background: 'var(--accent-color)',
            borderRadius: '4px',
            cursor: 'ew-resize',
            zIndex: 10,
            boxShadow: '0 0 8px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Drag Start Handle"
        >
          <div style={{ width: '2px', height: '16px', background: '#000', opacity: 0.6 }} />
        </div>

        {/* Right End Handle */}
        <div 
          onPointerDown={(e) => handlePointerDown('end', e)}
          style={{
            position: 'absolute',
            top: '-2px',
            bottom: '-2px',
            left: `${endPct}%`,
            width: '16px',
            marginLeft: '-8px',
            background: 'var(--accent-color)',
            borderRadius: '4px',
            cursor: 'ew-resize',
            zIndex: 10,
            boxShadow: '0 0 8px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Drag End Handle"
        >
          <div style={{ width: '2px', height: '16px', background: '#000', opacity: 0.6 }} />
        </div>
      </div>
    </div>
  );
}
