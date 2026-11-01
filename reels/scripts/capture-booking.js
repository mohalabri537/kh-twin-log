// Usage: serve the website folder on http://localhost:8765, then
//   node scripts/capture-booking.js public/cap
// Re-captures only the booking demo (one full-page capture per state + where each tap lands, into meta.json "book")
// and the home page's doctors section for the exploded view (public/cap/home-docs.jpg). Other captures are untouched.
// The demo books a paediatric consultation with Dr. Wafaa on her first available date; the phone field is hidden.
const {chromium} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const BASE = 'http://localhost:8765/ar/';
const CHOICES = {svc: 'paeds', doc: 'wafaa', date: 0, time: 0}; // a value, or the index of the option to take
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HIDE_PHONE = `.field:has(#f-mobile){display:none!important}`;

(async () => {
  const meta = JSON.parse(fs.readFileSync(`${OUT}/meta.json`, 'utf8'));
  const b = await chromium.launch();
  const phone = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
  const p = await phone.newPage();

  await p.goto(BASE + 'book.html', {waitUntil: 'networkidle'});
  await p.addStyleTag({content: HIDE_PHONE});
  await sleep(800);
  const box = async (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2, w: r.width, h: r.height}; }, sel);
  const book = [];
  const snap = async (name, tapSel) => {
    await p.evaluate(() => scrollTo(0, 0)); await sleep(700);
    const file = `book-${name}.jpg`;
    await p.screenshot({path: `${OUT}/${file}`, fullPage: true, quality: 90, type: 'jpeg'});
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    book.push({name, file, h, tap: tapSel ? await box(tapSel) : null});
  };
  const valueOf = async (name, c) => (typeof c === 'string' ? c : p.evaluate(({name, c}) => [...document.querySelectorAll(`input[name="${name}"]`)].filter((x) => !x.disabled)[c].value, {name, c}));
  let prev = 'start';
  for (const name of ['svc', 'doc', 'date', 'time']) {
    const v = await valueOf(name, CHOICES[name]);
    await p.evaluate(({name, v}) => { const inp = document.querySelector(`input[name="${name}"][value="${CSS.escape(v)}"]`); (inp.closest('label') || inp.parentElement).setAttribute('data-tap', name); }, {name, v});
    await snap(prev, `[data-tap="${name}"]`);
    await p.evaluate(({name, v}) => { const e = document.querySelector(`input[name="${name}"][value="${CSS.escape(v)}"]`); e.checked = true; e.dispatchEvent(new Event('change', {bubbles: true})); }, {name, v});
    await sleep(500);
    console.log(name, '->', v);
    prev = name;
  }
  await p.fill('#f-name', 'أحمد');
  await p.evaluate(() => document.getElementById('f-name').blur());
  await snap('time', '#bk-send');
  meta.book = book;

  // the home page's doctors (all of them), for the exploded view
  await p.goto(BASE + 'index.html', {waitUntil: 'networkidle'});
  await p.addStyleTag({content: '.site-head{display:none!important}'}); // the sticky header would cover the cards
  const sec = await p.$('section:has(.docs)');
  await sec.scrollIntoViewIfNeeded(); await sleep(1800);
  await sec.screenshot({path: `${OUT}/home-docs.jpg`, quality: 90, type: 'jpeg'});
  // where the cards sit inside that capture (CSS px), so make-panels.py can crop to them
  meta.homeDocs = await sec.evaluate((s) => { const r = s.getBoundingClientRect(), c = [...s.querySelectorAll('.doc')].map((d) => d.getBoundingClientRect());
    return {h: r.height, cardsTop: c[0].top - r.top, cardsBottom: c[c.length - 1].bottom - r.top, cards: c.length}; });

  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(JSON.stringify({book: meta.book, homeDocs: meta.homeDocs}, null, 1));
})();
