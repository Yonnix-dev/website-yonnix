/* ============================================================
   interactions.js — Phase 2 (FIX merge)
   Gardé UNIQUEMENT les features utiles non dupliquées avec index.html :
   - Glitch titre hero
   - Stagger grid sur .socials-grid / .services-grid / .stagger-grid
   - Counters
   - Magnetic amélioré
   Le cursor et le tilt sont déjà gérés proprement par index.html → supprimés ici
   ============================================================ */

(function () {
  'use strict';

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────────────────────────
     1. GLITCH EFFECT — titre hero au hover
  ───────────────────────────────────────────── */
  (function initGlitch() {
    if (prefersReducedMotion()) return;

    if (!document.getElementById('glitch-styles')) {
      const style = document.createElement('style');
      style.id = 'glitch-styles';
      style.textContent = `
        .glitch { position: relative; display: inline-block; }
        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          inset: 0;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
          white-space: nowrap;
          font: inherit;
          letter-spacing: inherit;
          -webkit-text-fill-color: inherit;
          background: inherit;
          -webkit-background-clip: inherit;
          background-clip: inherit;
        }
        .glitch.is-glitching::before {
          animation: glitch-slice-1 0.42s steps(2) both;
          clip-path: polygon(0 0, 100% 0, 100% 38%, 0 38%);
          left: 2px;
          color: #4f98a3;
          -webkit-text-fill-color: #4f98a3;
          background: none;
          opacity: 1;
        }
        .glitch.is-glitching::after {
          animation: glitch-slice-2 0.42s steps(2) both;
          clip-path: polygon(0 62%, 100% 62%, 100% 100%, 0 100%);
          left: -2px;
          color: #a86fdf;
          -webkit-text-fill-color: #a86fdf;
          background: none;
          opacity: 1;
        }
        @keyframes glitch-slice-1 {
          0%  { transform: translate(0);        clip-path: polygon(0 0,  100% 0,  100% 33%, 0 33%); }
          20% { transform: translate(-4px, 1px); clip-path: polygon(0 15%, 100% 15%, 100% 50%, 0 50%); }
          40% { transform: translate(3px, -1px); clip-path: polygon(0 5%,  100% 5%,  100% 28%, 0 28%); }
          60% { transform: translate(-2px, 2px); clip-path: polygon(0 20%, 100% 20%, 100% 42%, 0 42%); }
          80% { transform: translate(2px); }
          100%{ transform: translate(0);        opacity: 0; }
        }
        @keyframes glitch-slice-2 {
          0%  { transform: translate(0);        clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); }
          20% { transform: translate(4px, -1px); clip-path: polygon(0 65%, 100% 65%, 100% 90%, 0 90%); }
          40% { transform: translate(-3px, 1px); clip-path: polygon(0 58%, 100% 58%, 100% 82%, 0 82%); }
          60% { transform: translate(2px, -2px); clip-path: polygon(0 70%, 100% 70%, 100% 95%, 0 95%); }
          80% { transform: translate(-2px); }
          100%{ transform: translate(0);        opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const heroTitle = document.getElementById('heroTitle');
    const glitchEls = document.querySelectorAll('.glitch');

    function applyGlitch(el) {
      if (!el.dataset.text) {
        el.dataset.text = el.textContent.trim();
      }
      el.classList.add('glitch');

      el.addEventListener('mouseenter', () => {
        el.classList.add('is-glitching');
        clearTimeout(el._glitchTimer);
        el._glitchTimer = setTimeout(() => el.classList.remove('is-glitching'), 450);
      });

      if (el.id === 'heroTitle') {
        const randomGlitch = () => {
          el.classList.add('is-glitching');
          setTimeout(() => el.classList.remove('is-glitching'), 450);
          setTimeout(randomGlitch, 6000 + Math.random() * 6000);
        };
        setTimeout(randomGlitch, 4000);
      }
    }

    if (heroTitle) applyGlitch(heroTitle);
    glitchEls.forEach(applyGlitch);
  })();

  /* ─────────────────────────────────────────────
     2. STAGGER ANIMATIONS — .socials-grid / .services-grid / .stagger-grid
  ───────────────────────────────────────────── */
  (function initStagger() {
    if (prefersReducedMotion()) return;

    if (!document.getElementById('stagger-styles')) {
      const style = document.createElement('style');
      style.id = 'stagger-styles';
      style.textContent = `
        .stagger-item { opacity: 1; }
        .stagger-item.anim-ready {
          opacity: 0;
          clip-path: inset(0 0 20px 0);
          transition:
            opacity 0.75s cubic-bezier(0.16,1,0.3,1),
            clip-path 0.75s cubic-bezier(0.16,1,0.3,1);
        }
        .stagger-item.anim-visible {
          opacity: 1;
          clip-path: inset(0 0 0 0);
        }
        @media (prefers-reduced-motion: reduce) {
          .stagger-item.anim-ready,
          .stagger-item.anim-visible {
            opacity: 1 !important;
            clip-path: none !important;
            transition: none !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const grids = document.querySelectorAll('.socials-grid, .services-grid, .stagger-grid');

    grids.forEach(grid => {
      const items = Array.from(grid.children);

      items.forEach((item, i) => {
        item.classList.add('stagger-item', 'anim-ready');
        item.style.transitionDelay = (i * 80) + 'ms';
      });

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const item = entry.target;
            item.classList.add('anim-visible');
            io.unobserve(item);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
      });

      items.forEach(item => io.observe(item));
    });
  })();

  /* ─────────────────────────────────────────────
     3. COUNTER ANIMATION
  ───────────────────────────────────────────── */
  (function initCounters() {
    if (prefersReducedMotion()) return;

    const counters = document.querySelectorAll('.counter[data-target]');
    if (!counters.length) return;

    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function animateCounter(el, target, duration) {
      el.classList.add('counter--active');
      const start = performance.now();
      const from  = parseInt(el.textContent, 10) || 0;

      function step(now) {
        const elapsed  = now - start;
        const progress = clamp(elapsed / duration, 0, 1);
        const value    = Math.round(lerp(from, target, easeOut(progress)));

        el.textContent = value;
        el.classList.remove('counter--tick');
        void el.offsetWidth;
        el.classList.add('counter--tick');

        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el     = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const dur    = parseInt(el.dataset.duration || 1800, 10);
          if (!isNaN(target)) animateCounter(el, target, dur);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => io.observe(c));
  })();

  /* ─────────────────────────────────────────────
     4. MAGNETIC BUTTONS AMÉLIORÉS
  ───────────────────────────────────────────── */
  (function initMagnetic() {
    if (prefersReducedMotion()) return;

    document.querySelectorAll('.magnetic').forEach(el => {
      const STRENGTH = 0.32;
      let cx = 0, cy = 0, rafId = null;
      let targetX = 0, targetY = 0;

      function springBack() {
        cx = lerp(cx, targetX, 0.14);
        cy = lerp(cy, targetY, 0.14);
        el.style.transform = `translate(${cx}px, ${cy}px)`;
        if (Math.abs(cx - targetX) > 0.1 || Math.abs(cy - targetY) > 0.1) {
          rafId = requestAnimationFrame(springBack);
        } else {
          el.style.transform = `translate(${targetX}px, ${targetY}px)`;
          rafId = null;
        }
      }

      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        targetX = (e.clientX - r.left - r.width  / 2) * STRENGTH;
        targetY = (e.clientY - r.top  - r.height / 2) * STRENGTH;
        if (!rafId) rafId = requestAnimationFrame(springBack);
      }, { passive: true });

      el.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(springBack);
      });
    });
  })();

})();
