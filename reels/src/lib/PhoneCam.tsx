import React from 'react';
import {Img, staticFile} from 'remotion';
import {clamp, Key, Pt} from './chase';
import {C} from '../theme';

// A phone showing a captured page, filmed by a virtual camera.
// Page coordinates are the site's CSS pixels (390 wide). Captures are 3x, shown at K=2 inside the phone.
export const K = 2;
export const VW = 390, VH = 844;
const SW = VW * K, SH = VH * K, B = 30; // screen size and bezel in px

export type Shot = {
  src: string; // file in public/cap
  pageH: number; // CSS px height of the capture
  focus: Pt; // camera focus, page coords
  zoom: number; // screen px per CSS px (1.6 ≈ whole phone, 2.77 ≈ page fills width, 5+ = close-up)
  rot?: number; // degrees, roll
  rx?: number; // degrees, pitch
  ry?: number; // degrees, yaw
  screenAt?: Pt; // where on the frame the focus lands
  pointer?: Pt | null; // finger, page coords
  trail?: Pt[];
  press?: number; // 0..1 tap compression
  ripple?: number; // frames since last tap (or -1)
  header?: boolean;
  headerSrc?: string; // page whose top bar is pinned while scrolling (defaults to src)
  children?: React.ReactNode; // overlays drawn in page coordinates
};

// Where the page sits under the camera: focus stays centred while zoomed in, the phone centres itself when zoomed out.
export const framing = (focus: Pt, zoom: number, pageH: number) => {
  const w = clamp((zoom - 1.5) / (2.9 - 1.5), 0, 1);
  const scrollY = clamp(focus.y - VH / 2, 0, Math.max(0, pageH - VH));
  const fx = VW / 2 + (focus.x - VW / 2) * w;
  const fy = VH / 2 + (focus.y - scrollY - VH / 2) * w;
  return {scrollY, fx, fy};
};

export const PhoneCam: React.FC<Shot> = (s) => {
  const {scrollY, fx, fy} = framing(s.focus, s.zoom, s.pageH);
  const at = s.screenAt ?? {x: 540, y: 960};
  const S = s.zoom / K;
  const toScreen = (p: Pt) => ({x: p.x * K, y: (p.y - scrollY) * K});
  const inv = 1 / S; // keeps the finger a constant size on screen
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transformOrigin: '0 0',
        transform: `translate(${at.x}px, ${at.y}px) perspective(2400px) rotateX(${s.rx ?? 0}deg) rotateY(${s.ry ?? 0}deg) rotateZ(${s.rot ?? 0}deg) scale(${S}) translate(${-(B + fx * K)}px, ${-(B + fy * K)}px)`,
      }}
    >
      <div
        style={{
          width: SW + 2 * B,
          height: SH + 2 * B,
          borderRadius: 120,
          background: 'linear-gradient(145deg,#2a2833,#0b0a10 40%,#1c1a24)',
          boxShadow: `0 0 0 3px #3a3744, 0 90px 160px -40px rgba(90,40,200,.35), 0 40px 80px -20px rgba(29,29,31,.35)`,
          position: 'relative',
        }}
      >
        <div style={{position: 'absolute', left: B, top: B, width: SW, height: SH, borderRadius: 92, overflow: 'hidden', background: '#fff'}}>
          <Img src={staticFile(`cap/${s.src}`)} style={{position: 'absolute', left: 0, top: -scrollY * K, width: SW}} />
          {s.children && (
            <div style={{position: 'absolute', left: 0, top: -scrollY * K, width: VW, transform: `scale(${K})`, transformOrigin: '0 0'}}>{s.children}</div>
          )}
          {s.header !== false && (scrollY > 4 || s.headerSrc) && (
            <div style={{position: 'absolute', left: 0, top: 0, width: SW, height: 60 * K, overflow: 'hidden', boxShadow: '0 1px 0 rgba(0,0,0,.08)'}}>
              <Img src={staticFile(`cap/${s.headerSrc ?? s.src}`)} style={{position: 'absolute', left: 0, top: 0, width: SW}} />
            </div>
          )}
          {/* glass sheen */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,0) 32%)', pointerEvents: 'none'}} />
        </div>
        {(s.trail ?? []).map((p, i, arr) => {
          const q = toScreen(p);
          const k = (i + 1) / (arr.length + 1);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: B + q.x,
                top: B + q.y,
                width: 64,
                height: 64,
                marginLeft: -32,
                marginTop: -32,
                borderRadius: '50%',
                background: C.purpleLight,
                opacity: k * 0.35,
                transform: `scale(${inv * (0.4 + k * 0.6)})`,
                filter: 'blur(6px)',
              }}
            />
          );
        })}
        {s.pointer && <Finger p={toScreen(s.pointer)} inv={inv} press={s.press ?? 0} ripple={s.ripple ?? -1} />}
      </div>
    </div>
  );
};

const Finger: React.FC<{p: Pt; inv: number; press: number; ripple: number}> = ({p, inv, press, ripple}) => (
  <div style={{position: 'absolute', left: B + p.x, top: B + p.y, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
    {ripple >= 0 && ripple < 24 && (
      <div
        style={{
          position: 'absolute',
          left: -60,
          top: -60,
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: `6px solid ${C.purple}`,
          transform: `scale(${1 + ripple * 0.12})`,
          opacity: 1 - ripple / 24,
        }}
      />
    )}
    <div
      style={{
        position: 'absolute',
        left: -44,
        top: -44,
        width: 88,
        height: 88,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,.95) 0%, rgba(255,255,255,.75) 55%, rgba(169,139,255,.55) 100%)',
        border: '4px solid rgba(116,49,244,.85)',
        boxShadow: '0 0 40px rgba(116,49,244,.8), 0 10px 30px rgba(0,0,0,.35)',
        transform: `scale(${1 - press * 0.28})`,
      }}
    />
  </div>
);

// Pointer + camera bundle for a shot driven by keyframes.
export type Drive = {keys: Key[]; taps?: number[]};
