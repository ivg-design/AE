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
	module.getPropName = function (properties) {
		if (properties.length === 2) {
			return properties[0].name + "_" + properties[1].name;
		} else {
			return properties[0].name;
		}
	};
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
	 * Finds a property that matches the specified criteria within the base property.
	 *
	 * @param {PropertyGroup} baseProperty - The base property to search within.
	 * @param {Function} callback - The callback function to determine if a property matches the criteria.
	 * @return {Property} - The found property that matches the specified criteria.
	 */
	module.findProperty = function (baseProperty, callback) {
		for (var i = 1, il = baseProperty.numProperties; i <= il; i++) {
			if (callback(baseProperty.property(i))) {
				return baseProperty.property(i);
			}
		}
	};
	/**
	 * Iterates over each property within the given property and invokes the callback function.
	 *
	 * @param {PropertyGroup} property - The property to iterate over.
	 * @param {Function} callback - The callback function to be invoked for each property.
	 * @return {void}
	 */
	module.forEachProperty = function (property, callback) {
		for (var i = 1, il = property.numProperties; i <= il; i++) {
			callback(property.property(i), i);
		}
	};
	/**
	 * Executes the provided callback function within an undo group.
	 *
	 * @param {string} undoGroupName - The name of the undo group.
	 * @param {Function} callback - The callback function to be executed within the undo group.
	 * @return {*} - The result returned by the callback function.
	 */
	module.forUndoGroup = function (undoGroupName, callback) {
		app.beginUndoGroup(undoGroupName);
		var result = callback();
		app.endUndoGroup();
		return result;
	};

	/**
	 * Executes the provided callback function within an undo group.
	 *
	 * @param {Function} callback - The callback function to be executed within the undo group.
	 * @param {number}  layer_argument_index - The index of layer object passed to callback function if any.
	 * @return {*} - The result returned by the callback function.
	 */
	module.timer = function (callback, layer_argument_index) {
		return function () {
			var startTime = new Date().getTime();
			var result = callback.apply(this, arguments);
			var endTime = new Date().getTime();
			var elapsedTime = (endTime - startTime) / 1000;
			var funcname = callback.__funcname__ === undefined ? callback.name : callback.__funcname__;
			var time_comment = CEX.SEP + funcname + ' done in ' + elapsedTime + 's.';
			if (layer_argument_index != undefined) {
				var layer = arguments[layer_argument_index];
				var split_comment = layer.comment.split(CEX.SEP);
				if (split_comment.length > 1) {
					var layer_comment = split_comment[0];
				} else {
					layer_comment = layer.comment;
				}
				time_comment = layer_comment + time_comment;
				layer.comment = time_comment;
			}
			writeLn(time_comment.replace(CEX.SEP, '/ '));
			return result;
		};
	};

	/**
	 * Retrieves the active composition from the project.
	 *
	 * @return {CompItem} - The active composition, if it exists and is a CompItem.
	 */
	module.getActiveComposition = function () {
		var composition = app.project.activeItem;
		if (composition && module.isComposition(composition)) {
			return composition;
		}
	};
	/**
	 * Retrieves the Effects property of a layer.
	 *
	 * @param {AVLayer} layer - The layer to retrieve the Effects property from.
	 * @return {PropertyGroup} - The Effects property of the layer.
	 */
	module.getEffectsProperty = function (layer) {
		return layer.property('ADBE Effect Parade');
	};
	/**
	 * Retrieves the effect property with the specified match name from the layer.
	 *
	 * @param {AVLayer} layer - The layer to retrieve the effect property from.
	 * @param {string} effect_match_name - The match name of the effect property.
	 * @return {Property} - The effect property with the specified match name.
	 */
	module.getEffect = function (layer, effect_match_name) {
		var effectsProperty = module.getEffectsProperty(layer);
		return effectsProperty.property(effect_match_name);
	};
	/**
	 * Removes the effect with the specified match name from the layer.
	 *
	 * @param {AVLayer} layer - The layer from which to remove the effect.
	 * @param {string} effect_match_name - The match name of the effect to be removed.
	 * @return {void}
	 */
	module.removeEffectByType = function (layer, effect_match_name) {
		var effect = Ae.getEffect(layer, effect_match_name);
		if (effect != null) {
			effect.remove();
		}
	};
	/**
	 * Retrieves the layer that contains the specified property.
	 *
	 * @param {Property} property - The property to find the parent layer for.
	 * @return {Layer} - The layer that contains the property.
	 */
	module.getLayerFromProperty = function (property) {
		var layer = property;

		while (layer.parentProperty) {
			layer = layer.parentProperty;
		}

		return layer;
	};
	/**
	 * Retrieves the address of the specified property.
	 *
	 * @param {Property} property - The property to retrieve the address for.
	 * @return {number[]} - The address of the property as an array of property indices.
	 */
	module.getPropertyAddress = function (property) {
		var address = [];
		while (property.parentProperty) {
			address.unshift(property.propertyIndex);
			property = property.parentProperty;
		}
		return address;
	};
	/**
	 * Retrieves the property at the specified address within the base property.
	 *
	 * @param {PropertyGroup} baseProperty - The base property to retrieve the property from.
	 * @param {number[]} address - The address of the property as an array of property indices.
	 * @return {Property} - The property at the specified address.
	 */
	module.getPropertyFromAddress = function (baseProperty, address) {
		try {
			ArrayEx.forEach(address, function (propertyIndex) {
				baseProperty = baseProperty.property(propertyIndex);
			});

			return baseProperty;
		} catch (error) {
			alert(error);
		}
	};

	/**
	 * Removes the specified properties from their associated layers.
	 *
	 * @param {Property[]} properties - The properties to remove.
	 * @return {void}
	 */
	module.removeObjects = function (properties) {
		//try {
		var layer = Ae.getLayerFromProperty(properties[0]);
		var addresses = ArrayEx.map(properties, Ae.getPropertyAddress).reverse();
		ArrayEx.forEach(addresses, function (address) {
			Ae.getPropertyFromAddress(layer, address).remove();
		});
		//} catch (error) {
		//	ErrorHandler.show(error);
		//}
	};
	/**
	 * Retrieves all ShapeLayers within the given composition.
	 *
	 * @param {CompItem} composition - The composition to search within.
	 * @return {ShapeLayer[]} - An array of ShapeLayers within the composition.
	 */
	module.getShapeLayers = function (composition) {
		return ArrayEx.filterColl(composition.layers, module.isShapeLayer);
	};
	/**
	 * Retrieves the selected ShapeLayers within the given composition.
	 *
	 * @param {CompItem} composition - The composition to retrieve the selected ShapeLayers from.
	 * @return {ShapeLayer[]} - An array of selected ShapeLayers within the composition.
	 */
	module.getSelectedShapeLayers = function (composition) {
		return ArrayEx.filter(composition.selectedLayers, module.isShapeLayer);
	};
	/**
	 * Retrieves all ShapeLayers within the composition and its nested compositions.
	 *
	 * @param {CompItem} comp - The composition to search within.
	 * @return {ShapeLayer[]} - An array of all ShapeLayers within the composition and its nested compositions.
	 */
	module.getAllShapeLayersRecursive = function (comp) {
		var shapeLayers = [];
		for (var i = 1; i <= comp.numLayers; i++) {
			var layer = comp.layer(i);
			if (layer instanceof ShapeLayer) {
				shapeLayers.push(layer);
			} else if (layer instanceof AVLayer && layer.source instanceof CompItem) {
				var subComp = layer.source;
				var subShapeLayers = module.getAllShapeLayersRecursive(subComp);
				shapeLayers = shapeLayers.concat(subShapeLayers);
			} else if (layer instanceof AVLayer && layer.source instanceof FootageItem && layer.source.mainSource instanceof CompItem) {
				var nestedComp = layer.source.mainSource;
				var nestedShapeLayers = module.getAllShapeLayersRecursive(nestedComp);
				shapeLayers = shapeLayers.concat(nestedShapeLayers);
			}
		}
		return shapeLayers;
	};
	/**
	 * Retrieves the selected ShapeLayers within the nested compositions of the given items.
	 *
	 * @param {Layer[]} items - The items to search within.
	 * @param {number[]} processedComps - An array to track processed compositions (optional).
	 * @return {ShapeLayer[]} - An array of selected ShapeLayers within the nested compositions of the items.
	 */
	module.getSelectedShapeLayersRecursive = function (items, processedComps) {
		var shapeLayers = [];
		processedComps = processedComps || [];
		for (var i = 0, il = items.length; i < il; i++) {
			var item = items[i];
			if (item instanceof AVLayer && item.source instanceof CompItem) {
				var subComp = item.source;
				if (ArrayEx.indexOf(processedComps, subComp.id) == -1) {
					processedComps.push(subComp.id);
					// get layers to 0-based
					var layers = [];
					for (var j = 1; j <= subComp.numLayers; j++) {
						layers.push(subComp.layer(j));
					}
					var subShapeLayers = module.getSelectedShapeLayersRecursive(layers, processedComps);
					shapeLayers = shapeLayers.concat(subShapeLayers);
				}
			} else if (item instanceof ShapeLayer) {
				shapeLayers.push(item);
			}
		}
		return shapeLayers;
	};
	/**
	 * Retrieves the selected shape groups within the specified layer.
	 *
	 * @param {Layer} layer - The layer to retrieve the selected shape groups from.
	 * @return {Property[]} - An array of selected shape groups within the layer.
	 */
	module.getSelectedShapeGroups = function (layer) {
		return ArrayEx.filter(layer.selectedProperties, function (property) {
			return property.matchName === 'ADBE Vector Shape - Group';
		});
	};
	/**
	 * Imports the specified file into the project.
	 *
	 * @param {File} file - The file to import.
	 * @return {FootageItem} - The imported footage item.
	 */
	module.importFile = function (file) {
		return app.project.importFile(new ImportOptions(file));
	};
	/**
	 * Checks if the provided composition is a CompItem.
	 *
	 * @param {CompItem} composition - The composition to check.
	 * @return {boolean} - True if the composition is a CompItem, false otherwise.
	 */
	module.isComposition = function (composition) {
		return composition instanceof CompItem;
	};
	/**
	 * Checks if the provided property is a group property.
	 *
	 * @param {Property} property - The property to check.
	 * @return {boolean} - True if the property is a group property, false otherwise.
	 */
	module.isGroup = function (property) {
		return module.isNamedGroup(property) || module.isIndexedGroup(property);
	};
	/**
	 * Checks if the provided property is an indexed group property.
	 *
	 * @param {Property} property - The property to check.
	 * @return {boolean} - True if the property is an indexed group property, false otherwise.
	 */
	module.isIndexedGroup = function (property) {
		return property.propertyType === PropertyType.INDEXED_GROUP;
	};
	/**
	 * Checks if the provided property is a named group property.
	 *
	 * @param {Property} property - The property to check.
	 * @return {boolean} - True if the property is a named group property, false otherwise.
	 */
	module.isNamedGroup = function (property) {
		return property.propertyType === PropertyType.NAMED_GROUP;
	};
	/**
	 * Checks if the provided layer is a ShapeLayer.
	 *
	 * @param {Layer} layer - The layer to check.
	 * @return {boolean} - True if the layer is a ShapeLayer, false otherwise.
	 */
	module.isShapeLayer = function (layer) {
		return layer instanceof ShapeLayer;
	};
	/**
	 * Checks if the provided property is a shape property.
	 *
	 * @param {Property} property - The property to check.
	 * @return {boolean} - True if the property is a shape property, false otherwise.
	 */
	module.isShapeProperty = function (property) {
		return property.propertyValueType === PropertyValueType.SHAPE;
	};
	/**
	 * Checks if all parent properties of the specified property are enabled.
	 *
	 * @param {Property} property - The property to check.
	 * @return {boolean} - True if all parent properties are enabled, false otherwise.
	 */
	module.parentChainEnabled = function (property) {
		while (property.parentProperty) {
			if (property.canSetEnabled && !property.enabled) return false;
			property = property.parentProperty;
		}

		return true;
	};

	/**
	 * This function checks the layer names in a given composition, matching a specified number of words from a search string.
	 * @param {CompItem} comp - The composition in which to search for layers.
	 * @param {string} searchString - The string to search for in layer names. The function will match this string word by word.
	 * @param {number} numMatchWords - The number of words from the search string that should match in a layer name.
	 * @param {string} returnType - The type of information to return. Valid options are COUNT (returns number of matching layers),
	 * INDEXES (returns the index numbers of matching layers with corresponding names), and TYPES (returns the index numbers, names, and types of matching layers).
	 * @returns {number|array} - Depending on the returnType parameter, this function returns either a number (for CEX.MatchLayersCount), or an array of objects (for CEX.MatchLayersIndices and CEX.MatchLayersTypes).
	 */
	module.matchLayers = function (comp, searchString, numMatchWords, returnType) {
		var matchingLayers = [];
		var searchNameParts = searchString.split(' ');
		if (searchNameParts.length == 0) {
			return matchingLayers;
		}
		var searchNameWordsToMatch = searchNameParts.slice(0, numMatchWords).join(' '); // get the words to match from the search string

		// Iterate through the layers of the provided composition
		for (var i = 1, il = comp.numLayers; i <= il; i++) {
			var layerNameSplit = comp.layer(i).name.split(' '); // split the current layer name into parts
			if (layerNameSplit.length == 0) {
				continue;
			}
			var layerNameWordsToMatch = layerNameSplit.slice(0, numMatchWords).join(' '); // get the words to match from the current layer name
			// Compare the words to match of the current layer name with the search name
			if (searchNameWordsToMatch === layerNameWordsToMatch) {
					matchingLayers.push({
						index: i,
						name: comp.layer(i).name,
						type: comp.layer(i).typeName
					});
			}
		}

		switch (returnType) {
			case CEX.MatchLayersCount:
				// Returns count of matching layers
				return matchingLayers.length;
			case CEX.MatchLayersIndices:
				// Returns layers' indices
				return ArrayEx.map(matchingLayers, function (layer) {
					return { index: layer.index, name: layer.name };
				});
			case CEX.MatchLayersTypes:
				// Returns the entire matchingLayers array,
				// which includes index, name, and type of each matching layer
				return matchingLayers;
		}
	};
	/**
	 * Retrieves a layer from the composition based on the layer ID.
	 *
	 * @param {CompItem} comp - The composition to search within.
	 * @param {number} layer_id - The ID of the layer to retrieve.
	 * @param {string} returnType - The type of return value to retrieve. Possible values: 'name', 'layer'.
	 * @return {Layer|string|undefined} - The layer or name of the layer with the specified ID, or undefined if not found.
	 */
	module.getLayerById = function (comp, layer_id, returnType) {
		var layer = comp.layer(layer_id);
		if (layer == null) {
			return undefined;
		}
		if (returnType == CEX.FilterLayersRetName) {
			return layer.name;
		} else {
			return layer;
		}
	};

	/* Does layer exist in comp?
	 *
	 * @param {CompItem} comp - The composition to search within.
	 * @param {string} layer_name - The name of the layer to retrieve.
	 * @return {boolean} - true/false
	 */
	module.layerExists = function (comp, layer_name) {
		var comp_layers = comp.layers;
		for (var i = 1, il = comp_layers.length; i <= il; i++) {
			var layer = comp_layers[i];
			if (layer.name === layer_name) {
				return true;
			}
		}
		return false;
	};

	/**
	 * Selects the specified layer exclusively, deselecting all other layers in the composition.
	 *
	 * @param {CompItem} comp - The composition containing the layer.
	 * @param {Layer|number} layer - The layer or layer ID to select exclusively.
	 * @return {void}
	 */
	module.selectLayerExclusively = function (comp, layer) {
		if (typeof layer === 'number') {
			layer = module.getLayerById(comp, layer);
		}
		for (var i = 1, il = comp.layers.length; i <= il; i++) {
			comp.layers[i].selected = false;
		}
		layer.selected = true;
	};

	/**
	 * Retrieves all layers in a composition by their name.
	 * @param {Object} comp - The composition object containing layers.
	 * @param {string} layer_name - The name of the layers to search for.
	 * @returns {Array} - An array containing all layers that match the given name.
	 *
	 * @example
	 * var comp = { layers: [{name: 'Layer1'}, {name: 'Layer2'}, {name: 'Layer1'}] };
	 * var result = module.getAllLayersByName(comp, 'Layer1');
	 * console.log(result); // Output: [{name: 'Layer1'}, {name: 'Layer1'}]
	 */
	module.getAllLayersByName = function (comp, layer_name) {
		var layers = comp.layers;
		var ret_layers = [];
		for (var i = 1; i <= layers.length; i++) {
			var currentLayer = layers[i];
			if (currentLayer.name === layer_name) {
				ret_layers.push(currentLayer);
			}
		}
		return ret_layers;
	};
	/**
	 * Returns the internal [[Class]] of an object.
	 * @param {*} obj - The object to retrieve the internal [[Class]] from.
	 * @returns {string} - The internal [[Class]] as a string.
	 *
	 * @example
	 * var objectType = module.typeOf([1, 2, 3]);
	 * console.log(objectType); // Output: '[object Array]'
	 */
	module.typeOf = function (obj) {
		return Object.prototype.toString.call(obj);
	};

	return module;
})();
