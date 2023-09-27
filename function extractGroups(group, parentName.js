function extractGroups(group, parentName, parentPath, parentShapeName, layerName) {
    var groups = [];
    for (var i = 1; i <= group.numProperties; i++) {
        var property = group.property(i);
        var currentPath = parentPath ? parentPath + '.property("' + property.matchName + '")' : 'layer("' + layerName + '").property("' + property.matchName + '")';

        if (property.matchName === "ADBE Vector Group") {
            var childGroups = extractGroups(property.property("ADBE Vectors Group"), property.name, currentPath, parentShapeName, layerName);
            groups.push({
                type: 'group',
                name: property.name,
                fullPath: currentPath,
                groups: childGroups
            });
        } else if (property.matchName === "ADBE Vector Shape - Group") {
            var newShapeName = property.name;
            groups.push({
                type: "shape",
                name: property.name,
                fullPath: currentPath, // Adjust the fullPath here
                shapeName: newShapeName, // Use the new shape name for this path
                parentName: parentName
            });
            parentShapeName = newShapeName; // Update the parent shape name for the next iteration
        }
    }
    return groups;
}

function createTreeView(groups, parentNode, treeView) {
    if (!Array.isArray(groups)) {
        alert("createTreeView received non-array groups: " + groups);
        return;
    }
        groups.forEach(function (group) {
            if (group.type === 'group') {
                var node = parentNode ? parentNode.add('node', group.name) : treeView.add('node', group.name);
                node.group = group; // Store the full group object, which includes fullPath
                createTreeView(group.groups, node, treeView);
                node.expanded = false;
            } else if (group.type === 'shape') {
                var item = parentNode ? parentNode.add('item', group.name) : treeView.add('item', group.name);
                item.group = group; // Store the full group object, which includes fullPath
            }
        });
    }


function createControls(comp, shapeLayer, groupInfo, options) {
    app.beginUndoGroup("Create Controls");

    var shapeName = groupInfo.parentName; // Extract the shape name from the groupInfo
    
    var nullLayer, inTanLayer, outTanLayer;

    if (options.vertex) {
        // Add vertex null to the composition
        nullLayer = comp.layers.addNull();
        nullLayer.name = shapeName + "_Vertex_1";

        // Add slider control to the shape layer for the vertex
        var vertexSlider = shapeLayer.Effects.addProperty("ADBE Slider Control");
        vertexSlider.name = shapeName + "_Vertex_1";
    }

    if (options.inTangent) {
        // Add in-tangent null to the composition
        inTanLayer = comp.layers.addNull();
        inTanLayer.name = shapeName + "_InTangent_1";
    }

    if (options.outTangent) {
        // Add out-tangent null to the composition
        outTanLayer = comp.layers.addNull();
        outTanLayer.name = shapeName + "_OutTangent_1";
    }

    app.endUndoGroup();
}


function createExpression(shapeName, options) {
    var expressionParts = [
        'var shapeGroup = thisLayer.content("' + shapeName + '");',
        'var pathProperty = shapeGroup.content("Path 1").path;'
    ];

    if (options.vertex) {
        expressionParts.push('var vertexNull = thisComp.layer("' + shapeName + '_vertex");');
        expressionParts.push('var vertexControl = vertexNull.effect("Vertex Control")("Slider");');
    }

    if (options.inTangent) {
        expressionParts.push('var inTangentNull = thisComp.layer("' + shapeName + '_inTangent");');
        expressionParts.push('var inTangentControl = inTangentNull.effect("InTangent Control")("Slider");');
    }

    if (options.outTangent) {
        expressionParts.push('var outTangentNull = thisComp.layer("' + shapeName + '_outTangent");');
        expressionParts.push('var outTangentControl = outTangentNull.effect("OutTangent Control")("Slider");');
    }

    expressionParts.push('var groupPosition = shapeGroup.transform.position.value;');
    expressionParts.push('var groupAnchor = shapeGroup.transform.anchorPoint.value;');
    expressionParts.push('var pathPoints = pathProperty.points();');
    expressionParts.push('var inTangents = pathProperty.inTangents();');
    expressionParts.push('var outTangents = pathProperty.outTangents();');
    expressionParts.push('if (vertexControl) {');
    expressionParts.push('    var vertexPosition = fromComp(vertexNull.toComp([0,0]));');
    expressionParts.push('    pathPoints[vertexControl - 1] = [vertexPosition[0] - groupPosition[0] + groupAnchor[0], vertexPosition[1] - groupPosition[1] + groupAnchor[1]];');
    expressionParts.push('}');
    expressionParts.push('if (inTangentControl) {');
    expressionParts.push('    var inTangentPosition = fromComp(inTangentNull.toComp([0,0]));');
    expressionParts.push('    inTangents[inTangentControl - 1] = [inTangentPosition[0] - vertexPosition[0], inTangentPosition[1] - vertexPosition[1]];');
    expressionParts.push('}');
    expressionParts.push('createPath(pathPoints, inTangents, outTangents, false);');

    return expressionParts.join("\n");
}

function showUI(shapeGroups) {
    var win = new Window("dialog", "Shape Layer Controls");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];

    var treeView = win.add("treeview", undefined, undefined);
    treeView.preferredSize = [300, 200];

    createTreeView(shapeGroups, null, treeView);

    var optionsGroup = win.add("group");
    optionsGroup.orientation = "row";
    optionsGroup.alignChildren = ["left", "center"];

    optionsGroup.add("checkbox", undefined, "Vertex").value = true;
    optionsGroup.add("checkbox", undefined, "InTangent");
    optionsGroup.add("checkbox", undefined, "OutTangent");

    var buttonsGroup = win.add("group");
    buttonsGroup.orientation = "row";

    buttonsGroup.add("button", undefined, "Create").onClick = function () {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
        } else {
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length !== 1 || selectedLayers[0].property("ADBE Root Vectors Group") === undefined) {
                alert("Please select only one (1) shape layer.");
            } else {
                var shapeLayer = selectedLayers[0];
                var selectedItem = treeView.selection;
                if (selectedItem) {
                    var shapeName = selectedItem.text;
                    var fullPath = selectedItem.group.fullPath;  // Access the fullPath stored earlier

                    var options = {
                        vertex: optionsGroup.children[0].value,
                        inTangent: optionsGroup.children[1].value,
                        outTangent: optionsGroup.children[2].value
                    };

                    // Create controls
                    createControls(comp, shapeLayer, selectedItem.group, options);

                    // Generate the new expression
                    var newExpression = createExpression(shapeName, options);

                    // Navigate through the properties without using eval
                    var pathProperties = fullPath.split('.');
                    var pathProperty = shapeLayer;
                    for (var i = 0; i < pathProperties.length; i++) {
                        var prop = pathProperties[i];
                        // Parse the property name from the string
                        var propName = prop.match(/\"(.*?)\"/)[1];
                        pathProperty = pathProperty.property(propName);
                    }

                    // Now pathProperty should be the actual property object, and you can set its expression
                    if (pathProperty && pathProperty.canSetExpression) {
                        pathProperty.expression = newExpression;
                    } else {
                        alert("Unable to set expression on the selected property.");
                    }
                }
            }
        }
    };




    buttonsGroup.add("button", undefined, "Cancel").onClick = function() {
        win.close();
    };

    win.show();
}

// Initialize variable to keep track if everything is okay
var allConditionsMet = true;

// Get the active composition
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    alert("Please select a composition");
    allConditionsMet = false;
}

// Check if exactly one shape layer is selected
if (allConditionsMet) {
    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length !== 1 || selectedLayers[0].matchName !== "ADBE Vector Layer") {
        alert("Please select only one (1) shape layer");
        allConditionsMet = false;
    }
}

// Parse the selected shape layer to extract shape groups and path names
if (allConditionsMet) {
    var shapeLayer = selectedLayers[0];
    var shapeGroups = extractGroups(shapeLayer.property("ADBE Root Vectors Group"), null, 'property("ADBE Root Vectors Group")', shapeLayer.name);
    if (shapeGroups) {
        // Show the UI dialog with the extracted shape groups and paths
        showUI(shapeGroups);
    } else {
        alert("Failed to extract shape groups.");
    }
} else {
    alert("All conditions are not met.");
}