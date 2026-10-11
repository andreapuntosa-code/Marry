# -*- coding: utf-8 -*-
"""
Automatic animation QA: every pose of every test character is evaluated at several times on flat ground and
checked for the bugs that show on screen: limbs through the ground, hands inside the torso or head, crossed
legs, hyper-extended joints, weapon tips in the ground, body floating or sunk after the ground fix.

  python3 qa_anim.py            -> prints a table of problems
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render as R

JS = r"""
() => {
  const P = window.PEOPLE, T = window.THREE_, out = [];
  const names = Object.keys(P.POSES);
  const cast = ['REX', 'VEX', 'DAX', 'KAI', 'PIP', 'TOBY', 'BOLT', 'MARLO', 'ROOK', 'X20'];
  const v = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3();
  const ALLOW_HEAD = new Set(['scratchHead', 'facepalm', 'headInHands', 'eat', 'cower', 'pray', 'kneelPray', 'praise', 'cheer', 'raiseHand', 'listen', 'wave', 'jumpReach', 'speak', 'shrug']);
  const ALLOW_TORSO = new Set(['armsCrossed', 'headInHands', 'facepalm', 'cower', 'eat', 'carry', 'plant', 'sit', 'sitGround', 'crouch', 'talk', 'hoe', 'dig', 'bow', 'guard']);
  const flat = () => 0;
  for (const nm of cast) {
    const per = new P.Person({ ...P.CAST[nm] });
    per.root.position.set(0, 0, 0);
    const S = per.root.scale.y;
    for (const pose of names) {
      for (const t of [0, 0.37, 0.81, 1.3, 2.2, 5]) {
        for (const opt of [{}, { side: 'L' }]) {
          per.root.position.set(0, 0, 0); per.root.rotation.set(0, 0, 0);
          try { per.pose(pose, t, { phase: 0.3, speed: 1, ...opt }); } catch (e) { out.push([nm, pose, t, 'EXCEPTION ' + e.message]); continue; }
          per.root.updateMatrixWorld(true);
          const dy = per.groundFix(flat, {});
          per.root.updateMatrixWorld(true);
          const issues = [];
          if (Math.abs(dy) > 0.16 && !P.AIR.has(pose)) issues.push('ground correction ' + dy.toFixed(2));
          // hands vs torso axis and head
          per.pelvis.getWorldPosition(a); per.neck.getWorldPosition(b);
          const ax = b.clone().sub(a), L2 = ax.lengthSq();
          per.head.getWorldPosition(v); const headC = v.clone().add(new T.Vector3(0, 0.19 * S, 0).applyQuaternion(per.head.getWorldQuaternion(new T.Quaternion())));
          for (const [hn, hd] of [['L', per.L.hd], ['R', per.R.hd]]) {
            hd.getWorldPosition(v);
            const tt = Math.max(0, Math.min(1, v.clone().sub(a).dot(ax) / L2)), c = a.clone().addScaledVector(ax, tt), d = v.distanceTo(c);
            if (d < 0.17 * S && tt > 0.05 && tt < 0.95 && !ALLOW_TORSO.has(pose)) issues.push(hn + ' hand inside torso ' + d.toFixed(2));
            if (v.distanceTo(headC) < 0.2 * S && !ALLOW_HEAD.has(pose)) issues.push(hn + ' hand inside head');
            if (v.y < 0.03 * S && !['plant', 'dig', 'lie', 'dead', 'sleep', 'fallDown', 'sitGround', 'kneelPray', 'pray', 'tumble', 'cower', 'hoe'].includes(pose)) issues.push(hn + ' hand at ground');
          }
          per.L.an.getWorldPosition(a); per.R.an.getWorldPosition(b);
          if (Math.hypot(a.x - b.x, a.z - b.z) < 0.09 * S && !['lie', 'dead', 'sleep', 'fallDown', 'tumble', 'sitGround', 'kneelPray', 'pray', 'cower', 'climb', 'jumpReach'].includes(pose)) issues.push('feet overlap');
          // weapon tips
          for (const [k, tip] of [['sword', [0, -0.92, 0]], ['axe', [0, -0.85, 0.1]], ['hammer', [0, -0.55, 0]], ['dagger', [0, -0.36, 0]], ['club', [0, -0.65, 0]]]) {
            const pr = per.props[k]; if (!pr) continue;
            v.set(...tip); pr.localToWorld(v);
            if (v.y < -0.03 && !['lie', 'dead', 'sleep', 'fallDown', 'tumble', 'hoe', 'dig'].includes(pose)) issues.push(k + ' tip in ground ' + v.y.toFixed(2));
          }
          for (const s of [per.L, per.R]) { if (s.el.rotation.x > 0.05) issues.push('elbow hyperextended'); if (s.kn.rotation.x < -0.05) issues.push('knee hyperextended'); }
          if (issues.length) out.push([nm, pose, t + (opt.side ? opt.side : ''), issues.join('; ')]);
        }
      }
    }
  }
  return out;
}
"""

def main():
    wk = R.Worker(scale=0.3)
    res = wk.page.evaluate(JS)
    wk.close()
    seen = {}
    for nm, pose, t, msg in res:
        seen.setdefault((pose, msg), []).append(nm)
    for (pose, msg), who in sorted(seen.items()):
        print(f"{pose:12s} {msg:48s} {','.join(sorted(set(who)))}")
    print(len(res), "findings,", len(seen), "distinct")

if __name__ == "__main__":
    main()
