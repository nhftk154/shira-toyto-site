#!/usr/bin/env node
/* Bakes the editable content (content/*.json) into index.html as static HTML, so crawlers
   that do not run JavaScript (most AI crawlers) can read the page.
   js/content.js still renders the same content in the browser and replaces these nodes,
   so the page always shows the latest JSON even if this script has not run yet.
   Idempotent: run it as often as you like. No dependencies. Usage: node scripts/prerender.mjs
   Testimonials, gallery and videos are intentionally not prerendered. */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => { try { return JSON.parse(readFileSync(join(root, 'content', f + '.json'), 'utf8')); } catch { return null; } };
const text = read('site-text'), contact = read('contact'), treatments = read('treatments'),
  process_ = read('process'), faq = read('faq'), credentials = read('credentials');

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const items = d => (d && Array.isArray(d.items) ? d.items : []);
const pick = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const url = p => String(p || '').replace(/^\/+/, '');

let html = readFileSync(join(root, 'index.html'), 'utf8');
const before = html;

// replace the inner HTML of the element carrying id="<id>" (its children contain no tag of the same name)
const setInner = (id, inner) => {
  const re = new RegExp(`(<(\\w+)[^>]*\\sid="${id}"[^>]*>)[\\s\\S]*?(</\\2>)`);
  if (!re.test(html)) throw new Error(`#${id} not found in index.html`);
  html = html.replace(re, (_, open, _tag, close) => open + inner + close);
};
const setHidden = (id, hidden) => {
  const re = new RegExp(`(<section[^>]*\\sid="${id}")((?:[^>]*?))(\\shidden)?(>)`);
  if (!re.test(html)) throw new Error(`section #${id} not found`);
  html = html.replace(re, (_, a, mid, _h, z) => a + mid.replace(/\shidden/, '') + (hidden ? ' hidden' : '') + z);
};

/* ---- texts: every element with data-c ---- */
if (text) {
  html = html.replace(/(<(\w+)[^>]*?\sdata-c="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, _t, path, inner, close) => {
    const v = pick(text, path);
    return typeof v === 'string' && v ? open + esc(v) + close : m;
  });
  const about = text.about || {};
  if (about.photo) {
    html = html.replace(/(<img[^>]*id="aboutImg"[^>]*?)src="[^"]*"/, `$1src="${esc(url(about.photo))}"`)
      .replace(/(<img[^>]*id="aboutImg"[^>]*?)alt="[^"]*"/, '$1alt="שירה איבון טויטו"')
      .replace(/(id="aboutPhoto"[^>]*class="[^"]*?)is-logo/, '$1is-photo')
      .replace(/(class="[^"]*?)is-logo([^"]*"[^>]*id="aboutPhoto")/, '$1is-photo$2');
  }
  setInner('chips', (about.tags || []).map(t => `<li>${esc(typeof t === 'string' ? t : t.tag)}</li>`).join(''));
  setInner('stats', (about.stats || []).map(s => `<div class="stat"><dt>${esc(s.number)}</dt><dd>${esc(s.label)}</dd></div>`).join(''));
  const ein = ((text.ein && text.ein.body) || '').trim();
  setInner('einBody', ein ? ein.split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('') : '');
  setHidden('ein', !ein);
}

/* ---- contact ---- */
const digits = ((contact && contact.phone) || '').replace(/\D/g, '');
const intl = digits ? '972' + digits.replace(/^0/, '') : '972523221004';
const waLink = msg => `https://wa.me/${intl}?text=${encodeURIComponent(msg || '')}`;
if (contact) {
  html = html.replace(/<a\b[^>]*\bdata-wa\b[^>]*>/g, tag => tag.replace(/href="[^"]*"/, `href="${esc(waLink(contact.whatsappText))}"`));
  if (digits) html = html.replace(/<a\b[^>]*\bdata-phone\b[^>]*>/g, tag => tag.replace(/href="[^"]*"/, `href="tel:${digits}"`));
  html = html.replace(/(<span[^>]*\bdata-phone-text\b[^>]*>)[\s\S]*?(<\/span>)/g, `$1${esc(contact.phoneDisplay || contact.phone)}$2`);
  html = html.replace(/(<span[^>]*\bdata-i="address"[^>]*>)[\s\S]*?(<\/span>)/g, `$1${esc(contact.address || '')}$2`);
}

/* ---- treatments ---- */
setInner('rail', items(treatments).map((t, i) => {
  const cta = t.waText
    ? `<a class="card__cta" href="${esc(waLink(t.waText))}" target="_blank" rel="noopener">לפרטים<span class="sr"> על ${esc(t.title)} (נפתח בחלון חדש)</span></a>`
    : '';
  return `<article class="card" role="listitem"><span class="card__n">${String(i + 1).padStart(2, '0')}</span><h3>${esc(t.title)}</h3><p>${esc(t.description)}</p>${cta}</article>`;
}).join(''));

/* ---- credentials ---- */
const cr = items(credentials).filter(c => c && c.title);
setInner('credList', cr.map(c => `<li class="cred__i reveal"><strong>${esc(c.title)}</strong>${c.detail ? `<span>${esc(c.detail)}</span>` : ''}</li>`).join(''));
setHidden('credentials', !cr.length);

/* ---- process ---- */
setInner('steps', items(process_).map((s, i) =>
  `<li class="step reveal"><span class="step__n">${i + 1}</span><div class="step__b"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div></li>`).join(''));

/* ---- faq ---- */
setInner('faqList', items(faq).map(f => `<details class="qa reveal"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join(''));

if (html !== before) { writeFileSync(join(root, 'index.html'), html); console.log('index.html updated'); }
else console.log('index.html already up to date');
