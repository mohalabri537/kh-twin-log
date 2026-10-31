import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useScreen} from './screen';
import {rrect, shapeGeo} from './stage';

// A 16-inch laptop modelled from real measurements (355.7 x 248.1 mm; a 345 x 223 mm display; 1 unit = 100 mm), with no
// logos. Silver aluminium base with black keys set into the deck (their own matte material), a half-height function row,
// speaker grilles either side and a large trackpad; a dark hinge barrel; a slim lid whose glossy black glass carries
// the camera notch and a thin border round the display, which plays the desktop recording of the website (frames in
// public/rec/<name>/, 1440 x 900) under a menu bar and browser bar.
const BW = 3.557, BD = 2.481, BT = 0.11, LT = 0.055, LH = 2.43;
const SW = 3.45, SH = SW / 1.547; // the display
const EDGE = 0.012; // aluminium visible round the glass
const ALU = {color: '#cdd0d4', metalness: 0.92, roughness: 0.3, clearcoat: 0.15, clearcoatRoughness: 0.4, envMapIntensity: 1.25};

// deck layout on a 4096 x 2857 canvas (the base's top, hinge side at the top of the canvas)
const CW = 4096, CH = Math.round((CW * BD) / BW);
const mm = CW / 355.7; // canvas px per mm
const KEYS = (() => {
  const out: [number, number, number, number][] = []; // x, y, w, h in canvas px
  const pitch = 18.9 * mm, gap = 2.3 * mm, left = (355.7 - 280) / 2 * mm, top = 12 * mm;
  const rows: number[][] = [
    Array(14).fill(1), // function row (half height) handled below
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
    [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.7],
    [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.2],
    [1, 1, 1, 1.25, 5.25, 1.25, 1, 1, 1, 1],
  ];
  let y = top;
  rows.forEach((row, r) => {
    const h = r === 0 ? 10 * mm : pitch - gap;
    const total = row.reduce((a, b) => a + b, 0);
    const unit = (14.8 * pitch - gap * 0) / total; // every row spans the same width
    let x = left;
    row.forEach((u) => { out.push([x, y, u * unit - gap, h]); x += u * unit; });
    y += h + gap;
  });
  return out;
})();

const deckTexture = () => {
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d')!;
  // aluminium, very faintly lighter towards the front
  const grd = g.createLinearGradient(0, 0, 0, CH); grd.addColorStop(0, '#c9ccd0'); grd.addColorStop(1, '#d7d9dc');
  g.fillStyle = grd; g.fillRect(0, 0, CW, CH);
  // the keys sit in slightly darker cut-outs
  g.fillStyle = 'rgba(0,0,0,.35)';
  for (const [x, y, w, h] of KEYS) { g.beginPath(); g.roundRect(x - 4, y - 4, w + 8, h + 8, 14); g.fill(); }
  // speaker grilles either side of the keyboard
  g.fillStyle = 'rgba(0,0,0,.30)';
  for (const x0 of [12 * mm, (355.7 - 34) * mm]) for (let y = 14 * mm; y < 112 * mm; y += 2.6 * mm) for (let x = 0; x < 22 * mm; x += 2.6 * mm) { g.beginPath(); g.arc(x0 + x, y, 0.55 * mm, 0, Math.PI * 2); g.fill(); }
  // trackpad
  const tw = 160 * mm, th = 99 * mm, tx = (CW - tw) / 2, ty = 130 * mm;
  g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.roundRect(tx, ty, tw, th, 7 * mm); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; g.stroke();
  // the finger scoop at the front edge
  const sg = g.createRadialGradient(CW / 2, CH, 0, CW / 2, CH, 32 * mm); sg.addColorStop(0, 'rgba(0,0,0,.22)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sg; g.fillRect(CW / 2 - 40 * mm, CH - 30 * mm, 80 * mm, 30 * mm);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  return t;
};
// the keys themselves, as an alpha mask for a matte black layer just above the deck
const keyMask = () => {
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, CW, CH);
  g.fillStyle = '#fff';
  for (const [x, y, w, h] of KEYS) { g.beginPath(); g.roundRect(x, y, w, h, 12); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 16;
  return t;
};

export const Laptop3D: React.FC<{rec: string; frames: number; rate?: number; start?: number; open?: number} & JSX.IntrinsicElements['group']> = ({rec, frames, rate = 1, start = 0, open = 1.92, ...g}) => {
  const tex = useScreen({rec, frames, rate, start, w: 1440, h: Math.round(1440 / 1.547), chrome: true});
  const geo = useMemo(() => {
    const base = new THREE.ExtrudeGeometry(rrect(BW, BD, 0.11), {depth: BT - 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 6, curveSegments: 32});
    base.rotateX(-Math.PI / 2); base.translate(0, 0.015, 0);
    const lid = new THREE.ExtrudeGeometry(rrect(BW, LH, 0.1), {depth: LT - 0.016, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 5, curveSegments: 32});
    lid.translate(0, LH / 2, -(LT - 0.016) - 0.008);
    const glass = shapeGeo(rrect(BW - 2 * EDGE, LH - 2 * EDGE, 0.09), 32);
    glass.translate(0, LH / 2, 0.0015);
    const screen = shapeGeo(rrect(SW, SH, 0.012), 6);
    screen.translate(0, LH - EDGE - 0.052 - SH / 2, 0.003);
    const notch = shapeGeo(rrect(0.29, 0.14, 0.03), 8);
    notch.translate(0, LH - EDGE - 0.052, 0.0045);
    return {base, lid, glass, screen, notch};
  }, []);
  const deck = useMemo(deckTexture, []);
  const keys = useMemo(keyMask, []);
  return (
    <group {...g}>
      <mesh geometry={geo.base}><meshPhysicalMaterial {...ALU} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BT + 0.0008, 0]}>
        <planeGeometry args={[BW - 0.03, BD - 0.03]} />
        <meshPhysicalMaterial map={deck} metalness={0.85} roughness={0.34} envMapIntensity={1.2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BT + 0.0028, 0]}>
        <planeGeometry args={[BW - 0.03, BD - 0.03]} />
        <meshPhysicalMaterial color="#0c0c0e" alphaMap={keys} transparent roughness={0.55} metalness={0} clearcoat={0.3} clearcoatRoughness={0.5} />
      </mesh>
      {/* hinge barrel */}
      <mesh position={[0, BT + 0.02, -BD / 2 + 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, BW - 0.5, 24]} />
        <meshPhysicalMaterial color="#1a1a1d" roughness={0.45} metalness={0.4} />
      </mesh>
      {/* the lid, hinged at the back edge of the base */}
      <group position={[0, BT + 0.02, -BD / 2 + 0.05]} rotation={[-(open - Math.PI / 2), 0, 0]}>
        <mesh geometry={geo.lid}><meshPhysicalMaterial {...ALU} /></mesh>
        <mesh geometry={geo.glass}><meshPhysicalMaterial color="#010102" roughness={0.03} metalness={0} clearcoat={1} clearcoatRoughness={0.02} envMapIntensity={1.5} /></mesh>
        <mesh geometry={geo.screen}><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <mesh geometry={geo.notch}><meshBasicMaterial color="#010102" /></mesh>
        {/* glass over the display: a faint reflection of the studio */}
        <mesh geometry={geo.glass} position={[0, 0, 0.004]}>
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.06} roughness={0.02} clearcoat={1} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};
