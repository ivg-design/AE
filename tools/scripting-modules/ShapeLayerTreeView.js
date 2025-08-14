/**
 * Shape Layer Tree View Module
 *
 * This module provides functions to create a tree view structure for shape layers in Adobe After Effects.
 * It includes helper functions to extract shape groups and paths, create a tree view, and handle selection detection.
 *
 * USAGE:
 * 1. Include this module in your script.
 * 2. Use the provided functions to create and use a shape layer tree view.
 *
 * @version 1.0.0
 * @date 2023-10-09
 * @license MIT
 * @author IVG Design (c) 2024
 * @module ShapeLayerTreeView
 * @description This module provides functions to create a tree view structure for shape layers in Adobe After Effects.
 * @example
 * 
 * // Example usage of the module
 * var selectedLayer = app.project.activeItem.selectedLayers[0];
 * var groups = shapeLayerTreeView.extractGroups(selectedLayer);
 * var treeView = shapeLayerTreeView.createTreeView(groups);
 * 
 * ======================================================
 * 
 * after seelecting a path in the tree view, you can return the AE path and object like this:
 * var aePathAndObject = shapeLayerTreeView.getAEPathAndObject(treeView, selectedLayer);
 * alert(aePathAndObject.pathString);
 * alert(aePathAndObject.pathObject);
 */

var ShapeLayerTreeView = (function () {
    var module = {};

    /**
       * Recursively extracts groups and shape layers from an After Effects shape layer.
       *
       * @param {AVLayer} layer - The After Effects shape layer to extract from.
       * @param {Array<string>} [parentChain] - An array representing the chain of parent groups leading to the current group.
       * @returns {Array<Object>} - An array of objects representing the extracted groups and shapes.
       */
    module.extractGroups = function (layer, parentChain) {
        var groups = [];
        parentChain = parentChain || [];
        var group = layer.property("Contents");
        for (var i = 1; i <= group.numProperties; i++) {
            var property = group.property(i);
            var groupName = property.name;
            var currentChain = parentChain.concat([groupName]);
            if (property.matchName === "ADBE Vector Group") {
                var groupItem = {
                    name: groupName,
                    type: "group",
                    propertyChain: currentChain,
                    groups: module.extractGroups(property.property("Contents"), currentChain)
                };
                groups.push(groupItem);
            } else if (property.matchName === "ADBE Vector Shape - Group") {
                groups.push({
                    name: groupName,
                    type: "shape",
                    propertyChain: currentChain,
                    path: property.property("Path 1")
                });
            }
        }
        return groups;
    };

    /**
     * Constructs the After Effects path string and object for the selected item in the tree view.
     *
     * @param {TreeView} treeView - The tree view containing the shape groups and paths.
     * @param {AVLayer} aeLayer - The After Effects layer containing the shape groups and paths.
     * @returns {Object} - An object containing the path string and path object.
     */
    module.getAEPathAndObject = function (treeView, aeLayer) {
        var selectedItem = treeView.selection;
        if (!selectedItem) {
            alert("Nothing selected!");
            return;
        }

        var aePathString = 'thisComp.layer("' + aeLayer.name + '")';
        var pathComponents = [];
        var currentAEObject = aeLayer; // Start with the initial AE layer

        // Traverse upwards through the tree to build the path components
        while (selectedItem && typeof selectedItem.text === 'string') {
            pathComponents.unshift(selectedItem.text);
            selectedItem = selectedItem.parent;
        }

        // Construct both AE Path String and AE Path Object
        for (var i = 0; i < pathComponents.length; i++) {
            var component = pathComponents[i];
            aePathString += '("Contents")("' + component + '")';

            if (currentAEObject && currentAEObject.property) {
                currentAEObject = currentAEObject.property("Contents").property(component);
            } else {
                alert("Invalid path in AE hierarchy");
                return;
            }
        }

        aePathString += '("Path")'; // Add the final "Path"

        if (currentAEObject && currentAEObject.property("Path")) {
            currentAEObject = currentAEObject.property("Path");
        } else {
            alert("Path property not found");
            return;
        }

        return {
            pathString: aePathString,
            pathObject: currentAEObject
        };
    };

    /**
     * Recursively creates a tree view structure for groups and shapes to display in a ScriptUI dialog.
     *
     * @param {Array<Object>} groups - An array of group and shape objects to be added to the tree view.
     * @param {TreeView} parentNode - The parent node in the tree view.
     */
    module.createTreeView = function (groups, parentNode) {
        if (groups && typeof groups === "object") {
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                if (group.type === "group") {
                    var node = parentNode.add("node", group.name);
                    module.createTreeView(group.groups, node);
                    node.expanded = true;
                } else if (group.type === "shape") {
                    parentNode.add("item", group.name);
                }
            }
        }
    };

    return module;
})();