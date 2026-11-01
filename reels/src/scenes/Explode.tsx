import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {clamp, easeInOut, easeOut, easeOutBack, hit, lerp} from '../lib/chase';
import {PhoneCam} from '../lib/PhoneCam';
import {BlurX, ev, Kinetic, kf, TopFade, whip} from '../lib/kit';
import {HERO_PHONE} from './NeuroHook';
import {AR, C, EN} from '../theme';

// 4–10 s. The homepage breaks apart into glass panels floating in 3D, each tagged like a schematic,
// while the camera orbits; then everything snaps back into the phone.

const LEN = 180;
const ORIGIN = {x: 540, y: 1100};
const SCREEN_W = 390 * 1.5; // the phone screen's width on the frame at the hero shot

type Panel = {img: string; w: number; ratio: number; x: number; y: number; z: number; ry: number; label: string; tagRight?: boolean};
const PANELS: Panel[] = [
  {img: 'hero', w: 330, ratio: 720 / 780, x: -228, y: -300, z: 60, ry: 16, label: 'الرئيسية'},
  {img: 'english', w: 310, ratio: 660 / 780, x: 236, y: -330, z: -140, ry: -16, label: 'عربي · English'},
  {img: 'doctors', w: 200, ratio: 1424 / 780, x: -268, y: 40, z: 210, ry: 18, label: 'الأطباء'}, // all three doctors (home page)
  {img: 'eeg', w: 330, ratio: 880 / 780, x: 240, y: 30, z: 10, ry: -18, label: 'تخطيط الدماغ'},
  {img: 'visit', w: 300, ratio: 800 / 780, x: -240, y: 455, z: -80, ry: 14, label: 'زيارتك الأولى', tagRight: true},
  {img: 'booking', w: 310, ratio: 840 / 780, x: 238, y: 410, z: 170, ry: -14, label: 'الحجز'},
  {img: 'articles', w: 400, ratio: 900 / 1440, x: 0, y: 670, z: 90, ry: 0, label: 'المقالات'},
];

export const Explode: React.FC = () => {
  const f = useCurrentFrame();
  const boom = ev('explode', 'boom')[0]; // 15
  const lock = ev('explode', 'lock')[0]; // 156
  const labels = ev('explode', 'blip');
  const w = whip(f, LEN, 0, 8);
  // the phone steps back while its page is taken apart, then returns
  const away = easeInOut(clamp((f - boom) / 14, 0, 1)) * (1 - easeInOut(clamp((f - (lock - 10)) / 12, 0, 1)));
  const orbitY = kf(f, [[boom, -4], [lock - 12, 16]]) * away;
  const orbitX = (8 + Math.sin(f / 30) * 2) * away;
  const dolly = 1 - away * 0.12;
  return (
    <AbsoluteFill>
      <Grid f={f} o={away} />
      <BlurX id="bx-explode" amount={w.blur}>
        <AbsoluteFill style={{transform: `translateX(${w.x}px) rotate(${w.rot}deg)`}}>
          <AbsoluteFill style={{opacity: 1 - away * 0.75, transform: `scale(${1 - away * 0.12})`}}>
            <PhoneCam {...HERO_PHONE} rx={orbitX * 0.5} ry={-orbitY * 0.5} />
          </AbsoluteFill>
          {/* the 3D world the panels float in */}
          <div style={{position: 'absolute', left: ORIGIN.x, top: ORIGIN.y, perspective: 2200, transformStyle: 'preserve-3d'}}>
            <div style={{transformStyle: 'preserve-3d', transform: `scale(${dolly}) rotateX(${orbitX}deg) rotateY(${orbitY}deg)`}}>
              {PANELS.map((p, i) => (
                <PanelCard key={p.img} p={p} i={i} f={f} boom={boom} lock={lock} label={labels[i]} />
              ))}
            </div>
          </div>
        </AbsoluteFill>
      </BlurX>
      <Scan f={f} at={ev('explode', 'scan')[0]} />
      <TopFade o={1} to={520} />
      <Kinetic words={[{t: 'كل', at: 4}, {t: 'ما', at: 8}, {t: 'تحتاجه', at: 12}]} sub={{t: 'في مكان واحد', at: 22}} out={LEN - 14} size={120} />
    </AbsoluteFill>
  );
};

const PanelCard: React.FC<{p: Panel; i: number; f: number; boom: number; lock: number; label: number}> = ({p, i, f, boom, lock, label}) => {
  const out = easeOutBack(clamp((f - boom - i * 1.5) / 16, 0, 1));
  const back = easeInOut(clamp((f - (lock - 14) - (PANELS.length - 1 - i) * 1.2) / 12, 0, 1));
  const t = out * (1 - back);
  // start (and end) stacked on the phone's screen, sized like it
  const s0 = SCREEN_W / p.w;
  const x = lerp(0, p.x, t), y = lerp(-20, p.y, t), z = lerp(0, p.z, t), ry = lerp(0, p.ry, t);
  const scale = lerp(s0, 1, t);
  const h = p.w * p.ratio;
  const float = Math.sin((f + i * 11) / 18) * 10 * t;
  const o = clamp((f - boom) / 3, 0, 1) * (1 - clamp((back - 0.85) / 0.15, 0, 1));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: -p.w / 2, top: -h / 2, width: p.w, height: h, opacity: o, transformStyle: 'preserve-3d', transform: `translate3d(${x}px, ${y + float}px, ${z}px) rotateY(${ry}deg) scale(${scale})`}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 26, overflow: 'hidden', background: '#fff', boxShadow: `0 30px 60px -10px rgba(29,29,31,.25), 0 0 0 2px rgba(255,255,255,.9), 0 0 ${30 + hit(f, label, 14) * 50}px rgba(116,49,244,${0.18 + hit(f, label, 14) * 0.4})`}}>
        <Img src={staticFile(`cap/panels/${p.img}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}} />
        {/* glass sheen sliding across */}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${20 + ((f * 2 + i * 30) % 160)}%, rgba(255,255,255,.35) ${28 + ((f * 2 + i * 30) % 160)}%, transparent ${36 + ((f * 2 + i * 30) % 160)}%)`}} />
      </div>
      <Tag f={f} at={label} text={p.label} right={p.tagRight ?? p.x > 0} />
    </div>
  );
};

// Schematic tag: a dot, a line and a label that types itself in.
const Tag: React.FC<{f: number; at: number; text: string; right: boolean}> = ({f, at, text, right}) => {
  if (f < at) return null;
  const t = easeOut(clamp((f - at) / 8, 0, 1));
  const line = easeOut(clamp((f - at) / 5, 0, 1));
  return (
    <div style={{position: 'absolute', top: -66, [right ? 'right' : 'left']: 6, display: 'flex', flexDirection: right ? 'row-reverse' : 'row', alignItems: 'center', gap: 0, transform: 'translateZ(30px)'}}>
      <div style={{width: 16, height: 16, borderRadius: 8, background: C.purple, boxShadow: `0 0 ${10 + hit(f, at, 10) * 20}px ${C.purple}`}} />
      <div style={{width: 40 * line, height: 2, background: C.purple}} />
      <div
        dir="rtl"
        style={{
          fontFamily: text.includes('English') ? EN : AR,
          fontWeight: 600,
          fontSize: 30,
          color: '#fff',
          background: C.ink,
          padding: '8px 22px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          clipPath: `inset(0 ${(1 - t) * 100}% 0 0 round 999px)`,
          boxShadow: '0 10px 24px rgba(29,29,31,.25)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// A perspective grid floor that fades in under the floating panels.
const Grid: React.FC<{f: number; o: number}> = ({f, o}) => (
  <div style={{position: 'absolute', left: -1000, right: -1000, top: 1250, height: 1400, opacity: o * 0.9, transform: 'perspective(900px) rotateX(72deg)', transformOrigin: 'top center', maskImage: 'radial-gradient(ellipse at 50% 0%, #000 0%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, #000 0%, transparent 70%)'}}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(116,49,244,.22) 2px, transparent 2px), linear-gradient(90deg, rgba(116,49,244,.22) 2px, transparent 2px)',
        backgroundSize: '90px 90px',
        backgroundPosition: `0 ${(f * 3) % 90}px`,
      }}
    />
  </div>
);

// A bright scan line sweeping down the frame as the page comes apart.
const Scan: React.FC<{f: number; at: number}> = ({f, at}) => {
  const t = (f - at) / 18;
  if (t < 0 || t > 1) return null;
  const y = easeInOut(t) * 1920;
  return (
    <>
      <div style={{position: 'absolute', left: 0, right: 0, top: y - 160, height: 160, background: 'linear-gradient(180deg, transparent, rgba(169,139,255,.18))'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: y - 2, height: 4, background: '#fff', boxShadow: `0 0 30px 8px ${C.purpleLight}`}} />
    </>
  );
};
