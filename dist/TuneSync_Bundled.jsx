//========== INCLUDED FUNCTIONS ============//
var Ae = (function() {
 var module = {};
/**
 * Retrieves the first selected property from the currently active composition and layer.
 * @returns {(Object|null)} - The first selected property object, or null if not found.
 */
	module.retrieveProp = function () {
		var comp = app.project.activeItem;
		if (comp !== null && (comp instanceof CompItem)) {
			var layers = comp.selectedLayers;
			if (layers.length > 0) {
				var selectedLayer = layers[0];
				var selectedProperties = selectedLayer.selectedProperties;
				if (selectedProperties.length > 0) {
					return selectedProperties[selectedProperties.length - 1];
				}
			}
		}
		return null;  // Return null if no property is selected
	};
	
	/**
	 * Finds properties that match the specified criteria within the base property.
	 *
	 * @param {PropertyGroup} baseProperty - The base property to search within.
	 * @param {boolean} recursion - Flag indicating whether to recursively search within nested groups.
	 * @param {Function} callback - The callback function to determine if a property matches the criteria.
	 * @param {Property[]} properties - An array to store the found properties (optional).
	 * @return {Property[]} - An array of properties that match the specified criteria.
	 */
	module.findProperties = function (baseProperty, recursion, callback, properties) {
		properties = properties || [];
		module.forEachProperty(baseProperty, function (property) {
			if (callback(property)) {
				properties.push(property);
			}

			if (recursion && module.isGroup(property)) {
				module.findProperties(property, recursion, callback, properties);
			}
		});

		return properties;
	};
	/**
	 * Retrieves the name(s) from an array of property objects.
	 * If the array contains two properties, it concatenates both names with '_'.
	 * Otherwise, it returns the name of the first property.
	 *
	 * @param {Array} properties - An array of property objects, each having a 'name' property.
	 * @returns {string} - The concatenated property name(s).
	 * 
	 * @example
	 * var singleProp = [{name: 'Width'}];
	 * console.log(getPropertyName(singleProp)); // Output: "Width"
	 *
	 * var doubleProp = [{name: 'Width'}, {name: 'Height'}];
	 * console.log(getPropertyName(doubleProp)); // Output: "Width - Height"
	 */
	module.getPropName  = function (properties) {
		if (properties.length === 2) {
			return properties[0].name + "_" + properties[1].name;
		} else {
			return properties[0].name;
		}
	}
	/**
	 * Finds an item within the base folder that matches the specified criteria.
	 *
	 * @param {FolderItem} baseFolder - The base folder to search within.
	 * @param {Function} callback - The callback function to determine if an item matches the criteria.
	 * @return {Item} - The found item that matches the specified criteria.
	 */
	module.findItem = function (baseFolder, callback) {
		for (var i = 1, il = baseFolder.numItems; i <= il; i++) {
			if (callback(baseFolder.item(i))) {
				return baseFolder.item(i);
			}
		}
	};
/**
 * Retrieves the first selected property from the currently active composition and layer.
 * @returns {(Object|null)} - The first selected property object, or null if not found.
 */
	module.retrieveProp = function () {
		var comp = app.project.activeItem;
		if (comp !== null && (comp instanceof CompItem)) {
			var layers = comp.selectedLayers;
			if (layers.length > 0) {
				var selectedLayer = layers[0];
				var selectedProperties = selectedLayer.selectedProperties;
				if (selectedProperties.length > 0) {
					return selectedProperties[selectedProperties.length - 1];
				}
			}
		}
		return null;  // Return null if no property is selected
	};

 return module;
})();
//========== END OF INCLUDED FUNCTIONS ============//

// @include 'modules/Ae.js'
// @include 'modules/ArrayEx.js'

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
    app.beginUndoGroup("Create Controls");
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
    var selectedProperties = app.project.activeItem.selectedLayers[0].selectedProperties;
    var layer = getSelectedLayer();
    var propName = Ae.getPropName(selectedProperties);
    var propAddress = Ae.retrieveProp();
    alert(propAddress.toString())
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
            var propAddress = getSelectedProperty();
            handle1DProperty(layer, propName, audioReactorName, propAddress)
            break;
    }
};
app.endUndoGroup();

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
function handle1DProperty(layer, propName, audioReactorName, propAddress) {
    var propLink = propAddress;
    // Create Easing dropdown
    var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
    var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
    var setDropDownParams = easingDropdown.property(1).setPropertyParameters(dropDownParams);
    setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";

    // Create Min and Max sliders
    var minSlider = layer.Effects.addProperty("ADBE Slider Control");
    minSlider.name = propName + "_Min Output";
    var maxSlider = layer.Effects.addProperty("ADBE Slider Control");
    maxSlider.name = propName + "_Max Output";

    
    if (propLink) {
        var expressionString = build1DExpression(audioReactorName, propName);
        propLink.expression = expressionString;
    } else {
        alert("Failed to update the expression. Property address could not be retrieved.");
    }
}

function build1DExpression( audioReactorName, propName){
    // Create the expression
    var expressionString = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");' + "\n"
        + 'iMin = 0;' + "\n"
        + 'iMax = 100;' + "\n"
        + 'ctrlLayer = thisLayer;' + "\n"
        + 'easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;' + "\n"
        + 'outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");' + "\n"
        + 'outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");' + "\n"
        + 'if (easeType == 1) linear(d, iMin, iMax, outMin, outMax);' + "\n"
        + 'else if (easeType == 2) easeIn(d, iMin, iMax, outMin, outMax);' + "\n"
        + 'else if (easeType == 3) easeOut(d, iMin, iMax, outMin, outMax);' + "\n"
        + 'else ease(d, iMin, iMax, outMin, outMax);';
}

/**
 * Adds controls and an expression to a given 2D property layer in After Effects.
 *
 * @param {Object} layer - The After Effects layer the property belongs to.
 * @param {boolean} xSelected - Whether the x-axis is selected for modification.
 * @param {boolean} ySelected - Whether the y-axis is selected for modification.
 * @param {boolean} isUnified - Determines if controls for X and Y axis should be unified.
 * @param {string} propName - The name of the property being modified.
 * @param {string} audioReactorName - The name of the audio reactor layer in the composition.
 * @param {Object} selectedProp - The After Effects property to apply the expression to.
 * 
 * @example
 * // Adds a dropdown control, sliders, and an expression to a position property in layer `myLayer`.
 * handle2DProperty(myLayer, true, false, true, "Position", "AudioReactorLayer", myLayer.property("Position"));
 */
function handle2DProperty(layer, xSelected, ySelected, isUnified, propName, audioReactorName, selectedProp) {
    // Add Easing dropdown
    var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
    var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
    var setDropDownParams = dropdown.property(1).setPropertyParameters(dropDownParams);
    setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";

    if (isUnified) {
        // Unified sliders for Min and Max Output
        var outMinSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMinSlider.name = propName + "_Min Output";

        var outMaxSlider = layer.Effects.addProperty("ADBE Slider Control");
        outMaxSlider.name = propName + "_Max Output";
    } else {
        if (!xSelected && !ySelected) {
            // Create individual sliders for X and Y Min and Max Output
            var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
            outMinXSlider.name = propName + "_Min Output X";

            var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
            outMaxXSlider.name = propName + "_Max Output X";

            var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
            outMinYSlider.name = propName + "_Min Output Y";

            var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
            outMaxYSlider.name = propName + "_Max Output Y";
        } else {
            // Individual sliders for X and Y Min and Max Output
            if (xSelected) {
                var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
                outMinXSlider.name = propName + "_Min Output X";

                var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
                outMaxXSlider.name = propName + "_Max Output X";
            }

            if (ySelected) {
                var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
                outMinYSlider.name = propName + "_Min Output Y";

                var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
                outMaxYSlider.name = propName + "_Max Output Y";
            }
        }
    }

    // Build the expression based on the selections
    var expression = build2DExpression(xSelected, ySelected, isUnified, propName, audioReactorName);

    // Apply the expression to the selected property
    selectedProp.expression = expression;
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

    var commonEasingLogic = '(easeType == 1 ? linear(d, iMin, iMax, outMin, outMax) : ' +
        '(easeType == 2 ? easeIn(d, iMin, iMax, outMin, outMax) : ' +
        '(easeType == 3 ? easeOut(d, iMin, iMax, outMin, outMax) : ' +
        'ease(d, iMin, iMax, outMin, outMax))))';

    var finalExpression = expressionBase + easingExpressionBase;

    if (isUnified || (!xSelected && !ySelected) || (xSelected && ySelected)) {
        finalExpression += 'outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");\n';
        finalExpression += 'outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");\n';
        finalExpression += 'xResult = yResult = ' + commonEasingLogic + ';\n';
    } else {
        if (xSelected) {
            finalExpression += 'outMin = ctrlLayer.effect("' + propName + '_Min Output X")("Slider");\n';
            finalExpression += 'outMax = ctrlLayer.effect("' + propName + '_Max Output X")("Slider");\n';
            finalExpression += 'xResult = ' + commonEasingLogic + ';\n';
            finalExpression += 'yResult = originalValue[1];\n';
        }

        if (ySelected) {
            finalExpression += 'outMin = ctrlLayer.effect("' + propName + '_Min Output Y")("Slider");\n';
            finalExpression += 'outMax = ctrlLayer.effect("' + propName + '_Max Output Y")("Slider");\n';
            finalExpression += 'yResult = ' + commonEasingLogic + ';\n';
            finalExpression += 'xResult = originalValue[0];\n';
        }
    }

    finalExpression += '[xResult, yResult];';
    return finalExpression;
}



/**
 * Adds controls and an expression to a given 3D property layer in After Effects.
 *
 * @param {Object} layer - The After Effects layer the property belongs to.
 * @param {boolean} xSelected - Whether the x-axis is selected for modification.
 * @param {boolean} ySelected - Whether the y-axis is selected for modification.
 * @param {boolean} zSelected - Whether the z-axis is selected for modification.
 * @param {boolean} isUnified - Determines if controls for X, Y, and Z axes should be unified.
 * @param {string} propName - The name of the property being modified.
 * @param {string} audioReactorName - The name of the audio reactor layer in the composition.
 * @param {Object} selectedProp - The After Effects property to apply the expression to.
 *
 * @example
 * // Adds a dropdown control, sliders, and an expression to a 3D position property in layer `myLayer`.
 * handle3DProperty(myLayer, true, true, false, true, "Position", "AudioReactorLayer", myLayer.property("Position"));
 */
function handle3DProperty(layer, xSelected, ySelected, zSelected, isUnified, propName, audioReactorName, selectedProp) {
    // Add Easing dropdown
    var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
    var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
    var setDropDownParams = dropdown.property(1).setPropertyParameters(dropDownParams);
    setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";

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
    
    selectedProp.expression = expression;
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
 * Gets the the first selected property from the first selected layer in the active composition.
 * 
 * @returns {object} The name of the first selected property if one exists, otherwise null.
 * 
 * @example
 * const prop = getSelectedProperty();
 * if (prop !== null) {
 *   // Do something with the property name
 * } else {
 *   // No property is selected or no composition/layer is active
 * }
 */
function getSelectedProperty() {
    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
        var layer = comp.selectedLayers[0];
        if (layer.selectedProperties.length > 0) {
            return layer.selectedProperties[0];
        }
    }
    return null;
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
 * Gets the property value type ('1D', '2D', '3D') based on the selected layer and property in the active composition.
 *
 * @typedef {'1D'|'2D'|'3D'} PropertyValueType
 * 
 * @returns {string} The type of the property value: '1D', '2D', '3D', or 'Unknown' if unable to determine.
 *
 * @example
 * var type = getPropertyType();
 * console.log(type); // Output might be '1D', '2D', '3D', or 'Unknown'
 */

function getPropertyType() {
    /**
     * @typedef {'1D'|'2D'|'3D'} PropertyValueType
     */

    var comp = app.project.activeItem;
    if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
        var layer = comp.selectedLayers[0];
        if (layer.selectedProperties.length > 0) {
            var prop = layer.selectedProperties[0];
            if (prop.propertyValueType !== undefined) {
                var layerType = layer.threeDLayer ? '3D' : '2D';
                var valueType = '';

                switch (prop.propertyValueType) {
                    case PropertyValueType.OneD:
                        valueType = '1D';
                        break;
                    case PropertyValueType.TwoD_SPATIAL:
                    case PropertyValueType.TwoD:
                    case PropertyValueType.ThreeD_SPATIAL:
                    case PropertyValueType.ThreeD:
                        valueType = layerType;
                        break;
                    default:
                        valueType = 'Unknown';
                }

                return valueType;
            }
        }
    }

    return 'Unknown';
}

function XYUnifyDialog(layer, propName, audioReactorName) {
    var dialog = new Window('dialog', 'XY Unify');

    // Parent group with row alignment
    var parentGroup = dialog.add('group');
    parentGroup.orientation = 'row';
    parentGroup.alignment = 'center';

    // First column for X
    var xGroup = parentGroup.add('group');
    xGroup.orientation = 'column';
    xGroup.alignment = 'center';
    var xCheckBox = xGroup.add('checkbox', undefined, '');
    xGroup.add('statictext', undefined, 'X').justify = 'center';

    // Second column for Y
    var yGroup = parentGroup.add('group');
    yGroup.orientation = 'column';
    yGroup.alignment = 'center';
    var yCheckBox = yGroup.add('checkbox', undefined, '');
    yGroup.add('statictext', undefined, 'Y').justify = 'center';

    // Third column for Unified
    var unifiedGroup = parentGroup.add('group');
    unifiedGroup.orientation = 'column';
    unifiedGroup.alignment = 'center';
    var unifiedCheckBox = unifiedGroup.add('checkbox', undefined, '');
    var unifiedLabel = unifiedGroup.add('statictext', undefined, 'Unify Properties');
    unifiedLabel.justify = 'center';
    unifiedLabel.multiline = true;  // Set to multiline

    // Fourth Line: OK/Cancel buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.add('button', undefined, 'OK').onClick = function () {
        var prop = getSelectedProperty();
        handle2DProperty(layer, xCheckBox.value, yCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, prop);
        dialog.close();
    };
    buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
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
    var unifiedCheckBox = dialog.add('checkbox', undefined, 'Unified/Individual');

    dialog.add('button', undefined, 'OK').onClick = function () {
        var prop = getSelectedProperty();
        handle3DProperty(layer, xCheckBox.value, yCheckBox.value, zCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, prop);
        dialog.close();
    };

    dialog.add('button', undefined, 'Cancel').onClick = function () {
        dialog.close();
    };

    dialog.show();
}