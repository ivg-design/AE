/**
 * @name Linearizer
 * @author IVG Design
 * @version 1.5.8
 * @date 2026-07-04
 * @license MIT
 * @ui DIALOG
 * @description Advanced linear expression tool that links properties with driver-based interpolation for complex animations
 * 
 * @functionality
 * - Links any property to a driver property with linear interpolation
 * - Supports 1D, 2D, and 3D properties including shape paths
 * - Multiple property selection for batch expression application
 * - Min/max value range controls for precise mapping
 * - Even vs relative interpolation modes
 * - Shape path vertex interpolation support
 * - Dimension-specific control for multi-dimensional properties
 * - Automatic keyframe value capturing and preservation
 * - Expression generation optimized for ECMA 3 compatibility
 * 
 * @usage
 * 1. Select a composition in Adobe After Effects
 * 2. Run the script to open the dialog
 * 3. Click "Select Target Property" and choose properties with at least 2 keyframes
 * 4. Click "Select Driver Property" to choose the controlling property
 * 5. For multi-dimensional drivers, select which dimension to use
 * 6. Enter minimum and maximum values for the driver range
 * 7. Toggle "Even Interpolation" for uniform distribution (vs keyframe-relative)
 * 8. Click "Apply Linear Expression" to link the properties
 * 
 * @requirements
 * - Adobe After Effects CS6 or later
 * - Target properties must have at least 2 keyframes
 * - Properties must be numerical (no color or dropdown properties)
 * - Hold keyframes are preserved as held segments while their mapped driver positions are adjusted
 * 
 * @notes
 * - Expressions are optimized for ECMA 3 environment
 * - Shape path interpolation preserves vertex, tangent, and closed state
 * - Multiple properties can be processed in a single operation
 * - Driver property dimensions are handled automatically
 * - All operations wrapped in undo groups for safety
 * @changelog 
 * 1.0.0 Initial version.
 * 1.1.0 Added support for 2D properties.
 * 1.1.1 Fixed bug that broke the expression when layers are parented.
 * 1.2.0 Improved keyframe value capturing for accurate interpolation.
 * 1.3.0 Added added linearArrayInterpolation function.
 * 1.4.0 Enhanced UI to select target and driver properties.
 * 1.4.1 Added checks for incompatible properties (3D, 4D, hold keyframes).
 * 1.4.2 Optimized expression generation and ensured compatibility with ECMA 3.
 * 1.4.3 Fix the issue with expression not working on 2D non-path properties.
 * 1.4.5 Fix the issue to have the ranges distributed based on the relative 
 *      position of the keyframes and the user selected min and max values,
 *      and add "even interpolation" option between keyframes.
 * 1.4.6 Added checkbox to control even/relative interpolation and fix even interpolation
 *      to distribute the ranges and values evenly between the min and max values, add 
 *      function to look for the group name of the property depending on property.
 * 1.5.0 Added support for 1D, 2D, and 3D properties.
 *       Enhanced driver property selection to handle property dimensions.
 *       Implemented dimension selection dialog for 2D, 3D, and 4D properties.li
 *       Updated expression creation to correctly format property access with dimension indices.
 *       Ensured correct handling and mapping of property values based on dimensions.
 * 1.5.1 added ability to apply the script to multiple properties at once.
 * 1.5.2 Replaced JSON.stringify calls with an ECMA 3-safe serializer for ExtendScript compatibility.
 * 1.5.3 Preserved hold keyframe segments and deep-copied shape keyframes for mask/path expressions.
 * 1.5.4 Mapped batch-applied properties against a shared keyframe timing range so staggered hold sequences stay staggered.
 * 1.5.5 Restored direct createPath return for mask path expressions.
 * 1.5.6 Samples shape keys at their key times so mask/path expressions capture distinct path keyframes.
 * 1.5.7 Shape path expressions now sample thisProperty at original key times instead of baking path coordinates.
 * 1.5.8 (2026-07-04) Batch mode (pre-selected properties) now applies the same
 *      color/text/group compatibility guard as the single-target flow, so an
 *      incompatible pre-selected property is rejected with an alert instead of
 *      silently receiving a no-op expression. Single-property checkbox-controller
 *      names now derive the target layer name from the property in batch mode
 *      (previously left blank), preventing name collisions that let one control
 *      silently drive an unrelated property on another layer. Corrected the
 *      misleading incompatibility alert wording (3D is supported).
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


(function () {
    function isArrayValue(value) {
        return value instanceof Array || Object.prototype.toString.call(value) === "[object Array]";
    }

    function serializeForExpression(value) {
        if (value === null) {
            return "null";
        }

        var valueType = typeof value;
        if (valueType === "number" || valueType === "boolean") {
            return String(value);
        }

        if (valueType === "string") {
            return "'" + value
                .replace(/\\/g, "\\\\")
                .replace(/'/g, "\\'")
                .replace(/\r/g, "\\r")
                .replace(/\n/g, "\\n") + "'";
        }

        if (isArrayValue(value)) {
            var arrayParts = [];
            for (var i = 0; i < value.length; i++) {
                arrayParts.push(serializeForExpression(value[i]));
            }
            return "[" + arrayParts.join(",") + "]";
        }

        if (valueType === "object") {
            var objectParts = [];
            for (var key in value) {
                if (value.hasOwnProperty(key)) {
                    objectParts.push(serializeForExpression(key) + ":" + serializeForExpression(value[key]));
                }
            }
            return "{" + objectParts.join(",") + "}";
        }

        return "undefined";
    }

    function getKeyInterpolationType(property, methodName, keyIndex) {
        try {
            if (property && typeof property[methodName] === "function") {
                return property[methodName](keyIndex);
            }
        } catch (e) {
            // Some property types do not expose interpolation metadata.
        }
        return null;
    }

    function isHoldInterpolation(interpolationType) {
        if (typeof KeyframeInterpolationType !== "undefined" && interpolationType === KeyframeInterpolationType.HOLD) {
            return true;
        }
        return interpolationType === 6614;
    }

    function captureKeyframe(property, keyIndex) {
        var keyTime = property.keyTime(keyIndex);
        var keyValue;

        if (property.propertyValueType === PropertyValueType.SHAPE) {
            keyValue = null;
        } else {
            keyValue = property.keyValue(keyIndex);
        }

        return {
            value: keyValue,
            time: keyTime,
            inInterpolationType: getKeyInterpolationType(property, "keyInInterpolationType", keyIndex),
            outInterpolationType: getKeyInterpolationType(property, "keyOutInterpolationType", keyIndex)
        };
    }

    function timesAreClose(a, b) {
        return Math.abs(a - b) < 0.000001;
    }

    function addUniqueSortedTime(times, timeValue) {
        for (var i = 0; i < times.length; i++) {
            if (timesAreClose(times[i], timeValue)) {
                return;
            }
            if (timeValue < times[i]) {
                times.splice(i, 0, timeValue);
                return;
            }
        }
        times.push(timeValue);
    }

    function findTimeIndex(times, timeValue) {
        for (var i = 0; i < times.length; i++) {
            if (timesAreClose(times[i], timeValue)) {
                return i;
            }
        }
        return -1;
    }

    function buildTimingContext(targetProperties) {
        var eventTimes = [];
        var startTime = null;
        var endTime = null;

        for (var i = 0; i < targetProperties.length; i++) {
            var property = targetProperties[i];
            for (var j = 1; j <= property.numKeys; j++) {
                var keyTime = property.keyTime(j);
                addUniqueSortedTime(eventTimes, keyTime);
                if (startTime === null || keyTime < startTime) {
                    startTime = keyTime;
                }
                if (endTime === null || keyTime > endTime) {
                    endTime = keyTime;
                }
            }
        }

        return {
            startTime: startTime === null ? 0 : startTime,
            endTime: endTime === null ? 0 : endTime,
            eventTimes: eventTimes
        };
    }

    /**
     * Creates a linear expression for the target property based on the driver property.
     * Captures keyframe values and generates the appropriate expression to interpolate
     * between these values based on the driver property.
     * Supports 1D, 2D, and 3D properties.
     *
     * @param {String} driverLayerName - The name of the layer containing the driver property.
     * @param {String} driverPropertyPath - The expression path of the driver property.
     * @param {Array} keyframes - The keyframe values and times of the target property.
     * @param {Boolean} is2D - Whether the target property is 2D.
     * 
     * @param {Number} minVal - The minimum value for the driver property.
     * @param {Number} maxVal - The maximum value for the driver property.
     * @param {Property} property - The target property.
     * @param {Property} checkboxController - The checkbox controller property for even interpolation.
     * @param {String} dimensionSuffix - The suffix to append to the driver property path for multi-dimensional properties (e.g., "[0]", "[1]").
     * @returns {String} The generated linear expression.
     */


    function createExpression(driverLayerName, driverPropertyPath, keyframes, is2D, minVal, maxVal, property, checkboxController, dimensionSuffix, timingContext) {
        var expression = "";

        if (property.propertyValueType === PropertyValueType.SHAPE) {
            expression += "function linearArrayInterpolation(value, inputMin, inputMax, key1, key2) {\n" +
                "  var normalizeValue = function(value, inputMin, inputMax) {\n" +
                "    return (value - inputMin) / (inputMax - inputMin);\n" +
                "  };\n" +
                "  var interpolateValue = function(normalizedValue, outputMin, outputMax) {\n" +
                "    return outputMin + normalizedValue * (outputMax - outputMin);\n" +
                "  };\n" +
                "  var result = { vertices: [], inTangents: [], outTangents: [], isClosed: key1.isClosed };\n" +
                "  for (var i = 0; i < key1.vertices.length; i++) {\n" +
                "    var normalizedValue = normalizeValue(value, inputMin, inputMax);\n" +
                "    result.vertices.push([\n" +
                "      interpolateValue(normalizedValue, key1.vertices[i][0], key2.vertices[i][0]),\n" +
                "      interpolateValue(normalizedValue, key1.vertices[i][1], key2.vertices[i][1])\n" +
                "    ]);\n" +
                "    result.inTangents.push([\n" +
                "      interpolateValue(normalizedValue, key1.inTangents[i][0], key2.inTangents[i][0]),\n" +
                "      interpolateValue(normalizedValue, key1.inTangents[i][1], key2.inTangents[i][1])\n" +
                "    ]);\n" +
                "    result.outTangents.push([\n" +
                "      interpolateValue(normalizedValue, key1.outTangents[i][0], key2.outTangents[i][0]),\n" +
                "      interpolateValue(normalizedValue, key1.outTangents[i][1], key2.outTangents[i][1])\n" +
                "    ]);\n" +
                "  }\n" +
                "  return result;\n" +
                "}\n\n";
        } else {
            expression += "function linearExpression(value, inputMin, inputMax, outputMin, outputMax) {\n" +
                "  var normalizedValue = (value - inputMin) / (inputMax - inputMin);\n" +
                "  var outputValue = outputMin + normalizedValue * (outputMax - outputMin);\n" +
                "  return Math.max(Math.min(outputValue, Math.max(outputMin, outputMax)), Math.min(outputMin, outputMax));\n" +
                "}\n\n";
        }

        expression += "var controllingValue = " + driverPropertyPath + ".value" + dimensionSuffix + ";\n" +
            "var minVal = " + minVal + ";\n" +
            "var maxVal = " + maxVal + ";\n" +
            "if (controllingValue < minVal) controllingValue = minVal;\n" +
            "if (controllingValue > maxVal) controllingValue = maxVal;\n";

        var numSegments = keyframes.length - 1;
        var timingStart = timingContext ? timingContext.startTime : keyframes[0].time;
        var timingEnd = timingContext ? timingContext.endTime : keyframes[keyframes.length - 1].time;
        var totalRange = timingEnd - timingStart;
        var relativeTimes = [];
        for (var i = 0; i < keyframes.length; i++) {
            relativeTimes.push(totalRange !== 0 ? (keyframes[i].time - timingStart) / totalRange : (numSegments > 0 ? i / numSegments : 0));
        }
        var evenTimes = [];
        var eventTimes = timingContext && timingContext.eventTimes ? timingContext.eventTimes : [];
        if (eventTimes.length > 1) {
            for (i = 0; i < keyframes.length; i++) {
                var eventIndex = findTimeIndex(eventTimes, keyframes[i].time);
                evenTimes.push(eventIndex >= 0 ? eventIndex / (eventTimes.length - 1) : relativeTimes[i]);
            }
        } else {
            for (i = 0; i < keyframes.length; i++) {
                evenTimes.push(numSegments > 0 ? i / numSegments : 0);
            }
        }
        var holdSegments = [];
        for (i = 0; i < numSegments; i++) {
            holdSegments.push(isHoldInterpolation(keyframes[i].outInterpolationType) || isHoldInterpolation(keyframes[i + 1].inInterpolationType));
        }

        if (property.propertyValueType === PropertyValueType.SHAPE) {
            var keyTimes = [];
            for (i = 0; i < keyframes.length; i++) {
                keyTimes.push(keyframes[i].time);
            }

            expression += "var keyTimes = " + serializeForExpression(keyTimes) + ";\n";
            expression += "function readPathAtKey(keyIndex) {\n" +
                "  var t = keyTimes[keyIndex];\n" +
                "  return {\n" +
                "    vertices: thisProperty.points(t),\n" +
                "    inTangents: thisProperty.inTangents(t),\n" +
                "    outTangents: thisProperty.outTangents(t),\n" +
                "    isClosed: thisProperty.isClosed()\n" +
                "  };\n" +
                "}\n";
            expression += "var result = readPathAtKey(0);\n";
            expression += "var evenInterpolation = thisComp.layer('" + driverLayerName + "')('Effects')('" + checkboxController.name + "')('Checkbox').value;\n";
            expression += "var relativeTimes = " + serializeForExpression(relativeTimes) + ";\n";
            expression += "var evenTimes = " + serializeForExpression(evenTimes) + ";\n";
            expression += "var holdSegments = " + serializeForExpression(holdSegments) + ";\n";

            expression += "for (var i = 0; i < " + numSegments + "; i++) {\n" +
                "  var segmentStart, segmentEnd;\n" +
                "  if (evenInterpolation) {\n" +
                "    segmentStart = minVal + evenTimes[i] * (maxVal - minVal);\n" +
                "    segmentEnd = minVal + evenTimes[i + 1] * (maxVal - minVal);\n" +
                "  } else {\n" +
                "    segmentStart = minVal + relativeTimes[i] * (maxVal - minVal);\n" +
                "    segmentEnd = minVal + relativeTimes[i + 1] * (maxVal - minVal);\n" +
                "  }\n" +
                "  if (segmentStart === segmentEnd) {\n" +
                "    segmentEnd += 0.0001;\n" +
                "  }\n" +
                "  if (controllingValue >= segmentStart && controllingValue <= segmentEnd) {\n" +
                "    if (holdSegments[i]) {\n" +
                "      result = controllingValue < segmentEnd ? readPathAtKey(i) : readPathAtKey(i + 1);\n" +
                "    } else {\n" +
                "      result = linearArrayInterpolation(controllingValue, segmentStart, segmentEnd, readPathAtKey(i), readPathAtKey(i + 1));\n" +
                "    }\n" +
                "    break;\n" + // Break to prevent further iterations
                "  }\n" +
                "}\n";

            expression += "if (controllingValue < minVal) {\n" +
                "  result = readPathAtKey(0);\n" +
                "}\n" +
                "var lastSegmentEnd = evenInterpolation ? minVal + evenTimes[" + numSegments + "] * (maxVal - minVal) : minVal + relativeTimes[" + numSegments + "] * (maxVal - minVal);\n" +
                "if (controllingValue > lastSegmentEnd) {\n" +
                "  result = readPathAtKey(" + numSegments + ");\n" +
                "}\n" +
                "if (controllingValue > maxVal) {\n" +
                "  result = readPathAtKey(" + numSegments + ");\n" +
                "}\n";

            expression += "createPath(result.vertices, result.inTangents, result.outTangents, result.isClosed);\n";

        } else {
            var segments = [];
            for (var i = 0; i < numSegments; i++) {
                var kfStart = keyframes[i].value;
                var kfEnd = keyframes[i + 1].value;

                if (typeof kfStart === "number" && typeof kfEnd === "number") {
                    // 1D property
                    segments.push([
                        [parseFloat(kfStart.toFixed(2))],
                        [parseFloat(kfEnd.toFixed(2))]
                    ]);
                } else if (isArrayValue(kfStart) && isArrayValue(kfEnd)) {
                    if (kfStart.length === 2 && kfEnd.length === 2) {
                        // 2D property
                        segments.push([
                            [parseFloat(kfStart[0].toFixed(2)), parseFloat(kfStart[1].toFixed(2))],
                            [parseFloat(kfEnd[0].toFixed(2)), parseFloat(kfEnd[1].toFixed(2))]
                        ]);
                    } else if (kfStart.length === 3 && kfEnd.length === 3) {
                        // 3D property
                        segments.push([
                            [parseFloat(kfStart[0].toFixed(2)), parseFloat(kfStart[1].toFixed(2)), parseFloat(kfStart[2].toFixed(2))],
                            [parseFloat(kfEnd[0].toFixed(2)), parseFloat(kfEnd[1].toFixed(2)), parseFloat(kfEnd[2].toFixed(2))]
                        ]);
                    }
                }
            }

            var mapSliderToValueFunction =
                "function mapSliderToValue(controllingValue, segments, minVal, maxVal, relativeTimes, evenInterpolation, holdSegments) {\n" +
                "  var numSegments = segments.length;\n" +
                "  var mappedValue = segments[0][0][0];\n" +
                "  for (var i = 0; i < numSegments; i++) {\n" +
                "    var segmentStart, segmentEnd, valueStart, valueEnd;\n" +
                "    if (evenInterpolation) {\n" +
                "      segmentStart = minVal + evenTimes[i] * (maxVal - minVal);\n" +
                "      segmentEnd = minVal + evenTimes[i + 1] * (maxVal - minVal);\n" +
                "      valueStart = segments[i][0][0];\n" +
                "      valueEnd = segments[i][1][0];\n" +
                "    } else {\n" +
                "      segmentStart = minVal + relativeTimes[i] * (maxVal - minVal);\n" +
                "      segmentEnd = minVal + relativeTimes[i + 1] * (maxVal - minVal);\n" +
                "      valueStart = segments[i][0][0];\n" +
                "      valueEnd = segments[i][1][0];\n" +
                "    }\n" +
                "    if (segmentStart === segmentEnd) {\n" +
                "      segmentEnd += 0.0001;\n" +
                "    }\n" +
                "    if (controllingValue >= segmentStart && controllingValue <= segmentEnd) {\n" +
                "      mappedValue = holdSegments[i] && controllingValue < segmentEnd ? valueStart : (holdSegments[i] ? valueEnd : linearExpression(controllingValue, segmentStart, segmentEnd, valueStart, valueEnd));\n" +
                "      break;\n" + // Break to prevent further iterations
                "    }\n" +
                "  }\n" +
                "  var lastSegmentEnd = evenInterpolation ? minVal + evenTimes[numSegments] * (maxVal - minVal) : minVal + relativeTimes[numSegments] * (maxVal - minVal);\n" +
                "  if (controllingValue < minVal) {\n" +
                "    mappedValue = segments[0][0][0];\n" +
                "  }\n" +
                "  if (controllingValue > lastSegmentEnd) {\n" +
                "    mappedValue = segments[numSegments - 1][1][0];\n" +
                "  }\n" +
                "  if (controllingValue > maxVal) {\n" +
                "    mappedValue = segments[numSegments - 1][1][0];\n" +
                "  }\n" +
                "  return mappedValue;\n" +
                "}\n\n";

            var mapSliderToValueFunction2D =
                "function mapSliderToValue2D(controllingValue, segments, minVal, maxVal, relativeTimes, evenInterpolation, holdSegments) {\n" +
                "  var numSegments = segments.length;\n" +
                "  var mappedValueX = segments[0][0][0];\n" +
                "  var mappedValueY = segments[0][0][1];\n" +
                "  for (var i = 0; i < numSegments; i++) {\n" +
                "    var segmentStart, segmentEnd, valueStartX, valueEndX, valueStartY, valueEndY;\n" +
                "    if (evenInterpolation) {\n" +
                "      segmentStart = minVal + evenTimes[i] * (maxVal - minVal);\n" +
                "      segmentEnd = minVal + evenTimes[i + 1] * (maxVal - minVal);\n" +
                "      valueStartX = segments[i][0][0];\n" +
                "      valueEndX = segments[i][1][0];\n" +
                "      valueStartY = segments[i][0][1];\n" +
                "      valueEndY = segments[i][1][1];\n" +
                "    } else {\n" +
                "      segmentStart = minVal + relativeTimes[i] * (maxVal - minVal);\n" +
                "      segmentEnd = minVal + relativeTimes[i + 1] * (maxVal - minVal);\n" +
                "      valueStartX = segments[i][0][0];\n" +
                "      valueEndX = segments[i][1][0];\n" +
                "      valueStartY = segments[i][0][1];\n" +
                "      valueEndY = segments[i][1][1];\n" +
                "    }\n" +
                "    if (segmentStart === segmentEnd) {\n" +
                "      segmentEnd += 0.0001;\n" +
                "    }\n" +
                "    if (controllingValue >= segmentStart && controllingValue <= segmentEnd) {\n" +
                "      if (holdSegments[i]) {\n" +
                "        mappedValueX = controllingValue < segmentEnd ? valueStartX : valueEndX;\n" +
                "        mappedValueY = controllingValue < segmentEnd ? valueStartY : valueEndY;\n" +
                "      } else {\n" +
                "        mappedValueX = linearExpression(controllingValue, segmentStart, segmentEnd, valueStartX, valueEndX);\n" +
                "        mappedValueY = linearExpression(controllingValue, segmentStart, segmentEnd, valueStartY, valueEndY);\n" +
                "      }\n" +
                "      break;\n" + // Break to prevent further iterations
                "    }\n" +
                "  }\n" +
                "  var lastSegmentEnd = evenInterpolation ? minVal + evenTimes[numSegments] * (maxVal - minVal) : minVal + relativeTimes[numSegments] * (maxVal - minVal);\n" +
                "  if (controllingValue < minVal) {\n" +
                "    mappedValueX = segments[0][0][0];\n" +
                "    mappedValueY = segments[0][0][1];\n" +
                "  }\n" +
                "  if (controllingValue > lastSegmentEnd) {\n" +
                "    mappedValueX = segments[numSegments - 1][1][0];\n" +
                "    mappedValueY = segments[numSegments - 1][1][1];\n" +
                "  }\n" +
                "  if (controllingValue > maxVal) {\n" +
                "    mappedValueX = segments[numSegments - 1][1][0];\n" +
                "    mappedValueY = segments[numSegments - 1][1][1];\n" +
                "  }\n" +
                "  return [mappedValueX, mappedValueY];\n" +
                "}\n\n";

            var mapSliderToValueFunction3D =
                "function mapSliderToValue3D(controllingValue, segments, minVal, maxVal, relativeTimes, evenInterpolation, holdSegments) {\n" +
                "  var numSegments = segments.length;\n" +
                "  var mappedValueX = segments[0][0][0];\n" +
                "  var mappedValueY = segments[0][0][1];\n" +
                "  var mappedValueZ = segments[0][0][2];\n" +
                "  for (var i = 0; i < numSegments; i++) {\n" +
                "    var segmentStart, segmentEnd, valueStartX, valueEndX, valueStartY, valueEndY, valueStartZ, valueEndZ;\n" +
                "    if (evenInterpolation) {\n" +
                "      segmentStart = minVal + evenTimes[i] * (maxVal - minVal);\n" +
                "      segmentEnd = minVal + evenTimes[i + 1] * (maxVal - minVal);\n" +
                "      valueStartX = segments[i][0][0];\n" +
                "      valueEndX = segments[i][1][0];\n" +
                "      valueStartY = segments[i][0][1];\n" +
                "      valueEndY = segments[i][1][1];\n" +
                "      valueStartZ = segments[i][0][2];\n" +
                "      valueEndZ = segments[i][1][2];\n" +
                "    } else {\n" +
                "      segmentStart = minVal + relativeTimes[i] * (maxVal - minVal);\n" +
                "      segmentEnd = minVal + relativeTimes[i + 1] * (maxVal - minVal);\n" +
                "      valueStartX = segments[i][0][0];\n" +
                "      valueEndX = segments[i][1][0];\n" +
                "      valueStartY = segments[i][0][1];\n" +
                "      valueEndY = segments[i][1][1];\n" +
                "      valueStartZ = segments[i][0][2];\n" +
                "      valueEndZ = segments[i][1][2];\n" +
                "    }\n" +
                "    if (segmentStart === segmentEnd) {\n" +
                "      segmentEnd += 0.0001;\n" +
                "    }\n" +
                "    if (controllingValue >= segmentStart && controllingValue <= segmentEnd) {\n" +
                "      if (holdSegments[i]) {\n" +
                "        mappedValueX = controllingValue < segmentEnd ? valueStartX : valueEndX;\n" +
                "        mappedValueY = controllingValue < segmentEnd ? valueStartY : valueEndY;\n" +
                "        mappedValueZ = controllingValue < segmentEnd ? valueStartZ : valueEndZ;\n" +
                "      } else {\n" +
                "        mappedValueX = linearExpression(controllingValue, segmentStart, segmentEnd, valueStartX, valueEndX);\n" +
                "        mappedValueY = linearExpression(controllingValue, segmentStart, segmentEnd, valueStartY, valueEndY);\n" +
                "        mappedValueZ = linearExpression(controllingValue, segmentStart, segmentEnd, valueStartZ, valueEndZ);\n" +
                "      }\n" +
                "      break;\n" + // Break to prevent further iterations
                "    }\n" +
                "  }\n" +
                "  var lastSegmentEnd = evenInterpolation ? minVal + evenTimes[numSegments] * (maxVal - minVal) : minVal + relativeTimes[numSegments] * (maxVal - minVal);\n" +
                "  if (controllingValue < minVal) {\n" +
                "    mappedValueX = segments[0][0][0];\n" +
                "    mappedValueY = segments[0][0][1];\n" +
                "    mappedValueZ = segments[0][0][2];\n" +
                "  }\n" +
                "  if (controllingValue > lastSegmentEnd) {\n" +
                "    mappedValueX = segments[numSegments - 1][1][0];\n" +
                "    mappedValueY = segments[numSegments - 1][1][1];\n" +
                "    mappedValueZ = segments[numSegments - 1][1][2];\n" +
                "  }\n" +
                "  if (controllingValue > maxVal) {\n" +
                "    mappedValueX = segments[numSegments - 1][1][0];\n" +
                "    mappedValueY = segments[numSegments - 1][1][1];\n" +
                "    mappedValueZ = segments[numSegments - 1][1][2];\n" +
                "  }\n" +
                "  return [mappedValueX, mappedValueY, mappedValueZ];\n" +
                "}\n\n";

            expression += "var segments = " + serializeForExpression(segments) + ";\n";
            expression += "var relativeTimes = " + serializeForExpression(relativeTimes) + ";\n";
            expression += "var evenTimes = " + serializeForExpression(evenTimes) + ";\n";
            expression += "var holdSegments = " + serializeForExpression(holdSegments) + ";\n";
            expression += "var evenInterpolation = thisComp.layer('" + driverLayerName + "')('Effects')('" + checkboxController.name + "')('Checkbox').value;\n";

            // Determine the property type and choose the appropriate map function
            var propertyType = getPropertyType(property);
            if (propertyType === "1D") {
                expression += mapSliderToValueFunction;
                expression += "var mappedValue = mapSliderToValue(controllingValue, segments, minVal, maxVal, relativeTimes, evenInterpolation, holdSegments);\n";
                expression += "value = mappedValue;\n";
            } else if (propertyType === "2D") {
                expression += mapSliderToValueFunction2D;
                expression += "var mappedValue = mapSliderToValue2D(controllingValue, segments, minVal, maxVal, relativeTimes, evenInterpolation, holdSegments);\n";
                expression += "value = mappedValue;\n";
            } else if (propertyType === "3D") {
                expression += mapSliderToValueFunction3D;
                expression += "var mappedValue = mapSliderToValue3D(controllingValue, segments, minVal, maxVal, relativeTimes, evenInterpolation, holdSegments);\n";
                expression += "value = mappedValue;\n";
            }
        }

        return expression;
    }



    /**
     * Constructs the full expression path for a given property.
     * Ensures the path is properly formatted for After Effects expressions.
     *
     * @param {Property} property - The property for which to construct the path.
     * @returns {String} The full expression path.
     */
    function getPropertyExpressionPath(property) {
        var path = '';
        var propertyNames = [];
        while (property !== null) {
            var propName = property.name;
            if (property.parentProperty) {
                if (property.parentProperty.matchName === 'ADBE Effect Parade') {
                    propName = '("' + propName + '")';
                } else {
                    propName = '("' + propName + '")';
                }
            } else {
                propName = 'thisComp.layer("' + propName + '")';
            }
            propertyNames.unshift(propName);
            property = property.parentProperty;
        }
        path = propertyNames.join('');
        return path;
    }

    /**
     * Walks up the property hierarchy to the containing layer and returns its name.
     * The topmost PropertyGroup in an AE property chain is the layer itself
     * (its parentProperty is null), so its name is the layer name. Used in batch
     * mode, where targetLayerName is not populated by the Target Property button,
     * to keep per-target checkbox-controller names disambiguated by layer.
     *
     * @param {Property} property - Any property owned by the layer.
     * @returns {String} The containing layer's name (or "" if it cannot be resolved).
     */
    function getLayerNameFromProperty(property) {
        var current = property;
        while (current && current.parentProperty) {
            current = current.parentProperty;
        }
        return current ? current.name : "";
    }

    /**
     * Retrieves the deepest selected property from a list of selected properties.
     * Ensures the deepest property is returned if multiple properties are selected.
     *
     * @param {Array} selectedProperties - The list of selected properties.
     * @returns {Property} The deepest selected property.
     */
    function showDeepestSelectedProperty(selectedProperties) {
        if (selectedProperties.length === 1) {
            return selectedProperties[0];
        }

        if (selectedProperties.length > 1) {
            var deepestProp = null;
            var deepestPropDepth = 0;

            for (var i = 0; i < selectedProperties.length; i++) {
                var prop = selectedProperties[i];

                if (prop.propertyDepth > deepestPropDepth) {
                    deepestProp = prop;
                    deepestPropDepth = prop.propertyDepth;
                }
            }
            return deepestProp;
        }
    }

    /**
     * Resolves a selected driver property to a usable VALUE property.
     * If the user selects an effect/property GROUP (e.g. the "Slider Control"
     * effect rather than its "Slider" parameter), the generated expression would
     * call .value on a group and fail ("Undefined value"). This drills into a
     * group to its first value child so both selections work.
     *
     * @param {Property} prop - The selected (possibly group) property.
     * @returns {Property|null} A value property, or null if none can be resolved.
     */
    function resolveDriverValueProperty(prop) {
        if (!prop) {
            return null;
        }
        // Already a value property (OneD/TwoD/Color/etc).
        if (prop.propertyValueType !== undefined && prop.propertyValueType !== PropertyValueType.NO_VALUE) {
            return prop;
        }
        // A group (effect, parade, etc.) — drill to the first value child.
        if (prop.numProperties) {
            for (var i = 1; i <= prop.numProperties; i++) {
                var child = prop.property(i);
                if (child && child.propertyValueType !== undefined && child.propertyValueType !== PropertyValueType.NO_VALUE) {
                    return child;
                }
            }
        }
        return null;
    }

    /**
     * Adds a checkbox controller to the specified layer's effects and sets its name.
     * If a checkbox with the same name already exists on the layer, that existing
     * controller is reused instead of creating a duplicate (so re-applying
     * Linearizer to the same target/control does not stack multiple
     * "Uniform Interpolation" checkboxes).
     *
     * @param {AVLayer} layer - The layer to which the checkbox controller will be added.
     * @param {String} name - The name to assign to the checkbox controller.
     * @returns {Property} The added (or existing) checkbox controller property.
     */
    function addCheckboxController(layer, name) {
        var effects = layer.property("ADBE Effect Parade");
        if (effects) {
            for (var i = 1; i <= effects.numProperties; i++) {
                var existing = effects.property(i);
                if (existing && existing.matchName === "ADBE Checkbox Control" && existing.name === name) {
                    return existing;
                }
            }
        }
        var checkbox = (effects || layer.Effects).addProperty("ADBE Checkbox Control");
        checkbox.name = name;
        return checkbox;
    }

    /**
     * Traverses up the property hierarchy and returns the name of the appropriate property group.
     * - If an ADBE Vector Group is found, its name is returned.
     * - If an ADBE Effects Parade or ADBE Mask Parade is found, the name of its child property group is returned.
     * - If the topmost object is the layer, the name of the child property group before the layer is returned.
     *
     * @param {Property} property - The starting property from which to traverse up the hierarchy.
     * @returns {String} The name of the appropriate property group.
     */
    function getPropertyGroupName(property) {
        var groupName = "";
        var previousPropertyName = "";

        while (property) {
            var parentProperty = property.parentProperty;

            if (property.matchName === "ADBE Vector Group") {
                groupName = property.name;
                break;
            }

            if (property.matchName === "ADBE Effect Parade" || property.matchName === "ADBE Mask Parade") {
                groupName = previousPropertyName;
                break;
            }

            if (!parentProperty) {
                groupName = previousPropertyName;
                break;
            }

            previousPropertyName = property.name;

            property = parentProperty;
        }

        return groupName;
    }

    function getPropertyType(selectedProperty) {
        // Determine dimensionality from the property's actual value shape.
        // The previous implementation probed by temporarily assigning test
        // expressions ("value", "[value[0], value[1]]", ...) and reading
        // expressionError. AE does not reliably populate expressionError
        // immediately after a write, so a 1D property (e.g. Opacity) was often
        // mis-detected as 2D/3D — the generated expression then wrote a
        // multi-component array to a 1D property, triggering
        // "Undefined value used in expression (could be an out of range array
        // subscript?)". Reading the value shape is deterministic and side-effect
        // free (no spurious expression writes left on the property).
        var v;
        try {
            v = selectedProperty.value;
        } catch (e) {
            // Property groups (e.g. an effect like "Slider Control") have no .value.
            return "unknown";
        }
        if (typeof v === "number") {
            return "1D";
        }
        if (v && typeof v.length === "number") {
            if (v.length === 2) return "2D";
            if (v.length === 3) return "3D";
            if (v.length === 4) return "4D";
        }
        return "unknown";
    }

    function main() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var selectedProperties = [];
        for (var i = 0; i < comp.selectedProperties.length; i++) {
            if (comp.selectedProperties[i] instanceof Property) {
                selectedProperties.push(comp.selectedProperties[i]);
            }
        }

        var driverProperty = null;
        var targetProperty = null;
        var targetProperties = [];
        var driverLayerName = "";
        var targetLayerName = "";

        var win = new Window("palette", "Linearizer", undefined);
        win.orientation = "column";

        if (selectedProperties.length < 1) {
            var targetBtn = win.add("button", undefined, "Select Target Property");
            var targetInfoGroup = win.add("group");
            targetInfoGroup.orientation = "column";
            var targetInfo = targetInfoGroup.add('statictext {text: "-empty-", justify: "center"}');
            targetInfo.preferredSize.width = 300;

            targetBtn.onClick = function () {
                var selectedTargetProperty = showDeepestSelectedProperty(comp.selectedProperties);

                if (targetProperty && selectedTargetProperty && targetProperty === selectedTargetProperty) {
                    targetProperty = null;
                    targetLayerName = "";
                    targetBtn.text = "Select Target Property";
                    targetInfo.text = "-empty-";
                } else if (selectedTargetProperty) {
                    if (selectedTargetProperty.numKeys < 2) {
                        alert("Target property must have at least two keyframes.");
                    } else if (selectedTargetProperty.propertyValueType === 6424 || selectedTargetProperty.propertyValueType === 6418 || selectedTargetProperty.propertyValueType === 6412) {
                        alert("Linearizer doesn't work with color, text, or grouped properties. Please select a 1D, 2D, or 3D numeric property.");
                    } else {
                        targetProperty = selectedTargetProperty;
                        targetLayerName = comp.selectedLayers[0].name;
                        targetBtn.text = "Target Property Selected";

                        var propertyName = getPropertyGroupName(targetProperty) + ">" + targetProperty.name;
                        targetInfo.text = "Layer: " + targetLayerName + " - Property: " + propertyName;
                    }
                } else {
                    alert("Please select a valid target property.");
                }
            };
        } else {
            for (var i = 0; i < selectedProperties.length; i++) {
                if (selectedProperties[i].numKeys < 2) {
                    alert("All selected properties must have at least two keyframes.");
                    return;
                }
                // Mirror the single-target compatibility guard: reject TEXT_DOCUMENT (6424),
                // COLOR (6418) and NO_VALUE/group (6412) properties. createExpression() only
                // dispatches on 1D/2D/3D value shapes, so an incompatible pre-selected property
                // would otherwise silently produce a no-op expression that never assigns `value`.
                if (selectedProperties[i].propertyValueType === 6424 || selectedProperties[i].propertyValueType === 6418 || selectedProperties[i].propertyValueType === 6412) {
                    alert("Linearizer doesn't work with color, text, or grouped properties. Please select only 1D, 2D, or 3D numeric properties.");
                    return;
                }
                targetProperties.push(selectedProperties[i]);
            }
        }

        var driverBtn = win.add("button", undefined, "Select Driver Property");
        var driverInfoGroup = win.add("group");
        driverInfoGroup.orientation = "column";
        var driverInfo = driverInfoGroup.add('statictext {text: "-empty-", justify: "center"}');
        driverInfo.preferredSize.width = 300;
        var minMaxGroup = win.add("group");
        minMaxGroup.orientation = "row";
        var minInput = minMaxGroup.add("edittext", undefined, "Min Value");
        minInput.characters = 20;
        var maxInput = minMaxGroup.add("edittext", undefined, "Max Value");
        maxInput.characters = 20;

        var buttonGroup = win.add("group");
        var applyBtn = buttonGroup.add("button", undefined, "Apply Linear Expression");
        var cancelBtn = buttonGroup.add("button", undefined, "Cancel");

        driverBtn.onClick = function () {
            try {
                var selectedDriverProperty = resolveDriverValueProperty(showDeepestSelectedProperty(comp.selectedProperties));
                var propertyName = "";
                var propertyDimension = "";
                var selectedDimensionIndex = -1;

                if (driverProperty && selectedDriverProperty && driverProperty === selectedDriverProperty) {
                    driverProperty = null;
                    driverLayerName = "";
                    driverBtn.text = "Select Driver Property";
                    driverInfo.text = "-empty-";
                } else if (selectedDriverProperty) {
                    var propertyType = getPropertyType(selectedDriverProperty);

                    if (propertyType === "2D" || propertyType === "3D" || propertyType === "4D") {
                        var dimOptions = [];
                        if (propertyType === "2D") {
                            dimOptions = ["X", "Y"];
                        } else if (propertyType === "3D") {
                            dimOptions = ["X", "Y", "Z"];
                        } else if (propertyType === "4D") {
                            dimOptions = ["X", "Y", "Z", "W"];
                        }

                        var dialog = new Window("dialog", "Select Property Dimension");
                        var radioGroup = dialog.add("group");
                        radioGroup.orientation = "row";
                        var radios = [];

                        for (var i = 0; i < dimOptions.length; i++) {
                            radios[i] = radioGroup.add("radiobutton", undefined, dimOptions[i]);
                        }

                        radios[0].value = true;
                        dialog.add("button", undefined, "OK", { name: "ok" });

                        if (dialog.show() !== 1) return;

                        for (var i = 0; i < radios.length; i++) {
                            if (radios[i].value) {
                                selectedDimensionIndex = i;
                                propertyDimension = "[" + selectedDimensionIndex + "]";
                                break;
                            }
                        }

                        propertyName = getPropertyGroupName(selectedDriverProperty) + ">" + selectedDriverProperty.name + propertyDimension;
                    } else {
                        propertyName = getPropertyGroupName(selectedDriverProperty) + ">" + selectedDriverProperty.name;
                    }

                    driverProperty = selectedDriverProperty;
                    driverLayerName = comp.selectedLayers[0].name;
                    driverBtn.text = "Driver Property Selected";
                    driverInfo.text = "Layer: " + driverLayerName + " - Property: " + propertyName;
                    driverProperty.dimensionIndex = selectedDimensionIndex;
                } else {
                    alert("Please select a valid driver property.");
                }
            } catch (error) {
                alert("An error occurred: " + error.message);
            }
        };

        applyBtn.onClick = function () {
            if (!driverProperty) {
                alert("Please select a driver property.");
                return;
            }

            var minVal = parseFloat(minInput.text);
            var maxVal = parseFloat(maxInput.text);

            if (isNaN(minVal) || isNaN(maxVal)) {
                alert("Please enter valid numeric values for min and max.");
                return;
            }

            var driverPropertyPath = getPropertyExpressionPath(driverProperty);
            var dimensionSuffix = '';
            if (driverProperty.dimensionIndex !== undefined && driverProperty.dimensionIndex !== -1) {
                dimensionSuffix = "[" + driverProperty.dimensionIndex + "]";
            }

            if (selectedProperties.length < 1 && targetProperty) {
                targetProperties.push(targetProperty);
            }

            if (targetProperties.length < 1) {
                alert("Please select at least one target property.");
                return;
            }

            var checkboxName = "Uniform Interpolation || Multiple Properties";
            if (targetProperties.length === 1) {
                // In batch mode targetLayerName is never set by the Target button, so
                // derive it from the property itself. Without this the layer segment is
                // empty and two runs targeting the same property group/name on different
                // layers collide onto one shared checkbox controller.
                if (!targetLayerName) {
                    targetLayerName = getLayerNameFromProperty(targetProperties[0]);
                }
                var propertyName = getPropertyGroupName(targetProperties[0]) + ">" + targetProperties[0].name;
                checkboxName = "Uniform Interpolation ||" + targetLayerName + ">" + propertyName;
            }

            var timingContext = buildTimingContext(targetProperties);
            var undoGroupOpen = false;
            try {
                app.beginUndoGroup("Linearizer");
                undoGroupOpen = true;

                var driverLayer = comp.layer(driverLayerName);
                var checkboxController = addCheckboxController(driverLayer, checkboxName);

                for (var i = 0; i < targetProperties.length; i++) {
                    // NOTE: do NOT name this `targetProperty` — a `var targetProperty`
                    // here hoists to the top of this handler and shadows the outer
                    // `targetProperty` (set by the Target button in the no-preselection
                    // mode), which made the `selectedProperties.length < 1 && targetProperty`
                    // push above evaluate against `undefined`. That left targetProperties
                    // empty: no expression applied and the checkbox fell back to the
                    // generic "Multiple Properties" name.
                    var currentTarget = targetProperties[i];
                    var keyframes = [];
                    for (var j = 1; j <= currentTarget.numKeys; j++) {
                        keyframes.push(captureKeyframe(currentTarget, j));
                    }

                    var is2D = typeof keyframes[0] === 'object' && keyframes[0].length;
                    var expression = createExpression(driverLayerName, driverPropertyPath, keyframes, is2D, minVal, maxVal, currentTarget, checkboxController, dimensionSuffix, timingContext);
                    currentTarget.expression = expression;
                }

                app.endUndoGroup();
                undoGroupOpen = false;
                win.close();
            } catch (error) {
                if (undoGroupOpen) {
                    app.endUndoGroup();
                }
                alert("An error occurred while applying Linearizer: " + error.message);
            }
        };

        cancelBtn.onClick = function () {
            win.close();
        };

        win.center();
        win.show();
    }



    main();

})();
