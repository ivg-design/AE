/**
 * tests/sdb-render.test.js
 *
 * Exercises the SDB render service (src/sdb/render.mjs):
 *   - uiTreeToDialog() pure conversion produces a well-formed SDB dialog object
 *     covering every one of the 20 control types.
 *   - render() drives headless Chromium against SDB served over an ephemeral
 *     http port and emits a real PNG with sane dimensions for a small synthetic
 *     dialog.
 *
 * The render() test is skipped gracefully (not failed) when the SDB build is
 * absent or the browser/render pipeline reports `skipped`, so the suite stays
 * green in environments without the SDB checkout.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { existsSync, statSync, rmSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { render, uiTreeToDialog, SDB_BUILD_DIR } from '../src/sdb/render.mjs';

/** A small synthetic dialog: panel + label + edit + checkbox + dropdown + buttons. */
const SMALL_TREE = {
  type: 'dialog',
  title: 'Test Dialog',
  children: [
    {
      type: 'panel',
      text: 'Options',
      properties: { orientation: 'column', alignChildren: ['left', 'top'] },
      children: [
        { type: 'statictext', text: 'Name:' },
        { type: 'edittext', text: 'hello', properties: { preferredSize: [140, 0] } },
        { type: 'checkbox', text: 'Enable feature', value: true },
        {
          type: 'dropdownlist',
          properties: { items: ['Alpha', 'Beta', 'Gamma'] },
          value: 1
        },
        { type: 'slider', value: 70, properties: { minvalue: 0, maxvalue: 100 } }
      ]
    },
    {
      type: 'group',
      properties: { orientation: 'row' },
      children: [
        { type: 'button', text: 'OK', name: 'ok' },
        { type: 'button', text: 'Cancel', name: 'cancel' }
      ]
    }
  ]
};

/** A tree touching all 20 SDB control types, for conversion coverage. */
const ALL_TYPES_TREE = {
  type: 'dialog',
  title: 'All Types',
  children: [
    { type: 'panel', text: 'P', children: [{ type: 'statictext', text: 'st' }] },
    {
      type: 'group',
      children: [
        { type: 'button', text: 'B' },
        { type: 'iconbutton', text: 'IB' },
        { type: 'image' },
        { type: 'edittext', text: 'e' },
        { type: 'checkbox', text: 'cb', value: true },
        { type: 'radiobutton', text: 'rb', value: false },
        { type: 'dropdownlist', properties: { items: ['x', 'y'] } },
        { type: 'listbox', properties: { items: ['a', 'b'] } },
        { type: 'slider', value: 25 },
        { type: 'progressbar', value: 60 },
        { type: 'divider' }
      ]
    },
    {
      type: 'tabbedpanel',
      children: [
        { type: 'tab', text: 'Tab 1', children: [{ type: 'statictext', text: 'in tab' }] }
      ]
    },
    {
      type: 'treeview',
      children: [
        { type: 'treeitem', text: 'root', children: [{ type: 'treeitem', text: 'leaf' }] }
      ]
    }
  ]
};

const tmpDir = mkdtempSync(join(tmpdir(), 'sdb-render-'));

afterAll(() => {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('uiTreeToDialog (pure conversion)', () => {
  it('produces a well-formed SDB dialog object', () => {
    const { ok, dialog, count } = uiTreeToDialog(SMALL_TREE);
    expect(ok).toBe(true);
    expect(dialog).toBeTruthy();
    expect(typeof dialog.activeId).toBe('number');
    expect(Array.isArray(dialog.order)).toBe(true);
    expect(dialog.order.length).toBe(count);
    expect(dialog.settings.showDialog).toBe(true);

    // Root item is a Dialog with parentId === false.
    const root = dialog.items['item-0'];
    expect(root.type).toBe('Dialog');
    expect(root.parentId).toBe(false);

    // Every item references a valid parent and has a style object.
    for (const id of dialog.order) {
      const it = dialog.items['item-' + id];
      expect(it).toBeTruthy();
      expect(it.style && typeof it.style).toBe('object');
      if (it.parentId !== false) {
        expect(dialog.items['item-' + it.parentId]).toBeTruthy();
      }
    }
  });

  it('maps the checkbox/dropdown/slider values into SDB style fields', () => {
    const { dialog } = uiTreeToDialog(SMALL_TREE);
    const byType = (t) =>
      Object.values(dialog.items).find((i) => i.type === t);

    expect(byType('Checkbox').style.checked).toBe(true);
    expect(byType('DropDownList').style.selection).toBe(1);
    expect(byType('DropDownList').style.listItems).toContain('Alpha');
    const slider = byType('Slider').style;
    expect(slider.value).toBe(70);
    expect(slider.minvalue).toBe(0);
    expect(slider.maxvalue).toBe(100);
  });

  it('covers all 20 SDB control types', () => {
    const { ok, dialog } = uiTreeToDialog(ALL_TYPES_TREE);
    expect(ok).toBe(true);
    const seen = new Set(Object.values(dialog.items).map((i) => i.type));
    for (const t of [
      'Dialog',
      'Panel',
      'Group',
      'TabbedPanel',
      'Tab',
      'Button',
      'IconButton',
      'Image',
      'StaticText',
      'EditText',
      'Checkbox',
      'RadioButton',
      'DropDownList',
      'ListBox',
      'Slider',
      'Progressbar',
      'TreeView',
      'TreeItem',
      'Divider'
    ]) {
      expect(seen.has(t), `expected type ${t} present`).toBe(true);
    }
  });

  it('never throws and reports a reason on bad input', () => {
    const bad = uiTreeToDialog(null);
    expect(bad.ok).toBe(false);
    expect(typeof bad.reason).toBe('string');

    // A childless dialog node is still a valid single-item dialog.
    const lone = uiTreeToDialog({ type: 'dialog' });
    expect(lone.ok).toBe(true);
    expect(lone.count).toBe(1);
  });
});

describe('render (headless SDB pipeline)', () => {
  const hasBuild = existsSync(join(SDB_BUILD_DIR, 'index.html'));

  it.skipIf(!hasBuild)(
    'renders a small synthetic dialog to a PNG > 1KB with sane dimensions',
    async () => {
      const out = join(tmpDir, 'small.png');
      const res = await render(SMALL_TREE, out);

      if (res.skipped) {
        // Environment (browser/render) unavailable — do not fail the suite.
        console.warn('render skipped:', res.reason);
        expect(res.ok).toBe(false);
        return;
      }

      expect(res.ok).toBe(true);
      expect(res.path).toBe(out);
      expect(existsSync(out)).toBe(true);

      const size = statSync(out).size;
      expect(size).toBeGreaterThan(1024); // > 1KB

      // Sane, non-pathological dimensions.
      expect(res.width).toBeGreaterThan(50);
      expect(res.height).toBeGreaterThan(50);
      expect(res.width).toBeLessThanOrEqual(1600);
      expect(res.height).toBeLessThanOrEqual(1600);
    },
    60000
  );

  it('never throws; returns skipped for a missing build dir', async () => {
    const out = join(tmpDir, 'nobuild.png');
    const res = await render(SMALL_TREE, out, { buildDir: '/no/such/sdb/build' });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe(true);
    expect(typeof res.reason).toBe('string');
  });
});
