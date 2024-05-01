var undoStr = "Add Parented Null to Selected Layers";

var comp = app.project.activeItem;

if (!comp || !(comp instanceof CompItem)) {
    alert("Please select a composition!");
} else {
    var layers = comp.selectedLayers;

    if (layers.length < 1) {
        alert("Select at least one layer!");
    } else {
        app.beginUndoGroup(undoStr);

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
        avgNull.name = "Parent Null";
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
