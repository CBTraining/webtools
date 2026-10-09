/**
 * Utilities for image conversions, canvas rasterization, and file downloads.
 */
import { downloadBlob } from './downloadUtils';
export { downloadBlob };

/**
 * Converts any image blob into a PNG blob via HTML5 canvas.
 * @param {Blob} blob 
 * @returns {Promise<Blob>}
 */
export function convertBlobToPng(blob) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) resolve(pngBlob);
          else resolve(blob);
        }, 'image/png');
      } catch (e) {
        resolve(blob);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

/**
 * Converts an image file to the requested format (e.g. 'png', 'jpeg', 'webp') and triggers a download.
 * @param {File|Blob} file 
 * @param {string} format e.g. 'png', 'jpeg', 'webp'
 * @param {string} [customFileName] 
 * @returns {Promise<void>}
 */
export function convertImageAndDownload(file, format = 'png', customFileName) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            return reject(new Error('Failed to create image blob'));
          }
          const baseName = customFileName 
            ? customFileName.replace(/\.[^/.]+$/, '')
            : (file.name ? file.name.replace(/\.[^/.]+$/, '') : 'converted');
          const finalName = `${baseName}.${format === 'jpeg' ? 'jpg' : format}`;
          downloadBlob(blob, finalName);
          resolve();
        }, mimeType);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(new Error('The file is not a valid or readable image.'));
    };
    img.src = url;
  });
}

