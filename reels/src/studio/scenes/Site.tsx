import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR, EN} from '../../theme';
import {Fold} from '../devices';
import {GREY, Heading, inOut, lerp, Line, outQuint, prog, useF, VIOLET} from '../ui';

// 0–5.3 s. The new site on a foldable phone: closed, showing the site on its outer screen; it opens like a book in a
// little over a second, and the camera moves in until the website fills the frame.
export const Site: React.FC = () => {
  const f = useF();
  const rise = outQuint(prog(f, -30, 44));
  const open = inOut(prog(f, 16, 32));
  const push = inOut(prog(f, 52, 90)); // into the website
  return (
    <AbsoluteFill>
      <Heading f={f} at={-30} title="موقعنا الجديد." />
      <div dir="rtl" style={{position: 'absolute', top: 340, left: 96, right: 96, textAlign: 'center'}}>
        <Line f={f} at={40}>
          <div style={{fontFamily: AR, fontWeight: 300, fontSize: 48, color: GREY}}>صُمّم لكل شاشة.</div>
        </Line>
        <Line f={f} at={50}>
          <div style={{fontFamily: EN, fontWeight: 400, fontSize: 30, letterSpacing: 3, color: VIOLET, marginTop: 22}}>neurouniverse.om</div>
        </Line>
      </div>
      <Fold cover="fold-cover.jpg" inner="fold-inner.jpg" k={1.07} cx={540} cy={lerp(1230, 1170, rise) + push * 30}
        open={open} scale={lerp(1.3, 1, open) * lerp(1, 1.17, push)} rx={lerp(4, 0, open)} ry={lerp(lerp(-20, -10, rise), 0, open)} o={Math.min(1, rise * 1.5)} />
    </AbsoluteFill>
  );
};
