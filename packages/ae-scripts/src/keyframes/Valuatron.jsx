/**
 * Valuatron - Instant Keyframe Creation at Current Time and Value
 *
 * @name Valuatron
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui HEADLESS
 * 
 * @description
 * A streamlined utility script that instantly creates keyframes for selected properties at the
 * current composition time using each property's current value. This tool is essential for
 * quickly establishing keyframe markers during animation workflows, particularly useful for
 * creating holds, establishing timing points, or capturing intermediate animation states.
 * 
 * @functionality
 * • Instant keyframe creation with zero user interaction required
 * • Multi-layer and multi-property support for batch keyframe creation
 * • Automatic property validation to ensure compatibility with keyframe animation
 * • Current time detection from active composition timeline position
 * • Current value sampling from property evaluation at timeline position
 * • Comprehensive error handling with detailed user feedback
 * • Safe execution with validation checks for composition and layer selection
 * • Full undo group support for easy operation reversal
 * • Efficient processing optimized for large property selections
 * 
 * @usage
 * 1. Open a composition and position the timeline playhead at desired time
 * 2. Select one or more layers in the composition timeline
 * 3. In the Timeline panel, select specific properties you want to keyframe
 * 4. Run the Valuatron script (no dialog will appear - it executes immediately)
 * 5. The script will create keyframes for all selected properties at current time
 * 6. Each keyframe will capture the property's current evaluated value
 * 7. Use Undo (Ctrl+Z / Cmd+Z) if you need to reverse the operation
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with playhead positioned at desired keyframe time
 * • At least one selected layer in the composition
 * • Selected properties that support keyframe animation (canVaryOverTime = true)
 * 
 * @notes
 * • This is a headless script - it executes immediately without showing a dialog
 * • Only works with properties that can be keyframed (canVaryOverTime property)
 * • The script captures the exact evaluated value at the current time, including expressions
 * • Particularly useful for creating hold keyframes or establishing timing markers
 * • Works efficiently with large selections of layers and properties
 * • All operations are wrapped in a single undo group for clean workflow integration
 * • If properties have expressions, it keyframes the expression result, not the underlying value
 */
(function recordKeyframeWithCurrentValue() {
    var comp = app.project.activeItem;

    if (!comp || !(comp instanceof CompItem)) {
        alert("No composition is active. Please select a composition and try again.");
        return;
    }

    var selectedLayers = comp.selectedLayers;

    if (selectedLayers.length === 0) {
        alert("No layers are selected. Please select layers and try again.");
        return;
    }

    app.beginUndoGroup("Valuatron");

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        writeLn("Working on layer " + (i + 1) + ": " + layer.name);

        var selectedProperties = layer.selectedProperties;

        for (var j = 0; j < selectedProperties.length; j++) {
            var prop = selectedProperties[j];

            if (prop.canVaryOverTime) {
                try {
                    var prop_value = prop.value;
                    var currentTime = comp.time;
                    prop.setValueAtTime(currentTime, prop_value);
                } catch (e) {
                    alert("Error on property " + prop.name + ": " + e.toString());
                }
            }
        }
    }

    app.endUndoGroup();
})();
