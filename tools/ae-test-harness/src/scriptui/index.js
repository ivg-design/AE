/**
 * ScriptUI runtime simulation.
 *
 * Provides a minimal but faithful ScriptUI implementation sufficient to load
 * AE catalog scripts that build dialogs/palettes/windows, register event
 * handlers, and read/write control state. `captureTree` serializes a Window
 * into a UITree per the frozen contract (src/contracts/ui-tree.schema.js).
 *
 * Operation logging uses OPERATION_KINDS from contracts; this subsystem only
 * emits the 'alert'|'prompt'|'confirm' kinds when ScriptUI-level dialogs are
 * invoked through an injected logger.
 *
 * ESM only. Importable in isolation.
 */

import { OPERATION_KINDS, UI_TREE_TYPES } from '../contracts/index.js';

/** Container control types (may host children via .add). */
const CONTAINER_TYPES = new Set([
  'dialog',
  'palette',
  'window',
  'panel',
  'group',
  'tabbedpanel',
  'tab'
]);

/** All recognized control types this runtime can construct. */
const CONTROL_TYPES = new Set([
  'panel',
  'group',
  'button',
  'statictext',
  'edittext',
  'checkbox',
  'radiobutton',
  'dropdownlist',
  'listbox',
  'slider',
  'progressbar',
  'image',
  'tabbedpanel',
  'tab',
  'treeview',
  'iconbutton',
  'scrollbar',
  'flashplayer',
  'browsebutton',
  'edternumber'
]);

/** List-like controls that own `.items` / `.selection`. */
const LIST_TYPES = new Set(['dropdownlist', 'listbox', 'treeview']);

/** Handler property names recorded into UINode.handlers[]. */
const HANDLER_NAMES = ['onClick', 'onChange', 'onChanging', 'onClose', 'onDraw', 'onActivate'];

/**
 * Map a ScriptUI addEventListener event name to the equivalent on* handler slot.
 * ScriptUI fires DOM-ish events ('click','change','changing','focus','blur',
 * 'mousedown', …); catalog scripts most often register 'change'/'click'.
 * @param {string} eventName
 * @returns {string|null}
 */
function eventNameToHandlerSlot(eventName) {
  switch (String(eventName || '').toLowerCase()) {
    case 'click':
    case 'mousedown':
    case 'mouseup':
      return 'onClick';
    case 'change':
      return 'onChange';
    case 'changing':
      return 'onChanging';
    case 'close':
      return 'onClose';
    case 'draw':
      return 'onDraw';
    case 'activate':
    case 'focus':
      return 'onActivate';
    default:
      return null;
  }
}

/** Map a top-level window "type" to a UITree.type from UI_TREE_TYPES. */
function windowTreeType(type) {
  switch (String(type || '').toLowerCase()) {
    case 'dialog':
      return 'Dialog';
    case 'palette':
      return 'Palette';
    case 'panel':
      return 'Panel';
    case 'window':
    default:
      return 'Window';
  }
}

/**
 * A list item used by dropdownlist / listbox controls.
 */
class ListItem {
  constructor(text, index) {
    this.text = String(text == null ? '' : text);
    this.index = index;
    this.selected = false;
    this.type = 'item';
  }
  /**
   * treeview nodes are themselves containers: `node.add('node'|'item', text)`
   * appends a child node/item (AE allows arbitrarily nested treeview nodes).
   */
  add(kind, text) {
    if (!Array.isArray(this.items)) this.items = [];
    const item = new ListItem(text, this.items.length);
    item.type = String(kind).toLowerCase() === 'node' ? 'node' : 'item';
    item._owner = this;
    item.parent = this; // treeview walkers (PathMaster) traverse node.parent upward
    this.items.push(item);
    return item;
  }
  toString() {
    return this.text;
  }
}

/**
 * A ScriptUI ScriptUIGraphics stand-in. Drawing-heavy controls (color swatches,
 * cursor overlays) register an `onDraw` handler that calls `this.graphics.*`
 * (newPath/rectPath/ellipsePath/fillPath/strokePath/newBrush/newPen/…). Real
 * ScriptUI paints to the OS; in the harness these are no-ops that return chainable
 * stand-ins so an `onDraw` handler runs to completion without throwing.
 *
 * Every method is a no-op returning a brush/pen-like object so expressions such as
 * `g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, color))` evaluate cleanly.
 */
class ScriptUIGraphics {
  constructor() {
    this.BrushType = { SOLID_COLOR: 0, THEME_COLOR: 1 };
    this.PenType = { SOLID_COLOR: 0, THEME_COLOR: 1 };
    this.font = undefined;
    this.foregroundColor = undefined;
    this.backgroundColor = undefined;
  }
  newBrush(_type, color) {
    return { type: _type, color };
  }
  newPen(_type, color, width) {
    return { type: _type, color, width };
  }
  newPath() {
    return this;
  }
  moveTo() {
    return this;
  }
  lineTo() {
    return this;
  }
  rectPath() {
    return this;
  }
  ellipsePath() {
    return this;
  }
  closePath() {
    return this;
  }
  fillPath() {
    return this;
  }
  strokePath() {
    return this;
  }
  drawOSControl() {
    return this;
  }
  drawString() {
    return this;
  }
  measureString() {
    return { width: 0, height: 0 };
  }
}

/**
 * Base control. Containers and leaf controls share this; containers gain
 * `.add()` and an `.children` array.
 */
class Control {
  /**
   * @param {string} type lowercase control type
   * @param {object} runtime owning runtime (for shared services)
   * @param {object} opts { bounds, text, props }
   */
  constructor(type, runtime, opts = {}) {
    const { bounds, text, props } = opts;
    this.type = type;
    this._runtime = runtime;

    // Layout-ish props commonly read by scripts. In ScriptUI size-family props
    // are Dimension objects ({ width, height }) that scripts mutate component-wise
    // (`ctrl.preferredSize.width = 60`). Seed them as mutable Dimension objects so
    // per-axis assignment works; whole-value assignment (`ctrl.size = [w, h]`)
    // simply replaces the object, which is also valid.
    this.bounds = bounds != null ? bounds : undefined;
    this.size = { width: undefined, height: undefined };
    this.location = undefined;
    this.preferredSize = { width: undefined, height: undefined };
    this.maximumSize = { width: undefined, height: undefined };
    this.minimumSize = { width: undefined, height: undefined };
    this.alignment = undefined;
    this.alignChildren = undefined;
    this.orientation = type === 'group' || type === 'panel' ? 'column' : undefined;
    this.spacing = undefined;
    this.margins = undefined;
    this.visible = true;
    this.enabled = true;
    this.helpTip = undefined;
    this.justify = undefined;

    // Text / value-bearing state.
    this.text = text != null ? String(text) : undefined;
    this.title = undefined;

    // Control-type specific state.
    if (type === 'checkbox' || type === 'radiobutton') {
      this.value = false;
    } else if (type === 'slider' || type === 'progressbar') {
      this.value = 0;
      this.minvalue = 0;
      this.maxvalue = 100;
    } else if (LIST_TYPES.has(type)) {
      this.items = [];
      this.selection = null;
    } else if (type === 'image' || type === 'iconbutton') {
      this.image = text != null ? text : undefined;
      this.value = undefined;
    } else {
      this.value = undefined;
    }

    // Containers.
    if (CONTAINER_TYPES.has(type)) {
      this.children = [];
    }

    // Apply any creation props (e.g. { multiline:true, name:'foo' }).
    // `items` is consumed by add() to build ListItems, so never copy it raw.
    if (props && typeof props === 'object') {
      for (const k of Object.keys(props)) {
        if (k === 'items') continue;
        this[k] = props[k];
      }
    }

    // Event handlers default to undefined; scripts assign them.
    for (const h of HANDLER_NAMES) {
      if (!(h in this)) this[h] = undefined;
    }

    // Registered addEventListener handlers, keyed by lowercased event name.
    // Each entry is an array of listener functions.
    this._listeners = {};
  }

  /**
   * ScriptUI control.addEventListener(eventName, handler[, capture]).
   *
   * Stores the handler so the action driver / modal show() can fire it later.
   * For the common single-handler events ('click','change',…) we also mirror
   * the listener onto the matching on* slot when that slot is empty, so code
   * paths that only inspect onClick/onChange still see a handler — and so the
   * UITree handler capture reflects the registration.
   *
   * @param {string} eventName
   * @param {Function} handler
   * @param {boolean} [_capture]
   * @returns {this}
   */
  addEventListener(eventName, handler, _capture) {
    if (typeof handler !== 'function') return this;
    const key = String(eventName || '').toLowerCase();
    if (!Array.isArray(this._listeners[key])) this._listeners[key] = [];
    this._listeners[key].push(handler);

    const slot = eventNameToHandlerSlot(key);
    if (slot && typeof this[slot] !== 'function') {
      this[slot] = handler;
    }
    return this;
  }

  /**
   * ScriptUI control.removeEventListener(eventName, handler).
   * @param {string} eventName
   * @param {Function} handler
   * @returns {this}
   */
  removeEventListener(eventName, handler) {
    const key = String(eventName || '').toLowerCase();
    const list = this._listeners[key];
    if (Array.isArray(list)) {
      const i = list.indexOf(handler);
      if (i !== -1) list.splice(i, 1);
    }
    const slot = eventNameToHandlerSlot(key);
    if (slot && this[slot] === handler) this[slot] = undefined;
    return this;
  }

  /**
   * ScriptUI control.dispatchEvent(eventObj) / internal helper. Fires both the
   * matching on* slot and any addEventListener-registered handlers.
   * @param {string|{type?:string}} event  event name or {type}
   * @returns {boolean} true if any handler ran
   */
  dispatchEvent(event) {
    const name =
      typeof event === 'string' ? event : event && event.type ? event.type : '';
    const key = String(name || '').toLowerCase();
    const evt = { type: key, target: this };
    let ran = false;

    const slot = eventNameToHandlerSlot(key);
    if (slot && typeof this[slot] === 'function') {
      this[slot].call(this, evt);
      ran = true;
    }
    const list = this._listeners[key];
    if (Array.isArray(list)) {
      for (const fn of list.slice()) {
        if (typeof fn === 'function') {
          // Skip if it's the same function already invoked via the on* slot.
          if (slot && this[slot] === fn) continue;
          fn.call(this, evt);
          ran = true;
        }
      }
    }
    return ran;
  }

  /**
   * Add a child control. Mirrors ScriptUI's container.add(type, bounds, text, props).
   *
   * ScriptUI's `container.add()` accepts the same two forms the `Window`
   * constructor does:
   *   1. `add(typeName, bounds, text, props)` — a single control.
   *   2. `add(resourceString)` — e.g. "Group{ok:Button{text:'Ok'}}" — which
   *      materializes a whole subtree, attaching named members as properties on
   *      the returned container (so `grp.ok` / `win.ok` resolve to real controls).
   *
   * The single-control form ALWAYS returns a real `Control` for every recognized
   * type (button, iconbutton, statictext, edittext, checkbox, radiobutton,
   * dropdownlist, listbox, slider, progressbar, image, group, panel, tabbedpanel,
   * tab, treeview, …). Even an unrecognized type name yields a usable Control so
   * downstream `ctrl.onClick = …` / `ctrl.graphics` / `ctrl.size` never hit
   * `undefined`.
   *
   * @param {string} type control type name OR a resource-spec string
   * @param {*} [bounds]
   * @param {string} [text]
   * @param {object} [props]
   * @returns {Control}
   */
  add(type, bounds, text, props) {
    const raw = type == null ? '' : String(type);
    const t = raw.toLowerCase();

    // list controls: `.add('item', text)` appends a ListItem (no child control).
    if ((t === 'item' || t === 'node') && LIST_TYPES.has(this.type)) {
      // In ScriptUI the item text is passed as the second positional arg.
      return this._addItem(bounds != null ? bounds : text);
    }

    if (!this.children) {
      this.children = [];
    }

    // Resource-string form: "Type{ child: Type{...}, prop: value }". Detected by
    // a leading identifier immediately followed by '{'. Build the whole subtree
    // and attach named members as properties on the returned container so that
    // `returned.ok.onClick = …` works exactly as in real ScriptUI.
    if (/^\s*[A-Za-z_]\w*\s*\{/.test(raw)) {
      const parsed = parseResourceString(raw);
      if (parsed) {
        const ctrl = new Control(parsed.__type, this._runtime, { bounds, text, props });
        ctrl.parent = this;
        applyResourceNode(parsed, ctrl, this._rootWindow());
        this.children.push(ctrl);
        return ctrl;
      }
      // Parse failed — fall through and create a control from the literal text so
      // we still return a real object rather than undefined.
    }

    // dropdownlist / listbox / treeview accept items either as a positional
    // array (AE's `add('listbox', bounds, ['a','b'])` — 3rd arg) or props.items.
    const positionalItems = LIST_TYPES.has(t) && Array.isArray(text);
    const ctrl = new Control(t, this._runtime, { bounds, text: positionalItems ? undefined : text, props });
    ctrl.parent = this;

    if (LIST_TYPES.has(t)) {
      if (positionalItems) {
        for (const it of text) ctrl._addItem(it);
      } else if (props && Array.isArray(props.items)) {
        for (const it of props.items) ctrl._addItem(it);
      }
    }
    this.children.push(ctrl);
    return ctrl;
  }

  /** Walk up the parent chain to the owning Window (or this if none). */
  _rootWindow() {
    let node = this;
    while (node && node.parent) node = node.parent;
    return node;
  }

  /**
   * List `.selection` in AE accepts an index (number) or a ListItem and always
   * reads back as the ListItem (so `dropdown.selection.text` works after
   * `dropdown.selection = 0`). Backed by `_selection`.
   */
  get selection() {
    return this._selection == null ? null : this._selection;
  }
  set selection(v) {
    if (v == null) { this._selection = null; return; }
    if (typeof v === 'number') {
      this._selection = (Array.isArray(this.items) && this.items[v]) || null;
    } else {
      this._selection = v;
    }
    if (this._selection && typeof this._selection === 'object' && !Array.isArray(this._selection)) {
      this._selection.selected = true;
    }
  }

  /** dropdownlist/listbox/treeview item addition. */
  _addItem(text) {
    if (!Array.isArray(this.items)) this.items = [];
    const item = new ListItem(text, this.items.length);
    item._owner = this;
    this.items.push(item);
    return item;
  }

  /** Remove all items from a list control (dropdownlist/listbox/treeview). */
  removeAll() {
    if (Array.isArray(this.items)) this.items.length = 0;
    this.selection = null;
    return this;
  }

  /** Remove a single item (by index, ListItem, or text) from a list control. */
  remove(which) {
    if (!Array.isArray(this.items)) return this;
    let idx = -1;
    if (typeof which === 'number') idx = which;
    else if (which && typeof which === 'object') idx = this.items.indexOf(which);
    else if (which != null) idx = this.items.findIndex((it) => it.text === String(which));
    if (idx >= 0 && idx < this.items.length) {
      this.items.splice(idx, 1);
      this.items.forEach((it, i) => (it.index = i));
      this.selection = null;
    }
    return this;
  }

  /** Find a list item by its text (ScriptUI list.find). */
  find(text) {
    if (!Array.isArray(this.items)) return null;
    const t = String(text);
    return this.items.find((it) => it.text === t) || null;
  }

  /**
   * Trigger a named event handler if present. Returns true if a handler ran.
   * @param {string} name e.g. 'onClick'
   */
  notify(name) {
    const slot = name || (this.type === 'button' ? 'onClick' : 'onChange');
    const evt = { type: slot, target: this };
    let ran = false;
    const fn = this[slot];
    if (typeof fn === 'function') {
      fn.call(this, evt);
      ran = true;
    }
    // Also fire any addEventListener-registered handlers for the equivalent
    // DOM-ish event name (onClick→'click', onChange→'change', …).
    for (const key of Object.keys(this._listeners || {})) {
      if (eventNameToHandlerSlot(key) !== slot) continue;
      for (const lfn of this._listeners[key].slice()) {
        if (typeof lfn === 'function' && lfn !== fn) {
          lfn.call(this, { type: key, target: this });
          ran = true;
        }
      }
    }
    return ran;
  }

  /** ScriptUI no-ops kept for script compatibility. */
  show() {
    this.visible = true;
    return this;
  }
  hide() {
    this.visible = false;
    return this;
  }
  close(result) {
    if (typeof this.onClose === 'function') {
      this.onClose.call(this, { type: 'onClose', target: this });
    }
    this._closed = true;
    this._closeResult = result;
    return this;
  }
  center() {
    return this;
  }
  /**
   * ScriptUI LayoutManager accessor. In ScriptUI `control.layout` is a
   * LayoutManager object exposing `.layout(recalc)` / `.resize()`, but many
   * scripts also call `control.layout(true)` directly. We return a callable
   * function that doubles as the manager (it carries `.layout`/`.resize`
   * methods), so both `myPanel.layout.layout(true)` and `myPanel.layout(true)`
   * resolve to a no-op that returns the control.
   */
  get layout() {
    const self = this;
    const mgr = function layout() {
      return self;
    };
    mgr.layout = function layout() {
      return self;
    };
    mgr.resize = function resize() {
      return self;
    };
    return mgr;
  }

  /**
   * ScriptUI `control.graphics` — a ScriptUIGraphics object used inside `onDraw`
   * handlers. Lazily created and cached per control so handlers that read
   * `this.graphics.newBrush(...)` / `this.graphics.BrushType.SOLID_COLOR` resolve
   * against a real object instead of `undefined`.
   */
  get graphics() {
    if (!this._graphics) this._graphics = new ScriptUIGraphics();
    return this._graphics;
  }
  set graphics(g) {
    this._graphics = g;
  }
}

/** ScriptUI control type names that may appear (PascalCase) in a resource string. */
const RESOURCE_TYPE_NAMES = new Set([
  'panel',
  'group',
  'button',
  'statictext',
  'edittext',
  'checkbox',
  'radiobutton',
  'dropdownlist',
  'listbox',
  'slider',
  'progressbar',
  'image',
  'tabbedpanel',
  'tab',
  'treeview',
  'iconbutton',
  'scrollbar',
  'listitem'
]);

/**
 * Parse a ScriptUI resource-specification string into a structured node:
 *   { __type, props: {...}, children: [{ name, node }] }
 *
 * Resource strings look like:
 *   "palette { orientation:'column', text:'X',
 *              copyBtn: Button { text:'Copy', preferredSize:[100,30] },
 *              grp: Group { orientation:'row', ok: Button { text:'OK' } } }"
 *
 * The grammar is forgiving: we walk the braces, splitting top-level
 * comma-separated members. A member is either:
 *   - `key: TypeName { ... }`  → a named child control (TypeName ∈ control set)
 *   - `key: <value>`           → a scalar/array/string property on the container
 *
 * This is a pragmatic parser (not a full ExtendScript object-literal evaluator);
 * it is sufficient for the control trees the AE catalog scripts declare.
 *
 * @param {string} src
 * @returns {{ __type: string, props: object, children: Array<{name:string,node:object}> } | null}
 */
function parseResourceString(src) {
  if (typeof src !== 'string') return null;
  const headMatch = src.match(/^\s*([A-Za-z_]\w*)\s*\{/);
  if (!headMatch) return null;
  const type = headMatch[1];
  const bodyStart = src.indexOf('{');
  const body = extractBraceBody(src, bodyStart);
  if (body == null) return null;
  const node = { __type: type.toLowerCase(), props: {}, children: [] };
  for (const member of splitTopLevel(body.inner)) {
    const colon = findMemberColon(member);
    if (colon === -1) continue;
    const key = member.slice(0, colon).trim().replace(/^['"]|['"]$/g, '');
    const rest = member.slice(colon + 1).trim();
    if (!key) continue;

    // Named child control: `TypeName { ... }`
    const childHead = rest.match(/^([A-Za-z_]\w*)\s*\{/);
    if (childHead && RESOURCE_TYPE_NAMES.has(childHead[1].toLowerCase())) {
      const childBodyStart = rest.indexOf('{');
      const childBody = extractBraceBody(rest, childBodyStart);
      const childSrc =
        childBody != null ? `${childHead[1]} {${childBody.inner}}` : `${childHead[1]} {}`;
      const childNode = parseResourceString(childSrc);
      if (childNode) node.children.push({ name: key, node: childNode });
      continue;
    }

    // Scalar / array / string property.
    node.props[key] = parseResourceValue(rest);
  }
  return node;
}

/** Extract the contents between the brace at `openIdx` and its matching close. */
function extractBraceBody(src, openIdx) {
  if (openIdx < 0 || src[openIdx] !== '{') return null;
  let depth = 0;
  let inStr = null;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === inStr && src[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inStr = ch;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return { inner: src.slice(openIdx + 1, i), end: i };
    }
  }
  return { inner: src.slice(openIdx + 1), end: src.length };
}

/** Split a member list on top-level commas (ignoring nested braces/brackets/strings). */
function splitTopLevel(s) {
  const out = [];
  let depth = 0;
  let bracket = 0;
  let inStr = null;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === inStr && s[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"') inStr = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '[') bracket++;
    else if (ch === ']') bracket--;
    else if (ch === ',' && depth === 0 && bracket === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  if (start < s.length) out.push(s.slice(start));
  return out.map((m) => m.trim()).filter(Boolean);
}

/** Find the colon separating `key:` from its value (top level, outside strings). */
function findMemberColon(member) {
  let inStr = null;
  let depth = 0;
  for (let i = 0; i < member.length; i++) {
    const ch = member[i];
    if (inStr) {
      if (ch === inStr && member[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"') inStr = ch;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') depth--;
    else if (ch === ':' && depth === 0) return i;
  }
  return -1;
}

/** Parse a resource scalar value: quoted string, number, boolean, or array. */
function parseResourceValue(raw) {
  const v = String(raw).trim();
  if (/^['"]/.test(v)) return v.replace(/^['"]|['"]$/g, '');
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'undefined') return undefined;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('[')) {
    const inner = v.slice(1, v.endsWith(']') ? -1 : undefined);
    return splitTopLevel(inner).map((part) => parseResourceValue(part));
  }
  return v;
}

/**
 * Materialize a parsed resource node into real child controls on `host`,
 * applying scalar props and recursing. Named members become properties on
 * `host` AND (when distinct) on the owning `win`, mirroring ScriptUI semantics
 * where a resource string's named children are reachable both via the container
 * and via the window.
 *
 * Shared by both `Control.add(resourceString)` and the `Window` constructor so
 * EVERY container materializes resource specs identically.
 *
 * @param {{__type:string,props:object,children:Array}} node
 * @param {Control} host  container to receive props + children
 * @param {Control} [win] owning window (for top-level property mirroring)
 */
function applyResourceNode(node, host, win) {
  if (!node) return;
  const isWindowHost = win != null && host === win;
  if (node.props && typeof node.props === 'object') {
    for (const k of Object.keys(node.props)) {
      // 'text'/'title' on the window map to the title; otherwise copy through.
      if (isWindowHost && (k === 'text' || k === 'title')) {
        if (win.title == null) {
          win.title = String(node.props[k]);
          win.text = win.title;
        }
      } else {
        host[k] = node.props[k];
      }
    }
  }
  for (const { name, node: childNode } of node.children || []) {
    const t = childNode.__type;
    const text =
      childNode.props && childNode.props.text != null ? String(childNode.props.text) : undefined;
    const child = host.add(t, undefined, text);
    if (name) {
      child.name = name;
      // Expose the named control as a property on the immediate container, and
      // (when distinct) on the owning window — matching ScriptUI resource-string
      // semantics so both `host.name` and `win.name` resolve.
      host[name] = child;
      if (win && host !== win) win[name] = child;
    }
    // Apply remaining scalar props (preferredSize, orientation, …) and recurse.
    applyResourceNode(childNode, child, win);
  }
}

/**
 * Window root control. Behaves like a container Control but carries a tree type.
 */
class Win extends Control {
  /**
   * @param {string} type 'dialog'|'palette'|'window'|'panel' OR a resource string
   * @param {string} [title]
   * @param {*} [bounds]
   * @param {object} [props]
   */
  constructor(type, title, bounds, props, runtime) {
    // Resource-string syntax: "dialog { ... }", a parsed node, or a plain object.
    let resolvedType = type;
    let resourceObj = null;
    let parsed = null;
    if (typeof type === 'object' && type !== null) {
      resourceObj = type;
      resolvedType = resourceObj.__type || 'dialog';
      if (Array.isArray(resourceObj.children) || resourceObj.props) parsed = resourceObj;
    } else if (typeof type === 'string') {
      const m = type.match(/^\s*([a-zA-Z]+)\s*\{/);
      if (m) {
        resolvedType = m[1];
        resourceObj = { __resourceString: type };
        parsed = parseResourceString(type);
        if (parsed) resolvedType = parsed.__type;
      }
    }

    super(String(resolvedType || 'window').toLowerCase(), runtime, { bounds, props });
    this.title = title != null ? String(title) : undefined;
    this.text = this.title;
    this._treeType = windowTreeType(resolvedType);
    this._resource = resourceObj;
    this.maximized = false;
    this.minimized = false;
    this.active = false;
    if (!this.children) this.children = [];

    // Materialize a parsed resource spec into real child controls. Named members
    // become properties on the window (e.g. win.copyBtn) AND children in the
    // tree, mirroring ScriptUI's behavior.
    if (parsed) applyResourceNode(parsed, this, this);
  }

  /**
   * Window.show() — simulate the modeled user interaction so the script's
   * post-show logic runs deterministically in the harness.
   *
   * For a MODAL dialog: auto-select the first (up to two, for multiselect)
   * listbox/dropdownlist items that have no selection yet, fire the primary
   * "accept" button (name/text ~ ok/done/apply/create), and return 1 so the
   * common `if (dlg.show() === 1)` guard proceeds.
   *
   * For a non-modal palette/window/panel: fire each actionable button handler
   * (excluding obvious dismissal buttons like Close/Cancel) so panel-driven
   * scripts (Copy/Paste style tools) exercise their primary operations.
   *
   * @returns {number} 1 on an "OK"-style accept, 2 on cancel, else 1.
   */
  show() {
    this.visible = true;
    if (this._shown) return this._showResult != null ? this._showResult : 1;
    this._shown = true;

    const modal = this.type === 'dialog';
    const all = collectControls(this);

    // Pre-select list controls that have items but no selection.
    for (const c of all) {
      if (LIST_TYPES.has(c.type) && Array.isArray(c.items) && c.items.length > 0) {
        if (c.selection == null) {
          const multi = c.multiselect === true || c.properties === undefined;
          const take = c.multiselect === true ? Math.min(2, c.items.length) : 1;
          autoSelectItems(c, multi ? take : 1);
        }
      }
    }

    if (modal) {
      // Fire the primary accept button, if present.
      const accept = findAcceptButton(all);
      if (accept) safeNotify(accept, 'onClick');
      this._showResult = 1;
      return 1;
    }

    // Non-modal: exercise actionable (non-dismissal) buttons. Each button models
    // an INDEPENDENT user click, so one handler throwing must not prevent the
    // others (e.g. the primary "Apply"-style action) from running. We fire the
    // primary action button first, then any remaining actionable buttons, and
    // isolate each so a failure in one (e.g. a swatch picker that depends on a
    // host global) still lets the script reach its apply flow.
    const actionable = all.filter(
      (c) => (c.type === 'button' || c.type === 'iconbutton') && !isDismissButton(c)
    );
    const primary = findAcceptButton(actionable);
    if (primary) safeNotify(primary, 'onClick');
    for (const c of actionable) {
      if (c === primary) continue;
      safeNotify(c, 'onClick');
    }
    this._showResult = 1;
    return 1;
  }
}

/**
 * Fire a control's handler, isolating any error it throws. In real ScriptUI each
 * button click is an independent event loop turn; one handler's exception never
 * aborts the dispatch of unrelated controls. The harness mirrors that so a single
 * failing handler doesn't abort the whole modeled interaction.
 * @param {Control} ctrl
 * @param {string} slot e.g. 'onClick'
 * @returns {boolean} true if a handler ran without throwing
 */
function safeNotify(ctrl, slot) {
  try {
    return ctrl.notify(slot);
  } catch (_err) {
    return false;
  }
}

/** Flatten a container's descendant controls (excludes the container itself). */
function collectControls(root) {
  const out = [];
  const stack = Array.isArray(root.children) ? root.children.slice() : [];
  while (stack.length) {
    const c = stack.shift();
    if (!c || typeof c !== 'object') continue;
    out.push(c);
    if (Array.isArray(c.children)) for (const ch of c.children) stack.push(ch);
  }
  return out;
}

/** Select the first `count` items of a list control, building a selection array. */
function autoSelectItems(ctrl, count) {
  const n = Math.max(1, count || 1);
  const chosen = [];
  for (let i = 0; i < ctrl.items.length && chosen.length < n; i++) {
    ctrl.items[i].selected = true;
    chosen.push(ctrl.items[i]);
  }
  if (chosen.length === 0) {
    ctrl.selection = null;
  } else if (ctrl.multiselect === true) {
    ctrl.selection = chosen;
  } else {
    // Single-select lists expose .selection as the item itself.
    ctrl.selection = chosen[0];
  }
}

/** Is this button a dismissal control (Close/Cancel/Quit)? */
function isDismissButton(c) {
  const label = `${c.name || ''} ${c.text || ''}`.toLowerCase();
  return /\b(close|cancel|quit|dismiss|exit)\b/.test(label);
}

/** Find a modal dialog's primary accept button (OK/Done/Apply/Create/Add/Run). */
function findAcceptButton(controls) {
  const buttons = controls.filter((c) => c.type === 'button' || c.type === 'iconbutton');
  const accept = buttons.find((c) => {
    const label = `${c.name || ''} ${c.text || ''}`.toLowerCase();
    return /\b(ok|done|apply|create|add|run|build|generate|accept)\b/.test(label);
  });
  if (accept) return accept;
  // Fall back to the first non-dismissal button.
  return buttons.find((c) => !isDismissButton(c)) || null;
}

/**
 * Build a UINode from a control. Records handler names into handlers[].
 * @param {Control} ctrl
 * @returns {import('../contracts/index.js').UINode}
 */
function controlToNode(ctrl) {
  /** @type {any} */
  const node = { type: ctrl.type };

  if (ctrl.name != null && ctrl.name !== '') node.name = String(ctrl.name);

  // Text-bearing controls.
  if (ctrl.text != null) node.text = String(ctrl.text);
  else if (ctrl.title != null) node.text = String(ctrl.title);

  // Value-bearing controls.
  if (ctrl.type === 'checkbox' || ctrl.type === 'radiobutton') {
    node.value = !!ctrl.value;
  } else if (ctrl.type === 'slider' || ctrl.type === 'progressbar') {
    node.value = ctrl.value;
  } else if (ctrl.type === 'dropdownlist' || ctrl.type === 'listbox') {
    node.value = selectionIndex(ctrl);
  } else if (ctrl.value !== undefined) {
    node.value = ctrl.value;
  }

  // Layout / display properties (only the meaningful ones).
  const properties = {};
  for (const key of [
    'bounds',
    'size',
    'preferredSize',
    'alignment',
    'alignChildren',
    'orientation',
    'spacing',
    'margins',
    'justify',
    'helpTip',
    'enabled',
    'visible',
    'minvalue',
    'maxvalue'
  ]) {
    if (ctrl[key] !== undefined) properties[key] = ctrl[key];
  }
  // dropdownlist / listbox: expose item texts.
  if (ctrl.items && Array.isArray(ctrl.items)) {
    properties.items = ctrl.items.map((it) => it.text);
  }
  if (Object.keys(properties).length > 0) node.properties = properties;

  // Handlers: record names of registered functions.
  const handlers = [];
  for (const h of HANDLER_NAMES) {
    if (typeof ctrl[h] === 'function') handlers.push(h);
  }
  if (handlers.length > 0) node.handlers = handlers;

  // Children.
  if (Array.isArray(ctrl.children) && ctrl.children.length > 0) {
    node.children = ctrl.children.map(controlToNode);
  }

  return node;
}

/** Resolve the current selection index for a list control, or null. */
function selectionIndex(ctrl) {
  if (ctrl.selection == null) return null;
  if (typeof ctrl.selection === 'object' && 'index' in ctrl.selection) {
    return ctrl.selection.index;
  }
  if (typeof ctrl.selection === 'number') return ctrl.selection;
  return null;
}

/**
 * Create a ScriptUI runtime.
 *
 * @returns {{
 *   Window: Function,
 *   ScriptUI: object,
 *   captureTree: (win: any) => import('../contracts/index.js').UITree
 * }}
 */
export function createScriptUIRuntime() {
  const runtime = {};

  /**
   * Window constructor. Usable as `new Window(type, title, bounds)` or
   * `Window(type, title, bounds)` (ScriptUI permits both styles).
   *
   * @param {string|object} type 'dialog'|'palette'|'window' | resource string | object
   * @param {string} [title]
   * @param {*} [bounds]
   * @param {object} [props]
   * @returns {Win}
   */
  function Window(type, title, bounds, props) {
    return new Win(type, title, bounds, props, runtime);
  }

  // ScriptUI namespace object (constants + helpers scripts commonly read).
  const ScriptUI = {
    Alignment: {
      TOP: 'top',
      BOTTOM: 'bottom',
      LEFT: 'left',
      RIGHT: 'right',
      CENTER: 'center',
      FILL: 'fill'
    },
    newFont(_name, _style, _size) {
      return { family: _name, style: _style, size: _size };
    },
    newImage(_normal) {
      return { normal: _normal };
    },
    environment: { keyboardState: {} },
    frameworkName: 'Drover',
    version: '6.0.0'
  };

  /**
   * Serialize a Window into a UITree per contract.
   * @param {Win} win
   * @returns {import('../contracts/index.js').UITree}
   */
  function captureTree(win) {
    if (!win || typeof win !== 'object') {
      return { type: 'Window', children: [] };
    }
    const treeType = UI_TREE_TYPES.includes(win._treeType) ? win._treeType : 'Window';
    /** @type {any} */
    const tree = {
      type: treeType,
      children: Array.isArray(win.children) ? win.children.map(controlToNode) : []
    };
    if (win.title != null) tree.title = String(win.title);
    else if (win.text != null) tree.title = String(win.text);
    if (win.bounds !== undefined) tree.bounds = win.bounds;
    return tree;
  }

  // Expose for tests / introspection without widening the contract surface.
  runtime.Window = Window;
  runtime.ScriptUI = ScriptUI;
  runtime.captureTree = captureTree;
  // Reference OPERATION_KINDS so logging consumers can validate kinds emitted
  // by ScriptUI-driven dialogs (alert/prompt/confirm) against the frozen set.
  runtime.OPERATION_KINDS = OPERATION_KINDS;

  return { Window, ScriptUI, captureTree };
}

export { Control, Win, ListItem };
export default createScriptUIRuntime;
