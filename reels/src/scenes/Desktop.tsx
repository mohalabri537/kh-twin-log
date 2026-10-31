import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, hit, lerp} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {BlurX, ev, Kinetic, whip} from '../lib/kit';
import {C, EN} from '../theme';
import {HERO_PHONE} from './NeuroHook';
import widths from '../../public/cap/resp/widths.json';

// 10–14 s. «على كل الشاشات»: the homepage on desktop, in a browser window that narrows while the
// real layout reflows (captured at 36 widths by scripts/capture-responsive.js) until it is the phone.

const LEN = 120;
const W0 = 1440, W1 = 390; // CSS px: desktop window -> phone
const H0 = 900, H1 = 844;
const SHOWN0 = 1040, SHOWN1 = 390 * HERO_PHONE.zoom; // window width on the frame, px
const CHROME = 58; // browser top bar, frame px

export const Desktop: React.FC = () => {
  const f = useCurrentFrame();
  const narrow = ev('desktop', 'scan')[0]; // the window starts narrowing
  const phone = ev('desktop', 'lock')[0]; // it is a phone
  const wp = whip(f, LEN, 8, 8);
  const t = easeInOut(clamp((f - narrow) / (phone - narrow), 0, 1));
  const w = lerp(W0, W1, t);
  const k = (W0 - w) / (W0 - W1);
  const shownW = lerp(SHOWN0, SHOWN1, k);
  const scale = shownW / w;
  const shownH = lerp(H0, H1, k) * scale;
  const cy = lerp(1130, HERO_PHONE.screenAt.y, k);
  const push = 1 + 0.03 * easeOut(clamp(f / narrow, 0, 1)) * (1 - t); // a slow push while it's a desktop
  const box = {l: 540 - shownW / 2, t: cy - shownH / 2, w: shownW, h: shownH};
  const toPhone = easeInOut(clamp((f - (phone - 2)) / 8, 0, 1)); // browser chrome gives way to the phone
  const chrome = CHROME * (1 - toPhone);
  const radius = lerp(14, 69, k);

  // the two captures either side of the current width, crossfaded
  const ws = widths as number[];
  let i = ws.findIndex((x) => x <= w);
  if (i <= 0) i = Math.max(i, 1);
  const a = ws[i - 1], b = ws[i];
  const mix = clamp((a - w) / (a - b), 0, 1);

  return (
    <AbsoluteFill>
      <BlurX id="bx-desktop" amount={wp.blur}>
        <AbsoluteFill style={{transform: `translateX(${wp.x}px) rotate(${wp.rot}deg) scale(${push})`, transformOrigin: '540px 1130px'}}>
          {/* the browser window */}
          <div style={{position: 'absolute', left: box.l, top: box.t - chrome, width: box.w, height: box.h + chrome, borderRadius: radius, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 2px rgba(29,29,31,.10), 0 90px 160px -40px rgba(90,40,200,.35), 0 40px 80px -20px rgba(29,29,31,.30)', opacity: 1 - clamp((f - phone - 6) / 4, 0, 1)}}>
            {chrome > 1 && (
              <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: chrome, background: '#F2F2F5', borderBottom: '1px solid rgba(29,29,31,.08)', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 12, opacity: 1 - toPhone}}>
                {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                  <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
                ))}
                <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                  <div style={{padding: '6px 26px', borderRadius: 999, background: '#fff', fontFamily: EN, fontSize: 24, color: '#55555C', boxShadow: '0 1px 2px rgba(0,0,0,.06)'}}>🔒 neurouniverse.om</div>
                </div>
              </div>
            )}
            <div style={{position: 'absolute', left: 0, top: chrome, width: box.w, height: box.h}}>
              <Img src={staticFile(`cap/resp/w${a}.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
              <Img src={staticFile(`cap/resp/w${b}.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: mix}} />
            </div>
          </div>
          {/* the window becomes the phone the booking demo runs on */}
          {toPhone > 0 && (
            <AbsoluteFill style={{opacity: toPhone}}>
              <PhoneCam {...HERO_PHONE} />
            </AbsoluteFill>
          )}
          <Width box={box} chrome={chrome} w={w} f={f} o={clamp(f / 10, 0, 1) * (1 - clamp((f - phone) / 8, 0, 1))} at={narrow} />
        </AbsoluteFill>
      </BlurX>
      <Kinetic words={[{t: 'على', at: 4}, {t: 'كل', at: 9}, {t: 'الشاشات', at: 14}]} sub={{t: 'من الكمبيوتر إلى الهاتف', at: 26}} out={LEN - 14} top={200} size={116} />
    </AbsoluteFill>
  );
};

// A drawing-style dimension line above the window, its label counting the width down.
const Width: React.FC<{box: {l: number; t: number; w: number; h: number}; chrome: number; w: number; f: number; o: number; at: number}> = ({box, chrome, w, f, o, at}) => {
  if (o <= 0) return null;
  const y = box.t - chrome - 44;
  const line = {position: 'absolute' as const, background: C.purple};
  const pulse = hit(f, at, 14);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: o}}>
      <div style={{...line, left: box.l, top: y, width: box.w, height: 2, opacity: 0.6}} />
      <div style={{...line, left: box.l, top: y - 12, width: 2, height: 26, opacity: 0.6}} />
      <div style={{...line, left: box.l + box.w - 2, top: y - 12, width: 2, height: 26, opacity: 0.6}} />
      <div style={{position: 'absolute', left: 540 - 90, top: y - 24, width: 180, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', fontFamily: EN, fontSize: 30, fontWeight: 600, letterSpacing: 1.5, color: C.purple, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + pulse * 0.08})`}}>
        {Math.round(w)} px
      </div>
    </div>
  );
};
