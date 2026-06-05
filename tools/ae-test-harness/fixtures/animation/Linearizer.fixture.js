import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for Linearizer.jsx
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (Window "palette")
 *  - Guard: no active comp → alert("Please select a composition.") + return
 *  - Guard: pre-selected properties with < 2 keyframes → alert + return
 *  - Success (batch mode – properties pre-selected):
 *      1. beginUndoGroup("Linearizer")
 *      2. addCheckboxController on the driver layer
 *         → setValue on the checkbox effect name (logged as setValue)
 *      3. targetProperty.expression = <generated expression string>
 *         → setExpression operation
 *      4. endUndoGroup
 *
 * UI interactions modelled for success scenario:
 *  - Script opens palette automatically on run (Window shown)
 *  - "Select Driver Property" button click (driver already in selection state)
 *  - Change minInput / maxInput text fields
 *  - "Apply Linear Expression" button click
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Minimal valid comp id used across scenarios */
const COMP_ID = 'comp-lin-01';
const DRIVER_LAYER_ID = 'layer-driver-01';
const TARGET_LAYER_ID = 'layer-target-01';

// ---------------------------------------------------------------------------
// HostSnapshot for success scenario
// Target layer has a 1D property (Opacity) with 3 keyframes.
// Driver layer has a 1D Slider effect property.
// Both layers are selected; the target property path is in selection.
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Main Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Main Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: DRIVER_LAYER_ID,
          index: 1,
          name: 'Driver Null',
          type: 'Null',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Effect Parade',
              name: 'Effects',
              path: 'Driver Null/Effects',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 1,
              properties: [
                {
                  matchName: 'ADBE Slider Control',
                  name: 'Slider Control',
                  path: 'Driver Null/Effects/Slider Control',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Slider Control-0001',
                      name: 'Slider',
                      path: 'Driver Null/Effects/Slider Control/Slider',
                      propertyValueType: 'OneD',
                      value: 50,
                      canSetExpression: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: TARGET_LAYER_ID,
          index: 2,
          name: 'Target Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Target Shape/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Target Shape/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 100,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 0 },
                    { time: 2, value: 50 },
                    { time: 4, value: 100 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  // Pre-select the target property so Linearizer uses batch mode
  selection: {
    layerIds: [TARGET_LAYER_ID, DRIVER_LAYER_ID],
    propertyPaths: ['Target Shape/Transform/Opacity'],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot for guard scenario – no active comp
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot for guard scenario – property has < 2 keyframes
// ---------------------------------------------------------------------------
const guardFewKeyframesHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-lin-02', name: 'Short Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-lin-02',
  comps: [
    {
      id: 'comp-lin-02',
      name: 'Short Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-short-01',
          index: 1,
          name: 'Layer A',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Layer A/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Layer A/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 100,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: 0 },
                    // Only ONE keyframe — not enough for Linearizer
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: ['layer-short-01'],
    propertyPaths: ['Layer A/Transform/Opacity'],
  },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Linearizer',
    category: 'animation',
    relPath: 'animation/Linearizer.jsx',
    ui: true,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS — batch-mode with pre-selected 1D property (3 keyframes)
    //     Driver: Slider Control. Min=0, Max=100.
    //     Expected: beginUndoGroup → setValue (checkbox name) → setExpression → endUndoGroup
    // ------------------------------------------------------------------
    {
      name: 'success – 1D opacity linked to slider driver',
      kind: 'success',
      host: successHost,
      // Modeled user flow (Linearizer is a non-modal palette): with the target
      // Opacity pre-selected (batch mode, captured at script start), the user
      // re-selects the driver Slider in the timeline, clicks "Select Driver
      // Property" (which sets driverProperty), restores the target selection,
      // enters Min/Max, then clicks "Apply Linear Expression".
      //
      // The post-run actions runner re-fires these palette buttons with the
      // host selection interleaved correctly via `selectProperties`, so the
      // apply click runs with driverProperty set and Min/Max seeded — producing
      // the full success path (beginUndoGroup → addCheckboxController setValue →
      // setExpression → endUndoGroup). The Min/Max edittexts default to their
      // placeholder text ("Min Value"/"Max Value"), which is how they resolve.
      actions: [
        // Re-select the driver Slider property before opening the driver picker.
        { type: 'selectProperties', value: ['Driver Null/Effects/Slider Control/Slider'] },
        { type: 'click', target: 'Select Driver Property' },
        // Restore the target property selection for the apply step.
        { type: 'selectProperties', value: ['Target Shape/Transform/Opacity'] },
        // Enter min value (edittext defaults to placeholder text "Min Value").
        { type: 'change', target: 'Min Value', value: '0' },
        // Enter max value (edittext defaults to placeholder text "Max Value").
        { type: 'change', target: 'Max Value', value: '100' },
        // Apply.
        { type: 'click', target: 'Apply Linear Expression' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'Linearizer' },
        // addCheckboxController: Effect added to driver layer, then name set
        { kind: 'setValue', target: 'Driver Null/Effects/Uniform Interpolation ||Target Shape>Transform>Opacity' },
        // expression written to target property
        { kind: 'setExpression', target: 'Target Shape/Transform/Opacity' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [
        {
          targetPath: 'Target Shape/Transform/Opacity',
          source: 'literal',
          parseStatus: 'ok',
        },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // (b) GUARD — no active composition
    // ------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please select a composition.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (c) GUARD — pre-selected property has fewer than 2 keyframes
    // ------------------------------------------------------------------
    {
      name: 'guard – property has fewer than 2 keyframes',
      kind: 'guard',
      host: guardFewKeyframesHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['All selected properties must have at least two keyframes.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error('Linearizer.fixture.js failed self-validation:\n' + _check.errors.join('\n'));
}

export default fixture;
