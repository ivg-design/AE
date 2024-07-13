(function () {
    // Ensure something is selected
    if (app.project.activeItem == null || !(app.project.activeItem instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var comp = app.project.activeItem;
    var selectedLayers = comp.selectedLayers;

    if (selectedLayers.length === 0) {
        alert("Please select a layer.");
        return;
    }

    // Loop through selected layers
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var selectedProperties = layer.selectedProperties;

        // Loop through selected properties
        for (var j = 0; j < selectedProperties.length; j++) {
            var property = selectedProperties[j];

            // Check if the property is a path property
            if (property.propertyType === PropertyType.SHAPE) {
                var keyframeData = [];

                // Loop through selected keyframes
                for (var k = 1; k <= property.numKeys; k++) {
                    if (property.keySelected(k)) {
                        var keyTime = property.keyTime(k);
                        var shape = property.keyValue(k);
                        var vertices = shape.vertices;
                        var inTangents = shape.inTangents;
                        var outTangents = shape.outTangents;

                        // Collect data for this keyframe
                        keyframeData.push({
                            time: keyTime,
                            vertices: vertices,
                            inTangents: inTangents,
                            outTangents: outTangents
                        });
                    }
                }

                // Print the collected keyframe data
                for (var m = 0; m < keyframeData.length; m++) {
                    var key = keyframeData[m];
                    var output = "Keyframe at time " + key.time + ":\n";
                    output += "Vertices: " + JSON.stringify(key.vertices) + "\n";
                    output += "In Tangents: " + JSON.stringify(key.inTangents) + "\n";
                    output += "Out Tangents: " + JSON.stringify(key.outTangents) + "\n";
                    $.writeln(output);
                }
            }
        }
    }
})();
