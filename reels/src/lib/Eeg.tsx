import React, {useMemo} from 'react';
import {random} from 'remotion';

// Brainwave lines: layered sines + occasional spikes, seeded so every render matches.
export const eegPath = (seed: string, width: number, amp: number, step = 4, spikes = 6) => {
  const fr = [0.011, 0.023, 0.041, 0.077, 0.13].map((f, i) => f * (0.7 + random(`${seed}f${i}`) * 0.6));
  const ph = fr.map((_, i) => random(`${seed}p${i}`) * 6.28);
  const am = [1, 0.7, 0.5, 0.35, 0.25];
  const sp = Array.from({length: spikes}, (_, i) => ({x: random(`${seed}s${i}`) * width, h: (random(`${seed}h${i}`) - 0.3) * 2.6}));
  let d = '';
  for (let x = 0; x <= width; x += step) {
    let y = 0;
    for (let i = 0; i < fr.length; i++) y += Math.sin(x * fr[i] + ph[i]) * am[i];
    for (const s of sp) y += s.h * Math.exp(-Math.pow((x - s.x) / 9, 2)) * 2;
    d += `${x === 0 ? 'M' : 'L'}${x.toFixed(1)},${(y * amp).toFixed(1)}`;
  }
  return d;
};

// Wave value at x, for placing the pen tip exactly on the line.
export const EegLines: React.FC<{
  width: number;
  channels: number;
  gap: number;
  progress: number; // 0..1 of width drawn
  main?: number; // index of the glowing channel
  amp?: number;
  color?: string;
}> = ({width, channels, gap, progress, main = -1, amp = 14, color = '#A98BFF'}) => {
  const paths = useMemo(() => Array.from({length: channels}, (_, i) => eegPath(`ch${i}`, width, i === main ? amp * 2.4 : amp)), [width, channels, main, amp]);
  const clip = progress * width;
  return (
    <svg width={width} height={channels * gap} style={{overflow: 'visible'}}>
      <defs>
        <clipPath id="eegclip">
          <rect x={0} y={-400} width={clip} height={channels * gap + 800} />
        </clipPath>
        <filter id="eegglow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g clipPath="url(#eegclip)">
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            transform={`translate(0, ${i * gap + gap / 2})`}
            fill="none"
            stroke={i === main ? color : 'rgba(245,245,247,.28)'}
            strokeWidth={i === main ? 5 : 2}
            strokeLinejoin="round"
            filter={i === main ? 'url(#eegglow)' : undefined}
          />
        ))}
      </g>
      {/* pen tip */}
      <circle cx={clip} cy={main >= 0 ? main * gap + gap / 2 : 0} r={main >= 0 ? 12 : 0} fill="#fff" filter="url(#eegglow)" />
    </svg>
  );
};
