// Freyja - Synthesized Sound Design (Web Audio API)
// No external assets required. Completely procedural.

document.addEventListener('DOMContentLoaded', () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = new AudioContext();
  let ambientStarted = false;

  // Synthesize a subtle mechanical "click/tape" sound for hover
  const playHoverSound = () => {
    if (audioCtx.state === 'suspended') return;
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // A very short, high-pitched click that mimics a physical switch
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.02);
    
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.04);
  };

  // Synthesize a deep, breathing ambient drone
  const startAmbientDrone = () => {
    if (ambientStarted || audioCtx.state === 'suspended') return;
    ambientStarted = true;

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const lfo = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lfoGain = audioCtx.createGain();

    // Deep drone at 65Hz (C2)
    osc.type = 'sine';
    osc.frequency.value = 65;

    // LFO to modulate volume, creating a "breathing" effect (0.1Hz)
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    
    // Very quiet base volume
    gain.gain.value = 0.02;
    // Amplitude of modulation
    lfoGain.gain.value = 0.015; 
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(t);
    lfo.start(t);
  };

  // Resume context and start ambient on first user interaction
  const initAudio = () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    startAmbientDrone();
    // Remove listener after first interaction
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
  };

  document.addEventListener('click', initAudio);
  document.addEventListener('keydown', initAudio);

  // Bind hover sound to interactive elements
  const interactiveElements = document.querySelectorAll('a, button, [data-cursor], [data-magnetic]');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        playHoverSound();
      }
    });
  });
});
