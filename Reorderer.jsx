/**
 * @file Layer/Shape Group Reordering Script for After Effects
 * @author IVG Design
 * @version 1.0
 * @license MIT
 *
 * @description This script allows you to reorder contiguous layers or shape groups within a single shape layer in After Effects.
 * You can choose to randomize the order or reverse it. The script provides a user interface for easy interaction.
 *
 * @license
 * MIT License
 *
 * Copyright (c) 2023 Your Name
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * UI constructor
 * @constructor
 */
function UI() {
    this.window = new Window("palette", "Layer/Shape Group Reordering", undefined);
    this.window.orientation = "column";
    this.window.alignChildren = ["center", "top"];
    this.window.spacing = 10;
    this.window.margins = 16;

    this.randomizeCheckbox = this.window.add("checkbox", undefined, "Randomize");

    var buttonGroup = this.window.add("group", undefined, "buttonGroup");
    buttonGroup.orientation = "row";
    buttonGroup.alignChildren = ["center", "center"];
    buttonGroup.spacing = 10;
    buttonGroup.margins = 0;

    this.proceedButton = buttonGroup.add("button", undefined, "Proceed");
    this.cancelButton = buttonGroup.add("button", undefined, "Cancel");

    var self = this;
    this.proceedButton.onClick = function () {
        self.proceed();
    };
    this.cancelButton.onClick = function () {
        self.cancel();
    };
}

/**
 * Shows the UI window
 */
UI.prototype.show = function () {
    this.window.center();
    this.window.show();
};

/**
 * Proceeds with the reordering based on user selection
 */
UI.prototype.proceed = function () {
    app.beginUndoGroup("Layer/Shape Group Reordering");

    var selectedLayers = app.project.activeItem.selectedLayers;

    if (selectedLayers.length > 1 && LayerUtils.areContiguousLayers(selectedLayers)) {
        LayerUtils.reorderLayers(selectedLayers, this.randomizeCheckbox.value);
    } else if (selectedLayers.length === 1 && selectedLayers[0] instanceof ShapeLayer) {
        var selectedShapeGroups = ShapeLayerUtils.getSelectedShapeGroups(selectedLayers[0]);
        if (selectedShapeGroups.length > 1 && ShapeLayerUtils.areContiguousShapeGroups(selectedShapeGroups)) {
            ShapeLayerUtils.reorderShapeGroups(selectedShapeGroups, this.randomizeCheckbox.value);
        } else {
            alert("Please select contiguous shape groups within a single shape layer.");
        }
    } else {
        alert("Please select contiguous layers or contiguous shape groups within a single shape layer.");
    }

    app.endUndoGroup();
};

/**
 * Closes the UI window
 */
UI.prototype.cancel = function () {
    this.window.close();
};

/**
 * LayerUtils constructor
 * @constructor
 */
function LayerUtils() { }

/**
 * Checks if the selected layers are contiguous
 * @param {Array} layers - Selected layers
 * @returns {boolean} - True if the layers are contiguous, false otherwise
 */
LayerUtils.areContiguousLayers = function (layers) {
    var sortedLayers = layers.slice().sort(function (a, b) {
        return a.index - b.index;
    });

    for (var i = 1; i < sortedLayers.length; i++) {
        if (sortedLayers[i].index !== sortedLayers[i - 1].index + 1) {
            return false;
        }
    }
    return true;
};

/**
 * Reorders the selected layers
 * @param {Array} layers - Selected layers
 * @param {boolean} randomize - True to randomize the order, false to reverse the order
 */
LayerUtils.reorderLayers = function (layers, randomize) {
    var comp = layers[0].containingComp;
    var selectedLayerIndices = [];

    // Collect indices of selected layers
    for (var i = 0; i < layers.length; i++) {
        selectedLayerIndices.push(layers[i].index);
    }

    if (randomize) {
        selectedLayerIndices = Utils.shuffleArray(selectedLayerIndices);
    } else {
        selectedLayerIndices.reverse();
    }

    // Store the original layers in an array to reference after reordering indices
    var reorderedLayers = [];
    for (var i = 0; i < selectedLayerIndices.length; i++) {
        reorderedLayers[i] = comp.layer(selectedLayerIndices[i]);
    }

    // Calculate the range within which to reorder
    var minIndex = Math.min.apply(null, selectedLayerIndices);
    var maxIndex = Math.max.apply(null, selectedLayerIndices);

    // Move each layer to the correct new position within the specified range
    for (var i = 0; i < reorderedLayers.length; i++) {
        var targetIndex = minIndex + i;
        var layerToMove = reorderedLayers[i];

        // Place the layer at the target index, adjusting for other layers moving around
        if (layerToMove.index !== targetIndex) {
            if (targetIndex <= layerToMove.index) {
                // If target is less than current, move after the layer currently at targetIndex-1 (to maintain position)
                layerToMove.moveBefore(comp.layer(targetIndex));
            } else {
                // If target is more than current, move after the layer currently at targetIndex+1 (due to 0-based index handling)
                layerToMove.moveAfter(comp.layer(targetIndex));
            }
        }
    }
};


/**
 * ShapeLayerUtils constructor
 * @constructor
 */
function ShapeLayerUtils() { }

/**
 * Gets the selected shape groups within a shape layer
 * @param {ShapeLayer} shapeLayer - Shape layer
 * @returns {Array} - Selected shape groups
 */
ShapeLayerUtils.getSelectedShapeGroups = function (shapeLayer) {
    var selectedShapeGroups = [];
    var shapeGroups = shapeLayer.selectedProperties;

    for (var i = 0; i < shapeGroups.length; i++) {
        if (shapeGroups[i] instanceof PropertyGroup && shapeGroups[i].propertyType === PropertyType.NAMED_GROUP) {
            selectedShapeGroups.push(shapeGroups[i]);
        }
    }

    return selectedShapeGroups;
};

/**
 * Checks if the selected shape groups are contiguous
 * @param {Array} shapeGroups - Selected shape groups
 * @returns {boolean} - True if the shape groups are contiguous, false otherwise
 */
ShapeLayerUtils.areContiguousShapeGroups = function (shapeGroups) {
    var sortedShapeGroups = shapeGroups.slice().sort(function (a, b) {
        return a.propertyIndex - b.propertyIndex;
    });

    for (var i = 1; i < sortedShapeGroups.length; i++) {
        if (sortedShapeGroups[i].propertyIndex !== sortedShapeGroups[i - 1].propertyIndex + 1) {
            return false;
        }
    }
    return true;
};

/**
 * Reorders the selected shape groups
 * @param {Array} shapeGroups - Selected shape groups
 * @param {boolean} randomize - True to randomize the order, false to reverse the order
 */
ShapeLayerUtils.reorderShapeGroups = function (shapeGroups, randomize) {
    var shapeLayer = shapeGroups[0].parentProperty;
    var startIndex = shapeGroups[0].propertyIndex;

    var shapeGroupNames = [];
    for (var i = 0; i < shapeGroups.length; i++) {
        shapeGroupNames.push(shapeGroups[i].name);
    }

    if (randomize) {
        shapeGroupNames = Utils.shuffleArray(shapeGroupNames);
    } else {
        shapeGroupNames.reverse();
    }

    for (var i = 0; i < shapeGroupNames.length; i++) {
        var shapeGroup = ShapeLayerUtils.findShapeGroupByName(shapeLayer, shapeGroupNames[i]);
        shapeGroup.moveTo(startIndex + i);
    }
};

/**
 * Finds a shape group by its name within a shape layer
 * @param {ShapeLayer} shapeLayer - Shape layer
 * @param {string} name - Name of the shape group
 * @returns {PropertyGroup|null} - Found shape group or null if not found
 */
ShapeLayerUtils.findShapeGroupByName = function (shapeLayer, name) {
    for (var i = 1; i <= shapeLayer.numProperties; i++) {
        var prop = shapeLayer.property(i);
        if (prop instanceof PropertyGroup && prop.name === name) {
            return prop;
        }
    }
    return null;
};

/**
 * Utils constructor
 * @constructor
 */
function Utils() { }

/**
 * Shuffles an array randomly
 * @param {Array} array - Array to be shuffled
 * @returns {Array} - Shuffled array
 */
Utils.shuffleArray = function (array) {
    var shuffledArray = [];
    for (var i = 0; i < array.length; i++) {
        shuffledArray[i] = array[i];
    }

    for (var i = shuffledArray.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffledArray[i];
        shuffledArray[i] = shuffledArray[j];
        shuffledArray[j] = temp;
    }
    return shuffledArray;
};

// Main Script
var ui = new UI();
ui.show();