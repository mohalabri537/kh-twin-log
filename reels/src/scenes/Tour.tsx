import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeOut, easeOutBack, pathAt} from '../lib/chase';
import {framing, PhoneCam} from '../lib/PhoneCam';
import {Caption, ev, kf, PHONE, sway, swipeFinger, tapState} from '../lib/kit';
import {AR, C} from '../theme';

const idx = (n: number) => String(Math.round(n)).padStart(3, '0');

// A phone that scrolls a captured page; `focusY` is the page point kept mid-screen (scroll = focusY - 422).
const ScrollPhone: React.FC<{src: string; pageH: number; focusY: number; f: number; swipes?: [number, number][]; headerSrc?: string; header?: boolean; opacity?: number; children?: React.ReactNode}> = ({
  src,
  pageH,
  focusY,
  f,
  swipes = [],
  headerSrc,
  header,
  opacity = 1,
  children,
}) => {
  const {scrollY} = framing({x: 195, y: focusY}, PHONE.zoom, pageH);
  const finger = swipeFinger(f, swipes, scrollY);
  return (
    <AbsoluteFill style={{opacity}}>
      <PhoneCam src={src} pageH={pageH} focus={{x: 195, y: focusY}} {...PHONE} {...sway(f)} pointer={finger.p} headerSrc={headerSrc} header={header}>
        {children}
      </PhoneCam>
    </AbsoluteFill>
  );
};

// 1. The launch: phone rises, the logo on the homepage opens slowly.
export const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const rise = easeOut(clamp(f / 40, 0, 1));
  const frame = kf(f, [[30, 0], [140, 47]]);
  const finger = swipeFinger(f, [[30, 140]], 0);
  return (
    <AbsoluteFill style={{transform: `translateY(${(1 - rise) * 1300}px)`}}>
      <PhoneCam src={`hero/${idx(frame)}.jpg`} pageH={844} header={false} focus={{x: 195, y: 422}} {...PHONE} {...sway(f)} pointer={finger.p} />
      <AbsoluteFill style={{transform: `translateY(${-(1 - rise) * 1300}px)`}}>
        <Caption at={12} out={135} title="أطلقنا موقعنا الجديد" sub="neurouniverse.om" subLtr />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// 2. Homepage: intro and doctors, then clinic photos and reviews.
export const Home: React.FC = () => {
  const f = useCurrentFrame();
  const a = kf(f, [[0, 422], [25, 422], [75, 860]]);
  const b = kf(f, [[0, 3516], [165, 3516], [215, 4476]]);
  const mix = clamp((f - 112) / 16, 0, 1);
  return (
    <AbsoluteFill>
      {mix < 1 && <ScrollPhone src="home.jpg" pageH={5200} focusY={a} f={f} swipes={[[25, 75]]} headerSrc="services.jpg" />}
      {mix > 0 && <ScrollPhone src="home.jpg" pageH={5200} focusY={b} f={f} swipes={[[165, 215]]} headerSrc="services.jpg" opacity={mix} />}
      <Caption at={5} out={112} title="كل ما تحتاجه عن العيادة" sub="في مكان واحد" />
      <Caption at={126} out={226} title="صور العيادة والتقييمات" sub="تقييم 5.0 على Google" />
    </AbsoluteFill>
  );
};

// 3. Doctors page.
export const Doctors: React.FC = () => {
  const f = useCurrentFrame();
  const y = kf(f, [[0, 422], [20, 422], [60, 700], [110, 700], [160, 2600]]);
  return (
    <AbsoluteFill>
      <ScrollPhone src="doctors.jpg" pageH={4765} focusY={y} f={f} swipes={[[20, 60], [110, 160]]} />
      <Caption at={5} out={196} title="تعرّف على أطبائنا" sub="استشاريون في طب الأعصاب" />
    </AbsoluteFill>
  );
};

// 4. Services page.
export const Services: React.FC = () => {
  const f = useCurrentFrame();
  const y = kf(f, [[0, 422], [25, 422], [70, 900], [100, 900], [145, 1700]]);
  return (
    <AbsoluteFill>
      <ScrollPhone src="services.jpg" pageH={3121} focusY={y} f={f} swipes={[[25, 70], [100, 145]]} />
      <Caption at={5} out={166} title="خدماتنا" sub="استشارات الأعصاب وتخطيط كهربائية الدماغ" />
    </AbsoluteFill>
  );
};

// 5. EEG: the brainwave drawing itself on the homepage, then how to prepare.
export const Eeg: React.FC = () => {
  const f = useCurrentFrame();
  const mix = clamp((f - 95) / 16, 0, 1);
  const finger = swipeFinger(f, [[5, 95]], 0);
  return (
    <AbsoluteFill>
      {mix < 1 && (
        <PhoneCam src={`eegscene/${idx(kf(f, [[5, 0], [95, 39]]))}.jpg`} pageH={844} header={false} focus={{x: 195, y: 422}} {...PHONE} {...sway(f)} pointer={finger.p} />
      )}
      {mix > 0 && <ScrollPhone src="eeg.jpg" pageH={5344} focusY={kf(f, [[0, 2702], [110, 2702], [170, 3052]])} f={f} swipes={[[110, 170]]} opacity={mix} />}
      <Caption at={5} out={95} title="تخطيط كهربائية الدماغ" sub="فحص آمن وغير مؤلم" />
      <Caption at={110} out={196} title="وكيف تستعد للفحص" sub="خطوة بخطوة" />
    </AbsoluteFill>
  );
};

// 6. First visit: price, duration and what to bring (ticked off one by one).
const ITEMS = [2168, 2208, 2247, 2287];
export const Visit: React.FC = () => {
  const f = useCurrentFrame();
  const ticks = ev('visit', 'tick');
  const y = kf(f, [[0, 422], [15, 422], [50, 830], [90, 830], [130, 2490]]);
  return (
    <AbsoluteFill>
      <ScrollPhone src="visit.jpg" pageH={4391} focusY={y} f={f} swipes={[[15, 50], [90, 130]]}>
        {ITEMS.map((iy, i) =>
          f >= ticks[i] ? (
            <div
              key={i}
              style={{position: 'absolute', left: 350, top: iy - 12, width: 24, height: 24, borderRadius: 12, background: C.purple, color: '#fff', fontSize: 15, lineHeight: '24px', textAlign: 'center', transform: `scale(${easeOutBack(clamp((f - ticks[i]) / 8, 0, 1))})`}}
            >
              ✓
            </div>
          ) : null,
        )}
      </ScrollPhone>
      <Caption at={5} out={166} title="زيارتك الأولى" sub="السعر والمدة وما تُحضره معك" />
    </AbsoluteFill>
  );
};

// 7. Booking: service → doctor → day → time → WhatsApp, at a relaxed pace.
const STATES = [
  {src: 'book-start.jpg', h: 2551},
  {src: 'book-svc.jpg', h: 2966},
  {src: 'book-doc.jpg', h: 3407},
  {src: 'book-date.jpg', h: 4589},
  {src: 'book-time.jpg', h: 4589},
];
const MSG = ['السلام عليكم، أودّ حجز موعد في عيادة طبّ وعلوم الأعصاب.', 'الخدمة: استشارة', 'الطبيب: د. هيفاء العبرية', 'اليوم: الأحد 1 نوفمبر', 'الوقت: الفترة المسائية', 'الاسم: أحمد'];
export const Booking: React.FC = () => {
  const f = useCurrentFrame();
  const taps = ev('booking', 'tap'); // 4 choices + send
  const stage = taps.slice(0, 4).filter((t) => f >= t + 2).length;
  const st = STATES[stage];
  const y = kf(f, [[0, 422], [50, 422], [75, 815], [95, 815], [120, 1225], [140, 1225], [165, 1671], [185, 1671], [225, 2572]]);
  const pointer = pathAt(
    [
      {f: 0, x: 300, y: 720},
      {f: taps[0] - 6, x: 195, y: 458},
      {f: taps[0] + 10, x: 195, y: 458},
      {f: taps[1] - 6, x: 195, y: 873},
      {f: taps[1] + 10, x: 195, y: 873},
      {f: taps[2] - 6, x: 317, y: 1283},
      {f: taps[2] + 10, x: 317, y: 1283},
      {f: taps[3] - 6, x: 195, y: 1729},
      {f: taps[3] + 10, x: 195, y: 1729},
      {f: taps[4] - 6, x: 298, y: 2630},
    ],
    f,
  );
  const {press, ripple} = tapState(f, taps);
  const sent = f - taps[4] - 8;
  return (
    <AbsoluteFill>
      <PhoneCam src={st.src} pageH={st.h} focus={{x: 195, y: y}} {...PHONE} {...sway(f)} pointer={f >= 14 && f < taps[4] + 20 ? pointer : null} press={press} ripple={ripple} />
      <Caption at={5} out={taps[4] + 4} title="احجز موعدك بسهولة" sub="اختر الخدمة والطبيب واليوم والوقت" />
      <Caption at={taps[4] + 24} out={292} title="رسالة جاهزة على واتساب" sub="ويؤكد فريق الاستقبال موعدك" />
      {sent >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: 110,
            right: 110,
            top: 820,
            opacity: clamp(sent / 12, 0, 1) * (1 - clamp((sent - 50) / 10, 0, 1)),
            transform: `translateY(${(1 - easeOut(clamp(sent / 16, 0, 1))) * 120}px)`,
          }}
        >
          <div dir="rtl" style={{background: '#DCF8C6', borderRadius: '36px 36px 8px 36px', padding: '30px 36px', fontFamily: AR, color: '#111', boxShadow: '0 30px 70px rgba(29,29,31,.25)'}}>
            {MSG.map((l, i) => (
              <div key={i} style={{fontSize: i === 0 ? 34 : 36, fontWeight: i === 0 ? 500 : 400, marginBottom: i === 0 ? 12 : 4}}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
