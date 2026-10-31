#!/bin/sh
# Unpacks each recording in public/rec into numbered JPEG frames (public/rec/<name>/0000.jpg ...) for the 3D screens.
# Phones at 780 px wide (sharp at the size they appear), the desktop at full size.
cd "$(dirname "$0")/../public/rec" || exit 1
for f in *.mp4; do
  n="${f%.mp4}"; rm -rf "$n"; mkdir -p "$n"
  case "$n" in phone-*) s="scale=780:-2" ;; *) s="scale=1440:-2" ;; esac
  ffmpeg -v error -i "$f" -vf "$s" -q:v 3 -start_number 0 "$n/%04d.jpg"
  echo "$n $(ls "$n" | wc -l) frames"
done
