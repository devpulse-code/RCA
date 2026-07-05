// RCA/frontend/src/js/splash.js

window.addEventListener('DOMContentLoaded', () => {
    const loadingBar = document.getElementById('loading-bar');

    // After all letters have finished their animation (max delay 0.5s + duration 0.7s)
    setTimeout(() => {
        loadingBar.classList.add('active');
    }, 1300);  // slightly after the last letter appears

    // After the loading bar has filled and a short pause, fade out and redirect
    // Total splash duration approx. 3.5 seconds
    setTimeout(() => {
        document.body.classList.add('fade-out');
    }, 3200);

    // Redirect after fade-out
    setTimeout(() => {
        window.location.href = '/index.html';   // or '/pages/ddm/login.html' if you prefer
    }, 4000);
});
// end of RCA/frontend/src/js/splash.js