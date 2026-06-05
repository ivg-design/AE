/**
 * src/host/index.js — Integrate: compose the simulated After Effects host.
 *
 * `createHost(snapshot)` materializes a HostSnapshot into a single host object
 * that the sandbox runner can inject as globals:
 *
 *   { app, File, Folder, $, CompItem, AVLayer, ShapeLayer, TextLayer, __log }
 *
 * It composes the five host subsystems around ONE shared operation log
 * (`__log`), so every mutation — whether it originates in project, layers,
 * properties, media, or io-effects — lands in the same array:
 *
 *   - project      (createProject)  → app, app.project, CompItem, ctx, attachLayers
 *   - layers       (buildLayers)    → AVLayer/ShapeLayer/TextLayer objects per comp
 *   - properties   (buildProperties)→ layer.property() traversal + setValue/expression
 *   - media        (buildMedia)     → shape groups/paths, masks, TextDocument, animators
 *   - io-effects   (createIO)       → File/Folder, applyPreset, effect injection
 *
 * Two wiring details reconcile real (slightly divergent) subsystem expectations:
 *
 *   1. ctx.log shape. The layers subsystem calls `ctx.log(op)` (a FUNCTION emitter)
 *      whereas the properties / media subsystems treat `ctx.log` as an ARRAY they
 *      push onto. We give each subsystem a tailored ctx VIEW that points at the
 *      ONE underlying `__log` array, so the divergence never splits the log.
 *
 *   2. Property delegation + media. `buildProperties(propDefs, ctx)` is wired so a
 *      layer's `.property(...)` traversal reaches the properties module, and Shape/
 *      Text layers are decorated by the media module so `layer.content(...)`,
 *      `layer.sourceText`, `layer.Masks`, etc. work and log to the same `__log`.
 *
 * Also exports `runFixtureScenario(snapshot, scriptCode, actions)` which builds a
 * host, runs the script via the sandbox runner with host globals injected, applies
 * any UI actions against a captured ScriptUI window (when the script created one),
 * and returns `{ error, operations:__log }`.
 *
 * ESM only. Relative imports use explicit `.js` extensions.
 */

import { createProject } from './project/index.js';
import { buildLayers, buildSingleLayer } from './layers/index.js';
import { buildProperties, PropertyType, PropertyValueType } from './properties/index.js';
import { buildMedia, Shape } from './media/index.js';
import { createIO } from './io-effects/index.js';
import { runScript } from './sandbox/index.js';
import { OPERATION_KINDS } from '../contracts/index.js';

/** @typedef {import('../contracts/index.js').HostSnapshot} HostSnapshot */
/** @typedef {import('../contracts/index.js').Operation} Operation */
/** @typedef {import('../contracts/index.js').Action} Action */

const OPERATION_KIND_SET = new Set(OPERATION_KINDS);

/**
 * Push a validated-kind Operation onto the shared log. Throws on an unknown kind
 * so contract drift surfaces during development rather than corrupting the log.
 * @param {Operation[]} log
 * @param {Operation} op
 */
function pushOp(log, op) {
  if (op == null || typeof op !== 'object') return;
  if (!OPERATION_KIND_SET.has(op.kind)) {
    throw new Error(
      `host: unknown operation kind "${String(op.kind)}"; ` +
        `expected one of ${OPERATION_KINDS.join('|')}`
    );
  }
  log.push(op);
}

/**
 * Compose the full simulated host from a HostSnapshot.
 *
 * @param {HostSnapshot} snapshot
 * @returns {{
 *   app: object,
 *   File: Function,
 *   Folder: Function,
 *   $: object,
 *   CompItem: Function,
 *   AVLayer: Function,
 *   ShapeLayer: Function,
 *   TextLayer: Function,
 *   __log: Operation[]
 * }}
 */
export function createHost(snapshot) {
  /** @type {Operation[]} The single shared operation log. */
  const __log = [];

  // --- project / app -------------------------------------------------------
  // createProject seeds its own ctx whose `pushOp` and `log`(array) both point
  // at THIS shared __log, because we hand it __log directly.
  const { app, CompItem, ctx } = createProject(snapshot, __log);

  // Ensure ctx mutations route to the shared log regardless of which path a
  // subsystem uses. ctx.log is the array; ctx.pushOp is the validated sink.
  ctx.log = __log;
  ctx.pushOp = (op) => pushOp(__log, op);

  // --- io-effects ----------------------------------------------------------
  // File/Folder + preset/effect helpers, all logging fileWrite/applyPreset/etc.
  const io = createIO(__log);
  const { File, Folder, applyPreset, addEffectStub, executeCommand } = io;

  // --- properties builder (array-style ctx.log) ----------------------------
  // The properties subsystem treats ctx.log as an ARRAY and pushes onto it.
  // We give it a ctx view whose `.log` IS the shared __log array.
  /**
   * @param {Array} propDefs
   * @param {object} [innerCtx] traversal ctx (carries pathPrefix for nesting)
   */
  const buildPropertiesWired = (propDefs, innerCtx) => {
    const propCtx = {
      ...(innerCtx || {}),
      log: __log,
      pushOp: ctx.pushOp,
      snapshot
    };
    return buildProperties(propDefs, propCtx);
  };

  // --- media builder (pushOp/log-array ctx) --------------------------------
  // buildMedia accepts pushOp | log | __log; we hand it the shared sink. The
  // returned api is reused (its classes/factories are stateless wrt the log).
  const media = buildMedia({ pushOp: ctx.pushOp, log: __log, __log });

  // --- layers builder (function-style ctx.log emitter) ---------------------
  // The layers subsystem calls `ctx.log(op)` as a FUNCTION. We therefore hand
  // buildLayers a ctx VIEW whose `.log` is an emitter that pushes onto the same
  // shared __log, and whose `.buildProperties` is the array-wired builder above.
  // After each layer is built we decorate Shape/Text layers via the media api so
  // content()/sourceText/Masks reach the media module and log to the same array.
  const layersCtx = {
    ...ctx,
    snapshot,
    log: (op) => pushOp(__log, op),
    buildProperties: buildPropertiesWired,
    pushOp: ctx.pushOp
  };

  /**
   * Wire buildLayers + media decoration through ctx.attachLayers. createProject
   * calls our builder per comp; we attach media surfaces afterwards.
   * @param {import('../contracts/index.js').CompDef} compDef
   * @param {object} _projectCtx the project's own ctx (ignored in favor of layersCtx)
   */
  const buildLayersWired = (compDef, _projectCtx) => {
    const result = buildLayers(compDef, layersCtx);
    const layerObjs = result && Array.isArray(result.layers) ? result.layers : [];
    // Decorate Shape/Text (and AV w/ masks) layers with the media surface so
    // their content/sourceText/Masks reach the media module on the shared log.
    for (const layer of layerObjs) {
      const def = layer && layer.__def ? layer.__def : {};
      media.attachToLayer(layer, def);
    }
    return layerObjs;
  };

  // Single-layer factory for runtime layer creation (comp.layers.addNull etc.).
  // Each created layer is decorated by the media surface like a seeded layer.
  // The factory accepts the comp's live layer array as the registry so reorder
  // operations (moveBefore/moveToBeginning) on the new layer see all siblings.
  ctx.buildLayer = (def, registry) => {
    const layer = buildSingleLayer(def, layersCtx, registry);
    media.attachToLayer(layer, def);
    return layer;
  };

  // attachLayers builds layers for every comp and indexes them by id.
  if (typeof ctx.attachLayers === 'function') {
    ctx.attachLayers(buildLayersWired, buildPropertiesWired);
  }

  // --- selection wiring ----------------------------------------------------
  // Flag each layer named in snapshot.selection.layerIds as `.selected = true`
  // so comp.selectedLayers (and layer.selectedProperties) resolve. This is THE
  // root-cause fix: without it scripts hit their "select a layer" guard and
  // only ever produce an [alert].
  const selLayerIds =
    (snapshot && snapshot.selection && Array.isArray(snapshot.selection.layerIds)
      ? snapshot.selection.layerIds
      : []) || [];
  for (const id of selLayerIds) {
    const layer = ctx.layerById && ctx.layerById[id];
    if (layer) {
      layer.selected = true;
      // Eagerly resolve this layer's selectedProperties so the props are flagged
      // and so comp.selectedProperties is populated on first access.
      try {
        // accessing the getter triggers lazy resolution + .selected flags
        void layer.selectedProperties;
      } catch {
        /* non-fatal */
      }
    }
  }

  // --- effect/preset surface on app + layers -------------------------------
  // Expose preset application + effect injection + executeCommand passthrough
  // through the io-effects helpers (already bound to __log).
  app.applyPreset = (layer, file) => applyPreset(layer, file);
  app.addEffect = (layer, matchName) => addEffectStub(layer, matchName);
  // executeCommand is already provided by project; keep io's as a fallback that
  // routes to the same log if project's is ever absent.
  if (typeof app.executeCommand !== 'function') {
    app.executeCommand = (id) => executeCommand(id);
  }

  // --- $ (ExtendScript engine object) --------------------------------------
  // Scripts probe `$.writeln`, `$.write`, `$.version`, `$.os`, `$.screens`, etc.
  // writeln is captured into a buffer so functional checks can inspect output.
  /** @type {string[]} */
  const dollarBuffer = [];
  const $ = {
    version: '24.0',
    build: '0',
    buildDate: new Date(0),
    os: process && process.platform ? `Host ${process.platform}` : 'Host',
    locale: 'en_US',
    appName: 'aftereffects',
    /** $.writeln(msg) — captured to a buffer (no operation logged; it's diagnostic). */
    writeln(msg) {
      dollarBuffer.push(String(msg == null ? '' : msg));
      return undefined;
    },
    /** $.write(msg) — captured without a trailing newline. */
    write(msg) {
      dollarBuffer.push(String(msg == null ? '' : msg));
      return undefined;
    },
    /** Inspect captured writeln/write output. */
    __buffer: dollarBuffer,
    /** $.global — points back at the (sandbox) global; set by the sandbox runner. */
    global: undefined,
    gc() {
      return undefined;
    },
    sleep() {
      return undefined;
    },
    get screens() {
      return [{ left: 0, top: 0, right: 1920, bottom: 1080, primary: true }];
    }
  };

  // --- layer class constructors (exposed as globals) -----------------------
  // Catalog scripts use these names in `instanceof` checks. We back them with
  // lightweight constructors whose prototype matches the className the layers
  // subsystem stamps on each built layer object (`layer.__className`).
  const AVLayer = makeLayerClass('AVLayer', ctx);
  const ShapeLayer = makeLayerClass('ShapeLayer', ctx);
  const TextLayer = makeLayerClass('TextLayer', ctx);

  // --- generic Layer + Property class constructors (exposed as globals) -----
  // Catalog scripts use these names in `instanceof` checks (Linearizer:
  // `prop instanceof Property`; others probe Layer/PropertyGroup). They are
  // backed by Symbol.hasInstance predicates that recognize the host's layer /
  // property / group objects (which may be wrapped in callable Proxies).
  const Layer = makeLayerBaseClass();
  const Property = makePropertyClass();
  const PropertyGroup = makePropertyGroupClass(false);
  const MaskPropertyGroup = makePropertyGroupClass(true);
  // FootageItem — `x instanceof FootageItem` is true for a layer source whose
  // typeName is 'Footage' (sfxMaster branches audio footage vs nested comp).
  const FootageItem = makeItemClass('FootageItem', 'Footage');

  return {
    app,
    File,
    Folder,
    $,
    CompItem,
    AVLayer,
    ShapeLayer,
    TextLayer,
    Layer,
    Property,
    PropertyGroup,
    MaskPropertyGroup,
    FootageItem,
    __log,
    // Non-contract extras useful to runFixtureScenario / callers (harmless).
    media,
    ctx
  };
}

/**
 * Resolve a possibly-Proxy-wrapped host object to the backing target so
 * Symbol.hasInstance predicates can inspect its real fields. Layer/property
 * proxies wrap a FUNCTION and expose `__inner`; property nodes expose it too.
 * @param {*} obj
 */
function unwrapForInstance(obj) {
  if (obj && (typeof obj === 'object' || typeof obj === 'function') && obj.__inner) {
    return obj.__inner;
  }
  return obj;
}

/**
 * Build the generic `Layer` class. `x instanceof Layer` is true for any host
 * layer object (AVLayer/ShapeLayer/TextLayer/Null/Camera/Light), including the
 * callable Proxy wrapper. Identified by the layer's `__className` (set by the
 * layers subsystem) or the layer-proxy marker.
 * @returns {Function}
 */
/**
 * Build an Item class (FootageItem) whose `instanceof` matches host item stubs
 * carrying the given `typeName`. Layer sources are plain stubs with a typeName.
 * @param {string} className
 * @param {string} typeName
 * @returns {Function}
 */
function makeItemClass(className, typeName) {
  function ItemClass() {}
  Object.defineProperty(ItemClass, Symbol.hasInstance, {
    value(obj) {
      if (!obj || typeof obj !== 'object') return false;
      return obj.typeName === typeName;
    }
  });
  Object.defineProperty(ItemClass, 'name', { value: className });
  return ItemClass;
}

function makeLayerBaseClass() {
  function Layer() {}
  Object.defineProperty(Layer, Symbol.hasInstance, {
    value(obj) {
      if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
      if (obj.__isLayerProxy === true) return true;
      const t = unwrapForInstance(obj);
      return !!(t && typeof t.__className === 'string' && /Layer$/.test(t.__className));
    }
  });
  Object.defineProperty(Layer, 'name', { value: 'Layer' });
  return Layer;
}

/**
 * Build the `Property` (leaf) class. `x instanceof Property` is true for a host
 * leaf Property node — one that carries the AE Property surface (setValue) and
 * is NOT a property group. Property GROUPS resolve false so scripts (Linearizer)
 * can filter selected properties down to real leaves.
 * @returns {Function}
 */
function makePropertyClass() {
  function Property() {}
  Object.defineProperty(Property, Symbol.hasInstance, {
    value(obj) {
      if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
      const t = unwrapForInstance(obj);
      if (!t || typeof t !== 'object') return false;
      // Exclude layers (they also carry property-ish surface in some shapes).
      if (typeof t.__className === 'string' && /Layer$/.test(t.__className)) return false;
      if (t.isPropertyGroup === true) return false;
      // A leaf property exposes setValue + a propertyType of 'Property', or at
      // minimum the leaf marker isPropertyGroup === false with a value accessor.
      if (t.propertyType === 'Property') return true;
      return t.isPropertyGroup === false && typeof t.setValue === 'function';
    }
  });
  Object.defineProperty(Property, 'name', { value: 'Property' });
  return Property;
}

/**
 * Build a `PropertyGroup` (or `MaskPropertyGroup`) class. `x instanceof
 * PropertyGroup` is true for any host property GROUP node (isPropertyGroup).
 * The Mask variant additionally requires a mask-parade-ish matchName.
 * @param {boolean} maskOnly
 * @returns {Function}
 */
function makePropertyGroupClass(maskOnly) {
  function PropertyGroup() {}
  Object.defineProperty(PropertyGroup, Symbol.hasInstance, {
    value(obj) {
      if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
      const t = unwrapForInstance(obj);
      if (!t || typeof t !== 'object') return false;
      if (t.isPropertyGroup !== true) return false;
      if (!maskOnly) return true;
      const mn = String(t.matchName || '');
      const nm = String(t.name || '');
      return /Mask/.test(mn) || /Mask/.test(nm);
    }
  });
  Object.defineProperty(PropertyGroup, 'name', {
    value: maskOnly ? 'MaskPropertyGroup' : 'PropertyGroup'
  });
  return PropertyGroup;
}

/**
 * Build a lightweight layer class for `instanceof` support. Built layer objects
 * are plain objects carrying `__className`; we make `instanceof` resolve via a
 * Symbol.hasInstance check against that className so scripts that test
 * `layer instanceof AVLayer` behave sensibly.
 *
 * @param {string} className
 * @param {object} _ctx
 * @returns {Function}
 */
function makeLayerClass(className, _ctx) {
  function LayerClass() {}
  LayerClass.className = className;
  Object.defineProperty(LayerClass, Symbol.hasInstance, {
    value(obj) {
      // Layer objects may be wrapped in a callable Proxy (so `layer("X")` works),
      // which makes `typeof obj === 'function'`. Accept objects AND such proxies.
      if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
      if (obj.__className === className) return true;
      // Null layers are AVLayer instances in AE.
      if (className === 'AVLayer' && obj.nullLayer === true) return true;
      return false;
    }
  });
  // Friendly name for diagnostics.
  Object.defineProperty(LayerClass, 'name', { value: className });
  return LayerClass;
}

/**
 * Build a host, run a script under test in the sandbox with host globals
 * injected, then apply UI actions against any ScriptUI window the script built.
 *
 * The script is run in the sandbox with the host globals plus alert/prompt/
 * confirm (which log to __log) and an optional ScriptUI runtime (Window/
 * ScriptUI). If the script assigns its window to a global (`__win`, `win`,
 * `dlg`, `dialog`, `myPanel`, `palette`, or returns it), we capture it and run
 * the supplied actions against it via the scriptui/actions runner; that runner's
 * operations are merged into the same __log.
 *
 * @param {HostSnapshot} snapshot
 * @param {string} scriptCode
 * @param {Action[]} [actions]
 * @returns {Promise<{ error: (Error|null), operations: Operation[] }>}
 */
export async function runFixtureScenario(snapshot, scriptCode, actions = []) {
  const host = createHost(snapshot);
  const { __log } = host;

  // alert/prompt/confirm log to the shared __log (frozen kinds).
  const alert = (msg) => {
    pushOp(__log, { kind: 'alert', value: String(msg == null ? '' : msg) });
    return undefined;
  };
  const prompt = (msg, dflt) => {
    pushOp(__log, {
      kind: 'prompt',
      value: dflt == null ? null : String(dflt),
      meta: { message: String(msg == null ? '' : msg) }
    });
    return dflt == null ? '' : String(dflt);
  };
  const confirm = (msg) => {
    pushOp(__log, { kind: 'confirm', value: true, meta: { message: String(msg == null ? '' : msg) } });
    return true;
  };

  // Optionally provide a ScriptUI runtime so scripts that build dialogs run.
  let scriptui = null;
  try {
    const mod = await import('../scriptui/index.js');
    if (mod && typeof mod.createScriptUIRuntime === 'function') {
      scriptui = mod.createScriptUIRuntime();
    }
  } catch {
    scriptui = null; // ScriptUI runtime is optional; absence is non-fatal.
  }

  const globals = {
    app: host.app,
    File: host.File,
    Folder: host.Folder,
    $: host.$,
    CompItem: host.CompItem,
    AVLayer: host.AVLayer,
    ShapeLayer: host.ShapeLayer,
    TextLayer: host.TextLayer,
    // Generic AE base classes used by catalog scripts in `instanceof` guards
    // (Linearizer: `prop instanceof Property`; others probe Layer/PropertyGroup).
    Layer: host.Layer,
    Property: host.Property,
    PropertyGroup: host.PropertyGroup,
    MaskPropertyGroup: host.MaskPropertyGroup,
    FootageItem: host.FootageItem,
    // AE value/enum globals used directly by catalog scripts.
    Shape,
    PropertyType,
    PropertyValueType,
    KeyframeInterpolationType: Object.freeze({ LINEAR: 6612, BEZIER: 6613, HOLD: 6614 }),
    GpuAccelType: Object.freeze({ CUDA: 1816, METAL: 1817, OPENCL: 1818, SOFTWARE: 1819 }),
    MaskMode: Object.freeze({
      NONE: 6612, ADD: 6613, SUBTRACT: 6614, INTERSECT: 6615,
      LIGHTEN: 6616, DARKEN: 6617, DIFFERENCE: 6618
    }),
    BlendingMode: Object.freeze({ NORMAL: 5012, ADD: 5016, MULTIPLY: 5021, SCREEN: 5026 }),
    // Text paragraph justification enum (SubtitleForge sets justification on a
    // TextDocument). AE numeric codes for the ParagraphJustification enum.
    ParagraphJustification: Object.freeze({
      LEFT_JUSTIFY: 7415,
      RIGHT_JUSTIFY: 7416,
      CENTER_JUSTIFY: 7417,
      FULL_JUSTIFY_LASTLINE_LEFT: 7418,
      FULL_JUSTIFY_LASTLINE_RIGHT: 7419,
      FULL_JUSTIFY_LASTLINE_CENTER: 7420,
      FULL_JUSTIFY_LASTLINE_FULL: 7421,
      MULTIPLE_JUSTIFICATIONS: 7422
    }),
    // Track-matte enum used by compCode slider rigs (comp.layer.setTrackMatte).
    TrackMatteType: Object.freeze({ NO_TRACK_MATTE: 6012, ALPHA: 6013, ALPHA_INVERTED: 6014, LUMA: 6015, LUMA_INVERTED: 6016 }),
    KeyframeEase: function KeyframeEase(speed, influence) {
      this.speed = speed;
      this.influence = influence;
    },
    // AE MarkerValue — a composition/layer marker. Constructed by compCode
    // generators that stamp Duik controller markers; carries the mutable fields
    // (comment, label, cue-point flags) and a `setParameters` collector. Holds no
    // operation semantics on its own — it becomes a `setMarker` op only when
    // assigned to a Marker property via setValueAtTime (handled by properties).
    MarkerValue: function MarkerValue(comment) {
      this.comment = comment == null ? '' : String(comment);
      this.chapter = '';
      this.url = '';
      this.frameTarget = '';
      this.cuePointName = '';
      this.eventCuePoint = false;
      this.duration = 0;
      this.label = 0;
      this.protectedRegion = false;
      /** @type {Record<string,string>} */
      this.parameters = {};
      this.setParameters = function setParameters(params) {
        if (params && typeof params === 'object') {
          for (const k in params) {
            if (Object.prototype.hasOwnProperty.call(params, k)) this.parameters[k] = params[k];
          }
        }
        return undefined;
      };
      this.getParameters = function getParameters() {
        return this.parameters;
      };
    },
    // Diagnostic helper some catalog scripts call (no AE equivalent); no-op so
    // scripts that log progress don't throw a ReferenceError.
    writeLn: (msg) => host.$.writeln(msg),
    alert,
    prompt,
    confirm,
    __log
  };

  // Track every Window the script creates so we can drive its UI even when the
  // script keeps the window in a LOCAL variable (e.g. TimeWarp-a-tron builds its
  // dialog inside createUI() and never exposes it on a global). We wrap the
  // runtime's Window factory to record each created window.
  /** @type {object[]} */
  const createdWindows = [];
  // Input-bearing actions (text fields, dropdowns, checkboxes) the script's
  // MODAL dialogs read SYNCHRONOUSLY inside `.show()` — before the post-run
  // actions runner gets a chance to apply them. We pre-apply these to each
  // window's controls at show-time so modal-dialog scripts (TextMate's search
  // term, Limb-a-tron's name, Linearizer's min/max, PathMaster's settings) see
  // the fixture-provided input. `click`/`run` remain post-run (palette flows).
  const inputActions = Array.isArray(actions)
    ? actions.filter((a) => a && (a.type === 'type' || a.type === 'change' || a.type === 'select'))
    : [];
  if (scriptui) {
    const RealWindow = scriptui.Window;
    /** @param {...any} args */
    const TrackingWindow = function Window(...args) {
      const w = RealWindow.apply(this, args);
      if (w && typeof w === 'object') {
        createdWindows.push(w);
        if (inputActions.length && typeof w.show === 'function') {
          // Override this window's show() to seed its controls from the fixture's
          // input actions first, then run the runtime's modeled show() (which
          // fires the accept button and returns 1 for modal dialogs).
          const realShow = w.show.bind(w);
          let seeded = false;
          w.show = function show(...showArgs) {
            if (!seeded) {
              seeded = true;
              applyInputActionsToWindow(w, inputActions);
            }
            return realShow(...showArgs);
          };
        }
      }
      return w;
    };
    // Preserve any statics on the original factory.
    Object.assign(TrackingWindow, RealWindow);
    globals.Window = TrackingWindow;
    globals.ScriptUI = scriptui.ScriptUI;
  }

  // ScriptUI exposes `Panel` as a host class so `@ui PANEL` scripts can branch on
  // `thisObj instanceof Panel` (the dockable-panel idiom). In the harness `thisObj`
  // is never a real docked Panel, so this constructor exists purely to satisfy the
  // `instanceof` guard (it resolves false) and let the script fall through to its
  // `new Window("palette", …)` path. Defined unconditionally so headless and UI
  // scripts alike never hit a ReferenceError on the right-hand operand.
  if (globals.Panel === undefined) {
    globals.Panel = function Panel() {};
  }

  // $.global should resolve to the sandbox global once it exists.
  host.$.global = globals;

  const { error } = runScript(scriptCode, globals, { timeoutMs: 5000 });

  // Apply UI actions if a ScriptUI runtime is present and the script exposed a
  // window. We probe common global names the catalog scripts use, then fall back
  // to the last window the script constructed (captured via the tracking factory).
  if (scriptui && Array.isArray(actions) && actions.length > 0) {
    const win =
      findCapturedWindow(globals) ||
      (createdWindows.length ? createdWindows[createdWindows.length - 1] : null);
    if (win) {
      try {
        const actionsMod = await import('../scriptui/actions/index.js');
        if (actionsMod && typeof actionsMod.runActions === 'function') {
          const driver = { win, selection: host.ctx.selection, snapshot, host: host.ctx };
          const { log } = actionsMod.runActions(driver, actions);
          // Merge action operations into the shared __log (validated kinds).
          if (Array.isArray(log)) {
            for (const op of log) pushOp(__log, op);
          }
        }
      } catch {
        /* actions runner is optional; ignore wiring failures */
      }
    }
  }

  // Capture the script's own ScriptUI window as a UITree for the UI/report
  // pipeline (the CLI `ui` command renders + screenshots it).
  let uiTree = null;
  if (scriptui && typeof scriptui.captureTree === 'function') {
    const win =
      findCapturedWindow(globals) ||
      (createdWindows.length ? createdWindows[createdWindows.length - 1] : null);
    if (win) {
      try {
        uiTree = scriptui.captureTree(win);
      } catch {
        uiTree = null;
      }
    }
  }

  return { error, operations: __log, uiTree };
}

/**
 * Seed a freshly-built ScriptUI window's controls from the fixture's input
 * actions (`type`/`change`/`select`) BEFORE the script's modal `.show()` reads
 * them. This mirrors the scriptui/actions resolution (by name/text, with a
 * substring fallback) but applies only the VALUE-setting effect — button clicks
 * and the final `run` are left to the post-run actions runner / modal auto-accept.
 * @param {object} win the window container
 * @param {Array} inputActions filtered input actions
 */
function applyInputActionsToWindow(win, inputActions) {
  const controls = flattenWindowControls(win);
  for (const action of inputActions) {
    let ctrl = resolveWindowControl(controls, action.target);
    if (!ctrl && (action.type === 'type' || action.type === 'change')) {
      // Single-field dialogs often use an unnamed, empty-text edittext that no
      // name/text target can resolve. When exactly one edittext exists, seed it.
      const edits = controls.filter((c) => c && c.type === 'edittext');
      if (edits.length === 1) ctrl = edits[0];
    }
    if (!ctrl) continue;
    const value = action.value;
    if (action.type === 'type') {
      ctrl.text = value == null ? '' : String(value);
      if ('value' in ctrl) ctrl.value = ctrl.text;
    } else if (action.type === 'change') {
      if ('value' in ctrl && typeof value !== 'string') {
        ctrl.value = value;
      } else if ('text' in ctrl) {
        ctrl.text = value == null ? ctrl.text : String(value);
        if ('value' in ctrl) ctrl.value = ctrl.text;
      } else if ('value' in ctrl) {
        ctrl.value = value;
      }
    } else if (action.type === 'select') {
      if (Array.isArray(ctrl.items) && ctrl.items.length) {
        // dropdown/listbox: select the item matching `value` (by text), else index.
        let idx = -1;
        if (typeof value === 'number') idx = value;
        else if (value != null) {
          idx = ctrl.items.findIndex(
            (it) => (typeof it === 'string' ? it : it && it.text) === value
          );
        }
        if (idx >= 0 && ctrl.items[idx]) {
          if (ctrl.items[idx] && typeof ctrl.items[idx] === 'object') ctrl.items[idx].selected = true;
          ctrl.selection = ctrl.items[idx];
        }
      } else if ('value' in ctrl) {
        ctrl.value = typeof value === 'boolean' ? value : value == null ? true : Boolean(value);
      }
    }
  }
}

/** Flatten a window's descendant controls (DFS, excluding the window itself). */
function flattenWindowControls(win) {
  const out = [];
  const stack = Array.isArray(win && win.children) ? win.children.slice() : [];
  while (stack.length) {
    const c = stack.shift();
    if (!c || typeof c !== 'object') continue;
    out.push(c);
    if (Array.isArray(c.children)) for (const ch of c.children) stack.push(ch);
  }
  return out;
}

/**
 * Resolve a control among `controls` by exact name/text/title/label, then
 * case-insensitive, then substring — mirroring the scriptui/actions resolver so
 * targeting is consistent across pre-show seeding and post-run actions.
 * @param {object[]} controls
 * @param {string|undefined} target
 */
function resolveWindowControl(controls, target) {
  if (target == null) return null;
  const t = String(target);
  const tl = t.toLowerCase();
  const lc = (s) => (typeof s === 'string' ? s.toLowerCase() : '');
  const matchers = [
    (c) => c.name === t,
    (c) => c.text === t,
    (c) => c.title === t,
    (c) => c.label === t,
    (c) => lc(c.name) === tl,
    (c) => lc(c.text) === tl,
    (c) => typeof c.name === 'string' && lc(c.name).indexOf(tl) !== -1,
    (c) => typeof c.text === 'string' && lc(c.text).indexOf(tl) !== -1
  ];
  for (const m of matchers) {
    for (const c of controls) {
      try {
        if (m(c)) return c;
      } catch {
        /* tolerant */
      }
    }
  }
  return null;
}

/**
 * Probe the sandbox globals for a ScriptUI window the script created. Scripts
 * commonly leave it on one of these names; the first object with a `children`
 * array (a container) wins.
 * @param {object} globals
 * @returns {object|null}
 */
function findCapturedWindow(globals) {
  const candidates = [
    '__win',
    'win',
    'window',
    'dlg',
    'dialog',
    'myDialog',
    'myPanel',
    'panel',
    'palette',
    'ui',
    'theWindow'
  ];
  for (const name of candidates) {
    const v = globals[name];
    if (v && typeof v === 'object' && Array.isArray(v.children)) return v;
  }
  return null;
}

export default createHost;
