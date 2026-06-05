/**
 * Fixture for Slidotron_16x9.jsx
 *
 * HEADLESS script (no ScriptUI). Requires an active CompItem. Creates:
 *   - "Sliders 16x9" comp (3840x2160, 60fps, 600s)
 *   - "Slide 16x9" comp (3840x2160, 60fps, 600s)
 *   - Adds "Sliders 16x9" layer to the active comp with a "CTRL" Slider Control effect
 *   - Adds "Mask L" and "Mask R" shape layers to "Sliders 16x9"
 *   - Adds two "Slide 16x9" layers (track mattes), sets parent relationships
 *   - Sets expressions on Mask L and Mask R position_x referencing the CTRL slider
 *
 * Guard: fires alert "Please select a composition first" when no active CompItem.
 * Confidence: medium — comp creation and setValue calls are AE-runtime-heavy.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Slidotron_16x9',
    category: 'composition',
    relPath: 'composition/Slidotron_16x9.jsx',
    ui: false,
  },

  scenarios: [
    // ------------------------------------------------------------------
    // SUCCESS — active comp "My Project" → full slider rig built
    // ------------------------------------------------------------------
    {
      name: 'success — builds 16x9 slider rig from active comp',
      kind: 'success',
      host: {
        appVersion: '24.0',
        project: {
          items: [
            { id: 'comp-main', name: 'My Project', typeName: 'Composition' },
          ],
        },
        activeItemId: 'comp-main',
        comps: [
          {
            id: 'comp-main',
            name: 'My Project',
            width: 1920,
            height: 1080,
            duration: 30,
            frameRate: 30,
            pixelAspect: 1,
            layers: [],
          },
        ],
        selection: { layerIds: [], propertyPaths: [] },
      },
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // Slider CTRL setValue
        { kind: 'setValue', value: 116 },
        // Mask L rect size, anchor point, position_x, scale
        { kind: 'setValue' },
        // Mask R rect size, anchor point, position_x
        { kind: 'setValue' },
        // Expression on Mask L position_x
        { kind: 'setExpression' },
        // Expression on Mask R position_x
        { kind: 'setExpression' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [
        {
          targetPath: 'ADBE Transform Group/ADBE Position_0',
          source: 'literal',
          parseStatus: 'ok',
        },
      ],
      expectedConfidence: 'medium',
    },

    // ------------------------------------------------------------------
    // GUARD — no active item → alert
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
  throw new Error(`Slidotron_16x9.fixture.js failed validation:\n${validation.errors.join('\n')}`);
}

export default fixture;
