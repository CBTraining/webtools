import JSZip from 'jszip';

export const MIME_MAP = {
  gif: 'image/gif',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg'
};

/**
 * Extracts embedded media from PPTX / DOCX / XLSX / ZIP archives using JSZip.
 */
export async function extractZipArchive(file, { onProgress, onStatus }) {
  if (onStatus) onStatus('Opening archive & scanning media files...');
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);
  const extractedList = [];
  let counter = 0;

  const entries = Object.keys(contents.files).filter(path => !contents.files[path].dir);
  const total = entries.length;

  for (let i = 0; i < total; i++) {
    const path = entries[i];
    const entry = contents.files[path];
    if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));

    const fileExt = path.split('.').pop().toLowerCase();
    const isMedia = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'm4a', 'ogg', 'emf', 'wmf'].includes(fileExt);

    // Check if it's inside a media folder or has media extension
    if (isMedia || path.includes('/media/') || path.includes('/embeddings/')) {
      try {
        const blob = await entry.async('blob');
        const mime = MIME_MAP[fileExt] || (fileExt === 'emf' || fileExt === 'wmf' ? 'image/x-emf' : 'application/octet-stream');
        const typedBlob = new Blob([blob], { type: mime });
        const url = URL.createObjectURL(typedBlob);

        let mediaCategory = 'other';
        if (fileExt === 'gif') mediaCategory = 'gif';
        else if (['png'].includes(fileExt)) mediaCategory = 'png';
        else if (['jpg', 'jpeg'].includes(fileExt)) mediaCategory = 'jpg';
        else if (fileExt === 'svg') mediaCategory = 'svg';
        else if (['mp4', 'mov', 'webm'].includes(fileExt)) mediaCategory = 'video';
        else if (['mp3', 'wav', 'm4a', 'ogg'].includes(fileExt)) mediaCategory = 'audio';

        // Try to get dimensions if image
        let width = 0;
        let height = 0;
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(fileExt)) {
          try {
            const dims = await new Promise((res) => {
              const img = new Image();
              img.onload = () => res({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
              img.onerror = () => res({ w: 0, h: 0 });
              img.src = url;
            });
            width = dims.w;
            height = dims.h;
          } catch {
            // Dimension probing is optional; fallback to default dimensions
          }
        }

        const rawName = path.split('/').pop() || `media_${counter + 1}.${fileExt}`;

        extractedList.push({
          id: `item-${counter++}`,
          name: rawName,
          path,
          url,
          blob: typedBlob,
          size: blob.size,
          ext: fileExt,
          category: mediaCategory,
          width,
          height
        });
      } catch (e) {
        console.warn("Could not parse zip entry:", path, e);
      }
    }
  }

  return extractedList;
}

/**
 * Extracts embedded images from PDF files using pdfjs-dist.
 */
export async function extractPdf(file, { onProgress, onStatus }) {
  if (onStatus) onStatus('Loading PDF engine...');
  const pdfjsLib = await import('pdfjs-dist');
  const workerModule = await import('pdfjs-dist/build/pdf.worker.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default || workerModule;

  if (onStatus) onStatus('Parsing PDF document...');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const extractedList = [];
  let globalImgId = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    if (onProgress) onProgress(Math.round(((pageNum - 1) / pdf.numPages) * 100));
    if (onStatus) onStatus(`Extracting images from page ${pageNum} of ${pdf.numPages}...`);
    
    try {
      const page = await pdf.getPage(pageNum);
      const ops = await page.getOperatorList();
      
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (
          ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject || 
          ops.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject
        ) {
          const objId = ops.argsArray[i][0];
          let imgObj = null;
          try {
            imgObj = await new Promise((resolve) => {
               try {
                 const res = page.objs.get(objId, resolve);
                 if (res !== undefined) resolve(res);
               } catch { resolve(null); }
            });
            if (!imgObj) imgObj = page.objs.get(objId);
          } catch(e) {
            console.warn("Failed to get image object", objId, e);
          }

          if (!imgObj) continue;

          const canvas = document.createElement('canvas');
          const width = imgObj.width || 0;
          const height = imgObj.height || 0;
          if (width === 0 || height === 0) continue;
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          let successfullyDrawn = false;

          if (imgObj.bitmap || imgObj instanceof ImageBitmap || imgObj instanceof HTMLImageElement || imgObj instanceof HTMLCanvasElement) {
            ctx.drawImage(imgObj.bitmap || imgObj, 0, 0);
            successfullyDrawn = true;
          } else if (imgObj.data) {
            const data = imgObj.data;
            let imageData = null;
            if (data.length === width * height * 4) {
              imageData = new ImageData(new Uint8ClampedArray(data), width, height);
            } else if (data.length === width * height * 3) {
              const rgba = new Uint8ClampedArray(width * height * 4);
              for (let j = 0, k = 0; j < data.length; j += 3, k += 4) {
                rgba[k] = data[j]; rgba[k+1] = data[j+1]; rgba[k+2] = data[j+2]; rgba[k+3] = 255;
              }
              imageData = new ImageData(rgba, width, height);
            } else if (data.length === width * height) {
              // Grayscale
              const rgba = new Uint8ClampedArray(width * height * 4);
              for (let j = 0, k = 0; j < data.length; j++, k += 4) {
                const val = data[j];
                rgba[k] = val; rgba[k+1] = val; rgba[k+2] = val; rgba[k+3] = 255;
              }
              imageData = new ImageData(rgba, width, height);
            }

            if (imageData) {
              ctx.putImageData(imageData, 0, 0);
              successfullyDrawn = true;
            }
          }

          if (successfullyDrawn) {
            const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
            if (blob) {
              const url = URL.createObjectURL(blob);
              extractedList.push({
                id: `pdf-img-${globalImgId++}`,
                name: `page_${pageNum}_img_${globalImgId}.png`,
                path: `page_${pageNum}`,
                url,
                blob,
                size: blob.size,
                ext: 'png',
                category: 'png',
                width,
                height
              });
            }
          }
        }
      }
    } catch (pageErr) {
      console.warn(`Error on page ${pageNum}:`, pageErr);
    }
  }

  return extractedList;
}
