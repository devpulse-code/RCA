// RCA/frontend/src/js/rca-home.js

// Character reveal delays
document.querySelectorAll('.char-reveal').forEach((el, i) => {
    el.style.animationDelay = `${0.05 * i}s`;
});

// Scroll reveal for features
const revealElements = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });
revealElements.forEach(el => observer.observe(el));

// Interactive SVG Globe – generates a dynamic connected graph
const svg = document.getElementById('network-globe');
if (svg) {
    const ns = 'http://www.w3.org/2000/svg';
    const nodeCount = 45;
    const radius = 220;
    const centerX = 250;
    const centerY = 250;
    const nodes = [];

    // Create nodes on a sphere-like distribution
    for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = radius * Math.sin(theta);
        const x = centerX + r * Math.cos(angle);
        const y = centerY + radius * Math.cos(theta);
        const circle = document.createElementNS(ns, 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 3);
        svg.appendChild(circle);
        nodes.push({ x, y, circle });
    }

    // Draw connections between close nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const line = document.createElementNS(ns, 'line');
                line.setAttribute('x1', nodes[i].x);
                line.setAttribute('y1', nodes[i].y);
                line.setAttribute('x2', nodes[j].x);
                line.setAttribute('y2', nodes[j].y);
                svg.appendChild(line);
            }
        }
    }
}
// end of RCA/frontend/src/js/rca-home.js