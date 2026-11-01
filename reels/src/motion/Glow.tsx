import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, EN} from '../theme';

// Keynote-style reel (15 s, 30 fps): flowing violet light on black, tiny type, glass, 3D screens, a loader, and a white
// boot screen with the NU mark at the end. Our own take on the style of a motion-design reference: brand violet and
// magenta light, our logo, Arabic type and the real neurouniverse.om screens.
export const GLOW_FRAMES = 450;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const io = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const out = (t: number) => 1 - Math.pow(1 - clamp(t), 4);
const p = (f: number, a: number, d: number) => clamp((f - a) / d);
const useSpr = (at: number, cfg = {damping: 14, stiffness: 120, mass: 0.9}) => {
  const f = useCurrentFrame(), {fps} = useVideoConfig();
  return spring({frame: f - at, fps, config: cfg});
};

// ---------------------------------------------------------------- the light: soft violet/magenta blobs flowing on black
// `focus` 0..1 gathers the light into a column (as behind a title); `floor` pushes it to the bottom; `level` dims it.
const Light: React.FC<{focus: number; floor: number; level: number}> = ({focus, floor, level}) => {
  const f = useCurrentFrame();
  const s = (k: number, a: number) => Math.sin(f / k + a);
  const blob = (x: number, y: number, w: number, h: number, col: string, o: number) => (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: '50%', background: col, opacity: o * level, filter: 'blur(90px)'}} />
  );
  const cy = 960 + floor * 620;
  return (
    <AbsoluteFill style={{background: '#050308', overflow: 'hidden'}}>
      {blob(540 + s(37, 0) * 180 * (1 - focus), cy + s(29, 1) * 160, 700 - focus * 300, 1500 - floor * 900, 'radial-gradient(circle, #B06BFF 0%, #6A1FE0 45%, rgba(40,0,90,0) 75%)', 0.95)}
      {blob(300 + s(41, 2) * 160, cy + 260 + s(33, 3) * 120, 900, 700 - floor * 200, 'radial-gradient(circle, #FF5FB8 0%, #B0127A 45%, rgba(60,0,40,0) 75%)', 0.55 * (1 - focus * 0.6))}
      {blob(800 + s(31, 4) * 160, cy - 300 + s(43, 5) * 140, 800, 800, 'radial-gradient(circle, #7C5CFF 0%, #2D0FA0 50%, rgba(10,0,40,0) 75%)', 0.6 * (1 - focus * 0.5))}
      {blob(540, cy + 40, 260 + focus * 120, 900 - floor * 500, 'radial-gradient(circle, #FFE3FF 0%, #E28BFF 40%, rgba(120,40,200,0) 75%)', 0.55 * focus + 0.25 * floor)}
      <Grain />
    </AbsoluteFill>
  );
};
const Grain: React.FC = () => {
  const seed = Math.floor(useCurrentFrame() / 2) % 8;
  return (
    <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: 0.35, mixBlendMode: 'overlay'}}>
      <filter id={`gg${seed}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter={`url(#gg${seed})`} />
    </svg>
  );
};

const Mark: React.FC<{size: number; fill?: string}> = ({size, fill = 'url(#gMark)'}) => (
  <svg viewBox={LOGO_VB} width={size} height={size * 0.632} style={{overflow: 'visible', display: 'block'}}>
    <defs><linearGradient id="gMark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9A8FF" /><stop offset="1" stopColor="#7431F4" /></linearGradient></defs>
    <path d={LOGO_D} fill={fill} />
  </svg>
);

// small type that fades and un-blurs into place
const Small: React.FC<{f: number; at: number; until?: number; children: React.ReactNode; size?: number; y?: number; font?: string}> = ({f, at, until = 1e9, children, size = 46, y = 940, font = AR}) => {
  const k = out(p(f, at, 14)) * (1 - io(p(f, until, 10)));
  if (k <= 0) return null;
  return (
    <div dir="rtl" style={{position: 'absolute', top: y, width: '100%', textAlign: 'center', fontFamily: font, fontWeight: 500, fontSize: size, color: '#F2ECFF', opacity: k, filter: `blur(${(1 - k) * 10}px)`, letterSpacing: font === EN ? 0.5 : 0, textShadow: '0 0 30px rgba(180,120,255,.5)'}}>{children}</div>
  );
};

// a white pointer, drawn here
const Pointer: React.FC<{x: number; y: number; press: number; o: number}> = ({x, y, press, o}) => (
  <svg width="54" height="70" viewBox="0 0 27 35" style={{position: 'absolute', left: x, top: y, opacity: o, transform: `scale(${1 - press * 0.15})`, transformOrigin: '0 0', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))'}}>
    <path d="M2 2 L2 27 L8.5 21 L13 32 L17.5 30 L13 19.5 L22 19.5 Z" fill="#fff" stroke="#111" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// ---------------------------------------------------------------- scene 1 (0–3.5 s): «مع [NU] طبّ وعلوم الأعصاب», a click
const Intro: React.FC<{f: number}> = ({f}) => {
  const icon = useSpr(34, {damping: 11, stiffness: 160, mass: 0.7});
  const click = 70;
  const press = clamp(1 - Math.abs(f - click) / 4);
  const ring = p(f, click, 18);
  const cur = out(p(f, 44, 24));
  const leave = io(p(f, 92, 14));
  return (
    <AbsoluteFill style={{opacity: 1 - leave, transform: `scale(${1 + leave * 0.25})`}}>
      <div dir="rtl" style={{position: 'absolute', top: 905, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 34, fontFamily: AR, fontWeight: 500, fontSize: 50, color: '#F2ECFF', textShadow: '0 0 30px rgba(180,120,255,.5)'}}>
        <span style={{opacity: out(p(f, 10, 14)), filter: `blur(${(1 - out(p(f, 10, 14))) * 10}px)`}}>مع</span>
        <div style={{position: 'relative', width: 96 * icon, height: 96, transform: `scale(${icon * (1 - press * 0.1)})`}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 26, background: 'linear-gradient(145deg, rgba(255,255,255,.22), rgba(255,255,255,.05))', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.35), 0 10px 30px rgba(0,0,0,.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Mark size={64} />
          </div>
          {f > click && <div style={{position: 'absolute', inset: -10, borderRadius: 34, border: '3px solid rgba(220,190,255,.9)', transform: `scale(${1 + ring * 0.6})`, opacity: 1 - ring}} />}
        </div>
        <span style={{opacity: out(p(f, 20, 14)), filter: `blur(${(1 - out(p(f, 20, 14))) * 10}px)`, background: 'linear-gradient(90deg,#E9DBFF,#B98CFF)', WebkitBackgroundClip: 'text', color: 'transparent'}}>طبّ وعلوم الأعصاب</span>
      </div>
      <Pointer x={540 + (1 - cur) * 260 + 6} y={985 + (1 - cur) * 300} press={press} o={cur * (1 - p(f, 84, 8))} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scene 2 (3–6 s): a glass panel tilts up with the site's sections
const ICONS: {label: string; d: string}[] = [
  {label: 'الأطباء', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0'},
  {label: 'الأعراض', d: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z'},
  {label: 'تخطيط الدماغ', d: 'M3 12h3l2-5 3 10 3-8 2 3h5'},
  {label: 'الألعاب', d: 'M7 9h10a4 4 0 0 1 0 8l-2-2H9l-2 2a4 4 0 0 1 0-8zm1 2v3m-1.5-1.5h3M16 12h.01M18 14h.01'},
  {label: 'الحجز', d: 'M5 6h14v14H5zM5 10h14M9 3v4m6-4v4'},
];
const Panel: React.FC<{f: number}> = ({f}) => {
  const rise = useSpr(96, {damping: 16, stiffness: 90, mass: 1});
  const leave = io(p(f, 176, 14));
  const pick = 150;
  const press = clamp(1 - Math.abs(f - pick) / 4);
  const cur = out(p(f, 124, 22));
  if (f < 90 || leave >= 1) return null;
  return (
    <AbsoluteFill style={{perspective: 1600, opacity: 1 - leave}}>
      <div style={{position: 'absolute', left: 90, top: 760, width: 900, height: 420, borderRadius: 48, transformStyle: 'preserve-3d',
        transform: `translateY(${(1 - rise) * 500 - leave * 200}px) rotateX(${(1 - rise) * 70 + 18}deg) scale(${0.8 + rise * 0.2 + leave * 0.3})`,
        background: 'linear-gradient(160deg, rgba(255,255,255,.18), rgba(255,255,255,.04))', backdropFilter: 'blur(24px)',
        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.28), inset 0 2px 0 rgba(255,255,255,.5), 0 40px 90px rgba(0,0,0,.55)'}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 40px'}}>
          {ICONS.map((ic, i) => {
            const k = out(p(f, 112 + i * 4, 14));
            const sel = i === 1 ? press : 0;
            return (
              <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: k, transform: `translateY(${(1 - k) * 40}px) scale(${1 - sel * 0.12 + (i === 1 && f > pick ? 0.12 * out(p(f, pick, 8)) : 0)})`}}>
                <div style={{width: 118, height: 118, borderRadius: 60, background: i === 1 && f > pick ? 'radial-gradient(circle at 35% 30%, #D9B8FF, #7431F4)' : 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.35), rgba(255,255,255,.08))', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.4), 0 10px 26px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ic.d} /></svg>
                </div>
                <div dir="rtl" style={{fontFamily: AR, fontWeight: 500, fontSize: 28, color: 'rgba(255,255,255,.85)'}}>{ic.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Pointer x={340 + (1 - cur) * 200} y={940 + (1 - cur) * 280} press={press} o={cur * (1 - p(f, 168, 8))} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scene 3 (6–10 s): the site's screens close in as a tunnel
const SCREENS = ['cap/panels-hd/hero.jpg', 'cap/panels-hd/doctors.jpg', 'cap/panels-hd/conditions.jpg', 'cap/panels-hd/games.jpg', 'cap/panels-hd/booking.jpg', 'cap/panels-hd/eeg.jpg'];
const Tunnel: React.FC<{f: number}> = ({f}) => {
  const t0 = 196;
  if (f < t0 - 4 || f > 312) return null;
  const close = useSpr(t0, {damping: 18, stiffness: 70, mass: 1.1});
  const dolly = io(p(f, t0 + 30, 80)); // the camera moves forward through the tunnel
  const leave = io(p(f, 296, 14));
  // walls: left, right (phone pages standing), ceiling and floor (pages lying), each pushed back in depth
  const W = (side: 'l' | 'r' | 't' | 'b', i: number, img: string) => {
    const z = -900 - i * 760 + dolly * 1400;
    const base: React.CSSProperties = {position: 'absolute', width: 620, height: 1240, left: 540 - 310, top: 960 - 620, borderRadius: 40, overflow: 'hidden', background: '#fff',
      boxShadow: '0 0 0 2px rgba(255,255,255,.25), 0 30px 80px rgba(0,0,0,.6)', backfaceVisibility: 'hidden'};
    const far = (1 - close) * 1400;
    const tr = {
      l: `translate3d(${-560 - far}px, 0, ${z}px) rotateY(72deg)`,
      r: `translate3d(${560 + far}px, 0, ${z}px) rotateY(-72deg)`,
      t: `translate3d(0, ${-840 - far}px, ${z}px) rotateX(-74deg) rotateZ(90deg)`,
      b: `translate3d(0, ${840 + far}px, ${z}px) rotateX(74deg) rotateZ(90deg)`,
    }[side];
    return (
      <div key={side + i} style={{...base, transform: tr, opacity: clamp((z + 3200) / 1200)}}>
        <Img src={staticFile(img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}} />
      </div>
    );
  };
  return (
    <AbsoluteFill style={{perspective: 1100, opacity: (1 - leave) * clamp((f - t0 + 4) / 6)}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d'}}>
        {[0, 1, 2].map((i) => [W('l', i, SCREENS[i * 2]), W('r', i, SCREENS[i * 2 + 1]), W('t', i, SCREENS[(i + 2) % 6]), W('b', i, SCREENS[(i + 3) % 6])])}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scene 4 (10–13 s): a glass loader counts up, light streaks sweep in
const Loader: React.FC<{f: number}> = ({f}) => {
  const a = 312;
  if (f < a || f > 400) return null;
  const k = io(p(f, a + 4, 52));
  const pct = Math.round(8 + k * 92);
  const leave = io(p(f, 386, 12));
  const streak = (i: number) => {
    const d = `M -100 ${1210 + i * 26} C 300 ${1180 + i * 22}, 640 ${1060 - i * 30}, 1180 ${720 - i * 50}`;
    const len = 1700;
    const show = out(p(f, a + 18 + i * 3, 30));
    return <path key={i} d={d} fill="none" stroke={`url(#streak)`} strokeWidth={5 - i * 0.4} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - show)} opacity={0.9 - i * 0.08} />;
  };
  return (
    <AbsoluteFill style={{opacity: clamp((f - a) / 8) * (1 - leave)}}>
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 12px rgba(230,150,255,.8))'}}>
        <defs><linearGradient id="streak" x1="0" x2="1"><stop offset="0" stopColor="#7431F4" stopOpacity="0" /><stop offset=".5" stopColor="#E7B8FF" /><stop offset="1" stopColor="#FF7AD0" /></linearGradient></defs>
        {[0, 1, 2, 3, 4, 5, 6].map(streak)}
      </svg>
      {/* the pill: glass, with a bright fill growing inside */}
      <div style={{position: 'absolute', left: 140, top: 900, width: 800, height: 130, borderRadius: 65, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.04))', backdropFilter: 'blur(18px)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.35), inset 0 2px 0 rgba(255,255,255,.6), 0 30px 70px rgba(0,0,0,.5)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'linear-gradient(90deg, rgba(116,49,244,.0), rgba(170,110,255,.45) 70%, rgba(255,255,255,.75))'}} />
        <div style={{position: 'absolute', right: 50, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: EN, fontWeight: 500, fontSize: 64, color: '#fff', fontVariantNumeric: 'tabular-nums'}}>{pct}%</div>
      </div>
      <Small f={f} at={a + 30} y={1090} size={40} font={EN}>neurouniverse.om</Small>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- scene 5 (13–15 s): the light gathers into a point, then a white boot screen
const Boot: React.FC<{f: number}> = ({f}) => {
  const a = 404;
  if (f < a) return null;
  const white = io(p(f, a + 12, 10));
  const mark = useSpr(a + 4, {damping: 14, stiffness: 140, mass: 0.8});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#F4F6FB', opacity: white}} />
      <div style={{position: 'absolute', left: 540, top: 930, transform: `translate(-50%,-50%) scale(${0.7 + mark * 0.3})`, opacity: clamp(mark * 2)}}>
        <Mark size={150} fill={white > 0.5 ? '#1D1D1F' : '#fff'} />
      </div>
    </AbsoluteFill>
  );
};

export const Glow: React.FC = () => {
  const f = useCurrentFrame();
  // where the light sits in each scene
  const focus = interpolate(f, [0, 30, 90, 110, 180, 200, 300, 320, 400, 414], [0.3, 0.9, 0.9, 0.2, 0.2, 0.7, 0.7, 0.1, 0.1, 1], {extrapolateRight: 'clamp'});
  const floor = interpolate(f, [0, 90, 110, 180, 200, 300, 320, 340, 400, 414], [0, 0, 0.55, 0.55, 0, 0, 0.35, 0.45, 0.45, 0], {extrapolateRight: 'clamp'});
  const level = interpolate(f, [0, 12, 404, 418], [0, 1, 1, 0.5], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <Light focus={focus} floor={floor} level={level} />
      <Intro f={f} />
      <Panel f={f} />
      <Small f={f} at={180} until={206} size={48}>كل ما تحتاجه</Small>
      <Tunnel f={f} />
      <Small f={f} at={214} until={292} size={52}>موقعنا الجديد</Small>
      <Loader f={f} />
      <Boot f={f} />
      <Audio src={staticFile('audio/eleven/music.mp3')} volume={(g) => interpolate(g, [0, 6, GLOW_FRAMES - 40, GLOW_FRAMES - 4], [0, 0.85, 0.85, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {([[70, 'tap', 0.4], [96, 'whoosh', 0.3], [150, 'tap', 0.4], [196, 'flyby', 0.4], [312, 'scan', 0.3], [404, 'bloom', 0.5]] as [number, string, number][]).map(([at, n, v], i) => (
        <Sequence key={i} from={at}><Audio src={staticFile(`audio/eleven/sfx-${n}.mp3`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
