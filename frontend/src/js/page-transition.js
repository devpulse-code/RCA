// RCA/frontend/src/js/page-transition.js
(function() {
  window.navigateTo = function(url) {
    const wrapper = document.getElementById('page-transition-wrapper');
    if (!wrapper) {
      window.location.href = url;
      return;
    }
    wrapper.classList.add('page-transition-exit');
    wrapper.addEventListener('transitionend', function handler(e) {
      if (e.propertyName === 'opacity') {
        wrapper.removeEventListener('transitionend', handler);
        window.location.href = url;
      }
    });
    setTimeout(() => {
      window.location.href = url;
    }, 500);
  };

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target) return;
    if (href.startsWith('/') || href.startsWith(window.location.origin) || !href.includes('://')) {
      e.preventDefault();
      navigateTo(href);
    }
  });

  window.addEventListener('load', function() {
    const wrapper = document.getElementById('page-transition-wrapper');
    if (wrapper) {
      wrapper.classList.add('page-transition-enter');
      requestAnimationFrame(() => {
        wrapper.classList.remove('page-transition-enter');
      });
    }
  });
})();
// end of RCA/frontend/src/js/page-transition.js