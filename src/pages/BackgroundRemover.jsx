import { useState } from 'react';
import { 
  SparklesIcon as ImageMinus, 
  XMarkIcon as XMark
} from '@heroicons/react/24/solid';
import { CloudArrowUpIcon as UploadCloud } from '@heroicons/react/24/outline';
import Dropzone from '../components/Dropzone';
import { removeBackground } from '@imgly/background-removal';
import { useProcessing } from '../contexts/ProcessingContext';
import CanvasEditor from './BackgroundRemover/CanvasEditor';

const TOOL_ID = 'bg-remove';

function BackgroundRemoverSlot({ slot }) {
  const { jobs, addJob, updateJob, removeJob, removeSlot } = useProcessing();
  const [modelVariant, setModelVariant] = useState('isnet_fp16');
  const [removalMethod, setRemovalMethod] = useState('ai'); // 'ai' or 'chromakey'

  const myJobId = slot.id;
  const myJob = jobs.find(j => j.id === myJobId);
  const isProcessing = myJob?.status === 'running';
  const resultUrl = myJob?.resultUrl;

  const { imageFile, previewUrl } = slot;

  const processImage = async () => {
    if (!imageFile || isProcessing) return;
    
    if (removalMethod === 'chromakey') {
      addJob({ id: myJobId, title: 'Opening Color Key Editor', type: 'bg-remove' });
      updateJob(myJobId, { status: 'success', resultUrl: previewUrl, downloadName: `nobg-${Date.now()}.png` });
      return;
    }

    addJob({ id: myJobId, title: 'Removing Background', type: 'bg-remove' });

    try {
      const config = {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        device: "gpu",
        model: modelVariant,
        progress: (key, current, total) => {
          if (total > 0) {
            updateJob(myJobId, { progress: (current / total) * 100, log: `Processing ${key}...` });
          }
        }
      };

      let imageBlob;
      try {
        imageBlob = await removeBackground(imageFile, config);
      } catch (gpuErr) {
        console.warn("GPU background removal failed, retrying with CPU...", gpuErr);
        updateJob(myJobId, { log: "Retrying with CPU mode..." });
        imageBlob = await removeBackground(imageFile, { ...config, device: "cpu" });
      }

      const rUrl = URL.createObjectURL(imageBlob);
      updateJob(myJobId, { status: 'success', resultUrl: rUrl, downloadName: `nobg-${Date.now()}.png` });
    } catch (error) {
      console.error(error);
      updateJob(myJobId, { status: 'error', error: error.message });
    }
  };

  const [isClosing, setIsClosing] = useState(false);
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => removeSlot(TOOL_ID, slot.id), 200);
  };

  return (
    <div className={`glass-panel controls animate-pop-in ${isClosing ? 'animate-pop-out' : ''}`} style={{ position: 'relative', marginBottom: '2rem' }}>
      <button 
        onClick={handleClose} 
        style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer', zIndex: 10 }}
        title="Close Slot"
      >
        <XMark style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
      </button>

      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
         <img src={previewUrl} alt="Original" style={{maxWidth: '100%', width: '100%', minHeight: '150px', maxHeight: '50vh', objectFit: 'contain', borderRadius: 'var(--border-radius-sm)', display: 'block', margin: '0 auto'}} />
         
         {!isProcessing && !resultUrl && (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
             <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)' }}>
                <button 
                   className={`btn ${removalMethod === 'ai' ? 'btn-primary' : ''}`}
                   onClick={() => setRemovalMethod('ai')}
                   style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                >AI Model</button>
                <button 
                   className={`btn ${removalMethod === 'chromakey' ? 'btn-primary' : ''}`}
                   onClick={() => setRemovalMethod('chromakey')}
                   style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                >Color Key (Solid)</button>
             </div>

             {removalMethod === 'ai' ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Model Quality Variant:</label>
                  <select 
                    className="input-field"
                    value={modelVariant}
                    onChange={(e) => setModelVariant(e.target.value)}
                    style={{ padding: '0.5rem', cursor: 'pointer' }}
                  >
                    <option value="isnet_fp16">Balanced (isnet_fp16 - GPU Fast)</option>
                    <option value="isnet">High Precision (isnet - Full Size Quality)</option>
                    <option value="isnet_quint8">Lightweight (isnet_quint8 - Fast Quantized)</option>
                  </select>
               </div>
             ) : (
               <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '0.25rem' }}>
                  Remove solid color backgrounds instantly.
               </div>
             )}

             <button className="btn btn-primary" onClick={processImage} style={{width: '100%'}}>
               {removalMethod === 'ai' ? 'Remove Background' : 'Open Editor'}
             </button>
           </div>
         )}
         
         {isProcessing && (
           <div style={{marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
             Analyzing and processing image...
           </div>
         )}
      </div>

      {resultUrl && (
        <div className="glass-panel preview-panel" style={{marginTop: '1.5rem', background: 'var(--bg-tertiary)'}}>
           <h3 style={{marginTop: 0, marginBottom: '1rem'}}>Refine & Customize Result</h3>
           <CanvasEditor 
             originalUrl={previewUrl} 
             resultUrl={resultUrl} 
             fileName={imageFile?.name} 
             onDiscard={() => removeJob(myJobId)} 
           />
        </div>
      )}
    </div>
  );
}

export default function BackgroundRemover() {
  const { workspaces, addSlot } = useProcessing();
  const slots = workspaces[TOOL_ID] || [];

  return (
    <div className="tool-page page-container animate-fade-in">
      <div className="page-header">
        <ImageMinus style={{width: 32, height: 32, fill: "url(#accent-grad)"}}/>
        <h1>Background Remover</h1>
      </div>
      <p style={{marginBottom: '2rem'}}>Remove backgrounds from images locally in your browser using high-precision AI and sub-pixel edge refinement.</p>

      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 450px), 1fr))', gap: '2rem', alignItems: 'start' }}>
        {slots.map(slot => (
          <BackgroundRemoverSlot key={slot.id} slot={slot} />
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
            icon={<UploadCloud style={{width: 48, height: 48, color: 'var(--text-secondary)'}}/>}
          />
        </div>
      </div>
    </div>
  );
}
