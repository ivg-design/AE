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

	var treeView = win.add("treeview", undefined, undefined, {
		multiselect: true
	}); // Enable multi-select during creation
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
		// TODO: Implement create functionality
		alert("Create functionality to be implemented");
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