/* Renders everything editable from /content/*.json (edited via the /admin CMS).
   Text is always inserted with textContent, never as HTML. */
window.contentReady = (async () => {
  const get = f => fetch(`content/${f}.json`, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [text, contact, treatments, process, faq, quotes, gallery, videos] =
    await Promise.all(['site-text', 'contact', 'treatments', 'process', 'faq', 'testimonials', 'gallery', 'videos'].map(get));

  const el = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };
  const items = d => (d && Array.isArray(d.items) ? d.items : []);
  const $ = id => document.getElementById(id);
  const pick = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  // paths saved by the CMS may or may not start with "/"; the site can live under a sub-path
  const url = p => String(p || '').replace(/^\/+/, '');

  /* ---- texts ---- */
  if (text) {
    document.querySelectorAll('[data-c]').forEach(n => {
      const v = pick(text, n.dataset.c);
      if (typeof v === 'string' && v) n.textContent = v;
    });
    const about = text.about || {};
    (about.tags || []).forEach(t => $('chips').append(el('li', null, typeof t === 'string' ? t : t.tag)));
    (about.stats || []).forEach(s => {
      const box = el('div', 'stat');
      box.append(el('dt', null, s.number), el('dd', null, s.label));
      $('stats').append(box);
    });
    const ein = ((text.ein && text.ein.body) || '').trim();
    if (ein) {
      ein.split(/\n+/).forEach(p => $('einBody').append(el('p', null, p)));
      $('ein').hidden = false;
    }
  }

  /* ---- contact details ---- */
  const digits = ((contact && contact.phone) || '').replace(/\D/g, '');
  const intl = digits ? '972' + digits.replace(/^0/, '') : '972523221004';
  const waLink = msg => `https://wa.me/${intl}?text=${encodeURIComponent(msg || '')}`;
  if (contact) {
    document.querySelectorAll('[data-wa]').forEach(a => { a.href = waLink(contact.whatsappText); });
    if (digits) document.querySelectorAll('[data-phone]').forEach(a => { a.href = `tel:${digits}`; });
    document.querySelectorAll('[data-phone-text]').forEach(a => { a.textContent = contact.phoneDisplay || contact.phone; });
    document.querySelectorAll('[data-i="address"]').forEach(a => { a.textContent = contact.address || ''; });
  }

  /* ---- treatments rail ---- */
  items(treatments).forEach((t, i) => {
    const c = el('article', 'card');
    c.setAttribute('role', 'listitem');
    c.append(el('span', 'card__n', String(i + 1).padStart(2, '0')), el('h3', null, t.title), el('p', null, t.description));
    if (t.waText) {
      const a = el('a', 'card__cta', 'לפרטים');
      a.href = waLink(t.waText); a.target = '_blank'; a.rel = 'noopener';
      c.append(a);
    }
    $('rail').append(c);
  });
  const rail = $('rail');
  const step = dir => rail.scrollBy({ left: dir * -1 * Math.min(rail.clientWidth * 0.8, 380), behavior: 'smooth' });
  $('railNext').onclick = () => step(1);
  $('railPrev').onclick = () => step(-1);

  /* ---- process ---- */
  items(process).forEach((s, i) => {
    const li = el('li', 'step reveal');
    li.append(el('span', 'step__n', String(i + 1)), el('div', 'step__b'));
    li.lastChild.append(el('h3', null, s.title), el('p', null, s.text));
    $('steps').append(li);
  });

  /* ---- faq ---- */
  items(faq).forEach(f => {
    const d = el('details', 'qa reveal');
    d.append(el('summary', null, f.q), el('p', null, f.a));
    $('faqList').append(d);
  });

  /* ---- testimonials (hidden until at least one exists) ---- */
  const q = items(quotes);
  q.forEach(t => {
    const b = el('blockquote', 'quote reveal');
    b.append(el('p', null, `“${t.quote}”`));
    const cap = el('footer', null);
    cap.append(el('strong', null, t.name || ''), el('span', null, t.meta ? ` · ${t.meta}` : ''));
    b.append(cap);
    $('quoteList').append(b);
  });
  if (q.length) $('quotes').hidden = false;

  /* ---- gallery (hidden until images exist) ---- */
  const g = items(gallery).filter(Boolean);
  g.forEach(p => {
    const f = el('figure', 'gal__i reveal');
    const im = document.createElement('img');
    im.src = url(p); im.alt = 'רגע מהקליניקה'; im.loading = 'lazy'; im.decoding = 'async';
    f.append(im);
    $('galGrid').append(f);
  });
  if (g.length) $('gallery').hidden = false;

  /* ---- videos: YouTube (loads only on click, privacy-friendly) or an uploaded file ---- */
  const ytId = u => {
    const m = String(u || '').match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  };
  const v = items(videos);
  v.forEach(it => {
    const box = el('figure', `vid vid--${it.aspect || 'landscape'} reveal`);
    if (it.type === 'file' && it.file_src) {
      const vd = document.createElement('video');
      vd.src = url(it.file_src); vd.controls = true; vd.preload = 'none'; vd.playsInline = true;
      if (it.poster) vd.poster = url(it.poster);
      box.append(vd);
    } else {
      const id = ytId(it.youtube_url);
      if (!id) return;
      const btn = el('button', 'vid__play');
      btn.type = 'button';
      btn.setAttribute('aria-label', 'הפעלת סרטון' + (it.title ? `: ${it.title}` : ''));
      const im = document.createElement('img');
      im.src = it.poster ? url(it.poster) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      im.alt = ''; im.loading = 'lazy';
      btn.append(im, el('span', 'vid__icon', '▶'));
      btn.addEventListener('click', () => {
        const f = document.createElement('iframe');
        f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        f.allow = 'autoplay; encrypted-media; picture-in-picture'; f.allowFullscreen = true;
        f.title = it.title || 'סרטון';
        btn.replaceWith(f);
      });
      box.append(btn);
    }
    if (it.title) box.append(el('figcaption', null, it.title));
    $('vidGrid').append(box);
  });
  if ($('vidGrid').children.length) $('videos').hidden = false;
})();
