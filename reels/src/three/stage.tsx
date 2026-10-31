import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

// A product-photography stage. The light comes from large softboxes baked into an environment map, so metal and glass
// pick up long, clean highlights. 'light': a bright white studio with a few dark flags for contrast (silver reads as
// silver on a light set); 'dark': a black studio lit only by the softboxes.
export const Studio: React.FC<{exposure?: number; tone?: 'light' | 'dark'}> = ({exposure = 1, tone = 'light'}) => {
  const {gl} = useThree();
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposure;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  const env = useMemo(() => {
    const room = new THREE.Scene();
    const wall = tone === 'light' ? 0.3 : 0.02; // mid-grey walls: silver keeps its light-to-dark gradients
    room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({color: new THREE.Color(wall, wall, wall * 1.03), side: THREE.BackSide})));
    const panel = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(k, k, k * 1.02), side: THREE.DoubleSide}));
      m.position.set(...pos); m.rotation.set(...rot); room.add(m);
    };
    if (tone === 'light') {
      panel(4, 14, [-7, 1, 4], [0, Math.PI / 2.4, 0], 3.2); // tall softbox, left
      panel(4, 14, [7, 1, 3], [0, -Math.PI / 2.4, 0], 2.4); // tall softbox, right
      panel(12, 4, [0, 9, 2], [Math.PI / 2, 0, 0], 2.6); // overhead
      panel(3, 14, [-4, 0, -7], [0, 0.4, 0], 0.03); // dark flags, so edges have definition
      panel(3, 14, [5, 0, -7], [0, -0.4, 0], 0.03);
      panel(14, 3, [0, -8, 0], [Math.PI / 2, 0, 0], 0.08);
      panel(16, 7, [0, 5, -9], [0.35, 0, 0], 1.5); // a broad soft light high behind: what a laptop's deck reflects
    } else {
      panel(3, 12, [-7, 1, 3], [0, Math.PI / 2.4, 0], 6);
      panel(3, 12, [7, 1, 2], [0, -Math.PI / 2.4, 0], 4);
      panel(10, 2.5, [0, 8, 2], [Math.PI / 2, 0, 0], 2.5);
      panel(8, 1.2, [0, -2, -8], [0, 0, 0], 1.6);
    }
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(room, 0.02).texture;
    pm.dispose();
    return tex;
  }, [gl, tone]);
  // set on the scene before its first frame is drawn
  return <primitive attach="environment" object={env} />;
};

// A soft contact shadow: a blurred ellipse lying under an object (radius in scene units).
export const SoftShadow: React.FC<{w: number; d: number; opacity?: number} & JSX.IntrinsicElements['mesh']> = ({w, d, opacity = 0.35, ...m}) => {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(20,10,40,1)'); grd.addColorStop(0.45, 'rgba(20,10,40,.55)'); grd.addColorStop(1, 'rgba(20,10,40,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} {...m}>
      <planeGeometry args={[w, d]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  );
};

// A rounded rectangle as a shape, centred on the origin.
export const rrect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

// A flat shape with UVs spread over its bounding box (so a texture fills it).
export const shapeGeo = (shape: THREE.Shape, segments = 24) => {
  const g = new THREE.ShapeGeometry(shape, segments);
  g.computeBoundingBox();
  const bb = g.boundingBox!, p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (p.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  uv.needsUpdate = true;
  return g;
};
