/**
 * Triggers a browser download for a Blob object and safely cleans up the Object URL.
 * @param {Blob} blob 
 * @param {string} filename 
 */
export function downloadBlob(blob, filename) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  // Give the browser time to trigger the download before revoking
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers a browser download for a given URL and filename.
 * @param {string} url 
 * @param {string} filename 
 */
export function downloadUrl(url, filename) {
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copies a PNG or image Blob to the system clipboard using the ClipboardItem API.
 * @param {Blob} blob 
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function copyBlobToClipboard(blob) {
  if (!blob || !navigator.clipboard || !window.ClipboardItem) return false;
  try {
    const type = blob.type || 'image/png';
    await navigator.clipboard.write([
      new ClipboardItem({ [type]: blob })
    ]);
    return true;
  } catch (err) {
    console.error("Clipboard blob copy error:", err);
    return false;
  }
}
