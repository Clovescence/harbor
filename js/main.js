import { SITE_CONFIG } from './config.js';
import '../css/variables.css';
import '../css/global.css';
import '../css/grid.css';
import '../css/home.css';
import '../css/photos.css';
import '../css/playlists.css';
import '../css/journal.css';
import '../css/contact-footer.css';

import { initThemeSwitcher } from './theme.js';
import { initWebGL } from './gl.js';
import { initAnimations } from './animations.js';
import { initAudioVisualizer } from './audio.js';
import { initGuestbook } from './guestbook.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initWebGL();
  initAnimations();
  initAudioVisualizer();
  initGuestbook();
  initNavigation();
  initPhotoCarousel();
  initClockAndWeather();
  initCustomCursor();
  initJournal();
  initPlaylistCarousel();
  initNowPlaying();
  initMagneticLinks();
});

function initNavigation() {
  const nav = document.querySelector('.nav-header');
  const toggle = document.querySelector('.nav-toggle');
  if (!nav) return;

  const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
        return;
      }

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
      nav.classList.remove('nav-open');
      toggle?.setAttribute('aria-expanded', 'false');
    });
  });
}

function initPhotoCarousel() {
  const collage = document.querySelector('.collage-grid');
  const previous = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  if (!collage || !previous || !next) return;

  const items = [...collage.querySelectorAll('.collage-item')];
  const slots = ['slot-main', 'slot-back-left', 'slot-mid-left', 'slot-bottom-left', 'slot-back-right', 'slot-bottom-right'];
  let order = items.map((_, index) => index);
  let touchStartX = 0;

  const render = () => {
    items.forEach((item, index) => {
      const slotIndex = order[index];
      item.classList.remove(...slots);
      item.classList.toggle('is-main', slotIndex === 0);
      item.classList.add(slots[slotIndex]);
      item.style.setProperty('--parallax-y', getParallaxOffset(item));
    });
  };

  const updateParallax = () => {
    items.forEach(item => item.style.setProperty('--parallax-y', getParallaxOffset(item)));
  };

  previous.addEventListener('click', () => {
    order.push(order.shift());
    render();
  });

  next.addEventListener('click', () => {
    order.unshift(order.pop());
    render();
  });

  const move = direction => {
    if (direction > 0) order.unshift(order.pop());
    else order.push(order.shift());
    render();
  };

  document.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const active = document.activeElement;
    if (active && /input|textarea|select/i.test(active.tagName)) return;
    move(event.key === 'ArrowRight' ? 1 : -1);
  });

  collage.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  collage.addEventListener('touchend', event => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) < 40) return;
    move(distance < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', updateParallax);
  render();

  fetch(SITE_CONFIG.photosUrl)
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Photos unavailable')))
    .then(photos => {
      items.forEach((item, index) => {
        const photo = photos[index];
        if (!photo) return;

        let image = item.querySelector('img');
        if (!image) {
          image = document.createElement('img');
          item.prepend(image);
          item.querySelector('.image-placeholder')?.remove();
        }
        image.src = photo.src;
        image.alt = photo.alt;
        image.className = photo.tone || '';
        item.querySelector('.meta-date').textContent = photo.date;
        item.querySelector('.meta-title').textContent = photo.title;
        item.querySelector('.meta-user').textContent = photo.user;
      });
    })
    .catch(() => {});
}

function getParallaxOffset(item) {
  if (prefersReducedMotion.matches || window.innerWidth <= 768) return '0px';

  const collage = item.closest('.collage-grid');
  if (!collage) return '0px';

  const bounds = collage.getBoundingClientRect();
  const progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) / Math.max(bounds.height, 1)));
  const depth = Number.parseFloat(getComputedStyle(item).getPropertyValue('--slot-depth')) || 0;
  return `${progress * depth * 42}px`;
}



function initClockAndWeather() {
  const clock = document.getElementById('live-clock');
  const city = document.getElementById('local-city');
  const temperature = document.getElementById('local-temp');
  const description = document.getElementById('weather-desc');
  if (!clock) return;

  const updateClock = () => {
    clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };
  updateClock();
  window.setInterval(updateClock, 1000);

  if (!city || !temperature || !description) return;

  const fetchJson = async url => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), SITE_CONFIG.weatherTimeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      return await response.json();
    } finally {
      window.clearTimeout(timeout);
    }
  };

  fetchJson('https://get.geojs.io/v1/ip/geo.json')
    .then(geo => Promise.all([geo, fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}&current_weather=true`)]))
    .then(([geo, weather]) => {
      const code = weather.current_weather.weathercode;
      const conditions = code >= 95 ? 'Thunderstorm' : code >= 80 ? 'Rain showers' : code >= 71 ? 'Snowing' : code >= 51 ? 'Raining' : code >= 45 ? 'Foggy' : code >= 1 ? 'Partly cloudy' : 'Clear skies';
      const cityName = (geo.city || 'LOCAL').toUpperCase();
      city.textContent = cityName;
      temperature.textContent = `${Math.round(weather.current_weather.temperature)}°C`;
      description.textContent = conditions;
      // Also update the hero bottom bar city label
      const heroCityLabel = document.getElementById('hero-city-label');
      if (heroCityLabel) heroCityLabel.textContent = `— ${cityName}`;
    })
    .catch(() => {
      city.textContent = 'UNKNOWN';
      temperature.textContent = '--°C';
      description.textContent = 'Weather unavailable';
    });
}

function initCustomCursor() {
  const cursor = document.querySelector('.custom-cursor');
  if (!cursor || !window.matchMedia('(pointer: fine)').matches || prefersReducedMotion.matches) return;

  document.addEventListener('mousemove', event => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  });

  document.addEventListener('mouseover', event => {
    if (event.target.closest('a, button, .cf-item')) cursor.classList.add('hovering');
  });

  document.addEventListener('mouseout', event => {
    if (event.target.closest('a, button, .cf-item')) cursor.classList.remove('hovering');
  });
}

function initJournal() {
  const main = document.getElementById('journal-main-view');
  const date = document.getElementById('featured-date');
  const title = document.getElementById('featured-title');
  const body = document.getElementById('featured-body');
  const archive = document.getElementById('archive-list');
  if (!main || !date || !title || !body || !archive) return;

  const formatDate = value => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const renderIssue = (issue, animate = true) => {
    const update = () => {
      date.textContent = formatDate(issue.created_at);
      title.textContent = issue.title || 'Untitled thought';
      body.replaceChildren(sanitizeHtml(issue.body_html || '<p>No content provided.</p>'));
      main.classList.remove('loading');
    };
    if (!animate || prefersReducedMotion.matches) update();
    else {
      main.classList.add('loading');
      window.setTimeout(update, 220);
    }
  };

  fetch(SITE_CONFIG.githubIssuesUrl, { headers: { Accept: 'application/vnd.github.html+json' } })
    .then(response => {
      if (!response.ok) throw new Error('Journal request failed');
      return response.json();
    })
    .then(issues => {
      const journalIssues = issues.filter(issue => !issue.pull_request);
      if (!journalIssues.length) {
        title.textContent = 'No thoughts recorded yet.';
        body.textContent = 'Check back later.';
        return;
      }

      archive.replaceChildren();
      journalIssues.forEach((issue, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `archive-item text-sans ${index === 0 ? 'active' : ''}`;
        const dateSpan = document.createElement('span');
        dateSpan.className = 'archive-date fw-300';
        dateSpan.textContent = formatDate(issue.created_at);
        const titleSpan = document.createElement('span');
        titleSpan.className = 'archive-title fw-500 text-serif';
        titleSpan.textContent = issue.title || 'Untitled thought';
        button.append(dateSpan, titleSpan);
        button.addEventListener('click', () => {
          archive.querySelectorAll('.archive-item').forEach(item => item.classList.remove('active'));
          button.classList.add('active');
          renderIssue(issue);
        });
        archive.appendChild(button);
      });
      renderIssue(journalIssues[0], false);
    })
    .catch(() => {
      title.textContent = 'Journal unavailable';
      body.textContent = 'Could not connect to the journal.';
    });
}

function sanitizeHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('script, style, iframe, object, embed, form').forEach(node => node.remove());
  template.content.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attribute => {
      if (attribute.name.startsWith('on')) node.removeAttribute(attribute.name);
    });
    if (node.matches('a') && !/^(https?:|mailto:|#)/i.test(node.getAttribute('href') || '')) node.removeAttribute('href');
  });
  return template.content;
}

function initPlaylistCarousel() {
  const track = document.getElementById('cf-track');
  const previous = document.getElementById('cf-prev');
  const next = document.getElementById('cf-next');
  if (!track || !previous || !next) return;

  let items = [];
  let activeIndex = 0;

  const update = () => {
    const mobile = window.innerWidth <= 1000;
    items.forEach((item, index) => {
      const offset = index - activeIndex;
      item.dataset.position = mobile ? 'mobile' : offset < 0 ? 'past' : `offset-${Math.min(offset, 6)}`;
      item.tabIndex = mobile || offset === 0 ? 0 : -1;
    });
    previous.disabled = mobile || activeIndex === 0;
    next.disabled = mobile || activeIndex >= items.length - 1;
  };

  previous.addEventListener('click', () => { activeIndex = Math.max(0, activeIndex - 1); update(); });
  next.addEventListener('click', () => { activeIndex = Math.min(items.length - 1, activeIndex + 1); update(); });
  window.addEventListener('resize', update);

  fetch(SITE_CONFIG.playlistsUrl)
    .then(response => {
      if (!response.ok) throw new Error('Playlist request failed');
      return response.json();
    })
    .then(playlists => {
      playlists.filter(playlist => playlist.id !== 'placeholder').forEach((playlist, index) => {
        const item = document.createElement('a');
        item.className = 'cf-item reveal';
        item.href = playlist.url;
        item.target = '_blank';
        item.rel = 'noreferrer';
        item.style.setProperty('--reveal-delay', `${index * 0.08}s`);

        const image = document.createElement('img');
        image.className = 'cf-cover';
        image.src = playlist.image || '';
        image.alt = `${playlist.name} cover`;
        const cover = document.createElement('div');
        cover.className = 'cf-cover-wrapper';
        cover.appendChild(image);

        const info = document.createElement('div');
        info.className = 'cf-info';
        const name = document.createElement('h3');
        name.className = 'text-serif';
        name.textContent = playlist.name;
        const type = document.createElement('p');
        type.className = 'text-sans fw-300';
        type.textContent = playlist.tracks ? `${playlist.tracks} tracks • Spotify` : 'Playlist • Spotify';
        const description = document.createElement('small');
        description.className = 'cf-description text-sans';
        description.textContent = playlist.description || 'A collection of songs.';
        info.append(name, type);
        info.appendChild(description);

        item.append(cover, info);
        track.appendChild(item);
        items.push(item);
      });
      update();
    })
    .catch(() => {
      track.textContent = 'Playlists unavailable.';
      previous.disabled = true;
      next.disabled = true;
    });
}

function initNowPlaying() {
  const deck = document.getElementById('now-playing-deck');
  const record = document.querySelector('.vinyl-record');
  const image = document.getElementById('now-playing-img');
  const status = document.getElementById('now-playing-status');
  const title = document.getElementById('now-playing-title');
  const artist = document.getElementById('now-playing-artist');
  if (!deck || !record || !image || !status || !title || !artist) return;

  const update = async () => {
    try {
      const response = await fetch(SITE_CONFIG.nowPlayingUrl);
      if (!response.ok) throw new Error('Now playing unavailable');
      const data = await response.json();
      title.textContent = data.title || 'Nothing playing';
      artist.textContent = data.artist || 'Spotify is quiet';
      status.textContent = data.isPlaying ? 'Currently playing' : 'Last played';
      if (data.albumUrl) image.src = data.albumUrl;
      // Let initAudioVisualizer handle the deck click and spinning state manually
      // deck.onclick = () => window.open(data.songUrl, '_blank', 'noopener');
    } catch {
      status.textContent = 'Spotify API offline';
      title.textContent = '---';
      artist.textContent = '---';
      record.classList.remove('spinning');
      deck.classList.remove('playing');
    }
  };

  update();
  window.setInterval(update, SITE_CONFIG.nowPlayingRefreshMs);
}

function initMagneticLinks() {
  if (prefersReducedMotion.matches || !window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('.contact-links a').forEach(link => {
    link.addEventListener('mousemove', event => {
      const bounds = link.getBoundingClientRect();
      link.style.setProperty('--magnetic-x', `${(event.clientX - bounds.left - bounds.width / 2) * 0.25}px`);
      link.style.setProperty('--magnetic-y', `${(event.clientY - bounds.top - bounds.height / 2) * 0.25}px`);
    });
    link.addEventListener('mouseleave', () => {
      link.style.setProperty('--magnetic-x', '0px');
      link.style.setProperty('--magnetic-y', '0px');
    });
  });
}
