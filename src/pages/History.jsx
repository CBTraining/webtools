import { useState, useEffect, useMemo } from 'react';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArchiveBoxArrowDownIcon,
  TrashIcon,
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
import {
  formatDateGroupHeader,
  formatShortDatePill,
  formatItemDateAndTime,
  exportHistoryItemsAsZip
} from './History/historyUtils';
import HistoryFilterPanel from './History/HistoryFilterPanel';
import HistoryItemCard from './History/HistoryItemCard';

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
      const defaultZipName = selectedDate
        ? `webtools-history-${selectedDate}.zip`
        : `webtools-history-${getLocalDateKey(Date.now())}.zip`;

      await exportHistoryItemsAsZip(targetItems, customZipName || defaultZipName, setZipProgress);
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
      {/* Standard Page Header */}
      <div className="page-header" style={{ marginBottom: '0.5rem' }}>
        <ClockIcon style={{ width: 32, height: 32, fill: 'url(#accent-grad)' }} />
        <h1>History</h1>
      </div>

      {/* Subtitle & Global Action Buttons Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Every image edited, saved as PNG, converted, compressed, or extracted is cached locally in your browser.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {items.length > 0 && (
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              <strong style={{ color: 'var(--text-primary)' }}>{items.length}</strong>{' '}
              {items.length === 1 ? 'item' : 'items'} •{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(totalStorageBytes)}</strong>
            </span>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (filteredItems.length > 0 && !isZipping) {
                handleSaveAsZip(filteredItems);
              }
            }}
            style={{
              padding: '0.6rem 1.15rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: '#ffffff'
            }}
            title="Download history items as a ZIP archive grouped by date"
          >
            <ArchiveBoxArrowDownIcon style={{ width: 18, height: 18, color: '#ffffff', fill: 'currentColor' }} />
            <span>
              {isZipping
                ? `Zipping (${zipProgress}%)...`
                : selectedDate || searchQuery
                ? `Save Filtered as ZIP (${filteredItems.length})`
                : 'Save History as ZIP'}
            </span>
          </button>

          {!confirmClearAll ? (
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (items.length > 0) {
                  setConfirmClearAll(true);
                }
              }}
              style={{
                padding: '0.6rem 1.15rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
              title="Clear all cached history files"
            >
              <TrashIcon style={{ width: 18, height: 18, color: 'var(--accent-color)', fill: 'currentColor' }} />
              <span>Delete History</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--danger-color)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              <ExclamationTriangleIcon style={{ width: 18, height: 18, color: 'var(--danger-color)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Delete all {items.length} files?
              </span>
              <button
                type="button"
                className="btn"
                onClick={handleDeleteAll}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.82rem',
                  background: 'var(--danger-color)',
                  color: '#ffffff',
                  fontWeight: 600
                }}
              >
                Confirm Delete
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setConfirmClearAll(false)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.82rem',
                  border: '1px solid var(--border-color)'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search & Date Filter Panel */}
      <HistoryFilterPanel
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        availableDates={availableDates}
        totalCount={items.length}
      />

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
                {group.items.map((item) => (
                  <HistoryItemCard
                    key={item.id}
                    item={item}
                    copiedId={copiedId}
                    onDownload={handleDownloadSingle}
                    onCopy={handleCopySingle}
                    onDelete={handleDeleteSingle}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
