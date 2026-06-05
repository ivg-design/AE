import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  runAeSmoke,
  importJsonLog,
  entryToOperation,
  mapAeEventToKind
} from '../src/ae-smoke/index.js';
import { OPERATION_KINDS, validateOperation } from '../src/contracts/index.js';

describe('runAeSmoke', () => {
  it('skips cleanly when AE_SMOKE_CONFIG is unset', () => {
    const res = runAeSmoke({ env: {} });
    expect(res.skipped).toBe(true);
    expect(typeof res.reason).toBe('string');
    expect(res.reason.length).toBeGreaterThan(0);
  });

  it('skips cleanly when AE_SMOKE_CONFIG points at an unreadable path', () => {
    const res = runAeSmoke({
      env: { AE_SMOKE_CONFIG: join(tmpdir(), 'does-not-exist-xyz.json') }
    });
    expect(res.skipped).toBe(true);
    expect(res.reason).toMatch(/not a readable JSON config/);
  });

  it('never requires a real AE — uses process.env by default and skips', () => {
    const saved = process.env.AE_SMOKE_CONFIG;
    delete process.env.AE_SMOKE_CONFIG;
    try {
      const res = runAeSmoke();
      expect(res.skipped).toBe(true);
    } finally {
      if (saved !== undefined) process.env.AE_SMOKE_CONFIG = saved;
    }
  });
});

describe('importJsonLog', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ae-smoke-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const sampleLog = [
    { event: 'beginUndoGroup', target: 'My Operation' },
    { event: 'newLayer', target: 'Comp 1/Shape Layer 1', value: { type: 'Shape' } },
    { event: 'SetValue', path: 'Comp 1/Shape Layer 1/Transform/Opacity', value: 50 },
    { event: 'expressionSet', path: 'Comp 1/Layer 1/Transform/Rotation', value: 'time*30' },
    { event: 'keyframeAdded', path: 'Comp 1/Layer 1/Transform/Position', meta: { time: 1 } },
    { event: 'doCommand', target: '2004', meta: { menu: 'Center Anchor Point' } },
    { event: 'parented', target: 'Comp 1/Layer 2', value: 'Comp 1/Null 1' },
    { event: 'endUndoGroup' },
    { event: 'someUnknownAeEvent', target: 'ignored' }
  ];

  it('maps a sample AE log into Operation[] using OPERATION_KINDS', () => {
    const file = join(dir, 'log.json');
    writeFileSync(file, JSON.stringify(sampleLog), 'utf8');

    const ops = importJsonLog(file);

    // Unknown event dropped -> 8 mapped operations.
    expect(ops).toHaveLength(8);

    // Every op is a valid Operation with a frozen kind.
    for (const op of ops) {
      expect(OPERATION_KINDS).toContain(op.kind);
      expect(validateOperation(op).ok).toBe(true);
    }

    const kinds = ops.map((o) => o.kind);
    expect(kinds).toEqual([
      'beginUndoGroup',
      'createLayer',
      'setValue',
      'setExpression',
      'addKeyframe',
      'executeCommand',
      'setParent',
      'endUndoGroup'
    ]);

    // Field mapping checks.
    expect(ops[2]).toMatchObject({
      kind: 'setValue',
      target: 'Comp 1/Shape Layer 1/Transform/Opacity',
      value: 50
    });
    expect(ops[4].meta).toEqual({ time: 1 });
  });

  it('accepts an object wrapper with an operations array', () => {
    const file = join(dir, 'wrapped.json');
    writeFileSync(
      file,
      JSON.stringify({ operations: [{ event: 'alert', value: 'hi' }] }),
      'utf8'
    );
    const ops = importJsonLog(file);
    expect(ops).toEqual([{ kind: 'alert', value: 'hi' }]);
  });

  it('drops invalid/unmappable entries without throwing', () => {
    const file = join(dir, 'mixed.json');
    writeFileSync(
      file,
      JSON.stringify([null, 42, { event: 'nope' }, { event: 'alert' }]),
      'utf8'
    );
    const ops = importJsonLog(file);
    expect(ops).toEqual([{ kind: 'alert' }]);
  });

  it('throws a SyntaxError on malformed JSON', () => {
    const file = join(dir, 'bad.json');
    writeFileSync(file, '{ not json', 'utf8');
    expect(() => importJsonLog(file)).toThrow(SyntaxError);
  });
});

describe('runAeSmoke with a real config + log (no AE required)', () => {
  let dir;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ae-smoke-cfg-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('imports the referenced log when config is readable', () => {
    const logFile = join(dir, 'ae-log.json');
    writeFileSync(
      logFile,
      JSON.stringify([{ event: 'setValue', path: 'a/b', value: 1 }]),
      'utf8'
    );
    const cfgFile = join(dir, 'config.json');
    writeFileSync(cfgFile, JSON.stringify({ logPath: 'ae-log.json' }), 'utf8');

    const res = runAeSmoke({ env: { AE_SMOKE_CONFIG: cfgFile } });
    expect(res.skipped).toBe(false);
    expect(res.operationCount).toBe(1);
    expect(res.operations[0]).toMatchObject({ kind: 'setValue', target: 'a/b' });
  });

  it('skips cleanly when config has no logPath', () => {
    const cfgFile = join(dir, 'config.json');
    writeFileSync(cfgFile, JSON.stringify({ note: 'no log here' }), 'utf8');
    const res = runAeSmoke({ env: { AE_SMOKE_CONFIG: cfgFile } });
    expect(res.skipped).toBe(true);
    expect(res.reason).toMatch(/no logPath/);
  });
});

describe('mapAeEventToKind / entryToOperation', () => {
  it('maps known aliases and passes through canonical kinds', () => {
    expect(mapAeEventToKind('newLayer')).toBe('createLayer');
    expect(mapAeEventToKind('SETVALUEATTIME')).toBe('setValueAtTime');
    expect(mapAeEventToKind('setExpression')).toBe('setExpression');
    expect(mapAeEventToKind('unknown')).toBeNull();
    expect(mapAeEventToKind(123)).toBeNull();
  });

  it('entryToOperation returns null for non-mappable entries', () => {
    expect(entryToOperation(null)).toBeNull();
    expect(entryToOperation([])).toBeNull();
    expect(entryToOperation({ event: 'nope' })).toBeNull();
  });
});
