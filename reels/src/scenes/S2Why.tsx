import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {chaseShot, clamp, easeOutBack, hit} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {Flash, Shade, Slam, Space} from '../lib/fx';
import {AR} from '../theme';

// 4–8 s. Chase cam racing down the doctors page; their portraits pop out of the screen.
export const S2Why: React.FC = () => {
  const f = useCurrentFrame(); // 0..120 (abs 120..240)
  const shot = chaseShot({
    f,
    keys: [
      {f: 0, x: 300, y: 130},
      {f: 15, x: 195, y: 540},
      {f: 30, x: 290, y: 812},
      {f: 45, x: 200, y: 1190},
      {f: 60, x: 200, y: 1585},
      {f: 75, x: 195, y: 2496},
      {f: 90, x: 285, y: 2768},
      {f: 120, x: 285, y: 2790},
    ],
    zooms: [
      {f: 0, z: 12},
      {f: 8, z: 4.4},
      {f: 30, z: 5.4},
      {f: 50, z: 4.2},
      {f: 66, z: 3.2},
      {f: 80, z: 4.8},
      {f: 96, z: 5.6},
      {f: 108, z: 6.2},
      {f: 120, z: 16},
    ],
    follow: 0.2,
  });
  return (
    <AbsoluteFill>
      <Space />
      <PhoneCam src="doctors.jpg" pageH={4765} {...shot} />
      <Pop src="img/haifa-800.webp" at={16} out={44} name="د. هيفاء العبرية" role="استشارية أولى · البورد الأمريكي" side={-1} />
      <Pop src="img/said-800.webp" at={76} out={104} name="د. سعيد المعولي" role="استشاري · زمالة ملبورن" side={1} />
      <Shade side="bottom" o={clamp(f / 6, 0, 1) * (1 - clamp((f - 108) / 8, 0, 1))} />
      <Slam
        y={1300}
        words={[
          {t: 'كل ما تحتاجه قبل زيارتك…', at: 0, out: 54, size: 92, weight: 300},
          {t: 'في مكان واحد', at: 60, out: 108, size: 150},
        ]}
        gap={0}
      />
      <Flash at={[0]} len={6} max={0.6} />
    </AbsoluteFill>
  );
};

// A portrait card that flies out of the screen toward the viewer.
const Pop: React.FC<{src: string; at: number; out: number; name: string; role: string; side: number}> = ({src, at, out, name, role, side}) => {
  const f = useCurrentFrame();
  if (f < at || f > out + 8) return null;
  const t = easeOutBack(clamp((f - at) / 12, 0, 1));
  const o = 1 - clamp((f - out) / 8, 0, 1);
  const float = Math.sin((f - at) / 8) * 10;
  return (
    <div
      style={{
        position: 'absolute',
        left: 540 + side * 210 - 190,
        top: 300 + float,
        width: 380,
        opacity: o,
        transform: `perspective(1200px) translateZ(${(1 - t) * -900 + o * 0}px) rotateY(${side * -18 * (1 - t) + side * 8}deg) rotateZ(${side * 4}deg) scale(${0.6 + t * 0.4 + (1 - o) * 0.4})`,
        filter: `blur(${(1 - o) * 14}px)`,
      }}
    >
      <div style={{borderRadius: 36, overflow: 'hidden', boxShadow: `0 40px 90px rgba(0,0,0,.6), 0 0 0 4px rgba(169,139,255,.8), 0 0 ${50 + hit(f, at, 12) * 80}px rgba(116,49,244,.9)`}}>
        <Img src={staticFile(src)} style={{width: 380, height: 380, objectFit: 'cover', display: 'block'}} />
        <div dir="rtl" style={{background: 'rgba(12,8,24,.92)', padding: '20px 24px', fontFamily: AR, color: '#fff'}}>
          <div style={{fontSize: 40, fontWeight: 500}}>{name}</div>
          <div style={{fontSize: 24, fontWeight: 300, color: '#C8B4FF', marginTop: 4}}>{role}</div>
        </div>
      </div>
    </div>
  );
};
