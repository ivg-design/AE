/**
 * Reseterator - One-click PSR Reset for Selected Layers
 *
 * @name Reseterator
 * @author IVG Design
 * @version 1.0.0
 * @date 2026-07-04
 * @license MIT
 * @ui HEADLESS
 *
 * @description
 * Zeroes out the transform origin of every selected layer in one click. Each selected
 * layer's Anchor Point is reset to [0,0,0], and every shape group inside it gets its
 * internal Transform anchor and position reset to [0,0] (recursively, however deep the
 * groups are nested). Handy after importing or restructuring shape layers whose groups
 * carry stray offsets.
 *
 * @functionality
 * • Resets the layer Anchor Point to [0,0,0] for every selected layer
 * • Recursively walks each layer's property groups and resets every
 *   ADBE Vector Transform Group's Anchor Point and Position to [0,0]
 * • Processes any number of selected layers in a single undo step
 *
 * @usage
 * 1. Select one or more layers in the active composition
 * 2. Run Reseterator - anchors and shape-group offsets snap to zero immediately
 *
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with at least one selected layer
 *
 * @notes
 * • Layer Position, Scale and Rotation are left untouched - only anchors and
 *   shape-group internal transforms are reset, so layers may shift visually if
 *   their anchor carried an offset.
 * • Works on any layer type; the recursive shape-group reset only affects
 *   shape layers (others simply get their anchor reset).
 */

(function () {
    var myComp = app.project.activeItem;
    var undoStr = "Reset PSR";
    if (!myComp || !(myComp instanceof CompItem))
        return alert("Please select composition first");

    if (myComp.selectedLayers.length === 0)
        return alert("Please select at least one layer.");

    app.beginUndoGroup(undoStr);

    forSelectedLayers(resetPSR);

    app.endUndoGroup();

    function forSelectedLayers() {
        var selectedLayers = myComp.selectedLayers;
        for (var i = 0, il = selectedLayers.length; i < il; i++) {
            resetPSR(selectedLayers[i]);
            selectedLayers[i].anchorPoint.setValue([0, 0, 0]);
        }
    }

    function resetPSR(propGroup) {
        var t, prop;
        for (t = 1; t <= propGroup.numProperties; t++) {
            prop = propGroup.property(t);
            if (
                prop.propertyType === PropertyType.INDEXED_GROUP ||
                prop.propertyType === PropertyType.NAMED_GROUP
            ) {
                if (prop.matchName == 'ADBE Vector Transform Group') {
                    prop.property(1).setValue([0, 0]); // Anchor
                    prop.property(2).setValue([0, 0]); // Position
                }
                resetPSR(prop);
            }
        }
    }

})();
