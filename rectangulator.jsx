// rectaangulator.jsx
// Script to convert a parametric rectangle to a bezier path with individual corner rounding controls

// Include the RefManager module
//@include "./modules/RefManager.js"

(function () {
    // Check if a composition is active
    if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please open a composition first.");
        return;
    }

    var comp = app.project.activeItem;
    var selectedLayers = comp.selectedLayers;

    // Check if a layer is selected
    if (selectedLayers.length === 0) {
        alert("Please select a shape layer with a rectangle.");
        return;
    }

    var layer = selectedLayers[0];

    // Check if the selected layer is a shape layer
    if (!(layer instanceof ShapeLayer)) {
        alert("Please select a shape layer with a rectangle.");
        return;
    }

    // Find rectangle shape in the layer
    var rectFound = false;
    var rectPath;
    var rectProps = {
        size: [100, 100],
        position: [0, 0],
        roundness: 0
    };
    var rectPosition = [0, 0];
    var rectRef = null;
    var rectGroupRef = null;

    // Function to recursively trace the transform hierarchy
    function getCompositePosition(prop) {
        var position = [0, 0];
        var parent = prop.parentProperty;

        // If this is a shape property with its own position
        try {
            if (prop.property && prop.property("ADBE Vector Rect Position")) {
                position = prop.property("ADBE Vector Rect Position").value;
            }
        } catch (e) { }

        // Traverse up the hierarchy to accumulate transforms
        while (parent) {
            try {
                if (parent.property && parent.property("ADBE Vector Transform Group")) {
                    var transform = parent.property("ADBE Vector Transform Group");
                    if (transform.property("ADBE Vector Position")) {
                        var parentPos = transform.property("ADBE Vector Position").value;
                        position = [position[0] + parentPos[0], position[1] + parentPos[1]];
                    }
                }
            } catch (e) { }

            parent = parent.parentProperty;
        }

        return position;
    }

    function findRectangle(property) {
        if (rectFound) return;

        try {
            // Direct match for rectangle shape
            if (property && property.matchName === "ADBE Vector Shape - Rect") {
                rectPath = property;
                rectFound = true;

                // Store a reference to the rectangle
                rectRef = RefManager.store(property);

                // Store rectangle properties
                try {
                    if (property.property("ADBE Vector Rect Size")) {
                        rectProps.size = property.property("ADBE Vector Rect Size").value;
                    }
                } catch (e) { }

                try {
                    if (property.property("ADBE Vector Rect Position")) {
                        rectProps.position = property.property("ADBE Vector Rect Position").value;
                    }
                } catch (e) { }

                try {
                    if (property.property("ADBE Vector Rect Roundness")) {
                        rectProps.roundness = property.property("ADBE Vector Rect Roundness").value;
                    }
                } catch (e) { }

                // Get the full composite position including all parent transforms
                rectPosition = getCompositePosition(property);

                // Find and store the containing group
                var parent = property.parentProperty;
                while (parent && parent.matchName !== "ADBE Vector Group") {
                    parent = parent.parentProperty;
                }

                if (parent) {
                    rectGroupRef = RefManager.store(parent);

                    // We no longer need this code since we're using getCompositePosition
                    // which already includes all transform positions
                }

                return;
            }

            // Special case for groups named "Rectangle" or containing "Rectangle"
            if (property && property.name && property.name.indexOf("Rectangle") !== -1) {
                // This might be a group containing a rectangle, check its contents
                if (property.property("ADBE Vectors Group")) {
                    var contents = property.property("ADBE Vectors Group");
                    for (var r = 1; r <= contents.numProperties; r++) {
                        try {
                            var contentProp = contents.property(r);
                            if (contentProp && contentProp.matchName === "ADBE Vector Shape - Rect") {
                                rectPath = contentProp;
                                rectFound = true;

                                // Store a reference to the rectangle
                                rectRef = RefManager.store(contentProp);

                                // Store rectangle properties
                                try {
                                    if (contentProp.property("ADBE Vector Rect Size")) {
                                        rectProps.size = contentProp.property("ADBE Vector Rect Size").value;
                                    }
                                } catch (e) { }

                                try {
                                    if (contentProp.property("ADBE Vector Rect Position")) {
                                        rectProps.position = contentProp.property("ADBE Vector Rect Position").value;
                                    }
                                } catch (e) { }

                                try {
                                    if (contentProp.property("ADBE Vector Rect Roundness")) {
                                        rectProps.roundness = contentProp.property("ADBE Vector Rect Roundness").value;
                                    }
                                } catch (e) { }

                                // Get the full composite position including all parent transforms
                                rectPosition = getCompositePosition(contentProp);

                                // Store the containing group
                                rectGroupRef = RefManager.store(property);

                                // We no longer need this code since we're using getCompositePosition
                                // which already includes all transform positions

                                return;
                            }
                        } catch (e) { }
                    }
                }
            }

            // Check if it's a group that might contain a rectangle
            if (property && (property.propertyType === PropertyType.INDEXED_GROUP ||
                property.propertyType === PropertyType.NAMED_GROUP)) {
                for (var i = 1; i <= property.numProperties; i++) {
                    try {
                        var subProp = property.property(i);
                        if (subProp) {
                            findRectangle(subProp);
                        }
                    } catch (e) { }
                }
            }
        } catch (e) { }
    }

    try {
        // Search for rectangle in shape layer
        var rootVectors = null;
        try {
            rootVectors = layer.property("ADBE Root Vectors Group");
        } catch (e) {
            alert("Error accessing shape properties: " + e.toString());
            return;
        }

        if (rootVectors) {
            var numProps = 0;
            try {
                numProps = rootVectors.numProperties;
            } catch (e) {
                alert("Error getting number of properties: " + e.toString());
                return;
            }

            for (var i = 1; i <= numProps; i++) {
                try {
                    var prop = rootVectors.property(i);
                    if (prop) {
                        findRectangle(prop);
                    }
                } catch (e) { }
            }
        }

        if (!rectFound || !rectRef) {
            alert("No rectangle found in the selected shape layer.");
            return;
        }

        app.beginUndoGroup("Rounderator");

        // Store information about fill and stroke before making any changes
        var fillProps = [];
        var strokeProps = [];
        var transformProps = null;

        try {
            // Get a fresh reference to the rectangle group
            var rectGroup = RefManager.resolve(rectGroupRef);

            if (rectGroup && rectGroup.property("ADBE Vectors Group")) {
                var vectorsGroup = rectGroup.property("ADBE Vectors Group");

                // Check for fill and store its properties
                for (var j = 1; j <= vectorsGroup.numProperties; j++) {
                    try {
                        var prop = vectorsGroup.property(j);
                        if (prop && prop.matchName === "ADBE Vector Graphic - Fill") {
                            var fillObj = {
                                color: prop.property("ADBE Vector Fill Color").value,
                                opacity: prop.property("ADBE Vector Fill Opacity").value,
                                blendMode: prop.property("ADBE Vector Fill Rule").value,
                                enabled: prop.enabled
                            };
                            fillProps.push(fillObj);
                        }
                    } catch (e) { }
                }

                // Check for stroke and store its properties
                for (var k = 1; k <= vectorsGroup.numProperties; k++) {
                    try {
                        var strokeProp = vectorsGroup.property(k);
                        if (strokeProp && strokeProp.matchName === "ADBE Vector Graphic - Stroke") {
                            var strokeObj = {
                                color: strokeProp.property("ADBE Vector Stroke Color").value,
                                opacity: strokeProp.property("ADBE Vector Stroke Opacity").value,
                                width: strokeProp.property("ADBE Vector Stroke Width").value,
                                lineCap: strokeProp.property("ADBE Vector Stroke Line Cap").value,
                                lineJoin: strokeProp.property("ADBE Vector Stroke Line Join").value,
                                miterLimit: strokeProp.property("ADBE Vector Stroke Miter Limit").value,
                                enabled: strokeProp.enabled
                            };
                            strokeProps.push(strokeObj);
                        }
                    } catch (e) { }
                }

                // Get transform properties
                try {
                    if (rectGroup.property("ADBE Vector Transform Group")) {
                        var transform = rectGroup.property("ADBE Vector Transform Group");
                        transformProps = {
                            position: transform.property("ADBE Vector Position").value,
                            anchorPoint: transform.property("ADBE Vector Anchor Point").value,
                            scale: transform.property("ADBE Vector Scale").value,
                            rotation: transform.property("ADBE Vector Rotation").value,
                            opacity: transform.property("ADBE Vector Group Opacity").value,
                            skew: transform.property("ADBE Vector Skew").value,
                            skewAxis: transform.property("ADBE Vector Skew Axis").value
                        };
                    }
                } catch (e) { }
            }
        } catch (e) { }

        // Prepare the expression string - completely rewritten for better corner rounding
        var expression = "// Custom rounded rectangle with individual corner control\n" +
            "var width = effect(\"Width\")(\"Slider\");\n" +
            "var height = effect(\"Height\")(\"Slider\");\n" +
            "var tlPercent = effect(\"Top Left Roundness %\")(\"Slider\");\n" +
            "var trPercent = effect(\"Top Right Roundness %\")(\"Slider\");\n" +
            "var brPercent = effect(\"Bottom Right Roundness %\")(\"Slider\");\n" +
            "var blPercent = effect(\"Bottom Left Roundness %\")(\"Slider\");\n" +
            "var posOffset = effect(\"Position Offset\")(\"Point\");\n" +
            "var anchorType = effect(\"Anchor Point\")(\"Menu\");\n" +
            "\n" +
            "// Calculate the maximum roundness based on the smallest dimension\n" +
            "var maxRound = Math.min(width, height);\n" +
            "\n" +
            "// First, clamp individual percentages to 0-100%\n" +
            "tlPercent = Math.max(0, Math.min(100, tlPercent));\n" +
            "trPercent = Math.max(0, Math.min(100, trPercent));\n" +
            "brPercent = Math.max(0, Math.min(100, brPercent));\n" +
            "blPercent = Math.max(0, Math.min(100, blPercent));\n" +
            "\n" +
            "// Convert percentages to actual roundness values (0-100% -> 0-maxRound)\n" +
            "var tl = (tlPercent / 100) * maxRound;\n" +
            "var tr = (trPercent / 100) * maxRound;\n" +
            "var br = (brPercent / 100) * maxRound;\n" +
            "var bl = (blPercent / 100) * maxRound;\n" +
            "\n" +
            "// Ensure all roundness values are non-negative\n" +
            "tl = Math.max(0, tl);\n" +
            "tr = Math.max(0, tr);\n" +
            "br = Math.max(0, br);\n" +
            "bl = Math.max(0, bl);\n" +
            "\n" +
            "// Apply constraints to prevent distortion\n" +
            "// For horizontal sides (top and bottom)\n" +
            "var maxTopRoundness = width / 2;\n" +
            "var maxBottomRoundness = width / 2;\n" +
            "\n" +
            "// For vertical sides (left and right)\n" +
            "var maxLeftRoundness = height / 2;\n" +
            "var maxRightRoundness = height / 2;\n" +
            "\n" +
            "// Constraint pairs that share an edge (can intersect)\n" +
            "// Left edge: top-left and bottom-left\n" +
            "if (tlPercent + blPercent > 100) {\n" +
            "    // Clamp bottom-left based on top-left value\n" +
            "    blPercent = Math.min(blPercent, 100 - tlPercent);\n" +
            "    bl = (blPercent / 100) * maxRound;\n" +
            "}\n" +
            "\n" +
            "// Right edge: top-right and bottom-right\n" +
            "if (trPercent + brPercent > 100) {\n" +
            "    // Clamp bottom-right based on top-right value\n" +
            "    brPercent = Math.min(brPercent, 100 - trPercent);\n" +
            "    br = (brPercent / 100) * maxRound;\n" +
            "}\n" +
            "\n" +
            "// Top edge: top-left and top-right\n" +
            "// Only apply constraint if the width is small enough that the corners could intersect\n" +
            "if (tlPercent + trPercent > 100 && width <= height) {\n" +
            "    // Clamp top-right based on top-left value\n" +
            "    trPercent = Math.min(trPercent, 100 - tlPercent);\n" +
            "    tr = (trPercent / 100) * maxRound;\n" +
            "}\n" +
            "\n" +
            "// Bottom edge: bottom-left and bottom-right\n" +
            "// Only apply constraint if the width is small enough that the corners could intersect\n" +
            "if (blPercent + brPercent > 100 && width <= height) {\n" +
            "    // Clamp bottom-right based on bottom-left value\n" +
            "    brPercent = Math.min(brPercent, 100 - blPercent);\n" +
            "    br = (brPercent / 100) * maxRound;\n" +
            "}\n" +
            "\n" +
            "// Additional physical constraints to prevent distortion\n" +
            "// Ensure corners don't exceed physical limits\n" +
            "if (tl + tr > width) {\n" +
            "    var scale = width / (tl + tr);\n" +
            "    tl *= scale;\n" +
            "    tr *= scale;\n" +
            "}\n" +
            "\n" +
            "if (bl + br > width) {\n" +
            "    var scale = width / (bl + br);\n" +
            "    bl *= scale;\n" +
            "    br *= scale;\n" +
            "}\n" +
            "\n" +
            "if (tl + bl > height) {\n" +
            "    var scale = height / (tl + bl);\n" +
            "    tl *= scale;\n" +
            "    bl *= scale;\n" +
            "}\n" +
            "\n" +
            "if (tr + br > height) {\n" +
            "    var scale = height / (tr + br);\n" +
            "    tr *= scale;\n" +
            "    br *= scale;\n" +
            "}\n" +
            "\n" +
            "// Calculate points\n" +
            "var w = width / 2;\n" +
            "var h = height / 2;\n" +
            "\n" +
            "// Calculate anchor point offset based on dropdown selection\n" +
            "var anchorX = 0;\n" +
            "var anchorY = 0;\n" +
            "\n" +
            "switch(anchorType) {\n" +
            "    case 1: // Top Left\n" +
            "        anchorX = -w;\n" +
            "        anchorY = -h;\n" +
            "        break;\n" +
            "    case 2: // Top Center\n" +
            "        anchorX = 0;\n" +
            "        anchorY = -h;\n" +
            "        break;\n" +
            "    case 3: // Top Right\n" +
            "        anchorX = w;\n" +
            "        anchorY = -h;\n" +
            "        break;\n" +
            "    case 4: // Middle Left\n" +
            "        anchorX = -w;\n" +
            "        anchorY = 0;\n" +
            "        break;\n" +
            "    case 5: // Middle Center\n" +
            "        anchorX = 0;\n" +
            "        anchorY = 0;\n" +
            "        break;\n" +
            "    case 6: // Middle Right\n" +
            "        anchorX = w;\n" +
            "        anchorY = 0;\n" +
            "        break;\n" +
            "    case 7: // Bottom Left\n" +
            "        anchorX = -w;\n" +
            "        anchorY = h;\n" +
            "        break;\n" +
            "    case 8: // Bottom Center\n" +
            "        anchorX = 0;\n" +
            "        anchorY = h;\n" +
            "        break;\n" +
            "    case 9: // Bottom Right\n" +
            "        anchorX = w;\n" +
            "        anchorY = h;\n" +
            "        break;\n" +
            "    default: // Default to Middle Center\n" +
            "        anchorX = 0;\n" +
            "        anchorY = 0;\n" +
            "}\n" +
            "\n" +
            "// Apply position offset\n" +
            "var offsetX = posOffset[0];\n" +
            "var offsetY = posOffset[1];\n" +
            "// Note: Position offset is now handled by the position expression\n" +
            "// and not applied to the path vertices\n" +
            "\n" +
            "// Create path arrays\n" +
            "var vertices = [];\n" +
            "var inTangents = [];\n" +
            "var outTangents = [];\n" +
            "\n" +
            "// Calculate control point factor for bezier curves (0.552 gives a good approximation of a circle)\n" +
            "var cp = 0.552;\n" +
            "\n" +
            "// Always create 8 vertices (2 for each corner)\n" +
            "// Top-left corner (vertices 0 and 1)\n" +
            "var tlx1 = -w;\n" +
            "var tly1 = -h + tl;\n" +
            "var tlx2 = -w + tl;\n" +
            "var tly2 = -h;\n" +
            "\n" +
            "// Top-right corner (vertices 2 and 3)\n" +
            "var trx1 = w - tr;\n" +
            "var try1 = -h;\n" +
            "var trx2 = w;\n" +
            "var try2 = -h + tr;\n" +
            "\n" +
            "// Bottom-right corner (vertices 4 and 5)\n" +
            "var brx1 = w;\n" +
            "var bry1 = h - br;\n" +
            "var brx2 = w - br;\n" +
            "var bry2 = h;\n" +
            "\n" +
            "// Bottom-left corner (vertices 6 and 7)\n" +
            "var blx1 = -w + bl;\n" +
            "var bly1 = h;\n" +
            "var blx2 = -w;\n" +
            "var bly2 = h - bl;\n" +
            "\n" +
            "// If roundness is 0, make the vertices overlap\n" +
            "if (tl === 0) {\n" +
            "    tlx1 = tlx2 = -w;\n" +
            "    tly1 = tly2 = -h;\n" +
            "}\n" +
            "\n" +
            "if (tr === 0) {\n" +
            "    trx1 = trx2 = w;\n" +
            "    try1 = try2 = -h;\n" +
            "}\n" +
            "\n" +
            "if (br === 0) {\n" +
            "    brx1 = brx2 = w;\n" +
            "    bry1 = bry2 = h;\n" +
            "}\n" +
            "\n" +
            "if (bl === 0) {\n" +
            "    blx1 = blx2 = -w;\n" +
            "    bly1 = bly2 = h;\n" +
            "}\n" +
            "\n" +
            "// Add all vertices with anchor point and offset adjustments\n" +
            "// Add all vertices (no anchor point adjustment - handled by transform)\n" +
            "vertices.push([tlx1, tly1]);\n" +
            "vertices.push([tlx2, tly2]);\n" +
            "vertices.push([trx1, try1]);\n" +
            "vertices.push([trx2, try2]);\n" +
            "vertices.push([brx1, bry1]);\n" +
            "vertices.push([brx2, bry2]);\n" +
            "vertices.push([blx1, bly1]);\n" +
            "vertices.push([blx2, bly2]);\n" +
            "\n" +
            "// Initialize all tangents to zero\n" +
            "for (var i = 0; i < 8; i++) {\n" +
            "    inTangents.push([0, 0]);\n" +
            "    outTangents.push([0, 0]);\n" +
            "}\n" +
            "\n" +
            "// Set tangents only for rounded corners\n" +
            "// Top-left corner tangents\n" +
            "if (tl > 0) {\n" +
            "    outTangents[0] = [0, -tl * cp]; // TL first point out tangent\n" +
            "    inTangents[1] = [-tl * cp, 0];  // TL second point in tangent\n" +
            "}\n" +
            "\n" +
            "// Top-right corner tangents\n" +
            "if (tr > 0) {\n" +
            "    outTangents[2] = [tr * cp, 0];  // TR first point out tangent\n" +
            "    inTangents[3] = [0, -tr * cp];  // TR second point in tangent\n" +
            "}\n" +
            "\n" +
            "// Bottom-right corner tangents\n" +
            "if (br > 0) {\n" +
            "    outTangents[4] = [0, br * cp];  // BR first point out tangent\n" +
            "    inTangents[5] = [br * cp, 0];  // BR second point in tangent\n" +
            "}\n" +
            "\n" +
            "// Bottom-left corner tangents\n" +
            "if (bl > 0) {\n" +
            "    outTangents[6] = [-bl * cp, 0]; // BL first point out tangent\n" +
            "    inTangents[7] = [0, bl * cp];  // BL second point in tangent\n" +
            "}\n" +
            "\n" +
            "// Create the path\n" +
            "createPath(vertices, inTangents, outTangents, true);";

        // Create a new shape group first
        var contents = layer.property("ADBE Root Vectors Group");
        var newGroup = contents.addProperty("ADBE Vector Group");
        newGroup.name = "Parametric Rectangle";
        var newVectorsGroup = newGroup.property("ADBE Vectors Group");

        // First add the path to the group and immediately apply the expression
        var shapePath = newVectorsGroup.addProperty("ADBE Vector Shape - Group");
        shapePath.property("ADBE Vector Shape").expression = expression;

        // Store a reference to the shape path using RefManager
        var shapePathRef = RefManager.store(shapePath);

        // Now add fill and stroke to new group with the same properties as the original
        // Add fills with the same properties
        for (var f = 0; f < fillProps.length; f++) {
            try {
                var fill = fillProps[f];
                var newFill = newVectorsGroup.addProperty("ADBE Vector Graphic - Fill");
                newFill.property("ADBE Vector Fill Color").setValue(fill.color);
                newFill.property("ADBE Vector Fill Opacity").setValue(fill.opacity);
                newFill.property("ADBE Vector Fill Rule").setValue(fill.blendMode);
                newFill.enabled = fill.enabled;
            } catch (e) { }
        }

        // Add strokes with the same properties
        for (var s = 0; s < strokeProps.length; s++) {
            try {
                var stroke = strokeProps[s];
                var newStroke = newVectorsGroup.addProperty("ADBE Vector Graphic - Stroke");
                newStroke.property("ADBE Vector Stroke Color").setValue(stroke.color);
                newStroke.property("ADBE Vector Stroke Opacity").setValue(stroke.opacity);
                newStroke.property("ADBE Vector Stroke Width").setValue(stroke.width);
                newStroke.property("ADBE Vector Stroke Line Cap").setValue(stroke.lineCap);
                newStroke.property("ADBE Vector Stroke Line Join").setValue(stroke.lineJoin);
                newStroke.property("ADBE Vector Stroke Miter Limit").setValue(stroke.miterLimit);
                newStroke.enabled = stroke.enabled;
            } catch (e) { }
        }

        // If no fill or stroke was found, add defaults
        if (fillProps.length === 0) {
            try {
                newVectorsGroup.addProperty("ADBE Vector Graphic - Fill");
            } catch (e) { }
        }

        if (strokeProps.length === 0) {
            try {
                newVectorsGroup.addProperty("ADBE Vector Graphic - Stroke");
            } catch (e) { }
        }

        // Apply transform properties if available
        if (transformProps) {
            try {
                var newTransform = newGroup.property("ADBE Vector Transform Group");
                newTransform.property("ADBE Vector Position").setValue(transformProps.position);
                newTransform.property("ADBE Vector Anchor Point").setValue(transformProps.anchorPoint);
                newTransform.property("ADBE Vector Scale").setValue(transformProps.scale);
                newTransform.property("ADBE Vector Rotation").setValue(transformProps.rotation);
                newTransform.property("ADBE Vector Group Opacity").setValue(transformProps.opacity);
                newTransform.property("ADBE Vector Skew").setValue(transformProps.skew);
                newTransform.property("ADBE Vector Skew Axis").setValue(transformProps.skewAxis);
            } catch (e) { }
        }

        // Create all effects first before setting values or removing anything
        var effectsProperty = layer.property("ADBE Effect Parade");

        // Create all effects first and store references using RefManager
        var widthEffect = effectsProperty.addProperty("ADBE Slider Control");
        widthEffect.name = "Width";
        var widthEffectRef = RefManager.store(widthEffect);

        var heightEffect = effectsProperty.addProperty("ADBE Slider Control");
        heightEffect.name = "Height";
        var heightEffectRef = RefManager.store(heightEffect);

        var topLeftEffect = effectsProperty.addProperty("ADBE Slider Control");
        topLeftEffect.name = "Top Left Roundness %";
        var topLeftEffectRef = RefManager.store(topLeftEffect);

        var topRightEffect = effectsProperty.addProperty("ADBE Slider Control");
        topRightEffect.name = "Top Right Roundness %";
        var topRightEffectRef = RefManager.store(topRightEffect);

        var bottomRightEffect = effectsProperty.addProperty("ADBE Slider Control");
        bottomRightEffect.name = "Bottom Right Roundness %";
        var bottomRightEffectRef = RefManager.store(bottomRightEffect);

        var bottomLeftEffect = effectsProperty.addProperty("ADBE Slider Control");
        bottomLeftEffect.name = "Bottom Left Roundness %";
        var bottomLeftEffectRef = RefManager.store(bottomLeftEffect);

        var positionEffect = effectsProperty.addProperty("ADBE Point Control");
        positionEffect.name = "Position Offset";
        var positionEffectRef = RefManager.store(positionEffect);

        var dropdownEffect = effectsProperty.addProperty("ADBE Dropdown Control");
        // Don't set the name yet
        var dropdownEffectRef = RefManager.store(dropdownEffect);

        // Define the dropdown items
        var dropdownItems = ["Top Left", "Top Center", "Top Right", "Middle Left", "Middle Center", "Middle Right", "Bottom Left", "Bottom Center", "Bottom Right"];

        // Set the dropdown parameters first
        try {
            var freshDropdown = RefManager.resolve(dropdownEffectRef);
            freshDropdown.property(1).setPropertyParameters(dropdownItems);

            // Get a fresh reference again after setting parameters
            freshDropdown = RefManager.resolve(dropdownEffectRef);
            // Now set the name after setting parameters
            freshDropdown.name = "Anchor Point";
        } catch (e) {
            alert("Error setting dropdown parameters: " + e.toString());
        }

        // Now set all the values using fresh references
        RefManager.resolve(widthEffectRef).property("ADBE Slider Control-0001").setValue(rectProps.size[0]);
        RefManager.resolve(heightEffectRef).property("ADBE Slider Control-0001").setValue(rectProps.size[1]);

        // Convert absolute roundness to percentage (0-100)
        var roundnessPercent = (rectProps.roundness / Math.min(rectProps.size[0], rectProps.size[1])) * 100;
        roundnessPercent = Math.max(0, Math.min(100, roundnessPercent)); // Clamp between 0-100

        RefManager.resolve(topLeftEffectRef).property("ADBE Slider Control-0001").setValue(roundnessPercent);
        RefManager.resolve(topRightEffectRef).property("ADBE Slider Control-0001").setValue(roundnessPercent);
        RefManager.resolve(bottomRightEffectRef).property("ADBE Slider Control-0001").setValue(roundnessPercent);
        RefManager.resolve(bottomLeftEffectRef).property("ADBE Slider Control-0001").setValue(roundnessPercent);
        RefManager.resolve(positionEffectRef).property("ADBE Point Control-0001").setValue(rectPosition);
        RefManager.resolve(dropdownEffectRef).property(1).setValue(5); // Default to Middle Center

        // Instead of using expressions, directly set the anchor point and position based on the dropdown
        try {
            // Check if newGroup exists
            if (!newGroup) {
                alert("Error: newGroup is null");
                throw new Error("newGroup is null");
            }

            // Get reference to the transform group with error checking
            var transformGroup = newGroup.property("ADBE Vector Transform Group");
            if (!transformGroup) {
                alert("Error: transformGroup is null");
                throw new Error("transformGroup is null");
            }

            // Debug transform group properties
            var debugInfo = "Transform group properties (" + transformGroup.numProperties + "):\n";
            for (var i = 1; i <= transformGroup.numProperties; i++) {
                try {
                    var prop = transformGroup.property(i);
                    debugInfo += i + ": " + prop.name + " (" + prop.matchName + ")\n";
                } catch (e) {
                    debugInfo += i + ": Error accessing property\n";
                }
            }

            // Now properly access the anchor point and position using the property names from debug info
            var anchorPointProp = null;
            var positionProp = null;

            // Loop through properties to find anchor point and position by name and matchName
            for (var p = 1; p <= transformGroup.numProperties; p++) {
                try {
                    var prop = transformGroup.property(p);
                    var propName = prop.name.toLowerCase();
                    var propMatchName = prop.matchName;

                    // Check for anchor point property
                    if (propName.indexOf("anchor") !== -1 || propMatchName === "ADBE Vector Anchor Point") {
                        anchorPointProp = prop;
                    }

                    // Check for position property
                    if (propName.indexOf("position") !== -1 || propMatchName === "ADBE Vector Position") {
                        positionProp = prop;
                    }
                } catch (e) {
                    // Skip error properties
                }
            }

            // If we found both properties, set up the expressions
            if (anchorPointProp && positionProp) {
                // Get width and height values from effects
                var width = rectProps.size[0];
                var height = rectProps.size[1];

                // Set initial anchor point and position values based on Middle Center (default)
                anchorPointProp.setValue([0, 0]);
                positionProp.setValue(rectPosition);

                // Create expressions that will update when the dropdown changes - using AE's simpler expression style
                var anchorPointExpr = "// Anchor point expression\n" +
                    "try {\n" +
                    "    w = effect(\"Width\")(\"Slider\") / 2;\n" +
                    "    h = effect(\"Height\")(\"Slider\") / 2;\n" +
                    "    anchorType = effect(\"Anchor Point\")(\"Menu\");\n" +
                    "    result = [0, 0];\n" +
                    "\n" +
                    "    if (anchorType == 1) result = [-w, -h]; // Top Left\n" +
                    "    else if (anchorType == 2) result = [0, -h]; // Top Center\n" +
                    "    else if (anchorType == 3) result = [w, -h]; // Top Right\n" +
                    "    else if (anchorType == 4) result = [-w, 0]; // Middle Left\n" +
                    "    else if (anchorType == 5) result = [0, 0]; // Middle Center\n" +
                    "    else if (anchorType == 6) result = [w, 0]; // Middle Right\n" +
                    "    else if (anchorType == 7) result = [-w, h]; // Bottom Left\n" +
                    "    else if (anchorType == 8) result = [0, h]; // Bottom Center\n" +
                    "    else if (anchorType == 9) result = [w, h]; // Bottom Right\n" +
                    "    else result = [0, 0]; // Default\n" +
                    "\n" +
                    "    result;\n" +
                    "} catch (err) {\n" +
                    "    [0, 0];\n" +
                    "}";

                var positionExpr = "// Position expression with width/height tracking for proper anchor-based resizing\n" +
                    "try {\n" +
                    "    // Get current values\n" +
                    "    var width = effect(\"Width\")(\"Slider\");\n" +
                    "    var height = effect(\"Height\")(\"Slider\");\n" +
                    "    var posOffset = effect(\"Position Offset\")(\"Point\");\n" +
                    "    var anchorType = effect(\"Anchor Point\")(\"Menu\");\n" +
                    "    \n" +
                    "    // Initialize persistent variables if not yet defined\n" +
                    "    if (typeof __lastWidth === 'undefined') {\n" +
                    "        __lastWidth = width;\n" +
                    "        __lastHeight = height;\n" +
                    "        __lastAnchorType = anchorType;\n" +
                    "        __basePos = [posOffset[0], posOffset[1]];\n" +
                    "    }\n" +
                    "    \n" +
                    "    // Calculate dimensional changes\n" +
                    "    var widthDelta = width - __lastWidth;\n" +
                    "    var heightDelta = height - __lastHeight;\n" +
                    "    var anchorChanged = (__lastAnchorType != anchorType);\n" +
                    "    \n" +
                    "    // Get current position or initialize it\n" +
                    "    var currentPos = value;\n" +
                    "    \n" +
                    "    // Position adjustments based on anchor point and size changes\n" +
                    "    var xAdj = 0;\n" +
                    "    var yAdj = 0;\n" +
                    "    \n" +
                    "    // Apply proper position adjustment based on anchor type\n" +
                    "    switch(anchorType) {\n" +
                    "        case 1: // Top Left - no adjustment needed\n" +
                    "            xAdj = 0;\n" +
                    "            yAdj = 0;\n" +
                    "            break;\n" +
                    "        case 2: // Top Center\n" +
                    "            xAdj = -widthDelta/2;\n" +
                    "            yAdj = 0;\n" +
                    "            break;\n" +
                    "        case 3: // Top Right\n" +
                    "            xAdj = -widthDelta;\n" +
                    "            yAdj = 0;\n" +
                    "            break;\n" +
                    "        case 4: // Middle Left\n" +
                    "            xAdj = 0;\n" +
                    "            yAdj = -heightDelta/2;\n" +
                    "            break;\n" +
                    "        case 5: // Middle Center\n" +
                    "            xAdj = -widthDelta/2;\n" +
                    "            yAdj = -heightDelta/2;\n" +
                    "            break;\n" +
                    "        case 6: // Middle Right\n" +
                    "            xAdj = -widthDelta;\n" +
                    "            yAdj = -heightDelta/2;\n" +
                    "            break;\n" +
                    "        case 7: // Bottom Left\n" +
                    "            xAdj = 0;\n" +
                    "            yAdj = -heightDelta;\n" +
                    "            break;\n" +
                    "        case 8: // Bottom Center\n" +
                    "            xAdj = -widthDelta/2;\n" +
                    "            yAdj = -heightDelta;\n" +
                    "            break;\n" +
                    "        case 9: // Bottom Right\n" +
                    "            xAdj = -widthDelta;\n" +
                    "            yAdj = -heightDelta;\n" +
                    "            break;\n" +
                    "        default: // Default to Middle Center\n" +
                    "            xAdj = -widthDelta/2;\n" +
                    "            yAdj = -heightDelta/2;\n" +
                    "    }\n" +
                    "    \n" +
                    "    // Calculate new position\n" +
                    "    var newPos = [currentPos[0] + xAdj, currentPos[1] + yAdj];\n" +
                    "    \n" +
                    "    // Handle anchor point changes specially\n" +
                    "    if (anchorChanged) {\n" +
                    "        // If anchor point type changed, recalculate from original position\n" +
                    "        var w = width/2;\n" +
                    "        var h = height/2;\n" +
                    "        var baseX = __basePos[0];\n" +
                    "        var baseY = __basePos[1];\n" +
                    "        \n" +
                    "        // Calculate anchor offset based on new anchor type\n" +
                    "        var anchorX = 0, anchorY = 0;\n" +
                    "        \n" +
                    "        switch(anchorType) {\n" +
                    "            case 1: anchorX = -w; anchorY = -h; break; // Top Left\n" +
                    "            case 2: anchorX = 0;  anchorY = -h; break; // Top Center\n" +
                    "            case 3: anchorX = w;  anchorY = -h; break; // Top Right\n" +
                    "            case 4: anchorX = -w; anchorY = 0;  break; // Middle Left\n" +
                    "            case 5: anchorX = 0;  anchorY = 0;  break; // Middle Center\n" +
                    "            case 6: anchorX = w;  anchorY = 0;  break; // Middle Right\n" +
                    "            case 7: anchorX = -w; anchorY = h;  break; // Bottom Left\n" +
                    "            case 8: anchorX = 0;  anchorY = h;  break; // Bottom Center\n" +
                    "            case 9: anchorX = w;  anchorY = h;  break; // Bottom Right\n" +
                    "            default: anchorX = 0; anchorY = 0;  break; // Default to Middle Center\n" +
                    "        }\n" +
                    "        \n" +
                    "        newPos = [baseX + anchorX, baseY + anchorY];\n" +
                    "    }\n" +
                    "    \n" +
                    "    // Store current values for next frame\n" +
                    "    __lastWidth = width;\n" +
                    "    __lastHeight = height;\n" +
                    "    __lastAnchorType = anchorType;\n" +
                    "    \n" +
                    "    // Return the new position\n" +
                    "    newPos;\n" +
                    "} catch (err) {\n" +
                    "    // On error, return current position\n" +
                    "    value;\n" +
                    "}";

                // Apply the simplified expressions
                anchorPointProp.expression = anchorPointExpr;
                positionProp.expression = positionExpr;
            } else {
                alert("Could not find anchor point or position property after scanning all properties");
            }

        } catch (e) {
            alert("Error in transform setup: " + e.toString());
        }

        // Also update the path expression to ensure proper positioning
        try {
            // Modified path expression with simplified anchor point handling
            var updatedExpression = "// Custom rounded rectangle with individual corner control\n" +
                "try {\n" +
                "    width = effect(\"Width\")(\"Slider\");\n" +
                "    height = effect(\"Height\")(\"Slider\");\n" +
                "    tlPercent = effect(\"Top Left Roundness %\")(\"Slider\");\n" +
                "    trPercent = effect(\"Top Right Roundness %\")(\"Slider\");\n" +
                "    brPercent = effect(\"Bottom Right Roundness %\")(\"Slider\");\n" +
                "    blPercent = effect(\"Bottom Left Roundness %\")(\"Slider\");\n" +
                "    posOffset = effect(\"Position Offset\")(\"Point\");\n" +
                "    anchorType = effect(\"Anchor Point\")(\"Menu\");\n" +
                "\n" +
                "    // Calculate the maximum roundness based on the smallest dimension\n" +
                "    maxRound = Math.min(width, height);\n" +
                "\n" +
                "    // First, clamp individual percentages to 0-100%\n" +
                "    tlPercent = Math.max(0, Math.min(100, tlPercent));\n" +
                "    trPercent = Math.max(0, Math.min(100, trPercent));\n" +
                "    brPercent = Math.max(0, Math.min(100, brPercent));\n" +
                "    blPercent = Math.max(0, Math.min(100, blPercent));\n" +
                "\n" +
                "    // Convert percentages to actual roundness values (0-100% -> 0-maxRound)\n" +
                "    tl = (tlPercent / 100) * maxRound;\n" +
                "    tr = (trPercent / 100) * maxRound;\n" +
                "    br = (brPercent / 100) * maxRound;\n" +
                "    bl = (blPercent / 100) * maxRound;\n" +
                "\n" +
                "    // Ensure all roundness values are non-negative\n" +
                "    tl = Math.max(0, tl);\n" +
                "    tr = Math.max(0, tr);\n" +
                "    br = Math.max(0, br);\n" +
                "    bl = Math.max(0, bl);\n" +
                "\n" +
                "    // Apply constraints to prevent distortion\n" +
                "    // For horizontal sides (top and bottom)\n" +
                "    maxTopRoundness = width / 2;\n" +
                "    maxBottomRoundness = width / 2;\n" +
                "\n" +
                "    // For vertical sides (left and right)\n" +
                "    maxLeftRoundness = height / 2;\n" +
                "    maxRightRoundness = height / 2;\n" +
                "\n" +
                "    // Constraint pairs that share an edge (can intersect)\n" +
                "    // Left edge: top-left and bottom-left\n" +
                "    if (tlPercent + blPercent > 100) {\n" +
                "        // Clamp bottom-left based on top-left value\n" +
                "        blPercent = Math.min(blPercent, 100 - tlPercent);\n" +
                "        bl = (blPercent / 100) * maxRound;\n" +
                "    }\n" +
                "\n" +
                "    // Right edge: top-right and bottom-right\n" +
                "    if (trPercent + brPercent > 100) {\n" +
                "        // Clamp bottom-right based on top-right value\n" +
                "        brPercent = Math.min(brPercent, 100 - trPercent);\n" +
                "        br = (brPercent / 100) * maxRound;\n" +
                "    }\n" +
                "\n" +
                "    // Top edge: top-left and top-right\n" +
                "    // Only apply constraint if the width is small enough that the corners could intersect\n" +
                "    if (tlPercent + trPercent > 100 && width <= height) {\n" +
                "        // Clamp top-right based on top-left value\n" +
                "        trPercent = Math.min(trPercent, 100 - tlPercent);\n" +
                "        tr = (trPercent / 100) * maxRound;\n" +
                "    }\n" +
                "\n" +
                "    // Bottom edge: bottom-left and bottom-right\n" +
                "    // Only apply constraint if the width is small enough that the corners could intersect\n" +
                "    if (blPercent + brPercent > 100 && width <= height) {\n" +
                "        // Clamp bottom-right based on bottom-left value\n" +
                "        brPercent = Math.min(brPercent, 100 - blPercent);\n" +
                "        br = (brPercent / 100) * maxRound;\n" +
                "    }\n" +
                "\n" +
                "    // Additional physical constraints to prevent distortion\n" +
                "    // Ensure corners don't exceed physical limits\n" +
                "    if (tl + tr > width) {\n" +
                "        var scale = width / (tl + tr);\n" +
                "        tl *= scale;\n" +
                "        tr *= scale;\n" +
                "    }\n" +
                "\n" +
                "    if (bl + br > width) {\n" +
                "        var scale = width / (bl + br);\n" +
                "        bl *= scale;\n" +
                "        br *= scale;\n" +
                "    }\n" +
                "\n" +
                "    if (tl + bl > height) {\n" +
                "        var scale = height / (tl + bl);\n" +
                "        tl *= scale;\n" +
                "        bl *= scale;\n" +
                "    }\n" +
                "\n" +
                "    if (tr + br > height) {\n" +
                "        var scale = height / (tr + br);\n" +
                "        tr *= scale;\n" +
                "        br *= scale;\n" +
                "    }\n" +
                "\n" +
                "    // Calculate points\n" +
                "    w = width / 2;\n" +
                "    h = height / 2;\n" +
                "\n" +
                "    // Calculate anchor point offset based on dropdown selection\n" +
                "    anchorX = 0;\n" +
                "    anchorY = 0;\n" +
                "\n" +
                "    if (anchorType == 1) { // Top Left\n" +
                "        anchorX = -w;\n" +
                "        anchorY = -h;\n" +
                "    } else if (anchorType == 2) { // Top Center\n" +
                "        anchorX = 0;\n" +
                "        anchorY = -h;\n" +
                "    } else if (anchorType == 3) { // Top Right\n" +
                "        anchorX = w;\n" +
                "        anchorY = -h;\n" +
                "    } else if (anchorType == 4) { // Middle Left\n" +
                "        anchorX = -w;\n" +
                "        anchorY = 0;\n" +
                "    } else if (anchorType == 5) { // Middle Center\n" +
                "        anchorX = 0;\n" +
                "        anchorY = 0;\n" +
                "    } else if (anchorType == 6) { // Middle Right\n" +
                "        anchorX = w;\n" +
                "        anchorY = 0;\n" +
                "    } else if (anchorType == 7) { // Bottom Left\n" +
                "        anchorX = -w;\n" +
                "        anchorY = h;\n" +
                "    } else if (anchorType == 8) { // Bottom Center\n" +
                "        anchorX = 0;\n" +
                "        anchorY = h;\n" +
                "    } else if (anchorType == 9) { // Bottom Right\n" +
                "        anchorX = w;\n" +
                "        anchorY = h;\n" +
                "    }\n" +
                "\n" +
                "    // Position offset - use full value (not divided by 2)\n" +
                "    offsetX = posOffset[0];\n" +
                "    offsetY = posOffset[1];\n" +
                "    // Note: Position offset is now handled by the position expression\n" +
                "    // and not applied to the path vertices\n" +
                "\n" +
                "    // Create path arrays\n" +
                "    vertices = [];\n" +
                "    inTangents = [];\n" +
                "    outTangents = [];\n" +
                "\n" +
                "    // Calculate control point factor for bezier curves\n" +
                "    cp = 0.552;\n" +
                "\n" +
                "    // Always create 8 vertices (2 for each corner)\n" +
                "    // Top-left corner (vertices 0 and 1)\n" +
                "    tlx1 = -w;\n" +
                "    tly1 = -h + tl;\n" +
                "    tlx2 = -w + tl;\n" +
                "    tly2 = -h;\n" +
                "\n" +
                "    // Top-right corner (vertices 2 and 3)\n" +
                "    trx1 = w - tr;\n" +
                "    try1 = -h;\n" +
                "    trx2 = w;\n" +
                "    try2 = -h + tr;\n" +
                "\n" +
                "    // Bottom-right corner (vertices 4 and 5)\n" +
                "    brx1 = w;\n" +
                "    bry1 = h - br;\n" +
                "    brx2 = w - br;\n" +
                "    bry2 = h;\n" +
                "\n" +
                "    // Bottom-left corner (vertices 6 and 7)\n" +
                "    blx1 = -w + bl;\n" +
                "    bly1 = h;\n" +
                "    blx2 = -w;\n" +
                "    bly2 = h - bl;\n" +
                "\n" +
                "    // If roundness is 0, make the vertices overlap\n" +
                "    if (tl === 0) {\n" +
                "        tlx1 = tlx2 = -w;\n" +
                "        tly1 = tly2 = -h;\n" +
                "    }\n" +
                "\n" +
                "    if (tr === 0) {\n" +
                "        trx1 = trx2 = w;\n" +
                "        try1 = try2 = -h;\n" +
                "    }\n" +
                "\n" +
                "    if (br === 0) {\n" +
                "        brx1 = brx2 = w;\n" +
                "        bry1 = bry2 = h;\n" +
                "    }\n" +
                "\n" +
                "    if (bl === 0) {\n" +
                "        blx1 = blx2 = -w;\n" +
                "        bly1 = bly2 = h;\n" +
                "    }\n" +
                "\n" +
                "    // Add all vertices with anchor point and offset adjustments\n" +
                "    // Add all vertices (no anchor point adjustment - handled by transform)\n" +
                "    vertices.push([tlx1, tly1]);\n" +
                "    vertices.push([tlx2, tly2]);\n" +
                "    vertices.push([trx1, try1]);\n" +
                "    vertices.push([trx2, try2]);\n" +
                "    vertices.push([brx1, bry1]);\n" +
                "    vertices.push([brx2, bry2]);\n" +
                "    vertices.push([blx1, bly1]);\n" +
                "    vertices.push([blx2, bly2]);\n" +
                "\n" +
                "    // Initialize all tangents to zero\n" +
                "    for (i = 0; i < 8; i++) {\n" +
                "        inTangents.push([0, 0]);\n" +
                "        outTangents.push([0, 0]);\n" +
                "    }\n" +
                "\n" +
                "    // Set tangents only for rounded corners\n" +
                "    // Top-left corner tangents\n" +
                "    if (tl > 0) {\n" +
                "        outTangents[0] = [0, -tl * cp];\n" +
                "        inTangents[1] = [-tl * cp, 0];\n" +
                "    }\n" +
                "\n" +
                "    // Top-right corner tangents\n" +
                "    if (tr > 0) {\n" +
                "        outTangents[2] = [tr * cp, 0];\n" +
                "        inTangents[3] = [0, -tr * cp];\n" +
                "    }\n" +
                "\n" +
                "    // Bottom-right corner tangents\n" +
                "    if (br > 0) {\n" +
                "        outTangents[4] = [0, br * cp];\n" +
                "        inTangents[5] = [br * cp, 0];\n" +
                "    }\n" +
                "\n" +
                "    // Bottom-left corner tangents\n" +
                "    if (bl > 0) {\n" +
                "        outTangents[6] = [-bl * cp, 0];\n" +
                "        inTangents[7] = [0, bl * cp];\n" +
                "    }\n" +
                "\n" +
                "    // Create the path\n" +
                "    createPath(vertices, inTangents, outTangents, true);\n" +
                "} catch (err) {\n" +
                "    // Default fallback path if there's an error\n" +
                "    createPath([[0,0], [100,0], [100,100], [0,100]], [[0,0],[0,0],[0,0],[0,0]], [[0,0],[0,0],[0,0],[0,0]], true);\n" +
                "}";

            // Get a fresh reference to the shape path using RefManager
            var freshShapePath = RefManager.resolve(shapePathRef);
            if (freshShapePath) {
                freshShapePath.property("ADBE Vector Shape").expression = updatedExpression;
                alert("Updated path expression with error handling using RefManager");
            } else {
                alert("Could not resolve shape path reference using RefManager");
            }
        } catch (e) {
            alert("Error updating path expression: " + e.toString());
        }

        // Now remove the original rectangle group using RefManager
        try {
            // Verify the rectGroupRef is valid
            var verifyRectGroup = RefManager.resolve(rectGroupRef);
            if (verifyRectGroup) {
                alert("Found rectangle group, attempting to remove: " + verifyRectGroup.name);

                // Try different removal methods since RefManager might not be working as expected
                try {
                    // First try the RefManager approach
                    RefManager.remove(rectGroupRef);
                    alert("Removed rectangle group using RefManager");
                } catch (e1) {
                    alert("RefManager removal failed: " + e1.toString());

                    // Fallback: try direct removal through the parent property
                    try {
                        var parent = verifyRectGroup.parentProperty;
                        if (parent) {
                            // Try to find the index of the group in the parent
                            for (var r = 1; r <= parent.numProperties; r++) {
                                if (parent.property(r) === verifyRectGroup) {
                                    parent.property(r).remove();
                                    alert("Removed rectangle group using direct parent removal");
                                    break;
                                }
                            }
                        }
                    } catch (e2) {
                        alert("Direct removal failed: " + e2.toString());

                        // Last resort: Simply try to hide the original group if we can't remove it
                        try {
                            verifyRectGroup.enabled = false;
                            alert("Could not remove rectangle group, disabled it instead");
                        } catch (e3) {
                            alert("Unable to disable the original rectangle: " + e3.toString());
                        }
                    }
                }
            } else {
                alert("Rectangle group reference is invalid or not found");

                // Debugging information
                alert("rectGroupRef stored value: " + (rectGroupRef ? rectGroupRef.toString() : "null"));
                alert("Original rect path name: " + (rectPath ? rectPath.name : "null"));
            }
        } catch (e) {
            alert("Error removing original rectangle: " + e.toString());
        }

    } catch (err) {
        alert("Error: " + err.toString());
    } finally {
        app.endUndoGroup();
    }

})();
