// RCA/frontend/src/js/ddm-login.js
import { passcodeLogin } from '../services/ddm/auth-service.js';

const form = document.getElementById('passcode-form');
const passcodeInput = document.getElementById('passcode');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');
const rateLimitEl = document.getElementById('rate-limit-countdown');

let countdownInterval = null;

function clearError() {
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    rateLimitEl.style.display = 'none';
    rateLimitEl.textContent = '';
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function showError(text) {
    errorMessage.textContent = text;
    errorMessage.style.display = 'block';
}

function showRateLimit(retryAfterSeconds) {
    showError('Too many attempts. Please wait.');
    rateLimitEl.style.display = 'block';
    let seconds = retryAfterSeconds;
    const update = () => {
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            rateLimitEl.textContent = 'You may try again.';
            return;
        }
        rateLimitEl.textContent = `Try again in ${seconds} second${seconds !== 1 ? 's' : ''}`;
        seconds--;
    };
    update();
    countdownInterval = setInterval(update, 1000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const passcode = passcodeInput.value.trim();
    if (!passcode) {
        showError('Please enter a passcode.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
        await passcodeLogin(passcode);
        navigateTo('/pages/ddm/dashboard.html');
    } catch (err) {
        let message = 'Login failed. Please try again.';
        let retryAfter = null;
        try {
            const body = typeof err.message === 'string' ? JSON.parse(err.message) : null;
            if (body && body.error === 'rate_limit_exceeded') {
                retryAfter = body.retry_after;
            } else if (body && body.detail) {
                message = body.detail;
            }
        } catch (_) {
            message = err.message || message;
        }

        if (retryAfter) {
            showRateLimit(retryAfter);
        } else {
            showError(message);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

// Load public announcements with themed markup
(async function loadPublicAnnouncements() {
    const container = document.getElementById('public-announcements');
    if (!container) return;
    try {
        const res = await fetch('/api/public/announcements');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        if (data.length === 0) {
            container.innerHTML = '<p class="text-muted" style="font-style: italic;">No public announcements.</p>';
            return;
        }
        let html = '<h2 class="text-primary">Announcements</h2>';
        data.forEach(a => {
            html += `
                <div class="announcement-item">
                    <h3>${escapeHtml(a.title)}</h3>
                    <p>${escapeHtml(a.body)}</p>
                    <span class="text-sm text-muted">${new Date(a.created_at).toLocaleDateString()}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        console.warn('Could not load public announcements:', err);
        container.innerHTML = '';
    }
})();

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
// end of RCA/frontend/src/js/ddm-login.js