import { describe, it, expect } from 'vitest';
import { createScriptUIRuntime } from '../src/scriptui/index.js';
import { validateUITree } from '../src/contracts/index.js';

describe('scriptui runtime', () => {
  it('builds a window control tree and captures it as a valid UITree', () => {
    const { Window, captureTree } = createScriptUIRuntime();

    const win = new Window('dialog', 'My Dialog', [0, 0, 300, 200]);
    const panel = win.add('panel', undefined, 'Settings');
    const group = panel.add('group');
    const label = group.add('statictext', undefined, 'Amount:');
    const input = group.add('edittext', undefined, '10', { name: 'amountField' });
    const check = panel.add('checkbox', undefined, 'Enabled');
    const btn = win.add('button', undefined, 'OK', { name: 'okBtn' });

    let clicked = 0;
    btn.onClick = () => {
      clicked += 1;
    };
    let changed = 0;
    input.onChange = () => {
      changed += 1;
    };

    check.value = true;

    const tree = captureTree(win);

    // Contract validity.
    const res = validateUITree(tree);
    expect(res.ok, JSON.stringify(res.errors)).toBe(true);

    expect(tree.type).toBe('Dialog');
    expect(tree.title).toBe('My Dialog');
    expect(tree.bounds).toEqual([0, 0, 300, 200]);

    // Structure: panel -> group -> [statictext, edittext]; panel -> checkbox.
    const panelNode = tree.children.find((c) => c.type === 'panel');
    expect(panelNode).toBeTruthy();
    expect(panelNode.text).toBe('Settings');

    const groupNode = panelNode.children.find((c) => c.type === 'group');
    expect(groupNode.children.map((c) => c.type)).toEqual(['statictext', 'edittext']);
    expect(groupNode.children[1].name).toBe('amountField');
    expect(groupNode.children[1].text).toBe('10');

    const checkNode = panelNode.children.find((c) => c.type === 'checkbox');
    expect(checkNode.value).toBe(true);

    // Handlers recorded by name.
    const okNode = tree.children.find((c) => c.type === 'button');
    expect(okNode.handlers).toContain('onClick');

    const editNode = groupNode.children[1];
    expect(editNode.handlers).toContain('onChange');

    // Handlers actually fire.
    btn.notify('onClick');
    expect(clicked).toBe(1);
    input.notify('onChange');
    expect(changed).toBe(1);
  });

  it('supports dropdownlist items and selection capture', () => {
    const { Window, captureTree } = createScriptUIRuntime();
    const win = new Window('palette', 'Picker');
    const dd = win.add('dropdownlist', undefined, undefined, { items: ['A', 'B', 'C'] });
    dd.selection = dd.items[1];

    const tree = captureTree(win);
    expect(tree.type).toBe('Palette');
    const ddNode = tree.children[0];
    expect(ddNode.properties.items).toEqual(['A', 'B', 'C']);
    expect(ddNode.value).toBe(1);
    expect(validateUITree(tree).ok).toBe(true);
  });

  it('accepts resource-string / object syntax minimally', () => {
    const { Window, captureTree } = createScriptUIRuntime();
    const win = new Window('dialog { text: "Res" }', undefined, [0, 0, 100, 100]);
    win.add('button', undefined, 'Go');
    const tree = captureTree(win);
    expect(tree.type).toBe('Dialog');
    expect(validateUITree(tree).ok).toBe(true);

    const win2 = new Window({ __type: 'palette' }, 'Obj');
    expect(captureTree(win2).type).toBe('Palette');
  });

  it('fires onClose when a window is closed', () => {
    const { Window } = createScriptUIRuntime();
    const win = new Window('dialog', 'Closable');
    let closed = false;
    win.onClose = () => {
      closed = true;
    };
    win.close(1);
    expect(closed).toBe(true);
  });
});
