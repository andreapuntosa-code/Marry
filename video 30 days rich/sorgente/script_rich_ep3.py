# -*- coding: utf-8 -*-
"""
"30 DAYS TO GET RICH" -- EP3: the comments voted PARTNER.

Kevin offers Lily (7) a 50/50 partnership; she counters 90/10 and makes him carry the cooler. He becomes the sign guy,
dances on the corner, cars stop, they sell 120 cups. His 10% is $12 -- minus Lily's invoice (cooler rental $5,
one lemonade at "employee price" $2): $5. His first real money. Mom is almost proud. New poll: STOCKS or THRIFT.

Same cue keys as the earlier episodes, plus:
  scene  lilystand     (the sidewalk by Lily's stand, Kevin waving a big sign)
  popup  voted | lily_talk | line | jar | split | invoice | invoice2
"""

TITLE = "30 DAYS TO GET RICH"
EP = 3
START = {"scene": "night", "days": 28, "bank": 0.0, "mom": 36, "price": 1}
VOTED = ("PARTNER", "kid")
POLL = (("STOCKS", "chart"), ("THRIFT", "shirt"))
OUTRO = "DAY 30 IS INSANE"


def N(i, text, pause=0.12, voice="narr", **cue):
    return {"id": i, "text": text, "tts": cue.pop("tts", text), "pause": pause, "voice": voice, "cue": cue}


SEGMENTS = [
    N("n01", "Previously: Kevin sold one lemonade... to his mom. On credit.", scene="night", expr="sad", pose="idle", zoom=1.1, title=True,
      stickers=[("1 CUP", 3, 250, 1150, "#ffd60a", -7), ("ON CREDIT", 8, 800, 1270, "#ff7ab6", 6)]),
    N("n02", "But you voted... partner!", scene="basement", expr="excited", pose="cheer", zoom=1.1, popup="voted", confetti=True),
    N("k01", "Partners? With a seven-year-old? Fine.", voice="kevin", expr="nervous", pose="shrug", zoom=1.4,
      stickers=[("AGE 7", 3, 280, 1290, "#5be1ff", -6)]),
    N("n03", "Day three. Kevin crosses the street to make Lily an offer.", scene="street", expr="smug", pose="arms", zoom=1.0,
      stickers=[("DAY 3", 0, 280, 1260, "#ffffff", -5)]),
    N("k02", "Fifty-fifty?", voice="kevin", expr="smug", pose="point", zoom=1.45, stickers=[("50 / 50?", 0, 800, 1150, "#ffd60a", 7)]),
    N("l01", "Ninety-ten. And you carry the cooler.", voice="lily", popup="lily_talk", expr="shocked", pose="idle",
      stickers=[("90 / 10", 0, 300, 1300, "#ff7ab6", -7)]),
    N("k03", "Deal!", voice="kevin", expr="greedy", pose="cheer", zoom=1.3, ching=True, stickers=[("DEAL", 0, 820, 1160, "#34c759", 8)]),
    N("n04", "Lily runs the business. Kevin is now... the sign guy.", scene="lilystand", expr="happy", pose="cheer", zoom=1.0,
      stickers=[("SIGN GUY", 7, 800, 1260, "#ffd60a", 6)]),
    N("n05", "He dances. He yells. He spins the sign.", expr="excited", pose="cheer", zoom=1.0, dance=True,
      stickers=[("10/10 DANCE", 5, 280, 1260, "#5be1ff", -6)]),
    N("n06", "And it works. Cars stop. The line gets even longer.", popup="line", expr="excited", pose="cheer"),
    N("n07", "By sunset, they sell one hundred and twenty cups.", popup="jar", expr="greedy", pose="cheer"),
    N("n08", "Kevin's ten percent? Twelve dollars!", popup="split", expr="greedy", pose="cheer", hud={"bank": 12.0}, ching=True),
    N("k04", "I'm basically a millionaire.", voice="kevin", expr="smug", pose="arms", zoom=1.45, stickers=[("$12", 1, 800, 1150, "#34c759", 8)]),
    N("n09", "Then Lily sends him an invoice. Cooler rental: five dollars.", popup="invoice", expr="shocked", pose="idle", hud={"bank": 7.0}),
    N("n10", "Plus one lemonade, employee price: two dollars.", popup="invoice2", expr="sad", pose="idle", hud={"bank": 5.0}),
    N("n11", "Day three is over. Money made: five dollars. His first real money!", scene="night", expr="excited", pose="cheer", zoom=1.15,
      hud={"days": 27}, confetti=True, stickers=[("$5", 7, 260, 1130, "#34c759", -7), ("FIRST $$$", 11, 800, 1250, "#ffd60a", 6)]),
    N("m01", "Five dollars? I'm... almost proud.", voice="mom", popup="mom_talk", expr="happy", pose="idle", hud={"mom": 45},
      stickers=[("ALMOST", 4, 300, 1300, "#ff9ec7", -7)]),
    N("n12", "But tomorrow, Kevin wants to invest his five dollars.", expr="smug", pose="think", zoom=1.65),
    N("n13", "Comment one word: stocks, or thrift. Most liked comment wins.", scene="poll"),
    N("n14", "Day thirty is going to be insane.", scene="poll", pause=1.2, insane=True),
]
