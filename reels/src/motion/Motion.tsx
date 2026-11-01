import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, C, EN} from '../theme';

// Keynote-style motion reel (22 s, 30 fps, cut to the 120 BPM launch score: a beat is 15 frames).
// No device mockups: the website itself is the material. A boot moment with the NU mark, a type slam, then the real
// site breaks into a bento grid of cards and the camera springs into each one on the beat. Everything is spring-driven.
export const MOTION_FRAMES = 660;
const BEAT = 15;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
const useSpring = (at: number, cfg = {damping: 16, stiffness: 140, mass: 0.9}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return spring({frame: f - at, fps, config: cfg});
};

// ---------------------------------------------------------------- the stage: white, a violet glow, film grain
const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 8;
  return (
    <AbsoluteFill style={{background: '#FBFAFE', overflow: 'hidden'}}>
      <div style={{position: 'absolute', right: -500 + Math.sin(f / 50) * 60, top: -400, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,80,255,.26), rgba(124,80,255,0) 62%)'}} />
      <div style={{position: 'absolute', left: -650, bottom: -560 + Math.cos(f / 60) * 60, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(238,176,226,.38), rgba(238,176,226,0) 62%)'}} />
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: 0.5, mixBlendMode: 'soft-light'}}>
        <filter id={`mg${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed={seed} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter={`url(#mg${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

const Logo: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
  <svg viewBox={LOGO_VB} width={size} height={size * 0.632} style={{overflow: 'visible', ...style}}>
    <defs><linearGradient id="mLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.mark1} /><stop offset="1" stopColor={C.mark2} /></linearGradient></defs>
    <path d={LOGO_D} fill="url(#mLogo)" />
  </svg>
);

// ---------------------------------------------------------------- 1. boot (0–2 s)
const Boot: React.FC = () => {
  const f = useCurrentFrame();
  const bar = ease((f - 12) / 34);
  const burst = ease((f - 48) / 12);
  return (
    <AbsoluteFill style={{background: '#fff', opacity: 1 - clamp((f - 52) / 8)}}>
      <div style={{position: 'absolute', left: 540, top: 880, transform: `translate(-50%,-50%) scale(${1 + burst * 6})`, opacity: clamp(f / 8) * (1 - burst)}}>
        <Logo size={170} />
      </div>
      <div style={{position: 'absolute', left: 390, top: 1060, width: 300, height: 6, borderRadius: 3, background: 'rgba(29,29,31,.12)', opacity: clamp((f - 8) / 6) * (1 - clamp((f - 46) / 4))}}>
        <div style={{width: `${bar * 100}%`, height: '100%', borderRadius: 3, background: '#1D1D1F'}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. type slam (2–5 s)
const Slam: React.FC<{text: string; at: number; size: number; weight?: number; color?: string; font?: string}> = ({text, at, size, weight = 700, color = '#1D1D1F', font = AR}) => {
  const s = useSpring(at, {damping: 13, stiffness: 180, mass: 0.8});
  const f = useCurrentFrame();
  if (f < at) return null;
  return <span style={{display: 'inline-block', fontFamily: font, fontWeight: weight, fontSize: size, color, lineHeight: 1.1, transform: `scale(${1.6 - 0.6 * s})`, opacity: clamp(s * 2), filter: `blur(${(1 - clamp(s)) * 14}px)`}}>{text}</span>;
};
const Title: React.FC = () => {
  const f = useCurrentFrame();
  const url = 'neurouniverse.om';
  const typed = Math.max(0, Math.min(url.length, Math.floor((f - 105) / 1.6)));
  const out = ease((f - 138) / 12);
  return (
    <AbsoluteFill style={{transform: `scale(${1 - out * 0.35})`, opacity: 1 - out, filter: `blur(${out * 10}px)`}}>
      <div dir="rtl" style={{position: 'absolute', top: 700, width: '100%', textAlign: 'center'}}>
        <Slam text="موقعنا" at={60} size={190} />
        <br />
        <Slam text="الجديد." at={75} size={190} color={C.purple} />
      </div>
      <div style={{position: 'absolute', top: 1180, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 500, fontSize: 56, letterSpacing: 1, color: '#1D1D1F', opacity: f >= 100 ? 1 : 0}}>
        {url.slice(0, typed)}
        <span style={{display: 'inline-block', width: 4, height: 56, marginLeft: 4, background: C.purple, verticalAlign: 'middle', opacity: Math.floor(f / 8) % 2 ? 1 : 0.2}} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. the site as a bento grid, and the camera
type Card = {id: string; x: number; y: number; w: number; h: number};
const CARDS: Card[] = [
  {id: 'hero', x: 40, y: 150, w: 480, h: 440},
  {id: 'conditions', x: 560, y: 150, w: 480, h: 560},
  {id: 'doctors', x: 40, y: 630, w: 480, h: 640},
  {id: 'games', x: 560, y: 750, w: 480, h: 520},
  {id: 'booking', x: 40, y: 1310, w: 480, h: 480},
  {id: 'eeg', x: 560, y: 1310, w: 480, h: 480},
];
const GRID_IN = 150; // the cards fly in
// camera focus segments: [start frame, card id, headline, subline]
const FOCUS: [number, string, string, string][] = [
  [225, 'doctors', 'أطباؤنا', 'استشاريو طب الأعصاب للكبار والأطفال'],
  [315, 'conditions', 'دليل الأعراض والأمراض', 'ومتى تتصل بالرقم 9999'],
  [405, 'games', 'ألعاب الدماغ', 'ستروب · رد الفعل · الذاكرة'],
  [495, 'booking', 'احجز موعدك', 'بخطوات بسيطة، عبر واتساب'],
];
const GRID_OUT = 585; // back to the grid, then everything collapses into the logo

type Cam = {s: number; x: number; y: number};
const WIDE: Cam = {s: 1, x: 0, y: 0};
const camFor = (id: string): Cam => {
  const c = CARDS.find((k) => k.id === id)!;
  const s = 1000 / c.w; // the card fills the width
  return {s, x: 540 - (c.x + c.w / 2) * s, y: 1190 - (c.y + c.h / 2) * s};
};
const mix = (a: Cam, b: Cam, t: number): Cam => ({s: a.s + (b.s - a.s) * t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});

const useCamera = (): {cam: Cam; vel: number} => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const at = (g: number) => {
    let cam = WIDE;
    const stops: [number, Cam][] = [...FOCUS.map(([t, id]) => [t, camFor(id)] as [number, Cam]), [GRID_OUT, WIDE]];
    for (const [t, target] of stops) {
      const k = spring({frame: g - t, fps, config: {damping: 20, stiffness: 120, mass: 1}});
      cam = mix(cam, target, k);
    }
    return cam;
  };
  const a = at(f), b = at(f - 1);
  return {cam: a, vel: Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.s - b.s) * 400};
};

const CardView: React.FC<{c: Card; i: number; pan: number}> = ({c, i, pan}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  const inn = spring({frame: f - GRID_IN - i * 3, fps, config: {damping: 15, stiffness: 120}});
  const out = spring({frame: f - (GRID_OUT + 25) - (CARDS.length - i) * 2, fps, config: {damping: 18, stiffness: 160}});
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  const tx = (540 - cx) * out, ty = (960 - cy) * out;
  return (
    <div style={{position: 'absolute', left: c.x, top: c.y, width: c.w, height: c.h, borderRadius: 34, overflow: 'hidden', background: '#fff',
      boxShadow: '0 30px 60px -30px rgba(60,30,140,.35), 0 0 0 1.5px rgba(29,29,31,.06)',
      transform: `translate(${tx}px, ${ty + (1 - inn) * 900}px) scale(${(0.6 + 0.4 * inn) * (1 - out)}) rotate(${(1 - inn) * (i % 2 ? 6 : -6)}deg)`, opacity: clamp(inn * 3) * (1 - clamp(out * 1.2))}}>
      <Img src={staticFile(`cap/panels-hd/${c.id}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${pan * 100}%`}} />
    </div>
  );
};

const Grid: React.FC = () => {
  const f = useCurrentFrame();
  const {cam, vel} = useCamera();
  // inside a focused card, its page drifts slowly downwards
  const focusPan = (id: string) => {
    const seg = FOCUS.find(([, k]) => k === id);
    return seg ? ease((f - seg[0] - 10) / 75) : 0;
  };
  return (
    <AbsoluteFill style={{transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`, transformOrigin: '0 0', filter: vel > 4 ? `blur(${Math.min(8, vel / 18)}px)` : undefined}}>
      {CARDS.map((c, i) => <CardView key={c.id} c={c} i={i} pan={focusPan(c.id)} />)}
    </AbsoluteFill>
  );
};

// the headline over each focused card
const Headline: React.FC = () => {
  const f = useCurrentFrame();
  const seg = FOCUS.find(([t]) => f >= t + 8 && f < t + 88);
  if (!seg) return null;
  const [t, , title, sub] = seg;
  const outK = ease((f - (t + 78)) / 10);
  return (
    <AbsoluteFill style={{opacity: 1 - outK}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 620, background: 'linear-gradient(180deg, rgba(251,250,254,1) 72%, rgba(251,250,254,0))'}} />
      <div dir="rtl" style={{position: 'absolute', top: 170, width: '100%', textAlign: 'center'}}>
        <Slam text={title} at={t + 8} size={118} />
        <div style={{height: 18}} />
        <div style={{fontFamily: AR, fontWeight: 400, fontSize: 44, color: '#6E6E73', opacity: clamp((f - t - 16) / 8), transform: `translateY(${(1 - ease((f - t - 16) / 12)) * 20}px)`}}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. outro (19.5–22 s)
const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const logo = useSpring(GRID_OUT + 42, {damping: 11, stiffness: 150, mass: 0.8});
  const pill = useSpring(GRID_OUT + 58, {damping: 14, stiffness: 160, mass: 0.8});
  if (f < GRID_OUT + 40) return null;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 540, top: 820, transform: `translate(-50%,-50%) scale(${logo})`}}>
        <div style={{position: 'absolute', left: -260, top: -220, width: 760, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,80,255,.30), rgba(124,80,255,0) 65%)'}} />
        <Logo size={300} style={{position: 'relative'}} />
      </div>
      <div style={{position: 'absolute', top: 1060, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 700, fontSize: 84, color: '#1D1D1F', opacity: clamp((f - GRID_OUT - 50) / 8)}}>طبّ وعلوم الأعصاب</div>
      <div style={{position: 'absolute', top: 1180, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 500, fontSize: 50, color: C.purple, opacity: clamp((f - GRID_OUT - 54) / 8)}}>neurouniverse.om</div>
      <div style={{position: 'absolute', top: 1320, width: '100%', display: 'flex', justifyContent: 'center'}}>
        <div dir="rtl" style={{transform: `scale(${pill})`, background: '#1D1D1F', color: '#fff', fontFamily: AR, fontWeight: 600, fontSize: 56, padding: '22px 70px', borderRadius: 999, boxShadow: '0 20px 50px -20px rgba(60,30,140,.55)'}}>احجز موعدك</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sound: the score, and a few soft accents
const fx = (name: string) => staticFile(`audio/eleven/sfx-${name}.mp3`);
const SFX: [number, string, number][] = [
  [0, 'spark', 0.25], [48, 'bloom', 0.45], [60, 'boom', 0.35], [75, 'boom', 0.3], [GRID_IN, 'whoosh', 0.35],
  ...FOCUS.map(([t]) => [t, 'whip', 0.3] as [number, string, number]), [GRID_OUT, 'whoosh', 0.3], [GRID_OUT + 42, 'form', 0.5],
];

export const Motion: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Stage />
      {f >= GRID_IN - 5 && <Grid />}
      <Headline />
      <Outro />
      {f < 160 && <Title />}
      {f < 62 && <Boot />}
      <Audio src={staticFile('audio/eleven/music.mp3')} volume={(g) => interpolate(g, [0, 4, MOTION_FRAMES - 30, MOTION_FRAMES], [0, 0.9, 0.9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {SFX.map(([at, n, v], i) => (
        <Sequence key={i} from={at}>
          <Audio src={fx(n)} volume={v} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
