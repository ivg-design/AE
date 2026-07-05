/**
 * OrderMaster - Advanced Layer and Shape Group Reordering System
 *
 * @name OrderMaster
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 *
 * @changelog
 * 2.0.1 (2026-07-04)
 *   - Guard app.project.activeItem: when there is no active composition (or the
 *     selected Project-panel item is a folder/footage item), proceed() now shows the
 *     friendly guidance alert and returns instead of throwing on .selectedLayers. The
 *     check runs before beginUndoGroup, and the reorder body is wrapped in try/finally
 *     so the undo group is always closed.
 *   - Shape-group reordering now keeps direct PropertyGroup object references instead of
 *     re-resolving groups by .name, fixing silently corrupted stacking order when two
 *     selected groups share a name. Removed the now-unused findShapeGroupByName helper.
 * 
 * @description
 * A sophisticated reordering tool that provides precise control over the arrangement of contiguous
 * layers in compositions and shape groups within shape layers. The script offers both systematic
 * reversal and randomization options, making it invaluable for layer management, animation timing
 * adjustments, and creating varied visual arrangements in complex After Effects projects.
 * 
 * @functionality
 * • Intelligent contiguity detection for safe layer and shape group reordering
 * • Dual operation modes: systematic reversal and randomized arrangement
 * • Multi-target support: composition layers and shape layer contents
 * • Advanced validation system ensuring only contiguous selections are processed
 * • Precise index tracking and mathematical reordering algorithms
 * • Shape group hierarchy preservation during reordering operations
 * • Comprehensive error handling with detailed user feedback
 * • Memory-efficient processing for large layer and group selections
 * • Full undo group support for safe operation reversal
 * • Real-time validation with immediate user feedback
 * 
 * @usage
 * 1. Select multiple contiguous layers in a composition timeline OR
 * 2. Select multiple contiguous shape groups within a single shape layer
 * 3. Run the script to open the OrderMaster dialog
 * 4. Choose your reordering option:
 *    - Leave "Randomize" unchecked for systematic reversal (reverse order)
 *    - Check "Randomize" for random arrangement of selected items
 * 5. Click "Proceed" to execute the reordering operation
 * 6. The script will rearrange your selection according to the chosen method
 * 7. Use Undo (Ctrl+Z / Cmd+Z) if you need to reverse the operation
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with multiple layers OR single shape layer with multiple shape groups
 * • Contiguous selection of layers or shape groups (no gaps in indices)
 * • At least 2 items selected for reordering to be meaningful
 * 
 * @notes
 * • Contiguous selection means no gaps in layer indices or shape group order
 * • For layers: indices must be consecutive (e.g., layers 3, 4, 5, 6)
 * • For shape groups: groups must be adjacent in the shape layer hierarchy
 * • Randomization uses mathematical shuffling algorithms for true randomness
 * • The script preserves all layer and group properties during reordering
 * • Shape group reordering maintains all internal properties and animations
 * • Large selections are handled efficiently without performance degradation
 * • All reordering operations are atomic - either all succeed or none are applied
 */

/**
 * UI constructor
 * @constructor
 */
function UI() {
    this.window = new Window("dialog", "OrderMaster", undefined);
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
    // Guard: without an active composition (app.project.activeItem is null when no
    // comp is open, or a non-CompItem when a folder/footage item is selected in the
    // Project panel) reading .selectedLayers would throw. Show the friendly guidance
    // alert instead, and do this before opening the undo group so nothing is left open.
    var activeItem = app.project.activeItem;
    if (!(activeItem instanceof CompItem)) {
        alert("Please select contiguous layers or contiguous shape groups within a single shape layer.");
        return;
    }

    app.beginUndoGroup("OrderMaster");

    try {
        var selectedLayers = activeItem.selectedLayers;

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
    } finally {
        app.endUndoGroup();
    }
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
    var startIndex = shapeGroups[0].propertyIndex;

    // Keep direct PropertyGroup object references (mirroring LayerUtils.reorderLayers)
    // instead of round-tripping through .name. After Effects does not enforce unique
    // names among sibling shape groups, so re-resolving by name would collapse two
    // identically-named groups onto the same object and silently mis-order the result.
    var reorderedGroups = [];
    for (var i = 0; i < shapeGroups.length; i++) {
        reorderedGroups.push(shapeGroups[i]);
    }

    if (randomize) {
        reorderedGroups = Utils.shuffleArray(reorderedGroups);
    } else {
        reorderedGroups.reverse();
    }

    // Moving each object to an absolute target index left-to-right is safe because the
    // PropertyGroup references stay valid across moveTo() calls (identity is preserved).
    for (var i = 0; i < reorderedGroups.length; i++) {
        reorderedGroups[i].moveTo(startIndex + i);
    }
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