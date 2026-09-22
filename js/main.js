document.addEventListener('DOMContentLoaded', () => {
  // Navigation scroll effect
  const nav = document.querySelector('.nav-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Unified Physics Carousel Engine (Lerp)
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');
  
  if (btnNext && btnPrev) {
    const items = Array.from(document.querySelectorAll('.collage-grid .collage-item'));
    
    // The exact positional matrix for the 6 slots
    const targets = [
      { top: 15, left: 30, width: 45, height: 70, zIndex: 10, brightness: 1, depth: 1 }, // main
      { top: 0, left: 0, width: 25, height: 35, zIndex: 1, brightness: 0.5, depth: 2 },  // bg1
      { top: 10, left: 28, width: 20, height: 25, zIndex: 2, brightness: 0.4, depth: 3 }, // bg2
      { top: 60, left: 8, width: 25, height: 35, zIndex: 1, brightness: 0.6, depth: 2 },  // bg3
      { top: 15, left: 75, width: 25, height: 40, zIndex: 1, brightness: 0.4, depth: 3 }, // bg4
      { top: 65, left: 80, width: 20, height: 30, zIndex: 2, brightness: 0.5, depth: 1 }  // bg5
    ];

    // Maps each DOM element to its target index in the matrix
    let itemTargets = [0, 1, 2, 3, 4, 5];
    
    // Initial physics states
    let states = items.map((_, i) => ({
      top: targets[i].top,
      left: targets[i].left,
      width: targets[i].width,
      height: targets[i].height,
      brightness: targets[i].brightness,
      parallax: 0
    }));

    const lerp = (start, end, factor) => start + (end - start) * factor;

    // The unified physics loop
    function physicsLoop() {
      const scrollY = window.scrollY;
      const isMobile = window.innerWidth <= 768; // simple check to disable physics on mobile stack

      items.forEach((item, i) => {
        const targetIdx = itemTargets[i];
        const target = targets[targetIdx];
        const state = states[i];
        
        // Calculate the parallax offset for this specific target position
        let targetParallax = 0;
        if (targetIdx !== 0 && !isMobile) {
          targetParallax = scrollY * 0.15 / target.depth;
        }

        if (!isMobile) {
          // Smooth glide for all properties
          state.top = lerp(state.top, target.top, 0.08);
          state.left = lerp(state.left, target.left, 0.08);
          state.width = lerp(state.width, target.width, 0.08);
          state.height = lerp(state.height, target.height, 0.08);
          state.brightness = lerp(state.brightness, target.brightness, 0.08);
          state.parallax = lerp(state.parallax, targetParallax, 0.08);
          
          item.style.top = `${state.top}%`;
          item.style.left = `${state.left}%`;
          item.style.width = `${state.width}%`;
          item.style.height = `${state.height}%`;
          item.style.filter = `brightness(${state.brightness})`;
          item.style.zIndex = target.zIndex;
          item.style.transform = `translateY(${state.parallax}px)`;
        } else {
          // Mobile stack styles (clearing inline styles)
          item.style = '';
        }

        // Manage interaction class
        if (targetIdx === 0) {
          item.classList.add('is-main');
        } else {
          item.classList.remove('is-main');
        }
      });

      requestAnimationFrame(physicsLoop);
    }
    
    physicsLoop();

    btnNext.addEventListener('click', () => {
      itemTargets.unshift(itemTargets.pop());
    });

    btnPrev.addEventListener('click', () => {
      itemTargets.push(itemTargets.shift());
    });
  }

  // Scroll Reveal Observer
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      }
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, revealOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // Weather & Clock Widget
  const clockElement = document.getElementById('live-clock');
  const cityElement = document.getElementById('local-city');
  const tempElement = document.getElementById('local-temp');
  const descElement = document.getElementById('weather-desc');

  if (clockElement) {
    // 1. Live Clock
    function updateClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Weather Fetching
    async function fetchWeather() {
      try {
        // Free IP Geolocation (No API key needed)
        const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (!geoRes.ok) throw new Error('Geo API failed');
        const geoData = await geoRes.json();
        
        const lat = geoData.latitude;
        const lon = geoData.longitude;
        const city = geoData.city ? geoData.city.toUpperCase() : 'LOCAL';
        
        cityElement.textContent = city;

        // Free Weather API (Open-Meteo, No API key needed)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) throw new Error('Weather API failed');
        const weatherData = await weatherRes.json();
        
        const temp = Math.round(weatherData.current_weather.temperature);
        const code = weatherData.current_weather.weathercode;
        
        tempElement.textContent = `${temp}°C`;
        
        // Simple WMO Weather code mapping
        let condition = "Clear skies";
        if (code >= 1 && code <= 3) condition = "Partly cloudy";
        if (code >= 45 && code <= 48) condition = "Foggy";
        if (code >= 51 && code <= 67) condition = "Raining";
        if (code >= 71 && code <= 77) condition = "Snowing";
        if (code >= 80 && code <= 82) condition = "Rain showers";
        if (code >= 95) condition = "Thunderstorm";
        
        descElement.textContent = condition;

      } catch (err) {
        console.error('Weather fetch error:', err);
        cityElement.textContent = 'UNKNOWN';
        tempElement.textContent = '--°C';
        descElement.textContent = 'Weather unavailable';
      }
    }
    
    fetchWeather();
  }

  // Custom Cursor Logic
  const cursor = document.querySelector('.custom-cursor');
  
  if (cursor && window.matchMedia("(pointer: fine)").matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    
    // Smooth lerping for cursor
    function animateCursor() {
      let dx = mouseX - cursorX;
      let dy = mouseY - cursorY;
      cursorX += dx * 0.2;
      cursorY += dy * 0.2;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Hover effects on interactive elements via delegation
    document.addEventListener('mouseover', (e) => {
      const interactive = e.target.closest('a, button, .pos-main, .playlist-item, [role="button"]');
      if (interactive) {
        cursor.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const interactive = e.target.closest('a, button, .pos-main, .playlist-item, [role="button"]');
      if (interactive) {
        cursor.classList.remove('hovering');
      }
    });

    // GitHub Journal Logic
  const journalMainView = document.getElementById('journal-main-view');
  const featuredDate = document.getElementById('featured-date');
  const featuredTitle = document.getElementById('featured-title');
  const featuredBody = document.getElementById('featured-body');
  const archiveList = document.getElementById('archive-list');

  if (journalMainView && archiveList) {
    let journalIssues = [];
    
    // Simple date formatter
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/');
    };

    const renderMainFeature = (issue, animate = true) => {
      if (animate) {
        journalMainView.classList.add('loading');
        setTimeout(() => {
          featuredDate.textContent = formatDate(issue.created_at);
          featuredTitle.textContent = issue.title;
          featuredBody.innerHTML = issue.body_html || '<p>No content provided.</p>';
          journalMainView.classList.remove('loading');
        }, 300);
      } else {
        featuredDate.textContent = formatDate(issue.created_at);
        featuredTitle.textContent = issue.title;
        featuredBody.innerHTML = issue.body_html || '<p>No content provided.</p>';
      }
    };

    const fetchJournal = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Clovescence/harbor/issues?creator=Clovescence&state=open', {
          headers: {
            'Accept': 'application/vnd.github.html+json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch issues');
        
        journalIssues = await response.json();
        
        // Filter out Pull Requests (which are returned in the Issues API)
        journalIssues = journalIssues.filter(issue => !issue.pull_request);

        if (journalIssues.length === 0) {
          featuredTitle.textContent = "No thoughts recorded yet.";
          featuredBody.innerHTML = "<p>Check back later.</p>";
          return;
        }

        // Render first issue immediately
        renderMainFeature(journalIssues[0], false);
        
        // Render archive list
        journalIssues.forEach((issue, index) => {
          const item = document.createElement('div');
          item.className = `archive-item text-sans ${index === 0 ? 'active' : ''}`;
          
          const dateSpan = document.createElement('span');
          dateSpan.className = 'archive-date fw-300';
          dateSpan.textContent = formatDate(issue.created_at);
          
          const titleSpan = document.createElement('span');
          titleSpan.className = 'archive-title fw-500 text-serif';
          titleSpan.textContent = issue.title;
          
          item.appendChild(dateSpan);
          item.appendChild(titleSpan);
          
          item.addEventListener('click', () => {
            // Remove active from all
            document.querySelectorAll('.archive-item').forEach(el => el.classList.remove('active'));
            // Add active to clicked
            item.classList.add('active');
            // Render
            renderMainFeature(issue);
          });
          
          archiveList.appendChild(item);
        });
        
      } catch (err) {
        console.error("Journal Error:", err);
        featuredTitle.textContent = "Journal Unavailable";
        featuredBody.innerHTML = "<p>Could not connect to GitHub repository.</p>";
      }
    };

    fetchJournal();
  }

  // Magnetic Links in Footer
    const magneticLinks = document.querySelectorAll('.contact-links a');
    magneticLinks.forEach(link => {
      link.addEventListener('mousemove', (e) => {
        const rect = link.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        link.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      link.addEventListener('mouseleave', () => {
        link.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  // Old Parallax listener removed. Handled by Physics Engine above.

  // ==========================================
  // Premium Playlists & Cover Flow Engine
  // ==========================================
  const cfTrack = document.getElementById('cf-track');
  const cfPrev = document.getElementById('cf-prev');
  const cfNext = document.getElementById('cf-next');
  const premiumDeck = document.getElementById('now-playing-deck');
  
  if (cfTrack && premiumDeck) {
    
    // --- 1. Cover Flow Carousel ---
    let currentCfIndex = 0;
    let cfItems = [];

    const updateCoverFlow = () => {
      const isMobile = window.innerWidth <= 1000;
      
      cfItems.forEach((item, index) => {
        if (isMobile) {
          item.style = '';
          return;
        }

        const offset = index - currentCfIndex;
        
        if (offset < 0) {
          // Items passed (hide on the left)
          item.style.transform = `translate3d(-100px, 0, 50px) rotateY(20deg) scale(0.8)`;
          item.style.opacity = '0';
          item.style.pointerEvents = 'none';
        } else {
          // Active item (0) and future items (> 0)
          const x = offset * 120; // Tight overlapping spacing
          const z = offset * -200; // Deep push into background
          const scale = Math.max(0.5, 1 - (offset * 0.1));
          
          let transformStr = `translate3d(${x}px, 0, ${z}px) scale(${scale})`;
          
          // Add a subtle perspective tilt if not active
          if (offset > 0) {
            transformStr += ` rotateY(-15deg)`;
          } else {
            transformStr += ` rotateY(0deg)`;
          }
          
          item.style.transform = transformStr;
          item.style.opacity = offset > 6 ? '0' : '1';
          item.style.pointerEvents = offset === 0 ? 'auto' : 'none';
        }
      });
    };

    if (cfPrev && cfNext) {
      cfPrev.addEventListener('click', () => {
        if (currentCfIndex > 0) {
          currentCfIndex--;
          updateCoverFlow();
        }
      });
      cfNext.addEventListener('click', () => {
        if (currentCfIndex < cfItems.length - 1) {
          currentCfIndex++;
          updateCoverFlow();
        }
      });
    }

    const initPlaylists = async () => {
      try {
        const res = await fetch('./data/playlists.json');
        if (!res.ok) throw new Error("Could not load playlists");
        const playlists = await res.json();
        
        cfTrack.innerHTML = '';
        
        const validPlaylists = playlists.filter(pl => pl.id !== 'placeholder');
        validPlaylists.forEach((pl, index) => {
          const item = document.createElement('a');
          item.href = pl.url;
          item.target = '_blank';
          item.className = 'cf-item reveal';
          item.style.animationDelay = `${index * 0.2}s`; 

          item.innerHTML = `
            <div class="cf-cover-wrapper">
              <img class="cf-cover" src="${pl.image || ''}" alt="${pl.name}">
            </div>
            <div class="cf-info">
              <h3 class="text-serif">${pl.name}</h3>
              <p class="text-sans fw-300">Playlist • Spotify</p>
            </div>
          `;
          cfTrack.appendChild(item);
          cfItems.push(item);
          
          if (typeof revealObserver !== 'undefined') {
            revealObserver.observe(item);
          }
        });
        
        setTimeout(updateCoverFlow, 50);
      } catch (err) {
        console.error("Playlists fetch error:", err);
      }
    };
    initPlaylists();

    // --- 2. Premium Vinyl Deck API ---
    const vinylRecord = document.querySelector('.vinyl-record');
    const vinylImg = document.getElementById('now-playing-img');
    const statusText = document.getElementById('now-playing-status');
    const titleText = document.getElementById('now-playing-title');
    const artistText = document.getElementById('now-playing-artist');

    const fetchPremiumNowPlaying = async () => {
      try {
        const res = await fetch('/api/now-playing');
        if (!res.ok) throw new Error("Live endpoint not available");
        const data = await res.json();

        if (data.title) {
          vinylImg.src = data.albumUrl || '';
          titleText.textContent = data.title;
          artistText.textContent = data.artist;
          
          if (data.songUrl) {
            premiumDeck.style.cursor = 'pointer';
            premiumDeck.onclick = (e) => {
              if (!e.target.closest('a')) window.open(data.songUrl, '_blank');
            };
          }

          if (data.isPlaying) {
            statusText.textContent = "Currently Playing";
            vinylRecord.classList.add('spinning');
            premiumDeck.classList.add('playing'); // Triggers tonearm and green dot
          } else {
            statusText.textContent = "Last Played";
            vinylRecord.classList.remove('spinning');
            premiumDeck.classList.remove('playing');
          }
        } else {
          statusText.textContent = "Offline";
          vinylRecord.classList.remove('spinning');
          premiumDeck.classList.remove('playing');
        }
      } catch (err) {
        statusText.textContent = "Spotify API Offline";
        vinylRecord.classList.remove('spinning');
        premiumDeck.classList.remove('playing');
      }
    };

    fetchPremiumNowPlaying();
    setInterval(fetchPremiumNowPlaying, 15000);
  }
});
