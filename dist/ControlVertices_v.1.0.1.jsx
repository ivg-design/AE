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
 * - If 'Open/Closed Path' checkbox is checked, the path will be open and the last vertex will not be connected to the first.
 * - Can selectively use inTangents and/or outTangents. If not used, they default to [0,0].
 * - Can be applied to an animated path - the selected vertices will be excluded from the animation and controlled by the vertex/tangent nulls
 * USAGE:
 * 1. Select a shape layer in an active composition.
 * 2. Run the script.
 * 3. The UI dialog will appear. Select a shape path and configure the control options.
 * 4. Click 'Create' to generate control nulls and expressions. An 'Undo' option is also available.
 *
 * @author IVG Design
 * @version 1.0.1
 * @date 2023 10 9
 * @changelog 
 * 	1.0.1	- added "Open/Close Path" checkbox option
 *          - refactored expression to use "createPath" function
 * @license Provided as is
 */

function main() {
	//var debug = ErrorLogging("control_vertices");
	
	/****************** HELPER FUNCTIONS ******************/
        /**
         * Recursively extracts groups and shape layers from an After Effects group.
         *
         * @param {Group} group - The After Effects group to extract from.
         * @param {string} parentName - The name of the parent group.
         * @param {Array<string>} [parentChain] - An array representing the chain of parent groups leading to the current group.
         * @returns {Array<Object>} - An array of objects representing the extracted groups and shapes.
         * 
         * Each object in the returned array has the following properties:
         * - `name` (string): The name of the group or shape.
         * - `type` (string): Either "group" or "shape" indicating the type.
         * - `propertyChain` (Array<string>): An array representing the chain of parent groups leading to this group or shape.
         * - `groups` (Array<Object>): An array of child groups (only present if type is "group").
         * - `path` (PathProperty): The path property of the shape (only present if type is "shape").
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
         * Retrieves the After Effects path and object based on the tree view selection and a given AE layer.
         *
         * @param {Object} treeView - The tree view object representing the AE hierarchy.
         * @param {Layer} aeLayer - The After Effects layer to start from.
         * @returns {Object|null} - An object containing the AE path string and the AE path object, or null if an invalid path or no selection.
         *
         * The returned object has the following properties:
         * - `pathString` (string): The After Effects path string that leads to the selected object.
         * - `pathObject` (Property): The After Effects object that corresponds to the selected item in the tree view.
         *
         * @throws Will show an alert if nothing is selected, if an invalid path is encountered, or if the path property is not found.
         */
		function getAEPathAndObject(treeView, aeLayer) {
			var selectedItem = treeView.selection;
			if (!selectedItem) {
				alert("Nothing selected!");
				return;
			}

			var aePathString = 'thisComp.layer("' + aeLayer.name + '")';
			var pathComponents = [];
			var currentAEObject = aeLayer; // Start with the initial AE layer

			// Traverse upwards through the tree to build the path components
			while (selectedItem && typeof selectedItem.text === 'string') {
				pathComponents.unshift(selectedItem.text);
				selectedItem = selectedItem.parent;
			}

			// Construct both AE Path String and AE Path Object
			for (var i = 0; i < pathComponents.length; i++) {
				var component = pathComponents[i];
				aePathString += '("Contents")("' + component + '")';

				if (currentAEObject && currentAEObject.property) {
					currentAEObject = currentAEObject.property("Contents").property(component);
				} else {
					alert("Invalid path in AE hierarchy");
					return;
				}
			}

			aePathString += '("Path")'; // Add the final "Path"

			if (currentAEObject && currentAEObject.property("Path")) {
				currentAEObject = currentAEObject.property("Path");
			} else {
				alert("Path property not found");
				return;
			}

			return {
				pathString: aePathString,
				pathObject: currentAEObject
			};
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

	/****************** CREATION FUNCTIONS ******************/

        /**
         * Creates control layers (null objects) for vertex, inTangent, and outTangent in an After Effects composition.
         *
         * @param {CompItem} comp - The composition to which control layers will be added.
         * @param {string} layerName - The name of the layer that the controls are for.
         * @param {string} shapeName - The name used to create the controls (e.g., "Ellipse 1").
         * @param {Object} options - An object containing flags to specify which controls to create.
         * @param {boolean} options.vertex - Flag to indicate if a vertex control should be created.
         * @param {boolean} options.inTangent - Flag to indicate if an inTangent control should be created.
         * @param {boolean} options.outTangent - Flag to indicate if an outTangent control should be created.
         * @param {string} pathToProp - The string representation of the path to the shape layer property.
         *
         * @returns {void}
         *
         * This function creates null objects in the composition and assigns them names and effects based on the provided parameters.
         * The null objects serve as controls for the vertex, inTangent, and outTangent of the specified layer.
         * Tangent controls (inTangent and outTangent) are parented to the vertex control by default.
         */
		
		function createControls(comp, layerName, shapeName, options, pathToProp) {
			//debug.debugWrite("Entering createControls...");
			var addPositionExpression = function (layer, type) {
				var pathToPropertyChain = pathToProp;
				var positionExpression = [
					'var shapeLayer = thisComp.layer("' + layerName + '");',
					'var controlFollow = thisLayer.effect("Control/Follow")("Checkbox").value;',
					'if (controlFollow == 1) {',
					'    var vertexIndex = Math.floor(thisLayer.effect("Vertex Control")("Slider").value);',
					'    var pathProperty = ' + pathToPropertyChain + ';',
					'    var points = pathProperty.points();',
					'    if (points.length >= vertexIndex && vertexIndex > 0) {',
					'        var point = points[vertexIndex - 1];',
					'        var shapeGroupPosition = pathProperty.propertyGroup(3)("Transform")("Position").value;',
					'        var shapeGroupAnchor = pathProperty.propertyGroup(3)("Transform")("Anchor Point").value;',
					'        point[0] += (shapeGroupPosition[0] - shapeGroupAnchor[0]);',
					'        point[1] += (shapeGroupPosition[1] - shapeGroupAnchor[1]);',
					'        if ("' + type + '" === "vertex") {',
					'            shapeLayer.toComp(point);',
					'        } else if ("' + type + '" === "inTangent" || "' + type + '" === "outTangent") {',
					'            var tangents = "' + type + '" === "inTangent" ? pathProperty.inTangents() : pathProperty.outTangents();',
					'            var tangent = tangents[vertexIndex - 1];',
					'            shapeLayer.toComp([point[0] + tangent[0], point[1] + tangent[1]]);',
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
				nullLayer.effect.addProperty("ADBE Checkbox Control").name = "Open/Closed Path";
                addPositionExpression(nullLayer, "vertex");
                vertexControlNull = nullLayer;  // Save the vertex control null layer

			}

			if (options.inTangent) {
				//debug.debugWrite("Creating inTangent control...");
				var inTanLayer = comp.layers.addNull();
                inTanLayer.name = shapeName + " inTangent for Vertex 1";
                inTanLayer.parent = vertexControlNull;  // Parent the inTangent control null to the vertex control null
				//addPositionExpression(inTanLayer, "inTangent");
			}

			if (options.outTangent) {
				//debug.debugWrite("Creating outTangent control...");
				var outTanLayer = comp.layers.addNull();
                outTanLayer.name = shapeName + " outTangent for Vertex 1";
                outTanLayer.parent = vertexControlNull;  // Parent the outTangent control null to the vertex control null
				//addPositionExpression(outTanLayer, "outTangent");
			}

			//debug.debugWrite("Exiting createControls...");
		}

        /**
         * Creates an After Effects expression string for controlling shape layer paths using null objects.
         *
         * @param {string} fullPathForExpression - The full path to the shape layer's path property.
         * @param {string} layerName - The name of the After Effects layer the expression will be applied to.
         * @param {string} shapeName - The name used in naming the control null objects (e.g., "Ellipse 1").
         *
         * @returns {string} - Returns the generated After Effects expression as a string.
         *
         * The generated expression allows for the dynamic control of vertex, inTangent, and outTangent positions.
         * It uses control null objects whose names start with the provided shapeName.
         * These control nulls have effects like "Vertex Control", "Control/Follow", and "Open/Closed Path" to guide behavior.
         * Control nulls for inTangents and outTangents are parented to the vertex control null by default.
         */
        function createExpression(fullPathForExpression, layerName, shapeName) {
            var expressionString = 'var shapeLayer = thisComp.layer("' + layerName + '");\n';
            expressionString += 'var shapeName = "' + shapeName + '";\n';  // Include the shape name
            expressionString += 'var pathProperty = ' + fullPathForExpression + ';\n';  // Use the full path

			expressionString += [
				'if (pathProperty) {',
				'    var pathPoints = pathProperty.points();',
				'    var inTangents = pathProperty.inTangents();',
				'    var outTangents = pathProperty.outTangents();',
				'    var isOpenPath = false;',
				'    for (var i = 1; i <= thisComp.numLayers; i++) {',
				'        var layer = thisComp.layer(i);',
				'        if (layer && layer.name && layer.name.startsWith(shapeName + " Vertex")) {',
				'            if (layer.effect("Open/Closed Path")) {',
				'                isOpenPath = layer.effect("Open/Closed Path")("Checkbox").value;',
				'            }',
				'            var controlFollow = layer.effect("Control/Follow") ? layer.effect("Control/Follow")("Checkbox").value : 0;',
				'            if (controlFollow) {',
				'                // Do nothing, let it follow the original path',
				'            } else {',
				'                var vertexControl = layer.effect("Vertex Control")("Slider");',
				'                if (vertexControl && vertexControl.value > 0) {',
				'                    var vertexIndex = Math.floor(vertexControl.value) - 1;',
				'                    var worldVertexPosition = layer.toWorld([0,0]);',
				'                    var vertexPosition = shapeLayer.fromWorld(worldVertexPosition);',
				'                    var shapeGroupPosition = pathProperty.propertyGroup(3)("Transform")("Position").value;',
				'                    var shapeGroupAnchor = pathProperty.propertyGroup(3)("Transform")("Anchor Point").value;',
				'                    vertexPosition[0] -= (shapeGroupPosition[0] - shapeGroupAnchor[0]);',
				'                    vertexPosition[1] -= (shapeGroupPosition[1] - shapeGroupAnchor[1]);',
				'                    pathPoints[vertexIndex] = vertexPosition;',
				'                    var vertexNameParts = layer.name.split(" ");',
				'                    var vertexSuffix = vertexNameParts[vertexNameParts.length - 1];',  // Extract the suffix from the vertex layer name
				'                    for (var j = 1; j <= thisComp.numLayers; j++) {',
				'                        var tangentLayer = thisComp.layer(j);',
				'                        var tangentNameParts = tangentLayer.name.split(" ");',
				'                        var tangentSuffix = tangentNameParts[tangentNameParts.length - 1];',  // Extract the suffix from the tangent layer name
				'                        if ((tangentLayer.name.startsWith(shapeName + " inTangent for Vertex") || tangentLayer.name.startsWith(shapeName + " outTangent for Vertex")) && vertexSuffix === tangentSuffix) {',
				'                            var tangentType = tangentLayer.name.split(" ")[shapeName.split(" ").length];',
				'                            var worldTangent = tangentLayer.toWorld([0,0]);',
				'                            var localTangent = shapeLayer.fromWorld(worldTangent);',
				'                            var shapeGroupPosition = pathProperty.propertyGroup(3)("Transform")("Position").value;',
				'                            var shapeGroupAnchor = pathProperty.propertyGroup(3)("Transform")("Anchor Point").value;',
				'                            localTangent[0] -= (shapeGroupPosition[0] - shapeGroupAnchor[0]);',
				'                            localTangent[1] -= (shapeGroupPosition[1] - shapeGroupAnchor[1]);',
				'                            var tangentOffset = [localTangent[0] - pathPoints[vertexIndex][0], localTangent[1] - pathPoints[vertexIndex][1]];',

				'                            if (tangentType === "inTangent") {',
				'                                inTangents[vertexIndex] = tangentOffset;',
				'                            } else if (tangentType === "outTangent") {',
				'                                outTangents[vertexIndex] = tangentOffset;',
				'                            }',
				'                        }',
				'                    }',
				'                }',
				'            }',
				'        }',
				'    }',
				'    createPath(pathPoints, inTangents, outTangents, isOpenPath);',
				'}'
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
					// Find the corresponding group in the extracted groups
					//var targetGroup = findGroupByPath(shapeName, shapeGroups);
					var pathForExpression = getAEPathAndObject(treeView, selectedLayers[0]).pathString;
					var pathObjectforExpression = getAEPathAndObject(treeView, selectedLayers[0]).pathObject;
					
					// Create controls for the selected shape
					createControls(comp, shapeLayer.name, shapeName, options, pathForExpression); 
					
						
					// Generate a new expression based on user options
					var newExpression = createExpression(pathForExpression, shapeLayer.name, shapeName);

						
					// Set the expression for the property
					pathObjectforExpression.expression = newExpression;
					
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