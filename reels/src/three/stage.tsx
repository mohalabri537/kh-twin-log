import React, {useEffect, useMemo} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

// A product-photography stage, lit by a photographed studio: Poly Haven's "Studio Small 09" (CC0), a white cyclorama
// with octagonal softboxes and a dark side, as an environment map (reflections and soft light from every direction),
// plus a key light that casts soft shadows. Neutral filmic tone mapping keeps colours true.
// The studio photograph as an ordinary image (public/hdri/studio_small_09.png, converted from the .hdr 1.5 stops darker so
// the softboxes keep their detail), wrapped round a sphere and baked into the environment, brightened back by 2^1.5.
// (The headless renderer cannot turn half-float .hdr images into an environment.)
export const STUDIO_IMG = 'hdri/studio_small_09.png';
let imgLoad: Promise<THREE.Texture> | null = null;
const loadImg = () => (imgLoad ??= new Promise((res, rej) => new THREE.TextureLoader().load(staticFile(STUDIO_IMG), res, undefined, rej)));

export const Studio: React.FC<{exposure?: number; turn?: number; intensity?: number; shadow?: boolean}> = ({exposure = 1, turn = 0, intensity = 1, shadow = true}) => {
  const {gl, scene, advance} = useThree();
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = exposure;
  gl.outputColorSpace = THREE.SRGBColorSpace;
  useEffect(() => {
    const handle = delayRender('studio light');
    loadImg().then((img) => {
      img.colorSpace = THREE.SRGBColorSpace;
      img.mapping = THREE.EquirectangularReflectionMapping;
      const room = new THREE.Scene();
      const mat = new THREE.MeshBasicMaterial({map: img, side: THREE.BackSide, toneMapped: false});
      mat.color.setScalar(Math.pow(2, 1.5));
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(10, 96, 48), mat);
      sphere.scale.x = -1; // seen from inside, not mirrored
      room.add(sphere);
      // the softboxes a product photographer adds: a broad one overhead (what flat tops like a laptop's deck reflect),
      // tall ones either side, and a broad soft light high behind
      const panel = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(k, k, k * 1.02), side: THREE.DoubleSide, toneMapped: false}));
        m.position.set(...pos); m.rotation.set(...rot); room.add(m);
      };
      panel(9, 5, [0, 6.5, 1], [Math.PI / 2, 0, 0], 2.6);
      panel(3, 9, [-6, 1, 3], [0, Math.PI / 2.4, 0], 2.4);
      panel(3, 9, [6, 1, 2], [0, -Math.PI / 2.4, 0], 1.8);
      panel(12, 5, [0, 4, -7], [0.35, 0, 0], 1.2);
      const pm = new THREE.PMREMGenerator(gl);
      scene.environment = pm.fromScene(room, 0.01).texture; // set directly, so the very next draw has it
      pm.dispose();
      // draw again with the light in place before the frame is captured
      requestAnimationFrame(() => { advance(performance.now()); continueRender(handle); });
    }, () => continueRender(handle));
  }, [gl, scene, advance]);
  scene.environmentRotation.set(0, turn, 0);
  scene.environmentIntensity = intensity;
  return (
    <>
      {shadow && (
        <directionalLight position={[-3, 7, 5]} intensity={0.9} castShadow shadow-mapSize={[4096, 4096]} shadow-radius={8} shadow-bias={-0.0004}
          shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-camera-near={0.5} shadow-camera-far={25} />
      )}
    </>
  );
};

// A floor that only shows the shadows falling on it (the backdrop shows through everywhere else).
export const ShadowFloor: React.FC<{size?: number; opacity?: number} & JSX.IntrinsicElements['mesh']> = ({size = 14, opacity = 0.22, ...m}) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow {...m}>
    <planeGeometry args={[size, size]} />
    <shadowMaterial transparent opacity={opacity} />
  </mesh>
);

// Surface textures, drawn once: fine random grain, softened, for roughness and bump maps.
//  - 'bead': bead-blasted aluminium (laptop): even, very fine
//  - 'frost': frosted back glass: a little coarser
export const grain = (kind: 'bead' | 'frost', size = 1024) => {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  let s = kind === 'bead' ? 7 : 13;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (rnd() - 0.5) * (kind === 'bead' ? 90 : 140);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  g.filter = `blur(${kind === 'bead' ? 0.6 : 1.1}px)`; g.drawImage(c, 0, 0); g.filter = 'none';
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(kind === 'bead' ? 6 : 3, kind === 'bead' ? 6 : 3);
  return t;
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
