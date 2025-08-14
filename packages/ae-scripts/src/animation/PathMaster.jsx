/**
 * PathMaster - Advanced Path Animation System for Adobe After Effects
 *
 * Provides a unified UI dialog that allows users to:
 * - Select a shape layer from the active composition.
 * - Explore the layer's shape groups and paths in a tree view.
 * - Pick a specific path to reference for animation.
 * - Choose from an expanded set of easing functions and set a duration in frames.
 * - Apply an expression to the selected Position property, animating it along the chosen path.
 * - If an "Animation Easing" marker already exists, it is automatically removed before a new one is created.
 * - The resulting expression works correctly whether the layer is parented or unparented.
 *
 * FUNCTIONALITY:
 * - Displays a dialog to select any shape layer in the composition.
 * - Recursively collects groups and paths, presenting them in a fully expanded tree view so the user can choose a path.
 * - Offers an extended easing dropdown with many cubic-bezier presets (and possibly other advanced easings).
 * - Lets the user specify a duration in frames, automatically converted to seconds in the expression.
 * - Creates a marker on the same layer that holds the Position property, labeling the chosen easing, duration, partial segment, and loop/ping-pong modes.
 * - Generates a complete expression that interpolates the Position over time and eases along the specified path using pointOnPath() for true curve-following.
 * - Syntax for the marker comment uses double pipes (`||`) to separate Easing, Segment, and Loop/Ping-Pong declarations.
 * - If the marker is absent or its data is invalid, the expression defaults to linear (0,0,1,1), animating along 0–100% of the path with no loop.
 *
 * USAGE:
 * 1. Open a composition and select (or highlight) the Position property on any layer.
 * 2. Run the script.
 * 3. A dialog appears for shape-layer selection. Choose the desired shape layer and click OK.
 * 4. A second dialog shows a tree of all shape groups/paths. Pick the path to animate along and click OK.
 * 5. The final dialog lets you pick an easing function from the extended list and enter your desired animation duration in frames, as well as toggle Reverse Direction if needed.
 * 6. Once confirmed, the script checks for any existing "Animation Easing" marker on the layer and removes it before creating a fresh one that indicates your chosen easing and other parameters, while also updating the expression on the selected Position property.
 * 7. Preview or play back the composition to see the animation.
 *
 * @name PathMaster
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-01-13
 * @ui DIALOG
 * @license MIT
 * @changelog
 * - 2.0.0: Renamed to PathMaster with enhanced documentation
 * - 1.3.0: Added partial path segments, reverse direction, loop/ping-pong modes
 * - 1.2.0: Removed auto-parenting functionality; supports both parented and unparented layers
 * - 1.1.0: Added additional easing options to the dropdown
 * - 1.0.0: Initial release with basic shape-layer path selection and expression application
 */

(function applyPathExpression() {
	app.beginUndoGroup("PathMaster");

	/********************************* 0) HELPER FUNCTIONS *********************************/
	/**
	 * Recursively extracts shape groups/paths from an After Effects shape "Contents".
	 *
	 * @param {PropertyGroup} group - e.g., layer("Contents").
	 * @param {string} parentName - The name of the parent group.
	 * @param {Array<string>} [parentChain] - Chain of parent group names.
	 * @returns {Array<Object>}
	 */
	function extractGroups(group, parentName, parentChain) {
		var groups = [];
		parentChain = parentChain || [];
		for (var i = 1; i <= group.numProperties; i++) {
			var property = group.property(i);
			if (!property) continue;

			var groupName = property.name;
			var currentChain = parentChain.concat([groupName]);

			if (property.matchName === "ADBE Vector Group") {
				// It's a sub-group. Recurse in .property("Contents").
				var groupItem = {
					name: groupName,
					type: "group",
					propertyChain: currentChain,
					groups: extractGroups(property.property("Contents"), groupName, currentChain)
				};
				groups.push(groupItem);

			} else if (property.matchName === "ADBE Vector Shape - Group") {
				// It's an actual path
				groups.push({
					name: groupName,
					type: "shape",
					propertyChain: currentChain,
					path: property.property("Path")
				});
			}
			// Skip strokes, fills, transforms, etc.
		}
		return groups;
	}

	/**
	 * Recursively creates a tree view structure (folders for groups, items for shapes).
	 *
	 * @param {Object[]} groups - Array of group/shape objects from extractGroups().
	 * @param {TreeNode} parentNode - The parent node in the tree view.
	 * @param {TreeView} treeView - The tree view.
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
	 * Retrieves the path property based on the TreeView selection.
	 *
	 * @param {TreeView} treeView - The populated tree view.
	 * @param {AVLayer} aeLayer - The shape layer.
	 * @returns {Object|null} - { pathString, pathObject }
	 */
	function getAEPathAndObject(treeView, aeLayer) {
		var selectedItem = treeView.selection;
		if (!selectedItem) {
			alert("Nothing selected!");
			return null;
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

		// Finally ("Path")
		aePathString += '("Path")';
		if (currentAEObject && currentAEObject.property("Path")) {
			currentAEObject = currentAEObject.property("Path");
		} else {
			alert("Path property not found");
			return null;
		}

		return { pathString: aePathString, pathObject: currentAEObject };
	}

	/**
	 * Removes all markers whose comment includes "Animation Easing" from a layer.
	 */
	function removeExistingAnimationEasingMarkers(layer) {
		var markerProp = layer.property("Marker");
		if (markerProp) {
			// Remove keys backwards so indices don't shift
			for (var i = markerProp.numKeys; i >= 1; i--) {
				var markerValue = markerProp.keyValue(i);
				if (markerValue && markerValue.comment) {
					if (markerValue.comment.indexOf("Animation Easing") !== -1) {
						markerProp.removeKey(i);
					}
				}
			}
		}
	}

	/********************************* 1) ENSURE COMP + POSITION PROP ********************************/
	var comp = app.project.activeItem;
	if (!comp || !(comp instanceof CompItem)) {
		alert("Please open a composition first.");
		return;
	}

	var selectedProps = comp.selectedProperties;
	if (!selectedProps || selectedProps.length === 0) {
		alert("No property selected. Please select a Position property.");
		return;
	}

	var selectedProp = selectedProps[0];
	if (!selectedProp || selectedProp.matchName !== "ADBE Position") {
		alert("Please select a Position property.");
		return;
	}

	/********************************* 2) SHAPE LAYER SELECTION DIALOG ********************************/
	var layers = comp.layers;
	var shapeLayers = [];
	for (var i = 1; i <= layers.length; i++) {
		var ly = layers[i];
		// A shape layer typically has .property("Contents")
		if (ly.property("Contents")) {
			shapeLayers.push(ly);
		}
	}

	if (shapeLayers.length === 0) {
		alert("No shape layers found in this comp.");
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

	var layerBtns = layerDialog.add("group");
	layerBtns.add("button", undefined, "OK", { name: "ok" });
	layerBtns.add("button", undefined, "Cancel", { name: "cancel" });

	if (layerDialog.show() !== 1 || !layerList.selection) {
		// user canceled
		return;
	}

	var selectedShapeLayer = shapeLayers[layerList.selection.index];

	/********************************* 3) BUILD DATA + TREEVIEW FOR PATHS ********************************/
	var shapeData = extractGroups(selectedShapeLayer.property("Contents"), selectedShapeLayer.name, []);

	var pathDialog = new Window("dialog", "Select Path");
	pathDialog.alignChildren = "fill";

	var treeView = pathDialog.add("treeview", undefined, "", { showHeaders: false, multiselect: false });
	treeView.size = [300, 300];

	var pathBtns = pathDialog.add("group");
	pathBtns.add("button", undefined, "OK", { name: "ok" });
	pathBtns.add("button", undefined, "Cancel", { name: "cancel" });

	// Populate
	createTreeView(shapeData, treeView, treeView);

	if (pathDialog.show() !== 1 || !treeView.selection) {
		return;
	}

	var pathInfo = getAEPathAndObject(treeView, selectedShapeLayer);
	if (!pathInfo) {
		return;
	}
	// pathInfo = { pathString: "...", pathObject: ... }


	/********************************* 4) EASING + DURATION + REVERSE DIALOG ********************************/
	var settingsDialog = new Window("dialog", "Animation Settings");
	settingsDialog.alignChildren = "left";

	// Easing label + dropdown
	settingsDialog.add("statictext", undefined, "Select Easing (for marker):");
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

	]);
	easingDropdown.selection = 0; // default to "Linear"

	// Duration label + input
	settingsDialog.add("statictext", undefined, "Duration (frames):");
	var durationInput = settingsDialog.add("edittext", undefined, "60");
	durationInput.characters = 8;

	// Reverse direction
	var reverseCheck = settingsDialog.add("checkbox", undefined, "Reverse Direction?");
	reverseCheck.value = false;

	var setButtons = settingsDialog.add("group");
	setButtons.add("button", undefined, "OK", { name: "ok" });
	setButtons.add("button", undefined, "Cancel", { name: "cancel" });

	if (settingsDialog.show() !== 1) {
		return;
	}

	// parse chosen easing
	var chosenEasingMatch = easingDropdown.selection.text.match(/\((.+)\)/);
	var chosenEasingVals = chosenEasingMatch ? chosenEasingMatch[1] : "0,0,1,1"; // fallback

	// parse duration
	var durationFrames = parseInt(durationInput.text, 10);
	if (isNaN(durationFrames) || durationFrames <= 0) {
		alert("Invalid duration value.");
		return;
	}
	var durationSeconds = durationFrames / comp.frameRate;
	var reverseRequested = reverseCheck.value;


	/********************************** 5) BUILD EXPRESSION *********************************/
	// The expression always uses [0,0,1,1] as the fallback if:
	//  - no marker is found
	//  - marker doesn't have Easing
	//  - marker's Easing is invalid
	//
	// But we'll write the user-chosen EASING into the new marker we create,
	// so in normal usage, that will override the default [0,0,1,1].

	var expressionStr =
		"// Animate layer along a shape path using pointOnPath().\n" +
		"// Default fallback Easing: [0,0,1,1] (linear) if marker absent or invalid.\n" +
		"// Partial segments by %, loop/ping-pong, reverse direction.\n" +
		"\n" +
		"var defaultDuration = " + durationSeconds + ";\n" +
		"var defaultEasing   = [0,0,1,1];  // always fallback to linear\n" +
		"var defaultSegment  = [0,100];    // entire path\n" +
		"var defaultLoop     = \"none\";   // no loop or ping-pong by default\n" +
		"\n" +
		"// Reverse direction checkbox\n" +
		"var reverseDir = effect(\"Reverse Direction\")(\"Checkbox\") > 0;\n" +
		"\n" +
		"function clamp(v, mn, mx){ return Math.min(Math.max(v, mn), mx); }\n" +
		"\n" +
		"// Find marker with 'Animation' in the comment.\n" +
		"var markerData = null;\n" +
		"for(var mk=1; mk<=thisLayer.marker.numKeys; mk++){\n" +
		"  var mVal = thisLayer.marker.key(mk);\n" +
		"  if(mVal.comment && mVal.comment.indexOf(\"Animation\") !== -1){\n" +
		"    markerData = mVal;\n" +
		"    break;\n" +
		"  }\n" +
		"}\n" +
		"\n" +
		"var startTime = markerData ? markerData.time : inPoint;\n" +
		"var duration  = markerData ? (markerData.duration > 0 ? markerData.duration : defaultDuration) : defaultDuration;\n" +
		"var easing    = defaultEasing;\n" +
		"var segment   = defaultSegment;\n" +
		"var loopMode  = defaultLoop;\n" +
		"\n" +
		"if(markerData){\n" +
		"  // parse marker comment, e.g. \"Animation Easing: 0.42,0,0.58,1 || Segment 20 - 75% || Loop\"\n" +
		"  var parts = markerData.comment.split(\"||\");\n" +
		"  for(var i=0; i<parts.length; i++){ parts[i] = parts[i].replace(/^\\s+|\\s+$/g, \"\"); }\n" +
		"\n" +
		"  // parse Easing\n" +
		"  var easeRE = /Easing:\\s*([-+]?[0-9]*\\.?[0-9]+),\\s*([-+]?[0-9]*\\.?[0-9]+),\\s*([-+]?[0-9]*\\.?[0-9]+),\\s*([-+]?[0-9]*\\.?[0-9]+)/;\n" +
		"  for(var e=0; e<parts.length; e++){\n" +
		"    if(parts[e].indexOf(\"Easing\")!==-1){\n" +
		"      var m = parts[e].match(easeRE);\n" +
		"      if(m){\n" +
		"        easing = [ parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4]) ];\n" +
		"      }\n" +
		"      break;\n" +
		"    }\n" +
		"  }\n" +
		"\n" +
		"  // parse Segment by percentage\n" +
		"  var segRE = /Segment\\s+([0-9]+\\.?[0-9]*)%?\\s*-\\s*([0-9]+\\.?[0-9]*)%/i;\n" +
		"  for(var s=0; s<parts.length; s++){\n" +
		"    if(parts[s].indexOf(\"Segment\")!==-1){\n" +
		"      var pm = parts[s].match(segRE);\n" +
		"      if(pm){\n" +
		"        segment = [ parseFloat(pm[1]), parseFloat(pm[2]) ];\n" +
		"      }\n" +
		"      break;\n" +
		"    }\n" +
		"  }\n" +
		"\n" +
		"  // parse Loop / PingPong\n" +
		"  for(var l=0; l<parts.length; l++){\n" +
		"    if(/loop/i.test(parts[l])){\n" +
		"      loopMode = \"loop\";\n" +
		"    } else if(/ping\\s*-?\\s*pong/i.test(parts[l])){\n" +
		"      loopMode = \"pingpong\";\n" +
		"    }\n" +
		"  }\n" +
		"}\n" +
		"\n" +
		"// Cubic Bezier function\n" +
		"function cubicBezier(t, p1x,p1y, p2x,p2y){\n" +
		"  function bz(tt, p0,p1,p2,p3){\n" +
		"    var c=3*(p1-p0);\n" +
		"    var b=3*(p2-p1)-c;\n" +
		"    var a=1-c-b;\n" +
		"    return ((a*tt+b)*tt + c)*tt + p0;\n" +
		"  }\n" +
		"  function getTForX(x, eps){\n" +
		"    var guess=x;\n" +
		"    for(var i=0;i<10;i++){\n" +
		"      var xEst = bz(guess, 0,p1x,p2x,1);\n" +
		"      var dx   = (bz(guess+eps, 0,p1x,p2x,1)-xEst)/eps;\n" +
		"      if(Math.abs(xEst-x)<eps) return guess;\n" +
		"      guess -= (xEst-x)/dx;\n" +
		"    }\n" +
		"    return guess;\n" +
		"  }\n" +
		"  var eps=1e-5;\n" +
		"  var solved=getTForX(t, eps);\n" +
		"  return bz(solved, 0, p1y,p2y,1);\n" +
		"}\n" +
		"\n" +
		"// Loop/pingpong\n" +
		"function getLoopedProgress(tm, st, dur, mode){\n" +
		"  var locT = tm - st;\n" +
		"  function cl(v){return clamp(v,0,1);} // shorthand\n" +
		"\n" +
		"  if(mode==='none'){\n" +
		"    return cl(locT/dur);\n" +
		"  } else if(mode==='loop'){\n" +
		"    if(dur<=0) return 0;\n" +
		"    var mv = locT%dur; if(mv<0) mv+=dur;\n" +
		"    return cl(mv/dur);\n" +
		"  } else if(mode==='pingpong'){\n" +
		"    if(dur<=0) return 0;\n" +
		"    var cycle=2*dur;\n" +
		"    var mv2= locT%cycle; if(mv2<0) mv2+=cycle;\n" +
		"    if(mv2<=dur){\n" +
		"      return cl(mv2/dur);\n" +
		"    } else {\n" +
		"      return cl(1 - ((mv2-dur)/dur));\n" +
		"    }\n" +
		"  }\n" +
		"  return 0;\n" +
		"}\n" +
		"\n" +
		"// 1) raw progress\n" +
		"var rawP = getLoopedProgress(time, startTime, duration, loopMode);\n" +
		"// 2) eased\n" +
		"var eased = cubicBezier(rawP, easing[0], easing[1], easing[2], easing[3]);\n" +
		"// 3) reverse?\n" +
		"var finalP = reverseDir ? 1 - eased : eased;\n" +
		"\n" +
		"// 4) partial by %\n" +
		"var segStart = clamp(segment[0], 0, 100)/100;\n" +
		"var segEnd   = clamp(segment[1], 0, 100)/100;\n" +
		"if(segEnd<segStart){ var tmp=segStart; segStart=segEnd; segEnd=tmp; }\n" +
		"var subP = linear(finalP, 0,1, segStart, segEnd);\n" +
		"\n" +
		"// 5) pointOnPath(subP)\n" +
		"// We'll call .toComp() on the actual shape layer:\n" +
		"var shapeLayer = thisComp.layer(" + JSON.stringify(selectedShapeLayer.name) + ");\n" +
		"var thePath    = " + pathInfo.pathString + ";\n" +
		"var pathPos    = thePath.pointOnPath(subP); // local coords\n" +
		"var compPos    = shapeLayer.toComp(pathPos);\n" +
		"\n" +
		"// if this layer is parented, fromComp\n" +
		"if(thisLayer.hasParent){\n" +
		"  compPos = parent.fromComp(compPos);\n" +
		"}\n" +
		"\n" +
		"compPos; // done.\n";

	/********************************** 6) ASSIGN EXPRESSION & ADD UI *********************************/
	selectedProp.expression = expressionStr;

	// Create or find the "Reverse Direction" checkbox on the same layer
	var posLayer = selectedProp.propertyGroup(selectedProp.propertyDepth);
	if (posLayer && posLayer("ADBE Effect Parade")) {
		if (!posLayer.effect("Reverse Direction")) {
			var reverseFx = posLayer("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
			reverseFx.name = "Reverse Direction";
		}
	}

	// Remove any existing "Animation Easing" markers, then add a new marker
	removeExistingAnimationEasingMarkers(posLayer);

	var markerProp = posLayer.property("Marker");
	if (!markerProp) {
		posLayer.addProperty("ADBE Marker");
		markerProp = posLayer.property("Marker");
	}

	// We'll put the user-chosen easing in the marker comment
	// If the marker is missing or the "Easing" line is messed up,
	// the expression will fallback to [0,0,1,1].
	var defaultComment = "Animation Easing: " + chosenEasingVals + " || Segment 0 - 100%";
	var newMarker = new MarkerValue(defaultComment);
	newMarker.duration = durationSeconds; // same as user-chosen
	markerProp.setValueAtTime(posLayer.inPoint, newMarker);

	// Reverse direction is controlled by the checkbox, not the marker.
	app.endUndoGroup();
})();

