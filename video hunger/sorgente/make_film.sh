#!/usr/bin/env bash
# Final assembly: rendered picture + on-screen graphics + mixed audio -> the film for YouTube.
#   1) python3 timeline.py            (timeline from the narration)
#   2) python3 render.py --all        (picture without text, resumable chunks -> film_video.mp4)
#   3) python3 music.py && python3 sfx.py && python3 mix.py
#   4) bash make_film.sh              (finish.py: titles, YEAR + POPULATION HUD, end screen, audio, x264)
# GitHub refuses files over 100 MB, so the master is also cut into 95 MB pieces
# (film_parti/) with one-click join scripts, plus a small full-length preview.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
S=${SCRATCH:-/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad}
OUT=${OUT:-"$(cd "$HERE/.." && pwd)"}
VID="$S/film_video.mp4"
MIX="$S/audio/mix.wav"
MASTER="$S/Forest_vs_Plain_Day_365.mp4"
python3 "$HERE/finish.py" --video "$VID" --audio "$MIX" --out "$MASTER"
ls -la "$MASTER"
# pieces for GitHub + join scripts
mkdir -p "$OUT/film_parti"; rm -f "$OUT/film_parti/"*.part*
split -b 95M -d -a 2 "$MASTER" "$OUT/film_parti/Forest_vs_Plain_Day_365.mp4.part"
N=$(ls "$OUT/film_parti/"*.part* | wc -l)
{
  echo '@echo off'
  echo 'cd /d "%~dp0"'
  printf 'copy /b '; for i in $(seq -w 0 $((N-1))); do printf 'Forest_vs_Plain_Day_365.mp4.part%02d' "$((10#$i))"; [ "$i" -lt $((N-1)) ] && printf '+'; done; echo ' Forest_vs_Plain_Day_365.mp4'
  echo 'echo Fatto! Il film e'"'"' in Forest_vs_Plain_Day_365.mp4'
  echo 'pause'
} > "$OUT/film_parti/UNISCI_WINDOWS.bat"
printf '#!/bin/sh\ncd "$(dirname "$0")"\ncat Forest_vs_Plain_Day_365.mp4.part* > Forest_vs_Plain_Day_365.mp4\necho "Fatto: Forest_vs_Plain_Day_365.mp4"\n' > "$OUT/film_parti/unisci_mac_linux.sh"
chmod +x "$OUT/film_parti/unisci_mac_linux.sh"
(cd "$OUT/film_parti" && sha256sum "$MASTER" | awk '{print $1"  Forest_vs_Plain_Day_365.mp4"}' > SHA256.txt)
# a small full-length preview that fits in one GitHub file
ffmpeg -y -hide_banner -loglevel error -i "$MASTER" -vf scale=960:540 -c:v libx264 -preset slow -b:v 520k -maxrate 700k -bufsize 1400k \
  -c:a aac -b:a 64k -movflags +faststart "$OUT/anteprima_completa_540p.mp4"
ls -la "$OUT/film_parti" "$OUT/anteprima_completa_540p.mp4"
