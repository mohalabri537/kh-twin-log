import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AR, C, EN} from '../theme';
import {clamp, easeInOut, easeOut, easeOutBack, lerp} from './chase';
import timeline from '../timeline.json';

// Shared building blocks: light background, kinetic captions, whip transitions, beat helpers.

export const BEAT = 15; // frames per beat at 120 BPM

// Value along [frame, value] keys, eased between each pair; holds before/after.
export const kf = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i], [f1, v1] = keys[i + 1];
    if (f <= f1) return lerp(v0, v1, easeInOut((f - f0) / (f1 - f0)));
  }
  return keys[keys.length - 1][1];
};

// Frames of a sound cue in a scene: taps, clicks etc. are driven by the same list as the audio.
export const ev = (scene: string, type: string) =>
  ((timeline.sfx as unknown as Record<string, [number, string, number, number?][]>)[scene] ?? []).filter((e) => e[1] === type).map((e) => e[0]);

// Tap press curve (0..1) and frames since the last tap.
export const tapState = (f: number, taps: number[]) => {
  let press = 0, ripple = -1;
  for (const t of taps) {
    const d = f - t;
    if (d >= -3 && d <= 6) press = Math.max(press, d < 0 ? (d + 3) / 3 : 1 - d / 6);
    if (d >= 0) ripple = d;
  }
  return {press, ripple: ripple > 20 ? -1 : ripple};
};

// The site's light background: off-white with lilac and pink glows that pulse gently on the kick.
export const LightBg: React.FC<{pulse?: number}> = ({pulse = 0}) => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 60) * 120, b = Math.cos(f / 75) * 130;
  return (
    <AbsoluteFill style={{background: '#F5F5F7', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -380 + a, top: -260, width: 1300, height: 1300, borderRadius: '50%', background: `radial-gradient(circle, rgba(132,92,255,${0.3 + pulse * 0.12}), transparent 62%)`}} />
      <div style={{position: 'absolute', right: -420 - b, top: 300, width: 1200, height: 1200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,190,230,.55), transparent 62%)'}} />
      <div style={{position: 'absolute', left: -200 + b, bottom: -500, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(circle, rgba(184,166,255,${0.38 + pulse * 0.1}), transparent 62%)`}} />
    </AbsoluteFill>
  );
};

// Dark-mode background (site.css dark theme).
export const DarkBg: React.FC = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 60) * 120;
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -380 + a, top: -200, width: 1300, height: 1300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(116,49,244,.5), transparent 62%)'}} />
      <div style={{position: 'absolute', right: -400 - a, bottom: -300, width: 1300, height: 1300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,64,190,.3), transparent 62%)'}} />
    </AbsoluteFill>
  );
};

// Soft wash behind the captions so they stay readable when the phone pushes in.
export const TopFade: React.FC<{o: number; dark?: boolean; to?: number}> = ({o, dark, to = 640}) => {
  const c = dark ? '0,0,0' : '245,245,247';
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: to, opacity: o, background: `linear-gradient(180deg, rgba(${c},1) 0%, rgba(${c},.98) 74%, rgba(${c},0) 100%)`}} />
  );
};

// Bold caption that pops in word by word on the beat, with a light purple line under it. A word '\n' breaks the line.
export type W = {t: string; at: number};
export const Kinetic: React.FC<{words: W[]; out: number; sub?: {t: string; at: number; ltr?: boolean}; top?: number; size?: number; dark?: boolean}> = ({
  words,
  out,
  sub,
  top = 190,
  size = 116,
  dark,
}) => {
  const f = useCurrentFrame();
  if (f < words[0].at || f > out + 10) return null;
  const leave = easeInOut(clamp((f - out) / 9, 0, 1));
  const pop = (at: number) => {
    const t = clamp((f - at) / 9, 0, 1);
    return {opacity: clamp((f - at) / 4, 0, 1), transform: `scale(${lerp(1.35, 1, easeOutBack(t))})`, filter: `blur(${(1 - easeOut(t)) * 10}px)`};
  };
  return (
    <div style={{position: 'absolute', top, left: 40, right: 40, opacity: 1 - leave, transform: `translateY(${-leave * 50}px)`}}>
      <div dir="rtl" style={{display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 26px'}}>
        {words.map((w, i) =>
          w.t === '\n' ? (
            <div key={i} style={{flexBasis: '100%', height: 0}} />
          ) : f >= w.at ? (
            <span key={i} style={{display: 'inline-block', fontFamily: AR, fontWeight: 700, fontSize: size, lineHeight: 1.25, color: dark ? '#fff' : C.ink, ...pop(w.at)}}>
              {w.t}
            </span>
          ) : (
            <span key={i} style={{display: 'inline-block', fontFamily: AR, fontWeight: 700, fontSize: size, lineHeight: 1.25, opacity: 0}}>
              {w.t}
            </span>
          ),
        )}
      </div>
      {sub && f >= sub.at && (
        <div dir={sub.ltr ? 'ltr' : 'rtl'} style={{textAlign: 'center', fontFamily: sub.ltr ? EN : AR, fontWeight: 300, fontSize: 58, color: dark ? C.purpleLight : C.purple, marginTop: 8, ...pop(sub.at)}}>
          {sub.t}
        </div>
      )}
    </div>
  );
};

// Whip transition: slides in from the right over `inLen` frames, out to the left over the last `outLen`.
export const whip = (f: number, len: number, inLen = 8, outLen = 8, dist = 1400) => {
  const x = (g: number) => {
    if (inLen > 0 && g < inLen) return dist * (1 - easeOut(clamp(g / inLen, 0, 1)));
    if (outLen > 0 && g > len - outLen) {
      const t = clamp((g - (len - outLen)) / outLen, 0, 1);
      return -dist * t * t * t;
    }
    return 0;
  };
  const v = x(f) - x(f - 1);
  return {x: x(f), blur: Math.min(60, Math.abs(v) * 0.35), rot: clamp(v * 0.02, -8, 8)};
};

// Horizontal motion blur (SVG filter), so whips streak like a real camera pan.
export const BlurX: React.FC<{id: string; amount: number; children: React.ReactNode}> = ({id, amount, children}) => (
  <AbsoluteFill style={{filter: amount > 0.5 ? `url(#${id})` : undefined}}>
    <svg width="0" height="0" style={{position: 'absolute'}}>
      <filter id={id} x="-20%" y="0" width="140%" height="100%">
        <feGaussianBlur stdDeviation={`${amount} 0`} />
      </filter>
    </svg>
    {children}
  </AbsoluteFill>
);

// Giant faint word drifting behind the phone.
export const BigWord: React.FC<{t: string; f: number; len: number}> = ({t, f, len}) => (
  <div
    dir="rtl"
    style={{
      position: 'absolute',
      top: 820,
      left: -400,
      right: -400,
      textAlign: 'center',
      fontFamily: AR,
      fontWeight: 700,
      fontSize: 420,
      color: 'rgba(116,49,244,.07)',
      whiteSpace: 'nowrap',
      transform: `translateX(${lerp(260, -260, f / len)}px)`,
    }}
  >
    {t}
  </div>
);

// Kick pulse (1 → 0 after each beat) for small beat-synced bumps.
export const kick = (f: number) => Math.exp(-((f % BEAT) / 3));
