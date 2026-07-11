// RCA/frontend/src/js/home.js

// ── Constellation Canvas Animation ───────────────────
const canvas = document.getElementById('observatory-canvas');
const ctx = canvas.getContext('2d');

let stars = [];
const STAR_COUNT = 150;
const CONNECTION_DIST = 100;
const MOUSE_RADIUS = 120;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function randomStar() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        originalX: null,
        originalY: null
    };
}

for (let i = 0; i < STAR_COUNT; i++) {
    const star = randomStar();
    star.originalX = star.x;
    star.originalY = star.y;
    stars.push(star);
}

let mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let s of stars) {
        if (s.originalX !== null) {
            s.x += (s.originalX - s.x) * 0.02;
            s.y += (s.originalY - s.y) * 0.02;
        } else {
            s.x += s.speedX;
            s.y += s.speedY;
            if (s.x < 0 || s.x > canvas.width) s.speedX *= -1;
            if (s.y < 0 || s.y > canvas.height) s.speedY *= -1;
        }

        const dx = s.x - mouse.x;
        const dy = s.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
            s.x += (dx / dist) * force * 2;
            s.y += (dy / dist) * force * 2;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
        ctx.fill();
    }

    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECTION_DIST) {
                const opacity = 1 - dist / CONNECTION_DIST;
                ctx.beginPath();
                ctx.moveTo(stars[i].x, stars[i].y);
                ctx.lineTo(stars[j].x, stars[j].y);
                ctx.strokeStyle = `rgba(13, 94, 140, ${opacity * 0.25})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(draw);
}
draw();

// ── Typewriter with fade transitions ─────────────────
const headline = document.getElementById('headline');
const phrases = [
    "Turning ideas into timelines.",
    "...and now the caption perfect",
    "Great content doesn't happen by accident.",
    "One design at a time.",
    "X. Facebook. YouTube.",
    "Where ideas become posts.",
    "Draft. Design. Deliver.",
    "Creating content worth the click.",
    "We know... one more revision.",
    "Making every second watchable.",
    "Good ideas deserve great design.",
    "They should do less scrolling. More stopping.",
    "Creating tomorrow's posts today.",
    "Communicating beyond words.",
    "A post starts with an idea.",
    "Making content people actually notice.",
    "Every post has a story."
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let isPaused = false; // Used during fade transitions

function fadeOutAndChange() {
    // Start fade out
    headline.classList.add('fade-out');

    setTimeout(() => {
        // After fade out, clear text and start new phrase
        headline.textContent = '';
        charIndex = 0;
        isDeleting = false;
        headline.classList.remove('fade-out');
        // Slight delay to let the class removal register before typing starts
        setTimeout(() => {
            typeWriter();
        }, 50);
    }, 350); // Matches CSS transition duration
}

function typeWriter() {
    if (isPaused) return;

    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
        headline.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
    } else {
        headline.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        // Finished typing, wait then start fade out
        isPaused = true;
        setTimeout(() => {
            isPaused = false;
            isDeleting = true;
            fadeOutAndChange();
        }, 2000);
        return;
    } else if (isDeleting && charIndex === 0) {
        // Finished deleting (now inside fadeOutAndChange we handle phrase advancement)
        // Actually, fadeOutAndChange will handle phraseIndex change and restart.
        // So here we just stop.
        isPaused = true;
        // Advance to next phrase
        phraseIndex = (phraseIndex + 1) % phrases.length;
        fadeOutAndChange();
        return;
    }

    const speed = isDeleting ? 40 : 100;
    setTimeout(typeWriter, speed);
}

// Start the typewriter after a short delay to sync with entrance animation
setTimeout(() => {
    typeWriter();
}, 300);

// ── Live Data Points ──────────────────────────────────
async function fetchStats() {
    try {
        const response = await fetch('/api/public/stats');
        if (!response.ok) throw new Error('Failed');
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
        console.warn('Stats fetch error:', err);
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

// ── Public Announcements with fade in ────────────────
async function fetchPublicAnnouncements() {
    const container = document.getElementById('public-announcements');
    if (!container) return;

    // Set to loading state (transparent)
    container.classList.add('loading');
    container.classList.remove('loaded');

    try {
        const res = await fetch('/api/public/announcements');
        if (!res.ok) throw new Error('Failed');
        const announcements = await res.json();

        let html;
        if (!Array.isArray(announcements) || announcements.length === 0) {
            html = '<div class="announcements-panel text-center"><p class="text-dim-italic">No announcements at this time.</p></div>';
        } else {
            html = '<div class="announcements-panel"><h2>Public Announcements</h2>';
            announcements.forEach(a => {
                html += `
                    <div class="announcement-item">
                        <h3>${escapeHtml(a.title)}</h3>
                        <p>${escapeHtml(a.body)}</p>
                        <span class="announcement-date">${new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html;
        // Trigger reflow to ensure transition works
        void container.offsetWidth;
        container.classList.remove('loading');
        container.classList.add('loaded');
    } catch (err) {
        console.warn('Announcements fetch error:', err);
        container.innerHTML = '<div class="announcements-panel text-center"><p class="text-dim-italic">Unable to load announcements.</p></div>';
        void container.offsetWidth;
        container.classList.remove('loading');
        container.classList.add('loaded');
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