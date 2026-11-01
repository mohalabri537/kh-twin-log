// Captures the homepage for the foldable phone in the studio cut: the outer (cover) screen, a short phone view,
// and the inner screen, a wide view the site lays out for when the phone is open.
// Usage: serve the website on http://localhost:8765, then  node scripts/capture-fold.js public/cap
const {chromium} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SHOTS = [
  {file: 'fold-cover.jpg', w: 420, h: 590, dsf: 3, mobile: true}, // outer screen
  {file: 'fold-inner.jpg', w: 850, h: 590, dsf: 2.5, mobile: true}, // inner screen, opened
];
(async () => {
  const b = await chromium.launch();
  for (const s of SHOTS) {
    const ctx = await b.newContext({viewport: {width: s.w, height: s.h}, deviceScaleFactor: s.dsf, isMobile: s.mobile, hasTouch: true, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
    const p = await ctx.newPage();
    await p.goto('http://localhost:8765/ar/index.html', {waitUntil: 'networkidle'});
    await sleep(1400);
    await p.screenshot({path: `${OUT}/${s.file}`, quality: 90, type: 'jpeg'});
    await ctx.close();
    console.log(s.file);
  }
  await b.close();
})();
