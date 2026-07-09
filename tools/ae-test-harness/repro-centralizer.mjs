// Reproduce bug #1: Centralizer on a shape whose GROUP has an offset transform.
// The group is offset by Position[200,100] - Anchor[0,0] = [200,100]. A rect of
// size 100x100 sits at Rect Position [0,0] inside that group. Correct layer-space
// bbox = [150..250] x [50..150]; centered-as-if-no-offset (the bug) = [-50..50].
// Centralizer calls layerToComp([x,y]) for the box corners, logging setExpression
// with "toComp([x, y])" — we parse those coords back out.
import { readFileSync } from 'node:fs';
import { runFixtureScenario } from './src/index.js';

const code = readFileSync(
  '/Users/ivg/github/ae-script-catalog/ae/packages/ae-scripts/src/paths/Centralizer.jsx',
  'utf8'
);

function twoD(matchName, name, value) {
  return { matchName, name, path: name, propertyValueType: 'TwoD', value, canSetExpression: true };
}

// leaf variants -----------------------------------------------------------
function rectLeaf(w, h) {
  return {
    matchName: 'ADBE Vector Shape - Rect', name: 'Rectangle Path 1',
    path: 'x', propertyValueType: 'NoValue', canSetExpression: false,
    properties: [
      twoD('ADBE Vector Rect Position', 'Position', [0, 0]),
      twoD('ADBE Vector Rect Size', 'Size', [w || 100, h || 100]),
    ]
  };
}
// A realistic AE group transform always has all sub-properties.
function gT(pos, anchor, scale, rot) {
  return [
    twoD('ADBE Vector Anchor Point', 'Anchor Point', anchor || [0, 0]),
    twoD('ADBE Vector Position', 'Position', pos || [0, 0]),
    twoD('ADBE Vector Scale', 'Scale', scale || [100, 100]),
    { matchName: 'ADBE Vector Rotation', name: 'Rotation', path: 'rot', propertyValueType: 'OneD', value: (rot || 0), canSetExpression: true },
  ];
}
function pathLeaf() {
  // bezier square [-50..50], vertices baked in a Shape value
  return {
    matchName: 'ADBE Vector Shape - Group', name: 'Path 1',
    path: 'x', propertyValueType: 'NoValue', canSetExpression: false,
    properties: [{
      matchName: 'ADBE Vector Shape', name: 'Path', path: 'x/Path',
      propertyValueType: 'Shape', canSetExpression: false,
      value: { vertices: [[-50, -50], [50, -50], [50, 50], [-50, 50]], inTangents: [], outTangents: [], closed: true }
    }]
  };
}

function buildHost(leaf, groupTransformProps) {
  return {
    appVersion: '25.0',
    project: { items: [{ id: 'comp-1', name: 'Main', typeName: 'Composition' }] },
    activeItemId: 'comp-1',
    comps: [{
      id: 'comp-1', name: 'Main', width: 1920, height: 1080, duration: 5, frameRate: 24, pixelAspect: 1,
      layers: [{
        id: 'layer-1', index: 1, name: 'Shape 1', type: 'Shape', threeDLayer: false, parentId: null,
        inPoint: 0, outPoint: 5,
        properties: [
          {
            matchName: 'ADBE Transform Group', name: 'Transform', path: 'Transform',
            propertyValueType: 'NoValue', canSetExpression: false,
            properties: [
              twoD('ADBE Position', 'Position', [960, 540]),
              twoD('ADBE Anchor Point', 'Anchor Point', [0, 0]),
              twoD('ADBE Scale', 'Scale', [100, 100]),
            ]
          },
          {
            matchName: 'ADBE Root Vectors Group', name: 'Contents', path: 'Contents',
            propertyValueType: 'NoValue', canSetExpression: false, numProperties: 1,
            properties: [{
              matchName: 'ADBE Vector Group', name: 'Group 1', path: 'Contents/Group 1',
              propertyValueType: 'NoValue', canSetExpression: false, numProperties: 2,
              properties: [
                {
                  matchName: 'ADBE Vectors Group', name: 'Contents', path: 'Contents/Group 1/Contents',
                  propertyValueType: 'NoValue', canSetExpression: false, numProperties: 1,
                  properties: [leaf]
                },
                {
                  matchName: 'ADBE Vector Transform Group', name: 'Transform: Group 1',
                  path: 'Contents/Group 1/Transform: Group 1',
                  propertyValueType: 'NoValue', canSetExpression: false,
                  properties: groupTransformProps
                }
              ]
            }]
          }
        ]
      }]
    }],
    selection: { layerIds: ['layer-1'], propertyPaths: [] }
  };
}

const actions = [
  { type: 'select', target: 'BoundingBox', value: true },
  { type: 'select', target: 'Center', value: false },
  { type: 'click', target: 'Proceed' }
];

async function run(label, host, expected) {
  const res = await runFixtureScenario(host, code, actions);
  const ops = res.operations || [];
  for (const o of ops) if (o.kind === 'alert') console.log(`  [${label}] ALERT:`, o.value || (o.meta && o.meta.message));
  const g = ops.filter(o => (o.meta && o.meta.command === 'addGuide') || o.kind === 'addGuide')
    .map(o => ({ ori: o.meta && o.meta.orientationType, v: o.value }));
  // first 4 guides = box: V minX, V maxX, H minY, H maxY
  const box = g.slice(0, 4).map(x => x.v);
  console.log(`  [${label}] box[minX,maxX,minY,maxY] = ${JSON.stringify(box)}   expected ${JSON.stringify(expected)}  ${JSON.stringify(box) === JSON.stringify(expected) ? 'OK' : '❌ MISMATCH'}`);
}

console.log('Centralizer bounding box across group transforms:');
// translation only
await run('rect, pos[200,100] scale100 rot0', buildHost(rectLeaf(), gT([200, 100], [0, 0])), [150, 250, 50, 150]);
await run('path, pos[200,100] scale100 rot0', buildHost(pathLeaf(), gT([200, 100], [0, 0])), [150, 250, 50, 150]);
// anchor offset + matching position (net zero) — box stays centered
await run('rect, anchor[50,50] pos[50,50] (net 0)', buildHost(rectLeaf(), gT([50, 50], [50, 50])), [-50, 50, -50, 50]);
// SCALE 50% at offset -> 50x50 box centered at [200,100] = [175,225,75,125]
await run('rect, pos[200,100] SCALE 50%', buildHost(rectLeaf(), gT([200, 100], [0, 0], [50, 50])), [175, 225, 75, 125]);
// SCALE 50% WITH anchor offset [50,50], pos[50,50]: corners map via [50,50]+0.5*(P-[50,50])
//  P=[-50,-50]->[0,0]; P=[50,50]->[50,50] => box [0,50]x[0,50]
await run('rect, anchor[50,50] pos[50,50] SCALE 50%', buildHost(rectLeaf(), gT([50, 50], [50, 50], [50, 50])), [0, 50, 0, 50]);
// ROTATION 90 of a 100x40 rect at pos[200,100] -> becomes 40 wide x 100 tall
await run('rect100x40, pos[200,100] ROT 90', buildHost(rectLeaf(100, 40), gT([200, 100], [0, 0], [100, 100], 90)), [180, 220, 50, 150]);
