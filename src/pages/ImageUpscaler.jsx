import { SparklesIcon, CloudArrowUpIcon as UploadCloud } from '@heroicons/react/24/outline';
import Dropzone from '../components/Dropzone';
import { useProcessing } from '../contexts/ProcessingContext';
import UpscalerSlot from './ImageUpscaler/UpscalerSlot';

const TOOL_ID = 'ai-upscaler';

export default function ImageUpscaler() {
  const { workspaces, addSlot } = useProcessing();
  const slots = workspaces[TOOL_ID] || [];

  return (
    <div className="tool-page page-container animate-fade-in">
      <div className="page-header">
        <SparklesIcon style={{ width: 32, height: 32, color: 'var(--accent-color)' }} />
        <h1>Upscaler</h1>
      </div>
      <p style={{ marginBottom: '2rem' }}>Enhance and upscale images 2x directly in your browser using local AI (Free & Offline).</p>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '2rem', alignItems: 'start' }}>
        {slots.map(slot => (
          <UpscalerSlot key={slot.id} slot={slot} />
        ))}

        <div className="glass-panel controls" style={{ borderStyle: 'dashed', borderColor: 'var(--border-color)', borderWidth: '2px', background: 'transparent' }}>
          <Dropzone 
            onDrop={(files) => {
              const fileList = Array.isArray(files) ? files : [files];
              fileList.forEach(file => {
                if (file && file.type.startsWith('image/')) {
                  const slotId = `${TOOL_ID}-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                  addSlot(TOOL_ID, {
                    id: slotId,
                    imageFile: file,
                    previewUrl: URL.createObjectURL(file)
                  });
                }
              });
            }} 
            accept="image/*" 
            title={slots.length > 0 ? "Add another image" : "Upload Image"}
            subtitle="Drop a JPG or PNG here"
            icon={<UploadCloud style={{ width: 48, height: 48, color: 'var(--text-secondary)' }} />}
          />
        </div>
      </div>
    </div>
  );
}
