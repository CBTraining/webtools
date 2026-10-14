import { saveToHistory } from './historyStorage';

/**
 * Triggers a browser download for a Blob object, saves it to local file history, and safely cleans up the Object URL.
 * @param {Blob} blob 
 * @param {string} filename 
 * @param {object} [options] - Optional metadata ({ categoryLabel, skipHistory, jobId })
 */
export function downloadBlob(blob, filename, options = {}) {
  if (!blob) return;
  if (!options.skipHistory) {
    saveToHistory(blob, filename, options);
  }
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename, { ...options, skipHistory: true });
  // Give the browser time to trigger the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers a browser download for a given URL and filename, and saves to local history if not already saved.
 * @param {string} url 
 * @param {string} filename 
 * @param {object} [options] - Optional metadata ({ categoryLabel, skipHistory, jobId })
 */
export function downloadUrl(url, filename, options = {}) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (!options.skipHistory && (url.startsWith('blob:') || url.startsWith('data:'))) {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        saveToHistory(blob, filename || 'download', options);
      })
      .catch(() => {
        // Ignore fetch errors if blob URL was already revoked
      });
  }
}

/**
 * Copies a PNG or image Blob to the system clipboard using the ClipboardItem API,
 * and saves it to local file history.
 * @param {Blob} blob 
 * @param {string} [filename]
 * @param {object} [options]
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function copyBlobToClipboard(blob, filename, options = {}) {
  if (!blob || !navigator.clipboard || !window.ClipboardItem) return false;
  try {
    const type = blob.type || 'image/png';
    await navigator.clipboard.write([
      new ClipboardItem({ [type]: blob })
    ]);
    if (!options.skipHistory) {
      const ext = type.split('/')[1] || 'png';
      saveToHistory(blob, filename || `copied-image-${Date.now()}.${ext}`, options);
    }
    return true;
  } catch (err) {
    console.error("Clipboard blob copy error:", err);
    return false;
  }
}

