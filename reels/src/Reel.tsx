import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {NeuroHook} from './scenes/NeuroHook';
import {Explode} from './scenes/Explode';
import {Booking} from './scenes/Booking';
import {Reviews} from './scenes/Reviews';
import {Finale} from './scenes/Finale';
import {Grain} from './lib/fx';
import {kick, LightBg} from './lib/kit';
import timeline from './timeline.json';

const SCENES: Record<string, React.FC> = {hook: NeuroHook, explode: Explode, booking: Booking, reviews: Reviews, end: Finale};

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
  const grooving = f >= at('explode') && f < at('end');
  const pulse = grooving ? kick(f % 30) : 0; // half-time: the kick lands every other beat
  return (
    <AbsoluteFill>
      <LightBg pulse={pulse} />
      <AbsoluteFill style={{transform: `scale(${1 + pulse * 0.012})`}}>
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
