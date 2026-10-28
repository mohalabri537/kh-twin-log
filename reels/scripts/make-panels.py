"""Crop website sections out of the captures for the exploded-view shot.
Coordinates are CSS px of the phone captures (images are 3x); output goes to public/cap/panels/.
Run: python3 scripts/make-panels.py"""
import os
from PIL import Image

CAP = os.path.join(os.path.dirname(__file__), '..', 'public', 'cap')
OUT = os.path.join(CAP, 'panels')
os.makedirs(OUT, exist_ok=True)

PANELS = {
    # name: (source, top css px, bottom css px)
    'hero': ('top-ar.jpg', 0, 360),
    'doctors': ('doctors.jpg', 330, 830),
    'eeg': ('eegscene/039.jpg', 80, 520),
    'visit': ('visit.jpg', 430, 830),
    'booking': ('book-start.jpg', 340, 760),
    'reviews': ('home.jpg', 4054, 4440),
    'english': ('top-en.jpg', 0, 330),
}
for name, (src, top, bottom) in PANELS.items():
    im = Image.open(os.path.join(CAP, src)).convert('RGB')
    im.crop((0, top * 3, im.width, bottom * 3)).resize((780, int((bottom - top) * 2))).save(os.path.join(OUT, f'{name}.jpg'), quality=88)
# the desktop articles page, as a landscape panel
im = Image.open(os.path.join(CAP, 'desk-articles.jpg')).convert('RGB')
im.resize((1440, 900)).save(os.path.join(OUT, 'articles.jpg'), quality=88)
print('ok', sorted(os.listdir(OUT)))
