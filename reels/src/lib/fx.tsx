import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {AR, C} from '../theme';
import {clamp, easeOutBack, hit} from './chase';

// Deep purple space behind the phone: the site's own gradient glows (--g1/--g2/--g3), drifting.
export const Space: React.FC = () => {
  const f = useCurrentFrame();
  const a = Math.sin(f / 50) * 120, b = Math.cos(f / 63) * 140;
  return (
    <AbsoluteFill style={{background: C.space, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -400 + a, top: -300, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(116,49,244,.55), transparent 62%)'}} />
      <div style={{position: 'absolute', right: -600 + b, bottom: -400, width: 1600, height: 1600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(160,64,190,.34), transparent 60%)'}} />
      <div style={{position: 'absolute', left: 200 - b, top: 700 + a, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(86,56,214,.3), transparent 60%)'}} />
    </AbsoluteFill>
  );
};

// Film grain + vignette on top of everything.
export const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 8;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)'}} />
      <svg width="1080" height="1920" style={{position: 'absolute', opacity: 0.12, mixBlendMode: 'overlay'}}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// White flash on a cut.
export const Flash: React.FC<{at: number[]; color?: string; len?: number; max?: number}> = ({at, color = '#fff', len = 8, max = 0.9}) => {
  const f = useCurrentFrame();
  const o = Math.max(0, ...at.map((a) => (f >= a && f < a + len ? (1 - (f - a) / len) * max : 0)));
  return o > 0 ? <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: 'screen'}} /> : null;
};

// Darkens the edge where the words sit, so white type reads over the white site.
export const Shade: React.FC<{side: 'top' | 'bottom'; o: number}> = ({side, o}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(${side === 'bottom' ? '0deg' : '180deg'}, rgba(6,4,12,.95) 0%, rgba(6,4,12,.82) 30%, rgba(6,4,12,.45) 44%, transparent 60%)`,
      opacity: o,
    }}
  />
);

export type Word = {t: string; at: number; out?: number; size?: number; weight?: number; color?: string; y?: number; glow?: boolean};

// Kinetic Arabic type: each word slams in (scale + blur + RGB split), holds, and blurs out upward.
export const Slam: React.FC<{words: Word[]; y: number; gap?: number}> = ({words, y, gap = 10}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: y, display: 'flex', flexDirection: 'column', alignItems: 'center', gap}}>
      {words.map((w, i) => {
        const t = clamp((f - w.at) / 9, 0, 1);
        if (f < w.at) return <div key={i} style={{height: (w.size ?? 120) * 1.25}} />;
        const out = w.out !== undefined ? clamp((f - w.out) / 7, 0, 1) : 0;
        const s = interpolate(easeOutBack(t), [0, 1], [2.4, 1]);
        const blur = (1 - t) * 24 + out * 30;
        const split = hit(f, w.at, 12) * 14;
        const shake = hit(f, w.at, 8) * 10;
        return (
          <div
            key={i}
            dir="rtl"
            style={{
              fontFamily: AR,
              fontWeight: w.weight ?? 700,
              fontSize: w.size ?? 120,
              lineHeight: 1.25,
              color: w.color ?? '#fff',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              opacity: t * (1 - out),
              filter: `blur(${blur}px)`,
              transform: `translate(${(random(`x${i}${f}`) - 0.5) * shake}px, ${-out * 120 + (random(`y${i}${f}`) - 0.5) * shake}px) scale(${s})`,
              textShadow: `${split}px 0 rgba(255,40,120,.75), ${-split}px 0 rgba(40,220,255,.75), 0 0 40px rgba(116,49,244,${w.glow === false ? 0 : 0.9}), 0 6px 30px rgba(0,0,0,.6)`,
            }}
          >
            {w.t}
          </div>
        );
      })}
    </div>
  );
};

// Small punch-zoom on every beat while the groove is playing.
export const beatBump = (f: number, from: number, to: number, beat = 15) =>
  f < from || f >= to ? 1 : 1 + 0.018 * Math.exp(-((f - from) % beat) / 3);
