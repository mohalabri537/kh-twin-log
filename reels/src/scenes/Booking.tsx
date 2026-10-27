import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {chaseShot, clamp, easeOut, easeOutBack, hit, lerp} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {BlurX, ev, Kinetic, kf, TopFade, whip} from '../lib/kit';
import {AR, C, EN} from '../theme';

// 12–22 s. Booking, one clear step every 3 beats: service → doctor → day → time → WhatsApp.
// The big caption names the step being done and slams in on every tap; the tracker and clock show progress.
const LEN = 300;
const STATES = [
  {src: 'book-start.jpg', h: 2551},
  {src: 'book-svc.jpg', h: 2966},
  {src: 'book-doc.jpg', h: 3407},
  {src: 'book-date.jpg', h: 4589},
  {src: 'book-time.jpg', h: 4589},
];
const TARGETS = [
  {x: 195, y: 458},
  {x: 195, y: 873},
  {x: 317, y: 1283},
  {x: 195, y: 1729},
  {x: 298, y: 2630},
];
const STEPS = ['الخدمة', 'الطبيب', 'اليوم', 'الوقت', 'واتساب'];
const ACTIONS = ['اختر الخدمة', 'اختر الطبيب', 'اختر اليوم', 'اختر الوقت', 'أرسل عبر واتساب'];
const MSG = ['السلام عليكم، أودّ حجز موعد في عيادة طبّ وعلوم الأعصاب.', 'الخدمة: استشارة', 'الطبيب: د. هيفاء العبرية', 'اليوم: الأحد 1 نوفمبر', 'الوقت: الفترة المسائية', 'الاسم: أحمد'];

export const Booking: React.FC = () => {
  const f = useCurrentFrame();
  const taps = ev('booking', 'tap'); // [45, 90, 135, 180, 225]
  const sent = taps[4] + 8;
  const stage = taps.slice(0, 4).filter((t) => f >= t + 1).length;
  const st = STATES[stage];
  // finger arrives a few frames before each tap, rests, then moves on
  const keys = [{f: 0, x: 300, y: 720}];
  taps.forEach((t, i) => {
    keys.push({f: t - 6, ...TARGETS[i]});
    keys.push({f: t + 6, ...TARGETS[i]});
  });
  const shot = chaseShot({
    f,
    keys,
    taps,
    follow: 0.15,
    showFrom: 10,
    showTo: sent + 6,
    zooms: [
      {f: 0, z: 1.6},
      {f: 32, z: 2.15},
      {f: 52, z: 2.15},
      {f: 66, z: 1.85},
      {f: 82, z: 2.15},
      {f: 97, z: 2.15},
      {f: 111, z: 1.85},
      {f: 127, z: 2.15},
      {f: 142, z: 2.15},
      {f: 156, z: 1.85},
      {f: 172, z: 2.15},
      {f: 188, z: 2.15},
      {f: 202, z: 1.75},
      {f: 218, z: 2.25},
      {f: sent, z: 2.25},
      {f: sent + 20, z: 1.45},
    ],
  });
  const w = whip(f, LEN, 8, 8);
  const punch = taps.reduce((a, t) => a + hit(f, t, 8) * 0.035, 0);
  return (
    <AbsoluteFill>
      <BlurX id="bx-book" amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          <PhoneCam src={st.src} pageH={st.h} {...shot} zoom={shot.zoom * (1 + punch)} screenAt={{x: 540, y: kf(f, [[0, 1310], [sent, 1310], [sent + 20, 1360]])}} />
        </AbsoluteFill>
      </BlurX>
      <TopFade o={1} to={730} />
      <StepTitle f={f} taps={taps} sent={sent} />
      <Kinetic words={[{t: 'رسالتك', at: sent + 2}, {t: 'جاهزة', at: sent + 8}]} sub={{t: 'على واتساب، والاستقبال يؤكد موعدك', at: sent + 14}} out={LEN - 10} />
      <Tracker f={f} taps={taps} />
      <Clock f={f} done={taps[4]} />
      <Bubble f={f - sent - 2} />
    </AbsoluteFill>
  );
};

// Big caption: «احجز موعدك», then the step being done, swapping on every tap.
const StepTitle: React.FC<{f: number; taps: number[]; sent: number}> = ({f, taps, sent}) => {
  if (f >= sent) return null;
  const segs = [{from: 0, to: 18, n: 0, t: 'احجز موعدك'}, ...ACTIONS.map((t, i) => ({from: i === 0 ? 20 : taps[i - 1] + 3, to: i < 4 ? taps[i] + 2 : sent, n: i + 1, t}))];
  const s = segs.find((x) => f >= x.from && f <= x.to);
  const subO = clamp((f - 6) / 6, 0, 1) * (1 - clamp((f - sent + 4) / 4, 0, 1));
  return (
    <>
      {s && (() => {
        const t = clamp((f - s.from) / 8, 0, 1);
        const out = clamp((f - (s.to - 2)) / 2, 0, 1);
        return (
          <div dir="rtl" style={{position: 'absolute', top: 175, left: 30, right: 30, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, opacity: clamp((f - s.from) / 3, 0, 1) * (1 - out), transform: `translateY(${-out * 30}px) scale(${lerp(1.3, 1, easeOutBack(t))})`, filter: `blur(${(1 - easeOut(t)) * 8}px)`}}>
            {s.n > 0 && (
              <span style={{width: 112, height: 112, borderRadius: 56, background: C.purple, color: '#fff', fontFamily: EN, fontWeight: 600, fontSize: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 30px rgba(116,49,244,.4)'}}>{s.n}</span>
            )}
            <span style={{fontFamily: AR, fontWeight: 700, fontSize: 108, color: C.ink, whiteSpace: 'nowrap'}}>{s.t}</span>
          </div>
        );
      })()}
      <div dir="rtl" style={{position: 'absolute', top: 330, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 300, fontSize: 54, color: C.purple, opacity: subO}}>
        احجز في أقل من دقيقة
      </div>
    </>
  );
};

// Five steps in a row; each one fills purple with a check when it's tapped.
const Tracker: React.FC<{f: number; taps: number[]}> = ({f, taps}) => {
  const show = easeOut(clamp((f - 14) / 10, 0, 1)) * (1 - clamp((f - (LEN - 12)) / 8, 0, 1));
  const current = taps.findIndex((t) => f < t);
  return (
    <div dir="rtl" style={{position: 'absolute', top: 430, left: 30, right: 30, display: 'flex', justifyContent: 'center', gap: 14, opacity: show, transform: `translateY(${(1 - show) * 20}px)`}}>
      {STEPS.map((s, i) => {
        const done = f >= taps[i];
        const pop = done ? easeOutBack(clamp((f - taps[i]) / 8, 0, 1)) : 0;
        const active = i === current;
        const pulse = active ? 0.5 + 0.5 * Math.sin(f / 4) : 0;
        return (
          <div
            key={s}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px 12px 16px',
              borderRadius: 999,
              background: done ? C.purple : '#fff',
              border: `3px solid ${done ? C.purple : active ? `rgba(116,49,244,${0.4 + pulse * 0.6})` : '#DADAE0'}`,
              boxShadow: done ? '0 10px 24px rgba(116,49,244,.35)' : '0 4px 12px rgba(29,29,31,.06)',
              transform: `scale(${1 + pop * 0.08 - (done ? 0.08 * Math.min(1, (f - taps[i]) / 8) : 0)})`,
            }}
          >
            <span style={{width: 40, height: 40, borderRadius: 20, background: done ? '#fff' : active ? C.purple : '#EDEDF2', color: done ? C.purple : active ? '#fff' : '#8E8E93', fontFamily: EN, fontWeight: 600, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              {done ? '✓' : i + 1}
            </span>
            <span style={{fontFamily: AR, fontWeight: 500, fontSize: 32, color: done ? '#fff' : active ? C.ink : '#8E8E93'}}>{s}</span>
          </div>
        );
      })}
    </div>
  );
};

// Race clock under the tracker, ticking up and stopping when the message is sent.
const Clock: React.FC<{f: number; done: number}> = ({f, done}) => {
  if (f < 20 || f > done + 50) return null;
  const secs = Math.min(47, Math.floor(((f - 20) / (done - 20)) * 47));
  const fin = f >= done;
  const o = clamp((f - 20) / 8, 0, 1) * (1 - clamp((f - done - 40) / 10, 0, 1));
  return (
    <div style={{position: 'absolute', top: 528, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: o}}>
      <div style={{transform: `scale(${1 + hit(f, done, 10) * 0.25})`, fontFamily: EN, fontWeight: 600, fontSize: 44, color: '#fff', background: fin ? C.purple : C.ink, borderRadius: 999, padding: '8px 28px', boxShadow: '0 12px 30px rgba(29,29,31,.25)', fontVariantNumeric: 'tabular-nums'}}>
        ⏱ 0:{String(secs).padStart(2, '0')}{fin ? ' ✓' : ''}
      </div>
    </div>
  );
};

// The message the site prepares, popping up as a WhatsApp bubble (sample name, no phone number).
const Bubble: React.FC<{f: number}> = ({f}) => {
  if (f < 0 || f > 60) return null;
  const t = easeOutBack(clamp(f / 12, 0, 1));
  const o = 1 - clamp((f - 46) / 8, 0, 1);
  return (
    <div style={{position: 'absolute', left: 100, right: 100, top: 800, opacity: o, transform: `translateY(${(1 - t) * 200 - clamp((f - 46) / 8, 0, 1) * 120}px) scale(${0.6 + t * 0.4}) rotate(-2deg)`}}>
      <div dir="rtl" style={{background: '#DCF8C6', borderRadius: '36px 36px 8px 36px', padding: '30px 36px', fontFamily: AR, color: '#111', boxShadow: '0 30px 70px rgba(29,29,31,.3)'}}>
        {MSG.map((l, i) => (
          <div key={i} style={{fontSize: i === 0 ? 34 : 38, fontWeight: i === 0 ? 500 : 400, marginBottom: i === 0 ? 12 : 4, opacity: clamp((f - 4 - i * 2) / 4, 0, 1)}}>
            {l}
          </div>
        ))}
        <div style={{fontFamily: EN, fontSize: 26, color: f > 20 ? '#34B7F1' : '#8E8E93', textAlign: 'left'}}>✓✓</div>
      </div>
    </div>
  );
};
