#!/usr/bin/env bash
# Mix for the voiced Story reel: voice take B (its first 0.7 s of silence trimmed, placed 0.133 s in, so the voice's
# time t lands at video time t - 0.567), over score variation 2, ducked under the voice, 28 s, -14 LUFS.
set -euo pipefail
cd "$(dirname "$0")/../public/audio/story"
T=$(mktemp -d)
# the voice, cleaned and levelled, as a 28 s stereo track
ffmpeg -v error -y -i vo-b.mp3 -af "atrim=start=0.7,asetpts=PTS-STARTPTS,adelay=133|133,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-15:TP=-2" -ar 48000 -ac 2 "$T/vo.wav"
ffmpeg -v error -y -i "$T/vo.wav" -af "apad,atrim=0:28" -ar 48000 -ac 2 "$T/vo28.wav"
ffmpeg -v error -y -i music-2.mp3 -af "atrim=0:28,afade=t=out:st=27:d=1,volume=0.62" -ar 48000 -ac 2 "$T/mus.wav"
ffmpeg -v error -y -i "$T/mus.wav" -i "$T/vo28.wav" -filter_complex "
[1:a]asplit=2[vo][key];
[0:a][key]sidechaincompress=threshold=0.04:ratio=5:attack=30:release=350[duck];
[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,atrim=0:28[out]" -map "[out]" -ar 48000 -c:a libmp3lame -b:a 256k mix.mp3
rm -r "$T"
ffmpeg -hide_banner -i mix.mp3 -af ebur128 -f null - 2>&1 | grep -E '^\s+I:'
