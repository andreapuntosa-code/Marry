// File generato da scripts/tts.mjs: non modificarlo a mano.
import type {ScenesFile, TimingsFile} from '../types';
import s0 from '../../videos/integrals/scenes.json';
import t0 from './integrals.timings.json';
import s1 from '../../videos/superposition/scenes.json';
import t1 from './superposition.timings.json';

export const VIDEOS: {id: string; scenes: ScenesFile; timings: TimingsFile}[] = [
  {id: 'integrals', scenes: s0 as ScenesFile, timings: t0 as TimingsFile},
  {id: 'superposition', scenes: s1 as ScenesFile, timings: t1 as TimingsFile},
];
