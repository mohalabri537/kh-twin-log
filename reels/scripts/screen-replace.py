"""Puts the website on a filmed (or AI-generated) phone whose screen is chroma-key green.

For every frame: find the green screen, fit a straight line to each of its four sides (so rounded corners don't matter),
intersect them for the four corners, smooth those corners over time, warp the website recording (with a status bar)
into place, and blend it in through the green area itself, so the rounded corners and the camera cutout stay exactly as
filmed. A faint sheen keeps the glass alive; green spill on the bezel is neutralised.

Usage: python3 scripts/screen-replace.py <green.mp4> <rec-frames-dir> <out.mp4> [--start N] [--rate R] [--crop9x16 CX]
  rec-frames-dir: public/rec/<name> (390 x 844 CSS px pages); --crop9x16 CX crops a 16:9 source to 9:16 around x = CX."""
import argparse
import glob
import os
import subprocess

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('rec'); ap.add_argument('out')
ap.add_argument('--start', type=int, default=0); ap.add_argument('--rate', type=float, default=1.0)
ap.add_argument('--crop9x16', type=float, default=None)
a = ap.parse_args()

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
recs = sorted(glob.glob(os.path.join(a.rec, '*.jpg')))


def screen_image(i):
    """The page at recording frame i under an iOS-style status bar, 1170 x 2532 (3x of 390 x 844)."""
    src = Image.open(recs[min(len(recs) - 1, i)]).convert('RGB')
    W = 1170; k = W / 390; H = round(844 * k); sb = round(54 * k)
    scr = Image.new('RGB', (W, H), 'white')
    scr.paste(src.resize((W, round(src.height * W / src.width)), Image.LANCZOS), (0, sb))
    d = ImageDraw.Draw(scr); d.rectangle((0, 0, W, sb), fill='white'); y = int(sb * 0.6)
    d.text((120, y), '9:41', fill='black', font=ImageFont.truetype(FONT, 46), anchor='lm')
    for j in range(4): d.rectangle((900 + j * 15, y + 8 - j * 8, 910 + j * 15, y + 18), fill='black')
    d.rounded_rectangle((1020, y - 14, 1080, y + 14), 6, outline=(0, 0, 0), width=3); d.rectangle((1026, y - 8, 1066, y + 8), fill='black')
    return np.array(scr)[:, :, ::-1]


def green_mask(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    m = cv2.inRange(hsv, (38, 90, 90), (88, 255, 255))
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))


def corners(m):
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs: return None
    c = max(cs, key=cv2.contourArea)
    if cv2.contourArea(c) < 2000: return None
    pts = c.reshape(-1, 2).astype(np.float32)
    s = pts.sum(1); dd = pts[:, 0] - pts[:, 1]
    tl, br, tr, bl = pts[s.argmin()], pts[s.argmax()], pts[dd.argmax()], pts[dd.argmin()]

    def side(p, q):
        v = q - p; n = np.linalg.norm(v); v /= n
        t = (pts - p) @ v; off = np.abs((pts - p) @ np.array([-v[1], v[0]]))
        sel = (t > 0.15 * n) & (t < 0.85 * n) & (off < 0.04 * n + 4)
        if sel.sum() < 10: return p, v
        vx, vy, x0, y0 = cv2.fitLine(pts[sel], cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
        return np.array([x0, y0]), np.array([vx, vy])

    L = [side(tl, tr), side(tr, br), side(br, bl), side(bl, tl)]

    def cross(p, q):
        (u0, u), (w0, w) = p, q
        t = np.linalg.solve(np.array([u, -w]).T, w0 - u0)[0]
        return u0 + t * u

    q = np.array([cross(L[3], L[0]), cross(L[0], L[1]), cross(L[1], L[2]), cross(L[2], L[3])], np.float32)
    return q, bool(pts[:, 1].max() >= m.shape[0] - 3)  # True: the screen runs off the bottom of the frame


def despill(img, screen):
    """Remove the green the screen threw onto the floor, the bezel and the air around it: wherever green rises above
    red and blue outside the screen, pull it down to their level and tint that light lavender, like the backdrop."""
    f = img.astype(np.float32)
    B, G, R = f[..., 0], f[..., 1], f[..., 2]
    excess = np.clip(G - (R + B) / 2 + 1, 0, None) * (1 - screen)  # green above the red-blue average: the backdrop never has that
    excess = cv2.GaussianBlur(excess, (0, 0), 1.2)
    f[..., 1] = G - excess
    f[..., 2] = R + excess * 0.35  # a touch of pink-violet where the green was
    f[..., 0] = B + excess * 0.55
    return np.clip(f, 0, 255).astype(np.uint8)


cap = cv2.VideoCapture(a.src)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    if a.crop9x16 is not None:
        h, w = f.shape[:2]; cw = int(round(h * 9 / 16)); x0 = int(np.clip(a.crop9x16 - cw / 2, 0, w - cw))
        f = f[:, x0:x0 + cw]
    frames.append(f)
print(len(frames), 'frames', frames[0].shape[1], 'x', frames[0].shape[0], f'{fps:.2f} fps')

# corners for every frame, then smoothed over time (a short centred window) so the screen never jitters
masks = [green_mask(f) for f in frames]
found = [corners(m) for m in masks]
quads = [f[0] if f else None for f in found]
clipped = [bool(f and f[1]) for f in found]
# where the bottom of the screen is out of frame, its sides still run on: set the bottom corners down each side at the
# screen's own length, measured (relative to the top edge) in the nearest frame where the whole screen was visible
whole = [i for i, q in enumerate(quads) if q is not None and not clipped[i]]
ratio = lambda q: (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2 / np.linalg.norm(q[1] - q[0])
for i, q in enumerate(quads):
    if q is None or not clipped[i] or not whole: continue
    r = ratio(quads[min(whole, key=lambda j: abs(j - i))])
    top = np.linalg.norm(q[1] - q[0])
    for c, s in ((3, 0), (2, 1)):
        v = q[c] - q[s]; v /= np.linalg.norm(v)
        q[c] = q[s] + v * r * top
idx = [i for i, q in enumerate(quads) if q is not None]
Q = np.array([quads[i] if quads[i] is not None else quads[min(idx, key=lambda j: abs(j - i))] for i in range(len(frames))])
k = np.array([1, 2, 3, 2, 1], np.float32); k /= k.sum()
Qs = np.stack([np.stack([np.convolve(np.pad(Q[:, c, d], 2, mode='edge'), k, 'valid') for d in range(2)], 1) for c in range(4)], 1)

tmp = a.out + '.frames'; os.makedirs(tmp, exist_ok=True)
for i, (img, m, q) in enumerate(zip(frames, masks, Qs)):
    scr = screen_image(a.start + int(i * a.rate))
    H, W = scr.shape[:2]
    Hm = cv2.getPerspectiveTransform(np.float32([[0, 0], [W, 0], [W, H], [0, H]]), q.astype(np.float32))
    warped = cv2.warpPerspective(scr, Hm, (img.shape[1], img.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE).astype(np.float32)  # never black past the page's edge
    yy, xx = np.mgrid[0:img.shape[0], 0:img.shape[1]].astype(np.float32)
    span = max(1.0, q[1][0] - q[0][0])
    sheen = np.clip(1 - np.abs(((xx - q[0][0]) * 0.6 + (yy - q[0][1]) * 0.4) / span - 0.35 - 0.15 * i / len(frames)) * 2.2, 0, 1) * 14
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    only = np.zeros_like(m)
    if cs: cv2.drawContours(only, [max(cs, key=cv2.contourArea)], -1, 255, -1)
    screen = cv2.bitwise_and(m, only)  # the screen's green, with the camera cutout still excluded
    alpha = cv2.GaussianBlur(cv2.erode(screen, np.ones((3, 3), np.uint8)), (3, 3), 0).astype(np.float32)[..., None] / 255
    comp = np.clip(img.astype(np.float32) * (1 - alpha) + (warped + sheen[..., None]) * alpha, 0, 255).astype(np.uint8)
    comp = despill(comp, alpha[..., 0])
    cv2.imwrite(os.path.join(tmp, f'{i:04d}.png'), comp)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', f'{fps}', '-i', os.path.join(tmp, '%04d.png'),
                '-vf', 'scale=1080:1920:flags=lanczos' if a.crop9x16 is not None else 'null',
                '-c:v', 'libx264', '-crf', '15', '-preset', 'slow', '-pix_fmt', 'yuv420p', a.out], check=True)
for p in glob.glob(os.path.join(tmp, '*.png')): os.remove(p)
os.rmdir(tmp)
print('wrote', a.out)
