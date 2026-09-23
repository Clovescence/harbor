export function initAudioVisualizer() {
  const canvas = document.getElementById('audio-visualizer');
  const deck = document.getElementById('now-playing-deck');
  if (!canvas || !deck) return;

  const ctx = canvas.getContext('2d');
  let audioCtx;
  let analyser;
  let dataArray;
  let isPlaying = false;
  let oscillator1, oscillator2, gainNode;

  const initAudioContext = () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    // Create ambient drone
    oscillator1 = audioCtx.createOscillator();
    oscillator2 = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(110, audioCtx.currentTime); // A2

    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(164.81, audioCtx.currentTime); // E3

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    oscillator1.start();
    oscillator2.start();
  };

  // Removed conflicting click listener — Spotify API in main.js now handles the vinyl animation automatically.
  /*
  deck.addEventListener('click', () => {
    if (!audioCtx) initAudioContext();
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      // Fade out
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.5);
      deck.classList.remove('playing');
      deck.querySelector('.vinyl-record').classList.remove('spinning');
    } else {
      // Fade in
      gainNode.gain.setTargetAtTime(0.15, audioCtx.currentTime, 1);
      deck.classList.add('playing');
      deck.querySelector('.vinyl-record').classList.add('spinning');
      drawVisualizer();
    }
    isPlaying = !isPlaying;
  });
  */

  function drawVisualizer() {
    if (!isPlaying) return;
    requestAnimationFrame(drawVisualizer);

    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const color = isLight ? 'rgba(212, 175, 55, ' : 'rgba(177, 154, 98, '; // Accent color
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 70;

    ctx.beginPath();
    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 255.0;
      const radius = baseRadius + (v * 50);
      const angle = (i / dataArray.length) * Math.PI * 2;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color + '0.8)';
    ctx.stroke();
    ctx.fillStyle = color + '0.2)';
    ctx.fill();
  }
}
