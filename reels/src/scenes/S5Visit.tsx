import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {chaseShot, clamp, easeOutBack, hit} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {Flash, Shade, Slam, Space} from '../lib/fx';
import {AR, C} from '../theme';

// 19–23 s. First visit: price and duration punch out of the page, then the "what to bring" list ticks off on the beat.
const TICKS = [75, 82, 89, 96]; // abs 645, 652, 659, 666
const ITEMS = [2168, 2208, 2247, 2287];

export const S5Visit: React.FC = () => {
  const f = useCurrentFrame(); // 0..120 (abs 570..690)
  const shot = chaseShot({
    f,
    keys: [
      {f: 0, x: 260, y: 130},
      {f: 15, x: 250, y: 450},
      {f: 30, x: 230, y: 575},
      {f: 45, x: 230, y: 760},
      {f: 62, x: 240, y: 2121},
      ...ITEMS.map((y, i) => ({f: TICKS[i] - 2, x: 330, y})),
      {f: 120, x: 330, y: ITEMS[3]},
    ],
    taps: [30, 45, ...TICKS],
    zooms: [
      {f: 0, z: 12},
      {f: 8, z: 4.2},
      {f: 30, z: 5.6},
      {f: 45, z: 5.6},
      {f: 56, z: 2.8},
      {f: 72, z: 5.2},
      {f: 100, z: 5.6},
      {f: 108, z: 6},
      {f: 120, z: 15},
    ],
    follow: 0.2,
  });
  return (
    <AbsoluteFill>
      <Space />
      <PhoneCam src="visit.jpg" pageH={4391} {...shot}>
        {ITEMS.map((y, i) =>
          f >= TICKS[i] ? (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 352,
                top: y - 11,
                width: 22,
                height: 22,
                borderRadius: 11,
                background: C.purple,
                color: '#fff',
                fontSize: 14,
                lineHeight: '22px',
                textAlign: 'center',
                transform: `scale(${easeOutBack(clamp((f - TICKS[i]) / 6, 0, 1))})`,
                boxShadow: '0 0 12px rgba(116,49,244,.9)',
              }}
            >
              ✓
            </div>
          ) : null,
        )}
      </PhoneCam>
      <Shade side="top" o={1 - clamp((f - 110) / 8, 0, 1)} />
      <Slam
        y={150}
        words={[
          {t: 'اعرف ما ينتظرك', at: 2, out: 108, size: 120},
          {t: 'في زيارتك الأولى', at: 15, out: 110, size: 96, weight: 200, color: '#C8B4FF'},
        ]}
        gap={0}
      />
      <Chip f={f} at={30} out={58} big="30 ر.ع." small="الاستشارة" x={90} y={1380} rot={-6} />
      <Chip f={f} at={45} out={60} big="30 دقيقة" small="مدة الاستشارة" x={470} y={1580} rot={5} />
      <Flash at={[0]} len={6} max={0.6} />
    </AbsoluteFill>
  );
};

const Chip: React.FC<{f: number; at: number; out: number; big: string; small: string; x: number; y: number; rot: number}> = ({f, at, out, big, small, x, y, rot}) => {
  if (f < at || f > out + 8) return null;
  const t = easeOutBack(clamp((f - at) / 9, 0, 1));
  const o = 1 - clamp((f - out) / 8, 0, 1);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: o,
        transform: `perspective(1000px) translateZ(${(1 - t) * -600}px) rotate(${rot}deg) scale(${t * (1 + hit(f, at, 8) * 0.15)})`,
        background: 'linear-gradient(135deg,#7431F4,#4F1BD0)',
        borderRadius: 44,
        padding: '26px 48px',
        fontFamily: AR,
        color: '#fff',
        boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 70px rgba(116,49,244,.9)',
        border: '3px solid rgba(255,255,255,.5)',
      }}
    >
      <div style={{fontSize: 30, fontWeight: 300, opacity: 0.85}}>{small}</div>
      <div style={{fontSize: 100, fontWeight: 700, lineHeight: 1.1}}>{big}</div>
    </div>
  );
};
