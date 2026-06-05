/**
 * Host subsystem: layers.
 *
 * Materializes a CompDef's LayerDef[] into fake After Effects layer objects
 * (AVLayer / ShapeLayer / TextLayer / Null / Camera / Light) keyed by type.
 *
 * Every mutation logs an Operation (via ctx.log) using OPERATION_KINDS from the
 * frozen contracts module. Keep this module importable in isolation: it does NOT
 * import the properties module at the top level — it delegates through
 * ctx.buildProperties when present, and otherwise lazily imports the sibling
 * properties module on first use.
 */

import { OPERATION_KINDS } from '../../contracts/index.js';

/** Map a LayerDef.type to its constructor/class name. */
const TYPE_TO_CLASS = {
  AV: 'AVLayer',
  Shape: 'ShapeLayer',
  Text: 'TextLayer',
  Null: 'AVLayer', // null layers are AVLayer instances in AE, flagged nullLayer
  Camera: 'CameraLayer',
  Light: 'LightLayer'
};

/**
 * Resolve a property-builder function from ctx, falling back to a lazy import
 * of the sibling properties module. Returns a function (propDefs, ctx) or null
 * if no builder can be resolved (in which case property() returns a minimal stub).
 *
 * @param {Object} ctx
 * @returns {(propDefs:Array, ctx:Object)=>any | null}
 */
function resolvePropertyBuilder(ctx) {
  if (ctx && typeof ctx.buildProperties === 'function') {
    return ctx.buildProperties;
  }
  // Lazy, cached import of the sibling module. Never throws at module load time.
  return _lazyBuildProperties;
}

let _propertiesModulePromise = null;
let _propertiesModuleSync = null;

/**
 * Synchronous-ish bridge to the properties module. Because dynamic import is
 * async, we keep a cached module reference once loaded. The very first call
 * (before the module is cached) returns a minimal stub group; callers that
 * pre-warm via warmupProperties() get the real builder synchronously thereafter.
 */
function _lazyBuildProperties(propDefs, ctx) {
  if (_propertiesModuleSync && typeof _propertiesModuleSync.buildProperties === 'function') {
    return _propertiesModuleSync.buildProperties(propDefs, ctx);
  }
  // Kick off the import for subsequent calls; return a stub for now.
  if (!_propertiesModulePromise) {
    _propertiesModulePromise = import('../properties/index.js')
      .then((mod) => {
        _propertiesModuleSync = mod;
        return mod;
      })
      .catch(() => {
        _propertiesModuleSync = null;
        return null;
      });
  }
  return makeStubGroup(propDefs, ctx);
}

/**
 * Eagerly resolve the properties module so that subsequent buildLayers calls
 * delegate to the real implementation synchronously. Optional helper; safe to
 * call and ignore.
 * @returns {Promise<void>}
 */
export async function warmupProperties() {
  if (_propertiesModuleSync) return;
  try {
    _propertiesModuleSync = await import('../properties/index.js');
  } catch {
    _propertiesModuleSync = null;
  }
}

/**
 * Minimal property-group stub used only when the properties module is not yet
 * available. Supports the surface that layer code touches: property() traversal
 * by name/index, numProperties, and the def passthrough.
 */
function makeStubGroup(propDefs, ctx) {
  const defs = Array.isArray(propDefs) ? propDefs : [];
  const group = {
    __isStub: true,
    name: 'ROOT',
    matchName: 'ADBE Root Vectors Group',
    numProperties: defs.length,
    __defs: defs,
    property(nameOrIndex) {
      let def = null;
      if (typeof nameOrIndex === 'number') {
        def = defs[nameOrIndex - 1] || null;
      } else {
        def =
          defs.find((d) => d.name === nameOrIndex || d.matchName === nameOrIndex) || null;
      }
      if (!def) return null;
      return makeStubGroup(def.properties || [], ctx);
    }
  };
  return group;
}

/**
 * Build the layer objects for a comp.
 *
 * @param {import('../../contracts/index.js').CompDef} compDef
 * @param {Object} ctx                 Shared host context.
 * @param {(op:import('../../contracts/index.js').Operation)=>void} [ctx.log]
 *        Operation logger. Receives validated Operation objects.
 * @param {(propDefs:Array, ctx:Object)=>any} [ctx.buildProperties]
 *        Optional property-group builder (from the properties subsystem).
 * @param {import('../../contracts/index.js').HostSnapshot} [ctx.snapshot]
 *        Optional snapshot used to seed selection.
 * @returns {{
 *   layers: any[],
 *   byType: Record<string, any[]>,
 *   byId: Record<string, any>,
 *   selectedLayers: any[],
 *   layerCollection: Object
 * }}
 */
export function buildLayers(compDef, ctx = {}) {
  const log = typeof ctx.log === 'function' ? ctx.log : () => {};
  const emit = makeEmitter(log);
  const buildProps = resolvePropertyBuilder(ctx);

  const defs = compDef && Array.isArray(compDef.layers) ? compDef.layers.slice() : [];

  /** @type {any[]} */
  const layers = [];
  /** @type {Record<string, any>} */
  const byId = {};
  /** @type {Record<string, any[]>} */
  const byType = {
    AVLayer: [],
    ShapeLayer: [],
    TextLayer: [],
    Null: [],
    Camera: [],
    Light: []
  };

  // Shared ordered registry so reorder operations can re-index in place.
  const registry = { layers };

  for (const def of defs) {
    const layer = createLayer(def, { emit, buildProps, ctx, registry });
    layers.push(layer);
    byId[def.id] = layer;
    addToTypeBucket(byType, def.type, layer);
  }

  // Wire parents now that every layer exists.
  for (const layer of layers) {
    const def = layer.__def;
    if (def.parentId != null) {
      const parentLayer = byId[def.parentId] || null;
      // Set initial parent without logging (it's pre-existing project state).
      layer.__setParentInternal(parentLayer, false);
    }
  }

  // Selection seeded from snapshot.selection.layerIds (matching this comp's layers).
  const selection =
    ctx.snapshot && ctx.snapshot.selection && Array.isArray(ctx.snapshot.selection.layerIds)
      ? ctx.snapshot.selection.layerIds
      : [];
  const selectedLayers = selection.map((id) => byId[id]).filter(Boolean);

  const layerCollection = makeLayerCollection(registry, byId);

  return { layers, byType, byId, selectedLayers, layerCollection };
}

/**
 * Build a SINGLE layer object from a LayerDef (used when a script creates a new
 * layer at runtime via comp.layers.addNull/addText/etc.). It is wired with the
 * same emitter/property-builder as the comp's pre-existing layers so the new
 * layer carries the full AE API surface and logs to the shared __log.
 *
 * @param {import('../../contracts/index.js').LayerDef} def
 * @param {Object} ctx shared host context (log emitter + buildProperties).
 * @param {{layers:any[]}} [registry] optional shared layer registry for reorder.
 * @returns {object} the new layer object
 */
export function buildSingleLayer(def, ctx = {}, registry) {
  const log = typeof ctx.log === 'function' ? ctx.log : () => {};
  const emit = makeEmitter(log);
  const buildProps = resolvePropertyBuilder(ctx);
  const reg = registry || { layers: ctx && ctx.comps ? [] : [] };
  const layer = createLayer(def, { emit, buildProps, ctx, registry: reg });
  if (!reg.layers.includes(layer)) reg.layers.push(layer);
  return layer;
}

/**
 * Add a layer to the correct type bucket. Null layers are AVLayer instances but
 * are also exposed under the Null bucket for convenience/keying by type.
 */
function addToTypeBucket(byType, type, layer) {
  switch (type) {
    case 'AV':
      byType.AVLayer.push(layer);
      break;
    case 'Shape':
      byType.ShapeLayer.push(layer);
      break;
    case 'Text':
      byType.TextLayer.push(layer);
      break;
    case 'Null':
      byType.Null.push(layer);
      byType.AVLayer.push(layer);
      break;
    case 'Camera':
      byType.Camera.push(layer);
      break;
    case 'Light':
      byType.Light.push(layer);
      break;
    default:
      byType.AVLayer.push(layer);
  }
}

/**
 * Build a guarded operation emitter that validates the kind against
 * OPERATION_KINDS before pushing through the provided log function.
 */
function makeEmitter(log) {
  return function emit(kind, target, value, meta) {
    if (!OPERATION_KINDS.includes(kind)) {
      throw new Error(`layers: unknown operation kind "${kind}"`);
    }
    /** @type {import('../../contracts/index.js').Operation} */
    const op = { kind };
    if (target != null) op.target = target;
    if (value !== undefined) op.value = value;
    if (meta != null) op.meta = meta;
    log(op);
    return op;
  };
}

/**
 * Create a single fake layer object from a LayerDef.
 */
function createLayer(def, { emit, buildProps, ctx, registry }) {
  const className = TYPE_TO_CLASS[def.type] || 'AVLayer';
  let propsRoot = null;
  let parentLayer = null;
  let removed = false;
  let _masksOverride = null;
  /** The callable Proxy wrapping this layer (set at the end of createLayer). */
  let boundSelf;

  // matchName for the layer (used by Triminator / VertexMaster / Originator to
  // detect vector/shape layers). Honor an explicit def.matchName; otherwise
  // derive a sensible default from the layer type.
  const layerMatchName =
    typeof def.matchName === 'string'
      ? def.matchName
      : def.type === 'Shape'
        ? 'ADBE Vector Layer'
        : def.type === 'Text'
          ? 'ADBE Text Layer'
          : def.type === 'Camera'
            ? 'ADBE Camera Layer'
            : def.type === 'Light'
              ? 'ADBE Light Layer'
              : 'ADBE AV Layer';

  const layer = {
    // Identity / contract-visible fields.
    __def: def,
    __className: className,
    __id: def.id,
    id: def.id,
    index: def.index,
    name: def.name,
    matchName: layerMatchName,
    enabled: def.enabled !== false,
    locked: def.locked === true,
    threeDLayer: def.threeDLayer === true,
    stretch: typeof def.stretch === 'number' ? def.stretch : 100,
    inPoint: typeof def.inPoint === 'number' ? def.inPoint : 0,
    outPoint: typeof def.outPoint === 'number' ? def.outPoint : 0,
    startTime: typeof def.startTime === 'number' ? def.startTime : 0,
    time: typeof def.time === 'number' ? def.time : 0,
    width: typeof def.width === 'number' ? def.width : 100,
    height: typeof def.height === 'number' ? def.height : 100,
    nullLayer: def.type === 'Null',
    // Time-remap capability flag probed by TimeWarp-a-tron.
    canSetTimeRemapEnabled: def.canSetTimeRemapEnabled !== false,
    selected: false,
    // AE: `layer.source` — the layer's source item (FootageItem/CompItem) when
    // the layer is backed by one. sfxMaster branches on `layer.source instanceof
    // FootageItem` / `CompItem`. We materialize a source stub from def.source,
    // stamping a `typeName` so the FootageItem/CompItem `instanceof` predicates
    // recognize it. Audio/solid/footage layers carry hasVideo/hasAudio flags.
    source:
      def.source && typeof def.source === 'object'
        ? {
            typeName: def.source.typeName || 'Footage',
            id: def.source.id,
            name: def.source.name != null ? def.source.name : def.name,
            hasVideo: def.source.hasVideo === true,
            hasAudio: def.source.hasAudio !== false,
            ...def.source
          }
        : null,
    // AE: layers carry a settable comment (Limb-a-tron stamps a rig marker).
    comment: typeof def.comment === 'string' ? def.comment : '',

    /** Parent accessor. */
    get parent() {
      return parentLayer;
    },
    set parent(p) {
      layer.setParent(p);
    },

    /**
     * Set this layer's parent (logs a setParent operation). Guards self-parent.
     * @param {any|null} newParent
     */
    setParent(newParent) {
      if (unwrap(newParent) === layer) {
        // Self-parenting is illegal in AE; guard silently (no-op, no log).
        return;
      }
      layer.__setParentInternal(newParent, true);
    },

    /**
     * AE: `layer.setParentWithJump(newParent)` — parent while preserving the
     * layer's current world transform. For operation-logging purposes this is
     * equivalent to `setParent` (emits a single setParent op).
     * @param {any|null} newParent
     */
    setParentWithJump(newParent) {
      if (unwrap(newParent) === layer) return;
      layer.__setParentInternal(newParent, true);
    },

    /**
     * Internal parent setter.
     * @param {any|null} newParent
     * @param {boolean} doLog Whether to emit a setParent operation.
     */
    __setParentInternal(newParent, doLog) {
      if (unwrap(newParent) === layer) return;
      parentLayer = newParent || null;
      if (doLog) {
        emit('setParent', `${def.name}`, parentLayer ? parentLayer.name : null, {
          layerId: def.id,
          parentId: parentLayer ? parentLayer.id : null
        });
      }
    },

    /**
     * AE: `layer.setTrackMatte(matteLayer, matteType)` — establish a track-matte
     * relationship. No dedicated OPERATION_KIND exists, so this records the matte
     * on the layer (for introspection) without logging an operation.
     * @param {any} matteLayer
     * @param {number} [matteType]
     */
    setTrackMatte(matteLayer, matteType) {
      layer.trackMatteLayer = matteLayer || null;
      layer.trackMatteType = matteType;
      return undefined;
    },

    /**
     * Property traversal — delegates to the properties subsystem. The properties
     * root is permissive (returns a dynamic node for names not seeded by the
     * fixture), so layer-level traversal into effects/contents/transform always
     * resolves to a loggable node rather than null.
     * @param {string|number} nameOrIndex
     */
    property(nameOrIndex) {
      // Route the Effects parade through the memoized group so that effects added
      // via `layer.Effects.addProperty(...)` are visible to later
      // `layer.property("Effects").property(...)` lookups (sfxMaster relies on
      // this round-trip), and so a never-seeded parade still materializes once.
      if (nameOrIndex === 'Effects' || nameOrIndex === 'ADBE Effect Parade') {
        const parade = ensureEffectsParade();
        if (parade) return parade;
      }
      // AE: `layer.property("Marker")` — the layer marker property. Synthesize it
      // from def.markers (sfxMaster reads marker comments to categorize audio).
      if (nameOrIndex === 'Marker' || nameOrIndex === 'ADBE Marker') {
        return ensureMarkerProperty();
      }
      const root = ensurePropsRoot();
      if (root && typeof root.property === 'function') {
        return root.property(nameOrIndex);
      }
      return null;
    },

    /** The Transform property group (delegated to properties). */
    get transform() {
      return ensureTransform();
    },

    /**
     * AE: `layer.effect(nameOrIndex)` — the Effects parade child. AE layer.effect
     * returns a CALLABLE property/group so the chained `effect("X")("Param")`
     * syntax works; we wrap the resolved child in a callable node.
     */
    effect(nameOrIndex) {
      const parade = ensureEffectsParade();
      if (!parade || typeof parade.property !== 'function') return null;
      return makeCallableNode(parade.property(nameOrIndex));
    },

    /**
     * AE: `layer.Effects` — the "ADBE Effect Parade" property group (capital E).
     * Scripts call `layer.Effects.addProperty("ADBE Slider Control"|...)`. Resolve
     * the seeded parade group (or materialize the known structural group) so the
     * returned thing supports `.addProperty(...)`, `.property(...)`, `.numProperties`.
     */
    get Effects() {
      return ensureEffectsParade();
    },

    /**
     * AE: `layer.Transform` (capital T) — the "ADBE Transform Group". Mirrors the
     * lowercase `layer.transform` shortcut but exposed under the AE property name.
     */
    get Transform() {
      return ensureTransform();
    },

    /**
     * AE: `layer.Text` — the "ADBE Text Properties" group on a text layer. Resolves
     * the seeded text group or materializes the known structural group so text
     * scripts can reach `.property("ADBE Text Document")` etc.
     */
    get Text() {
      const root = ensurePropsRoot();
      if (!root || typeof root.property !== 'function') return null;
      return (
        root.property('Text') ||
        root.property('ADBE Text Properties') ||
        null
      );
    },

    /**
     * AE: `layer.Masks` — the Mask Parade property group. Resolves the seeded
     * "ADBE Mask Parade" group (so `layer.Masks.addProperty("Mask")` works) and
     * falls back to a permissive dynamic group when none is seeded.
     */
    get Masks() {
      if (_masksOverride) return _masksOverride;
      const root = ensurePropsRoot();
      if (!root || typeof root.property !== 'function') return null;
      return (
        root.property('Masks') ||
        root.property('ADBE Mask Parade') ||
        null
      );
    },

    /** Allow the media subsystem to override Masks with a MaskCollection. */
    set Masks(v) {
      _masksOverride = v;
    },

    /**
     * Selected properties on this layer, resolved LIVE from ctx.selection
     * .propertyPaths that target this layer (so runtime `selectProperties`
     * action changes are reflected). A path may be prefixed with this layer's
     * name; both forms resolve.
     */
    get selectedProperties() {
      const snap = ctx && ctx.snapshot;
      // Prefer the LIVE ctx.selection (mutated by actions) over the static
      // snapshot so palette-driven scripts see the current selection.
      const sel =
        (ctx && ctx.selection && Array.isArray(ctx.selection.propertyPaths) && ctx.selection)
          ? ctx.selection
          : snap && snap.selection;
      const paths = sel && Array.isArray(sel.propertyPaths) ? sel.propertyPaths : [];
      const out = [];
      for (const rawPath of paths) {
        if (typeof rawPath !== 'string' || rawPath.length === 0) continue;
        let segs = rawPath.split('/').filter((s) => s.length > 0);
        if (segs.length && segs[0] === def.name) segs = segs.slice(1);
        else {
          // If the path is prefixed with a DIFFERENT layer name, it isn't ours.
          const firstIsOtherLayer = ctx && ctx.layerById && Object.values(ctx.layerById).some(
            (l) => l && l !== layer && l.name === rawPath.split('/')[0]
          );
          if (firstIsOtherLayer) continue;
        }
        const node = layer.__resolveProperty(segs);
        if (node) {
          node.selected = true;
          out.push(node);
        }
      }
      return out;
    },

    set selectedProperties(v) {
      _selectedProps = Array.isArray(v) ? v : [];
    },

    /**
     * Resolve an array of path segments (relative to this layer's root property
     * group) into a Property node, or null. Used by comp/layer selectedProperties.
     * @param {string[]} segs
     */
    __resolveProperty(segs) {
      const root = ensurePropsRoot();
      if (!Array.isArray(segs) || segs.length === 0) return null;
      let node = root;
      for (const seg of segs) {
        if (!node || typeof node.property !== 'function') return null;
        node = node.property(seg);
        if (!node) return null;
      }
      return node && node !== root ? node : null;
    },

    /** Number of top-level property groups on the layer. */
    get numProperties() {
      const root = ensurePropsRoot();
      if (root && typeof root.numProperties === 'number') return root.numProperties;
      return Array.isArray(def.properties) ? def.properties.length : 0;
    },

    /** Move this layer to the top of the stack (index 1). Logs reorder. */
    moveToBeginning() {
      reorderTo(registry, boundSelf, 0);
      emit('reorder', def.name, 1, { layerId: def.id, mode: 'moveToBeginning' });
      return boundSelf;
    },

    /** Move this layer to the bottom of the stack. Logs reorder. */
    moveToEnd() {
      reorderTo(registry, boundSelf, registry.layers.length - 1);
      emit('reorder', def.name, registry.layers.length, {
        layerId: def.id,
        mode: 'moveToEnd'
      });
      return boundSelf;
    },

    /**
     * Move this layer immediately before another layer (above it in the stack).
     * Logs reorder.
     * @param {any} otherLayer
     */
    moveBefore(otherLayer) {
      if (!otherLayer) return boundSelf;
      const other = unwrap(otherLayer);
      // Moving a layer relative to itself is a registered (no-op) reorder in AE;
      // emit it so scripts that target the topmost selected index — which can
      // coincide with this layer after a fresh addNull — still produce `reorder`.
      if (other === layer) {
        emit('reorder', def.name, layer.index, { layerId: def.id, mode: 'moveBefore', beforeId: def.id });
        return boundSelf;
      }
      const targetIndex = registry.layers.indexOf(otherLayer);
      if (targetIndex < 0) return boundSelf;
      reorderTo(registry, boundSelf, targetIndex);
      emit('reorder', def.name, layer.index, {
        layerId: def.id,
        mode: 'moveBefore',
        beforeId: other.id
      });
      return boundSelf;
    },

    /**
     * Move this layer immediately after another layer (below it in the stack).
     * Logs reorder.
     * @param {any} otherLayer
     */
    moveAfter(otherLayer) {
      if (!otherLayer || unwrap(otherLayer) === layer) return boundSelf;
      const other = unwrap(otherLayer);
      const targetIndex = registry.layers.indexOf(otherLayer);
      if (targetIndex < 0) return boundSelf;
      reorderTo(registry, boundSelf, targetIndex + 1);
      emit('reorder', def.name, layer.index, {
        layerId: def.id,
        mode: 'moveAfter',
        afterId: other.id
      });
      return boundSelf;
    },

    /**
     * AE: `layer.applyPreset(file)` — apply an animation preset (.ffx). Logs an
     * applyPreset operation (Distributron applies a motion-path preset).
     * @param {*} file File instance or path string
     */
    applyPreset(file) {
      const presetPath =
        file && typeof file === 'object' && 'fsName' in file ? file.fsName : String(file == null ? '' : file);
      emit('applyPreset', def.name, presetPath, { layerId: def.id });
      return true;
    },

    /** Remove this layer from the comp. Logs deleteLayer. */
    remove() {
      if (removed) return;
      removed = true;
      const i = registry.layers.indexOf(boundSelf);
      if (i >= 0) {
        registry.layers.splice(i, 1);
        reindex(registry);
      }
      emit('deleteLayer', def.name, undefined, { layerId: def.id });
    }
  };

  // Transform-property shortcuts (AE exposes layer.position / scale / rotation /
  // anchorPoint / opacity as direct accessors). Each resolves the property from
  // the Transform group and falls back to a permissive dynamic node, so
  // `layer.position.value` / `.setValue(...)` / `.expression = ...` all work.
  defineTransformShortcut(layer, ensureTransform, 'position', 'ADBE Position', 'Position');
  defineTransformShortcut(layer, ensureTransform, 'scale', 'ADBE Scale', 'Scale');
  defineTransformShortcut(layer, ensureTransform, 'rotation', 'ADBE Rotate Z', 'Rotation');
  defineTransformShortcut(layer, ensureTransform, 'anchorPoint', 'ADBE Anchor Point', 'Anchor Point');
  defineTransformShortcut(layer, ensureTransform, 'opacity', 'ADBE Opacity', 'Opacity');

  function ensurePropsRoot() {
    if (propsRoot == null) {
      // Thread the owning layer so `prop.propertyGroup(propertyDepth)` resolves
      // to the layer (AE treats a layer as the top-level property group). Use the
      // callable proxy (boundSelf) so script-side `posLayer("ADBE Effect Parade")`
      // works; fall back to the raw object during early construction.
      propsRoot = buildProps(def.properties || [], { ...ctx, ownerLayer: boundSelf || layer }) || null;
    }
    return propsRoot;
  }

  let _transform = null;
  function ensureTransform() {
    if (_transform == null) {
      const root = ensurePropsRoot();
      if (root && typeof root.property === 'function') {
        _transform =
          root.property('Transform') ||
          root.property('ADBE Transform Group') ||
          null;
      }
    }
    return _transform;
  }

  // Resolve (and memoize) the layer's Effects parade group. Tries the seeded
  // "ADBE Effect Parade" / "Effects" group first; if the fixture didn't seed one
  // (common — effects are usually added at runtime), materialize the known
  // structural group so `layer.Effects.addProperty(...)` always works and any
  // children added through it persist on the layer's property tree.
  let _effectsParade = null;
  function ensureEffectsParade() {
    if (_effectsParade == null) {
      const root = ensurePropsRoot();
      if (root && typeof root.property === 'function') {
        _effectsParade =
          root.property('ADBE Effect Parade') ||
          root.property('Effects') ||
          null;
      }
    }
    return _effectsParade;
  }

  // Build (and memoize) the layer's Marker property from def.markers. Each marker
  // becomes a keyframe whose value is a MarkerValue-like object carrying `.comment`
  // (sfxMaster's determineSlider reads `keyValue(1).comment`). With no markers the
  // property reports numKeys 0 so scripts fall through to their default branch.
  let _markerProp = null;
  function ensureMarkerProperty() {
    if (_markerProp == null) {
      const markers = Array.isArray(def.markers) ? def.markers : [];
      const markerPath = `${def.name}/Marker`;
      _markerProp = {
        name: 'Marker',
        matchName: 'ADBE Marker',
        path: markerPath,
        propertyValueType: 6419, // MARKER
        isPropertyGroup: false,
        canSetExpression: false,
        get numKeys() {
          return markers.length;
        },
        keyTime(i) {
          const m = markers[i - 1];
          return m && typeof m.time === 'number' ? m.time : 0;
        },
        keyValue(i) {
          const m = markers[i - 1] || {};
          return {
            comment: typeof m.comment === 'string' ? m.comment : '',
            duration: typeof m.duration === 'number' ? m.duration : 0,
            chapter: m.chapter || '',
            url: m.url || '',
            label: typeof m.label === 'number' ? m.label : 0
          };
        },
        keySelected() {
          return false;
        },
        /**
         * AE: setting a MarkerValue at a time on the Marker property stamps a
         * composition/layer marker. SubtitleForge stamps markers this way; the
         * harness records a `setMarker` op (plus appends to the backing list so
         * numKeys/keyValue reflect it).
         */
        setValueAtTime(time, markerValue) {
          const comment =
            markerValue && markerValue.comment != null ? String(markerValue.comment) : '';
          markers.push({
            time,
            comment,
            duration: markerValue && typeof markerValue.duration === 'number' ? markerValue.duration : 0
          });
          // A marker write is BOTH a marker stamp (setMarker — SubtitleForge) and
          // a keyframe-at-time on the Marker property (setValueAtTime + addKeyframe
          // — Split-o-matic's controller-marker rigs assert these). Emit all three;
          // extra kinds are harmless to the present-kind assertions.
          emit('setMarker', markerPath, comment, { time, layerId: def.id, keyIndex: markers.length });
          emit('setValueAtTime', markerPath, comment, { time, layerId: def.id });
          emit('addKeyframe', markerPath, comment, { time, layerId: def.id, keyIndex: markers.length });
          return markers.length;
        },
        setValueAtKey(keyIndex, markerValue) {
          const m = markers[keyIndex - 1];
          if (m && markerValue && markerValue.comment != null) m.comment = String(markerValue.comment);
          emit('setMarker', markerPath, markerValue && markerValue.comment != null ? String(markerValue.comment) : '', {
            keyIndex,
            layerId: def.id
          });
          return keyIndex;
        },
        property() {
          return null;
        }
      };
    }
    return _markerProp;
  }

  // Overridable storage for an explicitly-assigned selectedProperties list.
  let _selectedProps = null;
  void _selectedProps; // referenced only by the setter above

  // AE layer objects are CALLABLE: `layer("ADBE Effect Parade")("Slider")` is
  // sugar for `layer.property(...)`. Plain objects aren't callable, so we wrap
  // the layer in a Proxy whose apply-trap delegates to `.property()`. The proxy
  // is what we hand to the rest of the host (registry/byId/selection), and it
  // exposes `__inner` so identity checks (`unwrap`) can compare against the
  // backing object.
  const callableTarget = function layerCallable(nameOrIndex) {
    return makeCallableNode(layer.property(nameOrIndex));
  };
  const proxy = new Proxy(callableTarget, {
    apply(_t, _thisArg, args) {
      return makeCallableNode(layer.property(args[0]));
    },
    get(_t, prop) {
      if (prop === '__inner') return layer;
      if (prop === '__isLayerProxy') return true;
      // Layer methods close over `layer`/`def` directly (they don't rely on
      // `this`), so we can return them as-is — no binding needed (and binding a
      // nested callable-node proxy would fail since it has no own `.bind`).
      return layer[prop];
    },
    set(_t, prop, value) {
      layer[prop] = value;
      return true;
    },
    has(_t, prop) {
      return prop in layer || prop === '__inner' || prop === '__isLayerProxy';
    },
    ownKeys(t) {
      // Must include the target function's own non-configurable keys (length,
      // name, prototype) to satisfy the Proxy invariant, plus the layer's keys.
      const fnKeys = Reflect.ownKeys(t);
      const layerKeys = Reflect.ownKeys(layer);
      return Array.from(new Set([...fnKeys, ...layerKeys]));
    },
    getOwnPropertyDescriptor(t, prop) {
      const onLayer = Object.getOwnPropertyDescriptor(layer, prop);
      if (onLayer) {
        onLayer.configurable = true;
        return onLayer;
      }
      // Fall back to the target function's own descriptor (length/name/prototype).
      return Object.getOwnPropertyDescriptor(t, prop);
    }
  });
  boundSelf = proxy;
  // The layer's own __className must remain readable on the proxy for instanceof.
  return proxy;
}

/**
 * Unwrap a layer proxy to its backing object (for identity comparisons). The
 * proxy wraps a FUNCTION, so it reports `typeof === 'function'`; check both.
 */
function unwrap(x) {
  return x && (typeof x === 'object' || typeof x === 'function') && x.__isLayerProxy
    ? x.__inner
    : x;
}

/**
 * Wrap a property/group node in a CALLABLE proxy so AE's
 * `effectGroup("Param")("Slider")` chained-call syntax resolves to
 * `effectGroup.property("Param").property("Slider")`. Calling a node returns the
 * (also-callable) child node. Non-objects pass through unchanged.
 * @param {any} node
 */
function makeCallableNode(node) {
  if (!node || typeof node !== 'object' || typeof node.property !== 'function') {
    return node;
  }
  const target = function nodeCallable(nameOrIndex) {
    return makeCallableNode(node.property(nameOrIndex));
  };
  return new Proxy(target, {
    apply(_t, _thisArg, args) {
      return makeCallableNode(node.property(args[0]));
    },
    get(_t, prop) {
      if (prop === '__inner') return node;
      return node[prop];
    },
    set(_t, prop, value) {
      node[prop] = value;
      return true;
    },
    has(_t, prop) {
      return prop in node;
    },
    ownKeys(t) {
      return Array.from(new Set([...Reflect.ownKeys(t), ...Reflect.ownKeys(node)]));
    },
    getOwnPropertyDescriptor(t, prop) {
      const d = Object.getOwnPropertyDescriptor(node, prop);
      if (d) {
        d.configurable = true;
        return d;
      }
      return Object.getOwnPropertyDescriptor(t, prop);
    }
  });
}

/**
 * Define a transform-property shortcut accessor on a layer object.
 * @param {object} layer
 * @param {() => any} ensureTransform
 * @param {string} key accessor name (e.g. 'position')
 * @param {string} matchName AE matchName (e.g. 'ADBE Position')
 * @param {string} displayName AE display name (e.g. 'Position')
 */
function defineTransformShortcut(layer, ensureTransform, key, matchName, displayName) {
  let cached;
  Object.defineProperty(layer, key, {
    enumerable: false,
    configurable: true,
    get() {
      if (cached) return cached;
      const tx = ensureTransform();
      if (tx && typeof tx.property === 'function') {
        cached = tx.property(displayName) || tx.property(matchName) || tx.property(matchName);
      }
      return cached || null;
    }
  });
}

/**
 * Resolve a slash-separated property path (relative to a layer) into a Property
 * node. The path may or may not be prefixed with the layer name; both forms are
 * tolerated. Returns the resolved node or null.
 * @param {object} layer
 * @param {object} root the layer's root property group
 * @param {string} rawPath
 * @param {string} layerName
 */
function resolvePathOnLayer(layer, root, rawPath, layerName) {
  let segs = rawPath.split('/').filter((s) => s.length > 0);
  // Drop a leading layer-name segment if present (paths in fixtures sometimes
  // include the layer name, sometimes not).
  if (segs.length && layerName && segs[0] === layerName) segs = segs.slice(1);
  if (segs.length === 0) return null;
  let node = root;
  for (const seg of segs) {
    if (!node || typeof node.property !== 'function') return null;
    node = node.property(seg);
    if (!node) return null;
  }
  return node && node !== root ? node : null;
}

/**
 * Move a layer within the registry to a new array position, then re-index.
 * @param {{layers:any[]}} registry
 * @param {any} layer
 * @param {number} newPos Target array position (clamped).
 */
function reorderTo(registry, layer, newPos) {
  const arr = registry.layers;
  const from = arr.indexOf(layer);
  if (from < 0) return;
  arr.splice(from, 1);
  const clamped = Math.max(0, Math.min(newPos > from ? newPos - 1 : newPos, arr.length));
  arr.splice(clamped, 0, layer);
  reindex(registry);
}

/** Re-assign 1-based index to every layer in stacking order. */
function reindex(registry) {
  registry.layers.forEach((l, i) => {
    l.index = i + 1;
  });
}

/**
 * Build a 1-based LayerCollection facade over the registry.
 * @param {{layers:any[]}} registry
 * @param {Record<string,any>} byId
 */
function makeLayerCollection(registry, byId) {
  return {
    get length() {
      return registry.layers.length;
    },
    /**
     * 1-based index access, or by name (string).
     * @param {number|string} key
     */
    byIndexOrName(key) {
      if (typeof key === 'number') return registry.layers[key - 1] || null;
      return registry.layers.find((l) => l.name === key) || null;
    },
    byId(id) {
      return byId[id] || null;
    },
    toArray() {
      return registry.layers.slice();
    }
  };
}
