import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scripts = JSON.parse(await fs.readFile(path.join(site, 'data/scripts.json'), 'utf8'));
let before = 0, after = 0;
for (const { icon } of scripts) {
  if (!icon) continue;
  const source = path.join(site, icon);
  before += (await fs.stat(source)).size;
  for (const width of [68, 136, 224]) {
    const dest = path.join(site, icon.replace('assets/icons/', 'assets/icons/responsive/').replace(/\.webp$/, `-${width}.webp`));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality: 82, smartSubsample: true }).toFile(dest);
    if (width === 224) after += (await fs.stat(dest)).size;
  }
}
console.log(JSON.stringify({ before, heroAfter: after }));
