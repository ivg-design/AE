function extractShapeLayerInfo(shapeLayer) {
    var result = {
        expressionPaths: [],
        propertyChains: []
    };

    function extractGroups(group, parentName, parentChain) {
        parentChain = parentChain || [];
        for (var i = 1; i <= group.numProperties; i++) {
            var property = group.property(i);
            var groupName = property.name;
            var currentChain = parentChain.concat([groupName]);

            if (property.matchName === "ADBE Vector Group") {
                extractGroups(property.property("Contents"), groupName, currentChain);
            } else if (property.matchName === "ADBE Vector Shape - Group") {
                var expressionPath = "('" + currentChain.join("')('") + "')('Path 1')";
                result.expressionPaths.push(expressionPath);
                result.propertyChains.push({
                    name: groupName,
                    type: "shape",
                    propertyChain: currentChain,
                    path: property.property("Path 1")
                });
            }
        }
    }

    extractGroups(shapeLayer.property("Contents"));
    return result;
}

function testExtractShapeLayerInfo() {
    // Make sure a composition is active
    if (!app.project || !app.project.activeItem || app.project.activeItem.typeName !== "Composition") {
        alert("Please select a composition.");
        return;
    }

    // Make sure a shape layer is selected
    var comp = app.project.activeItem;
    if (comp.selectedLayers.length === 0) {
        alert("Please select a shape layer.");
        return;
    }

    var shapeLayer = comp.selectedLayers[0];
    if (shapeLayer.matchName !== "ADBE Vector Layer") {
        alert("Please select a shape layer.");
        return;
    }

    // Extract shape layer info
    var shapeInfo = extractShapeLayerInfo(shapeLayer);

    // Convert to strings for the alert
    var expressionPathsStr = shapeInfo.expressionPaths.join("\n");
    var propertyChainsStr = JSON.stringify(shapeInfo.propertyChains, null, 2);

    // Show alert
    alert("Expression Paths:\n" + expressionPathsStr + "\n\nProperty Chains:\n" + propertyChainsStr);
}

// Run the tester function
testExtractShapeLayerInfo();
