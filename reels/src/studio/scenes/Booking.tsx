import React from 'react';
import {AbsoluteFill} from 'remotion';
import meta from '../../../public/cap/meta.json';
import {AR} from '../../theme';
import {Phone} from '../devices';
import {clamp, GREY, Heading, INK, inOut, lerp, Line, M, outQuint, prog, useF, VIOLET} from '../ui';

// 20–24 s. Booking: the real form on the phone, one choice at a time; beside it, the choices set as a quiet list.
// Captured by scripts/capture-booking.js: a paediatric consultation with Dr. Wafaa on her first date, evening.
type Step = {file: string; h: number; tap: {x: number; y: number}};
const BOOK = (meta as unknown as {book: Step[]}).book; // start, svc, doc, date, time: each shows the next choice to make
const ROWS = [
  {label: 'الخدمة', value: 'استشارة أعصاب الأطفال'},
  {label: 'الطبيب', value: 'د. وفاء بني عرابة'},
  {label: 'اليوم', value: 'الثلاثاء 3 نوفمبر'},
  {label: 'الوقت', value: 'الفترة المسائية'},
];
const PICK = [20, 40, 60, 80]; // frames: a choice on each beat
const K = 0.98, CX = M + 210, TOP = 640;

export const Booking: React.FC = () => {
  const f = useF();
  const rise = outQuint(prog(f, 0, 30));
  // which capture is showing, and where the page is scrolled: to each choice before it is made
  const scrollTo = (i: number) => clamp(BOOK[i].tap.y - 360, 0, BOOK[i].h - 844);
  let scroll = scrollTo(0);
  PICK.forEach((p, i) => {
    if (i < 3) scroll = lerp(scroll, scrollTo(i + 1), inOut(prog(f, p + 4, 14)));
  });
  const layers = PICK.map((p, i) => ({src: BOOK[i + 1].file, o: inOut(prog(f, p, 6)), scrollY: scroll}));
  return (
    <AbsoluteFill>
      <Heading f={f} at={2} n="04" label="الحجز" title="احجز موعدك" sub="بخطوات بسيطة" />
      <Phone src={BOOK[0].file} k={K} cx={CX} top={lerp(700, TOP, rise)} scrollY={scroll} o={Math.min(1, rise * 1.4)} layers={layers}>
        {PICK.map((p, i) => <Ring key={i} f={f - p} at={BOOK[i].tap} />)}
      </Phone>
      {/* the choices, set as a list */}
      <div dir="rtl" style={{position: 'absolute', top: 720, right: M, width: 470}}>
        {ROWS.map((r, i) => (
          <div key={i} style={{borderTop: '1px solid rgba(29,29,31,.14)', padding: '20px 0 22px', opacity: lerp(0.35, 1, outQuint(prog(f, PICK[i], 14)))}}>
            <div style={{fontFamily: AR, fontWeight: 400, fontSize: 28, color: GREY}}>{r.label}</div>
            <div style={{height: 58}}>
              <Line f={f} at={PICK[i] + 2}>
                <div style={{fontFamily: AR, fontWeight: 400, fontSize: 40, color: INK, whiteSpace: 'nowrap'}}>{r.value}</div>
              </Line>
            </div>
          </div>
        ))}
        <div style={{borderTop: '1px solid rgba(29,29,31,.14)', paddingTop: 26}}>
          <Line f={f} at={98}>
            <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: AR, fontWeight: 300, fontSize: 34, color: INK}}>
              <span style={{width: 14, height: 14, borderRadius: 7, background: '#25D366'}} />
              يُرسل عبر واتساب، ويؤكده الاستقبال
            </div>
          </Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// A quiet ring where a choice is made (page coordinates).
const Ring: React.FC<{f: number; at: {x: number; y: number}}> = ({f, at}) => {
  if (f < 0 || f > 22) return null;
  const t = outQuint(f / 22);
  return <div style={{position: 'absolute', left: at.x - 22, top: at.y - 22, width: 44, height: 44, borderRadius: 22, border: `2px solid ${VIOLET}`, transform: `scale(${0.6 + t * 1.2})`, opacity: 1 - t}} />;
};
