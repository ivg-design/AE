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