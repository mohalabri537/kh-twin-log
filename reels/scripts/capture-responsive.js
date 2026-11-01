// Usage: serve the website folder on http://localhost:8765, then
//   node scripts/capture-responsive.js public/cap/resp
// Captures the top of the Arabic homepage at widths from desktop (1440) down to phone (390), so the
// reel can show the real layout reflowing as a browser window narrows. Each capture's pixel density
// matches how large the window appears in the reel at that width (see src/scenes/Desktop.tsx).
const {chromium} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
fs.mkdirSync(OUT, {recursive: true});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const W0 = 1440, W1 = 390, H0 = 900, H1 = 844, STEPS = 36;
const shown = (w) => 1000 + (585 - 1000) * ((W0 - w) / (W0 - W1)); // window width on the reel frame, px

(async () => {
  const b = await chromium.launch();
  const widths = [];
  for (let i = 0; i < STEPS; i++) widths.push(Math.round(W0 + (W1 - W0) * (i / (STEPS - 1))));
  for (const w of widths) {
    const h = Math.round(H0 + (H1 - H0) * ((W0 - w) / (W0 - W1)));
    const dsf = Math.max(1, Math.ceil((shown(w) / w) * 1.3 * 10) / 10);
    const ctx = await b.newContext({viewport: {width: w, height: h}, deviceScaleFactor: dsf, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
    const p = await ctx.newPage();
    await p.goto('http://localhost:8765/ar/index.html', {waitUntil: 'networkidle'});
    await p.addStyleTag({content: 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}'});
    await sleep(1200); // let the intro settle, as for the other captures
    await p.screenshot({path: `${OUT}/w${w}.jpg`, quality: 86, type: 'jpeg'});
    await ctx.close();
  }
  fs.writeFileSync(`${OUT}/widths.json`, JSON.stringify(widths));
  await b.close();
  console.log('captured', widths.length, 'widths');
})();
