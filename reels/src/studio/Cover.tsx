import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR, EN} from '../theme';
import {Fold} from './devices';
import {GREY, INK, M, Paper, VIOLET} from './ui';

// The studio cut's cover: the headline over the open foldable showing the website, as the first shot settles.
export const StudioCover: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div dir="rtl" style={{position: 'absolute', top: 190, right: M, left: M, textAlign: 'center'}}>
      <div style={{fontFamily: AR, fontWeight: 500, fontSize: 96, lineHeight: 1.22, color: INK}}>موقعنا الجديد.</div>
      <div style={{fontFamily: AR, fontWeight: 300, fontSize: 48, color: GREY, marginTop: 24}}>صُمّم لكل شاشة.</div>
      <div style={{fontFamily: EN, fontWeight: 400, fontSize: 30, letterSpacing: 3, color: VIOLET, marginTop: 22}}>neurouniverse.om</div>
    </div>
    <Fold cover="fold-cover.jpg" inner="fold-inner.jpg" k={1.07} cx={540} cy={1190} open={1} scale={1.08} />
  </AbsoluteFill>
);
