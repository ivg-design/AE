/**
 * host/io-effects — File/Folder simulation, preset application, effect injection,
 * and executeCommand passthrough.
 *
 * createIO(log) returns { File, Folder } modeling the ExtendScript File/Folder API.
 * Real writes go to os.tmpdir()/ae-harness/<sanitized>; every write also pushes a
 * fileWrite Operation to the shared host __log.
 *
 * All operation logging uses OPERATION_KINDS from the frozen contracts module so the
 * recorded kinds can never drift from the schema.
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

import { OPERATION_KINDS } from '../../contracts/index.js';

/** Resolve an OPERATION_KINDS member by name; throws at module-eval if the contract drifts. */
function kind(name) {
  const k = OPERATION_KINDS.find((x) => x === name);
  if (!k) {
    throw new Error(`io-effects: unknown operation kind "${name}" (contract drift)`);
  }
  return k;
}

const FILE_WRITE = kind('fileWrite');
const APPLY_PRESET = kind('applyPreset');
const EXECUTE_COMMAND = kind('executeCommand');

/** Root temp dir for all harness file writes. */
export const HARNESS_TMP_ROOT = path.join(os.tmpdir(), 'ae-harness');

/** Sanitize an arbitrary script path into a safe relative temp filename. */
function sanitizeRel(p) {
  const str = String(p == null ? '' : p);
  // Strip drive letters / leading separators, collapse traversal.
  const cleaned = str
    .replace(/^[a-zA-Z]:/, '')
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
  if (cleaned) return cleaned;
  // Fall back to a deterministic-ish hash so empty/odd paths still write somewhere.
  return 'unnamed-' + crypto.createHash('sha1').update(str).digest('hex').slice(0, 8);
}

/** Ensure parent directory exists for a real temp target. */
function ensureParent(realPath) {
  fs.mkdirSync(path.dirname(realPath), { recursive: true });
}

/** Push an operation only if log is array-like with push. */
function pushLog(log, op) {
  if (log && typeof log.push === 'function') {
    log.push(op);
  }
}

/**
 * ExtendScript File.decode(uri) — URI-decode a string, tolerating malformed
 * sequences (ExtendScript does not throw on a bad escape, it returns the input).
 * Also normalizes '+' to space the way ExtendScript's decoder does.
 * @param {*} s
 * @returns {string}
 */
function uriDecode(s) {
  const str = String(s == null ? '' : s);
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch {
    // Malformed percent-escape: best-effort partial decode, never throw.
    return str.replace(/%([0-9A-Fa-f]{2})/g, (m, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
  }
}

/**
 * ExtendScript File.encode(name) — URI-encode a path string. ExtendScript leaves
 * the common path-safe characters (/ : . _ - ~) unescaped.
 * @param {*} s
 * @returns {string}
 */
function uriEncode(s) {
  const str = String(s == null ? '' : s);
  // encodeURI keeps path-structural characters; then restore a few ES leaves.
  return encodeURI(str);
}

/** Parent directory path (ExtendScript-style, forward slashes). */
function parentPath(fsPath) {
  const str = String(fsPath == null ? '' : fsPath).replace(/\\/g, '/');
  const trimmed = str.replace(/\/+$/, '');
  const idx = trimmed.lastIndexOf('/');
  if (idx <= 0) return trimmed.slice(0, idx < 0 ? 0 : idx) || '/';
  return trimmed.slice(0, idx);
}

/**
 * Create the io-effects surface.
 * @param {Array} log shared host __log (Operation[])
 * @returns {{ File: Function, Folder: Function, applyPreset: Function,
 *            addEffectStub: Function, executeCommand: Function,
 *            HARNESS_TMP_ROOT: string }}
 */
export function createIO(log) {
  /**
   * ExtendScript-style File object.
   * @constructor
   * @param {string} fsPath
   */
  function File(fsPath) {
    if (!(this instanceof File)) {
      return new File(fsPath);
    }
    this.fsName = String(fsPath == null ? '' : fsPath);
    this.fullName = this.fsName;
    this.name = sanitizeRel(this.fsName).split('/').pop() || this.fsName;
    this.path = parentPath(this.fsName);
    this._realPath = path.join(HARNESS_TMP_ROOT, sanitizeRel(this.fsName));
    this._open = false;
    this._mode = null;
    this._buffer = '';
    this._readPos = 0;
    this.encoding = 'UTF-8';
    this.lineFeed = '\n';
  }

  File.prototype.open = function open(mode) {
    this._open = true;
    this._mode = mode == null ? 'w' : String(mode);
    this._readPos = 0;
    // Read modes load existing real content (if any) so read()/readln() work.
    if (/^r/i.test(this._mode)) {
      this._buffer = fs.existsSync(this._realPath)
        ? fs.readFileSync(this._realPath, 'utf8')
        : '';
    } else if (/^a/i.test(this._mode) && fs.existsSync(this._realPath)) {
      // Append modes keep existing real content.
      this._buffer = fs.readFileSync(this._realPath, 'utf8');
    } else {
      // Write modes start a fresh buffer.
      this._buffer = '';
    }
    return true;
  };

  File.prototype.write = function write(s) {
    const text = s == null ? '' : String(s);
    this._buffer += text;
    this._flush(text, false);
    return true;
  };

  File.prototype.writeln = function writeln(s) {
    const text = (s == null ? '' : String(s)) + this.lineFeed;
    this._buffer += text;
    this._flush(text, true);
    return true;
  };

  File.prototype._flush = function _flush(chunk, isLine) {
    ensureParent(this._realPath);
    fs.writeFileSync(this._realPath, this._buffer, 'utf8');
    pushLog(log, {
      kind: FILE_WRITE,
      target: this.fsName,
      value: chunk,
      meta: { realPath: this._realPath, line: !!isLine, mode: this._mode || 'w' }
    });
  };

  /**
   * Read up to `chars` characters (or the whole remaining buffer) from the
   * current read position. Mirrors ExtendScript File.read([chars]).
   * @param {number} [chars]
   * @returns {string}
   */
  File.prototype.read = function read(chars) {
    const buf = this._buffer == null ? '' : String(this._buffer);
    const start = this._readPos | 0;
    if (start >= buf.length) return '';
    const end =
      chars == null || !isFinite(chars) ? buf.length : Math.min(buf.length, start + (chars | 0));
    const out = buf.slice(start, end);
    this._readPos = end;
    return out;
  };

  /**
   * Read a single line (up to and excluding the next line feed). Mirrors
   * ExtendScript File.readln().
   * @returns {string}
   */
  File.prototype.readln = function readln() {
    const buf = this._buffer == null ? '' : String(this._buffer);
    const start = this._readPos | 0;
    if (start >= buf.length) return '';
    let nl = buf.indexOf('\n', start);
    if (nl === -1) {
      this._readPos = buf.length;
      return buf.slice(start).replace(/\r$/, '');
    }
    const line = buf.slice(start, nl).replace(/\r$/, '');
    this._readPos = nl + 1;
    return line;
  };

  File.prototype.close = function close() {
    this._open = false;
    return true;
  };

  File.prototype.remove = function remove() {
    try {
      if (fs.existsSync(this._realPath)) fs.unlinkSync(this._realPath);
      return true;
    } catch {
      return false;
    }
  };

  // `exists` reflects the real temp-backed file so probes like
  // `if (!settingFile.exists) { ... }` behave consistently across writes.
  Object.defineProperty(File.prototype, 'exists', {
    configurable: true,
    get() {
      try {
        return fs.existsSync(this._realPath);
      } catch {
        return false;
      }
    }
  });

  // `parent` is the containing Folder (lazily constructed from the path).
  Object.defineProperty(File.prototype, 'parent', {
    configurable: true,
    get() {
      return new Folder(parentPath(this.fsName));
    }
  });

  Object.defineProperty(File.prototype, 'existsSync', { value: undefined });
  File.prototype.toString = function toString() {
    return this.fsName;
  };

  // ExtendScript File statics. decode/encode are URI helpers; fs is the
  // filesystem name. saveDialog/openDialog return null (no UI in the harness).
  File.decode = uriDecode;
  File.encode = uriEncode;
  File.fs = process && process.platform === 'win32' ? 'Windows' : 'Macintosh';
  File.isEncodingAvailable = function isEncodingAvailable() {
    return true;
  };
  File.openDialog = function openDialog() {
    return null;
  };
  File.saveDialog = function saveDialog() {
    return null;
  };

  /**
   * ExtendScript-style Folder object.
   * @constructor
   * @param {string} fsPath
   */
  function Folder(fsPath) {
    if (!(this instanceof Folder)) {
      return new Folder(fsPath);
    }
    this.fsName = String(fsPath == null ? '' : fsPath);
    this.fullName = this.fsName;
    this.name = sanitizeRel(this.fsName).split('/').pop() || this.fsName;
    this.path = parentPath(this.fsName);
    this._realPath = path.join(HARNESS_TMP_ROOT, sanitizeRel(this.fsName));
  }

  Folder.prototype.create = function create() {
    fs.mkdirSync(this._realPath, { recursive: true });
    return true;
  };

  // `exists` reflects the real temp-backed folder so `targetFolder.exists`
  // probes behave consistently with create().
  Object.defineProperty(Folder.prototype, 'exists', {
    configurable: true,
    get() {
      try {
        return fs.existsSync(this._realPath);
      } catch {
        return false;
      }
    }
  });

  // `parent` is the containing Folder.
  Object.defineProperty(Folder.prototype, 'parent', {
    configurable: true,
    get() {
      return new Folder(parentPath(this.fsName));
    }
  });

  /**
   * List items in this folder. Returns File/Folder instances backed by the
   * real temp directory (empty when the folder has not been created).
   * @returns {Array}
   */
  Folder.prototype.getFiles = function getFiles() {
    try {
      if (!fs.existsSync(this._realPath)) return [];
      return fs.readdirSync(this._realPath).map((entry) => {
        const child = this.fsName.replace(/\/+$/, '') + '/' + entry;
        const abs = path.join(this._realPath, entry);
        return fs.statSync(abs).isDirectory() ? new Folder(child) : new File(child);
      });
    } catch {
      return [];
    }
  };

  Folder.prototype.toString = function toString() {
    return this.fsName;
  };

  // ExtendScript Folder statics: decode/encode URI helpers + fs name.
  Folder.decode = uriDecode;
  Folder.encode = uriEncode;
  Folder.fs = File.fs;
  Folder.selectDialog = function selectDialog() {
    return null;
  };

  // Common ExtendScript Folder statics (used by some scripts for default dirs).
  Folder.temp = new Folder(os.tmpdir());
  Folder.desktop = new Folder(path.join(os.homedir(), 'Desktop'));
  Folder.userData = new Folder(path.join(os.homedir(), '.ae-harness-userData'));
  Folder.appData = Folder.userData;
  Folder.commonFiles = new Folder(path.join(os.homedir(), '.ae-harness-commonFiles'));
  Folder.myDocuments = new Folder(path.join(os.homedir(), 'Documents'));
  Folder.startup = new Folder(os.tmpdir());
  Folder.current = Folder.temp;

  /**
   * Apply a preset (.ffx) to a layer. Does NOT decode real FFX binary — logs applyPreset.
   * Installed as a method on layer objects by the layers subsystem, and exported here
   * as a standalone helper bound to this log.
   * @param {Object} layer  the target layer (may carry an id/name/index)
   * @param {*} file        a File instance or path string for the preset
   * @returns {boolean}
   */
  function applyPreset(layer, file) {
    const presetPath =
      file && typeof file === 'object' && 'fsName' in file
        ? file.fsName
        : String(file == null ? '' : file);
    const target = layerTarget(layer);
    pushLog(log, {
      kind: APPLY_PRESET,
      target,
      value: presetPath,
      meta: { layerId: layer && layer.id, decoded: false }
    });
    return true;
  }

  /**
   * Inject a pseudo-effect onto a layer. Effect injection has no dedicated
   * OPERATION_KINDS entry, so it is recorded under applyPreset (the closest
   * frozen kind) with meta.effect=true, and returns a pseudo-effect
   * PropertyGroup the caller can traverse.
   *
   * @param {Object} layer
   * @param {string} matchName  the effect matchName (e.g. 'ADBE Gaussian Blur 2')
   * @returns {Object} pseudo-effect property group
   */
  function addEffectStub(layer, matchName) {
    const mn = String(matchName == null ? '' : matchName);
    const target = layerTarget(layer) + '/Effects/' + mn;
    pushLog(log, {
      kind: APPLY_PRESET,
      target,
      value: mn,
      meta: { effect: true, matchName: mn, layerId: layer && layer.id }
    });
    return makePseudoEffect(mn, target);
  }

  /**
   * executeCommand passthrough — logs an executeCommand operation and returns true.
   * Mirrors app.executeCommand(menuCommandId) menu-command behavior.
   * @param {number|string} commandId
   * @returns {boolean}
   */
  function executeCommand(commandId) {
    pushLog(log, {
      kind: EXECUTE_COMMAND,
      target: String(commandId),
      value: commandId,
      meta: { source: 'io-effects' }
    });
    return true;
  }

  return {
    File,
    Folder,
    applyPreset,
    addEffectStub,
    executeCommand,
    HARNESS_TMP_ROOT
  };
}

/** Best-effort identifier for a layer used as an operation target. */
function layerTarget(layer) {
  if (!layer || typeof layer !== 'object') return String(layer == null ? '' : layer);
  if (layer.id != null) return String(layer.id);
  if (layer.name != null) return String(layer.name);
  if (layer.index != null) return 'layer#' + layer.index;
  return 'layer';
}

/**
 * Build a minimal pseudo-effect PropertyGroup that supports `.property(nameOrIndex)`,
 * `.numProperties`, `.matchName`, `.name`, so scripts can traverse an injected effect
 * without a real AE backend.
 * @param {string} matchName
 * @param {string} pathPrefix
 * @returns {Object}
 */
function makePseudoEffect(matchName, pathPrefix) {
  const children = [];

  function makeProp(name, mn, valueType, value) {
    return {
      name,
      matchName: mn,
      propertyValueType: valueType,
      path: pathPrefix + '/' + name,
      value,
      _value: value,
      canSetExpression: true,
      expression: '',
      numKeys: 0,
      setValue(v) {
        this.value = v;
        this._value = v;
        return v;
      }
    };
  }

  const group = {
    name: matchName,
    matchName,
    path: pathPrefix,
    propertyValueType: 'NoValue',
    isEffect: true,
    _children: children,
    get numProperties() {
      return children.length;
    },
    /**
     * Add a stub parameter to this pseudo-effect.
     * @returns {Object} the created property
     */
    addParam(name, mn, valueType = 'OneD', value = 0) {
      const p = makeProp(name, mn, valueType, value);
      children.push(p);
      return p;
    },
    /**
     * Traverse by 1-based index (ExtendScript style) or by name/matchName.
     * @param {number|string} nameOrIndex
     * @returns {Object|null}
     */
    property(nameOrIndex) {
      if (typeof nameOrIndex === 'number') {
        return children[nameOrIndex - 1] || null;
      }
      const key = String(nameOrIndex);
      return (
        children.find((c) => c.name === key || c.matchName === key) || null
      );
    }
  };

  return group;
}
