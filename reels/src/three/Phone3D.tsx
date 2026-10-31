import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useScreen} from './screen';
import {rrect, shapeGeo} from './stage';

// A phone modelled from real proportions (77.6 x 163 x 8.25 mm; 1 unit = 100 mm), no logos: a bevelled metal band,
// black glass front with the screen and camera island, a glass back with a camera plateau. The screen plays a
// recording of the website (frames in public/rec/<name>/, 390 x 844 CSS px) under an iOS-style status bar.
const W = 0.776, H = 1.63, T = 0.0825, R = 0.112;
const SW = 0.735, SH = SW * (844 / 390), SR = 0.098; // the screen: same proportions as the recordings

export const Phone3D: React.FC<{rec: string; frames: number; rate?: number; start?: number; color?: string} & JSX.IntrinsicElements['group']> = ({rec, frames, rate = 1, start = 0, color = '#c9c9ce', ...g}) => {
  const tex = useScreen({rec, frames, rate, start, w: 780, h: 1688, statusBar: 54});
  const geo = useMemo(() => {
    const body = new THREE.ExtrudeGeometry(rrect(W - 0.02, H - 0.02, R - 0.01), {depth: T - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 8, curveSegments: 32});
    body.translate(0, 0, -(T - 0.02) / 2);
    const glass = shapeGeo(rrect(W - 0.012, H - 0.012, R - 0.006), 32);
    const sbH = SW * (54 / 390); // status bar, CSS 54 px
    const screen = shapeGeo(rrect(SW, SH, SR), 32);
    const island = shapeGeo(rrect(0.205, 0.06, 0.03), 16);
    const plateau = new THREE.ExtrudeGeometry(rrect(0.33, 0.33, 0.07), {depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4, curveSegments: 16});
    return {body, glass, screen, island, plateau, sbH};
  }, []);
  const z = T / 2;
  return (
    <group {...g}>
      <mesh geometry={geo.body}>
        <meshPhysicalMaterial color={color} metalness={1} roughness={0.22} clearcoat={0.4} clearcoatRoughness={0.2} envMapIntensity={1.2} />
      </mesh>
      {/* black glass front */}
      <mesh geometry={geo.glass} position={[0, 0, z + 0.0006]}>
        <meshPhysicalMaterial color="#020203" roughness={0.04} metalness={0} clearcoat={1} clearcoatRoughness={0.02} envMapIntensity={1.4} />
      </mesh>
      {/* the screen: the website, then the status bar over its top */}
      <mesh geometry={geo.screen} position={[0, 0, z + 0.0012]}>
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.island} position={[0, SH / 2 - 0.058, z + 0.0018]}>
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* glass over everything: a faint reflection of the studio */}
      <mesh geometry={geo.glass} position={[0, 0, z + 0.0022]}>
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.02} metalness={0} clearcoat={1} envMapIntensity={1} depthWrite={false} />
      </mesh>
      {/* back: frosted glass and the camera plateau */}
      <mesh geometry={geo.glass} position={[0, 0, -z - 0.0006]} rotation={[0, Math.PI, 0]}>
        <meshPhysicalMaterial color={color} roughness={0.55} metalness={0.2} clearcoat={0.6} />
      </mesh>
      <group position={[0.17, 0.6, -z - 0.002]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geo.plateau}>
          <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.6} clearcoat={0.8} />
        </mesh>
        {[[-0.075, 0.075], [-0.075, -0.075], [0.075, 0]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0.016]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.052, 0.014, 40]} />
            <meshPhysicalMaterial color="#0b0b10" roughness={0.1} metalness={0.4} clearcoat={1} />
          </mesh>
        ))}
      </group>
      {/* side buttons */}
      {[[-1, 0.42, 0.06], [-1, 0.27, 0.11], [-1, 0.12, 0.11], [1, 0.3, 0.17], [1, -0.18, 0.1]].map(([s, y, h], i) => (
        <mesh key={i} position={[s * (W / 2 + 0.002), y, 0]}>
          <boxGeometry args={[0.012, h, 0.03]} />
          <meshPhysicalMaterial color={color} metalness={1} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
};
