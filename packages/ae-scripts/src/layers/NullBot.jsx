/**
 * @name NullBot
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-01-13
 * @license MIT
 * @ui HEADLESS
 * @description Creates a parented null object positioned at the average location of selected layers for centralized control
 * 
 * @functionality
 * - Calculates the average position of all selected layers
 * - Creates a null object at the calculated center point
 * - Automatically parents all selected layers to the new null
 * - Adjusts null timing to encompass all selected layers' duration
 * - Preserves 3D layer properties when any selected layer is 3D
 * - Positions null at the topmost layer index for easy access
 * 
 * @usage
 * 1. Select one or more layers in your composition
 * 2. Run the script via File > Scripts > NullBot.jsx
 * 3. A null object named "Null Control" will be created at the average position
 * 4. All selected layers will be automatically parented to this null
 * 
 * @requirements
 * - Active composition must be selected
 * - At least one layer must be selected
 * 
 * @notes
 * - The null's in/out points match the combined duration of selected layers
 * - If any selected layer is 3D, the null will also be 3D
 * - The null is placed at the top of the layer stack
 * - All operations are wrapped in an undo group named "NullBot"
 */

var undoStr = "Add Parented Null to Selected Layers";

var comp = app.project.activeItem;

if (!comp || !(comp instanceof CompItem)) {
    alert("Please select a composition!");
} else {
    var layers = comp.selectedLayers;

    if (layers.length < 1) {
        alert("Select at least one layer!");
    } else {
        app.beginUndoGroup("NullBot");

        var sum = [0, 0];
        var num = 0;
        var newInpoint = comp.duration,
            newOutpoint = 0,
            myIndex = comp.numLayers;
        var is3D = false;

        for (var ii = 0, il = layers.length; ii < il; ii++) {
            var layer = layers[ii];
            var pos = layer.position.value;
            sum[0] += pos[0];
            sum[1] += pos[1];
            num++;

            if (layer.threeDLayer) {
                is3D = true;
            }

            var inPoint = (layer.stretch < 0) ? layer.outPoint : layer.inPoint;
            var outPoint = (layer.stretch < 0) ? layer.inPoint : layer.outPoint;
            var index = layer.index;

            if (inPoint < newInpoint) {
                newInpoint = inPoint;
            }
            if (outPoint > newOutpoint) {
                newOutpoint = outPoint;
            }
            if (index < myIndex) {
                myIndex = index;
            }
        }

        var avg = [sum[0] / num, sum[1] / num];

        var avgNull = comp.layers.addNull(comp.duration);
        avgNull.name = "NullBot";
        avgNull.threeDLayer = is3D;
        avgNull.position.setValue(avg);

        for (var ii = 0, il = layers.length; ii < il; ii++) {
            var layer = layers[ii];
            layer.parent = avgNull;
        }

        avgNull.moveBefore(comp.layer(myIndex));
        avgNull.inPoint = newInpoint;
        avgNull.outPoint = newOutpoint;

        app.endUndoGroup();
    }
}
