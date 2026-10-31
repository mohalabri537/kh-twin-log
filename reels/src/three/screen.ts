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

// desktop: a thin menu bar and a browser toolbar with the address, above the page (w = 1440 CSS px)
const drawChrome = (g: CanvasRenderingContext2D, w: number) => {
  g.fillStyle = '#f6f6f8'; g.fillRect(0, 0, w, 30); // menu bar: as tall as the camera notch
  g.fillStyle = '#1d1d1f'; g.font = '600 14px Inter, sans-serif'; g.textBaseline = 'middle'; g.fillText('Safari', 20, 15);
  g.font = '400 14px Inter, sans-serif'; g.textAlign = 'right'; g.fillText('Fri 9:41', w - 20, 15); g.textAlign = 'left';
  g.fillStyle = '#f2f2f4'; g.fillRect(0, 30, w, 52);
  g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 81, w, 1);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(26 + i * 20, 56, 6, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = '#e4e4e8'; g.beginPath(); g.roundRect(w / 2 - 260, 42, 520, 28, 8); g.fill();
  g.fillStyle = '#3c3c43'; g.font = '400 13px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('neurouniverse.om', w / 2, 56); g.textAlign = 'left';
};
export const CHROME = 82;

export const useScreen = ({rec, frames, rate = 1, start = 0, w, h, statusBar = 0, chrome = false}: {rec: string; frames: number; rate?: number; start?: number; w: number; h: number; statusBar?: number; chrome?: boolean}) => {
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
      const top = chrome ? CHROME * (w / 1440) : statusBar * (w / 390);
      g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, top, w, (img.height * w) / img.width);
      if (chrome) drawChrome(g, w);
      else if (statusBar) drawStatusBar(g, w, top);
      tex.needsUpdate = true;
      setDrawn(i);
      // draw the 3D frame again with the new picture before the frame is captured
      requestAnimationFrame(() => { advance(performance.now()); continueRender(handle); });
    };
    img.onerror = () => continueRender(handle);
    img.src = staticFile(`rec/${rec}/${pad(i)}.jpg`);
  }, [i, rec, canvas, tex, w, h, statusBar, chrome]);
  return tex;
};
