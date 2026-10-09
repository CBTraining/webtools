import { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  SparklesIcon, 
  ClockIcon,
  CommandLineIcon
} from '@heroicons/react/24/solid';
import { FEATURE_CATEGORIES, getAllTools, searchTools } from '../config/navigation';

export default function Home({ onOpenSearch }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Load recently used tools from localStorage
  const recentTools = useMemo(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('webtools-recent') || '[]');
      const all = getAllTools();
      return saved.map(path => all.find(t => t.to === path)).filter(Boolean);
    } catch {
      return [];
    }
  }, []);

  // Filter tools by search query and active category
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim() && activeCategory === 'All') {
      return FEATURE_CATEGORIES;
    }

    const matchedTools = searchTools(searchQuery);

    return FEATURE_CATEGORIES.map(cat => {
      if (activeCategory !== 'All' && cat.title !== activeCategory) {
        return null;
      }

      const items = cat.items.filter(item => 
        matchedTools.some(m => m.to === item.to)
      );

      if (items.length === 0) return null;

      return {
        ...cat,
        items
      };
    }).filter(Boolean);
  }, [searchQuery, activeCategory]);

  const totalFilteredCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2.5rem' }}>
      {/* Draggable region for Window Controls Overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'env(titlebar-area-height, 30px)',
        WebkitAppRegion: 'drag',
        zIndex: 999
      }} />

      {/* Hero Header */}
      <div className="page-header" style={{ marginBottom: '0.5rem', borderBottom: 'none', paddingBottom: '0', paddingTop: 'env(titlebar-area-height, 0px)' }}>
        <h1>Welcome to Web<span className="text-gradient">Tools</span></h1>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <span>A suite of fast, offline-capable, private client-side utilities. No servers, no tracking, 100% in-browser.</span>
        
        {/* Quick Launch Hotkey Pill */}
        <button 
          onClick={onOpenSearch} 
          className="btn"
          style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          title="Open Command Palette (Ctrl+K)"
        >
          <CommandLineIcon style={{ width: 14, height: 14, color: 'var(--accent-color)' }} />
          <span>Quick Launcher</span>
          <kbd style={{ background: 'var(--bg-primary)', padding: '0.1rem 0.35rem', borderRadius: 4, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ctrl K</kbd>
        </button>
      </div>

      {/* Live Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'var(--bg-secondary)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', width: 20, height: 20, color: 'var(--accent-color)' }} />
          <input
            type="text"
            className="input-field"
            style={{ width: '100%', paddingLeft: '40px', paddingRight: searchQuery ? '36px' : '12px', fontSize: '0.95rem' }}
            placeholder="Filter tools by name, description, or tags (e.g. crop, gif, 50mb, pdf, upscale, color, timer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 2 }}
              title="Clear Search"
            >
              <XMarkIcon style={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.25rem' }}>Category:</span>
          {['All', ...FEATURE_CATEGORIES.map(c => c.title)].map((category) => {
            const isSelected = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                className={`btn ${isSelected ? 'btn-primary' : ''}`}
                onClick={() => setActiveCategory(category)}
                style={{ 
                  fontSize: '0.78rem', 
                  padding: '0.25rem 0.65rem',
                  background: isSelected ? undefined : 'var(--bg-tertiary)',
                  border: isSelected ? undefined : '1px solid var(--border-color)'
                }}
              >
                {category}
              </button>
            );
          })}

          {(searchQuery || activeCategory !== 'All') && (
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {totalFilteredCount} {totalFilteredCount === 1 ? 'tool' : 'tools'}
            </span>
          )}
        </div>
      </div>

      {/* Recently Used Section (when no active search) */}
      {!searchQuery && activeCategory === 'All' && recentTools.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ClockIcon style={{ width: 20, height: 20, color: 'var(--accent-color)' }} />
            <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>Recently Used</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '1rem' }}>
            {recentTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <NavLink
                  key={`recent-${tool.to}`}
                  to={tool.to}
                  className="glass-panel hover-glow"
                  style={{
                    padding: '0.85rem 1rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-tertiary)'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon style={{ width: 18, height: 18, color: 'var(--accent-color)' }} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tool.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {tool.category}
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtered Tool Categories */}
      {filteredCategories.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <MagnifyingGlassIcon style={{ width: 42, height: 42, margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No tools matched your search</h3>
          <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem' }}>
            No tools matched "{searchQuery}". Try searching for another keyword like "video", "crop", "compress", "svg", or "pdf".
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {filteredCategories.map((cat, idx) => (
            <div key={idx}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {cat.title}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                  ({cat.items.length})
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {cat.items.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <NavLink
                      key={feat.to}
                      to={feat.to}
                      className="glass-panel hover-glow"
                      style={{
                        padding: '1.25rem',
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        borderRadius: 'var(--border-radius-sm)',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          background: 'var(--bg-tertiary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon style={{ width: 22, height: 22, color: 'var(--accent-color)' }} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {feat.title}
                        </h3>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                        {feat.desc}
                      </p>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
