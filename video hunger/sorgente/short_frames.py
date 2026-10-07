# -*- coding: utf-8 -*-
"""Renders the frames of the vertical Short: every shot of web/shots/short.js, hero quality, 1080x1920 at 1.5x supersampling,
graded, saved as JPG (q98) in SCRATCH/short_frames/<name>/NNNN.jpg.  Resumable (existing frames are skipped).
  python3 short_frames.py
"""
import os, sys, time
import cv2
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import grab

S = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
OUT = os.path.join(S, "short_frames")
FPS = 30
SCALE = float(os.environ.get("SHORT_SCALE", "1.5"))


def main():
    g = grab.Grabber(1080, 1920, SCALE)
    lst = g.page.evaluate('window.SHORT')
    grades = {x['id']: x['grade'] for x in g.page.evaluate('window.SHOT_LIST')}
    for s in lst:
        d = os.path.join(OUT, s['name']); os.makedirs(d, exist_ok=True)
        n = 1 if s['name'] == 'end' else int(round(s['dur'] * FPS))
        todo = [i for i in range(n) if not os.path.exists(f"{d}/{i:04d}.jpg")]
        if not todo:
            continue
        g.load(s['id'], s['dur'])
        t0 = time.time()
        for k, i in enumerate(todo):
            img = grab.grade_img(g.at(i / FPS if s['name'] != 'end' else 1.5), grades.get(s['id'], 'day'), True)
            img = cv2.resize(img, (1080, 1920), interpolation=cv2.INTER_AREA)
            tmp = f"{d}/{i:04d}.tmp.jpg"
            cv2.imwrite(tmp, cv2.cvtColor(img, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 98])
            os.replace(tmp, f"{d}/{i:04d}.jpg")
            if k % 10 == 0:
                print(s['name'], i, n, f"{(time.time() - t0) / (k + 1):.2f}s/frame", flush=True)
    g.close()
    print("ALL SHORT FRAMES DONE", flush=True)


if __name__ == "__main__":
    main()
