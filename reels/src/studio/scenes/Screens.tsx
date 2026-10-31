import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Laptop, Phone} from '../devices';
import {Heading, inOut, lerp, outQuint, prog, useF} from '../ui';

// 24.7–26.7 s. Every screen: the desktop homepage on a laptop, the phone standing in front of it.
export const Screens: React.FC = () => {
  const f = useF();
  const rise = outQuint(prog(f, -6, 30));
  const drift = inOut(prog(f, -12, 84));
  return (
    <AbsoluteFill>
      <Heading f={f} at={-4} n="05" label="كل الشاشات" title="من الكمبيوتر إلى الهاتف" />
      <Laptop src="resp/w1440.jpg" w={850} cx={570} top={lerp(760, 720, rise) - drift * 10} o={Math.min(1, rise * 1.4)} />
      <Phone src="top-ar.jpg" k={0.6} cx={250} top={lerp(1080, 1010, outQuint(prog(f, 2, 30))) - drift * 22} o={outQuint(prog(f, 2, 22))} />
    </AbsoluteFill>
  );
};
