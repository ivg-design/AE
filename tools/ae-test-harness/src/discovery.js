/**
 * src/discovery.js — script discovery (Integrate-owned glue).
 *
 * discoverScripts() scans the seven AE-script category directories under the
 * ae-scripts package for `*.jsx` files, reads each file's leading frontmatter
 * via the static subsystem's validateFrontmatter(), and returns a stable,
 * sorted descriptor array:
 *
 *   [{ name, category, relPath, absPath, ui }]
 *
 * - `name`     basename without the .jsx extension
 * - `category` one of animation|composition|effects|keyframes|layers|paths|utilities
 * - `relPath`  '<category>/<file>.jsx' (forward slashes)
 * - `absPath`  absolute path on disk
 * - `ui`       the resolved @ui frontmatter token (string, e.g. 'DIALOG' / 'HEADLESS'),
 *              or null when no frontmatter @ui is present.
 *
 * The discovery never throws on an individual file: unreadable files are skipped
 * and surfaced as a descriptor with `ui:null` only if their source can still be
 * read; otherwise they are omitted. With the catalog intact this finds all 31.
 *
 * ESM only. Importable in isolation.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateFrontmatter } from './static/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Harness root = parent of this file's directory (src/). */
export const HARNESS_ROOT = path.resolve(__dirname, '..');

/** Default scripts root: ae/packages/ae-scripts/src (two up from tools/ae-test-harness). */
export const DEFAULT_SCRIPTS_ROOT = path.resolve(
  HARNESS_ROOT,
  '..',
  '..',
  'packages',
  'ae-scripts',
  'src'
);

/** The frozen set of category directories scanned, in stable order. */
export const CATEGORIES = Object.freeze([
  'animation',
  'composition',
  'effects',
  'keyframes',
  'layers',
  'paths',
  'utilities'
]);

/**
 * @typedef {Object} ScriptDescriptor
 * @property {string} name      Basename without `.jsx`.
 * @property {string} category  Category directory name.
 * @property {string} relPath   `<category>/<file>.jsx`.
 * @property {string} absPath   Absolute path on disk.
 * @property {string|null} ui   Resolved @ui frontmatter token, or null.
 */

/**
 * Resolve the @ui token for a script's source via the static subsystem.
 * Returns the frontmatter `fields.ui` string (trimmed) or null when absent.
 * Never throws.
 * @param {string} code
 * @returns {string|null}
 */
function resolveUi(code) {
  try {
    const { fields } = validateFrontmatter(code);
    if (fields && typeof fields.ui === 'string' && fields.ui.trim().length > 0) {
      return fields.ui.trim();
    }
  } catch {
    /* tolerant: treat as no UI metadata */
  }
  return null;
}

/**
 * Discover every catalog `*.jsx` script across the seven category directories.
 *
 * @param {{ scriptsRoot?: string, category?: string|null }} [config]
 * @returns {Promise<ScriptDescriptor[]>}
 */
export async function discoverScripts(config = {}) {
  const scriptsRoot =
    config && typeof config.scriptsRoot === 'string'
      ? config.scriptsRoot
      : DEFAULT_SCRIPTS_ROOT;

  const onlyCategory =
    config && typeof config.category === 'string' && config.category
      ? config.category
      : null;

  const categories = onlyCategory
    ? CATEGORIES.filter((c) => c === onlyCategory)
    : CATEGORIES;

  /** @type {ScriptDescriptor[]} */
  const out = [];

  for (const category of categories) {
    const dir = path.join(scriptsRoot, category);
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      // Category directory missing — skip rather than fail the whole scan.
      continue;
    }

    const jsxFiles = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.jsx'))
      .map((e) => e.name)
      .sort();

    for (const file of jsxFiles) {
      const absPath = path.join(dir, file);
      const name = file.replace(/\.jsx$/i, '');
      const relPath = `${category}/${file}`;

      let ui = null;
      try {
        const code = await readFile(absPath, 'utf8');
        ui = resolveUi(code);
      } catch {
        // Unreadable source — still record the descriptor; ui stays null.
        ui = null;
      }

      out.push({ name, category, relPath, absPath, ui });
    }
  }

  // Deterministic global ordering: by category (CATEGORIES order), then name.
  const categoryRank = new Map(CATEGORIES.map((c, i) => [c, i]));
  out.sort((a, b) => {
    const ra = categoryRank.has(a.category) ? categoryRank.get(a.category) : Number.MAX_SAFE_INTEGER;
    const rb = categoryRank.has(b.category) ? categoryRank.get(b.category) : Number.MAX_SAFE_INTEGER;
    return ra - rb || a.name.localeCompare(b.name);
  });

  return out;
}

export default discoverScripts;
