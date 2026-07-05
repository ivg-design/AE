/**
 * TimeWarp-a-tron - Advanced Time Remapping Control System
 *
 * @name TimeWarp-a-tron
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 *
 * @changelog
 * 2.0.1 (2026-07-04):
 *   - Fixed: selecting the Slider *value* row ("ADBE Slider Control-0001") instead of the
 *     effect header now normalizes controllerProp up to its parent effect, so the generated
 *     expression references the real effect name instead of a nonexistent effect("Slider").
 *   - Fixed: controllerName shadowing — the picker handler no longer re-declares controllerName
 *     with `var`, so okButton's fallback slider is named correctly instead of "undefined".
 * 
 * @description
 * A sophisticated time remapping automation tool that creates dynamic relationships between
 * layer timing and external control systems. This advanced workflow utility automates the
 * complex process of linking time remapping properties to slider controls with mathematical
 * expressions, enabling precise temporal control over layer playback speed and timing
 * within After Effects compositions.
 * 
 * @functionality
 * • Interactive layer selection system with visual feedback indicators
 * • Automatic time remapping detection and validation for selected layers
 * • Dynamic controller creation with intelligent naming conventions
 * • Advanced mathematical expression generation for linear time remapping
 * • In/Out range point control system for precise timing boundaries
 * • Frame rate compensation and automatic time conversion calculations
 * • Dual-control system supporting existing and new slider controllers
 * • Real-time validation with immediate user feedback
 * • Comprehensive error handling and user guidance
 * • Full undo group support for safe operation reversal
 * 
 * @usage
 * 1. Select layers with time remapping enabled in your composition timeline
 * 2. Run the TimeWarp-a-tron script to open the control selection dialog
 * 3. Click the first red button to select a layer with time remapping enabled
 *    - The button turns green when a valid time-remapped layer is selected
 * 4. Click the second red button to select or create a controller layer
 *    - Choose an existing slider control or allow the script to create a new one
 *    - The button turns green when a valid controller is established
 * 5. Click "OK" to generate the time remapping system:
 *    - An "In/Out Range" point control is added to the time-remapped layer
 *    - A slider control is created/configured on the controller layer
 *    - Mathematical expressions link the controls for real-time time manipulation
 * 6. Use the slider control (0-100) to scrub through the specified time range
 * 7. Adjust the "In/Out Range" point control to define the timing boundaries
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with layers that support time remapping
 * • At least one layer with time remapping enabled (canSetTimeRemapEnabled = true)
 * • Valid controller layers for hosting slider controls
 * 
 * @notes
 * • The script requires time remapping to be manually enabled before use
 * • Expression system provides real-time feedback without keyframe dependencies
 * • Frame rate calculations ensure accurate time conversion across different compositions
 * • The In/Out Range system defines the temporal boundaries for the remapping control
 * • Controller naming includes the source layer name for easy identification
 * • The system supports both pre-existing and newly created slider controls
 * • All time calculations are automatically compensated for composition frame rate
 * • Multiple layers can share the same controller for synchronized time control
 */

(function () {
    // Set up an undo group for the entire script
    app.beginUndoGroup("TimeWarp-a-tron");

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
        var win = new Window("dialog", "TimeWarp-a-tron", undefined);
        win.orientation = "column";

        // First row of buttons
        var pickLayerGroup = win.add("group", undefined, "Pick Layer Group");
        pickLayerGroup.orientation = "row";

        var timeRemapGroup = pickLayerGroup.add("group");
        timeRemapGroup.orientation = "column";
        timeRemapGroup.alignChildren = ["center", "center"];;
        timeRemapGroup.size = [130, 100]; // Ensure enough height for the label

        var pickTimeRemapButton = timeRemapGroup.add("button", undefined, "\uD83D\uDD34", { name: "pickTimeRemapButton" });
        pickTimeRemapButton.size = [120, 40];
        var pickTimeRemapLabel = timeRemapGroup.add("statictext", [0, 0, 120, 40], "Pick Time\nRemapped Layer", { multiline: true });
        pickTimeRemapLabel.alignment = "center";
        pickTimeRemapLabel.alignChildren = ["center", "center"];


        var controllerGroup = pickLayerGroup.add("group");
        controllerGroup.orientation = "column";
        controllerGroup.alignChildren = ["center", "center"];;
        controllerGroup.size = [130, 100]; // Ensure enough height for the label

        var pickControllerButton = controllerGroup.add("button", undefined, "\uD83D\uDD34", { name: "pickControllerButton" });
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
                    pickTimeRemapButton.text = "\uD83D\uDFE2";
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
                // Assign to the outer (IIFE-scoped) controllerName — no local `var` — so
                // okButton.onClick's fallback branch can read the intended name instead of undefined.
                controllerName = timeRemapPropPath.propertyGroup(1).name + " || Time Control";
                controllerProp = findEffectByName(activeItem, controllerName);

                if (controllerProp) {
                    // If a controller with the same name already exists, use it
                    controllerLayer = activeItem;
                    pickControllerButton.text = "\uD83D\uDFE2";
                } else {
                    var selectedEffect = activeItem.selectedProperties[0];

                    if (selectedEffect &&
                        (selectedEffect.matchName === "ADBE Slider Control-0001" || selectedEffect.matchName === "ADBE Slider Control")) {
                        // A slider control is selected. Normalize to the parent effect:
                        // if the user selected the inner "Slider" value row ("ADBE Slider Control-0001")
                        // rather than the effect header ("ADBE Slider Control"), walk up one level so
                        // controllerProp is always the effect (whose .name is the effect's name, e.g.
                        // "Slider Control"). Otherwise the expression would emit effect("Slider")(...)
                        // and throw "no effect named Slider" in AE.
                        controllerLayer = activeItem;
                        if (selectedEffect.matchName === "ADBE Slider Control-0001") {
                            controllerProp = selectedEffect.propertyGroup(1);
                        } else {
                            controllerProp = selectedEffect;
                        }
                        pickControllerButton.text = "\uD83D\uDFE2";
                    } else {
                        // If only a layer is selected and no matching slider exists, prompt to add a slider
                        var addSlider = confirm("No slider controller found. Would you like to add a Control Slider?");
                        if (addSlider) {
                            controllerLayer = activeItem;
                            controllerProp = controllerLayer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                            controllerProp.name = controllerName;
                            pickControllerButton.text = "\uD83D\uDFE2";
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
                    controlLayer.property("ADBE Point Control-0001").setValue([0, 60]);
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
