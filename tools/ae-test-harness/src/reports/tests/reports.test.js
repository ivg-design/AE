import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildReport, writeReport } from '../index.js';
import { validateReportRecord, OPERATION_KINDS } from '../../contracts/index.js';

/** @returns {import('../../contracts/index.js').ReportRecord[]} */
function synthRecords() {
  /** @type {import('../../contracts/index.js').ReportRecord} */
  const passing = {
    name: 'rectangulator_v2',
    category: 'layers',
    ui: true,
    static: { status: 'pass' },
    expressions: { status: 'pass' },
    functional: { status: 'pass', detail: '3 ops' },
    uiStatus: { status: 'pass' },
    risk: { aeOnly: false, knownBlocked: false, items: [] },
    confidence: 'high',
    artifacts: ['screenshots/rectangulator.png'],
    notes: []
  };

  /** @type {import('../../contracts/index.js').ReportRecord} */
  const blocked = {
    name: 'applyPresetTool',
    category: 'effects',
    ui: false,
    static: { status: 'pass' },
    expressions: { status: 'skip' },
    functional: { status: 'warn', detail: 'preset path unresolved' },
    uiStatus: { status: 'skip' },
    risk: {
      aeOnly: true,
      knownBlocked: true,
      items: ['applyPreset requires live AE', 'no headless preset engine']
    },
    confidence: 'known-blocked',
    artifacts: [],
    notes: ['Requires After Effects runtime.']
  };

  return [passing, blocked];
}

describe('buildReport', () => {
  it('produces valid synthetic records', () => {
    for (const rec of synthRecords()) {
      const res = validateReportRecord(rec);
      expect(res.ok, res.errors.join('; ')).toBe(true);
    }
  });

  it('renders summary, per-script table, and risk section', () => {
    const { json, markdown } = buildReport(synthRecords());

    // Summary
    expect(json.summary.total).toBe(2);
    expect(json.summary.byConfidence.high).toBe(1);
    expect(json.summary.byConfidence['known-blocked']).toBe(1);
    expect(json.summary.aeRuntimeOnly).toBe(1);
    expect(json.summary.knownBlocked).toBe(1);

    // Table header with all required columns
    expect(markdown).toContain(
      '| Script | Category | UI | Static | Expressions | Functional | UI | Risk | Confidence |'
    );
    // Per-script rows
    expect(markdown).toContain('| rectangulator_v2 | layers |');
    expect(markdown).toContain('pass (3 ops)');
    expect(markdown).toContain('| applyPresetTool | effects |');
    expect(markdown).toContain('warn (preset path unresolved)');
    expect(markdown).toContain('High');
    expect(markdown).toContain('Known-blocked');

    // Risk section
    expect(markdown).toContain('## AE-Runtime-Only Risks & Known-Blocked Scripts');
    expect(markdown).toContain('### AE-runtime-only risks');
    expect(markdown).toContain('applyPreset requires live AE');
    expect(markdown).toContain('### Known-blocked scripts');
    expect(markdown).toContain('**applyPresetTool**');
  });

  it('handles empty input deterministically', () => {
    const { json, markdown } = buildReport([]);
    expect(json.summary.total).toBe(0);
    expect(markdown).toContain('_None._');
  });
});

describe('writeReport', () => {
  it('writes report.json (stable key order) + report.md and logs fileWrite ops', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ae-report-'));
    try {
      /** @type {import('../../contracts/index.js').Operation[]} */
      const log = [];
      const { jsonPath, mdPath } = writeReport(synthRecords(), dir, { log });

      const jsonText = readFileSync(jsonPath, 'utf8');
      const mdText = readFileSync(mdPath, 'utf8');

      // Stable key order: keys are emitted alphabetically, so "records" precedes "summary".
      const parsed = JSON.parse(jsonText);
      expect(parsed.summary.total).toBe(2);
      expect(jsonText.indexOf('"records"')).toBeLessThan(jsonText.indexOf('"summary"'));
      // Deterministic: re-stringifying identical input yields byte-identical output.
      const dir2 = mkdtempSync(join(tmpdir(), 'ae-report-'));
      try {
        const { jsonPath: jp2 } = writeReport(synthRecords(), dir2);
        expect(readFileSync(jp2, 'utf8')).toBe(jsonText);
      } finally {
        rmSync(dir2, { recursive: true, force: true });
      }

      expect(mdText).toContain('# AE Test Harness Report');

      // Operation logging uses OPERATION_KINDS.
      expect(log).toHaveLength(2);
      for (const op of log) {
        expect(OPERATION_KINDS).toContain(op.kind);
        expect(op.kind).toBe('fileWrite');
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
