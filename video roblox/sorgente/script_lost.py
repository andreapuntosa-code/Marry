# -*- coding: utf-8 -*-
"""
"In this town, lost things end up in the same room." -- Roblox v2 story, ~2 minutes, voice only (user adds music).
A 16-year-old loses the stuffed bunny his dad gave him the day before he left. The old lady of the antique shop
tells him how to find the Lost Room, and one rule: don't stay past sunrise. Inside: mountains of lost things.
Behind a pile of toys, a little boy hugging the bunny... it's him, at six: the part of him he lost the day his dad
left. Sunrise. The door starts to close. Part 2.
"""


def N(i, text, pause=0.25, voice=None):
    return {"id": i, "text": text, "tts": text, "pause": pause, "voice": voice}


SEGMENTS = [
    N("P01", "In this town, nothing is ever really lost.", 0.35),
    N("P02", "Every lost thing ends up in the same place. People call it the Lost Room."),
    N("P02b", "Not the trash. Not the bottom of the sea. One room.", 0.35),
    N("P03", "Lost keys. Lost letters. Balloons that slipped out of tiny hands.", 0.35),
    N("P04", "Nobody knows where it is. But late at night, if you listen, you can hear it humming.", 0.4),
    N("P05", "I never cared about it. Until last week."),
    N("P06", "When we moved, my old stuffed bunny disappeared. Mister Button.", 0.35),
    N("P07", "I know. I'm sixteen. It's just a toy."),
    N("P08", "But my dad gave it to me the day before he left. I never saw him again.", 0.5),
    N("P08b", "Keep him safe for me, buddy.", 0.6, voice="dad"),
    N("P09", "So I went looking for the Room."),
    N("P10", "The old lady at the antique shop laughed at me... then she stopped laughing.", 0.3),
    N("P11", "Follow the sound of the thing you miss the most. And whatever you do, don't stay past sunrise.", 0.45, voice="old"),
    N("P12", "That night, I heard it. A soft hum, coming from an old door at the end of my street.", 0.3),
    N("P12b", "I grabbed a flashlight and walked out in my pajamas.", 0.35),
    N("P13", "A door that had never been there before.", 0.5),
    N("P14", "Behind it... was the Lost Room.", 0.6),
    N("P15", "Mountains of umbrellas. Rivers of single socks. Thousands of keys, still waiting for their doors.", 0.3),
    N("P16", "Every wedding ring that slipped off a finger. Every phone left on a bus.", 0.4),
    N("P16b", "Kites still tangled in invisible trees. Love letters nobody ever read. It smelled like old birthdays.", 0.45),
    N("P17", "And somewhere in here... Mister Button.", 0.4),
    N("P18", "I searched for hours."),
    N("P18b", "Every toy I picked up... someone, somewhere, had cried for it.", 0.45),
    N("P19", "Then I heard someone crying.", 0.5),
    N("P20", "Behind a pile of old toys, there was a little boy... hugging my bunny.", 0.35),
    N("P21", "He had my hair. My jacket. My eyes.", 0.4),
    N("P22", "He looked up at me and whispered...", 0.2),
    N("P23", "Are you here to take me home?", 0.5, voice="kid"),
    N("P24", "It was me. Me, at six years old.", 0.4),
    N("P24b", "Same bunny. Same jacket. Same tears.", 0.45),
    N("P25", "The part of me I lost... the day my dad left.", 0.6),
    N("P26", "Then the skylights started turning orange.", 0.3),
    N("P27", "Sunrise.", 0.4),
    N("P27b", "He looked at me. Then he looked at the door.", 0.45),
    N("P28", "Behind me, the door began to close.", 0.5),
    N("P29", "Part two? Comment found if you want to know what I did.", 1.0),
]
