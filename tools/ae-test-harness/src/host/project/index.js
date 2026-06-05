/**
 * src/host/project/index.js — simulated After Effects project + app object.
 *
 * createProject(snapshot, log) materializes a HostSnapshot into a fake `app`
 * with an `app.project` whose `activeItem` resolves `snapshot.activeItemId` to a
 * CompItem. CompItems expose name/width/height/duration/frameRate plus a layer
 * surface (numLayers, layers, layer(i), selectedLayers).
 *
 * Layers and properties are attached by the layers/properties subsystems via a
 * shared `ctx` hook: each CompItem carries `comp.__ctx`, and the project exposes
 * `attachLayers(fn)` so the integrator can wire `buildLayers`/`buildProperties`
 * lazily without this module importing them (keeps modules importable in isolation).
 *
 * All operation logging uses OPERATION_KINDS from the frozen contracts module.
 */

import { OPERATION_KINDS } from '../../contracts/index.js';

/** Push a validated-kind operation onto the shared log. */
function pushOp(log, op) {
  if (!Array.isArray(log)) return;
  if (!OPERATION_KINDS.includes(op.kind)) {
    throw new Error(`createProject: unknown operation kind "${op.kind}"`);
  }
  log.push(op);
}

/**
 * An ItemCollection mimics AE's app.project.items / collection objects.
 * AE collections are 1-indexed. We expose both numeric indexing helpers and a
 * 1-based `[i]` access plus `.length`.
 */
class ItemCollection {
  /** @param {Array<object>} items */
  constructor(items) {
    this._items = items.slice();
    // AE collections are 1-based: expose [1..length].
    this._items.forEach((it, i) => {
      this[i + 1] = it;
    });
  }

  get length() {
    return this._items.length;
  }

  get numItems() {
    return this._items.length;
  }

  /** 1-based, AE-style. */
  item(i) {
    return this._items[i - 1];
  }

  /** Find first item by name, AE-style helper. */
  byName(name) {
    return this._items.find((it) => it.name === name) || null;
  }
}

/**
 * CompItem — a simulated composition item.
 *
 * The layer surface is intentionally backed by a private `_layers` array that
 * the layers subsystem populates through the shared ctx. Until populated it is
 * an empty array, so the class is fully usable in isolation.
 */
class CompItem {
  /**
   * @param {import('../../contracts/index.js').CompDef} compDef
   * @param {object} ctx shared context (carries log + back-references)
   */
  constructor(compDef, ctx) {
    this._def = compDef;
    this.__ctx = ctx;

    this.id = compDef.id;
    this.name = compDef.name;
    this.width = compDef.width;
    this.height = compDef.height;
    this.duration = compDef.duration;
    this.frameRate = compDef.frameRate;
    this.pixelAspect = compDef.pixelAspect;
    // AE: current playhead time. Honor a fixture-provided time; default 0.
    this.time = typeof compDef.time === 'number' ? compDef.time : 0;
    this.workAreaStart = typeof compDef.workAreaStart === 'number' ? compDef.workAreaStart : 0;
    this.workAreaDuration =
      typeof compDef.workAreaDuration === 'number' ? compDef.workAreaDuration : this.duration;
    this.typeName = 'Composition';

    // Layer storage; populated by the layers subsystem via ctx.
    this._layers = [];

    // AE exposes the layer collection as `comp.layers`. We give it both
    // collection semantics, a usable `selectedLayers` reflection, and the
    // `add*` creation methods (addNull/addText/addShape/addSolid) scripts use.
    const self = this;
    const layersCollection = {
      get length() {
        return self._layers.length;
      },
      get numLayers() {
        return self._layers.length;
      },
      /** 1-based, AE-style. */
      layer(i) {
        return self.layer(i);
      },
      byName(name) {
        return self._layers.find((l) => l && l.name === name) || null;
      },
      /** AE: `comp.layers.addNull([duration])` — creates a null layer. */
      addNull(duration) {
        return self.__addLayer({ type: 'Null', name: 'Null 1', duration }, 'Null 1');
      },
      /** AE: `comp.layers.addText([sourceText])` — creates a text layer. */
      addText(sourceText) {
        const name =
          typeof sourceText === 'string' && sourceText.length ? sourceText : 'Text';
        return self.__addLayer({ type: 'Text', name, sourceText }, name);
      },
      /** AE: `comp.layers.addShape()` — creates a shape layer. */
      addShape() {
        return self.__addLayer({ type: 'Shape', name: 'Shape Layer 1' }, 'Shape Layer 1');
      },
      /** AE: `comp.layers.addSolid(color,name,w,h,pixelAspect[,duration])`. */
      addSolid(color, name, w, h) {
        const nm = name || 'Solid';
        return self.__addLayer({ type: 'AV', name: nm, width: w, height: h }, nm);
      },
      /** AE: `comp.layers.add(item)` — add an item as a layer (footage). */
      add(item) {
        const nm = (item && item.name) || 'Layer';
        return self.__addLayer({ type: 'AV', name: nm }, nm);
      }
    };

    // AE's LayerCollection supports 1-based numeric indexing (`comp.layers[1]`).
    // Wrap the collection in a Proxy that resolves integer keys to layer(i) so
    // scripts iterating `for (i=1; i<=layers.length; i++) layers[i]` work.
    this.layers = new Proxy(layersCollection, {
      get(t, prop, receiver) {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          return self.layer(Number(prop));
        }
        return Reflect.get(t, prop, receiver);
      },
      has(t, prop) {
        if (typeof prop === 'string' && /^\d+$/.test(prop)) {
          const n = Number(prop);
          return n >= 1 && n <= self._layers.length;
        }
        return Reflect.has(t, prop);
      }
    });
  }

  get numLayers() {
    return this._layers.length;
  }

  /**
   * AE `comp.openInViewer()` — opens the comp in a viewer and returns the Viewer.
   * No-op in the harness (no UI); returns a minimal Viewer-like stub so chained
   * generators (compCode rigs) proceed past their `openInViewer()` calls.
   */
  openInViewer() {
    return { type: 'Viewer', setActive() { return true; } };
  }

  /**
   * AE `comp.layer(indexOrName)` — 1-based numeric index or name lookup.
   * @param {number|string} indexOrName
   */
  layer(indexOrName) {
    if (typeof indexOrName === 'string') {
      return this._layers.find((l) => l && l.name === indexOrName) || null;
    }
    return this._layers[indexOrName - 1] || null;
  }

  /**
   * Layers selected in this comp, resolved LIVE from ctx.selection.layerIds (so
   * runtime selection changes driven by `selectLayers` actions are reflected).
   * Ordered by the selection list, falling back to `.selected`-flagged layers.
   */
  get selectedLayers() {
    const ctx = this.__ctx;
    const ids =
      ctx && ctx.selection && Array.isArray(ctx.selection.layerIds)
        ? ctx.selection.layerIds
        : [];
    const out = [];
    for (const id of ids) {
      const l = this._layers.find((x) => x && (x.id === id || x.__id === id));
      if (l) out.push(l);
    }
    if (out.length) return out;
    // Fall back to layers explicitly flagged selected (seeded selection).
    return this._layers.filter((l) => l && l.selected === true);
  }

  /**
   * Selected properties for the comp — resolved LIVE from
   * ctx.selection.propertyPaths across this comp's layers. A path may be
   * prefixed with the owning layer name; both forms resolve.
   */
  get selectedProperties() {
    const ctx = this.__ctx;
    const paths =
      ctx && ctx.selection && Array.isArray(ctx.selection.propertyPaths)
        ? ctx.selection.propertyPaths
        : [];
    const out = [];
    for (const rawPath of paths) {
      if (typeof rawPath !== 'string' || rawPath.length === 0) continue;
      const node = this.__resolveSelectedProperty(rawPath);
      if (node) {
        node.selected = true;
        out.push(node);
      }
    }
    return out;
  }

  /**
   * Resolve a (possibly layer-name-prefixed) property path against this comp's
   * layers. Tries to match the first path segment to a layer name, otherwise
   * resolves against each selected layer in turn.
   * @param {string} rawPath
   */
  __resolveSelectedProperty(rawPath) {
    const segs = rawPath.split('/').filter((s) => s.length > 0);
    if (segs.length === 0) return null;
    // (a) path is prefixed with a layer name.
    const named = this._layers.find((l) => l && l.name === segs[0]);
    if (named && typeof named.__resolveProperty === 'function') {
      const node = named.__resolveProperty(segs.slice(1));
      if (node) return node;
    }
    // (b) resolve against each currently selected layer (no prefix).
    for (const layer of this.selectedLayers) {
      if (layer && typeof layer.__resolveProperty === 'function') {
        const node = layer.__resolveProperty(segs);
        if (node) return node;
      }
    }
    return null;
  }

  /**
   * Create + append a new layer via the ctx-provided layer factory, logging a
   * createLayer operation. Returns the new layer object (fully API-capable).
   * @param {object} partialDef minimal LayerDef-ish ({ type, name, ... })
   * @param {string} name the new layer's name (also the createLayer op value)
   */
  __addLayer(partialDef, name) {
    const ctx = this.__ctx;
    const id =
      'created-' + (this._def && this._def.id ? this._def.id + '-' : '') + (this._layers.length + 1);
    const def = {
      id,
      index: this._layers.length + 1,
      name,
      type: partialDef.type || 'AV',
      threeDLayer: false,
      parentId: null,
      inPoint: 0,
      outPoint: this.duration,
      properties: [],
      ...partialDef
    };

    // Log the createLayer op.
    if (ctx && typeof ctx.pushOp === 'function') {
      ctx.pushOp({ kind: 'createLayer', target: name, value: name, meta: { type: def.type, id } });
    }

    // Build a real layer object through the integrator-provided factory so the
    // new layer carries the full AE API surface (position/effect/parent/etc.).
    // CRUCIAL: pass the comp's LIVE `_layers` array as the registry so the new
    // layer's reorder methods (moveBefore/moveToBeginning) operate on the same
    // array the comp exposes — this is what lets e.g. NullBot emit `reorder`.
    const registry = { layers: this._layers };
    let layerObj = null;
    if (ctx && typeof ctx.buildLayer === 'function') {
      layerObj = ctx.buildLayer(def, registry);
    }
    if (!layerObj) {
      // Minimal fallback layer (should not normally happen).
      layerObj = { id, __id: id, name, index: def.index, type: def.type, selected: false };
    }
    // buildLayer appended the layer to `_layers` (via the shared registry).
    // Move it to the top of the stack (AE adds new layers at index 1).
    const at = this._layers.indexOf(layerObj);
    if (at > 0) {
      this._layers.splice(at, 1);
      this._layers.unshift(layerObj);
    } else if (at < 0) {
      this._layers.unshift(layerObj);
    }
    this._reindex();
    layerObj.containingComp = this;
    layerObj.comp = this;
    if (ctx && ctx.layerById) ctx.layerById[id] = layerObj;
    return layerObj;
  }

  /** Re-assign 1-based index to every layer in stacking order. */
  _reindex() {
    this._layers.forEach((l, i) => {
      if (l) l.index = i + 1;
    });
  }

  /**
   * AE: `comp.addGuide(orientationType, position)` — add a ruler guide. There is
   * no dedicated operation kind, so we record it as an executeCommand (the
   * closest frozen kind) which is exactly what guide-adding scripts (Centralizer)
   * expect to observe.
   * @param {number} orientationType 0 = horizontal, 1 = vertical
   * @param {number} position
   */
  addGuide(orientationType, position) {
    const ctx = this.__ctx;
    if (ctx && typeof ctx.pushOp === 'function') {
      ctx.pushOp({
        kind: 'executeCommand',
        target: `guide#${orientationType}@${position}`,
        value: position,
        meta: { command: 'addGuide', orientationType }
      });
    }
    return undefined;
  }

  /** AE: `comp.removeGuide(index)` — no-op stub (no op logged). */
  removeGuide() {
    return undefined;
  }

  /** AE: `comp.setGuide(position, index)` — no-op stub. */
  setGuide() {
    return undefined;
  }

  /**
   * Replace the backing layer array. Called by the layers subsystem after it
   * builds layer objects from this comp's def. Numeric/by-name access stays
   * consistent because we read `_layers` live everywhere.
   * @param {Array<object>} layerObjs
   */
  __setLayers(layerObjs) {
    this._layers = Array.isArray(layerObjs) ? layerObjs : [];
    return this._layers;
  }
}

/**
 * Build the simulated host project + app.
 *
 * @param {import('../../contracts/index.js').HostSnapshot} snapshot
 * @param {import('../../contracts/index.js').Operation[]} log shared operation log
 * @returns {{ app: object, project: object, CompItem: typeof CompItem }}
 */
export function createProject(snapshot, log) {
  const operationLog = Array.isArray(log) ? log : [];

  // Shared context handed to the layers/properties subsystems. They read
  // `comps`/`compById` to find a CompItem, push mutations to `log`, and may
  // store anything they need under `ctx`.
  const ctx = {
    log: operationLog,
    snapshot,
    pushOp: (op) => pushOp(operationLog, op),
    comps: [],
    compById: Object.create(null),
    layerById: Object.create(null),
    selection: {
      layerIds: (snapshot && snapshot.selection && snapshot.selection.layerIds) || [],
      propertyPaths:
        (snapshot && snapshot.selection && snapshot.selection.propertyPaths) || []
    },
    // The integrator (or layers subsystem) sets this so CompItems can request
    // their layers be built lazily on first access if desired.
    buildLayers: null,
    buildProperties: null
  };

  const compDefs = (snapshot && Array.isArray(snapshot.comps) && snapshot.comps) || [];
  const comps = compDefs.map((def) => {
    const comp = new CompItem(def, ctx);
    ctx.compById[def.id] = comp;
    return comp;
  });
  ctx.comps = comps;

  // project.items reflects snapshot.project.items (ItemRefs) but resolves comp
  // ids to the actual CompItem objects where possible so scripts that index the
  // project items collection get real comps back.
  const itemRefs =
    (snapshot && snapshot.project && Array.isArray(snapshot.project.items)
      ? snapshot.project.items
      : []) || [];
  const items = itemRefs.map((ref) => {
    if (ref.typeName === 'Composition' && ctx.compById[ref.id]) {
      return ctx.compById[ref.id];
    }
    // Footage / Folder / unmatched: minimal item stub.
    return { id: ref.id, name: ref.name, typeName: ref.typeName };
  });

  const activeItemId = snapshot ? snapshot.activeItemId : null;
  const activeItem =
    (activeItemId != null && ctx.compById[activeItemId]) ||
    (activeItemId != null
      ? items.find((it) => it && it.id === activeItemId) || null
      : null);

  const itemCollection = new ItemCollection(items);

  // AE: `app.project.items.addComp(name,w,h,pixelAspect,duration,frameRate)` —
  // create a fresh composition, register it in ctx so its layers/properties are
  // fully API-capable (identical wiring to snapshot-seeded comps), append it to
  // the project items collection, and return the live CompItem. compCode-style
  // generators (Slidotron, etc.) rely on this to build their nested rigs.
  itemCollection.addComp = function addComp(name, width, height, pixelAspect, duration, frameRate) {
    const id = 'created-comp-' + (items.length + 1);
    const def = {
      id,
      name: typeof name === 'string' ? name : 'Comp ' + (items.length + 1),
      width: Number(width) || 1920,
      height: Number(height) || 1080,
      pixelAspect: Number(pixelAspect) || 1,
      duration: Number(duration) || 10,
      frameRate: Number(frameRate) || 30,
      layers: []
    };
    const comp = new CompItem(def, ctx);
    ctx.compById[id] = comp;
    ctx.comps.push(comp);
    items.push(comp);
    itemCollection._items.push(comp);
    itemCollection[items.length] = comp;
    return comp;
  };

  // AE: `app.project.items.addFolder(name)` — create a folder item. Folders carry
  // no operation semantics here; this returns a minimal FolderItem stub with the
  // `.items` collection compCode generators probe (and a settable `.label`).
  itemCollection.addFolder = function addFolder(name) {
    const folder = {
      id: 'created-folder-' + (items.length + 1),
      name: typeof name === 'string' ? name : 'Folder',
      typeName: 'Folder',
      label: 0,
      items: new ItemCollection([])
    };
    items.push(folder);
    itemCollection._items.push(folder);
    itemCollection[items.length] = folder;
    return folder;
  };

  const project = {
    items: itemCollection,
    get activeItem() {
      return activeItem || null;
    },
    // AE convenience: rootFolder/selection stubs that don't mutate. rootFolder is
    // the project's top-level FolderItem; compCode generators walk its `.items`
    // collection (findProjectItem) before creating their template folders.
    rootFolder: {
      id: 'root',
      name: 'Root',
      typeName: 'Folder',
      get items() {
        return itemCollection;
      },
      get numItems() {
        return items.length;
      }
    },
    /**
     * AE: `app.project.selection` — the items selected in the Project panel.
     * The harness models Project-panel selection as the active item (the comp a
     * script like sfxMaster operates on): when `activeItem` is a CompItem it is
     * the sole selection; otherwise the selection is empty. This is the
     * documented host contract for project-selection-driven scripts.
     */
    get selection() {
      return activeItem && activeItem.typeName === 'Composition' ? [activeItem] : [];
    },
    get numItems() {
      return items.length;
    },
    /** AE 1-based item access. */
    item(i) {
      return items[i - 1] || null;
    },
    /**
     * AE: `app.project.autoFixExpressions(oldName, newName)` — rewrites
     * expressions that referenced a renamed property. No operation semantics in
     * the harness; a no-op so compCode generators that rename layers and patch
     * their own expressions run to completion.
     */
    autoFixExpressions() {
      return undefined;
    }
  };

  const app = {
    version: '24.0',
    project,

    /** activeViewer stub — AE's app.activeViewer. */
    activeViewer: {
      type: 'Viewer',
      setActive() {
        return true;
      },
      get views() {
        return [];
      },
      get activeViewIndex() {
        return 0;
      }
    },

    /**
     * app.beginUndoGroup(name) — logs a beginUndoGroup operation.
     * @param {string} name
     */
    beginUndoGroup(name) {
      pushOp(operationLog, {
        kind: 'beginUndoGroup',
        target: typeof name === 'string' ? name : undefined,
        meta: { name }
      });
      return undefined;
    },

    /** app.endUndoGroup() — logs an endUndoGroup operation. */
    endUndoGroup() {
      pushOp(operationLog, { kind: 'endUndoGroup' });
      return undefined;
    },

    /**
     * app.executeCommand(id) — logs an executeCommand operation.
     * @param {number|string} id
     */
    executeCommand(id) {
      pushOp(operationLog, {
        kind: 'executeCommand',
        target: id != null ? String(id) : undefined,
        value: id,
        meta: { id }
      });
      return undefined;
    },

    // Common AE no-op surface that scripts touch but that the project module
    // does not model. Kept as harmless stubs so scripts run without throwing.
    findMenuCommandId() {
      return 0;
    },
    purge() {
      return undefined;
    }
  };

  // Expose the ctx hook so the layers/properties subsystems (wired by the
  // integrator) can attach behavior. Both `app.__ctx` and the returned object
  // carry it.
  app.__ctx = ctx;
  ctx.app = app;
  ctx.project = project;
  ctx.CompItem = CompItem;

  /**
   * Convenience attach hook: the integrator calls attachLayers(buildLayers,
   * buildProperties) to wire the subsystems. We immediately build layers for
   * every comp so `numLayers`/`layer(i)`/`selectedLayers` are populated.
   */
  ctx.attachLayers = (buildLayers, buildProperties) => {
    if (typeof buildLayers === 'function') ctx.buildLayers = buildLayers;
    if (typeof buildProperties === 'function') ctx.buildProperties = buildProperties;
    for (const comp of comps) {
      if (ctx.buildLayers) {
        const layerObjs = ctx.buildLayers(comp._def, ctx) || [];
        comp.__setLayers(layerObjs);
        for (const l of layerObjs) {
          if (l && l.__id != null) ctx.layerById[l.__id] = l;
          // AE: every layer back-references its comp (OrderMaster uses
          // layer.containingComp; scripts also read layer.comp).
          if (l) {
            l.containingComp = comp;
            l.comp = comp;
          }
        }
      }
    }
    return ctx;
  };

  return { app, project, CompItem, ctx };
}

export { CompItem, ItemCollection };
