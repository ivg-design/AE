/**
 * Control Vertices in Adobe After Effects
 *
 * Provides a UI dialog that allows users to dynamically control vertices, inTangents, and outTangents 
 * of a selected path on a shape layer within the active composition.
 *
 * FUNCTIONALITY:
 * - Lists shape layers and their corresponding paths in a tree view.
 * - User can select a path and opt to control its vertices, inTangents, and outTangents.
 * - Generates control nulls based on user selections.
 * - Attaches expressions to these control nulls for real-time manipulation of the shape path.
 * - Allows for duplication of control nulls. When duplicated, control nulls automatically adapt to control new vertices.
 * - If 'Control/Follow' checkbox is checked, the control nulls will follow the selected vertice(s) but not control them.
 * - Can selectively use inTangents and/or outTangents. If not used, they default to [0,0].
 * - Can be applied to an animated path - the selected vertices will be excluded from the animation and controlled by the vertex/tangent nulls
 * USAGE:
 * 1. Select a shape layer in an active composition.
 * 2. Run the script.
 * 3. The UI dialog will appear. Select a shape path and configure the control options.
 * 4. Click 'Create' to generate control nulls and expressions. An 'Undo' option is also available.
 *
 * @author IVG Design
 * @version 1.0.0
 * @license Provided as is
 */

function main() {
	// @include 'modules/ErrorLogging.js' 
	//var debug = ErrorLogging("control_vertices");
	
		/****************** HELPER FUNCTIONS ******************/
		/**
		 * Recursively extracts groups and shapes from an After Effects group property.
		 *
		 * @param {PropertyGroup} group - The group property to extract from.
		 * @param {string} parentName - The name of the parent group, if any.
		 * @param {string[]} parentChain - The property chain of parent groups.
		 * @returns {Object[]} An array of group and shape objects.
		 */
		function extractGroups(group, parentName, parentChain) {
			var groups = [];
			parentChain = parentChain || [];
			for (var i = 1; i <= group.numProperties; i++) {
				var property = group.property(i);
				var groupName = property.name;
				var currentChain = parentChain.concat([groupName]);
				if (property.matchName === "ADBE Vector Group") {
					var groupItem = {
						name: groupName,
						type: "group",
						propertyChain: currentChain,
						groups: extractGroups(property.property("Contents"), groupName, currentChain)
					};
					groups.push(groupItem);
				} else if (property.matchName === "ADBE Vector Shape - Group") {
					groups.push({
						name: groupName,
						type: "shape",
						propertyChain: currentChain,
						path: property.property("Path 1")
					});
				}
			}
			return groups;
		}

		/**
		 * Recursively creates a tree view structure for groups and shapes to display as a tree in
		 * a ScriptUI dialog.
		 *
		 * @param {Object[]} groups - An array of group and shape objects to be added to the tree view.
		 * @param {TreeNode} parentNode - The parent node in the tree view.
		 * @param {TreeView} treeView - The tree view object to build.
		 */
		function createTreeView(groups, parentNode, treeView) {
			if (groups && typeof groups === "object") {
				for (var i = 0; i < groups.length; i++) {
					var group = groups[i];
					if (group.type === "group") {
						var node = parentNode.add("node", group.name);
						createTreeView(group.groups, node, treeView);
						node.expanded = true;
					} else if (group.type === "shape") {
						parentNode.add("item", group.name);
					}
				}
			}
		}

		/**
		 * Recursively searches for a group within a hierarchical structure of groups by its name.
		 *
		 * @param {string} shapeName - The name of the group to find.
		 * @param {Object[]} groups - An array of group objects to search within.
		 * @returns {Object|null} The found group object or null if not found.
		 */
		function findGroupByPath(shapeName, groups) {
			for (var i = 0; i < groups.length; i++) {
				if (groups[i].name === shapeName) {
					return groups[i];
				}
				if (groups[i].groups) {
					var foundGroup = findGroupByPath(shapeName, groups[i].groups);
					if (foundGroup) return foundGroup;
				}
			}
			return null;
		}

		/**
		 * Retrieves a property from a shape layer by following a given property chain.
		 *
		 * @param {Layer} shapeLayer - The shape layer to search within.
		 * @param {string[]} propertyChain - An array of property names forming the chain to the desired property.
		 * @returns {Property|null} The found property or null if not found.
		 */

		function getPropertyByChain(shapeLayer, propertyChain) {
			//debug.debugWrite("Attempting to access property chain: " + propertyChain.join(" -> "));
			var currentGroup = shapeLayer.property("Contents");
			for (var i = 0; i < propertyChain.length; i++) {
				//debug.debugWrite("Current group: " + (currentGroup ? currentGroup.name : "undefined"));

				// Log all available property names in the current group
				for (var j = 1; j <= currentGroup.numProperties; j++) {
					//debug.debugWrite("Available property: " + currentGroup.property(j).name);
				}

				// Attempt to access the property by its name
				//debug.debugWrite("Attempting to access property: " + propertyChain[i]);

				// Search for the property by its index
				var propertyFound = false;
				for (var j = 1; j <= currentGroup.numProperties; j++) {
					if (currentGroup.property(j).name === propertyChain[i]) {
						//debug.debugWrite("Property found at index: " + j);
						currentGroup = currentGroup.property(j);
						propertyFound = true;
						break;
					}
				}

				if (!propertyFound) {
					//debug.debugWrite("Property not found: " + propertyChain[i]);
					return null;
				}

				// Navigate into 'Contents' if needed
				if (currentGroup.property("Contents")) {
					currentGroup = currentGroup.property("Contents");
					//debug.debugWrite("Navigating into 'Contents' of current group");
				}
			}

			var pathProperty = currentGroup ? currentGroup.property("Path 1").property("Path") : null;

			if (pathProperty) {
				//debug.debugWrite("Path 1 found in current group");
			} else {
				//debug.debugWrite("Path 1 not found in current group");
			}

			//debug.debugWrite("Returning pathProperty: " + (pathProperty ? pathProperty.name : "null"));
			return pathProperty;
		}



	/****************** CREATION FUNCTIONS ******************/

		/**
		 * Create control layers in a composition based on user options.
		 *
		 * @param {CompItem} comp - The composition where control layers will be created.
		 * @param {string} shapeName - The name of the shape the controls will be linked to.
		 * @param {Object} options - An object containing user-defined options for control layers.
		 *   @param {boolean} options.vertex - If true, a null layer for vertex control will be created.
		 *   @param {boolean} options.inTangent - If true, a null layer for inTangent control will be created.
		 *   @param {boolean} options.outTangent - If true, a null layer for outTangent control will be created.
		 *
		 * @example
		 * createControls(comp, 'Shape 1', { vertex: true, inTangent: false, outTangent: true });
			*/
		
		function createControls(comp, layerName, shapeName, options) {
			//debug.debugWrite("Entering createControls...");
			var addPositionExpression = function (layer, type) {
				var pathToPropertyChain = options.pathToPropertyChain || "content('Shape 1').content('Path 1').path"; // Fallback to a default value
				var positionExpression = [
					'var controlFollow = thisLayer.effect("Control/Follow")("Checkbox").value;',
					'if (controlFollow == 1) {',
					'    var shapeLayer = thisComp.layer("' + layerName + '");',
					'    var vertexIndex = Math.floor(thisLayer.effect("Vertex Control")("Slider").value);',
					'    var pathProperty = shapeLayer.' + pathToPropertyChain + ';',
					'    var points = pathProperty.points();',
					'    if (points.length >= vertexIndex && vertexIndex > 0) {',
					'        var point = points[vertexIndex - 1];',
					'        if (point.length >= 2) {',
					'            if ("' + type + '" === "vertex") {',
					'                shapeLayer.toComp([point[0], point[1]]);',
					'            } else if ("' + type + '" === "inTangent" || "' + type + '" === "outTangent") {',
					'                var tangents = "' + type + '" === "inTangent" ? pathProperty.inTangents() : pathProperty.outTangents();',
					'                var tangent = tangents[vertexIndex - 1];',
					'                shapeLayer.toComp([point[0] + tangent[0], point[1] + tangent[1]]);',
					'            }',
					'        } else {',
					'            value;',
					'        }',
					'    } else {',
					'        value;',
					'    }',
					'} else {',
					'    value;',
					'}',
				].join('\n');
				layer.position.expression = positionExpression;
			};


			if (options.vertex) {
				//debug.debugWrite("Creating vertex control...");
				var nullLayer = comp.layers.addNull();
				nullLayer.name = shapeName + " Vertex 1";
				nullLayer.effect.addProperty("ADBE Slider Control").name = "Vertex Control";
				nullLayer.effect.addProperty("ADBE Checkbox Control").name = "Control/Follow";
				addPositionExpression(nullLayer, "vertex");
			}

			if (options.inTangent) {
				//debug.debugWrite("Creating inTangent control...");
				var inTanLayer = comp.layers.addNull();
				inTanLayer.name = shapeName + " inTangent for Vertex 1";
				//addPositionExpression(inTanLayer, "inTangent");
			}

			if (options.outTangent) {
				//debug.debugWrite("Creating outTangent control...");
				var outTanLayer = comp.layers.addNull();
				outTanLayer.name = shapeName + " outTangent for Vertex 1";
				//addPositionExpression(outTanLayer, "outTangent");
			}

			//debug.debugWrite("Exiting createControls...");
		}

		/**
				 * Generates a new After Effects expression for manipulating path vertices based on user options.
				 * 
				 * @param {string[]} propertyChain - An array representing the chain of properties to navigate through in the shape layer.
				 * @param {Object} options - User-defined options for vertex and tangent control.
				 * @param {boolean} options.vertex - Specifies whether to enable vertex control.
				 * @param {boolean} options.inTangent - Specifies whether to enable in-tangent control.
				 * @param {boolean} options.outTangent - Specifies whether to enable out-tangent control.
				 * 
				 * @returns {string} The generated After Effects expression as a string.
				 */
			// function createExpression(propertyChain, options) {
			// 	// Initialize the expression string with common parts
			// 	var expressionString = 'var shapeLayer = thisLayer;\n';

			// 	// Dynamically build the currentGroup part of the expression
			// 	var currentGroupString = 'var currentGroup = shapeLayer';
			// 	for (var i = 0; i < propertyChain.length; i++) {
			// 		currentGroupString += '.content("' + propertyChain[i] + '")';
			// 	}
			// 	currentGroupString += ';\n';
			// 	expressionString += currentGroupString;

			// 	// Add the rest of the common expression parts
			// 	expressionString += [
			// 		'if (currentGroup) {',
			// 		'    var pathProperty = currentGroup.content("Path 1").path;',
			// 		'    var pathPoints = pathProperty.points();',
			// 		'    var inTangents = pathProperty.inTangents();',
			// 		'    var outTangents = pathProperty.outTangents();',
			// 		'    for (var i = 1; i <= thisComp.numLayers; i++) {',
			// 		'        var layer = thisComp.layer(i);',
			// 		'        if (layer.name.startsWith(currentGroup.name + " Vertex")) {',
			// 		'            var controlFollow = layer.effect("Control/Follow") ? layer.effect("Control/Follow")("Checkbox").value : 0;',
			// 		'            if (!controlFollow) {',
			// 		'                var vertexControl = layer.effect("Vertex Control")("Slider");',
			// 		'                if (vertexControl && vertexControl.value > 0) {',
			// 		'                    var vertexIndex = Math.floor(vertexControl) - 1;',
			// 		'                    var vertexPosition = fromComp(layer.toComp([0,0]));',
			// 		'                    pathPoints[vertexIndex] = vertexPosition;',
			// 		'                    var inTangentLayer = thisComp.layer(currentGroup.name + " inTangent for Vertex " + (vertexIndex + 1));',
			// 		'                    var outTangentLayer = thisComp.layer(currentGroup.name + " outTangent for Vertex " + (vertexIndex + 1));',
			// 		'                    if (inTangentLayer) {',
			// 		'                        var inTangentPosition = fromComp(inTangentLayer.toComp([0,0]));',
			// 		'                        inTangents[vertexIndex] = [inTangentPosition[0] - vertexPosition[0], inTangentPosition[1] - vertexPosition[1]]; ',
			// 		'                    }',
			// 		'                    if (outTangentLayer) {',
			// 		'                        var outTangentPosition = fromComp(outTangentLayer.toComp([0,0]));',
			// 		'                        outTangents[vertexIndex] = [outTangentPosition[0] - vertexPosition[0], outTangentPosition[1] - vertexPosition[1]]; ',
			// 		'                    }',
			// 		'                }',
			// 		'            }',
			// 		'        }',
			// 		'    }',
			// 		'    createPath(pathPoints, inTangents, outTangents, false);',
			// 		'}'
			// 	].join('\n');

			// 	return expressionString;
			// }
		function createExpression(propertyChain, options, layerName) {
			var expressionString = 'var shapeLayer = thisComp.layer("' + layerName + '");\n';
			var currentGroupString = 'var currentGroup = shapeLayer';
			for (var i = 0; i < propertyChain.length; i++) {
				currentGroupString += '.content("' + propertyChain[i] + '")';
			}
			currentGroupString += ';\n';
			expressionString += currentGroupString;

			expressionString += [
				'if (currentGroup) {',
				'    var pathProperty = currentGroup.content("Path 1").path;',
				'    var pathPoints = pathProperty.points();',
				'    var inTangents = pathProperty.inTangents();',
				'    var outTangents = pathProperty.outTangents();',
				'    var controlFollow = 0;',
				'    for (var i = 1; i <= thisComp.numLayers; i++) {',
				'        var layer = thisComp.layer(i);',
				'        if (layer.name.startsWith(currentGroup.name + " Vertex")) {',
				'            controlFollow = layer.effect("Control/Follow") ? layer.effect("Control/Follow")("Checkbox").value : 0;',
				'            if (!controlFollow) {',
				'                var vertexControl = layer.effect("Vertex Control")("Slider");',
				'                if (vertexControl && vertexControl.value > 0) {',
				'                    var vertexIndex = Math.floor(vertexControl.value) - 1;',
				'                    var vertexPosition = fromComp(layer.toComp([0,0]));',
				'                    pathPoints[vertexIndex] = vertexPosition;',
				'                    try {',
				'                        var inTangentLayer = thisComp.layer(layer.name.replace(" Vertex", " inTangent for Vertex"));',
				'                        var inTangentPosition = fromComp(inTangentLayer.toComp([0,0]));',
				'                        inTangents[vertexIndex] = [inTangentPosition[0] - vertexPosition[0], inTangentPosition[1] - vertexPosition[1]]; ',
				'                    } catch (e) {}',
				'                    try {',
				'                        var outTangentLayer = thisComp.layer(layer.name.replace(" Vertex", " outTangent for Vertex"));',
				'                        var outTangentPosition = fromComp(outTangentLayer.toComp([0,0]));',
				'                        outTangents[vertexIndex] = [outTangentPosition[0] - vertexPosition[0], outTangentPosition[1] - vertexPosition[1]]; ',
				'                    } catch (e) {}',
				'                }',
				'            } else {',
				'                inTangents = pathProperty.inTangents();',
				'                outTangents = pathProperty.outTangents();',
				'            }',
				'        }',
				'    }',
				'    createPath(pathPoints, inTangents, outTangents, false);',
				'}',
			].join('\n');

			return expressionString;
		}

	/****************** SCRIPT UI ******************/

			/**
		 * Displays a user interface for controlling shape layers.
		 *
		 * @param {Object[]} shapeGroups - An array of shape groups with properties for tree view display.
		 */
		function showUI(shapeGroups) {
			// Create a new dialog window for the user interface
			var win = new Window("dialog", "Shape Layer Controls");
			win.orientation = "column";
			win.alignChildren = ["fill", "top"];

			// Create a tree view for displaying shape groups
			var treeView = win.add("treeview", undefined, undefined, { multiselect: true }); // Enable multi-select during creation
			treeView.preferredSize = [300, 200];

			// Populate the tree view with shape groups
			createTreeView(shapeGroups, treeView, treeView);

			// Create a group for options (checkboxes)
			var optionsGroup = win.add("group");
			optionsGroup.orientation = "row";
			optionsGroup.alignChildren = ["left", "center"];

			// Add checkboxes for controlling vertex, in-tangent, and out-tangent
			optionsGroup.add("checkbox", undefined, "Vertex").value = true;
			optionsGroup.add("checkbox", undefined, "InTangent");
			optionsGroup.add("checkbox", undefined, "OutTangent");

			// Create a group for buttons
			var buttonsGroup = win.add("group");
			buttonsGroup.orientation = "row";

			// Add a "Create" button

			buttonsGroup.add("button", undefined, "Create").onClick = function () {
				// Start the undo group
				app.beginUndoGroup("Create Shape Controls and Expression");

				var comp = app.project.activeItem;
				if (!(comp instanceof CompItem)) {
					alert("Please select a composition.");
					return;
				}

				var selectedLayers = comp.selectedLayers;
				if (selectedLayers.length !== 1 || selectedLayers[0].property("ADBE Root Vectors Group") == undefined) {
					alert("Please select only one (1) shape layer.");
					return;
				}

				var shapeLayer = selectedLayers[0];
				var selectedItem = treeView.selection;

				if (selectedItem && selectedItem.parent) {
					var shapeName = selectedItem.parent.text;

					// Validate if the selected item is a Path
					if (selectedItem.text.indexOf("Path") === -1) {
						alert("Please select a Path from the tree view.");
						app.endUndoGroup();
						return;
					}

					var options = {
						vertex: optionsGroup.children[0].value,
						inTangent: optionsGroup.children[1].value,
						outTangent: optionsGroup.children[2].value
					};

					// Create controls for the selected shape
					createControls(comp, shapeLayer.name, shapeName, options);

					// Find the corresponding group in the extracted groups
					var targetGroup = findGroupByPath(shapeName, shapeGroups);

					if (targetGroup && targetGroup.propertyChain) {
						// Generate a new expression based on user options
						var newExpression = createExpression(targetGroup.propertyChain, options, shapeLayer.name);

						// Get the property based on the property chain
						var pathProperty = getPropertyByChain(shapeLayer, targetGroup.propertyChain);

						if (pathProperty) {
							// Set the expression for the property
							pathProperty.expression = newExpression;
						}
					}
				} else {
					alert("Please select a shape from the tree view.");
				}

				// End the undo group
				app.endUndoGroup();
				win.close();
			};



			// Add a "Cancel" button that closes the dialog
			buttonsGroup.add("button", undefined, "Cancel").onClick = function () {
				win.close();
			};

			// Show the dialog window
			win.show();
		}


	
	/****************** CHECKS ******************/

		// Get the active composition
		var comp = app.project.activeItem;
		if (!comp || !(comp instanceof CompItem)) {
			alert("Please select a composition");
			return;
		}

		// Check if exactly one shape layer is selected
		var selectedLayers = comp.selectedLayers;
		if (selectedLayers.length !== 1 || selectedLayers[0].matchName !== "ADBE Vector Layer") {
			alert("Please select only one (1) shape layer");
			return;
		}

		// Parse the selected shape layer to extract shape groups and path names
		var shapeLayer = selectedLayers[0];
		var shapeGroups = extractGroups(shapeLayer.property("Contents"));

		// Show the UI dialog with the extracted shape groups and paths
		showUI(shapeGroups);
}

main()