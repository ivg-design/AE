/**
 * Fixture for Split-o-matic_9x16.jsx
 *
 * HEADLESS script (no ScriptUI). Requires an active CompItem. Does NOT use #include.
 * Creates a "9x16 Template" folder (or finds existing), then adds ~10 shape layers to the
 * active comp covering: guide controllers (PSR), mask shapes, shadow layers, zero-point
 * helper layers. Applies many setValue and setExpression calls. Calls prompt() once at
 * startup (via getPrefix()) to collect a naming prefix, and calls setParentWithJump()
 * for layer parenting.
 *
 * Key operations:
 *   - beginUndoGroup("Split-o-matic 9x16") / endUndoGroup
 *   - prompt() for prefix
 *   - Multiple createLayer (addShape) calls in the active comp
 *   - setValueAtTime (+ addKeyframe) when stamping markers on the ADBE Marker property
 *   - Multiple setValue calls for shape vectors, effects, transforms
 *   - setParent for parent-child wiring
 *   - setExpression on mask size, position, transform, and drop-shadow props
 *
 * Confidence: medium — setParentWithJump, MarkerValue, Shape objects, and
 * app.project.autoFixExpressions are AE-runtime-only constructs.
 *
 * Guard: alert "Please select a composition first" when no active CompItem.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Split-o-matic_9x16',
    category: 'composition',
    relPath: 'composition/Split-o-matic_9x16.jsx',
    ui: false,
  },

  scenarios: [
    // ------------------------------------------------------------------
    // SUCCESS — active comp with blank prefix (prompt returns "")
    // ------------------------------------------------------------------
    {
      name: 'success — builds split-screen rig with empty prefix',
      kind: 'success',
      host: {
        appVersion: '24.0',
        project: {
          items: [
            { id: 'comp-split', name: 'Main 9x16', typeName: 'Composition' },
          ],
        },
        activeItemId: 'comp-split',
        comps: [
          {
            id: 'comp-split',
            name: 'Main 9x16',
            width: 1080,
            height: 1920,
            duration: 30,
            frameRate: 60,
            pixelAspect: 1,
            layers: [],
          },
        ],
        selection: { layerIds: [], propertyPaths: [] },
      },
      actions: [
        // Respond to the prefix prompt with an empty string
        { type: 'type', target: 'prompt', value: '' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // prompt for prefix
        { kind: 'prompt' },
        // 10 shape layers added (createLayer)
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        { kind: 'createLayer' },
        // Controller/Zero markers are stamped via
        // layer.property("ADBE Marker").setValueAtTime(0, new MarkerValue(...)),
        // which the properties subsystem logs as setValueAtTime (+ addKeyframe) —
        // there is no distinct setMarker operation kind in the contract.
        { kind: 'setValueAtTime' },
        { kind: 'addKeyframe' },
        // shape / effect setValues
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        // parent-child wiring
        { kind: 'setParent' },
        { kind: 'setParent' },
        { kind: 'setParent' },
        { kind: 'setParent' },
        { kind: 'setParent' },
        { kind: 'setParent' },
        // expressions on mask size/position/transform and drop shadow
        { kind: 'setExpression' },
        { kind: 'setExpression' },
        { kind: 'setExpression' },
        { kind: 'setExpression' },
        { kind: 'setExpression' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [
        {
          targetPath: 'ADBE Root Vectors Group/1/2/1/ADBE Vector Rect Size',
          source: 'literal',
          parseStatus: 'ok',
        },
        {
          targetPath: 'ADBE Effect Parade/1/ADBE Drop Shadow-0001',
          source: 'literal',
          parseStatus: 'ok',
        },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // GUARD — no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard — no active composition',
      kind: 'guard',
      host: {
        appVersion: '24.0',
        project: { items: [] },
        activeItemId: null,
        comps: [],
        selection: { layerIds: [], propertyPaths: [] },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedAlerts: ['Please select a composition first'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const validation = validateFixture(fixture);
if (!validation.ok) {
  throw new Error(`Split-o-matic_9x16.fixture.js failed validation:\n${validation.errors.join('\n')}`);
}

export default fixture;
