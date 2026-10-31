import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, C, EN} from '../theme';
import {Laptop3D} from './Laptop3D';
import {Phone3D} from './Phone3D';
import {SoftShadow, Studio} from './stage';

// The website film: 31 s, cut to the 90 BPM score (a beat is 20 frames; the closing chord is frame 800). Real 3D devices
// on the website's own light, grainy violet backdrop, each playing a recording of the live site. One idea per shot,
// a slow camera move, one line of type. Shots dissolve into each other over D frames either side of a cut.
const D = 10;
const SHOTS = [
  {id: 'open', from: 0, len: 160},
  {id: 'doctors', from: 160, len: 160},
  {id: 'guide', from: 320, len: 120},
  {id: 'games', from: 440, len: 160},
  {id: 'booking', from: 600, len: 120},
  {id: 'screens', from: 720, len: 80},
  {id: 'close', from: 800, len: 130},
];
export const FILM_FRAMES = 930;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const prog = (f: number, a: number, d: number) => clamp((f - a) / d);
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const inOut = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------- backdrop: the website's light, grainy violet
const Backdrop: React.FC = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 90) * 70, b = Math.cos(f / 110) * 60;
  const seed = Math.floor(f / 2) % 6;
  return (
    <AbsoluteFill style={{background: '#F7F5FC', overflow: 'hidden'}}>
      <div style={{position: 'absolute', right: -500 + a, top: -420 + b, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(132,92,255,.34), rgba(132,92,255,0) 62%)'}} />
      <div style={{position: 'absolute', left: -620 - b, top: 520 + a, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,166,255,.40), rgba(184,166,255,0) 62%)'}} />
      <div style={{position: 'absolute', right: -400 + b, bottom: -600, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,190,230,.50), rgba(239,190,230,0) 62%)'}} />
      {/* film grain, as on the website's hero */}
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, opacity: 0.42, mixBlendMode: 'soft-light'}}>
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- type: a headline and a line, fading in like a product page
const Words: React.FC<{f: number; title: string; sub?: string; top?: number}> = ({f, title, sub, top = 180}) => {
  const t = outExpo(prog(f, 10, 26)), s = outExpo(prog(f, 18, 26));
  const style = (k: number) => ({opacity: k, filter: `blur(${(1 - k) * 10}px)`, transform: `translateY(${(1 - k) * 24}px)`});
  return (
    <div dir="rtl" style={{position: 'absolute', top, left: 80, right: 80, textAlign: 'center'}}>
      <div style={{fontFamily: AR, fontWeight: 500, fontSize: 104, lineHeight: 1.18, color: '#1D1D1F', ...style(t)}}>{title}</div>
      {sub && <div style={{fontFamily: AR, fontWeight: 300, fontSize: 42, lineHeight: 1.5, color: '#6E6E73', marginTop: 16, ...style(s)}}>{sub}</div>}
    </div>
  );
};

// the camera, placed every frame and aimed at a point
const Camera: React.FC<{pos: [number, number, number]; look: [number, number, number]}> = ({pos, look}) => {
  const {camera} = useThree();
  camera.position.set(...pos);
  camera.lookAt(...look);
  return null;
};

// a 3D view filling the frame, on a transparent canvas over the backdrop
const Stage: React.FC<{children: React.ReactNode; pos?: [number, number, number]; look?: [number, number, number]; fov?: number}> = ({children, pos = [0, 0, 6], look = [0, 0, 0], fov = 26}) => (
  <ThreeCanvas width={1080} height={1920} camera={{fov, position: pos}} gl={{antialias: true, alpha: true}}>
    <Camera pos={pos} look={look} />
    <Studio tone="light" exposure={1.0} />
    {children}
  </ThreeCanvas>
);

// ---------------------------------------------------------------- shots (f = the shot's own frame; 0 = its cut)
const Open: React.FC<{f: number}> = ({f}) => {
  const turn = outExpo(f / 80), push = inOut((f - 60) / 110);
  return (
    <>
      <Stage pos={[0, 0, 6.2 - push * 0.3]}>
        <Phone3D rec="phone-home" frames={102} rate={0.4} position={[0, -0.2 + turn * 0.08, 0]} rotation={[0.05 * (1 - turn), -1.25 * (1 - turn) + 0.08 * push, 0.02 * (1 - turn)]} />
      </Stage>
      <Words f={f + 26} title="موقعنا الجديد." sub="neurouniverse.om" />
    </>
  );
};

const PhoneShot: React.FC<{f: number; rec: string; frames: number; title: string; sub: string; ry: [number, number]; rx?: number}> = ({f, rec, frames, title, sub, ry, rx = 0.04}) => {
  const m = inOut((f + D) / 150);
  return (
    <>
      <Stage pos={[0, 0, 6.1 - m * 0.2]}>
        <Phone3D rec={rec} frames={frames} start={0} position={[0, -0.14 + m * 0.03, 0]} rotation={[rx, lerp(ry[0], ry[1], m), 0]} />
      </Stage>
      <Words f={f} title={title} sub={sub} />
    </>
  );
};

const Screens: React.FC<{f: number}> = ({f}) => {
  const m = inOut((f + D) / 100);
  return (
    <>
      <Stage pos={[lerp(0.9, 0.4, m), 3.8, 15.6 - m * 0.6]} look={[0.15, 2.05, 0]} fov={30}>
        <group rotation={[0, lerp(0.16, 0.08, m), 0]}>
          <Laptop3D rec="desk-home" frames={186} start={70} />
          <SoftShadow w={5.6} d={3.8} opacity={0.3} position={[0, 0.002, 0.15]} />
        </group>
        <group position={[1.55, 0, 1.55]} rotation={[0, lerp(-0.5, -0.38, m), 0]}>
          <Phone3D rec="phone-home" frames={102} start={0} rate={0.5} position={[0, 0.815, 0]} />
          <SoftShadow w={1.4} d={0.5} opacity={0.35} position={[0, 0.002, 0]} />
        </group>
      </Stage>
      <Words f={f} title="على كل شاشة." sub="من الكمبيوتر إلى الهاتف." />
    </>
  );
};

const Close: React.FC<{f: number}> = ({f}) => {
  const k = (a: number) => outExpo(prog(f, a, 30));
  const style = (v: number) => ({opacity: v, filter: `blur(${(1 - v) * 10}px)`, transform: `translateY(${(1 - v) * 20}px)`});
  const out = inOut(prog(f, 112, 18));
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <svg viewBox={LOGO_VB} width={420} height={420 * 0.632} style={{position: 'absolute', left: 330, top: 640, ...style(k(0))}}>
        <defs>
          <linearGradient id="filmLogo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={C.mark1} /><stop offset="1" stopColor={C.mark2} /></linearGradient>
        </defs>
        <path d={LOGO_D} fill="url(#filmLogo)" />
      </svg>
      <div dir="rtl" style={{position: 'absolute', top: 990, width: '100%', textAlign: 'center'}}>
        <div style={{fontFamily: AR, fontWeight: 500, fontSize: 86, color: '#1D1D1F', ...style(k(10))}}>طبّ وعلوم الأعصاب</div>
        <div style={{fontFamily: EN, fontWeight: 400, fontSize: 24, letterSpacing: 9, color: '#6E6E73', marginTop: 14, ...style(k(16))}}>NEURO UNIVERSE CLINIC</div>
        <div style={{fontFamily: EN, fontWeight: 400, fontSize: 46, color: '#7431F4', marginTop: 70, ...style(k(28))}}>neurouniverse.om</div>
        <div style={{fontFamily: AR, fontWeight: 300, fontSize: 34, color: '#6E6E73', marginTop: 14, ...style(k(36))}}>الرابط في البايو</div>
      </div>
    </AbsoluteFill>
  );
};

const SHOT: Record<string, React.FC<{f: number}>> = {
  open: Open,
  doctors: ({f}) => <PhoneShot f={f} rec="phone-doctors" frames={168} title="أطباؤنا." sub="استشاريو طب الأعصاب للكبار والأطفال." ry={[0.42, 0.16]} />,
  guide: ({f}) => <PhoneShot f={f} rec="phone-guide" frames={138} title="دليل الأعراض والأمراض." sub="ومتى تتصل بالرقم 9999." ry={[-0.42, -0.18]} />,
  games: ({f}) => <PhoneShot f={f} rec="phone-games" frames={180} title="اختبر دماغك." sub="ستروب، وسرعة رد الفعل، والذاكرة البصرية." ry={[0.12, -0.08]} rx={0.07} />,
  booking: ({f}) => <PhoneShot f={f} rec="phone-book" frames={138} title="احجز موعدك بسهولة." sub="ويؤكده الاستقبال عبر واتساب." ry={[0.36, 0.12]} />,
  screens: Screens,
  close: Close,
};

const Shot: React.FC<{id: string; len: number; first: boolean; last: boolean}> = ({id, len, first, last}) => {
  const g = useCurrentFrame() - (first ? 0 : D);
  const o = (first ? 1 : inOut(prog(g, -D, 2 * D))) * (last ? 1 : 1 - inOut(prog(g, len - D, 2 * D)));
  const S = SHOT[id];
  return <AbsoluteFill style={{opacity: o}}><S f={g} /></AbsoluteFill>;
};

export const Film: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    {SHOTS.map((s, i) => {
      const first = i === 0, last = i === SHOTS.length - 1;
      return (
        <Sequence key={s.id} from={s.from - (first ? 0 : D)} durationInFrames={s.len + (first ? 0 : D) + (last ? 0 : D)}>
          <Shot id={s.id} len={s.len} first={first} last={last} />
        </Sequence>
      );
    })}
    <Audio src={staticFile('audio/studio/studio.wav')} />
  </AbsoluteFill>
);
