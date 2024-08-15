/**
 * @file TimeRemapController.js
 * @description This script automates the process of applying time remapping and control sliders within selected compositions in Adobe After Effects. It creates an In/Out Range controller for the time remapping layer and links a slider control to dynamically adjust the time remap based on user input. The script checks for existing controllers before adding new ones, ensuring no duplicate controls are created.
 * 
 * @usage Select a time-remapped layer and optionally a controller layer, then run the script. The script will check for existing controllers and only add new ones if necessary. The expression applied to the time remap will be linked to the In/Out Range controller and the selected slider control.
 * 
 * @disclaimer This script is provided "as is", without warranty of any kind, express or implied. In no event shall the creators be liable for any claim, damages, or other liability arising from, out of, or in connection with the software.
 * 
 * @license MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * @creator IVG Design
 */

(function () {
    // Set up an undo group for the entire script
    app.beginUndoGroup("Link Time Remapping");

    // Global variables
    var timeRemapPropPath;
    var controllerLayer;
    var controllerProp;
    var controllerName;

    /**
     * Creates the user interface for selecting the time-remapped layer and controller.
     * Handles user interactions and updates global variables based on user selections.
     */
    function createUI() {
        var win = new Window("palette", "Link Time Remapping", undefined);
        win.orientation = "column";

        // First row of buttons
        var pickLayerGroup = win.add("group", undefined, "Pick Layer Group");
        pickLayerGroup.orientation = "row";

        var timeRemapGroup = pickLayerGroup.add("group");
        timeRemapGroup.orientation = "column";
        timeRemapGroup.alignChildren = ["center", "center"];;
        timeRemapGroup.size = [130, 100]; // Ensure enough height for the label

        var pickTimeRemapButton = timeRemapGroup.add("button", undefined, "🔴", { name: "pickTimeRemapButton" });
        pickTimeRemapButton.size = [120, 40];
        var pickTimeRemapLabel = timeRemapGroup.add("statictext", [0, 0, 120, 40], "Pick Time\nRemapped Layer", { multiline: true });
        pickTimeRemapLabel.alignment = "center";
        pickTimeRemapLabel.alignChildren = ["center", "center"]; 


        var controllerGroup = pickLayerGroup.add("group");
        controllerGroup.orientation = "column";
        controllerGroup.alignChildren = ["center", "center"];;
        controllerGroup.size = [130, 100]; // Ensure enough height for the label

        var pickControllerButton = controllerGroup.add("button", undefined, "🔴", { name: "pickControllerButton" });
        pickControllerButton.size = [120, 40];
        var pickControllerLabel = controllerGroup.add("statictext", [0, 0, 120, 40], "Pick Time\nRemap Controller", { multiline: true });
        pickControllerLabel.alignment = "center";
        pickControllerLabel.alignChildren = ["center", "center"]; 


        // Second row of buttons
        var controlGroup = win.add("group", undefined, "Control Group");
        controlGroup.orientation = "row";

        var okButton = controlGroup.add("button", undefined, "OK", { name: "okButton" });
        okButton.size = [120, 40];
        var cancelButton = controlGroup.add("button", undefined, "Cancel", { name: "cancelButton" });
        cancelButton.size = [120, 40];

    // Event listeners for buttons

        /**
        * Handles the selection of the time-remapped layer.
        * Updates the global variable timeRemapPropPath based on the selected layer.
        */
        pickTimeRemapButton.onClick = function () {
            var activeLayer = app.project.activeItem.selectedLayers[0];
            if (activeLayer && activeLayer.canSetTimeRemapEnabled) {
                timeRemapPropPath = activeLayer.property("ADBE Time Remapping");
                if (timeRemapPropPath) {
                    pickTimeRemapButton.text = "🟢";
                } else {
                    alert("Selected layer does not have Time Remapping enabled.");
                }
            } else {
                alert("Please select a layer with Time Remapping enabled.");
            }
        };
        
        /**
         * Handles the selection of the controller layer.
         * Checks for an existing controller with the required name before prompting the user to add a new one.
         * Updates global variables controllerLayer and controllerProp based on the selection.
         */
        pickControllerButton.onClick = function () {
            if (!timeRemapPropPath) {
                alert("Please pick a Time Remapped Layer first.");
                return;
            }

            var activeItem = app.project.activeItem.selectedLayers[0];
            if (activeItem) {
                var controllerName = timeRemapPropPath.propertyGroup(1).name + " || Time Control";
                controllerProp = findEffectByName(activeItem, controllerName);

                if (controllerProp) {
                    // If a controller with the same name already exists, use it
                    controllerLayer = activeItem;
                    pickControllerButton.text = "🟢";
                } else {
                    var selectedEffect = activeItem.selectedProperties[0];

                    if (selectedEffect &&
                        (selectedEffect.matchName === "ADBE Slider Control-0001" || selectedEffect.matchName === "ADBE Slider Control")) {
                        // If a slider control is selected, use it directly
                        controllerLayer = activeItem;
                        controllerProp = selectedEffect;
                        pickControllerButton.text = "🟢";
                    } else {
                        // If only a layer is selected and no matching slider exists, prompt to add a slider
                        var addSlider = confirm("No slider controller found. Would you like to add a Control Slider?");
                        if (addSlider) {
                            controllerLayer = activeItem;
                            controllerProp = controllerLayer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                            controllerProp.name = controllerName;
                            pickControllerButton.text = "🟢";
                        }
                    }
                }
            } else {
                alert("Please select a layer or effect controller.");
            }
        };

        /**
        * Applies the selected time remapping and controller settings when the OK button is clicked.
        * Checks for existing controllers before adding new ones, and applies the expression to the time remapping property.
        */
        okButton.onClick = function () {
            if (timeRemapPropPath && controllerLayer) {
                // Check if the time-remapping layer already has an In/Out Range controller
                var controlLayer = findEffectByName(timeRemapPropPath.propertyGroup(1), "In/Out Range");
                if (!controlLayer) {
                    // Add In/Out Range Point Controller if it doesn't exist
                    controlLayer = timeRemapPropPath.propertyGroup(1).property("ADBE Effect Parade").addProperty("ADBE Point Control");
                    controlLayer.name = "In/Out Range";
                    controlLayer.property("ADBE Point Control-0001").setValue([0, 50]);
                }

                // Check if the controller layer already has the required controller
                if (!controllerProp) {
                    controllerProp = controllerLayer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    controllerProp.name = controllerName;
                }

                // Convert frame range to seconds
                var frameRate = app.project.activeItem.frameRate;

                var expression =
                    "function linearExpression(value, inputMin, inputMax, outputMin, outputMax) {" + "\n" +
                    "    var normalizedValue = (value - inputMin) / (inputMax - inputMin);" + "\n" +
                    "    var outputValue = outputMin + normalizedValue * (outputMax - outputMin);" + "\n" +
                    "    return outputValue;" + "\n" +
                    "}" + "\n" +
                    "var inOutRange = thisComp.layer(\"" + timeRemapPropPath.propertyGroup(1).name + "\").effect(\"In/Out Range\")(\"Point\");" + "\n" +
                    "var controllingValue = thisComp.layer(\"" + controllerLayer.name + "\").effect(\"" + controllerProp.name + "\")(\"Slider\");" + "\n" +
                    "var inputMin = 0;" + "\n" +
                    "var inputMax = 100;" + "\n" +
                    "var outputMin = inOutRange[0] / " + frameRate + ";" + "\n" +
                    "var outputMax = inOutRange[1] / " + frameRate + ";" + "\n" +
                    "linearExpression(controllingValue, inputMin, inputMax, outputMin, outputMax);" + "\n";

                timeRemapPropPath.expression = expression;

                win.close();
            } else {
                alert("Please make sure both a Time Remapped Layer and a Controller are selected.");
            }
        };

        cancelButton.onClick = function () {
            win.close();
        };

        win.center();
        win.show();
    }
    
    /**
    * Finds an effect by name on a given layer.
    * 
    * @param {Object} layer - The layer to search for the effect.
    * @param {string} name - The name of the effect to find.
    * @returns {Object|null} The effect property if found, or null if not found.
    */
    function findEffectByName(layer, name) {
        var effects = layer.property("ADBE Effect Parade");
        if (effects) {
            for (var i = 1; i <= effects.numProperties; i++) {
                if (effects.property(i).name === name) {
                    return effects.property(i);
                }
            }
        }
        return null;
    }

    // Run the UI
    createUI();

    // End undo group for the entire script
    app.endUndoGroup();
})();
