import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {S1Hook} from './scenes/S1Hook';
import {S2Why} from './scenes/S2Why';
import {S3Book} from './scenes/S3Book';
import {S4Eeg} from './scenes/S4Eeg';
import {S5Visit} from './scenes/S5Visit';
import {S6Desk} from './scenes/S6Desk';
import {S7End} from './scenes/S7End';
import {beatBump, Grain} from './lib/fx';

// Scene boundaries on the beat grid (15 frames = 1 beat at 120 BPM).
export const SCENES: [number, number, React.FC][] = [
  [0, 120, S1Hook],
  [120, 240, S2Why],
  [240, 450, S3Book],
  [450, 570, S4Eeg],
  [570, 690, S5Visit],
  [690, 780, S6Desk],
  [780, 900, S7End],
];

export const Reel: React.FC<{blur?: number}> = ({blur = 5}) => {
  const f = useCurrentFrame();
  // pulse with the kick while the beat plays (drums drop out for the EEG breakdown)
  const bump = beatBump(f, 120, 450) * beatBump(f, 570, 780);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{transform: `scale(${bump})`}}>
        {SCENES.map(([from, to, S]) => (
          <Sequence key={from} from={from} durationInFrames={to - from}>
            {blur > 1 ? (
              <CameraMotionBlur samples={blur} shutterAngle={200}>
                <S />
              </CameraMotionBlur>
            ) : (
              <S />
            )}
          </Sequence>
        ))}
      </AbsoluteFill>
      <Grain />
      <Audio src={staticFile('audio/reel.wav')} />
    </AbsoluteFill>
  );
};
