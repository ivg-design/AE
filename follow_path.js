(function applyPathExpression() {
    app.beginUndoGroup("Apply Path Expression");

    /********************************* 0) HELPER FUNCTIONS PROVIDED *********************************/
		/**
		 * Recursively extracts groups and shape layers from an After Effects shape "Contents".
		 *
		 * @param {PropertyGroup} group - The AE property group to extract from (e.g. layer.property("Contents")).
		 * @param {string} parentName - The name of the parent group (for naming display).
		 * @param {Array<string>} [parentChain] - An array representing the chain of parent groups.
		 * @returns {Array<Object>} - An array of objects representing the extracted groups and shapes.
		 *
		 * Each returned object has:
		 * - `name` (string)
		 * - `type` ("group" or "shape")
		 * - `propertyChain` (Array<string>)
		 * - `groups` (Array<Object>) if type is "group"
		 * - `path` (Property) if type is "shape"
		 */
		function extractGroups(group, parentName, parentChain) {
			var groups = [];
			parentChain = parentChain || [];
			for (var i = 1; i <= group.numProperties; i++) {
				var property = group.property(i);
				if (!property) continue;

				var groupName = property.name;
				var currentChain = parentChain.concat([groupName]);

				// Only consider actual shape "Groups" and shape paths:
				if (property.matchName === "ADBE Vector Group") {
					// This is a sub-group. Recurse inside .property("Contents").
					var groupItem = {
						name: groupName,
						type: "group",
						propertyChain: currentChain,
						groups: extractGroups(property.property("Contents"), groupName, currentChain)
					};
					groups.push(groupItem);

				} else if (property.matchName === "ADBE Vector Shape - Group") {
					// This is an actual path
					groups.push({
						name: groupName,
						type: "shape",
						propertyChain: currentChain,
						path: property.property("Path")
					});
				}
				// We skip other property types (e.g. strokes, fills, transforms)
			}
			return groups;
		}

		/**
		 * Recursively creates a tree view structure (folders for groups, items for shapes).
		 *
		 * @param {Object[]} groups - Array of group/shape objects from extractGroups().
		 * @param {TreeNode} parentNode - The parent node in the tree view.
		 * @param {TreeView} treeView - The tree view object to build.
		 */
		function createTreeView(groups, parentNode, treeView) {
			if (groups && typeof groups === "object") {
				for (var i = 0; i < groups.length; i++) {
					var group = groups[i];
					if (group.type === "group") {
						// Add a 'node'
						var node = parentNode.add("node", group.name);
						createTreeView(group.groups, node, treeView);
						node.expanded = true;
					} else if (group.type === "shape") {
						// Add an 'item'
						parentNode.add("item", group.name);
					}
				}
			}
		}


		/**
		 * Retrieves the path string and property object based on the user's TreeView selection.
		 * This builds a string like: thisComp.layer("MyShapeLayer")("Contents")("Group 1")("Contents")("Path 1")("Path")
		 * and also returns the actual property object if needed.
		 *
		 * @param {TreeView} treeView - The populated tree view.
		 * @param {AVLayer} aeLayer - The shape layer from which the paths were extracted.
		 * @returns {Object|null} - { pathString, pathObject } or null if there's an error.
		 */
		function getAEPathAndObject(treeView, aeLayer) {
			var selectedItem = treeView.selection;
			if (!selectedItem) {
				alert("Nothing selected!");
				return;
			}

			var aePathString = 'thisComp.layer("' + aeLayer.name + '")';
			var pathComponents = [];
			var currentAEObject = aeLayer;

			// Traverse upward in the tree
			while (selectedItem && typeof selectedItem.text === 'string') {
				pathComponents.unshift(selectedItem.text);
				selectedItem = selectedItem.parent;
			}

			// Build the property path
			for (var i = 0; i < pathComponents.length; i++) {
				var component = pathComponents[i];
				aePathString += '("Contents")("' + component + '")';
				if (currentAEObject && currentAEObject.property) {
					currentAEObject = currentAEObject.property("Contents").property(component);
				} else {
					alert("Invalid path in AE hierarchy");
					return null;
				}
			}

			// Finally reference ("Path")
			aePathString += '("Path")';
			if (currentAEObject && currentAEObject.property("Path")) {
				currentAEObject = currentAEObject.property("Path");
			} else {
				alert("Path property not found");
				return null;
			}

			return { pathString: aePathString, pathObject: currentAEObject };
		}


	/********************************* 1) ENSURE COMP + POSITION PROP********************************/
		var comp = app.project.activeItem;
		if (!comp || !(comp instanceof CompItem)) {
			alert("Please select (open) a composition first.");
			return;
		}

		var selectedProps = comp.selectedProperties;
		if (!selectedProps || selectedProps.length === 0) {
			alert("No property selected. Please select a Position property.");
			return;
		}

		var selectedProp = selectedProps[0];
		if (selectedProp.matchName !== "ADBE Position") {
			alert("Please select a Position property (not something else).");
			return;
		}

		// // Attempt to find the AVLayer that owns this property.
		// // We'll walk up propertyGroup() until we find an AVLayer or we can't go further.
		// var posLayer = selectedProp;
		// var safetyCount = 20; // limit to avoid infinite loops
		// while (safetyCount > 0 && posLayer && !(posLayer instanceof AVLayer)) {
		//     posLayer = posLayer.propertyGroup(1);
		//     safetyCount--;
		// }
		// if (!posLayer || !(posLayer instanceof AVLayer)) {
		//     alert("Error: Could not locate the AVLayer for the selected Position property.");
		//     return;
		// }

    /********************************* 2) SHAPE LAYER SELECTION DIALOG ********************************/
		var layers = comp.layers;
		var shapeLayers = [];
		for (var i = 1; i <= layers.length; i++) {
			var ly = layers[i];
			// If it's an AVLayer that has a "Contents" group => typically a shape layer
			if (ly.property("Contents")) {
				shapeLayers.push(ly);
			}
		}

		if (shapeLayers.length === 0) {
			alert("No shape layers found in this composition.");
			return;
		}

		var layerDialog = new Window("dialog", "Select Shape Layer");
		layerDialog.alignChildren = "left";

		var layerList = layerDialog.add(
			"listbox",
			undefined,
			shapeLayers.map(function (ly) { return ly.name; }),
			{ multiselect: false }
		);
		layerList.size = [300, 150];

		var layerButtons = layerDialog.add("group");
		layerButtons.add("button", undefined, "OK", { name: "ok" });
		layerButtons.add("button", undefined, "Cancel", { name: "cancel" });

		if (layerDialog.show() !== 1 || !layerList.selection) {
			alert("No shape layer selected.");
			return;
		}

		var selectedShapeLayer = shapeLayers[layerList.selection.index];

    /********************************* 3) BUILD DATA + TREEVIEW FOR PATHS ********************************/
		// Use extractGroups() to gather only shape groups/paths
		var shapeData = extractGroups(selectedShapeLayer.property("Contents"), selectedShapeLayer.name, []);

		// Now build a dialog with a real "treeview"
		var pathDialog = new Window("dialog", "Select Path");
		pathDialog.alignChildren = "fill";

		var treeView = pathDialog.add("treeview", undefined, "", { showHeaders: false, multiselect: false });
		treeView.size = [300, 300];

		var pathButtons = pathDialog.add("group");
		pathButtons.add("button", undefined, "OK", { name: "ok" });
		pathButtons.add("button", undefined, "Cancel", { name: "cancel" });

		// Populate the tree
		// We'll create a "dummy root" node so we can call createTreeView easily
		var dummyRoot = treeView.add("node", selectedShapeLayer.name);
		dummyRoot.expanded = true;
		createTreeView(shapeData, treeView, treeView);
		// Alternatively, we could just directly add to treeView w/o dummy root, but this is fine.

		if (pathDialog.show() !== 1 || !treeView.selection) {
			alert("No path selected.");
			return;
		}

		var pathInfo = getAEPathAndObject(treeView, selectedShapeLayer);
		if (!pathInfo) {
			// user canceled or invalid path
			return;
		}
    	// pathInfo = { pathString: "...", pathObject: ... }

    /********************************* 4) EASING + DURATION DIALOG ********************************/
		var settingsDialog = new Window("dialog", "Easing and Duration");
		settingsDialog.alignChildren = "left";

		// Easing label + dropdown
		settingsDialog.add("statictext", undefined, "Select Easing:");
		var easingDropdown = settingsDialog.add("dropdownlist", undefined, [
			"Ease (0.25, 0.1, 0.25, 1.0)",
			"Ease-In-Out (0.42, 0.0, 0.58, 1.0)",
			"88/66 (0.88, 0, 0.66, 1)",
			"66/88 (0.34, 0, 0.12, 1)",
			"Ease-In (0.42, 0.0, 1.0, 1.0)",
			"EaseInSine (0.12, 0, 0.39, 0)",
			"EaseOutSine (0.61, 1, 0.88, 1)",
			"EaseInOutSine (0.37, 0, 0.63, 1)",
			"EaseInQuad (0.11, 0, 0.5, 0)",
			"EaseOutQuad (0.5, 1, 0.89, 1)",
			"EaseInOutQuad (0.45, 0, 0.55, 1)",
			"EaseInCubic (0.32, 0, 0.67, 0)",
			"EaseOutCubic (0.33, 1, 0.68, 1)",
			"EaseInOutCubic (0.65, 0, 0.35, 1)",
			"EaseInQuart (0.5, 0, 0.75, 0)",
			"EaseOutQuart (0.25, 1, 0.5, 1)",
			"EaseInOutQuart (0.76, 0, 0.24, 1)",
			"EaseInQuint (0.64, 0, 0.78, 0)",
			"EaseOutQuint (0.22, 1, 0.36, 1)",
			"EaseInOutQuint (0.83, 0, 0.17, 1)",
			"EaseInExpo (0.7, 0, 0.84, 0)",
			"EaseOutExpo (0.16, 1, 0.3, 1)",
			"EaseInOutExpo (0.87, 0, 0.13, 1)",
			"EaseInCirc (0.55, 0, 1, 0.45)",
			"EaseOutCirc (0, 0.55, 0.45, 1)",
			"EaseInOutCirc (0.85, 0, 0.15, 1)",
			"EaseInBack (0.36, 0, 0.66, -0.56)",
			"EaseOutBack (0.34, 1.56, 0.64, 1)",
			"EaseInOutBack (0.68, -0.6, 0.32, 1.6)",
		]);
		easingDropdown.selection = 0;
		//easings with overshoot don't work well with this script:
		// "Overshoot & EaseIn (0.29, 1.7, 0.25, 1)",
		// "Overshoot & EaseOut (1, 0.03, 1, -0.44)",
		// "Soft Overshoot (0.34, 1.5, 0.55, 0.99)",

		// Duration label + input
		settingsDialog.add("statictext", undefined, "Enter Duration (frames):");
		var durationInput = settingsDialog.add("edittext", undefined, "60");
		durationInput.characters = 8;

		var setButtons = settingsDialog.add("group");
		setButtons.add("button", undefined, "OK", { name: "ok" });
		setButtons.add("button", undefined, "Cancel", { name: "cancel" });

		if (settingsDialog.show() !== 1) {
			alert("Settings dialog canceled.");
			return;
		}

		var selectedEasing = easingDropdown.selection.text.match(/\((.+)\)/)[1];
		var durationFrames = parseInt(durationInput.text, 10);
		if (isNaN(durationFrames) || durationFrames <= 0) {
			alert("Invalid duration value.");
			return;
		}

		/********************************
		 * 5) BUILD + SET THE EXPRESSION
		 ********************************/
		// This is your EXACT final expression. We only override:
		// - defaultDuration (in seconds)
		// - defaultEasing array
		// - the 'var path = ...' line, replaced by pathInfo.pathString

		var durationSeconds = durationFrames / comp.frameRate;
		var fullExpression =
			"// Default duration in seconds if no marker is found\n" +
			"var defaultDuration = " + durationSeconds + ";\n" +
			"\n" +
			"// Default easing if not specified in marker\n" +
			"var defaultEasing = [" + selectedEasing + "];\n" +
			"\n" +
			"// Check for a marker with the comment \"Animation\"\n" +
			"var marker = null;\n" +
			"for (var i = 1; i <= thisLayer.marker.numKeys; i++) {\n" +
			"    if (thisLayer.marker.key(i).comment.startsWith(\"Animation\")) {\n" +
			"        marker = thisLayer.marker.key(i);\n" +
			"        break;\n" +
			"    }\n" +
			"}\n" +
			"\n" +
			"// Determine animation start time, duration, and easing\n" +
			"var startTime, duration, easing;\n" +
			"if (marker) {\n" +
			"    startTime = marker.time;\n" +
			"    duration = marker.duration > 0 ? marker.duration : defaultDuration;\n" +
			"\n" +
			"    // Updated regex to capture both positive and negative easing values\n" +
			"    var comment = marker.comment;\n" +
			"    var easingMatch = comment.match(/Easing:\\s*([-+]?[0-9]*\\.?[0-9]+),\\s*([-+]?[0-9]*\\.?[0-9]+),\\s*([-+]?[0-9]*\\.?[0-9]+),\\s*([-+]?[0-9]*\\.?[0-9]+)/);\n" +
			"    if (easingMatch) {\n" +
			"        easing = [\n" +
			"            parseFloat(easingMatch[1]),\n" +
			"            parseFloat(easingMatch[2]),\n" +
			"            parseFloat(easingMatch[3]),\n" +
			"            parseFloat(easingMatch[4])\n" +
			"        ];\n" +
			"    } else {\n" +
			"        easing = defaultEasing; // Use default easing if not specified\n" +
			"    }\n" +
			"} else {\n" +
			"    startTime = thisLayer.inPoint;\n" +
			"    duration = defaultDuration;\n" +
			"    easing = defaultEasing;\n" +
			"}\n" +
			"\n" +
			// The critical replacement here:
			"// Reference the path (using the user-selected shape)\n" +
			"var path = " + pathInfo.pathString + ";\n" +
			"var vertices = path.points();\n" +
			"var pathLength = 0;\n" +
			"var lengths = [];\n" +
			"\n" +
			"// Calculate cumulative lengths between vertices\n" +
			"for (var i = 0; i < vertices.length - 1; i++) {\n" +
			"    var segmentLength = length(vertices[i], vertices[i + 1]);\n" +
			"    lengths.push(segmentLength);\n" +
			"    pathLength += segmentLength;\n" +
			"}\n" +
			"\n" +
			"// Accurate cubic Bezier easing function using De Casteljau's algorithm\n" +
			"function cubicBezier(t, p1x, p1y, p2x, p2y) {\n" +
			"    function getTForX(x, epsilon) {\n" +
			"        var t = x;\n" +
			"        var i = 0;\n" +
			"        while (i < 10) {\n" +
			"            var xEstimate = bezier(t, 0, p1x, p2x, 1);\n" +
			"            var dx = (bezier(t + epsilon, 0, p1x, p2x, 1) - xEstimate) / epsilon;\n" +
			"            if (Math.abs(xEstimate - x) < epsilon) {\n" +
			"                return t;\n" +
			"            }\n" +
			"            t -= (xEstimate - x) / dx;\n" +
			"            i++;\n" +
			"        }\n" +
			"        return t;\n" +
			"    }\n" +
			"\n" +
			"    function bezier(tt, p0, p1, p2, p3) {\n" +
			"        var c = 3 * (p1 - p0);\n" +
			"        var b = 3 * (p2 - p1) - c;\n" +
			"        var a = 1 - c - b;\n" +
			"        return ((a * tt + b) * tt + c) * tt + p0;\n" +
			"    }\n" +
			"\n" +
			"    var epsilon = 1e-6;\n" +
			"    var _t = getTForX(t, epsilon); // Solve for t in the X dimension\n" +
			"    return bezier(_t, 0, p1y, p2y, 1);\n" +
			"}\n" +
			"\n" +
			"// Progress calculation\n" +
			"var rawProgress = clamp((time - startTime) / duration, 0, 1);\n" +
			"var easedProgress = cubicBezier(rawProgress, easing[0], easing[1], easing[2], easing[3]); // Apply easing\n" +
			"var reversedProgress = 1 - easedProgress; // Reverse for animation direction\n" +
			"\n" +
			"// Calculate target distance along the path\n" +
			"var targetDistance = pathLength * reversedProgress;\n" +
			"\n" +
			"// Find the current segment based on the target distance\n" +
			"var accumulated = 0;\n" +
			"var segmentIndex = 0;\n" +
			"for (var i = 0; i < lengths.length; i++) {\n" +
			"    if (accumulated + lengths[i] >= targetDistance) {\n" +
			"        segmentIndex = i;\n" +
			"        break;\n" +
			"    }\n" +
			"    accumulated += lengths[i];\n" +
			"}\n" +
			"\n" +
			"// Interpolate position along the current segment\n" +
			"var segmentStart = vertices[segmentIndex];\n" +
			"var segmentEnd = vertices[segmentIndex + 1];\n" +
			"var segmentProgress = (targetDistance - accumulated) / lengths[segmentIndex];\n" +
			"var animatedVertex = [\n" +
			"    linear(segmentProgress, segmentStart[0], segmentEnd[0]),\n" +
			"    linear(segmentProgress, segmentStart[1], segmentEnd[1])\n" +
			"];\n" +
			"\n" +
			"// Convert the animated vertex from the parent's local space to comp space\n" +
			"var compPosition = thisLayer.parent.toComp(animatedVertex);\n" +
			"\n" +
			"// Adjust for the animated layer's local space\n" +
			"parent.fromComp(compPosition);\n";

		// Assign the expression
		selectedProp.expression = fullExpression;

    /********************************* 6) ADD A MARKER ON THE SAME LAYER ********************************/
		var posLayer = app.project.activeItem.selectedLayers[0];
		posLayer.parent = selectedShapeLayer;
		var markerComment = "Animation Easing: " + selectedEasing;
		var newMarker = new MarkerValue(markerComment);
		newMarker.duration = durationSeconds; // same as user-chosen

		// Add marker to the same layer that has the selected Position property
		var markerProp = posLayer.property("Marker");
		if (!markerProp) {
			// Usually Marker property is always there, but just in case:
			posLayer.addProperty("ADBE Marker");
			markerProp = posLayer.property("Marker");
		}
		markerProp.setValueAtTime(posLayer.inPoint, newMarker);

		app.endUndoGroup();
})();
