#!/usr/bin/env node
// Keep the landing-page library useful and crawlable before app.js runs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORIES = [
  'animation',
  'composition',
  'effects',
  'keyframes',
  'layers',
  'paths',
  'utilities',
];
const LABELS = {
  animation: 'Animation & Rigging',
  composition: 'Composition',
  effects: 'Effects & Audio',
  keyframes: 'Keyframes',
  layers: 'Layers',
  paths: 'Paths & Shapes',
  utilities: 'Utilities',
};
const COLORS = {
  animation: '#7C5CFF',
  composition: '#2E9BFF',
  effects: '#FF6B9D',
  keyframes: '#FFB454',
  layers: '#5AD19A',
  paths: '#C77DFF',
  utilities: '#4ED8E0',
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function replaceGeneratedBlock(html, start, end, content) {
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!re.test(html)) throw new Error(`index.html is missing ${start}`);
  return html.replace(re, `${start}\n${content}\n${end}`);
}

export function renderLibraryFallback(source, scripts) {
  const nav = CATEGORIES.map((category) => {
    const count = scripts.filter((script) => script.category === category).length;
    return `            <a class="cat-item" href="#library-${category}"><span class="dot" style="background:${COLORS[category]}"></span><span class="n">${escapeHtml(LABELS[category])}</span><span class="ct">${count}</span></a>`;
  }).join('\n');

  const guides = CATEGORIES.map((category) => {
    const rows = scripts
      .filter((script) => script.category === category)
      .map((script) => {
        const name = escapeHtml(script.displayName || script.name);
        const badgeClass =
          script.ui === 'HEADLESS'
            ? ' is-headless'
            : ['PALETTE', 'PANEL'].includes(script.ui)
              ? ' is-palette'
              : '';
        const tile = script.icon
          ? `<img src="${escapeHtml(script.icon)}" alt="" width="48" height="48" loading="lazy" decoding="async" />`
          : `<i data-lucide="${escapeHtml(script.lucide || 'square-code')}"></i>`;
        return `        <a class="script-row" href="/apps/ae/docs/${encodeURIComponent(script.id)}.html">
          <span class="tile">${tile}</span>
          <span class="nc"><span class="n">${name}</span><span class="d">${escapeHtml(script.tagline)}</span></span>
          <span class="sp"></span><span class="v">v${escapeHtml(script.version || '1.0')}</span>
          <span class="ui-badge${badgeClass}">${escapeHtml(script.ui)}</span><span class="guide-arrow" aria-hidden="true">→</span>
        </a>`;
      })
      .join('\n');
    return `        <section class="static-guide-category" id="library-${category}" aria-labelledby="library-${category}-title">
          <h3 id="library-${category}-title">${escapeHtml(LABELS[category])}</h3>
${rows}
        </section>`;
  }).join('\n');

  let html = replaceGeneratedBlock(
    source,
    '<!-- STATIC_LIBRARY_NAV:START -->',
    '<!-- STATIC_LIBRARY_NAV:END -->',
    nav
  );
  html = replaceGeneratedBlock(
    html,
    '<!-- STATIC_LIBRARY_GUIDES:START -->',
    '<!-- STATIC_LIBRARY_GUIDES:END -->',
    guides
  );
  // Remove the legacy SEO directory that was appended after the real footer.
  return html.replace(
    /\n  <section class="script-documentation"[\s\S]*?<\/section>(?=\n  <script src="vendor\/lucide)/,
    ''
  );
}

const modulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === modulePath) {
  const siteDir = path.resolve(path.dirname(modulePath), '..');
  const indexPath = path.join(siteDir, 'index.html');
  const dataPath = path.join(siteDir, 'data', 'scripts.json');
  const html = renderLibraryFallback(
    fs.readFileSync(indexPath, 'utf8'),
    JSON.parse(fs.readFileSync(dataPath, 'utf8'))
  );
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`Rendered crawlable library fallback in ${indexPath}`);
}
