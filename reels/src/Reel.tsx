import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Hook} from './scenes/Hook';
import {Tour} from './scenes/Tour';
import {Booking} from './scenes/Booking';
import {Dark, End} from './scenes/DarkEnd';
import {Grain} from './lib/fx';
import {kick, LightBg} from './lib/kit';
import timeline from './timeline.json';

const SCENES: Record<string, React.FC> = {hook: Hook, tour: Tour, booking: Booking, dark: Dark, end: End};

// Scene start frames on the 120 BPM grid (15 frames per beat).
export const starts = () => {
  let t = 0;
  return timeline.scenes.map((s) => {
    const from = t;
    t += s.len;
    return {...s, from};
  });
};
export const TOTAL = starts().reduce((a, s) => Math.max(a, s.from + s.len), 0);

export const Reel: React.FC = () => {
  const f = useCurrentFrame();
  const sc = starts();
  const at = (id: string) => sc.find((s) => s.id === id)!.from;
  // the groove runs from the first drop until the logo; everything breathes with the kick
  const grooving = f >= at('tour') && f < at('end');
  const pulse = grooving ? kick(f) : 0;
  return (
    <AbsoluteFill>
      <LightBg pulse={pulse} />
      <AbsoluteFill style={{transform: `scale(${1 + pulse * 0.008})`}}>
        {sc.map((s) => {
          const S = SCENES[s.id];
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.len}>
              <S />
            </Sequence>
          );
        })}
      </AbsoluteFill>
      <Grain />
      <Audio src={staticFile('audio/reel.wav')} />
    </AbsoluteFill>
  );
};
