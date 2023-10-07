//========== INCLUDED FUNCTIONS ============//
var Ae = (function () {
 var module = {};
/**
	 * Finds a property in a given layer by its match name.
	 * The function searches recursively through property groups.
	 * 
	 * @param {PropertyGroup|Layer} propGroup - The After Effects Layer or PropertyGroup object in which to find the property.
	 * @param {string} matchName - The match name of the property to find.
	 * @returns {Property|PropertyGroup|null} - The found property or property group, or null if not found.
	 * 
	 * @example
	 * var layer = app.project.item(1).layer(1);
	 * var matchName = "ADBE Position";
	 * var property = Ae.findPropByMatchName(layer, matchName);
	 */
	module.findPropByMatchName = function (propGroup, matchName) {
		for (var i = 1; i <= propGroup.numProperties; i++) {
			var prop = propGroup.property(i);
			if (prop.matchName === matchName) {
				return prop;
			}
			if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
				var foundProp = module.findPropByMatchName(prop, matchName);
				if (foundProp) {
					return foundProp;
				}
			}
		}
		return null;
	};

	/**
		* Constructs a property path string based on the given array of selected properties.
		* 
		* @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
		* @returns {string|undefined} The property path string, or undefined if not applicable.
		* @example
		* var selectedProperties = app.project.activeItem.selectedProperties;
		* var propertyPath = Ae.constructPropPathString(selectedProperties);
		* alert(`The selected property path is: ${propertyPath}`);
		*/
	module.constructPropPathString = function (selectedProperties) {

		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
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
		}

		var prop = findDeepestSelectedProp();
		if (prop === null) {
			return;
		}

		var propPathString = "";
		var name;

		while (prop.parentProperty !== null) {
			name = "\"" + ((prop.matchName !== "") ? prop.matchName : prop.name) + "\"";
			propPathString = "(" + name + ")" + propPathString;
			prop = prop.parentProperty;
		}

		name = "\"" + prop.name + "\"";
		propPathString = "layer(" + name + ")" + propPathString;

		return propPathString;
	};
	
	/**
	 * Constructs a property path object based on the given array of selected properties.
	 * 
	 * @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
	 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
	 * @example
	 * var selectedProperties = app.project.activeItem.selectedProperties;
	 * var propertyObject = Ae.getDeepestSelectedProperty(selectedProperties);
	 * if (propertyObject && propertyObject.canSetExpression) {
	 *     propertyObject.expression = "your expression here";
	 * }
	 */
	module.getDeepestSelectedProperty = function (selectedProperties) {
		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
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
		}

		return findDeepestSelectedProp();
	};
	
	/**
	 * Determines the type of the deepest selected property from an array of selected properties.
	 * Checks whether the property is 1D, 2D, 3D, or Color by trying to set expressions and catching errors.
	 * 
	 * @param {Array} selectedProperties - An array of selected properties.
	 * @returns {string} The type of the deepest selected property ("1D", "2D", "3D", "Color", or "Unknown").
	 */
	
	module.checkPropertyType = function (selectedProperties) {
		var deepestProperty = this.getDeepestSelectedProperty(selectedProperties);

		if (!deepestProperty) {
			alert("No deepest property found!");
			return "Unknown";
		}

		var originalExpression = deepestProperty.expression;
		var propertyType = "Unknown";

		for (var i = 1; i <= 4; i++) {
			var testExpressionArray = [];
			for (var j = 0; j < i; j++) {
				testExpressionArray.push("value[" + j + "]");
			}
			var testExpression = "[" + testExpressionArray.join(", ") + "]";

			try {
				deepestProperty.expression = testExpression;

				// Check for expression error
				if (deepestProperty.expressionError === "") {
					// If it reaches here, the expression was successfully set
					if (i === 4) {
						propertyType = "Color";
					} else {
						propertyType = i + "D";
					}
				}
			} catch (e) {
				// Log the error if needed
			}
		}

		// Restore the original expression
		deepestProperty.expression = originalExpression;

		return propertyType;
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
	 * Finds a property in a given layer by its match name.
	 * The function searches recursively through property groups.
	 * 
	 * @param {PropertyGroup|Layer} propGroup - The After Effects Layer or PropertyGroup object in which to find the property.
	 * @param {string} matchName - The match name of the property to find.
	 * @returns {Property|PropertyGroup|null} - The found property or property group, or null if not found.
	 * 
	 * @example
	 * var layer = app.project.item(1).layer(1);
	 * var matchName = "ADBE Position";
	 * var property = Ae.findPropByMatchName(layer, matchName);
	 */
	module.findPropByMatchName = function (propGroup, matchName) {
		for (var i = 1; i <= propGroup.numProperties; i++) {
			var prop = propGroup.property(i);
			if (prop.matchName === matchName) {
				return prop;
			}
			if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
				var foundProp = module.findPropByMatchName(prop, matchName);
				if (foundProp) {
					return foundProp;
				}
			}
		}
		return null;
	};

	/**
		* Constructs a property path string based on the given array of selected properties.
		* 
		* @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
		* @returns {string|undefined} The property path string, or undefined if not applicable.
		* @example
		* var selectedProperties = app.project.activeItem.selectedProperties;
		* var propertyPath = Ae.constructPropPathString(selectedProperties);
		* alert(`The selected property path is: ${propertyPath}`);
		*/
	module.constructPropPathString = function (selectedProperties) {

		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
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
		}

		var prop = findDeepestSelectedProp();
		if (prop === null) {
			return;
		}

		var propPathString = "";
		var name;

		while (prop.parentProperty !== null) {
			name = "\"" + ((prop.matchName !== "") ? prop.matchName : prop.name) + "\"";
			propPathString = "(" + name + ")" + propPathString;
			prop = prop.parentProperty;
		}

		name = "\"" + prop.name + "\"";
		propPathString = "layer(" + name + ")" + propPathString;

		return propPathString;
	};
	
	/**
	 * Constructs a property path object based on the given array of selected properties.
	 * 
	 * @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
	 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
	 * @example
	 * var selectedProperties = app.project.activeItem.selectedProperties;
	 * var propertyObject = Ae.getDeepestSelectedProperty(selectedProperties);
	 * if (propertyObject && propertyObject.canSetExpression) {
	 *     propertyObject.expression = "your expression here";
	 * }
	 */
	module.getDeepestSelectedProperty = function (selectedProperties) {
		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
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
		}

		return findDeepestSelectedProp();
	};
/**
	 * Finds a property in a given layer by its match name.
	 * The function searches recursively through property groups.
	 * 
	 * @param {PropertyGroup|Layer} propGroup - The After Effects Layer or PropertyGroup object in which to find the property.
	 * @param {string} matchName - The match name of the property to find.
	 * @returns {Property|PropertyGroup|null} - The found property or property group, or null if not found.
	 * 
	 * @example
	 * var layer = app.project.item(1).layer(1);
	 * var matchName = "ADBE Position";
	 * var property = Ae.findPropByMatchName(layer, matchName);
	 */
	module.findPropByMatchName = function (propGroup, matchName) {
		for (var i = 1; i <= propGroup.numProperties; i++) {
			var prop = propGroup.property(i);
			if (prop.matchName === matchName) {
				return prop;
			}
			if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
				var foundProp = module.findPropByMatchName(prop, matchName);
				if (foundProp) {
					return foundProp;
				}
			}
		}
		return null;
	};

	/**
		* Constructs a property path string based on the given array of selected properties.
		* 
		* @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
		* @returns {string|undefined} The property path string, or undefined if not applicable.
		* @example
		* var selectedProperties = app.project.activeItem.selectedProperties;
		* var propertyPath = Ae.constructPropPathString(selectedProperties);
		* alert(`The selected property path is: ${propertyPath}`);
		*/
	module.constructPropPathString = function (selectedProperties) {

		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
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
		}

		var prop = findDeepestSelectedProp();
		if (prop === null) {
			return;
		}

		var propPathString = "";
		var name;

		while (prop.parentProperty !== null) {
			name = "\"" + ((prop.matchName !== "") ? prop.matchName : prop.name) + "\"";
			propPathString = "(" + name + ")" + propPathString;
			prop = prop.parentProperty;
		}

		name = "\"" + prop.name + "\"";
		propPathString = "layer(" + name + ")" + propPathString;

		return propPathString;
	};
	
	/**
	 * Constructs a property path object based on the given array of selected properties.
	 * 
	 * @param {Array} selectedProperties - An array of selected Property or PropertyGroup objects.
	 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
	 * @example
	 * var selectedProperties = app.project.activeItem.selectedProperties;
	 * var propertyObject = Ae.getDeepestSelectedProperty(selectedProperties);
	 * if (propertyObject && propertyObject.canSetExpression) {
	 *     propertyObject.expression = "your expression here";
	 * }
	 */
	module.getDeepestSelectedProperty = function (selectedProperties) {
		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
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
		}

		return findDeepestSelectedProp();
	};
	
	/**
	 * Determines the type of the deepest selected property from an array of selected properties.
	 * Checks whether the property is 1D, 2D, 3D, or Color by trying to set expressions and catching errors.
	 * 
	 * @param {Array} selectedProperties - An array of selected properties.
	 * @returns {string} The type of the deepest selected property ("1D", "2D", "3D", "Color", or "Unknown").
	 */
	
	module.checkPropertyType = function (selectedProperties) {
		var deepestProperty = this.getDeepestSelectedProperty(selectedProperties);

		if (!deepestProperty) {
			alert("No deepest property found!");
			return "Unknown";
		}

		var originalExpression = deepestProperty.expression;
		var propertyType = "Unknown";

		for (var i = 1; i <= 4; i++) {
			var testExpressionArray = [];
			for (var j = 0; j < i; j++) {
				testExpressionArray.push("value[" + j + "]");
			}
			var testExpression = "[" + testExpressionArray.join(", ") + "]";

			try {
				deepestProperty.expression = testExpression;

				// Check for expression error
				if (deepestProperty.expressionError === "") {
					// If it reaches here, the expression was successfully set
					if (i === 4) {
						propertyType = "Color";
					} else {
						propertyType = i + "D";
					}
				}
			} catch (e) {
				// Log the error if needed
			}
		}

		// Restore the original expression
		deepestProperty.expression = originalExpression;

		return propertyType;
	};
/**
	 * Finds a property in a given layer by its match name.
	 * The function searches recursively through property groups.
	 * 
	 * @param {PropertyGroup|Layer} propGroup - The After Effects Layer or PropertyGroup object in which to find the property.
	 * @param {string} matchName - The match name of the property to find.
	 * @returns {Property|PropertyGroup|null} - The found property or property group, or null if not found.
	 * 
	 * @example
	 * var layer = app.project.item(1).layer(1);
	 * var matchName = "ADBE Position";
	 * var property = Ae.findPropByMatchName(layer, matchName);
	 */
	module.findPropByMatchName = function (propGroup, matchName) {
		for (var i = 1; i <= propGroup.numProperties; i++) {
			var prop = propGroup.property(i);
			if (prop.matchName === matchName) {
				return prop;
			}
			if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
				var foundProp = module.findPropByMatchName(prop, matchName);
				if (foundProp) {
					return foundProp;
				}
			}
		}
		return null;
	};

 return module;
})();
//========== END OF INCLUDED FUNCTIONS ============//


var MainUI = (function () {
    var module = {};
    // Create a dockable panel
    module.show = function (thisObj) {
        var isPanel = thisObj instanceof Panel;
        var win = isPanel ? thisObj : new Window("palette", "TuneSync", undefined, { closeButton: true, resizeable: true });
        win.preferredSize.width = 300;
        win.orientation = "column";
        // Add a group to hold the label and the dropdown
        var reactorGroup = win.add("group");
        reactorGroup.orientation = "row";

        // Label for the dropdown
        var label = reactorGroup.add("statictext", undefined, "Pick Reactor:");
        label.size = [80, 25];

        // Dropdown for selecting the AUDIO REACTOR
        var dropdown = reactorGroup.add("dropdownlist", undefined, []);
        dropdown.size = [150, 25];

        // Add a group to hold the TuneSync and refresh buttons
        var buttonGroup = win.add("group");
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
            var propAddress = Ae.getDeepestSelectedProperty(selectedProperties);
            //alert(propAddress.toString());
            var dd = dropdown;
            var audioReactorName = getAudioReactorName(dd);

            // Determine the property type (1D, 2D, 3D)
            var propertyType = Ae.checkPropertyType(selectedProperties);

            switch (propertyType) {
                case '2D':
                    XYUnifyDialog(layer, propName, audioReactorName, selectedProperties);
                    break;
                case '3D':
                    XYZUnifyDialog(layer, propName, audioReactorName, selectedProperties)
                    break;
                case 'Color':
                    handleColorProperty(layer, propName, audioReactorName, propAddress); 
                    break;
                case '1D':
                default:
                    handle1DProperty(layer, propName, audioReactorName, propAddress);
                    break;
            }
            app.endUndoGroup();
        };
    
        if (!isPanel) {
            win.show();
            } else {
                win.onResizing = win.onResize = function () {
                    this.layout.layout(true);
                    this.layout.resize();
                };
            }
        return win;
    };
    /**
     * Handles a color property by creating relevant effects controllers and setting an expression.
     * 
     * @param {Layer} layer - The After Effects Layer containing the property.
     * @param {string} propName - The name of the property being handled.
     * @param {string} audioReactorName - The name of the audio reactor composition.
     * @param {Object} propAddress - An object containing address information about the property.
     */
    function handleColorProperty(layer, propName, audioReactorName, propAddress) {
        var propMatchname = propAddress.matchName;

        // Create Easing dropdown
        var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
        var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
        var setDropDownParams = easingDropdown.property(1).setPropertyParameters(dropDownParams);
        setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";

        // Create Start and End Color controls
        var startColorControl = layer.Effects.addProperty("ADBE Color Control");
        startColorControl.name = propName + "_Start Color";
        startColorControl.property("Color").setValue([0, 1, 0, 1]); // Set to Green (RGBA)

        var endColorControl = layer.Effects.addProperty("ADBE Color Control");
        endColorControl.name = propName + "_End Color";
        endColorControl.property("Color").setValue([0, 0, 1, 1]); // Set to Blue (RGBA)

        var propLink = Ae.findPropByMatchName(layer, propMatchname);
        if (propLink) {
            var expressionString = buildColorExpression(audioReactorName, propName); // Replace with your actual function for building color expressions
            propLink.expression = expressionString;
        } else {
            alert("Failed to update the expression. Property address could not be retrieved.");
        }
    };
    /**
     * Builds an After Effects expression string for color property based on audio reactor output.
     * 
     * @param {string} audioReactorName - The name of the audio reactor composition.
     * @param {string} propName - The name of the property for which the expression is being built.
     * @returns {string} The constructed expression string.
     */
    function buildColorExpression(audioReactorName, propName) {
        // Create the expression
        var expressionString = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");' + "\n"
            + 'iMin = 0;' + "\n"
            + 'iMax = 100;' + "\n"
            + 'ctrlLayer = thisLayer;' + "\n"
            + 'easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;' + "\n"
            + 'startColor = ctrlLayer.effect("' + propName + '_Start Color")("Color");' + "\n"
            + 'endColor = ctrlLayer.effect("' + propName + '_End Color")("Color");' + "\n"
            + 'if (easeType == 1) linear(d, iMin, iMax, startColor, endColor);' + "\n"
            + 'else if (easeType == 2) easeIn(d, iMin, iMax, startColor, endColor);' + "\n"
            + 'else if (easeType == 3) easeOut(d, iMin, iMax, startColor, endColor);' + "\n"
            + 'else ease(d, iMin, iMax, startColor, endColor);';
        return expressionString;
    };


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
        var propMatchname = propAddress.matchName;
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
        var propLink = Ae.findPropByMatchName(layer, propMatchname)
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
        return expressionString
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
        var propMatchname = Ae.getDeepestSelectedProperty(selectedProp).matchName;

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
        };

        // Build the expression based on the selections
        var expression = build2DExpression(xSelected, ySelected, isUnified, propName, audioReactorName);
        var propLink = Ae.findPropByMatchName(layer, propMatchname)

        // Apply the expression to the selected property
        propLink.expression = expression;
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

        if (isUnified || (xSelected && ySelected)) {
            finalExpression += 'outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");\n';
            finalExpression += 'outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");\n';
            finalExpression += 'xResult = yResult = ' + commonEasingLogic + ';\n';
        } else {
            if (!xSelected && !ySelected) {
                finalExpression += 'outMin = ctrlLayer.effect("' + propName + '_Min Output X")("Slider");\n';
                finalExpression += 'outMax = ctrlLayer.effect("' + propName + '_Max Output X")("Slider");\n';
                finalExpression += 'xResult = ' + commonEasingLogic + ';\n';
                finalExpression += 'outMin = ctrlLayer.effect("' + propName + '_Min Output Y")("Slider");\n';
                finalExpression += 'outMax = ctrlLayer.effect("' + propName + '_Max Output Y")("Slider");\n';
                finalExpression += 'yResult = ' + commonEasingLogic + ';\n';
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
        var propMatchname = Ae.getDeepestSelectedProperty(selectedProp).matchName;

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
        var propLink = Ae.findPropByMatchName(layer, propMatchname)

        // Apply the expression to the property
        propLink.expression = expression;
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
    function getAudioReactorName(dd) {
        if (dd && dd.selection) {
            return dd.selection.toString();
        } else {
            return null;
        }
    }

    function XYUnifyDialog(layer, propName, audioReactorName, selectedProperties) {
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
            var prop = selectedProperties;
            handle2DProperty(layer, xCheckBox.value, yCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, prop);
            dialog.close();
        };
        buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
            dialog.close();
        };

        dialog.show();
    }

    // Custom ScriptUI Dialog for 3D Property
    function XYZUnifyDialog(layer, propName, audioReactorName, selectedProperties) {
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

        // New column for Z
        var zGroup = parentGroup.add('group');
        zGroup.orientation = 'column';
        zGroup.alignment = 'center';
        var zCheckBox = zGroup.add('checkbox', undefined, '');
        zGroup.add('statictext', undefined, 'Z').justify = 'center';

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
            var prop = selectedProperties;
            // Adjust the handle2DProperty function to accommodate the new Z checkbox
            handle3DProperty(layer, xCheckBox.value, yCheckBox.value, zCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, prop);
            dialog.close();
        };
        buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
            dialog.close();
        };

        dialog.show();
    }


    return module;
})();

// Run the script
MainUI.show(this);