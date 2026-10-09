export function detectDragType(dataTransfer) {
  if (!dataTransfer) return 'unknown';

  const items = dataTransfer.items;
  const types = Array.from(dataTransfer.types || []);
  let detected = 'unknown';

  if (items && items.length > 0) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const type = (item.type || '').toLowerCase();
      
      if (type === 'application/pdf') {
        return 'pdf';
      } else if (
        type.includes('presentation') || 
        type.includes('powerpoint') || 
        type.includes('word') || 
        type.includes('zip') || 
        type.includes('officedocument') || 
        type.includes('opendocument')
      ) {
        return 'doc';
      } else if (type === 'image/svg+xml') {
        return 'svg';
      } else if (type === 'application/json' || type === 'text/json') {
        return 'json';
      } else if (type === 'image/gif') {
        return 'gif';
      } else if (type.startsWith('video/') || type.includes('quicktime')) {
        return 'video';
      } else if (type.startsWith('image/')) {
        return 'image';
      }
    }
  }

  // Fallback for HTML/URI drops (e.g. Google Chat, Slack, Web Images)
  if (detected === 'unknown') {
    if (types.includes('text/html') || types.includes('text/uri-list') || types.includes('image/png') || types.includes('Files')) {
      detected = 'image';
    }
  }

  return detected;
}
