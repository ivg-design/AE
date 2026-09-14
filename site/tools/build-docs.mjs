#!/usr/bin/env node
// Generate public documentation from the published catalog and existing Markdown.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMd } from './render-markdown.mjs';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://forge.mograph.life/apps/ae/';
const PREFIX = '/apps/ae/';
const scripts = JSON.parse(fs.readFileSync(path.join(SITE, 'data/scripts.json'), 'utf8'));
const template = fs.readFileSync(path.join(SITE, 'tools/templates/docs.html'), 'utf8');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const categories = { animation: 'Animation & Rigging', composition: 'Composition', effects: 'Effects & Audio', keyframes: 'Keyframes', layers: 'Layers', paths: 'Paths & Shapes', utilities: 'Utilities' };
const titleOf = s => s.displayName || s.name;
const route = s => `docs/${s.id}.html`;
const descriptionOf = s => {
  const text = `${titleOf(s)} for After Effects: ${s.tagline || s.description}`.replace(/\s+/g, ' ').trim();
  return text.length <= 165 ? text : text.slice(0, 162).replace(/\s+\S*$/, '') + '…';
};
const sidebar = current => Object.entries(categories).map(([key, label]) =>
  `<span class="grp">${esc(label)}</span>` + scripts.filter(s => s.category === key).map(s =>
    `<a href="${PREFIX}${route(s)}" data-script-name="${esc(titleOf(s).toLowerCase())}"${s.id === current?.id ? ' class="on" aria-current="page"' : ''}>${esc(titleOf(s))}</a>`).join('')).join('\n');
const directory = Object.entries(categories).map(([key, label]) => `<h2 id="${key}">${esc(label)}</h2><ul>` + scripts.filter(s => s.category === key).map(s =>
  `<li><a href="${PREFIX}${route(s)}">${esc(titleOf(s))}</a> — ${esc(s.tagline)}</li>`).join('\n') + '</ul>').join('\n');

function generate(current) {
  const relative = current ? route(current) : 'docs.html';
  const url = BASE + relative;
  const name = current ? `${titleOf(current)} — After Effects script documentation` : 'After Effects script documentation — IVG Toolkit';
  const description = current ? descriptionOf(current) : `Documentation for ${scripts.length} free IVG Toolkit After Effects scripts. Browse setup, controls, examples, requirements, and individual JSX downloads.`;
  let rendered = current ? renderMd(fs.readFileSync(path.join(SITE, current.docPath), 'utf8')) : { html: `<p>${esc(description)}</p><p>Choose a script by the task you need to complete. Each guide includes usage instructions and a direct script download.</p>${directory}`, toc: Object.entries(categories).map(([id, t]) => ({ id, t })) };
  // Existing Markdown cross-links use source filenames; publish them as article links.
  for (const other of scripts) rendered.html = rendered.html.split(`href="${path.basename(other.docPath)}"`).join(`href="${PREFIX}${route(other)}"`);
  const crumbs = [ ['IVG Design Forge', 'https://forge.mograph.life/'], ['IVG Toolkit', BASE], ['Documentation', BASE + 'docs.html'] ];
  if (current) crumbs.push([titleOf(current), url]);
  const schema = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': current ? 'TechArticle' : 'CollectionPage', '@id': url + '#page', url, headline: name, name, description, inLanguage: 'en',
        author: { '@type': 'Person', name: 'Ilya Gusinski', url: 'https://www.mograph.life/' },
        isPartOf: { '@type': 'WebSite', name: 'IVG Toolkit', url: BASE },
        ...(current ? {} : { mainEntity: { '@type': 'ItemList', itemListElement: scripts.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: titleOf(s), url: BASE + route(s) })) } }) },
      { '@type': 'BreadcrumbList', itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) }
    ]
  };
  const metadata = `<link rel="canonical" href="${url}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta property="og:type" content="${current ? 'article' : 'website'}" />
  <meta property="og:site_name" content="IVG Toolkit" />
  <meta property="og:title" content="${esc(name)}" /><meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${url}" /><meta property="og:image" content="${BASE}assets/ae-toolkit.png" />
  <meta name="twitter:card" content="summary" /><meta name="twitter:title" content="${esc(name)}" />
  <meta name="twitter:description" content="${esc(description)}" /><meta name="twitter:image" content="${BASE}assets/ae-toolkit.png" />
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`;
  let html = template.replace(/<title>.*?<\/title>/, `<title>${esc(name)}</title>`)
    .replace(/<meta name="description"[^>]+>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<!-- ae-seo:start -->[\s\S]*?<!-- ae-seo:end -->/, metadata)
    .replace('id="docSearch" type="search"', 'id="docSearch" type="search" aria-label="Filter script documentation"')
    .replace('</label>\n    </aside>', `</label>\n${sidebar(current)}\n    </aside>`)
    .replace('<div class="doc-bc" id="docBc"></div>', `<nav class="doc-bc" id="docBc" aria-label="Breadcrumb">${crumbs.map(([label, target]) => `<a href="${target.startsWith(BASE) ? PREFIX + target.slice(BASE.length) : target === 'https://forge.mograph.life/' ? '/' : target}">${esc(label)}</a>`).join(' <span>/</span> ')}</nav>`)
    .replace('<h1 id="docH1">Loading…</h1>', `<h1 id="docH1">${esc(current ? titleOf(current) : 'IVG Toolkit documentation')}</h1>`)
    .replace('<div class="doc-badges" id="docBadges"></div>', current ? `<div class="doc-badges" id="docBadges"><span class="chip">${esc(categories[current.category])}</span><span class="chip">v${esc(current.version)}</span><span class="chip">${esc(current.ui)}</span></div>` : '')
    .replace('<div class="md" id="docMd"></div>', `<div class="md" id="docMd">${rendered.html}</div>`)
    .replace('<span class="h">ON THIS PAGE</span>', `<span class="h">ON THIS PAGE</span>${rendered.toc.map(({ t, id }) => `<a href="#${id}">${esc(t)}</a>`).join('')}`)
    .replace('<a href="#" class="on">Docs</a>', `<a href="${PREFIX}docs.html" class="on">Docs</a>`)
    .replace('<span class="ver">v1.0.1</span>', '<span class="ver">Open source</span>')
    .replace('js/docs.js?v=11', 'js/docs.js?v=14')
    .replace(/((?:href|src)=")(assets\/|css\/|vendor\/|js\/|download\/)/g, `$1${PREFIX}$2`)
    .replace(/href="index.html/g, `href="${PREFIX}`);
  if (current) html = html.replace('id="docDl" hidden', 'id="docDl"')
    .replace('<div class="t" id="dlT"></div>', `<div class="t" id="dlT">Get ${esc(titleOf(current))}</div>`)
    .replace('<div class="s" id="dlS"></div>', `<div class="s" id="dlS">v${esc(current.version)} · ${esc(current.ui)} · MIT</div>`)
    .replace('id="dlBtn" href="#" download', `id="dlBtn" href="${PREFIX}${esc(current.srcPath)}" download`);
  html = html.replace('</main>', `<footer class="doc-related"><a href="${PREFIX}docs.html">All script guides</a> · <a href="/">Explore Forge</a> · <a href="https://contra.com/ivg_design">Work with Ilya</a></footer></main>`);
  fs.writeFileSync(path.join(SITE, relative), html.replace(/[ \t]+$/gm, ''));
}

if (new Set(scripts.map(s => s.id)).size !== scripts.length) throw new Error('Duplicate script IDs');
for (const script of scripts) {
  if (!/^[a-z0-9-]+$/.test(script.id)) throw new Error('Invalid script route');
  generate(script);
}
generate(null);
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['', 'docs.html', ...scripts.map(route)].map(p => `  <url><loc>${BASE}${p}</loc></url>`).join('\n')}\n</urlset>\n`);
const configPath = path.join(SITE, 'vercel.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
config.redirects = [ ...(config.redirects || []).filter(r => !(r.source === '/docs.html' && r.has?.some(h => h.key === 's'))),
  ...scripts.map(s => ({ source: '/docs.html', has: [{ type: 'query', key: 's', value: s.id }], destination: BASE + route(s), permanent: true })) ];
fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
fs.writeFileSync(path.join(SITE, 'llms.txt'), `# IVG Toolkit — After Effects scripts

> ${scripts.length} free, open-source After Effects scripts with a dockable command bar and a Build-a-bar bundle generator. Read each guide for its own requirements, controls, and limitations.

- [Catalog](${BASE})
- [Documentation index](${BASE}docs.html)
- [Download bundle](${BASE}download/ae-scripts.zip)
- [Source and license](https://github.com/ivg-design/ae)

## Script guides

${scripts.map(s => `- [${titleOf(s)}](${BASE}${route(s)}): ${s.tagline}`).join('\n')}

## Creator

- [IVG Design Forge](https://forge.mograph.life/)
- [Work with Ilya](https://contra.com/ivg_design)

This file is a discovery aid. The linked public documentation is the source for product behavior; do not infer compatibility or release status beyond those guides.
`);
console.log(`Generated ${scripts.length} articles, documentation index, sitemap, and legacy query redirects.`);
