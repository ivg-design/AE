function extractGroups(group, parentName) {
	var groups = [];
	for (var i = 1; i <= group.numProperties; i++) {
		var property = group.property(i);
		var groupName = property.name;
		if (property.matchName === "ADBE Vector Group") {
			var groupItem = {
				name: groupName,
				type: "group",
				groups: extractGroups(property.property("Contents"), groupName)
			};
			groups.push(groupItem);
		} else if (property.matchName === "ADBE Vector Shape - Group") {
			groups.push({
				name: groupName,
				type: "shape",
				path: property.property("Path 1")
			});
		}
	}
	return groups;
}

function createTreeView(groups, parentNode, treeView) {
	groups.forEach(function(group) {
		if (group.type === "group") {
			var node = parentNode.add("node", group.name);
			createTreeView(group.groups, node, treeView);
			node.expanded = true;
		} else if (group.type === "shape") {
			parentNode.add("item", group.name);
		}
	});
}

function showUI(shapeGroups) {
	var win = new Window("dialog", "Shape Layer Controls");
	win.orientation = "column";
	win.alignChildren = ["fill", "top"];

	var treeView = win.add("treeview", undefined, undefined, {multiselect: true}); // Enable multi-select during creation
	treeView.preferredSize = [300, 200];

	createTreeView(shapeGroups, treeView, treeView);

	var optionsGroup = win.add("group");
	optionsGroup.orientation = "row";
	optionsGroup.alignChildren = ["left", "center"];

	optionsGroup.add("checkbox", undefined, "Vertex").value = true;
	optionsGroup.add("checkbox", undefined, "InTangent");
	optionsGroup.add("checkbox", undefined, "OutTangent");

	var buttonsGroup = win.add("group");
	buttonsGroup.orientation = "row";
	buttonsGroup.add("button", undefined, "Create").onClick = function() {
		//==================== BUTTON ON CLICK =============//
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

		var selectedItem = treeView.selection; // changed myTree to treeView as per your script
		if (selectedItem) {
			var shapeName = selectedItem.text;
			var options = {
				vertex: optionsGroup.children[0].value, // Updated to correctly reference the checkboxes
				inTangent: optionsGroup.children[1].value,
				outTangent: optionsGroup.children[2].value
			};
			var newExpression = createExpression(shapeName, options);

			// Set the new expression to the path property of the selected shape
			var shapeGroup = shapeLayer.property("Contents").property(shapeName);
			var pathProperty = shapeGroup.property("Path 1").property("Path");
			pathProperty.expression = newExpression;
		} else {
			alert("Please select a shape from the tree view.");
		}
		
		var shapeName = treeView.selection.text;
		var options = {
			vertex: vertexCheckbox.value,
			inTangent: inTanCheckbox.value,
			outTangent: outTanCheckbox.value
		};

		createControls(comp, shapeName, options);
		var newExpression = createExpression(shapeName, options);
		var pathProperty = shapeLayer.property("ADBE Root Vectors Group").property(shapeName).property("ADBE Vectors Group").property("ADBE Vector Shape - Group").property("ADBE Vector Shape");
		pathProperty.expression = newExpression;
		
		//==================== CREATE FUNCTIONS =============//
		function createControls(comp, shapeName, options) {
			app.beginUndoGroup("Create Controls");

			var nullLayer, inTanLayer, outTanLayer;

			if (options.vertex) {
				nullLayer = comp.layers.addNull();
				nullLayer.name = shapeName + "_vertex";
				nullLayer.effect.addProperty("ADBE Slider Control").name = "Vertex Control";
			}

			if (options.inTangent) {
				inTanLayer = comp.layers.addNull();
				inTanLayer.name = shapeName + "_inTangent";
				inTanLayer.effect.addProperty("ADBE Slider Control").name = "InTangent Control";
			}

			if (options.outTangent) {
				outTanLayer = comp.layers.addNull();
				outTanLayer.name = shapeName + "_outTangent";
				outTanLayer.effect.addProperty("ADBE Slider Control").name = "OutTangent Control";
			}

			app.endUndoGroup();
		}

		function createExpression(shapeName, options) {
			var expressionParts = [
				'var shapeGroup = thisLayer.content("' + shapeName + '");',
				'var pathProperty = shapeGroup.content("Path 1").path;'
			];

			if (options.vertex) {
				expressionParts.push('var vertexNull = thisComp.layer("' + shapeName + '_vertex");');
				expressionParts.push('var vertexControl = vertexNull.effect("Vertex Control")("Slider");');
			}

			if (options.inTangent) {
				expressionParts.push('var inTangentNull = thisComp.layer("' + shapeName + '_inTangent");');
				expressionParts.push('var inTangentControl = inTangentNull.effect("InTangent Control")("Slider");');
			}

			if (options.outTangent) {
				expressionParts.push('var outTangentNull = thisComp.layer("' + shapeName + '_outTangent");');
				expressionParts.push('var outTangentControl = outTangentNull.effect("OutTangent Control")("Slider");');
			}

			expressionParts.push('var groupPosition = shapeGroup.transform.position.value;');
			expressionParts.push('var groupAnchor = shapeGroup.transform.anchorPoint.value;');
			expressionParts.push('var pathPoints = pathProperty.points();');
			expressionParts.push('var inTangents = pathProperty.inTangents();');
			expressionParts.push('var outTangents = pathProperty.outTangents();');
			expressionParts.push('if (vertexControl) {');
			expressionParts.push('    var vertexPosition = fromComp(vertexNull.toComp([0,0]));');
			expressionParts.push('    pathPoints[vertexControl - 1] = [vertexPosition[0] - groupPosition[0] + groupAnchor[0], vertexPosition[1] - groupPosition[1] + groupAnchor[1]];');
			expressionParts.push('}');
			expressionParts.push('if (inTangentControl) {');
			expressionParts.push('    var inTangentPosition = fromComp(inTangentNull.toComp([0,0]));');
			expressionParts.push('    inTangents[inTangentControl - 1] = [inTangentPosition[0] - vertexPosition[0], inTangentPosition[1] - vertexPosition[1]];');
			expressionParts.push('}');
			expressionParts.push('createPath(pathPoints, inTangents, outTangents, false);');

			return expressionParts.join("\n");
		}


	};
	buttonsGroup.add("button", undefined, "Cancel").onClick = function() {
		win.close();
	};

	win.show();
}

// Get the active composition
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
	alert("Please select a composition");
	
}

// Check if exactly one shape layer is selected
var selectedLayers = comp.selectedLayers;
if (selectedLayers.length !== 1 || selectedLayers[0].matchName !== "ADBE Vector Layer") {
	alert("Please select only one (1) shape layer");
	
}

// Parse the selected shape layer to extract shape groups and path names
var shapeLayer = selectedLayers[0];
var shapeGroups = extractGroups(shapeLayer.property("Contents"));

// Show the UI dialog with the extracted shape groups and paths
showUI(shapeGroups);