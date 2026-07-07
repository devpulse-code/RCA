// RCA/frontend/src/js/home.js

// ── Constellation Canvas ──────────────────────────────
const canvas = document.getElementById('observatory-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let nodes = [];
const NODE_COUNT = 55;
const CONNECT_DIST = 120;
const MOUSE_RADIUS = 80;
let mouse = { x: null, y: null };

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    initNodes();
}

function initNodes() {
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: Math.random() * 2 + 1.5,
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        if (mouse.x !== null) {
            const dx = n.x - mouse.x;
            const dy = n.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS) {
                n.vx += (dx / dist) * 0.5;
                n.vy += (dy / dist) * 0.5;
            }
        }

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        n.vx *= 0.99;
        n.vy *= 0.99;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(13,94,140,0.8)';
        ctx.fill();
    }

    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONNECT_DIST) {
                const opacity = 1 - dist / CONNECT_DIST;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(13,94,140,${opacity * 0.2})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }
    }

    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

resize();
window.addEventListener('resize', resize);
draw();

// ── Typewriter Headline ───────────────────────────────
const headlineEl = document.getElementById('headline');
const text = 'Research & Communication Assistant';
let charIndex = 0;

function typeHeadline() {
    if (charIndex < text.length) {
        headlineEl.textContent += text.charAt(charIndex);
        charIndex++;
        setTimeout(typeHeadline, 80 + Math.random() * 60);
    }
}
setTimeout(typeHeadline, 600);

// ── Live Data Points (real data via API) ──────────────
async function fetchStats() {
    try {
        const response = await fetch('/api/ddm/public/stats');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        // Update DOM
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
        // Fallback to static values (you can remove this if you want them blank)
        setData('doc-count', '—');
        setData('session-count', '—');
        setData('last-update', '—');
    }
}

function setData(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

// Fetch immediately and then every 60 seconds
fetchStats();
setInterval(fetchStats, 60000);

// ── DDM Access Button ──────────────────────────────────
document.getElementById('ddm-access-btn').addEventListener('click', () => {
    window.location.href = '/pages/ddm/login.html';
});

// end of RCA/frontend/src/js/home.js