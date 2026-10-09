import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './pwa'

// Auto-recover from stale dynamic module chunk fetches after new deployments
const recoverFromStaleChunk = async () => {
  const now = Date.now();
  const lastReload = parseInt(sessionStorage.getItem('last_auto_chunk_reload') || '0', 10);
  if (now - lastReload > 30000) {
    sessionStorage.setItem('last_auto_chunk_reload', String(now));
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(() => {})));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k).catch(() => {})));
      }
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(now));
    window.location.href = url.toString();
  }
};

window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, auto-recovering for latest deployment chunks...', event);
  if (event.preventDefault) event.preventDefault();
  recoverFromStaleChunk();
});

window.addEventListener('error', (event) => {
  const msg = (event.message || '').toLowerCase();
  if (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('importing a module script failed')
  ) {
    console.warn('Dynamic import chunk outdated, auto-recovering...', event);
    recoverFromStaleChunk();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary name="Root Application">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
