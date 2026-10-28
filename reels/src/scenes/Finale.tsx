import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, easeOutBack, hit} from '../lib/chase';
import {Neural} from '../lib/neural';
import {ev, tapState} from '../lib/kit';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, C, EN} from '../theme';

// 23–29 s. A field of neurons gathers into the NU logo, which fills with purple; then the name, the
// website (revealed by a scan of light) and «احجز الآن», tapped on the final chord.
const LOGO = {cx: 540, cy: 640, scale: 320};

export const Finale: React.FC = () => {
  const f = useCurrentFrame();
  const formed = ev('end', 'form')[0]; // 44
  const urlAt = ev('end', 'scan')[1]; // 65
  const btnAt = ev('end', 'lock')[0]; // 90, the button snaps in
  const tap = ev('end', 'tap')[0]; // 120
  const bio = ev('end', 'blip')[1]; // 130
  const morph = easeInOut(clamp(f / formed, 0, 1));
  const fill = easeInOut(clamp((f - formed) / 8, 0, 1));
  const glow = hit(f, formed, 22);
  const appear = (at: number) => {
    const t = easeOut(clamp((f - at) / 12, 0, 1));
    return {opacity: t, transform: `translateY(${(1 - t) * 30}px)`};
  };
  const scan = clamp((f - urlAt) / 14, 0, 1);
  const btn = easeOutBack(clamp((f - btnAt) / 12, 0, 1));
  const {press, ripple} = tapState(f, [tap]);
  const fp = easeOut(clamp((f - (tap - 16)) / 13, 0, 1));
  return (
    <AbsoluteFill style={{transform: `scale(${1 + f * 0.0004})`}}>
      <Neural f={f} mode="light" travel={300 + f * 4} morph={morph} logo={LOGO} fire={1 - morph} opacity={1 - clamp((f - formed - 4) / 14, 0, 1)} />
      <svg viewBox={LOGO_VB} width={LOGO.scale * 2} height={LOGO.scale * 1.2643} style={{position: 'absolute', left: LOGO.cx - LOGO.scale, top: LOGO.cy - LOGO.scale * 0.6322, overflow: 'visible', opacity: fill, transform: `scale(${0.96 + fill * 0.04})`, filter: `drop-shadow(0 20px ${30 + glow * 50}px rgba(116,49,244,${0.25 + glow * 0.4}))`}}>
        <defs>
          <linearGradient id="endLogo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.mark1} />
            <stop offset="1" stopColor={C.mark2} />
          </linearGradient>
        </defs>
        <path d={LOGO_D} fill="url(#endLogo)" />
      </svg>
      <div dir="rtl" style={{position: 'absolute', top: 900, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 700, fontSize: 96, color: C.ink, ...appear(ev('end', 'blip')[0])}}>
        طبّ وعلوم الأعصاب
      </div>
      <div style={{position: 'absolute', top: 1040, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 400, fontSize: 38, color: '#55555C', letterSpacing: 3, ...appear(ev('end', 'blip')[0] + 6)}}>
        NEURO UNIVERSE CLINIC
      </div>
      {/* the website, revealed left to right by a bar of light */}
      <div style={{position: 'absolute', top: 1150, left: 0, right: 0, height: 110, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative'}}>
          <div style={{fontFamily: EN, fontWeight: 300, fontSize: 84, color: C.purple, clipPath: `inset(0 ${(1 - scan) * 100}% 0 0)`}}>neurouniverse.om</div>
          {scan > 0 && scan < 1 && <div style={{position: 'absolute', top: 6, bottom: 6, left: `${scan * 100}%`, width: 5, background: '#fff', boxShadow: `0 0 24px 6px ${C.purpleLight}`}} />}
        </div>
      </div>
      {f >= btnAt && (
        <div style={{position: 'absolute', top: 1330, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div dir="rtl" style={{position: 'relative', overflow: 'hidden', transform: `scale(${btn * (1 - press * 0.08) * (1 + hit(f, tap, 12) * 0.06)})`, background: C.ink, color: '#fff', fontFamily: AR, fontWeight: 600, fontSize: 78, padding: '26px 100px', borderRadius: 999, boxShadow: `0 20px ${50 + hit(f, tap, 16) * 60}px rgba(116,49,244,${0.25 + hit(f, tap, 16) * 0.4})`}}>
            احجز الآن
            {f > tap + 8 && f < tap + 30 && <div style={{position: 'absolute', top: -20, bottom: -20, width: 90, left: `${-20 + ((f - tap - 8) / 22) * 140}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)', transform: 'skewX(-20deg)'}} />}
          </div>
        </div>
      )}
      {f >= tap - 16 && f < tap + 24 && (
        <div style={{position: 'absolute', left: 540 + (1 - fp) * 300, top: 1410 + (1 - fp) * 420, opacity: 1 - clamp((f - tap - 12) / 10, 0, 1)}}>
          {ripple >= 0 && <div style={{position: 'absolute', left: -60, top: -60, width: 120, height: 120, borderRadius: 60, border: `6px solid ${C.purple}`, transform: `scale(${1 + ripple * 0.15})`, opacity: 1 - ripple / 20}} />}
          <div style={{position: 'absolute', left: -44, top: -44, width: 88, height: 88, borderRadius: 44, background: 'radial-gradient(circle, rgba(255,255,255,.95), rgba(169,139,255,.6))', border: `4px solid ${C.purple}`, transform: `scale(${1 - press * 0.28})`, boxShadow: '0 8px 24px rgba(0,0,0,.25)'}} />
        </div>
      )}
      <div dir="rtl" style={{position: 'absolute', top: 1530, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 400, fontSize: 46, color: '#55555C', ...appear(bio)}}>
        الرابط في البايو ↑
      </div>
    </AbsoluteFill>
  );
};
