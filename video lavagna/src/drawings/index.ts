import Arrow from './Arrow';
import Chip from './Chip';
import LightBulb from './LightBulb';
import MotionLines from './MotionLines';
import Spinner from './Spinner';
import Spiral from './Spiral';
import TwoBalls from './TwoBalls';
import Underline from './Underline';
import Wave from './Wave';
import type {DrawingDef} from './types';

/**
 * Registro dei disegni. Per aggiungerne uno: crea un file in questa cartella
 * (vedi Spiral.tsx come esempio minimo) e aggiungilo qui. Poi usalo in scenes.json
 * con "drawing": "NomeDisegno".
 */
export const DRAWINGS: Record<string, DrawingDef> = {
  Arrow,
  Chip,
  LightBulb,
  MotionLines,
  Spinner,
  Spiral,
  TwoBalls,
  Underline,
  Wave,
};
