/* ============================================================
   micro.js — Phase 5
   Floating labels · Validation temps réel ·
   Section transitions · Parallax multi-couches
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. FLOATING LABELS + VALIDATION TEMPS RÉEL ── */
  function initFloatingLabels() {
    // Transforme les .form-group existants en .form-float
    // et ajoute la validation en temps réel
    const groups = document.querySelectorAll('.form-group');

    groups.forEach(group => {
      const input = group.querySelector('input, textarea');
      const label = group.querySelector('label');
      if (!input || !label) return;

      // Passer en mode floating
      group.classList.add('form-float');

      // Assure que le placeholder est un espace (nécessaire pour :placeholder-shown)
      if (!input.placeholder) input.placeholder = ' ';

      // Icone de validation
      const icon = document.createElement('span');
      icon.className = 'input-icon';
      icon.setAttribute('aria-hidden', 'true');
      group.appendChild(icon);

      // Message d'erreur
      const errorMsg = document.createElement('span');
      errorMsg.className = 'field-error';
      errorMsg.setAttribute('aria-live', 'polite');
      group.appendChild(errorMsg);

      function validate(showError) {
        const val = input.value.trim();
        let valid = true;
        let msg = '';

        if (input.required && !val) {
          valid = false;
          msg = 'Ce champ est requis.';
        } else if (input.type === 'email' && val) {
          const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRe.test(val)) {
            valid = false;
            msg = 'Adresse email invalide.';
          }
        } else if (input.id === 'ticketDiscord' && val) {
          // Discord username : pas de # obligatoire depuis 2023
          if (val.length < 2) {
            valid = false;
            msg = 'Pseudo Discord trop court.';
          }
        } else if (input.tagName === 'TEXTAREA' && input.required && val.length < 10) {
          valid = false;
          msg = 'Décris un peu plus ton projet (10 caractères min).';
        }

        // Applique classes
        if (!val && !input.required) {
          // Champ optionnel vide → état neutre
          input.classList.remove('input-valid', 'input-error');
          icon.classList.remove('show');
          errorMsg.classList.remove('show');
          return true;
        }

        if (valid) {
          input.classList.add('input-valid');
          input.classList.remove('input-error');
          icon.textContent = '✓';
          icon.style.color = '#86efac';
          icon.classList.add('show');
          errorMsg.textContent = '';
          errorMsg.classList.remove('show');
        } else if (showError) {
          input.classList.add('input-error');
          input.classList.remove('input-valid');
          icon.textContent = '✕';
          icon.style.color = '#fca5a5';
          icon.classList.add('show');
          errorMsg.textContent = msg;
          errorMsg.classList.add('show');
        } else {
          // Pendant la frappe : retirer l'erreur visuelle mais pas encore valider
          input.classList.remove('input-valid', 'input-error');
          icon.classList.remove('show');
          errorMsg.classList.remove('show');
        }

        return valid;
      }

      // Validation live pendant la frappe (sans afficher l'erreur trop tôt)
      let typingTimer;
      input.addEventListener('input', () => {
        clearTimeout(typingTimer);
        // Valide à la volée pour montrer le ✓ mais attend 600ms pour l'erreur
        validate(false);
        typingTimer = setTimeout(() => validate(true), 600);
      });

      // Validation on blur (quand on quitte le champ)
      input.addEventListener('blur', () => {
        clearTimeout(typingTimer);
        if (input.value.trim()) validate(true);
      });

      // Reattach validate sur le form submit pour résultats corrects
      const form = input.closest('form');
      if (form) {
        form.addEventListener('submit', () => validate(true), { once: false });
      }
    });
  }

  /* ── 2. SECTION DIVIDERS + SECTION-ENTER ── */
  function initSectionTransitions() {
    // Injecte des .section-divider entre chaque section
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      const div = document.createElement('div');
      div.className = 'section-divider';
      section.parentNode.insertBefore(div, section);

      // .section-line dans les titres de section
      const title = section.querySelector('.section-title');
      if (title) {
        const line = document.createElement('span');
        line.className = 'section-line';
        title.after(line);
        observeIn(line);
      }

      observeIn(div);
    });

    // section-enter sur containers
    document.querySelectorAll('.container').forEach(el => {
      el.classList.add('section-enter');
      observeIn(el);
    });
  }

  /* ── 3. IntersectionObserver helper ── */
  function observeIn(el, threshold = 0.15) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          io.unobserve(e.target);
        }
      });
    }, { threshold, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
  }

  /* ── 4. PARALLAX MULTI-COUCHES ── */
  function initParallax() {
    // Respecte prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const gridBg = document.querySelector('.grid-bg');
    const aurora = document.querySelector('.aurora');
    const orbs   = document.querySelectorAll('.aurora-orb');
    const particles = document.querySelectorAll('.particle');

    // Vitesses relatives (ratio du scrollY)
    const SPEED_GRID       = 0.04;   // très lent
    const SPEED_AURORA     = 0.08;   // lent
    const SPEED_ORB_BASE   = 0.12;   // moyen
    const SPEED_PARTICLE   = 0.22;   // rapide

    // Assigne des vitesses aléatoires légèrement différentes à chaque particule
    particles.forEach(p => {
      const randomMult = 0.8 + Math.random() * 0.8; // 0.8 à 1.6
      p.dataset.parallaxSpeed = (SPEED_PARTICLE * randomMult).toFixed(3);
    });

    let ticking = false;
    let lastY = 0;

    function onScroll() {
      lastY = window.scrollY;
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    function update() {
      const y = lastY;

      if (gridBg) {
        gridBg.style.setProperty('--parallax-y', (y * SPEED_GRID).toFixed(1) + 'px');
      }

      if (aurora) {
        aurora.style.setProperty('--parallax-y', (y * SPEED_AURORA).toFixed(1) + 'px');
      }

      orbs.forEach((orb, i) => {
        const speed = SPEED_ORB_BASE * (1 + i * 0.15);
        orb.style.setProperty('--parallax-y', (y * speed).toFixed(1) + 'px');
        orb.style.transform = `translateY(var(--parallax-y, 0px))`;
      });

      particles.forEach(p => {
        const speed = parseFloat(p.dataset.parallaxSpeed || SPEED_PARTICLE);
        p.style.setProperty('--parallax-y', (y * speed * -1).toFixed(1) + 'px');
        // Note : multiply par -1 pour que les particules montent
        // en opposition au scroll (effet de profondeur inversé)
      });

      ticking = false;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update(); // init state
  }

  /* ── 5. COUNTER ANIMATION ── */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(el => {
      el.classList.add('stat-number');
      const target = parseInt(el.dataset.count, 10);
      const duration = parseInt(el.dataset.countDuration || '1800', 10);
      const suffix = el.dataset.countSuffix || '';
      el.textContent = '0' + suffix;

      const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          io.unobserve(el);
          animateCount(el, target, duration, suffix);
        }
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  function animateCount(el, target, duration, suffix) {
    el.classList.add('counting');
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.classList.remove('counting');
      }
    }
    requestAnimationFrame(step);
  }

  /* ── INIT ── */
  function init() {
    initFloatingLabels();
    initSectionTransitions();
    initParallax();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
