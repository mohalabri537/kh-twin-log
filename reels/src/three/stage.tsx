import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

// A product-photography stage: a dark studio whose only light comes from large softboxes, baked into an environment
// map so metal and glass pick up long, clean highlights (the look of a product film). No HDR files needed.
export const Studio: React.FC<{exposure?: number}> = ({exposure = 1}) => {
  const {gl} = useThree();
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.toneMappingExposure = exposure;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  const env = useMemo(() => {
    const room = new THREE.Scene();
    room.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({color: 0x050506, side: THREE.BackSide})));
    const box = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(k, k, k), side: THREE.DoubleSide}));
      m.position.set(...pos); m.rotation.set(...rot); room.add(m);
    };
    box(3, 12, [-7, 1, 3], [0, Math.PI / 2.4, 0], 6); // tall strip, left
    box(3, 12, [7, 1, 2], [0, -Math.PI / 2.4, 0], 4); // tall strip, right
    box(10, 2.5, [0, 8, 2], [Math.PI / 2, 0, 0], 2.5); // overhead
    box(8, 1.2, [0, -2, -8], [0, 0, 0], 1.6); // low back light, for rim
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(room, 0.02).texture;
    pm.dispose();
    return tex;
  }, [gl]);
  // set on the scene before its first frame is drawn
  return <primitive attach="environment" object={env} />;
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
