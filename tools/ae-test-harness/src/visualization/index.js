/**
 * src/visualization/index.js — UITree visualization subsystem.
 *
 * Exports:
 *   - renderHTML(uiTree) -> htmlString
 *       Fallback renderer producing a clean, standalone HTML document that
 *       visually lays out a captured UITree (nested boxes, labels, control
 *       types, values, handlers). Never throws on malformed input — it renders
 *       a best-effort representation and surfaces validation errors inline.
 *
 *   - screenshot(html, outPngPath) -> Promise<{ ok, skipped, reason?, path? }>
 *       Renders `html` to a PNG via Playwright chromium. Playwright is imported
 *       dynamically; if the import or browser launch fails, returns
 *       { ok:false, skipped:true, reason } and never throws.
 *
 *   - sdbAdapter(uiTree, outPath) -> Promise<{ skipped, reason?, ok?, path? }>
 *       Optional integration with an external "SDB" renderer behind the
 *       SDB_ROOT env var. No-op { skipped:true, reason } when SDB_ROOT is unset.
 *
 * All operation logging uses OPERATION_KINDS from the frozen contracts module.
 * Modules are importable in isolation (no top-level side effects, no eager
 * dependency on optional packages like Playwright).
 */

import { validateUITree, OPERATION_KINDS } from '../contracts/index.js';

/**
 * The contract operation kind used when this subsystem writes an artifact
 * (a screenshot PNG or an SDB-rendered file) to disk. Resolved from the
 * frozen OPERATION_KINDS set so logging stays in lockstep with contracts.
 */
const FILE_WRITE = OPERATION_KINDS.find((k) => k === 'fileWrite');

/* ------------------------------------------------------------------ */
/* HTML escaping helpers                                               */
/* ------------------------------------------------------------------ */

/**
 * Escape a value for safe inclusion in HTML text/attribute content.
 * @param {*} v
 * @returns {string}
 */
function esc(v) {
  if (v == null) return '';
  const s = typeof v === 'string' ? v : safeStringify(v);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Stringify arbitrary values without throwing on cycles/odd types.
 * @param {*} v
 * @returns {string}
 */
function safeStringify(v) {
  if (v === undefined) return '';
  if (v === null) return 'null';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const seen = new WeakSet();
    return JSON.stringify(v, (_k, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[Circular]';
        seen.add(val);
      }
      return val;
    });
  } catch {
    try {
      return String(v);
    } catch {
      return '[Unserializable]';
    }
  }
}

/* ------------------------------------------------------------------ */
/* UINode -> HTML                                                      */
/* ------------------------------------------------------------------ */

/**
 * Render a single UINode (and its descendants) to an HTML fragment.
 * @param {*} node
 * @param {number} depth
 * @returns {string}
 */
function renderNode(node, depth) {
  if (node == null || typeof node !== 'object') {
    return `<div class="ui-node ui-invalid">Invalid node: ${esc(safeStringify(node))}</div>`;
  }

  const type = typeof node.type === 'string' ? node.type : 'unknown';
  const name = node.name != null ? String(node.name) : '';
  const text = node.text != null ? String(node.text) : '';
  const hasValue = 'value' in node && node.value !== undefined;
  const handlers = Array.isArray(node.handlers) ? node.handlers : [];
  const props =
    node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)
      ? node.properties
      : null;
  const children = Array.isArray(node.children) ? node.children : [];

  const isContainer = children.length > 0 || /panel|group|window|dialog|palette|tabbedpanel|tab/i.test(type);

  const head = [];
  head.push(`<span class="node-type" data-type="${esc(type)}">${esc(type)}</span>`);
  if (name) head.push(`<span class="node-name">${esc(name)}</span>`);
  if (text) head.push(`<span class="node-text">&ldquo;${esc(text)}&rdquo;</span>`);
  if (hasValue) head.push(`<span class="node-value">= ${esc(safeStringify(node.value))}</span>`);

  const metaBits = [];
  if (props) {
    const entries = Object.keys(props)
      .map((k) => `${esc(k)}: ${esc(safeStringify(props[k]))}`)
      .join(', ');
    if (entries) metaBits.push(`<span class="node-props">{ ${entries} }</span>`);
  }
  if (handlers.length) {
    metaBits.push(
      `<span class="node-handlers">${handlers
        .map((h) => `<span class="handler">${esc(h)}</span>`)
        .join('')}</span>`
    );
  }

  const cls = isContainer ? 'ui-node ui-container' : 'ui-node ui-leaf';
  const parts = [];
  parts.push(`<div class="${cls}" data-depth="${depth}">`);
  parts.push(`<div class="node-head">${head.join(' ')}</div>`);
  if (metaBits.length) parts.push(`<div class="node-meta">${metaBits.join(' ')}</div>`);
  if (children.length) {
    parts.push('<div class="node-children">');
    for (const child of children) parts.push(renderNode(child, depth + 1));
    parts.push('</div>');
  }
  parts.push('</div>');
  return parts.join('');
}

const STYLES = `
:root {
  --bg: #0f1117;
  --panel: #181b24;
  --panel-2: #1f232f;
  --border: #2c3140;
  --accent: #5aa9e6;
  --text: #e6e9ef;
  --muted: #8a93a6;
  --value: #9ece6a;
  --handler: #e0af68;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 24px;
  background: var(--bg);
  color: var(--text);
  font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.ui-root-header {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.ui-root-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.ui-root-header .root-type {
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
}
.ui-root-header .root-title { color: var(--text); }
.ui-errors {
  margin: 12px 0;
  padding: 10px 12px;
  border: 1px solid #5a2a2a;
  background: #241516;
  border-radius: 6px;
  color: #f3b6b6;
}
.ui-errors strong { color: #ff8d8d; }
.ui-errors ul { margin: 6px 0 0; padding-left: 18px; }
.ui-node {
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 6px 0;
  background: var(--panel);
}
.ui-container { background: var(--panel-2); }
.ui-leaf { background: var(--panel); }
.ui-invalid { border-color: #5a2a2a; color: #f3b6b6; }
.node-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}
.node-type {
  color: var(--accent);
  font-weight: 600;
  text-transform: lowercase;
}
.node-name { color: var(--text); font-weight: 600; }
.node-text { color: var(--muted); }
.node-value { color: var(--value); }
.node-meta { margin-top: 4px; font-size: 12px; color: var(--muted); }
.node-props { color: var(--muted); }
.node-handlers { display: inline-flex; gap: 6px; }
.handler {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 10px;
  background: rgba(224, 175, 104, 0.15);
  color: var(--handler);
  font-size: 11px;
}
.node-children {
  margin-top: 8px;
  padding-left: 14px;
  border-left: 2px solid var(--border);
}
.ui-empty { color: var(--muted); font-style: italic; padding: 12px; }
`;

/**
 * Render a UITree to a clean, standalone HTML string.
 * Never throws; malformed trees produce a best-effort document with the
 * validation errors surfaced at the top.
 *
 * @param {import('../contracts/index.js').UITree} uiTree
 * @returns {string} Full HTML document.
 */
export function renderHTML(uiTree) {
  const tree = uiTree && typeof uiTree === 'object' ? uiTree : {};
  const { ok, errors } = validateUITree(tree);

  const rootType = typeof tree.type === 'string' ? tree.type : 'UITree';
  const title = typeof tree.title === 'string' ? tree.title : '';
  const children = Array.isArray(tree.children) ? tree.children : [];

  const errorBlock = ok
    ? ''
    : `<div class="ui-errors"><strong>UITree validation: ${errors.length} issue(s)</strong>` +
      `<ul>${errors.map((e) => `<li>${esc(e)}</li>`).join('')}</ul></div>`;

  const body = children.length
    ? children.map((c) => renderNode(c, 0)).join('')
    : '<div class="ui-empty">No child controls captured.</div>';

  const headTitle = title ? `${rootType} — ${title}` : rootType;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(headTitle)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="ui-root">
  <header class="ui-root-header">
    <h1>
      <span class="root-type">${esc(rootType)}</span>
      <span class="root-title">${esc(title || '(untitled)')}</span>
    </h1>
  </header>
  ${errorBlock}
  <main class="ui-tree-body">
    ${body}
  </main>
</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* screenshot via Playwright chromium                                 */
/* ------------------------------------------------------------------ */

/**
 * Render an HTML string to a PNG using Playwright chromium.
 *
 * Playwright is imported dynamically. If the import fails (package not
 * installed) or the browser cannot be launched (no browser binaries),
 * resolves to { ok:false, skipped:true, reason } and never throws.
 *
 * On success logs a `fileWrite` Operation in the returned `log` array.
 *
 * @param {string} html
 * @param {string} outPngPath Absolute path to write the PNG to.
 * @returns {Promise<{ ok:boolean, skipped:boolean, reason?:string, path?:string, log?:object[] }>}
 */
export async function screenshot(html, outPngPath) {
  if (typeof html !== 'string' || html.length === 0) {
    return { ok: false, skipped: true, reason: 'no HTML provided' };
  }
  if (typeof outPngPath !== 'string' || outPngPath.length === 0) {
    return { ok: false, skipped: true, reason: 'no output path provided' };
  }

  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    return {
      ok: false,
      skipped: true,
      reason: `playwright import unavailable: ${err && err.message ? err.message : String(err)}`
    };
  }

  const chromium = playwright.chromium || (playwright.default && playwright.default.chromium);
  if (!chromium || typeof chromium.launch !== 'function') {
    return { ok: false, skipped: true, reason: 'playwright.chromium not available' };
  }

  let browser = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPngPath, fullPage: true });
    await browser.close();
    browser = null;
    return {
      ok: true,
      skipped: false,
      path: outPngPath,
      log: [{ kind: FILE_WRITE, target: outPngPath, meta: { producer: 'visualization.screenshot' } }]
    };
  } catch (err) {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore close errors */
      }
    }
    return {
      ok: false,
      skipped: true,
      reason: `chromium launch/render failed: ${err && err.message ? err.message : String(err)}`
    };
  }
}

/* ------------------------------------------------------------------ */
/* SDB adapter (behind SDB_ROOT)                                       */
/* ------------------------------------------------------------------ */

/**
 * Optional adapter to an external "SDB" renderer located at $SDB_ROOT.
 *
 * When SDB_ROOT is unset, this is a no-op returning { skipped:true, reason }.
 * When set, attempts to require/import the SDB renderer from that root and
 * invoke a `render`/`renderUITree`/default function with (uiTree, outPath).
 * Any failure resolves to a skipped result and never throws.
 *
 * @param {import('../contracts/index.js').UITree} uiTree
 * @param {string} outPath
 * @returns {Promise<{ skipped:boolean, ok?:boolean, reason?:string, path?:string, log?:object[] }>}
 */
export async function sdbAdapter(uiTree, outPath) {
  const root = process.env.SDB_ROOT;
  if (!root) {
    return { skipped: true, reason: 'SDB_ROOT unset' };
  }

  let mod;
  try {
    mod = await loadSdbModule(root);
  } catch (err) {
    return {
      skipped: true,
      reason: `SDB renderer require failed: ${err && err.message ? err.message : String(err)}`
    };
  }

  const renderFn =
    (mod && (mod.renderUITree || mod.render || mod.default)) ||
    (mod && mod.default && (mod.default.renderUITree || mod.default.render));

  if (typeof renderFn !== 'function') {
    return { skipped: true, reason: 'SDB renderer exposes no render function' };
  }

  try {
    const result = await renderFn(uiTree, outPath);
    return {
      skipped: false,
      ok: true,
      path: typeof outPath === 'string' ? outPath : undefined,
      result,
      log: outPath
        ? [{ kind: FILE_WRITE, target: outPath, meta: { producer: 'visualization.sdbAdapter' } }]
        : []
    };
  } catch (err) {
    return {
      skipped: true,
      reason: `SDB render failed: ${err && err.message ? err.message : String(err)}`
    };
  }
}

/**
 * Resolve and load the SDB renderer module from an SDB_ROOT directory.
 * Tries a small set of conventional entry points, importing as ESM.
 * @param {string} root
 * @returns {Promise<object>}
 */
async function loadSdbModule(root) {
  const path = await import('node:path');
  const url = await import('node:url');
  const fs = await import('node:fs');

  const candidates = [
    root,
    path.join(root, 'index.js'),
    path.join(root, 'src', 'index.js'),
    path.join(root, 'renderer.js'),
    path.join(root, 'sdb.js')
  ];

  let lastErr = null;
  for (const candidate of candidates) {
    try {
      let exists = true;
      // For non-directory candidates, only attempt if the file exists.
      if (candidate !== root) {
        try {
          exists = fs.existsSync(candidate);
        } catch {
          exists = true;
        }
        if (!exists) continue;
      }
      const href = url.pathToFileURL(candidate).href;
      return await import(href);
    } catch (err) {
      lastErr = err;
    }
  }
  // Final attempt: bare specifier resolution from root.
  try {
    return await import(root);
  } catch (err) {
    throw lastErr || err;
  }
}
