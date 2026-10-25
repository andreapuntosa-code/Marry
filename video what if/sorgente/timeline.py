# -*- coding: utf-8 -*-
"""One timeline per Short (30 fps) from the script + measured voice durations: timeline_<X>.json."""
import json, os, sys
import script_whatif as W

VOICE_DIR = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_whatif")
HERE = os.path.dirname(os.path.abspath(__file__))
LEAD_IN = 0.15
TAIL = 1.4            # after the last line ("follow for more")


def build(key):
    dur = json.load(open(os.path.join(VOICE_DIR, "durations.json")))
    t = LEAD_IN; segs = []
    for s in W.SEG[key]:
        d = dur[s["id"]]["dur"]
        segs.append({**s, "start": round(t, 3), "end": round(t + d, 3), "dur": round(d, 3)})
        t += d + s["pause"]
    total = t + TAIL
    return {"fps": 30, "key": key, "total": round(total, 3), "segments": segs, "chapters": [], "events": [{"type": "none", "start": 0, "end": 0}],
            "outro": {"start": round(total, 3), "end": round(total, 3)}}


if __name__ == "__main__":
    for key in (sys.argv[1:] or W.SEG.keys()):
        tl = build(key)
        json.dump(tl, open(os.path.join(HERE, f"timeline_{key}.json"), "w"), indent=1, ensure_ascii=False)
        print(key, f"{tl['total']:.2f} s", len(tl["segments"]), "segments")
