"""Replaces one spoken line inside a voice take with a re-recorded line, without moving anything after it.
Usage: python3 audio/splice_line.py take.mp3 line.mp3 out.wav START END
The take's speech from START to END (s) is replaced by the line's speech (its leading/trailing silence trimmed),
matched to the original's loudness; the rest is padded with silence, so every later word keeps its time.
If the new line runs past END it may only spill into the silence that follows."""
import subprocess, sys
import numpy as np
take, line, dst, s, e = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), float(sys.argv[5])
sr = 48000
load = lambda f: np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout, np.float32).copy()
x, y = load(take), load(line)
# trim the line to its speech
env = np.convolve(np.abs(y), np.ones(480) / 480, 'same')
on = np.where(env > 10 ** (-38 / 20))[0]
y = y[max(0, on[0] - 240):on[-1] + 2400]
# match loudness to the replaced part
a, b = int(s * sr), int(e * sr)
rms = lambda v: np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2))
y *= rms(x[a:b]) / rms(y)
end = a + len(y)
fade = np.linspace(0, 1, 240)
y[:240] *= fade; y[-2400:] *= np.linspace(1, 0, 2400)
out = np.concatenate([x[:a], y, np.zeros(max(0, b - end), np.float32), x[max(b, end):]])
spill = (end - b) / sr
print(f'line {len(y) / sr:.2f} s in a {e - s:.2f} s slot; ends at {end / sr:.2f} s' + (f' (spills {spill:.2f} s into the pause)' if spill > 0 else ''))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(sr), '-ac', '1', '-i', '-', dst], input=out.astype(np.float32).tobytes(), check=True)
