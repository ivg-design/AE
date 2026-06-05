/**
 * Fixture for Slidotron_9x16.jsx
 *
 * HEADLESS script (no ScriptUI). Mirrors Slidotron_16x9 but for vertical 9:16 mobile format.
 * Requires an active CompItem. Creates:
 *   - "Sliders 9x16" comp (1080x1920, 60fps, 2100s)
 *   - "Slide 9x16" comp (1080x1920, 60fps, 2100s)
 *   - Adds "Sliders 9x16" layer to the active comp with a "CTRL" Slider Control set to 100
 *   - Adds "Mask L" and "Mask R" disabled shape layers to "Sliders 9x16"
 *   - Adds two "Slide 9x16" layers (track mattes), sets parent relationships
 *   - Sets expressions on Mask L and Mask R ADBE Position_0 referencing the CTRL slider
 *
 * Guard: fires alert "Please select a composition first" when no active CompItem.
 * Confidence: medium — comp creation and complex property graph are AE-runtime-heavy.
 */

import { validateFixture } from '../../src/contracts/index.js';

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'Slidotron_9x16',
    category: 'composition',
    relPath: 'composition/Slidotron_9x16.jsx',
    ui: false,
  },

  scenarios: [
    // ------------------------------------------------------------------
    // SUCCESS — active comp "Story Comp" → builds 9x16 slider rig
    // ------------------------------------------------------------------
    {
      name: 'success — builds 9x16 slider rig from active comp',
      kind: 'success',
      host: {
        appVersion: '24.0',
        project: {
          items: [
            { id: 'comp-story', name: 'Story Comp', typeName: 'Composition' },
          ],
        },
        activeItemId: 'comp-story',
        comps: [
          {
            id: 'comp-story',
            name: 'Story Comp',
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
      actions: [{ type: 'run' }],
      expectedOperations: [
        { kind: 'beginUndoGroup' },
        // CTRL slider setValue(100)
        { kind: 'setValue', value: 100 },
        // Mask L — rect size [540, 1920], anchor point, position_x 540, scale
        { kind: 'setValue' },
        // Mask R — rect size [540, 1920], anchor point, position_x 540
        { kind: 'setValue' },
        // Expression on Mask L ADBE Position_0
        { kind: 'setExpression' },
        // Expression on Mask R ADBE Position_0
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
  throw new Error(`Slidotron_9x16.fixture.js failed validation:\n${validation.errors.join('\n')}`);
}

export default fixture;
