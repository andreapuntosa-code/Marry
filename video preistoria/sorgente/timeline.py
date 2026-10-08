# -*- coding: utf-8 -*-
"""Builds the master timeline (30 fps) from the script + measured voice durations."""
import json, os
import script_pre as S

VOICE_DIR = os.environ.get("VOICE_DIR", "/tmp/claude-0/-home-user-Marry/e61fd834-a8c5-5cc5-8204-6c637a41951f/scratchpad/voice_pre")
FPS = 30
LEAD_IN = 0.6
PAUSE_K = 0.9
TITLE_AFTER = "p08"
TITLE_DUR = 4.6
OUTRO = 22.0           # end credits + YouTube end screen


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
        d = dur[sid]["dur"]
        segs.append({**seg, "start": round(t, 3), "end": round(t + d, 3), "dur": round(d, 3)})
        t += d + seg["pause"] * PAUSE_K
        if sid == TITLE_AFTER:
            events.append({"type": "title", "start": round(t, 3), "end": round(t + TITLE_DUR, 3)})
            t += TITLE_DUR
    total = t + OUTRO
    return {"fps": FPS, "total": round(total, 3), "segments": segs, "chapters": chapters, "events": events,
            "outro": {"start": round(t, 3), "end": round(total, 3)}}


if __name__ == "__main__":
    tl = build()
    json.dump(tl, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "timeline.json"), "w"), indent=1, ensure_ascii=False)
    m, s = divmod(tl["total"], 60)
    print(f"total {int(m)}:{s:05.2f}  segments {len(tl['segments'])}  chapters {len(tl['chapters'])}")
    for c in tl["chapters"]:
        print(f"  {int(c['start']//60)}:{c['start']%60:05.2f}  {c['label']} {c['title']}")
