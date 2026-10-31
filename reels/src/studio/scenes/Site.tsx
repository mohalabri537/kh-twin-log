import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EN} from '../../theme';
import {Phone} from '../devices';
import {Heading, inOut, lerp, outQuint, prog, useF, VIOLET} from '../ui';

// 0–5.3 s. An empty page; a phone rises slowly into it showing the new homepage, and the headline is set above.
export const Site: React.FC = () => {
  const f = useF();
  const rise = outQuint(prog(f, -22, 50)); // already rising on the first frame
  const push = inOut(prog(f, 40, 120)); // a slow drift closer
  return (
    <AbsoluteFill>
      <Heading f={f} at={-30} title="موقعنا الجديد" sub="طبّ وعلوم الأعصاب، في مسقط" />
      <div style={{position: 'absolute', top: 545, right: 96, fontFamily: EN, fontWeight: 400, fontSize: 30, letterSpacing: 3, color: VIOLET, opacity: outQuint(prog(f, 10, 24))}}>neurouniverse.om</div>
      <Phone src="top-ar.jpg" k={lerp(1.22, 1.3, push)} cx={540} top={lerp(840, 690, rise) - push * 20} o={Math.min(1, rise * 1.4)} lift={push * 20} />
    </AbsoluteFill>
  );
};
