// Create a dockable panel
var mainWindow = new Window("palette", "TuneSync", undefined);
mainWindow.orientation = "column";

// Add a group to hold the label and the dropdown
var reactorGroup = mainWindow.add("group");
reactorGroup.orientation = "row";

// Label for the dropdown
var label = reactorGroup.add("statictext", undefined, "Pick Reactor:");
label.size = [80, 25];

// Dropdown for selecting the AUDIO REACTOR
var dropdown = reactorGroup.add("dropdownlist", undefined, []);
dropdown.size = [150, 25];

// Add a group to hold the TuneSync and refresh buttons
var buttonGroup = mainWindow.add("group");
buttonGroup.orientation = "row";

// Button for triggering the TuneSync function
var tuneSyncButton = buttonGroup.add("button", undefined, "TuneSync");
tuneSyncButton.size = [100, 25];

// Refresh button to update the dropdown
var refreshButton = buttonGroup.add("button", undefined, "↺");
refreshButton.size = [25, 25];

// Populate the dropdown with AUDIO REACTOR compositions
function populateDropdown() {
    // Clear current items
    dropdown.removeAll();

    // Find and add AUDIO REACTOR compositions to the dropdown
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i).name.includes("AUDIO REACTOR") && app.project.item(i) instanceof CompItem) {
            dropdown.add("item", app.project.item(i).name);
        }
    }

    // Select the first item in the dropdown if available
    if (dropdown.items.length > 0) {
        dropdown.selection = 0;
    }
}
populateDropdown();

// Refresh button functionality
refreshButton.onClick = function () {
    populateDropdown();
};

// Add functionality to the TuneSync button (this is where you'll add the main logic of your script)
tuneSyncButton.onClick = function () {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("No composition is active.");
        return;
    }

    // Get the selected layers
    var layers = comp.selectedLayers;
    if (layers.length === 0) {
        alert("No layer is selected.");
        return;
    }

    // Get the selected layer
    var layer = layers[0];

    // Get the selected properties
    var props = layer.selectedProperties;
    if (props.length === 0) {
        alert("No property is selected.");
        return;
    }

    // Get the selected property
    var prop = props[0];

    // Check if it's a 1D property and not a color
    // Custom ScriptUI Dialog for 2D Property


    // Modified TuneSync.onClick function
    var layer = getSelectedLayer();
    var propName = getSelectedPropertyName();
    var audioReactorName = getAudioReactorName();

    // Determine the property type (1D, 2D, 3D)
    var propertyType = getPropertyType();

    switch (propertyType) {
        case '2D':
            XYUnifyDialog(layer, propName, audioReactorName);
            break;
        case '3D':
            XYZUnifyDialog(layer, propName, audioReactorName);
            break;
        default:
            // Handle 1D property as you normally would
            var prop = layer.property(propName); // assuming the property can be accessed like this
            handle1DProperty(layer, prop, audioReactorName);
            break;
    }
};


// Show the window
mainWindow.center();
mainWindow.show();


/**
 * Configures a 1D property on a given layer with effect controls and an expression
 * for audio-reactive animation in After Effects.
 * 
 * @param {Layer} layer - The After Effects layer where the property resides.
 * @param {Property} prop - The 1D property that will be modified (e.g., "Opacity").
 * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
 * 
 * @returns {void}
 * 
 * @example
 * // Given a layer and its opacity property
 * handle1DProperty(myLayer, myLayer.property("Opacity"), "AudioReactorComp");
 * // This will add controls for easing, min, and max output and apply an expression to the "Opacity" property.
 */
function handle1DProperty(layer, prop, audioReactorName) {
    // Create Easing dropdown
    var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
    easingDropdown.name = prop.name + "_Easing Type";
    easingDropdown.property("ADBE Dropdown-0001").addItems(["Linear", "EaseIn", "EaseOut", "EaseInOut"]);

    // Create Min and Max sliders
    var minSlider = layer.Effects.addProperty("ADBE Slider Control");
    minSlider.name = prop.name + "_Min Output";
    var maxSlider = layer.Effects.addProperty("ADBE Slider Control");
    maxSlider.name = prop.name + "_Max Output";

    // Create the expression
    var expressionString = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");' + "\n"
        + 'iMin = 0;' + "\n"
        + 'iMax = 100;' + "\n"
        + 'ctrlLayer = thisLayer;' + "\n"
        + 'easeType = ctrlLayer.effect("' + prop.name + '_Easing Type")("Menu").value;' + "\n"
        + 'outMin = ctrlLayer.effect("' + prop.name + '_Min Output")("Slider");' + "\n"
        + 'outMax = ctrlLayer.effect("' + prop.name + '_Max Output")("Slider");' + "\n"
        + 'if (easeType == 1) ease(d, iMin, iMax, outMin, outMax);' + "\n"
        + 'else if (easeType == 2) easeIn(d, iMin, iMax, outMin, outMax);' + "\n"
        + 'else if (easeType == 3) easeOut(d, iMin, iMax, outMin, outMax);' + "\n"
        + 'else easeInOut(d, iMin, iMax, outMin, outMax);';

    prop.expression = expressionString;
}
/**
 * Sets up a 2D property on a given layer with effect controls and an audio-reactive expression 
 * for manipulation in After Effects. Adds easing dropdown and output sliders.
 * 
 * @param {Layer} layer - The After Effects layer where the property resides.
 * @param {boolean} xSelected - Determines if the x-axis is affected by the expression.
 * @param {boolean} ySelected - Determines if the y-axis is affected by the expression.
 * @param {boolean} isUnified - Determines if the effect should be applied uniformly to both axes.
 * @param {string} propName - The name of the 2D property being affected (e.g., "Position", "Scale").
 * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
 * 
 * @returns {void}
 * 
 * @example
 * // Given a layer and its position property
 * handle2DProperty(myLayer, true, true, true, "Position", "AudioReactorComp");
 * // This will add controls for easing and min-max output, and apply an expression to the "Position" property.
 */
function handle2DProperty(layer, xSelected, ySelected, isUnified, propName, audioReactorName) {
    // Add Easing dropdown
    var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
    dropdown.name = propName + "_Easing Type";
    dropdown.property("ADBE Dropdown-0001").addItems(["Linear", "EaseIn", "EaseOut", "EaseInOut"]);

    // Create Sliders based on whether it's unified or individual
    if (isUnified) {
        // Unified sliders for Min and Max Output
        var outMinSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinSlider.name = propName + "_Min Output";

        var outMaxSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxSlider.name = propName + "_Max Output";
    } else {
        // Individual sliders for X and Y Min and Max Output
        var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinXSlider.name = propName + "_Min Output X";

        var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxXSlider.name = propName + "_Max Output X";

        var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinYSlider.name = propName + "_Min Output Y";

        var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxYSlider.name = propName + "_Max Output Y";
    }

    // Build the expression
    var expression = build2DExpression(xSelected, ySelected, isUnified, propName, audioReactorName);

    // Apply the expression to the property
    // Assuming `prop` is the property you're applying the expression to
    layer.property("Effects").property(propName).expression = expression;
}
/**
 * Configures a 3D property on a given layer with effect controls and an audio-reactive expression
 * for dynamic manipulation in After Effects. Adds easing dropdown and output sliders for each axis.
 * 
 * @param {Layer} layer - The After Effects layer where the property resides.
 * @param {boolean} xSelected - Determines if the x-axis is affected by the expression.
 * @param {boolean} ySelected - Determines if the y-axis is affected by the expression.
 * @param {boolean} zSelected - Determines if the z-axis is affected by the expression.
 * @param {boolean} isUnified - Determines if the effect should be applied uniformly to all axes.
 * @param {string} propName - The name of the 3D property being affected (e.g., "Position", "Scale").
 * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
 * 
 * @returns {void}
 * 
 * @example
 * // Given a layer and its position property
 * handle3DProperty(myLayer, true, true, true, true, "Position", "AudioReactorComp");
 * // This will add controls for easing, min, and max output, and apply an expression to the "Position" property.
 */
function handle3DProperty(layer, xSelected, ySelected, zSelected, isUnified, propName, audioReactorName) {
    // Add Easing dropdown
    var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
    dropdown.name = propName + "_Easing Type";
    dropdown.property("ADBE Dropdown-0001").addItems(["Linear", "EaseIn", "EaseOut", "EaseInOut"]);

    // Create Sliders based on whether it's unified or individual
    if (isUnified) {
        var outMinSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinSlider.name = propName + "_Min Output";

        var outMaxSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxSlider.name = propName + "_Max Output";
    } else {
        var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinXSlider.name = propName + "_Min Output X";

        var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxXSlider.name = propName + "_Max Output X";

        var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinYSlider.name = propName + "_Min Output Y";

        var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxYSlider.name = propName + "_Max Output Y";

        var outMinZSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinZSlider.name = propName + "_Min Output Z";

        var outMaxZSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxZSlider.name = propName + "_Max Output Z";
    }

    // Build the expression
    var expression = build3DExpression(xSelected, ySelected, zSelected, isUnified, propName, audioReactorName);

    // Apply the expression to the property
    // Assuming `prop` is the property you're applying the expression to
    layer.property("Effects").property(propName).expression = expression;
}
/**
 * Generates a 2D expression string based on the provided parameters.
 * This expression string is used to manipulate 2D properties like position, scale, etc., 
 * in an After Effects composition.
 * 
 * @param {boolean} xSelected - Determines if the x-axis is affected by the expression.
 * @param {boolean} ySelected - Determines if the y-axis is affected by the expression.
 * @param {boolean} isUnified - Determines if the effect should be applied uniformly to both axes.
 * @param {string} propName - The name of the property being affected (e.g., "Position", "Scale").
 * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
 * 
 * @returns {string} A string containing the complete expression for After Effects.
 * 
 * @example
 * const expr = build2DExpression(true, true, true, "Position", "AudioReactorComp");
 * // This will return an expression string that can be applied to the "Position" property in After Effects.
 */
function build2DExpression(xSelected, ySelected, isUnified, propName, audioReactorName) {
    var expressionBase = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");\n' +
        'iMin = 0;\n' +
        'iMax = 100;\n' +
        'originalValue = value;\n';

    var easingExpressionBase = 'ctrlLayer = thisLayer;\n' +
        'easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;\n';

    var easingExpressionUnified = 'outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");\n' +
        'outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");\n';

    var easingExpressionIndividual = 'outMinX = ctrlLayer.effect("' + propName + '_Min Output X")("Slider");\n' +
        'outMaxX = ctrlLayer.effect("' + propName + '_Max Output X")("Slider");\n' +
        'outMinY = ctrlLayer.effect("' + propName + '_Min Output Y")("Slider");\n' +
        'outMaxY = ctrlLayer.effect("' + propName + '_Max Output Y")("Slider");\n';

    var easingCalculation = 'if (easeType == 1) ease(d, iMin, iMax, outMin, outMax)\n' +
        'else if (easeType == 2) easeIn(d, iMin, iMax, outMin, outMax)\n' +
        'else if (easeType == 3) easeOut(d, iMin, iMax, outMin, outMax)\n' +
        'else easeInOut(d, iMin, iMax, outMin, outMax);\n';

    var xExpression = xSelected ? easingCalculation : 'originalValue[0];\n';
    var yExpression = ySelected ? easingCalculation : 'originalValue[1];\n';

    var finalExpression = expressionBase + easingExpressionBase;

    if (isUnified) {
        finalExpression += easingExpressionUnified;
    } else {
        finalExpression += easingExpressionIndividual;
    }

    finalExpression += 'xResult = ' + xExpression;
    finalExpression += 'yResult = ' + yExpression;

    finalExpression += '[xResult, yResult];';

    return finalExpression;
}
/**
 * Generates a 3D expression string based on the provided parameters.
 * This expression string is used to manipulate 3D properties like position, scale, etc., 
 * in an After Effects composition.
 * 
 * @param {boolean} xSelected - Determines if the x-axis is affected by the expression.
 * @param {boolean} ySelected - Determines if the y-axis is affected by the expression.
 * @param {boolean} zSelected - Determines if the z-axis is affected by the expression.
 * @param {boolean} isUnified - Determines if the effect should be applied uniformly to all axes.
 * @param {string} propName - The name of the property being affected (e.g., "Position", "Scale").
 * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
 * 
 * @returns {string} A string containing the complete expression for After Effects.
 * 
 * @example
 * const expr = build3DExpression(true, true, true, true, "Position", "AudioReactorComp");
 * // This will return an expression string that can be applied to the "Position" property in After Effects.
 */
function build3DExpression(xSelected, ySelected, zSelected, isUnified, propName, audioReactorName) {
    var expr = 'var d = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");\n' +
        'var iMin = 0;\n' +
        'var iMax = 100;\n' +
        'var ctrlLayer = thisLayer;\n' +
        'var easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;\n';

    if (isUnified) {
        expr += 'var outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");\n' +
            'var outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");\n';
    } else {
        expr += 'var outMinX = ctrlLayer.effect("' + propName + '_Min Output X")("Slider");\n' +
            'var outMaxX = ctrlLayer.effect("' + propName + '_Max Output X")("Slider");\n' +
            'var outMinY = ctrlLayer.effect("' + propName + '_Min Output Y")("Slider");\n' +
            'var outMaxY = ctrlLayer.effect("' + propName + '_Max Output Y")("Slider");\n' +
            'var outMinZ = ctrlLayer.effect("' + propName + '_Min Output Z")("Slider");\n' +
            'var outMaxZ = ctrlLayer.effect("' + propName + '_Max Output Z")("Slider");\n';
    }

    expr += 'var x = value[0];\n' +
        'var y = value[1];\n' +
        'var z = value[2];\n';

    if (xSelected) {
        expr += 'if (easeType == 1) x = ease(d, iMin, iMax, outMin, outMax);\n' +
            'else if (easeType == 2) x = easeIn(d, iMin, iMax, outMin, outMax);\n' +
            'else if (easeType == 3) x = easeOut(d, iMin, iMax, outMin, outMax);\n' +
            'else x = easeInOut(d, iMin, iMax, outMin, outMax);\n';
    }

    if (ySelected) {
        expr += 'if (easeType == 1) y = ease(d, iMin, iMax, outMin, outMax);\n' +
            'else if (easeType == 2) y = easeIn(d, iMin, iMax, outMin, outMax);\n' +
            'else if (easeType == 3) y = easeOut(d, iMin, iMax, outMin, outMax);\n' +
            'else y = easeInOut(d, iMin, iMax, outMin, outMax);\n';
    }

    if (zSelected) {
        expr += 'if (easeType == 1) z = ease(d, iMin, iMax, outMin, outMax);\n' +
            'else if (easeType == 2) z = easeIn(d, iMin, iMax, outMin, outMax);\n' +
            'else if (easeType == 3) z = easeOut(d, iMin, iMax, outMin, outMax);\n' +
            'else z = easeInOut(d, iMin, iMax, outMin, outMax);\n';
    }

    expr += '[x, y, z];';

    return expr;
}

/**
 * Gets the first selected layer in the active composition.
 * 
 * @returns {Layer|null} The first selected layer if one exists, otherwise null.
 * 
 * @example
 * const layer = getSelectedLayer();
 * if (layer !== null) {
 *   // Do something with the layer
 * } else {
 *   // No layer is selected or no composition is active
 * }
 */
function getSelectedLayer() {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
        return comp.selectedLayers[0];
    } else {
        return null;
    }
}
/**
 * Gets the name of the first selected property from the first selected layer in the active composition.
 * 
 * @returns {string|null} The name of the first selected property if one exists, otherwise null.
 * 
 * @example
 * const propName = getSelectedPropertyName();
 * if (propName !== null) {
 *   // Do something with the property name
 * } else {
 *   // No property is selected or no composition/layer is active
 * }
 */
function getSelectedPropertyName() {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
        var layer = comp.selectedLayers[0];
        if (layer.selectedProperties.length > 0) {
            return layer.selectedProperties[0].name;
        }
    }
    return null;
}
/**
 * Gets the name of the selected audio reactor from the main dialog's dropdown.
 * 
 * @returns {string|null} The name of the selected audio reactor if one is selected, otherwise null.
 * 
 * @example
 * const audioReactorName = getAudioReactorName();
 * if (audioReactorName !== null) {
 *   // Do something with the audio reactor name
 * } else {
 *   // No audio reactor is selected
 * }
 */
function getAudioReactorName() {
    if (dropdown && dropdown.selection) {
        return dropdown.selection.toString();
    } else {
        return null;
    }
}

/**
 * Determines the type of the first selected property from the first selected layer in the active composition.
 *
 * @returns {string|null} Returns '1D', '2D', or '3D' based on the type of the selected property, otherwise null.
 * 
 * @example
 * const propertyType = getPropertyType();
 * if (propertyType !== null) {
 *   // Do something based on the property type
 * } else {
 *   // No property is selected or no composition/layer is active
 * }
 */
function getPropertyType() {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
        var layer = comp.selectedLayers[0];
        if (layer.selectedProperties.length > 0) {
            var prop = layer.selectedProperties[0];
            switch (prop.propertyType) {
                case PropertyType.OneD:
                    return '1D';
                case PropertyType.TwoD:
                    return '2D';
                case PropertyType.ThreeD:
                    return '3D';
                default:
                    return null;
            }
        }
    }
    return null;
}

function XYUnifyDialog(layer, propName, audioReactorName) {
    var dialog = new Window('dialog', 'XY Unify');
    var xCheckBox = dialog.add('checkbox', undefined, 'X');
    var yCheckBox = dialog.add('checkbox', undefined, 'Y');
    var unifiedCheckBox = dialog.add('checkbox', undefined, 'Individual/Unified');

    dialog.add('button', undefined, 'OK').onClick = function () {
        handle2DProperty(layer, xCheckBox.value, yCheckBox.value, unifiedCheckBox.value, propName, audioReactorName);
        dialog.close();
    };

    dialog.add('button', undefined, 'Cancel').onClick = function () {
        dialog.close();
    };

    dialog.show();
}

// Custom ScriptUI Dialog for 3D Property
function XYZUnifyDialog(layer, propName, audioReactorName) {
    var dialog = new Window('dialog', 'XYZ Unify');
    var xCheckBox = dialog.add('checkbox', undefined, 'X');
    var yCheckBox = dialog.add('checkbox', undefined, 'Y');
    var zCheckBox = dialog.add('checkbox', undefined, 'Z');
    var unifiedCheckBox = dialog.add('checkbox', undefined, 'Individual/Unified');

    dialog.add('button', undefined, 'OK').onClick = function () {
        handle3DProperty(layer, xCheckBox.value, yCheckBox.value, zCheckBox.value, unifiedCheckBox.value, propName, audioReactorName);
        dialog.close();
    };

    dialog.add('button', undefined, 'Cancel').onClick = function () {
        dialog.close();
    };

    dialog.show();
}