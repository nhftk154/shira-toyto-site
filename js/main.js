(() => {
  const FRAMES = 60;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const src = i => `assets/frames/f${String(i + 1).padStart(3, '0')}.jpg`;

  /* ---------- frame sequence (hero logo reveal) ---------- */
  const canvas = document.getElementById('logo');
  const ctx = canvas.getContext('2d');
  const imgs = new Array(FRAMES);
  let current = -1;
  let target = 0;

  const draw = i => {
    let k = i; // nearest loaded frame at or below i
    while (k > 0 && !(imgs[k] && imgs[k].complete && imgs[k].naturalWidth)) k--;
    const im = imgs[k];
    if (!im || !im.naturalWidth || k === current) return;
    current = k;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
  };

  const load = i => {
    if (imgs[i]) return;
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { if (i === target) draw(i); };
    im.src = src(i);
    imgs[i] = im;
  };

  load(0);
  load(FRAMES - 1);
  const rest = () => { for (let i = 1; i < FRAMES - 1; i++) load(i); };
  ('requestIdleCallback' in window) ? requestIdleCallback(rest, { timeout: 1200 }) : setTimeout(rest, 400);

  const copy = document.getElementById('heroCopy');
  const glow = document.querySelector('.hero__glow');
  const hint = document.getElementById('hint');
  const fab = document.querySelector('.wa-fab');
  const heroEl = document.getElementById('hero');

  /* ---------- lazy 3D crystal (only when the contact section is near) ---------- */
  const gem = document.getElementById('gem');
  const lowPower = navigator.connection && (navigator.connection.saveData || /2g/.test(navigator.connection.effectiveType || ''));
  if (gem && !reduce && !lowPower && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (es[0].isIntersecting) {
        io.disconnect();
        import('./crystal.js').then(m => m.startCrystal(gem)).catch(() => {});
      }
    }, { rootMargin: '600px 0px' });
    io.observe(gem);
  }

  // the hero has its own CTAs, so the floating button appears only after it
  const fabCheck = () => fab.classList.toggle('is-hidden', heroEl.getBoundingClientRect().bottom > innerHeight * 1.05);
  fab.classList.add('is-hidden');
  addEventListener('scroll', fabCheck, { passive: true });

  // floating header: transparent on the hero, glass after; dark over dark sections; hides when scrolling down
  const bar = document.getElementById('top');
  let lastY = scrollY;
  const barCheck = () => {
    const y = scrollY;
    const past = heroEl.getBoundingClientRect().bottom < 120;
    bar.classList.toggle('is-stuck', y > 40);
    bar.classList.toggle('is-dark', past);
    if (!past || y < lastY - 4) bar.classList.remove('is-hidden');
    else if (y > lastY + 4) bar.classList.add('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', barCheck, { passive: true });
  barCheck();

  if (reduce) {
    fab.classList.remove('is-hidden');
    const last = imgs[FRAMES - 1];
    const show = () => { target = FRAMES - 1; draw(FRAMES - 1); };
    last.complete && last.naturalWidth ? show() : last.addEventListener('load', show);
    return;
  }

  /* ---------- smooth scroll + scrubbed hero ---------- */
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const tl = gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
  tl.to({}, { duration: 1 }, 0);
  ScrollTrigger.create({
    trigger: '#hero', start: 'top top', end: 'bottom bottom',
    onUpdate: s => {
      target = Math.round(Math.min(1, s.progress / 0.62) * (FRAMES - 1));
      draw(target);
    }
  });
  tl.to(glow, { opacity: 1, duration: 0.3 }, 0.25)
    .to(copy, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }, 0.62)
    .to(hint, { opacity: 0, duration: 0.08 }, 0.02);

  /* ---------- section reveals (after content has been rendered) ---------- */
  (window.contentReady || Promise.resolve()).then(() => {
    gsap.utils.toArray('.reveal').forEach(n => {
      gsap.from(n, {
        y: 34, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: n, start: 'top 90%', once: true }
      });
    });
    gsap.from('.card', {
      y: 40, opacity: 0, duration: 0.8, stagger: 0.09, ease: 'power3.out',
      scrollTrigger: { trigger: '#rail', start: 'top 88%', once: true }
    });
    gsap.fromTo('#gem', { yPercent: 8 }, {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: '#contact', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    ScrollTrigger.refresh();
  });

  /* ---------- gentle gold sparks ---------- */
  const sc = document.getElementById('sparks');
  const sx = sc.getContext('2d');
  let W, H, parts = [];
  let heroVisible = true;
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(heroEl);
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = sc.width = sc.clientWidth * d; H = sc.height = sc.clientHeight * d;
    parts = Array.from({ length: innerWidth < 700 ? 22 : 44 }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.6 + .6) * d,
      v: (Math.random() * .25 + .08) * d, a: Math.random() * Math.PI * 2, s: Math.random() * .02 + .008
    }));
  };
  fit(); addEventListener('resize', fit);
  const tick = () => {
    if (heroVisible) {
      sx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.v; p.a += p.s;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        sx.globalAlpha = (Math.sin(p.a) * .5 + .5) * .55;
        sx.fillStyle = '#D9B26F';
        sx.beginPath(); sx.arc(p.x, p.y, p.r, 0, 6.283); sx.fill();
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
})();
