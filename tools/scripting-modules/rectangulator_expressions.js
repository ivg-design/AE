// Expressions for Rectangulator.jsx
// Organized by functionality with proper indentation and comments
//
// All control references target the "Rectangulator Controls" pseudo effect
// applied by the script (see rectangulatorControllerBinary). Control names
// must match the FFX binary exactly, including the trailing space in
// "Anchor Point " and the "Bottom Right Left Corner Rounding" name.

var expressions = {
    // Path expression for creating the rounded rectangle shape
    path: "// Custom rounded rectangle with individual corner control\n" +
    "try {\n" +
    "    // Get effect values\n" +
    "    var ctl = null;\n" +
    "    try { ctl = effect(\"Rectangulator Controls\"); } catch (eCtl) {}\n" +
    "    var P = function (n1, n2, def) {\n" +
    "        if (ctl) {\n" +
    "            try { return ctl(n1).value; } catch (e1) {}\n" +
    "            if (n2) { try { return ctl(n2).value; } catch (e2) {} }\n" +
    "        }\n" +
    "        return def;\n" +
    "    };\n" +
    "    width = P(\"Rectangle Width (px)\", null, 100);\n" +
    "    height = P(\"Rectangle Height (px)\", null, 100);\n" +
    "    tlPercent = P(\"Top Left Corner Rounding\", null, 0);\n" +
    "    trPercent = P(\"Top Right Corner Rounding\", null, 0);\n" +
    "    brPercent = P(\"Bottom Right Left Corner Rounding\", \"Bottom Right Corner Rounding\", 0);\n" +
    "    blPercent = P(\"Bottom Left Corner Rounding\", null, 0);\n" +
    "    anchorType = P(\"Anchor Point \", \"Anchor Point\", -1);\n" +
    "    if (anchorType === -1) {\n" +
    "        anchorType = 5;\n" +
    "        try {\n" +
    "            for (var q = 1; q <= ctl.numProperties; q++) {\n" +
    "                try {\n" +
    "                    var nm = ctl(q).name;\n" +
    "                    if (nm && nm.toLowerCase().indexOf(\"anchor\") !== -1) { anchorType = ctl(q).value; break; }\n" +
    "                } catch (eq) {}\n" +
    "            }\n" +
    "        } catch (eScan) {}\n" +
    "    }\n" +
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
    "}",

    // Anchor point expression for positioning the anchor point
    anchorPoint: "// Anchor point expression\n" +
    "try {\n" +
    "    var ctl = null;\n" +
    "    try { ctl = effect(\"Rectangulator Controls\"); } catch (eCtl) {}\n" +
    "    var P = function (n1, n2, def) {\n" +
    "        if (ctl) {\n" +
    "            try { return ctl(n1).value; } catch (e1) {}\n" +
    "            if (n2) { try { return ctl(n2).value; } catch (e2) {} }\n" +
    "        }\n" +
    "        return def;\n" +
    "    };\n" +
    "    w = P(\"Rectangle Width (px)\", null, 100) / 2;\n" +
    "    h = P(\"Rectangle Height (px)\", null, 100) / 2;\n" +
    "    anchorType = P(\"Anchor Point \", \"Anchor Point\", -1);\n" +
    "    if (anchorType === -1) {\n" +
    "        anchorType = 5;\n" +
    "        try {\n" +
    "            for (var q = 1; q <= ctl.numProperties; q++) {\n" +
    "                try {\n" +
    "                    var nm = ctl(q).name;\n" +
    "                    if (nm && nm.toLowerCase().indexOf(\"anchor\") !== -1) { anchorType = ctl(q).value; break; }\n" +
    "                } catch (eq) {}\n" +
    "            }\n" +
    "        } catch (eScan) {}\n" +
    "    }\n" +
    "    result = [0, 0];\n" +
    "\n" +
    "    if (anchorType == 1) result = [-w, -h];      // Top Left\n" +
    "    else if (anchorType == 2) result = [0, -h];   // Top Center\n" +
    "    else if (anchorType == 3) result = [w, -h];   // Top Right\n" +
    "    else if (anchorType == 4) result = [-w, 0];   // Middle Left\n" +
    "    else if (anchorType == 5) result = [0, 0];    // Middle Center\n" +
    "    else if (anchorType == 6) result = [w, 0];    // Middle Right\n" +
    "    else if (anchorType == 7) result = [-w, h];   // Bottom Left\n" +
    "    else if (anchorType == 8) result = [0, h];    // Bottom Center\n" +
    "    else if (anchorType == 9) result = [w, h];    // Bottom Right\n" +
    "    else result = [0, 0];                         // Default\n" +
    "\n" +
    "    result;\n" +
    "} catch (err) {\n" +
    "    [0, 0];\n" +
    "}",

    // Position expression — stateless passthrough.
    // The Anchor Point expression above already pins the selected corner in
    // place as Width/Height change, so Position needs no compensation here.
    // A previous version accumulated anchor/size offsets in a persistent
    // "__state" object, but After Effects evaluates each expression in a fresh
    // context (undeclared globals do NOT persist between evaluations), so that
    // state re-initialized on every evaluation — it was inert under the default
    // JS engine and non-deterministic under the legacy engine. Returning the
    // property's own (static or keyframed) value keeps Position fully
    // animatable and deterministic under both engines.
    position: "// Stateless position passthrough (see Rectangulator.jsx notes)\n" +
    "value;"
};

