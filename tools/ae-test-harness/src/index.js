/**
 * ae-test-harness — public API barrel (Integrate-owned).
 *
 * Re-exports the harness's stable public surface so consumers can do:
 *
 *   import {
 *     createHost, runFixtureScenario,
 *     discoverScripts, loadFixtures,
 *     parseECMA3, scanModernAPI, validateFrontmatter, scanIncludes,
 *     extractLiteralExpressions, parseExpression, classifyRecord,
 *     buildReport, writeReport,
 *     renderHTML, screenshot, sdbAdapter,
 *     createScriptUIRuntime, runActions
 *   } from 'ae-test-harness/src/index.js';
 *
 * Everything below is a thin pass-through to the frozen subsystem indexes; no
 * logic lives here. ESM only.
 */

// --- Host runner (createHost + scenario runner) ------------------------------
export { createHost, runFixtureScenario } from './host/index.js';

// --- Discovery + fixtures (Integrate glue) -----------------------------------
export { discoverScripts, CATEGORIES, DEFAULT_SCRIPTS_ROOT } from './discovery.js';
export { loadFixtures, DEFAULT_FIXTURES_ROOT } from './fixtures/loader.js';

// --- Static analysis ---------------------------------------------------------
export {
  parseECMA3,
  scanModernAPI,
  validateFrontmatter,
  scanIncludes
} from './static/index.js';

// --- Expression extraction / classification ----------------------------------
export {
  extractLiteralExpressions,
  parseExpression,
  classifyRecord
} from './expressions/index.js';

// --- Reporting ---------------------------------------------------------------
export { buildReport, writeReport } from './reports/index.js';

// --- Visualization -----------------------------------------------------------
export { renderHTML, screenshot, sdbAdapter } from './visualization/index.js';

// --- ScriptUI runtime + action driver ----------------------------------------
export { createScriptUIRuntime } from './scriptui/index.js';
export { runActions } from './scriptui/actions/index.js';

// --- Frozen contract surface (validators + constants) ------------------------
export {
  validateHostSnapshot,
  validateUITree,
  validateOperation,
  validateExpressionRecord,
  validateFixture,
  validateReportRecord,
  validateCheckStatus,
  OPERATION_KINDS,
  CONFIDENCE_LEVELS,
  CHECK_STATUS_VALUES,
  ITEM_TYPE_NAMES,
  LAYER_TYPES,
  PROPERTY_VALUE_TYPES,
  UI_TREE_TYPES,
  EXPRESSION_SOURCES,
  EXPRESSION_PARSE_STATUSES,
  ACTION_TYPES,
  SCENARIO_KINDS,
  SCENARIO_CONFIDENCE
} from './contracts/index.js';
