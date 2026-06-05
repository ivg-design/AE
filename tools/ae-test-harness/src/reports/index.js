/**
 * Reporting subsystem.
 *
 * Aggregates an array of ReportRecords into a deterministic report:
 *   - buildReport(records) -> { json, markdown }
 *   - writeReport(records, outDir) -> { jsonPath, mdPath }
 *
 * The markdown contains a summary, a per-script table, and a dedicated section
 * listing AE-runtime-only risks and known-blocked scripts.
 *
 * Confidence labels are derived from the frozen CONFIDENCE_LEVELS constant.
 * All operation logging (when a host/log is supplied) uses OPERATION_KINDS.
 *
 * This module is importable in isolation: it imports only from the frozen
 * contracts barrel and Node core modules.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CONFIDENCE_LEVELS,
  CHECK_STATUS_VALUES,
  OPERATION_KINDS,
  validateReportRecord
} from '../contracts/index.js';

/**
 * Human-readable label for each frozen confidence level.
 * Keyed strictly by CONFIDENCE_LEVELS so the mapping can never drift.
 * @type {Record<string,string>}
 */
const CONFIDENCE_LABELS = (() => {
  /** @type {Record<string,string>} */
  const base = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    'known-blocked': 'Known-blocked'
  };
  /** @type {Record<string,string>} */
  const out = {};
  for (const level of CONFIDENCE_LEVELS) {
    out[level] = Object.prototype.hasOwnProperty.call(base, level) ? base[level] : level;
  }
  return out;
})();

/**
 * Map a confidence value to its display label, falling back to the raw value.
 * @param {string} confidence
 * @returns {string}
 */
function confidenceLabel(confidence) {
  return Object.prototype.hasOwnProperty.call(CONFIDENCE_LABELS, confidence)
    ? CONFIDENCE_LABELS[confidence]
    : String(confidence);
}

/**
 * @param {*} v
 * @returns {boolean}
 */
function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Normalize a (possibly partial) CheckStatus into a guaranteed object.
 * @param {*} cs
 * @returns {{status:string, detail?:string, evidence?:*}}
 */
function normCheck(cs) {
  if (!isObj(cs)) return { status: 'skip' };
  const status = CHECK_STATUS_VALUES.includes(cs.status) ? cs.status : 'skip';
  /** @type {{status:string, detail?:string, evidence?:*}} */
  const out = { status };
  if (typeof cs.detail === 'string') out.detail = cs.detail;
  if ('evidence' in cs) out.evidence = cs.evidence;
  return out;
}

/**
 * Normalize a (possibly partial) RiskStatus into a guaranteed object.
 * @param {*} risk
 * @returns {{aeOnly:boolean, knownBlocked:boolean, items:string[]}}
 */
function normRisk(risk) {
  if (!isObj(risk)) return { aeOnly: false, knownBlocked: false, items: [] };
  return {
    aeOnly: risk.aeOnly === true,
    knownBlocked: risk.knownBlocked === true,
    items: Array.isArray(risk.items) ? risk.items.filter((i) => typeof i === 'string') : []
  };
}

/**
 * Normalize an array of strings.
 * @param {*} arr
 * @returns {string[]}
 */
function normStrArr(arr) {
  return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : [];
}

/**
 * Normalize a single record into a stable, fully-populated shape.
 * @param {import('../contracts/index.js').ReportRecord} rec
 * @returns {import('../contracts/index.js').ReportRecord}
 */
function normRecord(rec) {
  const r = isObj(rec) ? rec : {};
  return {
    name: typeof r.name === 'string' ? r.name : '',
    category: typeof r.category === 'string' ? r.category : '',
    ui: r.ui === true,
    static: normCheck(r.static),
    expressions: normCheck(r.expressions),
    functional: normCheck(r.functional),
    uiStatus: normCheck(r.uiStatus),
    risk: normRisk(r.risk),
    confidence: CONFIDENCE_LEVELS.includes(r.confidence) ? r.confidence : 'low',
    artifacts: normStrArr(r.artifacts),
    notes: normStrArr(r.notes)
  };
}

/**
 * Escape a value for safe inclusion inside a single markdown table cell.
 * @param {string} s
 * @returns {string}
 */
function cell(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Render a CheckStatus as a compact table cell (status + optional detail).
 * @param {{status:string, detail?:string}} cs
 * @returns {string}
 */
function checkCell(cs) {
  return cs.detail ? `${cs.status} (${cs.detail})` : cs.status;
}

/**
 * Render the risk column for a record.
 * @param {{aeOnly:boolean, knownBlocked:boolean, items:string[]}} risk
 * @returns {string}
 */
function riskCell(risk) {
  const flags = [];
  if (risk.aeOnly) flags.push('AE-only');
  if (risk.knownBlocked) flags.push('blocked');
  if (risk.items.length) flags.push(`${risk.items.length} item${risk.items.length === 1 ? '' : 's'}`);
  return flags.length ? flags.join(', ') : 'none';
}

/**
 * Build the deterministic JSON payload for a set of records.
 *
 * Keys are emitted in a stable order so the serialized output is reproducible.
 * @param {import('../contracts/index.js').ReportRecord[]} normalized
 * @returns {object}
 */
function buildJson(normalized) {
  const total = normalized.length;
  /** @type {Record<string, number>} */
  const byConfidence = {};
  for (const level of CONFIDENCE_LEVELS) byConfidence[level] = 0;
  let aeOnly = 0;
  let knownBlocked = 0;
  for (const rec of normalized) {
    if (Object.prototype.hasOwnProperty.call(byConfidence, rec.confidence)) {
      byConfidence[rec.confidence] += 1;
    }
    if (rec.risk.aeOnly) aeOnly += 1;
    if (rec.risk.knownBlocked) knownBlocked += 1;
  }

  return {
    summary: {
      total,
      byConfidence,
      aeRuntimeOnly: aeOnly,
      knownBlocked
    },
    records: normalized.map((rec) => ({
      name: rec.name,
      category: rec.category,
      ui: rec.ui,
      static: rec.static,
      expressions: rec.expressions,
      functional: rec.functional,
      uiStatus: rec.uiStatus,
      risk: rec.risk,
      confidence: rec.confidence,
      confidenceLabel: confidenceLabel(rec.confidence),
      artifacts: rec.artifacts,
      notes: rec.notes
    }))
  };
}

/**
 * Render the full markdown document.
 * @param {import('../contracts/index.js').ReportRecord[]} normalized
 * @param {object} json
 * @returns {string}
 */
function buildMarkdown(normalized, json) {
  const lines = [];

  // --- Title + summary ---
  lines.push('# AE Test Harness Report');
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Scripts: ${json.summary.total}`);
  for (const level of CONFIDENCE_LEVELS) {
    lines.push(`- ${confidenceLabel(level)}: ${json.summary.byConfidence[level]}`);
  }
  lines.push(`- AE-runtime-only risks: ${json.summary.aeRuntimeOnly}`);
  lines.push(`- Known-blocked: ${json.summary.knownBlocked}`);
  lines.push('');

  // --- Per-script table ---
  // Columns: Script | Category | UI | Static | Expressions | Functional | UI | Risk | Confidence
  lines.push('## Scripts');
  lines.push('');
  lines.push('| Script | Category | UI | Static | Expressions | Functional | UI | Risk | Confidence |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const rec of normalized) {
    lines.push(
      '| ' +
        [
          cell(rec.name),
          cell(rec.category),
          rec.ui ? 'yes' : 'no',
          cell(checkCell(rec.static)),
          cell(checkCell(rec.expressions)),
          cell(checkCell(rec.functional)),
          cell(checkCell(rec.uiStatus)),
          cell(riskCell(rec.risk)),
          cell(confidenceLabel(rec.confidence))
        ].join(' | ') +
        ' |'
    );
  }
  lines.push('');

  // --- Risk section: AE-runtime-only + known-blocked ---
  lines.push('## AE-Runtime-Only Risks & Known-Blocked Scripts');
  lines.push('');

  const aeOnly = normalized.filter((r) => r.risk.aeOnly);
  const blocked = normalized.filter(
    (r) => r.risk.knownBlocked || r.confidence === 'known-blocked'
  );

  lines.push('### AE-runtime-only risks');
  lines.push('');
  if (aeOnly.length === 0) {
    lines.push('_None._');
  } else {
    for (const rec of aeOnly) {
      const items = rec.risk.items.length ? rec.risk.items.join('; ') : 'flagged AE-only';
      lines.push(`- **${cell(rec.name)}** (${cell(rec.category)}): ${cell(items)}`);
    }
  }
  lines.push('');

  lines.push('### Known-blocked scripts');
  lines.push('');
  if (blocked.length === 0) {
    lines.push('_None._');
  } else {
    for (const rec of blocked) {
      const items = rec.risk.items.length ? rec.risk.items.join('; ') : 'known-blocked';
      lines.push(`- **${cell(rec.name)}** (${cell(rec.category)}): ${cell(items)}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Build a report from an array of ReportRecords.
 *
 * @param {import('../contracts/index.js').ReportRecord[]} records
 * @returns {{ json: object, markdown: string }}
 */
export function buildReport(records) {
  const input = Array.isArray(records) ? records : [];
  const normalized = input.map(normRecord);
  const json = buildJson(normalized);
  const markdown = buildMarkdown(normalized, json);
  return { json, markdown };
}

/**
 * Deterministic JSON stringifier with stable key ordering.
 *
 * Objects are serialized with their keys sorted lexicographically so the
 * report.json bytes are reproducible across runs regardless of input key order.
 * @param {*} value
 * @returns {string}
 */
function stableStringify(value) {
  return JSON.stringify(value, stableReplacer, 2) + '\n';
}

/**
 * Replacer that re-emits plain objects with sorted keys.
 * @param {string} _key
 * @param {*} val
 * @returns {*}
 */
function stableReplacer(_key, val) {
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    /** @type {Record<string, *>} */
    const sorted = {};
    for (const k of Object.keys(val).sort()) {
      sorted[k] = val[k];
    }
    return sorted;
  }
  return val;
}

/**
 * Build a report and write `report.json` + `report.md` into outDir.
 *
 * When a host log array is supplied (via opts.log), the file writes are recorded
 * as `fileWrite` Operations drawn from OPERATION_KINDS.
 *
 * @param {import('../contracts/index.js').ReportRecord[]} records
 * @param {string} outDir
 * @param {{ log?: import('../contracts/index.js').Operation[] }} [opts]
 * @returns {{ jsonPath: string, mdPath: string }}
 */
export function writeReport(records, outDir, opts = {}) {
  const { json, markdown } = buildReport(records);

  mkdirSync(outDir, { recursive: true });

  const jsonPath = join(outDir, 'report.json');
  const mdPath = join(outDir, 'report.md');

  const jsonBytes = stableStringify(json);
  writeFileSync(jsonPath, jsonBytes, 'utf8');
  writeFileSync(mdPath, markdown.endsWith('\n') ? markdown : markdown + '\n', 'utf8');

  // Operation logging uses OPERATION_KINDS exclusively.
  if (Array.isArray(opts.log)) {
    const FILE_WRITE = OPERATION_KINDS[OPERATION_KINDS.indexOf('fileWrite')];
    opts.log.push({ kind: FILE_WRITE, target: jsonPath, meta: { bytes: jsonBytes.length } });
    opts.log.push({ kind: FILE_WRITE, target: mdPath, meta: { bytes: markdown.length } });
  }

  return { jsonPath, mdPath };
}

export { CONFIDENCE_LABELS, confidenceLabel, validateReportRecord };
