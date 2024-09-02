(function () {
    // Check if a property is selected
    var activeItem = app.project.activeItem;
    if (!(activeItem instanceof CompItem)) {
        alert("Please select a path property in a composition.");
        return;
    }

    // Ensure a layer is selected
    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select a layer containing the path.");
        return;
    }

    var layer = selectedLayers[0]; // Assume the first selected layer is the correct one

    // Get the selected properties
    var selectedProperties = activeItem.selectedProperties;
    if (selectedProperties.length === 0) {
        alert("No property is selected.");
        return;
    }

    // Get the deepest selected property (assuming it is the path)
    var selectedProperty = selectedProperties[selectedProperties.length - 1];

    // Check if the selected property is a path
    if (selectedProperty.matchName !== "ADBE Vector Shape") {
        alert("Please select a path property within a shape group.");
        return;
    }

    // Construct the expression path dynamically using match names
    var expressionPath = "thisComp.layer('" + layer.name + "')";
    var propertyStack = [];
    var currentProperty = selectedProperty;

    // Traverse up the property hierarchy and collect match names
    while (currentProperty.parentProperty !== null) {
        var parentMatchName = currentProperty.parentProperty.matchName;
        propertyStack.push(".property('" + parentMatchName + "')");
        currentProperty = currentProperty.parentProperty;
    }

    // Reverse the order to construct the path from root to the target property
    propertyStack.reverse();
    expressionPath += propertyStack.join("");

    // Start undo group
    app.beginUndoGroup("Add Guides at Path Center");

    // Add a Point Control effect to the layer
    var pointControl = layer.property("Effects").addProperty("ADBE Point Control");

    // Apply an expression to calculate the path center in comp space
    var expression =
        "var pathProperty = " + expressionPath + ";\n" +
        "var points = pathProperty.points();\n" +
        "var sum = [0, 0];\n" +
        "for (var i = 0; i < points.length; i++) {\n" +
        "    sum[0] += points[i][0];\n" +
        "    sum[1] += points[i][1];\n" +
        "}\n" +
        "var center = [sum[0] / points.length, sum[1] / points.length];\n" +
        "var shapeGroupPosition = pathProperty.propertyGroup(3).property('Transform').property('Position').value;\n" +
        "var shapeGroupAnchor = pathProperty.propertyGroup(3).property('Transform').property('Anchor Point').value;\n" +
        "center[0] += (shapeGroupPosition[0] - shapeGroupAnchor[0]);\n" +
        "center[1] += (shapeGroupPosition[1] - shapeGroupAnchor[1]);\n" +
        "thisComp.layer('" + layer.name + "').toComp(center);";

    pointControl.property("ADBE Point Control-0001").expression = expression;

    // Harvest the post-expression value
    var centerInCompSpace = pointControl.property("ADBE Point Control-0001").value;

    // Remove the Point Control
    pointControl.remove();

    // Add horizontal and vertical guides at the center
    activeItem.addGuide(1, centerInCompSpace[0]); // Vertical guide
    activeItem.addGuide(0, centerInCompSpace[1]); // Horizontal guide

    // End undo group
    app.endUndoGroup();
})();
