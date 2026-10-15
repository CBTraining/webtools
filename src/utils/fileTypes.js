import { downloadBlob } from './downloadUtils';
import { loadImageFallback } from './clipboardExtract';

export function isAviFile(file) {
  if (!file) return false;
  const name = file.name || '';
  if (name.toLowerCase().endsWith('.avi')) return true;
  const type = (file.type || '').toLowerCase();
  return type.includes('avi') || type.includes('msvideo');
}

export function isVideoFile(file) {
  if (!file) return false;
  if (file.type && (file.type.startsWith('video/') || file.type.includes('quicktime') || file.type.includes('avi') || file.type.includes('msvideo'))) return true;
  const name = file.name || '';
  const ext = name.split('.').pop().toLowerCase();
  return ['mov', 'mp4', 'webm', 'mkv', 'avi', 'ogv', '3gp', 'm4v', 'flv', 'quicktime'].includes(ext);
}

export function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  const name = file.name || '';
  const ext = name.split('.').pop().toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico', 'avif', 'heic', 'tiff'].includes(ext);
}

/**
 * Checks magic bytes for GIF (GIF87a or GIF89a) or MIME type.
 * @param {Blob} blob
 * @returns {Promise<boolean>}
 */
export async function isGifBlob(blob) {
  if (!blob) return false;
  if (blob.type === 'image/gif') return true;
  if (blob.size >= 6) {
    try {
      const buffer = await blob.slice(0, 6).arrayBuffer();
      const header = new TextDecoder().decode(buffer);
      if (header.startsWith('GIF8')) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export function getOriginalGoogleAssetUrl(url) {
  if (!url) return url;
  if (/googleusercontent\.com/i.test(url)) {
    if (/=[swh]\d+/i.test(url)) {
      return url.replace(/=[swh]\d+.*$/i, '=s0');
    }
    if (!url.includes('=')) {
      return `${url}=s0`;
    }
  }
  return url;
}

async function readEntryFiles(entry) {
  if (!entry) return [];
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file((file) => resolve([file]), () => resolve([]));
    });
  }
  if (entry.isDirectory) {
    const dirReader = entry.createReader();
    const entries = await new Promise((resolve) => {
      const allEntries = [];
      const readBatch = () => {
        dirReader.readEntries((batch) => {
          if (!batch || batch.length === 0) {
            resolve(allEntries);
          } else {
            allEntries.push(...batch);
            readBatch();
          }
        }, () => resolve(allEntries));
      };
      readBatch();
    });
    const nested = await Promise.all(entries.map(readEntryFiles));
    return nested.flat();
  }
  return [];
}

export async function extractDroppedFiles(e) {
  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    const entries = [];
    let hasDirectory = false;
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const item = e.dataTransfer.items[i];
      if (item.kind === 'file' && typeof item.webkitGetAsEntry === 'function') {
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isDirectory) hasDirectory = true;
          entries.push(entry);
        }
      }
    }
    if (hasDirectory && entries.length > 0) {
      const nested = await Promise.all(entries.map(readEntryFiles));
      const extracted = nested.flat();
      if (extracted.length > 0) return extracted;
    }
  }

  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    return Array.from(e.dataTransfer.files);
  }

  // Handle Google Chat / Slack / Google Slides / Browser Tab Image Drag & Drop
  const html = e.dataTransfer.getData('text/html');
  let src = '';
  if (html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const img = doc.querySelector('img');
    if (img && img.src) src = img.src;
  }
  if (!src) {
    src = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
  }

  if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('blob:'))) {
    const targetUrl = getOriginalGoogleAssetUrl(src);
    try {
      const resp = await fetch(targetUrl);
      if (!resp.ok) throw new Error("Fetch failed");
      const blob = await resp.blob();
      
      // Check magic bytes for GIF
      const isGif = await isGifBlob(blob);

      const ext = isGif ? 'gif' : (blob.type.split('/')[1] || 'png');
      const filename = `image-${Date.now()}.${ext}`;
      return [new File([blob], filename, { type: isGif ? 'image/gif' : (blob.type || 'image/png') })];
    } catch {
      // Fallback via Image object to handle CORS images
      try {
        const b = await loadImageFallback(src);
        if (b) {
          return [new File([b], `image-${Date.now()}.png`, { type: 'image/png' })];
        }
      } catch {
        // Ignore fallback failure
      }
    }
  }

  return [];
}

export async function compressImageUnder20MB(file) {
  const MAX_BYTES = 20 * 1024 * 1024; // 20MB limit

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // 1. Try lossless PNG first (preserves transparency and pixel perfection)
      const pngCanvas = document.createElement('canvas');
      pngCanvas.width = width;
      pngCanvas.height = height;
      const pngCtx = pngCanvas.getContext('2d');
      pngCtx.drawImage(img, 0, 0, width, height);

      const getBlob = (canvas, type, quality) => {
        return new Promise((res) => {
          canvas.toBlob((b) => res(b), type, quality);
        });
      };

      const pngBlob = await getBlob(pngCanvas, 'image/png');
      const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : 'image';

      if (pngBlob && pngBlob.size <= MAX_BYTES) {
        const downloadName = `compressed-${baseName}.png`;
        downloadBlob(pngBlob, downloadName);

        resolve({
          format: 'PNG',
          sizeMB: (pngBlob.size / (1024 * 1024)).toFixed(2),
          originalSizeMB: (file.size / (1024 * 1024)).toFixed(2),
          width,
          height,
          downloadName
        });
        return;
      }

      // 2. PNG exceeds 20MB. Compress to JPEG to fit under 20MB while preserving 100% resolution!
      const jpegCanvas = document.createElement('canvas');
      jpegCanvas.width = width;
      jpegCanvas.height = height;
      const jCtx = jpegCanvas.getContext('2d');
      // Fill with white background to cleanly handle any transparent alpha channels
      jCtx.fillStyle = '#ffffff';
      jCtx.fillRect(0, 0, width, height);
      jCtx.drawImage(img, 0, 0, width, height);

      const qualitySteps = [0.96, 0.92, 0.88, 0.84, 0.80, 0.75, 0.70, 0.60, 0.50, 0.40, 0.30];
      let bestBlob = null;

      for (const q of qualitySteps) {
        const b = await getBlob(jpegCanvas, 'image/jpeg', q);
        if (b && b.size <= MAX_BYTES) {
          bestBlob = b;
          break;
        }
      }

      if (!bestBlob) {
        bestBlob = await getBlob(jpegCanvas, 'image/jpeg', 0.25);
      }

      if (bestBlob) {
        const downloadName = `compressed-${baseName}.jpg`;
        downloadBlob(bestBlob, downloadName);

        resolve({
          format: 'JPEG',
          sizeMB: (bestBlob.size / (1024 * 1024)).toFixed(2),
          originalSizeMB: (file.size / (1024 * 1024)).toFixed(2),
          width,
          height,
          downloadName
        });
      } else {
        reject(new Error("Unable to compress image below 20MB"));
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
