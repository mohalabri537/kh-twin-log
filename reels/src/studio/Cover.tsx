import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AR, EN} from '../theme';
import {Phone} from './devices';
import {GREY, INK, M, Paper, VIOLET} from './ui';

// The studio cut's cover: the homepage on a phone, the headline set above it, as in the first shot.
export const StudioCover: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div dir="rtl" style={{position: 'absolute', top: 190, right: M, left: M, textAlign: 'right'}}>
      <div style={{fontFamily: AR, fontWeight: 300, fontSize: 104, lineHeight: 1.22, color: INK}}>موقعنا الجديد</div>
      <div style={{fontFamily: AR, fontWeight: 300, fontSize: 44, lineHeight: 1.5, color: GREY, marginTop: 18}}>طبّ وعلوم الأعصاب، في مسقط</div>
    </div>
    <div style={{position: 'absolute', top: 545, right: M, fontFamily: EN, fontWeight: 400, fontSize: 30, letterSpacing: 3, color: VIOLET}}>neurouniverse.om</div>
    <Phone src="top-ar.jpg" k={1.26} cx={540} top={680} lift={10} />
  </AbsoluteFill>
);
