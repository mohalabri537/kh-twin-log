"""Original soundtrack + sound effects for the launch reel, synthesised from scratch (numpy only).

Calm, cinematic: 100 BPM, D minor (Dm - Bb - F - C), warm pads, soft piano, gentle pulse, deep soft hits.
Arrangement follows the reel (36 s):
  0-4.8 s     intro: piano and pad, swelling
  4.8-18 s    section A: soft kick on 1 and 3, piano motif, pulse (doctors, booking)
  18-22.8 s   breakdown: pad and piano only, heartbeat (EEG)
  22.8-31.2 s section B: fuller, kick on every beat (first visit, desktop)
  31.2-36 s   ending: logo boom at 32.4 s, final chord at 34.8 s, long tail
Sound effects come from src/cues.json, the same list the video uses, so every tap/whoosh lands on its frame.

Run:  python3 audio/make_audio.py   ->  public/audio/reel.wav
"""
import json, os, wave
import numpy as np

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
DUR = 36.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

L = np.zeros(N)
R = np.zeros(N)


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


def kick(gain=1.0, length=0.6):
    """Soft, deep kick: no click, just a round low thump."""
    t = t_(length)
    f = 38 + 70 * np.exp(-t * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    return np.tanh(body * 1.3) * gain * np.minimum(1, t / 0.003)


def snap(gain=1.0):
    """Muted snap, low and filtered, for the backbeat."""
    t = t_(0.22)
    n = band_noise(0.22, 700, 3500, seed=2) * np.exp(-t * 22)
    body = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 35) * 0.4
    return (n + body) * gain


def shaker(gain=1.0, seed=5):
    t = t_(0.08)
    n = band_noise(0.08, 5000, 11000, seed=seed)
    e = np.minimum(1, t / 0.01) * np.exp(-t * 45)
    return n * e * gain


def piano(m, d=1.8, vel=1.0):
    """Soft piano-like tone: decaying harmonics, slightly stretched, gentle attack."""
    f = midi(m)
    t = t_(d)
    out = np.zeros_like(t)
    for h, a, dec in ((1, 1.0, 1.6), (2, 0.42, 2.6), (3, 0.18, 3.6), (4, 0.08, 5.0), (5, 0.04, 6.5)):
        fh = f * h * (1 + 0.0004 * h * h)
        out += a * np.sin(2 * np.pi * fh * t) * np.exp(-t * dec * (0.7 + vel * 0.3))
    att = np.minimum(1, t / 0.006)
    rel = np.clip((d - t) / 0.25, 0, 1)
    return out * att * rel * vel * 0.5


def felt(m, d=0.3):
    """Muted pluck for the pulse (low-passed, short)."""
    f = midi(m)
    t = t_(d)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 20)
    return s * np.minimum(1, t / 0.004) * np.exp(-t * 9) * 0.5


def pad(ms, d, cut=1100, attack=0.7):
    out = 0
    for m in ms:
        out = out + osc_saw(midi(m), d, cut, detune=0.005) * 0.6 + 0.4 * np.sin(2 * np.pi * midi(m) * t_(d))
    n = int(SR * d)
    x = np.arange(n) / SR
    e = np.minimum(1, x / attack) * np.clip((d - x) / 0.6, 0, 1)
    return out * e / len(ms)


def sub(m, d):
    t = t_(d)
    s = np.sin(2 * np.pi * midi(m) * t)
    return s * np.minimum(1, t / 0.08) * np.clip((d - t) / 0.15, 0, 1)


# ---------------------------------------------------------------- arrangement

PROG = [  # bar chords: bass root, pad voicing (add9 colours), pulse notes
    (38, [57, 62, 64, 65], [62, 69, 65, 69]),  # Dm(add9)
    (34, [58, 62, 65, 72], [58, 65, 62, 65]),  # Bb(add9)
    (41, [57, 60, 65, 67], [60, 65, 69, 65]),  # F(add9)
    (36, [55, 60, 62, 67], [60, 67, 64, 67]),  # Csus2
]
# piano motif (beat offset in bar, midi) — simple and singable
MOTIF = [
    [(0, 74), (1.5, 72), (2, 69), (3, 72)],
    [(0, 70), (1.5, 69), (2, 65), (3, 69)],
    [(0, 72), (1.5, 69), (2, 67), (3, 65)],
    [(0, 67), (1.5, 69), (2, 72), (3, 76)],
]

music_L = np.zeros(N)
music_R = np.zeros(N)
duckable_L = np.zeros(N)
duckable_R = np.zeros(N)
verb_L = np.zeros(N)  # reverb send
verb_R = np.zeros(N)
duck = np.ones(N)


def put(buf_l, buf_r, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    buf_l[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 - pan))
    buf_r[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 + pan))


def wet(sig, at, gain, pan=0.0, send=0.5):
    put(duckable_L, duckable_R, sig, at, gain, pan)
    put(verb_L, verb_R, sig, at, gain * send, pan)


def sidechain(at, depth=0.35, rel=0.3):
    i = int(at * SR)
    n = min(int(rel * SR), N - i)
    if n <= 0:
        return
    seg = 1 - depth * np.exp(-np.arange(n) / (SR * rel / 4))
    duck[i:i + n] = np.minimum(duck[i:i + n], seg)


def bar_chord(b):
    return PROG[b % 4]


def bars(t0, t1):
    b = int(round(t0 / BAR))
    t = t0
    while t < t1 - 1e-6:
        yield b, t
        b += 1
        t += BAR


def section(t0, t1, drums='half', pulse=True, motif=True, pad_gain=0.2, shake=False, piano_arp=False):
    for b, tb in bars(t0, t1):
        root, voicing, pnotes = bar_chord(b)
        d = min(BAR, t1 - tb)
        wet(pad(voicing, d + 0.4), tb, pad_gain, -0.15, 0.6)
        wet(sub(root, d), tb, 0.32, 0, 0)
        if motif:
            for off, m in MOTIF[b % 4]:
                if tb + off * BEAT < t1:
                    wet(piano(m, 1.6, 0.85), tb + off * BEAT, 0.34, 0.15, 0.7)
        if piano_arp:
            for k in range(8):
                tt = tb + k * BEAT / 2
                if tt < t1:
                    wet(piano(voicing[k % 4] + 12, 0.9, 0.45), tt, 0.16, (-0.35, 0.35)[k % 2], 0.6)
        for k in range(8):
            tt = tb + k * BEAT / 2
            if tt >= t1:
                break
            if pulse:
                wet(felt(pnotes[k % 4] - 12, 0.3), tt, 0.2, (-0.3, 0.3)[k % 2], 0.3)
            beat = k / 2
            if drums and k % 2 == 0:
                if drums == 'full' or beat in (0, 2):
                    put(music_L, music_R, kick(), tt, 0.85)
                    sidechain(tt)
                if (drums == 'full' and beat in (1, 3)) or (drums == 'half' and beat == 2):
                    put(music_L, music_R, snap(), tt, 0.22, 0.05)
                    put(verb_L, verb_R, snap(), tt, 0.1)
            if shake:
                put(music_L, music_R, shaker(seed=k + b * 8), tt, 0.07 * (1 if k % 2 else 0.6), 0.35)


def swell(t0, t1, gain=0.25):
    """Soft rising air into a section change."""
    d = t1 - t0
    s = sweep_noise(d, 300, 5000, 0.6, seed=11)
    e = (np.arange(len(s)) / len(s)) ** 2.5
    put(music_L, music_R, s * e, t0, gain)
    put(verb_L, verb_R, s * e, t0, gain * 0.5)


def heartbeat(t0, t1, gain=0.5):
    t = t0
    while t < t1:
        put(music_L, music_R, kick(1, 0.4), t, gain)
        put(music_L, music_R, kick(1, 0.4), t + 0.22, gain * 0.55)
        t += BAR / 2


A0, A1 = 4.8, 18.0        # section A
K0, K1 = 18.0, 22.8       # breakdown
B0, B1 = 22.8, 31.2       # section B
E0 = 31.2                 # ending
LOGO, FINAL = 32.4, 34.8

# intro: a single piano phrase over a slowly opening pad
wet(pad(PROG[0][1], 4.9, 700, 1.5), 0.0, 0.22, 0, 0.6)
for tt, m in ((0.55, 62), (1.2, 69), (1.8, 74), (3.0, 72), (3.6, 69)):
    wet(piano(m, 2.0, 0.8), tt, 0.3, 0.1, 0.8)
put(music_L, music_R, sub(38, 4.6), 0.2, 0.25)
swell(2.8, A0, 0.22)

section(A0, A1, drums='half', pulse=True, motif=True)
swell(16.8, K0, 0.2)

# breakdown: drums out, just pad, piano and a slow heartbeat
for b, tb in bars(K0, K1):
    root, voicing, pnotes = bar_chord(b)
    wet(pad(voicing, BAR + 0.5, 900), tb, 0.26, 0, 0.7)
    wet(sub(root, BAR), tb, 0.26, 0, 0)
    for off, m in MOTIF[b % 4][:2]:
        wet(piano(m, 2.2, 0.7), tb + off * BEAT, 0.3, 0.2, 0.9)
heartbeat(K0, K1 - 0.6, 0.45)
swell(21.0, B0, 0.26)

section(B0, B1, drums='full', pulse=True, motif=True, shake=True, piano_arp=True, pad_gain=0.22)

# ending: bloom on the logo, final chord on the tap
wet(pad([50, 57, 62, 64, 69], LOGO - E0 + 0.2, 800, 0.3), E0, 0.2, 0, 0.6)
for at, ch in ((LOGO, [50, 57, 62, 65, 69, 74]), (FINAL, [50, 57, 62, 64, 69, 76])):
    wet(pad(ch, DUR - at + 0.5, 1400, 0.05), at, 0.26, 0, 0.8)
    for i, m in enumerate(ch[2:]):
        wet(piano(m, 3.0, 0.9), at + i * 0.03, 0.26, (-0.3, 0.3)[i % 2], 0.9)
    put(music_L, music_R, kick(1, 0.9), at, 0.9)
    wet(sub(38, DUR - at), at, 0.3, 0, 0)
for tt in np.arange(LOGO + BEAT, FINAL, BEAT):
    wet(felt(62 if int((tt - LOGO) / BEAT) % 2 else 69, 0.3), tt, 0.14, 0, 0.5)

# sidechain + big soft reverb
music_L += duckable_L * duck
music_R += duckable_R * duck
irl, irr = reverb_ir(2.8, 1.5)
music_L += fftconv(verb_L, irl)[:N] * 1.1
music_R += fftconv(verb_R, irr)[:N] * 1.1

# ---------------------------------------------------------------- sound effects


def sfx(kind, seed):
    if kind == 'tap':
        t = t_(0.12)
        blip = np.sin(2 * np.pi * 1180 * t) * np.exp(-t * 45)
        thump = np.sin(2 * np.pi * 150 * t) * np.exp(-t * 35)
        return blip * 0.4 + thump * 0.6
    if kind == 'thud':
        t = t_(0.9)
        f = 34 + 40 * np.exp(-t * 12)
        k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * np.minimum(1, t / 0.004)
        air = band_noise(0.9, 300, 3000, seed) * np.exp(-t * 9) * 0.15
        return k * 0.9 + air
    if kind == 'flick':
        s = sweep_noise(0.16, 800, 6000, 0.5, seed)
        return s * np.sin(np.linspace(0, np.pi, len(s))) ** 2 * 0.7
    if kind in ('whoosh', 'swipe', 'send'):
        d = {'whoosh': 0.6, 'swipe': 0.5, 'send': 0.4}[kind]
        f0, f1 = {'whoosh': (250, 2600), 'swipe': (250, 3500), 'send': (500, 5000)}[kind]
        s = sweep_noise(d, f0, f1, 0.55, seed)
        e = np.sin(np.linspace(0, np.pi, len(s))) ** 1.5
        p = np.linspace(-0.8, 0.8, len(s))
        return np.stack([s * e * np.sqrt(0.5 * (1 - p)), s * e * np.sqrt(0.5 * (1 + p))])
    if kind == 'slam':
        t = t_(0.7)
        f = 40 + 160 * np.exp(-t * 30)
        k = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) * 2.5)
        n = band_noise(0.7, 400, 9000, seed) * np.exp(-t * 16)
        return k * 0.9 + n * 0.5 + clap()[:0].sum() * 0
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


cues = json.load(open(os.path.join(ROOT, 'src', 'cues.json')))
fx_L = np.zeros(N)
fx_R = np.zeros(N)
for i, c in enumerate(cues['sfx']):
    s = sfx(c['t'], 100 + i)
    at = c['f'] * cues.get('timeScale', 1) / cues['fps']
    pan = 0.0
    if s.ndim == 1:
        put(fx_L, fx_R, s, at, c['g'], pan)
    else:
        j = int(at * SR)
        n = min(s.shape[1], N - j)
        fx_L[j:j + n] += s[0][:n] * c['g']
        fx_R[j:j + n] += s[1][:n] * c['g']
fx_send = (fx_L + fx_R) * 0.5
fx_L += fftconv(fx_send, irl)[:N] * 0.45
fx_R += fftconv(fx_send, irr)[:N] * 0.45

# ---------------------------------------------------------------- master
mix_L = music_L * 0.9 + fx_L * 0.7
mix_R = music_R * 0.9 + fx_R * 0.7
# fade the very end
tail = np.clip((DUR - np.arange(N) / SR) / 1.0, 0, 1)
mix_L *= tail
mix_R *= tail
peak = max(np.max(np.abs(mix_L)), np.max(np.abs(mix_R)))
drive = 1.2
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
