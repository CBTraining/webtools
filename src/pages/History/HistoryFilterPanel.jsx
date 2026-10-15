import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';

export default function HistoryFilterPanel({
  searchQuery,
  setSearchQuery,
  selectedDate,
  setSelectedDate,
  availableDates,
  totalCount
}) {
  return (
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
            All Dates ({totalCount})
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
  );
}
