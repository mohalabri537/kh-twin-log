"""Choose among ElevenLabs takes and line the score up with the reel.

Usage: python3 audio/pick_eleven.py <candidates_dir> [--music N]
  candidates_dir holds music-<n>.mp3 and sfx-<type>-<n>.mp3 downloads.
Writes the chosen files to public/audio/eleven/ (music.mp3 aligned to the 120 BPM grid, sfx-<type>.mp3).

Music: the take whose loudness curve best matches the reel's plan (dark intro, drums from 4 s, peak
19-23 s, drop at 23 s, resolve) wins; it is then shifted by under half a beat so its beats land on the
video's beat grid. Sound effects: the softest take (least harsh high end, rounded onset, little trailing noise).
"""
import glob, json, os, subprocess, sys
import numpy as np

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'src', 'timeline.json')))
BEAT = 60 / TL['bpm']
DUR = sum(s['len'] for s in TL['scenes']) / TL['fps']
OUT = os.path.join(ROOT, 'public', 'audio', 'eleven')


def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<f4').copy()


def envelope(x, hop=0.25):
    n = int(hop * SR)
    k = len(x) // n
    return np.array([np.sqrt(np.mean(x[i * n:(i + 1) * n] ** 2) + 1e-12) for i in range(k)])


def target_env():
    """Loudness plan from the scene timeline: quiet hook, groove, build, peak, drop, resolve."""
    t = np.arange(0, DUR, 0.25)
    starts, acc = {}, 0
    for s in TL['scenes']:
        starts[s['id']] = acc / TL['fps']
        acc += s['len']
    plan = np.full_like(t, 0.6)
    plan[t < starts['explode']] = 0.25
    plan[(t >= starts['reviews']) & (t < starts['end'])] = 1.0
    plan[(t >= starts['reviews'] - 2) & (t < starts['reviews'])] = 0.8
    plan[(t >= starts['end']) & (t < starts['end'] + 1.5)] = 0.3
    plan[t >= starts['end'] + 1.5] = 0.55
    return plan


def onset_strength(x):
    hop = 512
    frames = len(x) // hop
    e = np.array([np.sum(x[i * hop:(i + 1) * hop] ** 2) for i in range(frames)])
    d = np.maximum(0, np.diff(np.log(e + 1e-9), prepend=0))
    return d, hop / SR


def lowpass(x, fc):
    X = np.fft.rfft(x)
    X[np.fft.rfftfreq(len(x), 1 / SR) > fc] = 0
    return np.fft.irfft(X, len(x))


def grid_phase(d, dt):
    best, best_score = 0.0, -1
    for off in np.arange(0, BEAT, 0.01):
        idx = ((np.arange(off, len(d) * dt, BEAT)) / dt).astype(int)
        idx = idx[idx < len(d)]
        score = d[idx].mean()
        if score > best_score:
            best, best_score = off, score
    return best, best_score / (d.mean() + 1e-9)


def beat_offset(x):
    """Phase (s) of the 120 BPM grid that best matches the music's beat. The kick drum defines the
    beat, so look at the low end first; busy hats and 16th notes can pull a full-band guess off it."""
    off, clarity = grid_phase(*onset_strength(lowpass(x, 150)))
    if clarity > 2:
        return off, clarity
    return grid_phase(*onset_strength(x))


def pick_music(cands, force=None):
    plan = target_env()
    rows = []
    for c in cands:
        x = load(c)
        env = envelope(x)[: len(plan)]
        p = plan[: len(env)]
        env_n = (env - env.mean()) / (env.std() + 1e-9)
        p_n = (p - p.mean()) / (p.std() + 1e-9)
        corr = float(np.mean(env_n * p_n))
        off, strength = beat_offset(x)
        rows.append((corr + 0.05 * min(strength, 3), corr, strength, off, c))
        print(f'  {os.path.basename(c)}: plan match {corr:+.2f}, beat clarity {strength:.2f}, beat phase {off:.2f}s, length {len(x) / SR:.1f}s')
    if force:
        return next(r for r in rows if os.path.basename(r[4]) == f'music-{force}.mp3')
    rows.sort(reverse=True)
    return rows[0]


KEY = {2, 4, 6, 7, 9, 11}  # D E F# G A B: notes that sit with the score (D)
REPITCHED = {'blip', 'tap', 'star'}  # make_audio.py tunes these to their notes, so their own key doesn't matter


def pick_sfx(cands, in_key=True):
    """The softest usable take: least energy where the ear hears harshness (2.5-8 kHz, then the air
    above), a rounded rather than instant onset, no trailing noise on sounds meant to decay, and, for
    pitched takes, notes that sit in the score's key."""
    rows = []
    for c in cands:
        x = load(c)
        if len(x) < 100:
            continue
        a = np.abs(x)
        peak = a.max() + 1e-9
        S = np.abs(np.fft.rfft(x)) ** 2
        f = np.fft.rfftfreq(len(x), 1 / SR)
        bright = (S[(f > 2500) & (f < 8000)].sum() + 0.5 * S[f >= 8000].sum()) / S.sum()
        on = int(np.argmax(a > 0.1 * peak))
        snap = a[on:on + int(0.005 * SR)].max() / peak  # 1.0 = full level within 5 ms
        h = len(x) // 2
        decays = np.mean(x[:h] ** 2) > np.mean(x[h:] ** 2)  # swells end loud on purpose
        tail = np.sqrt(np.mean(x[int(len(x) * 0.85):] ** 2)) / peak if decays else 0.0
        # key fit: share of the tonal peaks (100 Hz-5 kHz) on notes outside the key, weighted by how tonal it is
        band = (f > 100) & (f < 5000)
        sb, fb = S[band], f[band]
        pk = np.where((sb[1:-1] > sb[:-2]) & (sb[1:-1] > sb[2:]))[0] + 1
        pk = pk[np.argsort(sb[pk])[-12:]]
        pc = (np.round(12 * np.log2(fb[pk] / 440)) + 9).astype(int) % 12
        off_key = sb[pk][[p not in KEY for p in pc]].sum() / (sb[pk].sum() + 1e-12)
        tonal = 1 - np.exp(np.mean(np.log(sb + 1e-12))) / (np.mean(sb) + 1e-12)
        rows.append((-bright - 0.3 * snap - 2 * tail - (0.6 * off_key * tonal if in_key else 0), c))
    rows.sort(reverse=True)
    return rows[0][1] if rows else None


def main(d, force=None):
    os.makedirs(OUT, exist_ok=True)
    music = sorted(glob.glob(os.path.join(d, 'music-*.mp3')))
    if music:
        print('music takes:')
        _, corr, strength, off, best = pick_music(music, force)
        # shift so the music's beats sit on the video's grid (advance by its phase)
        shift = off if off < BEAT / 2 else off - BEAT
        print(f'chosen {os.path.basename(best)}; shifting by {-shift:+.2f}s to land on the beat')
        if shift >= 0:
            filt = f'atrim=start={shift:.3f},asetpts=PTS-STARTPTS'
        else:
            filt = f'adelay={int(-shift * 1000)}|{int(-shift * 1000)}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', best, '-af', filt, '-ar', str(SR), os.path.join(OUT, 'music.mp3')], check=True)
    kinds = sorted({os.path.basename(p).split('-')[1] for p in glob.glob(os.path.join(d, 'sfx-*-*.mp3'))})
    for k in kinds:
        best = pick_sfx(sorted(glob.glob(os.path.join(d, f'sfx-{k}-*.mp3'))), in_key=k not in REPITCHED)
        if best:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', best, os.path.join(OUT, f'sfx-{k}.mp3')], check=True)
            print(f'sfx {k}: {os.path.basename(best)}')


if __name__ == '__main__':
    # --music N uses take N instead of the automatic pick (still aligned to the beat)
    a = sys.argv[1:]
    force = a[a.index('--music') + 1] if '--music' in a else None
    main(a[0], force)
