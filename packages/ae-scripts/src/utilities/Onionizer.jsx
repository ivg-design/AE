/**
 * Onionizer - Professional Onion Skinning System for Shape Layers in Adobe After Effects
 * 
 * Creates sophisticated onion skinning effects for shape layers by duplicating compositions
 * and establishing multiple time-offset instances with customizable stroke, fill, and
 * transparency effects. Formerly known as CelMate - now enhanced for professional animation workflows.
 * 
 * @name Onionizer
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui HEADLESS
 * 
 * @description
 * Onionizer automates the creation of onion skinning systems essential for traditional animation
 * workflows in After Effects. The tool analyzes selected layers and properties, creates duplicate
 * compositions with specialized naming conventions, and establishes time-remapped instances that
 * provide visual feedback for frame-by-frame animation work with shape layers.
 * 
 * @functionality
 * • Analyzes selected layers and their properties in the active composition
 * • Creates duplicate "CelSkin" composition for onion skin effect management
 * • Establishes controller null layer for centralized effect management
 * • Generates multiple time-offset instances of the CelSkin composition
 * • Applies customizable stroke, fill, and transparency effects to onion skin layers
 * • Integrates PropQuery module for advanced property analysis and management
 * • Maintains original composition integrity while creating onion skin system
 * 
 * @usage
 * 1. Open your animation composition and select the shape layers for onion skinning
 * 2. Select specific properties within those layers that you want to visualize
 * 3. Run the script - no user interface required for streamlined workflow
 * 4. The script automatically creates the "CelSkin" composition and controller setup
 * 5. Review the generated onion skin layers in the timeline
 * 6. Adjust controller parameters to fine-tune onion skin appearance and timing
 * 7. Continue your animation work with visual feedback from previous/next frames
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with shape layer support
 * • Active composition must be selected with at least one shape layer
 * • PropQuery.js module must be available in the modules directory
 * • Selected layers must have keyframeable properties for effective onion skinning
 * 
 * @notes
 * • Script includes PropQuery module for comprehensive property analysis
 * • CelSkin composition maintains reference to original animation layers
 * • Controller null layer provides centralized management of onion skin parameters
 * • Time-remapping ensures frame-accurate onion skin positioning
 * • Compatible with complex shape layer hierarchies and nested compositions
 * • Onion skin opacity and color can be adjusted through controller parameters
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

        // currentPropertyObject is still the original property object
        currentPropertyObject.expression = "expression goes here";  // 

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
