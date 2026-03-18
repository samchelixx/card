/* ======================================================
   samchelixx — CARD v3 · Interactive Engine
   Custom cursor, spring physics, text scramble,
   reactive particles, 3D tilt, magnetic elements,
   entrance orchestration — all 60fps on mobile
   ====================================================== */
(function () {
    'use strict';

    /* ---------- DEVICE DETECTION ---------- */
    const isTouch = matchMedia('(hover:none)').matches;
    const isMobile = window.innerWidth < 600;
    const prefersReduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

    let mx = innerWidth / 2, my = innerHeight / 2;

    if (!isTouch) {
        window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    }

    /* ---------- LOADER + ENTRANCE ---------- */
    const loader = document.getElementById('loader');
    const reveals = document.querySelectorAll('[data-reveal]');

    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loader) loader.classList.add('is-done');
            // Stagger reveals
            reveals.forEach(el => {
                const i = parseInt(el.dataset.reveal, 10) || 0;
                setTimeout(() => el.classList.add('is-visible'), 200 + i * 120);
            });
        }, 900);
    });

    /* ---------- CUSTOM CURSOR ---------- */
    const cursor = document.getElementById('cursor');

    if (!isTouch && cursor) {
        const dotEl = cursor.querySelector('.cursor__dot');
        const ringEl = cursor.querySelector('.cursor__ring');
        let rx = mx, ry = my;

        const hoverEls = document.querySelectorAll('.link, .skill, .badge, .avatar, .hero__name-text');
        hoverEls.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
        });
        document.addEventListener('mousedown', () => cursor.classList.add('is-click'));
        document.addEventListener('mouseup', () => cursor.classList.remove('is-click'));

        (function loop() {
            rx += (mx - rx) * 0.14;
            ry += (my - ry) * 0.14;
            dotEl.style.transform = `translate(${mx - 2.5}px, ${my - 2.5}px)`;
            ringEl.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
            requestAnimationFrame(loop);
        })();
    }

    /* ---------- PARTICLE SYSTEM ---------- */
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
        W = canvas.width = innerWidth;
        H = canvas.height = innerHeight;
    }

    const PARTICLE_DENSITY = isMobile ? 25000 : 14000;
    const MAX_PARTICLES = isMobile ? 60 : 110;
    const CONNECT_DIST = isMobile ? 90 : 100;
    const CONNECT_DIST_SQ = CONNECT_DIST * CONNECT_DIST;
    const REPEL_RADIUS = isMobile ? 80 : 110;

    class P {
        constructor() { this.init(); }
        init() {
            this.x = Math.random() * W;
            this.y = Math.random() * H;
            this.r = Math.random() * 1.4 + 0.3;
            this.bvx = (Math.random() - .5) * .18;
            this.bvy = (Math.random() - .5) * .18;
            this.vx = this.bvx;
            this.vy = this.bvy;
            this.o = Math.random() * .3 + .06;
            this.p = Math.random() * Math.PI * 2;
        }
        update() {
            if (!isTouch) {
                const dx = this.x - mx, dy = this.y - my;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < REPEL_RADIUS && d > 0) {
                    const f = (1 - d / REPEL_RADIUS) * 1.5;
                    this.vx += (dx / d) * f;
                    this.vy += (dy / d) * f;
                }
            }
            this.vx += (this.bvx - this.vx) * .035;
            this.vy += (this.bvy - this.vy) * .035;
            this.x += this.vx;
            this.y += this.vy;
            this.p += .01;

            if (this.x < -4) this.x = W + 4;
            if (this.x > W + 4) this.x = -4;
            if (this.y < -4) this.y = H + 4;
            if (this.y > H + 4) this.y = -4;
        }
        draw() {
            const alpha = this.o + Math.sin(this.p) * .1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, 6.283);
            ctx.fillStyle = `rgba(155,142,255,${alpha})`;
            ctx.fill();
        }
    }

    let dots = [];

    function initDots() {
        dots = [];
        const count = Math.min(Math.floor((W * H) / PARTICLE_DENSITY), MAX_PARTICLES);
        for (let i = 0; i < count; i++) dots.push(new P());
    }

    function drawLines() {
        for (let i = 0, l = dots.length; i < l; i++) {
            for (let j = i + 1; j < l; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const d = dx * dx + dy * dy;
                if (d < CONNECT_DIST_SQ) {
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.strokeStyle = `rgba(124,106,239,${.05 * (1 - Math.sqrt(d) / CONNECT_DIST)})`;
                    ctx.lineWidth = .4;
                    ctx.stroke();
                }
            }
        }
    }

    function animParticles() {
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < dots.length; i++) { dots[i].update(); dots[i].draw(); }
        if (!isMobile) drawLines();
        requestAnimationFrame(animParticles);
    }

    if (!prefersReduced) {
        resize();
        initDots();
        animParticles();
        window.addEventListener('resize', () => { resize(); initDots(); });
    }

    /* ---------- CARD 3D TILT + PARALLAX ---------- */
    const card = document.getElementById('card');
    const cardWrap = document.getElementById('cardWrap');
    const spotlight = document.getElementById('cardSpotlight');
    const depthEls = card ? card.querySelectorAll('[data-depth]') : [];

    if (card && !isTouch) {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            // Edge damping — reduce effect near corners
            const edgeX = 1 - Math.pow(Math.abs(x - .5) * 2, 2) * .6;
            const edgeY = 1 - Math.pow(Math.abs(y - .5) * 2, 2) * .6;
            const damp = Math.min(edgeX, edgeY);

            const rotX = (y - .5) * -4 * damp;
            const rotY = (x - .5) * 4 * damp;

            cardWrap.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;

            // Spotlight
            if (spotlight) {
                spotlight.style.setProperty('--sx', (x * 100) + '%');
                spotlight.style.setProperty('--sy', (y * 100) + '%');
            }

            // Inner parallax (damped at edges)
            depthEls.forEach(el => {
                const d = parseFloat(el.dataset.depth);
                el.style.transform = `translate(${(x - .5) * 12 * d * damp}px, ${(y - .5) * 12 * d * damp}px)`;
            });
        });

        card.addEventListener('mouseleave', () => {
            cardWrap.style.transition = 'transform .65s cubic-bezier(.34,1.56,.64,1)';
            cardWrap.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
            depthEls.forEach(el => {
                el.style.transition = 'transform .65s cubic-bezier(.34,1.56,.64,1)';
                el.style.transform = 'translate(0,0)';
            });
            setTimeout(() => {
                cardWrap.style.transition = '';
                depthEls.forEach(el => el.style.transition = '');
            }, 650);
        });
    }

    /* Touch tilt */
    if (card && isTouch && cardWrap) {
        let touching = false;
        card.addEventListener('touchstart', e => { touching = true; tilt(e); }, { passive: true });
        card.addEventListener('touchmove', e => { if (touching) tilt(e); }, { passive: true });
        card.addEventListener('touchend', () => {
            touching = false;
            cardWrap.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
            cardWrap.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
            setTimeout(() => cardWrap.style.transition = '', 500);
        });
        function tilt(e) {
            const t = e.touches[0], r = card.getBoundingClientRect();
            const x = (t.clientX - r.left) / r.width;
            const y = (t.clientY - r.top) / r.height;
            cardWrap.style.transform = `perspective(900px) rotateX(${(y-.5)*-4}deg) rotateY(${(x-.5)*4}deg)`;
        }
    }

    /* ---------- CLICK RIPPLE ---------- */
    const ripples = document.getElementById('ripples');
    if (card && ripples) {
        card.addEventListener('click', e => {
            const r = card.getBoundingClientRect();
            const size = Math.max(r.width, r.height);
            const rEl = document.createElement('div');
            rEl.className = 'ripple';
            rEl.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px`;
            ripples.appendChild(rEl);
            rEl.addEventListener('animationend', () => rEl.remove());
        });
    }

    /* ---------- MAGNETIC ELEMENTS ---------- */
    if (!isTouch) {
        document.querySelectorAll('[data-magnetic]').forEach(el => {
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height / 2;
                const power = el.classList.contains('link') ? .18 : .22;
                el.style.transform = `translate(${(e.clientX-cx)*power}px,${(e.clientY-cy)*power}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform .45s cubic-bezier(.34,1.56,.64,1)';
                el.style.transform = 'translate(0,0)';
                setTimeout(() => el.style.transition = '', 450);
            });
        });
    }

    /* ---------- LINK SPOTLIGHT ---------- */
    document.querySelectorAll('.link').forEach(link => {
        // Set per-button color variable
        const c = link.dataset.color;
        if (c) link.style.setProperty('--lc', c);

        link.addEventListener('mousemove', e => {
            const r = link.getBoundingClientRect();
            link.style.setProperty('--bx', (e.clientX - r.left) + 'px');
            link.style.setProperty('--by', (e.clientY - r.top) + 'px');
        });
    });

    /* ---------- SKILL GLOW ---------- */
    document.querySelectorAll('.skill').forEach(sk => {
        sk.addEventListener('mousemove', e => {
            const r = sk.getBoundingClientRect();
            sk.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
            sk.style.setProperty('--my', ((e.clientY-r.top)/r.height*100)+'%');
        });
    });

    /* ---------- TEXT SCRAMBLE ---------- */
    const nameEl = document.querySelector('.hero__name-text');
    if (nameEl) {
        const original = nameEl.dataset.value;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?';
        let scrambling = false;

        function scramble() {
            if (scrambling) return;
            scrambling = true;
            let iter = 0;
            const interval = setInterval(() => {
                nameEl.textContent = original.split('').map((ch, idx) => {
                    if (idx < iter) return original[idx];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');
                iter += 1 / 2;
                if (iter >= original.length) {
                    nameEl.textContent = original;
                    clearInterval(interval);
                    scrambling = false;
                }
            }, 30);
        }

        if (!isTouch) {
            nameEl.addEventListener('mouseenter', scramble);
        } else {
            nameEl.addEventListener('touchstart', scramble, { passive: true });
        }
    }

    /* ---------- EMAIL COPY ---------- */
    const emailLink = document.getElementById('link-email');
    if (emailLink) {
        emailLink.addEventListener('click', e => {
            e.preventDefault();
            navigator.clipboard.writeText('samchelixx@gmail.com').then(() => {
                const val = emailLink.querySelector('.link__value');
                const orig = val.textContent;
                val.textContent = '✓ Скопировано!';
                val.style.color = '#00e676';
                setTimeout(() => { val.textContent = orig; val.style.color = ''; }, 2000);
            }).catch(() => {
                location.href = 'mailto:samchelixx@gmail.com';
            });
        });
    }

    /* ---------- BORDER ANGLE FALLBACK (Firefox) ---------- */
    if (typeof CSS === 'undefined' || !CSS.supports || !CSS.supports('syntax', '"<angle>"')) {
        let ang = 0;
        const wrap = document.querySelector('.card-wrap');
        const ring = document.querySelector('.avatar__ring');

        (function fb() {
            ang = (ang + .6) % 360;
            const g = `conic-gradient(from ${ang}deg, #7c6aef, hsl(220,80%,55%), #7c6aef)`;
            if (wrap) { wrap.style.background = g; wrap.style.setProperty('--a', ang+'deg'); }
            if (ring) ring.style.background = g;
            requestAnimationFrame(fb);
        })();
    }

})();
