import { NavLink } from 'react-router-dom';
import { 
  SunIcon, 
  MoonIcon, 
  HomeIcon, 
  ChartBarIcon, 
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import { 
  ChevronDownIcon as ChevronDownOutline 
} from '@heroicons/react/24/outline';
import BackgroundJobsWidget from './BackgroundJobsWidget';
import SidebarClock from './SidebarClock';
import { useState, useEffect, useRef } from 'react';
import { FEATURE_CATEGORIES } from '../config/navigation';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose, onOpenSearch, onManualPaste, onClockClick, showDiagnostics, onToggleDiagnostics }) {
  const [isShaking, setIsShaking] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const navRef = useRef(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const checkScroll = () => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      // Show arrow if we can scroll down (allow 2px margin for rounding errors)
      setCanScrollDown(Math.ceil(scrollTop + clientHeight) < scrollHeight - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  useEffect(() => {
    const handleError = () => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    };
    window.addEventListener('paste-error', handleError);
    return () => window.removeEventListener('paste-error', handleError);
  }, []);

  return (
    <>
      {isOpen && (
        <div 
          className="sidebar-overlay animate-fade-in" 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 999,
            display: window.innerWidth <= 768 ? 'block' : 'none'
          }}
        />
      )}
      <aside className={`sidebar glass-panel ${isOpen ? 'open' : ''}`}>
        {/* Tactile Grab Handle for Mobile App Drawer */}
        <div className="mobile-drawer-handle" onClick={onClose} />

        <div className="sidebar-header">
          <div className="logo-container" style={{ alignItems: 'center' }}>
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="WebTools Logo" width="28" height="28" style={{ marginLeft: '6px', marginRight: '-2px' }} />
            <h2>Web<span className="text-gradient">Tools</span></h2>
            <span className="version">v3.26</span>
          </div>

          <button 
            type="button" 
            className="mobile-drawer-close-btn"
            onClick={onClose}
            title="Close App Drawer"
          >
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>
        
        <SidebarClock onClick={onClockClick} />

        <div style={{ padding: '0 0.25rem' }}>
          <button 
            type="button"
            className="sidebar-search-btn"
            onClick={() => {
              if (onClose) onClose();
              if (onOpenSearch) onOpenSearch();
            }}
            title="Quick Search Tools (Ctrl+K)"
          >
            <div className="sidebar-search-btn-left">
              <MagnifyingGlassIcon style={{ width: 16, height: 16, color: 'var(--accent-color)' }} />
              <span>Search tools...</span>
            </div>
            <kbd className="sidebar-search-kbd">Ctrl K</kbd>
          </button>
        </div>

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <nav className="sidebar-nav" ref={navRef} onScroll={checkScroll}>
            {FEATURE_CATEGORIES.map((category, idx) => (
              <div key={idx} className="nav-category">
                {category.title !== 'General' && (
                  <h4 className="nav-category-title">{category.title}</h4>
                )}
                <div className="nav-items-grid">
                  {category.items.map((item) => (
                    <NavLink 
                      key={item.to} 
                      to={item.to} 
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <div className="nav-icon-box">
                        <item.icon className="nav-icon" />
                      </div>
                      <span className="nav-label">{item.title || item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          {canScrollDown && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40px',
              background: 'linear-gradient(to top, var(--bg-secondary) 20%, transparent 100%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              pointerEvents: 'none',
              paddingBottom: '8px',
              zIndex: 10
            }}>
              <ChevronDownOutline style={{ width: 24, height: 24, color: 'var(--accent-color)', animation: 'bounce 1.5s infinite', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} strokeWidth={4} />
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-buttons">
            <NavLink 
              to="/"
              className="btn"
              style={{ padding: '0.25rem 0.5rem', flexShrink: 0, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Home"
              onClick={onClose}
            >
              <HomeIcon style={{ width: 20, height: 20 }} />
            </NavLink>
            <button 
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="btn"
              style={{ padding: '0.25rem 0.5rem', flexShrink: 0, border: '1px solid var(--border-color)' }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <SunIcon style={{ width: 20, height: 20 }} /> : <MoonIcon style={{ width: 20, height: 20 }} />}
            </button>
            <button 
              onClick={onToggleDiagnostics}
              className={`btn ${showDiagnostics ? 'btn-primary' : ''}`}
              style={{ padding: '0.25rem 0.5rem', flexShrink: 0, border: '1px solid var(--border-color)' }}
              title="Toggle Diagnostics Overlay"
            >
              <ChartBarIcon style={{ width: 20, height: 20 }} />
            </button>
            <button 
              onClick={onManualPaste}
              className={`btn ${isShaking ? 'shake-error' : ''}`}
              style={{ padding: '0.25rem 0.5rem', flexShrink: 0, border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Click to paste your clipboard and convert to PNG"
            >
              <ClipboardDocumentIcon style={{ width: 20, height: 20 }} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
