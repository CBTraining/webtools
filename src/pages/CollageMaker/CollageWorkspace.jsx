import { 
  ArrowDownTrayIcon, 
  PhotoIcon, 
  MagnifyingGlassPlusIcon, 
  MagnifyingGlassMinusIcon, 
  ArrowPathIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function CollageWorkspace({
  canvasWidth,
  canvasHeight,
  photos,
  onDownload,
  canvasRef,
  previewContainerRef,
  previewBgStyle,
  fileInputRef,
  emptyTitleColor,
  emptySubtitleColor,
  previewCells,
  selectedPhotoId,
  setSelectedPhotoId,
  isPanning,
  panningPhotoId,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
  onCellWheel,
  borderRadius,
  shadow,
  borderWidth,
  borderColor,
  fillMode,
  updatePhoto,
  onRemovePhoto
}) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Action Bar & Resolution Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Canvas Output: {canvasWidth} × {canvasHeight} px
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.75rem' }}>
            ({photos.length} photo{photos.length !== 1 ? 's' : ''})
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => onDownload('png')}
            disabled={photos.length === 0}
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowDownTrayIcon style={{ width: 18, height: 18 }} /> Save PNG
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => onDownload('jpeg')}
            disabled={photos.length === 0}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            Save JPG
          </button>
        </div>
      </div>

      {/* Hidden Offscreen Export Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Interactive Preview Work Area */}
      <div 
        ref={previewContainerRef}
        onPointerMove={onCellPointerMove}
        onPointerUp={onCellPointerUp}
        style={{ 
          width: '100%', 
          aspectRatio: `${canvasWidth} / ${canvasHeight}`,
          maxHeight: '70vh',
          ...previewBgStyle,
          borderRadius: 'var(--border-radius-sm)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
          margin: '0 auto',
          userSelect: 'none'
        }}
      >
        {photos.length === 0 ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              cursor: 'pointer',
              padding: '2rem'
            }}
          >
            <PhotoIcon style={{ width: 64, height: 64, color: 'var(--primary-color)', opacity: 0.8 }} />
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: 0, color: emptyTitleColor, transition: 'color 0.2s' }}>Your Collage Canvas</h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: emptySubtitleColor, transition: 'color 0.2s' }}>
                Click or drop photos/folders to assemble your collage.
              </p>
            </div>
          </div>
        ) : (
          previewCells.map((cell, idx) => {
            const photo = photos[idx];
            if (!photo) return null;
            const isSelected = selectedPhotoId === photo.id;

            // Scale percent to parent container width
            const pctX = (cell.x / canvasWidth) * 100;
            const pctY = (cell.y / canvasHeight) * 100;
            const pctW = (cell.width / canvasWidth) * 100;
            const pctH = (cell.height / canvasHeight) * 100;

            return (
              <div
                key={photo.id}
                onPointerDown={(e) => onCellPointerDown(photo.id, e)}
                onWheel={(e) => onCellWheel(photo.id, e)}
                onClick={() => setSelectedPhotoId(photo.id)}
                style={{
                  position: 'absolute',
                  left: `${pctX}%`,
                  top: `${pctY}%`,
                  width: `${pctW}%`,
                  height: `${pctH}%`,
                  borderRadius: `${(borderRadius / canvasWidth) * 100}%`,
                  transform: cell.angle ? `rotate(${cell.angle}deg)` : 'none',
                  overflow: 'hidden',
                  cursor: isPanning && panningPhotoId === photo.id ? 'grabbing' : 'grab',
                  boxShadow: shadow > 0 ? `0 ${shadow}px ${shadow*2}px rgba(0,0,0,0.3)` : 'none',
                  border: isSelected ? '2px solid var(--primary-color)' : borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none'
                }}
              >
                {/* Render Image with Pan & Zoom transform */}
                <img 
                  src={photo.url} 
                  alt={`Collage Item ${idx}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: fillMode,
                    transform: `translate(${photo.panX}%, ${photo.panY}%) scale(${photo.zoom})`,
                    pointerEvents: 'none'
                  }}
                />

                {/* Cell Overlay Controls on Selection */}
                {isSelected && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 6, right: 6,
                      display: 'flex',
                      gap: '0.3rem',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: 'var(--border-radius-sm)',
                      zIndex: 10
                    }}
                  >
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updatePhoto(photo.id, 'zoom', Math.min(4, photo.zoom + 0.15)); }}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                      title="Zoom In"
                    >
                      <MagnifyingGlassPlusIcon style={{ width: 14, height: 14 }} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updatePhoto(photo.id, 'zoom', Math.max(0.4, photo.zoom - 0.15)); }}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                      title="Zoom Out"
                    >
                      <MagnifyingGlassMinusIcon style={{ width: 14, height: 14 }} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updatePhoto(photo.id, 'panX', 0); updatePhoto(photo.id, 'panY', 0); updatePhoto(photo.id, 'zoom', 1.0); }}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                      title="Reset Crop & Pan"
                    >
                      <ArrowPathIcon style={{ width: 14, height: 14 }} />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => onRemovePhoto(photo.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}
                      title="Remove Photo"
                    >
                      <XMarkIcon style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
        Tip: Drag directly on any photo to adjust pan, or use your mouse scroll wheel over a photo to zoom in & out.
      </div>
    </div>
  );
}
