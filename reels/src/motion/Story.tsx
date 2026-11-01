import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {Phone} from '../studio/devices';
import {AR, EN} from '../theme';

// A voiced product-explainer reel (28 s, 30 fps): white pages with a soft violet glow rising from the bottom, kinetic
// Arabic type cut to a Saudi voice-over, a score that lifts as the mark lands and hits as it returns, and the real site
// playing on flat phones. Every cue below is a frame where a word is spoken (voice take B: video frame = 30 t - 17).
// Audio: public/audio/story/mix.mp3, built by audio/story_mix.sh.
export const STORY_FRAMES = 840;
export const INK = '#1D1D1F', VIO = '#7431F4', GREY = '#6E6E73';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const io = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const out = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
export const p = (f: number, a: number, d: number) => clamp((f - a) / d);
export const spr = (f: number, at: number, fps: number, c = {damping: 12, stiffness: 160, mass: 0.7}) => spring({frame: f - at, fps, config: c});

// ---------------------------------------------------------------- page: white, a violet glow rising from the bottom, grain
export const Page: React.FC<{glow: number}> = ({glow}) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 8;
  const w = (k: number) => Math.sin(f / k) * 50;
  return (
    <AbsoluteFill style={{background: '#FFFFFF', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -300 + w(40), right: -300 - w(50), bottom: -900 + (1 - glow) * 500, height: 1500, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 50%, rgba(124,80,255,.85), rgba(178,140,255,.55) 35%, rgba(230,190,255,.25) 55%, rgba(255,255,255,0) 72%)', filter: 'blur(40px)'}} />
      <div style={{position: 'absolute', left: 120 + w(33), bottom: -300 + (1 - glow) * 400, width: 900, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,120,210,.45), rgba(255,255,255,0) 65%)', filter: 'blur(50px)'}} />
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: 0.4, mixBlendMode: 'soft-light'}}>
        <filter id={`sg${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter={`url(#sg${seed})`} />
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
export const Slam: React.FC<{f: number; at: number; leave?: number; children: React.ReactNode; color?: string; size?: number; weight?: number; font?: string}> = ({f, at, leave = 1e9, children, color = INK, size = 96, weight = 600, font = AR}) => {
  const {fps} = useVideoConfig();
  if (f < at) return <span style={{display: 'inline-block', fontFamily: font, fontWeight: weight, fontSize: size, lineHeight: 1.3, padding: '0 .14em', opacity: 0}}>{children}</span>;
  const k = spring({frame: f - at, fps, config: {damping: 14, stiffness: 260, mass: 0.6}});
  const l = io(p(f, leave, 7));
  return <span style={{display: 'inline-block', fontFamily: font, fontWeight: weight, fontSize: size, color, lineHeight: 1.3, padding: '0 .14em', opacity: clamp(k * 3) * (1 - l), transform: `translateY(${-l * 60}px) scale(${1.35 - 0.35 * k})`, filter: `blur(${l * 10}px)`}}>{children}</span>;
};

// the whole frame kicks a little on every cut (a quick zoom that settles), and shakes on the counter's stamps
const CUTS = [9, 47, 72, 95, 120, 168, 198, 245, 290, 344, 387, 399, 413, 425, 443, 471, 538, 606, 639, 683, 738, 794];
const SHAKES = [387, 399, 413, 425];
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

// ---------------------------------------------------------------- 0–1.5 s «كل يوم، سؤال جديد»
const Hook: React.FC<{f: number}> = ({f}) => (
  f > 50 ? null : (
    <>
      <Row y={780}><Slam f={f} at={9} leave={42} size={120}>كل</Slam><Slam f={f} at={13} leave={42} size={120}>يوم،</Slam></Row>
      <Row y={940}><Slam f={f} at={19} leave={42} size={120}>سؤال</Slam><Slam f={f} at={27} leave={42} size={120} color={VIO}>جديد</Slam></Row>
      <Chip f={f} at={20} n="cloud" x={220} y={690} rot={-12} leave={42} />
      <Chip f={f} at={28} n="bolt" x={860} y={1170} size={84} rot={10} leave={42} />
    </>
  )
);

// ---------------------------------------------------------------- 1.5–4 s the three symptoms, each one full-frame on its word
const SYMPTOMS: [number, number, string, string][] = [[47, 72, 'صداع؟', 'head'], [72, 95, 'تنميل؟', 'hand'], [95, 118, 'نسيان؟', 'cloud']];
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
            {/* a soft violet disc behind, and the icon riding on it */}
            <div style={{position: 'absolute', left: 540 - 300, top: 900 - 300, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,80,255,.22), rgba(124,80,255,0) 68%)', transform: `scale(${0.4 + 0.6 * k})`}} />
            <div style={{position: 'absolute', left: 540 - 85, top: 640, width: 170, height: 170, borderRadius: 52, background: 'rgba(255,255,255,.9)', boxShadow: '0 24px 44px -18px rgba(90,40,200,.45), inset 0 0 0 1.5px rgba(124,80,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k}) rotate(${(1 - k) * dir * 30}deg)`}}>
              <Ico n={icon} size={100} />
            </div>
            <div dir="rtl" style={{position: 'absolute', top: 860, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 700, fontSize: 220, color: i === 1 ? VIO : INK, lineHeight: 1.3, transform: `scale(${1.5 - 0.5 * k})`, opacity: clamp(k * 3)}}>{word}</div>
            <div style={{position: 'absolute', top: 1240, width: '100%', display: 'flex', justifyContent: 'center', gap: 18}}>
              {[0, 1, 2].map((j) => <div key={j} style={{width: 18, height: 18, borderRadius: 9, background: j === i ? VIO : 'rgba(124,80,255,.22)'}} />)}
            </div>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- 4–6.4 s a ring of the site and the doctors, «تبحث عن إجابة واضحة؟»
export const RING = ['cap/panels-hd/hero.jpg', 'img/haifa-cut.webp', 'cap/panels-hd/conditions.jpg', 'img/said-cut.webp', 'cap/panels-hd/games.jpg', 'img/wafaa-cut.webp', 'cap/panels-hd/booking.jpg', 'cap/panels-hd/doctors.jpg'];
const Ring: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 114 || f > 186) return null;
  const burst = out(p(f, 164, 14)); // flung outwards as the violet floods in
  return (
    <>
      {RING.map((src, i) => {
        const k = spr(f, 116 + i * 2, fps, {damping: 14, stiffness: 140, mass: 0.7});
        const a = (i / RING.length) * Math.PI * 2 + (f - 116) / 40 - Math.PI / 2;
        const r = 340 * k * (1 + burst * 1.6);
        const x = 540 + Math.cos(a) * r * 1.05, y = 900 + Math.sin(a) * r * 1.4;
        const doc = src.startsWith('img/');
        const w = doc ? 190 : 210, h = doc ? 190 : 250;
        return (
          <div key={i} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 28, overflow: 'hidden', opacity: clamp(k * 2) * (1 - burst), transform: `scale(${k * (1 + burst * 0.4)}) rotate(${Math.sin(a) * 8 + burst * 30}deg)`,
            background: doc ? 'radial-gradient(circle at 50% 40%, #EADFFF, #C7B2FF)' : '#fff', boxShadow: '0 20px 40px -18px rgba(90,40,200,.4), inset 0 0 0 1.5px rgba(124,80,255,.12)'}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: doc ? '50% 15%' : 'top'}} />
          </div>
        );
      })}
      <Row y={830}><Slam f={f} at={120} leave={162} size={76}>تبحث</Slam><Slam f={f} at={132} leave={162} size={76}>عن</Slam></Row>
      <Row y={930}><Slam f={f} at={137} leave={162} size={76}>إجابة</Slam><Slam f={f} at={149} leave={162} size={76} color={VIO}>واضحة؟</Slam></Row>
    </>
  );
};

// ---------------------------------------------------------------- 5.5–8 s violet floods the frame: «إليك الحل», then drains into a ring
const Flood: React.FC<{f: number}> = ({f}) => {
  if (f < 162 || f > 250) return null;
  const grow = io(p(f, 162, 12));
  const drain = io(p(f, 194, 16));
  const r = 40 + grow * 1300 - drain * 1300;
  const ring = f >= 210; // once drained, the disc becomes a ring waiting for the mark
  const pulse = 1 + Math.sin((f - 210) / 3) * 0.04;
  const away = out(p(f, 243, 8));
  return (
    <>
      {!ring ? (
        <div style={{position: 'absolute', left: 540 - r, top: 860 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, #8A55FF, ${VIO} 55%, #5A21D9)`}} />
      ) : (
        <div style={{position: 'absolute', left: 500, top: 820, width: 80, height: 80, borderRadius: 40, border: `14px solid ${VIO}`, transform: `scale(${pulse * (1 + away * 3)})`, opacity: 1 - away}} />
      )}
      {f < 200 && (
        <div dir="rtl" style={{position: 'absolute', top: 780, width: '100%', display: 'flex', justifyContent: 'center', opacity: 1 - io(p(f, 192, 6))}}>
          <Slam f={f} at={168} size={150} weight={700} color="#fff">إليك</Slam><Slam f={f} at={180} size={150} weight={700} color="#fff">الحل</Slam>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------- 6.6–9.6 s «عيادة طبّ وعلوم الأعصاب… بموقعها الجديد»: the mark lands on the lift
const Brand: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 196 || f > 292) return null;
  const grow = spring({frame: f - 245, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const up = io(p(f, 252, 14)); // the mark and name move up to make room for the address
  const leave = io(p(f, 282, 10));
  const url = 'neurouniverse.om';
  const typed = Math.min(url.length, Math.max(0, Math.floor((f - 258) / 1.2)));
  return (
    <AbsoluteFill style={{opacity: 1 - leave, transform: `translateY(${-leave * 140}px)`}}>
      {f >= 245 && <div style={{position: 'absolute', left: 540, top: 860 - up * 120, transform: `translate(-50%,-50%) scale(${grow * (1 - up * 0.3)})`}}><Mark size={360} /></div>}
      <div style={{position: 'absolute', top: 1040 - up * 190, width: '100%'}}>
        <Row y={0}>
          <Slam f={f} at={198} size={84}>عيادة</Slam><Slam f={f} at={213} size={84}>طبّ</Slam><Slam f={f} at={222} size={84}>وعلوم</Slam><Slam f={f} at={235} size={84} color={VIO}>الأعصاب</Slam>
        </Row>
      </div>
      {f >= 255 && (
        <>
          <Row y={1000}><Slam f={f} at={255} size={64} color={GREY} weight={500}>بموقعها</Slam><Slam f={f} at={268} size={64} color={VIO}>الجديد</Slam></Row>
          {/* an address bar typing the site */}
          <div style={{position: 'absolute', left: 540 - 330, top: 1130, width: 660, height: 104, borderRadius: 52, background: 'rgba(255,255,255,.92)', boxShadow: '0 20px 40px -18px rgba(90,40,200,.45), inset 0 0 0 1.5px rgba(124,80,255,.18)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 36px', transform: `scale(${spr(f, 256, fps)})`}}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={VIO} strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            <span style={{fontFamily: EN, fontWeight: 500, fontSize: 46, color: INK}}>{url.slice(0, typed)}<span style={{display: 'inline-block', width: 4, height: 46, marginLeft: 4, background: VIO, verticalAlign: 'middle', opacity: Math.floor(f / 8) % 2 ? 1 : 0}} /></span>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9.7–21 s three uses on a flat phone, each one cut in on its spoken title
type Use = {from: number; to: number; rec: string; head: [string, number, string?][]; sub: [string, number, string?][]; chips: [string, number, number, number][]};
const USES: Use[] = [
  {from: 290, to: 440, rec: 'phone-guide.mp4', head: [['دليل', 295], ['واضح', 304], ['للأعراض', 312, VIO]], sub: [['ومتى', 344], ['تتصل', 357], ['بالرقم', 370]], chips: [['heart', 180, 1000, 300], ['wave', 900, 1250, 318], ['head', 170, 1440, 330]]},
  {from: 438, to: 536, rec: 'phone-doctors.mp4', head: [['أطباؤنا', 443, VIO]], sub: [['استشاريون', 471], ['للكبار', 493], ['والأطفال', 511, VIO]], chips: [['star', 900, 980, 452]]},
  {from: 533, to: 640, rec: 'phone-book.mp4', head: [['واحجز', 538], ['موعدك', 556, VIO]], sub: [['بخطوات', 571], ['بسيطة', 586]], chips: [['cal', 180, 1000, 548], ['check', 190, 1480, 590]]},
];
const UseScene: React.FC<{f: number; u: Use}> = ({f, u}) => {
  const {fps} = useVideoConfig();
  if (f < u.from || f > u.to + 2) return null;
  const g = f - u.from;
  const rise = spring({frame: g, fps, config: {damping: 16, stiffness: 150, mass: 0.8}});
  const leave = io(p(f, u.to - 8, 9)); // whips up and out as the next scene comes up underneath
  return (
    <AbsoluteFill style={{transform: `translateY(${-leave * 1500}px)`, filter: leave > 0.02 ? `blur(${leave * 14}px)` : undefined}}>
      <Row y={190}>{u.head.map(([w, at, c], i) => <Slam key={i} f={f} at={at} size={104} color={c ?? INK}>{w}</Slam>)}</Row>
      <Row y={350}>{u.sub.map(([w, at, c], i) => <Slam key={i} f={f} at={at} size={52} weight={500} color={c ?? GREY}>{w}</Slam>)}</Row>
      <Sequence from={u.from} durationInFrames={u.to - u.from + 4} layout="none">
        <AbsoluteFill style={{transform: `translateY(${(1 - rise) * 1300}px) rotate(${(1 - rise) * 5}deg)`}}>
          <Phone src={u.rec} k={1.08} cx={540} top={540} lift={10} />
        </AbsoluteFill>
      </Sequence>
      {u.chips.map(([n, x, y, at], i) => <Chip key={i} f={f} at={at} n={n} x={x} y={y} rot={i % 2 ? 10 : -10} />)}
    </AbsoluteFill>
  );
};

// the emergency number stamps up one nine per spoken «تسعة»
const NINES = [387, 399, 413, 425];
const Counter: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 387 || f > 442) return null;
  const n = NINES.filter((x) => x <= f).length;
  const last = NINES[n - 1];
  const k = spring({frame: f - last, fps, config: {damping: 10, stiffness: 300, mass: 0.5}});
  const first = spring({frame: f - 387, fps, config: {damping: 12, stiffness: 220, mass: 0.6}});
  const leave = io(p(f, 432, 9));
  return (
    <div style={{position: 'absolute', right: 70, top: 760 - leave * 1500, transform: `rotate(${6 - first * 2}deg) scale(${first * (1.25 - 0.25 * k)})`, transformOrigin: '100% 50%'}}>
      <div style={{padding: '22px 40px', borderRadius: 999, background: '#D70015', color: '#fff', fontFamily: EN, fontWeight: 800, fontSize: 92, letterSpacing: 2, boxShadow: '0 22px 40px -14px rgba(215,0,21,.55)', display: 'flex', alignItems: 'center', gap: 18}}>
        <Ico n="phone" size={70} color="#fff" />{'9'.repeat(n)}
      </div>
    </div>
  );
};

// the doctors pop in round the phone, one per spoken word of «استشاريون للكبار والأطفال»
const DOCS: [string, number, number, number][] = [['img/haifa-cut.webp', 471, 170, 1060], ['img/said-cut.webp', 493, 910, 1260], ['img/wafaa-cut.webp', 511, 175, 1500]];
const Doctors: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 471 || f > 538) return null;
  const leave = io(p(f, 528, 9));
  return (
    <>
      {DOCS.map(([src, at, x, y], i) => {
        if (f < at) return null;
        const k = spring({frame: f - at, fps, config: {damping: 11, stiffness: 220, mass: 0.6}});
        const bob = Math.sin((f - at) / 12) * 8;
        return (
          <div key={i} style={{position: 'absolute', left: x - 115, top: y - 115 + bob - leave * 1500, width: 230, height: 230, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #EADFFF, #B79BFF)', border: '8px solid #fff', boxShadow: '0 24px 44px -18px rgba(90,40,200,.5)', transform: `scale(${k}) rotate(${(1 - k) * (i % 2 ? 20 : -20)}deg)`}}>
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
  if (f < 606 || f > 642) return null;
  const a = spring({frame: f - 606, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
  const b = spring({frame: f - 618, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
  const leave = io(p(f, 632, 9));
  const pill = (txt: string, k: number, x: number, y: number, rot: number) => (
    <div dir="rtl" style={{position: 'absolute', left: x, top: y - leave * 1500, padding: '20px 38px', borderRadius: 999, background: '#25D366', color: '#fff', fontFamily: AR, fontWeight: 700, fontSize: 58, boxShadow: '0 20px 38px -12px rgba(37,211,102,.55)', transform: `scale(${k}) rotate(${rot * (1 - k) + rot * 0.3}deg)`, opacity: clamp(k * 3)}}>{txt}</div>
  );
  return (
    <>
      <Row y={470}><Slam f={f} at={606} size={52} weight={600} color="#1DA851" leave={632}>عبر واتساب</Slam></Row>
      {pill('واتساب', a, 640, 900, 14)}
      {f >= 618 && pill('تم ✓', b, 90, 1250, -12)}
    </>
  );
};

// ---------------------------------------------------------------- 21.3–24.6 s «مهما كان سؤالك… نحن هنا لنرشدك»
const Guide: React.FC<{f: number}> = ({f}) => (
  f < 636 || f > 744 ? null : (
    <>
      <Row y={790}><Slam f={f} at={639} leave={734} size={110}>مهما</Slam><Slam f={f} at={649} leave={734} size={110}>كان</Slam><Slam f={f} at={657} leave={734} size={110} color={VIO}>سؤالك</Slam></Row>
      <Row y={950}><Slam f={f} at={683} leave={734} size={110}>نحن</Slam><Slam f={f} at={694} leave={734} size={110}>هنا</Slam><Slam f={f} at={704} leave={734} size={110} color={VIO}>لنرشدك</Slam></Row>
      <Chip f={f} at={660} n="heart" x={190} y={700} size={110} rot={-10} leave={734} />
      <Chip f={f} at={706} n="check" x={890} y={1180} size={110} rot={10} leave={734} />
      <Chip f={f} at={690} n="star" x={880} y={680} size={80} rot={8} leave={734} />
    </>
  )
);

// ---------------------------------------------------------------- 24.6–28 s typed with the voice, then the mark on the score's final hit
const Cta: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 736) return null;
  const text = 'احجز موعدك الآن';
  const n = Math.min(text.length, Math.max(0, Math.floor((f - 738) / 2.1)));
  const caret = Math.floor(f / 8) % 2 === 0;
  const lift = io(p(f, 782, 14));
  const mark = spring({frame: f - 794, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 860 - lift * 260, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 700, fontSize: 120 - lift * 24, color: VIO}}>
        {text.slice(0, n)}<span style={{display: 'inline-block', width: 8, height: 120, marginRight: 8, background: VIO, verticalAlign: 'middle', opacity: caret && lift < 0.5 ? 1 : 0}} />
      </div>
      {f >= 794 && (
        <>
          <div style={{position: 'absolute', left: 540, top: 960, transform: `translate(-50%,-50%) scale(${mark})`}}><Mark size={260} /></div>
          <div style={{position: 'absolute', top: 1110, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 500, fontSize: 52, color: INK, opacity: out(p(f, 804, 10)), transform: `translateY(${(1 - out(p(f, 804, 10))) * 24}px)`}}>neurouniverse.om</div>
          <div dir="rtl" style={{position: 'absolute', top: 1196, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 500, fontSize: 40, color: GREY, opacity: out(p(f, 812, 10))}}>الرابط في البايو</div>
        </>
      )}
    </AbsoluteFill>
  );
};

const SFX: [number, string, number][] = [
  [9, 'tap', 0.18], [47, 'blip', 0.22], [72, 'blip', 0.22], [95, 'blip', 0.22], [114, 'whoosh', 0.2], [160, 'whip', 0.25], [168, 'bloom', 0.25],
  [196, 'zip', 0.15], [245, 'spark', 0.25], [258, 'scan', 0.12], [286, 'whoosh', 0.22], [387, 'tap', 0.3], [399, 'tap', 0.3], [413, 'tap', 0.3], [425, 'lock', 0.3],
  [432, 'whip', 0.22], [471, 'blip', 0.18], [493, 'blip', 0.18], [511, 'blip', 0.18], [527, 'whip', 0.22], [606, 'ding', 0.25], [618, 'star', 0.2],
  [630, 'whoosh', 0.18], [794, 'bloom', 0.3],
];

export const Story: React.FC = () => {
  const f = useCurrentFrame();
  const glow = interpolate(f, [0, 12, 280, 300, 630, 650, 790, 840], [0.35, 0.7, 0.7, 0.35, 0.35, 0.85, 0.85, 1], {extrapolateRight: 'clamp'});
  const [sx, sy] = shake(f);
  return (
    <AbsoluteFill>
      <Page glow={glow} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + kick(f)})`}}>
        <Hook f={f} />
        <Symptoms f={f} />
        <Ring f={f} />
        <Flood f={f} />
        <Brand f={f} />
        {USES.map((u, i) => <UseScene key={i} f={f} u={u} />)}
        <Counter f={f} />
        <Doctors f={f} />
        <Whats f={f} />
        <Guide f={f} />
        <Cta f={f} />
      </AbsoluteFill>
      <Audio src={staticFile('audio/story/mix.mp3')} />
      {SFX.map(([at, n, v], i) => (
        <Sequence key={i} from={at}><Audio src={staticFile(`audio/eleven/sfx-${n}.mp3`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
