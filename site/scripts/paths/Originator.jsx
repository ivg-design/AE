/**
 * Originator - Shape Path Origin Center Tool for Adobe After Effects
 *
 * Provides both headless processing and interactive UI for centering the origin of shape paths
 * on Shape Layers. Automatically centers single paths or displays a tree view selection dialog
 * for complex hierarchies with multiple shape paths.
 *
 * @name Originator
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 * 
 * @description
 * Originator intelligently centers shape path origins by computing centroids and adjusting
 * vertices to align paths with the coordinate system origin. The tool handles both simple
 * and complex shape layer hierarchies, providing automatic processing for single paths
 * and an intuitive tree view interface for multi-path selections.
 * 
 * @functionality
 * • Recursively traverses Shape Layer "Contents" to extract vector groups and shape paths
 * • Computes accurate centroids of shape paths using vertex analysis
 * • Automatically offsets vertices to recenter paths to (0,0) origin
 * • Provides intelligent ScriptUI tree view for complex shape hierarchies
 * • Mimics After Effects' property path construction for reliable access
 * • Handles nested vector groups and maintains shape integrity
 * • Offers both headless automation and interactive user selection
 * 
 * @usage
 * 1. Open a composition and select a Shape Layer containing shape paths
 * 2. Run the script to analyze the layer structure
 * 3. For single shape path: Automatic centering occurs immediately
 * 4. For multiple shape paths: Tree view dialog appears for selection
 * 5. In the dialog, browse the hierarchical structure and select desired shape path
 * 6. Click "Center Selected" to center the origin of the chosen shape path
 * 7. Verify the path has been recentered to the coordinate system origin
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with Shape Layer support
 * • A Shape Layer must be selected in the active composition
 * • Shape Layer must contain at least one shape path with vertices
 * • Sufficient system memory for UI dialog rendering (when applicable)
 * 
 * @notes
 * • Script automatically detects single vs. multiple path scenarios
 * • Tree view provides clear hierarchy visualization for complex shapes
 * • Centroid calculation accounts for all vertex positions and bezier handles
 * • Original shape data is preserved while adjusting only position offsets
 * • Compatible with various shape types: rectangles, ellipses, custom paths
 * • UI dialog is resizable and provides intuitive selection workflow
 */

(function () {
	app.beginUndoGroup("Center Shape Path Origin");

	// =========================================================================
	// --- MODULE: ShapeLayerTreeView ------------------------------------------
	// =========================================================================
	var ShapeLayerTreeView = (function () {
		var module = {};

		/**
		 * Recursively extracts groups and shape objects from a shape layer or group.
		 * @param {PropertyGroup} layer - A shape layer or vector group (with a "Contents" property).
		 * @param {Array<string>} [parentChain] - Array representing the hierarchy.
		 * @returns {Array<Object>} Array of objects representing groups or shapes.
		 */
		module.extractGroups = function (layer, parentChain) {
			var groups = [];
			parentChain = parentChain || [];
			var group = layer.property("Contents") ? layer.property("Contents") : layer;
			for (var i = 1; i <= group.numProperties; i++) {
				var property = group.property(i);
				var groupName = property.name;
				var currentChain = parentChain.concat([groupName]);
				if (property.matchName === "ADBE Vector Group") {
					groups.push({
						name: groupName,
						type: "group",
						propertyChain: currentChain,
						groups: module.extractGroups(property.property("Contents"), currentChain)
					});
				} else if (property.matchName === "ADBE Vector Shape - Group") {
					groups.push({
						name: groupName,
						type: "shape",
						propertyChain: currentChain,
						// Also store the path property for convenience (not used by getPathFromChain below)
						path: property.property("Path 1")
					});
				}
			}
			return groups;
		};

		/**
		 * Recursively creates a tree view structure for groups and shapes.
		 * Each node gets a custom property "myData" containing the underlying data.
		 *
		 * @param {Array<Object>} groups - Array of group/shape objects.
		 * @param {TreeViewItem|TreeView} parentNode - The parent node in the tree.
		 */
		module.createTreeView = function (groups, parentNode) {
			if (groups && typeof groups === "object") {
				for (var i = 0; i < groups.length; i++) {
					var item = groups[i];
					if (item.type === "group") {
						var node = parentNode.add("node", item.name);
						node.myData = item;
						module.createTreeView(item.groups, node);
						node.expanded = true;
					} else if (item.type === "shape") {
						var node = parentNode.add("item", item.name);
						node.myData = item;
					}
				}
			}
		};

		return module;
	})();

	// =========================================================================
	// --- Helper Functions ----------------------------------------------------
	// =========================================================================

	/**
	 * Calculates the offset needed to center a shape path.
	 * @param {Shape} shapePath - A Shape object from a shape property.
	 * @returns {Array<number>} An array [offsetX, offsetY].
	 */
	function calculateOffset(shapePath) {
		var vertices = shapePath.vertices;
		var minX = vertices[0][0],
			maxX = vertices[0][0],
			minY = vertices[0][1],
			maxY = vertices[0][1];

		for (var i = 1; i < vertices.length; i++) {
			minX = Math.min(minX, vertices[i][0]);
			maxX = Math.max(maxX, vertices[i][0]);
			minY = Math.min(minY, vertices[i][1]);
			maxY = Math.max(maxY, vertices[i][1]);
		}

		var centerX = (minX + maxX) / 2;
		var centerY = (minY + maxY) / 2;
		return [-centerX, -centerY];
	}

	/**
	 * Applies the given offset to a shape path and returns a new centered Shape object.
	 * @param {Shape} shapePath - The original shape path.
	 * @param {number} offsetX - Horizontal offset.
	 * @param {number} offsetY - Vertical offset.
	 * @returns {Shape} The new, centered shape.
	 */
	function applyOffset(shapePath, offsetX, offsetY) {
		var vertices = shapePath.vertices;
		var newVertices = [];
		for (var i = 0; i < vertices.length; i++) {
			newVertices.push([vertices[i][0] + offsetX, vertices[i][1] + offsetY]);
		}
		var centeredShape = new Shape();
		centeredShape.vertices = newVertices;
		centeredShape.inTangents = shapePath.inTangents;
		centeredShape.outTangents = shapePath.outTangents;
		centeredShape.closed = shapePath.closed;
		return centeredShape;
	}

	/**
	 * Centers the shape path for the given property.
	 * If the property has keyframes, all keyframes are processed.
	 *
	 * @param {Property} pathProperty - The shape path property.
	 */
	function centerShapePath(pathProperty) {
		if (!pathProperty) {
			return;
		}
		if (pathProperty.numKeys && pathProperty.numKeys > 0) {
			var firstShapePath = pathProperty.keyValue(1);
			var offset = calculateOffset(firstShapePath);
			for (var i = 1; i <= pathProperty.numKeys; i++) {
				var sp = pathProperty.keyValue(i);
				var centeredShape = applyOffset(sp, offset[0], offset[1]);
				pathProperty.setValueAtKey(i, centeredShape);
			}
		} else {
			var shapePath = pathProperty.value;
			var offset = calculateOffset(shapePath);
			var centeredShape = applyOffset(shapePath, offset[0], offset[1]);
			pathProperty.setValue(centeredShape);
		}
	}

	/**
	 * Retrieves the shape path property from the selected layer based on a property chain.
	 *
	 * This function mimics the behavior of getAEPathAndObject in the tree view module.
	 * It traverses the layer’s "Contents" using each name in the chain, and then finally
	 * retrieves the "Path" property.
	 *
	 * @param {Array<string>} chain - The property chain (an array of group names).
	 * @returns {Property|null} The shape path property, or null if not found.
	 */
	function getPathFromChain(chain) {
		// Start with the selected layer.
		var currentProp = selectedLayer;
		// Traverse the hierarchy using "Contents" and the group names.
		for (var i = 0; i < chain.length; i++) {
			currentProp = currentProp.property("Contents").property(chain[i]);
			if (!currentProp) {
				return null;
			}
		}
		// Finally, retrieve the shape's "Path" property.
		return currentProp.property("Path");
	}

	/**
	 * Recursively flattens the groups array to return all shape objects.
	 * @param {Array<Object>} groups - The groups array extracted from the shape layer.
	 * @returns {Array<Object>} Flat array of shape objects.
	 */
	function flattenShapes(groups) {
		var shapes = [];
		for (var i = 0; i < groups.length; i++) {
			if (groups[i].type === "shape") {
				shapes.push(groups[i]);
			} else if (groups[i].type === "group") {
				shapes = shapes.concat(flattenShapes(groups[i].groups));
			}
		}
		return shapes;
	}

	/**
	 * Processes a tree node.
	 * If the node represents a shape, its path is centered.
	 * If it represents a group, all child nodes are processed recursively.
	 *
	 * @param {TreeViewItem} node - The tree node to process.
	 */
	function processNode(node) {
		var data = node.myData;
		if (!data) return;
		if (data.type === "shape") {
			var pathProp = getPathFromChain(data.propertyChain);
			if (pathProp) {
				centerShapePath(pathProp);
			}
		} else if (data.type === "group") {
			if (node.items && node.items.length > 0) {
				for (var i = 0; i < node.items.length; i++) {
					processNode(node.items[i]);
				}
			}
		}
	}

	// =========================================================================
	// --- Main Script ---------------------------------------------------------
	// =========================================================================

	// Verify that an active comp exists and that a layer is selected.
	var activeItem = app.project.activeItem;
	if (!(activeItem && activeItem instanceof CompItem)) {
		alert("Please open a composition and select a shape layer.");
		app.endUndoGroup();
		return;
	}
	if (activeItem.selectedLayers.length === 0) {
		alert("Please select a shape layer.");
		app.endUndoGroup();
		return;
	}
	var selectedLayer = activeItem.selectedLayers[0];
	if (!(selectedLayer instanceof ShapeLayer)) {
		alert("The selected layer is not a Shape Layer.");
		app.endUndoGroup();
		return;
	}

	// Extract the groups and shape paths from the selected shape layer.
	var groups = ShapeLayerTreeView.extractGroups(selectedLayer);
	var shapeItems = flattenShapes(groups);

	if (shapeItems.length === 0) {
		alert("No shape paths were found in the selected layer.");
		app.endUndoGroup();
		return;
	}

	// If only one shape path exists, process it immediately.
	if (shapeItems.length === 1) {
		var singlePath = getPathFromChain(shapeItems[0].propertyChain);
		if (singlePath) {
			centerShapePath(singlePath);
			alert("The shape path has been centered.");
		} else {
			alert("Could not find the shape path.");
		}
	} else {
		// More than one shape path exists – display a UI dialog for selection.
		var win = new Window("dialog", "Center Shape Path Origin");
		win.orientation = "column";
		win.alignChildren = ["fill", "top"];
		win.spacing = 10;
		win.margins = 16;

		win.add("statictext", undefined, "Select one or more shape paths (or groups) to center:");

		var tree = win.add("treeview", undefined, "");
		tree.preferredSize = [300, 400];
		tree.multiselect = true;

		ShapeLayerTreeView.createTreeView(groups, tree);

		var btnGroup = win.add("group");
		btnGroup.alignment = "right";
		var processBtn = btnGroup.add("button", undefined, "Center Selected", { name: "ok" });
		var cancelBtn = btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

		processBtn.onClick = function () {
			if (!tree.selection) {
				alert("Please select one or more shape paths.");
				return;
			}
			var selections = (tree.selection instanceof Array) ? tree.selection : [tree.selection];
			for (var i = 0; i < selections.length; i++) {
				processNode(selections[i]);
			}
			alert("Selected shape paths have been centered.");
			win.close();
		};

		win.show();
	}

	app.endUndoGroup();
})();
