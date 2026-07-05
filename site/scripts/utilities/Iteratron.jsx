/**
 * Iteratron - Advanced Property Value Distribution and Interpolation System
 *
 * @name Iteratron
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 *
 * @changelog
 * • 2026-07-04 (2.0.1): Guard app.project.activeItem in the start/end/OK handlers so a
 *   missing or non-CompItem active item shows a friendly alert and exits cleanly instead
 *   of throwing an uncaught error (added getActiveComp() helper).
 * 
 * @description
 * A sophisticated property interpolation tool that creates smooth value transitions between
 * layers by automatically calculating and applying incremental property changes. This
 * advanced workflow utility enables precise control over property progression across
 * multiple layers, making it invaluable for creating complex animations, organizing
 * layer hierarchies, and establishing mathematical relationships between layer properties.
 * 
 * @functionality
 * • Interactive property selection system with visual feedback indicators
 * • Advanced mathematical interpolation between start and end property values
 * • Multi-dimensional property support (1D, 2D, 3D, and color properties)
 * • Intelligent layer validation system excluding locked and hidden layers
 * • Bidirectional processing supporting both ascending and descending layer orders
 * • Smart keyframe detection with automatic setValue vs setValueAtTime selection
 * • Real-time property path construction and validation
 * • Comprehensive error handling with detailed user feedback
 * • Current timeline time integration for keyframe-based properties
 * • Full undo group support for safe operation reversal
 * 
 * @usage
 * 1. Prepare your composition with multiple layers containing the same property type
 * 2. Run the Iteratron script to open the property linking dialog
 * 3. Select the start layer and click "Link Start Property" (red circle button)
 *    - Select the specific property you want to use as the starting value
 *    - The button turns green when a valid property is selected
 * 4. Select the end layer and click "Link End Property" (red circle button)  
 *    - Select the same property type on a different layer
 *    - The button turns green when a valid property is selected
 * 5. Click "OK" to execute the property distribution:
 *    - The script calculates incremental steps between start and end values
 *    - All valid layers between start and end get interpolated values
 *    - Locked and hidden layers are automatically skipped
 * 6. The property values will be smoothly distributed across the selected layer range
 * 7. Use Undo (Ctrl+Z / Cmd+Z) if you need to reverse the operation
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with at least 3 layers (start, middle, and end layers)
 * • Layers containing compatible properties (Position, Scale, Rotation, Color, etc.)
 * • Valid layer selection with accessible and unlocked intermediate layers
 * 
 * @notes
 * • The system works with any animatable property that returns numerical values
 * • Layer processing automatically excludes locked, hidden, or invalid layers from calculations
 * • The script supports both forward (1→10) and reverse (10→1) layer index processing
 * • Keyframe detection automatically determines the appropriate value-setting method
 * • Property path construction uses both matchName and name for maximum compatibility
 * • Mathematical interpolation ensures smooth value distribution regardless of layer count
 * • The system preserves existing keyframe timing while updating values at current time
 * • Multi-dimensional properties (Position, Scale) are processed component-wise for accuracy
 */


/*********** Initialize the UI ***********/
var myPanel = new Window("palette", "Iteratron", undefined);
myPanel.orientation = "column";

var startGroup = myPanel.add("group", undefined, "startGroup");
startGroup.orientation = "row";
var startText = startGroup.add("statictext", undefined, "Link Start Property");
startText.preferredSize = [100, 25];  // Width, Height
var startButton = startGroup.add("button", undefined, "⚪️");  // Open lock icon
startButton.preferredSize = [75, 25];  // Width, Height

var endGroup = myPanel.add("group", undefined, "endGroup");
endGroup.orientation = "row";
var endText = endGroup.add("statictext", undefined, "Link End Property");
endText.preferredSize = [100, 25];  // Width, Height
var endButton = endGroup.add("button", undefined, "⚪️");  // Open lock icon
endButton.preferredSize = [75, 25];  // Width, Height

var okCancelGroup = myPanel.add("group", undefined, "okCancelGroup");
okCancelGroup.orientation = "row";
var okButton = okCancelGroup.add("button", undefined, "OK");
var cancelButton = okCancelGroup.add("button", undefined, "Cancel");

// Initialize variables to store layer and property data
var startLayerIndex, startPropertyPath = [];
var endLayerIndex, endPropertyPath = [];


startButton.onClick = function () {
	var curComp = getActiveComp();
	if (!curComp) {
		return;
	}
	var selectedProperties = curComp.selectedProperties;
	var deepestProperty = findDeepestSelectedProp(selectedProperties);

	if (deepestProperty) {
		startLayerIndex = curComp.selectedLayers[0].index;;
		startPropertyPath = constructPropPathString(selectedProperties);
		startButton.text = '🟢';  // Green circle emoji
	} else {
		alert("Please select a property on the start layer.");
	}
};

endButton.onClick = function () {
	var curComp = getActiveComp();
	if (!curComp) {
		return;
	}
	var selectedProperties = curComp.selectedProperties;
	var deepestProperty = findDeepestSelectedProp(selectedProperties);

	if (deepestProperty) {
		endLayerIndex = curComp.selectedLayers[0].index;
		endPropertyPath = constructPropPathString(selectedProperties);
		endButton.text = '🟢';  // Green circle emoji
	} else {
		alert("Please select a property on the end layer.");
	}
};

okButton.onClick = function () {
	var curComp = getActiveComp();
	if (!curComp) {
		return;
	}
	app.beginUndoGroup("Link Properties");

	var currentTime = curComp.time;
	var startProperty = getPropertyFromPath(curComp.layer(startLayerIndex), startPropertyPath);
	var endProperty = getPropertyFromPath(curComp.layer(endLayerIndex), endPropertyPath);

	if (!startProperty || !endProperty) {
		alert("Invalid start or end property. Please make sure both are selected.");
		return; // Keep the palette open by simply returning from the function
	}

	// Validate start and end layers
	var startLayer = curComp.layer(startLayerIndex);
	var endLayer = curComp.layer(endLayerIndex);

	if (startLayer.locked || !startLayer.enabled || endLayer.locked || !endLayer.enabled) {
		alert("Start or end layer is locked or hidden. Please select valid layers.");
		return;
	}

	if (startProperty && endProperty) {
		var minIndex = Math.min(startLayerIndex, endLayerIndex);
		var maxIndex = Math.max(startLayerIndex, endLayerIndex);
		var numLayers = 0;

		// Count valid layers and prepare step values
		for (var i = minIndex + 1; i < maxIndex; i++) {
			var layer = curComp.layer(i);
			if (!layer.locked && layer.enabled) {
				numLayers++;
			}
		}

		if (numLayers <= 0) {
			alert("No valid layers found between start and end layers.");
			return;
		}

		var stepValue;
		if (is_array(startProperty.value)) {
			stepValue = [];
			for (var j = 0; j < startProperty.value.length; j++) {
				stepValue[j] = (endProperty.value[j] - startProperty.value[j]) / (numLayers + 1);
			}
		} else {
			stepValue = (endProperty.value - startProperty.value) / (numLayers + 1);
		}

		// Iterate over valid layers
		var direction = (startLayerIndex < endLayerIndex) ? 1 : -1;
		var validLayerCounter = 0;

		for (var i = minIndex + 1; i < maxIndex; i++) {
			var curLayer = curComp.layer(i);

			if (!curLayer.locked && curLayer.enabled) {
				validLayerCounter++;
				var curProperty = getPropertyFromPath(curLayer, startPropertyPath);

				if (curProperty && curProperty.canVaryOverTime) {
					var newValue;
					if (is_array(stepValue)) {
						newValue = [];
						for (var j = 0; j < stepValue.length; j++) {
							newValue[j] = startProperty.value[j] + (stepValue[j] * validLayerCounter);
						}
					} else {
						newValue = startProperty.value + (stepValue * validLayerCounter);
					}

					if (isFinite(newValue) || (is_array(newValue) && allFinite(newValue))) {
						if (curProperty.numKeys > 0) {
							curProperty.setValueAtTime(currentTime, newValue);
						} else {
							curProperty.setValue(newValue);
						}
					} else {
						alert("Invalid numeric result. Please check your selected properties.");
					}
				}
			}
		}
	} else {
		alert("Invalid start or end property. Please make sure both are selected.");
	}

	app.endUndoGroup();
	myPanel.close();
};


cancelButton.onClick = function () {
	myPanel.close();
};

// Show the UI
myPanel.center();
myPanel.show();


/*********** HELPER FUNCTIONS ***********/
/**
 * Returns the active item only if it is a CompItem, otherwise alerts and returns null.
 * Guards against app.project.activeItem being null (no active comp) or a non-CompItem
 * (e.g. a FootageItem or FolderItem selected in the Project panel), either of which
 * would otherwise throw an uncaught error when comp-only members are dereferenced.
 *
 * @returns {CompItem|null} The active composition, or null if none is active.
 */
function getActiveComp() {
	var item = app.project.activeItem;
	if (!item || !(item instanceof CompItem)) {
		alert("Please open or select a composition before using Iteratron.");
		return null;
	}
	return item;
};

/**
 * Checks if a given value is an array.
 * 
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is an array, false otherwise.
 * 
 * @example
 * var result = is_array([1, 2, 3]);
 * // returns: true
 */
function is_array(value) {
	return Object.prototype.toString.call(value) === '[object Array]';
};

/**
 * Checks if all values in an array are finite numbers.
 * 
 * @param {Array} arr - The array to check.
 * @returns {boolean} True if all values are finite numbers, false otherwise.
 * 
 * @example
 * var result = allFinite([1, 2, 3]);
 * // returns: true
 */
function allFinite(arr) {
	for (var i = 0; i < arr.length; i++) {
		if (!isFinite(arr[i])) {
			return false;
		}
	}
	return true;
};

/**
 * Finds the deepest selected property or property group from an array of selected properties.
 * 
 * @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
 * 
 * @example
 * var deepest = findDeepestSelectedProp(app.project.activeItem.selectedProperties);
 * // returns: Property object or null
 */
function findDeepestSelectedProp(selectedProperties) {
	var deepestProp, numDeepestProps = 0, deepestPropDepth = 0;
	var prop;

	for (var i = 0; i < selectedProperties.length; i++) {
		prop = selectedProperties[i];

		if (prop.propertyDepth >= deepestPropDepth) {
			if (prop.propertyDepth > deepestPropDepth)
				numDeepestProps = 0;
			deepestProp = prop;
			numDeepestProps++;
			deepestPropDepth = prop.propertyDepth;
		}
	}

	return (numDeepestProps > 1) ? null : deepestProp;
};

/**
 * Gets a property based on a given layer and property path string.
 * 
 * @param {Layer} layer - The layer to start from.
 * @param {string} propertyPath - The string representing the property path.
 * @returns {Property|PropertyGroup|null} The found property or property group, or null if not found.
 * 
 * @example
 * var prop = getPropertyFromPath(app.project.activeItem.layer(1), "Position");
 * // returns: Property object or null
 */
function getPropertyFromPath(layer, propertyPath) {
	if (!layer || !propertyPath) {
		return null;
	}

	if (typeof propertyPath === 'string') {
		var path = propertyPath.split(',');
		var prop = layer;

		for (var i = 0; i < path.length; i++) {
			prop = prop.property(path[i]);
			if (!prop) {
				return null;
			}
		}

		return prop;
	} else {
		alert("Invalid property path.");
		return null;
	}
};

/**
* Constructs a property path string based on an array of selected properties.
* 
* @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
* @returns {string|null} The constructed property path string, or null if it cannot be constructed.
* 
* @example
* var path = constructPropPathString(app.project.activeItem.selectedProperties);
* // returns: "ADBE Transform Group,ADBE Position"
*/
function constructPropPathString(selectedProperties) {
	var prop = findDeepestSelectedProp(selectedProperties);
	if (prop === null) {
		return;
	}

	var propPathArray = [];
	var name;

	while (prop.parentProperty !== null) {
		name = prop.matchName !== "" ? prop.matchName : prop.name;
		//alert("Name: " + name); // Debugging line
		propPathArray.unshift(name);
		prop = prop.parentProperty;
	}

	return propPathArray.join(',');
};

