import React, {useMemo} from 'react';
import {random} from 'remotion';
import {getLength, getPointAtLength, getSubpaths} from '@remotion/paths';
import {LOGO_D} from '../logoPath';
import {clamp, easeInOut, lerp} from './chase';

// A 3D field of neurons the camera flies through. Neurons fire pulses along their links, and on cue the
// whole network pulls together into the outline of the NU logo. Everything is seeded, so renders repeat exactly.

const N = 260;

type Node = {x: number; y: number; z: number; d: number; nb: number[]};

const useNodes = () =>
  useMemo(() => {
    const nodes: Node[] = Array.from({length: N}, (_, i) => ({
      x: (random(`nx${i}`) - 0.5) * 3400,
      y: (random(`ny${i}`) - 0.5) * 5600,
      z: 300 + random(`nz${i}`) * 3000,
      d: random(`nd${i}`),
      nb: [],
    }));
    // link each neuron to its two nearest neighbours
    for (let i = 0; i < N; i++) {
      const dist = nodes.map((o, j) => ({j, d: j === i ? Infinity : (o.x - nodes[i].x) ** 2 + (o.y - nodes[i].y) ** 2 + (o.z - nodes[i].z) ** 2}));
      dist.sort((a, b) => a.d - b.d);
      nodes[i].nb = [dist[0].j, dist[1].j];
    }
    return nodes;
  }, []);

// Points along the logo outline, one per neuron, kept per outline so links never jump between shapes.
const useLogoPoints = () =>
  useMemo(() => {
    const subs = getSubpaths(LOGO_D);
    const lens = subs.map((s) => getLength(s));
    const total = lens.reduce((a, b) => a + b, 0);
    const pts: {x: number; y: number; sub: number; first: boolean}[] = [];
    subs.forEach((s, k) => {
      const n = k === subs.length - 1 ? N - pts.length : Math.round((N * lens[k]) / total);
      for (let i = 0; i < n; i++) {
        const p = getPointAtLength(s, (lens[k] * i) / n);
        pts.push({x: p?.x ?? 0, y: p?.y ?? 0, sub: k, first: i === 0});
      }
    });
    return pts;
  }, []);

export type NeuralProps = {
  f: number;
  mode: 'dark' | 'light';
  fly?: number; // forward camera speed, px per frame
  travel?: number; // or: total distance flown so far (overrides fly)
  morph?: number; // 0 → free network, 1 → logo outline
  logo?: {cx: number; cy: number; scale: number};
  fire?: number; // 0..1 how many neurons are firing
  opacity?: number;
};

export const Neural: React.FC<NeuralProps> = ({f, mode, fly = 26, travel, morph = 0, logo = {cx: 540, cy: 960, scale: 430}, fire = 1, opacity = 1}) => {
  const nodes = useNodes();
  const L = useLogoPoints();
  const dark = mode === 'dark';
  const nodeColor = dark ? '#D9CCFF' : '#7431F4';
  const lineColor = dark ? '169,139,255' : '116,49,244';

  // where each neuron is on screen this frame
  const P = nodes.map((n, i) => {
    let z = n.z - (travel ?? f * fly);
    z = ((((z - 300) % 3000) + 3000) % 3000) + 300;
    const s = 900 / z;
    const free = {x: 540 + n.x * s, y: 960 + n.y * s};
    const near = clamp((z - 300) / 250, 0, 1) * clamp((3300 - z) / 600, 0, 1);
    const t = easeInOut(clamp((morph - n.d * 0.45) / 0.55, 0, 1));
    const tgt = {x: logo.cx + L[i].x * logo.scale, y: logo.cy + L[i].y * logo.scale};
    return {
      x: lerp(free.x, tgt.x, t),
      y: lerp(free.y, tgt.y, t),
      r: lerp(1.2 + 7 * s, 3.2, t),
      a: lerp(near, 1, t),
      s,
      t,
    };
  });

  const lines: React.ReactNode[] = [];
  // network links, fading out as the logo forms
  nodes.forEach((n, i) =>
    n.nb.forEach((j) => {
      if (j < i && nodes[j].nb.includes(i)) return;
      const a = Math.min(P[i].a, P[j].a) * (1 - Math.max(P[i].t, P[j].t));
      if (a < 0.03) return;
      lines.push(<line key={`n${i}-${j}`} x1={P[i].x} y1={P[i].y} x2={P[j].x} y2={P[j].y} stroke={`rgba(${lineColor},${a * 0.5})`} strokeWidth={0.6 + P[i].s * 1.6} />);
    }),
  );
  // logo outline links, fading in
  for (let i = 0; i < N; i++) {
    const j = i + 1 < N && !L[i + 1].first ? i + 1 : L.findIndex((p) => p.sub === L[i].sub);
    const a = P[i].t * P[j].t;
    if (a < 0.03) continue;
    lines.push(<line key={`l${i}`} x1={P[i].x} y1={P[i].y} x2={P[j].x} y2={P[j].y} stroke={`rgba(${lineColor},${a * 0.95})`} strokeWidth={3.2} strokeLinecap="round" />);
  }

  // firing pulses travelling along links
  const pulses: React.ReactNode[] = [];
  const count = Math.round(110 * fire);
  for (let k = 0; k < count; k++) {
    const i = Math.floor(random(`pi${k}`) * N);
    const j = nodes[i].nb[0];
    const period = 18 + Math.floor(random(`pp${k}`) * 14);
    const phase = Math.floor(random(`ph${k}`) * period);
    const u = ((f + phase) % period) / 10;
    if (u > 1) continue;
    const a = Math.min(P[i].a, P[j].a) * (1 - Math.max(P[i].t, P[j].t) * 0.7);
    if (a < 0.05) continue;
    pulses.push(<circle key={`p${k}`} cx={lerp(P[i].x, P[j].x, u)} cy={lerp(P[i].y, P[j].y, u)} r={2 + P[i].s * 9} fill={dark ? '#fff' : '#A98BFF'} opacity={a * Math.sin(u * Math.PI)} />);
  }

  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity}}>
      <defs>
        <filter id={`glow-${mode}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={dark ? 6 : 4} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g>{lines}</g>
      <g filter={`url(#glow-${mode})`}>
        {P.map((p, i) => (p.a > 0.03 ? <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={nodeColor} opacity={p.a} /> : null))}
        {pulses}
      </g>
    </svg>
  );
};
