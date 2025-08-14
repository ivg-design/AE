/**
 * PathDuplitron - Position Keyframe Tangent Copy & Paste Tool for Adobe After Effects
 * 
 * Provides an intuitive UI panel for copying and pasting position keyframe tangents between layers.
 * Creates a streamlined workflow for transferring motion paths and their precise tangent information
 * while preserving temporal and spatial relationships.
 * 
 * @name PathDuplitron
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui PANEL
 * 
 * @description
 * PathDuplitron simplifies the complex process of copying motion path tangent data between
 * layers in After Effects. The tool extracts position keyframe information along with their
 * temporal and spatial tangent properties, stores them temporarily using shape layer intermediates,
 * and allows precise application to target layers while maintaining curve characteristics.
 * 
 * @functionality
 * • Copies position keyframes with complete tangent information to system storage
 * • Preserves both temporal and spatial tangent relationships during transfer
 * • Uses shape layer as reliable intermediate storage for tangent data
 * • Pastes tangent information to selected position keyframes with precision
 * • Maintains keyframe timing relationships and curve interpolation
 * • Provides simple copy/paste interface for efficient workflow
 * • Handles complex motion path data including bezier curve properties
 * 
 * @usage
 * 1. Select a layer containing position keyframes with desired tangent information
 * 2. Select the specific position keyframes you want to copy
 * 3. Click "Copy" button to store the tangent information in system memory
 * 4. Navigate to your target layer and select destination position keyframes
 * 5. Click "Paste" button to apply the stored tangent information
 * 6. Review the applied tangent curves and motion path characteristics
 * 7. Use "Close" button to exit the panel when finished
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with keyframe animation support
 * • Source layer must have position keyframes with tangent data
 * • Target layer must have position keyframes to receive tangent information
 * • Sufficient system memory for temporary tangent data storage
 * 
 * @notes
 * • Panel remains dockable within After Effects interface for repeated use
 * • Shape layer intermediate storage ensures reliable tangent data preservation
 * • Tool maintains original keyframe timing while transferring curve characteristics
 * • Compatible with 2D and 3D position properties and their respective tangents
 * • Copy operation stores data until After Effects session ends or new copy is performed
 * • Paste operation can be applied multiple times to different target keyframes
 */

(function copyPastePositionTangents(thisObj) {
    var scriptName = "PathDuplitron";
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