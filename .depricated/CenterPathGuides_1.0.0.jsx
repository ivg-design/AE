/**
 * Center Path Guides Script for Adobe After Effects
 *
 * This script allows users to add guides to the center and bounding box of a selected path in a shape layer.
 * Users can select a path from a tree view and choose to add center and/or bounding box guides.
 *
 * FUNCTIONALITY:
 * - Extracts shape groups and paths from a selected shape layer.
 * - Displays a user interface with a tree view for selecting paths.
 * - Adds guides to the center and bounding box of the selected path.
 * - Supports undo functionality for all operations.
 *
 * USAGE:
 * 1. Select a shape layer in an active composition.
 * 2. Run the script.
 * 3. Select a path from the tree view and choose the desired guide options.
 * 4. Click "Proceed" to add the guides.
 *
 * @version 1.0.0
 * @date 2023-10-09
 * @license MIT
 *
 * @license
 * MIT License
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

(function () {
    /****************** HELPER FUNCTIONS ******************/

    /**
     * Recursively extracts groups and shape layers from an After Effects group.
     *
     * @param {Group} group - The After Effects group to extract from.
     * @param {string} parentName - The name of the parent group.
     * @param {Array<string>} [parentChain] - An array representing the chain of parent groups leading to the current group.
     * @returns {Array<Object>} - An array of objects representing the extracted groups and shapes.
     * 
     * Each object in the returned array has the following properties:
     * - `name` (string): The name of the group or shape.
     * - `type` (string): Either "group" or "shape" indicating the type.
     * - `propertyChain` (Array<string>): An array representing the chain of parent groups leading to this group or shape.
     * - `groups` (Array<Object>): An array of child groups (only present if type is "group").
     * - `path` (PathProperty): The path property of the shape (only present if type is "shape").
     */
    function extractGroups(group, parentName, parentChain) {
        var groups = [];
        parentChain = parentChain || [];
        for (var i = 1; i <= group.numProperties; i++) {
            var property = group.property(i);
            var groupName = property.name;
            var currentChain = parentChain.concat([groupName]);
            if (property.matchName === "ADBE Vector Group") {
                var groupItem = {
                    name: groupName,
                    type: "group",
                    propertyChain: currentChain,
                    groups: extractGroups(property.property("Contents"), groupName, currentChain)
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
    }

    /**
     * Retrieves the After Effects path and object based on the tree view selection and a given AE layer.
     *
     * @param {Object} treeView - The tree view object representing the AE hierarchy.
     * @param {Layer} aeLayer - The After Effects layer to start from.
     * @returns {Object|null} - An object containing the AE path string and the AE path object, or null if an invalid path or no selection.
     *
     * The returned object has the following properties:
     * - `pathString` (string): The After Effects path string that leads to the selected object.
     * - `pathObject` (Property): The After Effects object that corresponds to the selected item in the tree view.
     *
     * @throws Will show an alert if nothing is selected, if an invalid path is encountered, or if the path property is not found.
     */
    function getAEPathAndObject(treeView, aeLayer) {
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
    }

    /**
     * Recursively creates a tree view structure for groups and shapes to display as a tree in
     * a ScriptUI dialog.
     *
     * @param {Object[]} groups - An array of group and shape objects to be added to the tree view.
     * @param {TreeNode} parentNode - The parent node in the tree view.
     * @param {TreeView} treeView - The tree view object to build.
     */
    function createTreeView(groups, parentNode, treeView) {
        if (groups && typeof groups === "object") {
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                if (group.type === "group") {
                    var node = parentNode.add("node", group.name);
                    createTreeView(group.groups, node, treeView);
                    node.expanded = true;
                } else if (group.type === "shape") {
                    parentNode.add("item", group.name);
                }
            }
        }
    }

    /****************** CREATE UI ******************/

    /**
     * Displays a user interface for selecting a path and adding guides.
     *
     * @param {Array<Object>} shapeGroups - An array of shape groups with properties for tree view display.
     */
    function showUI(shapeGroups) {
        var win = new Window("palette", "Select Path", undefined, { resizeable: true });
        win.orientation = "column";

        var treeview = win.add("treeview", undefined, "", { numberOfColumns: 1, showHeaders: false });
        treeview.size = [300, 200];

        createTreeView(shapeGroups, treeview);

        var checkboxGroup = win.add("group", undefined, "Options");
        checkboxGroup.orientation = "row";
        var centerCheckbox = checkboxGroup.add("checkbox", undefined, "Center");
        centerCheckbox.value = true;
        var boundingBoxCheckbox = checkboxGroup.add("checkbox", undefined, "BoundingBox");

        var proceedButton = win.add("button", undefined, "Proceed");
        proceedButton.onClick = function () {
            var aePathAndObject = getAEPathAndObject(treeview, layer);
            if (!aePathAndObject) {
                return;
            }

            var pathProperty = aePathAndObject.pathObject;

            app.beginUndoGroup("Add Guides at Path Center");

            /****************** ADD SLIDERS ******************/

            var effectsProperty = layer.property("ADBE Effect Parade");
            var centerXSlider = effectsProperty.addProperty("ADBE Slider Control");
            centerXSlider.name = "Center X";
            var centerXIndex = centerXSlider.propertyIndex;

            var centerYSlider = effectsProperty.addProperty("ADBE Slider Control");
            centerYSlider.name = "Center Y";
            var centerYIndex = centerYSlider.propertyIndex;

            var minXSlider = effectsProperty.addProperty("ADBE Slider Control");
            minXSlider.name = "Min X";
            var minXIndex = minXSlider.propertyIndex;

            var maxXSlider = effectsProperty.addProperty("ADBE Slider Control");
            maxXSlider.name = "Max X";
            var maxXIndex = maxXSlider.propertyIndex;

            var minYSlider = effectsProperty.addProperty("ADBE Slider Control");
            minYSlider.name = "Min Y";
            var minYIndex = minYSlider.propertyIndex;

            var maxYSlider = effectsProperty.addProperty("ADBE Slider Control");
            maxYSlider.name = "Max Y";
            var maxYIndex = maxYSlider.propertyIndex;

            /****************** EXPRESSION ******************/
            // Construct the property string for the selected path
            // This string will be used in the expression to reference the path property
            var pathPropertyString = aePathAndObject.pathString;
            
            /* The expression is designed to calculate the center and bounding box of a path in a shape layer and adjust these values based on the transformations applied to the shape group. Here's a step-by-step breakdown of how the expression works:
                1. Path Property Reference:
                The expression starts by referencing the path property of the selected shape layer using the constructed pathPropertyString.
                2. Extract Points and Tangents:
                It extracts the points, inTangents, and outTangents of the path.
                3. Initialize Min/Max Values:
                Initializes minX, maxX, minY, and maxY with the coordinates of the first point in the path.
                4. Calculate Bounding Box:
                Iterates through all points in the path to find the minimum and maximum X and Y values, which define the bounding box.
                5. Calculate Center:
                Calculates the center of the path by averaging the min and max values for X and Y.
                6. Accumulate Transformations:
                Accumulates the position and anchor point transformations applied to the shape group to adjust the center and bounding box values.
                7. Adjust Center and Bounding Box:
                Adjusts the center and bounding box values based on the accumulated transformations.
                8. Return Values Based on Slider Name:
                Returns the appropriate value (center X, center Y, min X, max X, min Y, max Y) based on the name of the slider control
            */

            var expression =
                "var pathProperty = " + pathPropertyString + ";\n" +
                "var points = pathProperty.points();\n" +
                "var numPoints = points.length;\n" +
                "var minX = points[0][0];\n" +
                "var maxX = points[0][0];\n" +
                "var minY = points[0][1];\n" +
                "var maxY = points[0][1];\n" +
                "for (var i = 1; i < numPoints; i++) {\n" +
                "    var x = points[i][0];\n" +
                "    var y = points[i][1];\n" +
                "    if (x < minX) minX = x;\n" +
                "    if (x > maxX) maxX = x;\n" +
                "    if (y < minY) minY = y;\n" +
                "    if (y > maxY) maxY = y;\n" +
                "}\n" +
                "var centerX = (minX + maxX) / 2;\n" +
                "var centerY = (minY + maxY) / 2;\n" +
                "var center = [centerX, centerY];\n" +
                "var accumulatedPosition = [0, 0];\n" +
                "var accumulatedAnchor = [0, 0];\n" +
                "var level = 1;\n" +
                "try {\n" +
                "    while (pathProperty.propertyGroup(level) !== null) {\n" +
                "        var group = pathProperty.propertyGroup(level);\n" +
                "        if (group.matchName !== 'ADBE Vector Group') {\n" +
                "            var groupTransform = group.transform;\n" +
                "            if (groupTransform) {\n" +
                "                var groupPosition = groupTransform.position.value;\n" +
                "                var groupAnchor = groupTransform.anchorPoint.value;\n" +
                "                accumulatedPosition[0] += groupPosition[0] - groupAnchor[0];\n" +
                "                accumulatedPosition[1] += groupPosition[1] - groupAnchor[1];\n" +
                "            }\n" +
                "        }\n" +
                "        level++;\n" +
                "    }\n" +
                "} catch (e) {}\n" +
                "var adjustedCenterX = center[0] + accumulatedPosition[0];\n" +
                "var adjustedCenterY = center[1] + accumulatedPosition[1];\n" +
                "var adjustedCenter = [adjustedCenterX, adjustedCenterY];\n" +
                "var adjustedMinX = minX + accumulatedPosition[0];\n" +
                "var adjustedMaxX = maxX + accumulatedPosition[0];\n" +
                "var adjustedMinY = minY + accumulatedPosition[1];\n" +
                "var adjustedMaxY = maxY + accumulatedPosition[1];\n" +
                "var sliderName = thisProperty.propertyGroup(1).name;\n" +
                "if (sliderName === 'Center X') adjustedCenter[0];\n" +
                "else if (sliderName === 'Center Y') adjustedCenter[1];\n" +
                "else if (sliderName === 'Min X') adjustedMinX;\n" +
                "else if (sliderName === 'Max X') adjustedMaxX;\n" +
                "else if (sliderName === 'Min Y') adjustedMinY;\n" +
                "else if (sliderName === 'Max Y') adjustedMaxY;\n" +
                "else 0;";

            /****************** APPLY EXPRESSION TO SLIDERS ******************/

            effectsProperty.property(centerXIndex).property("ADBE Slider Control-0001").expression = expression;
            effectsProperty.property(centerYIndex).property("ADBE Slider Control-0001").expression = expression;
            effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").expression = expression;
            effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").expression = expression;
            effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").expression = expression;
            effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").expression = expression;

            /****************** HARVEST POST-EXPRESSION VALUES ******************/

            var centerX = effectsProperty.property(centerXIndex).property("ADBE Slider Control-0001").value;
            var centerY = effectsProperty.property(centerYIndex).property("ADBE Slider Control-0001").value;
            var minX = effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").value;
            var maxX = effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").value;
            var minY = effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").value;
            var maxY = effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").value;

            /****************** REMOVE SLIDERS ******************/

            effectsProperty.property("Center X").remove();
            effectsProperty.property("Center Y").remove();
            effectsProperty.property("Min X").remove();
            effectsProperty.property("Max X").remove();
            effectsProperty.property("Min Y").remove();
            effectsProperty.property("Max Y").remove();

            /****************** ADD GUIDES ******************/

            if (centerCheckbox.value) {
                activeItem.addGuide(1, centerX); // Vertical guide
                activeItem.addGuide(0, centerY); // Horizontal guide
            }

            if (boundingBoxCheckbox.value) {
                // Add bounding box guides
                activeItem.addGuide(1, minX); // Left guide
                activeItem.addGuide(1, maxX); // Right guide
                activeItem.addGuide(0, minY); // Top guide
                activeItem.addGuide(0, maxY); // Bottom guide
            }

            app.endUndoGroup();
            win.close();
        };

        win.center();
        win.show();
    }

    /****************** INITIAL CHECKS ******************/

    var activeItem = app.project.activeItem;
    if (!(activeItem instanceof CompItem)) {
        alert("Please select a shape layer in a composition.");
        return;
    }

    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0 || !(selectedLayers[0] instanceof ShapeLayer)) {
        alert("Please select a shape layer.");
        return;
    }

    var layer = selectedLayers[0];
    var shapeGroups = extractGroups(layer.property("Contents"));

    if (shapeGroups.length === 0) {
        alert("No shape groups found in the layer.");
        return;
    }

    showUI(shapeGroups);
})();