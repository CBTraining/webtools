import { ArrowsPointingInIcon as Compress, CloudArrowUpIcon as UploadCloud } from '@heroicons/react/24/solid';
import Dropzone from '../components/Dropzone';
import { useProcessing } from '../contexts/ProcessingContext';
import { isVideoFile } from '../utils/fileTypes';
import VideoCompressorSlot from './VideoCompressor/VideoCompressorSlot';

const TOOL_ID = 'video-compress';

export default function VideoCompressor() {
  const { isFfmpegLoaded, workspaces, addSlot } = useProcessing();
  const slots = workspaces[TOOL_ID] || [];

  const handleAddVideos = (files) => {
    const fileList = Array.isArray(files) ? files : [files];
    fileList.forEach(file => {
      if (file && isVideoFile(file)) {
        const slotId = `video-compress-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        addSlot(TOOL_ID, {
          id: slotId,
          videoFile: file,
          previewUrl: URL.createObjectURL(file),
          originalFps: null,
          isProbing: false,
          quality: 50,
          preset: 'fast',
          fps: 'original'
        });
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <Compress style={{ width: 32, height: 32, fill: "url(#accent-grad)" }} />
        <h1>Video Compressor</h1>
      </div>
      <p>Compress MP4 & MOV videos instantly, fully offline in your browser. Open multiple windows below!</p>
      
      {!isFfmpegLoaded && (
        <div className="glass-panel" style={{ marginBottom: '1rem', background: 'var(--accent-transparent)', border: '1px solid var(--accent-color)' }}>
          <div className="loader" style={{ width: '16px', height: '16px', marginRight: '10px' }}></div>
          Loading FFmpeg engine globally...
        </div>
      )}

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '2rem', alignItems: 'start' }}>
        {slots.map(slot => (
          <VideoCompressorSlot key={slot.id} slot={slot} />
        ))}

        <div className="glass-panel controls" style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)', borderWidth: '2px', background: 'transparent' }}>
          <Dropzone 
            onDrop={handleAddVideos}
            accept="video/*,.mov,.mp4,.webm,.mkv,.avi,.quicktime"
            title={slots.length > 0 ? "Add another video" : "Upload Video"}
            subtitle="Drag & drop or click to select (.mov, .mp4, etc.)"
            icon={<UploadCloud style={{ width: 48, height: 48, color: 'var(--text-secondary)' }} />}
          />
        </div>
      </div>
    </div>
  );
}
