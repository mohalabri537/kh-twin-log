import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {AR, C, EN} from '../theme';
import {clamp, easeInOut, easeOut, lerp, Pt} from './chase';
import timeline from '../timeline.json';

// Light, calm building blocks for the website tour.

// Value along [frame, value] keys, eased between each pair; holds before/after.
export const kf = (f: number, keys: [number, number][]) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i], [f1, v1] = keys[i + 1];
    if (f <= f1) return lerp(v0, v1, easeInOut((f - f0) / (f1 - f0)));
  }
  return keys[keys.length - 1][1];
};

// The site's own light background: off-white with soft lilac and pink glows (site.css --g1/--g2/--g3).
export const LightBg: React.FC = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 120) * 80, b = Math.cos(f / 150) * 90;
  return (
    <AbsoluteFill style={{background: '#F5F5F7', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -380 + a, top: -260, width: 1300, height: 1300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(132,92,255,.30), transparent 62%)'}} />
      <div style={{position: 'absolute', right: -420 - b, top: 300, width: 1200, height: 1200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,190,230,.55), transparent 62%)'}} />
      <div style={{position: 'absolute', left: -200 + b, bottom: -500, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,166,255,.38), transparent 62%)'}} />
    </AbsoluteFill>
  );
};

// Two-line caption above the phone: big, dark, high contrast, held long enough to read.
export const Caption: React.FC<{at: number; out: number; title: string; sub?: string; subLtr?: boolean; top?: number}> = ({at, out, title, sub, subLtr, top = 215}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 16) return null;
  const tin = easeOut(clamp((f - at) / 18, 0, 1));
  const sin = easeOut(clamp((f - at - 8) / 18, 0, 1));
  const o = 1 - clamp((f - out) / 16, 0, 1);
  return (
    <div style={{position: 'absolute', top, left: 50, right: 50, textAlign: 'center', opacity: o}}>
      <div dir="rtl" style={{fontFamily: AR, fontWeight: 600, fontSize: 88, lineHeight: 1.3, color: C.ink, opacity: tin, transform: `translateY(${(1 - tin) * 26}px)`}}>
        {title}
      </div>
      {sub && (
        <div dir={subLtr ? 'ltr' : 'rtl'} style={{fontFamily: subLtr ? EN : AR, fontWeight: 400, fontSize: 52, lineHeight: 1.4, color: C.purple, marginTop: 14, opacity: sin, transform: `translateY(${(1 - sin) * 20}px)`}}>
          {sub}
        </div>
      )}
    </div>
  );
};

// Standard phone placement: below the caption, upright with a slight turn.
export const PHONE = {zoom: 1.6, screenAt: {x: 540, y: 1300}};
export const sway = (f: number) => ({rx: 3 + Math.sin(f / 95) * 1.5, ry: -5 + Math.sin(f / 80) * 2.5, rot: 0});

// Finger dragging up the screen while the page scrolls (scroll moves are [start, end] frame pairs).
export const swipeFinger = (f: number, moves: [number, number][], scrollY: number): {p: Pt | null; trail: Pt[]} => {
  for (const [a, b] of moves) {
    if (f >= a - 8 && f <= b + 6) {
      const t = easeInOut(clamp((f - a) / (b - a), 0, 1));
      const show = clamp((f - (a - 8)) / 8, 0, 1) * (1 - clamp((f - b) / 6, 0, 1));
      if (show <= 0.05) return {p: null, trail: []};
      const vy = lerp(640, 300, t);
      return {p: {x: 250, y: scrollY + vy}, trail: []};
    }
  }
  return {p: null, trail: []};
};

// Tap press curve for the finger (0..1) and frames since the last tap.
export const tapState = (f: number, taps: number[]) => {
  let press = 0, ripple = -1;
  for (const t of taps) {
    const d = f - t;
    if (d >= -4 && d <= 8) press = Math.max(press, d < 0 ? (d + 4) / 4 : 1 - d / 8);
    if (d >= 0) ripple = d;
  }
  return {press, ripple: ripple > 24 ? -1 : ripple};
};

// Frames of a sound cue in a scene: taps, ticks and clicks are driven by the same list as the audio.
export const ev = (scene: string, type: string) =>
  ((timeline.sfx as unknown as Record<string, [number, string, number][]>)[scene] ?? []).filter((e) => e[1] === type).map((e) => e[0]);
