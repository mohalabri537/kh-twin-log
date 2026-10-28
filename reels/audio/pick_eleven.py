"""Choose among ElevenLabs takes and line the score up with the reel.

Usage: python3 audio/pick_eleven.py <candidates_dir>
  candidates_dir holds music-<n>.mp3 and sfx-<type>-<n>.mp3 downloads.
Writes the chosen files to public/audio/eleven/ (music.mp3 aligned to the 120 BPM grid, sfx-<type>.mp3).

Music: the take whose loudness curve best matches the reel's plan (dark intro, drums from 4 s, peak
19-23 s, drop at 23 s, resolve) wins; it is then shifted by under half a beat so its beats land on the
video's beat grid. Sound effects: the take with the cleanest, strongest attack and least trailing noise.
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


def beat_offset(x):
    """Phase (s) of the 120 BPM grid that best matches the music's onsets."""
    d, dt = onset_strength(x)
    best, best_score = 0.0, -1
    for off in np.arange(0, BEAT, 0.01):
        idx = ((np.arange(off, len(d) * dt, BEAT)) / dt).astype(int)
        idx = idx[idx < len(d)]
        score = d[idx].mean()
        if score > best_score:
            best, best_score = off, score
    return best, best_score / (d.mean() + 1e-9)


def pick_music(cands):
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
    rows.sort(reverse=True)
    return rows[0]


def pick_sfx(cands):
    rows = []
    for c in cands:
        x = load(c)
        if len(x) < 100:
            continue
        a = np.abs(x)
        peak = a.max()
        attack = np.argmax(a > 0.5 * peak) / SR
        tail = np.sqrt(np.mean(x[int(len(x) * 0.85):] ** 2)) / (peak + 1e-9)
        score = peak - 0.6 * attack - 2 * tail
        rows.append((score, c))
    rows.sort(reverse=True)
    return rows[0][1] if rows else None


def main(d):
    os.makedirs(OUT, exist_ok=True)
    music = sorted(glob.glob(os.path.join(d, 'music-*.mp3')))
    if music:
        print('music takes:')
        _, corr, strength, off, best = pick_music(music)
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
        best = pick_sfx(sorted(glob.glob(os.path.join(d, f'sfx-{k}-*.mp3'))))
        if best:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', best, os.path.join(OUT, f'sfx-{k}.mp3')], check=True)
            print(f'sfx {k}: {os.path.basename(best)}')


if __name__ == '__main__':
    main(sys.argv[1])
