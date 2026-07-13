#!/usr/bin/env node
// Rebuild the static "Download all" archive (site/download/ae-scripts.zip) AND
// the toolbar PNG icons the client-side bundle customizer fetches — both from the
// current catalog + the curated square SVG set. Keeps the download in lock-step
// with the site instead of drifting stale.
//
//   packages/ae-scripts/toolbar/icons/<id>.png   (24px + 48px@2x, for the ScriptUI panel + customizer)
//   site/download/ae-scripts.zip                 (Build-a-Bar.jsx + ivg-scripts/…)
//
// Requires rsvg-convert + magick + the `zip` CLI.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');                       // ae/site
const AE = path.resolve(SITE, '..');                         // ae
const REPO_ROOT = path.resolve(AE, '..');                    // ae-script-catalog
const SRC = path.join(AE, 'packages', 'ae-scripts', 'src');
const TOOLBAR = path.join(AE, 'packages', 'ae-scripts', 'toolbar');
const TOOLBAR_ICONS = path.join(TOOLBAR, 'icons');
const SVG_DIRS = [path.join(REPO_ROOT, 'assets', 'icons', 'icon update'),
                  path.join(REPO_ROOT, 'assets', 'icons')];
const findSvg = (n) => { for (const d of SVG_DIRS) { const p = path.join(d, n); if (fs.existsSync(p)) return p; } return null; };

const scripts = JSON.parse(fs.readFileSync(path.join(SITE, 'data', 'scripts.json'), 'utf8'));
// Icon source. Prefer the private native icon-map (maps slug -> curated
// assets/icons filenames) when that repo is checked out alongside; otherwise
// fall back to the committed slug-named SVG set so THIS repo can rebuild the
// bundle on its own. To add a new script's icon: drop <slug>.svg (and optional
// <slug>.cmd.svg / <slug>.shift.svg rollovers) into site/download/native/icons/.
const NATIVE_MAP = path.join(AE, 'native', 'ivgd-command-bar', 'tools', 'icon-map.json');
const ICON_SVG_DIR = path.join(SITE, 'download', 'native', 'icons');
const iconMap = fs.existsSync(NATIVE_MAP) ? JSON.parse(fs.readFileSync(NATIVE_MAP, 'utf8')) : null;
const slugSvg = (n) => { const p = path.join(ICON_SVG_DIR, n); return fs.existsSync(p) ? p : null; };
const resolveIcons = (id) => {
  if (iconMap) {
    const m = iconMap[id] || {};
    return { base: (m.base && findSvg(m.base)) || null,
             variants: { shift: (m.variants && m.variants.shift && findSvg(m.variants.shift)) || null,
                         cmd: (m.variants && m.variants.cmd && findSvg(m.variants.cmd)) || null } };
  }
  return { base: slugSvg(`${id}.svg`),
           variants: { shift: slugSvg(`${id}.shift.svg`), cmd: slugSvg(`${id}.cmd.svg`) } };
};
const jsxName = (s) => s.srcPath.split('/').pop();
const EXTRAS = { 'sync-o-tron': [{ dest: 'ivg-scripts/projects/Sync-o-tron.aep', src: path.join(REPO_ROOT, 'assets', 'projects', 'Sync-o-tron.aep') }] };

// ---- 1. rasterize each base SVG -> 24px + 48px @2x PNG (ScriptUI toolbar icons)
// ScriptUI's iconbutton draws the image at its NATIVE pixel size — it does NOT
// scale to the button — so these MUST be the panel's logical size (CELL uses
// 24px icons) with a 48px "@2x" sibling ScriptUI auto-detects for HiDPI.
// (A 256px PNG overflowed its 40px cell and smeared across the whole bar.)
fs.rmSync(TOOLBAR_ICONS, { recursive: true, force: true });
fs.mkdirSync(TOOLBAR_ICONS, { recursive: true });
const raster = (svg, outName, size) => {
  const tmp = path.join(os.tmpdir(), `bpng-${outName.replace(/[^\w.@-]/g, '_')}.png`);
  const out = path.join(TOOLBAR_ICONS, `${outName}.png`);
  execFileSync('rsvg-convert', ['-a', '-w', String(size), '-h', String(size), svg, '-o', tmp]);
  execFileSync('magick', [tmp, '-background', 'none', '-gravity', 'center', '-extent', `${size}x${size}`, out]);
};
let png = 0, alt = 0;
for (const s of scripts) {
  const { base: svg, variants } = resolveIcons(s.id);
  if (!svg) continue;
  raster(svg, `${s.id}`, 24);
  raster(svg, `${s.id}@2x`, 48);
  // rollover variants: <slug>.shift.png (Shift) + <slug>.cmd.png (Cmd/Ctrl) —
  // matching the native bar's two rollover states. Each with a 48px @2x sibling.
  for (const mod of ['shift', 'cmd']) {
    const vSvg = variants[mod];
    if (vSvg) { raster(vSvg, `${s.id}.${mod}`, 24); raster(vSvg, `${s.id}.${mod}@2x`, 48); alt++; }
  }
  png++;
}

// ---- 2. stage the bundle (mirrors the site's JSZip customizer layout) -------
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'aezip-'));
const cp = (src, dest) => { if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(src, dest); return true; } return false; };
cp(path.join(TOOLBAR, 'Build-a-Bar.jsx'), path.join(stage, 'Build-a-Bar.jsx'));
let jsx = 0, ico = 0;
for (const s of scripts) {
  if (cp(path.join(SRC, s.category, jsxName(s)), path.join(stage, 'ivg-scripts', s.category, jsxName(s)))) jsx++;
  if (cp(path.join(TOOLBAR_ICONS, `${s.id}.png`), path.join(stage, 'ivg-scripts', 'icons', `${s.id}.png`))) ico++;
  cp(path.join(TOOLBAR_ICONS, `${s.id}@2x.png`), path.join(stage, 'ivg-scripts', 'icons', `${s.id}@2x.png`));   // HiDPI sibling
  for (const mod of ['shift', 'cmd']) {   // Shift + Cmd/Ctrl rollover variants (+ @2x)
    cp(path.join(TOOLBAR_ICONS, `${s.id}.${mod}.png`), path.join(stage, 'ivg-scripts', 'icons', `${s.id}.${mod}.png`));
    cp(path.join(TOOLBAR_ICONS, `${s.id}.${mod}@2x.png`), path.join(stage, 'ivg-scripts', 'icons', `${s.id}.${mod}@2x.png`));
  }
  for (const ex of (EXTRAS[s.id] || [])) cp(ex.src, path.join(stage, ex.dest));
}
fs.writeFileSync(path.join(stage, 'ivg-scripts', 'tooltips.txt'),
  scripts.map((s) => `${jsxName(s).replace(/\.jsx$/, '')}|${(s.tagline || '').replace(/\|/g, '/')}`).join('\n'));
fs.writeFileSync(path.join(stage, 'README.txt'),
`Build-a-Bar bundle — ${scripts.length} scripts (MIT)
=========================================================

INSTALL
  1. Copy "Build-a-Bar.jsx" AND the whole "ivg-scripts" folder into:
       After Effects > Scripts > ScriptUI Panels
  2. Restart After Effects (or File > Scripts > Rescan Script Folder).
  3. Open Window > Build-a-Bar.jsx — a dockable, resizable toolbar
     with one icon button per script.

Only the command bar appears in the Window menu; your scripts live in the
ivg-scripts subfolder and are launched by the bar.

INCLUDED
${scripts.map((s) => `  - ${s.name} v${s.version || '1.0'} (${s.category})`).join('\n')}
`);

// ---- 3. zip -> site/download/ae-scripts.zip --------------------------------
const outZip = path.join(SITE, 'download', 'ae-scripts.zip');
fs.mkdirSync(path.dirname(outZip), { recursive: true });
fs.rmSync(outZip, { force: true });
execFileSync('zip', ['-r', '-X', '-q', outZip, '.'], { cwd: stage });
fs.rmSync(stage, { recursive: true, force: true });

const size = (fs.statSync(outZip).size / 1024).toFixed(0);
console.log(`toolbar PNGs: ${png} rasterized (24px + 48px@2x)`);
console.log(`bundle -> ${outZip}  (${jsx} scripts, ${ico} icons, ${size} KB)`);
