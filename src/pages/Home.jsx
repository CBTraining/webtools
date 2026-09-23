import { NavLink } from 'react-router-dom';
import { FEATURE_CATEGORIES } from '../config/navigation';

export default function Home() {
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      {/* Draggable region for Window Controls Overlay */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 'env(titlebar-area-height, 30px)',
        WebkitAppRegion: 'drag',
        zIndex: 999
      }} />

      <div className="page-header" style={{ marginBottom: '0.5rem', borderBottom: 'none', paddingBottom: '0', paddingTop: 'env(titlebar-area-height, 0px)' }}>
        <h1>Welcome to WebTools</h1>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        A suite of fast, offline-capable, private client-side utilities. No servers, no tracking, 100% in-browser.
      </div>

      {/* Feature Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {FEATURE_CATEGORIES.map((cat, idx) => (
          <div key={idx}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {cat.title}
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
    </div>
  );
}
