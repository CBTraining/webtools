import { getLocalDateKey } from '../../utils/historyStorage';
import { createAndDownloadZip } from '../../utils/zipUtils';

/**
 * Formats a YYYY-MM-DD key into a friendly header label (e.g., "Today — October 13, 2026")
 */
export function formatDateGroupHeader(dateKey) {
  if (!dateKey) return 'Unknown Date';
  const [year, month, day] = dateKey.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const todayKey = getLocalDateKey(Date.now());
  const yesterdayKey = getLocalDateKey(Date.now() - 86400000);

  const fullFormatted = dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (dateKey === todayKey) return `Today — ${fullFormatted}`;
  if (dateKey === yesterdayKey) return `Yesterday — ${fullFormatted}`;
  return fullFormatted;
}

/**
 * Short label for quick date filter pills (e.g., "Today (Oct 13)" or "Oct 12, 2026")
 */
export function formatShortDatePill(dateKey) {
  if (!dateKey) return 'Unknown';
  const [year, month, day] = dateKey.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const todayKey = getLocalDateKey(Date.now());
  const yesterdayKey = getLocalDateKey(Date.now() - 86400000);

  const shortStr = dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  if (dateKey === todayKey) return `Today (${shortStr})`;
  if (dateKey === yesterdayKey) return `Yesterday (${shortStr})`;
  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatItemDateAndTime(timestamp) {
  const d = new Date(timestamp);
  const dateStr = d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
  return { dateStr, timeStr };
}

/**
 * Exports a list of history items as a date-grouped ZIP archive using the shared zipUtils helper.
 */
export async function exportHistoryItemsAsZip(targetItems, zipName, onProgress) {
  const usedPaths = new Set();
  const entries = [];

  for (const item of targetItems) {
    if (!item.blob) continue;
    const dateFolder = item.dateKey || getLocalDateKey(item.timestamp);
    const rawName = item.filename || `file-${item.id}`;
    let candidatePath = `${dateFolder}/${rawName}`;
    let counter = 1;

    while (usedPaths.has(candidatePath.toLowerCase())) {
      const dotIdx = rawName.lastIndexOf('.');
      if (dotIdx > 0) {
        const base = rawName.slice(0, dotIdx);
        const ext = rawName.slice(dotIdx);
        candidatePath = `${dateFolder}/${base}_${counter}${ext}`;
      } else {
        candidatePath = `${dateFolder}/${rawName}_${counter}`;
      }
      counter++;
    }

    usedPaths.add(candidatePath.toLowerCase());
    entries.push({ name: candidatePath, data: item.blob });
  }

  if (entries.length === 0) return;

  await createAndDownloadZip(
    zipName,
    entries,
    '',
    (pct) => {
      if (onProgress) onProgress(Math.round(pct));
    },
    { skipHistory: true }
  );
}
