import React from 'react';
import {Composition, Still} from 'remotion';
import {Cover} from './Cover';
import './theme';
import {Reel, TOTAL} from './Reel';
import {Studio} from './studio/Studio';
import {Test3D} from './three/Test3D';
import {StudioCover} from './studio/Cover';
import {TOTAL as STUDIO_TOTAL} from './studio/plan';
import {FPS, H, W} from './theme';

// Instagram Reels: 1080x1920 (9:16), 30 fps.
// StudioReel: the calm, editorial cut (31 s, 90 BPM). LaunchReel: the earlier high-energy cut (30.5 s, 120 BPM).
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Test3D" component={Test3D} durationInFrames={150} fps={FPS} width={W} height={H} />
    <Composition id="StudioReel" component={Studio} durationInFrames={STUDIO_TOTAL} fps={FPS} width={W} height={H} />
    <Still id="StudioCover" component={StudioCover} width={W} height={H} />
    <Composition id="LaunchReel" component={Reel} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
    <Still id="Cover" component={Cover} width={W} height={H} />
  </>
);
