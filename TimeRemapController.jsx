{
    // Set up an undo group
    app.beginUndoGroup("Link Time Remapping");

    // Global variables
    var timeRemapPropPath;
    var controllerLayer;
    var controllerProp;

    // Function to create UI
    function createUI() {
        var win = new Window("palette", "Link Time Remapping", undefined);
        win.orientation = "column";
        
        // First row of buttons
        var pickLayerGroup = win.add("group", undefined, "Pick Layer Group");
        pickLayerGroup.orientation = "row";
        
        var pickTimeRemapButton = pickLayerGroup.add("button", undefined, "Pick Time Remapped Layer");
        var pickControllerButton = pickLayerGroup.add("button", undefined, "Pick Controller");

        // Second row of buttons
        var controlGroup = win.add("group", undefined, "Control Group");
        controlGroup.orientation = "row";
        
        var okButton = controlGroup.add("button", undefined, "OK");
        var cancelButton = controlGroup.add("button", undefined, "Cancel");

        // Event listeners for buttons
        pickTimeRemapButton.onClick = function() {
            var activeLayer = app.project.activeItem.selectedLayers[0];
            if (activeLayer && activeLayer.canSetTimeRemapEnabled) {
                timeRemapPropPath = activeLayer.property("ADBE Time Remapping");
                if (timeRemapPropPath) {
                    pickTimeRemapButton.backgroundColor = [0, 1, 0];
                    alert("Time Remapping Layer selected: " + activeLayer.name);
                } else {
                    alert("Selected layer does not have Time Remapping enabled.");
                }
            } else {
                alert("Please select a layer with Time Remapping enabled.");
            }
        };

        pickControllerButton.onClick = function() {
            var activeLayer = app.project.activeItem.selectedLayers[0];
            if (activeLayer) {
                var controlEffect = activeLayer.property("ADBE Effect Parade");
                if (controlEffect && controlEffect.numProperties > 0) {
                    controllerLayer = activeLayer;
                    controllerProp = controlEffect.property(1); // Assuming the first effect is the controller
                    pickControllerButton.backgroundColor = [0, 1, 0];
                    alert("Controller selected: " + controllerLayer.name);
                } else {
                    var addSlider = confirm("No effect controller found. Would you like to add a Control Slider?");
                    if (addSlider) {
                        controllerLayer = activeLayer;
                        controllerProp = controllerLayer.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                        pickControllerButton.backgroundColor = [0, 1, 0];
                        alert("Control Slider added to: " + controllerLayer.name);
                    } else {
                        alert("Please select a different controller.");
                    }
                }
            } else {
                alert("Please select a layer or effect controller.");
            }
        };

        okButton.onClick = function() {
            if (timeRemapPropPath && controllerLayer && controllerProp) {
                var expression = 
                    "function linearExpression(value, inputMin, inputMax, outputMin, outputMax) {" + "\n" +
                    "    var normalizedValue = (value - inputMin) / (inputMax - inputMin);" + "\n" +
                    "    var outputValue = outputMin + normalizedValue * (outputMax - outputMin);" + "\n" +
                    "    return outputValue;" + "\n" +
                    "}" + "\n" +
                    "" + "\n" +
                    "var controllingValue = thisComp.layer(\"" + controllerLayer.name + "\").effect(\"" + controllerProp.name + "\")(\"Slider\");" + "\n" +
                    "var inputMin = 0;" + "\n" +
                    "var inputMax = 100;" + "\n" +
                    "var outputMin = 0;" + "\n" +
                    "var outputMax = 0.9;" + "\n" +
                    "" + "\n" +
                    "var mappedValue = linearExpression(controllingValue, inputMin, inputMax, outputMin, outputMax);" + "\n" +
                    "mappedValue;" + "\n";

                timeRemapPropPath.expression = expression;
                win.close();
            } else {
                alert("Please make sure both a Time Remapped Layer and a Controller are selected.");
            }
        };

        cancelButton.onClick = function() {
            win.close();
        };

        win.center();
        win.show();
    }

    // Run the UI
    createUI();

    // End undo group
    app.endUndoGroup();
}
