import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
    const isChunkOrPwaError = 
      errorMessage.includes('dynamically imported module') ||
      errorMessage.includes('loading chunk') ||
      errorMessage.includes('importing a module script failed') ||
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('chunkloaderror');

    if (isChunkOrPwaError) {
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem('last_auto_chunk_reload') || '0', 10);
      // Auto-recover once within 30 seconds to fetch fresh deployment chunks
      if (now - lastReload > 30000) {
        sessionStorage.setItem('last_auto_chunk_reload', String(now));
        this.handleReset();
      }
    }
  }

  handleReset = async () => {
    try {
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister().catch(() => {})));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k).catch(() => {})));
      }
    } catch (e) {
      console.warn("Reset cache error:", e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('v', String(Date.now()));
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: '#0a0a0a', color: '#f43f5e', zIndex: 999999, 
          padding: '2rem', overflow: 'auto', fontFamily: 'sans-serif',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '100%', textAlign: 'center' }}>
            <h2 style={{ color: '#ffffff', marginTop: 0 }}>Application Notice</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
              An error or stale Service Worker cache issue was detected in {this.props.name || 'Component'}.
            </p>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', textAlign: 'left', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '6px', fontSize: '0.8rem', color: '#fda4af' }}>
              <summary style={{ cursor: 'pointer', color: '#ffffff', fontWeight: 'bold' }}>View Technical Error Log</summary>
              <div style={{ marginTop: '0.5rem' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </div>
            </details>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={this.handleReset}
                style={{ background: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Reset Cache & Reload App
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null })} 
                style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}
              >
                Dismiss & Retry
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
