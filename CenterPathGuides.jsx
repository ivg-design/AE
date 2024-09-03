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
    $.writeln("Selected layer: " + layer.name);

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
                $.writeln("Found group: " + groupName);
            } else if (property.matchName === "ADBE Vector Shape - Group") {
                groups.push({
                    name: groupName,
                    type: "shape",
                    propertyChain: currentChain,
                    path: property.property("Path 1")
                });
                $.writeln("Found shape: " + groupName);
            }
        }
        return groups;
    }

    // Extract shape groups
    var shapeGroups = extractGroups(layer.property("Contents"));
    $.writeln("Total shape groups found: " + shapeGroups.length);

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
                    $.writeln("Added group to treeview: " + group.name);
                } else if (group.type === "shape") {
                    parentNode.add("item", group.name);
                    $.writeln("Added shape to treeview: " + group.name);
                }
            }
        }
    }

    // Populate the treeview with shape groups and paths
    createTreeView(shapeGroups, treeview);

    // Add a proceed button
    var proceedButton = win.add("button", undefined, "Proceed");
    proceedButton.onClick = function () {
        var selectedItem = treeview.selection;
        if (!selectedItem) {
            alert("Please select a path.");
            return;
        }

        $.writeln("Selected item: " + selectedItem.text);
        $.writeln("Selected item's parent: " + (selectedItem.parent ? selectedItem.parent.text : "No parent"));

        // Find the selected path property
        var selectedPathChain;
        function findSelectedPath(groups, selectedItem) {
            $.writeln("Searching for: " + selectedItem.text);
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                $.writeln("Checking group/shape: " + group.name + " (Type: " + group.type + ")");
                if (group.type === "group") {
                    if (group.name === selectedItem.parent.text) {
                        $.writeln("Found matching parent group: " + group.name);
                        var paths = group.groups;
                        for (var j = 0; j < paths.length; j++) {
                            var path = paths[j];
                            if (path.name === selectedItem.text) {
                                $.writeln("Found matching shape: " + path.name);
                                return path.propertyChain;
                            }
                        }
                    }
                    var result = findSelectedPath(group.groups, selectedItem);
                    if (result) return result;
                } else if (group.type === "shape" && group.name === selectedItem.text) {
                    $.writeln("Found matching shape: " + group.name);
                    return group.propertyChain;
                }
            }
            return null;
        }

        selectedPathChain = findSelectedPath(shapeGroups, selectedItem);

        if (!selectedPathChain) {
            $.writeln("Selected path not found in shape groups.");
            alert("Selected path not found.");
            return;
        }

        $.writeln("Selected path found: " + selectedPathChain.join(" > "));

        // Navigate to the path property
        var pathProperty = layer.property("Contents");
        for (var i = 0; i < selectedPathChain.length; i++) {
            pathProperty = pathProperty.property(selectedPathChain[i]);
        }

        // Now you can use pathData for further operations

        // Construct the expression path dynamically using match names
        var expressionPath = "thisComp.layer('" + layer.name + "')";
        var propertyStack = [];
        var currentProperty = pathProperty;

        // Traverse up the property hierarchy and collect match names
        while (currentProperty && currentProperty.parentProperty) {
            var parentMatchName = currentProperty.parentProperty.matchName;
            propertyStack.push(".property('" + parentMatchName + "')");
            currentProperty = currentProperty.parentProperty;
        }

        // Reverse the order to construct the path from root to the target property
        propertyStack.reverse();
        expressionPath += propertyStack.join("");
        $.writeln("Constructed expression path: " + expressionPath);

        // Start undo group
        app.beginUndoGroup("Add Guides at Path Center");

        // Add a Point Control effect to the layer
        var pointControl = layer.property("Effects").addProperty("ADBE Point Control");

        // Apply an expression to calculate the path center in comp space
        var expression =
            "var pathProperty = " + expressionPath + ";\n" +
            "var points = pathProperty.points();\n" +
            "var center = [0, 0];\n" +
            "if (points.length > 0) {\n" +
            "    var sum = [0, 0];\n" +
            "    for (var i = 0; i < points.length; i++) {\n" +
            "        sum[0] += points[i][0];\n" +
            "        sum[1] += points[i][1];\n" +
            "    }\n" +
            "    center = [sum[0] / points.length, sum[1] / points.length];\n" +
            "    var shapeGroupPosition = pathProperty.propertyGroup(3).property('Transform').property('Position').value;\n" +
            "    var shapeGroupAnch(or = pathProperty.propertyGroup(3).property('Transform').property('Anchor Point').value;\n" +
            "    center[0] += (shapeGroupPosition[0] - shapeGroupAnchor[0]);\n" +
            "    center[1] += (shapeGroupPosition[1] - shapeGroupAnchor[1]);\n" +
            "}\n" +
            "thisComp.layer('" + layer.name + "').toComp(center);";

        pointControl.property("ADBE Point Control-0001").expression = expression;

        // Harvest the post-expression value
        var centerInCompSpace = pointControl.property("ADBE Point Control-0001").value;
        $.writeln("Center in comp space: " + centerInCompSpace[0] + ", " + centerInCompSpace[1]);

        // Remove the Point Control
        pointControl.remove();

        // Add horizontal and vertical guides at the center
        activeItem.addGuide(1, centerInCompSpace[0]); // Vertical guide
        activeItem.addGuide(0, centerInCompSpace[1]); // Horizontal guide

        // End undo group
        app.endUndoGroup();

        // Close the window
        win.close();
    };

    win.center();
    win.show();
})();

// Helper function to list properties of an object
function listProperties(obj) {
    var props = [];
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            props.push(p);
        }
    }
    return props.join(", ");
}
