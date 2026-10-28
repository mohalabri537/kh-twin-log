import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {chaseShot, clamp, easeInOut, easeOut, easeOutBack, hit, lerp, Pt} from '../lib/chase';
import {framing, PhoneCam} from '../lib/PhoneCam';
import {BlurX, ev, Kinetic, kf, TopFade, whip} from '../lib/kit';
import {AR, C, EN} from '../theme';

// 10–19 s. Booking, one clear step every 3 beats: service → doctor → day → time → WhatsApp.
// Each choice lifts off the screen as a glass chip and docks in the summary bar; on send, the chips
// pour into the WhatsApp message the site prepares.
const LEN = 270;
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
const ACTIONS = ['اختر الخدمة', 'اختر الطبيب', 'اختر اليوم', 'اختر الوقت', 'أرسل عبر واتساب'];
const VALUES = ['استشارة', 'د. هيفاء العبرية', 'الأحد 1 نوفمبر', 'الفترة المسائية'];
// summary bar slots (centres on the frame), right to left like the page: two rows
const SLOTS = [
  {x: 836, y: 470, w: 190},
  {x: 574, y: 470, w: 300},
  {x: 296, y: 470, w: 230},
  {x: 676, y: 556, w: 250},
  {x: 418, y: 556, w: 230},
];
const MSG = ['السلام عليكم، أودّ حجز موعد في عيادة طبّ وعلوم الأعصاب.', 'الخدمة: استشارة', 'الطبيب: د. هيفاء العبرية', 'اليوم: الأحد 1 نوفمبر', 'الوقت: الفترة المسائية', 'الاسم: أحمد'];
const AT = (f: number, sent: number) => ({x: 540, y: kf(f, [[0, 1330], [sent, 1330], [sent + 20, 1400]])});

export const Booking: React.FC = () => {
  const f = useCurrentFrame();
  const taps = ev('booking', 'tap'); // [30, 75, 120, 165, 210]
  const sent = taps[4] + 8;
  const stage = taps.slice(0, 4).filter((t) => f >= t + 1).length;
  const st = STATES[stage];
  const keys = [{f: 0, x: 300, y: 720}];
  taps.forEach((t, i) => {
    keys.push({f: t - 6, ...TARGETS[i]});
    keys.push({f: t + 6, ...TARGETS[i]});
  });
  const zooms = [{f: 0, z: 1.6}];
  taps.forEach((t, i) => {
    zooms.push({f: t - 12, z: 2.15 + (i === 4 ? 0.1 : 0)});
    zooms.push({f: t + 8, z: 2.15});
    if (i < 4) zooms.push({f: t + 22, z: 1.85});
  });
  zooms.push({f: sent + 20, z: 1.45});
  const shot = chaseShot({f, keys, taps, zooms, follow: 0.15, showFrom: 8, showTo: sent + 6});
  const at = AT(f, sent);
  const w = whip(f, LEN, 8, 8);
  const punch = taps.reduce((a, t) => a + hit(f, t, 8) * 0.035, 0);
  // where a page point lands on the frame for the camera at frame g (used to launch the chips)
  const onScreen = (g: number, p: Pt) => {
    const s = chaseShot({f: g, keys, taps, zooms, follow: 0.15});
    const fr = framing(s.focus, s.zoom, STATES[Math.min(4, taps.slice(0, 4).filter((t) => g >= t + 1).length)].h);
    const a = AT(g, sent);
    return {x: a.x + (p.x - fr.fx) * s.zoom, y: a.y + (p.y - fr.scrollY - fr.fy) * s.zoom};
  };
  return (
    <AbsoluteFill>
      <BlurX id="bx-book" amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          <PhoneCam src={st.src} pageH={st.h} {...shot} zoom={shot.zoom * (1 + punch)} screenAt={at} />
          {taps.map((t, i) => (f >= t && f < t + 22 ? <TapBurst key={i} f={f - t} p={onScreen(t, TARGETS[i])} /> : null))}
        </AbsoluteFill>
      </BlurX>
      <TopFade o={1} to={720} />
      <StepTitle f={f} taps={taps} sent={sent} />
      <Kinetic words={[{t: 'رسالتك', at: sent + 2}, {t: 'جاهزة', at: sent + 8}]} sub={{t: 'على واتساب، والاستقبال يؤكد موعدك', at: sent + 14}} out={LEN - 10} />
      <Summary f={f} taps={taps} sent={sent} from={(i) => onScreen(taps[i], TARGETS[i])} />
      <Bubble f={f - sent - 4} />
    </AbsoluteFill>
  );
};

// Big caption naming the step being done, swapping on every tap.
const StepTitle: React.FC<{f: number; taps: number[]; sent: number}> = ({f, taps, sent}) => {
  if (f >= sent) return null;
  const segs = [{from: 0, to: 14, n: 0, t: 'احجز موعدك'}, ...ACTIONS.map((t, i) => ({from: i === 0 ? 16 : taps[i - 1] + 3, to: i < 4 ? taps[i] + 2 : sent, n: i + 1, t}))];
  const s = segs.find((x) => f >= x.from && f <= x.to);
  if (!s) return null;
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
};

// Holographic burst where the finger taps: two rings and a flash.
const TapBurst: React.FC<{f: number; p: Pt}> = ({f, p}) => (
  <>
    {[0, 5].map((d) => {
      const g = f - d;
      if (g < 0) return null;
      return <div key={d} style={{position: 'absolute', left: p.x - 70, top: p.y - 70, width: 140, height: 140, borderRadius: 70, border: `${4 - g * 0.15}px solid ${C.purpleLight}`, transform: `scale(${1 + g * 0.18})`, opacity: Math.max(0, 1 - g / 16), boxShadow: `0 0 24px ${C.purpleLight}`}} />;
    })}
    <div style={{position: 'absolute', left: p.x - 50, top: p.y - 50, width: 100, height: 100, borderRadius: 50, background: 'radial-gradient(circle, rgba(255,255,255,.95), rgba(169,139,255,0) 70%)', opacity: Math.max(0, 1 - f / 8)}} />
  </>
);

// The summary bar: empty slots that fill as each choice flies up and docks.
const Summary: React.FC<{f: number; taps: number[]; sent: number; from: (i: number) => Pt}> = ({f, taps, sent, from}) => {
  const show = easeOut(clamp((f - 10) / 10, 0, 1));
  const pour = easeInOut(clamp((f - sent - 2) / 14, 0, 1)); // after sending, everything flows into the message
  if (show <= 0 || pour >= 1) return null;
  return (
    <>
      {SLOTS.map((s, i) => {
        const docked = i < 4 ? f >= taps[i] + 16 : f >= taps[4];
        const label = i < 4 ? VALUES[i] : 'واتساب ✓';
        const fly = i < 4 && f >= taps[i] + 1 && f < taps[i] + 16;
        const lockPop = docked ? hit(f, i < 4 ? taps[i] + 16 : taps[4], 10) : 0;
        const pos = {x: lerp(s.x, 540, pour), y: lerp(s.y, 960, pour)};
        return (
          <React.Fragment key={i}>
            <div
              dir="rtl"
              style={{
                position: 'absolute',
                left: pos.x - s.w / 2,
                top: pos.y - 34,
                width: s.w,
                height: 68,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: show * (1 - pour),
                transform: `scale(${(1 + lockPop * 0.12) * (1 - pour * 0.4)})`,
                fontFamily: AR,
                fontSize: 30,
                fontWeight: docked ? 600 : 400,
                color: docked ? '#fff' : '#9A9AA2',
                background: docked ? 'linear-gradient(135deg,#8A4DFF,#5A21D9)' : 'rgba(255,255,255,.7)',
                border: docked ? '2px solid rgba(255,255,255,.6)' : '2px dashed #C9C9D2',
                boxShadow: docked ? `0 10px 26px rgba(90,33,217,.35), 0 0 ${lockPop * 40}px rgba(169,139,255,.9)` : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {docked ? label : ['الخدمة', 'الطبيب', 'اليوم', 'الوقت', 'الإرسال'][i]}
            </div>
            {fly && <FlyingChip f={f - taps[i] - 1} from={from(i)} to={s} label={label} />}
          </React.Fragment>
        );
      })}
    </>
  );
};

// A choice lifting off the screen and arcing up into its slot, leaving a short light trail.
const FlyingChip: React.FC<{f: number; from: Pt; to: {x: number; y: number; w: number}; label: string}> = ({f, from, to, label}) => {
  const pos = (g: number) => {
    const t = easeInOut(clamp(g / 15, 0, 1));
    const cx = (from.x + to.x) / 2 + (from.x > to.x ? 120 : -120);
    const cy = Math.min(from.y, to.y) - 160;
    const u = 1 - t;
    return {x: u * u * from.x + 2 * u * t * cx + t * t * to.x, y: u * u * from.y + 2 * u * t * cy + t * t * to.y, t};
  };
  const p = pos(f);
  return (
    <>
      {[3, 2, 1].map((d) => {
        const q = pos(f - d);
        return <div key={d} style={{position: 'absolute', left: q.x - 30, top: q.y - 30, width: 60, height: 60, borderRadius: 30, background: C.purpleLight, opacity: 0.25 / d, filter: 'blur(10px)'}} />;
      })}
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: p.x - to.w / 2,
          top: p.y - 34,
          width: to.w,
          height: 68,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: AR,
          fontSize: 30,
          fontWeight: 600,
          color: '#fff',
          background: 'linear-gradient(135deg,rgba(138,77,255,.92),rgba(90,33,217,.92))',
          border: '2px solid rgba(255,255,255,.7)',
          boxShadow: '0 20px 40px rgba(90,33,217,.45), 0 0 30px rgba(169,139,255,.8)',
          transform: `scale(${lerp(1.35, 1, p.t)}) rotate(${(1 - p.t) * -6}deg)`,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </>
  );
};

// The message the site prepares, materialising behind a scan line (sample name, no phone number).
const Bubble: React.FC<{f: number}> = ({f}) => {
  if (f < 0 || f > 46) return null;
  const reveal = easeInOut(clamp(f / 12, 0, 1));
  const o = 1 - clamp((f - 36) / 8, 0, 1);
  return (
    <div style={{position: 'absolute', left: 100, right: 100, top: 780, opacity: o, transform: `translateY(${-clamp((f - 36) / 8, 0, 1) * 120}px) rotate(-2deg)`}}>
      <div dir="rtl" style={{position: 'relative', background: '#DCF8C6', borderRadius: '36px 36px 8px 36px', padding: '30px 36px', fontFamily: AR, color: '#111', boxShadow: '0 30px 70px rgba(29,29,31,.3)', clipPath: `inset(0 0 ${(1 - reveal) * 100}% 0 round 36px)`}}>
        {MSG.map((l, i) => (
          <div key={i} style={{fontSize: i === 0 ? 34 : 38, fontWeight: i === 0 ? 500 : 400, marginBottom: i === 0 ? 12 : 4}}>
            {l}
          </div>
        ))}
        <div style={{fontFamily: EN, fontSize: 26, color: f > 16 ? '#34B7F1' : '#8E8E93', textAlign: 'left'}}>✓✓</div>
      </div>
      {reveal < 1 && <div style={{position: 'absolute', left: -20, right: -20, top: `${reveal * 100}%`, height: 4, background: '#fff', boxShadow: `0 0 26px 6px ${C.purpleLight}`}} />}
    </div>
  );
};
