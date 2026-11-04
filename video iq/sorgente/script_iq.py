# -*- coding: utf-8 -*-
"""
"What would happen if your IQ kept going up?" -- a vertical Short in a hand-drawn doodle style: notebook paper,
wobbly "boiling" marker lines that draw themselves on, Bob (a doodle guy whose brain grows each level), an IQ counter
that rolls up: 100 -> 200 -> 1,000 -> 10,000 -> 1,000,000 -> 1,000,000,000 -> infinity.

Numbers (IQ: mean 100, SD 15):
  IQ 200 = +6.67 SD -> about 1 in 76 billion; with ~8 billion people alive, statistically nobody alive scores that.
  Real tests stop being meaningful well before 200 (most top out around 160) -- the video says so at IQ 1,000.
  The brain uses roughly 20% of the body's resting energy.

Segment: id, text, pause, cue:
  iq     the counter value from this line on (float('inf') for infinity)
  props  [(prop_id, at_word)]   doodles that draw themselves on at that word
  bob    neutral | confused | smug | bored | shocked | hot | happy | wink
  hook   True (counter spins wildly)
"""

INF = float("inf")


def N(i, text, pause=0.15, **cue):
    return {"id": i, "text": text, "tts": cue.pop("tts", text), "pause": pause, "cue": cue}


SEGMENTS = [
    N("h01", "What if your IQ kept going up... and up... and up?", 0.25, iq=100, bob="shocked", hook=True, props=[("hook", 0)]),
    N("a01", "IQ one hundred. Perfectly average.", iq=100, bob="neutral", props=[("bell", 0)]),
    N("a02", "You're smarter than half the world... and still forget why you walked into the kitchen.", bob="confused",
      props=[("half", 0), ("kitchen", 8)]),
    N("b01", "IQ two hundred.", iq=200, bob="smug", props=[("bell", 0)]),
    N("b02", "Statistically, nobody alive today is this smart.", bob="smug", props=[("nobody", 0)]),
    N("b03", "You'd learn a new language in a weekend, and solve a Rubik's cube just by looking at it.", bob="happy",
      props=[("lang", 0), ("cube", 9)]),
    N("b04", "But every conversation would feel painfully slow.", bob="bored", props=[("snail", 0)]),
    N("c01", "IQ one thousand.", iq=1000, bob="happy", props=[("bell", 0)]),
    N("c02", "Real IQ tests stop working way before this. From here, we're imagining.", bob="wink",
      props=[("test", 0), ("imagine", 8)]),
    N("c03", "You'd solve the hardest math problems in history before breakfast...", bob="smug", props=[("board", 0)]),
    N("c04", "and cure diseases by lunch.", bob="happy", props=[("virus", 0)]),
    N("d01", "IQ ten thousand.", iq=10000, bob="shocked", props=[("bell", 0)]),
    N("d02", "You'd read every book ever written in a week, and remember every single word.", bob="happy", props=[("books", 0)]),
    N("d03", "You'd know what people are about to say... before they say it.", bob="smug", props=[("predict", 0)]),
    N("e01", "IQ one million.", iq=1e6, bob="shocked", props=[("bell", 0)]),
    N("e02", "You'd figure out how the universe works, and build tech a thousand years ahead.", bob="happy",
      props=[("atom", 0), ("rocket", 8)]),
    N("e03", "Your brain already burns twenty percent of your energy. This one would need a cooling fan.", bob="hot",
      props=[("battery", 0), ("fan", 14)]),
    N("f01", "IQ one billion.", iq=1e9, bob="shocked", props=[("bell", 0)]),
    N("f02", "You could simulate the whole planet in your head, and predict the weather a year ahead.", bob="smug",
      props=[("earth", 0), ("weather", 10)]),
    N("g01", "IQ... infinity.", 0.3, iq=INF, bob="shocked", props=[("bell", 0)]),
    N("g02", "You'd know everything. Every answer. Every secret.", bob="happy", props=[("everything", 0)]),
    N("g03", "You'd even know what you're about to comment on this video.", bob="wink", props=[("comment", 0)]),
    N("g04", "So go ahead. What's your IQ? Comment below.", 1.0, bob="happy", props=[("cta", 0)]),
]
