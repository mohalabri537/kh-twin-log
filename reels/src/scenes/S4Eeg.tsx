import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {useF} from '../lib/time';
import {chaseShot, clamp, easeInOut, easeOutBack, hit, lerp} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {EegLines} from '../lib/Eeg';
import {Flash, Shade, Slam, Space} from '../lib/fx';
import {AR, C} from '../theme';

// 15–19 s. A giant brainwave draws itself with the camera riding the pen; then the site's own trace,
// then racing through how to prepare.
const WORLD = 2600, CH = 9, GAP = 150, MAIN = 4;

export const S4Eeg: React.FC = () => {
  const f = useF(); // 0..120 (abs 450..570)
  if (f < 45) return <Giant f={f} />;
  if (f < 75) {
    const r = f - 45;
    const idx = Math.round(interpolate(r, [0, 28], [0, 39], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    const z = lerp(2.6, 1.7, easeInOut(clamp(r / 14, 0, 1))) + r * 0.008;
    return (
      <AbsoluteFill>
        <Space />
        <PhoneCam src={`eegscene/${String(idx).padStart(3, '0')}.jpg`} pageH={844} header={false} focus={{x: 195, y: 422}} zoom={z} rx={6} ry={-8 + r * 0.3} rot={-2} />
        <Flash at={[0]} len={6} max={0.3} />
      </AbsoluteFill>
    );
  }
  const r = f - 75;
  const shot = chaseShot({
    f: r,
    keys: [
      {f: 0, x: 250, y: 2390},
      {f: 15, x: 270, y: 2470},
      {f: 30, x: 270, y: 2640},
      {f: 45, x: 270, y: 2820},
    ],
    taps: [15, 30],
    zooms: [
      {f: 0, z: 2.6},
      {f: 10, z: 2.2},
      {f: 22, z: 2.4},
      {f: 45, z: 2.5},
    ],
    follow: 0.1,
  });
  return (
    <AbsoluteFill>
      <Space />
      <PhoneCam src="eeg.jpg" pageH={5344} {...shot} />
      <Shade side="top" o={1 - clamp((r - 38) / 6, 0, 1)} />
      <Slam y={170} words={[{t: 'جهّز نفسك خطوة بخطوة', at: 0, out: 40, size: 92, weight: 300}]} />
      <Flash at={[0]} len={6} max={0.6} />
    </AbsoluteFill>
  );
};

const Giant: React.FC<{f: number}> = ({f}) => {
  const prog = clamp(f / 40, 0, 1);
  const pen = easeInOut(prog) * WORLD;
  // camera rides the pen tip close up, then pulls back to show every channel
  const pull = easeInOut(clamp((f - 22) / 20, 0, 1));
  const zoom = lerp(1.5, 0.42, pull);
  const cx = lerp(pen - 120, WORLD * 0.62, pull);
  const cy = lerp(MAIN * GAP + GAP / 2, (CH * GAP) / 2, pull);
  const shake = 0;
  return (
    <AbsoluteFill style={{background: '#030208'}}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 50%, rgba(116,49,244,.45), transparent 60%)'}} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + Math.sin(f * 2.1) * shake}px, ${960 + Math.cos(f * 1.7) * shake}px) rotate(${lerp(-8, -4, pull)}deg) scale(${zoom}) translate(${-cx}px, ${-cy}px)`,
        }}
      >
        <EegLines width={WORLD} channels={CH} gap={GAP} progress={easeInOut(prog)} main={MAIN} amp={16} color={C.purpleLight} />
      </div>
      <Slam
        y={1200}
        words={[
          {t: 'استعد', at: 9, size: 200},
          {t: 'لتخطيط الدماغ', at: 24, size: 130, weight: 200, color: '#C8B4FF'},
        ]}
        gap={0}
      />
      <div dir="rtl" style={{position: 'absolute', top: 260, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 200, fontSize: 46, color: 'rgba(255,255,255,.75)', opacity: clamp((f - 28) / 8, 0, 1), transform: `scale(${easeOutBack(clamp((f - 28) / 10, 0, 1))})`}}>
        من 20 إلى 60 دقيقة · بلا ألم
      </div>
      <Flash at={[0]} len={8} max={0.35} />
    </AbsoluteFill>
  );
};

