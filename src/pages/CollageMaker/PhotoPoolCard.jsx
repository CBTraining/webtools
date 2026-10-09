import { 
  PhotoIcon, 
  ArrowPathIcon, 
  PlusIcon, 
  FolderPlusIcon, 
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function PhotoPoolCard({
  photos,
  selectedPhotoId,
  setSelectedPhotoId,
  onShuffle,
  onClearAll,
  onAddFiles,
  onRemovePhoto,
  fileInputRef,
  folderInputRef
}) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PhotoIcon style={{ width: 20, height: 20, color: 'var(--primary-color)' }} />
          Photos ({photos.length})
        </h3>
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onShuffle} 
              title="Shuffle layout order" 
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
            >
              <ArrowPathIcon style={{ width: 14, height: 14 }} />
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={onClearAll} 
              title="Clear all photos" 
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)' }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Dropzone Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          className="btn btn-primary" 
          onClick={() => fileInputRef.current?.click()} 
          style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
        >
          <PlusIcon style={{ width: 16, height: 16 }} /> Add Photos
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => folderInputRef.current?.click()} 
          style={{ padding: '0.6rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          title="Add entire folder of photos"
        >
          <FolderPlusIcon style={{ width: 16, height: 16 }} /> Folder
        </button>

        <input 
          ref={fileInputRef} 
          type="file" 
          multiple 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={(e) => onAddFiles(e.target.files)} 
        />
        <input 
          ref={folderInputRef} 
          type="file" 
          multiple 
          accept="image/*" 
          webkitdirectory="" 
          style={{ display: 'none' }} 
          onChange={(e) => onAddFiles(e.target.files)} 
        />
      </div>

      {/* Thumbnail Grid Pool with X Delete buttons */}
      {photos.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.2rem' }}>
          {photos.map((photo, idx) => (
            <div 
              key={photo.id} 
              onClick={() => setSelectedPhotoId(photo.id)}
              style={{ 
                position: 'relative', 
                aspectRatio: '1', 
                borderRadius: 'var(--border-radius-sm)', 
                overflow: 'hidden', 
                border: selectedPhotoId === photo.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                cursor: 'pointer'
              }}
            >
              <img src={photo.url} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                onClick={(e) => onRemovePhoto(photo.id, e)} 
                style={{
                  position: 'absolute',
                  top: 2, right: 2,
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Remove Photo"
              >
                <XMarkIcon style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '1.5rem 1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--border-radius-sm)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Drop photos or folders anywhere, or click Add Photos to begin.
        </div>
      )}
    </div>
  );
}
