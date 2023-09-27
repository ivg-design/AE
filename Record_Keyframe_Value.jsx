/**
 * This script records a keyframe at the current time with the current value of each selected property 
 * in the active composition in Adobe After Effects. If the property has an expression, it records the 
 * post-expression value; otherwise, it records the current value.
 * 
 * The script performs the following steps:
 * 1. Obtains the active composition from the current project.
 * 2. Checks if any layers are selected in the active composition and alerts the user if none are found.
 * 3. Begins an undo group to allow all changes to be undone in one step.
 * 4. Iterates over each selected layer and then each selected property within those layers.
 * 5. Records a keyframe at the current composition time with the current or post-expression value.
 * 6. Displays the index number and name of the current layer being processed using the writeLn method.
 * 7. If any error occurs during the process, an alert is shown with the property name and error message.
 * 8. Ends the undo group to group all the changes as a single undoable action.
 * 
 * Usage:
 * - Save this script as a `.jsx` file.
 * - Run it from the After Effects Scripts menu with the relevant properties selected in an active composition.
 * 
 * @function recordKeyframeWithCurrentValue
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

    app.beginUndoGroup("Record Keyframe with Current Value");

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        writeLn("Working on layer " + (i+1) + ": " + layer.name);
        
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
