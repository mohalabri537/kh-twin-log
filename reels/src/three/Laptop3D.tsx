import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useScreen} from './screen';
import {rrect, shapeGeo} from './stage';

// A 16-inch laptop modelled from real proportions (356 x 248 x 17 mm; 1 unit = 100 mm), no logos: an aluminium base
// with a keyboard and trackpad, and a lid open `open` radians from the base (pi/2 = upright), whose screen plays a desktop recording of
// the website (frames in public/rec/<name>/, 1440 x 900) under a thin menu bar and browser bar.
const BW = 3.557, BD = 2.481, BT = 0.12, LT = 0.06;
const SW = 3.36, SH = SW * (2234 / 3456);
const ALU = {color: '#cfd0d4', metalness: 0.9, roughness: 0.32, clearcoat: 0.2, envMapIntensity: 1.1};

const keyboard = () => {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1430;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c9cace'; g.fillRect(0, 0, c.width, c.height);
  // speaker grilles
  g.fillStyle = 'rgba(0,0,0,.18)';
  for (let y = 70; y < 640; y += 22) for (const x0 of [40, 1928]) for (let x = 0; x < 80; x += 22) { g.beginPath(); g.arc(x0 + x, y, 4, 0, Math.PI * 2); g.fill(); }
  // keys: six rows in a well
  g.fillStyle = '#18181b'; g.fillRect(170, 60, 1708, 590);
  const rows = [[14, 0.55], [14, 1], [14, 1], [13, 1], [12, 1], [9, 1]];
  let y = 72;
  rows.forEach(([n, h], r) => {
    const kh = 88 * h, kw = (1684 - (n - 1) * 10) / n;
    for (let i = 0; i < n; i++) {
      const w = r === 5 && i === 4 ? kw * 4 : kw;
      if (r === 5 && i > 4 && i < 8) continue;
      g.fillStyle = '#2a2a2e'; g.beginPath(); g.roundRect(182 + i * (kw + 10), y, r === 5 && i === 4 ? kw * 4 + 30 : w, kh, 10); g.fill();
    }
    y += kh + 10;
  });
  // trackpad
  g.fillStyle = 'rgba(0,0,0,.06)'; g.beginPath(); g.roundRect(660, 720, 730, 560, 26); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 3; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};

export const Laptop3D: React.FC<{rec: string; frames: number; rate?: number; start?: number; open?: number} & JSX.IntrinsicElements['group']> = ({rec, frames, rate = 1, start = 0, open = 1.86, ...g}) => {
  const tex = useScreen({rec, frames, rate, start, w: 1440, h: 931, chrome: true});
  const geo = useMemo(() => {
    const base = new THREE.ExtrudeGeometry(rrect(BW, BD, 0.16), {depth: BT - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 5, curveSegments: 24});
    base.rotateX(-Math.PI / 2); base.translate(0, 0.02, 0);
    const lid = new THREE.ExtrudeGeometry(rrect(BW, BD - 0.02, 0.16), {depth: LT - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4, curveSegments: 24});
    lid.translate(0, (BD - 0.02) / 2, -(LT - 0.02));
    const bezel = shapeGeo(rrect(BW - 0.03, BD - 0.05, 0.15), 24);
    bezel.translate(0, (BD - 0.02) / 2, 0.012);
    const screen = shapeGeo(rrect(SW, SH, 0.03), 8);
    screen.translate(0, (BD - 0.02) / 2 - 0.02, 0.014);
    const deck = new THREE.PlaneGeometry(BW - 0.06, BD - 0.06);
    return {base, lid, bezel, screen, deck};
  }, []);
  const keys = useMemo(keyboard, []);
  return (
    <group {...g}>
      <mesh geometry={geo.base}><meshPhysicalMaterial {...ALU} /></mesh>
      <mesh geometry={geo.deck} rotation={[-Math.PI / 2, 0, 0]} position={[0, BT + 0.001, 0]}>
        <meshPhysicalMaterial map={keys} metalness={0.5} roughness={0.45} />
      </mesh>
      {/* the lid, hinged at the back edge of the base */}
      <group position={[0, BT, -BD / 2 + 0.03]} rotation={[-(open - Math.PI / 2), 0, 0]}>
        <mesh geometry={geo.lid}><meshPhysicalMaterial {...ALU} /></mesh>
        <mesh geometry={geo.bezel}><meshPhysicalMaterial color="#050506" roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} /></mesh>
        <mesh geometry={geo.screen}><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        {/* camera notch */}
        <mesh position={[0, (BD - 0.02) / 2 + SH / 2 - 0.02 - 0.035, 0.016]}>
          <planeGeometry args={[0.32, 0.075]} />
          <meshBasicMaterial color="#050506" />
        </mesh>
      </group>
    </group>
  );
};
