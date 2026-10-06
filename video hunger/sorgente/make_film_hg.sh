#!/usr/bin/env bash
# Final assembly: rendered chunks (picture + graphics, 30 fps) + mixed audio -> the master, then 95 MB parts for GitHub + a small preview.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
S=${SCRATCH:-/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad}
OUT="$(cd "$HERE/.." && pwd)"
MASTER="$S/Hunger_Arena_100.mp4"
python3 "$HERE/render.py" --all --workers 3        # no-op when every chunk exists: concatenates into film_video.mp4
DUR=$(python3 -c "import json;print(json.load(open('$HERE/timeline.json'))['total'])")
ffmpeg -y -hide_banner -loglevel error -i "$S/film_video.mp4" -i "$S/audio/mix.wav" -map 0:v:0 -map 1:a:0 -c:v copy \
  -af "loudnorm=I=-15:TP=-1.5:LRA=9,afade=t=in:st=0:d=0.8,afade=t=out:st=$(python3 -c "print($DUR-2.0)"):d=2.0" -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$MASTER"
ls -la "$MASTER"
mkdir -p "$OUT/film_parti"; rm -f "$OUT/film_parti/"*.part*
split -b 95M -d -a 2 "$MASTER" "$OUT/film_parti/Hunger_Arena_100.mp4.part"
N=$(ls "$OUT/film_parti/"*.part* | wc -l)
{ echo '@echo off'; echo 'cd /d "%~dp0"'; printf 'copy /b '; for i in $(seq 0 $((N-1))); do printf 'Hunger_Arena_100.mp4.part%02d' "$i"; [ "$i" -lt $((N-1)) ] && printf '+'; done; echo ' Hunger_Arena_100.mp4'; echo 'pause'; } > "$OUT/film_parti/UNISCI_WINDOWS.bat"
printf '#!/bin/sh\ncd "$(dirname "$0")"\ncat Hunger_Arena_100.mp4.part* > Hunger_Arena_100.mp4\n' > "$OUT/film_parti/unisci_mac_linux.sh"; chmod +x "$OUT/film_parti/unisci_mac_linux.sh"
(cd "$OUT/film_parti" && sha256sum "$MASTER" | awk '{print $1"  Hunger_Arena_100.mp4"}' > SHA256.txt)
ffmpeg -y -hide_banner -loglevel error -i "$MASTER" -vf scale=960:540,fps=24 -c:v libx264 -preset slow -b:v 480k -maxrate 650k -bufsize 1300k -c:a aac -b:a 64k -movflags +faststart "$OUT/anteprima_completa_540p.mp4"
ls -la "$OUT/film_parti" "$OUT/anteprima_completa_540p.mp4"
