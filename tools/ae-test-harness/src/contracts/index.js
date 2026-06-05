/**
 * FROZEN CONTRACT — central barrel.
 *
 * Re-exports every shared schema typedef (via JSDoc), runtime validator, and frozen constant.
 * All subsystem agents import shared interfaces from this module.
 *
 * Validators NEVER throw; they return { ok: boolean, errors: string[] }.
 */

// --- Typedef re-exports (JSDoc only; no runtime cost) ---
/**
 * @typedef {import('./host-snapshot.schema.js').HostSnapshot} HostSnapshot
 * @typedef {import('./host-snapshot.schema.js').ItemRef} ItemRef
 * @typedef {import('./host-snapshot.schema.js').CompDef} CompDef
 * @typedef {import('./host-snapshot.schema.js').LayerDef} LayerDef
 * @typedef {import('./host-snapshot.schema.js').PropertyDef} PropertyDef
 * @typedef {import('./host-snapshot.schema.js').Keyframe} Keyframe
 * @typedef {import('./ui-tree.schema.js').UITree} UITree
 * @typedef {import('./ui-tree.schema.js').UINode} UINode
 * @typedef {import('./operation.schema.js').Operation} Operation
 * @typedef {import('./expression-record.schema.js').ExpressionRecord} ExpressionRecord
 * @typedef {import('./fixture.schema.js').Fixture} Fixture
 * @typedef {import('./fixture.schema.js').Scenario} Scenario
 * @typedef {import('./fixture.schema.js').Action} Action
 * @typedef {import('./report-record.schema.js').ReportRecord} ReportRecord
 * @typedef {import('./report-record.schema.js').CheckStatus} CheckStatus
 * @typedef {import('./report-record.schema.js').RiskStatus} RiskStatus
 */

// --- Validators ---
export {
  validateHostSnapshot,
  ITEM_TYPE_NAMES,
  LAYER_TYPES,
  PROPERTY_VALUE_TYPES
} from './host-snapshot.schema.js';

export { validateUITree, UI_TREE_TYPES } from './ui-tree.schema.js';

export { validateOperation, OPERATION_KINDS } from './operation.schema.js';

export {
  validateExpressionRecord,
  EXPRESSION_SOURCES,
  EXPRESSION_PARSE_STATUSES
} from './expression-record.schema.js';

export {
  validateFixture,
  ACTION_TYPES,
  SCENARIO_KINDS,
  SCENARIO_CONFIDENCE
} from './fixture.schema.js';

export {
  validateReportRecord,
  validateCheckStatus,
  CONFIDENCE_LEVELS,
  CHECK_STATUS_VALUES
} from './report-record.schema.js';
