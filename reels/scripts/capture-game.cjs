// Plays the site's real visual-memory game and photographs each state, for the phone in the Story reels.
// Adapted from the NeuroUniverse-Devices project: a fixed clock and a seeded Math.random make the round repeatable,
// the lit tiles are read off the page and clicked back in order, and the tile centres are saved for the touch ripples.
// Usage: node scripts/capture-game.cjs <site-root>   (writes public/cap/game-ar and public/cap/game-en)
const {chromium} = require('playwright');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const site = path.resolve(process.argv[2]);
const out = path.resolve(__dirname, '..', 'public', 'cap');
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'};
const server = http.createServer((req, res) => {
  const file = path.resolve(site, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(site + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r)); const port = server.address().port;
  const b = await chromium.launch();
  try {
    for (const [lang, url, locale] of [['ar', '/ar/memory-test.html', 'ar-OM'], ['en', '/memory-test.html', 'en-GB']]) {
      const W = 390, H = 790; // the phone's screen under its status bar
      const dir = path.join(out, 'game-' + lang); fs.mkdirSync(dir, {recursive: true});
      const ctx = await b.newContext({viewport: {width: W, height: H}, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, colorScheme: 'light', reducedMotion: 'reduce', locale});
      const page = await ctx.newPage(); page.on('pageerror', (e) => console.log(lang, 'PAGE', String(e).slice(0, 130)));
      await page.goto('http://127.0.0.1:' + port + url, {waitUntil: 'networkidle', timeout: 15000});
      await page.evaluate(() => document.fonts.ready);
      const box = page.locator('[data-game=memory]'); await box.locator('.g-start').waitFor({state: 'attached'});
      await box.evaluate((el) => window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'instant'}));
      await page.waitForTimeout(750);
      const snap = async (n) => page.screenshot({path: path.join(dir, n + '.jpg'), type: 'jpeg', quality: 92});
      await snap('intro');
      const startRect = await box.locator('.g-start').boundingBox();
      const now = new Date('2026-10-31T12:00:00Z'); await page.clock.install({time: now}); await page.clock.pauseAt(new Date(now.getTime() + 250));
      await page.evaluate(() => { const old = Math.random; let v = 7193; Math.random = () => { v = (v * 16807) % 2147483647; return v / 2147483647; }; try { document.querySelector('[data-game=memory] .g-start').click(); } finally { Math.random = old; } });
      let last = 0; const go = async (t) => { await page.clock.runFor(t - last); last = t; };
      await go(240); await snap('watch');
      const seq = [];
      for (let i = 0; i < 3; i++) { await go(958 + 960 * i); seq.push(Number(await box.locator('.g-tile.lit').first().getAttribute('data-k', {timeout: 2000}))); await snap('watch' + i); }
      await go(3750); await snap('input');
      const taps = [];
      for (let i = 0; i < 3; i++) {
        const tile = box.locator('[data-k="' + seq[i] + '"]'); const r = await tile.boundingBox(); taps.push([r.x + r.width / 2, r.y + r.height / 2]);
        await tile.evaluate((el) => el.click()); await page.clock.runFor(165); await snap('tap' + i); await page.clock.runFor(310);
      }
      await snap('success');
      const msg = (await box.locator('.g-msg').innerText()).trim();
      console.log(lang, seq, msg);
      fs.writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({width: W, height: H, start: [startRect.x + startRect.width / 2, startRect.y + startRect.height / 2], sequence: seq, taps, success: msg}, null, 1));
      await ctx.close();
    }
  } finally { await b.close(); server.close(); }
})().catch((e) => { console.error(e); process.exitCode = 1; });
