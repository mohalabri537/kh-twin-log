import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Phone} from '../studio/devices';
import {EN_THIN as EN} from '../theme';
import {Chip, clamp, GREY, Ico, INK, io, Mark, out, p, Page, RING, Row, Slam as SlamAR, spr, VIO} from './Story';

// The longer English cut of the Story reel (38 s, 30 fps): the same look and score as the Arabic one, with a British
// voice-over, the English site on the phones, two more stops (a condition page and the brain games) and word-by-word
// captions along the bottom. Every cue is a frame where a word is spoken (English take B: video frame = 30 t + 6).
// Audio: public/audio/story/mix-en.mp3, built by `audio/story_mix.sh en`.
// Everything that matters stays inside the Reels safe area: y 260–1440, x 60–960 (the app's header, caption and
// buttons cover the rest).
export const STORY_EN_FRAMES = 1140;

const Slam: React.FC<React.ComponentProps<typeof SlamAR>> = (props) => <SlamAR font={EN} {...props} />;
const Line: React.FC<{y: number; children: React.ReactNode}> = ({y, children}) => <Row y={y} dir="ltr">{children}</Row>;

// ---------------------------------------------------------------- captions: the spoken line, each word lighting as it is said
type W = [string, number];
const CAPS: {from: number; to: number; w: W[]}[] = [
  {from: 6, to: 74, w: [['Every', 6], ['day,', 14], ['a', 35], ['new', 39], ['question.', 47]]},
  {from: 81, to: 107, w: [['Headaches?', 81]]},
  {from: 107, to: 135, w: [['Numbness?', 107]]},
  {from: 135, to: 172, w: [['Forgetfulness?', 135]]},
  {from: 176, to: 226, w: [['Looking', 176], ['for', 181], ['a', 188], ['clear', 194], ['answer?', 201]]},
  {from: 230, to: 264, w: [["We've", 230], ['got', 241], ['you.', 247]]},
  {from: 267, to: 306, w: [['Neuro', 267], ['Universe', 281], ['Clinic', 296]]},
  {from: 307, to: 372, w: [['has', 308], ['a', 320], ['brand-new', 325], ['website,', 342]]},
  {from: 373, to: 424, w: [['A', 375], ['clear', 378], ['symptom', 389], ['guide,', 401]]},
  {from: 425, to: 457, w: [['and', 427], ['when', 437], ['to', 446], ['call', 452]]},
  {from: 458, to: 496, w: [['the', 458], ['emergency', 464], ['number.', 478]]},
  {from: 500, to: 539, w: [['Conditions', 503], ['explained', 516]]},
  {from: 540, to: 594, w: [['in', 541], ['plain', 557], ['language.', 568]]},
  {from: 598, to: 640, w: [['Brain', 600], ['games', 605], ['to', 617], ['test', 631]]},
  {from: 641, to: 690, w: [['your', 641], ['memory', 646], ['and', 656], ['focus.', 665]]},
  {from: 694, to: 730, w: [['Meet', 696], ['our', 701], ['doctors,', 707]]},
  {from: 732, to: 768, w: [['consultants', 734], ['for', 747], ['adults', 759]]},
  {from: 769, to: 806, w: [['and', 771], ['children.', 783]]},
  {from: 807, to: 842, w: [['Then', 809], ['book', 817], ['your', 826], ['appointment', 831]]},
  {from: 843, to: 899, w: [['in', 843], ['a', 847], ['few', 858], ['simple', 865], ['steps', 877]]},
  {from: 900, to: 926, w: [['on', 900], ['WhatsApp.', 904]]},
  {from: 928, to: 968, w: [['Whatever', 930], ['your', 937], ['question,', 945]]},
  {from: 969, to: 1014, w: [["we're", 971], ['here', 979], ['to', 983], ['guide', 990], ['you.', 999]]},
];
const Captions: React.FC<{f: number}> = ({f}) => {
  const c = CAPS.find((x) => f >= x.from && f <= x.to);
  if (!c) return null;
    const k = out(p(f, c.from, 5)) * (1 - io(p(f, c.to - 3, 4)));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 1352, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 16}px)`}}>
      <div style={{maxWidth: 940, padding: '18px 34px', borderRadius: 30, background: 'rgba(255,255,255,.82)', boxShadow: '0 16px 36px -18px rgba(60,20,140,.45), inset 0 0 0 1.5px rgba(124,80,255,.14)', backdropFilter: 'blur(10px)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14}}>
        {c.w.map(([w, at], i) => {
          const next = c.w[i + 1]?.[1] ?? c.to;
          const on = f >= at, now = on && f < next;
          const pop = now ? 1 + 0.08 * Math.exp(-(f - at) / 3) : 1;
          return <span key={i} style={{fontFamily: EN, fontWeight: 400, fontSize: 48, lineHeight: 1.2, color: now ? VIO : INK, opacity: on ? 1 : 0.28, display: 'inline-block', transform: `scale(${pop})`}}>{w}</span>;
        })}
      </div>
    </div>
  );
};

// the whole frame kicks on every cut, and shakes on the counter's stamps
const CUTS = [6, 35, 81, 107, 135, 176, 230, 247, 281, 372, 389, 461, 469, 476, 484, 498, 503, 594, 600, 690, 734, 759, 783, 803, 817, 902, 925, 971, 1019, 1050];
const SHAKES = [461, 469, 476, 484];
const kick = (f: number) => { const c = CUTS.filter((x) => x <= f).pop(); return c === undefined ? 0 : Math.exp(-(f - c) / 4) * 0.045; };
const shake = (f: number) => {
  const c = SHAKES.filter((x) => x <= f).pop();
  if (c === undefined || f - c > 8) return [0, 0];
  const a = Math.exp(-(f - c) / 2.5) * 14;
  return [Math.sin((f - c) * 2.7) * a, Math.cos((f - c) * 3.1) * a];
};

// ---------------------------------------------------------------- 0–2.4 s "Every day, a new question."
const Hook: React.FC<{f: number}> = ({f}) => (f > 78 ? null : (
  <>
    <Line y={780}><Slam f={f} at={6} leave={72} size={124}>Every</Slam><Slam f={f} at={14} leave={72} size={124}>day,</Slam></Line>
    <Line y={940}><Slam f={f} at={35} leave={72} size={124}>a new</Slam><Slam f={f} at={47} leave={72} size={124} color={VIO}>question.</Slam></Line>
    <Chip f={f} at={36} n="cloud" x={190} y={690} rot={-12} leave={72} />
    <Chip f={f} at={48} n="bolt" x={840} y={1190} size={84} rot={10} leave={72} />
  </>
));

// ---------------------------------------------------------------- 2.5–5.6 s the three symptoms, full-frame on their words
const SYMPTOMS: [number, number, string, string][] = [[81, 107, 'Headaches?', 'head'], [107, 135, 'Numbness?', 'hand'], [135, 170, 'Forgetfulness?', 'cloud']];
const Symptoms: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {SYMPTOMS.map(([at, end, word, icon], i) => {
        if (f < at || f > end + 6) return null;
        const k = spring({frame: f - at, fps, config: {damping: 13, stiffness: 240, mass: 0.6}});
        const l = io(p(f, end - 2, 7));
        const dir = i % 2 ? 1 : -1;
        const size = Math.min(160, 860 / (word.length * 0.64)); // fits inside the 960 px safe width
        return (
          <AbsoluteFill key={i} style={{transform: `translateX(${l * dir * -900}px)`, opacity: 1 - l * 0.6}}>
            <div style={{position: 'absolute', left: 240, top: 600, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,80,255,.22), rgba(124,80,255,0) 68%)', transform: `scale(${0.4 + 0.6 * k})`}} />
            <div style={{position: 'absolute', left: 455, top: 640, width: 170, height: 170, borderRadius: 52, background: 'rgba(255,255,255,.9)', boxShadow: '0 24px 44px -18px rgba(90,40,200,.45), inset 0 0 0 1.5px rgba(124,80,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${k}) rotate(${(1 - k) * dir * 30}deg)`}}>
              <Ico n={icon} size={100} />
            </div>
            <div style={{position: 'absolute', top: 880, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 200, fontSize: size, letterSpacing: -size * 0.03, color: i === 1 ? VIO : INK, lineHeight: 1.2, transform: `scale(${1.4 - 0.4 * k})`, opacity: clamp(k * 3)}}>{word}</div>
            <div style={{position: 'absolute', top: 1180, width: '100%', display: 'flex', justifyContent: 'center', gap: 18}}>
              {[0, 1, 2].map((j) => <div key={j} style={{width: 18, height: 18, borderRadius: 9, background: j === i ? VIO : 'rgba(124,80,255,.22)'}} />)}
            </div>
          </AbsoluteFill>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- 5.7–7.5 s the ring of screens and doctors, "Looking for a clear answer?"
const Ring: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 168 || f > 242) return null;
  const burst = out(p(f, 222, 14));
  return (
    <>
      {RING.map((src, i) => {
        const k = spr(f, 170 + i * 2, fps, {damping: 14, stiffness: 140, mass: 0.7});
        const a = (i / RING.length) * Math.PI * 2 + (f - 170) / 40 - Math.PI / 2;
        const r = 340 * k * (1 + burst * 1.6);
        const x = 540 + Math.cos(a) * r * 0.92, y = 900 + Math.sin(a) * r * 1.25;
        const doc = src.startsWith('img/');
        const w = doc ? 190 : 210, h = doc ? 190 : 250;
        return (
          <div key={i} style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 28, overflow: 'hidden', opacity: clamp(k * 2) * (1 - burst), transform: `scale(${k * (1 + burst * 0.4)}) rotate(${Math.sin(a) * 8 + burst * 30}deg)`,
            background: doc ? 'radial-gradient(circle at 50% 40%, #EADFFF, #C7B2FF)' : '#fff', boxShadow: '0 20px 40px -18px rgba(90,40,200,.4), inset 0 0 0 1.5px rgba(124,80,255,.12)'}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: doc ? '50% 15%' : 'top'}} />
          </div>
        );
      })}
      <Line y={830}><Slam f={f} at={176} leave={220} size={78}>Looking</Slam><Slam f={f} at={181} leave={220} size={78}>for</Slam></Line>
      <Line y={930}><Slam f={f} at={188} leave={220} size={78}>a clear</Slam><Slam f={f} at={201} leave={220} size={78} color={VIO}>answer?</Slam></Line>
    </>
  );
};

// ---------------------------------------------------------------- 7.4–9.4 s violet floods in on the score's lift: "We've got you."
const Flood: React.FC<{f: number}> = ({f}) => {
  if (f < 220 || f > 290) return null;
  const grow = io(p(f, 220, 12));
  const drain = io(p(f, 258, 14));
  const r = 40 + grow * 1300 - drain * 1300;
  const ring = f >= 272;
  const away = out(p(f, 279, 8));
  return (
    <>
      {!ring ? (
        <div style={{position: 'absolute', left: 540 - r, top: 860 - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 50% 40%, #8A55FF, ${VIO} 55%, #5A21D9)`}} />
      ) : (
        <div style={{position: 'absolute', left: 500, top: 820, width: 80, height: 80, borderRadius: 40, border: `14px solid ${VIO}`, transform: `scale(${1 + away * 3})`, opacity: 1 - away}} />
      )}
      {f < 264 && (
        <div style={{position: 'absolute', top: 760, width: '100%', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', opacity: 1 - io(p(f, 256, 6))}}>
          <Slam f={f} at={230} size={124} weight={200} color="#fff">We've</Slam><Slam f={f} at={241} size={124} weight={200} color="#fff">got</Slam><Slam f={f} at={247} size={124} weight={200} color="#fff">you.</Slam>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------- 8.9–12.4 s "Neuro Universe Clinic has a brand-new website"
const Brand: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 264 || f > 374) return null;
  const grow = spring({frame: f - 281, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  const up = io(p(f, 306, 14));
  const leave = io(p(f, 362, 10));
  const url = 'neurouniverse.om';
  const typed = Math.min(url.length, Math.max(0, Math.floor((f - 330) / 1.2)));
  return (
    <AbsoluteFill style={{opacity: 1 - leave, transform: `translateY(${-leave * 140}px)`}}>
      {f >= 281 && <div style={{position: 'absolute', left: 540, top: 860 - up * 240, transform: `translate(-50%,-50%) scale(${grow * (1 - up * 0.35)})`}}><Mark size={360} /></div>}
      <div style={{position: 'absolute', top: 1040 - up * 260, left: 40, right: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'center'}}>
        <Slam f={f} at={267} size={92} weight={300}>Neuro</Slam><Slam f={f} at={281} size={92} weight={300}>Universe</Slam><Slam f={f} at={296} size={92} weight={300} color={VIO}>Clinic</Slam>
      </div>
      {f >= 308 && (
        <>
          <Line y={1040}><Slam f={f} at={308} size={62} weight={300} color={GREY}>has a</Slam><Slam f={f} at={325} size={62} weight={300} color={VIO}>brand-new</Slam><Slam f={f} at={342} size={62} weight={300} color={GREY}>website</Slam></Line>
          <div style={{position: 'absolute', left: 210, top: 1170, width: 660, height: 104, borderRadius: 52, background: 'rgba(255,255,255,.92)', boxShadow: '0 20px 40px -18px rgba(90,40,200,.45), inset 0 0 0 1.5px rgba(124,80,255,.18)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 36px', transform: `scale(${spr(f, 326, fps)})`}}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={VIO} strokeWidth="2.2" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            <span style={{fontFamily: EN, fontWeight: 300, fontSize: 46, color: INK}}>{url.slice(0, typed)}<span style={{display: 'inline-block', width: 4, height: 46, marginLeft: 4, background: VIO, verticalAlign: 'middle', opacity: Math.floor(f / 8) % 2 ? 1 : 0}} /></span>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 12.4–30.8 s five stops on a flat phone, each cut in on its spoken title
type Use = {from: number; to: number; rec: string; head: [string, number, string?][]; sub: [string, number, string?][]; chips: [string, number, number, number][]};
const USES: Use[] = [
  {from: 372, to: 500, rec: 'phone-guide-en.mp4', head: [['A clear', 378], ['symptom guide', 389, VIO]], sub: [['and when', 427], ['to call', 446], ['the emergency number', 458, '#D70015']], chips: [['heart', 200, 1000, 394], ['wave', 860, 1150, 406], ['head', 200, 1260, 416]]},
  {from: 496, to: 598, rec: 'phone-condition-en.mp4', head: [['Conditions', 503], ['explained', 516, VIO]], sub: [['in plain', 541], ['language', 568, VIO]], chips: [['head', 860, 960, 520], ['check', 200, 1240, 570]]},
  {from: 594, to: 694, rec: 'phone-games-en.mp4', head: [['Brain', 600], ['games', 605, VIO]], sub: [['to test your', 617], ['memory', 646], ['and', 656], ['focus', 665, VIO]], chips: [['bolt', 200, 960, 632]]},
  {from: 690, to: 807, rec: 'phone-doctors-en.mp4', head: [['Meet our', 696], ['doctors', 707, VIO]], sub: [['Consultants for', 734], ['adults', 759], ['and children', 771, VIO]], chips: [['star', 860, 900, 712]]},
  {from: 803, to: 928, rec: 'phone-book-en.mp4', head: [['Book your', 817], ['appointment', 831, VIO]], sub: [['in a few', 843], ['simple', 865], ['steps', 877]], chips: [['cal', 200, 960, 838], ['check', 200, 1260, 880]]},
];
const UseScene: React.FC<{f: number; u: Use}> = ({f, u}) => {
  const {fps} = useVideoConfig();
  if (f < u.from || f > u.to + 2) return null;
  const rise = spring({frame: f - u.from, fps, config: {damping: 16, stiffness: 150, mass: 0.8}});
  const leave = io(p(f, u.to - 8, 9));
  return (
    <AbsoluteFill style={{transform: `translateY(${-leave * 1500}px)`, filter: leave > 0.02 ? `blur(${leave * 14}px)` : undefined}}>
      {/* the title (one or two lines) with the spoken line flowing under it */}
      <div style={{position: 'absolute', top: 268, left: 90, right: 90, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', lineHeight: 1}}>{u.head.map(([w, at, c], i) => <Slam key={i} f={f} at={at} size={70} weight={300} color={c ?? INK}>{w}</Slam>)}</div>
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', marginTop: -4}}>{u.sub.map(([w, at, c], i) => <Slam key={i} f={f} at={at} size={44} weight={300} color={c ?? GREY}>{w}</Slam>)}</div>
      </div>
      <Sequence from={u.from} durationInFrames={u.to - u.from + 4} layout="none">
        <AbsoluteFill style={{transform: `translateY(${(1 - rise) * 1300}px) rotate(${(1 - rise) * 5}deg)`}}>
          <Phone src={u.rec} k={0.9} cx={540} top={548} lift={10} />
        </AbsoluteFill>
      </Sequence>
      {u.chips.map(([n, x, y, at], i) => <Chip key={i} f={f} at={at} n={n} x={x} y={y} rot={i % 2 ? 10 : -10} />)}
    </AbsoluteFill>
  );
};

// the emergency number stamps up on "emergency" (a beat of the score), then one nine per half-beat
const NINES = [461, 469, 476, 484];
const Counter: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 461 || f > 500) return null;
  const n = NINES.filter((x) => x <= f).length;
  const k = spring({frame: f - NINES[n - 1], fps, config: {damping: 10, stiffness: 300, mass: 0.5}});
  const first = spring({frame: f - 461, fps, config: {damping: 12, stiffness: 220, mass: 0.6}});
  const leave = io(p(f, 492, 9));
  return (
    <div style={{position: 'absolute', left: 70, top: 760 - leave * 1500, transform: `rotate(${-6 + first * 2}deg) scale(${first * (1.25 - 0.25 * k)})`, transformOrigin: '0 50%'}}>
      <div style={{padding: '22px 40px', borderRadius: 999, background: '#D70015', color: '#fff', fontFamily: EN, fontWeight: 300, fontSize: 92, letterSpacing: 2, boxShadow: '0 22px 40px -14px rgba(215,0,21,.55)', display: 'flex', alignItems: 'center', gap: 18}}>
        <Ico n="phone" size={70} color="#fff" />{'9'.repeat(n)}
      </div>
    </div>
  );
};

// the three games pop round the phone on "memory and focus"
const GAMES: [string, string, number, number, number][] = [['Memory', 'head', 646, 620, 860], ['Reaction', 'bolt', 656, 80, 1060], ['Focus', 'star', 665, 640, 1230]];
const Games: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 646 || f > 694) return null;
  const leave = io(p(f, 686, 9));
  return (
    <>
      {GAMES.map(([t, n, at, x, y], i) => {
        if (f < at) return null;
        const k = spring({frame: f - at, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y - leave * 1500, padding: '18px 32px', borderRadius: 999, background: i === 2 ? VIO : '#fff', color: i === 2 ? '#fff' : INK, fontFamily: EN, fontWeight: 400, fontSize: 48, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 20px 38px -14px rgba(90,40,200,.5), inset 0 0 0 1.5px rgba(124,80,255,.16)', transform: `scale(${k}) rotate(${(1 - k) * (i % 2 ? 14 : -14) + (i % 2 ? 4 : -4)}deg)`}}>
            <Ico n={n} size={46} color={i === 2 ? '#fff' : VIO} />{t}
          </div>
        );
      })}
    </>
  );
};

// the doctors pop in, one on each of "consultants", "adults", "children"
const DOCS: [string, number, number, number][] = [['img/haifa-cut.webp', 734, 200, 900], ['img/said-cut.webp', 759, 830, 1080], ['img/wafaa-cut.webp', 783, 200, 1240]];
const Doctors: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 734 || f > 808) return null;
  const leave = io(p(f, 799, 9));
  return (
    <>
      {DOCS.map(([src, at, x, y], i) => {
        if (f < at) return null;
        const k = spring({frame: f - at, fps, config: {damping: 11, stiffness: 220, mass: 0.6}});
        const bob = Math.sin((f - at) / 12) * 8;
        return (
          <div key={i} style={{position: 'absolute', left: x - 100, top: y - 100 + bob - leave * 1500, width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #EADFFF, #B79BFF)', border: '8px solid #fff', boxShadow: '0 24px 44px -18px rgba(90,40,200,.5)', transform: `scale(${k}) rotate(${(1 - k) * (i % 2 ? 20 : -20)}deg)`}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%'}} />
          </div>
        );
      })}
    </>
  );
};

// "on WhatsApp": a green sticker slaps on, then "Done ✓"
const Whats: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 902 || f > 930) return null;
  const a = spring({frame: f - 902, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
  const b = spring({frame: f - 912, fps, config: {damping: 10, stiffness: 260, mass: 0.55}});
  const leave = io(p(f, 920, 9));
  const pill = (txt: string, k: number, x: number, y: number, rot: number) => (
    <div style={{position: 'absolute', left: x, top: y - leave * 1500, padding: '20px 38px', borderRadius: 999, background: '#25D366', color: '#fff', fontFamily: EN, fontWeight: 400, fontSize: 56, boxShadow: '0 20px 38px -12px rgba(37,211,102,.55)', transform: `scale(${k}) rotate(${rot * (1 - k) + rot * 0.3}deg)`, opacity: clamp(k * 3)}}>{txt}</div>
  );
  return (
    <>
      {pill('WhatsApp', a, 560, 880, 14)}
      {f >= 912 && pill('Done ✓', b, 90, 1180, -12)}
    </>
  );
};

// ---------------------------------------------------------------- 30.8–33.8 s "Whatever your question, we're here to guide you."
const Guide: React.FC<{f: number}> = ({f}) => (f < 925 || f > 1018 ? null : (
  <>
    <Line y={760}><Slam f={f} at={930} leave={1010} size={104} weight={300}>Whatever</Slam><Slam f={f} at={937} leave={1010} size={104} weight={300}>your</Slam><Slam f={f} at={945} leave={1010} size={104} weight={300} color={VIO}>question,</Slam></Line>
    <Line y={1020}><Slam f={f} at={971} leave={1010} size={104} weight={300}>we're here</Slam><Slam f={f} at={983} leave={1010} size={104} weight={300}>to</Slam><Slam f={f} at={990} leave={1010} size={104} weight={300} color={VIO}>guide you.</Slam></Line>
    <Chip f={f} at={946} n="heart" x={190} y={620} size={100} rot={-10} leave={1010} />
    <Chip f={f} at={992} n="check" x={850} y={1260} size={100} rot={10} leave={1010} />
    <Chip f={f} at={975} n="star" x={850} y={620} size={80} rot={8} leave={1010} />
  </>
));

// ---------------------------------------------------------------- 33.8–38 s typed with the voice, the mark on the score's final hit
const Cta: React.FC<{f: number}> = ({f}) => {
  const {fps} = useVideoConfig();
  if (f < 1012) return null;
  // typed word by word as it is spoken
  const parts: [string, number][] = [['Book ', 1019], ['your ', 1025], ['appointment ', 1031], ['today.', 1042]];
  let text = '';
  for (const [w, at] of parts) text += w.slice(0, Math.max(0, Math.min(w.length, Math.floor((f - at) / 1.1) + 1)));
  const caret = Math.floor(f / 8) % 2 === 0;
  const lift = io(p(f, 1048, 14));
  const mark = spring({frame: f - 1050, fps, config: {damping: 11, stiffness: 170, mass: 0.7}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 60, right: 60, top: 800 - lift * 260, textAlign: 'center', fontFamily: EN, fontWeight: 300, fontSize: 112 - lift * 28, lineHeight: 1.15, letterSpacing: -2, color: VIO}}>
        {f >= 1019 ? text : ''}<span style={{display: 'inline-block', width: 8, height: 110 - lift * 28, marginLeft: 8, background: VIO, verticalAlign: 'middle', opacity: caret && lift < 0.5 ? 1 : 0}} />
      </div>
      {f >= 1050 && (
        <>
          <div style={{position: 'absolute', left: 540, top: 1000, transform: `translate(-50%,-50%) scale(${mark})`}}><Mark size={260} /></div>
          <div style={{position: 'absolute', top: 1150, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 300, fontSize: 54, color: INK, opacity: out(p(f, 1060, 10)), transform: `translateY(${(1 - out(p(f, 1060, 10))) * 24}px)`}}>neurouniverse.om</div>
          <div style={{position: 'absolute', top: 1236, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 300, fontSize: 40, color: GREY, opacity: out(p(f, 1068, 10))}}>Neuro Universe Clinic · Muscat · Link in bio</div>
        </>
      )}
    </AbsoluteFill>
  );
};

const SFX: [number, string, number][] = [
  [6, 'tap', 0.18], [81, 'blip', 0.22], [107, 'blip', 0.22], [135, 'blip', 0.22], [168, 'whoosh', 0.2], [218, 'whip', 0.25], [230, 'bloom', 0.25],
  [264, 'zip', 0.15], [281, 'spark', 0.25], [330, 'scan', 0.12], [368, 'whoosh', 0.22], [461, 'tap', 0.3], [469, 'tap', 0.3], [476, 'tap', 0.3], [484, 'lock', 0.3],
  [492, 'whip', 0.22], [590, 'whip', 0.22], [646, 'blip', 0.18], [656, 'blip', 0.18], [665, 'star', 0.2], [686, 'whip', 0.22],
  [734, 'blip', 0.18], [759, 'blip', 0.18], [783, 'blip', 0.18], [799, 'whip', 0.22], [902, 'ding', 0.25], [912, 'star', 0.2], [920, 'whoosh', 0.18], [1050, 'bloom', 0.3],
];

export const StoryEN: React.FC = () => {
  const f = useCurrentFrame();
  const glow = interpolate(f, [0, 12, 360, 380, 920, 940, 1046, 1140], [0.35, 0.7, 0.7, 0.35, 0.35, 0.85, 0.85, 1], {extrapolateRight: 'clamp'});
  const [sx, sy] = shake(f);
  return (
    <AbsoluteFill>
      <Page glow={glow} />
      <AbsoluteFill style={{transform: `translate(${sx}px, ${sy}px) scale(${1 + kick(f)})`}}>
        <Hook f={f} />
        <Symptoms f={f} />
        <Ring f={f} />
        <Flood f={f} />
        <Brand f={f} />
        {USES.map((u, i) => <UseScene key={i} f={f} u={u} />)}
        <Counter f={f} />
        <Games f={f} />
        <Doctors f={f} />
        <Whats f={f} />
        <Guide f={f} />
        <Cta f={f} />
      </AbsoluteFill>
      <Captions f={f} />
      <Audio src={staticFile('audio/story/mix-en.mp3')} />
      {SFX.map(([at, n, v], i) => (
        <Sequence key={i} from={at}><Audio src={staticFile(`audio/eleven/sfx-${n}.mp3`)} volume={v} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
