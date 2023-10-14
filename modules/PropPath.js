/**
	 * PropPath Module: Retrieves property information based on specified parameters.
	 *
	 * @module PropPath
	 * @function
	 * @param {Object} selectedProperty - The selected property from the After Effects composition.
	 * @param {('propString'|'propObject')} returnType - Determines the type of data to return. 
	 *   - 'propString': Will return a string representation.
	 *   - 'propObject': Will return an object. If no optional arguments are provided, returns the deepest property object.
	 * @param {Object} [stringArgs] - Optional when returnType is 'propString'. 
	 *   Guides the string construction.
	 *   - { useNames: true }
	 *   - { useNames: true, useGroupIndices: true }
	 *   - { useMatchNames: true }
	 *   - { useMatchNames: true, useGroupIndices: true }
	 * @param {string} [infoFlag] - Optional when returnType is 'propObject'. 
	 *   Specifies which additional information to retrieve.
	 *   - 'hierarchy'
	 *   - 'comp'
	 *   - 'layerName'
	 *   - 'layerMatchName'
	 *   - 'layerIndex'
	 * @returns {string|Object} - Returns either a string or an object based on returnType.
	 *   - If 'propString' is selected, returns a string. 
	 *   - If 'propObject' is selected, returns an object. If 'infoFlag' is provided, returns specific information based on the flag.
	 *   - If 'propObject' is selected and no optional arguments are provided, returns the deepest property object.
	 * 
	 * @example
	 * // Usage 1: With 'propString' and 'stringArgs'
	 * PropPath(selectedProperties, 'propString', { useNames: true });
	 *
	 * @example
	 * // Usage 2: With 'propObject' and 'infoFlag'
	 * PropPath(selectedProperties, 'propObject', null, 'layerIndex');
	 * 
	 * @example
	 * // Usage 3: With 'propObject' only
	 * PropPath(selectedProperties, 'propObject');
	 * 
	 */
var PropPath = (function () {
	var module = {};
	
	module.showDeepestSelectedProperty = function (selectedProperties) {
		if (selectedProperties.length === 1) {
			return selectedProperties[0]; // Directly return if only one property is selected
		}

		if (selectedProperties.length > 1) {
			var deepestProp = null;
			var deepestPropDepth = 0;

			for (var i = 0; i < selectedProperties.length; i++) {
				var prop = selectedProperties[i];

				if (prop.propertyDepth > deepestPropDepth) {
					deepestProp = prop;
					deepestPropDepth = prop.propertyDepth;
				}
			}
			return deepestProp;
		}
	};
	

	/**
	 * Collects and returns property hierarchy or specific information based on the flag.
	 * 
	 * @param {Object} prop - Property object in Adobe After Effects.
	 * @param {string} [flag] - Optional flag to specify what to return ('hierarchy', 'comp', 'layerName', 'layerMatchName', 'layerIndex').
	 * 
	 * @returns {(Array<Object>|string|number)} - Array of property objects for 'hierarchy' or string/number based on the flag.
	 */
	module.collectPropertyHierarchyInfo = function (prop, flag) {
		var propInfo = []; // Array to store property hierarchy information

		// Loop to collect parent properties
		while (prop && prop.parentProperty) {
			// Create an object with information about the current property
			var info = {
				name: prop.name,
				matchName: prop.matchName,
				propertyDepth: prop.propertyIndex
			};
			propInfo.push(info);

			// Move up to the parent property for the next iteration
			prop = prop.parentProperty;
		}

		// Add consolidated layer info
		if (prop && prop.containingComp) {
			var layerInfo = {
				name: prop.name,
				matchName: prop.matchName,
				layerIndex: prop.index,
				containingComp: prop.containingComp.name
			};
			propInfo.push(layerInfo);
		}

		// Return based on the flag
		if (flag) {
			var lastInfo = propInfo[propInfo.length - 1];

			switch (flag) {
				case 'comp':
					return lastInfo.containingComp;
				case 'layerName':
					return lastInfo.name;
				case 'layerMatchName':
					return lastInfo.matchName;
				case 'layerIndex':
					return lastInfo.layerIndex;
				case 'hierarchy':
					return propInfo;
				default:
					throw new Error("Invalid flag provided");
			}
		} else {
			return propInfo;
		}
	};
	
	/**
	 * Constructs an Adobe After Effects (AE) property path based on hierarchical property information.
	 * 
	 * @param {Array<Object>} collectedHierarchy - An array of objects containing AE property information.
	 * The last object in the array is assumed to contain layer information.
	 * Objects must contain keys 'name' and may optionally have 'matchName', 'propertyDepth', and 'layerIndex'.
	 * 
	 * @param {Object} flags - An object containing flags to guide the property path construction.
	 * @param {boolean} [flags.useNames=false] - Use 'name' attributes for constructing the property path.
	 * @param {boolean} [flags.useMatchNames=false] - Use 'matchName' attributes for constructing the property path.
	 * @param {boolean} [flags.useGroupIndices=false] - Use group indices for constructing the property path.
	 *
	 * @throws {Error} Throws an error if the layer information is not found in collectedHierarchy.
	 *
	 * @returns {string} Returns the constructed AE property path string based on the provided hierarchical information and flags.
	 *
	 * @example
	 * // Example with useNames flag set to true
	 * const collectedHierarchy = [{name: "Position", matchName: "ADBE Position", propertyDepth: 1}, {name: "Layer 1", layerIndex: 1}];
	 * const flags = { useNames: true };
	 * const propertyPath = constructPropertyPath(collectedHierarchy, flags);
	 * // Output would be 'layer(1).property("Position")'
	 */

	module.constructPropertyPath = function (collectedHierarchy, flags) {
		var useNames = flags.useNames || false;
		var useMatchNames = flags.useMatchNames || false;
		var useGroupIndices = flags.useGroupIndices || false;

		var propertyPath = '';

		// Process layer information first
		var layerInfo = collectedHierarchy[collectedHierarchy.length - 1];

		if (!layerInfo) {
			throw new Error("Layer information not found in collectedHierarchy.");
		}

		if (useGroupIndices) {
			propertyPath += 'layer(' + layerInfo.layerIndex + ')';
		} else {
			propertyPath += 'layer("' + layerInfo.name + '")';
		}

		// Process remaining property information
		for (var i = collectedHierarchy.length - 2; i >= 0; i--) {
			var info = collectedHierarchy[i];
			var part = '';

			// For the deepest property, use either matchName or name, never index
			if (i === 0) {
				if (useMatchNames) {
					part = 'property("' + info.matchName + '")';
				} else if (useNames) {
					part = 'property("' + info.name + '")';
				}
			} else {
				if (useGroupIndices && info.name !== "Contents") {
					part = 'property(' + info.propertyDepth + ')';
				} else if (useMatchNames) {
					part = 'property("' + info.matchName + '")';
				} else if (useNames) {
					part = 'property("' + info.name + '")';
				}
			}

			if (part) {
				propertyPath += '.' + part;
			}
		}

		return propertyPath;
	};
	
	/**
	 * Main function of the GimmeProp module. Processes the selected property from Adobe After Effects 
	 * to either return its path as a string or to return the deepest nested selected property object.
	 * 
	 * When returnType is 'string', the function constructs a string path based on the provided flags in stringArgs.
	 * When returnType is 'obj', the function returns the deepest selected property object.
	 *
	 * @param {Object} selectedProperty - The Adobe After Effects selected property object.
	 * @param {string} returnType - Specifies the type of data to return ('string' or 'obj').
	 * @param {Object} [stringArgs] - An optional argument containing flags to customize the returned path string.
	 * @param {boolean} [stringArgs.useNames=false] - Use the 'name' attributes when constructing the property path.
	 * @param {boolean} [stringArgs.useMatchNames=false] - Use the 'matchName' attributes when constructing the property path.
	 * @param {boolean} [stringArgs.useGroupIndices=false] - Use group indices for constructing the property path.
	 *
	 * @returns {(string|Object)} Returns either a string path or an object, based on the 'returnType'.
	 *
	 * @example
	 * // For 'string' returnType
	 * const stringArgs = { 'useNames': true, 'useGroupIndices': true };
	 * const pathString = GimmeProp(selectedProperty, 'string', stringArgs);
	 * console.log(pathString);  // Outputs the string path.
	 * 
	 * // For 'obj' returnType
	 * const returnedObject = GimmeProp(selectedProperty, 'obj');
	 * console.log(returnedObject);  // Outputs the deepest nested property object.
	 */
	var mainFunction = function (selectedProperty, returnType, optionalArg) {
		// Collect property hierarchy information or specific info based on the flag
		var deepestPropObject = module.showDeepestSelectedProperty(selectedProperty);

		if (returnType === 'propString') {
			if (typeof optionalArg !== 'undefined') {  // Check if optionalArg is provided
				var collectedInfo = module.collectPropertyHierarchyInfo(deepestPropObject);
				if (Array.isArray(collectedInfo)) {
					return module.constructPropertyPath(collectedInfo, optionalArg); // optionalArg is stringArgs here
				} else {
					throw new Error("Expected property hierarchy, but received different info.");
				}
			} else {
				throw new Error("stringArgs must be provided for returnType 'propString'.");
			}
		}

		if (returnType === 'propObject') {
			if (typeof optionalArg !== 'undefined') {  // Check if optionalArg is provided
				var collectedInfo = module.collectPropertyHierarchyInfo(deepestPropObject, optionalArg); // optionalArg is infoFlag here
				return collectedInfo;
			} else if (deepestPropObject) {  // Check for null or undefined
				return deepestPropObject;
			} else {
				return 'No deepest property found';  // Return some default value or message
			}
		}
	};

	return mainFunction;

})();
/*********************TESTER MODULE**********************/
function testPropPathModule() {
	var comp = app.project.activeItem;
	if (comp && comp instanceof CompItem) {
		var selectedProperties = comp.selectedProperties;
		if (selectedProperties.length === 0) {
			alert('No property selected.');
			return;
		}

		// Create the palette
		var win = new Window('palette', 'Property Info', undefined, { resizeable: true });
		win.orientation = 'column';

		// Create the text area
		var textArea = win.add('edittext', undefined, '', {
			multiline: true,
			scrolling: true
		});
		textArea.size = [500, 200];

		win.onResizing = win.onResize = function () {
			this.layout.resize();
			textArea.size = [this.size[0] - 30, this.size[1] - 40];
		};
		
		// var propObj = PropPath(selectedProperties, "propObject",null, 'layerIndex');
		// textArea.text += 'Prop Object: ' + propObj + '\n';	
		
		//TEST ALL POSSIBLE COMBINATIONS
		var stringArgCombo = [
			{ useNames: true },
			{ useNames: true, useGroupIndices: true },
			{ useMatchNames: true },
			{ useMatchNames: true, useGroupIndices: true }
		];

		var propObjFlags = ['hierarchy', 'comp', 'layerName', 'layerMatchName', 'layerIndex'];
		var result = PropPath(selectedProperties, "propObject");
		textArea.text = result;

		// Show the palette
		win.layout.layout(true);
		win.center();
		win.show();
	} else {
		alert('No composition is currently active.');
	}
}

// Run the test in After Effects
testPropPathModule();


