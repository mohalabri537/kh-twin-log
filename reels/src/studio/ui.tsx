import React, {createContext, useContext} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AR, EN} from '../theme';

// The studio cut's design system: paper, one slim device, quiet type, slow easing.
// Everything is a pure function of the frame.

export const INK = '#1D1D1F';
export const GREY = '#6E6E73';
export const VIOLET = '#7431F4';
export const PAPER = '#F7F7F8';
export const M = 96; // page margin, frame px

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// slow, settled motion: long ease-outs, gentle in-outs
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const outQuint = (t: number) => 1 - Math.pow(1 - clamp(t), 5);
export const inOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2;
};
// A scene's own frame: 0 at its official start, negative while it fades in over the previous one.
export const SceneStart = createContext(0);
export const useF = () => useCurrentFrame() - useContext(SceneStart);

// 0→1 over [a, a+d]
export const prog = (f: number, a: number, d: number) => clamp((f - a) / d);

// Paper: near-white with one soft violet light that drifts very slowly, and a whisper of grain.
export const Paper: React.FC = () => {
  const f = useCurrentFrame();
  const x = Math.sin(f / 140) * 60, y = Math.cos(f / 170) * 40;
  return (
    <AbsoluteFill style={{background: PAPER, overflow: 'hidden'}}>
      <div style={{position: 'absolute', right: -520 + x, top: -560 + y, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(132,92,255,.16), rgba(132,92,255,0) 64%)'}} />
      <div style={{position: 'absolute', left: -620 - x, bottom: -700, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,190,230,.20), rgba(239,190,230,0) 62%)'}} />
    </AbsoluteFill>
  );
};

// A line of type revealed upward from behind a mask.
export const Line: React.FC<{f: number; at: number; children: React.ReactNode; style?: React.CSSProperties; d?: number; out?: number}> = ({f, at, children, style, d = 26, out}) => {
  const t = outExpo(prog(f, at, d));
  const o = out === undefined ? 1 : 1 - inOut(prog(f, out, 14));
  return (
    <div style={{overflow: 'hidden', padding: '0.3em 0 0.75em', margin: '-0.3em 0 -0.75em'}}>{/* room for Arabic dots and marks */}
      <div style={{transform: `translateY(${(1 - t) * 105}%)`, opacity: Math.min(1, t * 1.6) * o, ...style}}>{children}</div>
    </div>
  );
};

// One word, rising into place from behind a mask with a slight settle.
const Words: React.FC<{f: number; at: number; out?: number; children: React.ReactNode}> = ({f, at, out, children}) => {
  const t = outExpo(prog(f, at, 22));
  const o = out === undefined ? 1 : 1 - inOut(prog(f, out, 14));
  return (
    <span style={{display: 'inline-block', overflow: 'hidden', padding: '0.3em 0 0.75em', margin: '-0.3em 0 -0.75em'}}>
      <span style={{display: 'inline-block', transform: `translateY(${(1 - t) * 110}%) scale(${1 + (1 - t) * 0.08})`, opacity: Math.min(1, t * 1.6) * o}}>{children}</span>
    </span>
  );
};

// A section heading, centred: a small index and label, a light title, an optional subline.
export const Heading: React.FC<{f: number; at?: number; n?: string; label?: string; title: string; sub?: string; out?: number; top?: number}> = ({f, at = 0, n, label, title, sub, out, top = 190}) => (
  <div dir="rtl" style={{position: 'absolute', top, right: M, left: M, textAlign: 'center'}}>
    {label && (
      <Line f={f} at={at} out={out}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: AR, fontWeight: 400, fontSize: 32, color: GREY}}>
          {n && <span style={{fontFamily: EN, fontWeight: 400, fontSize: 26, letterSpacing: 2, color: VIOLET}}>{n}</span>}
          {n && <span style={{width: 48, height: 1.5, background: 'rgba(29,29,31,.25)'}} />}
          <span>{label}</span>
        </div>
      </Line>
    )}
    <div style={{height: label ? 26 : 0}} />
    {title.split('\n').map((l, i) => (
      <div key={i} style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 0.26em', fontFamily: AR, fontWeight: 500, fontSize: 96, lineHeight: 1.22, color: INK}}>
        {l.split(' ').map((w, j) => (
          <Words key={j} f={f} at={at + 6 + i * 5 + j * 4} out={out}>{w}</Words>
        ))}
      </div>
    ))}
    {sub && (
      <Line f={f} at={at + 16} out={out}>
        <div style={{fontFamily: AR, fontWeight: 300, fontSize: 44, lineHeight: 1.5, color: GREY, marginTop: 18}}>{sub}</div>
      </Line>
    )}
  </div>
);
