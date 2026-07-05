import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runFixtureScenario } from '../src/host/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, '../../../packages/ae-scripts/src/animation/Linearizer.jsx');

async function runLinearizer(host, targetPath) {
  const code = await readFile(scriptPath, 'utf8');
  const targetPaths = Array.isArray(targetPath) ? targetPath : [targetPath];
  const targetLayerId = host.selection.layerIds[0];
  const result = await runFixtureScenario(host, code, [
    { type: 'selectLayers', value: ['layer-driver'] },
    { type: 'selectProperties', value: ['Driver Null/Effects/Slider Control/Slider'] },
    { type: 'click', target: 'Select Driver Property' },
    { type: 'selectLayers', value: [targetLayerId] },
    { type: 'selectProperties', value: targetPaths },
    { type: 'change', target: 'Min Value', value: '0' },
    { type: 'change', target: 'Max Value', value: '100' },
    { type: 'click', target: 'Apply Linear Expression' },
    { type: 'run' }
  ]);

  if (result.error) {
    throw result.error;
  }

  const expressionOp = result.operations.find((op) => op.kind === 'setExpression' && op.target === targetPaths[0]);
  expect(expressionOp).toBeTruthy();
  const expressionOps = result.operations.filter((op) => op.kind === 'setExpression' && targetPaths.indexOf(op.target) !== -1);
  return { expression: expressionOp.value, expressionOps, operations: result.operations };
}

function driverLayer() {
  return {
    id: 'layer-driver',
    index: 1,
    name: 'Driver Null',
    type: 'Null',
    threeDLayer: false,
    parentId: null,
    inPoint: 0,
    outPoint: 10,
    properties: [
      {
        matchName: 'ADBE Effect Parade',
        name: 'Effects',
        path: 'Driver Null/Effects',
        propertyValueType: 'NoValue',
        canSetExpression: false,
        properties: [
          {
            matchName: 'ADBE Slider Control',
            name: 'Slider Control',
            path: 'Driver Null/Effects/Slider Control',
            propertyValueType: 'NoValue',
            canSetExpression: false,
            properties: [
              {
                matchName: 'ADBE Slider Control-0001',
                name: 'Slider',
                path: 'Driver Null/Effects/Slider Control/Slider',
                propertyValueType: 'OneD',
                value: 0,
                canSetExpression: true
              }
            ]
          }
        ]
      }
    ]
  };
}

function baseHost(targetLayer, targetPath) {
  return {
    appVersion: '22.0',
    project: {
      items: [{ id: 'comp-linearizer', name: 'Linearizer Comp', typeName: 'Composition' }]
    },
    activeItemId: 'comp-linearizer',
    comps: [
      {
        id: 'comp-linearizer',
        name: 'Linearizer Comp',
        width: 1920,
        height: 1080,
        duration: 10,
        frameRate: 24,
        pixelAspect: 1,
        layers: [driverLayer(), targetLayer]
      }
    ],
    selection: {
      layerIds: [targetLayer.id],
      propertyPaths: [targetPath]
    }
  };
}

describe('Linearizer regression coverage', () => {
  it('preserves HOLD keyframe segments in generated scalar expressions', async () => {
    const targetPath = 'Target Shape/Transform/Opacity';
    const targetLayer = {
      id: 'layer-target',
      index: 2,
      name: 'Target Shape',
      type: 'Shape',
      threeDLayer: false,
      parentId: null,
      inPoint: 0,
      outPoint: 10,
      properties: [
        {
          matchName: 'ADBE Transform Group',
          name: 'Transform',
          path: 'Target Shape/Transform',
          propertyValueType: 'NoValue',
          canSetExpression: false,
          properties: [
            {
              matchName: 'ADBE Opacity',
              name: 'Opacity',
              path: targetPath,
              propertyValueType: 'OneD',
              value: 0,
              canSetExpression: true,
              keyframes: [
                { time: 0, value: 0, interpolationOut: 'HOLD' },
                { time: 1, value: 100 }
              ]
            }
          ]
        }
      ]
    };

    const result = await runLinearizer(baseHost(targetLayer, targetPath), targetPath);
    const expression = result.expression;

    expect(expression).toContain('var holdSegments = [true];');
    expect(expression).toContain('holdSegments[i] && controllingValue < segmentEnd ? valueStart');
  });

  it('uses shared batch timing for staggered HOLD opacity properties', async () => {
    const targetPathA = 'Text 10/Transform/Opacity';
    const targetPathB = 'Text 20/Transform/Opacity';
    const makeLayer = (id, index, name, targetPath, start, end) => ({
      id,
      index,
      name,
      type: 'Text',
      threeDLayer: false,
      parentId: null,
      inPoint: 0,
      outPoint: 10,
      properties: [
        {
          matchName: 'ADBE Transform Group',
          name: 'Transform',
          path: `${name}/Transform`,
          propertyValueType: 'NoValue',
          canSetExpression: false,
          properties: [
            {
              matchName: 'ADBE Opacity',
              name: 'Opacity',
              path: targetPath,
              propertyValueType: 'OneD',
              value: 0,
              canSetExpression: true,
              keyframes: [
                { time: start, value: 0, interpolationOut: 'HOLD' },
                { time: end, value: 100 }
              ]
            }
          ]
        }
      ]
    });
    const layerA = makeLayer('layer-a', 2, 'Text 10', targetPathA, 0, 1);
    const layerB = makeLayer('layer-b', 3, 'Text 20', targetPathB, 2, 3);
    const host = baseHost(layerA, targetPathA);
    host.comps[0].layers.push(layerB);
    host.selection.layerIds = ['layer-a', 'layer-b'];
    host.selection.propertyPaths = [targetPathA, targetPathB];

    const result = await runLinearizer(host, [targetPathA, targetPathB]);
    expect(result.expressionOps).toHaveLength(2);
    expect(result.expressionOps[0].value).toContain('var relativeTimes = [0,0.3333333333333333];');
    expect(result.expressionOps[1].value).toContain('var relativeTimes = [0.6666666666666666,1];');
    expect(result.expressionOps[0].value).toContain('var evenTimes = [0,0.3333333333333333];');
    expect(result.expressionOps[1].value).toContain('var evenTimes = [0.6666666666666666,1];');
    expect(result.expressionOps[1].value).toContain('var mappedValue = segments[0][0][0];');
    expect(result.expressionOps[1].value).toContain('if (controllingValue > lastSegmentEnd)');
  });

  it('samples mask path keyframes from thisProperty at original key times', async () => {
    const targetPath = 'Target Layer/Masks/Mask 1/Mask Path';
    const shapeA = {
      vertices: [[0, 0], [10, 0], [10, 10]],
      inTangents: [[0, 0], [0, 0], [0, 0]],
      outTangents: [[0, 0], [0, 0], [0, 0]],
      closed: true
    };
    const shapeB = {
      vertices: [[0, 0], [20, 0], [20, 20]],
      inTangents: [[0, 0], [0, 0], [0, 0]],
      outTangents: [[0, 0], [0, 0], [0, 0]],
      closed: true
    };
    const targetLayer = {
      id: 'layer-target',
      index: 2,
      name: 'Target Layer',
      type: 'AV',
      threeDLayer: false,
      parentId: null,
      inPoint: 0,
      outPoint: 10,
      properties: [
        {
          matchName: 'ADBE Mask Parade',
          name: 'Masks',
          path: 'Target Layer/Masks',
          propertyValueType: 'NoValue',
          canSetExpression: false,
          properties: [
            {
              matchName: 'ADBE Mask Atom',
              name: 'Mask 1',
              path: 'Target Layer/Masks/Mask 1',
              propertyValueType: 'NoValue',
              canSetExpression: false,
              properties: [
                {
                  matchName: 'ADBE Mask Shape',
                  name: 'Mask Path',
                  path: targetPath,
                  propertyValueType: 'Shape',
                  value: shapeA,
                  canSetExpression: true,
                  keyframes: [
                    { time: 0, value: shapeA },
                    { time: 1, value: shapeB }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const result = await runLinearizer(baseHost(targetLayer, targetPath), targetPath);
    const expression = result.expression;

    expect(expression).not.toContain('var allKeys =');
    expect(expression).toContain('var keyTimes = [0,1];');
    expect(expression).toContain('vertices: thisProperty.points(t)');
    expect(expression).toContain('inTangents: thisProperty.inTangents(t)');
    expect(expression).toContain('outTangents: thisProperty.outTangents(t)');
    expect(expression).toContain('isClosed: thisProperty.isClosed()');
    expect(expression).toContain('createPath(result.vertices, result.inTangents, result.outTangents, result.isClosed);');
  });

  it('wraps checkbox creation and expression assignment in one undo group', async () => {
    const targetPath = 'Target Shape/Transform/Opacity';
    const targetLayer = {
      id: 'layer-target',
      index: 2,
      name: 'Target Shape',
      type: 'Shape',
      threeDLayer: false,
      parentId: null,
      inPoint: 0,
      outPoint: 10,
      properties: [
        {
          matchName: 'ADBE Transform Group',
          name: 'Transform',
          path: 'Target Shape/Transform',
          propertyValueType: 'NoValue',
          canSetExpression: false,
          properties: [
            {
              matchName: 'ADBE Opacity',
              name: 'Opacity',
              path: targetPath,
              propertyValueType: 'OneD',
              value: 0,
              canSetExpression: true,
              keyframes: [
                { time: 0, value: 0 },
                { time: 1, value: 100 }
              ]
            }
          ]
        }
      ]
    };

    const result = await runLinearizer(baseHost(targetLayer, targetPath), targetPath);
    const kinds = result.operations.map((op) => op.kind);
    const beginIndex = kinds.indexOf('beginUndoGroup');
    const checkboxIndex = result.operations.findIndex((op) => op.kind === 'setValue' && op.target.indexOf('Uniform Interpolation') !== -1);
    const expressionIndex = result.operations.findIndex((op) => op.kind === 'setExpression' && op.target === targetPath);
    const endIndex = kinds.indexOf('endUndoGroup');

    expect(beginIndex).toBeGreaterThanOrEqual(0);
    expect(checkboxIndex).toBeGreaterThan(beginIndex);
    expect(expressionIndex).toBeGreaterThan(beginIndex);
    expect(endIndex).toBeGreaterThan(expressionIndex);
  });
});
