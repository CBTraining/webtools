import JSZip from 'jszip';
import { downloadBlob } from './downloadUtils';

/**
 * Packs a list of files or entries into a ZIP archive and triggers browser download.
 * @param {string} zipFilename - e.g. "my-archive.zip"
 * @param {Array<{ name: string, data: Blob|string|Uint8Array }>} files - Array of files to include
 * @param {string} [folderName] - Optional root folder name inside the zip
 * @param {Function} [onProgress] - Optional progress callback (percent: number)
 * @returns {Promise<Blob>}
 */
export async function createAndDownloadZip(zipFilename, files, folderName = '', onProgress = null) {
  if (!files || files.length === 0) return null;
  const zip = new JSZip();
  const target = folderName ? zip.folder(folderName) : zip;

  for (const file of files) {
    if (file && file.name && file.data) {
      target.file(file.name, file.data);
    }
  }

  const content = await zip.generateAsync(
    { type: 'blob' },
    onProgress ? (meta) => onProgress(meta.percent) : undefined
  );

  const safeZipName = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  downloadBlob(content, safeZipName);
  return content;
}
