#!/usr/bin/env bash
# Mixes for the voiced Story reels, ducked under the voice, -14 LUFS.
#   ar: voice take B (first 0.7 s of silence trimmed, placed 0.133 s in: voice time t lands at video t - 0.567)
#       over score variation 2, 28 s -> mix.mp3
#   en: English voice take B (placed 0.2 s in: voice time t lands at video t + 0.2) over score variation 2,
#       lengthened by 4 bars (beats 24-40 repeated, so its final hit lands on "today"), 38 s -> mix-en.mp3
set -euo pipefail
cd "$(dirname "$0")/.."
LANGV=${1:-ar}
D=public/audio/story
T=$(mktemp -d)
if [ "$LANGV" = en ]; then
  VO="$D/en-b.mp3"; VOF="adelay=200|200"; LEN=38; OUT="$D/mix-en.mp3"
  python3 -I audio/extend_score.py "$D/music-2.mp3" "$T/score.wav" 118 0.11 24 40 >/dev/null
  SCORE="$T/score.wav"
else
  VO="$D/vo-b.mp3"; VOF="atrim=start=0.7,asetpts=PTS-STARTPTS,adelay=133|133"; LEN=28; OUT="$D/mix.mp3"
  SCORE="$D/music-2.mp3"
fi
# the voice, cleaned and levelled, padded to length
ffmpeg -v error -y -i "$VO" -af "$VOF,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-15:TP=-2" -ar 48000 -ac 2 "$T/vo.wav"
ffmpeg -v error -y -i "$T/vo.wav" -af "apad,atrim=0:$LEN" -ar 48000 -ac 2 "$T/voL.wav"
ffmpeg -v error -y -i "$SCORE" -af "atrim=0:$LEN,afade=t=out:st=$((LEN - 1)):d=1,volume=0.62" -ar 48000 -ac 2 "$T/mus.wav"
ffmpeg -v error -y -i "$T/mus.wav" -i "$T/voL.wav" -filter_complex "
[1:a]asplit=2[vo][key];
[0:a][key]sidechaincompress=threshold=0.04:ratio=5:attack=30:release=350[duck];
[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,atrim=0:$LEN[out]" -map "[out]" -ar 48000 -c:a libmp3lame -b:a 256k "$OUT"
rm -r "$T"
echo "$OUT: $(ffmpeg -hide_banner -i "$OUT" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tr -s ' ')"
