import { get, set } from 'idb-keyval';

const HISTORY_KEY = 'webtools-file-history';
const HISTORY_SEEDED_KEY = 'webtools-file-history-seeded-v1';

// Serialize IndexedDB read-modify-write operations to prevent race conditions
let writeQueue = Promise.resolve();

/**
 * Formats a timestamp into a local YYYY-MM-DD date key for grouping and date filtering.
 * @param {number} timestamp 
 * @returns {string}
 */
export function getLocalDateKey(timestamp) {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Infers a descriptive "what it is" label based on explicit metadata, route, filename, and MIME type.
 * @param {string} filename 
 * @param {string} mimeType 
 * @param {object} [options] 
 * @returns {string}
 */
export function inferCategoryLabel(filename = '', mimeType = '', options = {}) {
  if (options.categoryLabel) return options.categoryLabel;

  const lowerName = (filename || '').toLowerCase();
  const hash = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase();

  if (lowerName.startsWith('clipboard_')) {
    return lowerName.endsWith('.gif') ? 'Clipboard GIF' : 'Clipboard Saved as PNG';
  }
  if (lowerName.startsWith('nobg-') || hash.includes('/bg-remover')) {
    return 'Background Removed (PNG)';
  }
  if (lowerName.startsWith('upscaled-') || hash.includes('/image-upscaler')) {
    return 'AI Upscaled Image';
  }
  if (lowerName.includes('_edited.') || hash.includes('/image-tools')) {
    return 'Edited Image';
  }
  if (lowerName.startsWith('compressed-')) {
    return 'Compressed Image (<20MB)';
  }
  if (lowerName.startsWith('compressed_') || hash.includes('/video-compressor')) {
    return 'Compressed Video';
  }
  if (lowerName.startsWith('trimmed-video') || (hash.includes('/video-to-gif') && lowerName.endsWith('.mp4'))) {
    return 'Trimmed Video (MP4)';
  }
  if (hash.includes('/video-to-gif') || lowerName.startsWith('animation-')) {
    return 'Converted GIF';
  }
  if (hash.includes('/lottie-to-gif') || lowerName.startsWith('lottie-')) {
    return lowerName.endsWith('.json') ? 'Saved Lottie JSON' : 'Lottie Converted to GIF';
  }
  if (hash.includes('/svg-converter') || lowerName.startsWith('vector-')) {
    return 'Converted SVG to PNG';
  }
  if (hash.includes('/qr-generator') || lowerName.startsWith('qrcode-')) {
    return 'Generated QR Code';
  }
  if (hash.includes('/collage-maker') || lowerName.startsWith('collage-')) {
    return 'Photo Collage';
  }
  if (hash.includes('/video-frame-extractor') || lowerName.includes('_frame_')) {
    return 'Extracted Video Frame';
  }
  if (hash.includes('/shape-generator') || lowerName.startsWith('generated-shape')) {
    return 'Generated Shape';
  }
  if (hash.includes('/content-extractor')) {
    return 'Extracted Document Media';
  }
  if (hash.includes('/asset-extractor') || lowerName.startsWith('extracted_website_assets')) {
    return 'Extracted Website Asset';
  }
  if (hash.includes('/json-saver') || hash.includes('/wordpad') || hash.includes('/text-studio')) {
    const ext = lowerName.includes('.') ? lowerName.split('.').pop().toUpperCase() : 'TXT';
    return `WordPad Export (.${ext})`;
  }
  if (hash.includes('/component-generator')) {
    return 'Exported UI Component';
  }

  // Fallback by extension / mimeType
  const ext = lowerName.includes('.') ? lowerName.split('.').pop().toUpperCase() : '';
  if (mimeType === 'image/png' || ext === 'PNG') return 'Saved as PNG';
  if (mimeType === 'image/gif' || ext === 'GIF') return 'Saved GIF Animation';
  if (mimeType.startsWith('image/')) return `Converted Image (${ext || 'IMG'})`;
  if (mimeType.startsWith('video/')) return `Processed Video (${ext || 'MP4'})`;
  if (mimeType === 'application/json' || ext === 'JSON') return 'Saved JSON File';
  if (ext === 'BAT' || ext === 'CMD' || ext === 'PS1' || ext === 'SH') return `Saved Script (.${ext})`;
  if (ext === 'TXT' || ext === 'MD' || ext === 'RTF' || ext === 'DOC') return `Saved Document (.${ext})`;
  if (mimeType === 'application/zip' || ext === 'ZIP') return 'Saved ZIP Archive';

  return 'Saved File';
}

/**
 * Infers a short uppercase format badge (e.g., PNG, GIF, MP4, JPG, SVG, JSON).
 */
export function inferFormatBadge(filename = '', mimeType = '') {
  if (filename && filename.includes('.')) {
    const ext = filename.split('.').pop().toUpperCase();
    if (ext && ext.length <= 6) return ext === 'JPEG' ? 'JPG' : ext;
  }
  if (mimeType) {
    const sub = mimeType.split('/')[1] || '';
    if (sub.includes('svg')) return 'SVG';
    if (sub.includes('jpeg')) return 'JPG';
    if (sub.includes('quicktime')) return 'MOV';
    if (sub) return sub.split(';')[0].toUpperCase();
  }
  return 'FILE';
}

function notifyHistoryUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('webtools-history-updated'));
  }
}

/**
 * Saves a Blob or File into the persistent IndexedDB history cache.
 * @param {Blob} blob 
 * @param {string} filename 
 * @param {object} [options] - { categoryLabel, skipHistory, jobId, timestamp }
 * @returns {Promise<object|null>}
 */
export function saveToHistory(blob, filename = 'download', options = {}) {
  if (!blob || !(blob instanceof Blob) || options.skipHistory) {
    return Promise.resolve(null);
  }

  const now = options.timestamp || Date.now();
  const mimeType = blob.type || '';
  const size = blob.size || 0;
  const cleanFilename = filename || `file-${now}`;
  const categoryLabel = inferCategoryLabel(cleanFilename, mimeType, options);
  const formatBadge = inferFormatBadge(cleanFilename, mimeType);
  const dateKey = getLocalDateKey(now);

  const entry = {
    id: `hist-${now}-${Math.random().toString(36).slice(2, 8)}`,
    jobId: options.jobId || null,
    filename: cleanFilename,
    blob,
    mimeType,
    size,
    timestamp: now,
    dateKey,
    categoryLabel,
    formatBadge
  };

  writeQueue = writeQueue.then(async () => {
    try {
      const existing = (await get(HISTORY_KEY)) || [];
      const list = Array.isArray(existing) ? existing : [];

      // Deduplicate if the exact same jobId or identical (filename + size) was saved within the last 60 seconds
      const isDuplicate = list.some(item => {
        if (options.jobId && item.jobId && item.jobId === options.jobId) {
          return true;
        }
        if (
          item.filename === cleanFilename &&
          item.size === size &&
          Math.abs(now - item.timestamp) < 60000
        ) {
          return true;
        }
        return false;
      });

      if (isDuplicate) {
        return null;
      }

      const updated = [entry, ...list];
      await set(HISTORY_KEY, updated);
      notifyHistoryUpdated();
      return entry;
    } catch (err) {
      console.error('Failed to save item to file history:', err);
      return null;
    }
  });

  return writeQueue;
}

/**
 * Loads all history items from IndexedDB, sorted newest first.
 * Also seeds any pre-existing cached files from Image Stash / Workspaces on first run.
 * @returns {Promise<Array>}
 */
export async function getHistoryItems() {
  try {
    await writeQueue;
    let items = (await get(HISTORY_KEY)) || [];
    if (!Array.isArray(items)) items = [];

    // Seed once from existing stash / workspaces if any exist in cache
    const alreadySeeded = localStorage.getItem(HISTORY_SEEDED_KEY);
    if (!alreadySeeded) {
      localStorage.setItem(HISTORY_SEEDED_KEY, 'true');
      let addedAny = false;

      try {
        const stashFiles = await get('webtools-image-stash');
        if (Array.isArray(stashFiles)) {
          for (const file of stashFiles) {
            if (file instanceof Blob) {
              const ts = file.lastModified || Date.now();
              const fname = file.name || `stashed-image-${ts}.png`;
              items.push({
                id: `hist-seed-${ts}-${Math.random().toString(36).slice(2, 8)}`,
                filename: fname,
                blob: file,
                mimeType: file.type || 'image/png',
                size: file.size || 0,
                timestamp: ts,
                dateKey: getLocalDateKey(ts),
                categoryLabel: 'Image Stash',
                formatBadge: inferFormatBadge(fname, file.type)
              });
              addedAny = true;
            }
          }
        }
      } catch {
        // ignore seed error
      }

      if (addedAny) {
        items.sort((a, b) => b.timestamp - a.timestamp);
        await set(HISTORY_KEY, items);
      }
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  } catch (err) {
    console.error('Failed to load file history from IndexedDB:', err);
    return [];
  }
}

/**
 * Deletes a single history item by ID.
 * @param {string} id 
 * @returns {Promise<Array>}
 */
export function deleteHistoryItem(id) {
  writeQueue = writeQueue.then(async () => {
    try {
      const existing = (await get(HISTORY_KEY)) || [];
      const updated = (Array.isArray(existing) ? existing : []).filter(item => item.id !== id);
      await set(HISTORY_KEY, updated);
      notifyHistoryUpdated();
      return updated;
    } catch (err) {
      console.error('Failed to delete history item:', err);
      return [];
    }
  });
  return writeQueue;
}

/**
 * Deletes all history items matching a specific dateKey (YYYY-MM-DD).
 * @param {string} dateKey 
 * @returns {Promise<Array>}
 */
export function deleteHistoryByDate(dateKey) {
  writeQueue = writeQueue.then(async () => {
    try {
      const existing = (await get(HISTORY_KEY)) || [];
      const updated = (Array.isArray(existing) ? existing : []).filter(item => item.dateKey !== dateKey);
      await set(HISTORY_KEY, updated);
      notifyHistoryUpdated();
      return updated;
    } catch (err) {
      console.error('Failed to delete date history:', err);
      return [];
    }
  });
  return writeQueue;
}

/**
 * Clears the entire file history from IndexedDB.
 * @returns {Promise<void>}
 */
export function clearAllHistory() {
  writeQueue = writeQueue.then(async () => {
    try {
      await set(HISTORY_KEY, []);
      notifyHistoryUpdated();
    } catch (err) {
      console.error('Failed to clear file history:', err);
    }
  });
  return writeQueue;
}
