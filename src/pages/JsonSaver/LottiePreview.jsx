import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

export default function LottiePreview({ animationData, isPlaying, onTogglePlay }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (animationData && containerRef.current) {
      containerRef.current.innerHTML = '';
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: isPlaying,
        animationData: animationData,
      });
    }
    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [animationData]);

  useEffect(() => {
    if (animRef.current) {
      if (isPlaying) {
        animRef.current.play();
      } else {
        animRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="glass-panel" style={{ background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'center', position: 'relative', minHeight: '300px', alignItems: 'center' }}>
      <div ref={containerRef} style={{ width: '250px', height: '250px' }}></div>
      <button 
        className="btn" 
        onClick={onTogglePlay} 
        style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
      >
        {isPlaying ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
            </svg>
            Pause
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
            </svg>
            Play
          </>
        )}
      </button>
    </div>
  );
}
