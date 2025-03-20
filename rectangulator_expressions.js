// Expressions for rectangulator_v2.jsx
// Organized by functionality with proper indentation and comments

var expressions = {
    // Path expression for creating the rounded rectangle shape
    path: "// Custom rounded rectangle with individual corner control\n" +
    "try {\n" +
    "    // Get effect values\n" +
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
    "    w = effect(\"Width\")(\"Slider\") / 2;\n" +
    "    h = effect(\"Height\")(\"Slider\") / 2;\n" +
    "    anchorType = effect(\"Anchor Point\")(\"Menu\");\n" +
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

    // Position expression for handling position changes and anchor point updates
    position: "try {\n" +
    "    // Get current values\n" +
    "    var width = effect(\"Width\")(\"Slider\");\n" +
    "    var height = effect(\"Height\")(\"Slider\");\n" +
    "    var posOffset = effect(\"Position Offset\")(\"Point\");\n" +
    "    var anchorType = effect(\"Anchor Point\")(\"Menu\");\n" +
    "    var w = width/2;\n" +
    "    var h = height/2;\n" +
    "    var result = value.slice(); // Default to current position\n" +
    "    \n" +
    "    // Initialize and track state\n" +
    "    if (typeof __state === 'undefined') {\n" +
    "        __state = {\n" +
    "            lastWidth: width,\n" +
    "            lastHeight: height,\n" +
    "            lastAnchorType: anchorType,\n" +
    "            lastPosOffset: [posOffset[0], posOffset[1]],\n" +
    "            basePos: value.slice(), // Remember initial position\n" +
    "            visiblePos: value.slice()\n" +
    "        };\n" +
    "    }\n" +
    "    \n" +
    "    // Track changes\n" +
    "    var widthDelta = width - __state.lastWidth;\n" +
    "    var heightDelta = height - __state.lastHeight;\n" +
    "    var anchorChanged = (anchorType != __state.lastAnchorType);\n" +
    "    var offsetChanged = (posOffset[0] != __state.lastPosOffset[0] || posOffset[1] != __state.lastPosOffset[1]);\n" +
    "    \n" +
    "    // Start with current position\n" +
    "    var newPos = __state.visiblePos.slice();\n" +
    "    \n" +
    "    // Handle position offset changes directly - this must be applied regardless of other changes\n" +
    "    if (offsetChanged) {\n" +
    "        // Apply the precise delta between the current and last offset values\n" +
    "        var offsetDeltaX = posOffset[0] - __state.lastPosOffset[0];\n" +
    "        var offsetDeltaY = posOffset[1] - __state.lastPosOffset[1];\n" +
    "        newPos[0] += offsetDeltaX;\n" +
    "        newPos[1] += offsetDeltaY;\n" +
    "        __state.lastPosOffset = [posOffset[0], posOffset[1]];\n" +
    "    }\n" +
    "    \n" +
    "    // Helper function to get anchor offsets\n" +
    "    function getAnchorOffset(type) {\n" +
    "        var offset = [0, 0];\n" +
    "        \n" +
    "        if (type == 1) offset = [-w, -h]; // Top Left\n" +
    "        else if (type == 2) offset = [0, -h]; // Top Center\n" +
    "        else if (type == 3) offset = [w, -h]; // Top Right\n" +
    "        else if (type == 4) offset = [-w, 0]; // Middle Left\n" +
    "        else if (type == 5) offset = [0, 0]; // Middle Center\n" +
    "        else if (type == 6) offset = [w, 0]; // Middle Right\n" +
    "        else if (type == 7) offset = [-w, h]; // Bottom Left\n" +
    "        else if (type == 8) offset = [0, h]; // Bottom Center\n" +
    "        else if (type == 9) offset = [w, h]; // Bottom Right\n" +
    "        \n" +
    "        return offset;\n" +
    "    }\n" +
    "    \n" +
    "    // Apply size changes based on anchor type\n" +
    "    if (widthDelta !== 0 || heightDelta !== 0) {\n" +
    "        if (anchorType == 1) { // Top Left - no adjustment\n" +
    "            // No change\n" +
    "        } else if (anchorType == 2) { // Top Center\n" +
    "            newPos[0] -= widthDelta/2;\n" +
    "        } else if (anchorType == 3) { // Top Right\n" +
    "            newPos[0] -= widthDelta;\n" +
    "        } else if (anchorType == 4) { // Middle Left\n" +
    "            newPos[1] -= heightDelta/2;\n" +
    "        } else if (anchorType == 5) { // Middle Center\n" +
    "            newPos[0] -= widthDelta/2;\n" +
    "            newPos[1] -= heightDelta/2;\n" +
    "        } else if (anchorType == 6) { // Middle Right\n" +
    "            newPos[0] -= widthDelta;\n" +
    "            newPos[1] -= heightDelta/2;\n" +
    "        } else if (anchorType == 7) { // Bottom Left\n" +
    "            newPos[1] -= heightDelta;\n" +
    "        } else if (anchorType == 8) { // Bottom Center\n" +
    "            newPos[0] -= widthDelta/2;\n" +
    "            newPos[1] -= heightDelta;\n" +
    "        } else if (anchorType == 9) { // Bottom Right\n" +
    "            newPos[0] -= widthDelta;\n" +
    "            newPos[1] -= heightDelta;\n" +
    "        }\n" +
    "    }\n" +
    "    \n" +
    "    // Handle anchor point changes to match After Effects behavior\n" +
    "    if (anchorChanged) {\n" +
    "        var oldAnchorOffset = getAnchorOffset(__state.lastAnchorType);\n" +
    "        var newAnchorOffset = getAnchorOffset(anchorType);\n" +
    "        \n" +
    "        // IMPORTANT: In After Effects, we need to use the same values (not negated)\n" +
    "        var anchorDiffX = newAnchorOffset[0] - oldAnchorOffset[0];\n" +
    "        var anchorDiffY = newAnchorOffset[1] - oldAnchorOffset[1];\n" +
    "        \n" +
    "        // Apply adjustment to maintain visual position\n" +
    "        newPos[0] += anchorDiffX;\n" +
    "        newPos[1] += anchorDiffY;\n" +
    "    }\n" +
    "    \n" +
    "    // Store state for next time\n" +
    "    __state.lastWidth = width;\n" +
    "    __state.lastHeight = height;\n" +
    "    __state.lastAnchorType = anchorType;\n" +
    "    __state.visiblePos = newPos.slice();\n" +
    "    \n" +
    "    result = newPos;\n" +
    "} catch (err) {\n" +
    "    // Error fallback - just keep current position\n" +
    "}\n" +
    "result;"
};

