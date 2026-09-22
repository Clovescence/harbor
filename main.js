// Sequoia - Main Interactions (Polished with Lenis & GSAP)

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

// Integrate Lenis with GSAP ScrollTrigger
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0, 0);
} else {
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Time of Day Atmosphere Shift & Theme Manager
  class ThemeManager {
    constructor() {
      this.palettes = {
        dawn: { bgDeep: [12, 30, 21], bgSec: [18, 39, 28], accent1: [212, 184, 122], textIvory: [240, 235, 225] },
        day: { bgDeep: [10, 26, 18], bgSec: [15, 34, 24], accent1: [201, 169, 110], textIvory: [237, 232, 224] },
        dusk: { bgDeep: [14, 32, 24], bgSec: [20, 41, 31], accent1: [217, 140, 90], textIvory: [245, 220, 200] },
        night: { bgDeep: [7, 21, 16], bgSec: [11, 29, 20], accent1: [150, 160, 180], textIvory: [220, 230, 240] },
        matrix: { bgDeep: [0, 15, 0], bgSec: [0, 25, 0], accent1: [0, 255, 0], textIvory: [150, 255, 150] } // Secret theme
      };
      this.tick();
      setInterval(() => this.tick(), 60000); // Every minute
    }

    lerp(c1, c2, t) {
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t)
      ];
    }

    tick() {
      if (window.themeOverride) return;

      const d = new Date();
      const hour = d.getHours();
      const min = d.getMinutes();
      const totalHours = hour + min / 60;
      
      let p1, p2, t;
      if (totalHours >= 5 && totalHours < 8) { // Dawn transition
         p1 = this.palettes.night; p2 = this.palettes.dawn; t = (totalHours - 5) / 3;
      } else if (totalHours >= 8 && totalHours < 16) { // Day
         p1 = this.palettes.dawn; p2 = this.palettes.day; t = (totalHours - 8) / 8;
      } else if (totalHours >= 16 && totalHours < 19) { // Dusk transition
         p1 = this.palettes.day; p2 = this.palettes.dusk; t = (totalHours - 16) / 3;
      } else if (totalHours >= 19 && totalHours < 21) { // Night transition
         p1 = this.palettes.dusk; p2 = this.palettes.night; t = (totalHours - 19) / 2;
      } else { // Deep Night
         p1 = this.palettes.night; p2 = this.palettes.night; t = 1;
      }

      const curBgDeep = this.lerp(p1.bgDeep, p2.bgDeep, t);
      const curBgSec = this.lerp(p1.bgSec, p2.bgSec, t);
      const curAcc1 = this.lerp(p1.accent1, p2.accent1, t);
      const curText = this.lerp(p1.textIvory, p2.textIvory, t);
      
      this.applyPalette(curBgDeep, curBgSec, curAcc1, curText);
    }

    applyPalette(bg, sec, acc, text) {
       const root = document.documentElement;
       root.style.setProperty('--bg-deep', `rgb(${bg.join(',')})`);
       root.style.setProperty('--bg-secondary', `rgb(${sec.join(',')})`);
       root.style.setProperty('--accent-gold', `rgb(${acc.join(',')})`);
       root.style.setProperty('--text-ivory', `rgb(${text.join(',')})`);
    }
    
    forceTheme(mode) {
       if (mode === 'auto') {
           window.themeOverride = false;
           this.tick();
           return;
       }
       const p = this.palettes[mode];
       if (p) {
           window.themeOverride = true;
           this.applyPalette(p.bgDeep, p.bgSec, p.accent1, p.textIvory);
       }
    }
  }
  window.themeManager = new ThemeManager();

  // 1.5. Live Environment Sync (Weather API)
  window.isRaining = false;
  const WMO_CONDITIONS = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Dense drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm'
  };

  const syncLiveWeather = async () => {
    try {
      // Bandung coordinates
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.9147&longitude=107.6098&current_weather=true');
      const data = await res.json();
      const weather = data.current_weather;
      const code = weather.weathercode;

      // Update atmosphere
      if (code >= 50) {
        document.documentElement.style.setProperty('--bg-deep', '#061008');
        document.documentElement.style.setProperty('--bg-secondary', '#091810');
        window.isRaining = true;
      }

      // Update weather widget
      const tempEl = document.getElementById('weather-temp');
      const condEl = document.getElementById('weather-condition');
      const windEl = document.getElementById('weather-wind');

      if (tempEl) tempEl.textContent = `${Math.round(weather.temperature)}°`;
      if (condEl) condEl.textContent = WMO_CONDITIONS[code] || 'Unknown';
      if (windEl) windEl.textContent = `${Math.round(weather.windspeed)} km/h`;
    } catch (e) {
      console.log('Atmosphere sync offline.');
    }
  };
  syncLiveWeather();
  setInterval(syncLiveWeather, 300000); // Refresh every 5 minutes

  // 1.6. Live Spotify "Currently Playing" Sync (Backend Powered)
  const fetchCurrentlyPlaying = async () => {
    try {
      const trackRes = await fetch('http://localhost:8000/api/spotify/now-playing');
      const trackData = await trackRes.json();
      
      if (trackData.error) return;

      const titleEl = document.getElementById('spotify-live-title');
      const artistEl = document.getElementById('spotify-live-artist');
      const coverEl = document.getElementById('spotify-live-cover');
      const linkEl = document.getElementById('spotify-live-link');
      const statusEl = document.getElementById('spotify-live-status');

      if (titleEl && artistEl && coverEl && linkEl && statusEl) {
        if (!trackData.is_playing) {
            statusEl.textContent = 'Offline';
            return;
        }
        statusEl.textContent = 'Currently playing';
        statusEl.style.color = 'var(--accent-teal)';
        
        titleEl.textContent = trackData.item.name;
        artistEl.textContent = trackData.item.artists.map(a => a.name).join(', ');
        
        if (trackData.item.album.images.length > 0) {
          coverEl.src = trackData.item.album.images[0].url;
        }
        
        if (trackData.item.external_urls && trackData.item.external_urls.spotify) {
          linkEl.href = trackData.item.external_urls.spotify;
        }
        
        if (!document.hidden) {
           document.title = `▶ ${trackData.item.name} — Sequoia`;
        }
        
        if (trackData.audio_features) {
           window.spotifyAudioFeatures = trackData.audio_features;
        }
      }
    } catch (e) {
      console.log('Spotify sync offline.', e);
    }
  };
  
  // Fetch immediately and then every 30 seconds
  fetchCurrentlyPlaying();
  setInterval(fetchCurrentlyPlaying, 30000);

  // 2. Update year
  const yearNodes = document.querySelectorAll('[data-year]');
  const currentYear = new Date().getFullYear();
  yearNodes.forEach(node => node.textContent = currentYear);

  // 3. Custom Cursor & Magnetic Elements
  const cursor = document.getElementById('custom-cursor');
  const cursorLabel = cursor ? cursor.querySelector('.cursor-label') : null;
  const magneticEls = document.querySelectorAll('[data-magnetic]');

  if (cursor && !prefersReducedMotion) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });

    // Magnetic pull effect
    magneticEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const hx = rect.left + rect.width / 2;
        const hy = rect.top + rect.height / 2;
        const dx = (e.clientX - hx) * 0.3;
        const dy = (e.clientY - hy) * 0.3;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = `translate(0px, 0px)`;
      });
    });

    // Cursor states
    const interactiveElements = document.querySelectorAll('a, button, [data-cursor], [data-magnetic]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        const label = el.getAttribute('data-cursor');
        if (label && cursorLabel) {
          cursor.style.width = '60px';
          cursor.style.height = '60px';
          cursor.style.background = 'var(--text-ivory)';
          cursorLabel.textContent = label;
          cursorLabel.style.opacity = '1';
        } else {
          cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
        }
      });
      
      el.addEventListener('mouseleave', () => {
        cursor.style.width = '12px';
        cursor.style.height = '12px';
        cursor.style.background = 'var(--accent-gold)';
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        if (cursorLabel) {
          cursorLabel.style.opacity = '0';
          cursorLabel.textContent = '';
        }
      });
    });
  }

  // 4. Split Text Setup
  const splitTextEls = document.querySelectorAll('.split-reveal');
  splitTextEls.forEach(el => {
    const text = el.innerText;
    el.innerHTML = '';
    const words = text.split(' ');
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.classList.add('split-word');
      
      const chars = word.split('');
      chars.forEach((char, charIndex) => {
        const charSpan = document.createElement('span');
        charSpan.classList.add('split-char');
        // Calculate stagger based on character position
        const delay = (wordIndex * 0.05) + (charIndex * 0.02);
        charSpan.style.transitionDelay = `${delay}s`;
        // Handle space
        charSpan.innerHTML = char === ' ' ? '&nbsp;' : char;
        wordSpan.appendChild(charSpan);
      });
      
      el.appendChild(wordSpan);
      // Add space after word
      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement('span');
        spaceSpan.classList.add('split-word');
        spaceSpan.innerHTML = '&nbsp;';
        el.appendChild(spaceSpan);
      }
    });
  });

  // 5. GSAP ScrollTrigger for Reveals
  const revealElements = document.querySelectorAll('.reveal');

  revealElements.forEach(el => {
    if (prefersReducedMotion) {
      el.classList.add('is-visible');
    } else if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter: () => el.classList.add('is-visible'),
        once: true
      });
    } else {
      // Fallback if GSAP fails to load
      el.classList.add('is-visible');
    }
  });

  // 6. Header Scroll state
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.style.padding = '1rem 0';
        header.style.background = 'rgba(6, 26, 31, 0.9)';
        header.style.backdropFilter = 'blur(10px)';
      } else {
        header.style.padding = '2rem 0';
        header.style.background = 'transparent';
        header.style.backdropFilter = 'none';
      }
    }, { passive: true });
  }

  // 7. Frames 3D Hover Parallax (Fallback if WebGL fails)
  const frames = document.querySelectorAll('.frame-item');
  if (!prefersReducedMotion) {
    frames.forEach(frame => {
      const placeholder = frame.querySelector('.frame-image-placeholder');
      frame.addEventListener('mousemove', (e) => {
        if (frame.classList.contains('gl-active')) return;
        const rect = frame.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate tilt amounts
        const tiltX = ((y - centerY) / centerY) * -5; // Max 5deg tilt
        const tiltY = ((x - centerX) / centerX) * 5;
        
        placeholder.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        placeholder.style.boxShadow = `${-tiltY * 2}px ${tiltX * 2 + 10}px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)`;
      });
      
      frame.addEventListener('mouseleave', () => {
        if (frame.classList.contains('gl-active')) return;
        placeholder.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        placeholder.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03)`;
      });
    });
  }

  // 8. Fullscreen Image Viewer
  const viewer = document.getElementById('image-viewer');
  const viewerClose = document.querySelector('.viewer-close');
  
  if (viewer && viewerClose) {
    const closeViewer = () => { viewer.classList.remove('is-open'); };
    viewerClose.addEventListener('click', closeViewer);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && viewer.classList.contains('is-open')) closeViewer();
    });

    frames.forEach(item => {
      item.addEventListener('click', () => {
        viewer.classList.add('is-open');
      });
    });
  }

  // 9. Secret Layer (Easter Egg) Expansion -> WebSocket Terminal
  const freyjaTrigger = document.getElementById('freyja-trigger');
  let clickCount = 0;
  let clickTimer;
  let ws;

  if (freyjaTrigger) {
    freyjaTrigger.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      
      if (clickCount >= 3) {
        document.body.classList.add('secret-layer-active');
        clickCount = 0;
        
        if (window.SequoiaAudio && window.SequoiaAudio.playSweepSound) {
            window.SequoiaAudio.playSweepSound();
        }
        
        const output = document.getElementById('terminal-output');
        const inputLine = document.getElementById('terminal-input-wrapper');
        const input = document.getElementById('terminal-input');
        
        if (!output || !inputLine || !input) return;
        
        output.innerHTML = '';
        inputLine.style.opacity = '0';
        
        const appendLine = (text, isSystem = true) => {
            const p = document.createElement('p');
            p.className = 'text-small';
            p.style.fontFamily = 'monospace';
            p.style.marginBottom = '0.5rem';
            p.style.color = isSystem ? 'var(--accent-teal)' : 'var(--text-ivory)';
            p.textContent = text;
            output.appendChild(p);
            output.scrollTop = output.scrollHeight;
        };
        
        // Connect WS
        if (ws) ws.close();
        ws = new WebSocket('ws://localhost:8000/ws/terminal');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'boot') {
               appendLine(data.message, true);
               setTimeout(() => {
                   inputLine.style.opacity = '1';
                   input.focus();
               }, 1000);
            } else if (data.type === 'output') {
               appendLine(data.message, true);
            } else if (data.type === 'theme') {
               if (window.themeManager) {
                   window.themeManager.forceTheme(data.mode);
               }
            }
        };
        
        ws.onclose = () => {
            appendLine("Connection lost.", true);
        };
        
        input.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== 'Shift' && e.key !== 'Control' && e.key !== 'Alt') {
                if (window.SequoiaAudio && window.SequoiaAudio.playTypingSound) {
                    window.SequoiaAudio.playTypingSound();
                }
            }
            if (e.key === 'Enter') {
                const val = input.value.trim();
                if (val === 'exit') {
                    document.body.classList.remove('secret-layer-active');
                    ws.close();
                    return;
                }
                if (val) {
                    appendLine(`> ${val}`, false);
                    ws.send(val);
                }
                input.value = '';
            }
        });
      } else {
        clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
      }
    });
  }
  // 10. SQLite Database Journal Entries (Backend API)
  const fetchJournalEntries = async () => {
    const container = document.getElementById('journal-container');
    if (!container) return;

    try {
      const res = await fetch('http://localhost:8000/api/journal');
      if (!res.ok) throw new Error('API returned ' + res.status);
      
      const data = await res.json();
      const entries = data.entries;
      
      if (!entries || entries.length === 0) {
        container.innerHTML = '<p class="text-small" style="opacity: 0.5;">No field notes yet.</p>';
        return;
      }

      // Save to cache for offline sync
      localStorage.setItem('fieldNotesCache', JSON.stringify(entries));

      container.innerHTML = ''; 

      entries.forEach(entry => {
        const article = document.createElement('article');
        article.className = 'journal-entry';
        article.innerHTML = `
          <div class="entry-meta">
            <span class="text-overline">${entry.date}</span>
            <span class="text-overline">NOTE</span>
          </div>
          <h3 class="text-h3">${entry.title}</h3>
          <p class="text-small">${entry.content}</p>
        `;
        container.appendChild(article);
      });
      
      if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(() => ScrollTrigger.refresh(), 200);
      }
    } catch (e) {
      console.log('Failed to fetch journal from Backend API', e);
      
      // Fallback to offline cache
      const cached = localStorage.getItem('fieldNotesCache');
      if (cached) {
        try {
          const entries = JSON.parse(cached);
          container.innerHTML = '<p class="text-small" style="opacity: 0.5; margin-bottom: 1rem;">Viewing offline cached notes.</p>'; 
          
          entries.forEach(entry => {
            const article = document.createElement('article');
            article.className = 'journal-entry';
            article.innerHTML = `
              <div class="entry-meta">
                <span class="text-overline">${entry.date}</span>
                <span class="text-overline">OFFLINE NOTE</span>
              </div>
              <h3 class="text-h3">${entry.title}</h3>
              <p class="text-small">${entry.content}</p>
            `;
            container.appendChild(article);
          });
          
          if (typeof ScrollTrigger !== 'undefined') {
            setTimeout(() => ScrollTrigger.refresh(), 200);
          }
          return;
        } catch (err) {
          console.error('Failed to parse offline cache', err);
        }
      }

      container.innerHTML = '<p class="text-small" style="opacity: 0.5;">Field notes sync offline.</p>';
    }
  };

  fetchJournalEntries();



  // 12. Tab Presence
  let originalTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      originalTitle = document.title;
      document.title = "Come back to the quiet room.";
    } else {
      document.title = originalTitle;
    }
  });

  // 13. Scroll Progress Bar
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = progress + '%';
    }, { passive: true });
  }

  // 14. Parallax Depth on Frames
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
    document.querySelectorAll('[data-speed]').forEach(el => {
      const speed = parseFloat(el.dataset.speed);
      gsap.to(el, {
        y: () => (1 - speed) * ScrollTrigger.maxScroll(window) * 0.15,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
          invalidateOnRefresh: true
        }
      });
    });
  }

  // 15. Live Bandung Clock (Footer + Weather Widget)
  const clockEl = document.getElementById('footer-clock');
  const weatherClockEl = document.getElementById('weather-time-live');
  const tickClock = () => {
    const now = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
    if (clockEl) clockEl.textContent = now + ' WIB';
    if (weatherClockEl) weatherClockEl.textContent = now;
  };
  tickClock();
  setInterval(tickClock, 1000);

  // 16. Contact Form Submission
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-status');
  if (contactForm && contactStatus) {
      contactForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = document.getElementById('contact-name').value;
          const email = document.getElementById('contact-email').value;
          const message = document.getElementById('contact-message').value;
          
          contactStatus.style.display = 'block';
          contactStatus.style.color = 'var(--text-ivory)';
          contactStatus.textContent = 'Sending...';
          
          try {
              const res = await fetch('http://localhost:8000/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, email, message })
              });
              if (res.ok) {
                  contactStatus.style.color = 'var(--accent-teal)';
                  contactStatus.textContent = 'Message delivered.';
                  contactForm.reset();
              } else {
                  throw new Error('Failed to send');
              }
          } catch (e) {
              contactStatus.style.color = 'salmon';
              contactStatus.textContent = 'System offline. Failed to send.';
          }
      });
  }

  // 17. Live System Dashboard WebSocket
  const initDashboard = () => {
    const dashStatus = document.getElementById('dash-status');
    const dashCpuVal = document.getElementById('dash-cpu-val');
    const dashCpuBar = document.getElementById('dash-cpu-bar');
    const dashRamVal = document.getElementById('dash-ram-val');
    const dashRamBar = document.getElementById('dash-ram-bar');
    const dashUptime = document.getElementById('dash-uptime');
    const dashboardContainer = document.getElementById('system-dashboard');

    if (!dashStatus) return;

    let dashWs = new WebSocket('ws://localhost:8000/ws/dashboard');

    dashWs.onopen = () => {
      dashStatus.textContent = 'ONLINE';
      dashStatus.style.color = 'var(--accent-teal)';
      dashboardContainer.style.display = 'block';
      setTimeout(() => { dashboardContainer.style.opacity = '1'; }, 100);
    };

    dashWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      dashCpuVal.textContent = data.cpu.toFixed(1) + '%';
      dashCpuBar.style.width = data.cpu + '%';
      if (data.cpu > 80) dashCpuBar.style.background = 'salmon';
      else dashCpuBar.style.background = 'var(--accent-teal)';

      dashRamVal.textContent = data.memory_percent.toFixed(1) + '%';
      dashRamBar.style.width = data.memory_percent + '%';

      const u = data.uptime;
      const h = Math.floor(u / 3600).toString().padStart(2, '0');
      const m = Math.floor((u % 3600) / 60).toString().padStart(2, '0');
      const s = (u % 60).toString().padStart(2, '0');
      dashUptime.textContent = `${h}:${m}:${s}`;
    };

    dashWs.onclose = () => {
      dashStatus.textContent = 'OFFLINE';
      dashStatus.style.color = 'salmon';
      setTimeout(initDashboard, 5000); // Reconnect
    };
  };

  initDashboard();

});
