import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for ChromaBlenderizer.jsx
 *
 * Script behaviour summary:
 *  - @ui PALETTE  (modeless Window 'palette', title 'ChromaBlenderizer v2.3.1')
 *
 *  Guards (evaluated eagerly, before palette is shown):
 *   1. No active CompItem → alert('Please open an active composition.') + return
 *
 *  Guards (evaluated inside Apply Colors handler):
 *   2. No active comp at apply time → alert with "Please activate a composition…"
 *   3. Fewer than 2 COLOR-type properties selected → alert with "Select at least two…"
 *
 *  Success path (Apply Colors button):
 *   1. app.beginUndoGroup('ChromaBlenderizer')
 *   2. For each selected color property (i = 0 … n-1):
 *        colorProperties[i].setValue([r, g, b, 1])   → Operation kind='setValue'
 *   3. app.endUndoGroup()
 *
 *  No expressions, no keyframes, no file writes, no applyPreset, no executeCommand.
 *  The palette stays open after Apply; the Close button calls dialog.close().
 */

// ---------------------------------------------------------------------------
// Shared ids
// ---------------------------------------------------------------------------

const COMP_ID = 'comp-chroma-01';
const LAYER_A_ID = 'layer-shape-01';
const LAYER_B_ID = 'layer-shape-02';

// ---------------------------------------------------------------------------
// HostSnapshot — success scenario
// Two shape layers each exposing a Fill Color (Color type) property.
// Both color properties are in selection.propertyPaths so the script
// discovers them via comp.selectedProperties.
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Chroma Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Chroma Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: LAYER_A_ID,
          index: 1,
          name: 'Shape A',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Shape A/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 1,
              properties: [
                {
                  matchName: 'ADBE Vector Group',
                  name: 'Group 1',
                  path: 'Shape A/Contents/Group 1',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Vector GFill',
                      name: 'Fill 1',
                      path: 'Shape A/Contents/Group 1/Fill 1',
                      propertyValueType: 'NoValue',
                      canSetExpression: false,
                      numProperties: 1,
                      properties: [
                        {
                          matchName: 'ADBE Vector Fill Color',
                          name: 'Color',
                          path: 'Shape A/Contents/Group 1/Fill 1/Color',
                          propertyValueType: 'Color',
                          value: [1, 0, 0, 1],
                          canSetExpression: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: LAYER_B_ID,
          index: 2,
          name: 'Shape B',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Shape B/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 1,
              properties: [
                {
                  matchName: 'ADBE Vector Group',
                  name: 'Group 1',
                  path: 'Shape B/Contents/Group 1',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Vector GFill',
                      name: 'Fill 1',
                      path: 'Shape B/Contents/Group 1/Fill 1',
                      propertyValueType: 'NoValue',
                      canSetExpression: false,
                      numProperties: 1,
                      properties: [
                        {
                          matchName: 'ADBE Vector Fill Color',
                          name: 'Color',
                          path: 'Shape B/Contents/Group 1/Fill 1/Color',
                          propertyValueType: 'Color',
                          value: [0, 0, 1, 1],
                          canSetExpression: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  // Both fill color properties are in the selected properties list
  selection: {
    layerIds: [LAYER_A_ID, LAYER_B_ID],
    propertyPaths: [
      'Shape A/Contents/Group 1/Fill 1/Color',
      'Shape B/Contents/Group 1/Fill 1/Color',
    ],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot — guard: no active composition
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot — guard: active comp but fewer than 2 color properties selected
// (only one color property selected — script requires at least 2)
// ---------------------------------------------------------------------------
const COMP_GUARD_ID = 'comp-chroma-02';
const LAYER_ONLY_ID = 'layer-shape-guard';

const guardTooFewPropsHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_GUARD_ID, name: 'Guard Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_GUARD_ID,
  comps: [
    {
      id: COMP_GUARD_ID,
      name: 'Guard Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: LAYER_ONLY_ID,
          index: 1,
          name: 'Shape Guard',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Shape Guard/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 1,
              properties: [
                {
                  matchName: 'ADBE Vector Group',
                  name: 'Group 1',
                  path: 'Shape Guard/Contents/Group 1',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Vector GFill',
                      name: 'Fill 1',
                      path: 'Shape Guard/Contents/Group 1/Fill 1',
                      propertyValueType: 'NoValue',
                      canSetExpression: false,
                      numProperties: 1,
                      properties: [
                        {
                          matchName: 'ADBE Vector Fill Color',
                          name: 'Color',
                          path: 'Shape Guard/Contents/Group 1/Fill 1/Color',
                          propertyValueType: 'Color',
                          value: [1, 1, 1, 1],
                          canSetExpression: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  // Only one color property selected — Apply Colors requires >= 2
  selection: {
    layerIds: [LAYER_ONLY_ID],
    propertyPaths: ['Shape Guard/Contents/Group 1/Fill 1/Color'],
  },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'ChromaBlenderizer',
    category: 'effects',
    relPath: 'effects/ChromaBlenderizer.jsx',
    ui: true,
  },
  scenarios: [
    // -----------------------------------------------------------------------
    // (a) SUCCESS — linear color gamut interpolation across 2 color properties
    //
    //  Defaults: startHue=0, endHue=0, saturation=0, startBrightness=1,
    //            endBrightness=1 → both colors are white [1,1,1,1].
    //  With colorGamutRadio=true (default) and randomize=false:
    //    prop[0] ratio=0 → hsbToRgb(0, 0, 1) = [1,1,1,1]
    //    prop[1] ratio=1 → hsbToRgb(0, 0, 1) = [1,1,1,1]
    //  Expected: beginUndoGroup → setValue×2 → endUndoGroup
    // -----------------------------------------------------------------------
    {
      name: 'success – linear color gamut applied to 2 fill color properties',
      kind: 'success',
      host: successHost,
      actions: [
        // Palette opens automatically when script runs.
        // Accept all defaults (colorGamutRadio=true, randomize=false,
        // start=white, end=white). Click Apply Colors.
        { type: 'click', target: 'Apply Colors' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'ChromaBlenderizer' },
        // First color property gets start-color value [1,1,1,1]
        {
          kind: 'setValue',
          target: 'Shape A/Contents/Group 1/Fill 1/Color',
        },
        // Second color property gets end-color value [1,1,1,1]
        {
          kind: 'setValue',
          target: 'Shape B/Contents/Group 1/Fill 1/Color',
        },
        { kind: 'endUndoGroup' },
      ],
      // No expressions written by this script
      expectedExpressions: [],
      expectedConfidence: 'medium',
    },

    // -----------------------------------------------------------------------
    // (b) GUARD — no active composition (script early-exits before UI opens)
    //
    //  getActiveComp() returns null → alert fires → function returns.
    //  Zero mutating operations.
    // -----------------------------------------------------------------------
    {
      name: 'guard – no active composition',
      kind: 'guard',
      host: guardNoCompHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please open an active composition.'],
      expectedConfidence: 'high',
    },

    // -----------------------------------------------------------------------
    // (c) GUARD — fewer than 2 color properties selected at Apply time
    //
    //  Comp is active; user clicks Apply Colors with only 1 color property.
    //  validColorProperties returns false → alert fires → no mutations.
    // -----------------------------------------------------------------------
    {
      name: 'guard – fewer than 2 color properties selected',
      kind: 'guard',
      host: guardTooFewPropsHost,
      actions: [
        { type: 'click', target: 'Apply Colors' },
        { type: 'run' },
      ],
      expectedOperations: [],
      expectedAlerts: [
        'Select at least two target color properties before applying.',
      ],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load — throws if the fixture violates the contract.
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error(
    'ChromaBlenderizer.fixture.js failed self-validation:\n' +
      _check.errors.join('\n'),
  );
}

export default fixture;
