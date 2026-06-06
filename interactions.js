/* ============================================================
   interactions.js — Phase 2
   Magnetic cursor lerp · Card 3D tilt · Glitch titre ·
   Stagger scroll cards · Counter IntersectionObserver
   Repo : Yonnix-dev/website-yonnix
   Charge ce fichier APRÈS le DOM :
   <script src="interactions.js" defer></script>
   ============================================================ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     0. HELPERS
  ───────────────────────────────────────────── */
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─────────────────────────────────────────────
     1. MAGNETIC CURSOR AMÉLIORÉ (LERP smooth)
     Remplace le cursor basique de index.html
     en ajoutant une traînée fluide et des états
     contextuels (texte, hover card, hover btn)
  ───────────────────────────────────────────── */
  (function initCursor() {
    const dot  = document.getElementById('cursor');
    const ring = document.getElementById('cursor-ring');
    if (!dot || !ring || prefersReducedMotion()) return;

    let mouse = { x: -200, y: -200 };
    let dotPos  = { x: -200, y: -200 };
    let ringPos = { x: -200, y: -200 };
    let isHidden = false;
    let rafId;

    /* Vitesses de lerp */
    const DOT_SPEED  = 0.9;   /* dot suit presque instantanément */
    const RING_SPEED = 0.11;  /* ring traîne — effet magnétique */

    document.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      isHidden = true;
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      isHidden = false;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    });

    function tick() {
      if (!isHidden) {
        dotPos.x  = lerp(dotPos.x,  mouse.x, DOT_SPEED);
        dotPos.y  = lerp(dotPos.y,  mouse.y, DOT_SPEED);
        ringPos.x = lerp(ringPos.x, mouse.x, RING_SPEED);
        ringPos.y = lerp(ringPos.y, mouse.y, RING_SPEED);

        dot.style.left  = dotPos.x  + 'px';
        dot.style.top   = dotPos.y  + 'px';
        ring.style.left = ringPos.x + 'px';
        ring.style.top  = ringPos.y + 'px';
      }
      rafId = requestAnimationFrame(tick);
    }
    tick();

    /* États contextuels */
    const interactives = document.querySelectorAll(
      'a, button, .social-card, .service-card, .discord-banner, input, textarea, select'
    );

    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.style.cssText  += ';width:18px;height:18px;';
        ring.style.cssText += ';width:64px;height:64px;border-color:rgba(251,191,36,.2);';
      });
      el.addEventListener('mouseleave', () => {
        dot.style.cssText  += ';width:10px;height:10px;';
        ring.style.cssText += ';width:40px;height:40px;border-color:rgba(251,191,36,.55);';
      });
    });
  })();


  /* ─────────────────────────────────────────────
     2. CARD 3D TILT — perspective CSS + tracking
     S'applique sur .tilt (déjà présent dans HTML)
     + .tilt-card (classes futures)
     Améliore la version existante avec :
     — perspective parent dynamic
     — smooth lerp sur les rotations
     — highlight lumineux qui suit la souris
  ───────────────────────────────────────────── */
  (function initTilt() {
    if (prefersReducedMotion()) return;

    const INTENSITY = 8;        /* degrés max de rotation */
    const SCALE     = 1.025;
    const LERP_SPD  = 0.12;

    document.querySelectorAll('.tilt, .tilt-card').forEach(card => {
      let rx = 0, ry = 0;
      let targetRx = 0, targetRy = 0;
      let rafId = null;
      let active = false;

      /* Injecte le highlight si pas déjà présent */
      if (!card.querySelector('.tilt-highlight')) {
        const hl = document.createElement('div');
        hl.className = 'tilt-highlight';
        hl.style.cssText = [
          'position:absolute', 'inset:0', 'pointer-events:none',
          'border-radius:inherit', 'opacity:0',
          'background:radial-gradient(circle at var(--tx,50%) var(--ty,50%), rgba(251,191,36,.13) 0%, transparent 55%)',
          'transition:opacity .35s cubic-bezier(0.16,1,0.3,1)', 'z-index:1'
        ].join(';');
        card.style.position = card.style.position || 'relative';
        card.appendChild(hl);
      }

      const hl = card.querySelector('.tilt-highlight');

      function animateTilt() {
        rx = lerp(rx, targetRx, LERP_SPD);
        ry = lerp(ry, targetRy, LERP_SPD);

        card.style.transform = [
          `perspective(900px)`,
          `rotateX(${rx}deg)`,
          `rotateY(${ry}deg)`,
          `scale(${active ? SCALE : 1})`
        ].join(' ');

        if (active || Math.abs(rx) > 0.01 || Math.abs(ry) > 0.01) {
          rafId = requestAnimationFrame(animateTilt);
        } else {
          card.style.transform = '';
          rafId = null;
        }
      }

      card.addEventListener('mousemove', e => {
        const rect  = card.getBoundingClientRect();
        const xNorm = (e.clientX - rect.left) / rect.width  - 0.5;  /* -0.5 .. 0.5 */
        const yNorm = (e.clientY - rect.top)  / rect.height - 0.5;

        targetRy = xNorm * INTENSITY;
        targetRx = -yNorm * INTENSITY;

        const tx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1) + '%';
        const ty = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1) + '%';
        card.style.setProperty('--tx', tx);
        card.style.setProperty('--ty', ty);
        if (hl) hl.style.setProperty('--tx', tx), hl.style.setProperty('--ty', ty);
      }, { passive: true });

      card.addEventListener('mouseenter', () => {
        active = true;
        if (hl) hl.style.opacity = '1';
        if (!rafId) rafId = requestAnimationFrame(animateTilt);
      });

      card.addEventListener('mouseleave', () => {
        active = false;
        targetRx = 0;
        targetRy = 0;
        if (hl) hl.style.opacity = '0';
        if (!rafId) rafId = requestAnimationFrame(animateTilt);
      });
    });
  })();


  /* ─────────────────────────────────────────────
     3. GLITCH EFFECT — titre hero au hover
     S'applique sur #heroTitle et .glitch
     Technique : pseudo-elements CSS + data-text,
     déclenchés par classe JS .is-glitching
  ───────────────────────────────────────────── */
  (function initGlitch() {
    if (prefersReducedMotion()) return;

    /* Injecte les keyframes glitch une seule fois */
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

    /* Cible le titre hero + tout élément .glitch */
    const heroTitle = document.getElementById('heroTitle');
    const glitchEls = document.querySelectorAll('.glitch');

    function applyGlitch(el) {
      /* data-text = texte brut pour les pseudo-elements */
      if (!el.dataset.text) {
        el.dataset.text = el.textContent.trim();
      }
      el.classList.add('glitch');

      el.addEventListener('mouseenter', () => {
        el.classList.add('is-glitching');
        clearTimeout(el._glitchTimer);
        el._glitchTimer = setTimeout(() => el.classList.remove('is-glitching'), 450);
      });

      /* Glitch aléatoire toutes les 6-12s pour le héro */
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
     4. STAGGER ANIMATIONS — cards au scroll
     via IntersectionObserver
     Ajoute .anim-visible + delay calculé
     sur les enfants de .stagger-grid
  ───────────────────────────────────────────── */
  (function initStagger() {
    /* Injecte les styles de stagger */
    if (!document.getElementById('stagger-styles')) {
      const style = document.createElement('style');
      style.id = 'stagger-styles';
      style.textContent = `
        /* fallback visible */
        .stagger-item {
          opacity: 1;
        }

        /* quand JS est actif, on masque d'abord */
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

    if (prefersReducedMotion()) return;

    /* Grilles ciblées */
    const grids = document.querySelectorAll(
      '.socials-grid, .services-grid, .stagger-grid'
    );

    grids.forEach(grid => {
      const items = Array.from(grid.children);

      /* Prépare les items */
      items.forEach((item, i) => {
        item.classList.add('stagger-item', 'anim-ready');
        item.style.transitionDelay = (i * 80) + 'ms';
      });

      /* Un seul observer par grille */
      const io = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const item = entry.target;
              item.classList.add('anim-visible');
              io.unobserve(item);
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
      );

      items.forEach(item => io.observe(item));
    });
  })();


  /* ─────────────────────────────────────────────
     5. COUNTER ANIMATION
     via IntersectionObserver
     Cible : <span class="counter" data-target="42">0</span>
     Utilise les classes CSS de animations.css Phase 1
  ───────────────────────────────────────────── */
  (function initCounters() {
    if (prefersReducedMotion()) return;

    const counters = document.querySelectorAll('.counter[data-target]');
    if (!counters.length) return;

    const easeOut = t => 1 - Math.pow(1 - t, 3);  /* cubic ease-out */

    function animateCounter(el, target, duration) {
      el.classList.add('counter--active');
      const start = performance.now();
      const from  = parseInt(el.textContent, 10) || 0;

      function step(now) {
        const elapsed  = now - start;
        const progress = clamp(elapsed / duration, 0, 1);
        const value    = Math.round(lerp(from, target, easeOut(progress)));

        el.textContent = value;

        /* tick CSS flash */
        el.classList.remove('counter--tick');
        void el.offsetWidth; /* reflow pour re-déclencher l'anim */
        el.classList.add('counter--tick');

        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = parseInt(el.dataset.target, 10);
            const dur    = parseInt(el.dataset.duration || 1800, 10);
            if (!isNaN(target)) animateCounter(el, target, dur);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(c => io.observe(c));
  })();


  /* ─────────────────────────────────────────────
     6. MAGNETIC BUTTONS AMÉLIORÉS
     Remplace la version basique de index.html
     avec un effet push/pull plus prononcé
     et un reset spring au mouseleave
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
