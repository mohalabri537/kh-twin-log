import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, pathAt} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {BigWord, BlurX, ev, Kinetic, kf, tapState, TopFade, whip} from '../lib/kit';
import {EegSweep, InfoChip, PortraitCard} from '../lib/breakouts';
import {C, EN} from '../theme';

// 4–12 s. Quick tour, one page per bar (4 beats): doctors, EEG, first visit, articles.
// Each page has its own moment breaking out of the screen; pop sounds are in timeline.json.
const LEN = 60;

type Page = {big: string; title: string[]; sub: string; render: (f: number) => React.ReactNode; extra?: (f: number) => React.ReactNode};

// the phone leans one way on even pages and the other way on odd ones
const phone = (f: number, i: number, src: string, pageH: number, focusY: [number, number][], header = true) => (
  <PhoneCam
    src={src}
    pageH={pageH}
    header={header}
    focus={{x: 195, y: kf(f, focusY)}}
    zoom={kf(f, [[0, 1.55], [LEN, 1.8]])}
    screenAt={{x: 540, y: 1300}}
    rx={4}
    ry={kf(f, [[0, i % 2 ? 9 : -9], [LEN, i % 2 ? 3 : -3]])}
  />
);

const pop = (type: string, page: number) => ev('tour', type).filter((t) => t >= page * LEN && t < (page + 1) * LEN).map((t) => t - page * LEN);

const PAGES: Page[] = [
  {
    big: 'أطباؤنا',
    title: ['أطباء', 'استشاريون'],
    sub: 'في طب الأعصاب',
    render: (f) => phone(f, 0, 'doctors.jpg', 4765, [[6, 422], [46, 720]]),
    extra: (f) => {
      const [a, b] = pop('pop', 0);
      return (
        <>
          <PortraitCard f={f} at={a} src="img/haifa-800.webp" name="د. هيفاء العبرية" role="استشارية أولى · البورد الأمريكي" side={1} y={760} />
          <PortraitCard f={f} at={b} src="img/said-800.webp" name="د. سعيد المعولي" role="استشاري · زمالة ملبورن" side={-1} y={1080} />
        </>
      );
    },
  },
  {
    big: 'الدماغ',
    title: ['تخطيط', 'الدماغ'],
    sub: 'فحص آمن وغير مؤلم',
    render: (f) => phone(f, 1, `eegscene/${String(Math.round(kf(f, [[4, 0], [50, 39]]))).padStart(3, '0')}.jpg`, 844, [[0, 422]], false),
    extra: (f) => <EegSweep f={f} from={pop('zap', 1)[0]} to={pop('zap', 1)[0] + 26} y={1240} />,
  },
  {
    big: 'زيارتك',
    title: ['زيارتك', 'الأولى'],
    sub: 'السعر والمدة وما تُحضره',
    render: (f) => phone(f, 2, 'visit.jpg', 4391, [[6, 422], [42, 830]]),
    extra: (f) => {
      const [a, b] = pop('pop', 2);
      return (
        <>
          <InfoChip f={f} at={a} big="30 ر.ع." small="الاستشارة" x={40} y={860} rot={-6} />
          <InfoChip f={f} at={b} big="30 دقيقة" small="مدة الاستشارة تقريبًا" x={520} y={1220} rot={5} />
        </>
      );
    },
  },
  {big: 'مقالات', title: ['مقالات', 'طبية'], sub: 'بالعربية، على الجوال والكمبيوتر', render: (f) => <Laptop f={f} />},
];

const PageShot: React.FC<{p: Page; i: number}> = ({p, i}) => {
  const f = useCurrentFrame();
  const w = whip(f, LEN, 8, 8);
  return (
    <AbsoluteFill>
      <BigWord t={p.big} f={f} len={LEN} />
      <BlurX id={`bx-tour-${i}`} amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          {p.render(f)}
          {p.extra?.(f)}
        </AbsoluteFill>
      </BlurX>
      <TopFade o={1} to={560} />
      <Kinetic words={p.title.map((t, k) => ({t, at: 2 + k * 4}))} sub={{t: p.sub, at: 12}} out={50} />
    </AbsoluteFill>
  );
};

export const Tour: React.FC = () => (
  <AbsoluteFill>
    {PAGES.map((p, i) => (
      <Sequence key={i} from={i * LEN} durationInFrames={LEN}>
        <PageShot p={p} i={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

// Articles on a computer: the mouse glides to the EEG article and opens it (click on the beat).
const PW = 1440, PH = 900, BAR = 64;
const Laptop: React.FC<{f: number}> = ({f}) => {
  const click = ev('tour', 'click')[0] - 3 * LEN; // this page starts at 3 bars in
  const z = kf(f, [[0, 0.7], [LEN, 0.74]]);
  const p = pathAt([{f: 4, x: 1250, y: 260}, {f: click - 4, x: 720, y: 690}], f);
  const {press, ripple} = tapState(f, [click]);
  const swap = clamp((f - click - 2) / 6, 0, 1);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(540px, 1240px) perspective(3000px) rotateX(8deg) rotateY(-8deg) scale(${z}) translate(${-PW / 2}px, ${-(PH + BAR) / 2}px)`}}>
      <div style={{position: 'absolute', left: -20, top: -20, width: PW + 40, height: PH + BAR + 40, borderRadius: 40, background: '#1c1b22', boxShadow: '0 60px 120px -30px rgba(29,29,31,.4)'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: BAR, background: '#ECECEF', borderRadius: '22px 22px 0 0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
        ))}
        <div style={{marginLeft: 380, width: 560, height: 38, borderRadius: 12, background: '#fff', fontFamily: EN, fontSize: 20, color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          neurouniverse.om{swap > 0.5 ? '/ar/articles/what-is-an-eeg' : '/ar/articles'}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: BAR, width: PW, height: PH, overflow: 'hidden', borderRadius: '0 0 22px 22px', background: '#fff'}}>
        <Img src={staticFile('cap/desk-articles.jpg')} style={{position: 'absolute', width: PW, height: PH, opacity: 1 - swap}} />
        <Img src={staticFile('cap/desk-article.jpg')} style={{position: 'absolute', width: PW, height: PH, opacity: swap}} />
      </div>
      <div style={{position: 'absolute', left: -140, top: PH + BAR + 20, width: PW + 280, height: 46, borderRadius: '0 0 40px 40px', background: 'linear-gradient(#d9d9df,#9a9aa3)'}} />
      <div style={{position: 'absolute', left: p.x, top: p.y + BAR, transform: `scale(${(1 / z) * 1.2 * (1 - press * 0.15)})`, transformOrigin: '0 0'}}>
        {ripple >= 0 && <div style={{position: 'absolute', left: -50, top: -50, width: 100, height: 100, borderRadius: 50, border: `5px solid ${C.purple}`, transform: `scale(${1 + ripple * 0.14})`, opacity: 1 - ripple / 20}} />}
        <svg width="56" height="78" viewBox="0 0 28 39" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.35))'}}>
          <path d="M2 2 L2 30 L9 23 L14 35 L19 33 L14 21 L24 21 Z" fill="#111" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};
