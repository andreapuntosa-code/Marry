import {createContext, useContext} from 'react';
import type {ChalkColor, ScenesFile} from './types';

export type Style = ScenesFile['style'];

export const DEFAULT_STYLE: Style = {board: '#1F3B2D', chalk: '#F2F2F2', accent: '#F5D76E', font: 'Caveat'};

export const StyleContext = createContext<Style>(DEFAULT_STYLE);

/** Stile (colori, font) del video corrente, da "style" in videos/<video>/scenes.json */
export const useStyle = () => useContext(StyleContext);

export const chalkColor = (style: Style, c?: ChalkColor | string) =>
  c === 'yellow' ? style.accent : c === 'white' || !c ? style.chalk : (style.palette?.[c] ?? c);
