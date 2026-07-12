// RCA/frontend/src/js/theme.js
(function() {
  const THEME_KEY = 'rca-theme';
  // Default to light theme
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
    // Show sun for dark mode (to switch to light), moon for light mode (to switch to dark)
    btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
  // Create toggle button if not exists
  function createToggleButton() {
    if (document.getElementById('theme-toggle')) return;
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle-btn';
    btn.addEventListener('click', toggleTheme);
    document.body.appendChild(btn);
  }
  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    const saved = getStoredTheme();
    applyTheme(saved);
    createToggleButton();
  });
})();
// end of RCA/frontend/src/js/theme.js