"""The hook's blueprint: the homepage capture (public/cap/top-ar.jpg) traced as glowing purple lines on a faint
grid, written to public/cap/top-ar-wire.jpg. Run after re-capturing: python3 scripts/make-wire.py"""
import os
import numpy as np
from PIL import Image, ImageFilter

CAP = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'cap')
im = Image.open(os.path.join(CAP, 'top-ar.jpg')).convert('RGB')
g = np.asarray(im.convert('L')).astype(float) / 255
# edges: Sobel-style magnitude on a slightly blurred copy
gb = np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(1.2))).astype(float) / 255
gx = np.zeros_like(gb); gy = np.zeros_like(gb)
gx[:, 1:-1] = gb[:, 2:] - gb[:, :-2]
gy[1:-1, :] = gb[2:, :] - gb[:-2, :]
e = np.clip((np.sqrt(gx ** 2 + gy ** 2) - 0.03) / 0.12, 0, 1) ** 0.8
fill = np.clip((1 - g) * 0.10, 0, 1)          # faint fill so photos, the logo and buttons still read as solids
grid = np.zeros_like(g); grid[::60, :] = 1; grid[:, ::60] = 1   # blueprint grid every 20 CSS px
bg, ink = np.array([248, 246, 255.]), np.array([116, 49, 244.])
alpha = np.clip(e * 0.95 + fill + grid * 0.07, 0, 1)[..., None]
Image.fromarray((bg * (1 - alpha) + ink * alpha).astype(np.uint8)).save(os.path.join(CAP, 'top-ar-wire.jpg'), quality=92)
print('ok top-ar-wire.jpg')
