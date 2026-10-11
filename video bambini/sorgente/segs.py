import json,sys
tl=json.load(open('timeline.json'))
a,b=sys.argv[1],sys.argv[2]
on=False
for s in tl['segments']:
    if s['id']==a: on=True
    if on: print(f"{s['id']:5s} {s['start']:7.1f} d={s['dur']:4.1f} +{s['pause']:.1f}  {s['sub'][:78]}")
    if s['id']==b: break
