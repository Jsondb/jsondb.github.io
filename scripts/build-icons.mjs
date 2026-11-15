/*
 * Copyright (c) 2026 Farooq Khan
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Generates the raster icons in public/ from the SVG logos in src/assets/.
// Run with `npm run icons` after changing a logo; the output is committed.

import { readFile, writeFile, copyFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const large = await readFile(new URL('src/assets/logo.svg', root));
const small = await readFile(new URL('src/assets/logo-small.svg', root));

const png = (svg, size) => sharp(svg, { density: 72 * (size / 64) * 4 }).resize(size, size).png().toBuffer();

// An ICO file whose images are stored as PNGs (supported since Windows Vista).
function pngsToIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;
  images.forEach(({ size, data }, i) => {
    const o = i * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, o);
    directory.writeUInt8(size >= 256 ? 0 : size, o + 1);
    directory.writeUInt16LE(1, o + 4);
    directory.writeUInt16LE(32, o + 6);
    directory.writeUInt32LE(data.length, o + 8);
    directory.writeUInt32LE(offset, o + 12);
    offset += data.length;
  });
  return Buffer.concat([header, directory, ...images.map((image) => image.data)]);
}

// Favicons: the small artwork stays legible at 16 and 32 px; 48 px has room for the detailed one.
await writeFile(
  new URL('public/favicon.ico', root),
  pngsToIco([
    { size: 16, data: await png(small, 16) },
    { size: 32, data: await png(small, 32) },
    { size: 48, data: await png(large, 48) },
  ]),
);
await copyFile(new URL('src/assets/logo-small.svg', root), new URL('public/favicon.svg', root));

// iOS applies its own rounded mask and shows transparency as black, so this one is a square tile.
const square = Buffer.from(large.toString().replaceAll('rx="14"', 'rx="0"'));
await sharp(await png(square, 180)).flatten({ background: '#4338ca' }).toFile(new URL('public/apple-touch-icon.png', root).pathname);

// Social card, 1200 x 630.
const logoInner = large
  .toString()
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '')
  .replace(/<title>.*?<\/title>/, '');
const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="0.85" cy="0" r="0.75"><stop offset="0" stop-color="#4f46e5" stop-opacity=".55"/><stop offset="1" stop-color="#4f46e5" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2" cx="0" cy="1" r="0.6"><stop offset="0" stop-color="#22d3ee" stop-opacity=".18"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#09090b"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <svg x="100" y="205" width="220" height="220" viewBox="0 0 64 64">${logoInner}</svg>
  <g font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif">
    <text x="380" y="300" font-size="104" font-weight="700" fill="#fafafa" letter-spacing="-2">Json<tspan fill="#a5b4fc">DB</tspan></text>
    <text x="384" y="366" font-size="34" fill="#a1a1aa">An embedded Java database that's just JSON files</text>
    <text x="384" y="420" font-size="26" fill="#71717a">jsondb.github.io</text>
  </g>
</svg>`;
await sharp(Buffer.from(card)).png().toFile(new URL('public/og.png', root).pathname);

console.log('Wrote public/favicon.ico, favicon.svg, apple-touch-icon.png and og.png');
