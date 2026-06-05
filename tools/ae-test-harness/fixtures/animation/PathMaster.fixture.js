import { validateFixture } from '../../src/contracts/index.js';

/**
 * Fixture for PathMaster.jsx
 *
 * Script behaviour summary:
 *  - @ui DIALOG  (three sequential Window("dialog") panels)
 *  - Immediately calls app.beginUndoGroup("PathMaster") at script start.
 *  - Guard 1: no active comp            → alert("Please open a composition first.")
 *  - Guard 2: no selected properties   → alert("No property selected. Please select a Position property.")
 *  - Guard 3: selected prop is not ADBE Position → alert("Please select a Position property.")
 *  - Guard 4: no shape layers in comp  → alert("No shape layers found in this comp.")
 *  - Success flow:
 *      Dialog 1 – shape layer list
 *      Dialog 2 – path tree view
 *      Dialog 3 – easing / duration settings
 *      Then:
 *        selectedProp.expression = expressionStr          → setExpression
 *        posLayer("ADBE Effect Parade").addProperty(...)  → setValue (Reverse Direction checkbox name)
 *        removeExistingAnimationEasingMarkers (no-op first run)
 *        markerProp.setValueAtTime(posLayer.inPoint, newMarker) → setMarker
 *      app.endUndoGroup()
 */

// ---------------------------------------------------------------------------
// Shared ids
// ---------------------------------------------------------------------------
const COMP_ID      = 'comp-pm-01';
const SHAPE_LYR_ID = 'layer-shape-01';
const ANIM_LYR_ID  = 'layer-anim-01';

// ---------------------------------------------------------------------------
// HostSnapshot for success scenario
// Comp has:
//   - 1 shape layer ("Path Shape") with a Contents > Group 1 > Path 1 path
//   - 1 AV layer ("Animated Layer") whose Position property is selected
// ---------------------------------------------------------------------------
const successHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: COMP_ID, name: 'Scene Comp', typeName: 'Composition' }],
  },
  activeItemId: COMP_ID,
  comps: [
    {
      id: COMP_ID,
      name: 'Scene Comp',
      width: 1920,
      height: 1080,
      duration: 10,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: SHAPE_LYR_ID,
          index: 1,
          name: 'Path Shape',
          type: 'Shape',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Root Vectors Group',
              name: 'Contents',
              path: 'Path Shape/Contents',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 1,
              properties: [
                {
                  matchName: 'ADBE Vector Group',
                  name: 'Group 1',
                  path: 'Path Shape/Contents/Group 1',
                  propertyValueType: 'NoValue',
                  canSetExpression: false,
                  numProperties: 1,
                  properties: [
                    {
                      matchName: 'ADBE Vector Shape - Group',
                      name: 'Path 1',
                      path: 'Path Shape/Contents/Group 1/Path 1',
                      propertyValueType: 'Shape',
                      canSetExpression: false,
                      numProperties: 1,
                      properties: [
                        {
                          matchName: 'ADBE Vector Shape',
                          name: 'Path',
                          path: 'Path Shape/Contents/Group 1/Path 1/Path',
                          propertyValueType: 'Shape',
                          canSetExpression: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              matchName: 'ADBE Effect Parade',
              name: 'Effects',
              path: 'Path Shape/Effects',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 0,
            },
            {
              matchName: 'ADBE Marker',
              name: 'Marker',
              path: 'Path Shape/Marker',
              propertyValueType: 'NoValue',
              canSetExpression: false,
            },
          ],
        },
        {
          id: ANIM_LYR_ID,
          index: 2,
          name: 'Animated Layer',
          type: 'AV',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 10,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Animated Layer/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Position',
                  name: 'Position',
                  path: 'Animated Layer/Transform/Position',
                  propertyValueType: 'TwoD',
                  value: [960, 540],
                  canSetExpression: true,
                },
              ],
            },
            {
              matchName: 'ADBE Effect Parade',
              name: 'Effects',
              path: 'Animated Layer/Effects',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 0,
            },
            {
              matchName: 'ADBE Marker',
              name: 'Marker',
              path: 'Animated Layer/Marker',
              propertyValueType: 'NoValue',
              canSetExpression: false,
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: [ANIM_LYR_ID],
    propertyPaths: ['Animated Layer/Transform/Position'],
  },
};

// ---------------------------------------------------------------------------
// HostSnapshot for guard – no active comp
// ---------------------------------------------------------------------------
const guardNoCompHost = {
  appVersion: '22.0',
  project: { items: [] },
  activeItemId: null,
  comps: [],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot for guard – no selected property
// ---------------------------------------------------------------------------
const guardNoPropHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-pm-02', name: 'Empty Sel Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-pm-02',
  comps: [
    {
      id: 'comp-pm-02',
      name: 'Empty Sel Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-np-01',
          index: 1,
          name: 'Null 1',
          type: 'Null',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [],
        },
      ],
    },
  ],
  selection: { layerIds: [], propertyPaths: [] },
};

// ---------------------------------------------------------------------------
// HostSnapshot for guard – wrong property selected (Opacity, not Position)
// ---------------------------------------------------------------------------
const guardWrongPropHost = {
  appVersion: '22.0',
  project: {
    items: [{ id: 'comp-pm-03', name: 'Wrong Prop Comp', typeName: 'Composition' }],
  },
  activeItemId: 'comp-pm-03',
  comps: [
    {
      id: 'comp-pm-03',
      name: 'Wrong Prop Comp',
      width: 1920,
      height: 1080,
      duration: 5,
      frameRate: 24,
      pixelAspect: 1,
      layers: [
        {
          id: 'layer-wp-01',
          index: 1,
          name: 'Null 2',
          type: 'Null',
          threeDLayer: false,
          parentId: null,
          inPoint: 0,
          outPoint: 5,
          properties: [
            {
              matchName: 'ADBE Transform Group',
              name: 'Transform',
              path: 'Null 2/Transform',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              numProperties: 5,
              properties: [
                {
                  matchName: 'ADBE Opacity',
                  name: 'Opacity',
                  path: 'Null 2/Transform/Opacity',
                  propertyValueType: 'OneD',
                  value: 100,
                  canSetExpression: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  selection: {
    layerIds: ['layer-wp-01'],
    propertyPaths: ['Null 2/Transform/Opacity'],
  },
};

// ---------------------------------------------------------------------------
// Fixture definition
// ---------------------------------------------------------------------------

/** @type {import('../../src/contracts/index.js').Fixture} */
const fixture = {
  script: {
    name: 'PathMaster',
    category: 'animation',
    relPath: 'animation/PathMaster.jsx',
    ui: true,
  },
  scenarios: [
    // ------------------------------------------------------------------
    // (a) SUCCESS
    //     Walk through all three dialogs; confirm.
    //     Expected operations:
    //       beginUndoGroup("PathMaster")
    //       setExpression on Position
    //       setValue (Reverse Direction checkbox name assignment)
    //       setMarker on the layer (Animation Easing marker)
    //       endUndoGroup
    // ------------------------------------------------------------------
    {
      name: 'success – animate along shape path with ease-in-out',
      kind: 'success',
      host: successHost,
      // Modeled user flow across the three sequential MODAL dialogs: pick the
      // shape layer, pick "Path 1", choose Ease-In-Out + 48 frames, confirm each.
      //
      // KNOWN HOST GAP (shared scriptui root — not a fixture issue): PathMaster's
      // first dialog builds its listbox with the items array passed POSITIONALLY
      // — `layerDialog.add("listbox", undefined, shapeLayerNames, {multiselect:false})`
      // (and the easing dropdown likewise: `add("dropdownlist", undefined, [...])`).
      // The runtime's Control.add() only ingests list items from a `props.items`
      // array (4th arg); it ignores a positional items array (3rd arg), so the
      // listbox is created EMPTY. The script's modal show() therefore leaves
      // `layerList.selection` null and returns at the guard
      // `if (layerDialog.show() !== 1 || !layerList.selection) return;` — after
      // only beginUndoGroup("PathMaster") has fired. The expectedOperations below
      // describe the GENUINE standalone-AE success path; the harness cannot reach
      // it until the scriptui root populates list items from the positional
      // (3rd-arg) array form of add().
      actions: [
        // Dialog 1: shape layer list — select "Path Shape" (index 0).
        { type: 'select', target: 'layerList', value: 0 },
        { type: 'click', target: 'OK' },
        // Dialog 2: path tree — select "Path 1".
        { type: 'select', target: 'treeView', value: 'Path 1' },
        { type: 'click', target: 'OK' },
        // Dialog 3: easing dropdown (pick Ease-In-Out index 1), duration 48 frames
        // (durationInput defaults to text "60", so it resolves by text).
        { type: 'select', target: 'easingDropdown', value: 1 },
        { type: 'change', target: '60', value: '48' },
        { type: 'click', target: 'OK' },
        { type: 'run' },
      ],
      expectedOperations: [
        { kind: 'beginUndoGroup', target: 'PathMaster' },
        // expression written to selected Position property
        { kind: 'setExpression', target: 'Animated Layer/Transform/Position' },
        // NOTE: the "Reverse Direction" setValue only fires when the reverse
        // checkbox is toggled; this ease-in-out scenario leaves it unchecked, so
        // the script genuinely produces no plain setValue here (it uses
        // setValueAtTime/addKeyframe for the marker keyframe instead).
        // Animation Easing marker added to same layer
        { kind: 'setMarker', target: 'Animated Layer' },
        { kind: 'endUndoGroup' },
      ],
      expectedExpressions: [
        {
          targetPath: 'Animated Layer/Transform/Position',
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
      expectedAlerts: ['Please open a composition first.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (c) GUARD — no selected property
    // ------------------------------------------------------------------
    {
      name: 'guard – no property selected',
      kind: 'guard',
      host: guardNoPropHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['No property selected. Please select a Position property.'],
      expectedConfidence: 'high',
    },

    // ------------------------------------------------------------------
    // (d) GUARD — wrong property type selected (not ADBE Position)
    // ------------------------------------------------------------------
    {
      name: 'guard – selected property is not Position',
      kind: 'guard',
      host: guardWrongPropHost,
      actions: [{ type: 'run' }],
      expectedOperations: [],
      expectedAlerts: ['Please select a Position property.'],
      expectedConfidence: 'high',
    },
  ],
};

// Self-check at module load
const _check = validateFixture(fixture);
if (!_check.ok) {
  throw new Error('PathMaster.fixture.js failed self-validation:\n' + _check.errors.join('\n'));
}

export default fixture;
