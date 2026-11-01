import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {AR, EN} from '../../theme';
import {GREY, Heading, INK, inOut, Line, outExpo, outQuint, prog, useF} from '../ui';

// 5.3–10.7 s. The doctors, one at a time, as on the site: a cut-out portrait in front of the brand's soft light,
// the head rising above the frame. The light drifts slowly; each portrait settles, then gives way to the next.
const DOCS = [
  {k: 'haifa', name: 'د. هيفاء العبرية', title: 'استشارية أولى في طب الأعصاب'},
  {k: 'said', name: 'د. سعيد المعولي', title: 'استشاري طب الأعصاب'},
  {k: 'wafaa', name: 'د. وفاء بني عرابة', title: 'استشارية طب أعصاب الأطفال'},
];
const SPAN = 60; // frames per doctor: three beats
const BOX = 680; // the portrait square, frame px
const TOP = 610;

export const Doctors: React.FC = () => {
  const f = useF();
  return (
    <AbsoluteFill>
      <Heading f={f} at={2} n="01" label="الأطباء" title="فريقنا الطبي" sub="استشاريو طب الأعصاب للكبار والأطفال" />
      {DOCS.map((d, i) => (
        <Portrait key={d.k} d={d} i={i} f={f - i * SPAN} last={i === DOCS.length - 1} />
      ))}
    </AbsoluteFill>
  );
};

const Portrait: React.FC<{d: (typeof DOCS)[number]; i: number; f: number; last: boolean}> = ({d, i, f, last}) => {
  if (f < -4 || (!last && f > SPAN + 14)) return null;
  const enter = outQuint(prog(f, 0, 30));
  const leave = last ? 0 : inOut(prog(f, SPAN - 6, 18));
  const o = Math.min(1, enter * 1.5) * (1 - leave);
  // the frame slides in from the right and out to the left (the way Arabic reads), only a little
  const x = (1 - enter) * 70 - leave * 70;
  const rise = 1 - outExpo(prog(f, 4, 34)); // the doctor rises into place just after the frame
  const drift = (f + i * 40) / 60;
  const frameTop = BOX * 0.14;
  return (
    <div style={{position: 'absolute', left: 540 - BOX / 2 + x, top: TOP, width: BOX, height: BOX, opacity: o}}>
      {/* the frame: the lower 86% of the square, with the light drifting inside it */}
      <div style={{position: 'absolute', left: 0, right: 0, top: frameTop, bottom: 0, borderRadius: 34, overflow: 'hidden', background: '#FEFEFE', boxShadow: '0 50px 90px -40px rgba(29,29,31,.25), inset 0 0 0 1px rgba(29,29,31,.05)'}}>
        <Img src={staticFile('img/glow-light.webp')} style={{position: 'absolute', left: '-14%', top: '-14%', width: '128%', height: '128%', objectFit: 'cover',
          transform: `rotate(${Math.sin(drift) * 6}deg) scale(${1.04 + Math.sin(drift * 0.7) * 0.04}) translate(${Math.cos(drift) * 2}%, ${Math.sin(drift * 0.8) * 2}%)`}} />
      </div>
      {/* the doctor, clipped at the frame's sides and bottom but free above it */}
      <div style={{position: 'absolute', inset: 0, top: frameTop, clipPath: `inset(-${frameTop + 40}px 0 0 0 round 0 0 34px 34px)`}}>
        <Img src={staticFile(`img/${d.k}-cut.webp`)} style={{position: 'absolute', left: 0, bottom: 0, width: BOX, height: BOX, transform: `translateY(${rise * 40}px) scale(${1 + rise * 0.02})`, transformOrigin: '50% 100%', opacity: 1 - rise * 0.6}} />
      </div>
      {/* name and title, set beneath */}
      <div dir="rtl" style={{position: 'absolute', top: BOX + 52, left: -120, right: -120, textAlign: 'center'}}>
        <Line f={f} at={8}>
          <div style={{fontFamily: AR, fontWeight: 400, fontSize: 60, color: INK}}>{d.name}</div>
        </Line>
        <Line f={f} at={13}>
          <div style={{fontFamily: AR, fontWeight: 300, fontSize: 36, color: GREY, marginTop: 6}}>{d.title}</div>
        </Line>
        <div style={{fontFamily: EN, fontWeight: 400, fontSize: 24, letterSpacing: 3, color: 'rgba(29,29,31,.4)', marginTop: 26, opacity: outQuint(prog(f, 16, 20))}}>
          {`0${i + 1} / 03`}
        </div>
      </div>
    </div>
  );
};
