import JSZip from 'jszip';
import { downloadBlob } from './downloadUtils';

function sanitizeZipEntryPath(entryPath) {
  return String(entryPath || '')
    .replace(/\\/g, '/')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F]/g, '')
    .split('/')
    .filter((part) => part && part !== '.' && part !== '..')
    .join('/');
}

/**
 * Packs a list of files or entries into a ZIP archive and triggers browser download.
 * @param {string} zipFilename - e.g. "my-archive.zip"
 * @param {Array<{ name: string, data: Blob|string|Uint8Array }>} files - Array of files to include
 * @param {string} [folderName] - Optional root folder name inside the zip
 * @param {Function} [onProgress] - Optional progress callback (percent: number)
 * @returns {Promise<Blob>}
 */
export async function createAndDownloadZip(zipFilename, files, folderName = '', onProgress = null, downloadOptions = {}) {
  if (!files || files.length === 0) return null;
  const zip = new JSZip();
  const safeFolder = sanitizeZipEntryPath(folderName);
  const target = safeFolder ? zip.folder(safeFolder) : zip;

  for (const file of files) {
    if (file && file.name && file.data) {
      const safeFileName = sanitizeZipEntryPath(file.name);
      if (safeFileName) {
        target.file(safeFileName, file.data);
      }
    }
  }

  const content = await zip.generateAsync(
    { type: 'blob' },
    onProgress ? (meta) => onProgress(meta.percent) : undefined
  );

  // eslint-disable-next-line no-control-regex
  const cleanZipBase = String(zipFilename || 'archive.zip').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  const safeZipName = cleanZipBase.endsWith('.zip') ? cleanZipBase : `${cleanZipBase}.zip`;
  downloadBlob(content, safeZipName, downloadOptions);
  return content;
}
