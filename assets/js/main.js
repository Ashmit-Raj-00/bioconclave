/* BioConclave 2026 — site behaviour */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.documentElement.classList.replace('no-js', 'js');

  /* ---------- Mobile navigation ---------- */
  const navToggle = $('.nav-toggle');
  const nav = $('#site-nav');
  const desktop = window.matchMedia('(min-width: 961px)');

  const setNav = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  };

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setNav(false);
        navToggle.focus();
      }
    });
    desktop.addEventListener('change', (e) => { if (e.matches) setNav(false); });
  }

  /* ---------- Header: solid after hero, hides on scroll down ---------- */
  const header = $('.site-header');
  const hero = $('.hero');
  if (header && hero) {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const pastHero = y > hero.offsetTop + hero.offsetHeight - header.offsetHeight;
      header.classList.toggle('is-solid', pastHero);
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      if (!document.body.classList.contains('menu-open')) {
        if (goingDown && y > 600) header.classList.add('is-hidden');
        else if (goingUp || y < 600) header.classList.remove('is-hidden');
      }
      if (goingDown || goingUp) lastY = y;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    update();
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.site-nav ul a[href^="#"]');
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Scroll reveals + count-up ---------- */
  const countUp = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (!target || reduceMotion.matches) return;
    const dur = 1400;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  };

  const revealEls = $$('.reveal, .reveal-img');
  // Stagger siblings that enter together
  revealEls.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`);
  });

  if ('IntersectionObserver' in window) {
    const rio = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        $$('[data-count]', entry.target).forEach(countUp);
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach((el) => rio.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Pillars: image follows the cursor ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.pillar').forEach((row) => {
      row.addEventListener('pointermove', (e) => {
        const r = row.getBoundingClientRect();
        row.style.setProperty('--mx', `${e.clientX - r.left}px`);
        row.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Countdown ---------- */
  const cd = $('#countdown');
  if (cd) {
    const start = Date.parse(cd.dataset.start);
    const end = Date.parse(cd.dataset.end);
    const nums = {};
    $$('[data-unit]', cd).forEach((el) => { nums[el.dataset.unit] = el; });
    const label = $('dt', cd);
    const msg = $('.cd-message', cd);
    const pad = (n) => String(n).padStart(2, '0');
    let timer;

    const finish = (heading, text) => {
      cd.classList.add('is-done');
      label.textContent = heading;
      msg.textContent = text;
      msg.hidden = false;
      clearInterval(timer);
    };

    const tick = () => {
      const now = Date.now();
      if (now >= end) return finish('Status', 'Thank you for joining us');
      if (now >= start) return finish('Status', 'Live now on campus');
      let s = Math.floor((start - now) / 1000);
      const d = Math.floor(s / 86400); s -= d * 86400;
      const h = Math.floor(s / 3600); s -= h * 3600;
      const m = Math.floor(s / 60); s -= m * 60;
      nums.days.textContent = d;
      nums.hours.textContent = pad(h);
      nums.minutes.textContent = pad(m);
      nums.seconds.textContent = pad(s);
    };

    tick();
    if (!cd.classList.contains('is-done')) timer = setInterval(tick, 1000);
  }

  /* ---------- Copy to clipboard ---------- */
  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  };

  $$('.copy-btn').forEach((btn) => {
    const label = $('.copy-text', btn);
    btn.addEventListener('click', async () => {
      try {
        await copyText(btn.dataset.copy);
        btn.classList.add('is-copied');
        label.textContent = 'Copied';
        clearTimeout(btn._t);
        btn._t = setTimeout(() => {
          btn.classList.remove('is-copied');
          label.textContent = 'Copy';
        }, 2000);
      } catch {
        label.textContent = 'Press Ctrl+C';
      }
    });
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Registration form ---------- */
  const form = $('#reg-form');
  if (!form) return;

  const FEE_PER_PERSON = 1000;
  const typeSel = $('#f-type', form);
  const exFields = $('#exhibitor-fields', form);
  const persons = $('#f-persons', form);
  const feeTotal = $('#fee-total', form);
  const status = $('#form-status', form);
  const submitBtn = $('button[type="submit"]', form);
  const supportsUserInvalid = CSS.supports('selector(:user-invalid)');
  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const updateFee = () => {
    const n = Math.min(10, Math.max(1, parseInt(persons.value, 10) || 1));
    feeTotal.textContent = `Amount to transfer: ${inr.format(n * FEE_PER_PERSON)} (${n} × ${inr.format(FEE_PER_PERSON)})`;
  };

  const toggleExhibitor = () => {
    const isEx = typeSel.value === 'Startup exhibitor';
    exFields.hidden = !isEx;
    exFields.disabled = !isEx; // disabled fieldsets are skipped by validation & submission
    if (isEx) updateFee();
  };
  typeSel.addEventListener('change', toggleExhibitor);
  persons.addEventListener('input', updateFee);
  toggleExhibitor();

  // Only digits in phone field
  const phone = $('#f-phone', form);
  phone.addEventListener('input', () => {
    const clean = phone.value.replace(/\D/g, '').slice(0, 10);
    if (clean !== phone.value) phone.value = clean;
  });

  // Keep aria-invalid in sync with the visual (post-interaction) state.
  const touched = new WeakSet();
  const syncInvalid = (el) => {
    if (!el.willValidate) return;
    const invalid = supportsUserInvalid ? el.matches(':user-invalid') : (touched.has(el) && !el.checkValidity());
    if (!supportsUserInvalid) {
      el.classList.toggle('user-invalid-fallback', invalid);
      el.classList.toggle('user-valid-fallback', touched.has(el) && !invalid);
    }
    if (invalid) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  };

  form.addEventListener('blur', (e) => {
    if (!e.target.willValidate) return;
    touched.add(e.target);
    syncInvalid(e.target);
  }, true);
  form.addEventListener('input', (e) => {
    if (e.target.hasAttribute('aria-invalid') || e.target.classList.contains('user-invalid-fallback')) syncInvalid(e.target);
  });
  form.addEventListener('change', (e) => {
    if (touched.has(e.target) || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') {
      touched.add(e.target);
      syncInvalid(e.target);
    }
  });

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ` is-${kind}` : '');
  };

  const setBusy = (busy) => {
    submitBtn.setAttribute('aria-busy', String(busy));
    $('.btn-label', submitBtn).textContent = busy ? 'Submitting…' : 'Submit registration';
  };

  const buildMessage = (data) => {
    const lines = [
      '*BioConclave 2026 – Registration*',
      `Name: ${data.get('name')}`,
      `Email: ${data.get('email')}`,
      `Mobile: ${data.get('phone')}`,
      `Organisation: ${data.get('organisation')}`,
      `Attending as: ${data.get('category')}`,
      `Accommodation: ${data.get('accommodation')}`,
    ];
    if (data.get('category') === 'Startup exhibitor') {
      lines.push(`Startup: ${data.get('startup')}`, `Persons: ${data.get('persons')}`, `UTR: ${data.get('utr')}`);
    }
    if (data.get('message')) lines.push(`Note: ${data.get('message')}`);
    return lines.join('\n');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const fields = $$('input, select, textarea', form).filter((el) => el.willValidate);
    fields.forEach((el) => { touched.add(el); });

    if (!form.checkValidity()) {
      // Browsers treat a submit attempt as interaction, so :user-invalid now matches.
      fields.forEach(syncInvalid);
      const firstInvalid = fields.find((el) => !el.checkValidity());
      if (firstInvalid) firstInvalid.focus();
      setStatus('Please fix the highlighted fields.', 'error');
      return;
    }

    const data = new FormData(form);
    if (data.get('_gotcha')) return; // bot

    const endpoint = form.dataset.endpoint.trim();

    // No backend configured: hand off to WhatsApp with a prefilled message.
    if (!endpoint) {
      const url = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(buildMessage(data))}`;
      window.open(url, '_blank', 'noopener');
      setStatus('WhatsApp has opened with your details — tap send to complete your registration.', 'success');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
      $$('.user-invalid-fallback, .user-valid-fallback', form).forEach((el) => el.classList.remove('user-invalid-fallback', 'user-valid-fallback'));
      toggleExhibitor();
      setStatus('Thank you! Your registration has been received. We will contact you shortly.', 'success');
    } catch (err) {
      setStatus('Sorry, we could not submit the form. Please try again or call +91 72052 32542.', 'error');
    } finally {
      setBusy(false);
    }
  });
})();
