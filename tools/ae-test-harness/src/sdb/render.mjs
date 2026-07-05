/**
 * SDB RENDER SERVICE
 * ==================
 * Generalized, parallel-safe renderer that turns a harness-captured UITree into
 * a pixel-perfect ScriptUI dialog PNG via the ScriptUI Dialog Builder (SDB).
 *
 * How it works (proven by sdb-render.mjs, verified pixel-perfect on Limb-a-tron):
 *   1. Convert UITree -> SDB localStorage "dialog" JSON ({ activeId, items, order, settings }).
 *   2. Serve SDB's static `build/` over an EPHEMERAL OS-assigned http port (per render
 *      call). A real http origin is REQUIRED: the file:// protocol has an opaque origin
 *      and localStorage throws there, so seeding the dialog would silently fail.
 *   3. Seed localStorage["dialog"] via an init script, load SDB, let SDB's own engine
 *      render the dialog, strip editor chrome, screenshot #dialog.
 *   4. Tear the server down. Each call gets its own server + browser context, so many
 *      renders can run concurrently without port collisions.
 *
 * Per-type style defaults below are lifted verbatim from SDB's own item.list.<type>
 * factory `defaultStyle` objects (build/assets/js/dialog.builder.js) so the seeded
 * dialog matches what SDB would create natively for every one of the 20 control types.
 *
 * API:  render(uiTree, outPngPath, opts) -> { ok, path, width, height, skipped?, reason? }
 *       Never throws.
 * CLI:  node src/sdb/render.mjs <uitree.json> <out.png>
 *
 * ESM only. Uses the harness's installed `playwright`.
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { readFile as readFileP } from 'node:fs/promises';
import { join, normalize, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);

/** SDB static build root. Overridable via env for non-default checkouts. */
export const SDB_BUILD_DIR =
  process.env.SDB_BUILD_DIR ||
  '/Users/ivg/github/ScriptUI-Dialog-Builder-Joonas/build';

/** Hard caps so a pathological dialog can't produce an 11k-px wall of pixels. */
const MAX_PREVIEW_HEIGHT = 1600; // px (CSS) — clamp #dialog height before screenshot
const MAX_PREVIEW_WIDTH = 1600; // px (CSS)
const MAX_LIST_ITEMS = 40; // clamp huge color-swatch / option lists
const MAX_ITEMS = 600; // refuse to seed absurd trees

/** The 20 SDB control types, keyed by lowercased UITree type. */
const TYPE = {
  // window-ish
  dialog: 'Dialog',
  palette: 'Dialog',
  window: 'Dialog',
  // containers
  panel: 'Panel',
  group: 'Group',
  tabbedpanel: 'TabbedPanel',
  tab: 'Tab',
  // simple controls
  button: 'Button',
  iconbutton: 'IconButton',
  image: 'Image',
  statictext: 'StaticText',
  edittext: 'EditText',
  checkbox: 'Checkbox',
  radiobutton: 'RadioButton',
  dropdownlist: 'DropDownList',
  listbox: 'ListBox',
  slider: 'Slider',
  progressbar: 'Progressbar',
  treeview: 'TreeView',
  treeitem: 'TreeItem',
  divider: 'Divider'
};

// ---------------------------------------------------------------------------
// Per-type style defaults (verbatim from SDB item.list.<type>().defaultStyle)
// ---------------------------------------------------------------------------
//
// Each factory returns a fresh object so callers can mutate freely. Only the
// `style` portion is reproduced (not addPanelIconClass / editInfo metadata).
// Image / IconButton carry SDB's own default base64 placeholder image so they
// render the same swatch SDB shows for a freshly-added item.

const DEFAULT_IMAGE_B64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQdJREFUeNrslv0NgyAQxcV0AEZwBEdoN3AEu0E7iSN0hW6gG9gRuoFuQB8NtGg9QSL4R33JixcUf3zcEZiAkg2UJhvpYMRX+BGYl8PVOxJfHV164rsc5j5UydCwdEGnAu4QtnCH+OY7AOcZ410moeJXVegZFzAn2jfJah4afF/Yvg6YMfbE4wz3RnOjSjBcchnfcpUgWbRyUjPv4UatgDmYWtZ3tORSdVzDcrUWwVPLjyu4tEBzI8Pd4dQeq5NJq5zY61ZMq6Pg5h5PgkfQAdwCnYXPggmo1sUBSsJJsAXqowGcArcijD5wE8wiXX3kiXfSmR/z6jMuvYT93WVvB+/gHbyaXgIMAHWCmD3KjfSwAAAAAElFTkSuQmCC';

function defaultStyleFor(type) {
  switch (type) {
    case 'Dialog':
      return {
        enabled: true,
        varName: null,
        windowType: 'Dialog',
        creationProps: {
          su1PanelCoordinates: false,
          maximizeButton: false,
          minimizeButton: false,
          independent: false,
          closeButton: true,
          borderless: false,
          resizeable: false
        },
        text: 'Dialog',
        preferredSize: [0, 0],
        margins: 16,
        orientation: 'column',
        spacing: 10,
        alignChildren: ['center', 'top']
      };
    case 'Group':
      return {
        enabled: true,
        varName: null,
        preferredSize: [0, 0],
        margins: 0,
        orientation: 'row',
        spacing: 10,
        alignChildren: ['left', 'center'],
        alignment: null
      };
    case 'Panel':
      return {
        enabled: true,
        varName: null,
        creationProps: { borderStyle: 'etched', su1PanelCoordinates: false },
        text: 'Panel',
        preferredSize: [0, 0],
        margins: 10,
        orientation: 'column',
        spacing: 10,
        alignChildren: ['left', 'top'],
        alignment: null
      };
    case 'StaticText':
      return {
        enabled: true,
        varName: null,
        creationProps: { truncate: 'none', multiline: false, scrolling: false },
        softWrap: false,
        text: 'StaticText',
        justify: 'left',
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'EditText':
      return {
        enabled: true,
        varName: null,
        creationProps: {
          noecho: false,
          readonly: false,
          multiline: false,
          scrollable: false,
          borderless: false,
          enterKeySignalsOnChange: false
        },
        softWrap: false,
        text: 'EditText',
        justify: 'left',
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'Button':
      return {
        enabled: true,
        varName: null,
        text: 'Button',
        justify: 'center',
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'IconButton':
      return {
        enabled: true,
        varName: null,
        text: 'IconButton',
        preferredSize: [0, 0],
        creationProps: { style: 'toolbutton', toggle: false },
        iconButtonStroke: false,
        image: [DEFAULT_IMAGE_B64],
        alignment: null,
        helpTip: null
      };
    case 'Image':
      return {
        enabled: true,
        varName: null,
        image: [DEFAULT_IMAGE_B64],
        alignment: null,
        helpTip: null
      };
    case 'Checkbox':
      return {
        enabled: true,
        varName: null,
        text: 'Checkbox',
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'RadioButton':
      return {
        enabled: true,
        varName: null,
        text: 'RadioButton',
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'DropDownList':
      return {
        enabled: true,
        varName: null,
        text: 'DropDownList',
        listItems: 'Item 1, -, Item 2',
        preferredSize: [0, 0],
        alignment: null,
        selection: 0,
        helpTip: null
      };
    case 'ListBox':
      return {
        enabled: true,
        varName: null,
        creationProps: {
          multiselect: false,
          numberOfColumns: 1,
          columnWidths: '[]',
          columnTitles: '[]',
          showHeaders: false
        },
        listItems: 'Item 1, Item 2',
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'Slider':
      return {
        enabled: true,
        varName: null,
        preferredSize: [0, 0],
        alignment: null,
        helpTip: null
      };
    case 'Progressbar':
      return {
        enabled: true,
        varName: null,
        preferredSize: [50, 4],
        alignment: null,
        helpTip: null
      };
    case 'TabbedPanel':
      return {
        enabled: true,
        varName: null,
        preferredSize: [0, 0],
        margins: 10,
        alignment: null
      };
    case 'Tab':
      return {
        enabled: true,
        varName: null,
        text: 'Tab',
        orientation: 'column',
        spacing: 10,
        alignChildren: ['left', 'top']
      };
    case 'TreeView':
      return {
        enabled: true,
        varName: null,
        preferredSize: [0, 0],
        alignment: null
      };
    case 'TreeItem':
      return { enabled: true, varName: null, text: 'TreeItem' };
    case 'Divider':
      return { enabled: true, varName: null };
    default:
      return { enabled: true, varName: null };
  }
}

// ---------------------------------------------------------------------------
// UITree -> SDB dialog JSON conversion
// ---------------------------------------------------------------------------

/** Coerce a value to a clean display string (SDB stores text as strings). */
function asText(v) {
  if (v == null) return '';
  return String(v);
}

/** Clamp a list of option strings into SDB's comma-joined `listItems`. */
function toListItems(items) {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  let arr = items.map(asText);
  if (arr.length > MAX_LIST_ITEMS) {
    arr = arr.slice(0, MAX_LIST_ITEMS);
    arr.push('…(+more)');
  }
  // SDB splits on commas; commas inside labels would corrupt the list, so
  // replace them with a unicode comma to preserve the visual.
  return arr.map((s) => s.replace(/,/g, '，')).join(', ');
}

/**
 * Build the SDB `style` object for one UITree node, starting from the type's
 * native defaultStyle and overlaying the captured text / layout / values.
 */
function styleFor(sdbType, node) {
  const style = defaultStyleFor(sdbType);
  const props = (node && node.properties) || {};

  // --- text / title --------------------------------------------------------
  const rawText =
    node.text != null ? node.text : node.title != null ? node.title : undefined;
  if (rawText != null && 'text' in style) {
    style.text = asText(rawText);
  } else if (rawText != null && sdbType === 'TreeItem') {
    style.text = asText(rawText);
  }

  // --- enabled / visibility ------------------------------------------------
  if (props.enabled === false) style.enabled = false;

  // --- layout passthrough (only where the type supports it) ----------------
  if ('orientation' in style && props.orientation) {
    style.orientation = props.orientation;
  }
  if ('alignChildren' in style && Array.isArray(props.alignChildren)) {
    style.alignChildren = props.alignChildren;
  }
  if ('margins' in style && typeof props.margins === 'number') {
    style.margins = props.margins;
  }
  if ('spacing' in style && typeof props.spacing === 'number') {
    style.spacing = props.spacing;
  }
  if ('alignment' in style && props.alignment != null) {
    style.alignment = props.alignment;
  }

  // --- preferredSize -------------------------------------------------------
  if ('preferredSize' in style) {
    let w = 0;
    let h = 0;
    if (Array.isArray(props.preferredSize)) {
      w = num(props.preferredSize[0]);
      h = num(props.preferredSize[1]);
    } else if (Array.isArray(props.size)) {
      w = num(props.size[0]);
      h = num(props.size[1]);
    }
    if (w > 0 || h > 0) style.preferredSize = [clampDim(w), clampDim(h)];
  }

  // --- per-type value handling --------------------------------------------
  switch (sdbType) {
    case 'Checkbox':
    case 'RadioButton':
      if (node.value === true || props.value === true) style.checked = true;
      break;

    case 'EditText': {
      // EditText shows its `text`; multiline if captured says so.
      if (props.multiline || (props.creationProps && props.creationProps.multiline)) {
        style.creationProps.multiline = true;
      }
      // Give bare edit fields a sane width if none captured.
      if (style.preferredSize[0] === 0 && style.preferredSize[1] === 0) {
        style.preferredSize = [120, 0];
      }
      break;
    }

    case 'DropDownList':
    case 'ListBox': {
      const li = toListItems(props.items);
      if (li !== undefined) style.listItems = li;
      // selection: prefer captured numeric value (selectionIndex), else 0.
      if (sdbType === 'DropDownList') {
        const sel = num(node.value);
        style.selection = Number.isFinite(sel) && sel >= 0 ? sel : 0;
      }
      if (style.preferredSize[0] === 0 && style.preferredSize[1] === 0) {
        style.preferredSize = [140, 0];
      }
      break;
    }

    case 'Slider': {
      // SDB slider uses minvalue/maxvalue/value attributes; default 0/100/50.
      const mn = num(props.minvalue, 0);
      const mx = num(props.maxvalue, 100);
      const val = Number.isFinite(num(node.value)) ? num(node.value) : (mn + mx) / 2;
      style.minvalue = mn;
      style.maxvalue = mx;
      style.value = clampNum(val, mn, mx);
      if (style.preferredSize[0] === 0 && style.preferredSize[1] === 0) {
        style.preferredSize = [160, 0];
      }
      break;
    }

    case 'Progressbar': {
      const mn = num(props.minvalue, 0);
      const mx = num(props.maxvalue, 100);
      const val = Number.isFinite(num(node.value)) ? num(node.value) : mx * 0.4;
      style.minvalue = mn;
      style.maxvalue = mx;
      style.value = clampNum(val, mn, mx);
      if (style.preferredSize[0] <= 50 && style.preferredSize[1] <= 4) {
        style.preferredSize = [160, 8];
      }
      break;
    }

    default:
      break;
  }

  return style;
}

function num(v, fallback = NaN) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
function clampNum(v, lo, hi) {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}
function clampDim(v) {
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(v, MAX_PREVIEW_WIDTH);
}

/**
 * Convert a captured UITree into the SDB localStorage "dialog" object.
 * @param {object} uiTree  Harness UITree (top node usually `Window`/`dialog`).
 * @returns {{ ok: boolean, dialog?: object, reason?: string }}
 */
export function uiTreeToDialog(uiTree) {
  if (!uiTree || typeof uiTree !== 'object') {
    return { ok: false, reason: 'uiTree is not an object' };
  }

  const items = {};
  const order = [];
  let nextId = 0;
  let activeId = 0;

  /**
   * @param {object} node
   * @param {number|false} parentId
   */
  function walk(node, parentId) {
    if (!node || typeof node !== 'object') return;
    if (nextId >= MAX_ITEMS) return; // hard cap on tree size
    const rawType = String(node.type || '').toLowerCase();
    const sdbType = TYPE[rawType] || (parentId === false ? 'Dialog' : 'Group');
    const id = nextId++;
    if (id === 0) activeId = 0;

    items['item-' + id] = {
      id,
      type: sdbType,
      parentId: parentId === false ? false : parentId,
      style: styleFor(sdbType, node)
    };
    order.push(id);

    const children = Array.isArray(node.children) ? node.children : [];
    for (const child of children) walk(child, id);
    return id;
  }

  walk(uiTree, false);

  if (order.length === 0) {
    return { ok: false, reason: 'empty UITree (no renderable nodes)' };
  }

  const dialog = {
    activeId,
    items,
    order,
    settings: {
      importJSON: true,
      indentSize: false,
      cepExport: false,
      includeCSSJS: true,
      functionWrapper: false,
      compactCode: false,
      showDialog: true
    }
  };
  return { ok: true, dialog, count: order.length };
}

// ---------------------------------------------------------------------------
// Ephemeral static file server (per render call; OS-assigned free port)
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

/**
 * Start a tiny static server rooted at `rootDir` on an OS-assigned free port.
 * @param {string} rootDir
 * @returns {Promise<{ origin: string, close: () => Promise<void> }>}
 */
function startStaticServer(rootDir) {
  const root = normalize(rootDir);
  const server = createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
      // Resolve + prevent path traversal outside root.
      const filePath = normalize(join(root, urlPath));
      if (!filePath.startsWith(root)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      readFile(filePath, (err, data) => {
        if (err) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
        res.setHeader('Content-Type', type);
        res.end(data);
      });
    } catch {
      res.statusCode = 500;
      res.end('Error');
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    // host 127.0.0.1, port 0 => OS assigns a free ephemeral port.
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise((res) => {
            server.close(() => res());
          })
      });
    });
  });
}

// ---------------------------------------------------------------------------
// render()
// ---------------------------------------------------------------------------

/**
 * Render a UITree to a ScriptUI dialog PNG via SDB. Never throws.
 *
 * @param {object} uiTree         Harness-captured UITree.
 * @param {string} outPngPath     Absolute (or cwd-relative) output PNG path.
 * @param {object} [opts]
 * @param {string} [opts.buildDir]        SDB build dir (default SDB_BUILD_DIR).
 * @param {number} [opts.deviceScaleFactor]  Default 2 (retina-crisp).
 * @param {number} [opts.timeoutMs]       Per-step timeout (default 12000).
 * @param {number} [opts.maxHeight]       Max preview height px (default 1600).
 * @returns {Promise<{ ok: boolean, path: string, width: number, height: number, skipped?: boolean, reason?: string }>}
 */
export async function render(uiTree, outPngPath, opts = {}) {
  const result = {
    ok: false,
    path: outPngPath,
    width: 0,
    height: 0
  };

  // 1. Convert -------------------------------------------------------------
  let conv;
  try {
    conv = uiTreeToDialog(uiTree);
  } catch (e) {
    result.skipped = true;
    result.reason = 'conversion error: ' + (e && e.message ? e.message : String(e));
    return result;
  }
  if (!conv.ok) {
    result.skipped = true;
    result.reason = conv.reason || 'conversion produced no dialog';
    return result;
  }

  const buildDir = opts.buildDir || SDB_BUILD_DIR;
  const dsf = Number.isFinite(opts.deviceScaleFactor) ? opts.deviceScaleFactor : 2;
  const timeoutMs = Number.isFinite(opts.timeoutMs) ? opts.timeoutMs : 12000;
  const maxH = Number.isFinite(opts.maxHeight) ? opts.maxHeight : MAX_PREVIEW_HEIGHT;

  // Make sure SDB build exists (index.html present).
  try {
    readFileSync(join(buildDir, 'index.html'));
  } catch {
    result.skipped = true;
    result.reason = `SDB build not found at ${buildDir} (set SDB_BUILD_DIR)`;
    return result;
  }

  let server;
  let browser;
  try {
    // 2. Serve SDB over an ephemeral http origin --------------------------
    server = await startStaticServer(buildDir);

    // 3. Headless Chromium, seed localStorage, render ----------------------
    browser = await chromium.launch();
    const ctx = await browser.newContext({ deviceScaleFactor: dsf });
    // Seed before any document loads. local_storage.get() does JSON.parse on
    // the raw string, so we must store JSON.stringify(dialog) under "dialog".
    await ctx.addInitScript((d) => {
      try {
        localStorage.setItem('dialog', JSON.stringify(d));
      } catch {
        /* opaque origin would land here; http origin keeps us safe */
      }
    }, conv.dialog);

    const page = await ctx.newPage();
    await page.goto(server.origin + '/index.html', { waitUntil: 'networkidle' }).catch(() => {});

    // Wait for SDB to render at least one item into #dialog.
    await page.waitForSelector('#dialog [data-item-type]', { timeout: timeoutMs });

    // Strip editor chrome so the capture reads like a clean ScriptUI window,
    // and clamp pathological sizes so output isn't an enormous wall.
    await page.evaluate((cap) => {
      const tb = document.querySelector('#dialog-title-bar');
      if (tb) tb.remove();
      document.querySelectorAll('.active').forEach((e) => e.classList.remove('active'));
      document
        .querySelectorAll('[contenteditable]')
        .forEach((e) => e.setAttribute('contenteditable', 'false'));
      // Remove the editor's selection/hover highlight class if present.
      document.querySelectorAll('.hide-active').forEach((e) => e.classList.remove('hide-active'));

      const dialog = document.querySelector('#dialog');
      if (dialog) {
        dialog.style.maxHeight = cap.maxH + 'px';
        dialog.style.maxWidth = cap.maxW + 'px';
        dialog.style.overflow = 'hidden';
      }
    }, { maxH, maxW: MAX_PREVIEW_WIDTH });

    await page.waitForTimeout(250);

    const dialogEl = page.locator('#dialog');
    const box = await dialogEl.boundingBox().catch(() => null);

    await dialogEl.screenshot({ path: outPngPath });

    result.ok = true;
    result.path = outPngPath;
    result.width = box ? Math.round(box.width) : 0;
    result.height = box ? Math.round(box.height) : 0;
    result.items = conv.count;
    return result;
  } catch (e) {
    result.ok = false;
    result.skipped = true;
    result.reason = 'render error: ' + (e && e.message ? e.message : String(e));
    return result;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (server) {
      await server.close().catch(() => {});
    }
  }
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const treePath = process.argv[2];
  const outPath = process.argv[3] || 'sdb-out.png';
  if (!treePath) {
    console.error('usage: node src/sdb/render.mjs <uitree.json> <out.png>');
    process.exit(2);
    return;
  }
  let tree;
  try {
    const abs = isAbsolute(treePath) ? treePath : join(process.cwd(), treePath);
    tree = JSON.parse(await readFileP(abs, 'utf8'));
  } catch (e) {
    console.error('failed to read UITree:', e && e.message ? e.message : String(e));
    process.exit(1);
    return;
  }
  const out = isAbsolute(outPath) ? outPath : join(process.cwd(), outPath);
  const res = await render(tree, out);
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.ok ? 0 : 1);
}

// Run as CLI only when invoked directly.
if (process.argv[1] && normalize(process.argv[1]) === normalize(__filename)) {
  main();
}
