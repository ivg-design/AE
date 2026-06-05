/**
 * FROZEN CONTRACT — ScriptUI capture tree schema.
 *
 * A UITree is the structural snapshot of a captured ScriptUI Window/Panel/Palette/Dialog,
 * produced by src/scriptui/index.js captureTree() and consumed by visualization + reporting.
 *
 * Validators NEVER throw. They return { ok: boolean, errors: string[] }.
 */

/**
 * @typedef {Object} UINode
 * @property {string} type
 * @property {string} [name]
 * @property {string} [text]
 * @property {Object} [properties]
 * @property {*} [value]
 * @property {UINode[]} [children]
 * @property {string[]} [handlers]   Names of registered event handlers (e.g. 'onClick','onChange').
 */

/**
 * @typedef {Object} UITree
 * @property {'Window'|'Panel'|'Palette'|'Dialog'} type
 * @property {string} [title]
 * @property {*} [bounds]
 * @property {UINode[]} children
 */

const UI_TREE_TYPES = ['Window', 'Panel', 'Palette', 'Dialog'];

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isStr(v) {
  return typeof v === 'string';
}

/**
 * @param {*} node
 * @param {string} where
 * @param {string[]} errors
 */
function checkUINode(node, where, errors) {
  if (!isObj(node)) {
    errors.push(`${where}: UINode must be an object`);
    return;
  }
  if (!isStr(node.type)) errors.push(`${where}.type must be a string`);
  if ('name' in node && node.name != null && !isStr(node.name)) errors.push(`${where}.name must be a string when present`);
  if ('text' in node && node.text != null && !isStr(node.text)) errors.push(`${where}.text must be a string when present`);
  if ('properties' in node && node.properties != null && !isObj(node.properties)) {
    errors.push(`${where}.properties must be an object when present`);
  }
  if ('handlers' in node && node.handlers != null) {
    if (!Array.isArray(node.handlers) || !node.handlers.every(isStr)) {
      errors.push(`${where}.handlers must be an array of strings when present`);
    }
  }
  if ('children' in node && node.children != null) {
    if (!Array.isArray(node.children)) {
      errors.push(`${where}.children must be an array when present`);
    } else {
      node.children.forEach((c, i) => checkUINode(c, `${where}.children[${i}]`, errors));
    }
  }
}

/**
 * Validate a UITree. Never throws.
 * @param {*} tree
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateUITree(tree) {
  const errors = [];
  if (!isObj(tree)) {
    return { ok: false, errors: ['UITree must be an object'] };
  }
  if (!UI_TREE_TYPES.includes(tree.type)) {
    errors.push(`type must be one of ${UI_TREE_TYPES.join('|')}`);
  }
  if ('title' in tree && tree.title != null && !isStr(tree.title)) {
    errors.push('title must be a string when present');
  }
  if (!Array.isArray(tree.children)) {
    errors.push('children must be an array');
  } else {
    tree.children.forEach((c, i) => checkUINode(c, `children[${i}]`, errors));
  }
  return { ok: errors.length === 0, errors };
}

export { UI_TREE_TYPES };
