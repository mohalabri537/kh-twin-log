import React from 'react';
import {Img, staticFile} from 'remotion';
import {EN} from '../theme';

// Realistic devices for the studio cut, drawn in CSS from real proportions (no logos or trademarks):
// a Pro Max-class phone (silver metal rim, black border, Dynamic Island, side buttons, iOS status bar and Safari's
// floating address bar) and a 16-inch laptop (aluminium lid with the camera notch, menu bar, browser window, hinge and
// base seen from the front). Captured pages fill the screens.

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
  children?: React.ReactNode; // drawn in page coordinates
}> = ({src, k, cx, top, scrollY = 0, layers = [], o = 1, lift = 0, tilt = 0, children}) => {
  const b = phoneBox(k);
  const inner = b.rim + b.border;
  const page = (s: string, y: number, op: number, key: string) => (
    <Img key={key} src={staticFile(`cap/${s}`)} style={{position: 'absolute', left: 0, top: (SB - y) * k, width: b.sw, opacity: op}} />
  );
  const btn = (side: 'left' | 'right', y: number, h: number) => (
    <div style={{position: 'absolute', [side]: -b.sw * 0.007, top: b.h * y, width: b.sw * 0.012, height: b.h * h, borderRadius: b.sw * 0.006, background: 'linear-gradient(90deg, #bfc1c4, #f1f1f2 50%, #a7a9ad)', boxShadow: '0 0 0 0.5px rgba(0,0,0,.18)'}} />
  );
  return (
    <div style={{position: 'absolute', left: cx - b.w / 2, top, width: b.w, height: b.h, opacity: o, transform: tilt ? `perspective(3000px) rotateY(${tilt}deg)` : undefined}}>
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

// iOS status bar: time, signal, Wi-Fi, battery (CSS px, scaled by k)
const StatusBar: React.FC<{k: number}> = ({k}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 390 * k, height: SB * k, background: '#fff'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 390, height: SB, transform: `scale(${k})`, transformOrigin: '0 0'}}>
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
const SafariBar: React.FC<{k: number}> = ({k}) => (
  <div style={{position: 'absolute', left: 0, bottom: 0, width: 390, height: 110, transform: `scale(${k})`, transformOrigin: '0 100%'}}>
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 110, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.85) 55%)'}} />
    <div style={{position: 'absolute', left: 14, right: 14, bottom: 30, height: 48, borderRadius: 24, background: 'rgba(250,250,252,.94)', boxShadow: '0 6px 22px rgba(0,0,0,.12), inset 0 0 0 0.5px rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6}}>
      <svg width="10" height="12" viewBox="0 0 10 12"><rect x="1" y="5" width="8" height="6.5" rx="1.5" fill="#3c3c43" /><path d="M2.8 5V3.6a2.2 2.2 0 0 1 4.4 0V5" fill="none" stroke="#3c3c43" strokeWidth="1.3" /></svg>
      <span style={{fontFamily: EN, fontWeight: 500, fontSize: 16, color: '#1c1c1e', letterSpacing: -0.1}}>neurouniverse.om</span>
    </div>
    <div style={{position: 'absolute', left: '50%', bottom: 8, width: 140, height: 5, marginLeft: -70, borderRadius: 3, background: '#000'}} />
  </div>
);

// ---------------------------------------------------------------- laptop
// A 16-inch laptop seen from the front. `w` is the screen's width on the frame; the page (1440 x 900 CSS px) fills a
// browser window under the menu bar.
export const Laptop: React.FC<{src: string; w: number; cx: number; top: number; o?: number}> = ({src, w, cx, top, o = 1}) => {
  const bezel = w * 0.018, edge = w * 0.006;
  const sh = w / 1.547; // 3456 x 2234
  const lidW = w + 2 * (bezel + edge), lidH = sh + 2 * edge + bezel * 2.2;
  const menu = sh * 0.024, bar = sh * 0.056; // menu bar (the notch's height), browser toolbar
  const pageH = sh - menu - bar;
  const baseW = lidW * 1.12, baseH = lidW * 0.026;
  return (
    <div style={{position: 'absolute', left: cx - lidW / 2, top, width: lidW, height: lidH + baseH, opacity: o}}>
      {/* shadow on the paper */}
      <div style={{position: 'absolute', left: '-2%', right: '-2%', top: lidH + baseH * 0.5, height: baseH * 2.2, borderRadius: '50%', background: 'rgba(29,29,31,.35)', filter: `blur(${baseH * 1.2}px)`}} />
      {/* lid: aluminium edge, black glass border, screen */}
      <div style={{position: 'absolute', left: 0, top: 0, width: lidW, height: lidH, borderRadius: `${w * 0.026}px ${w * 0.026}px ${w * 0.008}px ${w * 0.008}px`, background: 'linear-gradient(180deg, #d9dadd, #b7b9bd)', boxShadow: '0 40px 90px -50px rgba(29,29,31,.45)'}}>
        <div style={{position: 'absolute', inset: edge, borderRadius: `${w * 0.022}px ${w * 0.022}px ${w * 0.004}px ${w * 0.004}px`, background: '#060607'}}>
          <div style={{position: 'absolute', left: bezel, top: bezel, width: w, height: sh, borderRadius: w * 0.008, overflow: 'hidden', background: '#fff'}}>
            {/* menu bar */}
            <div style={{position: 'absolute', left: 0, top: 0, width: w, height: menu, background: 'rgba(246,246,248,.96)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${w * 0.014}px`, fontFamily: EN, fontSize: menu * 0.55, color: '#1d1d1f'}}>
              <span style={{fontWeight: 600}}>Safari</span>
              <span>Fri 9:41</span>
            </div>
            {/* browser toolbar */}
            <div style={{position: 'absolute', left: 0, top: menu, width: w, height: bar, background: '#f3f3f5', borderBottom: '1px solid rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', padding: `0 ${w * 0.014}px`, gap: w * 0.006}}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => <div key={c} style={{width: bar * 0.24, height: bar * 0.24, borderRadius: '50%', background: c}} />)}
              <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
                <div style={{width: '42%', height: bar * 0.56, borderRadius: bar * 0.16, background: '#e6e6ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: EN, fontSize: bar * 0.3, color: '#3c3c43'}}>neurouniverse.om</div>
              </div>
              <div style={{width: bar * 0.24 * 3 + w * 0.012}} />
            </div>
            <Img src={staticFile(`cap/${src}`)} style={{position: 'absolute', left: 0, top: menu + bar, width: w, height: (w / 1440) * 900, objectFit: 'cover', objectPosition: 'top'}} />
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,.08), rgba(255,255,255,0) 40%)'}} />
          </div>
          {/* camera notch */}
          <div style={{position: 'absolute', left: '50%', top: bezel - 1, width: w * 0.092, height: menu + 1, marginLeft: -w * 0.046, borderRadius: `0 0 ${menu * 0.45}px ${menu * 0.45}px`, background: '#060607'}}>
            <div style={{position: 'absolute', left: '50%', top: menu * 0.28, width: menu * 0.32, height: menu * 0.32, marginLeft: -menu * 0.16, borderRadius: '50%', background: '#1a2133'}} />
          </div>
        </div>
      </div>
      {/* hinge and base, seen from the front */}
      <div style={{position: 'absolute', left: (lidW - baseW) / 2, top: lidH - 1, width: baseW, height: baseH, borderRadius: `${baseH * 0.25}px ${baseH * 0.25}px ${baseH * 0.9}px ${baseH * 0.9}px / ${baseH * 0.25}px ${baseH * 0.25}px ${baseH}px ${baseH}px`,
        background: 'linear-gradient(180deg, #f2f3f4 0%, #d5d7da 30%, #b9bbbf 75%, #8f9196 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)'}}>
        <div style={{position: 'absolute', left: '50%', top: 0, width: baseW * 0.16, height: baseH * 0.42, marginLeft: -baseW * 0.08, borderRadius: `0 0 ${baseH * 0.5}px ${baseH * 0.5}px`, background: 'linear-gradient(180deg, #a7a9ad, #c9cbce)'}} />
      </div>
      <div style={{position: 'absolute', left: (lidW - lidW * 0.94) / 2, top: lidH - 2, width: lidW * 0.94, height: 3, background: 'rgba(0,0,0,.35)', filter: 'blur(1px)'}} />
    </div>
  );
};
