#!/usr/bin/env bash
# Renders the five What-if Shorts (picture + graphics in one pass, full-resolution hero quality) and muxes the mix.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$(cd "$HERE/.." && pwd)"
S=${SCRATCH:-/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad}
cd "$HERE"
python3 audio_whatif.py
for K in ${@:-E L G S F}; do
  WHATIF=$K python3 render.py --all --workers 3
  NAME=$(python3 -c "import script_whatif as W;print(W.SHORTS['$K']['file'])")
  ffmpeg -y -hide_banner -loglevel error -i "$S/film_video_whatif_$K.mp4" -i "$S/whatif_${K}_mix.wav" -map 0:v:0 -map 1:a:0 \
    -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -af "loudnorm=I=-14:TP=-1.5:LRA=9" -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest "$OUT/$NAME.mp4"
  ls -la "$OUT/$NAME.mp4"
done
