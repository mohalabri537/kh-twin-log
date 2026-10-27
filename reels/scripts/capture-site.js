// Usage: serve the website folder on http://localhost:8765 (e.g. `python3 -m http.server 8765`), then
//   node scripts/capture-site.js public/cap
// The phone number field on the booking form is hidden and a sample name is used.
// Captures the real site (served on :8765) into PNG/JPEG frames + JSON coordinates for the reel.
const {chromium} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const BASE = 'http://localhost:8765/ar/';
fs.mkdirSync(OUT + '/hero', {recursive: true});
fs.mkdirSync(OUT + '/eegscene', {recursive: true});
const meta = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HIDE_PHONE = `.field:has(#f-mobile){display:none!important}`;

async function scrollThrough(p) {
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await p.evaluate((y) => scrollTo(0, y), y); await sleep(90); }
  await p.evaluate(() => scrollTo(0, 0)); await sleep(900);
}
async function fullPage(p, name) {
  await scrollThrough(p);
  await p.screenshot({path: `${OUT}/${name}.jpg`, fullPage: true, quality: 90, type: 'jpeg'});
  meta[name] = {h: await p.evaluate(() => document.documentElement.scrollHeight)};
}
async function scrubScene(p, sel, dir, n, from = 0, to = 1) {
  const r = await p.evaluate((sel) => { const e = document.querySelector(sel); return {top: e.offsetTop, h: e.offsetHeight, vh: innerHeight}; }, sel);
  const start = r.top, end = r.top + r.h - r.vh;
  for (let i = 0; i < n; i++) {
    const t = from + (to - from) * (i / (n - 1));
    await p.evaluate((y) => scrollTo(0, y), start + (end - start) * t);
    await sleep(450); // motion.js trails the scroll; let it settle
    await p.screenshot({path: `${OUT}/${dir}/${String(i).padStart(3, '0')}.jpg`, quality: 90, type: 'jpeg'});
  }
  meta[dir] = {n, start, end};
}

(async () => {
  const b = await chromium.launch();
  const phone = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
  const p = await phone.newPage();

  // 1. Hero: purple logo grows and opens onto the EEG screen
  await p.goto(BASE + 'index.html', {waitUntil: 'networkidle'});
  await sleep(1200);
  await scrubScene(p, '[data-scene="hero"]', 'hero', 48);
  // 4. EEG trace on the home page, drawn by scrolling
  await scrubScene(p, '[data-scene="eeg"]', 'eegscene', 40, 0, 1);

  // 2/4/5. Full pages for scroll shots
  for (const pg of ['doctors', 'eeg', 'visit']) {
    await p.goto(BASE + pg + '.html', {waitUntil: 'networkidle'});
    await fullPage(p, pg);
  }

  // 3. Booking: one full-page capture per state + where each tap lands
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
    const tap = tapSel ? await box(tapSel) : null;
    book.push({name, file, h, tap});
  };
  const pick = async (sel) => { await p.evaluate((sel) => { const e = document.querySelector(sel); e.checked = true; e.dispatchEvent(new Event('change', {bubbles: true})); }, sel); await sleep(500); };
  const optSel = (name, i) => `input[name="${name}"]:nth-of-type(1)`;
  const nth = async (name, i) => p.evaluate(({name, i}) => { const all = [...document.querySelectorAll(`input[name="${name}"]`)].filter((x) => !x.disabled); return all[i] ? all[i].value : null; }, {name, i});
  const tapTarget = (name, value) => `input[name="${name}"][value="${value}"]`;
  // the visible label of an option is the closest label/opt wrapper
  const tapBox = (name, value) => `${tapTarget(name, value)}`;

  const steps = [['svc', 0], ['doc', 0], ['date', 0], ['time', 0]];
  let prevName = 'start';
  for (const [name, i] of steps) {
    const v = await nth(name, i);
    // the option card = the input's label ancestor
    await p.evaluate(({name, v}) => { const inp = document.querySelector(`input[name="${name}"][value="${CSS.escape(v)}"]`); (inp.closest('label') || inp.parentElement).setAttribute('data-tap', name); }, {name, v});
    await snap(prevName, `[data-tap="${name}"]`);
    await pick(`input[name="${name}"][value="${v}"]`);
    prevName = name;
  }
  await p.fill('#f-name', 'أحمد');
  await p.evaluate(() => document.getElementById('f-name').blur());
  await snap('time', '#bk-send');
  meta.book = book;

  // 6. Desktop: articles page in a browser
  const desk = await b.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 2, colorScheme: 'light', locale: 'ar-OM'});
  const d = await desk.newPage();
  await d.goto(BASE + 'articles.html', {waitUntil: 'networkidle'});
  await scrollThrough(d);
  await d.screenshot({path: `${OUT}/desk-articles.jpg`, quality: 90, type: 'jpeg'});
  meta.deskCards = await d.evaluate(() => [...document.querySelectorAll('main a[href*="articles/"]')].slice(0, 4).map((a) => { const r = a.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + Math.min(r.height, 300) / 2, w: r.width, h: r.height, href: a.getAttribute('href')}; }));
  await d.goto(BASE + 'articles/what-is-an-eeg.html', {waitUntil: 'networkidle'});
  await scrollThrough(d);
  await d.screenshot({path: `${OUT}/desk-article.jpg`, quality: 90, type: 'jpeg'});

  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(JSON.stringify(meta, null, 1));
})();
