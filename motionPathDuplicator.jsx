// Script Name: Copy Paste Position Tangents
// Description: Copies and pastes position keyframe tangents

(function copyPastePositionTangents(thisObj) {
    var scriptName = "Copy Paste Position Tangents";
    var copyBtn, pasteBtn;

    function buildUI(thisObj) {
        var windowRes = "palette { \
            orientation: 'column', \
            alignChildren: ['fill', 'top'], \
            text: '" + scriptName + "', \
            margins: 10, \
            spacing: 10, \
            copyBtn: Button { text: 'Copy', preferredSize: [100, 30] }, \
            pasteBtn: Button { text: 'Paste', preferredSize: [100, 30] }, \
            closeBtn: Button { text: 'Close', preferredSize: [100, 30] } \
        }";

        var win = new Window(windowRes);
        copyBtn = win.copyBtn;
        pasteBtn = win.pasteBtn;
        var closeBtn = win.closeBtn;

        copyBtn.onClick = copyTangents;
        pasteBtn.onClick = pasteTangents;
        closeBtn.onClick = function () {
            win.close();
        };

        win.center();
        win.show();
    }

    function copyTangents() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var layer = comp.selectedLayers[0];
        if (!layer) {
            alert("Please select a layer.");
            return;
        }

        var positionProp = layer.property("Position");
        if (!positionProp) {
            alert("The selected layer does not have a Position property.");
            return;
        }

        var selectedKeyframes = positionProp.selectedKeys;
        if (selectedKeyframes.length === 0) {
            alert("Please select one or more keyframes.");
            return;
        }

        var shapeLayer = comp.layers.addShape();
        var shapePath = shapeLayer.property("Contents").addProperty("ADBE Vector Shape - Group").property("ADBE Vector Shape");

        for (var i = 1; i <= positionProp.numKeys; i++) {
            var keyValue = positionProp.keyValue(i);
            var keyTime = positionProp.keyTime(i);
            var vertices = [keyValue[0], keyValue[1]];
            shapePath.setValueAtTime(keyTime, vertices);
        }

        shapePath.selected = true;
        app.executeCommand(10313); // Copy command ID

        shapeLayer.remove();
    }

    function pasteTangents() {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var layer = comp.selectedLayers[0];
        if (!layer) {
            alert("Please select a layer.");
            return;
        }

        var positionProp = layer.property("Position");
        if (!positionProp) {
            alert("The selected layer does not have a Position property.");
            return;
        }

        var selectedKeyframes = positionProp.selectedKeys;
        if (selectedKeyframes.length === 0) {
            alert("Please select one or more keyframes.");
            return;
        }

        app.executeCommand(20); // Paste command ID
    }

    buildUI(thisObj);
})(this);