# -*- coding: utf-8 -*-
"""
Quick shot viewer (no timeline needed): renders shots straight from the engine at given local times,
applies the film grade and saves a contact sheet.

  python3 qa_view.py t_horn:2.0 t_swamp:1.0 --scale 0.6667 --out /tmp/qa/view.jpg
  python3 qa_view.py hb01:0,1.5,3 --dur 4 --hero      # several times of one shot
"""
import os, sys, json, argparse, time
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render as R


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("items", nargs="+", help="shot_id:t1,t2,...")
    ap.add_argument("--dur", type=float, default=4.0)
    ap.add_argument("--scale", type=float, default=0.6667)
    ap.add_argument("--hero", action="store_true")
    ap.add_argument("--out", default="/tmp/qa/view.jpg")
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--w", type=int, default=720)
    ap.add_argument("--nograde", action="store_true")
    a = ap.parse_args()
    wk = R.Worker(scale=a.scale)
    lst = {s["id"]: s for s in wk.shot_list}
    tiles = []
    for it in a.items:
        sid, _, ts = it.partition(":")
        if sid not in lst:
            print("unknown shot", sid); continue
        times = [float(x) for x in ts.split(",")] if ts else [a.dur * 0.5]
        spec = lst[sid]
        dur = float(os.environ.get("SHOT_DUR", a.dur))
        for t in times:
            t0 = time.time()
            shot = {"id": sid, "dur": dur, "start": 0, "end": dur}
            img = wk.frame3d(shot, t, {}, a.hero)
            if not a.nograde:
                img = R.post(img, 0, spec.get("grade") or "day", hero=a.hero)
            if wk.errors:
                print("PAGE ERRORS:", wk.errors[-3:]); wk.errors.clear()
            h = int(a.w * img.shape[0] / img.shape[1])
            tile = cv2.resize(img, (a.w, h), interpolation=cv2.INTER_AREA)
            cv2.putText(tile, f"{sid} t={t:g}", (8, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2, cv2.LINE_AA)
            tiles.append(tile)
            print(f"{sid} t={t:g}  {time.time() - t0:.1f}s", flush=True)
    wk.close()
    if not tiles:
        return
    rows = []
    for i in range(0, len(tiles), a.cols):
        row = tiles[i:i + a.cols]
        while len(row) < a.cols:
            row.append(np.zeros_like(tiles[0]))
        rows.append(np.hstack(row))
    sheet = np.vstack(rows)
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    cv2.imwrite(a.out, cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print("saved", a.out, sheet.shape)


if __name__ == "__main__":
    main()
