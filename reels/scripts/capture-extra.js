// Extra captures for the website tour: homepage sections, services page, English and dark-mode versions.
// Usage: serve the website on http://localhost:8765, then  node scripts/capture-extra.js public/cap
const {chromium} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const phone = (b, scheme = 'light') => b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme, locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
async function scrollThrough(p) {
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await p.evaluate((y) => scrollTo(0, y), y); await sleep(90); }
  await p.evaluate(() => scrollTo(0, 0)); await sleep(900);
}
(async () => {
  const b = await chromium.launch();
  const meta = JSON.parse(fs.readFileSync(`${OUT}/meta.json`));
  const ctx = await phone(b);
  const p = await ctx.newPage();

  // homepage below the opening animation, as one long image
  await p.goto('http://localhost:8765/ar/index.html', {waitUntil: 'networkidle'});
  await scrollThrough(p);
  const heroEnd = await p.evaluate(() => { const h = document.querySelector('[data-scene="hero"]'); return h.offsetTop + h.offsetHeight; });
  const sections = await p.evaluate(() => [...document.querySelectorAll('main > section')].map((s) => ({cls: s.className, scene: s.dataset.scene || '', top: s.offsetTop, h: s.offsetHeight, title: (s.querySelector('h2,h1') || {}).textContent || ''})));
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const H = Math.min(5200, total - heroEnd);
  await p.screenshot({path: `${OUT}/home.jpg`, fullPage: true, clip: {x: 0, y: heroEnd, width: 390, height: H}, quality: 88, type: 'jpeg'});
  meta.home = {offset: heroEnd, h: H, sections};

  // services page
  await p.goto('http://localhost:8765/ar/services.html', {waitUntil: 'networkidle'});
  await scrollThrough(p);
  await p.screenshot({path: `${OUT}/services.jpg`, fullPage: true, quality: 88, type: 'jpeg'});
  meta.services = {h: await p.evaluate(() => document.documentElement.scrollHeight)};

  // top of the homepage in Arabic (light), English (light) and Arabic (dark) for the language/theme switch
  const top = async (ctx2, url, file) => {
    const q = await ctx2.newPage();
    await q.goto(url, {waitUntil: 'networkidle'}); await sleep(1200);
    await q.screenshot({path: `${OUT}/${file}`, quality: 90, type: 'jpeg'});
    const boxes = await q.evaluate(() => { const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; }; return {lang: g('#langBtn'), theme: g('#themeBtn')}; });
    await q.close();
    return boxes;
  };
  meta.topAr = await top(ctx, 'http://localhost:8765/ar/index.html', 'top-ar.jpg');
  meta.topEn = await top(ctx, 'http://localhost:8765/index.html', 'top-en.jpg');
  const dark = await phone(b, 'dark');
  meta.topDark = await top(dark, 'http://localhost:8765/ar/index.html', 'top-ar-dark.jpg');
  meta.topEnDark = await top(dark, 'http://localhost:8765/index.html', 'top-en-dark.jpg');
  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
  console.log(JSON.stringify({home: meta.home, services: meta.services, topAr: meta.topAr, topEn: meta.topEn}, null, 0));
  await b.close();
})();
