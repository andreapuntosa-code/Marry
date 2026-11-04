# -*- coding: utf-8 -*-
"""
"30 DAYS TO GET RICH" -- EP2: the comments voted LEMONADE.

Kevin spends his whole fortune ($3.47) on two lemons, builds a stand out of pizza boxes, prices a cup at $50,
gets zero customers, loses to a seven-year-old selling at $1 across the street, and his only customer is Mom,
who pays by knocking a dollar off what he owes her. New poll: TIKTOK or PARTNER (team up with the kid).

Same cue keys as script_rich.py, plus:
  scene  street        (the sidewalk outside Mom's house, Kevin behind his stand)
  price  n             (the price tag on the stand)
  tumble True          (a tumbleweed rolls past)
  popup  voted | lemons | price | price_drop | rival | rival2
"""

TITLE = "30 DAYS TO GET RICH"
EP = 2
START = {"scene": "night", "days": 29, "bank": 3.47, "mom": 32, "price": 50}
POLL = (("TIKTOK", "phone"), ("PARTNER", "kid"))
OUTRO = "DAY 30 IS INSANE"


def N(i, text, pause=0.12, voice="narr", **cue):
    return {"id": i, "text": text, "tts": cue.pop("tts", text), "pause": pause, "voice": voice, "cue": cue}


SEGMENTS = [
    N("n01", "Previously: Kevin made zero dollars and ate one sandwich.", scene="night", expr="chew", pose="eat", zoom=1.1, title=True,
      stickers=[("$0", 3, 250, 1150, "#ff4d4d", -7), ("1 SANDWICH", 7, 800, 1270, "#ffd60a", 6)]),
    N("n02", "But you voted... lemonade!", scene="basement", expr="excited", pose="cheer", zoom=1.1, popup="voted", confetti=True),
    N("k01", "Lemonade empire, here I come!", voice="kevin", expr="greedy", pose="cheer", zoom=1.4,
      stickers=[("LEMONADE EMPIRE", 1, 540, 1300, "#ffd60a", -5)]),
    N("n03", "Day two. Kevin spends his entire fortune on lemons.", scene="kitchen", expr="happy", pose="phone", zoom=1.1, popup="lemons",
      hud={"bank": 0.0}),
    N("n04", "Two lemons. That's the whole budget.", expr="nervous", pose="shrug", zoom=1.35,
      stickers=[("2 LEMONS", 0, 280, 1130, "#ffd60a", -6), ("BUDGET: GONE", 4, 800, 1260, "#ff7ab6", 7)]),
    N("n05", "He builds a stand out of old pizza boxes.", scene="street", expr="smug", pose="arms", zoom=1.0,
      stickers=[("100% CARDBOARD", 7, 300, 1260, "#5be1ff", -4)]),
    N("n06", "Price? Fifty dollars a cup.", expr="greedy", pose="point", zoom=1.0, popup="price", price=50),
    N("k02", "It's artisanal!", voice="kevin", expr="smug", pose="point", zoom=1.45, ching=True,
      stickers=[("ARTISANAL", 1, 800, 1130, "#ffffff", 7)]),
    N("n07", "One hour later... zero customers.", expr="sad", pose="idle", zoom=1.0, tumble=True,
      stickers=[("0 CUSTOMERS", 3, 760, 1260, "#ff4d4d", -5)]),
    N("n08", "Then, across the street, a seven-year-old opens her own stand.", expr="shocked", pose="idle", popup="rival"),
    N("n09", "One dollar a cup. And a line around the block.", expr="shocked", pose="idle", popup="rival2", hud={"mom": 30}),
    N("n10", "So Kevin drops his price to one dollar.", expr="nervous", pose="shrug", popup="price_drop", price=1, shake=True),
    N("n11", "And finally, his first customer... Mom.", expr="excited", pose="cheer", popup="mom"),
    N("m01", "One lemonade, please. Take it off the twenty dollars you owe me.", voice="mom", popup="mom_talk", expr="shocked", pose="idle",
      stickers=[("IOU $19", 10, 300, 1300, "#ff9ec7", -7)], hud={"mom": 36}),
    N("n12", "Day two is over. Money made: still zero. Lemons left: zero.", scene="night", expr="sad", pose="idle", zoom=1.15, hud={"days": 28},
      stickers=[("$0", 7, 260, 1130, "#ff4d4d", -7), ("0 LEMONS", 10, 800, 1250, "#ffd60a", 6)]),
    N("n13", "But Kevin has a plan... sort of.", expr="smug", pose="think", zoom=1.65),
    N("n14", "Comment one word: TikTok, or partner. Most liked comment wins.", scene="poll"),
    N("n15", "Day thirty is going to be insane.", scene="poll", pause=1.2, insane=True),
]
