import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {Phone} from '../studio/devices';
import {AR, EN} from '../theme';

// A product-explainer reel (31 s, 30 fps) in the manner of a bright motion-design story: white pages with a soft violet
// glow rising from the bottom, kinetic Arabic type, little icons popping between words, a ring of the site's screens and
// the doctors, a word set with design guide lines, the mark growing from a dot, flat phones playing the real site with
// stickers floating round them, and a typed call to action.
export const STORY_FRAMES = 930;
const INK = '#1D1D1F', VIO = '#7431F4', GREY = '#6E6E73';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const io = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const out = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
const p = (f: number, a: number, d: number) => clamp((f - a) / d);
const spr = (f: number, at: number, fps: number, c = {damping: 12, stiffness: 160, mass: 0.7}) => spring({frame: f - at, fps, config: c});

// ---------------------------------------------------------------- page: white, a violet glow rising from the bottom, grain
const Page: React.FC<{glow: number}> = ({glow}) => {
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

const Mark: React.FC<{size: number}> = ({size}) => (
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
const Ico: React.FC<{n: string; size?: number; color?: string}> = ({n, size = 64, color = VIO}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICON[n]} /></svg>
);
// a small glass chip holding an icon, popping in with a little overshoot
const Chip: React.FC<{f: number; at: number; n: string; x: number; y: number; size?: number; rot?: number; leave?: number}> = ({f, at, n, x, y, size = 96, rot = 0, leave = 1e9}) => {
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
const Row: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => (
  <div dir="rtl" style={{position: 'absolute', top: y, left: 60, right: 60, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center'}}>{children}</div>
);

// ---------------------------------------------------------------- A (0–4 s): the questions
const Hook: React.FC<{f: number}> = ({f}) => (
  <>
    <Row y={820}>
      <Word f={f} at={6} leave={52}>كل</Word><Word f={f} at={12} leave={52}>يوم،</Word><Word f={f} at={20} leave={52}>سؤال</Word><Word f={f} at={28} leave={52} color={VIO}>جديد</Word>
    </Row>
    <Chip f={f} at={24} n="cloud" x={250} y={700} rot={-12} leave={52} />
    <Chip f={f} at={32} n="bolt" x={840} y={1080} size={84} rot={10} leave={52} />
    {/* the questions, one per beat */}
    <Row y={760}><Word f={f} at={60} leave={108} size={120} weight={600}>صداع؟</Word></Row>
    <Row y={900}><Word f={f} at={75} leave={108} size={120} weight={600} color={VIO}>تنميل؟</Word></Row>
    <Row y={1040}><Word f={f} at={90} leave={108} size={120} weight={600}>نسيان؟</Word></Row>
    <Chip f={f} at={62} n="head" x={210} y={820} rot={-10} leave={108} />
    <Chip f={f} at={77} n="hand" x={870} y={960} rot={8} leave={108} />
    <Chip f={f} at={92} n="cloud" x={230} y={1110} size={88} rot={-6} leave={108} />
  </>
);

// ---------------------------------------------------------------- B (4–7 s): a ring of the site and the doctors, «إليك الحل»
const RING = ['cap/panels-hd/hero.jpg', 'img/haifa-cut.webp', 'cap/panels-hd/conditions.jpg', 'img/said-cut.webp', 'cap/panels-hd/games.jpg', 'img/wafaa-cut.webp', 'cap/panels-hd/booking.jpg', 'cap/panels-hd/doctors.jpg'];
const Ring: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 116 || f > 214) return null;
  const leave = io(p(f, 200, 12));
  return (
    <>
      {RING.map((src, i) => {
        const k = spr(f, 120 + i * 3, fps, {damping: 14, stiffness: 110, mass: 0.8});
        const a = (i / RING.length) * Math.PI * 2 + (f - 120) / 90 - Math.PI / 2;
        const r = 330 * k * (1 + leave * 1.4);
        const x = 540 + Math.cos(a) * r * 1.05, y = 960 + Math.sin(a) * r * 1.35;
        const doc = src.startsWith('img/');
        const w = doc ? 190 : 210, h = doc ? 190 : 250;
        return (
          <div key={i} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 28, overflow: 'hidden', opacity: clamp(k * 2) * (1 - leave), transform: `scale(${k}) rotate(${Math.sin(a) * 8}deg)`,
            background: doc ? 'radial-gradient(circle at 50% 40%, #EADFFF, #C7B2FF)' : '#fff', boxShadow: '0 20px 40px -18px rgba(90,40,200,.4), inset 0 0 0 1.5px rgba(124,80,255,.12)'}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: doc ? '50% 15%' : 'top'}} />
          </div>
        );
      })}
      <Row y={900}><Word f={f} at={124} leave={160} size={60}>تبحث عن إجابة واضحة؟</Word></Row>
      <Row y={900}><Word f={f} at={166} leave={200} size={68} weight={600} color={VIO}>إليك الحل</Word></Row>
    </>
  );
};

// ---------------------------------------------------------------- C (7–9 s): «واضح.» set with design guide lines, tightening
const Clear: React.FC<{f: number}> = ({f}) => {
  if (f < 212 || f > 282) return null;
  const draw = out(p(f, 214, 18));
  const tight = io(p(f, 232, 26));
  const leave = io(p(f, 268, 12));
  const letters = ['و', 'ا', 'ض', 'ح', '.'];
  const line = (style: React.CSSProperties) => <div style={{position: 'absolute', background: 'rgba(124,80,255,.45)', ...style}} />;
  return (
    <AbsoluteFill style={{opacity: 1 - leave}}>
      {line({left: 60, right: 60, top: 1010, height: 2, transform: `scaleX(${draw})`})}
      {line({left: 60, right: 60, top: 880, height: 1.5, transform: `scaleX(${draw})`, opacity: 0.6})}
      {line({left: 60, right: 60, top: 1110, height: 1.5, transform: `scaleX(${draw})`, opacity: 0.6})}
      {[300, 420, 540, 660, 780].map((x, i) => line({left: x + (540 - x) * tight * 0.45, top: 760, width: 1.5, height: 460 * draw, opacity: 0.5 * (1 - tight)}))}
      <div dir="rtl" style={{position: 'absolute', top: 820, width: '100%', display: 'flex', justifyContent: 'center', gap: `${(1 - tight) * 90}px`}}>
        {letters.map((l, i) => (
          <span key={i} style={{fontFamily: AR, fontWeight: 600, fontSize: 230, color: i === 4 ? VIO : INK, opacity: out(p(f, 216 + i * 3, 10)), lineHeight: 1.1}}>{l === '.' ? '.' : l}</span>
        ))}
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 400, fontSize: 46, color: GREY, opacity: out(p(f, 246, 14))}}>إجابات عن صحة الدماغ والأعصاب</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- D (9–11 s): the mark grows from a dot
const Brand: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 278 || f > 346) return null;
  const dot = spr(f, 280, fps, {damping: 10, stiffness: 200, mass: 0.6});
  const grow = spring({frame: f - 292, fps, config: {damping: 13, stiffness: 120, mass: 0.9}});
  const leave = io(p(f, 334, 12));
  return (
    <AbsoluteFill style={{opacity: 1 - leave, transform: `scale(${1 + leave * 0.2})`}}>
      <div style={{position: 'absolute', left: 540 - 40, top: 860 - 40, width: 80, height: 80, borderRadius: 40, border: `14px solid ${VIO}`, transform: `scale(${dot * (1 - grow)})`}} />
      <div style={{position: 'absolute', left: 540, top: 880, transform: `translate(-50%,-50%) scale(${grow})`}}><Mark size={340} /></div>
      <div dir="rtl" style={{position: 'absolute', top: 1060, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 600, fontSize: 80, color: INK, opacity: out(p(f, 304, 12)), transform: `translateY(${(1 - out(p(f, 304, 12))) * 30}px)`}}>طبّ وعلوم الأعصاب</div>
      <div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 500, fontSize: 40, color: VIO, opacity: out(p(f, 312, 12))}}>neurouniverse.om</div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- E (11–23 s): three uses, each on a flat phone with stickers
type Use = {at: number; rec: string; rate: number; title: string; sub: string; chips: [string, number, number][]; tag?: [string, number, number]};
const USES: Use[] = [
  {at: 340, rec: 'phone-guide.mp4', rate: 1, title: 'دليل الأعراض', sub: 'ومتى تتصل بالرقم 9999', chips: [['heart', 180, 980], ['wave', 900, 1180], ['head', 170, 1420]], tag: ['9999', 880, 820]},
  {at: 460, rec: 'phone-doctors.mp4', rate: 1, title: 'أطباؤنا', sub: 'للكبار والأطفال', chips: [['star', 190, 900], ['check', 900, 1060], ['heart', 880, 1500]]},
  {at: 580, rec: 'phone-book.mp4', rate: 1, title: 'احجز موعدك', sub: 'بخطوات بسيطة، عبر واتساب', chips: [['cal', 180, 980], ['phone', 900, 1300], ['check', 190, 1500]], tag: ['تم ✓', 880, 860]},
];
const UseScene: React.FC<{f: number; u: Use}> = ({f, u}) => {
  const {fps} = useVideoConfig();
  const g = f - u.at;
  if (g < -10 || g > 128) return null;
  const rise = spring({frame: g, fps, config: {damping: 15, stiffness: 100, mass: 0.9}});
  const leave = io(p(g, 112, 14));
  return (
    <AbsoluteFill style={{opacity: 1 - leave, transform: `translateY(${-leave * 120}px)`}}>
      <Row y={200}><Word f={f} at={u.at + 4} size={104} weight={600}>{u.title}</Word></Row>
      <Row y={360}><Word f={f} at={u.at + 12} size={46} color={GREY}>{u.sub}</Word></Row>
      <Sequence from={u.at} durationInFrames={140}>
        <AbsoluteFill style={{transform: `translateY(${(1 - rise) * 900}px) rotate(${(1 - rise) * 6}deg)`}}>
          <Phone src={u.rec} k={1.08} cx={540} top={560} lift={10} />
        </AbsoluteFill>
      </Sequence>
      {u.chips.map(([n, x, y], i) => <Chip key={i} f={f} at={u.at + 20 + i * 6} n={n} x={x} y={y} rot={i % 2 ? 10 : -10} />)}
      {u.tag && (() => {
        const k = spr(f, u.at + 36, fps);
        return f >= u.at + 36 ? (
          <div dir="rtl" style={{position: 'absolute', left: u.tag[1] - 110, top: u.tag[2], padding: '16px 30px', borderRadius: 999, background: u.tag[0] === '9999' ? '#D70015' : '#25D366', color: '#fff', fontFamily: u.tag[0] === '9999' ? EN : AR, fontWeight: 700, fontSize: 44, transform: `scale(${k}) rotate(${(1 - k) * 12 + 6}deg)`, boxShadow: '0 14px 30px -10px rgba(0,0,0,.35)'}}>{u.tag[0]}</div>
        ) : null;
      })()}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- F (23–26 s): «مهما كان سؤالك / نحن هنا لنرشدك»
const Guide: React.FC<{f: number}> = ({f}) => (
  <>
    <Row y={820}><Word f={f} at={702} leave={770}>مهما</Word><Word f={f} at={710} leave={770}>كان</Word><Word f={f} at={718} leave={770} color={VIO}>سؤالك</Word></Row>
    <Row y={960}><Word f={f} at={732} leave={770}>نحن</Word><Word f={f} at={740} leave={770}>هنا</Word><Word f={f} at={748} leave={770} color={VIO}>لنرشدك</Word></Row>
    <Chip f={f} at={722} n="heart" x={200} y={720} rot={-10} leave={770} />
    <Chip f={f} at={752} n="check" x={880} y={1150} rot={10} leave={770} />
  </>
);

// ---------------------------------------------------------------- G (26–31 s): typed call to action, then the mark
const Cta: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 776) return null;
  const text = 'احجز موعدك الآن';
  const n = Math.min(text.length, Math.max(0, Math.floor((f - 782) / 2.2)));
  const caret = Math.floor(f / 9) % 2 === 0;
  const lift = io(p(f, 836, 18));
  const mark = spr(f, 846, fps, {damping: 13, stiffness: 140, mass: 0.8});
  return (
    <AbsoluteFill>
      <div dir="rtl" style={{position: 'absolute', top: 880 - lift * 240, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 600, fontSize: 108, color: VIO}}>
        {text.slice(0, n)}<span style={{display: 'inline-block', width: 7, height: 110, marginRight: 8, background: VIO, verticalAlign: 'middle', opacity: caret && lift < 1 ? 1 : 0}} />
      </div>
      {f >= 846 && (
        <>
          <div style={{position: 'absolute', left: 540, top: 1000, transform: `translate(-50%,-50%) scale(${mark})`}}><Mark size={230} /></div>
          <div style={{position: 'absolute', top: 1130, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 500, fontSize: 48, color: INK, opacity: out(p(f, 860, 12))}}>neurouniverse.om</div>
          <div dir="rtl" style={{position: 'absolute', top: 1210, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 400, fontSize: 38, color: GREY, opacity: out(p(f, 868, 12))}}>الرابط في البايو</div>
        </>
      )}
    </AbsoluteFill>
  );
};

export const Story: React.FC = () => {
  const f = useCurrentFrame();
  const glow = interpolate(f, [0, 20, 330, 350, 690, 710, 900, 930], [0.3, 0.7, 0.7, 0.35, 0.35, 0.8, 0.9, 0.9], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Page glow={glow} />
      <Hook f={f} />
      <Ring f={f} />
      <Clear f={f} />
      <Brand f={f} />
      {USES.map((u, i) => <UseScene key={i} f={f} u={u} />)}
      <Guide f={f} />
      <Cta f={f} />
      <Audio src={staticFile('audio/eleven/music.mp3')} loop volume={(g) => interpolate(g, [0, 6, STORY_FRAMES - 40, STORY_FRAMES - 4], [0, 0.8, 0.8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {([[60, 'blip', 0.25], [75, 'blip', 0.25], [90, 'blip', 0.25], [120, 'whoosh', 0.3], [166, 'bloom', 0.35], [292, 'form', 0.45], [340, 'whoosh', 0.3], [460, 'whoosh', 0.3], [580, 'whoosh', 0.3], [616, 'ding', 0.35], [846, 'bloom', 0.4]] as [number, string, number][]).map(([at, n, v], i) => (
        <Sequence key={i} from={at}><Audio src={staticFile(`audio/eleven/sfx-${n}.mp3`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
