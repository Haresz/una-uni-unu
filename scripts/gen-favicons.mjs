// Rasterizes public/favicon.svg into PNG + ICO fallbacks.
//
//   node scripts/gen-favicons.mjs
//
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'public', 'favicon.svg'), 'utf8');

function render(size) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

const PNG_TARGETS = {
  'favicon-16.png': 16,
  'favicon-32.png': 32,
  'favicon-48.png': 48,
  'apple-touch-icon.png': 180,
  'icon-192.png': 192,
  'icon-512.png': 512,
};

for (const [file, size] of Object.entries(PNG_TARGETS)) {
  const out = resolve(root, 'public', file);
  writeFileSync(out, render(size));
  console.log(`wrote public/${file} (${size}x${size})`);
}

const ico = await pngToIco([render(16), render(32), render(48)]);
writeFileSync(resolve(root, 'public', 'favicon.ico'), ico);
console.log('wrote public/favicon.ico (16/32/48)');
