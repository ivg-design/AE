import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  COMMANDS,
  DISPATCH,
  OUT_ROOT,
  runCommand,
  resolveConfig,
  stableStringify,
  stableSort,
  sanitizeLog,
  main
} from '../src/cli/index.js';
import { parseArgs } from '../src/cli/args.js';
import { OPERATION_KINDS } from '../src/contracts/index.js';

const EXPECTED = ['static', 'expressions', 'functional', 'ui', 'report', 'ae-smoke'];

describe('cli dispatch table', () => {
  it('exposes exactly the contract commands', () => {
    expect([...COMMANDS].sort()).toEqual([...EXPECTED].sort());
  });

  it('maps every command to an async runner function', () => {
    for (const cmd of EXPECTED) {
      expect(typeof DISPATCH[cmd]).toBe('function');
    }
    expect(Object.keys(DISPATCH).sort()).toEqual([...EXPECTED].sort());
  });

  it('rejects unknown commands', async () => {
    await expect(runCommand('nope', {})).rejects.toThrow(/Unknown command/);
  });
});

describe('args parser', () => {
  it('parses command + flags + positionals', () => {
    // `extra` precedes flags so it is unambiguously a positional;
    // `--verbose` is a trailing boolean flag (no value follows).
    const p = parseArgs(['static', 'extra', '--category', 'animation', '--verbose']);
    expect(p.command).toBe('static');
    expect(p.options.category).toBe('animation');
    expect(p.options.verbose).toBe(true);
    expect(p.positionals).toEqual(['extra']);
  });

  it('parses --key=value form', () => {
    const p = parseArgs(['report', '--scriptsRoot=/tmp/x']);
    expect(p.command).toBe('report');
    expect(p.options.scriptsRoot).toBe('/tmp/x');
  });

  it('tolerates empty argv', () => {
    const p = parseArgs([]);
    expect(p.command).toBeNull();
    expect(p.positionals).toEqual([]);
  });
});

describe('deterministic serialization', () => {
  it('sorts object keys recursively and is order-independent', () => {
    const a = stableStringify({ b: 1, a: { d: 2, c: 3 } });
    const b = stableStringify({ a: { c: 3, d: 2 }, b: 1 });
    expect(a).toBe(b);
    expect(a.endsWith('\n')).toBe(true);
  });

  it('preserves array order', () => {
    expect(stableSort([3, 1, 2])).toEqual([3, 1, 2]);
  });

  it('contains no timestamp-like keys in output', () => {
    const s = stableStringify({ command: 'static', results: [] });
    expect(s).not.toMatch(/timestamp|generatedAt|"date"/i);
  });
});

describe('sanitizeLog', () => {
  it('keeps only contract-valid operation kinds', () => {
    const log = [
      { kind: 'setValue', target: 'x' },
      { kind: 'not-a-kind' },
      null,
      { kind: OPERATION_KINDS[0] }
    ];
    const out = sanitizeLog(log);
    expect(out.every((o) => OPERATION_KINDS.includes(o.kind))).toBe(true);
    expect(out).toHaveLength(2);
  });

  it('returns [] for non-array input', () => {
    expect(sanitizeLog(undefined)).toEqual([]);
  });
});

describe('each command writes to its .out folder', () => {
  const config = resolveConfig(parseArgs(['static']));

  for (const cmd of EXPECTED) {
    it(`${cmd} produces an artifact under .out/${cmd}/`, async () => {
      const summary = await runCommand(cmd, config);
      expect(summary.command).toBe(cmd);
      expect(Array.isArray(summary.artifacts)).toBe(true);
      expect(summary.artifacts.length).toBeGreaterThan(0);

      const outDir = path.join(OUT_ROOT, cmd);
      expect(fs.existsSync(outDir)).toBe(true);

      for (const artifact of summary.artifacts) {
        expect(path.isAbsolute(artifact)).toBe(true);
        expect(fs.existsSync(artifact)).toBe(true);
        expect(artifact.startsWith(outDir)).toBe(true);
      }
    });
  }
});

describe('main entry point', () => {
  it('returns usage for no command', async () => {
    const res = await main([]);
    expect(res.ok).toBe(true);
    expect(res.summary.commands).toEqual(expect.arrayContaining(EXPECTED));
  });

  it('flags unknown commands without throwing', async () => {
    const res = await main(['frobnicate']);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/Unknown command/);
  });

  it('runs a real command end-to-end', async () => {
    const res = await main(['ae-smoke']);
    expect(res.ok).toBe(true);
    expect(res.summary.command).toBe('ae-smoke');
  });
});
