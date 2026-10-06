# -*- coding: utf-8 -*-
"""Render sample frames of shots (post-graded like the film, no overlays) and build contact sheets for QA.
  python3 qa_shots.py --prefix a_ --out /tmp/qa/a          # shots whose id starts with a_
  python3 qa_shots.py --ids a_01,a_02 --at 0.2,0.5,0.85    # specific shots at fractions of their duration
  python3 qa_shots.py --range h01 n05                       # all shots anchored between two segments
Writes <out>/<id>_<k>.jpg and <out>/sheet_<n>.jpg (3 columns). Prints page errors per shot."""
import os, sys, json, argparse
import numpy as np, cv2
os.environ.setdefault("RENDER_URL", "http://127.0.0.1:8125/index.html")
os.environ.setdefault("RENDER_SCALE", "1.0")
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import render as R

ap = argparse.ArgumentParser()
ap.add_argument("--prefix", default=None); ap.add_argument("--ids", default=None); ap.add_argument("--range", nargs=2, default=None)
ap.add_argument("--at", default="0.25,0.8"); ap.add_argument("--out", default="/tmp/qa/x"); ap.add_argument("--cols", type=int, default=3)
ap.add_argument("--rows", type=int, default=6); ap.add_argument("--hero", default="auto")
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
rd = R.Renderer()
sel = rd.shots
if a.prefix: sel = [s for s in sel if s["id"].startswith(a.prefix)]
if a.ids: ids = a.ids.split(","); sel = [s for s in sel if s["id"] in ids]
if a.range:
    t0 = R.resolve(a.range[0], rd.tl, rd.seg_by, rd.chap_by); t1 = R.resolve(a.range[1], rd.tl, rd.seg_by, rd.chap_by)
    sel = [s for s in sel if t0 - 1e-6 <= s["start"] < t1]
fr = [float(x) for x in a.at.split(",")]
tiles = []
for s in sel:
    for k, f in enumerate(fr):
        t = s["start"] + s["dur"] * f
        hero = None if a.hero == "auto" else (a.hero == "1")
        try:
            img, _ = rd.band(t, int(t * 24), hero)
        except Exception as e:
            print("ERR", s["id"], str(e)[:300]); continue
        bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        cv2.imwrite(f"{a.out}/{s['id']}_{k}.jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, 90])
        th = cv2.resize(bgr, (640, 268), interpolation=cv2.INTER_AREA)
        cv2.putText(th, f"{s['id']} {s['start']:.1f}s d={s['dur']:.1f}{' H' if s.get('hero') else ''}", (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 3)
        cv2.putText(th, f"{s['id']} {s['start']:.1f}s d={s['dur']:.1f}{' H' if s.get('hero') else ''}", (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
        tiles.append(th)
    print(s["id"], f"{s['start']:.1f}", f"{s['dur']:.1f}", flush=True)
per = a.cols * a.rows
for n in range(0, len(tiles), per):
    chunk = tiles[n:n + per]
    while len(chunk) % a.cols: chunk.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(chunk[i:i + a.cols]) for i in range(0, len(chunk), a.cols)]
    cv2.imwrite(f"{a.out}/sheet_{n // per}.jpg", np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
rd.wk.close()
print("done", len(sel), "shots")
