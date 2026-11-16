import Arrow from './Arrow';
import Chip from './Chip';
import LightBulb from './LightBulb';
import MotionLines from './MotionLines';
import Spinner from './Spinner';
import Spiral from './Spiral';
import TwoBalls from './TwoBalls';
import Underline from './Underline';
import Wave from './Wave';
import Bathtub from './Bathtub';
import Car from './Car';
import Check from './Check';
import IntegralSign from './IntegralSign';
import Lemon from './Lemon';
import LineGraph from './LineGraph';
import RiemannGraph from './RiemannGraph';
import type {DrawingDef} from './types';

/**
 * Registro dei disegni. Per aggiungerne uno: crea un file in questa cartella
 * (vedi Spiral.tsx come esempio minimo) e aggiungilo qui. Poi usalo in scenes.json
 * con "drawing": "NomeDisegno".
 */
export const DRAWINGS: Record<string, DrawingDef> = {
  Arrow,
  Bathtub,
  Car,
  Check,
  IntegralSign,
  Lemon,
  LineGraph,
  RiemannGraph,
  Chip,
  LightBulb,
  MotionLines,
  Spinner,
  Spiral,
  TwoBalls,
  Underline,
  Wave,
};
