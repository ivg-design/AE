/**
 * OrderMaster fixture — layer/shape-group reordering scenarios.
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (Window "dialog")
 *  - Shows dialog with a "Randomize" checkbox, "Proceed" and "Cancel" buttons.
 *  - On "Proceed":
 *      • beginUndoGroup("OrderMaster")
 *      • If >1 layers selected AND contiguous → reorder (moveBefore/moveAfter per layer)
 *      • Else if exactly 1 Shape layer selected AND ≥2 contiguous shape groups selected
 *        in its selectedProperties → reorder shape groups
 *      • Else → alert("Please select contiguous layers…")
 *      • endUndoGroup()
 *  - No file writes, no expressions, no keyframes.
 *  - Reordering emits 'reorder' operations (one per layer moved).
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'OrderMaster',
    category: 'layers',
    relPath: 'layers/OrderMaster.jsx',
    ui: true,
  },

  scenarios: [
    // ─────────────────────────────────────────────────────────────────────────
    // (a) success — reverse two contiguous layers (no randomize)
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'reverse two contiguous layers',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-1', name: 'Main Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-1',
        comps: [
          {
            id: 'comp-1',
            name: 'Main Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-1',
                index: 1,
                name: 'Layer A',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
              {
                id: 'layer-2',
                index: 2,
                name: 'Layer B',
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
          layerIds: ['layer-1', 'layer-2'],
          propertyPaths: [],
        },
      },
      actions: [
        // Open dialog (script auto-shows it; harness just needs to click Proceed)
        { type: 'click', target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'OrderMaster' },
        { kind: 'reorder' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: [],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (b) success — randomize three contiguous layers
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'randomize three contiguous layers',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-2', name: 'Anim Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Anim Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-a',
                index: 1,
                name: 'Red',
                type: 'Shape',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
              {
                id: 'layer-b',
                index: 2,
                name: 'Green',
                type: 'Shape',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
              {
                id: 'layer-c',
                index: 3,
                name: 'Blue',
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
          layerIds: ['layer-a', 'layer-b', 'layer-c'],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'change', target: 'randomizeCheckbox', value: true },
        { type: 'click', target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'OrderMaster' },
        // Shuffle result is non-deterministic; at least one reorder op is expected
        { kind: 'reorder' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: [],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (c) guard — no comp open (activeItemId null)
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'guard: no active composition',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [],
        },
        activeItemId: null,
        comps: [],
        selection: {
          layerIds: [],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'click', target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'OrderMaster' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: [
        'Please select contiguous layers or contiguous shape groups within a single shape layer.',
      ],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (d) guard — non-contiguous layer selection
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'guard: non-contiguous layer selection',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-3', name: 'Gap Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-3',
        comps: [
          {
            id: 'comp-3',
            name: 'Gap Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'layer-x',
                index: 1,
                name: 'Layer X',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
              {
                id: 'layer-y',
                index: 2,
                name: 'Layer Y',
                type: 'AV',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
              },
              {
                id: 'layer-z',
                index: 3,
                name: 'Layer Z',
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
        // Layers 1 and 3 selected — gap at index 2
        selection: {
          layerIds: ['layer-x', 'layer-z'],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'click', target: 'proceedButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'OrderMaster' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: [
        'Please select contiguous layers or contiguous shape groups within a single shape layer.',
      ],
      expectedConfidence: 'medium',
    },
  ],
};

// Self-check at module load — throw immediately if fixture is malformed.
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `OrderMaster.fixture.js is invalid:\n${check.errors.join('\n')}`
  );
}

export default fixture;
