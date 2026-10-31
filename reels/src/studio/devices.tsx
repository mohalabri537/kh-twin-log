import React from 'react';
import {Img, staticFile} from 'remotion';
import {EN} from '../theme';

// Devices for the studio cut, drawn in CSS from real proportions (no logos or trademarks). They only frame the
// website: a phone (metal rim, black border, camera island, status bar and the browser's floating address bar), a
// book-style foldable, and a plain desktop browser window. Captured pages fill the screens.

// ---------------------------------------------------------------- phone
// The web page is 390 CSS px wide; the screen is 390 x 844 CSS px; k = frame px per CSS px.
export const SB = 54; // status bar height, CSS px (the page starts under it)
const RIM = 0.017, BORDER = 0.019; // of the screen width
const METAL = 'linear-gradient(135deg, #f4f4f5 0%, #c7c8cb 18%, #eeeff0 34%, #a9abaf 52%, #e3e4e6 70%, #b6b8bb 86%, #f0f0f1 100%)';

export type Layer = {src: string; o: number; scrollY?: number};
export const phoneBox = (k: number) => {
  const sw = 390 * k, sh = 844 * k, rim = sw * RIM, border = sw * BORDER;
  return {sw, sh, rim, border, w: sw + 2 * (rim + border), h: sh + 2 * (rim + border), r: sw * 0.135};
};
// where page coordinates land on the frame (for overlays outside the phone)
export const pageToFrame = (k: number, cx: number, top: number, scrollY: number, p: {x: number; y: number}) => {
  const b = phoneBox(k);
  return {x: cx - b.sw / 2 + p.x * k, y: top + b.rim + b.border + (SB + p.y - scrollY) * k};
};

export const Phone: React.FC<{
  src: string;
  k: number;
  cx: number; // centre x on the frame
  top: number; // top of the device on the frame
  scrollY?: number; // CSS px of the page under the status bar
  layers?: Layer[];
  o?: number;
  lift?: number;
  tilt?: number; // degrees of turn, for a touch of depth
  rx?: number; // degrees of pitch
  glint?: number; // 0..1: a band of light sweeping once across the glass
  children?: React.ReactNode; // drawn in page coordinates
}> = ({src, k, cx, top, scrollY = 0, layers = [], o = 1, lift = 0, tilt = 0, rx = 0, glint = 0, children}) => {
  const b = phoneBox(k);
  const inner = b.rim + b.border;
  const page = (s: string, y: number, op: number, key: string) => (
    <Img key={key} src={staticFile(`cap/${s}`)} style={{position: 'absolute', left: 0, top: (SB - y) * k, width: b.sw, opacity: op}} />
  );
  const btn = (side: 'left' | 'right', y: number, h: number) => (
    <div style={{position: 'absolute', [side]: -b.sw * 0.007, top: b.h * y, width: b.sw * 0.012, height: b.h * h, borderRadius: b.sw * 0.006, background: 'linear-gradient(90deg, #bfc1c4, #f1f1f2 50%, #a7a9ad)', boxShadow: '0 0 0 0.5px rgba(0,0,0,.18)'}} />
  );
  return (
    <div style={{position: 'absolute', left: cx - b.w / 2, top, width: b.w, height: b.h, opacity: o, transform: tilt || rx ? `perspective(3000px) rotateX(${rx}deg) rotateY(${tilt}deg)` : undefined}}>
      {/* contact shadow on the paper */}
      <div style={{position: 'absolute', left: '8%', right: '8%', bottom: -b.h * 0.025, height: b.h * 0.05, borderRadius: '50%', background: 'rgba(29,29,31,.30)', filter: `blur(${b.w * 0.05}px)`}} />
      {btn('left', 0.155, 0.045)}
      {btn('left', 0.235, 0.075)}
      {btn('left', 0.325, 0.075)}
      {btn('right', 0.245, 0.11)}
      {btn('right', 0.60, 0.07)}
      {/* body: the metal rim, then the black border */}
      <div style={{position: 'absolute', inset: 0, borderRadius: b.r + inner, background: METAL,
        boxShadow: `0 ${50 + lift}px ${110 + lift * 2}px -40px rgba(29,29,31,.38), 0 18px 34px -22px rgba(29,29,31,.35), inset 0 0 0 0.6px rgba(0,0,0,.25)`}}>
        <div style={{position: 'absolute', inset: b.rim, borderRadius: b.r + b.border, background: '#050506', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)'}}>
          <div style={{position: 'absolute', inset: b.border, borderRadius: b.r, overflow: 'hidden', background: '#fff'}}>
            {page(src, scrollY, 1, 'base')}
            {layers.filter((l) => l.o > 0.001).map((l, i) => page(l.src, l.scrollY ?? scrollY, l.o, `l${i}`))}
            {children && <div style={{position: 'absolute', left: 0, top: (SB - scrollY) * k, width: 390, transform: `scale(${k})`, transformOrigin: '0 0'}}>{children}</div>}
            <StatusBar k={k} />
            <SafariBar k={k} />
            {/* the faintest reflection across the glass */}
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(118deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 38%)'}} />
            <Glint t={glint} />
          </div>
          {/* Dynamic Island */}
          <div style={{position: 'absolute', left: '50%', top: b.border + 11 * k, width: 111 * k, height: 33 * k, marginLeft: -55.5 * k, borderRadius: 20 * k, background: '#000'}}>
            <div style={{position: 'absolute', right: 12 * k, top: 10 * k, width: 13 * k, height: 13 * k, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #2a3550, #07090f 60%)'}} />
          </div>
        </div>
      </div>
    </div>
  );
};

// A band of light sweeping once across the glass (t: 0 → 1), as a device settles.
export const Glint: React.FC<{t: number}> = ({t}) =>
  t > 0 && t < 1 ? (
    <div style={{position: 'absolute', inset: '-20% -60%', pointerEvents: 'none', background: `linear-gradient(105deg, rgba(255,255,255,0) ${t * 100 - 14}%, rgba(255,255,255,.55) ${t * 100}%, rgba(255,255,255,0) ${t * 100 + 14}%)`, mixBlendMode: 'screen'}} />
  ) : null;

// iOS status bar: time, signal, Wi-Fi, battery (CSS px, scaled by k)
export const StatusBar: React.FC<{k: number; vw?: number; h?: number}> = ({k, vw = 390, h = SB}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: vw * k, height: h * k, background: '#fff'}}>
    <div style={{position: 'absolute', left: 0, top: (h - SB) / 2, width: vw, height: SB, transform: `scale(${k})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: 42, top: 19, fontFamily: EN, fontWeight: 600, fontSize: 16.5, letterSpacing: -0.2, color: '#000'}}>9:41</div>
      <div style={{position: 'absolute', right: 30, top: 22, display: 'flex', alignItems: 'center', gap: 6}}>
        <svg width="18" height="11" viewBox="0 0 18 11">{[0, 1, 2, 3].map((i) => <rect key={i} x={i * 4.7} y={8 - i * 2.4} width="3.2" height={3 + i * 2.4} rx="0.8" fill="#000" />)}</svg>
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 10.5 5.6 8a3.4 3.4 0 0 1 4.8 0zM3.5 5.9a6.4 6.4 0 0 1 9 0l-1.4 1.4a4.4 4.4 0 0 0-6.2 0zM1.3 3.7a9.5 9.5 0 0 1 13.4 0l-1.4 1.4a7.5 7.5 0 0 0-10.6 0z" fill="#000" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3.4" fill="none" stroke="rgba(0,0,0,.4)" /><rect x="2" y="2" width="17" height="8" rx="2" fill="#000" /><rect x="23.6" y="4" width="1.6" height="4" rx="0.8" fill="rgba(0,0,0,.45)" /></svg>
      </div>
    </div>
  </div>
);

// Safari's floating address bar and the home indicator
export const SafariBar: React.FC<{k: number; vw?: number; pill?: number}> = ({k, vw = 390, pill}) => (
  <div style={{position: 'absolute', left: 0, bottom: 0, width: vw, height: 110, transform: `scale(${k})`, transformOrigin: '0 100%'}}>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.85) 55%)'}} />
    <div style={{position: 'absolute', left: pill ? (vw - pill) / 2 : 14, right: pill ? (vw - pill) / 2 : 14, bottom: 30, height: 48, borderRadius: 24, background: 'rgba(250,250,252,.94)', boxShadow: '0 6px 22px rgba(0,0,0,.12), inset 0 0 0 0.5px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
      <svg width="10" height="12" viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="6.5" rx="1.5" fill="#3c3c43" /><path d="M2.8 5V3.6a2.2 2.2 0 0 1 4.4 0V5" fill="none" stroke="#3c3c43" strokeWidth="1.3" /></svg>
      <span style={{fontFamily: EN, fontWeight: 500, fontSize: 16, color: '#1c1c1e', letterSpacing: -0.1}}>neurouniverse.om</span>
    </div>
    <div style={{position: 'absolute', left: '50%', bottom: 8, width: 140, height: 5, marginLeft: -70, borderRadius: 3, background: '#000'}} />
  </div>
);

// ---------------------------------------------------------------- foldable phone
// A book-style foldable, seen from the front. open = 0 (closed: the outer screen faces us) to 1 (flat open: the inner
// screen spans both halves). The left half swings on the hinge towards the viewer, in real 3D, with the edge
// thickness showing as it turns. Screens are CSS px: outer 420 x 590, inner 850 x 590; k = frame px per CSS px.
const FOLD = {iw: 850, ih: 590, cw: 420, ch: 590, rim: 6.5, border: 7, r: 44, t: 20};
export const Fold: React.FC<{open: number; k: number; cx: number; cy: number; rx?: number; ry?: number; scale?: number; o?: number; glint?: number; cover: string; inner: string}> = ({open, k, cx, cy, rx = 0, ry = 0, scale = 1, o = 1, glint = 0, cover, inner}) => {
  const {iw, ih, cw, ch, rim, border, r, t} = FOLD;
  const side = (rim + border) * k;
  const hw = (iw / 2) * k + side, h = ih * k + 2 * side; // one half, outer size
  const a = 180 * (1 - open); // left half's turn, degrees
  const T = t * k; // thickness of one half
  // keep the device centred: closed, it is one half wide
  const shift = (-hw / 2) * (a / 180);
  const half = (left: boolean, face: React.ReactNode, back?: React.ReactNode) => (
    <div style={{position: 'absolute', left: left ? -hw : 0, top: -h / 2, width: hw, height: h, transformStyle: 'preserve-3d',
      transformOrigin: left ? '100% 50%' : '0 50%', transform: left ? `translateZ(${T / 2}px) rotateY(${a}deg) translateZ(${-T / 2}px)` : undefined}}>
      {/* inner face */}
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: left ? `${r * k}px 0 0 ${r * k}px` : `0 ${r * k}px ${r * k}px 0`, background: METAL, padding: left ? `${rim * k}px 0 ${rim * k}px ${rim * k}px` : `${rim * k}px ${rim * k}px ${rim * k}px 0`}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: left ? `${(r - rim) * k}px 0 0 ${(r - rim) * k}px` : `0 ${(r - rim) * k}px ${(r - rim) * k}px 0`, background: '#050506', overflow: 'hidden'}}>{face}</div>
      </div>
      {/* back face: the outer screen on the left half, glass on the right */}
      <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: left ? `0 ${r * k}px ${r * k}px 0` : `${r * k}px 0 0 ${r * k}px`, background: METAL, padding: rim * k}}>
        <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: (r - rim) * k, background: back ? '#050506' : 'linear-gradient(135deg,#e9e9ec,#cfd0d4)', overflow: 'hidden'}}>{back}</div>
      </div>
      {/* the outer edge, so the half has thickness as it turns */}
      <div style={{position: 'absolute', top: r * k * 0.6, bottom: r * k * 0.6, [left ? 'left' : 'right']: -T / 2, width: T, background: 'linear-gradient(90deg, #a9abaf, #f2f2f3 45%, #b9bbbe)', transform: 'rotateY(90deg)'}} />
    </div>
  );
  const innerHalf = (left: boolean) => (
    <div style={{position: 'absolute', top: border * k, bottom: border * k, [left ? 'left' : 'right']: border * k, [left ? 'right' : 'left']: 0, overflow: 'hidden', borderRadius: left ? `${(r - rim - border) * k}px 0 0 ${(r - rim - border) * k}px` : `0 ${(r - rim - border) * k}px ${(r - rim - border) * k}px 0`, background: '#0b0b0d'}}>
      <div style={{position: 'absolute', top: 0, [left ? 'left' : 'right']: 0, width: iw * k, height: ih * k, opacity: Math.min(1, open * 6)}}>
        <Img src={staticFile(`cap/${inner}`)} style={{position: 'absolute', left: 0, top: 30 * k, width: iw * k}} />
        <StatusBar k={k} vw={iw} h={30} />
        <SafariBar k={k} vw={iw} pill={330} />
        <Glint t={glint} />
      </div>
      {/* the crease */}
      <div style={{position: 'absolute', top: 0, bottom: 0, [left ? 'right' : 'left']: 0, width: 10 * k, background: `linear-gradient(${left ? 270 : 90}deg, rgba(0,0,0,.10), rgba(0,0,0,0))`}} />
    </div>
  );
  const coverScreen = (
    <div style={{position: 'absolute', inset: border * k, borderRadius: (r - rim - border) * k, overflow: 'hidden', background: '#fff'}}>
      <Img src={staticFile(`cap/${cover}`)} style={{position: 'absolute', left: 0, top: SB * k, width: cw * k}} />
      <StatusBar k={k} vw={cw} />
      <SafariBar k={k} vw={cw} />
      <div style={{position: 'absolute', left: '50%', top: 11 * k, width: 100 * k, height: 31 * k, marginLeft: -50 * k, borderRadius: 16 * k, background: '#000'}} />
    </div>
  );
  return (
    <div style={{position: 'absolute', left: cx, top: cy, opacity: o, perspective: 2600 * k, transformStyle: 'preserve-3d'}}>
      {/* soft shadow on the paper, growing as it opens */}
      <div style={{position: 'absolute', left: -hw * (0.2 + open * 0.9) + shift, width: hw * (1.4 + open * 0.9), top: h / 2 + 20 * k, height: 40 * k, borderRadius: '50%', background: 'rgba(29,29,31,.28)', filter: `blur(${26 * k}px)`}} />
      <div style={{transformStyle: 'preserve-3d', transform: `scale(${scale}) translateX(${shift}px) rotateX(${rx}deg) rotateY(${ry}deg)`}}>
        {half(true, innerHalf(true), coverScreen)}
        {half(false, innerHalf(false))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- desktop browser window
// A plain browser window with the desktop page (1440 x 900 CSS px captures); w = window width on the frame.
export const Browser: React.FC<{src: string; w: number; cx: number; top: number; o?: number}> = ({src, w, cx, top, o = 1}) => {
  const bar = w * 0.045, h = (w * 900) / 1440;
  return (
    <div style={{position: 'absolute', left: cx - w / 2, top, width: w, height: h + bar, borderRadius: w * 0.018, overflow: 'hidden', background: '#fff', opacity: o,
      boxShadow: '0 60px 110px -50px rgba(29,29,31,.35), 0 0 0 1px rgba(29,29,31,.08)'}}>
      <div style={{height: bar, background: '#f3f3f5', borderBottom: '1px solid rgba(0,0,0,.07)', display: 'flex', alignItems: 'center', padding: `0 ${w * 0.018}px`, gap: w * 0.008}}>
        {[0, 1, 2].map((i) => <div key={i} style={{width: bar * 0.26, height: bar * 0.26, borderRadius: '50%', background: 'rgba(29,29,31,.16)'}} />)}
        <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
          <div style={{width: '44%', height: bar * 0.58, borderRadius: bar * 0.18, background: '#e8e8ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: EN, fontSize: bar * 0.32, color: '#3c3c43'}}>neurouniverse.om</div>
        </div>
        <div style={{width: bar * 0.26 * 3 + w * 0.016}} />
      </div>
      <Img src={staticFile(`cap/${src}`)} style={{display: 'block', width: w, height: h}} />
    </div>
  );
};
