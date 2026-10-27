"""Original soundtrack + sound effects for the launch reel, synthesised from scratch (numpy only).

Punchy and anthemic, not funky: 120 BPM, D minor (Dm - Bb - F - C). Four-on-the-floor kick, big claps,
straight driving bass, pumping supersaw chords and a simple pluck hook. Sections follow src/timeline.json:
  hook     0-4 s    filtered chords and pluck rising, text hits, snare build -> DROP
  tour     4-12 s   full groove, a whip and crash on every page
  booking  12-24 s  groove without claps or hook, so each tap rings out as a rising note; build -> DROP
  dark     24-28 s  full groove; a one-beat stop, then the bass drops as the reel turns dark
  end      28-34 s  logo hit, half-time groove, final chord on the button tap, tail
Sound effects come from the same timeline the video reads, so every tap and whip lands on its frame.

Run:  python3 audio/make_audio.py   ->  public/audio/reel.wav
"""
import json, os, wave
import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'src', 'timeline.json')))
BPM = TL['bpm']
BEAT = 60 / BPM
BAR = BEAT * 4
STARTS, _t = {}, 0
for _s in TL['scenes']:
    STARTS[_s['id']] = _t / TL['fps']
    _t += _s['len']
DUR = _t / TL['fps']
N = int(SR * DUR)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(SR * d)) / SR


def add(sig, at, gain=1.0, pan=0.0):
    """Mix a mono or (2, n) signal into the master at time `at` seconds."""
    i = int(at * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        l, r = sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))
    else:
        l, r = sig[0], sig[1]
    n = min(len(l), N - i)
    if i < 0:
        l, r, n, i = l[-i:], r[-i:], min(len(l) + i, N), 0
    L[i:i + n] += l[:n] * gain
    R[i:i + n] += r[:n] * gain


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.005, d=0.2, sus=0.0, rel=0.05, length=None):
    """ADSR-ish envelope over n samples."""
    x = np.arange(n) / SR
    e = np.minimum(1, x / max(a, 1e-4))
    dec = sus + (1 - sus) * np.exp(-(x - a) / max(d, 1e-4))
    e = np.where(x < a, e, dec)
    if length is not None:
        e *= np.clip((length - x) / rel, 0, 1)
    return e


def band_noise(d, lo, hi, seed=None):
    n = int(SR * d)
    w = (np.random.default_rng(seed) if seed is not None else rng).standard_normal(n)
    F = np.fft.rfft(w)
    fr = np.fft.rfftfreq(n, 1 / SR)
    F *= ((fr > lo) & (fr < hi)).astype(float) * 1.0
    F *= 1 / (1 + np.exp(-(fr - lo) / (lo * 0.2 + 1))) * 1 / (1 + np.exp((fr - hi) / (hi * 0.2 + 1)))
    out = np.fft.irfft(F, n)
    return out / (np.max(np.abs(out)) + 1e-9)


def sweep_noise(d, f0, f1, width=0.6, seed=None):
    """Noise through a band-pass whose centre glides f0 -> f1 (granular, overlap-add)."""
    n = int(SR * d)
    out = np.zeros(n)
    g = 2048
    hop = g // 2
    win = np.hanning(g)
    base = (np.random.default_rng(seed) if seed is not None else rng).standard_normal(n + g)
    fr = np.fft.rfftfreq(g, 1 / SR)
    for s in range(0, n, hop):
        k = s / max(1, n - 1)
        fc = f0 * (f1 / f0) ** k
        F = np.fft.rfft(base[s:s + g] * win)
        F *= np.exp(-0.5 * (np.log2(np.maximum(fr, 1) / fc) / width) ** 2)
        seg = np.fft.irfft(F, g)
        e = min(g, n - s)
        out[s:s + e] += seg[:e]
    return out / (np.max(np.abs(out)) + 1e-9)


def osc_saw(freq, d, harmonics_cut=6000.0, detune=0.0):
    """Band-limited saw by additive synthesis; harmonics_cut acts as a filter cutoff (can be an array)."""
    t = t_(d)
    out = np.zeros_like(t)
    for dt in ([0.0] if detune == 0 else [-detune, detune]):
        f = freq * (1 + dt)
        kmax = int(min(18000, np.max(harmonics_cut)) // f) + 1
        for k in range(1, max(2, kmax)):
            amp = 1 / k
            if np.ndim(harmonics_cut):
                amp = amp * np.clip(1 - (k * f - harmonics_cut) / (harmonics_cut * 0.5 + 1), 0, 1)
            elif k * f > harmonics_cut:
                amp = amp * max(0.0, 1 - (k * f - harmonics_cut) / (harmonics_cut * 0.5))
            out += amp * np.sin(2 * np.pi * k * f * t + k * 0.7)
    return out / (1.6 if detune == 0 else 3.2)


def reverb_ir(d=1.6, decay=2.2, seed=3):
    n = int(SR * d)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    l = r.standard_normal(n) * np.exp(-t * decay)
    rr = r.standard_normal(n) * np.exp(-t * decay)
    l[:200] = 0
    rr[:230] = 0
    return l * 0.02, rr * 0.02


def fftconv(x, h):
    n = len(x) + len(h) - 1
    m = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(h, m), m)[:n]



# ---------------------------------------------------------------- instruments


def kick(length=0.42):
    t = t_(length)
    f = 48 + 140 * np.exp(-t * 38)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = band_noise(0.008, 2000, 8000, seed=1) * np.exp(-np.arange(int(SR * 0.008)) / 50)
    body[:len(click)] += click * 0.25
    return np.tanh(body * 1.8)


def clap():
    d = 0.35
    t = t_(d)
    n = band_noise(d, 900, 6000, seed=2)
    e = np.zeros_like(t)
    for o in (0, 0.01, 0.02):
        e += np.where(t >= o, np.exp(-(t - o) * 110), 0)
    e += np.where(t >= 0.028, np.exp(-(t - 0.028) * 12) * 0.7, 0)
    body = np.sin(2 * np.pi * 200 * t) * np.exp(-t * 30) * 0.5
    return n * e + body


def hat(seed=5):
    t = t_(0.045)
    return band_noise(0.045, 8000, 15000, seed=seed) * np.exp(-t * 95)


def snare():
    t = t_(0.2)
    return band_noise(0.2, 1200, 9000, seed=4) * np.exp(-t * 20) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5


def bass(m, d):
    t = t_(d)
    s = 0.75 * osc_saw(midi(m), d, 700) + 0.8 * np.sin(2 * np.pi * midi(m) * t)
    e = np.minimum(1, t / 0.004) * (0.7 + 0.3 * np.exp(-t * 12)) * np.clip((d - t) / 0.03, 0, 1)
    return np.tanh(s * e * 1.2)


def supersaw(ms, d, cut=3000, attack=0.01, release=0.3):
    t = t_(d)
    out = np.zeros_like(t)
    for m in ms:
        out += osc_saw(midi(m), d, cut) + osc_saw(midi(m), d, cut, detune=0.009)
    e = np.minimum(1, t / attack) * np.clip((d - t) / release, 0, 1)
    return out * e / len(ms) * 0.6


def pluck(m, d=0.26, bright=1.0):
    t = t_(d)
    cut = 900 + 4500 * bright * np.exp(-t * 14)
    return osc_saw(midi(m), d, cut, detune=0.004) * np.exp(-t * 9) * np.minimum(1, t / 0.002)


def bell(m, d=1.0):
    t = t_(d)
    f = midi(m)
    out = np.zeros_like(t)
    for h, a, dec in ((1, 1.0, 4), (2.0, 0.35, 6), (3.0, 0.15, 9), (4.2, 0.08, 12)):
        out += a * np.sin(2 * np.pi * f * h * t) * np.exp(-t * dec)
    return out * np.minimum(1, t / 0.002) * 0.5


def crash(d=1.8):
    t = t_(d)
    return band_noise(d, 3000, 14000, seed=9) * np.exp(-t * 2.4)


# ---------------------------------------------------------------- arrangement

PROG = [  # per bar: bass root, chord, hook (8ths, None = rest)
    (38, [62, 65, 69, 74], [74, None, 72, 74, 77, None, 74, 72]),  # Dm
    (34, [58, 62, 65, 70], [70, None, 69, 70, 74, None, 72, 70]),  # Bb
    (41, [60, 65, 69, 72], [72, None, 69, 72, 77, None, 76, 72]),  # F
    (36, [60, 64, 67, 72], [72, None, 74, 76, 79, None, 76, 74]),  # C
]

music_L = np.zeros(N); music_R = np.zeros(N)      # dry, not ducked (drums)
duck_L = np.zeros(N); duck_R = np.zeros(N)        # ducked by the kick (bass, chords, hook)
verb_L = np.zeros(N); verb_R = np.zeros(N)        # reverb send
duck = np.ones(N)


def put(bl, br, sig, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    bl[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 - pan))
    br[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 + pan))


def side(at, depth=0.6, rel=0.24):
    i = int(round(at * SR))
    n = min(int(rel * SR), N - i)
    if n <= 0:
        return
    seg = 1 - depth * np.exp(-np.arange(n) / (SR * rel / 4))
    duck[i:i + n] = np.minimum(duck[i:i + n], seg)


def groove(t0, t1, claps=True, hats=True, hook=True, chords=True, cut=3200, hook_oct=0, bass_oct=0, half=False):
    b = int(round(t0 / BAR))
    tb = t0
    while tb < t1 - 1e-6:
        root, chord, line = PROG[b % 4]
        for k in range(8):  # eighth notes
            tt = tb + k * BEAT / 2
            if tt >= t1 - 1e-6:
                break
            beat = k // 2
            on = k % 2 == 0
            if on and (not half or beat in (0, 2)):
                put(music_L, music_R, kick(), tt, 0.95)
                side(tt)
            if claps and on and ((not half and beat in (1, 3)) or (half and beat == 2)):
                put(music_L, music_R, clap(), tt, 0.55)
                put(verb_L, verb_R, clap(), tt, 0.35)
            if hats and not on:
                put(music_L, music_R, hat(seed=k + b * 8), tt, 0.16, 0.3)
            put(duck_L, duck_R, bass(root + 12 * bass_oct, BEAT / 2 * 0.9), tt, 0.42)
            if hook and line[k] is not None:
                n = line[k] + 12 * hook_oct
                put(duck_L, duck_R, pluck(n), tt, 0.2, 0.15)
                put(verb_L, verb_R, pluck(n), tt, 0.12, -0.3)
        if chords:
            d = min(BAR, t1 - tb)
            put(duck_L, duck_R, supersaw(chord, d + 0.05, cut), tb, 0.22, -0.1)
            put(verb_L, verb_R, supersaw(chord, d + 0.05, cut), tb, 0.08)
        tb += BAR
        b += 1


def build(t0, t1, gain=0.6):
    """Snare roll speeding up + rising noise into a drop."""
    t = t0
    while t < t1 - 1e-6:
        k = (t - t0) / (t1 - t0)
        put(music_L, music_R, snare(), t, gain * (0.3 + 0.7 * k))
        t += BEAT / (2 if k < 0.5 else 4 if k < 0.8 else 8)
    d = t1 - t0
    s = sweep_noise(d, 500, 9000, 0.5, seed=11)
    e = (np.arange(len(s)) / len(s)) ** 2.4
    put(music_L, music_R, s * e, t0, gain * 0.7)


def gap(t0, t1):
    a, b = int(t0 * SR), int(t1 * SR)
    for buf in (music_L, music_R, duck_L, duck_R, verb_L, verb_R):
        buf[a:b] *= 0.03


H, T, B, D, E = (STARTS[k] for k in ('hook', 'tour', 'booking', 'dark', 'end'))


def cue(scene, kind):
    """Time (s) of the first cue of a kind in a scene."""
    return STARTS[scene] + next(e[0] for e in TL['sfx'][scene] if e[1] == kind) / TL['fps']

# hook: filtered chord opening up, pluck line rising, then a snare build into the drop
cut = np.linspace(500, 2600, int(SR * (T - H)))
put(duck_L, duck_R, supersaw(PROG[0][1], T - H, cut, attack=0.3), H, 0.2)
for k, tt in enumerate(np.arange(H + BEAT, T - BEAT, BEAT / 2)):
    n = PROG[0][2][k % 8] or 69
    put(duck_L, duck_R, pluck(n, 0.22, 0.2 + 0.8 * (tt - H) / (T - H)), tt, 0.16 + 0.12 * (tt - H) / (T - H), (-0.3, 0.3)[k % 2])
put(duck_L, duck_R, bass(38, T - H - 0.1) * np.linspace(0.3, 1, int(SR * (T - H - 0.1))), H, 0.25)
build(H + 2.0, T - 0.1, 1.1)
for tt in list(np.arange(H + 2.0, H + 3.0, BEAT)) + list(np.arange(H + 3.0, T - 0.1, BEAT / 2)):  # kicks speeding up
    put(music_L, music_R, kick(), tt, 0.8)
gap(T - 0.1, T)

# tour: full groove
groove(T, B)

# booking: keep the drive, drop claps and the hook so the tap notes ring out; build into the dark-mode drop
groove(B, D - BAR, claps=False, hook=False, cut=1800)
groove(D - BAR, D - 0.1, claps=False, hook=False, cut=2600)
build(D - BAR, D - 0.1, 0.9)
gap(D - 0.1, D)

# dark: full groove, one beat of silence before the theme tap, then the bass drops an octave
drop = cue('dark', 'drop')
groove(D, drop - BEAT, hook_oct=1)
groove(drop, E, hook_oct=1, bass_oct=-1)

# end: logo hit, half-time groove, final chord on the button tap, tail
final = cue('end', 'tap')
groove(E, final, claps=True, hats=False, half=True, cut=2400)
put(duck_L, duck_R, supersaw([50, 57, 62, 64, 69], final - E, 2800, 0.01, 0.4), E, 0.2)
put(music_L, music_R, supersaw([62, 65, 69, 74, 76], DUR - final, 3500, 0.005, 1.2) * np.exp(-t_(DUR - final) * 0.6), final, 0.3)
put(verb_L, verb_R, supersaw([62, 65, 69, 74, 76], DUR - final, 3500, 0.005, 1.2) * np.exp(-t_(DUR - final) * 0.6), final, 0.2)
put(music_L, music_R, bass(26, 1.2), final, 0.5)
put(music_L, music_R, kick(), final, 1.0)
put(music_L, music_R, crash(2.5), final, 0.3)

# mix the layers: sidechain pump on bass/chords/hook, then a roomy reverb
music_L += duck_L * duck
music_R += duck_R * duck
irl, irr = reverb_ir(2.0, 2.0)
music_L += fftconv(verb_L, irl)[:N] * 0.9
music_R += fftconv(verb_R, irr)[:N] * 0.9

# ---------------------------------------------------------------- sound effects


def sfx(kind, seed, note=None):
    if kind == 'tap':  # pitched: the booking steps climb a scale
        t = t_(0.1)
        thump = np.sin(2 * np.pi * 160 * t) * np.exp(-t * 40)
        b = bell(note or 74, 1.0)
        b[:len(thump)] += thump * 0.5
        return b
    if kind == 'hit':
        t = t_(0.6)
        s = kick(0.6)
        c = clap()
        s[:len(c)] += c * 0.6
        s += np.sin(2 * np.pi * 42 * t) * np.exp(-t * 4) * 0.5
        return s * 0.8
    if kind == 'crash':
        return crash()
    if kind == 'zap':  # electric sweep for the brainwave drawing across the screen
        d = 0.9
        t = t_(d)
        f = 300 * (6 ** (t / d))
        mod = np.sin(2 * np.pi * f * 1.5 * t) * 3 * np.exp(-t * 2)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR + mod) * np.sin(np.pi * t / d) ** 0.8
        return s * 0.5 + sweep_noise(d, 800, 6000, 0.5, seed) * np.sin(np.pi * t / d) * 0.25
    if kind in ('whip', 'swish'):
        d = 0.3 if kind == 'whip' else 0.4
        s = sweep_noise(d, 500, 7000 if kind == 'whip' else 3000, 0.5, seed)
        x = np.linspace(0, 1, len(s))
        e = np.sin(np.pi * x ** 0.7) ** 2
        p = np.linspace(0.8, -0.8, len(s))
        return np.stack([s * e * np.sqrt(0.5 * (1 - p)), s * e * np.sqrt(0.5 * (1 + p))])
    if kind == 'drop':
        t = t_(1.5)
        f = 30 + 60 * np.exp(-t * 3)
        s = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * 2)
        return s * 0.9 + sweep_noise(1.5, 3000, 200, 0.6, seed) * np.exp(-t * 3) * 0.25
    if kind == 'thud':
        t = t_(0.9)
        f = 34 + 40 * np.exp(-t * 12)
        k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * np.minimum(1, t / 0.004)
        air = band_noise(0.9, 300, 3000, seed) * np.exp(-t * 9) * 0.15
        return k * 0.9 + air
    if kind == 'flick':
        s = sweep_noise(0.16, 800, 6000, 0.5, seed)
        return s * np.sin(np.linspace(0, np.pi, len(s))) ** 2 * 0.7
    if kind in ('whoosh', 'swipe', 'send', 'air'):
        d = {'whoosh': 0.6, 'swipe': 0.5, 'send': 0.4, 'air': 0.7}[kind]
        f0, f1 = {'whoosh': (250, 2600), 'swipe': (300, 1800), 'send': (500, 5000), 'air': (400, 1600)}[kind]
        s = sweep_noise(d, f0, f1, 0.55, seed)
        e = np.sin(np.linspace(0, np.pi, len(s))) ** 1.5
        p = np.linspace(-0.8, 0.8, len(s))
        return np.stack([s * e * np.sqrt(0.5 * (1 - p)), s * e * np.sqrt(0.5 * (1 + p))])
    if kind in ('impact', 'boom'):
        d = 1.4 if kind == 'impact' else 2.4
        t = t_(d)
        f = 28 + 90 * np.exp(-t * 6)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (2.6 if kind == 'impact' else 1.5))
        n = band_noise(d, 150, 2500, seed) * np.exp(-t * (6 if kind == 'impact' else 3.5))
        out = np.tanh(s * 1.6) * 0.9 + n * 0.2
        return out
    if kind == 'reverse':
        d = 0.95
        s = sweep_noise(d, 600, 12000, 0.7, seed)
        e = (np.arange(len(s)) / len(s)) ** 3
        return s * e * 0.9
    if kind == 'beep':
        t = t_(0.14)
        return np.sin(2 * np.pi * 1046.5 * t) * env(len(t), 0.003, 1, 1, 0.02, 0.14) * 0.6
    if kind == 'pop':
        t = t_(0.09)
        f = 350 + 1300 * (1 - np.exp(-t * 60))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.9
    if kind == 'tick':
        t = t_(0.05)
        return (np.sin(2 * np.pi * 2600 * t) + 0.5 * np.sin(2 * np.pi * 4100 * t)) * np.exp(-t * 120) * 0.7
    if kind == 'key':
        t = t_(0.04)
        return (band_noise(0.04, 2000, 9000, seed) * np.exp(-t * 160) + np.sin(2 * np.pi * 220 * t) * np.exp(-t * 90) * 0.5) * 0.7
    if kind == 'click':
        t = t_(0.06)
        c = band_noise(0.06, 2500, 12000, seed) * np.exp(-t * 400)
        c2 = np.roll(c, int(0.012 * SR)) * 0.7
        return (c + c2 + np.sin(2 * np.pi * 300 * t) * np.exp(-t * 120) * 0.4) * 0.9
    if kind == 'ding':
        t = t_(0.9)
        out = np.zeros_like(t)
        for st, f in ((0, 1318.5), (0.09, 1975.5)):
            tt = np.clip(t - st, 0, None)
            on = (t >= st).astype(float)
            for h, a in ((1, 1), (2.76, 0.3), (5.4, 0.12)):
                out += on * a * np.sin(2 * np.pi * f * h * tt) * np.exp(-tt * (4 + h))
        return out * 0.4
    raise ValueError(kind)


fx_L = np.zeros(N)
fx_R = np.zeros(N)
k = 0
for scene, events in TL['sfx'].items():
    for e in events:
        rel, kind, gain = e[0], e[1], e[2]
        k += 1
        snd = sfx(kind, 100 + k, e[3] if len(e) > 3 else None)
        at = STARTS[scene] + rel / TL['fps']
        if snd.ndim == 1:
            put(fx_L, fx_R, snd, at, gain)
        else:
            j = int(round(at * SR))
            n = min(snd.shape[1], N - j)
            fx_L[j:j + n] += snd[0][:n] * gain
            fx_R[j:j + n] += snd[1][:n] * gain
fx_send = (fx_L + fx_R) * 0.5
fx_L += fftconv(fx_send, irl)[:N] * 0.35
fx_R += fftconv(fx_send, irr)[:N] * 0.35

# ---------------------------------------------------------------- master
mix_L = music_L * 0.85 + fx_L * 0.75
mix_R = music_R * 0.85 + fx_R * 0.75
tail = np.clip((DUR - np.arange(N) / SR) / 1.0, 0, 1)
mix_L *= tail
mix_R *= tail
peak = max(np.max(np.abs(mix_L)), np.max(np.abs(mix_R)))
drive = 2.0
mix_L = np.tanh(mix_L / peak * drive) / np.tanh(drive)
mix_R = np.tanh(mix_R / peak * drive) / np.tanh(drive)
mix = np.stack([mix_L, mix_R], 1) * 0.93

out = os.path.join(ROOT, 'public', 'audio', 'reel.wav')
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out)
