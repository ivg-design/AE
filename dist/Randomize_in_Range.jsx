/**
 * This script randomizes selected keyframes within a specified range.
 * It works on Adobe After Effects compositions and allows you to select 
 * multiple properties and randomize their values within a defined range.
 *
 * The script creates a UI dialog box with input fields for defining the start and end range 
 * for each dimension (X, Y, Z). When the "OK" button is clicked, it computes new random values 
 * for the selected keyframes within the provided ranges.
 *
 * It also checks for invalid inputs (like non-numeric values) and gives an alert in such cases.
 *
 * Example:
 * Select some keyframes in your After Effects composition and run this script. 
 * A dialog box will appear where you can enter your desired start and end ranges 
 * for each dimension. Clicking "OK" will apply the changes.
 *
 * @license: MIT License
 * @autor: IVG Design
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

    var win = new Window("dialog", "Randomize Keyframes");
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

        app.beginUndoGroup("Randomize Keyframes");

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
