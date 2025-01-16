/**
 * Linear Applicator
 *
 * This script applies a linear expression to a selected property based on a driver property 
 * in Adobe After Effects. It allows users to select a driver property, set min and max values, 
 * and automatically maps the selected property's keyframes to the specified driver range.
 *
 * FUNCTIONALITY:
 * - Prompts the user to select a driver property and input min and max values.
 * - Displays the driver property information in a simplified format.
 * - Generates a linear expression that maps keyframes to the driver property range.
 * - Handles 1D and 2D properties and ensures the output value stays within keyframe range.
 * - Includes undo groups for better user experience.
 *
 * USAGE:
 * 1. Select a composition, layer, and property with keyframes in Adobe After Effects.
 * 2. Run the script.
 * 3. Enter the min and max values for the driver property.
 * 4. Select the driver property by clicking the "Select Driver Property" button.
 * 5. Click "Apply Linear Expression" to apply the expression to the selected property, or "Cancel" to exit without changes.
 *
 * @version 1.3.0
 * @date 2024-06-30
 * @license MIT License
 * @changelog 
 * 1.0.0 Initial release
 * 1.0.1 Fixed bug with controlling value clamping, improved UI display
 * 1.1.0 Added support for 1D and 2D properties
 * 1.2.0 Enhanced UI to display driver property information in a simplified format
 * 1.2.1 Improved handling of out-of-range driver values to prevent errors
 * 1.3.0 Included undo groups for better user experience, centered text, and improved display logic for driver property
 * 
 * Author: IVG Design
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


/**
 * Creates a linear expression that maps keyframes to a driver property range.
 *
 * @param {string} driverLayer - The name of the driver layer.
 * @param {string} driverPropertyPath - The path to the driver property.
 * @param {Array} keyframes - The array of keyframe values.
 * @param {boolean} is2D - Indicates whether the property is 2D.
 * @param {number} minVal - The minimum value of the driver property range.
 * @param {number} maxVal - The maximum value of the driver property range.
 * @returns {string} - The generated linear expression.
 */
function createExpression(driverLayer, driverPropertyPath, keyframes, is2D, minVal, maxVal) {
    var expression = "function linearExpression(value, inputMin, inputMax, outputMin, outputMax) {\n" +
        "  var normalizedValue = (value - inputMin) / (inputMax - inputMin);\n" +
        "  var outputValue = outputMin + normalizedValue * (outputMax - outputMin);\n" +
        "  return Math.max(Math.min(outputValue, Math.max(outputMin, outputMax)), Math.min(outputMin, outputMax));\n" +
        "}\n\n" +
        "var controllingValue = " + driverPropertyPath + ".value;\n" +
        "var minVal = Math.min(" + minVal + ", " + maxVal + ");\n" +
        "var maxVal = Math.max(" + minVal + ", " + maxVal + ");\n" +
        "if (controllingValue < minVal) controllingValue = minVal;\n" +
        "if (controllingValue > maxVal) controllingValue = maxVal;\n";

    var numSegments = keyframes.length - 1;
    var segmentLength = (maxVal - minVal) / numSegments;

    expression += "var mappedValueX, mappedValueY;\n";

    for (var i = 0; i < numSegments; i++) {
        var segmentStart = minVal + i * segmentLength;
        var segmentEnd = segmentStart + segmentLength;
        var kfStart = keyframes[i];
        var kfEnd = keyframes[i + 1];
        var kfMinX = is2D ? kfStart[0] : kfStart;
        var kfMaxX = is2D ? kfEnd[0] : kfEnd;
        var kfMinY = is2D ? kfStart[1] : null;
        var kfMaxY = is2D ? kfEnd[1] : null;

        expression += "if (controllingValue >= " + segmentStart + " && controllingValue <= " + segmentEnd + ") {\n" +
            "  mappedValueX = linearExpression(controllingValue, " + segmentStart + ", " + segmentEnd + ", " + kfMinX + ", " + kfMaxX + ");\n";

        if (is2D) {
            expression += "  mappedValueY = linearExpression(controllingValue, " + segmentStart + ", " + segmentEnd + ", " + kfMinY + ", " + kfMaxY + ");\n";
        }
        expression += "}\n";
    }

    if (is2D) {
        expression += "if (controllingValue < minVal) { mappedValueX = " + keyframes[0][0] + "; mappedValueY = " + keyframes[0][1] + "; }\n";
        expression += "if (controllingValue > maxVal) { mappedValueX = " + keyframes[numSegments][0] + "; mappedValueY = " + keyframes[numSegments][1] + "; }\n";
        expression += "value = [mappedValueX, mappedValueY];\n";
    } else {
        expression += "if (controllingValue < minVal) { mappedValueX = " + keyframes[0] + "; }\n";
        expression += "if (controllingValue > maxVal) { mappedValueX = " + keyframes[numSegments] + "; }\n";
        expression += "value = mappedValueX;\n";
    }

    return expression;
}

/**
 * Constructs the expression path for a given property in Adobe After Effects.
 *
 * @param {Property} property - The property for which to construct the expression path.
 * @returns {string} - The constructed expression path for the property.
 *
 * The function iterates through the property hierarchy, constructing a path string 
 * that represents the property in the form of an After Effects expression. If the 
 * property is part of an effect, it correctly formats the effect's name. Otherwise, 
 * it simply includes the property name. The resulting path starts with the composition 
 * layer and includes all parent properties up to the selected property.
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
 * Returns the deepest selected property from a list of selected properties in Adobe After Effects.
 *
 * @param {Array<Property>} selectedProperties - The list of selected properties.
 * @returns {Property} - The deepest selected property.
 *
 * This function determines the deepest selected property based on the propertyDepth attribute.
 * If only one property is selected, it directly returns that property. If multiple properties 
 * are selected, it iterates through the list to find and return the property with the greatest 
 * depth. This is useful for ensuring that the most nested property is selected in cases where 
 * multiple properties are selected simultaneously.
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


function main() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var layer = comp.selectedLayers[0];
    if (!layer) {
        alert("Please select a layer.");
        return;
    }

    var property = showDeepestSelectedProperty(comp.selectedProperties);
    if (!property || property.numKeys < 2) {
        alert("Please select a property with at least two keyframes.");
        return;
    }

    var keyframes = [];
    for (var i = 1; i <= property.numKeys; i++) {
        keyframes.push(property.keyValue(i));
    }

    var is2D = typeof keyframes[0] === 'object' && keyframes[0].length;

    var win = new Window("palette", "Driver Property");
    var minValField = win.add("edittext", undefined, "Min Value");
    minValField.characters = 20;
    var maxValField = win.add("edittext", undefined, "Max Value");
    maxValField.characters = 20;

    var driverBtn = win.add("button", undefined, "Select Driver Property");
    var driverInfoGroup = win.add("group");
    driverInfoGroup.orientation = "column";
    driverInfoGroup.alignChildren = "center";

    var driverInfo = driverInfoGroup.add('statictext {text: "-empty-", justify: "center"}');
    driverInfo.preferredSize.width = 300;

    var buttonGroup = win.add("group");
    var applyBtn = buttonGroup.add("button", undefined, "Apply Linear Expression");
    var cancelBtn = buttonGroup.add("button", undefined, "Cancel");

    var driverProperty = null;
    var driverLayerName = "";

    driverBtn.onClick = function () {
        var selectedDriverProperty = showDeepestSelectedProperty(comp.selectedProperties);

        if (driverProperty && selectedDriverProperty && driverProperty === selectedDriverProperty) {
            driverProperty = null;
            driverLayerName = "";
            driverBtn.text = "Select Driver Property";
            driverInfo.text = "-empty-";
        } else if (selectedDriverProperty) {
            driverProperty = selectedDriverProperty;
            driverLayerName = driverProperty.parentProperty.parentProperty.name; // Assuming the layer name
            driverBtn.text = "Driver Property Selected";

            var propertyName;
            var propertyNameN = comp.selectedProperties[0].name;
            var propParentName = comp.selectedProperties[0].parentProperty.name;

            if (driverProperty.parentProperty.matchName === 'ADBE Effect Parade') {
                propertyName = driverProperty.parentProperty.name + " - " + driverProperty.name;
            } else {
                propertyName = driverProperty.name;
            }
            driverInfo.text = "Layer: " + layer.name + " - Property: " +propParentName +", "+  propertyNameN;
        } else {
            alert("Please select a valid driver property.");
        }
    };

    applyBtn.onClick = function () {
        if (!driverProperty) {
            alert("Please select a driver property.");
            return;
        }

        var minVal = parseFloat(minValField.text);
        var maxVal = parseFloat(maxValField.text);
        if (isNaN(minVal) || isNaN(maxVal)) {
            alert("Please enter valid min and max values.");
            return;
        }

        var driverPropertyPath = getPropertyExpressionPath(driverProperty);

        app.beginUndoGroup("Apply Linear Expression");
        var expression = createExpression(driverLayerName, driverPropertyPath, keyframes, is2D, minVal, maxVal);
        property.expression = expression;
        app.endUndoGroup();

        win.close();
    };

    cancelBtn.onClick = function () {
        win.close();
    };

    win.center();
    win.show();
}

main();
