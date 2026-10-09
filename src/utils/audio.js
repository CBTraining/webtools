let sharedAudioCtx = null;

const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

export const playDing = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
    osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.5); // slide down to C5

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.warn("Audio not supported or blocked", e);
  }
};

export const playAlarmBeep = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Play 3 distinct alarm beeps
    for (let i = 0; i < 3; i++) {
      const time = ctx.currentTime + (i * 0.5);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.setValueAtTime(900, time + 0.1);
      
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.4);
    }
  } catch (e) {
    console.warn("Alarm audio not supported or blocked", e);
  }
};
