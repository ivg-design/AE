import { describe, it, expect } from 'vitest';
import { runScript, createLog } from '../src/host/sandbox/index.js';
import { OPERATION_KINDS, validateOperation } from '../src/contracts/index.js';

describe('host/sandbox createLog', () => {
  it('pushes a valid operation and exposes it via entries', () => {
    const log = createLog();
    const rec = log.push({ kind: 'alert', value: 'hi' });
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0]).toBe(rec);
    expect(validateOperation(rec).ok).toBe(true);
  });

  it('rejects operations with an unknown kind', () => {
    const log = createLog();
    expect(() => log.push({ kind: 'notAKind' })).toThrow(/Unknown operation kind/);
    expect(log.entries).toHaveLength(0);
  });

  it('only accepts kinds from the frozen OPERATION_KINDS list', () => {
    const log = createLog();
    for (const kind of OPERATION_KINDS) {
      expect(() => log.push({ kind })).not.toThrow();
    }
    expect(log.entries).toHaveLength(OPERATION_KINDS.length);
  });
});

describe('host/sandbox runScript', () => {
  it('runs a trivial script that calls alert() and captures it in the log', () => {
    const log = createLog();
    const alert = (msg) => log.push({ kind: 'alert', value: msg });

    const { error, log: returnedLog } = runScript(
      'alert("hello from script");',
      { alert, __log: log.entries }
    );

    expect(error).toBeNull();
    expect(returnedLog).toBe(log.entries);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0]).toMatchObject({ kind: 'alert', value: 'hello from script' });
  });

  it('returns the script return value', () => {
    const { error, returnValue } = runScript('1 + 2;');
    expect(error).toBeNull();
    expect(returnValue).toBe(3);
  });

  it('captures thrown errors without crashing', () => {
    const { error } = runScript('throw new Error("boom");');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('boom');
  });

  it('seeds JS intrinsics and provided globals into the context', () => {
    const { error, returnValue } = runScript(
      'parseFloat("3.5") + Math.floor(app.value);',
      { app: { value: 2.9 } }
    );
    expect(error).toBeNull();
    expect(returnValue).toBe(5.5);
  });

  it('enforces the execution timeout instead of hanging', () => {
    const { error } = runScript('while (true) {}', {}, { timeoutMs: 50 });
    expect(error).toBeInstanceOf(Error);
  });

  it('does not leak host-only globals like process or require', () => {
    const { error, returnValue } = runScript(
      'typeof process + "," + typeof require;'
    );
    expect(error).toBeNull();
    expect(returnValue).toBe('undefined,undefined');
  });
});
