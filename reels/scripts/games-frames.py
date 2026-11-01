"""Builds the brain-games 'recording' for the 3D phone from the captured game states (public/cap/games, see
capture-new.js): each state held for its beats, like a screen recording cut on the music (a beat = 20 frames).
Writes public/rec/phone-games/0000.jpg ... at 780 px wide. Run: python3 scripts/games-frames.py"""
import os
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
OUT = os.path.join(ROOT, 'rec', 'phone-games')
PLAN = [('stroop-0', 20), ('stroop-1', 20), ('stroop-2', 20), ('stroop-3', 20),  # four words, one per beat
        ('reaction-wait', 16), ('reaction-go', 20), ('reaction-time', 24),        # wait, the target, the time
        ('memory-show', 16), ('memory-input', 24)]                                 # the pattern, then the answer
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
n = 0
for name, frames in PLAN:
    im = Image.open(os.path.join(ROOT, 'cap', 'games', name + '.jpg')).convert('RGB')
    im = im.resize((780, round(im.height * 780 / im.width)), Image.LANCZOS)
    for _ in range(frames):
        im.save(os.path.join(OUT, f'{n:04d}.jpg'), quality=90); n += 1
print('phone-games', n, 'frames')
