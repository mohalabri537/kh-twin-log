import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {evolvePath} from '@remotion/paths';
import {clamp, easeInOut, easeOut, easeOutBack, pathAt} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {Caption, ev, kf, PHONE, sway, tapState} from '../lib/kit';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, C, EN} from '../theme';

// 8. Articles on a computer: the mouse glides to the EEG article and opens it.
const PW = 1440, PH = 900, BAR = 64;
export const Articles: React.FC = () => {
  const f = useCurrentFrame();
  const click = ev('articles', 'click')[0];
  const z = kf(f, [[0, 0.66], [180, 0.7]]);
  const p = pathAt([{f: 0, x: 1250, y: 240}, {f: click - 18, x: 720, y: 690}], f);
  const {press, ripple} = tapState(f, [click]);
  const opened = f >= click + 3;
  const inv = 1 / z;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: '0 0', transform: `translate(540px, 1260px) perspective(3000px) rotateX(8deg) rotateY(-6deg) scale(${z}) translate(${-PW / 2}px, ${-(PH + BAR) / 2}px)`}}>
        <div style={{position: 'absolute', left: -20, top: -20, width: PW + 40, height: PH + BAR + 40, borderRadius: 40, background: '#1c1b22', boxShadow: '0 60px 120px -30px rgba(29,29,31,.4), 0 0 0 3px #2b2833'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: BAR, background: '#ECECEF', borderRadius: '22px 22px 0 0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
          ))}
          <div style={{marginLeft: 380, width: 560, height: 38, borderRadius: 12, background: '#fff', fontFamily: EN, fontSize: 20, color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            neurouniverse.om{opened ? '/ar/articles/what-is-an-eeg' : '/ar/articles'}
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, top: BAR, width: PW, height: PH, overflow: 'hidden', borderRadius: '0 0 22px 22px', background: '#fff'}}>
          <Img src={staticFile('cap/desk-articles.jpg')} style={{position: 'absolute', width: PW, height: PH, opacity: 1 - clamp((f - click - 3) / 12, 0, 1)}} />
          <Img src={staticFile('cap/desk-article.jpg')} style={{position: 'absolute', width: PW, height: PH, opacity: clamp((f - click - 3) / 12, 0, 1)}} />
        </div>
        <div style={{position: 'absolute', left: -140, top: PH + BAR + 20, width: PW + 280, height: 46, borderRadius: '0 0 40px 40px', background: 'linear-gradient(#d9d9df,#9a9aa3)'}} />
        <div style={{position: 'absolute', left: p.x, top: p.y + BAR, transform: `scale(${inv * 1.2 * (1 - press * 0.15)})`, transformOrigin: '0 0'}}>
          {ripple >= 0 && <div style={{position: 'absolute', left: -50, top: -50, width: 100, height: 100, borderRadius: 50, border: `5px solid ${C.purple}`, transform: `scale(${1 + ripple * 0.1})`, opacity: 1 - ripple / 24}} />}
          <svg width="56" height="78" viewBox="0 0 28 39" style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.35))'}}>
            <path d="M2 2 L2 30 L9 23 L14 35 L19 33 L14 21 L24 21 Z" fill="#111" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <Caption at={5} out={166} title="مقالات طبية موثوقة" sub="بالعربية، على الجوال والكمبيوتر" />
    </AbsoluteFill>
  );
};

// 9. Arabic → English → dark mode, from the header buttons.
export const Language: React.FC = () => {
  const f = useCurrentFrame();
  const [t1, t2] = ev('language', 'tap');
  const en = clamp((f - t1 - 2) / 10, 0, 1);
  const dark = clamp((f - t2 - 2) / 10, 0, 1);
  // English button in the Arabic header, then the theme button in the English header
  const p = pathAt([{f: 0, x: 260, y: 560}, {f: t1 - 8, x: 120, y: 30}, {f: t1 + 14, x: 120, y: 30}, {f: t2 - 8, x: 227, y: 30}], f);
  const {press, ripple} = tapState(f, [t1, t2]);
  const layer = (src: string, o: number, pointer: boolean) => (
    <AbsoluteFill style={{opacity: o}}>
      <PhoneCam src={src} pageH={844} header={false} focus={{x: 195, y: 422}} {...PHONE} {...sway(f)} pointer={pointer && f > 10 && f < t2 + 26 ? p : null} press={press} ripple={ripple} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {layer('top-ar.jpg', 1, en === 0)}
      {en > 0 && layer('top-en.jpg', en, dark === 0)}
      {dark > 0 && layer('top-en-dark.jpg', dark, true)}
      <Caption at={5} out={166} title="بالعربية والإنجليزية" sub="وبالمظهر الفاتح أو الداكن" />
    </AbsoluteFill>
  );
};

// 10. Calm ending: the logo draws in and fills, then name, website and the booking button.
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const draw = easeInOut(clamp((f - 5) / 45, 0, 1));
  const {strokeDasharray, strokeDashoffset} = evolvePath(draw, LOGO_D);
  const fill = easeInOut(clamp((f - 38) / 24, 0, 1));
  const appear = (at: number) => ({opacity: easeOut(clamp((f - at) / 18, 0, 1)), transform: `translateY(${(1 - easeOut(clamp((f - at) / 18, 0, 1))) * 24}px)`});
  const btn = easeOutBack(clamp((f - 100) / 16, 0, 1));
  return (
    <AbsoluteFill>
      <svg viewBox={LOGO_VB} width={560} height={560 / 1.58187} style={{position: 'absolute', left: 260, top: 360, overflow: 'visible', transform: `scale(${0.96 + fill * 0.04})`}}>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.mark1} />
            <stop offset="1" stopColor={C.mark2} />
          </linearGradient>
        </defs>
        <path d={LOGO_D} fill="url(#lg)" opacity={fill} />
        <path d={LOGO_D} fill="none" stroke={C.purple} strokeWidth={0.01} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} opacity={1 - fill} />
      </svg>
      <div dir="rtl" style={{position: 'absolute', top: 800, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 500, fontSize: 84, color: C.ink, ...appear(55)}}>
        طبّ وعلوم الأعصاب
      </div>
      <div style={{position: 'absolute', top: 925, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 400, fontSize: 40, color: '#55555C', letterSpacing: 1, ...appear(62)}}>
        Neuro Universe Clinic
      </div>
      <div style={{position: 'absolute', top: 1070, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 600, fontSize: 76, color: C.purple, ...appear(78)}}>neurouniverse.om</div>
      <div style={{position: 'absolute', top: 1240, width: '100%', display: 'flex', justifyContent: 'center', opacity: clamp((f - 100) / 8, 0, 1)}}>
        <div dir="rtl" style={{transform: `scale(${btn})`, background: C.ink, color: '#fff', fontFamily: AR, fontWeight: 500, fontSize: 70, padding: '24px 90px', borderRadius: 999, boxShadow: '0 20px 50px rgba(29,29,31,.25)'}}>
          احجز الآن
        </div>
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 1450, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 400, fontSize: 44, color: '#55555C', lineHeight: 1.6, ...appear(115)}}>
        مبنى قبس، شارع الموج، مسقط
        <br />
        <span dir="ltr" style={{fontFamily: EN}}>24 553389</span>
      </div>
    </AbsoluteFill>
  );
};
