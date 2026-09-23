export function initThemeSwitcher() {
  const toggleBtn = document.getElementById('theme-toggle');
  const iconPath = toggleBtn?.querySelector('path');
  if (!toggleBtn || !iconPath) return;

  const currentTheme = localStorage.getItem('theme') || 'dark';
  if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    updateIcon('light');
  }

  toggleBtn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
    
    // Dispatch event for WebGL scene to react
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme } }));
  });

  function updateIcon(theme) {
    if (theme === 'light') {
      // Sun icon
      iconPath.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
    } else {
      // Moon icon
      iconPath.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
    }
  }
}
