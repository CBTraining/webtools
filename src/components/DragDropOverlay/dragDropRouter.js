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
    files.forEach(f => {
      addSlot('video-to-gif', {
        id: crypto.randomUUID(),
        videoFile: f,
        previewUrl: URL.createObjectURL(f),
        quality: 100,
        targetSizeLimit: '50',
        enableSpatialCrop: false
      });
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
      for (const f of files) {
        const text = await f.text();
        try {
          const json = JSON.parse(text);
          const slotId = `lottie-to-gif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          addSlot('lottie-to-gif', {
            id: slotId,
            lottieData: json,
            fileName: f.name
          });
        } catch (err) {
          alert("Invalid JSON file: " + err.message);
        }
      }
      navigate('/lottie-to-gif');
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
      files.filter(f => isVideoFile(f) || f.name.endsWith('.gif')).forEach(f => {
        addSlot('video-to-gif', { id: crypto.randomUUID(), videoFile: f, previewUrl: URL.createObjectURL(f), targetSizeLimit: '50' });
      });
      navigate('/video-to-gif');
    } else if (action === 'compress-video') {
      files.filter(isVideoFile).forEach(f => {
        addSlot('video-compress', {
          id: crypto.randomUUID(),
          videoFile: f,
          previewUrl: URL.createObjectURL(f),
          originalFps: null,
          isProbing: false,
          quality: 50,
          preset: 'fast',
          fps: 'original'
        });
      });
      navigate('/video-compressor');
    } else if (action === 'extract-frame') {
      navigate('/video-frame-extractor', { state: { videoFile: file } });
    }
    return;
  }

  // Default: Image Actions
  const imgFiles = files.filter(f => isImageFile(f) || f.type.startsWith('image/'));
  const targetImages = imgFiles.length > 0 ? imgFiles : [file];

  if (action === 'compress-image') {
    for (const img of targetImages) {
      if (onCompressImage) {
        await onCompressImage(img);
      } else {
        await compressImageUnder20MB(img);
      }
    }
  } else if (action === 'download-png') {
    for (const img of targetImages) {
      await onDirectDownload(img, 'png');
    }
  } else if (action === 'rename-png') {
    onDropImageToModal(file);
  } else if (action === 'edit-image') {
    navigate('/image-tools', { state: { imageFile: file, previewUrl: URL.createObjectURL(file) } });
  } else if (action === 'remove-bg') {
    targetImages.forEach(img => {
      addSlot('bg-remove', { id: crypto.randomUUID(), imageFile: img, previewUrl: URL.createObjectURL(img) });
    });
    navigate('/bg-remover');
  } else if (action === 'upscale') {
    targetImages.forEach(img => {
      addSlot('ai-upscaler', { id: crypto.randomUUID(), imageFile: img, previewUrl: URL.createObjectURL(img), modelKey: 'realworld', targetScale: 2 });
    });
    navigate('/image-upscaler');
  } else if (action === 'extract-frame') {
    navigate('/video-frame-extractor', { state: { videoFile: file } });
  }
}
