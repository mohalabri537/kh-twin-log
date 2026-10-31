import React from 'react';
import {AbsoluteFill} from 'remotion';
import meta from '../../../public/cap/meta.json';
import {Phone} from '../devices';
import {Heading, inOut, lerp, outQuint, prog, useF} from '../ui';

// 10.7–16 s. The symptoms and conditions guide: the page scrolls slowly past the red "call 9999" box and the topics.
const H = (meta as unknown as {cond: {hub: {h: number}}}).cond.hub.h;

export const Guide: React.FC = () => {
  const f = useF();
  const rise = outQuint(prog(f, 0, 36));
  const scroll = inOut(prog(f, 26, 88)) * Math.min(1300, H - 844);
  return (
    <AbsoluteFill>
      <Heading f={f} at={2} n="02" label="الأعراض والأمراض" title="دليل واضح" sub="ومتى تتصل بالرقم 9999" />
      <Phone src="cond-hub.jpg" k={1.22} cx={540} top={lerp(800, 720, rise)} scrollY={scroll} o={Math.min(1, rise * 1.4)} />
    </AbsoluteFill>
  );
};
