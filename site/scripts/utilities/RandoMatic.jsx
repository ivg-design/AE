/**
 * RandoMatic - Advanced Keyframe Randomization Tool for Adobe After Effects
 *
 * Provides intelligent randomization of selected keyframes within user-specified ranges
 * across multiple dimensions. Features an intuitive dialog interface for precise control
 * over randomization parameters with comprehensive validation and error handling.
 *
 * @name RandoMatic
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 * 
 * @description
 * RandoMatic streamlines the process of adding controlled randomness to keyframe animations
 * in After Effects. The tool provides a sophisticated dialog interface allowing users to
 * specify precise randomization ranges for each dimension (X, Y, Z), validates input data,
 * and applies mathematically sound random values while preserving keyframe timing and structure.
 * 
 * @functionality
 * • Creates interactive dialog with input fields for X, Y, Z dimension ranges
 * • Validates numeric input data and provides clear error messaging for invalid entries
 * • Computes mathematically distributed random values within specified ranges
 * • Applies randomization to multiple selected keyframes simultaneously
 * • Preserves original keyframe timing relationships and interpolation settings
 * • Supports multi-dimensional properties including position, scale, and rotation
 * • Includes comprehensive NaN detection and input validation systems
 * 
 * @usage
 * 1. Open your After Effects composition and select properties with keyframes
 * 2. Select the specific keyframes you want to randomize in the timeline
 * 3. Run the script to open the RandoMatic dialog interface
 * 4. Enter start and end range values for each dimension (X, Y, Z) as needed
 * 5. Review your range inputs to ensure they match your creative intent
 * 6. Click "OK" to apply randomization to all selected keyframes
 * 7. Use "Cancel" to exit without making changes if needed
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with keyframe animation support
 * • Active composition must be selected with keyframeable properties
 * • Selected keyframes must exist on properties that support the specified dimensions
 * • Sufficient system memory for dialog rendering and keyframe processing
 * 
 * @notes
 * • Dialog validates all inputs to prevent non-numeric values and calculation errors
 * • Randomization uses uniform distribution within specified ranges for predictable results
 * • Tool preserves keyframe interpolation methods and temporal properties
 * • Multiple properties can be randomized simultaneously for efficient workflow
 * • Range inputs support both positive and negative values for complete flexibility
 * • Script includes built-in NaN detection array utility for robust error handling
 */

(function () {

    /**
     * Checks if an array contains any NaN values.
     *
     * @param {Array} arr - The array to check.
     * @return {boolean} True if the array contains at least one NaN, false otherwise.
     */
    function arrayHasNaN(arr) {
        for (var i = 0; i < arr.length; i++) {
            if (isNaN(arr[i])) {
                return true;
            }
        }
        return false;
    }

    var comp = app.project.activeItem;

    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition");
        return;
    }

    var selectedProperties = comp.selectedProperties;

    if (selectedProperties.length === 0) {
        alert("Please select some keyframes");
        return;
    }

    var win = new Window("dialog", "RandoMatic");
    win.orientation = "column";
    win.alignChildren = ["left", "top"];

    var rangeGroups = [];
    var startRangeInputs = [];
    var endRangeInputs = [];

    var labels = ['X', 'Y', 'Z'];

    var maxDimensionality = 1;
    for (var i = 0; i < selectedProperties.length; i++) {
        var prop = selectedProperties[i];
        var dim = (prop.value instanceof Array) ? prop.value.length : 1;
        if (dim > maxDimensionality) {
            maxDimensionality = dim;
        }
    }

    for (i = 0; i < maxDimensionality; i++) {
        var rangeGroup = win.add("group");
        rangeGroup.orientation = "row";

        rangeGroup.add("statictext", undefined, "Start Range " + labels[i] + ":");
        var startRangeInput = rangeGroup.add("edittext", undefined, "0");
        startRangeInput.characters = 5;

        rangeGroup.add("statictext", undefined, "End Range " + labels[i] + ":");
        var endRangeInput = rangeGroup.add("edittext", undefined, "100");
        endRangeInput.characters = 5;

        rangeGroups.push(rangeGroup);
        startRangeInputs.push(startRangeInput);
        endRangeInputs.push(endRangeInput);
    }

    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.add("button", undefined, "OK");
    buttonGroup.add("button", undefined, "Cancel");

    buttonGroup.children[0].onClick = function () {
        var startRanges = [];
        var endRanges = [];
        for (var i = 0; i < startRangeInputs.length; i++) {
            startRanges.push(parseFloat(startRangeInputs[i].text));
            endRanges.push(parseFloat(endRangeInputs[i].text));
        }

        if (arrayHasNaN(startRanges) || arrayHasNaN(endRanges)) {
            alert("Please enter valid numbers for the range");
            return;
        }

        app.beginUndoGroup("RandoMatic");

        for (i = 0; i < selectedProperties.length; i++) {
            var property = selectedProperties[i];

            if (property.selectedKeys.length > 0) {
                for (var j = 1; j <= property.numKeys; j++) {
                    if (property.keySelected(j)) {
                        var randomValue;

                        if (property.value instanceof Array) {
                            randomValue = [];
                            for (var k = 0; k < property.value.length; k++) {
                                randomValue[k] = startRanges[k] + Math.random() * (endRanges[k] - startRanges[k]);
                            }
                        } else {
                            randomValue = startRanges[0] + Math.random() * (endRanges[0] - startRanges[0]);
                        }

                        property.setValueAtKey(j, randomValue);
                    }
                }
            }
        }

        app.endUndoGroup();
        win.close();
    };

    buttonGroup.children[1].onClick = function () {
        win.close();
    };

    win.center();
    win.show();
})();
