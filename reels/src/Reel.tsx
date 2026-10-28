import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {NeuroHook} from './scenes/NeuroHook';
import {Explode} from './scenes/Explode';
import {Desktop} from './scenes/Desktop';
import {Booking} from './scenes/Booking';
import {Reviews} from './scenes/Reviews';
import {Finale} from './scenes/Finale';
import {Grain} from './lib/fx';
import {kick, LightBg} from './lib/kit';
import timeline from './timeline.json';
import score from './score.json';

const SCENES: Record<string, React.FC> = {hook: NeuroHook, explode: Explode, desktop: Desktop, booking: Booking, reviews: Reviews, end: Finale};

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
  // The frame pumps on every kick of the score, from the exploded view until the beat stops before
  // the logo (src/score.json is written by audio/make_audio.py from the take in use). If the score
  // builds into a drop instead, the build gets a soft breath every other beat and the pump starts on the drop.
  const from = Math.max(score.beatFrom, at('explode'));
  const pulse =
    f >= from && f < score.beatTo && (score.drop === null || f >= score.drop)
      ? kick(f - score.beatFrom) * (score.drop === null ? 1 : 1.3)
      : score.drop !== null && f >= at('explode') && f < score.drop
        ? Math.exp(-(((f - at('explode')) % 30) / 4)) * 0.5
        : 0;
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
