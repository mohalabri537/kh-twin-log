import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useF} from '../lib/time';
import {chaseShot, clamp, easeOutBack, hit} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {Flash, Shade, Slam, Space} from '../lib/fx';
import {AR, C, EN} from '../theme';

// 8–15 s. Booking in rhythm: service → doctor → day → time → send on WhatsApp. One tap per beat.
// Taps land on abs frames 255, 285, 315, 345 and 390 (see cues.json).
const TAPS = [15, 45, 75, 105, 150];
const STATES = [
  {src: 'book-start.jpg', h: 2551},
  {src: 'book-svc.jpg', h: 2966},
  {src: 'book-doc.jpg', h: 3407},
  {src: 'book-date.jpg', h: 4589},
  {src: 'book-time.jpg', h: 4589},
];

export const S3Book: React.FC = () => {
  const f = useF(); // 0..210 (abs 240..450)
  const stage = TAPS.slice(0, 4).filter((t) => f >= t + 1).length;
  const st = STATES[stage];
  const shot = chaseShot({
    f,
    keys: [
      {f: 0, x: 195, y: 250},
      {f: 12, x: 195, y: 458},
      {f: 40, x: 195, y: 873},
      {f: 70, x: 317, y: 1283},
      {f: 100, x: 195, y: 1729},
      {f: 122, x: 210, y: 2150},
      {f: 146, x: 298, y: 2630},
      {f: 210, x: 298, y: 2630},
    ],
    taps: TAPS,
    zooms: [
      {f: 0, z: 1.5},
      {f: 13, z: 2.5},
      {f: 30, z: 2.2},
      {f: 45, z: 2.6},
      {f: 60, z: 2.2},
      {f: 75, z: 2.6},
      {f: 90, z: 2.2},
      {f: 105, z: 2.6},
      {f: 126, z: 2.1},
      {f: 150, z: 2.7},
      {f: 172, z: 1.4},
      {f: 210, z: 1.35},
    ],
    follow: 0.11,
    showTo: 160,
  });
  // tiny camera punch on every tap
  const punch = TAPS.reduce((a, t) => a + hit(f, t, 8) * 0.03, 0);
  const back = clamp((f - 156) / 16, 0, 1);
  return (
    <AbsoluteFill>
      <Space />
      <PhoneCam src={st.src} pageH={st.h} {...shot} zoom={shot.zoom * (1 + punch)} rx={shot.rx + back * 10} ry={shot.ry + back * 16} rot={shot.rot + back * 4} screenAt={{x: 540 - back * 80, y: 960 + back * 260}} />
      <Shade side="top" o={clamp((f - 10) / 6, 0, 1) * (1 - clamp((f - 196) / 8, 0, 1))} />
      <Slam
        y={150}
        words={[
          {t: 'احجز موعدك', at: TAPS[0], out: 150, size: 140},
          {t: 'في أقل من دقيقة', at: TAPS[2], out: 152, size: 104, weight: 200},
        ]}
        gap={0}
      />
      <Stopwatch f={f} />
      <WhatsApp f={f - 152} />
      <Flash at={[TAPS[4] + 1]} len={8} color={C.whatsapp} max={0.55} />
    </AbsoluteFill>
  );
};

// Race clock: runs fast to 0:47 and locks green when the message is sent.
const Stopwatch: React.FC<{f: number}> = ({f}) => {
  if (f < 6 || f > 160) return null;
  const done = f >= 151;
  const secs = Math.min(47, Math.floor((f - 6) * 0.33));
  const pop = easeOutBack(clamp((f - 6) / 8, 0, 1)) + hit(f, 151, 10) * 0.3;
  return (
    <div style={{position: 'absolute', top: 1660, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          transform: `scale(${pop})`,
          fontFamily: EN,
          fontWeight: 600,
          fontSize: 64,
          color: '#fff',
          background: done ? C.whatsapp : 'rgba(12,8,24,.85)',
          border: `3px solid ${done ? '#fff' : C.purpleLight}`,
          borderRadius: 999,
          padding: '14px 40px',
          boxShadow: `0 0 50px ${done ? 'rgba(37,211,102,.8)' : 'rgba(116,49,244,.8)'}`,
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <span style={{fontSize: 48}}>⏱</span>0:{String(secs).padStart(2, '0')}
        {done && <span>✓</span>}
      </div>
    </div>
  );
};

// The message the site prepares, flying out as a WhatsApp bubble (sample name; no phone number).
const MSG = ['السلام عليكم، أودّ حجز موعد في عيادة طبّ وعلوم الأعصاب.', 'الخدمة: استشارة', 'الطبيب: د. هيفاء العبرية', 'اليوم: الأحد 1 نوفمبر', 'الوقت: الفترة المسائية', 'الاسم: أحمد'];
const WhatsApp: React.FC<{f: number}> = ({f}) => {
  if (f < 0 || f > 58) return null;
  const t = easeOutBack(clamp(f / 14, 0, 1));
  const out = clamp((f - 46) / 10, 0, 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 70,
        top: 330,
        opacity: 1 - out,
        transform: `perspective(1400px) translateY(${(1 - t) * 700 - out * 500}px) rotateX(${(1 - t) * 50}deg) rotateZ(${-3 + out * -8}deg) scale(${0.4 + t * 0.6})`,
        filter: `blur(${out * 16}px)`,
      }}
    >
      <div dir="rtl" style={{background: '#DCF8C6', borderRadius: '40px 40px 8px 40px', padding: '34px 40px', fontFamily: AR, color: '#111', boxShadow: '0 40px 100px rgba(0,0,0,.6), 0 0 80px rgba(37,211,102,.6)'}}>
        {MSG.map((l, i) => (
          <div key={i} style={{fontSize: i === 0 ? 36 : 34, fontWeight: i === 0 ? 500 : 400, marginBottom: i === 0 ? 14 : 4, opacity: clamp((f - 6 - i * 2) / 4, 0, 1)}}>
            {l}
          </div>
        ))}
        <div style={{fontFamily: EN, fontSize: 24, color: '#4A8F5C', textAlign: 'left', marginTop: 6}}>✓✓</div>
      </div>
    </div>
  );
};
