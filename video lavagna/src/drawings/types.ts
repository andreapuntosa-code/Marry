import type React from 'react';

export type DrawingProps = {
  /** avanzamento del tracciato 0..1 */
  p: number;
  /** seconda fase 0..1 (campo "then" in scenes.json), 0 se non usata */
  p2: number;
  /** fasi extra 0..1, una per ogni parola di "cues" in scenes.json */
  cues: number[];
  /** secondi trascorsi da quando il disegno è comparso */
  t: number;
  /** tutti i colori del gesso: chalk, accent + palette (blue, pink, ...) */
  colors: Record<string, string>;
  /** font a mano del video */
  font: string;
  /** colore principale (bianco gesso o giallo, da "color") */
  color: string;
  /** colore accento (giallo gesso) */
  accent: string;
  /** spessore del tratto in unità del viewBox (≈ 7 px a schermo) */
  sw: number;
  /** seme per le imperfezioni */
  seed: string;
  /** parametri extra dal campo "props" di scenes.json */
  props: Record<string, unknown>;
};

export type DrawingDef = {
  /** viewBox del disegno; può dipendere dai props */
  viewBox: string | ((props: Record<string, unknown>) => string);
  component: React.FC<DrawingProps>;
};
