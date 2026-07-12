// RCA/frontend/src/js/splash.js

window.addEventListener('DOMContentLoaded', () => {
    const loadingBar = document.getElementById('loading-bar');

    setTimeout(() => {
        loadingBar.classList.add('active');
    }, 1300);

    setTimeout(() => {
        document.body.classList.add('fade-out');
    }, 3200);

    setTimeout(() => {
        navigateTo('/pages/home.html');
    }, 4000);
});
// end of RCA/frontend/src/js/splash.js