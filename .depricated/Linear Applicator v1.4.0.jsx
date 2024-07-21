function createExpression(driverLayer, driverPropertyPath, keyframes, is2D, minVal, maxVal, property) {
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
    var segmentLength = (numSegments > 0) ? (maxVal - minVal) / numSegments : 0;

    if (property.propertyValueType === PropertyValueType.SHAPE) {
        // Handle path property keyframes
        var vertices = [];
        var inTangents = [];
        var outTangents = [];
        var closed = keyframes[0].closed;

        for (var i = 0; i < keyframes.length; i++) {
            var shape = keyframes[i];
            vertices.push(shape.vertices);
            inTangents.push(shape.inTangents);
            outTangents.push(shape.outTangents);
        }

        // Debugging alerts
        alert("Number of segments: " + numSegments);
        alert("Segment length: " + segmentLength);
        alert("Vertices: " + JSON.stringify(vertices));
        alert("InTangents: " + JSON.stringify(inTangents));
        alert("OutTangents: " + JSON.stringify(outTangents));

        expression += "var vertices = [], inTangents = [], outTangents = [];\n";

        for (var i = 0; i < numSegments; i++) {
            var segmentStart = minVal + i * segmentLength;
            var segmentEnd = segmentStart + segmentLength;

            // Avoid division by zero
            if (segmentStart === segmentEnd) {
                segmentEnd += 0.0001;
            }

            // Debugging alerts for each segment
            alert("Segment " + i + " - Start: " + segmentStart + ", End: " + segmentEnd);

            expression += "if (controllingValue >= " + segmentStart + " && controllingValue <= " + segmentEnd + ") {\n";
            for (var j = 0; j < vertices[i].length; j++) {
                var kfStartV = vertices[i][j];
                var kfEndV = vertices[i + 1][j];
                var kfStartInT = inTangents[i][j];
                var kfEndInT = inTangents[i + 1][j];
                var kfStartOutT = outTangents[i][j];
                var kfEndOutT = outTangents[i + 1][j];

                // Debugging alerts for each vertex
                alert("Vertex " + j + " - kfStartV: " + kfStartV + ", kfEndV: " + kfEndV);

                expression += "  vertices[" + j + "] = linearExpression(controllingValue, " + segmentStart + ", " + segmentEnd + ", [" + kfStartV + "], [" + kfEndV + "]);\n";
                expression += "  inTangents[" + j + "] = linearExpression(controllingValue, " + segmentStart + ", " + segmentEnd + ", [" + kfStartInT + "], [" + kfEndInT + "]);\n";
                expression += "  outTangents[" + j + "] = linearExpression(controllingValue, " + segmentStart + ", " + segmentEnd + ", [" + kfStartOutT + "], [" + kfEndOutT + "]);\n";
            }
            expression += "}\n";
        }

        // Handle cases where controllingValue is outside the defined min/max range
        expression += "if (controllingValue < minVal) {\n";
        for (var j = 0; j < vertices[0].length; j++) {
            expression += "  vertices[" + j + "] = [" + vertices[0][j] + "];\n";
            expression += "  inTangents[" + j + "] = [" + inTangents[0][j] + "];\n";
            expression += "  outTangents[" + j + "] = [" + outTangents[0][j] + "];\n";
        }
        expression += "}\n";

        expression += "if (controllingValue > maxVal) {\n";
        for (var j = 0; j < vertices[numSegments].length; j++) {
            expression += "  vertices[" + j + "] = [" + vertices[numSegments][j] + "];\n";
            expression += "  inTangents[" + j + "] = [" + inTangents[numSegments][j] + "];\n";
            expression += "  outTangents[" + j + "] = [" + outTangents[numSegments][j] + "];\n";
        }
        expression += "}\n";

        expression += "createPath(vertices, inTangents, outTangents, " + closed + ");\n";
    

    } else {
        expression += "var mappedValueX, mappedValueY;\n";

        if (numSegments > 0) {
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
