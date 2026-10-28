import React from 'react';
import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import './theme';
import {Reel, TOTAL} from './Reel';
import {FPS, H, W} from './theme';

// Instagram Reel: 1080x1920 (9:16), 30 fps, 30.5 s, 120 BPM; and its cover image.
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LaunchReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
