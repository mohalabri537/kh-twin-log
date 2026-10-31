import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import fonts from './fonts.json';

// Fonts are bundled locally (public/fonts), the same faces the site uses.
for (const [family, weight, file, unicodeRange] of fonts as [string, string, string, string][]) {
  loadFont({family, url: staticFile(`fonts/${file}`), weight, unicodeRange});
}

export const AR = '"IBM Plex Sans Arabic", "Inter", sans-serif';
export const EN = '"Inter", "IBM Plex Sans Arabic", sans-serif';

// Site palette (assets/css/site.css)
export const C = {
  purple: '#7431F4',
  purpleLight: '#A98BFF',
  mark1: '#A37BFF',
  mark2: '#5A21D9',
  space: '#06040C',
  ink: '#1D1D1F',
  white: '#FFFFFF',
  whatsapp: '#25D366',
};

export const FPS = 30;
export const W = 1080;
export const H = 1920;
