import React from 'react';
import {Composition} from 'remotion';
import './theme';
import {Reel, TOTAL} from './Reel';
import {FPS, H, W} from './theme';

// Instagram Reel: 1080x1920 (9:16), 30 fps, about 62 s.
export const RemotionRoot: React.FC = () => <Composition id="LaunchReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
