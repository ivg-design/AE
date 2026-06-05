/**
 * Tiny, dependency-free argument parser for the harness CLI.
 *
 * Grammar (positional command first, then flags):
 *   node src/cli/index.js <command> [--key value] [--key=value] [--flag] [positional...]
 *
 * Rules:
 *   - The first non-flag token is the command.
 *   - `--key value`  -> options.key = value          (value is the next token if it is not a flag)
 *   - `--key=value`  -> options.key = value
 *   - `--flag`       -> options.flag = true          (when no value follows / next token is a flag)
 *   - `-k`           -> options.k = true             (short boolean flag)
 *   - remaining bare tokens accumulate in `positionals`
 *
 * Never throws; unknown/extra input is preserved verbatim so callers can decide.
 */

/**
 * @typedef {Object} ParsedArgs
 * @property {string|null} command           The dispatched command (or null when absent).
 * @property {Record<string, string|boolean>} options
 * @property {string[]} positionals
 * @property {string[]} raw                   The original argv slice.
 */

function isFlag(token) {
  return typeof token === 'string' && token.startsWith('-');
}

/**
 * Parse a raw argv array (already sliced of node + script path).
 * @param {string[]} [argv]
 * @returns {ParsedArgs}
 */
export function parseArgs(argv = []) {
  const raw = Array.isArray(argv) ? argv.slice() : [];
  /** @type {Record<string, string|boolean>} */
  const options = {};
  /** @type {string[]} */
  const positionals = [];
  let command = null;

  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (typeof token !== 'string') continue;

    if (token.startsWith('--')) {
      const body = token.slice(2);
      const eq = body.indexOf('=');
      if (eq !== -1) {
        const key = body.slice(0, eq);
        const value = body.slice(eq + 1);
        if (key) options[key] = value;
        continue;
      }
      const next = raw[i + 1];
      if (next !== undefined && !isFlag(next)) {
        if (body) options[body] = next;
        i += 1;
      } else if (body) {
        options[body] = true;
      }
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      // Short boolean flag(s): -k or -abc
      const letters = token.slice(1);
      for (const ch of letters) options[ch] = true;
      continue;
    }

    // Bare token: first one is the command, the rest are positionals.
    if (command === null) {
      command = token;
    } else {
      positionals.push(token);
    }
  }

  return { command, options, positionals, raw };
}

export default parseArgs;
