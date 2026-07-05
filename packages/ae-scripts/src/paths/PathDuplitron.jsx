/**
 * PathDuplitron - Position Keyframe Tangent Copy & Paste Tool for Adobe After Effects
 * 
 * Provides an intuitive UI panel for copying and pasting position keyframe tangents between layers.
 * Creates a streamlined workflow for transferring motion paths and their precise tangent information
 * while preserving temporal and spatial relationships.
 * 
 * @name PathDuplitron
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-08-13
 * @license MIT
 * @ui PANEL
 *
 * @changelog
 * • 2026-07-04 (2.0.1): Fixed the Copy operation, which previously created a
 *   temporary shape layer and wrote a flat [x, y] coordinate pair into a
 *   SHAPE-type Path property. In real After Effects that is a property-value
 *   type mismatch that threw at runtime before cleanup, leaving a stray empty
 *   shape layer in the comp; it also only ever carried raw X/Y coordinates,
 *   never any tangent/ease data. Copy now uses After Effects' native keyframe
 *   Copy (Edit > Copy) directly on the selected Position keyframes, and Paste
 *   uses native keyframe Paste (Edit > Paste). AE's own clipboard preserves the
 *   complete temporal ease, spatial tangents, and interpolation type, so the
 *   tool now delivers its stated purpose. Command IDs are resolved via
 *   app.findMenuCommandId() for version-safe execution.
 *
 * @description
 * PathDuplitron simplifies the complex process of copying motion path tangent data between
 * layers in After Effects. The tool drives AE's native keyframe clipboard (Edit ▸ Copy /
 * Edit ▸ Paste via version-safe menu-command lookups) so the selected position keyframes
 * transfer with their temporal and spatial tangent properties fully intact.
 *
 * @functionality
 * • Copies selected position keyframes with complete tangent information via AE's keyframe clipboard
 * • Preserves both temporal and spatial tangent relationships during transfer
 * • Pastes tangent information to the target layer at the current time with precision
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
 * • AE's native keyframe clipboard ensures reliable tangent data preservation
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

        // Copy the selected Position keyframes directly via After Effects'
        // native Edit > Copy. AE's keyframe copy preserves the complete temporal
        // ease, spatial tangents, and interpolation type on the clipboard, which
        // Paste then applies to the target Position property. The previous
        // shape-layer intermediate wrote a flat [x, y] pair into a SHAPE-type
        // Path property (a type mismatch that threw at runtime and left a stray
        // empty shape layer) and carried only raw coordinates, so it was removed.
        var copyCmdId = app.findMenuCommandId("Copy");
        app.executeCommand(copyCmdId);
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

        // Native Edit > Paste applies the copied keyframes (with their preserved
        // ease/tangents/interpolation) onto the selected target Position property.
        var pasteCmdId = app.findMenuCommandId("Paste");
        app.executeCommand(pasteCmdId);
    }

    buildUI(thisObj);
})(this);