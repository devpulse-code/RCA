// RCA/frontend/src/js/theme.js

(function() {
  const THEME_KEY = 'rca-theme';

  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateToggleIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
  }

  function updateToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }

  function setupToggleButton() {
    const existingBtn = document.getElementById('theme-toggle');
    if (existingBtn) {
      // Ensure it has the correct class (if placed in a header, we may not want the fixed class)
      if (!existingBtn.classList.contains('theme-toggle-btn')) {
        existingBtn.classList.add('theme-toggle-btn');
      }
      // Attach click listener (removes any previous duplicate, though safe)
      existingBtn.removeEventListener('click', toggleTheme);
      existingBtn.addEventListener('click', toggleTheme);
      return;
    }
    // Create floating button if none exists
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle-btn';
    btn.addEventListener('click', toggleTheme);
    document.body.appendChild(btn);
  }

  // Apply stored theme immediately to avoid flash
  const saved = getStoredTheme();
  applyTheme(saved);

  // Setup button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggleButton);
  } else {
    setupToggleButton();
  }
})();
// end of RCA/frontend/src/js/theme.js