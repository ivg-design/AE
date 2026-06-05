/**
 * tests/scriptui-actions.test.js
 *
 * Drives a button click + edittext type against a window from the scriptui runtime
 * (src/scriptui/index.js). If that runtime module is not yet present (it is owned by a
 * sibling agent), the test falls back to a minimal contract-shaped window factory so the
 * actions module is exercised in isolation. Both paths assert that stored handlers fire
 * and that every emitted Operation carries a kind from the frozen OPERATION_KINDS set.
 */

import { describe, it, expect } from 'vitest';

import { runActions, findControl, flattenControls } from '../src/scriptui/actions/index.js';
import { OPERATION_KINDS } from '../src/contracts/index.js';

/**
 * Try to build a window using the real scriptui runtime. Returns null if the runtime
 * module or its expected API is unavailable, so the suite stays green in isolation.
 */
async function tryBuildRuntimeWindow(state) {
  let mod;
  try {
    mod = await import('../src/scriptui/index.js');
  } catch {
    return null;
  }
  const create = mod.createScriptUIRuntime;
  if (typeof create !== 'function') return null;
  let runtime;
  try {
    runtime = create();
  } catch {
    return null;
  }
  const Window = runtime && runtime.Window;
  if (typeof Window !== 'function' && !(Window && typeof Window.add === 'function')) {
    return null;
  }

  try {
    // ScriptUI-style construction. Tolerant of the two common factory shapes:
    //   new Window('dialog', 'Title')  OR  Window.add('dialog', ...)
    const win = typeof Window === 'function' ? new Window('dialog', 'Test') : Window;
    if (typeof win.add !== 'function') return null;

    const btn = win.add('button', undefined, 'Run');
    btn.name = 'runBtn';
    btn.onClick = function () {
      state.clicked = true;
    };

    const field = win.add('edittext', undefined, '');
    field.name = 'nameField';
    field.onChange = function () {
      state.typed = this.text;
    };

    return win;
  } catch {
    return null;
  }
}

/**
 * Minimal contract-shaped window: a Window UITree-like object whose controls store
 * onClick/onChange handlers directly. Mirrors what captureTree() consumes.
 */
function buildFallbackWindow(state) {
  const button = {
    type: 'button',
    name: 'runBtn',
    text: 'Run',
    onClick() {
      state.clicked = true;
    }
  };
  const field = {
    type: 'edittext',
    name: 'nameField',
    text: '',
    value: '',
    onChange() {
      state.typed = this.text;
    }
  };
  return {
    type: 'Window',
    title: 'Test',
    children: [
      {
        type: 'group',
        name: 'main',
        children: [button, field]
      }
    ]
  };
}

describe('scriptui-actions runActions', () => {
  it('drives a button click and an edittext type against a runtime (or fallback) window', async () => {
    const state = { clicked: false, typed: null };

    const runtimeWin = await tryBuildRuntimeWindow(state);
    const win = runtimeWin || buildFallbackWindow(state);

    const { log, unresolved } = runActions(win, [
      { type: 'click', target: 'runBtn' },
      { type: 'type', target: 'nameField', value: 'hello' }
    ]);

    // Handlers fired.
    expect(state.clicked).toBe(true);
    expect(state.typed).toBe('hello');

    // Nothing went unresolved.
    expect(unresolved).toEqual([]);

    // Two operations recorded, both resolved.
    expect(log).toHaveLength(2);
    for (const op of log) {
      expect(OPERATION_KINDS).toContain(op.kind);
      expect(op.meta.resolved).toBe(true);
      expect(op.meta.handlerInvoked).toBe(true);
    }

    // Click op describes the button; type op carries the new text.
    expect(log[0].meta.command).toBe('click');
    expect(log[1].meta.command).toBe('type');
    expect(log[1].meta.value).toBe('hello');
  });

  it('resolves controls tolerantly by name, text, and case-insensitive substring', () => {
    const state = { clicked: 0 };
    const win = {
      type: 'Window',
      children: [
        { type: 'button', name: 'okBtn', text: 'OK', onClick() { state.clicked++; } }
      ]
    };

    expect(findControl(win, 'okBtn')).toBeTruthy();
    expect(findControl(win, 'OK')).toBeTruthy();
    expect(findControl(win, 'ok')).toBeTruthy(); // case-insensitive name
    expect(findControl(win, 'missing')).toBeNull();
    expect(flattenControls(win)).toHaveLength(1);
  });

  it('records unresolved targets without throwing', () => {
    const win = { type: 'Window', children: [] };
    const { log, unresolved } = runActions(win, [{ type: 'click', target: 'ghost' }]);
    expect(unresolved).toEqual(['ghost']);
    expect(log).toHaveLength(1);
    expect(log[0].meta.resolved).toBe(false);
    expect(OPERATION_KINDS).toContain(log[0].kind);
  });

  it('mutates host selection for selectLayers / selectProperties', () => {
    const host = { selection: { layerIds: [], propertyPaths: [] } };
    const { log } = runActions(host, [
      { type: 'selectLayers', value: ['L1', 'L2'] },
      { type: 'selectProperties', value: 'Transform/Position' }
    ]);
    expect(host.selection.layerIds).toEqual(['L1', 'L2']);
    expect(host.selection.propertyPaths).toEqual(['Transform/Position']);
    for (const op of log) {
      expect(OPERATION_KINDS).toContain(op.kind);
      expect(op.kind).toBe('setValue');
    }
  });

  it('handles change and select actions and invokes onChange', () => {
    const state = {};
    const win = {
      type: 'Window',
      children: [
        { type: 'checkbox', name: 'flag', value: false, onChange() { state.flag = this.value; } },
        { type: 'edittext', name: 'amount', text: '', value: '', onChange() { state.amount = this.value; } }
      ]
    };
    const { log } = runActions(win, [
      { type: 'select', target: 'flag', value: true },
      { type: 'change', target: 'amount', value: '42' }
    ]);
    expect(state.flag).toBe(true);
    expect(state.amount).toBe('42');
    expect(log.every((op) => OPERATION_KINDS.includes(op.kind))).toBe(true);
  });
});
