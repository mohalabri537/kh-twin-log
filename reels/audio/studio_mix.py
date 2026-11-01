"""Mix the studio cut's soundtrack: the chosen ElevenLabs take, trimmed so its first downbeat is frame 0, cut to the
film's length with a short fade, at -14 LUFS with true peaks under -1.5 dBTP. Reads src/studio/plan.ts.
Usage: python3 audio/studio_mix.py   ->  public/audio/studio/studio.wav"""
import json, os, re, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
plan = open(os.path.join(ROOT, 'src', 'studio', 'plan.ts')).read()
take = re.search(r"take: '([^']+)'", plan).group(1)
trim = float(re.search(r'trim: ([\d.]+)', plan).group(1))
total = int(re.search(r'TOTAL = (\d+)', plan).group(1)) / int(re.search(r'FPS = (\d+)', plan).group(1))
src, out = os.path.join(ROOT, take), os.path.join(ROOT, 'public', 'audio', 'studio', 'studio.wav')
chain = f'atrim=start={trim}:duration={total},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={total - 0.5}:d=0.5'
# pass 1: measure, pass 2: normalise (linear, so the dynamics are untouched)
m = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', chain + ',loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind('{'):m.rfind('}') + 1])
ln = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', chain + ',' + ln + ',aresample=48000', '-ar', '48000', '-ac', '2', out], check=True)
print('wrote', out, f'({total:.2f} s; take {os.path.basename(take)} from {trim:.2f} s; measured {j["input_i"]} LUFS)')
