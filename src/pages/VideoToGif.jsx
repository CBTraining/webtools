import { 
  GifIcon as Gif, 
  CloudArrowUpIcon as UploadCloud 
} from '@heroicons/react/24/solid';
import { useProcessing } from '../contexts/ProcessingContext';
import Dropzone from '../components/Dropzone';
import { isVideoFile } from '../utils/fileTypes';
import VideoToGifSlot from './VideoToGif/VideoToGifSlot';

const TOOL_ID = 'video-to-gif';

const isVideoOrGif = (file) => {
  if (!file) return false;
  return isVideoFile(file) || file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
};

export default function VideoToGif() {
  const { isFfmpegLoaded, workspaces, addSlot } = useProcessing();
  const slots = workspaces[TOOL_ID] || [];

  const handleAddVideos = (files) => {
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(file => {
      if (file && isVideoOrGif(file)) {
        const slotId = `${TOOL_ID}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        addSlot(TOOL_ID, {
          id: slotId,
          videoFile: file,
          previewUrl: URL.createObjectURL(file),
          originalFps: null,
          isProbing: false,
          quality: 80,
          enableCrop: false,
          startTime: 0,
          endTime: 5,
          fps: '15',
          enableSpatialCrop: false,
          cropRect: { x: 0, y: 0, width: 100, height: 100 },
          cropAspectRatio: 'free',
          targetSizeLimit: '50',
          customTargetMb: 50
        });
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <Gif style={{ width: "32px", height: "32px", fill: "url(#accent-grad)" }} />
        <h1>Video & GIF Cropper, Trimmer & Compressor</h1>
      </div>
      <p>Convert videos to GIFs, crop frame dimensions visually, trim timelines, and automatically compress GIFs under 50 MB, 25 MB, or custom sizes fully offline.</p>
      
      {!isFfmpegLoaded && (
        <div className="glass-panel" style={{ marginBottom: '1rem', background: 'var(--accent-transparent)', border: '1px solid var(--accent-color)' }}>
          <div className="loader" style={{ width: '16px', height: '16px', marginRight: '10px' }}></div>
          Loading FFmpeg engine globally...
        </div>
      )}

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '2rem', alignItems: 'start' }}>
        {slots.map(slot => (
          <VideoToGifSlot key={slot.id} slot={slot} />
        ))}

        <div className="glass-panel controls" style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)', borderWidth: '2px', background: 'transparent' }}>
          <Dropzone 
            onDrop={handleAddVideos}
            accept="video/*,.mov,.mp4,.webm,.mkv,.avi,.quicktime,.gif,image/gif"
            title={slots.length > 0 ? "Add another video or GIF" : "Upload Video or GIF"}
            subtitle="Drag & drop or click to select (.mp4, .mov, .gif, etc.)"
            icon={<UploadCloud style={{ width: 48, height: 48, color: 'var(--text-secondary)' }} />}
          />
        </div>
      </div>
    </div>
  );
}
