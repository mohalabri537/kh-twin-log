// Records the live website as 30 fps videos for the reel, so the site's own motion (portraits rising, sections
// revealing, choices being made) plays inside the device mockups.
// - Phone: one screenshot per output frame at 2.5x (sharp), with the page's CSS animations and transitions slowed to the
//   capture speed (CDP Animation.setPlaybackRate), so they play at their true speed in the 30 fps result.
// - Desktop: a real-time screencast (already full size at 1440 px), resampled to 30 fps.
// Usage: serve the website on http://localhost:8765, then  node scripts/record-site.js public/rec [name...]
const {chromium} = require('playwright');
const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const ONLY = process.argv.slice(3);
const BASE = 'http://localhost:8765/ar/';
const FPS = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
// scroll position at time t (s) along [t, y] keys, eased between each pair
const yAt = (keys, t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, y0] = keys[i], [t1, y1] = keys[i + 1];
    if (t <= t1) return y0 + (y1 - y0) * ease((t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
};

// pick(name): choose a booking option; the booking page renders its options with JavaScript
const pickJs = (name, which) => `(() => { const all = [...document.querySelectorAll('input[name="${name}"]')].filter((x) => !x.disabled);
  const e = typeof ${JSON.stringify(which)} === 'string' ? all.find((x) => x.value === ${JSON.stringify(which)}) : all[${JSON.stringify(which)}];
  e.checked = true; e.dispatchEvent(new Event('change', {bubbles: true})); })()`;

const PHONE = [
  // the homepage's doctors, all three: the living portraits rise as they scroll in (keys are from the section's top)
  {name: 'phone-doctors', url: 'index.html', anchor: 'section:has(.docs)', secs: 5.6, keys: [[0, -40], [0.5, -40], [5.4, 640]]},
  // the symptoms and conditions guide: the red 9999 box, then the topics
  {name: 'phone-guide', url: 'conditions.html', secs: 4.6, keys: [[0, 0], [0.7, 0], [4.4, 1500]]},
  // booking: a paediatric consultation with Dr. Wafaa, her first date, evening; the phone field is hidden
  {name: 'phone-book', url: 'book.html', secs: 4.6, css: '.field:has(#f-mobile){display:none!important}',
    keys: [[0, 380], [0.9, 380], [1.3, 780], [1.9, 780], [2.3, 1000], [2.9, 1000], [3.3, 1330], [3.9, 1330], [4.4, 1500]],
    at: [[0.6, pickJs('svc', 'paeds')], [1.6, pickJs('doc', 'wafaa')], [2.6, pickJs('date', 0)], [3.6, pickJs('time', 0)]]},
  // the homepage from the top, for the every-screen shot
  {name: 'phone-home', url: 'index.html', secs: 3.4, keys: [[0, 0], [0.4, 0], [3.3, 700]]},
];
const DESK = [
  // the homepage on a desktop: the opening logo scene, then down through the page
  {name: 'desk-home', url: 'index.html', secs: 6.2, keys: [[0, 0], [0.6, 0], [6.0, 2600]]},
];

async function phone(b, s) {
  const dir = path.join(OUT, s.name); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
  const p = await ctx.newPage();
  await p.goto(BASE + s.url, {waitUntil: 'networkidle'});
  if (s.css) await p.addStyleTag({content: s.css});
  // keys measured from a section's top, if given
  const off = s.anchor ? await p.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY - 60, s.anchor) : 0;
  s.keys = s.keys.map(([t, y]) => [t, y + off]);
  await p.evaluate((y) => scrollTo(0, y), s.keys[0][1]); await sleep(1500);
  const c = await ctx.newCDPSession(p);
  await c.send('Animation.enable');
  const n = Math.round(s.secs * FPS);
  const acts = [...(s.at || [])];
  let rate = 0.25, last = Date.now();
  await c.send('Animation.setPlaybackRate', {playbackRate: rate});
  for (let i = 0; i < n; i++) {
    const t = i / FPS;
    while (acts.length && acts[0][0] <= t) await p.evaluate(acts.shift()[1]);
    await p.evaluate((y) => scrollTo(0, y), yAt(s.keys, t));
    await p.screenshot({path: path.join(dir, `${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90});
    // keep animation time at 1/30 s per frame, whatever a screenshot takes
    const now = Date.now(), dt = (now - last) / 1000; last = now;
    rate = rate * 0.6 + Math.min(1, (1 / FPS) / dt) * 0.4;
    await c.send('Animation.setPlaybackRate', {playbackRate: rate});
  }
  await ctx.close();
  encode(dir, s.name);
}

async function desk(b, s) {
  const dir = path.join(OUT, s.name); fs.rmSync(dir, {recursive: true, force: true}); fs.mkdirSync(dir, {recursive: true});
  const ctx = await b.newContext({viewport: {width: 1440, height: 900}, deviceScaleFactor: 1, colorScheme: 'light', locale: 'ar-OM', timezoneId: 'Asia/Muscat'});
  const p = await ctx.newPage();
  await p.goto(BASE + s.url, {waitUntil: 'networkidle'});
  await p.addStyleTag({content: 'html{scrollbar-width:none}::-webkit-scrollbar{display:none}'});
  await sleep(1500);
  const c = await ctx.newCDPSession(p);
  const frames = [];
  c.on('Page.screencastFrame', async (e) => { frames.push({t: e.metadata.timestamp, data: e.data}); await c.send('Page.screencastFrameAck', {sessionId: e.sessionId}).catch(() => {}); });
  await c.send('Page.startScreencast', {format: 'jpeg', quality: 92, everyNthFrame: 1});
  await sleep(150);
  await p.evaluate(({keys, secs}) => new Promise((res) => {
    const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const yAt = (t) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) { const [t0, y0] = keys[i], [t1, y1] = keys[i + 1]; if (t <= t1) return y0 + (y1 - y0) * ease((t - t0) / (t1 - t0)); } return keys[keys.length - 1][1]; };
    window.__t0 = performance.now();
    const step = (now) => { const t = (now - window.__t0) / 1000; scrollTo(0, yAt(t)); t < secs ? requestAnimationFrame(step) : res(); };
    requestAnimationFrame(step);
  }), {keys: s.keys, secs: s.secs});
  await sleep(200);
  await c.send('Page.stopScreencast');
  await ctx.close();
  // resample to 30 fps: for each output frame, the latest screencast frame at or before its time
  const t0 = frames[0].t, n = Math.round(s.secs * FPS);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + 0.15 + i / FPS;
    while (j < frames.length - 1 && frames[j + 1].t <= t) j++;
    fs.writeFileSync(path.join(dir, `${String(i).padStart(4, '0')}.jpg`), Buffer.from(frames[j].data, 'base64'));
  }
  console.log(s.name, frames.length, 'screencast frames ->', n);
  encode(dir, s.name);
}

function encode(dir, name) {
  const out = path.join(OUT, `${name}.mp4`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', out]);
  fs.rmSync(dir, {recursive: true, force: true});
  console.log('wrote', out);
}

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const b = await chromium.launch();
  for (const s of PHONE) if (!ONLY.length || ONLY.includes(s.name)) await phone(b, s);
  for (const s of DESK) if (!ONLY.length || ONLY.includes(s.name)) await desk(b, s);
  await b.close();
})();
