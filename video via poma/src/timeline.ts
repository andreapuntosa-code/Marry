import content from './content.json';

export type TextCue = {text: string; at: number; cps: number};
export type SceneContent = (typeof content.scenes)[number] & {texts?: TextCue[]};

export const FPS = content.fps;
export const FADE = Math.round(content.fadeSeconds * FPS);

/** Scene start/duration in frames, computed from content.json (durations in seconds). */
export const SCENES = (() => {
  let from = 0;
  return content.scenes.map((s) => {
    const durationInFrames = Math.round(s.duration * FPS);
    const out = {id: s.id, from, durationInFrames, data: s as SceneContent};
    from += durationInFrames;
    return out;
  });
})();

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.durationInFrames, 0);

export const sceneData = <T = Record<string, unknown>>(id: string) =>
  SCENES.find((s) => s.id === id)!.data as unknown as T & {duration: number; texts?: TextCue[]};

export const sec = (s: number) => Math.round(s * FPS);
