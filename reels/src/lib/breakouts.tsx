import React, {useMemo} from 'react';
import {Img, random, staticFile} from 'remotion';
import {AR, C} from '../theme';
import {clamp, easeInOut, easeOutBack, hit, lerp} from './chase';

// Things that burst out of the phone during the tour, so it isn't one static shot after another.

// A doctor's portrait card flying out of the screen to one side.
export const PortraitCard: React.FC<{f: number; at: number; src: string; name: string; role: string; side: -1 | 1; y: number}> = ({f, at, src, name, role, side, y}) => {
  if (f < at) return null;
  const t = easeOutBack(clamp((f - at) / 12, 0, 1));
  const x = lerp(540, 540 + side * 330, t) - 160;
  const float = Math.sin((f - at) / 9) * 8;
  return (
    <div style={{position: 'absolute', left: x, top: y + float, width: 320, opacity: clamp((f - at) / 4, 0, 1), transform: `scale(${0.4 + t * 0.6}) rotate(${side * 5 * t}deg)`}}>
      <div style={{borderRadius: 32, overflow: 'hidden', background: '#fff', boxShadow: `0 30px 70px rgba(29,29,31,.28), 0 0 0 4px #fff, 0 0 ${40 + hit(f, at, 12) * 60}px rgba(116,49,244,.45)`}}>
        <Img src={staticFile(src)} style={{width: 320, height: 300, objectFit: 'cover', display: 'block'}} />
        <div dir="rtl" style={{padding: '16px 20px 18px', fontFamily: AR}}>
          <div style={{fontSize: 36, fontWeight: 700, color: C.ink}}>{name}</div>
          <div style={{fontSize: 26, fontWeight: 300, color: C.purple, marginTop: 2}}>{role}</div>
        </div>
      </div>
    </div>
  );
};

// A purple chip punching out of the screen (price, duration).
export const InfoChip: React.FC<{f: number; at: number; big: string; small: string; x: number; y: number; rot: number}> = ({f, at, big, small, x, y, rot}) => {
  if (f < at) return null;
  const t = easeOutBack(clamp((f - at) / 10, 0, 1));
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y + Math.sin((f - at) / 9) * 8,
        opacity: clamp((f - at) / 3, 0, 1),
        transform: `rotate(${rot}deg) scale(${t * (1 + hit(f, at, 8) * 0.1)})`,
        background: 'linear-gradient(135deg,#8A4DFF,#5A21D9)',
        borderRadius: 40,
        padding: '22px 44px',
        fontFamily: AR,
        color: '#fff',
        boxShadow: '0 30px 60px rgba(90,33,217,.4)',
      }}
    >
      <div style={{fontSize: 30, fontWeight: 300, opacity: 0.9}}>{small}</div>
      <div style={{fontSize: 96, fontWeight: 700, lineHeight: 1.1}}>{big}</div>
    </div>
  );
};

// Brainwave line: layered sines plus a few spikes, seeded so every render matches.
const eegPath = (seed: string, width: number, amp: number, step = 4) => {
  const fr = [0.011, 0.023, 0.041, 0.077, 0.13].map((f, i) => f * (0.7 + random(`${seed}f${i}`) * 0.6));
  const ph = fr.map((_, i) => random(`${seed}p${i}`) * 6.28);
  const am = [1, 0.7, 0.5, 0.35, 0.25];
  const sp = Array.from({length: 6}, (_, i) => ({x: random(`${seed}s${i}`) * width, h: (random(`${seed}h${i}`) - 0.3) * 2.6}));
  let d = '';
  for (let x = 0; x <= width; x += step) {
    let y = 0;
    for (let i = 0; i < fr.length; i++) y += Math.sin(x * fr[i] + ph[i]) * am[i];
    for (const s of sp) y += s.h * Math.exp(-Math.pow((x - s.x) / 9, 2)) * 2;
    d += `${x === 0 ? 'M' : 'L'}${x},${(y * amp).toFixed(1)}`;
  }
  return d;
};

// A glowing brainwave drawing itself right across the frame, over the phone.
export const EegSweep: React.FC<{f: number; from: number; to: number; y: number}> = ({f, from, to, y}) => {
  const d = useMemo(() => eegPath('sweep', 1080, 26), []);
  if (f < from) return null;
  const p = easeInOut(clamp((f - from) / (to - from), 0, 1));
  const fade = 1 - clamp((f - to - 10) / 8, 0, 1);
  const x = p * 1080;
  return (
    <svg width={1080} height={400} style={{position: 'absolute', left: 0, top: y - 200, overflow: 'visible', opacity: fade}}>
      <defs>
        <clipPath id="sweepclip">
          <rect x={0} y={-400} width={x} height={1200} />
        </clipPath>
        <filter id="sweepglow" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g clipPath="url(#sweepclip)" transform="translate(0,200)">
        <path d={d} fill="none" stroke="#fff" strokeWidth={16} strokeLinejoin="round" opacity={0.9} />
        <path d={d} fill="none" stroke={C.purple} strokeWidth={7} strokeLinejoin="round" filter="url(#sweepglow)" />
      </g>
      {p < 1 && <circle cx={x} cy={200} r={14} fill="#fff" stroke={C.purple} strokeWidth={5} filter="url(#sweepglow)" />}
    </svg>
  );
};
