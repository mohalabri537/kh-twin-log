"""Measure music takes (no listening needed): when the music starts, loudness over time, tempo and how steady the
pulse is, brightness, low end, and how it ends. Usage: python3 audio/analyse_takes.py <file.mp3>..."""
import subprocess, sys
import numpy as np
SR = 22050

def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)

def lufs(p):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    tail = out[out.rfind('Summary:'):]
    i = float(tail.split('I:')[1].split('LUFS')[0]); lra = float(tail.split('LRA:')[1].split('LU')[0])
    return i, lra

for p in sys.argv[1:]:
    x = load(p); n = len(x) / SR
    hop = SR // 4
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(rms)
    start = np.argmax(db > -45) * 0.25
    # spectral flux onset envelope at ~86 Hz frame rate
    w, h = 1024, 256
    frames = np.lib.stride_tricks.sliding_window_view(x, w)[::h] * np.hanning(w)
    S = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(0, np.diff(np.log1p(S * 10), axis=0)).sum(1)
    flux = flux - np.convolve(flux, np.ones(16) / 16, 'same')
    flux = np.maximum(flux, 0)
    fr = SR / h
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    lags = np.arange(len(ac)) / fr
    sel = (lags > 60 / 180) & (lags < 60 / 55)
    best = lags[sel][np.argmax(ac[sel])]
    bpm = 60 / best
    steady = ac[sel].max() / ac[0]
    freqs = np.fft.rfftfreq(w, 1 / SR)
    spec = S.mean(0)
    centroid = (spec * freqs).sum() / spec.sum()
    low = spec[freqs < 120].sum() / spec.sum()
    I, LRA = lufs(p)
    curve = ' '.join(f'{v:.0f}' for v in [db[int(t * 4):int(t * 4) + 8].mean() for t in range(0, int(n), 2)])
    end = db[-8:].mean(); peak = np.percentile(db, 95)
    print(f'{p.split("/")[-1]}: {n:.1f}s  starts {start:.2f}s  {I:.1f} LUFS  LRA {LRA:.1f}  tempo ~{bpm:.1f} BPM (pulse strength {steady:.2f})  '
          f'centroid {centroid:.0f} Hz  low<120Hz {low * 100:.1f}%  last 2 s {end - peak:.0f} dB under the loud parts')
    print('   dB every 2 s:', curve)
