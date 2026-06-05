/**
 * src/fixtures/loader.js — functional fixture loader (Integrate-owned glue).
 *
 * loadFixtures() imports every `*.fixture.js` under the harness `fixtures/`
 * directory, validates each default export against the frozen contracts
 * validateFixture(), and returns the valid fixtures keyed by their script name.
 *
 * Invalid or unloadable fixtures are NOT thrown — they are collected into the
 * returned result's `invalid[]` so callers can report them, and the loader keeps
 * going. The default export of this module returns the keyed map directly; the
 * named `loadFixtures` returns the richer `{ byName, list, invalid }` envelope.
 *
 * ESM only. Importable in isolation.
 */

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validateFixture } from '../contracts/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Harness root = two levels up from src/fixtures/. */
export const HARNESS_ROOT = path.resolve(__dirname, '..', '..');

/** Default fixtures root: <harness>/fixtures. */
export const DEFAULT_FIXTURES_ROOT = path.join(HARNESS_ROOT, 'fixtures');

/**
 * @typedef {import('../contracts/index.js').Fixture} Fixture
 */

/**
 * @typedef {Object} InvalidFixture
 * @property {string} file      Absolute path to the fixture module.
 * @property {string[]} errors  Validation / load error messages.
 */

/**
 * @typedef {Object} LoadFixturesResult
 * @property {Record<string, Fixture>} byName  Valid fixtures keyed by script.name.
 * @property {Fixture[]} list                  Valid fixtures, in load order.
 * @property {InvalidFixture[]} invalid        Fixtures that failed to load/validate.
 */

/**
 * Recursively collect all `*.fixture.js` file paths under a root directory.
 * @param {string} root
 * @returns {Promise<string[]>}
 */
async function collectFixtureFiles(root) {
  /** @type {string[]} */
  const files = [];

  /** @param {string} dir */
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    // Deterministic ordering within a directory.
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile() && entry.name.endsWith('.fixture.js')) {
        files.push(abs);
      }
    }
  }

  await walk(root);
  return files;
}

/**
 * Resolve the default-exported fixture object from an imported module.
 * Tolerates both `export default fixture` and a named `fixture` export.
 * @param {object} mod
 * @returns {*}
 */
function pickFixture(mod) {
  if (!mod || typeof mod !== 'object') return undefined;
  if (mod.default !== undefined) return mod.default;
  if (mod.fixture !== undefined) return mod.fixture;
  return undefined;
}

/**
 * Derive a stable key for a fixture. Prefers `script.name`; falls back to the
 * file basename without the `.fixture.js` suffix.
 * @param {*} fixture
 * @param {string} file
 * @returns {string}
 */
function fixtureKey(fixture, file) {
  if (
    fixture &&
    typeof fixture === 'object' &&
    fixture.script &&
    typeof fixture.script.name === 'string' &&
    fixture.script.name
  ) {
    return fixture.script.name;
  }
  return path.basename(file).replace(/\.fixture\.js$/i, '');
}

/**
 * Import, validate, and key every fixture under the fixtures root.
 *
 * Never throws on a bad fixture — invalid ones are reported via `invalid[]`.
 *
 * @param {{ fixturesRoot?: string }} [config]
 * @returns {Promise<LoadFixturesResult>}
 */
export async function loadFixtures(config = {}) {
  const fixturesRoot =
    config && typeof config.fixturesRoot === 'string'
      ? config.fixturesRoot
      : DEFAULT_FIXTURES_ROOT;

  const files = await collectFixtureFiles(fixturesRoot);

  /** @type {Record<string, Fixture>} */
  const byName = {};
  /** @type {Fixture[]} */
  const list = [];
  /** @type {InvalidFixture[]} */
  const invalid = [];

  for (const file of files) {
    let mod;
    try {
      mod = await import(pathToFileURL(file).href);
    } catch (err) {
      invalid.push({
        file,
        errors: [`import failed: ${err && err.message ? err.message : String(err)}`]
      });
      continue;
    }

    const fixture = pickFixture(mod);
    const { ok, errors } = validateFixture(fixture);
    if (!ok) {
      invalid.push({ file, errors });
      continue;
    }

    const key = fixtureKey(fixture, file);
    if (Object.prototype.hasOwnProperty.call(byName, key)) {
      invalid.push({
        file,
        errors: [`duplicate fixture key "${key}" (already loaded from another file)`]
      });
      continue;
    }

    byName[key] = fixture;
    list.push(fixture);
  }

  return { byName, list, invalid };
}

export default loadFixtures;
