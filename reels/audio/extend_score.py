"""Lengthens a score by repeating whole bars of its groove, cut exactly on the beat with a short crossfade.
Usage: python3 audio/extend_score.py in.mp3 out.wav BPM PHASE FROM_BEAT TO_BEAT
Plays the score up to beat TO_BEAT, then jumps back to beat FROM_BEAT and plays on to the end (adds TO-FROM beats)."""
import subprocess, sys
import numpy as np
src, dst, bpm, ph, b0, b1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6])
sr = 48000
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '2', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).reshape(-1, 2)
T = 60 / bpm
a, b = int(round((ph + b1 * T) * sr)), int(round((ph + b0 * T) * sr))
fade = int(0.03 * sr)
# how alike the two cut points sound (one bar after each), as a check that the loop is seamless
bar = int(4 * T * sr)
def spec(i):
    seg = x[i:i + bar, 0]
    return np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
sa, sb = spec(a), spec(b)
print('similarity of the two bars:', round(float(np.dot(sa, sb) / np.linalg.norm(sa) / np.linalg.norm(sb)), 3))
w = np.linspace(0, 1, fade)[:, None]
out = np.concatenate([x[:a - fade], x[a - fade:a] * (1 - w) + x[b - fade:b] * w, x[b:]])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '2', '-i', '-', dst], input=out.astype(np.float32).tobytes(), check=True)
print('wrote', dst, round(len(out) / sr, 2), 's; added', round((a - b) / sr, 3), 's')
