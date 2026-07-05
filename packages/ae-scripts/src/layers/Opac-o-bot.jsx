/**
 * Opac-o-bot - Parent the Opacity of Selected Layers via Expression
 *
 * @name Opac-o-bot
 * @author IVG Design
 * @version 1.0.0
 * @date 2026-07-04
 * @license MIT
 * @ui HEADLESS
 *
 * @description
 * Completes AE parenting. When you parent layers, Position, Scale and Rotation follow
 * the parent - but Opacity never does. Opac-o-bot wires each selected layer's Opacity
 * to its parent's Opacity with a one-line expression, so fading the parent fades the
 * whole rig. Run it once on any number of selected (parented) layers.
 *
 * @functionality
 * • Writes `thisComp.layer("<parent>").transform.opacity` onto every selected layer's Opacity
 * • Processes all selected layers in one undo step
 * • Alerts per layer when a selected layer has no parent (and leaves it untouched)
 *
 * @usage
 * 1. Parent your layers as usual (Position/Scale/Rotation already follow)
 * 2. Select the child layers and run Opac-o-bot
 * 3. Animate the parent's Opacity - the children now follow it
 *
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with at least one selected, parented layer
 *
 * @notes
 * • The expression references the parent BY NAME - renaming the parent (or having
 *   duplicate layer names in the comp) breaks or misdirects the link. Re-run after renames.
 * • To make a child fade independently again, just delete the expression from its Opacity.
 */

(function () {
    var proj = app.project;
    var undoStr = "Connect Layer Opacity to Parent Opacity";

    if (!proj) return;

    var myComp = app.project.activeItem;
    if (myComp == null || !(myComp instanceof CompItem)) {
        alert("Please select composition first");
        return;
    }

    var myLayers = myComp.selectedLayers;
    if (myLayers.length == 0) {
        alert("Please select at least one parented layer.");
        return;
    }

    app.beginUndoGroup(undoStr);

    for (var i = 0; i < myLayers.length; i++) {
        if (myLayers[i].parent) {
            myLayers[i].opacity.expression =
                'thisComp.layer("' + myLayers[i].parent.name + '").transform.opacity';
        } else {
            alert("\"" + myLayers[i].name + "\" has no parent - skipped.");
        }
    }

    app.endUndoGroup();
})();
