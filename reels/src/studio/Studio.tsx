import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {MUSIC, SCENES, XF} from './plan';
import {Booking} from './scenes/Booking';
import {Close} from './scenes/Close';
import {Doctors} from './scenes/Doctors';
import {Games} from './scenes/Games';
import {Guide} from './scenes/Guide';
import {Screens} from './scenes/Screens';
import {Site} from './scenes/Site';
import {inOut, Paper, prog, SceneStart} from './ui';

// The studio cut of the website reel: calm, editorial, one idea per shot (see plan.ts).
const VIEW: Record<string, React.FC> = {site: Site, doctors: Doctors, guide: Guide, games: Games, booking: Booking, screens: Screens, close: Close};

// Each scene starts XF frames early and ends XF late: it rises in from below as the one before leaves upwards.
const Fade: React.FC<{len: number; first: boolean; last: boolean; children: React.ReactNode}> = ({len, first, last, children}) => {
  const g = useCurrentFrame() - (first ? 0 : XF); // the scene's own frame
  const into = first ? 1 : inOut(prog(g, -XF, XF * 2));
  const away = last ? 0 : inOut(prog(g, len - XF, XF * 2));
  return (
    <SceneStart.Provider value={first ? 0 : XF}>
      <AbsoluteFill style={{opacity: into * (1 - away), transform: `translateY(${(1 - into) * 110 - away * 110}px)`}}>{children}</AbsoluteFill>
    </SceneStart.Provider>
  );
};

export const Studio: React.FC<{music?: boolean}> = ({music = true}) => (
  <AbsoluteFill>
    <Paper />
    {SCENES.map((s, i) => {
      const V = VIEW[s.id];
      const first = i === 0, last = i === SCENES.length - 1;
      const from = s.from - (first ? 0 : XF);
      return (
        <Sequence key={s.id} from={from} durationInFrames={s.len + (first ? 0 : XF) + (last ? 0 : XF)}>
          <Fade len={s.len} first={first} last={last}>
            <V />
          </Fade>
        </Sequence>
      );
    })}
    {music && <Audio src={staticFile(MUSIC.file)} />}
  </AbsoluteFill>
);
