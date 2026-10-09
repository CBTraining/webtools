import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  PlayIcon,
  PauseIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';
import lottie from 'lottie-web';

/**
 * Interactive Lottie Player Component with Play/Pause, Scrubber, Speed & Background Controls.
 */
export default function LottieInteractivePlayer({ 
  animationData, 
  height = '240px',
  initialLoop = true,
  initialAutoplay = true 
}) {
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(initialAutoplay);
  const [isLooping, setIsLooping] = useState(initialLoop);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [bgMode, setBgMode] = useState('checkerboard'); // 'checkerboard' | 'dark' | 'light'

  const totalFrames = useMemo(() => {
    if (!animationData) return 60;
    return Math.max(1, Math.round((animationData.op || 60) - (animationData.ip || 0)));
  }, [animationData]);

  const frameRate = animationData?.fr || 30;
  const durationSec = (totalFrames / frameRate).toFixed(1);

  // Initialize and mount Lottie player
  useEffect(() => {
    if (!animationData || !containerRef.current) return;

    containerRef.current.innerHTML = '';
    let anim = null;

    try {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: initialLoop,
        autoplay: initialAutoplay,
        animationData: animationData,
      });

      animRef.current = anim;
      anim.setSpeed(speed);

      const onEnterFrame = (e) => {
        setCurrentFrame(Math.round(e.currentTime));
      };

      const onComplete = () => {
        setIsPlaying(false);
      };

      anim.addEventListener('enterFrame', onEnterFrame);
      anim.addEventListener('complete', onComplete);

      return () => {
        anim.removeEventListener('enterFrame', onEnterFrame);
        anim.removeEventListener('complete', onComplete);
        anim.destroy();
      };
    } catch (err) {
      console.error("Lottie load error:", err);
    }
  }, [animationData, initialAutoplay, initialLoop, speed]);

  const togglePlay = () => {
    if (!animRef.current) return;
    if (isPlaying) {
      animRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!isLooping && currentFrame >= totalFrames - 1) {
        animRef.current.goToAndPlay(animationData?.ip || 0, true);
      } else {
        animRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    animRef.current?.setLoop(next);
  };

  const handleSeek = (frame) => {
    setCurrentFrame(frame);
    animRef.current?.goToAndStop(frame, true);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    animRef.current?.setSpeed(newSpeed);
  };

  const handleRestart = () => {
    animRef.current?.goToAndPlay(animationData?.ip || 0, true);
    setIsPlaying(true);
  };

  // Background styling
  const getBackdropStyle = () => {
    if (bgMode === 'checkerboard') {
      return {
        backgroundImage: `
          linear-gradient(45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255, 255, 255, 0.08) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.08) 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        backgroundColor: '#18181b'
      };
    }
    if (bgMode === 'light') {
      return { backgroundColor: '#ffffff', color: '#000000' };
    }
    return { backgroundColor: '#09090b', color: '#ffffff' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      {/* Canvas Viewport */}
      <div 
        style={{
          height: height,
          borderRadius: 'var(--border-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--border-color)',
          transition: 'background-color 0.2s ease',
          ...getBackdropStyle()
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />

        {/* Top-right quick background switcher */}
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 4px', borderRadius: '14px', backdropFilter: 'blur(4px)', zIndex: 5 }}>
          <button 
            type="button"
            onClick={() => setBgMode('checkerboard')}
            title="Checkerboard (Transparent)"
            style={{
              width: 18, 
              height: 18, 
              borderRadius: '50%', 
              border: bgMode === 'checkerboard' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.4)',
              background: 'repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 50% / 8px 8px',
              cursor: 'pointer'
            }}
          />
          <button 
            type="button"
            onClick={() => setBgMode('dark')}
            title="Dark Background"
            style={{
              width: 18, 
              height: 18, 
              borderRadius: '50%', 
              border: bgMode === 'dark' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.4)',
              background: '#09090b',
              cursor: 'pointer'
            }}
          />
          <button 
            type="button"
            onClick={() => setBgMode('light')}
            title="Light Background"
            style={{
              width: 18, 
              height: 18, 
              borderRadius: '50%', 
              border: bgMode === 'light' ? '2px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.4)',
              background: '#ffffff',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      {/* Scrub & Playback Controls Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
        {/* Scrubber slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input 
            type="range"
            min={animationData?.ip || 0}
            max={animationData?.op || 60}
            value={currentFrame}
            onChange={(e) => handleSeek(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: '85px', textAlign: 'right' }}>
            {currentFrame}/{totalFrames}f ({(currentFrame / frameRate).toFixed(1)}s / {durationSec}s)
          </span>
        </div>

        {/* Playback Buttons & Speed */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button 
              type="button"
              className="btn"
              onClick={togglePlay}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon style={{ width: 14, height: 14 }} /> : <PlayIcon style={{ width: 14, height: 14 }} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button 
              type="button"
              className="btn"
              onClick={handleRestart}
              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
              title="Restart Animation"
            >
              <ArrowPathIcon style={{ width: 14, height: 14 }} />
            </button>

            <button 
              type="button"
              className={`btn ${isLooping ? 'btn-primary' : ''}`}
              onClick={toggleLoop}
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              title="Toggle Looping"
            >
              Loop: {isLooping ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Speed controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginRight: '2px' }}>Speed:</span>
            {[0.5, 1, 1.5, 2].map((s) => (
              <button 
                key={s}
                type="button"
                className={`btn ${speed === s ? 'btn-primary' : ''}`}
                onClick={() => handleSpeedChange(s)}
                style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
