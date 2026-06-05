import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildProperties,
  buildProperty,
  selectedProperties
} from '../src/host/properties/index.js';
import { OPERATION_KINDS, validateOperation } from '../src/contracts/index.js';

/** Minimal Transform-like PropertyDef tree used across tests. */
function makeTransformDefs() {
  return [
    {
      matchName: 'ADBE Transform Group',
      name: 'Transform',
      path: 'Transform',
      propertyValueType: 'NoValue',
      canSetExpression: false,
      properties: [
        {
          matchName: 'ADBE Position',
          name: 'Position',
          path: 'Transform/Position',
          propertyValueType: 'ThreeD',
          value: [100, 200, 0],
          canSetExpression: true
        },
        {
          matchName: 'ADBE Opacity',
          name: 'Opacity',
          path: 'Transform/Opacity',
          propertyValueType: 'OneD',
          value: 100,
          canSetExpression: true,
          keyframes: [{ time: 0, value: 0 }]
        }
      ]
    }
  ];
}

describe('buildProperties — tree + traversal', () => {
  let ctx;
  let root;

  beforeEach(() => {
    ctx = { log: [] };
    root = buildProperties(makeTransformDefs(), ctx);
  });

  it('builds a root group exposing top-level properties', () => {
    expect(root.isPropertyGroup).toBe(true);
    expect(root.numProperties).toBe(1);
    const transform = root.property('Transform');
    expect(transform).toBeTruthy();
    expect(transform.matchName).toBe('ADBE Transform Group');
    expect(transform.numProperties).toBe(2);
  });

  it('traverses by 1-based index like AE', () => {
    const transform = root.property(1);
    expect(transform.name).toBe('Transform');
    const position = transform.property(1);
    expect(position.name).toBe('Position');
    const opacity = transform.property(2);
    expect(opacity.name).toBe('Opacity');
    // out-of-range -> null
    expect(transform.property(3)).toBeNull();
  });

  it('traverses by name and matchName', () => {
    const transform = root.property('Transform');
    expect(transform.property('Opacity').name).toBe('Opacity');
    expect(transform.property('ADBE Position').name).toBe('Position');
    expect(transform.property('Nope')).toBeNull();
  });

  it('exposes value, propertyValueType, canSetExpression, numKeys', () => {
    const opacity = root.property('Transform').property('Opacity');
    expect(opacity.value).toBe(100);
    // After Effects exposes propertyValueType as the numeric enum code; the host
    // maps the snapshot's 'OneD' string to PropertyValueType.OneD (6417) so that
    // scripts comparing against raw AE codes (e.g. KeyBot: `=== 6417`) work.
    expect(opacity.propertyValueType).toBe(6417);
    expect(opacity.canSetExpression).toBe(true);
    expect(opacity.numKeys).toBe(1);
  });
});

describe('setValue logging', () => {
  it('logs a setValue operation and updates value', () => {
    const ctx = { log: [] };
    const root = buildProperties(makeTransformDefs(), ctx);
    const opacity = root.property('Transform').property('Opacity');

    opacity.setValue(55);

    expect(opacity.value).toBe(55);
    expect(ctx.log).toHaveLength(1);
    const op = ctx.log[0];
    expect(op.kind).toBe('setValue');
    expect(OPERATION_KINDS).toContain(op.kind);
    expect(op.target).toBe('Transform/Opacity');
    expect(op.value).toBe(55);
    expect(validateOperation(op).ok).toBe(true);
  });

  it('logs setValueAtTime + addKeyframe and increments numKeys', () => {
    const ctx = { log: [] };
    const root = buildProperties(makeTransformDefs(), ctx);
    const position = root.property('Transform').property('Position');

    const before = position.numKeys;
    position.setValueAtTime(1.5, [300, 400, 0]);

    expect(position.numKeys).toBe(before + 1);
    const kinds = ctx.log.map((o) => o.kind);
    expect(kinds).toEqual(['setValueAtTime', 'addKeyframe']);
    ctx.log.forEach((o) => expect(validateOperation(o).ok).toBe(true));
    expect(ctx.log[0].meta.time).toBe(1.5);
    // keyTime/keyValue stubs reflect the new keyframe
    expect(position.keyTime(position.numKeys)).toBe(1.5);
    expect(position.keyValue(position.numKeys)).toEqual([300, 400, 0]);
  });
});

describe('expression setter logging', () => {
  it('logs setExpression when assigning .expression', () => {
    const ctx = { log: [] };
    const root = buildProperties(makeTransformDefs(), ctx);
    const opacity = root.property('Transform').property('Opacity');

    opacity.expression = 'wiggle(2, 30)';

    expect(opacity.expression).toBe('wiggle(2, 30)');
    expect(ctx.log).toHaveLength(1);
    const op = ctx.log[0];
    expect(op.kind).toBe('setExpression');
    expect(op.target).toBe('Transform/Opacity');
    expect(op.value).toBe('wiggle(2, 30)');
    expect(validateOperation(op).ok).toBe(true);
  });

  it('reflects canSetExpression flag from def', () => {
    const ctx = { log: [] };
    const def = {
      matchName: 'ADBE Marker',
      name: 'Marker',
      path: 'Marker',
      propertyValueType: 'NoValue',
      canSetExpression: false
    };
    const prop = buildProperty(def, ctx);
    expect(prop.canSetExpression).toBe(false);
  });
});

describe('selectedProperties helper', () => {
  it('resolves propertyPaths and flags them selected', () => {
    const ctx = { log: [] };
    const root = buildProperties(makeTransformDefs(), ctx);

    const selected = selectedProperties(root, [
      'Transform/Opacity',
      'Transform/Position',
      'Transform/DoesNotExist'
    ]);

    expect(selected).toHaveLength(2);
    expect(selected.map((p) => p.name).sort()).toEqual(['Opacity', 'Position']);
    expect(selected.every((p) => p.selected === true)).toBe(true);
    // unresolved path is dropped, not flagged
    expect(root.property('Transform').selected).toBe(false);
  });

  it('returns empty array for bad inputs without throwing', () => {
    expect(selectedProperties(null, ['a/b'])).toEqual([]);
    const root = buildProperties([], { log: [] });
    expect(selectedProperties(root, null)).toEqual([]);
  });
});

describe('module importability in isolation', () => {
  it('buildProperties works with no ctx', () => {
    const root = buildProperties(makeTransformDefs());
    const opacity = root.property('Transform').property('Opacity');
    // setValue must not throw even when no log array is provided
    expect(() => opacity.setValue(10)).not.toThrow();
    expect(opacity.value).toBe(10);
  });
});
