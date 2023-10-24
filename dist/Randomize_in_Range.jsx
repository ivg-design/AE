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
 * @author: IVG Design
 *
 * @function arrayHasNaN - Checks if an array contains any NaN values.
 * @param {Array} arr - The array to check.
 * @return {boolean} True if the array contains at least one NaN, false otherwise.
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

    // Define your labels for each min/max range set - X, Y, Z
    var labels = ['X', 'Y', 'Z'];

    var maxDimensionality = Math.max.apply(null, selectedProperties.map(function (prop) {
        return prop.value && prop.value instanceof Array ? prop.value.length : 1;
    }));

    for (var i = 0; i < maxDimensionality; i++) {
        var rangeGroup = win.add("group");
        rangeGroup.orientation = "row";

        // Add label to the Start Range and End Range
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
        var startRanges = startRangeInputs.map(function (input) {
            return parseFloat(input.text);
        });

        var endRanges = endRangeInputs.map(function (input) {
            return parseFloat(input.text);
        });

        if (arrayHasNaN(startRanges) || arrayHasNaN(startRanges)) { 
            alert("Please enter valid numbers for the range");
            return;
        }

        app.beginUndoGroup("Randomize Keyframes");

        for (var i = 0; i < selectedProperties.length; i++) {

            var property = selectedProperties[i];

            if (property.selectedKeys.length > 0) {

                for (var j = 1; j <= property.numKeys; j++) {

                    if (property.keySelected(j)) {
                        var randomValue;

                        // Check if the property is array or not
                        if (property.value instanceof Array) {
                            randomValue = property.value.map(function (_, index) {
                                return startRanges[index] + Math.random() * (endRanges[index] - startRanges[index]);
                            });
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