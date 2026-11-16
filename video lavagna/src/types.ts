export type ChalkColor = 'white' | 'yellow';

type BaseAction = {
  /** Parola della narrazione che fa partire l'azione. "parola#2" = seconda occorrenza; "start"/"end" = inizio/fine scena. */
  at: string;
  /** Ritardo extra in secondi rispetto alla parola. */
  delay?: number;
  /** Parola alla quale l'elemento viene cancellato (dissolvenza). */
  out?: string;
  x: number;
  y: number;
  color?: ChalkColor;
  rotate?: number;
};

export type TextAction = BaseAction & {
  type: 'text';
  /** Testo; *asterischi* = parola chiave in giallo; \n = a capo. */
  text: string;
  size?: number;
  /** Caratteri scritti al secondo. */
  cps?: number;
  font?: 'Caveat' | 'Gochi Hand';
};

export type DrawingAction = BaseAction & {
  type: 'drawing';
  /** Nome del disegno registrato in src/drawings/index.ts */
  drawing: string;
  width: number;
  height: number;
  /** Secondi per tracciare il disegno. */
  duration?: number;
  /** Parola che avvia la seconda fase del disegno (es. lampadina che si accende, onda che collassa). */
  then?: string;
  thenDuration?: number;
  props?: Record<string, unknown>;
};

export type Action = TextAction | DrawingAction;

export type Scene = {
  id: string;
  narration: string;
  actions: Action[];
};

export type ScenesFile = {
  title: string;
  video: {width: number; height: number; fps: number};
  style: {board: string; chalk: string; accent: string; font: 'Caveat' | 'Gochi Hand'};
  timing: {leadIn: number; hold: number; erase: number; tail: number; sentencePause?: number};
  voice: Record<string, unknown>;
  scenes: Scene[];
};

export type Word = {text: string; start: number; end: number};

export type SceneTiming = {
  id: string;
  narration: string;
  audio: string;
  duration: number;
  words: Word[];
};

export type TimingsFile = {
  provider: string;
  generatedAt: string;
  scenes: SceneTiming[];
};
