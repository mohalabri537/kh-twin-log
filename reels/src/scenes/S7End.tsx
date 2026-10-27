import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {evolvePath} from '@remotion/paths';
import {clamp, easeInOut, easeOutBack, hit} from '../lib/chase';
import {Flash, Space} from '../lib/fx';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, C, EN} from '../theme';

// 26–30 s. The logo draws itself, ignites (abs 810), the URL types out, and a finger taps «احجز الآن».
const IGNITE = 30, URL_AT = 44, BTN = 75, TAP = 90;
const URL = 'neurouniverse.om';

export const S7End: React.FC = () => {
  const f = useCurrentFrame(); // 0..120 (abs 780..900)
  const draw = easeInOut(clamp(f / 28, 0, 1));
  const {strokeDasharray, strokeDashoffset} = evolvePath(draw, LOGO_D);
  const fill = clamp((f - IGNITE) / 6, 0, 1);
  const shake = hit(f, IGNITE, 10) * 22 + hit(f, TAP, 8) * 12;
  const sx = Math.sin(f * 2.3) * shake, sy = Math.cos(f * 1.9) * shake;
  const push = 1 + f * 0.0009;
  const typed = clamp(Math.floor((f - URL_AT) / 2) + 1, 0, URL.length);
  const btn = easeOutBack(clamp((f - BTN) / 9, 0, 1));
  const press = f >= TAP - 3 && f <= TAP + 5 ? 1 - Math.abs(f - TAP) / 5 : 0;
  return (
    <AbsoluteFill>
      <Space />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${push})`}}>
        {/* shockwave */}
        {f >= IGNITE && f < IGNITE + 24 && (
          <div style={{position: 'absolute', left: 540 - 300, top: 760 - 300, width: 600, height: 600, borderRadius: '50%', border: `${10 * (1 - (f - IGNITE) / 24)}px solid ${C.purpleLight}`, transform: `scale(${1 + (f - IGNITE) * 0.18})`, opacity: 1 - (f - IGNITE) / 24}} />
        )}
        {/* particles */}
        {f >= IGNITE &&
          Array.from({length: 46}, (_, i) => {
            const a = random(`a${i}`) * Math.PI * 2, sp = 10 + random(`s${i}`) * 26, t = f - IGNITE;
            const d = sp * t * Math.exp(-t / 30) * 1.6;
            const o = clamp(1 - t / 50, 0, 1);
            return <div key={i} style={{position: 'absolute', left: 540 + Math.cos(a) * d, top: 760 + Math.sin(a) * d, width: 10, height: 10, borderRadius: 5, background: i % 3 ? C.purpleLight : '#fff', opacity: o, boxShadow: '0 0 16px #A98BFF'}} />;
          })}
        <svg viewBox={LOGO_VB} width={760} height={760 / 1.58187} style={{position: 'absolute', left: 160, top: 760 - 380 / 1.58187, overflow: 'visible', transform: `scale(${1 + hit(f, IGNITE, 12) * 0.12})`}}>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={C.mark1} />
              <stop offset="1" stopColor={C.mark2} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.03" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path d={LOGO_D} fill="url(#lg)" opacity={fill} />
          <path d={LOGO_D} fill="none" stroke="#fff" strokeWidth={0.012} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} filter="url(#glow)" opacity={1 - fill * 0.7} />
        </svg>
        <div dir="rtl" style={{position: 'absolute', top: 1060, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 200, fontSize: 64, color: '#fff', opacity: clamp((f - IGNITE - 4) / 8, 0, 1), letterSpacing: 1}}>
          طبّ وعلوم الأعصاب
        </div>
        <div style={{position: 'absolute', top: 1170, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 600, fontSize: 72, color: '#fff', letterSpacing: 1, textShadow: '0 0 30px rgba(116,49,244,.9)'}}>
          {URL.slice(0, typed)}
          {f >= URL_AT && f < BTN && <span style={{opacity: Math.floor(f / 4) % 2 ? 1 : 0.2, color: C.purpleLight}}>|</span>}
        </div>
        {f >= BTN && (
          <div style={{position: 'absolute', top: 1360, width: '100%', display: 'flex', justifyContent: 'center'}}>
            <div
              dir="rtl"
              style={{
                transform: `scale(${btn * (1 - press * 0.1) * (1 + Math.sin((f - BTN) / 4) * 0.02)})`,
                background: '#fff',
                color: C.ink,
                fontFamily: AR,
                fontWeight: 500,
                fontSize: 84,
                padding: '26px 90px',
                borderRadius: 999,
                boxShadow: `0 0 ${60 + hit(f, TAP, 14) * 160}px rgba(169,139,255,.95)`,
              }}
            >
              احجز الآن
            </div>
          </div>
        )}
        {f >= TAP - 12 && f <= TAP + 20 && (
          <div
            style={{
              position: 'absolute',
              left: 540 + (1 - clamp((f - TAP + 12) / 10, 0, 1)) * 260 - 46,
              top: 1440 + (1 - clamp((f - TAP + 12) / 10, 0, 1)) * 300 - 46,
              width: 92,
              height: 92,
              borderRadius: 46,
              background: 'radial-gradient(circle, rgba(255,255,255,.95), rgba(169,139,255,.6))',
              border: `4px solid ${C.purple}`,
              transform: `scale(${1 - press * 0.3})`,
              opacity: 1 - clamp((f - TAP - 10) / 10, 0, 1),
            }}
          />
        )}
      </AbsoluteFill>
      <Flash at={[0]} len={8} />
      <Flash at={[IGNITE]} len={10} color={C.purpleLight} max={0.7} />
      <Flash at={[TAP]} len={8} max={0.5} />
    </AbsoluteFill>
  );
};
