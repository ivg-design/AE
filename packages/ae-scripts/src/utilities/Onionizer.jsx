/**
 * Onionizer - Experimental Onion Skinning Setup for Shape Layers in Adobe After Effects
 * 
 * Creates a prototype onion-skin setup by duplicating the active composition, adding a
 * controller null, and placing seven time-remapped CelSkin instances in the original comp.
 * Formerly known as CelMate.
 * 
 * @name Onionizer
 * @author IVG Design
 * @version 2.0.1
 * @date 2026-06-02
 * @license MIT
 * @ui HEADLESS
 * 
 * @description
 * Onionizer analyzes selected layers/properties, duplicates the active composition as "CelSkin",
 * adds an "Onionizer" controller null to the original comp, and adds seven time-remapped CelSkin
 * layers with Stroke and Fill effects. This script is currently an unfinished prototype: controller
 * parameters, time offsets, and selected-property expression linking are not fully implemented.
 * 
 * @functionality
 * • Analyzes selected layers and their properties in the active composition
 * • Creates duplicate "CelSkin" composition for onion skin effect management
 * • Establishes controller null layer for future centralized effect management
 * • Generates seven time-remapped instances of the CelSkin composition
 * • Applies Stroke and Fill effects to onion skin layers
 * • Integrates PropQuery module for advanced property analysis and management
 * • Avoids writing placeholder expressions to original selected properties
 * 
 * @usage
 * 1. Open your animation composition and select the shape layers for onion skinning
 * 2. Select specific properties within those layers that you want to visualize
 * 3. Run the script - no user interface required for streamlined workflow
 * 4. The script automatically creates the "CelSkin" composition, controller null, and CelSkin layers
 * 5. Manually configure timing, color, opacity, and other controls as needed
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with shape layer support
 * • Active composition must be selected with at least one shape layer
 * • PropQuery.js module must be available through the script include path
 * • Selected layers must have keyframeable properties for effective onion skinning
 * 
 * @notes
 * • Script includes PropQuery module for comprehensive property analysis
 * • CelSkin composition is a duplicate, not a live expression-linked proxy
 * • Controller null is created but no controller parameters are added yet
 * • Time remapping is enabled but offsets are not assigned yet
 * • Compatible with complex shape layer hierarchies and nested compositions
 * • Earlier 2.0.0 builds wrote the placeholder expression "expression goes here" to selected properties
 *
 * @changelog
 * - 2.0.1 (2026-06-02): Removed destructive placeholder expression assignment and corrected documentation to prototype status.
 * - 2.0.0 (2025-08-13): Renamed to Onionizer during repository standardization.
 */

//@include 'modules/PropQuery.js'

// Start an undo group
app.beginUndoGroup("Onionizer: The Onionizer for Shape Layers");

(function () {
    /* 
        1.Check for active composition selected layers, and selected properties
    */

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

    /*
    2. loop through each selected layer and selected property(s) and create an object that has the following properties:
        i.layer index
        ii.selected property(s) path
    */

    //initialize array to store selected info
    var selectedInfoArray = [];

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var selectedProperties = layer.selectedProperties;

        // Loop through each selected property
        for (var j = 0; j < selectedProperties.length; j++) {
            var prop = selectedProperties[j];
            if (!(prop instanceof PropertyGroup)) {

                // Use PropQuery.main to get the property object containing the path
                var propPath = PropQuery.main(prop, "propPath", ["useMatchNames"]);  // Adjust the flags as needed
                var propObject = PropQuery.main(prop, "propObject");
                // Create and store the object
                var selectedInfo = {
                    layerIndex: layer.index,
                    propertyPath: propPath,
                    propertyObject: propObject
                };
                selectedInfoArray.push(selectedInfo);
            }
        }
    }

    /*
    3. duplicate active composition and rename it to CelSkin  
     */

    var celSkinComp = comp.duplicate();
    celSkinComp.name = "CelSkin";

    /*
    4. using the object created in step 2, loop through each selected layer and selected property(s) and set the expression to the corresponding property in the CelSkin composition
    
    */
    // Loop through each object in selectedInfoArray
    for (var k = 0; k < selectedInfoArray.length; k++) {
        var info = selectedInfoArray[k];

        // Get the corresponding layer in the CelSkin composition
        var celSkinLayer = celSkinComp.layer(info.layerIndex);

        // Use the property path to find the corresponding property in the CelSkin composition
        var pathComponents = info.propertyPath.split(".");

        // Directly use celSkinLayer since it's already initialized
        var propertyObject = celSkinLayer;

        // // Start looping through the property path, starting from index 1
        // for (var l = 1; l < pathComponents.length; l++) {
        //     var propertyName = pathComponents[l];

        //     // If the property name is in 'property("...")' format, extract the actual name
        //     var match = propertyName.match(/property\("(.+)"\)/);
        //     if (match) {
        //         propertyName = match[1];
        //     }

        //     if (propertyObject && propertyObject.property) {
        //         var nextPropertyObject = propertyObject.property(propertyName);
        //         if (nextPropertyObject) {
        //             propertyObject = nextPropertyObject;
        //         } else {
        //             throw new Error("Property not found: " + propertyName);
        //         }
        //     } else {
        //         throw new Error("Invalid path component: " + propertyName);
        //     }
        //     propertyObject.expression = "expressoin goes here";
        // }
        // Iterate through each element in selectedInfoArray
        var currentPropertyObject = info.propertyObject;

        // Use a temporary variable to navigate so you don't lose your original reference
        var tempPropertyObject = currentPropertyObject;  // <-- Added this line

        // Navigate up the parentProperty chain until you reach the ultimate parent
        while (tempPropertyObject && tempPropertyObject.parentProperty) {
            if (tempPropertyObject.parentProperty instanceof ShapeLayer) {
                // Found the ultimate parent layer, now change the containing comp's name
                tempPropertyObject.parentProperty.containingComp.name = "CelSkin";
                break;
            }
            tempPropertyObject = tempPropertyObject.parentProperty;  //
        }

        // Now, propertyObject should be the Property or PropertyGroup object you're looking for
    }



    /*
    5. add a null called CelMate Controller to the oringial comp
    (5.1 - add the pseudo effect to the null)
    */
    // Create controller null layer "Onionizer" in original comp
    var controller = comp.layers.addNull();
    controller.name = "Onionizer";
    /*
    6. add celskin comp to the original comp 7 times and to each instance add the following:
        i. time remapping
        ii. stroke effect
        iii. fill effect
        (iv. connect relevant properties (TBD) to the controller null)
    */

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
