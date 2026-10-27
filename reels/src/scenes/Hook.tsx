import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, lerp} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {BlurX, Kinetic, kf, TopFade, whip} from '../lib/kit';

// 0–4 s. Close on the purple logo; a swipe opens it onto the EEG screen while the camera pulls back.
export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const frame = Math.round(kf(f, [[6, 0], [80, 47]]));
  const swipe = easeInOut(clamp((f - 3) / 22, 0, 1));
  const w = whip(f, 120, 0, 8);
  return (
    <AbsoluteFill>
      <BlurX id="bx-hook" amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          <PhoneCam
            src={`hero/${String(frame).padStart(3, '0')}.jpg`}
            pageH={844}
            header={false}
            focus={{x: 195, y: kf(f, [[0, 640], [95, 422]])}}
            zoom={kf(f, [[0, 2.7], [30, 2.45], [96, 1.6]])}
            screenAt={{x: 540, y: kf(f, [[0, 1180], [96, 1290]])}}
            rx={kf(f, [[40, 0], [96, 5]])}
            ry={kf(f, [[40, 0], [96, -8]])}
            pointer={f < 30 ? {x: 205, y: lerp(720, 360, swipe)} : null}
            press={f < 4 ? f / 4 : 0}
          />
        </AbsoluteFill>
      </BlurX>
      <TopFade o={clamp((f - 24) / 6, 0, 1) * (1 - clamp((f - 110) / 6, 0, 1))} />
      <Kinetic
        words={[
          {t: 'أطلقنا', at: 30},
          {t: 'موقعنا', at: 45},
          {t: 'الجديد', at: 60},
        ]}
        sub={{t: 'neurouniverse.om', at: 75, ltr: true}}
        out={108}
        size={124}
      />
    </AbsoluteFill>
  );
};
