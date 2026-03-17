/* ============================================
   smoke + particles + interactions
   ============================================ */
(function () {
    'use strict';

    /* ------- SMOKE CANVAS ------- */
    const smokeCanvas = document.getElementById('smoke');
    const sCtx = smokeCanvas.getContext('2d');
    let sW, sH;

    function resizeSmoke() {
        sW = smokeCanvas.width = window.innerWidth;
        sH = smokeCanvas.height = window.innerHeight;
    }

    class SmokeParticle {
        constructor() { this.reset(true); }
        reset(init) {
            this.x = Math.random() * sW;
            this.y = init ? Math.random() * sH : sH + 50;
            this.r = Math.random() * 120 + 60;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = -(Math.random() * 0.6 + 0.15);
            this.opacity = 0;
            this.maxOpacity = Math.random() * 0.06 + 0.02;
            this.life = 0;
            this.maxLife = Math.random() * 500 + 300;
            const hues = [260, 210, 320, 170];
            this.hue = hues[Math.floor(Math.random() * hues.length)] + (Math.random() - 0.5) * 30;
        }
        update() {
            this.life++;
            this.x += this.vx + Math.sin(this.life * 0.008) * 0.3;
            this.y += this.vy;
            const progress = this.life / this.maxLife;
            if (progress < 0.15) {
                this.opacity = this.maxOpacity * (progress / 0.15);
            } else if (progress > 0.7) {
                this.opacity = this.maxOpacity * (1 - (progress - 0.7) / 0.3);
            } else {
                this.opacity = this.maxOpacity;
            }
            if (this.life >= this.maxLife) this.reset(false);
        }
        draw() {
            const grad = sCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
            grad.addColorStop(0, `hsla(${this.hue}, 60%, 50%, ${this.opacity})`);
            grad.addColorStop(1, `hsla(${this.hue}, 60%, 50%, 0)`);
            sCtx.fillStyle = grad;
            sCtx.beginPath();
            sCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            sCtx.fill();
        }
    }

    let smokeParts = [];

    function initSmoke() {
        smokeParts = [];
        const count = Math.min(Math.floor((sW * sH) / 18000), 60);
        for (let i = 0; i < count; i++) smokeParts.push(new SmokeParticle());
    }

    function animateSmoke() {
        sCtx.clearRect(0, 0, sW, sH);
        smokeParts.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateSmoke);
    }

    resizeSmoke();
    initSmoke();
    animateSmoke();

    /* ------- PARTICLE CANVAS ------- */
    const pCanvas = document.getElementById('particles');
    const pCtx = pCanvas.getContext('2d');
    let pW, pH;

    function resizeParticles() {
        pW = pCanvas.width = window.innerWidth;
        pH = pCanvas.height = window.innerHeight;
    }

    class Dot {
        constructor() { this.init(); }
        init() {
            this.x = Math.random() * pW;
            this.y = Math.random() * pH;
            this.r = Math.random() * 1.8 + 0.4;
            this.vx = (Math.random() - 0.5) * 0.25;
            this.vy = (Math.random() - 0.5) * 0.25;
            this.baseOpacity = Math.random() * 0.45 + 0.1;
            this.opacity = this.baseOpacity;
            this.pulse = Math.random() * Math.PI * 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.pulse += 0.015;
            this.opacity = this.baseOpacity + Math.sin(this.pulse) * 0.15;
            if (this.x < -5) this.x = pW + 5;
            if (this.x > pW + 5) this.x = -5;
            if (this.y < -5) this.y = pH + 5;
            if (this.y > pH + 5) this.y = -5;
        }
        draw() {
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(170, 160, 255, ${this.opacity})`;
            pCtx.fill();
        }
    }

    let dots = [];

    function initDots() {
        dots = [];
        const count = Math.min(Math.floor((pW * pH) / 10000), 140);
        for (let i = 0; i < count; i++) dots.push(new Dot());
    }

    function drawConnections() {
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const d = dx * dx + dy * dy;
                if (d < 14400) { // 120^2
                    pCtx.beginPath();
                    pCtx.moveTo(dots[i].x, dots[i].y);
                    pCtx.lineTo(dots[j].x, dots[j].y);
                    pCtx.strokeStyle = `rgba(108, 92, 231, ${0.08 * (1 - Math.sqrt(d) / 120)})`;
                    pCtx.lineWidth = 0.5;
                    pCtx.stroke();
                }
            }
        }
    }

    function animateDots() {
        pCtx.clearRect(0, 0, pW, pH);
        dots.forEach(d => { d.update(); d.draw(); });
        drawConnections();
        requestAnimationFrame(animateDots);
    }

    resizeParticles();
    initDots();
    animateDots();

    window.addEventListener('resize', () => {
        resizeSmoke();
        initSmoke();
        resizeParticles();
        initDots();
    });

    /* ------- CARD 3D TILT ------- */
    const card = document.getElementById('card');
    if (card && window.matchMedia('(pointer: fine)').matches) {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            const rx = (y - 0.5) * -8;
            const ry = (x - 0.5) * 8;
            card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.015)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
            setTimeout(() => (card.style.transition = ''), 600);
        });
    }

    /* ------- GLASS BUTTON SPOTLIGHT ------- */
    document.querySelectorAll('.glass-btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            btn.style.setProperty('--bx', (e.clientX - r.left) + 'px');
            btn.style.setProperty('--by', (e.clientY - r.top) + 'px');
        });
    });

    /* ------- SKILL GLOW FOLLOW ------- */
    document.querySelectorAll('.skill').forEach(sk => {
        sk.addEventListener('mousemove', e => {
            const r = sk.getBoundingClientRect();
            sk.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            sk.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    });

    /* ------- EMAIL COPY ------- */
    const emailBtn = document.getElementById('btn-email');
    if (emailBtn) {
        emailBtn.addEventListener('click', e => {
            e.preventDefault();
            navigator.clipboard.writeText('samchelixx@gmail.com').then(() => {
                const val = emailBtn.querySelector('.glass-btn__value');
                const orig = val.textContent;
                val.textContent = '✓ Скопировано!';
                val.style.color = '#00e676';
                setTimeout(() => { val.textContent = orig; val.style.color = ''; }, 1800);
            }).catch(() => {
                window.location.href = 'mailto:samchelixx@gmail.com';
            });
        });
    }

    /* ------- ANIMATED BORDER ANGLE (fallback for browsers without @property) ------- */
    // The CSS @property handles this natively in Chrome/Edge.
    // For Firefox fallback, we animate via JS:
    if (!CSS.supports || !CSS.supports('syntax', '"<angle>"')) {
        let angle = 0;
        const borderEl = document.querySelector('.card-border');
        const avatarRing = document.querySelector('.avatar-ring');
        const avatarGlow = document.querySelector('.avatar-glow');

        function animateBorder() {
            angle = (angle + 0.9) % 360;
            const grad = `conic-gradient(from ${angle}deg, hsl(260,80%,60%), hsl(210,90%,60%), hsl(170,80%,50%), hsl(320,80%,55%), hsl(40,90%,55%), hsl(260,80%,60%))`;
            const avatarGrad = `conic-gradient(from ${angle}deg, hsl(260,80%,60%), hsl(320,80%,55%), hsl(210,90%,60%), hsl(260,80%,60%))`;

            if (borderEl) {
                borderEl.style.background = grad;
                borderEl.style.setProperty('--border-angle', angle + 'deg');
            }
            if (avatarRing) avatarRing.style.background = avatarGrad;
            if (avatarGlow) avatarGlow.style.background = avatarGrad;

            requestAnimationFrame(animateBorder);
        }
        animateBorder();
    }
})();
