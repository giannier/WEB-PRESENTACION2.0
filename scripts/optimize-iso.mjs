/**
 * Turns a pdf2svg export of an ISO stamp into a shipping asset.
 *
 * Those exports wrap two full-size bitmaps (a colour plate and its grayscale alpha
 * plate), repeat each one three times as data URIs, and keep the whole A4 page as the
 * canvas. This script:
 *
 *   1. bakes the alpha plate into the colour plate, so one raster replaces two;
 *   2. registers that raster once in `<defs>` and wires the three band groups to it with
 *      `<use>`, instead of embedding the same base64 payload six times;
 *   3. drops the `<mask>`/`<filter>` layers that only existed to fake image alpha;
 *   4. trims `viewBox` to the artwork bbox so the stamp fills the box it is given;
 *   5. re-encodes the raster as WebP and rounds path precision to three decimals.
 *
 *   node scripts/optimize-iso.mjs <source.svg> <public/isos/name.svg>
 *
 * The band structure must survive: each band draws the full badge at the same scale but
 * with a slightly different translation, and collapsing them into a single unclipped
 * `<image>` visibly shifts the raster against the vector lettering.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error('usage: node scripts/optimize-iso.mjs <source.svg> <out.svg>');
  process.exit(1);
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const original = fs.readFileSync(src, 'utf8');

/* ---- 1. unique rasters: colour plate + alpha plate ---- */
const plates = [...original.matchAll(/xlink:href="data:image\/\w+;base64,([^"]+)"/g)].map(([, b64]) =>
  Buffer.from(b64, 'base64'),
);
const unique = plates.filter((buf, i, all) => all.findIndex((other) => other.equals(buf)) === i);
if (unique.length !== 2) throw new Error(`expected 2 unique plates, found ${unique.length}`);

const [alphaPlate, colorPlate] = unique;
const { width, height } = await sharp(colorPlate).metadata();
const alpha = await sharp(alphaPlate).greyscale().raw().toBuffer();
const rgba = await sharp(colorPlate)
  .joinChannel(alpha, { raw: { width, height, channels: 1 } })
  .raw()
  .toBuffer();
const raster = await sharp(rgba, { raw: { width, height, channels: 4 } })
  .webp({ quality: 95, effort: 6, smartSubsample: false })
  .toBuffer();

/* ---- 2. artwork bbox of the untouched export, in its own units ---- */
const probeWidth = 810;
const probe = await sharp(src).resize({ width: probeWidth }).flatten({ background: '#ff00ff' }).raw().toBuffer({ resolveWithObject: true });
let minx = 1e9;
let maxx = -1;
let miny = 1e9;
let maxy = -1;
for (let y = 0; y < probe.info.height; y += 1) {
  for (let x = 0; x < probeWidth; x += 1) {
    const j = (y * probeWidth + x) * probe.info.channels;
    const isBackground = probe.data[j] > 200 && probe.data[j + 1] < 60 && probe.data[j + 2] > 200;
    if (!isBackground) {
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
  }
}
const box = { x: minx, y: miny, w: maxx - minx + 1, h: maxy - miny + 1 };

/* ---- 3. rewrite ---- */
let svg = original;
svg = svg.replace(
  '<defs>',
  `<defs><image id="isoBadge" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/webp;base64,${raster.toString('base64')}"/>`,
);
svg = svg.replace(
  /<g clip-path="url\((#[\w-]+)\)"><g mask="url\(#[\w-]+\)"><g transform="([^"]*)"><image [^>]*\/><\/g><\/g><\/g>/g,
  (_, clip, transform) => `<g clip-path="url(${clip})"><g transform="${transform}"><use xlink:href="#isoBadge"/></g></g>`,
);
svg = svg.replace(/<filter [^>]*>.*?<\/filter>/g, '');
svg = svg.replace(/<mask [^>]*>.*?<\/mask>/g, '');
svg = svg.replace(
  /width="1080"([^>]*?)viewBox="0 0 810 [\d.]+" height="1440"/,
  `width="${box.w}"$1viewBox="${box.x} ${box.y} ${box.w} ${box.h}" height="${box.h}"`,
);
svg = svg.replace(/(\d+\.\d{3})\d+/g, '$1');

fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, svg);
console.log(`${path.basename(src)}: ${kb(original.length)} -> ${path.basename(dst)}: ${kb(fs.statSync(dst).size)}  (viewBox ${box.x} ${box.y} ${box.w} ${box.h})`);
