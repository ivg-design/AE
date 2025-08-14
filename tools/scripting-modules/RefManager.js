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