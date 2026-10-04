# -*- coding: utf-8 -*-
"""Pull frames out of the rendered chunks (no re-render) for a quick visual check.
  python3 qa_frames.py out.jpg shot_id [shot_id ...]      (or 'all' / time ranges 't:120-200')"""
import os, sys, json, subprocess
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
SCRATCH = os.environ.get("SCRATCH", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad")
CH = os.path.join(SCRATCH, "chunks")
FPS, SIZE = 24, 240


def shot_times():
    tl = json.load(open(os.path.join(HERE, "timeline.json")))
    shots = json.load(open(os.path.join(HERE, "shots.json")))
    seg = {s['id']: s for s in tl['segments']}; chap = {c['id']: c for c in tl['chapters']}
    def at(a):
        if a == 'start': return 0.0
        if a == 'title': return tl['events'][0]['start']
        if a == 'outro': return tl['outro']['start']
        if a.startswith('chap:'): return chap[a[5:]]['start']
        return seg[a]['start']
    for s in shots:
        s['start'] = at(s['at']) + s.get('off', 0)
    shots.sort(key=lambda s: s['start'])
    for i, s in enumerate(shots):
        s['end'] = shots[i + 1]['start'] if i + 1 < len(shots) else tl['total']
    return shots


def grab(t):
    f = int(t * FPS); c0 = (f // SIZE) * SIZE
    files = [n for n in os.listdir(CH) if n.startswith(f"c_{c0:06d}_") and n.endswith('.mp4') and 'part' not in n]
    if not files:
        return None
    p = os.path.join(CH, files[0])
    off = (f - c0) / FPS
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{off:.3f}', '-i', p, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-'], capture_output=True)
    if not r.stdout:
        return None
    return cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)


def main():
    out = sys.argv[1]; want = sys.argv[2:]
    shots = shot_times()
    sel = []
    for s in shots:
        if 'all' in want or s['id'] in want or any(w.endswith('*') and s['id'].startswith(w[:-1]) for w in want):
            sel.append((s['start'] + (s['end'] - s['start']) * 0.5, s['id']))
    ims = []
    for t, sid in sel:
        im = grab(t)
        if im is None:
            continue
        im = cv2.resize(im[138:942], (576, 241))
        cv2.putText(im, f"{t:.1f} {sid}", (6, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
        ims.append(im)
    if not ims:
        print("no frames available yet"); return
    while len(ims) % 4: ims.append(np.zeros_like(ims[0]))
    cv2.imwrite(out, np.vstack([np.hstack(ims[i:i + 4]) for i in range(0, len(ims), 4)]), [cv2.IMWRITE_JPEG_QUALITY, 82])
    print(len(sel), "shots,", len([1 for i in ims if i.any()]), "frames ->", out)


if __name__ == "__main__":
    main()
