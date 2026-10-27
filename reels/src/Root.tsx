import React from 'react';
import {Composition} from 'remotion';
import './theme';
import {Reel} from './Reel';
import {FPS, H, TOTAL, W} from './theme';

// Instagram Reel: 1080x1920 (9:16), 30 fps, 36 s.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LaunchReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{blur: 5}} />
    <Composition id="LaunchReelDraft" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{blur: 1}} />
  </>
);
