/**
 * FROZEN CONTRACT — host snapshot schema.
 *
 * A HostSnapshot is the declarative description of an After Effects project state
 * that the simulated host (src/host/**) materializes into a fake `app` object.
 *
 * Validators NEVER throw. They return { ok: boolean, errors: string[] }.
 */

/**
 * @typedef {Object} ItemRef
 * @property {string} id
 * @property {string} name
 * @property {'Composition'|'Footage'|'Folder'} typeName
 */

/**
 * @typedef {Object} Keyframe
 * @property {number} time
 * @property {*} value
 * @property {*} [interpolationIn]
 * @property {*} [interpolationOut]
 */

/**
 * @typedef {Object} PropertyDef
 * @property {string} matchName
 * @property {string} name
 * @property {string} path                 Slash-separated property path.
 * @property {'OneD'|'TwoD'|'ThreeD'|'Color'|'Shape'|'NoValue'|'CustomValue'} propertyValueType
 * @property {*} [value]
 * @property {string} [expression]
 * @property {Keyframe[]} [keyframes]
 * @property {boolean} canSetExpression
 * @property {number} [numProperties]
 * @property {PropertyDef[]} [properties]   Nested child properties (groups).
 */

/**
 * @typedef {Object} LayerDef
 * @property {string} id
 * @property {number} index
 * @property {string} name
 * @property {'AV'|'Shape'|'Text'|'Null'|'Camera'|'Light'} type
 * @property {boolean} threeDLayer
 * @property {string|null} parentId
 * @property {number} inPoint
 * @property {number} outPoint
 * @property {PropertyDef[]} properties
 * @property {Array<*>} [markers]
 * @property {Object} [source]
 * @property {Object} [text]
 * @property {Array<*>} [masks]
 */

/**
 * @typedef {Object} CompDef
 * @property {string} id
 * @property {string} name
 * @property {number} width
 * @property {number} height
 * @property {number} duration
 * @property {number} frameRate
 * @property {number} pixelAspect
 * @property {LayerDef[]} layers
 */

/**
 * @typedef {Object} HostSnapshot
 * @property {string} appVersion
 * @property {{ items: ItemRef[] }} project
 * @property {string|null} activeItemId
 * @property {CompDef[]} comps
 * @property {{ layerIds: string[], propertyPaths: string[] }} selection
 */

const ITEM_TYPE_NAMES = ['Composition', 'Footage', 'Folder'];
const LAYER_TYPES = ['AV', 'Shape', 'Text', 'Null', 'Camera', 'Light'];
const PROPERTY_VALUE_TYPES = ['OneD', 'TwoD', 'ThreeD', 'Color', 'Shape', 'NoValue', 'CustomValue'];

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isStr(v) {
  return typeof v === 'string';
}
function isNum(v) {
  return typeof v === 'number' && !Number.isNaN(v);
}
function isBool(v) {
  return typeof v === 'boolean';
}

/**
 * @param {*} kf
 * @param {string} where
 * @param {string[]} errors
 */
function checkKeyframe(kf, where, errors) {
  if (!isObj(kf)) {
    errors.push(`${where}: keyframe must be an object`);
    return;
  }
  if (!isNum(kf.time)) errors.push(`${where}.time must be a number`);
  if (!('value' in kf)) errors.push(`${where}.value is required`);
}

/**
 * @param {*} p
 * @param {string} where
 * @param {string[]} errors
 */
function checkPropertyDef(p, where, errors) {
  if (!isObj(p)) {
    errors.push(`${where}: PropertyDef must be an object`);
    return;
  }
  if (!isStr(p.matchName)) errors.push(`${where}.matchName must be a string`);
  if (!isStr(p.name)) errors.push(`${where}.name must be a string`);
  if (!isStr(p.path)) errors.push(`${where}.path must be a string`);
  if (!PROPERTY_VALUE_TYPES.includes(p.propertyValueType)) {
    errors.push(`${where}.propertyValueType must be one of ${PROPERTY_VALUE_TYPES.join('|')}`);
  }
  if (!isBool(p.canSetExpression)) errors.push(`${where}.canSetExpression must be a boolean`);
  if ('expression' in p && p.expression != null && !isStr(p.expression)) {
    errors.push(`${where}.expression must be a string when present`);
  }
  if ('numProperties' in p && p.numProperties != null && !isNum(p.numProperties)) {
    errors.push(`${where}.numProperties must be a number when present`);
  }
  if ('keyframes' in p && p.keyframes != null) {
    if (!Array.isArray(p.keyframes)) {
      errors.push(`${where}.keyframes must be an array when present`);
    } else {
      p.keyframes.forEach((kf, i) => checkKeyframe(kf, `${where}.keyframes[${i}]`, errors));
    }
  }
  if ('properties' in p && p.properties != null) {
    if (!Array.isArray(p.properties)) {
      errors.push(`${where}.properties must be an array when present`);
    } else {
      p.properties.forEach((c, i) => checkPropertyDef(c, `${where}.properties[${i}]`, errors));
    }
  }
}

/**
 * @param {*} l
 * @param {string} where
 * @param {string[]} errors
 */
function checkLayerDef(l, where, errors) {
  if (!isObj(l)) {
    errors.push(`${where}: LayerDef must be an object`);
    return;
  }
  if (!isStr(l.id)) errors.push(`${where}.id must be a string`);
  if (!Number.isInteger(l.index)) errors.push(`${where}.index must be an integer`);
  if (!isStr(l.name)) errors.push(`${where}.name must be a string`);
  if (!LAYER_TYPES.includes(l.type)) errors.push(`${where}.type must be one of ${LAYER_TYPES.join('|')}`);
  if (!isBool(l.threeDLayer)) errors.push(`${where}.threeDLayer must be a boolean`);
  if (l.parentId != null && !isStr(l.parentId)) errors.push(`${where}.parentId must be a string or null`);
  if (!isNum(l.inPoint)) errors.push(`${where}.inPoint must be a number`);
  if (!isNum(l.outPoint)) errors.push(`${where}.outPoint must be a number`);
  if (!Array.isArray(l.properties)) {
    errors.push(`${where}.properties must be an array`);
  } else {
    l.properties.forEach((p, i) => checkPropertyDef(p, `${where}.properties[${i}]`, errors));
  }
}

/**
 * @param {*} c
 * @param {string} where
 * @param {string[]} errors
 */
function checkCompDef(c, where, errors) {
  if (!isObj(c)) {
    errors.push(`${where}: CompDef must be an object`);
    return;
  }
  if (!isStr(c.id)) errors.push(`${where}.id must be a string`);
  if (!isStr(c.name)) errors.push(`${where}.name must be a string`);
  if (!isNum(c.width)) errors.push(`${where}.width must be a number`);
  if (!isNum(c.height)) errors.push(`${where}.height must be a number`);
  if (!isNum(c.duration)) errors.push(`${where}.duration must be a number`);
  if (!isNum(c.frameRate)) errors.push(`${where}.frameRate must be a number`);
  if (!isNum(c.pixelAspect)) errors.push(`${where}.pixelAspect must be a number`);
  if (!Array.isArray(c.layers)) {
    errors.push(`${where}.layers must be an array`);
  } else {
    c.layers.forEach((l, i) => checkLayerDef(l, `${where}.layers[${i}]`, errors));
  }
}

/**
 * Validate a HostSnapshot. Never throws.
 * @param {*} snapshot
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateHostSnapshot(snapshot) {
  const errors = [];
  if (!isObj(snapshot)) {
    return { ok: false, errors: ['HostSnapshot must be an object'] };
  }
  if (!isStr(snapshot.appVersion)) errors.push('appVersion must be a string');

  if (!isObj(snapshot.project)) {
    errors.push('project must be an object');
  } else if (!Array.isArray(snapshot.project.items)) {
    errors.push('project.items must be an array');
  } else {
    snapshot.project.items.forEach((it, i) => {
      const where = `project.items[${i}]`;
      if (!isObj(it)) {
        errors.push(`${where}: ItemRef must be an object`);
        return;
      }
      if (!isStr(it.id)) errors.push(`${where}.id must be a string`);
      if (!isStr(it.name)) errors.push(`${where}.name must be a string`);
      if (!ITEM_TYPE_NAMES.includes(it.typeName)) {
        errors.push(`${where}.typeName must be one of ${ITEM_TYPE_NAMES.join('|')}`);
      }
    });
  }

  if (snapshot.activeItemId != null && !isStr(snapshot.activeItemId)) {
    errors.push('activeItemId must be a string or null');
  }

  if (!Array.isArray(snapshot.comps)) {
    errors.push('comps must be an array');
  } else {
    snapshot.comps.forEach((c, i) => checkCompDef(c, `comps[${i}]`, errors));
  }

  if (!isObj(snapshot.selection)) {
    errors.push('selection must be an object');
  } else {
    if (!Array.isArray(snapshot.selection.layerIds)) {
      errors.push('selection.layerIds must be an array');
    } else if (!snapshot.selection.layerIds.every(isStr)) {
      errors.push('selection.layerIds must be an array of strings');
    }
    if (!Array.isArray(snapshot.selection.propertyPaths)) {
      errors.push('selection.propertyPaths must be an array');
    } else if (!snapshot.selection.propertyPaths.every(isStr)) {
      errors.push('selection.propertyPaths must be an array of strings');
    }
  }

  return { ok: errors.length === 0, errors };
}

export { ITEM_TYPE_NAMES, LAYER_TYPES, PROPERTY_VALUE_TYPES };
