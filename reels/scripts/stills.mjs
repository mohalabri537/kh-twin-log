// Renders chosen frames of a composition as PNG stills with one bundle: node scripts/stills.mjs <comp> <outdir> <frame>...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path';
const [comp, out, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: comp});
for (const f of frames) {
  await renderStill({serveUrl, composition, frame: Number(f), output: path.join(out, `${comp}-${f}.png`), onBrowserLog: (l) => { if (l.text.includes('DBG')) console.log(l.text); }});
  console.log('frame', f);
}
