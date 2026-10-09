import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  SunIcon,
  MoonIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { getAllTools, searchTools } from '../config/navigation';
import './CommandPalette.css';

export default function CommandPalette({ isOpen, onClose, onOpen }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const navigate = useNavigate();

  // Load recently visited tools from localStorage
  const recentToolPaths = useMemo(() => {
    try {
      const saved = localStorage.getItem('webtools-recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  const allTools = useMemo(() => getAllTools(), []);

  const recentTools = useMemo(() => {
    return recentToolPaths
      .map(path => allTools.find(t => t.to === path))
      .filter(Boolean);
  }, [recentToolPaths, allTools]);

  // System actions (theme, quick tools, clock)
  const systemActions = useMemo(() => [
    {
      id: 'action-theme',
      title: 'Toggle Theme (Dark / Light)',
      desc: 'Switch between dark and light appearance modes',
      icon: SunIcon,
      type: 'action',
      action: () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
      }
    },
    {
      id: 'action-quick-tools',
      title: 'Toggle Quick Tools Side Panel',
      desc: 'Open or close the Calculator, Alarms, Aspect Ratio, and Scratchpad',
      icon: WrenchScrewdriverIcon,
      type: 'action',
      action: () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
      }
    },
    {
      id: 'action-clock-mode',
      title: 'Fullscreen Clock & Quick Drop Mode',
      desc: 'Enter clean distraction-free clock screen with background drop zone',
      icon: ClockIcon,
      type: 'action',
      action: () => {
        localStorage.setItem('isClockMode', 'true');
        window.location.reload();
      }
    }
  ], []);

  // Filtered results
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return [
        ...recentTools.map(t => ({ ...t, group: 'Recently Used' })),
        ...systemActions.map(a => ({ ...a, group: 'Quick Actions' })),
        ...allTools.map(t => ({ ...t, group: t.category }))
      ];
    }

    const matchedTools = searchTools(query).map(t => ({ ...t, group: 'Tools' }));
    const matchedActions = systemActions.filter(a => 
      a.title.toLowerCase().includes(query.toLowerCase()) || 
      a.desc.toLowerCase().includes(query.toLowerCase())
    ).map(a => ({ ...a, group: 'Quick Actions' }));

    return [...matchedActions, ...matchedTools];
  }, [query, allTools, recentTools, systemActions]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          onOpen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onOpen]);

  // Focus input and reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation within the palette
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedEl = resultsRef.current.querySelector('.command-palette-item.selected');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelectItem = (item) => {
    onClose();
    if (item.type === 'action' && item.action) {
      item.action();
    } else if (item.to) {
      navigate(item.to);
    }
  };

  if (!isOpen) return null;

  let currentGroup = null;

  return (
    <div className="command-palette-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="command-palette-modal animate-pop-in" 
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-palette-header">
          <MagnifyingGlassIcon style={{ width: 22, height: 22, color: 'var(--accent-color)' }} />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Search tools, actions, or type keywords (e.g. crop, 50mb, pdf, svg)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query ? (
            <button 
              onClick={() => setQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}
            >
              <XMarkIcon style={{ width: 18, height: 18 }} />
            </button>
          ) : (
            <span className="command-palette-kbd">ESC to close</span>
          )}
        </div>

        <div className="command-palette-results" ref={resultsRef}>
          {filteredItems.length === 0 ? (
            <div className="command-palette-empty">
              No matching tools or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const showGroupHeader = item.group !== currentGroup;
              if (showGroupHeader) currentGroup = item.group;
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div key={item.id || item.to || idx}>
                  {showGroupHeader && (
                    <div className="command-palette-group-label">
                      {item.group}
                    </div>
                  )}
                  <div
                    className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="command-palette-item-left">
                      <div className="command-palette-item-icon">
                        <Icon style={{ width: 18, height: 18 }} />
                      </div>
                      <div className="command-palette-item-text">
                        <div className="command-palette-item-title">{item.title}</div>
                        <div className="command-palette-item-desc">{item.desc}</div>
                      </div>
                    </div>
                    {item.to ? (
                      <span className="command-palette-item-tag">Open</span>
                    ) : (
                      <ArrowRightIcon style={{ width: 14, height: 14, color: 'var(--text-secondary)' }} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="command-palette-footer">
          <div className="command-palette-kbd-group">
            <span><span className="command-palette-kbd">↑</span> <span className="command-palette-kbd">↓</span> to navigate</span>
            <span><span className="command-palette-kbd">↵</span> to select</span>
          </div>
          <div>WebTools Quick Launcher</div>
        </div>
      </div>
    </div>
  );
}
