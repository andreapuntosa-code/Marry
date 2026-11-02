# -*- coding: utf-8 -*-
"""
"30 DAYS TO GET RICH" -- EP1. A vertical cartoon series in the "30 days to..." format: a top HUD (days left + two
progress bars), stickers, one giant word at a time, punchy narrator, and a comment poll that decides tomorrow.

Kevin, 22, lives in his mom's basement with $3.47 and a coupon for half a pizza. Mom's deal: 30 days to get rich,
or a job at Burger Barn. Light, friendly comedy.

Segment: id, voice ('narr' | 'kevin' | 'mom'), text, pause after, cue (what the picture does on that line):
  scene    basement | kitchen | phone | store | night | poll
  expr     happy | smug | shocked | sad | nervous | excited | greedy | chew
  pose     idle | point | shrug | cheer | think | phone | eat | arms
  zoom     1.0 (full body) .. 2.0 (face)
  stickers [(text, at_word, x, y, colour, rotation)]   at_word: index of the word (0 = line start)
  popup    mom | gauge_up | gauge_down | listing | offer | book | declined | expired | coupon
  hud      {"days": n, "bank": dollars, "mom": percent}
"""

TITLE = "30 DAYS TO GET RICH"
EP = 1


def N(i, text, pause=0.12, voice="narr", **cue):
    return {"id": i, "text": text, "tts": cue.pop("tts", text), "pause": pause, "voice": voice, "cue": cue}


SEGMENTS = [
    N("n01", "This is Kevin. He has thirty days to get rich.", scene="basement", expr="smug", pose="arms", zoom=1.05, title=True),
    N("n02", "Right now, Kevin's net worth is three dollars and forty-seven cents.", expr="happy", pose="point", zoom=1.3,
      stickers=[("$3.47", 6, 270, 1170, "#ffd60a", -8), ("NET WORTH", 5, 800, 1070, "#5be1ff", 6)]),
    N("n03", "Plus one coupon for half a pizza.", expr="excited", pose="phone", zoom=1.3, popup="coupon"),
    N("n04", "He lives in his mom's basement.", expr="happy", pose="idle", zoom=1.0,
      stickers=[("MOM'S BASEMENT", 1, 360, 1180, "#ff7ab6", -4), ("EST. 2019", 4, 840, 1290, "#ffffff", 8)]),
    N("n05", "And this morning, his mom offered him a deal.", expr="nervous", pose="idle", zoom=1.2, popup="mom"),
    N("m01", "Thirty days. Get rich... or get a job at Burger Barn.", voice="mom", popup="mom_talk", expr="shocked", pose="idle", zoom=1.2,
      stickers=[("BURGER BARN", 6, 330, 1300, "#ff9500", -7)], hud={"mom": 40}),
    N("k01", "Challenge accepted!", voice="kevin", expr="excited", pose="cheer", zoom=1.15, confetti=True),
    N("n06", "Kevin's business experience? He once sold a lemonade... to himself.", expr="nervous", pose="shrug", zoom=1.35,
      stickers=[("LEMONADE CEO", 5, 300, 1130, "#ffd60a", -6), ("1 CUSTOMER", 9, 810, 1250, "#5be1ff", 7)]),
    N("n07", "His confidence? Off the charts.", expr="smug", pose="arms", zoom=1.0, popup="gauge_up"),
    N("n08", "His bank account? Not so much.", expr="shocked", pose="idle", zoom=1.0, popup="gauge_down"),
    N("n09", "Day one. Kevin decides to sell his old stuff online.", scene="kitchen", expr="happy", pose="phone", zoom=1.1,
      stickers=[("DAY 1", 0, 250, 1120, "#ffffff", -5)]),
    N("n10", "He lists his gaming chair for a thousand dollars.", scene="phone", popup="listing"),
    N("n11", "Someone makes an offer... one sandwich.", scene="phone", popup="offer"),
    N("k02", "Deal!", voice="kevin", scene="kitchen", expr="greedy", pose="cheer", zoom=1.45, stickers=[("DEAL", 0, 830, 1160, "#34c759", 8)]),
    N("n12", "Then he goes to buy a book called How To Be A Millionaire.", scene="store", expr="smug", pose="phone", zoom=1.05, popup="book"),
    N("n13", "Card declined.", scene="store", expr="shocked", pose="idle", zoom=1.0, popup="declined", shake=True),
    N("n14", "Even the pizza coupon expired.", scene="store", expr="sad", pose="idle", zoom=1.25, popup="expired"),
    N("n15", "Day one is over. Money made: zero. Sandwiches: one.", scene="night", expr="chew", pose="eat", zoom=1.15, hud={"days": 29, "mom": 32},
      stickers=[("$0", 6, 260, 1130, "#ff4d4d", -7), ("1 SANDWICH", 8, 800, 1250, "#ffd60a", 6)]),
    N("n16", "But tomorrow... you decide what Kevin does.", scene="night", expr="happy", pose="point", zoom=1.7),
    N("n17", "Comment one word: lemonade, or crypto. Most liked comment wins.", scene="poll"),
    N("n18", "Day thirty is going to be insane.", scene="poll", pause=1.2, insane=True),
]
