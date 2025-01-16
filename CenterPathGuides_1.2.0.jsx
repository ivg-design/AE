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
 * @version 1.1.1
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
// @'include modules/PropQuery.jsx'
(function () {
    /****************** HELPER FUNCTIONS ******************/

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

    function showUI(shapeGroups) {
        var win = new Window("palette", "Select Path", undefined, { resizeable: true });
        win.orientation = "column";

        if (shapeGroups.length > 0) {
            var treeview = win.add("treeview", undefined, "", { numberOfColumns: 1, showHeaders: false });
            treeview.size = [300, 200];
            createTreeView(shapeGroups, treeview);
        }

        var checkboxGroup = win.add("group", undefined, "Options");
        checkboxGroup.orientation = "row";
        var centerCheckbox = checkboxGroup.add("checkbox", undefined, "Center");
        centerCheckbox.value = true;
        var boundingBoxCheckbox = checkboxGroup.add("checkbox", undefined, "BoundingBox");
        var bboxCenterCheckbox = checkboxGroup.add("checkbox", undefined, "BBox Center");

        var buttonGroup = win.add("group", undefined, "Buttons");
        buttonGroup.orientation = "row";
        var proceedButton = buttonGroup.add("button", undefined, "Proceed");
        var cancelButton = buttonGroup.add("button", undefined, "Cancel");
        cancelButton.onClick = function () {
            win.close();
        };
        proceedButton.onClick = function () {
            app.beginUndoGroup("Add Guides");

            if (layer instanceof ShapeLayer) {
                var aePathAndObject = getAEPathAndObject(treeview, layer);
                if (!aePathAndObject) {
                    return;
                }

                var pathProperty = aePathAndObject.pathObject;

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
                var pathPropertyString = aePathAndObject.pathString;

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
                    "if (thisLayer.hasParent) {\n" +
                    "    adjustedCenter = thisLayer.toComp(adjustedCenter);\n" +
                    "    adjustedMinX = thisLayer.toComp([adjustedMinX, 0])[0];\n" +
                    "    adjustedMaxX = thisLayer.toComp([adjustedMaxX, 0])[0];\n" +
                    "    adjustedMinY = thisLayer.toComp([0, adjustedMinY])[1];\n" +
                    "    adjustedMaxY = thisLayer.toComp([0, adjustedMaxY])[1];\n" +
                    "}\n" +
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

                // Adjust positions by the scale of the layer
                var scale = layer.scale.value;
                centerX *= scale[0] / 100;
                centerY *= scale[1] / 100;
                minX *= scale[0] / 100;
                maxX *= scale[0] / 100;
                minY *= scale[1] / 100;
                maxY *= scale[1] / 100;

                /****************** REMOVE SLIDERS ******************/
                // effectsProperty.property("Center X").remove();
                // effectsProperty.property("Center Y").remove();
                // effectsProperty.property("Min X").remove();
                // effectsProperty.property("Max X").remove();
                // effectsProperty.property("Min Y").remove();
                // effectsProperty.property("Max Y").remove();

                /****************** ADD GUIDES ******************/
                if (centerCheckbox.value) {
                    var anchorPoint = layer.anchorPoint.value;
                    activeItem.addGuide(1, anchorPoint[0]); // Vertical guide
                    activeItem.addGuide(0, anchorPoint[1]); // Horizontal guide
                }

                if (bboxCenterCheckbox.value) {
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

            } else if (layer instanceof TextLayer) {
                var rect = layer.sourceRectAtTime(layer.time, false);
                var centerX = rect.left + rect.width / 2;
                var centerY = rect.top + rect.height / 2;
                var minX = rect.left;
                var maxX = rect.left + rect.width;
                var minY = rect.top;
                var maxY = rect.top + rect.height;

                if (centerCheckbox.value) {
                    activeItem.addGuide(1, centerX); // Vertical guide
                    activeItem.addGuide(0, centerY); // Horizontal guide
                }

                if (boundingBoxCheckbox.value) {
                    activeItem.addGuide(1, minX); // Left guide
                    activeItem.addGuide(1, maxX); // Right guide
                    activeItem.addGuide(0, minY); // Top guide
                    activeItem.addGuide(0, maxY); // Bottom guide
                }

            } else if (layer instanceof AVLayer) {
                var centerX = layer.width / 2;
                var centerY = layer.height / 2;
                var minX = 0;
                var maxX = layer.width;
                var minY = 0;
                var maxY = layer.height;

                if (centerCheckbox.value) {
                    activeItem.addGuide(1, centerX); // Vertical guide
                    activeItem.addGuide(0, centerY); // Horizontal guide
                }

                if (boundingBoxCheckbox.value) {
                    activeItem.addGuide(1, minX); // Left guide
                    activeItem.addGuide(1, maxX); // Right guide
                    activeItem.addGuide(0, minY); // Top guide
                    activeItem.addGuide(0, maxY); // Bottom guide
                }
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
        alert("Please select a layer in a composition.");
        return;
    }

    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select a layer.");
        return;
    }

    var layer = selectedLayers[0];
    var shapeGroups = [];

    if (layer instanceof ShapeLayer) {
        shapeGroups = extractGroups(layer.property("Contents"));
        if (shapeGroups.length === 0) {
            alert("No shape groups found in the layer.");
            return;
        }
        showUI(shapeGroups); // Call showUI for shape layers
    } else {
        // KBar integration
        if (typeof kbar !== 'undefined' && kbar.button) {
            var button = kbar.button;

            switch (button.argument) {
                case 'Center':
                    app.beginUndoGroup("Add Center Guides");
                    if (layer instanceof TextLayer) {
                        addTextLayerCenterGuides(layer);
                    } else if (layer instanceof AVLayer) {
                        addAVLayerCenterGuides(layer);
                    }
                    app.endUndoGroup();
                    break;
                case 'BoundingBox':
                    app.beginUndoGroup("Add Bounding Box Guides");
                    if (layer instanceof TextLayer) {
                        addTextLayerBoundingBoxGuides(layer);
                    } else if (layer instanceof AVLayer) {
                        addAVLayerBoundingBoxGuides(layer);
                    }
                    app.endUndoGroup();
                    break;
                default:
                    alert("Unknown argument: " + button.argument);
                    break;
            }
        } else {
            app.beginUndoGroup("Add Guides");

            var centerX, centerY, minX, maxX, minY, maxY;

            if (layer instanceof TextLayer || layer instanceof AVLayer) {
                var position = getLayerPosition(layer);
                centerX = position[0];
                centerY = position[1];

                var width = layer.width * (layer.scale.value[0] / 100);
                var height = layer.height * (layer.scale.value[1] / 100);

                minX = centerX - width / 2;
                maxX = centerX + width / 2;
                minY = centerY - height / 2;
                maxY = centerY + height / 2;
            }

            activeItem.addGuide(1, centerX); // Vertical guide
            activeItem.addGuide(0, centerY); // Horizontal guide
            activeItem.addGuide(1, minX); // Left guide
            activeItem.addGuide(1, maxX); // Right guide
            activeItem.addGuide(0, minY); // Top guide
            activeItem.addGuide(0, maxY); // Bottom guide

            app.endUndoGroup();
        }
    }

    /****************** HELPER FUNCTIONS FOR ADDING GUIDES ******************/

    function addTextLayerCenterGuides(layer) {
        var activeItem = app.project.activeItem;
        var centerPosition = getTextLayerCenterPosition(layer);

        activeItem.addGuide(1, centerPosition[0]); // Vertical guide
        activeItem.addGuide(0, centerPosition[1]); // Horizontal guide
    }

    function addTextLayerBoundingBoxGuides(layer) {
        var activeItem = app.project.activeItem;
        var boundingBox = getTextLayerBoundingBox(layer);

        activeItem.addGuide(1, boundingBox.minX); // Left guide
        activeItem.addGuide(1, boundingBox.maxX); // Right guide
        activeItem.addGuide(0, boundingBox.minY); // Top guide
        activeItem.addGuide(0, boundingBox.maxY); // Bottom guide
    }

    function addAVLayerCenterGuides(layer) {
        var activeItem = app.project.activeItem;
        var position = layer.position.value;

        activeItem.addGuide(1, position[0]); // Vertical guide
        activeItem.addGuide(0, position[1]); // Horizontal guide
    }

    function addAVLayerBoundingBoxGuides(layer) {
        var activeItem = app.project.activeItem;
        var boundingBox = getAVLayerBoundingBox(layer);

        activeItem.addGuide(1, boundingBox.minX); // Left guide
        activeItem.addGuide(1, boundingBox.maxX); // Right guide
        activeItem.addGuide(0, boundingBox.minY); // Top guide
        activeItem.addGuide(0, boundingBox.maxY); // Bottom guide
    }

    function getTextLayerCenterPosition(layer) {
        var centerPositionControl = layer.property("ADBE Effect Parade").addProperty("ADBE Point Control");
        centerPositionControl.name = "TempCenterPositionControl";
        centerPositionControl.property("ADBE Point Control-0001").expression = 
            "var rect = thisLayer.sourceRectAtTime();" +
            "thisLayer.toComp([rect.left + rect.width / 2, rect.top + rect.height / 2])";

        var centerPosition = centerPositionControl.property("ADBE Point Control-0001").value;
        centerPositionControl.remove();

        return centerPosition;
    }

    function getTextLayerBoundingBox(layer) {
        var effectsProperty = layer.property("ADBE Effect Parade");

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

        var expression = 
            "var rect = thisLayer.sourceRectAtTime();" +
            "var minX = thisLayer.toComp([rect.left, rect.top])[0];" +
            "var maxX = thisLayer.toComp([rect.left + rect.width, rect.top])[0];" +
            "var minY = thisLayer.toComp([rect.left, rect.top])[1];" +
            "var maxY = thisLayer.toComp([rect.left + rect.width, rect.top + rect.height])[1];" +
            "var sliderName = thisProperty.propertyGroup(1).name;" +
            "if (sliderName === 'Min X') minX;" +
            "else if (sliderName === 'Max X') maxX;" +
            "else if (sliderName === 'Min Y') minY;" +
            "else if (sliderName === 'Max Y') maxY;" +
            "else 0;";

        effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").expression = expression;

        var minX = effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").value;
        var maxX = effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").value;
        var minY = effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").value;
        var maxY = effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").value;

        effectsProperty.property("Min X").remove();
        effectsProperty.property("Max X").remove();
        effectsProperty.property("Min Y").remove();
        effectsProperty.property("Max Y").remove();

        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        };
    }

    function getAVLayerBoundingBox(layer) {
        var width = layer.width * (layer.scale.value[0] / 100);
        var height = layer.height * (layer.scale.value[1] / 100);
        var position = layer.position.value;

        return {
            minX: position[0] - width / 2,
            maxX: position[0] + width / 2,
            minY: position[1] - height / 2,
            maxY: position[1] + height / 2
        };
    }

    function getLayerPosition(layer) {
        if (layer instanceof TextLayer) {
            var centerPosition = getTextLayerCenterPosition(layer);
            return centerPosition;
        } else if (layer instanceof AVLayer) {
            return layer.position.value;
        }
        return [0, 0]; // Default return value if layer type is not handled
    }
})();