import React, { useRef, useEffect } from 'react';

/**
 * Modal to preview and save a pasted/dropped image or GIF with a customized filename.
 */
export default function SaveImageModal({
  isOpen,
  blobType,
  previewUrl,
  filename,
  onFilenameChange,
  onSave,
  onCancel
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isGif = blobType === 'gif';

  return (
    <div className="modal-overlay">
      <div className="modal glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '90%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0 }}>Save {isGif ? 'Animated GIF' : 'Image'}</h3>
          {isGif && (
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
          {isGif 
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
          Filename ({isGif ? '.gif' : '.png'}):
        </label>
        <input 
          ref={inputRef}
          type="text" 
          className="input-field" 
          value={filename}
          onChange={(e) => onFilenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          style={{ width: '100%' }}
        />
        <div className="button-group" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>
            Save {isGif ? 'as GIF' : 'as PNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
