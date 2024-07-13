function createExpression(driverLayer, driverPropertyPath, keyframes, is2D, minVal, maxVal, property) {
    var expression = "function linearExpression(value, inputMin, inputMax, outputMin, outputMax) {\n" +
        "  var normalizedValue = (value - inputMin) / (inputMax - inputMin);\n" +
        "  var outputValue = outputMin + normalizedValue * (outputMax - outputMin);\n" +
        "  return Math.max(Math.min(outputValue, Math.max(outputMin, outputMax)), Math.min(outputMin, outputMax));\n" +
        "}\n\n" +
        "function linearArrayInterpolation(value, inputMin, inputMax, key1, key2) {\n" +
        "  var result = { vertices: [], inTangents: [], outTangents: [] };\n" +
        "  for (var i = 0; i < key1.vertices.length; i++) {\n" +
        "    result.vertices.push([\n" +
        "      linearExpression(value, inputMin, inputMax, key1.vertices[i][0], key2.vertices[i][0]),\n" +
        "      linearExpression(value, inputMin, inputMax, key1.vertices[i][1], key2.vertices[i][1])\n" +
        "    ]);\n" +
        "    result.inTangents.push([\n" +
        "      linearExpression(value, inputMin, inputMax, key1.inTangents[i][0], key2.inTangents[i][0]),\n" +
        "      linearExpression(value, inputMin, inputMax, key1.inTangents[i][1], key2.inTangents[i][1])\n" +
        "    ]);\n" +
        "    result.outTangents.push([\n" +
        "      linearExpression(value, inputMin, inputMax, key1.outTangents[i][0], key2.outTangents[i][0]),\n" +
        "      linearExpression(value, inputMin, inputMax, key1.outTangents[i][1], key2.outTangents[i][1])\n" +
        "    ]);\n" +
        "  }\n" +
        "  return result;\n" +
        "}\n\n" +
        "var controllingValue = " + driverPropertyPath + ".value;\n" +
        "var minVal = Math.min(" + minVal + ", " + maxVal + ");\n" +
        "var maxVal = Math.max(" + minVal + ", " + maxVal + ");\n" +
        "if (controllingValue < minVal) controllingValue = minVal;\n" +
        "if (controllingValue > maxVal) controllingValue = maxVal;\n";

    var numSegments = keyframes.length - 1;
    var segmentLength = (numSegments > 0) ? (maxVal - minVal) / numSegments : 0;

    if (property.propertyValueType === PropertyValueType.SHAPE) {
        var allKeys = [];

        for (var i = 0; i < keyframes.length; i++) {
            var shape = keyframes[i];
            var kf = {
                vertices: shape.vertices,
                inTangents: shape.inTangents,
                outTangents: shape.outTangents,
                isClosed: shape.closed
            };
            allKeys.push(kf);
        }

        expression += "var allKeys = " + JSON.stringify(allKeys) + ";\n";
        expression += "var result = { vertices: [], inTangents: [], outTangents: [] };\n";

        for (var i = 0; i < numSegments; i++) {
            var segmentStart = minVal + i * segmentLength;
            var segmentEnd = segmentStart + segmentLength;

            if (segmentStart === segmentEnd) {
                segmentEnd += 0.0001; // Avoid division by zero
            }

            expression += "if (controllingValue >= " + segmentStart + " && controllingValue <= " + segmentEnd + ") {\n";
            expression += "  result = linearArrayInterpolation(controllingValue, " + segmentStart + ", " + segmentEnd + ", allKeys[" + i + "], allKeys[" + (i + 1) + "]);\n";
            expression += "}\n";
        }

        // Handle cases where controllingValue is outside the defined min/max range
        expression += "if (controllingValue < minVal) {\n";
        expression += "  result = allKeys[0];\n";
        expression += "}\n";

        expression += "if (controllingValue > maxVal) {\n";
        expression += "  result = allKeys[" + numSegments + "];\n";
        expression += "}\n";

        expression += "createPath(result.vertices, result.inTangents, result.outTangents, allKeys[0].isClosed);\n";

    } else {
        expression += "var mappedValueX, mappedValueY;\n";

        if (numSegments > 0) {
            for (var i = 0; i < numSegments; i++) {
                var segmentStart = minVal + i * segmentLength;
                var segmentEnd = segmentStart + segmentLength;

                if (segmentStart === segmentEnd) {
                    segmentEnd += 0.0001; // Avoid division by zero
                }

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
        } else {
            expression += "value = " + keyframes[0] + ";\n";
        }
    }

    return expression;
}



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
            if (driverProperty.parentProperty.matchName === 'ADBE Effect Parade') {
                propertyName = driverProperty.parentProperty.name + " - " + driverProperty.name;
            } else {
                propertyName = driverProperty.name;
            }
            driverInfo.text = "Layer: " + driverLayerName + " - Property: " + propertyName;
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
        var expression = createExpression(driverLayerName, driverPropertyPath, keyframes, is2D, minVal, maxVal, property);
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
