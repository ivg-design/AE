import { describe, it, expect } from 'vitest';
import fs from 'node:fs';

import { createIO, HARNESS_TMP_ROOT } from '../src/host/io-effects/index.js';
import { OPERATION_KINDS, validateOperation } from '../src/contracts/index.js';

describe('host/io-effects createIO', () => {
  it('logs a fileWrite and really writes to the harness temp dir', () => {
    const log = [];
    const { File } = createIO(log);

    const f = new File('exports/data.json');
    f.open('w');
    f.write('{"a":');
    f.writeln('1}');
    f.close();

    const writes = log.filter((o) => o.kind === 'fileWrite');
    expect(writes.length).toBe(2);
    expect(writes.every((o) => OPERATION_KINDS.includes(o.kind))).toBe(true);
    expect(writes.every((o) => validateOperation(o).ok)).toBe(true);
    expect(writes[0].target).toBe('exports/data.json');
    expect(writes[0].value).toBe('{"a":');
    expect(writes[1].value).toBe('1}\n');

    // Real file landed under HARNESS_TMP_ROOT and contains the full buffer.
    const realPath = writes[1].meta.realPath;
    expect(realPath.startsWith(HARNESS_TMP_ROOT)).toBe(true);
    expect(fs.readFileSync(realPath, 'utf8')).toBe('{"a":1}\n');
  });

  it('logs applyPreset without decoding real FFX', () => {
    const log = [];
    const { applyPreset, File } = createIO(log);
    const layer = { id: 'L1', name: 'Solid 1', index: 1 };

    applyPreset(layer, new File('presets/glow.ffx'));

    const presets = log.filter((o) => o.kind === 'applyPreset');
    expect(presets.length).toBe(1);
    expect(presets[0].kind).toBe('applyPreset');
    expect(presets[0].target).toBe('L1');
    expect(presets[0].value).toBe('presets/glow.ffx');
    expect(presets[0].meta.decoded).toBe(false);
    expect(validateOperation(presets[0]).ok).toBe(true);
  });

  it('Folder.create makes a real directory and addEffectStub / executeCommand log', () => {
    const log = [];
    const { Folder, addEffectStub, executeCommand } = createIO(log);

    const folder = new Folder('myproj/out');
    folder.create();
    expect(fs.existsSync(folder._realPath)).toBe(true);

    const fx = addEffectStub({ id: 'L2' }, 'ADBE Gaussian Blur 2');
    expect(fx.matchName).toBe('ADBE Gaussian Blur 2');
    fx.addParam('Blurriness', 'ADBE Gaussian Blur 2-0001', 'OneD', 20);
    expect(fx.numProperties).toBe(1);
    expect(fx.property('Blurriness').value).toBe(20);
    expect(fx.property(1).value).toBe(20);

    executeCommand(2255);

    expect(log.some((o) => o.kind === 'applyPreset')).toBe(true);
    expect(log.some((o) => o.kind === 'executeCommand')).toBe(true);
    expect(log.every((o) => validateOperation(o).ok)).toBe(true);
  });
});
