import type {Action, ScenesFile, TimingsFile, Word} from './types';

/** Normalizza una parola per il confronto (minuscole, senza punteggiatura ai bordi). */
export const normWord = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[’`]/g, "'")
    .replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')
    .replace(/^'+|'+$/g, '');

const matches = (token: string, wanted: string) => {
  const t = normWord(token);
  if (t === wanted) return true;
  // "car's" corrisponde anche a "car"
  if (t.endsWith("'s") && t.slice(0, -2) === wanted) return true;
  // "l'elettrone" corrisponde anche a "elettrone"
  const i = t.lastIndexOf("'");
  return i >= 0 && t.slice(i + 1) === wanted;
};

export const findWordTime = (words: Word[], ref: string, sceneId: string, duration: number): number => {
  if (ref === 'start') return 0;
  if (ref === 'end') return duration;
  const [raw, nth] = ref.split('#');
  const wanted = normWord(raw);
  const n = nth ? parseInt(nth, 10) : 1;
  let count = 0;
  for (const w of words) {
    if (matches(w.text, wanted)) {
      count++;
      if (count === n) return w.start;
    }
  }
  throw new Error(
    `Scena "${sceneId}": la parola "${ref}" non è nella narrazione. Parole disponibili: ${words
      .map((w) => normWord(w.text))
      .join(', ')}`,
  );
};

export type ResolvedAction = Action & {
  startFrame: number;
  outFrame: number | null;
  thenFrame: number | null;
  cueFrames: number[];
};

export type BuiltScene = {
  id: string;
  from: number;
  durationInFrames: number;
  audio: string;
  /** frame locale in cui parte il cancellino (null = ultima scena) */
  eraseFrom: number | null;
  actions: ResolvedAction[];
};

export type Timeline = {
  scenes: BuiltScene[];
  totalFrames: number;
  /** tutte le parole con tempi assoluti in secondi (per i sottotitoli) */
  words: Word[];
  /** avvisi (es. audio da rigenerare) */
  warnings: string[];
};

export const buildTimeline = (file: ScenesFile, timings: TimingsFile): Timeline => {
  const {fps} = file.video;
  const {leadIn, hold, erase, tail} = file.timing;
  const f = (s: number) => Math.round(s * fps);
  const warnings: string[] = [];
  const scenes: BuiltScene[] = [];
  const words: Word[] = [];
  let t = leadIn;

  file.scenes.forEach((scene, i) => {
    const timing = timings.scenes.find((s) => s.id === scene.id);
    if (!timing) {
      warnings.push(`Manca l'audio della scena "${scene.id}": esegui npm run tts`);
      return;
    }
    if (timing.narration.trim() !== scene.narration.trim()) {
      warnings.push(`La narrazione della scena "${scene.id}" è cambiata: esegui npm run tts`);
    }
    const isLast = i === file.scenes.length - 1;
    const length = timing.duration + (isLast ? tail : hold + erase);
    const at = (ref: string, delay = 0) => f(findWordTime(timing.words, ref, scene.id, timing.duration) + delay);

    scenes.push({
      id: scene.id,
      from: f(t),
      durationInFrames: f(length),
      audio: timing.audio,
      eraseFrom: isLast ? null : f(timing.duration + hold),
      actions: scene.actions.map((a) => ({
        ...a,
        startFrame: at(a.at, a.delay ?? 0),
        outFrame: a.out ? at(a.out) : null,
        thenFrame: a.type !== 'text' && a.then ? at(a.then) : null,
        cueFrames: a.type !== 'text' ? (a.cues ?? []).map((c) => at(c)) : [],
      })),
    });
    for (const w of timing.words) words.push({text: w.text, start: w.start + t, end: w.end + t});
    t += length;
  });

  return {scenes, totalFrames: Math.max(1, f(t)), words, warnings};
};
