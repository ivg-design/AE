(function () {
    // Check if a property is selected
    var activeItem = app.project.activeItem;
    if (!(activeItem instanceof CompItem)) {
        alert("Please select a shape layer in a composition.");
        return;
    }

    // Ensure a layer is selected
    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0 || !(selectedLayers[0] instanceof ShapeLayer)) {
        alert("Please select a shape layer.");
        return;
    }

    var layer = selectedLayers[0]; // Assume the first selected layer is the correct one

    // Function to extract groups and shapes
    function extractGroups(group, parentChain) {
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
                    groups: extractGroups(property.property("Contents"), currentChain)
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

    // Extract shape groups
    var shapeGroups = extractGroups(layer.property("Contents"));

    // Check if shapeGroups is defined and has elements
    if (shapeGroups.length === 0) {
        alert("No shape groups found in the layer.");
        return;
    }

    // Create the UI
    var win = new Window("palette", "Select Path", undefined, { resizeable: true });
    win.orientation = "column";

    // Create the treeview
    var treeview = win.add("treeview", undefined, "", { numberOfColumns: 1, showHeaders: false });
    treeview.size = [300, 200];

    // Function to create treeview nodes
    function createTreeView(groups, parentNode) {
        if (groups && typeof groups === "object") {
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                if (group.type === "group") {
                    var node = parentNode.add("node", group.name);
                    createTreeView(group.groups, node);
                    node.expanded = true;
                } else if (group.type === "shape") {
                    parentNode.add("item", group.name);
                }
            }
        }
    }

    // Populate the treeview with shape groups and paths
    createTreeView(shapeGroups, treeview);

    // Add a checkbox group
    var checkboxGroup = win.add("group", undefined, "Options");
    checkboxGroup.orientation = "row";
    // Add checkboxes for Center and BoundingBox
    var centerCheckbox = checkboxGroup.add("checkbox", undefined, "Center");
    centerCheckbox.value = true; // Default to checked
    var boundingBoxCheckbox = checkboxGroup.add("checkbox", undefined, "BoundingBox");

    // Add a proceed button
    var proceedButton = win.add("button", undefined, "Proceed");
    proceedButton.onClick = function () {
        var selectedItem = treeview.selection;
        if (!selectedItem) {
            alert("Please select a path.");
            return;
        }

        // Find the selected path property
        var selectedPathChain;
        function findSelectedPath(groups, selectedItem) {
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                if (group.type === "group") {
                    if (group.name === selectedItem.parent.text) {
                        var paths = group.groups;
                        for (var j = 0; j < paths.length; j++) {
                            var path = paths[j];
                            if (path.name === selectedItem.text) {
                                return path.propertyChain;
                            }
                        }
                    }
                    var result = findSelectedPath(group.groups, selectedItem);
                    if (result) return result;
                } else if (group.type === "shape" && group.name === selectedItem.text) {
                    return group.propertyChain;
                }
            }
            return null;
        }

        selectedPathChain = findSelectedPath(shapeGroups, selectedItem);

        if (!selectedPathChain) {
            alert("Selected path not found.");
            return;
        }

        // Navigate to the path property
        var pathProperty = layer.property("Contents");
        for (var i = 0; i < selectedPathChain.length; i++) {
            pathProperty = layer.property("Contents").property(selectedPathChain[i]);
        }

        // Start undo group
        app.beginUndoGroup("Add Guides at Path Center");

        // Add named Slider Controls to store the values
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

        // Build the path property string dynamically
        var pathPropertyString = "content('" + selectedPathChain.join("').content('") + "').path";

        // Expression to calculate the center and bounding box
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

        // Apply the expression to each Slider Control
        effectsProperty.property(centerXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(centerYIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").expression = expression;

        // Retrieve the values from the Slider Controls
        var centerX = effectsProperty.property(centerXIndex).property("ADBE Slider Control-0001").value;
        var centerY = effectsProperty.property(centerYIndex).property("ADBE Slider Control-0001").value;
        var minX = effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").value;
        var maxX = effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").value;
        var minY = effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").value;
        var maxY = effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").value;

        // Remove the Slider Controls
        effectsProperty.property("Center X").remove();
        effectsProperty.property("Center Y").remove();
        effectsProperty.property("Min X").remove();
        effectsProperty.property("Max X").remove();
        effectsProperty.property("Min Y").remove();
        effectsProperty.property("Max Y").remove();

        // Add guides based on the selected options
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

        // End undo group
        app.endUndoGroup();

        // Close the window
        win.close();
    };

    win.center();
    win.show();
})();
