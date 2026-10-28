"""Original soundtrack + sound effects for the launch reel, synthesised from scratch (numpy only).

Cinematic tech, not funky: 120 BPM, D minor (Dm - Bb - F - C). A straight 16th-note synth sequence
(no swing, no syncopated melody), deep half-time drums with a big snare, sub bass and dark pads.
Sections follow src/timeline.json:
  hook     0-4 s    dark: sub drone, crackling "neural" texture; the logo forms with a boom; it opens with a bloom
  explode  4-10 s   drums and the sequence start; a blip for every tag
  booking  10-19 s  the sequence drives on; each tap is a rising chime, chips zip and lock; build
  reviews  19-23 s  the peak: four-on-the-floor, stars climb a scale, reviews fly by
  end      23-29 s  drums out, the logo forms with a boom and a bright chord, the final tap, tail
Every sound effect comes from the same timeline the video reads, so each one lands on its frame.

ElevenLabs: if public/audio/eleven/music.mp3 exists it replaces the synthesised music, and any
public/audio/eleven/sfx-<type>.mp3 replaces that effect (see audio/eleven.mjs to generate them).

Run:  python3 audio/make_audio.py   ->  public/audio/reel.wav
"""
import json, os, subprocess, wave
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
ELEVEN = os.path.join(ROOT, 'public', 'audio', 'eleven')


def load_audio(path):
    """Decode any audio file to stereo float arrays at SR (needs ffmpeg)."""
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype='<f4').reshape(-1, 2)
    return np.stack([a[:, 0], a[:, 1]])


def cue(scene, kind, k=0):
    """Time (s) of the k-th cue of a kind in a scene."""
    return STARTS[scene] + [e[0] for e in TL['sfx'][scene] if e[1] == kind][k] / TL['fps']


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


def kick(length=0.5):
    t = t_(length)
    f = 42 + 120 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    click = band_noise(0.006, 2000, 7000, seed=1) * np.exp(-np.arange(int(SR * 0.006)) / 40)
    body[:len(click)] += click * 0.18
    return np.tanh(body * 2.0)


def snare_big():
    """Cinematic snare: body, noise and a short room, made to sit in a big reverb."""
    d = 0.5
    t = t_(d)
    body = np.sin(2 * np.pi * 180 * t) * np.exp(-t * 22) + 0.5 * np.sin(2 * np.pi * 330 * t) * np.exp(-t * 30)
    n = band_noise(d, 1500, 10000, seed=4) * np.exp(-t * 9)
    return body * 0.6 + n * 0.8


def tick(seed=5):
    t = t_(0.03)
    return band_noise(0.03, 7000, 14000, seed=seed) * np.exp(-t * 160)


def seq_note(m, d, cut):
    """One step of the synth sequence: a soft square/saw blend through a low-pass."""
    t = t_(d)
    s = osc_saw(midi(m), d, cut) * 0.6 + np.sign(np.sin(2 * np.pi * midi(m) * t)) * 0.15
    return s * np.minimum(1, t / 0.003) * np.exp(-t * 10)


def sub(m, d):
    t = t_(d)
    s = np.sin(2 * np.pi * midi(m) * t) + 0.15 * np.sin(2 * np.pi * midi(m) * 2 * t)
    return s * np.minimum(1, t / 0.02) * np.clip((d - t) / 0.08, 0, 1)


def pad(ms, d, cut=1400, attack=0.5, release=0.6):
    t = t_(d)
    out = np.zeros_like(t)
    for m in ms:
        out += osc_saw(midi(m), d, cut) * 0.5 + osc_saw(midi(m), d, cut, detune=0.007) * 0.5
    return out * np.minimum(1, t / attack) * np.clip((d - t) / release, 0, 1) / len(ms)


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


def boom(d=2.2):
    t = t_(d)
    f = 26 + 70 * np.exp(-t * 4)
    s = np.tanh(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) * 2.2)
    return s * 0.9 + band_noise(d, 80, 1500, seed=12) * np.exp(-t * 5) * 0.25


def shimmer(ms, d=2.0):
    """Glassy chord: bell partials with a slow swell and a little detune."""
    t = t_(d)
    out = np.zeros_like(t)
    for m in ms:
        for dt in (0, 0.004):
            out += np.sin(2 * np.pi * midi(m) * (1 + dt) * t) + 0.3 * np.sin(2 * np.pi * midi(m) * 2 * (1 + dt) * t)
    return out * np.minimum(1, t / 0.05) * np.exp(-t * 1.2) / (2 * len(ms))


# ---------------------------------------------------------------- arrangement

PROG = [  # per bar: bass root, pad chord, sequence notes (16ths)
    (38, [50, 57, 62, 65], [62, 69, 65, 69, 74, 69, 65, 69]),  # Dm
    (34, [46, 53, 58, 62], [58, 65, 62, 65, 70, 65, 62, 65]),  # Bb
    (41, [53, 57, 60, 65], [60, 65, 69, 65, 72, 65, 69, 65]),  # F
    (36, [48, 55, 60, 64], [60, 67, 64, 67, 72, 67, 64, 67]),  # C
]

drums_L = np.zeros(N); drums_R = np.zeros(N)
duck_L = np.zeros(N); duck_R = np.zeros(N)
verb_L = np.zeros(N); verb_R = np.zeros(N)
duck = np.ones(N)


def put(bl, br, sig, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    bl[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 - pan))
    br[i:i + n] += sig[:n] * gain * np.sqrt(0.5 * (1 + pan))


def side(at, depth=0.5, rel=0.3):
    i = int(round(at * SR))
    n = min(int(rel * SR), N - i)
    if n <= 0:
        return
    seg = 1 - depth * np.exp(-np.arange(n) / (SR * rel / 4))
    duck[i:i + n] = np.minimum(duck[i:i + n], seg)


def section(t0, t1, drums='half', seq=True, cut=2400, pad_gain=0.16, ticks=True):
    b = int(round(t0 / BAR))
    tb = t0
    while tb < t1 - 1e-6:
        root, chord, notes = PROG[b % 4]
        d = min(BAR, t1 - tb)
        put(duck_L, duck_R, pad(chord, d + 0.3, 1200), tb, pad_gain, -0.1)
        put(verb_L, verb_R, pad(chord, d + 0.3, 1200), tb, pad_gain * 0.5)
        put(duck_L, duck_R, sub(root, d), tb, 0.45)
        for k in range(16):
            tt = tb + k * BEAT / 4
            if tt >= t1 - 1e-6:
                break
            beat, sixteenth = divmod(k, 4)
            if seq:
                c = cut * (0.7 + 0.3 * np.sin(2 * np.pi * (tt - t0) / (2 * BAR)))
                put(duck_L, duck_R, seq_note(notes[k % 8], BEAT / 4 * 0.95, c), tt, 0.2, (-0.25, 0.25)[k % 2])
                put(verb_L, verb_R, seq_note(notes[k % 8], BEAT / 4 * 0.95, c), tt, 0.06)
            if ticks:
                put(drums_L, drums_R, tick(seed=k + b * 16), tt, 0.1 if sixteenth else 0.16, 0.3)
            if sixteenth == 0:
                if (drums == 'half' and beat == 0) or (drums == 'four'):
                    put(drums_L, drums_R, kick(), tt, 0.95)
                    side(tt)
                if drums == 'half' and beat == 2:
                    put(drums_L, drums_R, snare_big(), tt, 0.5)
                    put(verb_L, verb_R, snare_big(), tt, 0.5)
                if drums == 'four' and beat in (1, 3):
                    put(drums_L, drums_R, snare_big(), tt, 0.42)
                    put(verb_L, verb_R, snare_big(), tt, 0.35)
            if drums == 'half' and beat == 1 and sixteenth == 2:  # the push before the snare
                put(drums_L, drums_R, kick(), tt, 0.7)
                side(tt, 0.35)
        tb += BAR
        b += 1


def riser(t0, t1, gain=0.5):
    d = t1 - t0
    s = sweep_noise(d, 400, 9000, 0.5, seed=11)
    e = (np.arange(len(s)) / len(s)) ** 2.4
    put(drums_L, drums_R, s * e, t0, gain)
    t = t_(d)
    f = 110 * (8 ** (t / d))
    put(duck_L, duck_R, np.sin(2 * np.pi * np.cumsum(f) / SR) * e * 0.3, t0, gain)


def roll(t0, t1, gain=0.5):
    t = t0
    while t < t1 - 1e-6:
        k = (t - t0) / (t1 - t0)
        put(drums_L, drums_R, snare_big()[: int(SR * 0.2)], t, gain * (0.3 + 0.7 * k))
        t += BEAT / (2 if k < 0.5 else 4)


H, X, B, R, E = (STARTS[k] for k in ('hook', 'explode', 'booking', 'reviews', 'end'))
formed, opened = cue('hook', 'form'), cue('hook', 'bloom')

# hook: drone + neural crackle; sequence fades in after the logo forms; rise into the drums
t = t_(X - H)
drone = (np.sin(2 * np.pi * midi(26) * t) + 0.5 * np.sin(2 * np.pi * midi(38) * t)) * np.minimum(1, t / 0.4)
put(duck_L, duck_R, drone, H, 0.35)
put(verb_L, verb_R, pad([50, 57, 62], X - H, 900, 0.8), H, 0.2)
for k in range(int((X - H) * 16)):  # crackle: short random blips, like neurons firing
    tt = H + rng.random() * (opened - H)
    m = 84 + int(rng.random() * 14)
    put(duck_L, duck_R, bell(m, 0.08) * 0.6, tt, 0.06 + 0.06 * rng.random(), rng.random() * 1.6 - 0.8)
for k, tt in enumerate(np.arange(formed, X - 0.05, BEAT / 4)):
    lvl = (tt - formed) / (X - formed)
    put(duck_L, duck_R, seq_note(PROG[0][2][k % 8], BEAT / 4 * 0.95, 600 + 2000 * lvl), tt, 0.08 + 0.14 * lvl, (-0.25, 0.25)[k % 2])
riser(opened - 0.6, X - 0.05, 0.45)

section(X, B - BAR, drums='half')
section(B - BAR, B, drums='half', cut=2800)
section(B, R - BAR, drums='half', pad_gain=0.12)
section(R - BAR, R - 0.1, drums='half', cut=3200)
roll(R - BAR, R - 0.1, 0.5)
riser(R - BAR, R - 0.1, 0.5)
section(R, E, drums='four', cut=3600, pad_gain=0.2)

# ending: drums out, the logo forms on a bright chord, the final tap rings out
lg, fin = cue('end', 'form'), cue('end', 'tap')
put(duck_L, duck_R, pad([50, 57, 62, 65, 69], DUR - E, 1100, 0.15, 1.5), E, 0.26)
for k, tt in enumerate(np.arange(E, DUR - 1.2, BEAT / 4)):
    fade = max(0.0, 1 - (tt - E) / (DUR - 1.2 - E))
    put(duck_L, duck_R, seq_note(PROG[(k // 16) % 4][2][k % 8], BEAT / 4 * 0.95, 1800), tt, 0.22 * fade, (-0.25, 0.25)[k % 2])
riser(E, lg - 0.03, 0.6)  # swell from the peak into the logo
put(verb_L, verb_R, shimmer([62, 65, 69, 74, 77], DUR - lg), lg, 0.5)
put(duck_L, duck_R, sub(38, DUR - lg), lg, 0.4)
put(duck_L, duck_R, shimmer([62, 66, 69, 74, 78], DUR - fin), fin, 0.35)  # resolves to D major
put(verb_L, verb_R, pad([50, 57, 62, 66, 69], DUR - fin, 1800, 0.05, 1.6), fin, 0.3)

music_L = drums_L + duck_L * duck
music_R = drums_R + duck_R * duck
irl, irr = reverb_ir(2.6, 1.7)
music_L += fftconv(verb_L, irl)[:N] * 1.0
music_R += fftconv(verb_R, irr)[:N] * 1.0

eleven_music = os.path.join(ELEVEN, 'music.mp3')
if os.path.exists(eleven_music):
    m = load_audio(eleven_music)[:, :N]
    music_L = np.zeros(N); music_R = np.zeros(N)
    music_L[:m.shape[1]] = m[0]; music_R[:m.shape[1]] = m[1]
    print('music: ElevenLabs')

# ---------------------------------------------------------------- sound effects


def stereo_sweep(s, p0=-0.8, p1=0.8):
    p = np.linspace(p0, p1, len(s))
    return np.stack([s * np.sqrt(0.5 * (1 - p)), s * np.sqrt(0.5 * (1 + p))])


def sfx(kind, seed, note=None):
    path = os.path.join(ELEVEN, f'sfx-{kind}.mp3')
    if os.path.exists(path):
        return load_audio(path)
    if kind == 'boom':
        return boom()
    if kind == 'form':  # the logo locking together: deep boom + glassy chord
        b = boom(2.4)
        sh = shimmer([62, 69, 74, 77], 2.4)
        return b * 0.8 + sh * 0.9
    if kind == 'bloom':  # opening into the light: bright swell + air
        d = 1.6
        t = t_(d)
        sh = shimmer([74, 77, 81, 86], d) * np.minimum(1, t / 0.15)
        air = sweep_noise(d, 1500, 9000, 0.6, seed) * np.exp(-t * 2.5) * 0.4
        return sh + air
    if kind == 'spark':  # electrical crackle
        d = 0.5
        out = np.zeros(int(SR * d))
        r = np.random.default_rng(seed)
        for _ in range(26):
            i = int(r.random() * (len(out) - 600))
            out[i:i + 600] += band_noise(600 / SR, 2500, 12000, seed=int(r.random() * 1e6)) * np.exp(-np.arange(600) / 80) * r.random()
        return out * 0.8
    if kind == 'blip':  # digital UI blip (pitched)
        t = t_(0.14)
        f = midi(note or 76)
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sign(np.sin(2 * np.pi * f * 2 * t))) * np.exp(-t * 30)
        return s * 0.6
    if kind in ('tap', 'star'):  # chimes that climb a scale
        t = t_(0.1)
        b = bell(note or 74, 1.0)
        b[:len(t)] += np.sin(2 * np.pi * 160 * t) * np.exp(-t * 40) * (0.5 if kind == 'tap' else 0.15)
        return b
    if kind == 'scan':
        d = 0.6
        t = t_(d)
        f = 400 * (10 ** (t / d))
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
        s = (sweep_noise(d, 500, 8000, 0.4, seed) * 0.5 + tone) * np.sin(np.pi * t / d) ** 0.8
        return stereo_sweep(s, 0.6, -0.6)
    if kind == 'lock':  # chip docking: click + low thud + ping
        t = t_(0.4)
        click = band_noise(0.4, 3000, 12000, seed) * np.exp(-t * 300)
        thud = np.sin(2 * np.pi * 90 * t) * np.exp(-t * 25)
        ping = np.sin(2 * np.pi * 2093 * t) * np.exp(-t * 18) * 0.25
        return click * 0.6 + thud * 0.7 + ping
    if kind == 'zip':
        d = 0.22
        s = sweep_noise(d, 900, 9000, 0.45, seed)
        return stereo_sweep(s * np.sin(np.pi * np.linspace(0, 1, len(s))) ** 1.5, 0.4, -0.4)
    if kind == 'flyby':  # passing the camera: rising then falling, panned across
        d = 0.8
        t = t_(d)
        s = sweep_noise(d, 400, 5000, 0.5, seed) * np.exp(-((t - 0.5 * d) / (0.18 * d)) ** 2)
        return stereo_sweep(s, -0.9, 0.9)
    if kind == 'crash':
        return crash()
    if kind == 'tick':
        return tick(seed) * 1.5
    if kind in ('whoosh', 'whip', 'swish', 'send'):
        d = {'whoosh': 0.6, 'whip': 0.3, 'swish': 0.4, 'send': 0.4}[kind]
        f1 = {'whoosh': 3500, 'whip': 7000, 'swish': 3000, 'send': 5000}[kind]
        s = sweep_noise(d, 400, f1, 0.5, seed)
        x = np.linspace(0, 1, len(s))
        return stereo_sweep(s * np.sin(np.pi * x ** 0.7) ** 2, 0.8, -0.8)
    if kind == 'hit':
        t = t_(0.6)
        s = kick(0.6)
        c = snare_big()
        s[:len(c)] += c[:len(s)] * 0.5
        return s * 0.8
    if kind == 'pop':
        t = t_(0.09)
        f = 350 + 1300 * (1 - np.exp(-t * 60))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.9
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
        k += 1
        snd = sfx(e[1], 100 + k, e[3] if len(e) > 3 else None)
        at = STARTS[scene] + e[0] / TL['fps']
        if snd.ndim == 1:
            put(fx_L, fx_R, snd, at, e[2])
        else:
            j = int(round(at * SR))
            n = min(snd.shape[1], N - j)
            fx_L[j:j + n] += snd[0][:n] * e[2]
            fx_R[j:j + n] += snd[1][:n] * e[2]
fx_send = (fx_L + fx_R) * 0.5
fx_L += fftconv(fx_send, irl)[:N] * 0.3
fx_R += fftconv(fx_send, irr)[:N] * 0.3

# ---------------------------------------------------------------- master
mix_L = music_L * 0.85 + fx_L * 0.8
mix_R = music_R * 0.85 + fx_R * 0.8
tail = np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1)
mix_L *= tail
mix_R *= tail
peak = max(np.max(np.abs(mix_L)), np.max(np.abs(mix_R)))
drive = 1.8
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
