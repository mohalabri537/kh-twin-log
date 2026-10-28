import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, hit, lerp} from '../lib/chase';
import {Neural} from '../lib/neural';
import {PhoneCam} from '../lib/PhoneCam';
import {ev, Kinetic, kf, LightBg} from '../lib/kit';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {C} from '../theme';

// 0–4 s. Flying through a glowing neural network («أطلقنا» readable from frame 0); the neurons pull
// together into the NU logo, which then opens onto the bright site, the way the real homepage opens.

// The phone the logo opens onto; the exploded-view scene starts on exactly this shot.
export const HERO_PHONE = {src: 'top-ar.jpg', pageH: 844, header: false, focus: {x: 195, y: 422}, zoom: 1.5, screenAt: {x: 540, y: 1180}} as const;

const LOGO = {cx: 540, cy: 1090, scale: 430};
const BOWL = {x: 0.756, y: -0.079}; // the bowl of the U (assets/js/motion.js), where the site zooms in

export const NeuroHook: React.FC = () => {
  const f = useCurrentFrame();
  const formed = ev('hook', 'form')[0]; // 60
  const open = ev('hook', 'bloom')[0]; // 88
  // fast flight that brakes as the network turns into the logo
  const travel = 1700 * (1 - Math.exp(-f / 22)) + f * 6;
  const morph = kf(f, [[24, 0], [formed, 1]]);
  const fill = easeInOut(clamp((f - formed) / 8, 0, 1)) * (1 - clamp((f - open + 8) / 10, 0, 1));
  const glow = hit(f, formed, 20);
  // the hole in the dark layer, shaped like the logo, growing around the bowl of the U
  const k = f < open ? 1 : Math.pow(40, easeInOut(clamp((f - open) / 26, 0, 1)));
  const bx = LOGO.cx + BOWL.x * LOGO.scale, by = LOGO.cy + BOWL.y * LOGO.scale;
  const hole = `translate(${bx} ${by}) scale(${k}) translate(${-bx} ${-by}) translate(${LOGO.cx} ${LOGO.cy}) scale(${LOGO.scale})`;
  const showHole = f >= open - 10;
  return (
    <AbsoluteFill>
      {/* the bright world waiting behind the logo */}
      {showHole && (
        <AbsoluteFill>
          <LightBg />
          <PhoneCam {...HERO_PHONE} />
        </AbsoluteFill>
      )}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <defs>
          <mask id="logoHole">
            <rect width={1080} height={1920} fill="#fff" />
            {showHole && <path d={LOGO_D} transform={hole} fill="#000" />}
          </mask>
          <radialGradient id="space" cx="50%" cy="55%" r="70%">
            <stop offset="0" stopColor="#1A0B3D" />
            <stop offset="0.6" stopColor="#07040F" />
            <stop offset="1" stopColor="#020106" />
          </radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#space)" mask="url(#logoHole)" />
      </svg>
      <AbsoluteFill style={{opacity: 1 - clamp((f - open) / 8, 0, 1)}}>
        <Neural f={f} mode="dark" travel={travel} morph={morph} logo={LOGO} fire={1 - morph * 0.6} />
        <svg viewBox={LOGO_VB} width={LOGO.scale * 2} height={LOGO.scale * 1.2643} style={{position: 'absolute', left: LOGO.cx - LOGO.scale, top: LOGO.cy - LOGO.scale * 0.6322, overflow: 'visible', opacity: fill, filter: `drop-shadow(0 0 ${30 + glow * 60}px rgba(169,139,255,${0.5 + glow * 0.4}))`}}>
          <defs>
            <linearGradient id="hookLogo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={C.mark1} />
              <stop offset="1" stopColor={C.mark2} />
            </linearGradient>
          </defs>
          <path d={LOGO_D} fill="url(#hookLogo)" />
        </svg>
        {/* one soft ring of light as the logo locks in */}
        {f >= formed && f < formed + 26 && (
          <div style={{position: 'absolute', left: LOGO.cx - 300, top: LOGO.cy - 300, width: 600, height: 600, borderRadius: '50%', border: `${6 * (1 - (f - formed) / 26)}px solid rgba(203,184,255,.8)`, transform: `scale(${1 + (f - formed) * 0.06})`, opacity: 1 - (f - formed) / 26}} />
        )}
      </AbsoluteFill>
      <Kinetic
        dark
        words={[
          {t: 'أطلقنا', at: -5},
          {t: '\n', at: -5},
          {t: 'موقعنا', at: 15},
          {t: 'الجديد', at: 30},
        ]}
        sub={{t: 'neurouniverse.om', at: 45, ltr: true}}
        out={open - 6}
        size={124}
      />
      {/* a flash of light as the logo opens */}
      <AbsoluteFill style={{background: '#fff', opacity: f >= open ? lerp(0.5, 0, clamp((f - open) / 10, 0, 1)) : 0}} />
    </AbsoluteFill>
  );
};
