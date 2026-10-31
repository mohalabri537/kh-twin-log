import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {AR, EN} from '../theme';
import {Phone3D} from './Phone3D';
import {Studio} from './stage';

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
const inOut = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

// Test shot (5 s): out of the dark, the phone turns towards us on a black stage, catching the studio light along its
// edge, with the website playing on its screen; the headline fades in above it.
export const Test3D: React.FC = () => {
  const f = useCurrentFrame();
  const turn = outExpo(f / 80);
  const push = inOut((f - 70) / 80);
  const text = clamp((f - 46) / 24);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <ThreeCanvas width={1080} height={1920} camera={{fov: 26, position: [0, 0, 5.2 - push * 0.32]}} gl={{antialias: true}}>
        <Studio exposure={1.05} />
        <Phone3D rec="phone-home" frames={102} rate={102 / 150} position={[0, -0.46 + turn * 0.12, 0]} rotation={[0.06 * (1 - turn), -1.25 * (1 - turn) + 0.1 * push, 0.02 * (1 - turn)]} />
      </ThreeCanvas>
      <div dir="rtl" style={{position: 'absolute', top: 210, width: '100%', textAlign: 'center', opacity: text, filter: `blur(${(1 - text) * 12}px)`, transform: `scale(${1.04 - text * 0.04})`}}>
        <div style={{fontFamily: AR, fontWeight: 500, fontSize: 120, color: '#F5F5F7', lineHeight: 1.15}}>موقعنا الجديد.</div>
        <div style={{fontFamily: EN, fontWeight: 400, fontSize: 34, letterSpacing: 1, color: '#86868B', marginTop: 20}}>neurouniverse.om</div>
      </div>
      <Audio src={staticFile('audio/studio/studio.wav')} />
    </AbsoluteFill>
  );
};
