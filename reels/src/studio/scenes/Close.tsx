import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LOGO_D, LOGO_VB} from '../../logoPath';
import {AR, C, EN} from '../../theme';
import {GREY, INK, inOut, Line, outQuint, prog, useF, VIOLET} from '../ui';

// 26.7–31 s. On the closing chord: the logo, the name and the address, then a quiet fade to the empty page, so
// the reel loops back into its first frame.
export const Close: React.FC = () => {
  const f = useF();
  const logo = outQuint(prog(f, 0, 40));
  const out = inOut(prog(f, 112, 18));
  const S = 210; // logo half-width
  return (
    <AbsoluteFill style={{opacity: 1 - out}}>
      <svg viewBox={LOGO_VB} width={S * 2} height={S * 1.2643} style={{position: 'absolute', left: 540 - S, top: 660, opacity: logo, transform: `scale(${0.97 + logo * 0.03})`}}>
        <defs>
          <linearGradient id="closeLogo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.mark1} />
            <stop offset="1" stopColor={C.mark2} />
          </linearGradient>
        </defs>
        <path d={LOGO_D} fill="url(#closeLogo)" />
      </svg>
      <div dir="rtl" style={{position: 'absolute', top: 1010, width: '100%', textAlign: 'center'}}>
        <Line f={f} at={12}>
          <div style={{fontFamily: AR, fontWeight: 300, fontSize: 84, color: INK}}>طبّ وعلوم الأعصاب</div>
        </Line>
        <Line f={f} at={18}>
          <div style={{fontFamily: EN, fontWeight: 400, fontSize: 24, letterSpacing: 9, color: GREY, marginTop: 14}}>NEURO UNIVERSE CLINIC</div>
        </Line>
        <div style={{height: 70}} />
        <Line f={f} at={30}>
          <div style={{fontFamily: EN, fontWeight: 400, fontSize: 46, letterSpacing: 1, color: VIOLET}}>neurouniverse.om</div>
        </Line>
        <Line f={f} at={38}>
          <div style={{fontFamily: AR, fontWeight: 300, fontSize: 34, color: GREY, marginTop: 14}}>الرابط في البايو</div>
        </Line>
      </div>
    </AbsoluteFill>
  );
};
