/**
 * FROZEN CONTRACT — functional fixture schema.
 *
 * A Fixture pairs a script descriptor with a set of Scenarios. Each Scenario provides a
 * HostSnapshot, a sequence of Actions to drive, and the expected Operations / expressions /
 * alerts / confidence the harness should observe.
 *
 * Validators NEVER throw. They return { ok: boolean, errors: string[] }.
 */

import { validateHostSnapshot } from './host-snapshot.schema.js';

/**
 * @typedef {Object} Action
 * @property {'click'|'change'|'select'|'type'|'selectLayers'|'selectProperties'|'run'} type
 * @property {string} [target]
 * @property {*} [value]
 */

/**
 * @typedef {Object} Scenario
 * @property {string} name
 * @property {'success'|'guard'|'known-blocked'} kind
 * @property {import('./host-snapshot.schema.js').HostSnapshot} host
 * @property {Action[]} actions
 * @property {Array<Partial<import('./operation.schema.js').Operation>>} expectedOperations
 * @property {Array<Partial<import('./expression-record.schema.js').ExpressionRecord>>} [expectedExpressions]
 * @property {string[]} [expectedAlerts]
 * @property {'high'|'medium'|'low'|'known-blocked'} expectedConfidence
 */

/**
 * @typedef {Object} Fixture
 * @property {{ name: string, category: string, relPath: string, ui: boolean }} script
 * @property {Scenario[]} scenarios
 */

const ACTION_TYPES = ['click', 'change', 'select', 'type', 'selectLayers', 'selectProperties', 'run'];
const SCENARIO_KINDS = ['success', 'guard', 'known-blocked'];
const SCENARIO_CONFIDENCE = ['high', 'medium', 'low', 'known-blocked'];

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isStr(v) {
  return typeof v === 'string';
}
function isBool(v) {
  return typeof v === 'boolean';
}

/**
 * @param {*} a
 * @param {string} where
 * @param {string[]} errors
 */
function checkAction(a, where, errors) {
  if (!isObj(a)) {
    errors.push(`${where}: Action must be an object`);
    return;
  }
  if (!ACTION_TYPES.includes(a.type)) {
    errors.push(`${where}.type must be one of ${ACTION_TYPES.join('|')}`);
  }
  if ('target' in a && a.target != null && !isStr(a.target)) {
    errors.push(`${where}.target must be a string when present`);
  }
}

/**
 * @param {*} s
 * @param {string} where
 * @param {string[]} errors
 */
function checkScenario(s, where, errors) {
  if (!isObj(s)) {
    errors.push(`${where}: Scenario must be an object`);
    return;
  }
  if (!isStr(s.name)) errors.push(`${where}.name must be a string`);
  if (!SCENARIO_KINDS.includes(s.kind)) errors.push(`${where}.kind must be one of ${SCENARIO_KINDS.join('|')}`);
  if (!SCENARIO_CONFIDENCE.includes(s.expectedConfidence)) {
    errors.push(`${where}.expectedConfidence must be one of ${SCENARIO_CONFIDENCE.join('|')}`);
  }
  const hostRes = validateHostSnapshot(s.host);
  if (!hostRes.ok) {
    hostRes.errors.forEach((e) => errors.push(`${where}.host.${e}`));
  }
  if (!Array.isArray(s.actions)) {
    errors.push(`${where}.actions must be an array`);
  } else {
    s.actions.forEach((a, i) => checkAction(a, `${where}.actions[${i}]`, errors));
  }
  if (!Array.isArray(s.expectedOperations)) {
    errors.push(`${where}.expectedOperations must be an array`);
  }
  if ('expectedExpressions' in s && s.expectedExpressions != null && !Array.isArray(s.expectedExpressions)) {
    errors.push(`${where}.expectedExpressions must be an array when present`);
  }
  if ('expectedAlerts' in s && s.expectedAlerts != null) {
    if (!Array.isArray(s.expectedAlerts) || !s.expectedAlerts.every(isStr)) {
      errors.push(`${where}.expectedAlerts must be an array of strings when present`);
    }
  }
}

/**
 * Validate a Fixture. Never throws.
 * @param {*} fixture
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateFixture(fixture) {
  const errors = [];
  if (!isObj(fixture)) {
    return { ok: false, errors: ['Fixture must be an object'] };
  }
  if (!isObj(fixture.script)) {
    errors.push('script must be an object');
  } else {
    const sc = fixture.script;
    if (!isStr(sc.name)) errors.push('script.name must be a string');
    if (!isStr(sc.category)) errors.push('script.category must be a string');
    if (!isStr(sc.relPath)) errors.push('script.relPath must be a string');
    if (!isBool(sc.ui)) errors.push('script.ui must be a boolean');
  }
  if (!Array.isArray(fixture.scenarios)) {
    errors.push('scenarios must be an array');
  } else {
    fixture.scenarios.forEach((s, i) => checkScenario(s, `scenarios[${i}]`, errors));
  }
  return { ok: errors.length === 0, errors };
}

export { ACTION_TYPES, SCENARIO_KINDS, SCENARIO_CONFIDENCE };
