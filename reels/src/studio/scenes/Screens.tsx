import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Browser, Phone} from '../devices';
import {Heading, inOut, lerp, outQuint, prog, useF} from '../ui';

// 24–26.7 s. Every screen: the desktop homepage in a browser window, the phone in front of it.
export const Screens: React.FC = () => {
  const f = useF();
  const rise = outQuint(prog(f, -6, 30));
  const drift = inOut(prog(f, -12, 104));
  return (
    <AbsoluteFill>
      <Heading f={f} at={-4} n="05" label="كل الشاشات" title="من الكمبيوتر إلى الهاتف." />
      <Browser src="resp/w1440.jpg" w={940} cx={540} top={lerp(720, 680, rise) - drift * 12} o={Math.min(1, rise * 1.4)} />
      <Phone src="top-ar.jpg" k={0.56} cx={850} top={lerp(1130, 1060, outQuint(prog(f, 4, 30))) - drift * 26} o={outQuint(prog(f, 4, 22))} />
    </AbsoluteFill>
  );
};
