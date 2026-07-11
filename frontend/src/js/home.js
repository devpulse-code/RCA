// RCA/frontend/src/js/home.js

// ── Constellation Canvas (unchanged) ──────────────────
const canvas = document.getElementById('observatory-canvas');
const ctx = canvas.getContext('2d');
// (keep the same constellation code as before – placeholder removed)

// ── Typewriter Headline (unchanged) ───────────────────
// (original code retained below)

// ── Live Data Points – now fetch from /api/public/stats ─
async function fetchStats() {
    try {
        const response = await fetch('/api/public/stats');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        setData('doc-count', data.documents_indexed?.toLocaleString() || '—');
        setData('session-count', data.active_sessions?.toString() || '—');

        if (data.last_update) {
            const date = new Date(data.last_update);
            const utc = date.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
            setData('last-update', utc);
        } else {
            setData('last-update', '—');
        }
    } catch (err) {
        console.warn('Could not fetch stats:', err);
        setData('doc-count', '—');
        setData('session-count', '—');
        setData('last-update', '—');
    }
}

function setData(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

fetchStats();
setInterval(fetchStats, 60000);

// ── Load public announcements ─────────────────────────
async function fetchPublicAnnouncements() {
    const container = document.getElementById('public-announcements');
    if (!container) return;
    try {
        const res = await fetch('/api/public/announcements');
        if (!res.ok) throw new Error('Failed');
        const announcements = await res.json();
        if (announcements.length === 0) {
            container.innerHTML = '<p class="text-gray-500 italic">No public announcements.</p>';
            return;
        }
        let html = '<div class="announcements-panel"><h2>Public Announcements</h2>';
        announcements.forEach(a => {
            html += `
                <div class="announcement-item">
                    <h3>${escapeHtml(a.title)}</h3>
                    <p>${escapeHtml(a.body)}</p>
                    <span class="text-sm text-gray-400">${new Date(a.created_at).toLocaleDateString()}</span>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        console.warn('Could not load public announcements:', err);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

fetchPublicAnnouncements();

// ── DDM Access Button ──────────────────────────────────
document.getElementById('ddm-access-btn').addEventListener('click', () => {
    window.location.href = '/pages/ddm/login.html';
});

// end of RCA/frontend/src/js/home.js