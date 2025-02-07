	/**
	 * Property Iterator in Adobe After Effects
	 *
	 * Provides a UI dialog that allows users to select a start property and an end property
	 * on different layers within the active composition. The script then increments
	 * the values of the same property on layers between the start and end layers.
	 *
	 * FUNCTIONALITY:
	 * - Provides a simple UI with two buttons for selecting start and end properties.
	 * - User can select any property like Position, Scale, or even Color.
	 * - Records the layer index and property values when the start and end properties are selected.
	 * - On clicking 'OK', iterates through the layers between start and end indices to apply incremental changes.
	 * - Supports 1D, 2D, 3D, and color properties.
	 * - Works even when the start layer index is greater than the end layer index.
	 * - Checks for keyframes; if they exist, it uses setValueAtTime, otherwise, uses setValue.
	 * - Provides real-time error handling and alerts for invalid selections.
	 * - Supports undo functionality.
	 *
	 * USAGE:
	 * 1. Open an active composition with multiple layers.
	 * 2. Run the script.
	 * 3. The UI dialog will appear. Use the buttons to select the start and end properties.
	 * 4. Click 'OK' to apply the incremental changes. An 'Undo' option is also available in After Effects.
	 *
	 * @author IVG Design
	 * @version 1.0.0
	 * @date 2023-10-11
	 * @changelog 
	 *  1.0.0	- Initial release
	 *          - Added support for multiple property types
	 *  1.1.0	- Added function to ignore hidden/locked layers when iterating
	 * @license Provided as is
	 */


	/*********** Initialize the UI ***********/
		var myPanel = new Window("palette", "Iterator", undefined);
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
			var curComp = app.project.activeItem;
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
			var curComp = app.project.activeItem;
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
	var curComp = app.project.activeItem;
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
		
