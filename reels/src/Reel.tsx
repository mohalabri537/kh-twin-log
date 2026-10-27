import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Booking, Doctors, Eeg, Home, Intro, Services, Visit} from './scenes/Tour';
import {Articles, End, Language} from './scenes/Tour2';
import {Grain} from './lib/fx';
import {LightBg} from './lib/kit';
import timeline from './timeline.json';

const SCENES: Record<string, React.FC> = {
  intro: Intro,
  home: Home,
  doctors: Doctors,
  services: Services,
  eeg: Eeg,
  visit: Visit,
  booking: Booking,
  articles: Articles,
  language: Language,
  end: End,
};

// Scene start frames: each scene overlaps the previous one by `overlap` frames and dissolves in.
export const starts = () => {
  let t = 0;
  return timeline.scenes.map((s, i) => {
    const from = t;
    t += s.len - (i < timeline.scenes.length - 1 ? timeline.overlap : 0);
    return {...s, from};
  });
};
export const TOTAL = starts().reduce((a, s) => Math.max(a, s.from + s.len), 0);

const Dissolve: React.FC<{children: React.ReactNode; first: boolean}> = ({children, first}) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{opacity: first ? 1 : Math.min(1, f / timeline.overlap)}}>{children}</AbsoluteFill>;
};

export const Reel: React.FC = () => (
  <AbsoluteFill>
    <LightBg />
    {starts().map((s, i) => {
      const S = SCENES[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.len}>
          <Dissolve first={i === 0}>
            <S />
          </Dissolve>
        </Sequence>
      );
    })}
    <Grain />
    <Audio src={staticFile('audio/reel.wav')} />
  </AbsoluteFill>
);
