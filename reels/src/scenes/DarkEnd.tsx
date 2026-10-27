import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, easeOutBack, hit, pathAt} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {BlurX, DarkBg, ev, Kinetic, LightBg, tapState, TopFade, whip} from '../lib/kit';
import {LOGO_D, LOGO_VB} from '../logoPath';
import {AR, C, EN} from '../theme';

// 22–26 s. Arabic → English → dark mode. Tapping the theme button turns the whole reel dark.
const FLIP_AT = {x: 540, y: 700};
export const Dark: React.FC = () => {
  const f = useCurrentFrame();
  const [t1, t2] = ev('dark', 'tap');
  const en = clamp((f - t1 - 1) / 4, 0, 1);
  const dk = clamp((f - t2 - 1) / 4, 0, 1);
  const r = easeInOut(clamp((f - t2) / 14, 0, 1)) * 2300;
  const isDark = f >= t2 + 4;
  const p = pathAt([{f: 0, x: 260, y: 520}, {f: t1 - 6, x: 120, y: 30}, {f: t1 + 8, x: 120, y: 30}, {f: t2 - 6, x: 227, y: 30}], f);
  const {press, ripple} = tapState(f, [t1, t2]);
  const w = whip(f, 120, 8, 0);
  const layer = (src: string, o: number) => (
    <AbsoluteFill style={{opacity: o}}>
      <PhoneCam src={src} pageH={844} header={false} focus={{x: 195, y: 300}} zoom={2.0} screenAt={{x: 540, y: 1400}} rx={3} ry={-4} pointer={f > 8 && f < t2 + 20 ? p : null} press={press} ripple={ripple} />
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `circle(${r}px at ${FLIP_AT.x}px ${FLIP_AT.y}px)`}}>
        <DarkBg />
      </AbsoluteFill>
      <BlurX id="bx-dark" amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          {layer('top-ar.jpg', 1)}
          {en > 0 && layer('top-en.jpg', en)}
          {dk > 0 && layer('top-en-dark.jpg', dk)}
        </AbsoluteFill>
      </BlurX>
      <TopFade o={isDark ? 0 : 1} to={600} />
      <TopFade o={isDark ? 1 : 0} dark to={600} />
      <Kinetic words={[{t: 'بالعربية', at: 4}, {t: 'والإنجليزية', at: 10}]} sub={{t: 'العربية · English', at: t1 + 2}} out={t2 - 2} />
      <Kinetic words={[{t: 'وبالوضع', at: t2 + 4}, {t: 'الداكن', at: t2 + 9}]} sub={{t: 'بلمسة واحدة', at: t2 + 16}} out={112} dark />
    </AbsoluteFill>
  );
};

// 26–31 s. The light comes back with the logo, then name, website and «احجز الآن» (tapped on the beat),
// with a slow push-in and «الرابط في البايو» since links in a Reel aren't clickable.
export const End: React.FC = () => {
  const f = useCurrentFrame();
  const tap = ev('end', 'tap')[0];
  const btnAt = ev('end', 'pop')[0];
  const bio = ev('end', 'pop')[1];
  const r = easeInOut(clamp(f / 14, 0, 1)) * 2300;
  const logo = easeOutBack(clamp((f - 2) / 16, 0, 1));
  const glow = hit(f, 0, 24);
  const appear = (at: number) => {
    const t = easeOut(clamp((f - at) / 12, 0, 1));
    return {opacity: t, transform: `translateY(${(1 - t) * 30}px)`};
  };
  const btn = easeOutBack(clamp((f - btnAt) / 12, 0, 1));
  const shine = clamp((f - (tap + 10)) / 18, 0, 1);
  const {press, ripple} = tapState(f, [tap]);
  const fp = easeOut(clamp((f - (tap - 16)) / 13, 0, 1));
  return (
    <AbsoluteFill>
      {f < 16 && <DarkBg />}
      <AbsoluteFill style={{clipPath: f < 16 ? `circle(${r}px at 540px 760px)` : undefined}}>
        <LightBg />
      </AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${1 + f * 0.0005})`}}>
      <svg
        viewBox={LOGO_VB}
        width={620}
        height={620 / 1.58187}
        style={{position: 'absolute', left: 230, top: 560 - 310 / 1.58187, overflow: 'visible', transform: `scale(${0.5 + logo * 0.5})`, filter: `drop-shadow(0 20px ${30 + glow * 50}px rgba(116,49,244,${0.25 + glow * 0.45}))`}}
      >
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.mark1} />
            <stop offset="1" stopColor={C.mark2} />
          </linearGradient>
        </defs>
        <path d={LOGO_D} fill="url(#lg)" opacity={clamp((f - 2) / 5, 0, 1)} />
      </svg>
      <div dir="rtl" style={{position: 'absolute', top: 830, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 700, fontSize: 96, color: C.ink, ...appear(22)}}>
        طبّ وعلوم الأعصاب
      </div>
      <div style={{position: 'absolute', top: 970, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 400, fontSize: 40, color: '#55555C', letterSpacing: 2, ...appear(28)}}>
        NEURO UNIVERSE CLINIC
      </div>
      <div style={{position: 'absolute', top: 1090, width: '100%', textAlign: 'center', fontFamily: EN, fontWeight: 300, fontSize: 84, color: C.purple, ...appear(36)}}>neurouniverse.om</div>
      {f >= btnAt && (
        <div style={{position: 'absolute', top: 1290, width: '100%', display: 'flex', justifyContent: 'center'}}>
          <div dir="rtl" style={{transform: `scale(${btn * (1 - press * 0.08) * (1 + hit(f, tap, 12) * 0.06)})`, background: C.ink, color: '#fff', fontFamily: AR, fontWeight: 600, fontSize: 78, padding: '26px 100px', borderRadius: 999, boxShadow: `0 20px ${50 + hit(f, tap, 16) * 60}px rgba(116,49,244,${0.25 + hit(f, tap, 16) * 0.4})`, position: 'relative', overflow: 'hidden'}}>
            احجز الآن
            {shine > 0 && shine < 1 && <div style={{position: 'absolute', top: -20, bottom: -20, width: 90, left: `${-20 + shine * 140}%`, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)', transform: 'skewX(-20deg)'}} />}
          </div>
        </div>
      )}
      {f >= tap - 16 && f < tap + 24 && (
        <div style={{position: 'absolute', left: 540 + (1 - fp) * 300, top: 1370 + (1 - fp) * 420, opacity: 1 - clamp((f - tap - 12) / 10, 0, 1)}}>
          {ripple >= 0 && <div style={{position: 'absolute', left: -60, top: -60, width: 120, height: 120, borderRadius: 60, border: `6px solid ${C.purple}`, transform: `scale(${1 + ripple * 0.15})`, opacity: 1 - ripple / 20}} />}
          <div style={{position: 'absolute', left: -44, top: -44, width: 88, height: 88, borderRadius: 44, background: 'radial-gradient(circle, rgba(255,255,255,.95), rgba(169,139,255,.6))', border: `4px solid ${C.purple}`, transform: `scale(${1 - press * 0.28})`, boxShadow: '0 8px 24px rgba(0,0,0,.25)'}} />
        </div>
      )}
      <div dir="rtl" style={{position: 'absolute', top: 1480, width: '100%', textAlign: 'center', fontFamily: AR, fontWeight: 400, fontSize: 46, color: '#55555C', ...appear(bio)}}>
        الرابط في البايو ↑
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
