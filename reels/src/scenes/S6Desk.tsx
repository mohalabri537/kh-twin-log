import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useF} from '../lib/time';
import {chaseShot, clamp, easeInOut, hit} from '../lib/chase';
import {Flash, Shade, Slam, Space} from '../lib/fx';
import {EN} from '../theme';

// 23–26 s. On a computer: the camera chases the mouse across the articles page, it clicks the EEG article,
// then everything pulls back to the laptop.
const PW = 1440, PH = 900, BAR = 64; // page size (CSS px) and browser toolbar height
const CLICK = 45; // abs 735

export const S6Desk: React.FC = () => {
  const f = useF(); // 0..90 (abs 690..780)
  const shot = chaseShot({
    f,
    keys: [
      {f: 0, x: 1250, y: 300},
      {f: 18, x: 1144, y: 620},
      {f: 41, x: 720, y: 690},
      {f: 90, x: 720, y: 690},
    ],
    taps: [CLICK],
    zooms: [
      {f: 0, z: 1.4},
      {f: 12, z: 1.15},
      {f: 30, z: 1.1},
      {f: 45, z: 1.4},
      {f: 72, z: 0.68},
      {f: 90, z: 0.66},
    ],
    follow: 0.1,
  });
  const z = shot.zoom;
  const w = clamp((z - 0.7) / (1.6 - 0.7), 0, 1) * 0.8; // centre the laptop when pulled back
  const fx = PW / 2 + (shot.focus.x - PW / 2) * w;
  const fy = (PH + BAR) / 2 + (shot.focus.y + BAR - (PH + BAR) / 2) * w;
  const pull = easeInOut(clamp((f - 50) / 22, 0, 1));
  const page = f >= CLICK + 2 ? 'desk-article.jpg' : 'desk-articles.jpg';
  const p = shot.pointer!;
  const inv = 1 / z;
  return (
    <AbsoluteFill>
      <Space />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(540px, ${960 + pull * 120}px) perspective(3000px) rotateX(${shot.rx * 0.6 + pull * 14}deg) rotateY(${shot.ry * 0.6 - pull * 10}deg) rotateZ(${shot.rot * 0.6}deg) scale(${z}) translate(${-fx}px, ${-fy}px)`,
        }}
      >
        {/* browser window */}
        <div style={{position: 'absolute', left: -20, top: -20, width: PW + 40, height: PH + BAR + 40, borderRadius: 40, background: '#0d0c12', boxShadow: '0 80px 200px rgba(116,49,244,.5), 0 0 0 3px #2b2833'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: PW, height: BAR, background: '#ECECEF', borderRadius: '22px 22px 0 0', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <div key={c} style={{width: 18, height: 18, borderRadius: 9, background: c}} />
          ))}
          <div style={{marginLeft: 380, width: 560, height: 38, borderRadius: 12, background: '#fff', fontFamily: EN, fontSize: 20, color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
            🔒 neurouniverse.om{f >= CLICK + 2 ? '/ar/articles/what-is-an-eeg' : '/ar/articles'}
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, top: BAR, width: PW, height: PH, overflow: 'hidden', borderRadius: '0 0 22px 22px', background: '#fff'}}>
          <Img src={staticFile(`cap/${page}`)} style={{width: PW, height: PH, display: 'block', transform: `scale(${1 + hit(f, CLICK + 2, 10) * 0.04})`}} />
          {f >= CLICK && f < CLICK + 4 && <div style={{position: 'absolute', inset: 0, background: '#fff', opacity: 0.6}} />}
        </div>
        {/* laptop base */}
        <div style={{position: 'absolute', left: -140, top: PH + BAR + 20, width: PW + 280, height: 46, borderRadius: '0 0 40px 40px', background: 'linear-gradient(#cfcfd6,#8d8d97)'}} />
        {/* cursor: chased by the camera, constant size on screen */}
        {shot.trail.map((q, i) => (
          <div key={i} style={{position: 'absolute', left: q.x, top: q.y + BAR, transform: `scale(${inv * 1.1})`, transformOrigin: '0 0', opacity: (i + 1) / 14}}>
            <Arrow />
          </div>
        ))}
        <div style={{position: 'absolute', left: p.x, top: p.y + BAR, transform: `scale(${inv * 1.3 * (1 - shot.press * 0.2)})`, transformOrigin: '0 0'}}>
          {shot.ripple >= 0 && shot.ripple < 16 && (
            <div style={{position: 'absolute', left: -50, top: -50, width: 100, height: 100, borderRadius: 50, border: '5px solid #7431F4', transform: `scale(${1 + shot.ripple * 0.25})`, opacity: 1 - shot.ripple / 16}} />
          )}
          <Arrow />
        </div>
      </div>
      <Shade side="top" o={clamp((f - 48) / 8, 0, 1)} />
      <Slam
        y={190}
        words={[
          {t: 'معلومات موثوقة', at: CLICK + 3, size: 120},
          {t: 'بالعربية', at: CLICK + 15, size: 150, weight: 200, color: '#C8B4FF'},
        ]}
        gap={0}
      />
      <Flash at={[0]} len={6} max={0.3} />
    </AbsoluteFill>
  );
};

const Arrow: React.FC = () => (
  <svg width="56" height="78" viewBox="0 0 28 39" style={{filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.45)) drop-shadow(0 0 12px rgba(116,49,244,.8))'}}>
    <path d="M2 2 L2 30 L9 23 L14 35 L19 33 L14 21 L24 21 Z" fill="#111" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
);
