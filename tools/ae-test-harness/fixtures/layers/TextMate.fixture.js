/**
 * TextMate fixture — text highlighting animator scenarios.
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (Window "dialog" — created inside main() after guard checks)
 *  - Guards (alerts + early return, no UI shown) if:
 *      • No active CompItem
 *      • selectedLayers.length !== 1
 *      • Selected layer has no 'Source Text' property
 *  - Shows dialog with an edittext for the search term plus OK / Cancel.
 *  - On OK with a non-empty term:
 *      • Searches fullText for all occurrences (case-sensitive, CR-adjusted)
 *      • If none found → alert("No instances of '…' were found.") + return
 *      • Otherwise:
 *          – Adds a text animator via animators.addProperty('ADBE Text Animator')
 *            → name set to 'Highlight Animator (<term>)'
 *          – Adds fill-color property and calls setValue([r,g,b])
 *          – For each match: addProperty('ADBE Text Selector'), setValue(2) on units,
 *            setValue(start) on startProp, setValue(end) on endProp
 *          – alert('Found N instance(s) of …')
 *      • endUndoGroup()
 *  - No file writes, no keyframes, no expressions.
 *  - beginUndoGroup at the very top of main(), endUndoGroup at the end.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'TextMate',
    category: 'layers',
    relPath: 'layers/TextMate.jsx',
    ui: true,
  },

  scenarios: [
    // ─────────────────────────────────────────────────────────────────────────
    // (a) success — one text layer selected, search term found (2 occurrences)
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'highlight two occurrences of search term',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-1', name: 'Text Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-1',
        comps: [
          {
            id: 'comp-1',
            name: 'Text Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'text-layer-1',
                index: 1,
                name: 'Title Text',
                type: 'Text',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [
                  // AE-faithful: Source Text is reachable directly on a text
                  // layer via `layer.property('Source Text')` (the shortcut the
                  // script uses), so it is also exposed at the layer's top level.
                  {
                    matchName: 'ADBE Text Document',
                    name: 'Source Text',
                    path: 'Source Text',
                    propertyValueType: 'CustomValue',
                    value: { text: 'Hello world, Hello AE' },
                    canSetExpression: true,
                  },
                  {
                    matchName: 'ADBE Text Properties',
                    name: 'Text',
                    path: 'Text',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 2,
                    properties: [
                      {
                        matchName: 'ADBE Text Document',
                        name: 'Source Text',
                        path: 'Text/Source Text',
                        propertyValueType: 'CustomValue',
                        value: { text: 'Hello world, Hello AE' },
                        canSetExpression: true,
                      },
                      {
                        matchName: 'ADBE Text Animators',
                        name: 'Animators',
                        path: 'Text/Animators',
                        propertyValueType: 'NoValue',
                        canSetExpression: false,
                        numProperties: 0,
                        properties: [],
                      },
                    ],
                  },
                ],
                // media decorator reads the TextDocument from text.sourceText
                text: { sourceText: { text: 'Hello world, Hello AE' } },
              },
            ],
          },
        ],
        selection: {
          layerIds: ['text-layer-1'],
          propertyPaths: [],
        },
      },
      actions: [
        // Dialog appears; type search term and click OK
        { type: 'type', target: 'textInput', value: 'Hello' },
        { type: 'click', target: 'okButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TextMate' },
        // Animator name set
        { kind: 'setValue', target: 'Text/Animators/Highlight Animator (Hello)/name' },
        // Fill color setValue
        { kind: 'setValue' },
        // First range selector — units + start + end
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        // Second range selector — units + start + end
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'setValue' },
        { kind: 'alert' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [],
      expectedAlerts: ["Found 2 instance(s) of 'Hello'."],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (b) success — search term not found in text
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'search term not found in text layer',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-2', name: 'Short Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-2',
        comps: [
          {
            id: 'comp-2',
            name: 'Short Comp',
            width: 1920,
            height: 1080,
            duration: 5,
            frameRate: 30,
            pixelAspect: 1,
            layers: [
              {
                id: 'text-layer-2',
                index: 1,
                name: 'Subtitle',
                type: 'Text',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 5,
                properties: [
                  {
                    // AE-faithful direct shortcut: layer.property('Source Text').
                    matchName: 'ADBE Text Document',
                    name: 'Source Text',
                    path: 'Source Text',
                    propertyValueType: 'CustomValue',
                    value: { text: 'Goodbye cruel world' },
                    canSetExpression: true,
                  },
                  {
                    matchName: 'ADBE Text Properties',
                    name: 'Text',
                    path: 'Text',
                    propertyValueType: 'NoValue',
                    canSetExpression: false,
                    numProperties: 2,
                    properties: [
                      {
                        matchName: 'ADBE Text Document',
                        name: 'Source Text',
                        path: 'Text/Source Text',
                        propertyValueType: 'CustomValue',
                        value: { text: 'Goodbye cruel world' },
                        canSetExpression: true,
                      },
                      {
                        matchName: 'ADBE Text Animators',
                        name: 'Animators',
                        path: 'Text/Animators',
                        propertyValueType: 'NoValue',
                        canSetExpression: false,
                        numProperties: 0,
                        properties: [],
                      },
                    ],
                  },
                ],
                text: { sourceText: { text: 'Goodbye cruel world' } },
              },
            ],
          },
        ],
        selection: {
          layerIds: ['text-layer-2'],
          propertyPaths: [],
        },
      },
      actions: [
        { type: 'type', target: 'textInput', value: 'Hello' },
        { type: 'click', target: 'okButton' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TextMate' },
        { kind: 'alert' },
        // endUndoGroup is NOT reached because the function returns early
      ],
      expectedExpressions: [],
      expectedAlerts: ["No instances of 'Hello' were found."],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (c) guard — no active composition
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
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TextMate' },
        { kind: 'alert' },
      ],
      expectedExpressions: [],
      expectedAlerts: ['Please open and select a composition.'],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (d) guard — zero layers selected
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'guard: no layers selected',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-3', name: 'Empty Sel Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-3',
        comps: [
          {
            id: 'comp-3',
            name: 'Empty Sel Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'text-layer-3',
                index: 1,
                name: 'Some Text',
                type: 'Text',
                threeDLayer: false,
                parentId: null,
                inPoint: 0,
                outPoint: 10,
                properties: [],
                text: { text: 'Some text content' },
              },
            ],
          },
        ],
        selection: {
          layerIds: [],
          propertyPaths: [],
        },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TextMate' },
        { kind: 'alert' },
      ],
      expectedExpressions: [],
      expectedAlerts: ['Please select exactly one text layer.'],
      expectedConfidence: 'medium',
    },

    // ─────────────────────────────────────────────────────────────────────────
    // (e) guard — non-text layer selected (no Source Text property)
    // ─────────────────────────────────────────────────────────────────────────
    {
      name: 'guard: selected layer has no Source Text property',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: [{ id: 'comp-4', name: 'AV Comp', typeName: 'Composition' }],
        },
        activeItemId: 'comp-4',
        comps: [
          {
            id: 'comp-4',
            name: 'AV Comp',
            width: 1920,
            height: 1080,
            duration: 10,
            frameRate: 24,
            pixelAspect: 1,
            layers: [
              {
                id: 'av-layer-1',
                index: 1,
                name: 'Video Layer',
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
          layerIds: ['av-layer-1'],
          propertyPaths: [],
        },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'TextMate' },
        { kind: 'alert' },
      ],
      expectedExpressions: [],
      expectedAlerts: ['The selected layer does not have a Source Text property.'],
      expectedConfidence: 'medium',
    },
  ],
};

// Self-check at module load — throw immediately if fixture is malformed.
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `TextMate.fixture.js is invalid:\n${check.errors.join('\n')}`
  );
}

export default fixture;
