/**
 * Utility functions for formatting bytes, times, and numbers across WebTools.
 */

export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats seconds into mins:secs.tenths (e.g. 1:04.5)
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats total seconds into countdown/duration format (e.g. 1:05:30 or 05:30)
 */
export function formatDuration(totalSecs) {
  if (isNaN(totalSecs) || totalSecs < 0) return '00:00';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = Math.floor(totalSecs % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats video time into high-precision frame timestamp (e.g. 01:23.45)
 */
export function formatFrameTime(timeInSeconds) {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00.00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const ms = Math.floor((timeInSeconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
