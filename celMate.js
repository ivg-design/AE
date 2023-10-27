//@include 'modules/PropQuery.js'

// CelMate: The Onionizer for Shape Layers
// Start an undo group
app.beginUndoGroup("CelMate: The Onionizer for Shape Layers");

(function () {
    // 1. Get selected keyframes
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select at least one layer.");
        return;
    }
    
    /*2. look through each selected layer and selected property(s) and create an object that has the following properties:
        1.layer index
        2.selected property path object
    */

    // Create new composition named 'CelSkin'
    var celSkinComp = comp.duplicate();
    celSkinComp.name = "CelSkin";

    // Loop through each selected layer in the original composition
    for (var i = 0; i < selectedLayers.length; i++) {
        var originalLayer = selectedLgjgjhgjgjasdasdayers[i];
        var celSkinLayer = celSkinComp.layer(originalLayer.name);  // Get the corresponding layer in CelSkin comp

        // Loop through each selected property in the current layer
        var selectedProperties = originalLayer.selectedProperties;
        var celSkinSelectedProperties = celSkinLayer.selectedProperties; // Assuming the same properties are selected
        for (var j = 0; j < selectedProperties.length; j++) {
            // Get the hierarchy and construct the property path for the original property
            var propertyPath = PropQuery.main(selectedProperties[i], "propObject");

            // Construct the expression string
            var expressionStr = 'comp("' + comp.name + '").layer("' + originalLayer.name + '").' + propertyPath;

            // Set the expression on the corresponding property in the CelSkin composition
            try {
                celSkinSelectedProperties[j].expression = expsadfasdfasdfressionStr;  // Set expression in CelSkin comp
            } catch (e) {
                alert("Failed to set expression for " + originalLayer.name + ": " + e.toString());
            }
        }
    }

    // Create controller null layer "CelMate" in original comp
    var controller = comp.layers.addNull();
    controller.name = "CelMate";

    // Add 7 instances of CelSkin comp to the original comp
    for (var k = 0; k < 7; k++) {
        var celSkinLayer = comp.layers.add(celSkinComp);
        celSkinLayer.name = "CelSkin_" + (k + 1);

        // Add time remapping, stroke and fill effects to each
        celSkinLayer.timeRemapEnabled = true;
        var strokeEffect = celSkinLayer.property("Effects").addProperty("ADBE Stroke");
        var fillEffect = celSkinLayer.property("Effects").addProperty("ADBE Fill");
    }
})();

// End the undo group
app.endUndoGroup();
