// RCA/frontend/src/js/home.js
(function() {
    const canvas = document.getElementById('observatory-canvas');
    const ctx = canvas.getContext('2d');
    const accessNode = document.getElementById('access-node');
    let width, height;
    let particles = [];
    const PARTICLE_COUNT = 700;
    const ASSEMBLY_RADIUS = 220;          // mouse distance to trigger assembly
    const MOUSE_INFLUENCE = 150;          // range for cursor repulsion

    // Target positions for RCA letters (pre‑computed by sampling text on an off‑screen canvas)
    let targetPositions = [];
    let mouseX = -1000, mouseY = -1000;
    let wordmarkAssembled = false;
    let assemblyProgress = 0;              // 0–1, smoothed
    let nodeVisible = false;

    // ----- compute target coordinates from text -----
    function generateTextTargets() {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 800;
        offCanvas.height = 200;
        const offCtx = offCanvas.getContext('2d');
        offCtx.fillStyle = '#FFFFFF';
        offCtx.font = 'bold 160px "Playfair Display", serif';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText('RCA', 400, 100);
        const imageData = offCtx.getImageData(0, 0, 800, 200);
        const positions = [];
        // sample every n‑th pixel to reduce density
        for (let y = 0; y < 200; y += 3) {
            for (let x = 0; x < 800; x += 3) {
                const idx = (y * 800 + x) * 4;
                if (imageData.data[idx] > 128) {
                    positions.push({ x: x, y: y });
                }
            }
        }
        return positions;
    }

    // scale target positions to fit current canvas size (centered)
    function scaleTargets(targets, w, h) {
        const scaleX = w / 800;
        const scaleY = h / 200;
        const scale = Math.min(scaleX, scaleY) * 0.85; // slightly smaller
        const offsetX = w / 2;
        const offsetY = h / 2;
        return targets.map(p => ({
            x: (p.x - 400) * scale + offsetX,
            y: (p.y - 100) * scale + offsetY
        }));
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        // re‑scale target positions
        const rawTargets = generateTextTargets();
        targetPositions = scaleTargets(rawTargets, width, height);
        // reset particles if necessary (keep them but update target refs)
        if (particles.length > 0) {
            particles.forEach(p => {
                p.target = targetPositions[Math.floor(Math.random() * targetPositions.length)];
            });
        }
    }

    // ----- Particle class -----
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.baseX = this.x;
            this.baseY = this.y;
            this.vx = (Math.random() - 0.5) * 0.7;
            this.vy = (Math.random() - 0.5) * 0.7;
            this.size = Math.random() * 1.8 + 0.8;
            this.life = Math.random() * 1.5 + 0.2;
            this.target = targetPositions.length > 0 
                ? targetPositions[Math.floor(Math.random() * targetPositions.length)] 
                : { x: width/2, y: height/2 };
        }

        update(progress) {
            // progress = how strongly the particle is pulled toward its target (0-1)
            const targetX = this.target.x;
            const targetY = this.target.y;

            // move toward target based on assembly progress
            const dxTarget = targetX - this.x;
            const dyTarget = targetY - this.y;
            const distToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
            const pullForce = progress * 0.12;

            this.x += dxTarget * pullForce + (this.vx * (1 - progress * 0.9));
            this.y += dyTarget * pullForce + (this.vy * (1 - progress * 0.9));

            // subtle mouse repulsion when assembly is low
            if (progress < 0.6) {
                const dxMouse = this.x - mouseX;
                const dyMouse = this.y - mouseY;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                if (distMouse < MOUSE_INFLUENCE) {
                    const angle = Math.atan2(dyMouse, dxMouse);
                    const force = (MOUSE_INFLUENCE - distMouse) / MOUSE_INFLUENCE * 1.2;
                    this.x += Math.cos(angle) * force;
                    this.y += Math.sin(angle) * force;
                }
            }

            // boundary wrap
            if (this.x < 0) this.x += width;
            if (this.x > width) this.x -= width;
            if (this.y < 0) this.y += height;
            if (this.y > height) this.y -= height;
        }

        draw(ctx, progress) {
            const alpha = 0.2 + progress * 0.7;
            ctx.fillStyle = progress > 0.5 
                ? `rgba(13,94,140,${alpha})` 
                : `rgba(200,220,240,${alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ----- Initialize particles -----
    function initParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }
        // assign random targets
        if (targetPositions.length > 0) {
            particles.forEach(p => {
                p.target = targetPositions[Math.floor(Math.random() * targetPositions.length)];
            });
        }
    }

    // ----- draw connections (network lines) -----
    function drawConnections(ctx, progress) {
        ctx.strokeStyle = `rgba(13,94,140,${0.08 + progress * 0.12})`;
        ctx.lineWidth = 0.6;
        for (let i = 0; i < particles.length; i += 2) {
            const p1 = particles[i];
            for (let j = i + 1; j < particles.length; j += 2) {
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 70) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }

    // ----- main animation loop -----
    function animate() {
        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, width, height);

        // compute assembly progress based on mouse distance to center
        const centerX = width / 2;
        const centerY = height / 2;
        const distToCenter = Math.hypot(mouseX - centerX, mouseY - centerY);
        const targetProgress = Math.max(0, Math.min(1, 1 - distToCenter / ASSEMBLY_RADIUS));
        
        // smooth transition
        assemblyProgress += (targetProgress - assemblyProgress) * 0.08;

        // determine if wordmark is essentially assembled
        wordmarkAssembled = assemblyProgress > 0.85;

        // update and draw particles
        particles.forEach(p => p.update(assemblyProgress));
        drawConnections(ctx, assemblyProgress);
        particles.forEach(p => p.draw(ctx, assemblyProgress));

        // draw custom reticle
        ctx.fillStyle = '#0D5E8C';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(13,94,140,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 8, 0, Math.PI*2);
        ctx.stroke();

        // show access node when wordmark assembled
        if (wordmarkAssembled && !nodeVisible) {
            accessNode.classList.remove('node-hidden');
            accessNode.classList.add('node-visible');
            nodeVisible = true;
        } else if (!wordmarkAssembled && nodeVisible) {
            accessNode.classList.add('node-hidden');
            accessNode.classList.remove('node-visible');
            nodeVisible = false;
        }
    }

    // ----- event listeners -----
    window.addEventListener('resize', () => {
        resize();
        // re‑assign targets to existing particles
        particles.forEach(p => {
            p.target = targetPositions[Math.floor(Math.random() * targetPositions.length)];
        });
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // touch support (basic)
    window.addEventListener('touchmove', (e) => {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }, { passive: true });

    // click on access node navigates to DDM login
    accessNode.addEventListener('click', () => {
        window.location.href = '/pages/ddm/login.html';
    });

    // start everything
    resize();
    initParticles();
    animate();
})();
// end of RCA/frontend/src/js/home.js