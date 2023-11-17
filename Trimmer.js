(function addTrimPaths() {
    var addKeys = !ScriptUI.environment.keyboardState.shiftKey;
    var comp = app.project.activeItem;

    if (!(comp && comp instanceof CompItem)) {
        alert("Please select a composition!");
        return;
    }

    var layers = comp.selectedLayers;
    if (layers.length === 0) {
        alert("Please select some layers!");
        return;
    }

    app.beginUndoGroup("Add Trim Paths");

    var ii, il, layer, selectedGroups, i, prop, groupContents, trimProp, trimStart, trimEnd, trimTimes, trimValues;
    for (ii = 0, il = layers.length; ii < il; ii++) {
        layer = layers[ii];
        if (layer.matchName !== "ADBE Vector Layer") {
            continue;
        }

        selectedGroups = [];
        for (i = 1; i <= layer.selectedProperties.length; i++) {
            prop = layer.selectedProperties[i - 1];
            if (prop.propertyType === PropertyType.NAMED_GROUP) {
                selectedGroups.push(prop);
            }
        }

        if (selectedGroups.length === 0) {
            // Add Trim Paths to the Root Vectors Group of the layer
            groupContents = layer.property("ADBE Root Vectors Group");
            addTrimPathsWithKeys(groupContents);
        } else {
            // Add Trim Paths to each selected group
            for (i = 0; i < selectedGroups.length; i++) {
                groupContents = selectedGroups[i].property("ADBE Vectors Group");
                if (!groupContents) continue;

                addTrimPathsWithKeys(groupContents);
            }
        }
    }

    app.endUndoGroup();

    function addTrimPathsWithKeys(contents) {
        var trimProp = contents.addProperty("ADBE Vector Filter - Trim");
        if (!trimProp) return;

        if (addKeys) {
            var trimStart = trimProp.property("ADBE Vector Trim Start");
            var trimEnd = trimProp.property("ADBE Vector Trim End");

            trimTimes = [layer.inPoint, layer.inPoint + 1];
            trimValues = [0, 100];

            trimStart.setValuesAtTimes(trimTimes, trimValues);
            trimEnd.setValuesAtTimes(trimTimes, trimValues);
        }
    }
})();
