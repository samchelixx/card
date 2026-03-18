/* ============================================
   Interactive engine — cursor, magnetic, parallax,
   reactive particles, glitch, ripple
   ============================================ */
(function () {
    'use strict';

    const isTouch = matchMedia('(hover: none)').matches;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    /* ------- CUSTOM CURSOR ------- */
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let ringX = mouseX, ringY = mouseY;

    if (!isTouch && dot && ring) {
        document.addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            dot.style.left = mouseX + 'px';
            dot.style.top = mouseY + 'px';
        });

        (function animateRing() {
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            ring.style.left = ringX + 'px';
            ring.style.top = ringY + 'px';
            requestAnimationFrame(animateRing);
        })();

        // Hover states for interactive elements
        const hoverTargets = document.querySelectorAll('.glass-btn, .skill, .badge, .avatar-wrap, .name__text');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                dot.classList.add('is-hover');
                ring.classList.add('is-hover');
            });
            el.addEventListener('mouseleave', () => {
                dot.classList.remove('is-hover');
                ring.classList.remove('is-hover');
            });
        });

        // Click pulse
        document.addEventListener('mousedown', () => ring.classList.add('is-click'));
        document.addEventListener('mouseup', () => ring.classList.remove('is-click'));
    }

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
            this.r = Math.random() * 1.6 + 0.3;
            this.baseVx = (Math.random() - 0.5) * 0.2;
            this.baseVy = (Math.random() - 0.5) * 0.2;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.baseOpacity = Math.random() * 0.35 + 0.08;
            this.opacity = this.baseOpacity;
            this.pulse = Math.random() * Math.PI * 2;
        }
        update() {
            // Mouse repulsion
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const repelRadius = 120;

            if (dist < repelRadius && dist > 0) {
                const force = (1 - dist / repelRadius) * 1.8;
                this.vx += (dx / dist) * force;
                this.vy += (dy / dist) * force;
            }

            // Friction — return to base velocity
            this.vx += (this.baseVx - this.vx) * 0.04;
            this.vy += (this.baseVy - this.vy) * 0.04;

            this.x += this.vx;
            this.y += this.vy;
            this.pulse += 0.012;
            this.opacity = this.baseOpacity + Math.sin(this.pulse) * 0.12;

            if (this.x < -5) this.x = pW + 5;
            if (this.x > pW + 5) this.x = -5;
            if (this.y < -5) this.y = pH + 5;
            if (this.y > pH + 5) this.y = -5;
        }
        draw() {
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            pCtx.fillStyle = `rgba(160, 148, 255, ${this.opacity})`;
            pCtx.fill();
        }
    }

    let dots = [];

    function initDots() {
        dots = [];
        const count = Math.min(Math.floor((pW * pH) / 12000), 120);
        for (let i = 0; i < count; i++) dots.push(new Dot());
    }

    function drawConnections() {
        const maxDist = 110;
        const maxDistSq = maxDist * maxDist;
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const d = dx * dx + dy * dy;
                if (d < maxDistSq) {
                    pCtx.beginPath();
                    pCtx.moveTo(dots[i].x, dots[i].y);
                    pCtx.lineTo(dots[j].x, dots[j].y);
                    pCtx.strokeStyle = `rgba(108, 92, 231, ${0.06 * (1 - Math.sqrt(d) / maxDist)})`;
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
        resizeParticles();
        initDots();
    });

    /* ------- CARD 3D TILT + PARALLAX ------- */
    const card = document.getElementById('card');
    const parallaxLayers = card ? card.querySelectorAll('[data-depth]') : [];

    if (card && !isTouch) {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            const rx = (y - 0.5) * -6;
            const ry = (x - 0.5) * 6;

            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;

            // Parallax inner elements
            parallaxLayers.forEach(layer => {
                const depth = parseFloat(layer.dataset.depth) || 0;
                const moveX = (x - 0.5) * 20 * depth;
                const moveY = (y - 0.5) * 20 * depth;
                layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });
        });

        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)';
            card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';

            parallaxLayers.forEach(layer => {
                layer.style.transition = 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)';
                layer.style.transform = 'translate(0, 0)';
            });

            setTimeout(() => {
                card.style.transition = '';
                parallaxLayers.forEach(l => (l.style.transition = ''));
            }, 700);
        });
    }

    /* ------- TOUCH TILT (mobile) ------- */
    if (card && isTouch) {
        let touching = false;

        card.addEventListener('touchstart', e => {
            touching = true;
            handleTouch(e);
        }, { passive: true });

        card.addEventListener('touchmove', e => {
            if (touching) handleTouch(e);
        }, { passive: true });

        card.addEventListener('touchend', () => {
            touching = false;
            card.style.transition = 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)';
            card.style.transform = 'perspective(900px) rotateX(0) rotateY(0) scale(1)';
            setTimeout(() => (card.style.transition = ''), 600);
        });

        function handleTouch(e) {
            const t = e.touches[0];
            const r = card.getBoundingClientRect();
            const x = (t.clientX - r.left) / r.width;
            const y = (t.clientY - r.top) / r.height;
            const rx = (y - 0.5) * -4;
            const ry = (x - 0.5) * 4;
            card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.01)`;
        }
    }

    /* ------- CLICK RIPPLE ------- */
    const rippleContainer = document.getElementById('rippleContainer');
    if (card && rippleContainer) {
        card.addEventListener('click', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            const size = Math.max(r.width, r.height);

            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.left = (x - size / 2) + 'px';
            ripple.style.top = (y - size / 2) + 'px';

            rippleContainer.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    }

    /* ------- MAGNETIC BUTTONS ------- */
    const magneticEls = document.querySelectorAll('[data-magnetic]');

    if (!isTouch) {
        magneticEls.forEach(el => {
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const dx = (e.clientX - cx) * 0.2;
                const dy = (e.clientY - cy) * 0.2;
                el.style.transform = `translate(${dx}px, ${dy}px)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
                el.style.transform = 'translate(0, 0)';
                setTimeout(() => (el.style.transition = ''), 500);
            });
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

    /* ------- NAME GLITCH ------- */
    const nameText = document.querySelector('.name__text');
    if (nameText && !isTouch) {
        let glitchTimeout;
        nameText.addEventListener('mouseenter', () => {
            nameText.classList.add('is-glitching');
            clearTimeout(glitchTimeout);
            glitchTimeout = setTimeout(() => nameText.classList.remove('is-glitching'), 300);
        });
    }

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

    /* ------- BORDER ANGLE FALLBACK (Firefox) ------- */
    if (!CSS.supports || !CSS.supports('syntax', '"<angle>"')) {
        let angle = 0;
        const borderEl = document.querySelector('.card-border');
        const avatarRing = document.querySelector('.avatar-ring');
        const avatarGlow = document.querySelector('.avatar-glow');

        function animateBorder() {
            angle = (angle + 0.7) % 360;
            const grad = `conic-gradient(from ${angle}deg, hsl(260,75%,55%), hsl(220,85%,55%), hsl(260,75%,55%))`;

            if (borderEl) {
                borderEl.style.background = grad;
                borderEl.style.setProperty('--border-angle', angle + 'deg');
            }
            if (avatarRing) avatarRing.style.background = grad;
            if (avatarGlow) avatarGlow.style.background = grad;

            requestAnimationFrame(animateBorder);
        }
        animateBorder();
    }
})();
