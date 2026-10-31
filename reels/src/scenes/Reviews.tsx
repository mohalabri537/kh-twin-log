import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, easeOutBack, hit, lerp} from '../lib/chase';
import {BlurX, ev, Kinetic, whip} from '../lib/kit';
import {AR, C, EN} from '../theme';

// 19–23 s. Social proof: the Google rating counts up to 5.0, the stars fill on the beat, and real
// reviews from the site fly past the camera in 3D.
const LEN = 120;

// quoted from the reviews shown on the site's homepage
const QUOTES = [
  {t: '“Expert care. Dr. Haifa A abri is brilliant, compassionate, and truly listens.”', x: -110, ry: 18},
  {t: '“Professional and friendly. Appreciate the staff and how they all welcome me.”', x: 110, ry: -18},
  {t: '“Excellent doctor and service”', x: -40, ry: 10},
];

export const Reviews: React.FC = () => {
  const f = useCurrentFrame();
  const stars = ev('reviews', 'star');
  const flybys = ev('reviews', 'flyby');
  const w = whip(f, LEN, 8, 8);
  const count = easeOut(clamp((f - 6) / 24, 0, 1)) * 5;
  return (
    <AbsoluteFill>
      <BlurX id="bx-reviews" amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          {/* the rating */}
          <div style={{position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 200, fontSize: 340, lineHeight: 1, letterSpacing: -8, color: C.ink, transform: `scale(${1 + hit(f, 30, 12) * 0.06})`}}>
            {count.toFixed(1)}
          </div>
          <div style={{position: 'absolute', top: 1010, width: '100%', display: 'flex', justifyContent: 'center', gap: 22}}>
            {stars.map((s, i) => {
              const t = easeOutBack(clamp((f - s) / 8, 0, 1));
              return (
                <svg key={i} width={96} height={96} viewBox="0 0 20 20" style={{transform: `scale(${0.6 + t * 0.4}) rotate(${(1 - t) * -40}deg)`, filter: f >= s ? `drop-shadow(0 0 ${8 + hit(f, s, 10) * 20}px rgba(116,49,244,.6))` : 'none'}}>
                  <path d="m10 1.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 15l-5.2 2.8 1-5.9L1.5 7.8l5.9-.8z" fill={f >= s ? C.purple : '#DCDCE3'} />
                </svg>
              );
            })}
          </div>
          <div dir="rtl" style={{position: 'absolute', top: 1140, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 300, fontSize: 50, color: C.purple, opacity: clamp((f - stars[4] - 2) / 8, 0, 1)}}>
            على Google · من 26 تقييمًا
          </div>
          {/* reviews flying through space toward the camera */}
          <div style={{position: 'absolute', left: 540, top: 1000, perspective: 1400, transformStyle: 'preserve-3d'}}>
            {QUOTES.map((q, i) => (
              <QuoteCard key={i} f={f - flybys[i]} q={q} />
            ))}
          </div>
        </AbsoluteFill>
      </BlurX>
      <Kinetic words={[{t: 'تقييم', at: 2}, {t: 'المراجعين', at: 8}]} out={LEN - 12} />
    </AbsoluteFill>
  );
};

const QuoteCard: React.FC<{f: number; q: (typeof QUOTES)[number]}> = ({f, q}) => {
  if (f < 0 || f > 40) return null;
  const t = easeInOut(clamp(f / 40, 0, 1));
  const z = lerp(-2200, 900, t);
  const o = clamp(f / 6, 0, 1) * (1 - clamp((f - 30) / 10, 0, 1));
  return (
    <div
      dir="ltr"
      style={{
        position: 'absolute',
        left: -310,
        top: -150,
        width: 620,
        opacity: o,
        transform: `translate3d(${q.x * t}px, ${lerp(120, -260, t)}px, ${z}px) rotateY(${q.ry * (1 - t)}deg)`,
        background: 'rgba(255,255,255,.88)',
        border: '2px solid rgba(255,255,255,.95)',
        borderRadius: 34,
        padding: '30px 36px',
        boxShadow: '0 30px 70px rgba(29,29,31,.22), 0 0 40px rgba(116,49,244,.18)',
        fontFamily: EN,
        filter: `blur(${clamp((z - 300) / 80, 0, 10)}px)`,
      }}
    >
      <div style={{color: C.purple, fontSize: 34, letterSpacing: 4}}>★★★★★</div>
      <div style={{fontSize: 38, lineHeight: 1.35, color: C.ink, marginTop: 8}}>{q.t}</div>
      <div style={{fontSize: 26, color: '#8E8E93', marginTop: 12}}>Google review</div>
    </div>
  );
};
