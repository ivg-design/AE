/**
 * Fixture for Guiderator.jsx
 *
 * Guiderator is a dockable PANEL script that adds horizontal or vertical guides
 * to the active composition via comp.addGuide(). It has no #include directives.
 * Guards fire when no composition is active, or the input field is empty/non-numeric.
 *
 * Because addGuide() is a CompItem method not present in OPERATION_KINDS, the
 * harness cannot intercept it as a named operation — the functional scenario
 * confidence is 'low'. Guard-only alert behavior is verifiable.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Guiderator',
    category: 'composition',
    relPath: 'composition/Guiderator.jsx',
    ui: true,
  },

  scenarios: [
    // ------------------------------------------------------------------
    // SUCCESS — user enters "540", clicks the H button
    // The script calls comp.addGuide(0, 540). addGuide is not in
    // OPERATION_KINDS so we can only assert the surrounding undo group ops.
    // ------------------------------------------------------------------
    {
      name: 'success — add horizontal guide at 540',
      kind: 'success',
      host: {
        appVersion: '24.0',
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
            frameRate: 30,
            pixelAspect: 1,
            layers: [],
          },
        ],
        selection: { layerIds: [], propertyPaths: [] },
      },
      // The edittext control is unnamed (the script never assigns .name/.text),
      // so it is targeted by its empty visible text (""); the "H" button is
      // targeted by its visible label. Clicking H fires addGuide(true), which
      // wraps comp.addGuide() in a begin/endUndoGroup. addGuide() itself is not
      // an OPERATION_KIND, so only the surrounding undo group is asserted.
      actions: [
        { type: 'change', target: '', value: '540' },
        { type: 'click', target: 'H' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'low',
    },

    // ------------------------------------------------------------------
    // SUCCESS — expression evaluated: "1920/2" → 960, click V
    // ------------------------------------------------------------------
    {
      name: 'success — add vertical guide via expression 1920/2',
      kind: 'success',
      host: {
        appVersion: '24.0',
        project: {
          items: [{ id: 'comp-2', name: 'Social Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Social Comp',
            width: 1920,
            height: 1080,
            duration: 5,
            frameRate: 60,
            pixelAspect: 1,
            layers: [],
          },
        ],
        selection: { layerIds: [], propertyPaths: [] },
      },
      // Unnamed edittext targeted by empty visible text (""); "V" button by label.
      actions: [
        { type: 'change', target: '', value: '1920/2' },
        { type: 'click', target: 'V' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        { kind: 'endUndoGroup' },
      ],
      expectedConfidence: 'low',
    },

    // ------------------------------------------------------------------
    // GUARD — no active composition → alert "Please select a composition."
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
      actions: [
        { type: 'change', target: '', value: '540' },
        { type: 'click', target: 'H' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'alert' },
      ],
      expectedAlerts: ['Please select a composition.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // GUARD — empty input → alert "Please enter a value."
    // ------------------------------------------------------------------
    {
      name: 'guard — empty input field',
      kind: 'guard',
      host: {
        appVersion: '24.0',
        project: {
          items: [{ id: 'comp-3', name: 'Test Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-3',
        comps: [
          {
            id: 'comp-3',
            name: 'Test Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 30,
            pixelAspect: 1,
            layers: [],
          },
        ],
        selection: { layerIds: [], propertyPaths: [] },
      },
      actions: [
        { type: 'change', target: '', value: '' },
        { type: 'click', target: 'H' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'alert' },
      ],
      expectedAlerts: ['Please enter a value.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const validation = validateFixture(fixture);
if (!validation.ok) {
  throw new Error(`Guiderator.fixture.js failed validation:\n${validation.errors.join('\n')}`);
}

export default fixture;
