export const SHOTS = {};
export const LIST = [];
// shot(id, anchor, spec, offset): anchor = segment id | 'chap:<seg>' | 'title' | 'outro' | 'start' | 't:<sec>'
export function shot(id, at, spec, off = 0) {
  if (SHOTS[id]) throw new Error('duplicate shot ' + id);
  SHOTS[id] = spec;
  LIST.push({ id, at, off, kind: spec.kind || '3d', name: spec.name || null, bg: spec.bg || null });
}
