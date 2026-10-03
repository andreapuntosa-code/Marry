export const SHOTS = {};
export const LIST = [];
// film grade picked from the shot's light (overridable with spec.grade)
function autoGrade(spec) {
  if (spec.grade) return spec.grade;
  if (spec.interior) return 'room';
  const h = spec.hoursFn ? spec.hoursFn(0, 1) : (spec.hours ?? 11);
  if ((spec.storm ?? 0) >= 0.5) return 'storm';
  if (h >= 18.0 || h < 5.5) return 'night';
  if (h >= 16.6) return 'golden';
  if (h < 7.6) return 'dawn';
  return 'day';
}
// a shot that is not part of the film (thumbnails)
export function shotOnly(id, spec) { SHOTS[id] = spec; }
// shot(id, anchor, spec, offset): anchor = segment id | 'chap:<seg>' | 'title' | 'outro' | 'start' | 't:<sec>'
export function shot(id, at, spec, off = 0) {
  if (SHOTS[id]) throw new Error('duplicate shot ' + id);
  SHOTS[id] = spec;
  LIST.push({ id, at, off, kind: spec.kind || '3d', name: spec.name || null, bg: spec.bg || null, grade: autoGrade(spec) });
}
