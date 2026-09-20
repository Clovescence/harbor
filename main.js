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

  // 1. Time of Day Atmosphere Shift
  const setTimeOfDayAtmosphere = () => {
    const hour = new Date().getHours();
    const root = document.documentElement;
    if (hour >= 20 || hour < 5) {
      root.style.setProperty('--bg-deep', '#071510');
      root.style.setProperty('--bg-secondary', '#0B1D14');
    } else if (hour >= 5 && hour < 10) {
      root.style.setProperty('--bg-deep', '#0C1E15');
      root.style.setProperty('--bg-secondary', '#12271C');
    } else if (hour >= 16 && hour < 20) {
      root.style.setProperty('--bg-deep', '#0E2018');
      root.style.setProperty('--bg-secondary', '#14291F');
    }
  };
  setTimeOfDayAtmosphere();

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

  // 1.6. Live Spotify "Currently Playing" Sync
  const SPOTIFY_CLIENT_ID = '86802d9c7f674439967ea56da49bae59';
  const SPOTIFY_CLIENT_SECRET = '168e9f5de091488ca2b09612e1deec86';
  const SPOTIFY_REFRESH_TOKEN = 'AQDj-CDV5syYk594fWP86VfGsj0lyHqgT9gjGU6dmBP28DvWISWsmdnLjFXFhy7tCmZ75AEgb3tc582R1s0NBuMB_LD2KUfy8j_QoxPS0PjgzqaOSXipD20v4gK1sKACEpg';

  const fetchCurrentlyPlaying = async () => {
    try {
      // 1. Get a fresh access token
      const authStr = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authStr}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: SPOTIFY_REFRESH_TOKEN
        })
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenData.access_token) return;

      // 2. Get currently playing track
      const trackRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      // 204 means nothing is playing right now
      if (trackRes.status === 204 || trackRes.status > 400) return;

      const trackData = await trackRes.json();
      if (!trackData.item) return;

      // 3. Update DOM
      const titleEl = document.getElementById('spotify-live-title');
      const artistEl = document.getElementById('spotify-live-artist');
      const coverEl = document.getElementById('spotify-live-cover');
      const linkEl = document.getElementById('spotify-live-link');
      const statusEl = document.getElementById('spotify-live-status');

      if (titleEl && artistEl && coverEl && linkEl && statusEl) {
        statusEl.textContent = trackData.is_playing ? 'Currently playing' : 'Last played';
        statusEl.style.color = trackData.is_playing ? 'var(--accent-teal)' : 'var(--accent-gold)';
        
        titleEl.textContent = trackData.item.name;
        artistEl.textContent = trackData.item.artists.map(a => a.name).join(', ');
        
        if (trackData.item.album.images.length > 0) {
          coverEl.src = trackData.item.album.images[0].url;
        }
        
        if (trackData.item.external_urls && trackData.item.external_urls.spotify) {
          linkEl.href = trackData.item.external_urls.spotify;
        }
        
        // Tab Presence: Live Spotify Status
        if (trackData.is_playing && !document.hidden) {
           document.title = `▶ ${trackData.item.name} — Sequoia`;
        } else if (!document.hidden) {
           document.title = `Sequoia / Haga Pradiva`;
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

  // 7. Frames 3D Hover Parallax
  const frames = document.querySelectorAll('.frame-item');
  if (!prefersReducedMotion) {
    frames.forEach(frame => {
      const placeholder = frame.querySelector('.frame-image-placeholder');
      frame.addEventListener('mousemove', (e) => {
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

  // 9. Secret Layer (Easter Egg) Expansion -> ARG Terminal Mode
  const freyjaTrigger = document.getElementById('freyja-trigger');
  let clickCount = 0;
  let clickTimer;

  if (freyjaTrigger) {
    freyjaTrigger.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      
      if (clickCount >= 3) {
        document.body.classList.add('secret-layer-active');
        clickCount = 0;
        
        // Terminal Boot Sequence
        const archive = document.querySelector('.secret-archive');
        archive.innerHTML = '';
        
        const sequence = [
          "SEQUOIA OS v2.0.26 INIT...",
          "LOADING KERNEL MODULES [OK]",
          "MOUNTING /dev/sda1 [OK]",
          "ESTABLISHING AUDIO LINK...",
          "WARNING: WEATHER SYNC ACTIVE.",
          "ACCESS GRANTED.",
          "Welcome to the quiet room."
        ];
        
        let i = 0;
        const printLine = () => {
          if (i < sequence.length) {
            const p = document.createElement('p');
            p.className = 'text-small';
            p.style.fontFamily = 'monospace';
            p.style.marginBottom = '0.5rem';
            p.style.color = i === sequence.length - 1 ? 'var(--accent-gold)' : 'var(--accent-teal)';
            p.textContent = sequence[i];
            archive.appendChild(p);
            i++;
            setTimeout(printLine, 300 + Math.random() * 500);
          } else {
             const exitBtn = document.createElement('button');
             exitBtn.textContent = 'EXIT';
             exitBtn.style.marginTop = '2rem';
             exitBtn.style.background = 'transparent';
             exitBtn.style.color = 'var(--text-ivory)';
             exitBtn.style.border = '1px solid var(--accent-gold)';
             exitBtn.style.padding = '0.5rem 1rem';
             exitBtn.style.cursor = 'pointer';
             exitBtn.addEventListener('click', () => document.body.classList.remove('secret-layer-active'));
             archive.appendChild(exitBtn);
          }
        };
        setTimeout(printLine, 500);
      } else {
        clickTimer = setTimeout(() => { clickCount = 0; }, 1000);
      }
    });
  }
  // 10. The Hacker CMS: GitHub Issues as Journal Entries
  const fetchJournalEntries = async () => {
    const container = document.getElementById('journal-container');
    if (!container) return;

    try {
      // Fetch open issues created by Clovescence in the harbor repo
      const res = await fetch('https://api.github.com/repos/Clovescence/harbor/issues?state=open&creator=Clovescence');
      
      if (!res.ok) throw new Error('GitHub API returned ' + res.status);
      
      const issues = await res.json();
      
      if (issues.length === 0) {
        container.innerHTML = '<p class="text-small" style="opacity: 0.5;">No field notes yet.</p>';
        return;
      }

      container.innerHTML = ''; // Clear loading text

      // Render up to 5 most recent issues
      issues.slice(0, 5).forEach(issue => {
        // Date formatting
        const date = new Date(issue.created_at);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(2)}`;
        
        // Naive tag extraction (e.g. if title has [UNFINISHED])
        let tag = 'THOUGHT';
        let cleanTitle = issue.title;
        const tagMatch = issue.title.match(/^\[(.*?)\]\s*(.*)$/);
        if (tagMatch) {
           tag = tagMatch[1].toUpperCase();
           cleanTitle = tagMatch[2];
        }

        // Basic markdown to text strip for the body snippet (first 150 chars)
        let bodySnippet = issue.body || 'No content provided.';
        if (bodySnippet.length > 150) bodySnippet = bodySnippet.substring(0, 150) + '...';

        const article = document.createElement('article');
        article.className = 'journal-entry';
        
        article.innerHTML = `
          <div class="entry-meta">
            <span class="text-overline">${dateStr}</span>
            <span class="text-overline">${tag}</span>
          </div>
          <h3 class="text-h3">${cleanTitle}</h3>
          <p class="text-small">${bodySnippet}</p>
        `;
        
        // Link to the actual GitHub issue if clicked
        article.style.cursor = 'pointer';
        article.addEventListener('click', () => window.open(issue.html_url, '_blank'));
        
        container.appendChild(article);
      });
      
      // Re-trigger ScrollTrigger refresh since DOM changed
      if (typeof ScrollTrigger !== 'undefined') {
        setTimeout(() => ScrollTrigger.refresh(), 200);
      }

    } catch (e) {
      console.log('Failed to fetch journal from GitHub', e);
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

});
