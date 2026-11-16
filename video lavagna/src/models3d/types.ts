import type React from 'react';

export type ModelProps = {
  /** comparsa 0..1 */
  p: number;
  /** seconda fase 0..1 (campo "then") */
  p2: number;
  /** fasi extra 0..1 (campo "cues") */
  cues: number[];
  /** secondi da quando l'oggetto è comparso (per rotazioni lente, ecc.) */
  t: number;
  /** colori del gesso: chalk, accent + palette */
  colors: Record<string, string>;
  /** dimensioni del riquadro in pixel (per lo spessore delle linee) */
  width: number;
  height: number;
  props: Record<string, unknown>;
};

export type ModelDef = {
  /** campo visivo verticale della camera, in gradi */
  fov?: number;
  component: React.FC<ModelProps>;
};
