import { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArchiveBoxArrowDownIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import {
  getHistoryItems,
  deleteHistoryItem,
  deleteHistoryByDate,
  clearAllHistory,
  getLocalDateKey
} from '../utils/historyStorage';
import { downloadBlob, copyBlobToClipboard } from '../utils/downloadUtils';
import { formatBytes } from '../utils/formatters';
import SendToDropdown from '../components/SendToDropdown';

/**
 * Formats a YYYY-MM-DD key into a friendly header label (e.g., "Today — October 13, 2026")
 */
function formatDateGroupHeader(dateKey) {
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
function formatShortDatePill(dateKey) {
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

function formatItemDateAndTime(timestamp) {
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

export default function History() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD or ''
  const [copiedId, setCopiedId] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Manage object URLs for item previews cleanly
  useEffect(() => {
    let activeUrls = [];
    let isMounted = true;

    const loadHistory = async () => {
      const rawItems = await getHistoryItems();
      if (!isMounted) return;

      // Revoke previous object URLs
      activeUrls.forEach(u => URL.revokeObjectURL(u));
      activeUrls = [];

      const hydrated = rawItems.map(item => {
        let previewUrl = null;
        if (item.blob instanceof Blob) {
          previewUrl = URL.createObjectURL(item.blob);
          activeUrls.push(previewUrl);
        }
        return {
          ...item,
          previewUrl
        };
      });

      setItems(hydrated);
      setIsLoading(false);
    };

    loadHistory();

    const handleHistoryUpdate = () => {
      loadHistory();
    };
    window.addEventListener('webtools-history-updated', handleHistoryUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('webtools-history-updated', handleHistoryUpdate);
      activeUrls.forEach(u => URL.revokeObjectURL(u));
    };
  }, []);

  // Available unique dates in history (for quick filter pills)
  const availableDates = useMemo(() => {
    const counts = new Map();
    for (const item of items) {
      const key = item.dateKey || getLocalDateKey(item.timestamp);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([dateKey, count]) => ({
      dateKey,
      count,
      label: formatShortDatePill(dateKey)
    }));
  }, [items]);

  // Filter items by selected date and search query (matches date, time, filename, or category)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const itemDateKey = item.dateKey || getLocalDateKey(item.timestamp);
      if (selectedDate && itemDateKey !== selectedDate) {
        return false;
      }

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const { dateStr, timeStr } = formatItemDateAndTime(item.timestamp);
      const headerStr = formatDateGroupHeader(itemDateKey);

      const matchesName = (item.filename || '').toLowerCase().includes(q);
      const matchesCategory = (item.categoryLabel || '').toLowerCase().includes(q);
      const matchesFormat = (item.formatBadge || '').toLowerCase().includes(q);
      const matchesDateKey = itemDateKey.toLowerCase().includes(q);
      const matchesDateText = dateStr.toLowerCase().includes(q) || headerStr.toLowerCase().includes(q);
      const matchesTime = timeStr.toLowerCase().includes(q);

      return (
        matchesName ||
        matchesCategory ||
        matchesFormat ||
        matchesDateKey ||
        matchesDateText ||
        matchesTime
      );
    });
  }, [items, selectedDate, searchQuery]);

  // Group filtered items by dateKey (preserving newest-first order)
  const groupedByDate = useMemo(() => {
    const groups = [];
    const groupMap = new Map();

    for (const item of filteredItems) {
      const key = item.dateKey || getLocalDateKey(item.timestamp);
      if (!groupMap.has(key)) {
        const group = {
          dateKey: key,
          headerLabel: formatDateGroupHeader(key),
          items: [],
          totalBytes: 0
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      const g = groupMap.get(key);
      g.items.push(item);
      g.totalBytes += item.size || 0;
    }

    return groups;
  }, [filteredItems]);

  const totalStorageBytes = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.size || 0), 0);
  }, [items]);

  // Export target list of items as a ZIP archive (organized by date folder)
  const handleSaveAsZip = async (targetItems = filteredItems, customZipName = null) => {
    if (!targetItems || targetItems.length === 0 || isZipping) return;
    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      const usedPaths = new Set();

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
        zip.file(candidatePath, item.blob);
      }

      const zipBlob = await zip.generateAsync(
        { type: 'blob' },
        (meta) => setZipProgress(Math.round(meta.percent))
      );

      const defaultZipName = selectedDate
        ? `webtools-history-${selectedDate}.zip`
        : `webtools-history-${getLocalDateKey(Date.now())}.zip`;

      downloadBlob(zipBlob, customZipName || defaultZipName, { skipHistory: true });
    } catch (err) {
      console.error('Failed to generate history ZIP:', err);
      alert('Failed to build ZIP archive: ' + err.message);
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  const handleDownloadSingle = (item) => {
    if (!item.blob) return;
    downloadBlob(item.blob, item.filename || 'download', { skipHistory: true });
  };

  const handleCopySingle = async (item) => {
    if (!item.blob) return;
    const ok = await copyBlobToClipboard(item.blob, item.filename, { skipHistory: true });
    if (ok) {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDeleteSingle = async (id) => {
    await deleteHistoryItem(id);
  };

  const handleDeleteAll = async () => {
    await clearAllHistory();
    setConfirmClearAll(false);
    setSelectedDate('');
    setSearchQuery('');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header & Top Action Bar */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ClockIcon style={{ width: 32, height: 32, fill: 'url(#accent-grad)' }} />
          <div>
            <h1 style={{ margin: 0 }}>History</h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Every image edited, saved as PNG, converted, compressed, or extracted is cached locally in your browser.
            </p>
          </div>
        </div>

        {/* Global History Actions: Save as ZIP & Delete History */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {items.length > 0 && (
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              <strong>{items.length}</strong> {items.length === 1 ? 'item' : 'items'} •{' '}
              <strong>{formatBytes(totalStorageBytes)}</strong> cached
            </span>
          )}

          <button
            type="button"
            className="btn btn-primary"
            disabled={filteredItems.length === 0 || isZipping}
            onClick={() => handleSaveAsZip(filteredItems)}
            style={{
              padding: '0.55rem 1rem',
              fontSize: '0.85rem',
              opacity: filteredItems.length === 0 ? 0.5 : 1
            }}
            title="Download history items as a ZIP archive grouped by date"
          >
            <ArchiveBoxArrowDownIcon style={{ width: 18, height: 18 }} />
            {isZipping
              ? `Zipping (${zipProgress}%)...`
              : selectedDate || searchQuery
              ? `Save Filtered as ZIP (${filteredItems.length})`
              : 'Save History as ZIP'}
          </button>

          {!confirmClearAll ? (
            <button
              type="button"
              className="btn"
              disabled={items.length === 0}
              onClick={() => setConfirmClearAll(true)}
              style={{
                padding: '0.55rem 0.9rem',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 77, 79, 0.4)',
                color: 'var(--danger-color)',
                background: 'rgba(255, 77, 79, 0.08)',
                opacity: items.length === 0 ? 0.45 : 1
              }}
              title="Clear all cached history files"
            >
              <TrashIcon style={{ width: 17, height: 17 }} />
              Delete History
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 77, 79, 0.12)',
                border: '1px solid var(--danger-color)',
                padding: '0.3rem 0.5rem',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              <ExclamationTriangleIcon style={{ width: 16, height: 16, color: 'var(--danger-color)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Delete all {items.length} files?
              </span>
              <button
                type="button"
                className="btn"
                onClick={handleDeleteAll}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.78rem',
                  background: 'var(--danger-color)',
                  color: '#fff',
                  fontWeight: 600
                }}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmClearAll(false)}
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Date Filter Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          background: 'var(--bg-secondary)'
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Text & Date Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
            <MagnifyingGlassIcon
              style={{ position: 'absolute', left: '12px', width: 18, height: 18, color: 'var(--accent-color)' }}
            />
            <input
              type="text"
              className="input-field"
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: searchQuery ? '34px' : '12px',
                fontSize: '0.9rem'
              }}
              placeholder="Search by date (e.g. Oct 13, 2026-10-13, Today), file name, or type (PNG, GIF, Edited, Upscaled)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 2
                }}
                title="Clear Search"
              >
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>

          {/* Exact Calendar Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.35rem 0.65rem'
              }}
            >
              <CalendarDaysIcon style={{ width: 17, height: 17, color: 'var(--accent-color)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2
                  }}
                  title="Clear Date Filter"
                >
                  <XMarkIcon style={{ width: 15, height: 15 }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Date Filter Pills */}
        {availableDates.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginRight: '0.2rem' }}>
              Jump to Date:
            </span>
            <button
              type="button"
              className={`btn ${selectedDate === '' ? 'btn-primary' : ''}`}
              onClick={() => setSelectedDate('')}
              style={{
                fontSize: '0.76rem',
                padding: '0.22rem 0.6rem',
                background: selectedDate === '' ? undefined : 'var(--bg-tertiary)',
                border: selectedDate === '' ? undefined : '1px solid var(--border-color)'
              }}
            >
              All Dates ({items.length})
            </button>
            {availableDates.map((d) => {
              const isSelected = selectedDate === d.dateKey;
              return (
                <button
                  key={d.dateKey}
                  type="button"
                  className={`btn ${isSelected ? 'btn-primary' : ''}`}
                  onClick={() => setSelectedDate(isSelected ? '' : d.dateKey)}
                  style={{
                    fontSize: '0.76rem',
                    padding: '0.22rem 0.6rem',
                    background: isSelected ? undefined : 'var(--bg-tertiary)',
                    border: isSelected ? undefined : '1px solid var(--border-color)'
                  }}
                >
                  {d.label} ({d.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading cached history...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <ClockIcon style={{ width: 48, height: 48, margin: '0 auto 0.75rem auto', opacity: 0.45 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No files in history yet</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '520px', marginInline: 'auto' }}>
            Whenever you paste and save an image as PNG, edit a photo, remove a background, upscale an image, or convert a video/GIF, it will automatically appear here grouped by date.
          </p>
        </div>
      ) : groupedByDate.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <MagnifyingGlassIcon style={{ width: 42, height: 42, margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No history items matched your filter</h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
            Try clearing the date filter or searching for another date or file type.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setSelectedDate('');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {groupedByDate.map((group) => (
            <section key={group.dateKey}>
              {/* Date Group Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <CalendarDaysIcon style={{ width: 20, height: 20, color: 'var(--accent-color)' }} />
                  <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>
                    {group.headerLabel}
                  </h2>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-tertiary)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {group.dateKey} • {group.items.length} {group.items.length === 1 ? 'item' : 'items'} (
                    {formatBytes(group.totalBytes)})
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      handleSaveAsZip(group.items, `webtools-history-${group.dateKey}.zip`)
                    }
                    disabled={isZipping}
                    style={{
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.75rem',
                      border: '1px solid var(--border-color)'
                    }}
                    title={`Download all items from ${group.dateKey} as ZIP`}
                  >
                    <ArchiveBoxArrowDownIcon style={{ width: 14, height: 14 }} />
                    Save Date as ZIP
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => deleteHistoryByDate(group.dateKey)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                    title={`Remove all items from ${group.dateKey}`}
                  >
                    <TrashIcon style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>

              {/* Grid of Cards for this Date */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
                  gap: '1.15rem'
                }}
              >
                {group.items.map((item) => {
                  const { dateStr, timeStr } = formatItemDateAndTime(item.timestamp);
                  const isImage =
                    (item.mimeType && item.mimeType.startsWith('image/')) ||
                    ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'BMP', 'AVIF'].includes(item.formatBadge);
                  const isVideo =
                    (item.mimeType && item.mimeType.startsWith('video/')) ||
                    ['MP4', 'MOV', 'WEBM', 'AVI'].includes(item.formatBadge);
                  const isSvg =
                    item.mimeType === 'image/svg+xml' || item.formatBadge === 'SVG';

                  const fileObject =
                    item.blob instanceof File
                      ? item.blob
                      : item.blob instanceof Blob
                      ? new File([item.blob], item.filename || 'file', {
                          type: item.mimeType || item.blob.type
                        })
                      : null;

                  return (
                    <div
                      key={item.id}
                      className="glass-panel"
                      style={{
                        padding: '0.9rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {/* Thumbnail / Media Preview */}
                      <div
                        style={{
                          position: 'relative',
                          height: '165px',
                          borderRadius: 'var(--border-radius-sm)',
                          overflow: 'hidden',
                          background: isImage
                            ? 'repeating-conic-gradient(rgba(128,128,128,0.12) 0% 25%, transparent 0% 50%) 50% / 16px 16px, var(--bg-tertiary)'
                            : 'var(--bg-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {isImage && item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.filename}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                        ) : isVideo && item.previewUrl ? (
                          <video
                            src={item.previewUrl}
                            controls
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              background: '#000'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.4rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            {isVideo ? (
                              <FilmIcon style={{ width: 40, height: 40, color: 'var(--accent-color)' }} />
                            ) : isImage ? (
                              <PhotoIcon style={{ width: 40, height: 40, color: 'var(--accent-color)' }} />
                            ) : (
                              <DocumentTextIcon style={{ width: 40, height: 40, color: 'var(--accent-color)' }} />
                            )}
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {item.formatBadge || 'FILE'}
                            </span>
                          </div>
                        )}

                        {/* Format Badge Pill in Top-Left */}
                        <span
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(10, 10, 10, 0.78)',
                            color: 'var(--accent-color)',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(64, 224, 208, 0.35)',
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          {item.formatBadge || 'FILE'}
                        </span>

                        {/* Delete Single Item Button in Top-Right */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(item.id)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(10, 10, 10, 0.72)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '26px',
                            height: '26px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          title="Delete this item from history"
                        >
                          <TrashIcon style={{ width: 13, height: 13 }} />
                        </button>
                      </div>

                      {/* Item Info: What it is, Filename, Date & Time */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--accent-color)',
                              background: 'var(--accent-transparent)',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            title={item.categoryLabel}
                          >
                            {item.categoryLabel || 'Saved File'}
                          </span>
                          <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                            {formatBytes(item.size || 0)}
                          </span>
                        </div>

                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={item.filename}
                        >
                          {item.filename}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.1rem'
                          }}
                        >
                          <span>{dateStr}</span>
                          <span style={{ fontWeight: 500 }}>{timeStr}</span>
                        </div>
                      </div>

                      {/* Item Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleDownloadSingle(item)}
                          style={{
                            flex: 1,
                            padding: '0.4rem 0.65rem',
                            fontSize: '0.8rem',
                            justifyContent: 'center'
                          }}
                          title={`Download ${item.filename}`}
                        >
                          <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
                          Download
                        </button>

                        {isImage && !isSvg && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => handleCopySingle(item)}
                            style={{
                              padding: '0.4rem 0.6rem',
                              fontSize: '0.8rem',
                              border: '1px solid var(--border-color)'
                            }}
                            title="Copy image to clipboard"
                          >
                            {copiedId === item.id ? (
                              <ClipboardDocumentCheckIcon style={{ width: 15, height: 15, color: 'var(--success-color)' }} />
                            ) : (
                              <ClipboardDocumentIcon style={{ width: 15, height: 15 }} />
                            )}
                          </button>
                        )}

                        {(isImage || isVideo) && fileObject && (
                          <SendToDropdown
                            file={fileObject}
                            imageUrl={isImage ? item.previewUrl : undefined}
                            videoFile={isVideo ? fileObject : undefined}
                            mediaType={isVideo ? 'video' : isSvg ? 'svg' : 'image'}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
