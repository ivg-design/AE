/**
 * Test fixture for SubtitleForge.jsx
 *
 * SubtitleForge (HEADLESS, @ui false) creates a complete subtitle system inside the
 * active composition. It:
 *   1. Guards: requires an active CompItem (alerts "Please select a composition first").
 *   2. Creates a Text layer named "SUBTITLE" via comp.layers.addText().
 *   3. Sets text document properties (font, fontSize, fill, tracking, leading).
 *   4. Sets a marker via setValueAtTime on ADBE Marker.
 *   5. Applies an embedded FFX binary (subtitleControllerFFX) via applyFxFromBinary
 *      which writes to Folder.temp and calls layer.applyPreset() → fileWrite + applyPreset ops.
 *   6. Adds a Checkbox Control effect ("Enable Type On").
 *   7. Sets opacity via setValue on ADBE Opacity.
 *   8. Creates a Shape layer named "TXTBox" via comp.layers.addShape().
 *   9. Adds a rectangle group, sets size/roundness/stroke/fill, sets position.
 *  10. Calls app.executeCommand(3739) and app.executeCommand(9000) for Layer Styles / Drop Shadow.
 *  11. Sets layer style (drop shadow) properties via setValue.
 *  12. Sets multiple expressions on both layers (text document, opacity, vector paths, layer styles).
 *  13. Wraps in app.beginUndoGroup / app.endUndoGroup.
 *
 * The script has NO //@include directives — it is standalone-runnable in the sandbox
 * except that certain AE-only globals (ParagraphJustification, PropertyValueType,
 * KeyframeEase, KeyframeInterpolationType, MarkerValue) are needed. Confidence is 'medium'.
 *
 * Scenarios:
 *  1. success — active comp, no layers pre-selected; expects layer creation + operations
 *  2. guard   — no active composition; expects guard alert, zero mutating ops
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'SubtitleForge',
    category: 'layers',
    relPath: 'layers/SubtitleForge.jsx',
    ui: false
  },
  scenarios: [
    // -------------------------------------------------------------------------
    // Scenario 1: success
    // Active composition with no pre-existing layers. Script creates SUBTITLE
    // text layer and TXTBox shape layer, applies FFX preset, sets expressions,
    // runs two executeCommands, and sets many property values.
    // -------------------------------------------------------------------------
    {
      name: 'success — creates SUBTITLE text layer and TXTBox shape layer in active comp',
      kind: 'success',
      host: {
        appVersion: '25.0',
        project: {
          items: [
            { id: 'comp-sf-1', name: 'Subtitle Comp', typeName: 'Composition' }
          ]
        },
        activeItemId: 'comp-sf-1',
        comps: [
          {
            id: 'comp-sf-1',
            name: 'Subtitle Comp',
            width: 1920,
            height: 1080,
            duration: 15,
            frameRate: 24,
            pixelAspect: 1,
            layers: []
          }
        ],
        selection: {
          layerIds: [],
          propertyPaths: []
        }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        // Undo group bookends
        { kind: 'beginUndoGroup', value: 'SubtitleForge' },

        // Text layer creation
        { kind: 'createLayer', target: 'SUBTITLE' },

        // Marker set on SUBTITLE layer
        { kind: 'setMarker', target: 'SUBTITLE/ADBE Marker' },

        // Text document setValue
        { kind: 'setValue', target: 'SUBTITLE/ADBE Text Properties/ADBE Text Document' },

        // Text animator property setValues
        { kind: 'setValue', target: 'SUBTITLE/ADBE Text Properties' },

        // FFX binary written to temp folder then preset applied to SUBTITLE layer
        { kind: 'fileWrite' },
        { kind: 'applyPreset', target: 'SUBTITLE' },

        // Checkbox Control added then opacity setValue
        { kind: 'setValue', target: 'SUBTITLE/ADBE Transform Group/ADBE Opacity' },

        // Shape layer creation (TXTBox)
        { kind: 'createLayer', target: 'TXTBox' },

        // TXTBox shape property setValues: rect size, roundness, stroke color, fill color, fill opacity, anchor, position
        { kind: 'setValue', target: 'TXTBox/ADBE Root Vectors Group' },

        // executeCommands for Layer Styles
        { kind: 'executeCommand', meta: { commandId: 3739 } },
        { kind: 'executeCommand', meta: { commandId: 9000 } },

        // Drop shadow setValues on TXTBox
        { kind: 'setValue', target: 'TXTBox/ADBE Layer Styles' },

        // Expressions on SUBTITLE layer
        { kind: 'setExpression', target: 'SUBTITLE/ADBE Text Properties/ADBE Text Document' },
        { kind: 'setExpression', target: 'SUBTITLE/ADBE Transform Group/ADBE Opacity' },

        // Expressions on TXTBox layer
        { kind: 'setExpression', target: 'TXTBox/ADBE Root Vectors Group' },
        { kind: 'setExpression', target: 'TXTBox/ADBE Transform Group/ADBE Position' },
        { kind: 'setExpression', target: 'TXTBox/ADBE Transform Group/ADBE Opacity' },
        { kind: 'setExpression', target: 'TXTBox/ADBE Layer Styles' },

        // Undo group end
        { kind: 'endUndoGroup' }
      ],
      expectedExpressions: [
        {
          targetPath: 'SUBTITLE/ADBE Text Properties/ADBE Text Document',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          targetPath: 'SUBTITLE/ADBE Transform Group/ADBE Opacity',
          source: 'literal',
          expression: 'effect("Subtitle Setup")("Font Opacity")',
          parseStatus: 'ok'
        },
        {
          // TXTBox rect size expression references sourceRectAtTime — dynamic
          targetPath: 'TXTBox/ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Shape - Rect/ADBE Vector Rect Size',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          targetPath: 'TXTBox/ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Shape - Rect/ADBE Vector Rect Roundness',
          source: 'literal',
          expression: 'thisComp.layer("SUBTITLE").effect("Subtitle Setup")("Box Roundness")',
          parseStatus: 'ok'
        },
        {
          targetPath: 'TXTBox/ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Graphic - Stroke/ADBE Vector Stroke Color',
          source: 'literal',
          expression: 'thisComp.layer("SUBTITLE").effect("Subtitle Setup")("Stroke Color")',
          parseStatus: 'ok'
        },
        {
          targetPath: 'TXTBox/ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Graphic - Fill/ADBE Vector Fill Color',
          source: 'literal',
          expression: 'thisComp.layer("SUBTITLE").effect("Subtitle Setup")("Box Color")',
          parseStatus: 'ok'
        },
        {
          targetPath: 'TXTBox/ADBE Root Vectors Group/ADBE Vector Group/ADBE Vectors Group/ADBE Vector Graphic - Fill/ADBE Vector Fill Opacity',
          source: 'literal',
          expression: 'thisComp.layer("SUBTITLE").effect("Subtitle Setup")("Opacity")',
          parseStatus: 'ok'
        },
        {
          targetPath: 'TXTBox/ADBE Layer Styles/dropShadow/color',
          source: 'literal',
          expression: 'thisComp.layer("SUBTITLE").effect("Subtitle Setup")("Shadow Color")',
          parseStatus: 'ok'
        }
      ],
      expectedConfidence: 'medium'
    },

    // -------------------------------------------------------------------------
    // Scenario 2: guard — no active composition
    // Script checks activeItem instanceof CompItem; if missing, alerts and returns.
    // -------------------------------------------------------------------------
    {
      name: 'guard — no active composition alerts and exits without mutations',
      kind: 'guard',
      host: {
        appVersion: '25.0',
        project: {
          items: []
        },
        activeItemId: null,
        comps: [],
        selection: {
          layerIds: [],
          propertyPaths: []
        }
      },
      actions: [
        { type: 'run' }
      ],
      expectedOperations: [
        { kind: 'alert' }
      ],
      expectedAlerts: ['Please select a composition first'],
      expectedConfidence: 'medium'
    }
  ]
};

// Self-check at module load — throw if the fixture is invalid.
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `SubtitleForge.fixture.js failed self-validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
