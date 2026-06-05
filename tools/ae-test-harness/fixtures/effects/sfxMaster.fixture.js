/**
 * Fixture for sfxMaster — Centralized Audio Control System
 *
 * Script: effects/sfxMaster.jsx
 * UI: HEADLESS  (no ScriptUI; runs in an IIFE)
 *
 * What the script does:
 *   1. Guards: requires at least one item selected in the Project panel.
 *      - If nothing selected → alert("Please select at least one composition.")
 *      - If selection contains a non-CompItem → alert("Please select only compositions.")
 *   2. For each selected CompItem:
 *      a. Creates "SFX CTRL" null layer (createLayer) with position setValue.
 *      b. Adds three Slider Control effects to the null: Voice Over, Sound Effects, Music.
 *      c. Scans layers for audio (FootageItem with no video); checks for existing Stereo Mixer.
 *      d. If existing Stereo Mixer expressions found, shows confirm dialog (overwrite?).
 *      e. Applies Stereo Mixer effect (executeCommand or Effects.addProperty equivalent) to each
 *         audio layer and sets Left/Right Level expressions pointing to SFX CTRL sliders.
 *   3. Wraps everything in beginUndoGroup("Apply Stereo Mixer") / endUndoGroup().
 *
 * Note: "SFX CTRL" creation uses setValue for position and addProperty for each slider —
 * those are modeled as setValue + createLayer operations in the harness.
 *
 * Scenarios:
 *   success      — two-comp project, one comp selected that contains an audio layer with a
 *                  "music" marker; SFX CTRL is created, Stereo Mixer applied, expressions set
 *   guard-empty  — empty project selection → guard alert, zero mutations
 *   guard-noncomp — a Footage item (not a comp) is selected → guard alert, zero mutations
 */

import { validateFixture } from '../../src/contracts/index.js';

// ---------------------------------------------------------------------------
// Host snapshot helpers
// ---------------------------------------------------------------------------

/**
 * Comp with one audio-only AV layer that has a "music" marker.
 * The comp is selected in the project (app.project.selection).
 * sfxMaster reads app.project.selection, NOT app.project.activeItem,
 * so activeItemId matches the selected comp but selection.layerIds is empty
 * (layer selection is irrelevant for this script).
 */
function audioCompSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [
        { id: 'comp-1', name: 'Ad Sequence', typeName: 'Composition' },
        { id: 'footage-1', name: 'BGMusic.wav', typeName: 'Footage' }
      ]
    },
    activeItemId: 'comp-1',
    comps: [
      {
        id: 'comp-1',
        name: 'Ad Sequence',
        width: 1920,
        height: 1080,
        duration: 30,
        frameRate: 24,
        pixelAspect: 1,
        layers: [
          {
            // Audio-only layer (no video) — categorized as "Music" via marker
            id: 'layer-audio-1',
            index: 1,
            name: 'BGMusic.wav',
            type: 'AV',
            threeDLayer: false,
            parentId: null,
            inPoint: 0,
            outPoint: 30,
            markers: [
              { time: 0, comment: 'music', duration: 0 }
            ],
            source: {
              id: 'footage-1',
              hasVideo: false,
              hasAudio: true
            },
            properties: [
              {
                matchName: 'ADBE Audio Group',
                name: 'Audio',
                path: 'BGMusic.wav/Audio',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 1,
                properties: [
                  {
                    matchName: 'ADBE Audio Levels',
                    name: 'Audio Levels',
                    path: 'BGMusic.wav/Audio/Audio Levels',
                    propertyValueType: 'TwoD',
                    value: [0, 0],
                    canSetExpression: true
                  }
                ]
              },
              {
                matchName: 'ADBE Effect Parade',
                name: 'Effects',
                path: 'BGMusic.wav/Effects',
                propertyValueType: 'NoValue',
                canSetExpression: false,
                numProperties: 0,
                properties: []
              }
            ]
          }
        ]
      }
    ],
    // Project panel selection: the comp is selected in the project panel
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** No items selected in Project panel — triggers the guard */
function emptySelectionSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [{ id: 'comp-2', name: 'Empty Comp', typeName: 'Composition' }]
    },
    activeItemId: null,
    comps: [
      {
        id: 'comp-2',
        name: 'Empty Comp',
        width: 1920,
        height: 1080,
        duration: 5,
        frameRate: 24,
        pixelAspect: 1,
        layers: []
      }
    ],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

/** A Footage item selected (not a comp) — triggers the non-comp guard */
function nonCompSelectionSnapshot() {
  return {
    appVersion: '25.0',
    project: {
      items: [
        { id: 'footage-2', name: 'audio.wav', typeName: 'Footage' }
      ]
    },
    activeItemId: null,
    comps: [],
    selection: { layerIds: [], propertyPaths: [] }
  };
}

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'sfxMaster',
    category: 'effects',
    relPath: 'effects/sfxMaster.jsx',
    ui: false
  },

  scenarios: [
    // ------------------------------------------------------------------------
    // 1. SUCCESS — one comp selected, one audio layer categorized as "Music"
    // ------------------------------------------------------------------------
    {
      name: 'success — SFX CTRL created, Stereo Mixer linked to Music slider',
      kind: 'success',
      host: audioCompSnapshot(),

      actions: [
        // HEADLESS; no UI. Script reads app.project.selection which the harness
        // resolves from activeItemId. Just run it.
        { type: 'run' }
      ],

      expectedOperations: [
        // Undo group opened
        { kind: 'beginUndoGroup', value: 'Apply Stereo Mixer' },

        // "SFX CTRL" null layer added to the comp
        { kind: 'createLayer', target: 'SFX CTRL' },

        // Position of SFX CTRL set
        { kind: 'setValue', target: 'SFX CTRL/Transform/Position' },

        // Three slider effects added to SFX CTRL (modeled as setValue / createLayer internally;
        // the harness logs addProperty as a setValue on the effects group)
        { kind: 'setValue', target: 'SFX CTRL/Effects/Voice Over' },
        { kind: 'setValue', target: 'SFX CTRL/Effects/Sound Effects' },
        { kind: 'setValue', target: 'SFX CTRL/Effects/Music' },

        // Stereo Mixer applied to the audio layer (BGMusic.wav)
        { kind: 'setValue', target: 'BGMusic.wav/Effects/Stereo Mixer' },

        // Left Level expression linked to "Music" slider on SFX CTRL
        {
          kind: 'setExpression',
          target: 'BGMusic.wav/Effects/Stereo Mixer/Left Level'
        },

        // Right Level expression linked to "Music" slider on SFX CTRL
        {
          kind: 'setExpression',
          target: 'BGMusic.wav/Effects/Stereo Mixer/Right Level'
        },

        // Undo group closed
        { kind: 'endUndoGroup' }
      ],

      expectedExpressions: [
        {
          targetPath: 'BGMusic.wav/Effects/Stereo Mixer/Left Level',
          source: 'literal',
          parseStatus: 'ok'
        },
        {
          targetPath: 'BGMusic.wav/Effects/Stereo Mixer/Right Level',
          source: 'literal',
          parseStatus: 'ok'
        }
      ],

      expectedAlerts: [],

      // Stereo Mixer effect application depends on AE-only API; expression text is statically
      // verifiable. Functional confidence medium.
      expectedConfidence: 'medium'
    },

    // ------------------------------------------------------------------------
    // 2. GUARD — empty project selection
    // ------------------------------------------------------------------------
    {
      name: 'guard — no composition selected',
      kind: 'guard',
      host: emptySelectionSnapshot(),

      actions: [{ type: 'run' }],

      // Script alerts and returns immediately; undo group is begun before the check
      // but the guard returns before any mutations — no endUndoGroup in this path
      expectedOperations: [
        { kind: 'beginUndoGroup', value: 'Apply Stereo Mixer' }
      ],

      expectedAlerts: ['Please select at least one composition.'],

      expectedConfidence: 'high'
    },

    // ------------------------------------------------------------------------
    // 3. GUARD — a non-comp Footage item is selected
    // ------------------------------------------------------------------------
    {
      name: 'guard — selected item is not a composition',
      kind: 'guard',
      host: nonCompSelectionSnapshot(),

      actions: [{ type: 'run' }],

      expectedOperations: [
        { kind: 'beginUndoGroup', value: 'Apply Stereo Mixer' }
      ],

      expectedAlerts: ['Please select only compositions.'],

      expectedConfidence: 'high'
    }
  ]
};

// ---------------------------------------------------------------------------
// Self-validate at module load (throws on schema violation)
// ---------------------------------------------------------------------------
const check = validateFixture(fixture);
if (!check.ok) {
  throw new Error(
    `[sfxMaster.fixture.js] Fixture failed validation:\n  ${check.errors.join('\n  ')}`
  );
}

export default fixture;
