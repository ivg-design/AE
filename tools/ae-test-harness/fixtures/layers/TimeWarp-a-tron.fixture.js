/**
 * TimeWarp-a-tron fixture — time-remapping expression-linker scenarios.
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (Window "dialog")
 *  - beginUndoGroup("TimeWarp-a-tron") at the very top (before createUI).
 *  - Shows dialog with two "pick" buttons (pickTimeRemapButton, pickControllerButton)
 *    and OK / Cancel.
 *  - pickTimeRemapButton.onClick:
 *      • Reads selectedLayers[0]; checks canSetTimeRemapEnabled
 *      • If valid → stores timeRemapPropPath = layer.property("ADBE Time Remapping")
 *      • Else → alert("Please select a layer with Time Remapping enabled.")
 *  - pickControllerButton.onClick:
 *      • Guard: if no timeRemapPropPath → alert("Please pick a Time Remapped Layer first.")
 *      • Reads selectedLayers[0]; checks for existing slider or prompts confirm()
 *      • Sets controllerLayer + controllerProp
 *  - okButton.onClick:
 *      • Guard: if not (timeRemapPropPath && controllerLayer) →
 *          alert("Please make sure both a Time Remapped Layer and a Controller are selected.")
 *      • Adds "In/Out Range" Point Control effect to time-remap layer (setValue([0,60]))
 *      • Ensures slider on controllerLayer (may addProperty)
 *      • Builds expression string and sets timeRemapPropPath.expression = expression
 *      • Closes dialog
 *  - endUndoGroup() after win.show() returns.
 *  - One setExpression operation + two setValue operations (point control value + no slider value
 *    when reusing existing slider).
 */

import { validateFixture } from '../../src/contracts/index.js';

// The expression the script writes to the time-remap property.
// It references thisComp layer names dynamically; we match on a substring fragment.
const EXPRESSION_FRAGMENT =
  'function linearExpression(value, inputMin, inputMax, outputMin, outputMax)';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'TimeWarp-a-tron',
    category: 'layers',
    relPath: 'layers/TimeWarp-a-tron.jsx',
    ui: true,
  },

  scenarios: [
    // ─────────────────────────────────────────────────────────────────────────
    // (a) success — pick time-remap layer, pick controller layer (new slider),
    //               click OK → expression written
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'link time-remap layer to new slider controller',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-1', name: 'VFX Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-1',
        comps: [
          {
            id: 'comp-1',
            name: 'VFX Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'remap-layer',
                index: 1,
                name: 'Footage Layer',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [
                  {
                    matchName: 'ADBE Time Remapping',
                    name: 'Time Remap',
                    path: 'Time Remap',
                    propertyValueType: 'OneD',
                    value: 0,
                    canSetExpression: true,
                  },
                  {
                    matchName: 'ADBE Effect Parade',
                    name: 'Effects',
                    path: 'Effects',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 0,
                    properties: [],
                  },
                ],
              },
              {
                id: 'ctrl-layer',
                index: 2,
                name: 'Controller NULL',
                type: 'Null',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [
                  {
                    matchName: 'ADBE Effect Parade',
                    name: 'Effects',
                    path: 'Effects',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 0,
                    properties: [],
                  },
                ],
              },
            ],
          },
        ],
        // remap-layer selected initially for the "pick time-remap" button click
        selection: {
          layerIds: ['remap-layer'],
          propertyPaths: [],
        },
      },
      actions: [
        // 1. Click pickTimeRemapButton (remap-layer is currently selected)
        { type: 'click', target: 'pickTimeRemapButton' },
        // 2. Switch selection to controller layer
        { type: 'selectLayers', value: ['ctrl-layer'] },
        // 3. Click pickControllerButton — no existing slider → confirm dialog → "yes"
        { type: 'click', target: 'pickControllerButton' },
        // 4. Click OK → writes expression
        { type: 'click', target: 'okButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TimeWarp-a-tron' },
        // confirm() call when no existing slider is found
        { kind: 'confirm' },
        // setValue on In/Out Range point control ([0, 60])
        { kind: 'setValue', value: [0, 60] },
        // setExpression on the time-remap property
        { kind: 'setExpression', target: 'Time Remap' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [
        {
          targetPath: 'Time Remap',
          source: 'literal',
          parseStatus: 'ok',
        },
      ],
      expectedAlerts: [],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (b) success — pick time-remap layer, select existing slider, click OK
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'link time-remap layer to existing slider controller',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-2', name: 'Control Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Control Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 30,
            pixelAspect: 1,
            layers: [
              {
                id: 'remap-layer-2',
                index: 1,
                name: 'Video Clip',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [
                  {
                    matchName: 'ADBE Time Remapping',
                    name: 'Time Remap',
                    path: 'Time Remap',
                    propertyValueType: 'OneD',
                    value: 0,
                    canSetExpression: true,
                  },
                  {
                    matchName: 'ADBE Effect Parade',
                    name: 'Effects',
                    path: 'Effects',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 0,
                    properties: [],
                  },
                ],
              },
              {
                id: 'ctrl-layer-2',
                index: 2,
                name: 'Slider NULL',
                type: 'Null',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [
                  {
                    matchName: 'ADBE Effect Parade',
                    name: 'Effects',
                    path: 'Effects',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 1,
                    properties: [
                      {
                        matchName: 'ADBE Slider Control',
                        name: 'Slider Control',
                        path: 'Effects/Slider Control',
                        propertyValueType: 'NoValue',
                        canSetExpression: false,
                        numProperties: 1,
                        properties: [
                          {
                            matchName: 'ADBE Slider Control-0001',
                            name: 'Slider',
                            path: 'Effects/Slider Control/Slider',
                            propertyValueType: 'OneD',
                            value: 0,
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
        selection: {
          layerIds: ['remap-layer-2'],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'click', target: 'pickTimeRemapButton' },
        { type: 'selectLayers', value: ['ctrl-layer-2'] },
        // The existing slider effect is in selectedProperties
        { type: 'selectProperties', value: ['Effects/Slider Control'] },
        { type: 'click', target: 'pickControllerButton' },
        { type: 'click', target: 'okButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TimeWarp-a-tron' },
        // In/Out Range point control added + setValue
        { kind: 'setValue', value: [0, 60] },
        // setExpression on time remap
        { kind: 'setExpression', target: 'Time Remap' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [
        {
          targetPath: 'Time Remap',
          source: 'literal',
          parseStatus: 'ok',
        },
      ],
      expectedAlerts: [],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (c) guard — OK clicked without picking both layers
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'guard: OK clicked with no time-remap layer selected',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-3', name: 'Empty Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-3',
        comps: [
          {
            id: 'comp-3',
            name: 'Empty Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'plain-layer',
                index: 1,
                name: 'Plain Layer',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
            ],
          },
        ],
        selection: {
          layerIds: [],
          propertyPaths: [],
        },
      },
      // Skip the pick buttons and click OK directly → guard fires
      actions: [
        { type: 'click', target: 'okButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TimeWarp-a-tron' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: [
        'Please make sure both a Time Remapped Layer and a Controller are selected.',
      ],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (d) guard — pickTimeRemapButton with a layer that cannot set time remap
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'guard: picked layer cannot set time remapping',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-4', name: 'NoRemap Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-4',
        comps: [
          {
            id: 'comp-4',
            name: 'NoRemap Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'shape-layer-1',
                index: 1,
                name: 'Shape Layer 1',
                // Shape layers cannot have time-remapping enabled
                type: 'Shape',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
            ],
          },
        ],
        selection: {
          layerIds: ['shape-layer-1'],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'click', target: 'pickTimeRemapButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TimeWarp-a-tron' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: ['Please select a layer with Time Remapping enabled.'],
      expectedConfidence: 'medium',
    },
  ],
};

// Self-check at module load — throw immediately if fixture is malformed.
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `TimeWarp-a-tron.fixture.js is invalid:\n${check.errors.join('\n')}`
  );
}

export default fixture;
