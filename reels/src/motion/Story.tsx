import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {Phone} from '../studio/devices';
import {AR, EN_THIN as EN} from '../theme';

// A voiced product-explainer reel (28 s, 30 fps): white pages with a soft violet glow rising from the bottom, kinetic
// Arabic type cut to a formal Arabic voice-over, a score that lifts as the mark lands and hits as it returns, and the
// real site playing on flat phones. Every cue below is a frame where a word is spoken (formal take B, fus-b.mp3: video
// frame = 30 t + 6).
// Audio: public/audio/story/mix.mp3, built by audio/story_mix.sh.
// Everything that matters stays inside the Reels safe area: y 260–1440, x 60–960.
export const STORY_FRAMES = 840;
export const INK = '#1D1D1F', VIO = '#7431F4', GREY = '#6E6E73';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const io = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const out = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
export const p = (f: number, a: number, d: number) => clamp((f - a) / d);
export const spr = (f: number, at: number, fps: number, c = {damping: 12, stiffness: 160, mass: 0.7}) => spring({frame: f - at, fps, config: c});

// ---------------------------------------------------------------- page: white, with a grainy gradient blob
// A few soft colour fields (pink-lilac, violet, blue-violet) are blurred together, then every pixel is pushed about by
// fine noise (feDisplacementMap), so the colour breaks into grain at its edges like a risograph print; a speckle of the
// same noise sits over the colour. The blob breathes, drifts, and glides to a new place behind each scene.
export type BlobKey = [number, number, number, number]; // frame, centre x, centre y, scale
const smooth = (t: number) => t * t * (3 - 2 * t);
const blobAt = (keys: BlobKey[], f: number) => {
  if (f <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, ...a] = keys[i], [f1, ...b] = keys[i + 1];
    if (f <= f1) { const t = smooth((f - f0) / Math.max(1, f1 - f0)); return a.map((v, j) => v + (b[j] - v) * t); }
  }
  return keys[keys.length - 1].slice(1);
};
export const Page: React.FC<{keys: BlobKey[]}> = ({keys}) => {
  const f = useCurrentFrame();
  const [x, y, sc] = blobAt(keys, f);
  const seed = Math.floor(f / 3) % 4; // the grain changes every 3 frames, like film
  const noise = staticFile(`grain/noise-${seed}.png`); // random pixels (public/grain), 540 x 960 drawn at 2x
  const w = (k: number, a: number) => Math.sin(f / k) * a;
  const id = `grain${seed}`;
  return (
    <AbsoluteFill style={{background: '#FFFFFF', overflow: 'hidden'}}>
      {/* loads the grain before the frame is taken (the filter's image is then already in the cache) */}
      <Img src={noise} style={{position: 'absolute', width: 1, height: 1, opacity: 0}} />
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id={id} filterUnits="userSpaceOnUse" x="0" y="0" width="1080" height="1920" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="95" result="soft" />
            <feImage href={noise} x="0" y="0" width="1080" height="1920" preserveAspectRatio="none" result="n" />
            {/* every pixel pushed a random few px: the colour scatters into grain at its edges */}
            <feDisplacementMap in="soft" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G" result="grainy" />
            {/* and a speckle over the colour (overlay leaves white untouched) */}
            <feColorMatrix in="n" type="saturate" values="0" result="ng" />
            <feComposite in="ng" in2="grainy" operator="in" result="ngi" />
            <feBlend in="ngi" in2="grainy" mode="overlay" result="speck" />
            <feComposite in="speck" in2="grainy" operator="arithmetic" k1="0" k2="0.55" k3="0.45" k4="0" />
          </filter>
        </defs>
        <g filter={`url(#${id})`}>
        <g transform={`translate(${x + w(47, 24)} ${y + w(61, 30)}) scale(${sc * (1 + w(53, 0.03))}) rotate(${w(90, 8)})`}>
          <ellipse cx={-70 + w(38, 30)} cy={70} rx={440} ry={480} fill="#D4B4F5" />
          <ellipse cx={-210 + w(44, 26)} cy={270 + w(57, 24)} rx={270} ry={210} fill="#EFC0F0" opacity={0.75} />
          <ellipse cx={120 + w(41, 34)} cy={-40 + w(36, 30)} rx={290} ry={330} fill="#8565F0" opacity={0.85} />
          <ellipse cx={230 + w(50, 22)} cy={90} rx={170} ry={250} fill="#6E50F0" opacity={0.65} />
          <ellipse cx={-20} cy={-300 + w(46, 20)} rx={260} ry={150} fill="#B9A6FA" opacity={0.6} />
        </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const Mark: React.FC<{size: number}> = ({size}) => (
  <svg viewBox={LOGO_VB} width={size} height={size * 0.632} style={{overflow: 'visible', display: 'block'}}>
    <defs><linearGradient id="sMark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A37BFF" /><stop offset="1" stopColor="#5A21D9" /></linearGradient></defs>
    <path d={LOGO_D} fill="url(#sMark)" />
  </svg>
);

// little line icons (24 px grid)
const ICON: Record<string, string> = {
  head: 'M9 21v-3H7a2 2 0 0 1-2-2v-3l-2-1 2-4a7 7 0 0 1 14 2c0 2.5-1 4-2 5v6',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  hand: 'M8 13V5a1.5 1.5 0 0 1 3 0v6m0-1V4a1.5 1.5 0 0 1 3 0v6m0-1V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.6-1.5L8 13',
  cloud: 'M7 18a4 4 0 0 1-.7-7.9 6 6 0 0 1 11.4 1.4A3.5 3.5 0 0 1 17.5 18z',
  heart: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
  wave: 'M3 12h3l2-5 3 10 3-8 2 3h5',
  cal: 'M5 6h14v14H5zM5 10h14M9 3v4m6-4v4',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  check: 'M5 12.5 10 17 19 7',
  phone: 'M6 3h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2',
};
export const Ico: React.FC<{n: string; size?: number; color?: string}> = ({n, size = 64, color = VIO}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICON[n]} /></svg>
);
// a small glass chip holding an icon, popping in with a little overshoot
export const Chip: React.FC<{f: number; at: number; n: string; x: number; y: number; size?: number; rot?: number; leave?: number}> = ({f, at, n, x, y, size = 96, rot = 0, leave = 1e9}) => {
  const {fps} = useVideoConfig();
  const k = spr(f, at, fps) * (1 - io(p(f, leave, 10)));
  if (f < at || k <= 0.001) return null;
  const bob = Math.sin((f - at) / 14) * 8;
  return (
    <div style={{position: 'absolute', left: x - size / 2, top: y - size / 2 + bob, width: size, height: size, borderRadius: size * 0.3, background: 'rgba(255,255,255,.85)', boxShadow: '0 16px 30px -12px rgba(90,40,200,.35), inset 0 0 0 1.5px rgba(124,80,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k}) rotate(${rot * (1 - k) + rot * 0.3}deg)`}}>
      <Ico n={n} size={size * 0.56} />
    </div>
  );
};

// a word that rises in (and can leave), for kinetic lines
const Word: React.FC<{f: number; at: number; leave?: number; children: React.ReactNode; color?: string; size?: number; weight?: number}> = ({f, at, leave = 1e9, children, color = INK, size = 96, weight = 500}) => {
  const k = out(p(f, at, 12)) * (1 - io(p(f, leave, 8)));
  return <span style={{display: 'inline-block', fontFamily: AR, fontWeight: weight, fontSize: size, color, lineHeight: 1.3, opacity: k, transform: `translateY(${(1 - k) * 40}px)`, filter: `blur(${(1 - k) * 8}px)`, padding: '0 .14em'}}>{children}</span>;
};
export const Row: React.FC<{y: number; children: React.ReactNode; dir?: 'rtl' | 'ltr'}> = ({y, children, dir = 'rtl'}) => (
  <div dir={dir} style={{position: 'absolute', top: y, left: 60, right: 60, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center'}}>{children}</div>
);

// a word that lands hard: drops in large and snaps to size on a stiff spring (for the spoken key words)
export const Slam: React.FC<{f: number; at: number; leave?: number; children: React.ReactNode; color?: string; size?: number; weight?: number; font?: string}> = ({f, at, leave = 1e9, children, color = INK, size = 96, weight = 300, font = AR}) => {
  const {fps} = useVideoConfig();
  if (f < at) return <span style={{display: 'inline-block', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.3, padding: '0 .14em', opacity: 0}}>{children}</span>;
  const k = spring({frame: f - at, fps, config: {damping: 14, stiffness: 260, mass: 0.6}});
  const l = io(p(f, leave, 7));
  return <span style={{display: 'inline-block', fontFamily: font, fontWeight: weight, fontSize: size, letterSpacing: font === AR ? 0 : '-0.025em', color, lineHeight: 1.3, padding: '0 .14em', opacity: clamp(k * 3) * (1 - l), transform: `translateY(${-l * 60}px) scale(${1.35 - 0.35 * k})`, filter: `blur(${l * 10}px)`}}>{children}</span>;
};

// the whole frame kicks a little on every cut (a quick zoom that settles), and shakes on the counter's stamps
const CUTS = [6, 31, 55, 83, 123, 162, 188, 246, 266, 310, 355, 369, 377, 385, 408, 455, 477, 494, 521, 583, 608, 646, 703, 797];
const SHAKES = [355, 369, 377, 385];
const kick = (f: number) => {
  const c = CUTS.filter((x) => x <= f).pop();
  return c === undefined ? 0 : Math.exp(-(f - c) / 4) * 0.045;
};
const shake = (f: number) => {
  const c = SHAKES.filter((x) => x <= f).pop();
  if (c === undefined || f - c > 8) return [0, 0];
  const a = Math.exp(-(f - c) / 2.5) * 14;
  return [Math.sin((f - c) * 2.7) * a, Math.cos((f - c) * 3.1) * a];
};

// ---------------------------------------------------------------- 0–2.6 s «صداع؟ تنميل؟ نسيان؟», each one full-frame on its word
const SYMPTOMS: [number, number, string, string][] = [[6, 31, 'صداع؟', 'head'], [31, 55, 'تنميل؟', 'hand'], [55, 80, 'نسيان؟', 'cloud']];
const Symptoms: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {SYMPTOMS.map(([at, end, word, icon], i) => {
        if (f < at || f > end + 6) return null;
        const k = spring({frame: f - at, fps, config: {damping: 13, stiffness: 240, mass: 0.6}});
        const l = io(p(f, end - 2, 7));
        const dir = i % 2 ? 1 : -1;
        return (
          <AbsoluteFill key={i} style={{transform: `translateX(${l * dir * -900}px)`, opacity: 1 - l * 0.6}}>
            <div style={{position: 'absolute', left: 540 - 300, top: 900 - 300, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,80,255,.22), rgba(124,80,255,0) 68%)', transform: `scale(${0.4 + 0.6 * k})`}} />
            <div style={{position: 'absolute', left: 540 - 85, top: 640, width: 170, height: 170, borderRadius: 52, background: 'rgba(255,255,255,.9)', boxShadow: '0 24px 44px -18px rgba(90,40,200,.45), inset 0 0 0 1.5px rgba(124,80,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k}) rotate(${(1 - k) * dir * 30}deg)`}}>
              <Ico n={icon} size={100} />
            </div>
            <div dir="rtl" style={{position: 'absolute', top: 860, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 200, fontSize: 210, color: i === 1 ? VIO : INK, lineHeight: 1.3, transform: `scale(${1.5 - 0.5 * k})`, opacity: clamp(k * 3)}}>{word}</div>
            <div style={{position: 'absolute', top: 1240, width: '100%', display: 'flex', justifyContent: 'center', gap: 18}}>
              {[0, 1, 2].map((j) => <div key={j} style={{width: 18, height: 18, borderRadius: 9, background: j === i ? VIO : 'rgba(124,80,255,.22)'}} />)}
            </div>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- 2.6–5.4 s a ring of the site and the doctors: «أسئلةٌ كثيرة… والإجابةُ تبدأ»
export const RING = ['cap/panels-hd/hero.jpg', 'img/haifa-cut.webp', 'cap/panels-hd/conditions.jpg', 'img/said-cut.webp', 'cap/panels-hd/games.jpg', 'img/wafaa-cut.webp', 'cap/panels-hd/booking.jpg', 'cap/panels-hd/doctors.jpg'];
const Ring: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 76 || f > 176) return null;
  const burst = out(p(f, 158, 14)); // flung outwards as the violet floods in
  return (
    <>
      {RING.map((src, i) => {
        const k = spr(f, 78 + i * 2, fps, {damping: 14, stiffness: 140, mass: 0.7});
        const a = (i / RING.length) * Math.PI * 2 + (f - 78) / 40 - Math.PI / 2;
        const r = 340 * k * (1 + burst * 1.6);
        const x = 540 + Math.cos(a) * r * 0.92, y = 900 + Math.sin(a) * r * 1.25;
        const doc = src.startsWith('img/');
        const w = doc ? 190 : 210, h = doc ? 190 : 250;
        return (
          <div key={i} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 28, overflow: 'hidden', opacity: clamp(k * 2) * (1 - burst), transform: `scale(${k * (1 + burst * 0.4)}) rotate(${Math.sin(a) * 8 + burst * 30}deg)`,
            background: doc ? 'radial-gradient(circle at 50% 40%, #EADFFF, #C7B2FF)' : '#fff', boxShadow: '0 20px 40px -18px rgba(90,40,200,.4), inset 0 0 0 1.5px rgba(124,80,255,.12)'}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: doc ? '50% 15%' : 'top'}} />
          </div>
        );
      })}
      <Row y={820}><Slam f={f} at={83} leave={156} size={84}>أسئلةٌ</Slam><Slam f={f} at={95} leave={156} size={84} color={VIO}>كثيرة</Slam></Row>
      <Row y={940}><Slam f={f} at={123} leave={156} size={64} weight={300} color={GREY}>والإجابةُ</Slam><Slam f={f} at={147} leave={156} size={64} weight={300} color={GREY}>تبدأ…</Slam></Row>
    </>
  );
};

// ---------------------------------------------------------------- 5.2–7 s violet floods the frame on «من هنا», then drains into a ring
const Flood: React.FC<{f: number}> = ({f}) => {
  if (f < 154 || f > 252) return null;
  const grow = io(p(f, 154, 10));
  const drain = io(p(f, 182, 14));
  const r = 40 + grow * 1300 - drain * 1300;
  const ring = f >= 196; // once drained, the disc becomes a ring waiting for the mark
  const pulse = 1 + Math.sin((f - 196) / 3) * 0.04;
  const away = out(p(f, 222, 8)); // gone before the name moves up past it
  return (
    <>
      {!ring ? (
        <div style={{position: 'absolute', left: 540 - r, top: 860 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, #8A55FF, ${VIO} 55%, #5A21D9)`}} />
      ) : (
        <div style={{position: 'absolute', left: 500, top: 820, width: 80, height: 80, borderRadius: 40, border: `14px solid ${VIO}`, transform: `scale(${pulse * (1 + away * 3)})`, opacity: 1 - away}} />
      )}
      {f < 188 && (
        <div dir="rtl" style={{position: 'absolute', top: 780, width: '100%', display: 'flex', justifyContent: 'center', opacity: 1 - io(p(f, 180, 6))}}>
          <Slam f={f} at={162} size={170} weight={200} color="#fff">من</Slam><Slam f={f} at={167} size={170} weight={200} color="#fff">هنا</Slam>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------- 6.2–8.9 s «طبُّ وعلومُ الأعصاب… بموقعها الجديد»: the mark lands on the score's lift
const Brand: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 186 || f > 270) return null;
  const grow = spring({frame: f - 246, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const up = io(p(f, 226, 14)); // the name moves up to make room for the address
  const leave = io(p(f, 260, 9));
  const url = 'neurouniverse.om';
  const typed = Math.min(url.length, Math.max(0, Math.floor((f - 250) / 1.1)));
  return (
    <AbsoluteFill style={{opacity: 1 - leave, transform: `translateY(${-leave * 140}px)`}}>
      {f >= 246 && <div style={{position: 'absolute', left: 540, top: 640, transform: `translate(-50%,-50%) scale(${grow * 0.75})`}}><Mark size={360} /></div>}
      <div style={{position: 'absolute', top: 1040 - up * 240, width: '100%'}}>
        <Row y={0}><Slam f={f} at={188} size={92} weight={300}>طبُّ</Slam><Slam f={f} at={194} size={92} weight={300}>وعلومُ</Slam><Slam f={f} at={204} size={92} weight={300} color={VIO}>الأعصاب</Slam></Row>
      </div>
      {f >= 226 && (
        <>
          <Row y={950}><Slam f={f} at={226} size={64} color={GREY} weight={300}>بموقعها</Slam><Slam f={f} at={246} size={64} color={VIO}>الجديد</Slam></Row>
          <div style={{position: 'absolute', left: 210, top: 1090, width: 660, height: 104, borderRadius: 52, background: 'rgba(255,255,255,.92)', boxShadow: '0 20px 40px -18px rgba(90,40,200,.45), inset 0 0 0 1.5px rgba(124,80,255,.18)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 36px', transform: `scale(${spr(f, 246, fps)})`}}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={VIO} strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            <span style={{fontFamily: EN, fontWeight: 300, fontSize: 46, color: INK}}>{url.slice(0, typed)}<span style={{display: 'inline-block', width: 4, height: 46, marginLeft: 4, background: VIO, verticalAlign: 'middle', opacity: Math.floor(f / 8) % 2 ? 1 : 0}} /></span>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8.9–20.2 s three stops on a flat phone, each cut in on its spoken title
type Use = {from: number; to: number; rec: string; head: [string, number, string?][]; sub: [string, number, string?][]; chips: [string, number, number, number][]};
const USES: Use[] = [
  {from: 266, to: 405, rec: 'phone-guide.mp4', head: [['اعرفْ', 269], ['أعراضَك', 282, VIO]], sub: [['ومتى', 310], ['تتصلُ', 326], ['برقمِ', 344], ['الطوارئ', 355, '#D70015']], chips: [['heart', 200, 1000, 284], ['wave', 860, 1150, 300], ['head', 200, 1260, 312]]},
  {from: 403, to: 521, rec: 'phone-doctors.mp4', head: [['تعرَّفْ على', 408], ['أطبائنا', 426, VIO]], sub: [['استشاريون', 455], ['للكبار', 477], ['والأطفال', 494, VIO]], chips: [['star', 860, 900, 432]]},
  {from: 518, to: 606, rec: 'phone-book.mp4', head: [['احجزْ', 521], ['موعدَك', 534, VIO]], sub: [['في دقيقة', 547]], chips: [['cal', 200, 960, 536], ['check', 200, 1260, 556]]},
];
const UseScene: React.FC<{f: number; u: Use}> = ({f, u}) => {
  const {fps} = useVideoConfig();
  if (f < u.from || f > u.to + 2) return null;
  const rise = spring({frame: f - u.from, fps, config: {damping: 16, stiffness: 150, mass: 0.8}});
  const leave = io(p(f, u.to - 8, 9)); // whips up and out as the next scene comes up underneath
  return (
    <AbsoluteFill style={{transform: `translateY(${-leave * 1500}px)`, filter: leave > 0.02 ? `blur(${leave * 14}px)` : undefined}}>
      {/* the title with the spoken line flowing under it, inside the Reels safe area */}
      <div dir="rtl" style={{position: 'absolute', top: 262, left: 90, right: 90, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>{u.head.map(([w, at, c], i) => <Slam key={i} f={f} at={at} size={92} color={c ?? INK}>{w}</Slam>)}</div>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: -16}}>{u.sub.map(([w, at, c], i) => <Slam key={i} f={f} at={at} size={48} weight={300} color={c ?? GREY}>{w}</Slam>)}</div>
      </div>
      <Sequence from={u.from} durationInFrames={u.to - u.from + 4} layout="none">
        <AbsoluteFill style={{transform: `translateY(${(1 - rise) * 1300}px) rotate(${(1 - rise) * 5}deg)`}}>
          <Phone src={u.rec} k={0.9} cx={540} top={548} lift={10} />
        </AbsoluteFill>
      </Sequence>
      {u.chips.map(([n, x, y, at], i) => <Chip key={i} f={f} at={at} n={n} x={x} y={y} rot={i % 2 ? 10 : -10} />)}
    </AbsoluteFill>
  );
};

// the emergency number stamps up on «الطوارئ» (a beat of the score), then one nine per half-beat
const NINES = [355, 369, 377, 385];
const Counter: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 355 || f > 406) return null;
  const n = NINES.filter((x) => x <= f).length;
  const k = spring({frame: f - NINES[n - 1], fps, config: {damping: 10, stiffness: 300, mass: 0.5}});
  const first = spring({frame: f - 355, fps, config: {damping: 12, stiffness: 220, mass: 0.6}});
  const leave = io(p(f, 397, 9));
  return (
    <div style={{position: 'absolute', right: 140, top: 760 - leave * 1500, transform: `rotate(${6 - first * 2}deg) scale(${first * (1.25 - 0.25 * k)})`, transformOrigin: '100% 50%'}}>
      <div style={{padding: '22px 40px', borderRadius: 999, background: '#D70015', color: '#fff', fontFamily: EN, fontWeight: 300, fontSize: 92, letterSpacing: 2, boxShadow: '0 22px 40px -14px rgba(215,0,21,.55)', display: 'flex', alignItems: 'center', gap: 18}}>
        <Ico n="phone" size={70} color="#fff" />{'9'.repeat(n)}
      </div>
    </div>
  );
};

// the doctors pop in round the phone, one per spoken word of «استشاريون للكبار والأطفال»
const DOCS: [string, number, number, number][] = [['img/haifa-cut.webp', 455, 200, 900], ['img/said-cut.webp', 477, 830, 1080], ['img/wafaa-cut.webp', 494, 200, 1240]];
const Doctors: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 455 || f > 522) return null;
  const leave = io(p(f, 513, 9));
  return (
    <>
      {DOCS.map(([src, at, x, y], i) => {
        if (f < at) return null;
        const k = spring({frame: f - at, fps, config: {damping: 11, stiffness: 220, mass: 0.6}});
        const bob = Math.sin((f - at) / 12) * 8;
        return (
          <div key={i} style={{position: 'absolute', left: x - 100, top: y - 100 + bob - leave * 1500, width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #EADFFF, #B79BFF)', border: '8px solid #fff', boxShadow: '0 24px 44px -18px rgba(90,40,200,.5)', transform: `scale(${k}) rotate(${(1 - k) * (i % 2 ? 20 : -20)}deg)`}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%'}} />
          </div>
        );
      })}
    </>
  );
};

// «عبر واتساب»: a WhatsApp-green sticker slaps on, then «تم ✓»
const Whats: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 570 || f > 608) return null;
  const a = spring({frame: f - 583, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
  const b = spring({frame: f - 594, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
  const leave = io(p(f, 598, 9));
  const pill = (txt: string, k: number, x: number, y: number, rot: number) => (
    <div dir="rtl" style={{position: 'absolute', left: x, top: y - leave * 1500, padding: '20px 38px', borderRadius: 999, background: '#25D366', color: '#fff', fontFamily: AR, fontWeight: 500, fontSize: 58, boxShadow: '0 20px 38px -12px rgba(37,211,102,.55)', transform: `scale(${k}) rotate(${rot * (1 - k) + rot * 0.3}deg)`, opacity: clamp(k * 3)}}>{txt}</div>
  );
  return (
    <>
      <Row y={1350}><Slam f={f} at={570} size={56} weight={300} color="#1DA851" leave={598}>عبر واتساب</Slam></Row>
      {f >= 583 && pill('واتساب', a, 600, 880, 14)}
      {f >= 594 && pill('تم ✓', b, 90, 1180, -12)}
    </>
  );
};

// ---------------------------------------------------------------- 20.1–23.2 s «صحةُ دماغِك… تستحقُّ إجابةً واضحة»
const Brain: React.FC<{f: number}> = ({f}) => (
  f < 604 || f > 708 ? null : (
    <>
      <Row y={770}><Slam f={f} at={608} leave={698} size={120}>صحةُ</Slam><Slam f={f} at={621} leave={698} size={120} color={VIO}>دماغِك</Slam></Row>
      <Row y={960}><Slam f={f} at={646} leave={698} size={84} weight={200}>تستحقُّ</Slam><Slam f={f} at={662} leave={698} size={84} weight={200}>إجابةً</Slam><Slam f={f} at={678} leave={698} size={84} color={VIO}>واضحة</Slam></Row>
      <Chip f={f} at={622} n="head" x={190} y={660} size={110} rot={-10} leave={698} />
      <Chip f={f} at={680} n="check" x={850} y={1220} size={100} rot={10} leave={698} />
      <Chip f={f} at={650} n="heart" x={850} y={640} size={80} rot={8} leave={698} />
    </>
  )
);

// ---------------------------------------------------------------- 23.2–28 s typed with the voice, then the mark on the score's final hit
const Cta: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 700) return null;
  // typed word by word as it is spoken
  const parts: [string, number][] = [['احجز ', 703], ['موعدك ', 715], ['الآن', 729]];
  let text = '';
  for (const [w, at] of parts) text += w.slice(0, Math.max(0, Math.min(w.length, Math.floor((f - at) / 1.6) + 1)));
  const caret = Math.floor(f / 8) % 2 === 0;
  const lift = io(p(f, 782, 14));
  const mark = spring({frame: f - 797, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 840 - lift * 260, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 300, fontSize: 120 - lift * 24, color: VIO}}>
        {f >= 703 ? text : ''}<span style={{display: 'inline-block', width: 8, height: 120, marginRight: 8, background: VIO, verticalAlign: 'middle', opacity: caret && lift < 0.5 ? 1 : 0}} />
      </div>
      {f >= 797 && (
        <>
          <div style={{position: 'absolute', left: 540, top: 960, transform: `translate(-50%,-50%) scale(${mark})`}}><Mark size={260} /></div>
          <div style={{position: 'absolute', top: 1110, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 300, fontSize: 52, color: INK, opacity: out(p(f, 806, 10)), transform: `translateY(${(1 - out(p(f, 806, 10))) * 24}px)`}}>neurouniverse.om</div>
          <div dir="rtl" style={{position: 'absolute', top: 1196, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 300, fontSize: 40, color: GREY, opacity: out(p(f, 814, 10))}}>طبّ وعلوم الأعصاب · مسقط · الرابط في البايو</div>
        </>
      )}
    </AbsoluteFill>
  );
};

const SFX: [number, string, number][] = [
  [6, 'blip', 0.22], [31, 'blip', 0.22], [55, 'blip', 0.22], [76, 'whoosh', 0.2], [152, 'whip', 0.25], [162, 'bloom', 0.25],
  [186, 'zip', 0.15], [246, 'spark', 0.25], [250, 'scan', 0.12], [262, 'whoosh', 0.22], [355, 'tap', 0.3], [369, 'tap', 0.3], [377, 'tap', 0.3], [385, 'lock', 0.3],
  [397, 'whip', 0.22], [455, 'blip', 0.18], [477, 'blip', 0.18], [494, 'blip', 0.18], [513, 'whip', 0.22], [583, 'ding', 0.25], [594, 'star', 0.2],
  [600, 'whoosh', 0.18], [797, 'bloom', 0.3],
];

// where the blob sits behind each scene: frame, x, y, scale
const BLOB: BlobKey[] = [[0, 600, 1500, 0.8], [76, 500, 1520, 0.85], [180, 540, 1500, 0.85], [204, 600, 1540, 0.8], [262, 540, 1180, 0.95], [604, 540, 1180, 0.95], [626, 440, 1560, 0.85], [700, 440, 1560, 0.85], [730, 600, 1560, 0.9]];

export const Story: React.FC = () => {
  const f = useCurrentFrame();
  const [sx, sy] = shake(f);
  return (
    <AbsoluteFill>
      <Page keys={BLOB} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + kick(f)})`}}>
        <Symptoms f={f} />
        <Ring f={f} />
        <Flood f={f} />
        <Brand f={f} />
        {USES.map((u, i) => <UseScene key={i} f={f} u={u} />)}
        <Counter f={f} />
        <Doctors f={f} />
        <Whats f={f} />
        <Brain f={f} />
        <Cta f={f} />
      </AbsoluteFill>
      <Audio src={staticFile('audio/story/mix.mp3')} />
      {SFX.map(([at, n, v], i) => (
        <Sequence key={i} from={at}><Audio src={staticFile(`audio/eleven/sfx-${n}.mp3`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
