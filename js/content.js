/* Renders everything editable from /content/*.json (edited by Decap at /admin).
   Text is always inserted with textContent, never as HTML. */
window.contentReady = (async () => {
  const get = f => fetch(`content/${f}.json`, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);
  const [site, treatments, process, faq, quotes, gallery] =
    await Promise.all(['site', 'treatments', 'process', 'faq', 'testimonials', 'gallery'].map(get));

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const items = d => (d && Array.isArray(d.items) ? d.items : []);
  const $ = id => document.getElementById(id);

  /* ---- simple text + contact wiring ---- */
  if (site) {
    document.querySelectorAll('[data-c]').forEach(n => { if (site[n.dataset.c]) n.textContent = site[n.dataset.c]; });
    const digits = (site.phone || '').replace(/\D/g, '');
    if (digits) {
      const intl = '972' + digits.replace(/^0/, '');
      const msg = encodeURIComponent(site.whatsapp_text || '');
      document.querySelectorAll('[data-wa]').forEach(a => { a.href = `https://wa.me/${intl}?text=${msg}`; });
      document.querySelectorAll('[data-phone]').forEach(a => { a.href = `tel:${digits}`; });
      document.querySelectorAll('.top__call,[data-phone-text]').forEach(a => { a.textContent = site.phone_display || site.phone; });
    }

    (site.tags || []).forEach(t => $('chips').append(el('li', null, t)));
    (site.stats || []).forEach(s => {
      const box = el('div', 'stat');
      box.append(el('dt', null, s.number), el('dd', null, s.label));
      $('stats').append(box);
    });

    const ein = (site.ein_body || '').trim();
    if (ein) {
      ein.split(/\n{1,}/).forEach(p => $('einBody').append(el('p', null, p)));
      $('ein').hidden = false;
    }
  }

  /* ---- treatments rail ---- */
  items(treatments).forEach((t, i) => {
    const c = el('article', 'card');
    c.setAttribute('role', 'listitem');
    c.append(el('span', 'card__n', String(i + 1).padStart(2, '0')), el('h3', null, t.title), el('p', null, t.text));
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
    const s = el('summary', null, f.q);
    d.append(s, el('p', null, f.a));
    $('faqList').append(d);
  });

  /* ---- testimonials (hidden until real ones are added in /admin) ---- */
  const q = items(quotes);
  q.forEach(t => {
    const b = el('blockquote', 'quote reveal');
    b.append(el('p', null, `“${t.text}”`));
    const cap = el('footer', null);
    cap.append(el('strong', null, t.name || ''), el('span', null, t.place ? ` · ${t.place}` : ''));
    b.append(cap);
    $('quoteList').append(b);
  });
  if (q.length) $('quotes').hidden = false;

  /* ---- gallery (hidden until media is added) ---- */
  const g = items(gallery);
  g.forEach(m => {
    const f = el('figure', 'gal__i reveal');
    if (m.video) {
      const v = document.createElement('video');
      v.src = m.video; v.controls = true; v.preload = 'none'; v.playsInline = true;
      if (m.image) v.poster = m.image;
      f.append(v);
    } else if (m.image) {
      const im = document.createElement('img');
      im.src = m.image; im.alt = m.caption || ''; im.loading = 'lazy'; im.decoding = 'async';
      f.append(im);
    }
    if (m.caption) f.append(el('figcaption', null, m.caption));
    $('galGrid').append(f);
  });
  if (g.length) $('gallery').hidden = false;
})();
