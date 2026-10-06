# -*- coding: utf-8 -*-
"""Builds the master timeline from the script + measured voice durations."""
import json, os
import script_hg as S

VOICE_DIR = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_hg")
FPS = 60
LEAD_IN = 0.6          # silence before the first line
TITLE_AFTER = "h09"    # the title card comes after this segment
TITLE_DUR = 4.2
OUTRO = 20.0           # end credits + YouTube end screen (5-20 s)


def build():
    dur = json.load(open(os.path.join(VOICE_DIR, "durations.json")))
    chapter_at = {c[0]: c for c in S.CHAPTERS}
    t = LEAD_IN
    segs, chapters, events = [], [], []
    for seg in S.SEGMENTS:
        sid = seg["id"]
        if sid in chapter_at:
            c = chapter_at[sid]
            chapters.append({"id": sid, "label": c[1], "title": c[2], "sub": c[3], "start": round(t, 3), "end": round(t + S.CARD_DUR, 3)})
            t += S.CARD_DUR
        t += seg.get("pre", 0.0)
        d = dur[sid]["dur"]
        segs.append({**seg, "start": round(t, 3), "end": round(t + d, 3), "dur": round(d, 3)})
        t += d + seg["pause"]
        if sid == TITLE_AFTER:
            events.append({"type": "title", "start": round(t, 3), "end": round(t + TITLE_DUR, 3)})
            t += TITLE_DUR
    total = t + OUTRO
    tl = {"fps": FPS, "total": round(total, 3), "segments": segs, "chapters": chapters, "events": events,
          "outro": {"start": round(t, 3), "end": round(total, 3)}, "alive": S.ALIVE}
    return tl


if __name__ == "__main__":
    tl = build()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "timeline.json")
    json.dump(tl, open(out, "w"), indent=1, ensure_ascii=False)
    m, s = divmod(tl["total"], 60)
    print(f"total {int(m)}:{s:05.2f}  segments {len(tl['segments'])}  chapters {len(tl['chapters'])}")
    for c in tl["chapters"]:
        print(f"  {int(c['start']//60)}:{c['start']%60:05.2f}  {c['label']} {c['title']}")
