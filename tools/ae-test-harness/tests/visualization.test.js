import { describe, it, expect } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { renderHTML, screenshot, sdbAdapter } from '../src/visualization/index.js';

/** A representative, schema-valid UITree for rendering. */
const sampleTree = {
  type: 'Palette',
  title: 'My Script',
  children: [
    {
      type: 'panel',
      name: 'main',
      text: 'Main Panel',
      children: [
        { type: 'statictext', text: 'Amount:' },
        { type: 'edittext', name: 'amount', value: '42', handlers: ['onChange'] },
        { type: 'checkbox', name: 'enabled', text: 'Enabled', value: true },
        {
          type: 'button',
          name: 'go',
          text: 'Run',
          handlers: ['onClick'],
          properties: { enabled: true }
        }
      ]
    }
  ]
};

describe('renderHTML', () => {
  it('returns a standalone HTML document string', () => {
    const html = renderHTML(sampleTree);
    expect(typeof html).toBe('string');
    expect(html).toMatch(/^<!DOCTYPE html>/i);
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');
  });

  it('lays out control types, labels, values, and handlers', () => {
    const html = renderHTML(sampleTree);
    expect(html).toContain('My Script');
    expect(html).toContain('edittext');
    expect(html).toContain('button');
    expect(html).toContain('Amount:');
    expect(html).toContain('onClick');
    // value of edittext should appear
    expect(html).toContain('42');
  });

  it('escapes HTML-significant characters to avoid injection', () => {
    const html = renderHTML({
      type: 'Dialog',
      title: '<script>alert(1)</script>',
      children: [{ type: 'statictext', text: '<b>x & y</b>' }]
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&amp;');
  });

  it('does not throw and surfaces errors for a malformed tree', () => {
    const html = renderHTML({ type: 'NotAType', children: 'nope' });
    expect(typeof html).toBe('string');
    expect(html).toContain('validation');
  });

  it('handles null/empty input gracefully', () => {
    const html = renderHTML(null);
    expect(typeof html).toBe('string');
    expect(html).toMatch(/^<!DOCTYPE html>/i);
  });
});

describe('screenshot', () => {
  it('returns a graceful skip result and never throws when browser unavailable', async () => {
    const html = renderHTML(sampleTree);
    const out = path.join(os.tmpdir(), `ae-harness-viz-${Date.now()}.png`);
    const result = await screenshot(html, out);
    expect(result).toBeTypeOf('object');
    expect(typeof result.ok).toBe('boolean');
    // Either it succeeded (browser present) or it skipped gracefully.
    if (!result.ok) {
      expect(result.skipped).toBe(true);
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    } else {
      expect(result.path).toBe(out);
      expect(Array.isArray(result.log)).toBe(true);
      expect(result.log[0].kind).toBe('fileWrite');
    }
  });

  it('skips when given empty html', async () => {
    const result = await screenshot('', '/tmp/x.png');
    expect(result.skipped).toBe(true);
    expect(result.ok).toBe(false);
  });
});

describe('sdbAdapter', () => {
  it('is a no-op when SDB_ROOT is unset', async () => {
    const prev = process.env.SDB_ROOT;
    delete process.env.SDB_ROOT;
    try {
      const result = await sdbAdapter(sampleTree, '/tmp/out.svg');
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('SDB_ROOT unset');
    } finally {
      if (prev !== undefined) process.env.SDB_ROOT = prev;
    }
  });

  it('skips gracefully when SDB_ROOT points nowhere useful', async () => {
    const prev = process.env.SDB_ROOT;
    process.env.SDB_ROOT = path.join(os.tmpdir(), `no-such-sdb-${Date.now()}`);
    try {
      const result = await sdbAdapter(sampleTree, '/tmp/out.svg');
      expect(result.skipped).toBe(true);
      expect(typeof result.reason).toBe('string');
    } finally {
      if (prev !== undefined) process.env.SDB_ROOT = prev;
      else delete process.env.SDB_ROOT;
    }
  });
});
