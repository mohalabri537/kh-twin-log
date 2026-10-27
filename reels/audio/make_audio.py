"""Original soundtrack + sound effects for the launch reel, synthesised from scratch (numpy only).

120 BPM, D minor (Dm - Bb - F - C). Arrangement follows the reel:
  0-4 s   hook: blip, spike, heartbeat, filtered arp rising, snare roll -> DROP at 4 s
  4-15 s  groove A (doctors, booking)
  15-19 s breakdown: brainwave lead, heartbeat, riser -> DROP at 19 s
  19-26 s groove B with lead (first visit, desktop)
  26-30 s ending: reverse swell, logo boom at 27 s, final stab at 29 s
Sound effects come from src/cues.json, the same list the video uses, so every tap/whoosh lands on its frame.

Run:  python3 audio/make_audio.py   ->  public/audio/reel.wav
"""
import json, os, wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 4
DUR = 30.0
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

def kick(gain=1.0, punch=1.0, length=0.45):
    t = t_(length)
    f = 45 + 120 * np.exp(-t * 35) * punch
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7)
    click = band_noise(0.01, 1500, 8000, seed=1) * np.exp(-np.arange(int(SR * 0.01)) / 60)
    body[:len(click)] += click * 0.4
    return np.tanh(body * 1.6) * gain


def clap(gain=1.0):
    d = 0.3
    n = band_noise(d, 900, 5000, seed=2)
    t = t_(d)
    e = np.zeros_like(t)
    for o in (0, 0.011, 0.022):
        e += np.where(t >= o, np.exp(-(t - o) * 90), 0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) * 14) * 0.6, 0)
    return n * e * gain


def snare(gain=1.0):
    t = t_(0.25)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30)
    n = band_noise(0.25, 1200, 9000, seed=4) * np.exp(-t * 18)
    return (tone * 0.5 + n) * gain


def hat(open_=False, gain=1.0, seed=5):
    d = 0.25 if open_ else 0.05
    t = t_(d)
    n = band_noise(d, 7000, 16000, seed=seed)
    return n * np.exp(-t * (12 if open_ else 90)) * gain


def pluck(m, d=0.22, bright=1.0):
    f = midi(m)
    t = t_(d)
    cut = 600 + 5200 * bright * np.exp(-t * 18)
    return osc_saw(f, d, cut, detune=0.004) * env(len(t), 0.002, 0.12, 0.0, 0.03, d)


def pad(ms, d, cut=1800):
    out = 0
    for m in ms:
        out = out + osc_saw(midi(m), d, cut, detune=0.006)
    n = int(SR * d)
    e = np.minimum(1, np.arange(n) / (SR * 0.25)) * np.clip((d - np.arange(n) / SR) / 0.3, 0, 1)
    return out * e / len(ms)


def sub(m, d):
    t = t_(d)
    s = np.sin(2 * np.pi * midi(m) * t) + 0.25 * np.sin(2 * np.pi * midi(m) * 2 * t + 0.3)
    s += 0.15 * osc_saw(midi(m), d, 900)
    return np.tanh(s * 1.4) * env(len(t), 0.004, 3, 0.9, 0.04, d)


# ---------------------------------------------------------------- arrangement

PROG = [  # bar chords: root (bass), triad (pad), arp notes
    (38, [62, 65, 69], [62, 65, 69, 74, 69, 65, 62, 69]),  # Dm
    (34, [58, 62, 65], [58, 62, 65, 70, 65, 62, 58, 65]),  # Bb
    (41, [60, 65, 69], [65, 69, 72, 77, 72, 69, 65, 72]),  # F
    (36, [60, 64, 67], [60, 64, 67, 72, 67, 64, 60, 67]),  # C
]
LEAD = [74, None, 72, 74, 77, None, 76, 74, 72, None, 69, 72, 74, None, None, None]  # 8ths over 1 bar pairs

duck = np.ones(N)  # sidechain envelope driven by the kick


def sidechain(at, depth=0.65, rel=0.22):
    i = int(at * SR)
    n = int(rel * SR)
    if i >= N:
        return
    seg = 1 - depth * np.exp(-np.arange(min(n, N - i)) / (SR * rel / 4))
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], seg)


music_L = np.zeros(N)
music_R = np.zeros(N)
duckable_L = np.zeros(N)
duckable_R = np.zeros(N)


def put(buf_l, buf_r, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    buf_l[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 - pan))
    buf_r[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 + pan))


def chord_at(t):
    return PROG[int(t // BAR) % 4]


def groove(t0, t1, lead=False, intensity=1.0):
    t = t0
    step = BEAT / 4
    k = 0
    while t < t1 - 1e-6:
        b16 = k % 16
        root, triad, arp = chord_at(t)
        if b16 % 4 == 0:
            put(music_L, music_R, kick(1.0), t, 0.95)
            sidechain(t)
        if b16 in (4, 12):
            put(music_L, music_R, clap(), t, 0.5 * intensity, 0.05)
            put(music_L, music_R, snare(), t, 0.25 * intensity)
        vel = [0.5, 0.25, 0.8, 0.3][b16 % 4]
        if b16 % 4 == 2:
            put(music_L, music_R, hat(True, seed=k), t, 0.16 * intensity, 0.3)
        else:
            put(music_L, music_R, hat(False, seed=k), t, 0.22 * vel * intensity, -0.25)
        # rolling sub bass on 8ths, root/octave
        if b16 % 2 == 0:
            m = root + (12 if b16 % 8 == 6 else 0)
            put(duckable_L, duckable_R, sub(m, step * 1.9), t, 0.42)
        # arp
        if b16 % 2 == 0:
            put(duckable_L, duckable_R, pluck(arp[(b16 // 2) % 8], 0.2, 0.9), t, 0.2, (-0.4, 0.4)[(b16 // 2) % 2])
        if lead and b16 % 2 == 0:
            n8 = (int((t - t0) / (BEAT / 2))) % 16
            m = LEAD[n8]
            if m is not None:
                f = midi(m)
                d = BEAT / 2 * 0.95
                tt = t_(d)
                vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * tt)
                ph = 2 * np.pi * np.cumsum(f * vib) / SR
                sq = np.tanh(np.sin(ph) * 2.2) * 0.6 + 0.4 * np.sin(2 * ph)
                put(duckable_L, duckable_R, sq * env(len(tt), 0.01, 0.3, 0.5, 0.05, d), t, 0.11, 0.15)
        t += step
        k += 1
    # pads per bar
    b = t0
    while b < t1 - 1e-6:
        root, triad, arp = chord_at(b)
        d = min(BAR, t1 - b)
        put(duckable_L, duckable_R, pad(triad, d, 2200), b, 0.18, -0.2)
        put(duckable_L, duckable_R, pad([x + 12 for x in triad], d, 3000), b, 0.07, 0.3)
        b += BAR


def roll(t0, t1, gain=0.5):
    """Snare roll that accelerates into a drop."""
    t = t0
    while t < t1:
        k = (t - t0) / (t1 - t0)
        put(music_L, music_R, snare(), t, gain * (0.35 + 0.65 * k))
        t += BEAT / (2 if k < 0.4 else 4 if k < 0.75 else 8)


def riser(t0, t1, gain=0.35):
    d = t1 - t0
    s = sweep_noise(d, 400, 9000, 0.5, seed=11)
    e = (np.arange(len(s)) / len(s)) ** 2.2
    put(music_L, music_R, s * e, t0, gain)
    # pitch riser
    tt = t_(d)
    f = 200 * (8 ** (tt / d))
    put(music_L, music_R, np.sin(2 * np.pi * np.cumsum(f) / SR) * e * 0.4, t0, gain)


def heartbeat(t0, t1, gain=0.7):
    t = t0
    while t < t1:
        put(music_L, music_R, kick(1, 0.6, 0.3), t, gain)
        put(music_L, music_R, kick(1, 0.5, 0.3), t + 0.16, gain * 0.6)
        t += BEAT * 2


# hook 0-4 s
put(duckable_L, duckable_R, pad([50, 57, 62], 3.6, 700), 0.45, 0.22)
heartbeat(0.5, 3.0, 0.55)
for i, tt in enumerate(np.arange(1.0, 4.0, BEAT / 4)):
    root, triad, arp = PROG[0]
    k = (tt - 1.0) / 3.0
    put(duckable_L, duckable_R, pluck(arp[i % 8], 0.18, 0.15 + 0.85 * k), tt, 0.1 + 0.12 * k, (-0.4, 0.4)[i % 2])
roll(2.5, 3.88, 0.85)
for st in (3.0, 3.5, 3.75, 3.875 - 0.06):  # kicks speeding up into the drop
    put(music_L, music_R, kick(1, 1.1, 0.35), st, 0.9)
riser(2.0, 3.88, 0.7)

# groove A 4-15 s (with a fill at the end)
groove(4.0, 14.5)
roll(14.5, 15.0, 0.4)

# breakdown 15-19 s: brainwave lead
put(duckable_L, duckable_R, pad([50, 57, 62, 65], 4.0, 1200), 15.0, 0.36)
heartbeat(15.0, 18.0, 0.9)
for i, tt in enumerate(np.arange(15.0, 19.0, BEAT / 4)):  # muffled arp keeps the momentum, opening up into the drop
    k = (tt - 15.0) / 4.0
    put(music_L, music_R, pluck(PROG[0][2][i % 8], 0.16, 0.08 + 0.6 * k ** 2), tt, 0.12 + 0.1 * k, (-0.5, 0.5)[i % 2])
for tt in np.arange(15.0, 19.0, BEAT / 2):  # pulsing sub
    put(music_L, music_R, sub(38, BEAT / 2 * 0.9), tt, 0.3)
bw_mel = [(15.0, 69, 0.75), (15.75, 72, 0.25), (16.0, 74, 1.0), (17.0, 77, 0.5), (17.5, 76, 0.5), (18.0, 74, 1.0)]
for st, m, d in bw_mel:
    tt = t_(d)
    f = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * 7 * tt))  # wobble like a trace
    mod = np.sin(2 * np.pi * f * 2 * tt) * (2.5 * np.exp(-tt * 3) + 0.4)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR + mod) * env(len(tt), 0.01, 0.4, 0.6, 0.1, d)
    put(music_L, music_R, s, st, 0.3, 0.2)
    put(music_L, music_R, s, st + 0.375, 0.12, -0.5)  # echo
for tt in np.arange(15.0, 19.0, BEAT / 2):
    put(music_L, music_R, hat(False, seed=int(tt * 10)), tt, 0.12, 0.4)
riser(16.5, 18.88, 0.7)
roll(17.5, 18.88, 0.8)
for st in (18.0, 18.25, 18.5, 18.625, 18.75):
    put(music_L, music_R, kick(1, 1.1, 0.3), st, 0.9)

# groove B 19-26 s with lead
groove(19.0, 26.0, lead=True)

# ending 26-30 s
put(duckable_L, duckable_R, pad([50, 57, 62, 65, 69], 4.0, 1600), 26.0, 0.22)
for st in (27.0, 28.0, 28.5, 29.0):
    put(music_L, music_R, kick(1.0, 1.2, 0.6), st, 0.95)
    sidechain(st, 0.5, 0.3)
for st, ch in ((27.0, [62, 65, 69, 74]), (29.0, [62, 65, 69, 74, 77])):
    stab = sum(osc_saw(midi(m), 1.0, 4000, 0.006) for m in ch) / len(ch) * env(int(SR * 1.0), 0.003, 0.35, 0.15, 0.3, 1.0)
    put(music_L, music_R, stab, st, 0.32)
    put(music_L, music_R, sub(38, 0.9), st, 0.45)
for tt in np.arange(27.5, 29.0, BEAT / 4):
    put(music_L, music_R, hat(False, seed=int(tt * 100)), tt, 0.09, 0.3)

# a split second of silence right before each drop makes it hit harder
for g0 in (3.88, 18.88):
    a, b = int(g0 * SR), int((g0 + 0.12) * SR)
    for buf in (music_L, music_R, duckable_L, duckable_R):
        buf[a:b] *= 0.04

# apply sidechain, reverb send
music_L += duckable_L * duck
music_R += duckable_R * duck
irl, irr = reverb_ir()
send = (duckable_L + duckable_R) * duck * 0.5
music_L += fftconv(send, irl)[:N] * 0.9
music_R += fftconv(send, irr)[:N] * 0.9

# ---------------------------------------------------------------- sound effects


def sfx(kind, seed):
    if kind == 'tap':
        t = t_(0.09)
        blip = np.sin(2 * np.pi * (1900 * np.exp(-t * 18) + 700) * t) * np.exp(-t * 55)
        thump = np.sin(2 * np.pi * 140 * t) * np.exp(-t * 40)
        click = band_noise(0.09, 3000, 12000, seed) * np.exp(-t * 300)
        return blip * 0.55 + thump * 0.7 + click * 0.5
    if kind == 'flick':
        s = sweep_noise(0.16, 800, 6000, 0.5, seed)
        return s * np.sin(np.linspace(0, np.pi, len(s))) ** 2 * 0.7
    if kind in ('whoosh', 'swipe', 'send'):
        d = {'whoosh': 0.42, 'swipe': 0.36, 'send': 0.3}[kind]
        f0, f1 = {'whoosh': (300, 5000), 'swipe': (250, 7000), 'send': (600, 9000)}[kind]
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
        n = band_noise(d, 200, 7000, seed) * np.exp(-t * (6 if kind == 'impact' else 3.5))
        out = np.tanh(s * 2.2) * 0.9 + n * 0.45
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
    at = c['f'] / cues['fps']
    pan = 0.0
    if s.ndim == 1:
        put(fx_L, fx_R, s, at, c['g'], pan)
    else:
        j = int(at * SR)
        n = min(s.shape[1], N - j)
        fx_L[j:j + n] += s[0][:n] * c['g']
        fx_R[j:j + n] += s[1][:n] * c['g']
fx_send = (fx_L + fx_R) * 0.5
fx_L += fftconv(fx_send, irl)[:N] * 0.35
fx_R += fftconv(fx_send, irr)[:N] * 0.35

# ---------------------------------------------------------------- master
mix_L = music_L * 0.8 + fx_L * 0.9
mix_R = music_R * 0.8 + fx_R * 0.9
# fade the very end
tail = np.clip((DUR - np.arange(N) / SR) / 0.6, 0, 1)
mix_L *= tail
mix_R *= tail
peak = max(np.max(np.abs(mix_L)), np.max(np.abs(mix_R)))
drive = 1.6
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
