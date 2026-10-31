import {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';

// A screen texture for the 3D devices, drawn from the recorded frames (public/rec/<name>/0000.jpg ...): the frame for the
// current video time, optionally under an iOS-style status bar, painted onto a canvas the screen samples from.
// Deterministic: each video frame is loaded before the frame renders (delayRender).
const pad = (i: number) => String(i).padStart(4, '0');

const drawStatusBar = (g: CanvasRenderingContext2D, w: number, h: number) => {
  const k = w / 390;
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#000'; g.font = `600 ${16.5 * k}px Inter, sans-serif`; g.textBaseline = 'middle';
  g.fillText('9:41', 40 * k, h * 0.56);
  for (let i = 0; i < 4; i++) g.fillRect((300 + i * 4.7) * k, h * 0.56 + (4 - i * 2.4) * k, 3.2 * k, (3 + i * 2.4) * k);
  g.lineWidth = 1.6 * k; g.strokeStyle = '#000';
  for (const r of [7, 3.6]) { g.beginPath(); g.arc(330 * k, h * 0.56 + 5 * k, r * k, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1 * k; g.strokeRect(343 * k, h * 0.56 - 5.5 * k, 22 * k, 11 * k);
  g.fillRect(344.5 * k, h * 0.56 - 4 * k, 17 * k, 8 * k);
};

export const useScreen = ({rec, frames, rate = 1, start = 0, w, h, statusBar = 0}: {rec: string; frames: number; rate?: number; start?: number; w: number; h: number; statusBar?: number}) => {
  const f = useCurrentFrame();
  const i = Math.max(0, Math.min(frames - 1, Math.floor(start + f * rate)));
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }, [w, h]);
  const tex = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }, [canvas]);
  const [, setDrawn] = useState(-1);
  const {advance} = useThree();
  useEffect(() => {
    const handle = delayRender(`screen ${rec} ${i}`);
    const img = new Image();
    img.onload = () => {
      const g = canvas.getContext('2d')!;
      const sb = statusBar * (w / 390);
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, sb, w, (img.height * w) / img.width);
      if (statusBar) drawStatusBar(g, w, sb);
      tex.needsUpdate = true;
      setDrawn(i);
      // draw the 3D frame again with the new picture before the frame is captured
      requestAnimationFrame(() => { advance(performance.now()); continueRender(handle); });
    };
    img.onerror = () => continueRender(handle);
    img.src = staticFile(`rec/${rec}/${pad(i)}.jpg`);
  }, [i, rec, canvas, tex, w, h, statusBar]);
  return tex;
};
