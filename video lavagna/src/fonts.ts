import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/**
 * Font a mano inclusi in public/fonts (licenza SIL OFL, da Google Fonts):
 * così il render funziona anche offline.
 */
loadFont({family: 'Caveat', url: staticFile('fonts/Caveat-latin.woff2'), weight: '400 700'});
loadFont({family: 'Gochi Hand', url: staticFile('fonts/GochiHand-latin.woff2'), weight: '400'});

export const FONTS: Record<'Caveat' | 'Gochi Hand', string> = {
  Caveat: "'Caveat', cursive",
  'Gochi Hand': "'Gochi Hand', cursive",
};
