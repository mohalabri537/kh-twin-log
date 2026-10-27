import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {useF} from '../lib/time';
import {chaseShot, clamp, easeInOut, hit} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {EegLines} from '../lib/Eeg';
import {Flash, Shade, Slam, Space} from '../lib/fx';

// 0–4 s. A heartbeat of an EEG line spikes, cut to an extreme close-up of the purple logo;
// a swipe makes it grow and open onto the EEG screen while the camera pulls back to the phone.
export const S1Hook: React.FC = () => {
  const f = useF();

  if (f < 15) {
    // cold open: flat line with one blip, then a spike that tears the frame open
    const prog = clamp(f / 13, 0, 1);
    return (
      <AbsoluteFill style={{background: '#000'}}>
        <div style={{position: 'absolute', left: 0, top: 960 - 60, transform: `scaleY(${1 + hit(f, 12, 4) * 6})`}}>
          <EegLines width={1080} channels={1} gap={120} progress={prog} main={0} amp={4 + (f > 10 ? 20 : 0)} />
        </div>
        <Flash at={[13]} len={3} max={0.4} />
      </AbsoluteFill>
    );
  }

  const r = f - 15;
  const idx = Math.round(interpolate(r, [12, 80], [0, 47], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut}));
  const shot = chaseShot({
    f: r,
    keys: [
      {f: 0, x: 210, y: 790},
      {f: 10, x: 205, y: 780},
      {f: 28, x: 190, y: 380},
    ],
    zooms: [
      {f: 0, z: 3.4},
      {f: 14, z: 2.9},
      {f: 45, z: 2.3},
      {f: 72, z: 1.9},
      {f: 104, z: 1.25},
    ],
    focus: {x: 195, y: 620},
    showFrom: 4,
    showTo: 34,
  });
  const pull = clamp((r - 66) / 36, 0, 1);
  const shake = 0;
  return (
    <AbsoluteFill>
      <Space />
      <PhoneCam
        src={`hero/${String(idx).padStart(3, '0')}.jpg`}
        pageH={844}
        header={false}
        {...shot}
        rx={shot.rx + easeInOut(pull) * 16}
        ry={shot.ry - easeInOut(pull) * 20}
        rot={shot.rot - easeInOut(pull) * 5 + Math.sin(r * 1.7) * shake * 0.1}
        screenAt={{x: 540 + easeInOut(pull) * 70, y: 960 - easeInOut(pull) * 170}}
      />
      <Shade side="bottom" o={clamp((f - 40) / 8, 0, 1) * (1 - clamp((f - 104) / 8, 0, 1))} />
      <Slam
        y={1240}
        words={[
          {t: 'أطلقنا', at: 45, out: 104, size: 190},
          {t: 'موقعنا', at: 60, out: 106, size: 150, weight: 200},
          {t: 'الجديد', at: 75, out: 108, size: 150, weight: 200, color: '#C8B4FF'},
        ]}
        gap={0}
      />
      <Flash at={[15]} len={6} max={0.4} />
      
    </AbsoluteFill>
  );
};
