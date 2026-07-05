// PROOF: render a harness-captured UITree as a pixel-perfect ScriptUI dialog via SDB.
// Converts UITree -> SDB localStorage["dialog"] format, seeds it into headless
// Chromium loading SDB's build/index.html, lets SDB's own engine render, screenshots #dialog.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const SDB_URL = process.env.SDB_URL || 'http://localhost:8799/index.html';
const treePath = process.argv[2];
const outPath = process.argv[3] || 'sdb-out.png';
const tree = JSON.parse(readFileSync(treePath, 'utf8'));

const TYPE = {
  dialog: 'Dialog', palette: 'Dialog', window: 'Dialog', panel: 'Panel', group: 'Group',
  button: 'Button', edittext: 'EditText', statictext: 'StaticText', checkbox: 'Checkbox',
  radiobutton: 'RadioButton', dropdownlist: 'DropDownList', listbox: 'ListBox',
  slider: 'Slider', progressbar: 'Progressbar', image: 'Image', iconbutton: 'IconButton',
  tabbedpanel: 'TabbedPanel', tab: 'Tab', treeview: 'TreeView'
};

function styleFor(type, node) {
  const text = node.text || node.title || '';
  const p = node.properties || {};
  const base = { text, preferredSize: [0, 0], alignment: null, varName: null, enabled: p.enabled !== false };
  switch (type) {
    case 'Dialog':
      return { ...base, margins: 16, orientation: 'column', spacing: 10, alignChildren: ['left', 'top'],
        windowType: node.type === 'palette' ? 'Palette' : 'Dialog',
        creationProps: { su1PanelCoordinates: false, maximizeButton: false, minimizeButton: false, independent: false, closeButton: true, borderless: false, resizeable: false } };
    case 'Panel':
      return { ...base, margins: 10, orientation: 'column', spacing: 10, alignChildren: ['left', 'top'],
        creationProps: { borderStyle: 'etched', su1PanelCoordinates: false } };
    case 'Group':
      return { ...base, margins: 0, orientation: p.orientation || 'row', spacing: 10, alignChildren: ['left', 'center'] };
    case 'Button':
      return { ...base, justify: 'center', helpTip: null };
    case 'EditText':
      return { ...base, preferredSize: [140, 0], justify: 'left', helpTip: null, softWrap: false,
        creationProps: { truncate: 'none', multiline: false, scrolling: false, borderless: false } };
    case 'StaticText':
      return { ...base, justify: 'left', helpTip: null, softWrap: false,
        creationProps: { truncate: 'none', multiline: false, scrolling: false } };
    case 'Checkbox':
    case 'RadioButton':
      return { ...base, helpTip: null };
    case 'DropDownList':
    case 'ListBox':
      return { ...base, preferredSize: [140, 0], listItems: (node.items || ['Item 1', 'Item 2']).join('\n'), selection: 0, helpTip: null };
    case 'Slider':
      return { ...base, preferredSize: [160, 0], minvalue: 0, maxvalue: 100, value: 50, helpTip: null };
    case 'Progressbar':
      return { ...base, preferredSize: [160, 0], minvalue: 0, maxvalue: 100, value: 40 };
    default:
      return base;
  }
}

// Flatten UITree -> SDB { items, order }
const items = {};
const order = [];
let nextId = 0;
function walk(node, parentId) {
  const type = TYPE[(node.type || '').toLowerCase()] || 'Group';
  const id = nextId++;
  items['item-' + id] = { id, type, parentId: parentId === null ? false : parentId, style: styleFor(type, node) };
  order.push(id);
  for (const child of node.children || []) walk(child, id);
  return id;
}
walk(tree, null);

const dialog = { activeId: 0, items, order,
  settings: { importJSON: true, indentSize: false, cepExport: false, includeCSSJS: true, functionWrapper: false, compactCode: false, showDialog: true } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ deviceScaleFactor: 2 });
await ctx.addInitScript((d) => { localStorage.setItem('dialog', JSON.stringify(d)); }, dialog);
const page = await ctx.newPage();
await page.goto(SDB_URL, { waitUntil: 'networkidle' }).catch(() => {});
await page.waitForSelector('#dialog [data-item-type]', { timeout: 8000 });
// Strip editor chrome so it reads as a clean ScriptUI window.
await page.evaluate(() => {
  const tb = document.querySelector('#dialog-title-bar'); if (tb) tb.remove();
  document.querySelectorAll('.active').forEach((e) => e.classList.remove('active'));
  document.querySelectorAll('[contenteditable]').forEach((e) => e.setAttribute('contenteditable', 'false'));
});
await page.waitForTimeout(250);
await page.locator('#dialog').screenshot({ path: outPath });
console.log('wrote', outPath, '| items:', order.length, '| types:', [...new Set(Object.values(items).map((i) => i.type))].join(','));
await browser.close();
