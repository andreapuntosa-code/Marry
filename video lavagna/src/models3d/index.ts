import Lemon3D from './Lemon3D';
import Tank3D from './Tank3D';
import type {ModelDef} from './types';

/**
 * Registro degli oggetti 3D. Per aggiungerne uno: crea un file in questa cartella
 * (vedi Tank3D.tsx) e aggiungilo qui. In scenes.json: { "type": "3d", "model": "NomeModello", ... }
 */
export const MODELS: Record<string, ModelDef> = {
  Lemon3D,
  Tank3D,
};
