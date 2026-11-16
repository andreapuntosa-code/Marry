import scenes from '../scenes.json';
import type {ChalkColor, ScenesFile} from './types';

export const STYLE = (scenes as ScenesFile).style;

export const chalkColor = (c?: ChalkColor) => (c === 'yellow' ? STYLE.accent : STYLE.chalk);
