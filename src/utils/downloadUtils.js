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

function sanitizeDownloadFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'download';
  // eslint-disable-next-line no-control-regex
  const cleaned = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/^\.+/, '').trim();
  return cleaned.slice(0, 200) || 'download';
}

/**
 * Triggers a browser download for a given URL and filename, and saves to local history if not already saved.
 * @param {string} url 
 * @param {string} filename 
 * @param {object} [options] - Optional metadata ({ categoryLabel, skipHistory, jobId })
 */
export function downloadUrl(url, filename, options = {}) {
  if (!url || typeof url !== 'string') return;
  // eslint-disable-next-line no-control-regex
  const normalizedUrl = url.replace(/[\x00-\x20]+/g, '').toLowerCase();
  if (
    normalizedUrl.startsWith('javascript:') ||
    normalizedUrl.startsWith('vbscript:') ||
    normalizedUrl.startsWith('data:text/html')
  ) {
    return;
  }
  const safeFilename = sanitizeDownloadFilename(filename);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (!options.skipHistory && (url.startsWith('blob:') || url.startsWith('data:'))) {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        saveToHistory(blob, safeFilename, options);
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

