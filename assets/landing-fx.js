/* Landing FX motion: scroll-linked stickers, slap-on reveals, scroll-boosted marquees,
   fit-to-width headlines. One requestAnimationFrame loop for the whole page.
   Loaded by every Landing FX section; the guard makes repeat loads a no-op. */
(() => {
  if (window.LandingFX) {
    window.LandingFX.scan(document);
    return;
  }

  const root = document.documentElement;
  root.classList.add('js-lfx');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const movers = new Set();
  const marquees = new Set();
  const fits = new Set();
  const onScreen = new WeakMap();

  const visibility = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => onScreen.set(e.target, e.isIntersecting));
      dirty = true;
    },
    { rootMargin: '250px 0px' }
  );

  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          reveal.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -12% 0px', threshold: 0.2 }
  );

  /* ---------- Fit-to-width headline lines ---------- */
  function fit(el) {
    /* Rows never get taller than ~19% of the screen height, so the image and button
       still show above the fold on laptops. */
    const max = Math.min(
      parseFloat(window.innerWidth < 750 ? el.dataset.maxMobile : el.dataset.max) || 200,
      Math.max(56, window.innerHeight * 0.19)
    );
    const width = el.clientWidth;
    if (!width) return;
    let last = 0;
    el.querySelectorAll('[data-lfx-line]').forEach((line) => {
      line.style.fontSize = '100px';
      const w = line.getBoundingClientRect().width;
      if (w) {
        last = Math.min(max, (100 * width) / w) * 0.995;
        line.style.fontSize = last + 'px';
      }
    });
    if (last) el.parentElement.style.setProperty('--lfx-last-size', last.toFixed(1) + 'px');
    el.classList.add('is-fitted');
  }

  const fitResize = new ResizeObserver((entries) => entries.forEach((e) => fit(e.target)));

  /* ---------- Sticker text: shrink to fit its shape ---------- */
  const labels = new Set();
  function fitLabel(el) {
    const inner = el.firstElementChild;
    if (!inner) return;
    el.style.fontSize = '';
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h || !inner.offsetWidth) return;
    const k = Math.min(1, w / inner.offsetWidth, h / inner.offsetHeight);
    if (k < 1) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * k * 0.94 + 'px';
  }

  /* ---------- Marquee bands ---------- */
  function initMarquee(el) {
    const track = el.querySelector('.lfx-band__track');
    const group = track && track.firstElementChild;
    if (!group) return;
    const m = {
      el,
      track,
      group,
      x: 0,
      width: group.getBoundingClientRect().width,
      speed: parseFloat(el.dataset.speed) || 80,
      dir: el.dataset.direction === 'right' ? 1 : -1,
      boost: el.dataset.boost === 'true' ? 1 : 0,
    };
    if (m.dir === 1) m.x = -m.width;
    new ResizeObserver(() => {
      m.width = group.getBoundingClientRect().width;
    }).observe(group);
    el.classList.add('is-js');
    marquees.add(m);
    visibility.observe(el);
  }

  /* ---------- Scan (also re-run in the theme editor) ---------- */
  function scan(scope) {
    const s = scope || document;
    s.querySelectorAll('[data-lfx-motion]').forEach((el) => {
      if (el.__lfxMove) return;
      el.__lfxMove = true;
      movers.add(el);
      visibility.observe(el);
    });
    s.querySelectorAll('.lfx-sticker.is-slap').forEach((el) => {
      if (el.__lfxReveal) return;
      el.__lfxReveal = true;
      if (reduce.matches) el.classList.add('is-in');
      else reveal.observe(el);
    });
    s.querySelectorAll('[data-lfx-marquee]').forEach((el) => {
      if (el.__lfxMarquee) return;
      el.__lfxMarquee = true;
      initMarquee(el);
    });
    s.querySelectorAll('.lfx-sticker__text').forEach((el) => {
      if (el.__lfxLabel) return;
      el.__lfxLabel = true;
      labels.add(el);
      fitLabel(el);
    });
    s.querySelectorAll('[data-lfx-fit]').forEach((el) => {
      if (el.__lfxFit) return;
      el.__lfxFit = true;
      fits.add(el);
      fit(el);
      fitResize.observe(el);
    });
    dirty = true;
  }

  function prune() {
    movers.forEach((el) => !el.isConnected && movers.delete(el));
    marquees.forEach((m) => !m.el.isConnected && marquees.delete(m));
    fits.forEach((el) => !el.isConnected && fits.delete(el));
    labels.forEach((el) => !el.isConnected && labels.delete(el));
  }

  /* ---------- Scroll-linked motion ---------- */
  function updateMovers() {
    const vh = window.innerHeight;
    movers.forEach((el) => {
      if (onScreen.get(el) === false) return;
      const kind = el.dataset.lfxMotion;
      const strength = parseFloat(el.dataset.lfxStrength) || 1;
      const dir = el.dataset.lfxDir === '-1' ? -1 : 1;

      /* Where the element sits relative to the middle of the screen, measured without our own
         transform (offsetParent box + offsetTop): 0 = centred, -1/+1 = a screen above/below.
         Motion is tied to this, so every sticker shows its designed angle when it is centred
         and text stays readable. */
      const parent = el.offsetParent;
      if (!parent) return;
      const center = parent.getBoundingClientRect().top + el.offsetTop + (el.dataset.lfxCentered ? 0 : el.offsetHeight / 2);
      const p = Math.max(-1.2, Math.min(1.2, (center - vh / 2) / vh));

      if (kind === 'spin') {
        el.style.setProperty('--fx-r', (p * -90 * strength * dir).toFixed(2) + 'deg');
      } else if (kind === 'drift') {
        el.style.setProperty('--fx-y', (p * -110 * strength).toFixed(1) + 'px');
        el.style.setProperty('--fx-r', (p * -12 * strength * dir).toFixed(2) + 'deg');
      } else if (kind === 'travel') {
        el.style.setProperty('--fx-x', (p * -160 * strength * dir).toFixed(1) + 'px');
        el.style.setProperty('--fx-r', (p * -40 * strength * dir).toFixed(2) + 'deg');
      }
    });
  }

  let lastY = window.scrollY;
  let lastT = performance.now();
  let scrollVelocity = 0;
  let dirty = true;

  window.addEventListener('scroll', () => (dirty = true), { passive: true });
  window.addEventListener('resize', () => {
    dirty = true;
    fits.forEach(fit);
    labels.forEach(fitLabel);
  });

  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000) || 0.016;
    lastT = t;

    if (!reduce.matches) {
      const y = window.scrollY;
      const instant = Math.min(4000, Math.abs(y - lastY) / dt);
      lastY = y;
      scrollVelocity += (instant - scrollVelocity) * 0.12;

      marquees.forEach((m) => {
        if (onScreen.get(m.el) === false || !m.width) return;
        const v = m.speed + scrollVelocity * 0.35 * m.boost;
        m.x += m.dir * v * dt;
        if (m.x <= -m.width) m.x += m.width;
        if (m.x > 0) m.x -= m.width;
        m.track.style.transform = 'translate3d(' + m.x.toFixed(2) + 'px,0,0)';
      });

      if (dirty) {
        dirty = false;
        updateMovers();
      }
    }
    requestAnimationFrame(frame);
  }

  window.LandingFX = { scan, fit };

  const start = () => {
    scan(document);
    requestAnimationFrame(frame);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fits.forEach(fit);
        labels.forEach(fitLabel);
      });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  document.addEventListener('shopify:section:load', (e) => scan(e.target));
  document.addEventListener('shopify:section:unload', () => setTimeout(prune, 0));
})();
