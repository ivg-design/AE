/**
 * Rectangulator - Advanced Parametric Rectangle to Bezier Path Converter
 *
 * @name Rectangulator
 * @author IVG Design
 * @version 2.1.5
 * @date 2026-07-04
 * @license MIT
 * @ui HEADLESS
 * 
 * @description
 * Converts a selected parametric rectangle into a new bezier-backed shape group with preserved
 * fills, strokes, and transforms. Fully standalone: RefManager, ApplyFFX, and the rectangulator
 * expression helpers are inlined below (sources live in tools/scripting-modules/).
 * 
 * @functionality
 * • Intelligent parametric rectangle detection and selection from shape layers
 * • Advanced bezier path generation with mathematical precision
 * • Individual corner rounding control for each rectangle corner (Top Left, Top Right, Bottom Right, Bottom Left)
 * • Dynamic anchor point positioning with 9-point grid system (Top Left, Top Center, Top Right, etc.)
 * • Expression-based animation system for real-time parameter control
 * • Custom pseudo-effect controller with embedded binary data for persistent settings
 * • Automatic shape property preservation (fills, strokes, transform properties)
 * • Composite position calculation including parent transform inheritance
 * • Reference management system for safe property linking and cleanup
 * • Memory-efficient processing with comprehensive error handling
 * 
 * @usage
 * 1. Create a shape layer with a parametric rectangle (Rectangle Path tool)
 * 2. Select the shape layer in your composition timeline
 * 3. Run the Rectangulator script (executes automatically without dialog)
 * 4. The script will detect the rectangle and convert it to a controllable bezier path
 * 5. A new "Parametric Rectangle" group will be created with custom controls
 * 6. Use the "Rectangulator Controls" effect to adjust:
 *    - Rectangle Width and Height (in pixels)
 *    - Individual corner rounding for each corner (0-100%)
 *    - Anchor Point position (9-point grid system)
 * 7. The original parametric rectangle will be automatically removed/hidden
 * 8. Animate the effect controls to create dynamic rectangular animations
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with at least one shape layer containing a parametric rectangle
 * • Selected shape layer with detectable rectangle shape (Rectangle Path tool)
 * • Sufficient system memory for expression processing and effect management
 * 
 * @notes
 * • Only works with parametric rectangles created using After Effects' Rectangle Path tool
 * • The script automatically detects rectangles in shape groups and nested hierarchies
 * • All original shape properties (fills, strokes, transforms) are preserved during conversion
 * • The expression system provides real-time updates without keyframe dependencies
 * • Anchor point positioning affects both visual centering and animation pivot points
 * • Individual corner rounding allows for sophisticated organic shape transitions
 * • The system is intended to support shape layer parenting and pre-compositions
 * • Binary effect data ensures cross-project compatibility and settings persistence
 *
 * @changelog
 * - 2.1.5 (2026-07-04): Fixed the Anchor Point popup being inert. Neither "Anchor
 *   Point " (the binary's baked-in trailing-space name) nor "Anchor Point" resolved
 *   in the expression engine, so the anchor always read its default (Center). The
 *   path and anchor expressions now self-locate the popup: if both name variants
 *   miss, they scan the effect's parameters for one whose name contains "anchor"
 *   and read its value.
 * - 2.1.4 (2026-07-04): The rig now replaces the parametric rectangle EXACTLY: the
 *   controller's Width/Height/corner sliders are seeded from the original rectangle's
 *   Size and Roundness (previously they sat at the FFX 100x100 defaults). Fixed dead
 *   expression controls: the path/anchor expressions previously collapsed to the
 *   100x100 fallback square when any single control lookup failed (e.g. the baked-in
 *   trailing space in "Anchor Point "); every control read is now individually
 *   guarded with name-variant fallbacks and explicit .value access, so controls work
 *   even if one lookup misses. getCompositePosition() now accumulates group
 *   (position - anchor) offsets correctly.
 * - 2.1.3 (2026-07-04): Fixed "Object is invalid" (ReferenceError) when wiring the path
 *   expression. Adding fills/strokes to the new group invalidates previously-obtained
 *   sibling references, so the shape-path reference from addProperty() was stale by the
 *   time its expression was set. The path group is now re-fetched fresh after all
 *   additions are complete.
 * - 2.1.2 (2026-07-04): Fixed "null is not an object" on execution. The pseudo-effect
 *   preset is now applied BEFORE the new shape group is built (applyPreset invalidates
 *   existing property references, so the old order left the script dereferencing stale/
 *   null objects). Added null guards on group/path lookups, a clear error when the
 *   temporary .ffx cannot be written (scripting file-write permission disabled), and
 *   the error alert now reports the failing line.
 * - 2.1.1 (2026-07-04): Rewrote the Position expression as a stateless passthrough
 *   (returns `value`). The prior version accumulated anchor/size compensation in a
 *   persistent `__state` object, but After Effects evaluates each expression in a
 *   fresh context, so that state re-initialized every evaluation — inert under the
 *   default JS engine and non-deterministic (position drift) under the legacy engine.
 *   The Anchor Point expression already keeps the selected corner fixed while Width/
 *   Height animate, so no positional compensation is needed; Position now behaves
 *   deterministically and stays freely keyframeable. Mirrored in
 *   tools/scripting-modules/rectangulator_expressions.js.
 * - 2.1.0 (2026-07-04): Inlined RefManager/ApplyFFX/expression dependencies (script is now
 *   standalone) and corrected all expression control references to target the
 *   "Rectangulator Controls" pseudo effect (previously they pointed at nonexistent
 *   standalone Slider/Point/Menu controls, so the controller did nothing).
 * - 2.0.1 (2026-06-02): Corrected front matter to disclose missing/bundled dependency requirements.
 * - 2.0.0 (2025-08-13): Renamed and documented during repository standardization.
 */

//=====================================================================
// DEPENDENCIES (inlined — this script is fully standalone)
// Sources: tools/scripting-modules/RefManager.js, ApplyFFX.js,
//          rectangulator_expressions.js — keep them in sync.
//=====================================================================

/**
 * @file
 * @module RefManager
 * @name RefManager
 * @exports RefManager
 * @description A compact, universal ECMA-3 compliant module to handle reference invalidation in After Effects ExtendScript.
 * Prevents "Object is Invalid" errors by storing paths to objects instead of direct references.
 * @version 1.0.0
 */
var RefManager = (function () {
    var module = {};

    /**
     * Stores a reference path to any After Effects object
     * @param {Object} obj - The After Effects object to store a reference to
     * @returns {Object} - A reference descriptor that can be used to retrieve the object later
     * @example
     * // Store a reference to any AE object
     * var ref = RefManager.store(layer.effect("Blur")("Blurriness"));
     */
    module.store = function (obj) {
        var refInfo = [];
        var currentObj = obj;

        // Store any values if the object has them
        var values = {};
        try {
            if (currentObj.value !== undefined) {
                values.value = currentObj.value;
            }
        } catch (e) { }

        // Traverse up the property hierarchy
        while (currentObj && currentObj.parentProperty) {
            var info = {
                name: currentObj.name,
                matchName: currentObj.matchName,
                index: currentObj.propertyIndex
            };

            refInfo.push(info);
            currentObj = currentObj.parentProperty;
        }

        // Handle layer and comp info
        if (currentObj) {
            var layerInfo = {
                name: currentObj.name,
                matchName: currentObj.matchName,
                index: currentObj.index,
                isLayer: true
            };

            refInfo.push(layerInfo);

            // Add comp info if available
            if (currentObj.containingComp) {
                var compInfo = {
                    name: currentObj.containingComp.name,
                    index: getCompIndex(currentObj.containingComp),
                    isComp: true
                };
                refInfo.push(compInfo);
            }
        }

        return {
            path: refInfo,
            values: values,
            timestamp: new Date().getTime()
        };
    };

    /**
     * Resolves a stored reference to get a fresh object
     * @param {Object} refDescriptor - The reference descriptor returned by store
     * @returns {Object} - A fresh reference to the object
     * @throws {Error} - If the reference cannot be resolved
     * @example
     * // Resolve a previously stored reference
     * var freshObj = RefManager.resolve(ref);
     */
    module.resolve = function (refDescriptor) {
        if (!refDescriptor || !refDescriptor.path || !refDescriptor.path.length) {
            throw new Error("Invalid reference descriptor");
        }

        var path = refDescriptor.path;

        // Start from the top (comp)
        var compInfo = path[path.length - 1];
        if (!compInfo.isComp) {
            throw new Error("Reference doesn't contain composition information");
        }

        var comp = null;

        // Try by name first, then by index
        comp = findCompByName(compInfo.name);
        if (!comp) {
            comp = app.project.item(compInfo.index);
        }

        if (!comp) {
            throw new Error("Could not resolve composition reference");
        }

        // Get the layer
        var layerInfo = path[path.length - 2];
        if (!layerInfo.isLayer) {
            throw new Error("Reference doesn't contain layer information");
        }

        var layer = null;

        // Try by name first, then by index
        layer = findLayerByName(comp, layerInfo.name);
        if (!layer) {
            layer = comp.layer(layerInfo.index);
        }

        if (!layer) {
            throw new Error("Could not resolve layer reference");
        }

        // Traverse down the property path
        var currentObj = layer;
        for (var i = path.length - 3; i >= 0; i--) {
            var propInfo = path[i];
            var nextObj = null;

            // Try by name first
            try {
                nextObj = currentObj.property(propInfo.name);
            } catch (e) {
                // Silently fail and try next method
            }

            // Then try by matchName
            if (!nextObj) {
                try {
                    nextObj = findPropertyByMatchName(currentObj, propInfo.matchName);
                } catch (e) {
                    // Silently fail and try next method
                }
            }

            // Finally try by index
            if (!nextObj) {
                try {
                    nextObj = currentObj.property(propInfo.index);
                } catch (e) {
                    // Silently fail
                }
            }

            if (!nextObj) {
                throw new Error("Could not resolve property at depth " + i);
            }

            currentObj = nextObj;
        }

        return currentObj;
    };

    /**
     * Safely removes an object using a stored reference
     * @param {Object} refDescriptor - The reference descriptor returned by store
     * @returns {Boolean} - True if successfully removed, false otherwise
     * @example
     * // Safely remove an object
     * RefManager.remove(ref);
     */
    module.remove = function (refDescriptor) {
        try {
            var obj = module.resolve(refDescriptor);
            if (obj && obj.remove) {
                obj.remove();
                return true;
            }
        } catch (e) {
            // Silently fail
        }
        return false;
    };

    /**
     * Gets a property value from a stored reference
     * @param {Object} refDescriptor - The reference descriptor returned by store
     * @param {String} [propName] - Optional property name to get (e.g., "value")
     * @returns {*} - The property value or undefined if not found
     * @example
     * // Get a property value
     * var value = RefManager.getValue(ref, "value");
     */
    module.getValue = function (refDescriptor, propName) {
        try {
            var obj = module.resolve(refDescriptor);
            if (propName) {
                return obj[propName];
            } else {
                return obj.value;
            }
        } catch (e) {
            // If we can't resolve, try to return from stored values
            if (refDescriptor.values && propName) {
                return refDescriptor.values[propName];
            } else if (refDescriptor.values) {
                return refDescriptor.values.value;
            }
        }
        return undefined;
    };

    /**
     * Sets a property value using a stored reference
     * @param {Object} refDescriptor - The reference descriptor returned by store
     * @param {*} value - The value to set
     * @param {String} [propName] - Optional property name to set (e.g., "value")
     * @returns {Boolean} - True if successful, false otherwise
     * @example
     * // Set a property value
     * RefManager.setValue(ref, 100);
     */
    module.setValue = function (refDescriptor, value, propName) {
        try {
            var obj = module.resolve(refDescriptor);
            if (propName) {
                obj[propName] = value;
            } else {
                obj.setValue(value);
            }
            return true;
        } catch (e) {
            // Silently fail
        }
        return false;
    };

    /**
     * Stores a reference to a property and its parent
     * @param {Object} property - The property to store
     * @returns {Object} - An object with references to the property and its parent
     * @example
     * // Store a property and its parent
     * var refs = RefManager.storeWithParent(effect("Blur")("Blurriness"));
     */
    module.storeWithParent = function (property) {
        var propRef = module.store(property);
        var parentRef = null;

        if (property.parentProperty) {
            parentRef = module.store(property.parentProperty);
        }

        return {
            propRef: propRef,
            parentRef: parentRef
        };
    };

    /**
     * Helper function to find a composition by name
     * @private
     * @param {String} name - Name of the composition to find
     * @returns {CompItem|null} - The composition or null if not found
     */
    function findCompByName(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === name) {
                return item;
            }
        }
        return null;
    }

    /**
     * Helper function to get a composition's index
     * @private
     * @param {CompItem} comp - The composition
     * @returns {Number} - The index of the composition, -1 if not found
     */
    function getCompIndex(comp) {
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) === comp) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Helper function to find a layer by name
     * @private
     * @param {CompItem} comp - The composition to search in
     * @param {String} name - Name of the layer to find
     * @returns {Layer|null} - The layer or null if not found
     */
    function findLayerByName(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name) {
                return comp.layer(i);
            }
        }
        return null;
    }

    /**
     * Helper function to find a property by matchName
     * @private
     * @param {PropertyGroup|Layer} parent - The parent object to search in
     * @param {String} matchName - MatchName of the property to find
     * @returns {Property|PropertyGroup|null} - The property or null if not found
     */
    function findPropertyByMatchName(parent, matchName) {
        for (var i = 1; i <= parent.numProperties; i++) {
            var prop = parent.property(i);
            if (prop.matchName === matchName) {
                return prop;
            }

            // Recursively search in property groups
            if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                prop.propertyType === PropertyType.NAMED_GROUP) {
                var found = findPropertyByMatchName(prop, matchName);
                if (found) return found;
            }
        }
        return null;
    }

    return module;
})();

/**
 * @fileoverview
 * The applyFFX module provides methods to apply pseudo effects to layers in After Effects.
 * 
 * @module applyFFX
 * 
 * @example
 * // Import the applyFFX module
 * //@include "path/to/applyFFX.js"
 * 
 * // Get the active layer in the active composition
 * var layer = app.project.activeItem.layer(1);
 * 
 * // Configuration data
 * var binaryData = "...";
 * var matchName = "Multiparent";
 * var version = "1.0.0";
 * var name = "MultiParent";
 * 
 * // Apply the pseudo effect to the layer
 * applyFFX.config(layer, binaryData, matchName, version, name);
 * 
 * @usageNotes
 * 1. Place the applyFFX.js file in a location accessible to your After Effects scripts.
 * 2. Use the @include directive to include applyFFX.js in your script.
 * 3. Use applyFFX.config() to apply a pseudo effect to a layer based on your configuration.
 */

var ApplyFFX = (function () {
	var module = {};

	/**
	 * Deselects all layers in a given composition.
	 * 
	 * @function deselectAll
	 * @memberof applyFFX
	 * 
	 * @param {object} theComp - The composition whose layers should be deselected.
	 * 
	 * @example 
	 * var comp = app.project.activeItem;
	 * applyFFX.deselectAll(comp);
	 */
	module.deselectAll = function (theComp) {
		for (var i = 1, il = theComp.numLayers; i <= il; i++) {
			theComp.layer(i).selected = false;
		}
	};

	/**
	 * Applies a pseudo effect to a given layer based on the configuration provided.
	 * 
	 * @function config
	 * @memberof applyFFX
	 * 
	 * @param {object} layer - The layer to which the pseudo effect should be applied.
	 * @param {string} binaryData - The binary data for the effect.
	 * @param {string} matchName - The match name for the pseudo effect.
	 * @param {string} version - The version of the pseudo effect.
	 * @param {string} name - The name of the pseudo effect.
	 * 
	 * @example 
	 * var layer = someLayerObject;
	 * var binaryData = "...";
	 * var matchName = "Multiparent";
	 * var version = "1.0.0";
	 * var name = "MultiParent";
	 * applyFFX.config(layer, binaryData, matchName, version, name);
	 */
	module.config = function (layer, binaryData, matchName, version, name) {
		var config = {
			binary: binaryData,
			matchName: 'Pseudo/' + matchName,
			name: name,
			version: version
		};

		var tempFolder = Folder.temp;
		var ffxFile = File(tempFolder.fsName + '/' + config.name + '_v' + config.version + '.ffx');
		ffxFile.encoding = 'BINARY';
		var opened = ffxFile.open('w');
		var wrote = (opened === false) ? false : ffxFile.write(config.binary);
		ffxFile.close();
		if (opened === false || wrote === false) {
			throw new Error("Could not write the temporary .ffx preset (" + ffxFile.fsName + "). " +
				"Enable 'Allow Scripts to Write Files and Access Network' in Preferences > Scripting & Expressions and try again.");
		}

		var myComp = app.project.activeItem;
		module.deselectAll(myComp);
		layer.selected = true;
		layer.applyPreset(ffxFile);
	};
	return module;
})();

// Expressions for Rectangulator.jsx
// Organized by functionality with proper indentation and comments
//
// All control references target the "Rectangulator Controls" pseudo effect
// applied by the script (see rectangulatorControllerBinary). Control names
// must match the FFX binary exactly, including the trailing space in
// "Anchor Point " and the "Bottom Right Left Corner Rounding" name.

var expressions = {
    // Path expression for creating the rounded rectangle shape
    path: "// Custom rounded rectangle with individual corner control\n" +
    "try {\n" +
    "    // Get effect values\n" +
    "    var ctl = null;\n" +
    "    try { ctl = effect(\"Rectangulator Controls\"); } catch (eCtl) {}\n" +
    "    var P = function (n1, n2, def) {\n" +
    "        if (ctl) {\n" +
    "            try { return ctl(n1).value; } catch (e1) {}\n" +
    "            if (n2) { try { return ctl(n2).value; } catch (e2) {} }\n" +
    "        }\n" +
    "        return def;\n" +
    "    };\n" +
    "    width = P(\"Rectangle Width (px)\", null, 100);\n" +
    "    height = P(\"Rectangle Height (px)\", null, 100);\n" +
    "    tlPercent = P(\"Top Left Corner Rounding\", null, 0);\n" +
    "    trPercent = P(\"Top Right Corner Rounding\", null, 0);\n" +
    "    brPercent = P(\"Bottom Right Left Corner Rounding\", \"Bottom Right Corner Rounding\", 0);\n" +
    "    blPercent = P(\"Bottom Left Corner Rounding\", null, 0);\n" +
    "    anchorType = P(\"Anchor Point \", \"Anchor Point\", -1);\n" +
    "    if (anchorType === -1) {\n" +
    "        anchorType = 5;\n" +
    "        try {\n" +
    "            for (var q = 1; q <= ctl.numProperties; q++) {\n" +
    "                try {\n" +
    "                    var nm = ctl(q).name;\n" +
    "                    if (nm && nm.toLowerCase().indexOf(\"anchor\") !== -1) { anchorType = ctl(q).value; break; }\n" +
    "                } catch (eq) {}\n" +
    "            }\n" +
    "        } catch (eScan) {}\n" +
    "    }\n" +
    "\n" +
    "    // Calculate the maximum roundness based on the smallest dimension\n" +
    "    maxRound = Math.min(width, height);\n" +
    "\n" +
    "    // First, clamp individual percentages to 0-100%\n" +
    "    tlPercent = Math.max(0, Math.min(100, tlPercent));\n" +
    "    trPercent = Math.max(0, Math.min(100, trPercent));\n" +
    "    brPercent = Math.max(0, Math.min(100, brPercent));\n" +
    "    blPercent = Math.max(0, Math.min(100, blPercent));\n" +
    "\n" +
    "    // Convert percentages to actual roundness values (0-100% -> 0-maxRound)\n" +
    "    tl = (tlPercent / 100) * maxRound;\n" +
    "    tr = (trPercent / 100) * maxRound;\n" +
    "    br = (brPercent / 100) * maxRound;\n" +
    "    bl = (blPercent / 100) * maxRound;\n" +
    "\n" +
    "    // Ensure all roundness values are non-negative\n" +
    "    tl = Math.max(0, tl);\n" +
    "    tr = Math.max(0, tr);\n" +
    "    br = Math.max(0, br);\n" +
    "    bl = Math.max(0, bl);\n" +
    "\n" +
    "    // Apply constraints to prevent distortion\n" +
    "    // For horizontal sides (top and bottom)\n" +
    "    maxTopRoundness = width / 2;\n" +
    "    maxBottomRoundness = width / 2;\n" +
    "\n" +
    "    // For vertical sides (left and right)\n" +
    "    maxLeftRoundness = height / 2;\n" +
    "    maxRightRoundness = height / 2;\n" +
    "\n" +
    "    // Constraint pairs that share an edge (can intersect)\n" +
    "    // Left edge: top-left and bottom-left\n" +
    "    if (tlPercent + blPercent > 100) {\n" +
    "        // Clamp bottom-left based on top-left value\n" +
    "        blPercent = Math.min(blPercent, 100 - tlPercent);\n" +
    "        bl = (blPercent / 100) * maxRound;\n" +
    "    }\n" +
    "\n" +
    "    // Right edge: top-right and bottom-right\n" +
    "    if (trPercent + brPercent > 100) {\n" +
    "        // Clamp bottom-right based on top-right value\n" +
    "        brPercent = Math.min(brPercent, 100 - trPercent);\n" +
    "        br = (brPercent / 100) * maxRound;\n" +
    "    }\n" +
    "\n" +
    "    // Top edge: top-left and top-right\n" +
    "    // Only apply constraint if the width is small enough that the corners could intersect\n" +
    "    if (tlPercent + trPercent > 100 && width <= height) {\n" +
    "        // Clamp top-right based on top-left value\n" +
    "        trPercent = Math.min(trPercent, 100 - tlPercent);\n" +
    "        tr = (trPercent / 100) * maxRound;\n" +
    "    }\n" +
    "\n" +
    "    // Bottom edge: bottom-left and bottom-right\n" +
    "    // Only apply constraint if the width is small enough that the corners could intersect\n" +
    "    if (blPercent + brPercent > 100 && width <= height) {\n" +
    "        // Clamp bottom-right based on bottom-left value\n" +
    "        brPercent = Math.min(brPercent, 100 - blPercent);\n" +
    "        br = (brPercent / 100) * maxRound;\n" +
    "    }\n" +
    "\n" +
    "    // Additional physical constraints to prevent distortion\n" +
    "    // Ensure corners don't exceed physical limits\n" +
    "    if (tl + tr > width) {\n" +
    "        var scale = width / (tl + tr);\n" +
    "        tl *= scale;\n" +
    "        tr *= scale;\n" +
    "    }\n" +
    "\n" +
    "    if (bl + br > width) {\n" +
    "        var scale = width / (bl + br);\n" +
    "        bl *= scale;\n" +
    "        br *= scale;\n" +
    "    }\n" +
    "\n" +
    "    if (tl + bl > height) {\n" +
    "        var scale = height / (tl + bl);\n" +
    "        tl *= scale;\n" +
    "        bl *= scale;\n" +
    "    }\n" +
    "\n" +
    "    if (tr + br > height) {\n" +
    "        var scale = height / (tr + br);\n" +
    "        tr *= scale;\n" +
    "        br *= scale;\n" +
    "    }\n" +
    "\n" +
    "    // Calculate points\n" +
    "    w = width / 2;\n" +
    "    h = height / 2;\n" +
    "\n" +
    "    // Calculate anchor point offset based on dropdown selection\n" +
    "    anchorX = 0;\n" +
    "    anchorY = 0;\n" +
    "\n" +
    "    if (anchorType == 1) { // Top Left\n" +
    "        anchorX = -w;\n" +
    "        anchorY = -h;\n" +
    "    } else if (anchorType == 2) { // Top Center\n" +
    "        anchorX = 0;\n" +
    "        anchorY = -h;\n" +
    "    } else if (anchorType == 3) { // Top Right\n" +
    "        anchorX = w;\n" +
    "        anchorY = -h;\n" +
    "    } else if (anchorType == 4) { // Middle Left\n" +
    "        anchorX = -w;\n" +
    "        anchorY = 0;\n" +
    "    } else if (anchorType == 5) { // Middle Center\n" +
    "        anchorX = 0;\n" +
    "        anchorY = 0;\n" +
    "    } else if (anchorType == 6) { // Middle Right\n" +
    "        anchorX = w;\n" +
    "        anchorY = 0;\n" +
    "    } else if (anchorType == 7) { // Bottom Left\n" +
    "        anchorX = -w;\n" +
    "        anchorY = h;\n" +
    "    } else if (anchorType == 8) { // Bottom Center\n" +
    "        anchorX = 0;\n" +
    "        anchorY = h;\n" +
    "    } else if (anchorType == 9) { // Bottom Right\n" +
    "        anchorX = w;\n" +
    "        anchorY = h;\n" +
    "    }\n" +
    "\n" +
    "    // Create path arrays\n" +
    "    vertices = [];\n" +
    "    inTangents = [];\n" +
    "    outTangents = [];\n" +
    "\n" +
    "    // Calculate control point factor for bezier curves\n" +
    "    cp = 0.552;\n" +
    "\n" +
    "    // Always create 8 vertices (2 for each corner)\n" +
    "    // Top-left corner (vertices 0 and 1)\n" +
    "    tlx1 = -w;\n" +
    "    tly1 = -h + tl;\n" +
    "    tlx2 = -w + tl;\n" +
    "    tly2 = -h;\n" +
    "\n" +
    "    // Top-right corner (vertices 2 and 3)\n" +
    "    trx1 = w - tr;\n" +
    "    try1 = -h;\n" +
    "    trx2 = w;\n" +
    "    try2 = -h + tr;\n" +
    "\n" +
    "    // Bottom-right corner (vertices 4 and 5)\n" +
    "    brx1 = w;\n" +
    "    bry1 = h - br;\n" +
    "    brx2 = w - br;\n" +
    "    bry2 = h;\n" +
    "\n" +
    "    // Bottom-left corner (vertices 6 and 7)\n" +
    "    blx1 = -w + bl;\n" +
    "    bly1 = h;\n" +
    "    blx2 = -w;\n" +
    "    bly2 = h - bl;\n" +
    "\n" +
    "    // If roundness is 0, make the vertices overlap\n" +
    "    if (tl === 0) {\n" +
    "        tlx1 = tlx2 = -w;\n" +
    "        tly1 = tly2 = -h;\n" +
    "    }\n" +
    "\n" +
    "    if (tr === 0) {\n" +
    "        trx1 = trx2 = w;\n" +
    "        try1 = try2 = -h;\n" +
    "    }\n" +
    "\n" +
    "    if (br === 0) {\n" +
    "        brx1 = brx2 = w;\n" +
    "        bry1 = bry2 = h;\n" +
    "    }\n" +
    "\n" +
    "    if (bl === 0) {\n" +
    "        blx1 = blx2 = -w;\n" +
    "        bly1 = bly2 = h;\n" +
    "    }\n" +
    "\n" +
    "    // Add all vertices (no anchor point adjustment - handled by transform)\n" +
    "    vertices.push([tlx1, tly1]);\n" +
    "    vertices.push([tlx2, tly2]);\n" +
    "    vertices.push([trx1, try1]);\n" +
    "    vertices.push([trx2, try2]);\n" +
    "    vertices.push([brx1, bry1]);\n" +
    "    vertices.push([brx2, bry2]);\n" +
    "    vertices.push([blx1, bly1]);\n" +
    "    vertices.push([blx2, bly2]);\n" +
    "\n" +
    "    // Initialize all tangents to zero\n" +
    "    for (i = 0; i < 8; i++) {\n" +
    "        inTangents.push([0, 0]);\n" +
    "        outTangents.push([0, 0]);\n" +
    "    }\n" +
    "\n" +
    "    // Set tangents only for rounded corners\n" +
    "    // Top-left corner tangents\n" +
    "    if (tl > 0) {\n" +
    "        outTangents[0] = [0, -tl * cp];\n" +
    "        inTangents[1] = [-tl * cp, 0];\n" +
    "    }\n" +
    "\n" +
    "    // Top-right corner tangents\n" +
    "    if (tr > 0) {\n" +
    "        outTangents[2] = [tr * cp, 0];\n" +
    "        inTangents[3] = [0, -tr * cp];\n" +
    "    }\n" +
    "\n" +
    "    // Bottom-right corner tangents\n" +
    "    if (br > 0) {\n" +
    "        outTangents[4] = [0, br * cp];\n" +
    "        inTangents[5] = [br * cp, 0];\n" +
    "    }\n" +
    "\n" +
    "    // Bottom-left corner tangents\n" +
    "    if (bl > 0) {\n" +
    "        outTangents[6] = [-bl * cp, 0];\n" +
    "        inTangents[7] = [0, bl * cp];\n" +
    "    }\n" +
    "\n" +
    "    // Create the path\n" +
    "    createPath(vertices, inTangents, outTangents, true);\n" +
    "} catch (err) {\n" +
    "    // Default fallback path if there's an error\n" +
    "    createPath([[0,0], [100,0], [100,100], [0,100]], [[0,0],[0,0],[0,0],[0,0]], [[0,0],[0,0],[0,0],[0,0]], true);\n" +
    "}",

    // Anchor point expression for positioning the anchor point
    anchorPoint: "// Anchor point expression\n" +
    "try {\n" +
    "    var ctl = null;\n" +
    "    try { ctl = effect(\"Rectangulator Controls\"); } catch (eCtl) {}\n" +
    "    var P = function (n1, n2, def) {\n" +
    "        if (ctl) {\n" +
    "            try { return ctl(n1).value; } catch (e1) {}\n" +
    "            if (n2) { try { return ctl(n2).value; } catch (e2) {} }\n" +
    "        }\n" +
    "        return def;\n" +
    "    };\n" +
    "    w = P(\"Rectangle Width (px)\", null, 100) / 2;\n" +
    "    h = P(\"Rectangle Height (px)\", null, 100) / 2;\n" +
    "    anchorType = P(\"Anchor Point \", \"Anchor Point\", -1);\n" +
    "    if (anchorType === -1) {\n" +
    "        anchorType = 5;\n" +
    "        try {\n" +
    "            for (var q = 1; q <= ctl.numProperties; q++) {\n" +
    "                try {\n" +
    "                    var nm = ctl(q).name;\n" +
    "                    if (nm && nm.toLowerCase().indexOf(\"anchor\") !== -1) { anchorType = ctl(q).value; break; }\n" +
    "                } catch (eq) {}\n" +
    "            }\n" +
    "        } catch (eScan) {}\n" +
    "    }\n" +
    "    result = [0, 0];\n" +
    "\n" +
    "    if (anchorType == 1) result = [-w, -h];      // Top Left\n" +
    "    else if (anchorType == 2) result = [0, -h];   // Top Center\n" +
    "    else if (anchorType == 3) result = [w, -h];   // Top Right\n" +
    "    else if (anchorType == 4) result = [-w, 0];   // Middle Left\n" +
    "    else if (anchorType == 5) result = [0, 0];    // Middle Center\n" +
    "    else if (anchorType == 6) result = [w, 0];    // Middle Right\n" +
    "    else if (anchorType == 7) result = [-w, h];   // Bottom Left\n" +
    "    else if (anchorType == 8) result = [0, h];    // Bottom Center\n" +
    "    else if (anchorType == 9) result = [w, h];    // Bottom Right\n" +
    "    else result = [0, 0];                         // Default\n" +
    "\n" +
    "    result;\n" +
    "} catch (err) {\n" +
    "    [0, 0];\n" +
    "}",

    // Position expression — stateless passthrough.
    // The Anchor Point expression above already pins the selected corner in
    // place as Width/Height change, so Position needs no compensation here.
    // A previous version accumulated anchor/size offsets in a persistent
    // "__state" object, but After Effects evaluates each expression in a fresh
    // context (undeclared globals do NOT persist between evaluations), so that
    // state re-initialized on every evaluation — it was inert under the default
    // JS engine and non-deterministic under the legacy engine. Returning the
    // property's own (static or keyframed) value keeps Position fully
    // animatable and deterministic under both engines.
    position: "// Stateless position passthrough (see Rectangulator.jsx notes)\n" +
    "value;"
};

(function () {
    //=====================================================================
    // BINARY DATA FOR PSEUDO CONTROLLERS
    //=====================================================================

    // Binary data for rectangulator controller (will be added in production)
    var rectangulatorControllerBinary = "RIFX\x00\x00\x12\u00D4FaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00\x12\u00B0bescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x17Rectangulator Controls\x00\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x11$sspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x06\u00DEparTparn\x00\x00\x00\x04\x00\x00\x00\btdmn\x00\x00\x00(Pseudo/PEM Matchname-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nRectangle Width (px)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nRectangle Height (px)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nTop Left Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nTop Right Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nBottom Right Left Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nBottom Left Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Anchor Point \x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05\x00\x03\x00\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00eTop Left|Top Center|Top Right|Center Left|Center|Center Right|Bottom Left|Bottom Center|Bottom Right\x00\x00LIST\x00\x00\t\u00FAtdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17Rectangulator Controls\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/PEM Matchname-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Rectangle Width (px)\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x16Rectangle Height (px)\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x19Top Left Corner Rounding\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1ATop Right Corner Rounding\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x0Etdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\"Bottom Right Left Corner Rounding\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\btdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1CBottom Left Corner Rounding\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EAnchor Point \x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{\"controlName\":\"Rectangulator Controls\",\"matchname\":\"Pseudo/PEM Matchname\",\"controlArray\":[{\"name\":\"Rectangle Width (px)\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":4775142704,\"hold\":false,\"default\":100,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":1000000,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Rectangle Height (px)\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":8131555788,\"hold\":false,\"default\":100,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":1000000,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Top Left Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":9062449761,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Top Right Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":9570975152,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Bottom Right Left Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2486514823,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Bottom Left Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2606985400,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Anchor Point \",\"type\":\"popup\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2054346431,\"hold\":false,\"default\":5,\"content\":\"Top Left|Top Center|Top Right|Center Left|Center|Center Right|Bottom Left|Bottom Center|Bottom Right\",\"error\":[\n\n]}],\"version\":3}";
    var rectangulatorControllerMatchName = "Rectangulator";
    var rectangulatorControllerVersion = "1.0.1";
    var rectangulatorControllerName = "Rectangulator Controls";


    //=====================================================================
    // HELPER FUNCTIONS
    //=====================================================================

    /**
     * Get the composite position of a property including parent transforms
     * @param {Property} prop - The property to get position for
     * @return {Array} - [x, y] position array
     */
    function getCompositePosition(prop) {
        var position = [0, 0];

        // Base: the parametric rectangle's own position (its center) inside
        // its group's coordinate space.
        try {
            var rp = prop.property("ADBE Vector Rect Position");
            if (rp) position = [rp.value[0], rp.value[1]];
        } catch (e) { }

        // Accumulate each ancestor Vector Group's (position - anchor) so the
        // result is the rectangle center in LAYER space. Group scale/rotation
        // are not compounded (documented approximation).
        var parent = prop.parentProperty;
        while (parent) {
            try {
                if (parent.matchName === "ADBE Vector Group") {
                    var tr = parent.property("ADBE Vector Transform Group");
                    if (tr) {
                        var gp = tr.property("ADBE Vector Position").value;
                        var ga = tr.property("ADBE Vector Anchor Point").value;
                        position[0] += gp[0] - ga[0];
                        position[1] += gp[1] - ga[1];
                    }
                }
            } catch (e2) { }
            if (parent.matchName === "ADBE Root Vectors Group") break;
            parent = parent.parentProperty;
        }

        return position;
    }

    /**
     * Find a rectangle shape in a property and its children
     * @param {Property} property - The property to search
     * @param {Object} results - Object to store search results
     * @return {Boolean} - True if rectangle found
     */
    function findRectangle(property, results) {
        if (results.found) return true;

        try {
            // Direct match for rectangle shape
            if (property && property.matchName === "ADBE Vector Shape - Rect") {
                results.path = property;
                results.found = true;

                // Store a reference to the rectangle
                results.ref = RefManager.store(property);

                // Store rectangle properties
                try {
                    if (property.property("ADBE Vector Rect Size")) {
                        results.props.size = property.property("ADBE Vector Rect Size").value;
                    }
                } catch (e) { }

                try {
                    if (property.property("ADBE Vector Rect Position")) {
                        results.props.position = property.property("ADBE Vector Rect Position").value;
                    }
                } catch (e) { }

                try {
                    if (property.property("ADBE Vector Rect Roundness")) {
                        results.props.roundness = property.property("ADBE Vector Rect Roundness").value;
                    }
                } catch (e) { }

                // Get the full composite position including all parent transforms
                results.position = getCompositePosition(property);

                // Find and store the containing group
                var parent = property.parentProperty;
                while (parent && parent.matchName !== "ADBE Vector Group") {
                    parent = parent.parentProperty;
                }

                if (parent) {
                    results.groupRef = RefManager.store(parent);
                }

                return true;
            }

            // Special case for groups named "Rectangle" or containing "Rectangle"
            if (property && property.name && property.name.indexOf("Rectangle") !== -1) {
                // This might be a group containing a rectangle, check its contents
                if (property.property("ADBE Vectors Group")) {
                    var contents = property.property("ADBE Vectors Group");
                    for (var r = 1; r <= contents.numProperties; r++) {
                        try {
                            var contentProp = contents.property(r);
                            if (contentProp && contentProp.matchName === "ADBE Vector Shape - Rect") {
                                results.path = contentProp;
                                results.found = true;

                                // Store a reference to the rectangle
                                results.ref = RefManager.store(contentProp);

                                // Store rectangle properties
                                try {
                                    if (contentProp.property("ADBE Vector Rect Size")) {
                                        results.props.size = contentProp.property("ADBE Vector Rect Size").value;
                                    }
                                } catch (e) { }

                                try {
                                    if (contentProp.property("ADBE Vector Rect Position")) {
                                        results.props.position = contentProp.property("ADBE Vector Rect Position").value;
                                    }
                                } catch (e) { }

                                try {
                                    if (contentProp.property("ADBE Vector Rect Roundness")) {
                                        results.props.roundness = contentProp.property("ADBE Vector Rect Roundness").value;
                                    }
                                } catch (e) { }

                                // Get the full composite position including all parent transforms
                                results.position = getCompositePosition(contentProp);

                                // Store the containing group
                                results.groupRef = RefManager.store(property);

                                return true;
                            }
                        } catch (e) { }
                    }
                }
            }

            // Check if it's a group that might contain a rectangle
            if (property && (property.propertyType === PropertyType.INDEXED_GROUP ||
                property.propertyType === PropertyType.NAMED_GROUP)) {
                for (var i = 1; i <= property.numProperties; i++) {
                    try {
                        var subProp = property.property(i);
                        if (subProp) {
                            if (findRectangle(subProp, results)) {
                                return true;
                            }
                        }
                    } catch (e) { }
                }
            }
        } catch (e) { }

        return false;
    }

    /**
     * Set a parameter on the applied pseudo-effect by (trimmed) display name.
     * The FFX binary bakes quirks like the trailing space in "Anchor Point ",
     * so names are compared whitespace-trimmed.
     */
    function setControllerParam(fx, paramName, val) {
        var want = paramName.replace(/^\s+|\s+$/g, "");
        try {
            for (var q = 1; q <= fx.numProperties; q++) {
                var pp = fx.property(q);
                if (pp && pp.name && pp.name.replace(/^\s+|\s+$/g, "") === want) {
                    pp.setValue(val);
                    return true;
                }
            }
        } catch (e) { }
        return false;
    }

    /**
     * Get fill, stroke and transform properties from a shape group
     * @param {Property} group - The shape group to analyze
     * @return {Object} - Object containing fills, strokes and transform properties
     */
    function getShapeProperties(group) {
        var result = {
            fills: [],
            strokes: [],
            transform: null
        };

        try {
            if (group && group.property("ADBE Vectors Group")) {
                var vectorsGroup = group.property("ADBE Vectors Group");

                // Check for fill and store its properties
                for (var j = 1; j <= vectorsGroup.numProperties; j++) {
                    try {
                        var prop = vectorsGroup.property(j);
                        if (prop && prop.matchName === "ADBE Vector Graphic - Fill") {
                            var fillObj = {
                                color: prop.property("ADBE Vector Fill Color").value,
                                opacity: prop.property("ADBE Vector Fill Opacity").value,
                                blendMode: prop.property("ADBE Vector Fill Rule").value,
                                enabled: prop.enabled
                            };
                            result.fills.push(fillObj);
                        }
                    } catch (e) { }
                }

                // Check for stroke and store its properties
                for (var k = 1; k <= vectorsGroup.numProperties; k++) {
                    try {
                        var strokeProp = vectorsGroup.property(k);
                        if (strokeProp && strokeProp.matchName === "ADBE Vector Graphic - Stroke") {
                            var strokeObj = {
                                color: strokeProp.property("ADBE Vector Stroke Color").value,
                                opacity: strokeProp.property("ADBE Vector Stroke Opacity").value,
                                width: strokeProp.property("ADBE Vector Stroke Width").value,
                                lineCap: strokeProp.property("ADBE Vector Stroke Line Cap").value,
                                lineJoin: strokeProp.property("ADBE Vector Stroke Line Join").value,
                                miterLimit: strokeProp.property("ADBE Vector Stroke Miter Limit").value,
                                enabled: strokeProp.enabled
                            };
                            result.strokes.push(strokeObj);
                        }
                    } catch (e) { }
                }

                // Get transform properties
                try {
                    if (group.property("ADBE Vector Transform Group")) {
                        var transform = group.property("ADBE Vector Transform Group");
                        result.transform = {
                            position: transform.property("ADBE Vector Position").value,
                            anchorPoint: transform.property("ADBE Vector Anchor Point").value,
                            scale: transform.property("ADBE Vector Scale").value,
                            rotation: transform.property("ADBE Vector Rotation").value,
                            opacity: transform.property("ADBE Vector Group Opacity").value,
                            skew: transform.property("ADBE Vector Skew").value,
                            skewAxis: transform.property("ADBE Vector Skew Axis").value
                        };
                    }
                } catch (e) { }
            }
        } catch (e) { }

        return result;
    }

    /**
     * Apply fill and stroke properties to a shape group
     * @param {Property} vectorsGroup - The vectors group to apply properties to
     * @param {Array} fills - Array of fill property objects
     * @param {Array} strokes - Array of stroke property objects
     */
    function applyFillAndStroke(vectorsGroup, fills, strokes) {
        // Add fills with the same properties
        for (var f = 0; f < fills.length; f++) {
            try {
                var fill = fills[f];
                var newFill = vectorsGroup.addProperty("ADBE Vector Graphic - Fill");
                newFill.property("ADBE Vector Fill Color").setValue(fill.color);
                newFill.property("ADBE Vector Fill Opacity").setValue(fill.opacity);
                newFill.property("ADBE Vector Fill Rule").setValue(fill.blendMode);
                newFill.enabled = fill.enabled;
            } catch (e) { }
        }

        // Add strokes with the same properties
        for (var s = 0; s < strokes.length; s++) {
            try {
                var stroke = strokes[s];
                var newStroke = vectorsGroup.addProperty("ADBE Vector Graphic - Stroke");
                newStroke.property("ADBE Vector Stroke Color").setValue(stroke.color);
                newStroke.property("ADBE Vector Stroke Opacity").setValue(stroke.opacity);
                newStroke.property("ADBE Vector Stroke Width").setValue(stroke.width);
                newStroke.property("ADBE Vector Stroke Line Cap").setValue(stroke.lineCap);
                newStroke.property("ADBE Vector Stroke Line Join").setValue(stroke.lineJoin);
                newStroke.property("ADBE Vector Stroke Miter Limit").setValue(stroke.miterLimit);
                newStroke.enabled = stroke.enabled;
            } catch (e) { }
        }

        // If no fill or stroke was found, add defaults
        if (fills.length === 0) {
            try {
                vectorsGroup.addProperty("ADBE Vector Graphic - Fill");
            } catch (e) { }
        }

        if (strokes.length === 0) {
            try {
                vectorsGroup.addProperty("ADBE Vector Graphic - Stroke");
            } catch (e) { }
        }
    }

    /**
     * Apply transform properties to a transform group
     * @param {Property} transformGroup - The transform group to apply properties to
     * @param {Object} props - Object containing transform properties
     */
    function applyTransformProperties(transformGroup, props) {
        if (!props) return;

        try {
            transformGroup.property("ADBE Vector Position").setValue(props.position);
            transformGroup.property("ADBE Vector Anchor Point").setValue(props.anchorPoint);
            transformGroup.property("ADBE Vector Scale").setValue(props.scale);
            transformGroup.property("ADBE Vector Rotation").setValue(props.rotation);
            transformGroup.property("ADBE Vector Group Opacity").setValue(props.opacity);
            transformGroup.property("ADBE Vector Skew").setValue(props.skew);
            transformGroup.property("ADBE Vector Skew Axis").setValue(props.skewAxis);
        } catch (e) { }
    }

    //=====================================================================
    // MAIN SCRIPT EXECUTION
    //=====================================================================

    // Check if a composition is active
    if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please open a composition first.");
        return;
    }

    var comp = app.project.activeItem;
    var selectedLayers = comp.selectedLayers;

    // Check if a layer is selected
    if (selectedLayers.length === 0) {
        alert("Please select a shape layer with a rectangle.");
        return;
    }

    var layer = selectedLayers[0];

    // Check if the selected layer is a shape layer
    if (!(layer instanceof ShapeLayer)) {
        alert("Please select a shape layer with a rectangle.");
        return;
    }

    // Prepare results object to store rectangle search results
    var rectResults = {
        found: false,
        path: null,
        ref: null,
        groupRef: null,
        props: {
            size: [100, 100],
            position: [0, 0],
            roundness: 0
        },
        position: [0, 0]
    };

    // Search for rectangle in shape layer
    try {
        var rootVectors = layer.property("ADBE Root Vectors Group");

        if (rootVectors) {
            for (var i = 1; i <= rootVectors.numProperties; i++) {
                try {
                    var prop = rootVectors.property(i);
                    if (prop && findRectangle(prop, rectResults)) {
                        break;
                    }
                } catch (e) { }
            }
        }

        if (!rectResults.found) {
            alert("No rectangle found in the selected shape layer.");
            return;
        }

        // Begin undo group
        app.beginUndoGroup("Rectangulator");

        // Apply the pseudo effect to the layer FIRST. applyPreset() invalidates
        // existing property references, so everything created after this point
        // stays valid and nothing needs to survive the preset application.
        ApplyFFX.config(
            layer,
            rectangulatorControllerBinary,
            rectangulatorControllerMatchName,
            rectangulatorControllerVersion,
            rectangulatorControllerName
        );

        // Locate the freshly applied controller (last matching effect) and seed
        // it with the ORIGINAL rectangle's size and roundness, so the rig
        // replaces the parametric rectangle exactly instead of snapping to the
        // controller's 100x100 defaults.
        var controllerFx = null;
        var parade = layer.property("ADBE Effect Parade");
        if (parade) {
            for (var fxi = parade.numProperties; fxi >= 1; fxi--) {
                var cand = parade.property(fxi);
                if (cand && cand.name && cand.name.replace(/^\s+|\s+$/g, "") === "Rectangulator Controls") {
                    controllerFx = cand;
                    break;
                }
            }
        }
        if (controllerFx) {
            var rw = rectResults.props.size[0];
            var rh = rectResults.props.size[1];
            setControllerParam(controllerFx, "Rectangle Width (px)", rw);
            setControllerParam(controllerFx, "Rectangle Height (px)", rh);
            var minSide = Math.min(rw, rh);
            var roundPct = 0;
            if (minSide > 0 && rectResults.props.roundness > 0) {
                roundPct = (rectResults.props.roundness / minSide) * 100;
                if (roundPct > 100) roundPct = 100;
            }
            setControllerParam(controllerFx, "Top Left Corner Rounding", roundPct);
            setControllerParam(controllerFx, "Top Right Corner Rounding", roundPct);
            setControllerParam(controllerFx, "Bottom Right Left Corner Rounding", roundPct);
            setControllerParam(controllerFx, "Bottom Left Corner Rounding", roundPct);
        }

        // Get original shape properties (re-resolved fresh after the preset)
        var rectGroup = RefManager.resolve(rectResults.groupRef);
        var shapeProps = getShapeProperties(rectGroup);

        // Create a new shape group
        var contents = layer.property("ADBE Root Vectors Group");
        var newGroup = contents.addProperty("ADBE Vector Group");
        newGroup.name = "Parametric Rectangle";
        var newVectorsGroup = newGroup.property("ADBE Vectors Group") || newGroup.property("Contents");
        if (!newVectorsGroup) {
            throw new Error("Could not access the new shape group's contents.");
        }

        // Add the path to the group FIRST (a fill/stroke only renders paths that
        // sit above it in the group), but do NOT keep the returned reference:
        // the applyFillAndStroke() additions below invalidate sibling refs.
        newVectorsGroup.addProperty("ADBE Vector Shape - Group");

        // Apply fill and stroke properties from the original rectangle
        applyFillAndStroke(newVectorsGroup, shapeProps.fills, shapeProps.strokes);

        // Apply transform properties if available
        if (shapeProps.transform) {
            applyTransformProperties(newGroup.property("ADBE Vector Transform Group"), shapeProps.transform);
        }

        // Re-fetch the path group fresh now that all additions are done
        // (matchName lookup returns the first — and only — shape path).
        var pathGroup = newVectorsGroup.property("ADBE Vector Shape - Group");
        var pathProp = pathGroup
            ? (pathGroup.property("ADBE Vector Shape") || pathGroup.property("Path"))
            : null;
        if (!pathProp) {
            throw new Error("Could not access the new path property.");
        }
        pathProp.expression = expressions.path;

        var transformGroup = newGroup.property("ADBE Vector Transform Group");
        if (transformGroup) {
            // Find anchor point and position properties
            var anchorPointProp = transformGroup.property("ADBE Vector Anchor Point");
            var positionProp = transformGroup.property("ADBE Vector Position");

            if (anchorPointProp && positionProp) {
                // Set initial values
                anchorPointProp.setValue([0, 0]);
                positionProp.setValue(rectResults.position);

                // Apply expressions
                anchorPointProp.expression = expressions.anchorPoint;
                positionProp.expression = expressions.position;
            }
        }

        // Remove or hide the original rectangle group
        try {
            var verifyRectGroup = RefManager.resolve(rectResults.groupRef);
            if (verifyRectGroup) {
                try {
                    RefManager.remove(rectResults.groupRef);
                } catch (e1) {
                    try {
                        var parent = verifyRectGroup.parentProperty;
                        if (parent) {
                            for (var r = 1; r <= parent.numProperties; r++) {
                                if (parent.property(r) === verifyRectGroup) {
                                    parent.property(r).remove();
                                    break;
                                }
                            }
                        }
                    } catch (e2) {
                        try {
                            verifyRectGroup.enabled = false;
                        } catch (e3) { }
                    }
                }
            }
        } catch (e) { }

    } catch (err) {
        alert("Rectangulator error: " + err.toString() +
            (err.line ? "  (line " + err.line + ")" : ""));
    } finally {
        app.endUndoGroup();
    }
})();
