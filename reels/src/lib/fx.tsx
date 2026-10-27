import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

// Very light film grain over everything, so the flat captures don't look sterile.
export const Grain: React.FC = () => {
  const seed = Math.floor(useCurrentFrame() / 2) % 8;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="1080" height="1920" style={{position: 'absolute', opacity: 0.06, mixBlendMode: 'soft-light'}}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};
