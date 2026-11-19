import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/** Palette: change colours here, every scene reads from this object. */
export const COLORS = {
  bg: '#0b0b0f',
  black: '#050507',
  ink: '#c9ced6', // main text
  inkDim: '#8a939e',
  blueGrey: '#6f7d8c', // line art
  blueGreyDim: '#2c343e',
  facade: '#15181e',
  facadeLine: '#232831',
  amber: '#e8a33d', // sodium lamp / lit window
  amberSoft: '#f4c27a',
  amberDeep: '#a8661c',
  red: '#8f2f2c', // used sparingly: stamps, threads, one calendar circle
  paper: '#cbbd9a', // manila
  paperDark: '#a8956c',
  sheet: '#d9d4c7',
} as const;

// Fonts are bundled in public/fonts (Special Elite: Apache 2.0, Cormorant Garamond: SIL OFL).
loadFont({family: 'Special Elite', url: staticFile('fonts/SpecialElite-400.woff2'), weight: '400'});
loadFont({family: 'Cormorant Garamond', url: staticFile('fonts/CormorantGaramond-400-normal.woff2'), weight: '400'});
loadFont({family: 'Cormorant Garamond', url: staticFile('fonts/CormorantGaramond-500-normal.woff2'), weight: '500'});
loadFont({
  family: 'Cormorant Garamond',
  url: staticFile('fonts/CormorantGaramond-400-italic.woff2'),
  weight: '400',
  style: 'italic',
});

export const FONTS = {
  mono: "'Special Elite', 'Courier New', monospace", // dates, case-file text
  serif: "'Cormorant Garamond', Georgia, serif", // titles
} as const;
