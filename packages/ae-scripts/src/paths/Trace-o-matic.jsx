/**
 * @name Trace-o-matic
 * @author IVG Design (based on rd_AutoMaskToShapes)
 * @version 2.0.0
 * @date 2025-01-13
 * @license MIT
 * @ui HEADLESS
 * @description Converts mask paths with keyframes to shape layers with hold interpolation and cleanup
 * 
 * @functionality
 * - Converts all masks from selected layer to shape layer paths
 * - Preserves mask path keyframes and opacity animations
 * - Applies hold interpolation for frame-by-frame animation
 * - Adds centralized fill and stroke controls via effect sliders
 * - Links shape properties to master controls via expressions
 * - Cleans up redundant keyframes automatically
 * - Removes path keyframes where opacity is zero
 * - Removes consecutive opacity keyframes with same value
 * - Maintains mask naming in shape groups
 * 
 * @usage
 * 1. Select a layer with animated masks in your composition
 * 2. Run the script via File > Scripts > MaskShapeMorph.jsx
 * 3. Script creates new shape layer "Shapes from [layer name]"
 * 4. Adjust master controls in Effects panel:
 *    - Fill Color & Opacity
 *    - Stroke Color, Opacity & Width
 * 5. All mask animations are preserved as hold keyframes
 * 
 * @requirements
 * - Adobe After Effects CS6 or later
 * - Active composition with selected layer
 * - Selected layer must have at least one mask
 * - Masks can have path and/or opacity keyframes
 * 
 * @notes
 * - Hold interpolation creates frame-by-frame animation style
 * - Keyframe cleanup reduces file size and improves performance
 * - Zero-opacity path keyframes are removed as invisible
 * - Master controls allow global appearance changes
 * - Original masks remain on source layer (non-destructive)
 * - All operations wrapped in undo group "Trace-o-matic"
 */

(function rd_MasksToShapes(thisObj) {

    /**
     * Removes unnecessary keyframes from shape layers. It cleans up any consecutive opacity keyframes with the same value
     * to reduce redundancy. Additionally, it removes any path keyframes where the shape's opacity is zero since they
     * are not visible and therefore not needed.
     *
     * @function cleanUpKeyframes
     * @description Cleans up redundant opacity keyframes and removes path keyframes where opacity is zero.
     * @param {PropertyGroup} shapeLayerContents - The 'Contents' property group of a shape layer which contains the shape groups to be cleaned.
     * @returns {void}
     *
     * @example
     * // Assuming 'shapeLayerContents' is the 'Contents' property group of a shape layer:
     * cleanUpKeyframes(shapeLayerContents);
     * // This will remove unnecessary keyframes from the shape layer's properties.
     */

    function cleanUpKeyframes(shapeLayerContents) {
        for (var m = 1; m <= shapeLayerContents.numProperties; m++) {
            var shapeGroup = shapeLayerContents.property(m);
            var shapeOpacity = shapeGroup.property("Transform").property("Opacity");
            var pathGroup = shapeGroup.property("Contents").property("Path");
            var shapePath = pathGroup.property("ADBE Vector Shape");

            // Cleanup opacity keyframes
            for (var k = shapeOpacity.numKeys; k >= 2; k--) {
                var thisKeyTime = shapeOpacity.keyTime(k);
                var prevKeyTime = shapeOpacity.keyTime(k - 1);
                var thisKeyValue = shapeOpacity.valueAtTime(thisKeyTime, true);
                var prevKeyValue = shapeOpacity.valueAtTime(prevKeyTime, true);

                if (thisKeyValue === prevKeyValue) {
                    shapeOpacity.removeKey(k);
                }
            }

            // Cleanup path keyframes where opacity is zero
            for (var k = shapePath.numKeys; k >= 1; k--) {
                var keyTime = shapePath.keyTime(k);
                var opacityValue = shapeOpacity.valueAtTime(keyTime, true);

                if (opacityValue === 0) {
                    shapePath.removeKey(k);
                }
            }
        }
    }

    /**
     * Converts mask paths and their opacity keyframes from a selected layer into corresponding shape layers with hold keyframes.
     * Effect controls for fill and stroke are added to the shape layer, and expressions are used to link the shape properties to these controls.
     * After copying the mask keyframes to the shape layer, unnecessary keyframes are cleaned up.
     * 
     * @function rd_MasksToShapes_doIt
     * @description Converts all mask paths and opacities from the selected layer to a shape layer with matching properties.
     * @param {Object} app.project.activeItem - The currently active composition in After Effects.
     * @throws Will throw an error if no composition is selected or if the selected layer does not contain any masks.
     * @returns {void}
     * 
     * @example
     * // To use this function, select a layer with masks in your After Effects composition and then run:
     * rd_MasksToShapes_doIt();
     * 
     * // This will create a new shape layer with paths and opacities corresponding to the masks of the selected layer.
     */

    function rd_MasksToShapes_doIt() {
        var comp = app.project.activeItem;
        var masksLayer = comp.selectedLayers[0];
        var masksGroup = masksLayer.property("ADBE Mask Parade");

        app.beginUndoGroup("Trace-o-matic");

        // Create the new shape layer
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = "Shapes from " + masksLayer.name;

        // Add effect controls and set default values
        var effectsGroup = shapeLayer.property("ADBE Effect Parade");
        var fillOpacityControl = effectsGroup.addProperty("ADBE Slider Control");
        fillOpacityControl.name = "Fill Opacity";
        fillOpacityControl.property("Slider").setValue(100);

        var fillColorControl = effectsGroup.addProperty("ADBE Color Control");
        fillColorControl.name = "Fill Color";
        fillColorControl.property("Color").setValue([1, 0, 0, 1]); // RGBA

        var strokeOpacityControl = effectsGroup.addProperty("ADBE Slider Control");
        strokeOpacityControl.name = "Stroke Opacity";
        strokeOpacityControl.property("Slider").setValue(100);

        var strokeColorControl = effectsGroup.addProperty("ADBE Color Control");
        strokeColorControl.name = "Stroke Color";
        strokeColorControl.property("Color").setValue([0, 0, 1, 1]); // RGBA

        var strokeWidthControl = effectsGroup.addProperty("ADBE Slider Control");
        strokeWidthControl.name = "Stroke Width";
        strokeWidthControl.property("Slider").setValue(5);

        // Iterate over the masks to create corresponding shape groups
        for (var m = 1; m <= masksGroup.numProperties; m++) {
            var maskName = masksGroup.property(m).name;
            var maskPathProperty = masksGroup.property(m).property("ADBE Mask Shape");
            var maskOpacityProperty = masksGroup.property(m).property("ADBE Mask Opacity");

            // Add the shape group
            var shapeGroup = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            shapeGroup.name = maskName;

            // Add path
            var pathGroup = shapeGroup.property("Contents").addProperty("ADBE Vector Shape - Group");
            var shapePath = pathGroup.property("ADBE Vector Shape");

            // Add fill and stroke
            var fill = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill");
            fill.property("Color").expression = 'thisComp.layer("' + shapeLayer.name + '").effect("Fill Color")("Color")';
            fill.property("Opacity").expression = 'thisComp.layer("' + shapeLayer.name + '").effect("Fill Opacity")("Slider")';
            
            var stroke = shapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").expression = 'thisComp.layer("' + shapeLayer.name + '").effect("Stroke Color")("Color")';
            stroke.property("Opacity").expression = 'thisComp.layer("' + shapeLayer.name + '").effect("Stroke Opacity")("Slider")';
            stroke.property("Stroke Width").expression = 'thisComp.layer("' + shapeLayer.name + '").effect("Stroke Width")("Slider")';

            // Copy mask path keyframes to shape path and convert them to hold keyframes
            for (var k = 1; k <= maskPathProperty.numKeys; k++) {
                var keyTime = maskPathProperty.keyTime(k);
                var keyValue = maskPathProperty.valueAtTime(keyTime, true);
                // Use index to reference property because direct references become invalid
                shapeLayer.property("ADBE Root Vectors Group").property(m).property("Contents").property("ADBE Vector Shape - Group").property("ADBE Vector Shape").setValueAtTime(keyTime, keyValue);
                shapeLayer.property("ADBE Root Vectors Group").property(m).property("Contents").property("ADBE Vector Shape - Group").property("ADBE Vector Shape").setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
            }

            // Copy mask opacity keyframes to shape opacity and convert them to hold keyframes
            for (var k = 1; k <= maskOpacityProperty.numKeys; k++) {
                var keyTime = maskOpacityProperty.keyTime(k);
                var keyValue = maskOpacityProperty.valueAtTime(keyTime, true);
                // Use index to reference property because direct references become invalid
                shapeLayer.property("ADBE Root Vectors Group").property(m).property("Transform").property("Opacity").setValueAtTime(keyTime, keyValue);
                shapeLayer.property("ADBE Root Vectors Group").property(m).property("Transform").property("Opacity").setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
            }
        }

        // Once all keyframes are copied over, call the cleanUpKeyframes function to remove unnecessary keyframes
        cleanUpKeyframes(shapeLayer.property("ADBE Root Vectors Group"));

        app.endUndoGroup();
    }

    // Validation and Execution
    if (app.project === null) {
        alert("No project open");
        return;
    }

    var comp = app.project.activeItem;
    if (comp === null || !(comp instanceof CompItem)) {
        alert("No comp selected");
        return;
    }

    if (comp.selectedLayers.length !== 1) {
        alert("Please select one layer");
        return;
    }

    var masksGroup = comp.selectedLayers[0].property("ADBE Mask Parade");
    if (masksGroup === null || masksGroup.numProperties < 1) {
        alert("No masks in selected layer");
        return;
    }

    rd_MasksToShapes_doIt();
})(this);
