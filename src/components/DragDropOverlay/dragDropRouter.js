import { isVideoFile, isImageFile, compressImageUnder20MB } from '../../utils/fileTypes';

export async function routeDroppedFiles(files, action, dragType, {
  navigate,
  addSlot,
  onCompressImage,
  onDirectDownload,
  onDropImageToModal
}) {
  if (action === 'create-collage') {
    const imgFiles = files.filter(f => isImageFile(f) || f.type.startsWith('image/'));
    if (imgFiles.length > 0) {
      navigate('/collage-maker', { state: { droppedFiles: imgFiles } });
    } else {
      navigate('/collage-maker');
    }
    return;
  }
  
  const file = files[0];
  if (!file) return;

  if (action === 'compress-gif' || (action === 'convert-gif' && (dragType === 'gif' || file.name.endsWith('.gif')))) {
    addSlot('video-to-gif', {
      id: crypto.randomUUID(),
      videoFile: file,
      previewUrl: URL.createObjectURL(file),
      targetSizeLimit: '50',
      enableSpatialCrop: false
    });
    navigate('/video-to-gif');
    return;
  }

  if (dragType === 'json' || file.name.endsWith('.json')) {
    if (action === 'json-editor') {
      const text = await file.text();
      navigate('/json-saver', { state: { jsonText: text } });
      return;
    } else if (action === 'lottie-convert') {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        const slotId = `lottie-to-gif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        addSlot('lottie-to-gif', {
          id: slotId,
          lottieData: json,
          fileName: file.name
        });
        navigate('/lottie-to-gif');
      } catch (err) {
        alert("Invalid JSON file: " + err.message);
      }
      return;
    }
  }

  if (dragType === 'svg' || file.name.endsWith('.svg')) {
    if (action === 'svg-convert' || action === 'svg-3d') {
      const text = await file.text();
      navigate('/svg-converter', { state: { svgText: text } });
      return;
    }
  }
  
  if ((dragType === 'doc' || dragType === 'pdf' || file.name.match(/\.(pdf|pptx|docx|xlsx|zip|key|odp|odt)$/i)) && (action === 'pdf-extract' || action === 'content-extract')) {
    navigate('/content-extractor', { state: { file } });
    return;
  }

  if (dragType === 'video' || isVideoFile(file)) {
    if (action === 'convert-gif') {
      addSlot('video-to-gif', { id: crypto.randomUUID(), videoFile: file, previewUrl: URL.createObjectURL(file), targetSizeLimit: '50' });
      navigate('/video-to-gif');
    } else if (action === 'compress-video') {
      addSlot('video-compressor', { id: crypto.randomUUID(), videoFile: file, previewUrl: URL.createObjectURL(file) });
      navigate('/video-compressor');
    } else if (action === 'extract-frame') {
      navigate('/video-frame-extractor', { state: { videoFile: file } });
    }
    return;
  }

  // Default: Image Actions
  if (action === 'compress-image') {
    if (onCompressImage) {
      onCompressImage(file);
    } else {
      compressImageUnder20MB(file);
    }
  } else if (action === 'download-png') {
    onDirectDownload(file, 'png');
  } else if (action === 'rename-png') {
    onDropImageToModal(file);
  } else if (action === 'edit-image') {
    navigate('/image-tools', { state: { imageFile: file, previewUrl: URL.createObjectURL(file) } });
  } else if (action === 'remove-bg') {
    addSlot('bg-remove', { id: crypto.randomUUID(), imageFile: file, previewUrl: URL.createObjectURL(file) });
    navigate('/bg-remover');
  } else if (action === 'upscale') {
    addSlot('ai-upscaler', { id: crypto.randomUUID(), imageFile: file, previewUrl: URL.createObjectURL(file) });
    navigate('/image-upscaler');
  } else if (action === 'extract-frame') {
    navigate('/video-frame-extractor', { state: { videoFile: file } });
  }
}
