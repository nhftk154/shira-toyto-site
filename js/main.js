(() => {
  // phones get a lighter sequence (30 frames at 540px, about a third of the download)
  const SMALL = matchMedia('(max-width: 699px)').matches;
  const FRAMES = SMALL ? 30 : 60;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) document.getElementById('animToggle').hidden = true;
  const src = i => `assets/${SMALL ? 'frames-sm' : 'frames'}/f${String(i + 1).padStart(3, '0')}.jpg`;

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

  // the reveal plays on load, so all frames are requested right away (in order)
  for (let i = 0; i < FRAMES; i++) load(i);

  const copy = document.getElementById('heroCopy');
  const glow = document.querySelector('.hero__glow');
  const hint = document.getElementById('hint');
  const fab = document.querySelector('.wa-fab');
  const heroEl = document.getElementById('hero');

  // the hero has its own CTAs, so the floating button appears only after it
  const fabCheck = () => fab.classList.toggle('is-hidden', heroEl.getBoundingClientRect().bottom > innerHeight * 0.55);
  fab.classList.add('is-hidden');
  addEventListener('scroll', fabCheck, { passive: true });

  // floating header: transparent on the hero, glass after; dark over dark sections; hides when scrolling down
  const bar = document.getElementById('top');
  let lastY = scrollY;
  const barCheck = () => {
    const y = scrollY;
    const past = heroEl.getBoundingClientRect().bottom < -90;   // dark only once the pill sits over the dark sections
    bar.classList.toggle('is-stuck', y > 40);
    bar.classList.toggle('is-dark', past);
    if (!past || y < lastY - 4) bar.classList.remove('is-hidden');
    else if (y > lastY + 4) bar.classList.add('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', barCheck, { passive: true });
  barCheck();

  if (reduce) {
    const last = imgs[FRAMES - 1];
    const show = () => { target = FRAMES - 1; draw(FRAMES - 1); };
    last.complete && last.naturalWidth ? show() : last.addEventListener('load', show);
    return;
  }

  /* ---------- smooth scroll ---------- */
  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------- hero: the video plays once by itself on load and stops on the last frame ---------- */
  const logoEl = document.getElementById('logo');
  const F0 = Math.round((FRAMES - 1) * 0.1);   // skip the blank first moments of the video
  const intro = { p: 0 };
  if (scrollY > 40) {                       // reloaded mid-page: skip the intro
    target = FRAMES - 1; draw(target);
    gsap.set([glow, copy], { opacity: 1, y: 0 });
    gsap.set(hint, { opacity: 0 });
  } else {
    gsap.set(logoEl, { opacity: 0 });       // hides the blank first frame
    const firstHalf = imgs.slice(0, Math.ceil(FRAMES / 2)).map(im => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()));
    Promise.race([Promise.all(firstHalf), new Promise(r => setTimeout(r, 1600))]).then(() => {
      gsap.to(logoEl, { opacity: 1, duration: 0.5 });
      gsap.to(glow, { opacity: 1, duration: 2.4, delay: 0.8 });
      gsap.to(intro, {
        p: 1, duration: 3.4, ease: 'none',
        onUpdate() { target = Math.round(F0 + intro.p * (FRAMES - 1 - F0)); draw(target); }
      });
      gsap.to(copy, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 2.7 });
      gsap.to(hint, { opacity: 0, duration: 0.4, delay: 2.2 });
    });
  }
  gsap.to(logoEl, {
    scale: 0.9, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
  });

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
    ScrollTrigger.refresh();
  });

  /* ---------- gold stardust: soft glowing dots + a few large blurred "bokeh" lights, gathered around the eye ---------- */
  const sc = document.getElementById('sparks');
  const sx = sc.getContext('2d');
  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(240,205,130,1)');
    gr.addColorStop(0.35, 'rgba(217,178,111,.6)');
    gr.addColorStop(1, 'rgba(217,178,111,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return c;
  })();
  let W, H, parts = [];
  let heroVisible = true;
  let animOff = false;
  const animBtn = document.getElementById('animToggle');
  animBtn.addEventListener('click', () => {
    animOff = !animOff;
    document.documentElement.classList.toggle('anim-off', animOff);
    animBtn.setAttribute('aria-pressed', String(animOff));
    animBtn.textContent = animOff ? 'הפעלת אנימציות' : 'עצירת אנימציות';
  });
  new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }).observe(heroEl);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const fit = () => {
    const d = Math.min(devicePixelRatio || 1, 2);
    W = sc.width = sc.clientWidth * d; H = sc.height = sc.clientHeight * d;
    const n = innerWidth < 700 ? 26 : 46;
    parts = Array.from({ length: n }, (_, i) => {
      const bokeh = i % 6 === 0;
      const near = Math.random() < 0.65;   // most dust gathers around the eye, the rest drifts across the page
      return {
        x: near ? W / 2 + gauss() * W * 0.32 : Math.random() * W,
        y: near ? H * 0.42 + gauss() * H * 0.3 : Math.random() * H,
        size: (bokeh ? 34 + Math.random() * 40 : 8 + Math.random() * 14) * d,
        peak: bokeh ? 0.16 + Math.random() * 0.1 : 0.55 + Math.random() * 0.35,
        v: (Math.random() * .22 + .06) * d, sway: (Math.random() - .5) * .25 * d,
        a: Math.random() * Math.PI * 2, s: Math.random() * .018 + .006
      };
    });
  };
  fit(); addEventListener('resize', fit);
  const tick = () => {
    if (heroVisible && !animOff) {
      sx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.v; p.x += p.sway; p.a += p.s;
        if (p.y < -p.size) { p.y = H + p.size; p.x = Math.random() * W; }
        sx.globalAlpha = (Math.sin(p.a) * .5 + .5) * p.peak;
        sx.drawImage(sprite, p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    requestAnimationFrame(tick);
  };
  tick();
})();
