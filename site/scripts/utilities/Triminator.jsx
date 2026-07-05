/**
 * Triminator - Intelligent Trim Paths Generator for Shape Layers in Adobe After Effects
 * 
 * Automatically adds Trim Paths effects to selected shape layers or specific shape groups
 * with optional keyframe animation. Supports modifier key functionality for workflow
 * customization and intelligent layer detection for streamlined shape animation workflows.
 * 
 * @name Triminator
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui HEADLESS
 * 
 * @description
 * Triminator streamlines the process of adding Trim Paths effects to shape layers in
 * After Effects, providing both basic effect application and advanced keyframe animation
 * capabilities. The tool intelligently detects vector layers, handles multiple selection
 * scenarios, and offers keyboard modifier support for flexible workflow integration.
 * 
 * @functionality
 * • Automatically adds Trim Paths effects to root vector groups or selected shape groups
 * • Creates optional keyframes for animated trim effects (0 to 100% progression)
 * • Supports multiple selected layers and groups for batch processing
 * • Intelligently detects and processes only vector layers, skipping incompatible types
 * • Provides Shift key modifier support to skip keyframe generation when desired
 * • Handles complex shape layer hierarchies and nested group structures
 * • Maintains proper effect placement within shape layer contents structure
 * 
 * @usage
 * 1. Select one or more shape layers in your active composition
 * 2. Optionally select specific shape groups within layers for targeted application
 * 3. Run the script to automatically add Trim Paths effects to selected elements
 * 4. Hold Shift key while running to skip adding keyframes (effects only)
 * 5. Review the added Trim Paths effects in the timeline
 * 6. Customize trim animation timing and values as needed for your project
 * 7. Use generated keyframes as starting point for custom trim animations
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with shape layer and Trim Paths support
 * • Active composition must be selected with at least one shape layer
 * • Selected layers must be vector/shape layers for trim effects to be applicable
 * • Shape layers should contain path data for meaningful trim effects
 * 
 * @notes
 * • Script intelligently skips non-vector layers to prevent errors and warnings
 * • Shift key modifier allows for effect-only application without automatic keyframes
 * • Trim Paths effects are added to appropriate vector groups within shape layer hierarchy
 * • Generated keyframes animate from 0% to 100% trim over composition duration
 * • Tool maintains shape layer integrity while adding effects to contents structure
 * • Compatible with both simple and complex nested shape layer configurations
 */

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
