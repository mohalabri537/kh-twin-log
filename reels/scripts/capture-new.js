// Captures the sections added after the launch: the three brain games being played, the symptoms and conditions
// pages, and the games hub. Usage: serve the website on http://localhost:8765, then
//   node scripts/capture-new.js public/cap
// Writes public/cap/games/*.jpg (phone screens, 390x844 CSS px at 3x), public/cap/cond-*.jpg (full pages) and adds
// "games" and "cond" to public/cap/meta.json (where the taps land, in CSS px of each capture).
const {chromium} = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const BASE = 'http://localhost:8765/ar/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(`${OUT}/games`, {recursive: true});

async function scrollThrough(p) {
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 300) { await p.evaluate((y) => scrollTo(0, y), y); await sleep(90); }
  await p.evaluate(() => scrollTo(0, 0)); await sleep(900);
}
const centre = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height}; }, sel);

(async () => {
  const meta = JSON.parse(fs.readFileSync(`${OUT}/meta.json`, 'utf8'));
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
  const p = await ctx.newPage();
  const games = {};
  // put the game box in view, just under the header, and keep it there
  const frameGame = async (g) => {
    await p.evaluate((g) => { const box = document.querySelector(`[data-game="${g}"]`); scrollTo(0, box.getBoundingClientRect().top + scrollY - 76); }, g);
    await sleep(500);
  };
  const shot = async (name) => { await p.screenshot({path: `${OUT}/games/${name}.jpg`, quality: 90, type: 'jpeg'}); return `games/${name}.jpg`; };

  // 1. Stroop: the intro, four words answered correctly (where the right button is), and the result
  await p.goto(BASE + 'stroop-test.html', {waitUntil: 'networkidle'}); await sleep(900);
  await frameGame('stroop');
  const S = '[data-game="stroop"]';
  const stroop = {intro: await shot('stroop-intro'), start: await centre(p, `${S} .g-start`), words: []};
  await p.click(`${S} .g-start`);
  for (let k = 0; k < 60 && !(await p.$(`${S} .g-result`)); k++) {
    const ink = await p.$eval(`${S} .g-word`, (w) => ([...w.classList].find((c) => c.startsWith('g-c-')) || '').slice(4)).catch(() => '');
    const text = await p.$eval(`${S} .g-word`, (w) => w.textContent.trim()).catch(() => '');
    if (ink && text) {
      if (stroop.words.length < 4) {
        await frameGame('stroop');
        const file = await shot(`stroop-${stroop.words.length}`);
        stroop.words.push({file, ink, text, tap: await centre(p, `${S} .g-ans[data-c="${ink}"]`), word: await centre(p, `${S} .g-word`)});
      }
      await p.click(`${S} .g-ans[data-c="${ink}"]`).catch(() => {});
    }
    await sleep(stroop.words.length < 4 ? 120 : 220);
  }
  await p.waitForSelector(`${S} .g-result`, {timeout: 60000});
  await sleep(900); await frameGame('stroop');
  stroop.result = await shot('stroop-result');
  games.stroop = stroop;

  // 2. Reaction time: waiting, the target, and the result
  await p.goto(BASE + 'reaction-time-test.html', {waitUntil: 'networkidle'}); await sleep(900);
  await frameGame('reaction');
  const R = '[data-game="reaction"]';
  const reaction = {intro: await shot('reaction-intro'), start: await centre(p, `${R} .g-start`)};
  await p.click(`${R} .g-start`); await sleep(350);
  reaction.wait = await shot('reaction-wait');
  // first run: just the lit target (taking the picture delays the tap, so its times are not shown)
  const tapRun = async (onGo) => {
    for (let k = 0; k < 5; k++) {
      await p.waitForSelector(`${R} .g-target:not([hidden])`, {timeout: 8000});
      if (k === 0 && onGo) await onGo();
      await sleep(185 + ((k * 37) % 60)); // a quick, human-looking reaction
      await p.dispatchEvent(`${R} .g-tap`, 'pointerdown', {button: 0, pointerType: 'touch'});
      if (k === 1 && !onGo) { await sleep(120); reaction.time = await shot('reaction-time'); }
      if (k < 4) await p.waitForSelector(`${R} .g-target[hidden]`, {state: 'attached', timeout: 4000});
    }
    await p.waitForSelector(`${R} .g-result`, {timeout: 8000}); await sleep(600);
  };
  await tapRun(async () => { reaction.go = await shot('reaction-go'); reaction.target = await centre(p, `${R} .g-target`); });
  // second run, tapped promptly from inside the page (no round trip to the test tool): about a quarter of a second
  // after each target appears, like a quick human. Shows a reaction time and the result.
  await frameGame('reaction');
  await p.evaluate((R) => {
    const box = document.querySelector(R); window.__taps = 0;
    new MutationObserver(() => {
      const t = box.querySelector('.g-target:not(.g-target-sample)');
      if (!t) return;
      if (t.hidden) { delete t.dataset.sched; return; }
      if (t.dataset.sched) return;
      t.dataset.sched = '1';
      setTimeout(() => { box.querySelector('.g-tap').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, button: 0, pointerType: 'touch'})); window.__taps++; }, 205 + Math.random() * 50);
    }).observe(box, {subtree: true, attributes: true, childList: true});
  }, R);
  await p.click(`${R} .g-start`);
  await p.waitForFunction(() => window.__taps >= 2, null, {timeout: 15000}); await sleep(90);
  reaction.time = await shot('reaction-time');
  await p.waitForSelector(`${R} .g-result`, {timeout: 15000});
  await sleep(900); await frameGame('reaction');
  reaction.result = await shot('reaction-result');
  games.reaction = reaction;

  // 3. Visual memory: the pattern lit, the player's taps, and the result
  await p.goto(BASE + 'memory-test.html', {waitUntil: 'networkidle'}); await sleep(900);
  await frameGame('memory');
  const M = '[data-game="memory"]';
  const memory = {intro: await shot('memory-intro'), start: await centre(p, `${M} .g-start`)};
  await p.click(`${M} .g-start`);
  // play three rounds correctly: the squares light one at a time (560 ms each), then the player repeats the order
  const inputPhase = () => p.evaluate((M) => document.querySelector(M).classList.contains('g-input'), M);
  for (let round = 0; round < 3; round++) {
    const seq = []; let last = null;
    for (let k = 0; k < 400 && !(await inputPhase()); k++) {
      const lit = await p.$$eval(`${M} .g-tile.lit`, (ts) => ts.map((t) => t.dataset.k));
      if (lit.length && lit[0] !== last) {
        seq.push(lit[0]); last = lit[0];
        if (round === 2 && seq.length === 2) memory.show = await shot('memory-show');
      }
      if (!lit.length) last = null;
      await sleep(40);
    }
    if (round === 2) memory.seq = seq;
    for (const [j, kk] of seq.entries()) {
      await p.click(`${M} .g-tile[data-k="${kk}"]`); await sleep(160);
      if (round === 2 && j === Math.floor(seq.length / 2)) memory.input = await shot('memory-input');
    }
    if (round === 2) memory.tiles = await p.$$eval(`${M} .g-tile`, (ts) => ts.map((t) => { const r = t.getBoundingClientRect(); return {k: t.dataset.k, x: r.left + r.width / 2, y: r.top + r.height / 2}; }));
    await sleep(700);
  }
  games.memory = memory;
  meta.games = games;

  // 4. The games hub and the symptoms and conditions pages, as full pages for scroll shots
  const full = async (url, file) => {
    await p.goto(BASE + url, {waitUntil: 'networkidle'});
    await scrollThrough(p);
    await p.screenshot({path: `${OUT}/${file}`, fullPage: true, quality: 90, type: 'jpeg'});
    return p.evaluate(() => document.documentElement.scrollHeight);
  };
  const rect = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); const r = e.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2, top: r.top + scrollY, w: r.width, h: r.height}; }, sel);
  const cond = {};
  cond.gamesHub = {h: await full('games.html', 'games-hub.jpg')};
  cond.hub = {h: await full('conditions.html', 'cond-hub.jpg'), urgent: await rect('.hub-urgent'),
    cards: await p.$$eval('.ccard', (cs) => cs.map((c) => { const r = c.getBoundingClientRect(); return {href: c.getAttribute('href'), x: r.left + r.width / 2, y: r.top + scrollY + r.height / 2, h: r.height}; }))};
  cond.stroke = {h: await full('conditions/stroke-warning-signs.html', 'cond-stroke.jpg'), urgent: await rect('.callout.urgent'), soon: await rect('.callout.soon'), care: await rect('.care-box')};
  meta.cond = cond;

  fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify(meta, null, 1));
  await b.close();
  console.log(JSON.stringify({games: meta.games, cond: meta.cond}, null, 1));
})();
