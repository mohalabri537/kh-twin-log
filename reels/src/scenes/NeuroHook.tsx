import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, hit, lerp} from '../lib/chase';
import {Neural} from '../lib/neural';
import {PhoneCam, VH, VW} from '../lib/PhoneCam';
import {ev, Kinetic, kf} from '../lib/kit';
import {C, EN} from '../theme';

// 0–4 s. The new site boots up on a phone: the homepage starts as a glowing blueprint, then a beam
// of light renders it to life from top to bottom, and the NU mark lights up as the beam clears it.
// «أطلقنا موقعنا الجديد» is on screen from frame 0. Ends on exactly the shot the exploded view starts on.

// The phone the hook ends on; the exploded-view scene starts on exactly this shot.
export const HERO_PHONE = {src: 'top-ar.jpg', pageH: 844, header: false, focus: {x: 195, y: 422}, zoom: 1.5, screenAt: {x: 540, y: 1180}} as const;

const LOGO_BOX = {x: 28, y: 528, w: 334, h: 220}; // the big NU mark on the homepage, page px
const BEZEL = 15; // phone bezel, page px

export const NeuroHook: React.FC = () => {
  const f = useCurrentFrame();
  const scanAt = ev('hook', 'scan')[0]; // the beam starts
  const lit = ev('hook', 'form')[0]; // the beam clears the logo
  const live = ev('hook', 'bloom')[0]; // fully rendered: glint, HUD retracts
  const scanY = kf(f, [[scanAt, -12], [lit, LOGO_BOX.y + LOGO_BOX.h], [lit + 12, VH + 12]]);
  const pct = Math.round(clamp(scanY / VH, 0, 1) * 100);

  // the phone swings in tilted, settles flat, then pushes in to the hero shot
  const settle = easeOut(clamp(f / 36, 0, 1));
  const push = easeInOut(clamp((f - 92) / 27, 0, 1));
  const zoom = lerp(1.22, HERO_PHONE.zoom, push);
  const at = {x: 540, y: lerp(1205, HERO_PHONE.screenAt.y, push)};
  const rx = (1 - settle) * 16, ry = (1 - settle) * -26;

  // the phone's screen on the frame, for the HUD around it
  const hw = (VW / 2) * zoom, hh = (VH / 2) * zoom, bz = BEZEL * zoom;
  const box = {l: at.x - hw - bz, r: at.x + hw + bz, t: at.y - hh - bz, b: at.y + hh + bz};
  const hud = easeOut(clamp((f - 12) / 10, 0, 1)) * (1 - easeInOut(clamp((f - live) / 10, 0, 1)));
  const glow = hit(f, live, 24);

  return (
    <AbsoluteFill>
      <Neural f={f} mode="light" travel={260 + f * 5} fire={0.7} opacity={0.32} />
      {/* light swelling behind the phone when the site goes live */}
      <div style={{position: 'absolute', left: at.x - 700, top: at.y - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(169,139,255,.55), transparent 60%)', opacity: glow}} />
      <PhoneCam src="top-ar-wire.jpg" pageH={844} header={false} focus={{x: 195, y: 422}} zoom={zoom} screenAt={at} rx={rx} ry={ry}>
        {/* the real page, rendered above the beam */}
        <div style={{position: 'absolute', left: 0, top: 0, width: VW, height: VH, clipPath: `inset(0 0 ${clamp(VH - scanY, 0, VH)}px 0)`}}>
          <Img src={staticFile('cap/top-ar.jpg')} style={{width: VW, display: 'block'}} />
        </div>
        {f >= lit - 1 && <LogoLight f={f} at={lit} />}
        {scanY > -12 && scanY < VH + 12 && <Beam y={scanY} />}
        {/* glint across the glass as it goes live */}
        {f >= live && f < live + 16 && (
          <div style={{position: 'absolute', top: -40, height: VH + 80, width: 110, left: lerp(-160, VW + 40, easeInOut((f - live) / 16)), background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)', transform: 'skewX(-18deg)'}} />
        )}
      </PhoneCam>
      {hud > 0 && <Hud box={box} f={f} o={hud} scanY={scanY} zoom={zoom} pct={pct} done={f >= lit + 12} />}
      <Kinetic
        words={[
          {t: 'أطلقنا', at: -5},
          {t: '\n', at: -5},
          {t: 'موقعنا', at: 15},
          {t: 'الجديد', at: 30},
        ]}
        sub={{t: 'neurouniverse.om', at: 45, ltr: true}}
        out={96}
        top={200}
        size={116}
      />
    </AbsoluteFill>
  );
};

// The scan beam: a bright line with a soft violet wash trailing above it (page px).
const Beam: React.FC<{y: number}> = ({y}) => (
  <>
    <div style={{position: 'absolute', left: 0, width: VW, top: y - 46, height: 46, background: 'linear-gradient(180deg, rgba(169,139,255,0), rgba(169,139,255,.38))'}} />
    <div style={{position: 'absolute', left: 0, width: VW, top: y - 1.5, height: 3, background: '#fff', boxShadow: `0 0 6px 2px ${C.purpleLight}, 0 0 22px 7px rgba(116,49,244,.45)`}} />
  </>
);

// The NU mark lighting up as the beam clears it: a lift, a glow and one ring of light.
const LogoLight: React.FC<{f: number; at: number}> = ({f, at}) => {
  const k = hit(f, at, 18);
  const ring = clamp((f - at) / 22, 0, 1);
  const cx = LOGO_BOX.x + LOGO_BOX.w / 2, cy = LOGO_BOX.y + LOGO_BOX.h / 2;
  return (
    <>
      {ring < 1 && (
        <div style={{position: 'absolute', left: cx - 120, top: cy - 120, width: 240, height: 240, borderRadius: '50%', border: `${3 * (1 - ring)}px solid ${C.purpleLight}`, transform: `scale(${1 + easeOut(ring) * 1.6})`, opacity: 1 - ring}} />
      )}
      {/* the mark cut out of the page (public/cap/logo-cut.png), lifted over its own place */}
      <Img
        src={staticFile('cap/logo-cut.png')}
        style={{
          position: 'absolute',
          left: LOGO_BOX.x,
          top: LOGO_BOX.y,
          width: LOGO_BOX.w,
          height: LOGO_BOX.h,
          transform: `scale(${1 + k * 0.07})`,
          filter: `drop-shadow(0 0 ${4 + k * 16}px rgba(116,49,244,${k * 0.7}))`,
        }}
      />
    </>
  );
};

// Blueprint HUD around the phone: corner brackets, the screen's height, and a tag that rides the beam.
const Hud: React.FC<{box: {l: number; r: number; t: number; b: number}; f: number; o: number; scanY: number; zoom: number; pct: number; done: boolean}> = ({box, f, o, scanY, zoom, pct, done}) => {
  const g = 26, arm = 64 * o;
  const corners: [number, number, number, number][] = [
    [box.l - g, box.t - g, 1, 1],
    [box.r + g, box.t - g, -1, 1],
    [box.l - g, box.b + g, 1, -1],
    [box.r + g, box.b + g, -1, -1],
  ];
  const line = {background: C.purple, position: 'absolute' as const};
  const tagY = box.t + (BEZEL + clamp(scanY, 0, VH)) * zoom;
  const dimX = box.l - 70;
  return (
    <AbsoluteFill style={{opacity: o}}>
      {corners.map(([x, y, sx, sy], i) => (
        <React.Fragment key={i}>
          <div style={{...line, left: sx > 0 ? x : x - arm, top: y - 2, width: arm, height: 4}} />
          <div style={{...line, left: x - 2, top: sy > 0 ? y : y - arm, width: 4, height: arm}} />
        </React.Fragment>
      ))}
      {/* the screen's height, like a drawing dimension */}
      <div style={{...line, left: dimX, top: box.t, width: 2, height: (box.b - box.t) * o, opacity: 0.6}} />
      <div style={{...line, left: dimX - 12, top: box.t, width: 26, height: 2, opacity: 0.6}} />
      <div style={{...line, left: dimX - 12, top: box.b, width: 26, height: 2, opacity: 0.6 * o}} />
      <div style={{position: 'absolute', left: dimX - 47, top: (box.t + box.b) / 2 - 22, width: 96, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F7', transform: 'rotate(-90deg)', fontFamily: EN, fontSize: 30, fontWeight: 500, color: C.purple, letterSpacing: 2}}>
        844
      </div>
      {/* a tag riding the beam: render progress, then live */}
      <div style={{...line, left: box.r + 4, top: tagY - 1, width: 26, height: 2}} />
      <div style={{position: 'absolute', left: box.r + 30, top: tagY - 28, height: 56, padding: '0 18px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 999, background: done ? C.purple : '#fff', border: `2px solid ${C.purple}`, boxShadow: '0 8px 20px rgba(116,49,244,.18)', fontFamily: EN, fontSize: 30, fontWeight: 600, letterSpacing: 1.5, color: done ? '#fff' : C.purple, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
        <div style={{width: 14, height: 14, borderRadius: 7, background: done ? '#fff' : C.purple, opacity: done ? 0.6 + 0.4 * Math.sin(f / 3) : 1}} />
        {done ? 'LIVE' : `${pct}%`}
      </div>
    </AbsoluteFill>
  );
};
