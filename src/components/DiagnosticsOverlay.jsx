import { useState, useEffect, useRef } from 'react';

export default function DiagnosticsOverlay({ isVisible = true, isClosing = false }) {
  const [fps, setFps] = useState(0);
  const [memory, setMemory] = useState(null);
  const requestRef = useRef();
  const frameCountRef = useRef(0);
  const lastFpsUpdateTimeRef = useRef(0);

  useEffect(() => {
    if (!isVisible) return;
    lastFpsUpdateTimeRef.current = window.performance && window.performance.now ? window.performance.now() : Date.now();
    const loop = (time) => {
      frameCountRef.current += 1;
      const t = time || (window.performance && window.performance.now ? window.performance.now() : Date.now());
      const delta = t - lastFpsUpdateTimeRef.current;
      
      if (delta >= 1000 && delta < 10000) { // skip huge deltas from backgrounding
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastFpsUpdateTimeRef.current = t;
      } else if (delta >= 10000) {
        frameCountRef.current = 0;
        lastFpsUpdateTimeRef.current = t;
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const memInterval = setInterval(() => {
      try {
        if (window.performance && window.performance.memory) {
          setMemory({
            used: (window.performance.memory.usedJSHeapSize / 1048576).toFixed(1),
            total: (window.performance.memory.totalJSHeapSize / 1048576).toFixed(1),
            limit: (window.performance.memory.jsHeapSizeLimit / 1048576).toFixed(1)
          });
        }
      } catch {
        // Safe fallback
      }
    }, 1000);
    return () => clearInterval(memInterval);
  }, [isVisible]);

  // Desktop only check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 800);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDesktop || !isVisible) return null;

  const cores = navigator.hardwareConcurrency || 'Unknown';
  const ram = navigator.deviceMemory ? `${navigator.deviceMemory}GB+` : 'Unknown';

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      <div
        className={isClosing ? 'animate-slide-down' : 'animate-slide-up'}
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          gap: '2rem',
          color: '#fff',
          fontSize: '0.85rem',
          fontFamily: 'monospace',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#aaaaaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>FPS</span>
        <span style={{ fontWeight: 'bold', color: fps > 30 ? '#52c41a' : '#ff4d4f' }}>{fps}</span>
      </div>

      {memory ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#aaaaaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>JS Heap</span>
          <span style={{ fontWeight: 'bold' }}>{memory.used} <span style={{fontSize: '0.7rem', fontWeight: 'normal'}}>/ {memory.limit} MB</span></span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#aaaaaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>JS Heap</span>
          <span style={{ color: '#aaaaaa' }}>Unsupported</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#aaaaaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>Cores</span>
        <span style={{ fontWeight: 'bold' }}>{cores}</span>
      </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#aaaaaa', fontSize: '0.7rem', textTransform: 'uppercase' }}>RAM Base</span>
          <span style={{ fontWeight: 'bold' }}>{ram}</span>
        </div>
      </div>
    </div>
  );
}
