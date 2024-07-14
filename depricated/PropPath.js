/**
 * @module PropPath
 * @exports PropPath
 * @description Retrieves property information based on specified parameters.
 * Provides both a main function for general property path retrieval and individual modules for more specific tasks.
 * 
 * @example
 * // Usage 1: Use main function with 'propString' and 'stringArgs'
 * const result1 = PropPath(selectedProps, 'propString', { useNames: true });
 * 
 * @example
 * // Usage 2: Use individual module 'showDeepestSelectedProperty'
 * const deepestProperty = PropPath.showDeepestSelectedProperty(selectedProps);
 * 
 * @example
 * // Usage 3: Use individual module 'collectPropertyHierarchyInfo'
 * const hierarchyInfo = PropPath.collectPropertyHierarchyInfo(selectedProp, 'hierarchy');
 * 
 * @example
 * // Usage 4: Use individual module 'constructPropertyPath'
 * const collectedHierarchy = [{name: "Position", matchName: "ADBE Position", propertyDepth: 1}, {name: "Layer 1", layerIndex: 1}];
 * const flags = { useNames: true };
 * const propertyPath = PropPath.constructPropertyPath(collectedHierarchy, flags);
 */
var PropPath = (function () {
	var module = {};

	/**
	 * @function showDeepestSelectedProperty
	 * @memberOf PropPath
	 * @description Finds the deepest selected property among the provided selected properties.
	 * @param {Object[]} selectedProperties - Array of selected properties from the After Effects composition.
	 * @returns {Object|null} - Returns the deepest selected property, or null if none found.
	 * @example
	 * // Usage: Use this module individually
	 * const deepestProperty = PropPath.showDeepestSelectedProperty(selectedProps);
	 */
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
	 * @function collectPropertyHierarchyInfo
	 * @memberOf PropPath
	 * @description Collects and returns property hierarchy or specific information based on the flag.
	 * @param {Object} prop - Property object from Adobe After Effects.
	 * @param {string} [flag] - Optional flag ('hierarchy', 'comp', 'layerName', 'layerMatchName', 'layerIndex').
	 * @returns {(Array<Object>|string|number)} - Array of property objects for 'hierarchy', or specific information based on the flag.
	 * @example
	 * // Usage: Use this module individually
	 * const hierarchyInfo = PropPath.collectPropertyHierarchyInfo(selectedProp, 'hierarchy');
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
	 * @function constructPropertyPath
	 * @memberOf PropPath
	 * @description Constructs an Adobe After Effects (AE) property path based on hierarchical property information.
	 * @param {Array<Object>} collectedHierarchy - Array of objects containing AE property information.
	 * @param {Object} flags - Flags to guide property path construction.
	 * @param {boolean} [flags.useNames=false] - Whether to use 'name' attributes for constructing the property path.
	 * @param {boolean} [flags.useMatchNames=false] - Whether to use 'matchName' attributes for constructing the property path.
	 * @param {boolean} [flags.useGroupIndices=false] - Whether to use group indices for constructing the property path.
	 * @returns {string} - Returns the constructed AE property path string.
	 * @example
	 * // Usage: Use this module individually
	 * const collectedHierarchy = [{name: "Position", matchName: "ADBE Position", propertyDepth: 1}, {name: "Layer 1", layerIndex: 1}];
	 * const flags = { useNames: true };
	 * const propertyPath = PropPath.constructPropertyPath(collectedHierarchy, flags);
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
	 * @function mainFunction
	 * @memberOf PropPath
	 * @description Main function of the PropPath module. Processes the selected property from Adobe After Effects.
	 * @param {Object} selectedProperty - Selected property object from Adobe After Effects.
	 * @param {string} returnType - Type of data to return ('propString' or 'propObject').
	 * @param {Object} [optionalArg] - Optional flags or other options.
	 * @returns {(string|Object)} - Returns either a string path or an object, based on the 'returnType'.
	 * @example
	 * // For 'propString' returnType
	 * const stringArgs = { 'useNames': true, 'useGroupIndices': true };
	 * const pathString = PropPath(selectedProperty, 'propString', stringArgs);
	 * // For 'propObject' returnType
	 * const returnedObject = PropPath(selectedProperty, 'propObject');
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

	/** @lends PropPath */
	mainFunction.showDeepestSelectedProperty = module.showDeepestSelectedProperty;
	mainFunction.collectPropertyHierarchyInfo = module.collectPropertyHierarchyInfo;
	mainFunction.constructPropertyPath = module.constructPropertyPath;

	return mainFunction;

})();

// // /*********************TESTER MODULE**********************/
	// function testPropPathModule() {
	// 	var comp = app.project.activeItem;
	// 	if (comp && comp instanceof CompItem) {
	// 		var selectedProperties = comp.selectedProperties;
	// 		if (selectedProperties.length === 0) {
	// 			alert('No property selected.');
	// 			return;
	// 		}

	// 		// Create the palette
	// 		var win = new Window('palette', 'Property Info', undefined, { resizeable: true });
	// 		win.orientation = 'column';

	// 		// Create the text area
	// 		var textArea = win.add('edittext', undefined, '', {
	// 			multiline: true,
	// 			scrolling: true
	// 		});
	// 		textArea.size = [500, 200];

	// 		win.onResizing = win.onResize = function () {
	// 			this.layout.resize();
	// 			textArea.size = [this.size[0] - 30, this.size[1] - 40];
	// 		};
			
	// 		// var propObj = PropPath(selectedProperties, "propObject",null, 'layerIndex');
	// 		// textArea.text += 'Prop Object: ' + propObj + '\n';	
			
	// 		//TEST ALL POSSIBLE COMBINATIONS
	// 		var stringArgCombo = [
	// 			{ useNames: true },
	// 			{ useNames: true, useGroupIndices: true },
	// 			{ useMatchNames: true },
	// 			{ useMatchNames: true, useGroupIndices: true }
	// 		];

	// 		var propObjFlags = ['hierarchy', 'comp', 'layerName', 'layerMatchName', 'layerIndex'];
	// 		var result = PropPath(selectedProperties, "propObject");
	// 		textArea.text = result;

	// 		// Show the palette
	// 		win.layout.layout(true);
	// 		win.center();
	// 		win.show();
	// 	} else {
	// 		alert('No composition is currently active.');
	// 	}
	// }

	// // // Run the test in After Effects
	// // testPropPathModule();


