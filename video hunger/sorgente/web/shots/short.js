// Shots of the vertical Short (1080x1920): rendered with ?w=1080&h=1920&scope=0 at hero quality.
// ids are exported to window.SHORT = [{ id, dur, name }] in story order.
import { S, SC, lineup, HORN_CLEAR, night, spot, toward, frame, duo, orbitCam, who, ring, campfire, H, HG, height, lerp, THREE } from './hgkit.js';
import { K, dolly } from './stage.js';

const C = [HG.cx, HG.cz];
export const SHORT = [];
let AT = 98000;
const reg = (name, dur, id) => { SHORT.push({ name, dur, id }); return id; };
window.SHORT = SHORT;

// 1. the Horn, low and golden
reg('horn', 4.0, S('t:' + (AT += 10), 0, {
  biome: 'center', hours: 17.6, cam: [C[0] - 18, 0.9, C[1] - 50], cam2: [C[0] - 10, 1.4, C[1] - 33], tgt: [C[0], 5, C[1]], tgt2: [C[0], 12, C[1]], fov: 62, fov2: 58,
  clear: [[C[0], C[1], 75]], shadow: { x: C[0] - 8, z: C[1] - 25, r: 60 }, hero: true, water: false,
  set: (c) => { H.horn(c, { yaw: Math.PI * 1.45, ripple: 0.006 }); lineup(c, [C[0] - 18, 0.9, C[1] - 50], 16, { pose: 'idle' }); const m = H.hornMouth(Math.PI * 1.45, 6.5); H.lootPile(c, m[0], m[1], { yaw: Math.PI * 1.45, n: 22, R: 5.5, seed: 3 }); },
}));

// 2. the hundred on their pedestals (crane over the ring)
reg('ring', 3.6, S('t:' + (AT += 10), 0, {
  biome: 'center', hours: 17.8, cam: [C[0] - 14, 9, C[1] - 62], cam2: [C[0] - 2, 13, C[1] - 54], tgt: [C[0] + 4, 4, C[1] - 4], tgt2: [C[0] + 6, 5, C[1]], fov: 58,
  clear: [[C[0], C[1], 75]], shadow: { x: C[0], z: C[1] - 20, r: 70 }, hero: true,
  set: (c) => { H.horn(c, { yaw: Math.PI * 1.45, ripple: 0.006 }); lineup(c, [C[0] - 14, 9, C[1] - 62], 46, { pose: 'guard' }); },
}));

// 3. they hide: a sneaking figure in the forest, camera tracking low
{
  const p = spot('forest', 1), f = toward(p[0], p[1], C[0], C[1]);
  const a = f.p(-1.5, -9), b = f.p(0.6, 7);
  reg('hide', 3.6, S('t:' + (AT += 10), 0, {
    biome: 'forest', hours: 9.3, cam: f.c3(2.0, 0.9, -5.6), cam2: f.c3(1.1, 1.1, -3.4), tgt: f.c3(0, 1.0, 2), tgt2: f.c3(0, 1.1, 4), fov: 52, clear: [[p[0], p[1], 12]], sr: 36, hero: true, water: false,
    set: (c) => {
      const P = who(c, 'KAI', a[0], a[1], 'sneak', {
        yawTo: b, phase: 0.2,
        anim: (Q, t) => { const u = Math.min(1, t / 3.6), x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u); Q.root.position.set(x, height(x, z), z); Q.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); Q.pose('sneak', t, { phase: 0.2 }); },
      });
    },
  }));
}

// 4. they fight
{
  const p = spot('meadow', 1);
  reg('fight', 3.4, duo('t:' + (AT += 10), 0, { biome: 'meadow', k: 1, a: 'REX', b: 'VEX', pa: 'stab', pb: 'parry', gap: 1.9, hours: 17.3, cam: [0.6, 1.1, -5.2], cam2: [-0.5, 1.3, -4.3], th: 1.2, fov: 58, hero: true, water: false }));
}

// 5. alliances: four around a fire at dusk
{
  const p = spot('forest', 2);
  reg('alliance', 3.4, S('t:' + (AT += 10), 0, {
    biome: 'forest', hours: 19.4, cam: [p[0] - 3.4, 1.0, p[1] - 5.2], cam2: [p[0] - 1.8, 1.4, p[1] - 4.2], tgt: [p[0], 1.0, p[1]], fov: 60, clear: [[p[0], p[1], 9]], sr: 22, hero: true, water: false,
    set: (c) => { campfire(c, p[0], p[1], { size: 0.9, li: 14 }); ring(c, ['KAI', 'LUNA', 'TOBY', 'DAX'], p[0], p[1], 2.1, { pose: 'idle', a0: 0.6 }); },
  }));
}

// 6. betrayal: a stab in the dusk
{
  reg('betray', 3.2, duo('t:' + (AT += 10), 0, { biome: 'swamp', k: 1, a: 'ROOK', b: 'ASTER', pa: 'stab', pb: 'hurt', gap: 1.5, hours: 18.9, cam: [0.8, 1.0, -4.8], cam2: [0.2, 1.2, -4.0], th: 1.2, fov: 58, hero: true, water: false }));
}

// 7. the arena closes in
reg('closing', 3.6, S('t:' + (AT += 10), 0, {
  biome: 'center', hours: 17.4, cam: [C[0], 1.8, C[1] - 6], cam2: [C[0], 2.4, C[1] - 2], tgt: [C[0], 4, C[1] + 40], tgt2: [C[0], 5, C[1] + 40], fov: 64, clear: [[C[0], C[1], 75]],
  shadow: { x: C[0], z: C[1] + 20, r: 60 }, hero: true,
  set: (c) => {
    H.staticWall(c, (t) => lerp(52, 40, Math.min(1, t / 3.6)));
    ['ZARA', 'ECHO', 'BOLT', 'MARLO', 'SAGE'].forEach((nm, i) => {
      const x0 = C[0] - 7 + i * 3.6, z0 = C[1] + 34 + (i % 2) * 3, x1 = x0 + (i - 2) * 1.2, z1 = C[1] + 6 + (i % 3) * 2.5;
      who(c, nm, x0, z0, 'sprint', { yaw: Math.PI, anim: (Q, t) => { const u = Math.min(1, t / 3.6), x = lerp(x0, x1, u), z = lerp(z0, z1, u); Q.root.position.set(x, height(x, z), z); Q.root.rotation.y = Math.atan2(x1 - x0, z1 - z0); Q.pose('sprint', t, { phase: i }); } });
    });
  },
}));

// 8. every fall, a star goes dark
{
  const cx = C[0] - 6, cz = C[1] - 16;
  reg('stars', 4.4, S('t:' + (AT += 10), 0, {
    biome: 'meadow', hours: 21.8, cam: [cx - 2, 1.1, cz - 4], cam2: [cx - 1, 1.2, cz - 3.5], tgt: [cx + 3, 10, cz + 12], tgt2: [cx + 2, 11, cz + 12], fov: 84, clear: [[cx, cz, 14]], sr: 20, hero: true, hasStars: true,
    set: (c) => {
      night(c, 100, [{ i: 99, t0: 0.9 }, { i: 98, t0: 1.7 }, { i: 97, t0: 2.5 }, { i: 96, t0: 3.2 }]);
      who(c, 'PIP', cx, cz, 'watch', { yaw: 0.2, phase: 0.5, acc: undefined });
    },
  }));
}

// 9. only one walks out: a lone silhouette climbing at dawn
{
  const p = spot('mountain', 0), f = frame(p[0], p[1], Math.atan2(p[0] - C[0], p[1] - C[1]));
  const a = f.p(0, -6), b = f.p(1.2, 10);
  reg('walk', 3.6, S('t:' + (AT += 10), 0, {
    biome: 'mountain', hours: 7.0, cam: f.c3(1.6, 1.0, -9), cam2: f.c3(0.9, 1.4, -6.5), tgt: f.c3(0, 2.6, 3), tgt2: f.c3(0, 2.9, 6), fov: 62, clear: [[p[0], p[1], 10]], sr: 36, hero: true,
    set: (c) => {
      who(c, 'X31', a[0], a[1], 'walk', { phase: 0.4, anim: (Q, t) => { const u = Math.min(1, t / 3.6), x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u); Q.root.position.set(x, height(x, z), z); Q.root.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]); Q.pose('walk', t, { phase: 0.4 }); } });
    },
  }));
}

// 10. end card background: a contestant and the Horn (still)
{
  const cx = C[0] - 11.2, cz = C[1] - 22.5;
  reg('end', 4.0, S('t:' + (AT += 10), 0, {
    biome: 'center', hours: 17.5, cam: [C[0] - 14.4, 1.0, C[1] - 28.6], cam2: [C[0] - 14.2, 1.05, C[1] - 28.3], tgt: [C[0] - 11.2, 2.3, C[1] - 17], fov: 52, clear: [[C[0], C[1], 60]], shadow: { x: C[0] - 12, z: C[1] - 22, r: 30 }, hero: true,
    set: (c) => { H.horn(c, { yaw: Math.PI * 1.45, ripple: 0.006 }); H.pedestals(c); who(c, 'REX', C[0] - 12.4, C[1] - 24.2, 'guard', { yaw: 3.3, phase: 0.4 }); },
  }));
}
