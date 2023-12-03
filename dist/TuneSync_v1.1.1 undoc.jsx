var PropQuery = (function () {
    var module = {};
        var allowedFlags = [
            "useNames",
            "useGroupIndices",
            "useMatchNames",
            "comp",
            "layerName",
            "layerMatchName",
            "layerIndex",
            "hierarchy",
            "propName",
            "propMatchName"
    ];
        function indexOf(arr, elem) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === elem) {
                    return i;
                }
            }
            return -1;
        }
        function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        }
        module.showDeepestSelectedProperty = function (selectedProperties) {
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
        };
        module.getPropertyType = function (selectedProperty) {
            var originalExpression = selectedProperty.expression;
            var propertyType = "unknown";
            if (selectedProperty.propertyType === 6214) {
                return "Indexed Group, Name: " + selectedProperty.name + ", MatchName: " + (selectedProperty.matchName || "N/A");
            } else if (selectedProperty.propertyType === 6213) {
                return "Named Group, Name: " + selectedProperty.name + ", MatchName: " + (selectedProperty.matchName || "N/A");
            }
            if (!selectedProperty.canSetExpression) {
                return "Non-Expressible, MatchName: " + (selectedProperty.matchName || "N/A");
            }
            var lastSuccessful = 0;
            var testExpressions = [
                "value",
                "[value[0], value[1]]",
                "[value[0], value[1], value[2]]",
                "[value[0], value[1], value[2], value[3]]"
            ];
            for (var i = 0; i < testExpressions.length; i++) {
                try {
                    selectedProperty.expression = testExpressions[i];
                    if (selectedProperty.expressionError === "") {
                        lastSuccessful = i + 1;
                    }
                } catch (e) {
                }
            }
            if (lastSuccessful > 0) {
                propertyType = lastSuccessful + "D";
            } else {
                propertyType = "unknown";
            }
            selectedProperty.expression = originalExpression;
            return propertyType;
        };
        module.collectPropertyHierarchyInfo = function (prop, optionalArg) {
            if (isArray(optionalArg)) {
                optionalArg = { flags: optionalArg };
            }
            var flags = optionalArg && optionalArg.flags || [];
            for (var i = 0; i < flags.length; i++) {
                if (indexOf(allowedFlags, flags[i]) === -1) {
                    throw new Error("Invalid flag: " + flags[i]);
                }
            }
            var propInfo = []; 
            while (prop && prop.parentProperty) {
                var info = {
                    name: prop.name,
                    matchName: prop.matchName,
                    propertyDepth: prop.propertyIndex
                };
                propInfo.push(info);
                prop = prop.parentProperty;
            }
            if (prop && prop.containingComp) {
                var layerInfo = {
                    name: prop.name,
                    matchName: prop.matchName,
                    layerIndex: prop.index,
                    containingComp: prop.containingComp.name
                };
                propInfo.push(layerInfo);
            }
            if (flags.length > 0) {
                var lastInfo = propInfo[propInfo.length - 1]; 
                var firstInfo = propInfo[0]; 
                var results = '';
                for (var i = 0; i < flags.length; i++) {
                    var flag = flags[i];
                    switch (flag) {
                        case 'comp':
                            results += lastInfo.containingComp + ',';
                            break;
                        case 'layerName':
                            results += lastInfo.name + ',';
                            break;
                        case 'layerMatchName':
                            results += lastInfo.matchName + ',';
                            break;
                        case 'layerIndex':
                            results += lastInfo.layerIndex + ',';
                            break;
                        case 'hierarchy':
                            results += JSON.stringify(propInfo) + ',';
                            break;
                        case 'propName': 
                            if (firstInfo) {
                                results += firstInfo.name + ',';
                            }
                            break;
                        case 'propMatchName': 
                            if (firstInfo) {
                                results += firstInfo.matchName + ',';
                            }
                            break;
                        default:
                            throw new Error("Invalid flag provided");
                    }
                }
                if (results.length > 0) {
                    results = results.substring(0, results.length - 1);
                }
                return results;
            } else {
                return propInfo;
            }
        };
        module.constructPropertyPath = function (collectedHierarchy, optionalArg) {
            if (isArray(optionalArg)) {
                optionalArg = { flags: optionalArg };
            }
            var flags = optionalArg && optionalArg.flags || [];
            for (var i = 0; i < flags.length; i++) {
                if (indexOf(allowedFlags, flags[i]) === -1) {
                    throw new Error("Invalid flag: " + flags[i]);
                }
            }
            var useNames = flags.indexOf("useNames") !== -1;
            var useMatchNames = flags.indexOf("useMatchNames") !== -1;
            var useGroupIndices = flags.indexOf("useGroupIndices") !== -1;
            var propertyPath = '';
            var layerInfo = collectedHierarchy[collectedHierarchy.length - 1];
            if (!layerInfo) {
                throw new Error("Layer information not found in collectedHierarchy.");
            }
            if (useGroupIndices) {
                propertyPath += 'layer(' + layerInfo.layerIndex + ')';
            } else {
                propertyPath += 'layer("' + layerInfo.name + '")';
            }
            for (var i = collectedHierarchy.length - 2; i >= 0; i--) {
                var info = collectedHierarchy[i];
                var part = '';
                if (i === 0) {
                    if (useMatchNames) {
                        part = 'property("' + info.matchName + '")';
                    } else if (useNames) {
                        part = 'property("' + info.name + '")';
                    }
                } else {
                    if (useGroupIndices && info.name !== "Contents") {
                        part = 'property(' + info.propertyDepth + ')';
                    } else if (useMatchNames) {
                        part = 'property("' + info.matchName + '")';
                    } else if (useNames) {
                        part = 'property("' + info.name + '")';
                    }
                }
                if (part) {
                    propertyPath += '.' + part;
                }
            }
            return propertyPath;
        };
        var mainFunction = function (selectedProperty, returnType, optionalArg) {
            if (isArray(optionalArg)) {
                optionalArg = { flags: optionalArg };
            }
            var flags = optionalArg && optionalArg.flags || [];
            for (var i = 0; i < flags.length; i++) {
                if (indexOf(allowedFlags, flags[i]) === -1) {
                    throw new Error("Invalid flag: " + flags[i]);
                }
            }
            var deepestProp = module.showDeepestSelectedProperty(selectedProperty);
            if (!deepestProp) {
                throw new Error("No deepest property found");
            }
            switch (returnType) {
                case 'propObject':
                    return deepestProp;
                case 'propType':
                    return module.getPropertyType(deepestProp);
                case 'propPath':
                    var hierarchyInfo = module.collectPropertyHierarchyInfo(deepestProp);
                    return module.constructPropertyPath(hierarchyInfo, optionalArg);
                case 'propInfo':
                    var info = module.collectPropertyHierarchyInfo(deepestProp, optionalArg);
                    if (isArray(info) || typeof info === 'string') {
                        if (isArray(info)) {
                            var firstInfo = info[0]; 
                            var lastInfo = info[info.length - 1]; 
                            var results = '';
                            if (optionalArg && optionalArg.flags) {
                                if (indexOf(optionalArg.flags, "propName") !== -1) results += firstInfo.name + ',';
                                if (indexOf(optionalArg.flags, "propMatchName") !== -1) results += firstInfo.matchName + ',';
                                if (indexOf(optionalArg.flags, "layerName") !== -1) results += lastInfo.name + ',';
                                if (indexOf(optionalArg.flags, "layerMatchName") !== -1) results += lastInfo.matchName + ',';
                                if (indexOf(optionalArg.flags, "layerIndex") !== -1) results += lastInfo.layerIndex + ',';
                                if (indexOf(optionalArg.flags, "comp") !== -1) results += lastInfo.containingComp + ',';
                                if (results.length > 0) {
                                    results = results.substring(0, results.length - 1);
                                }
                            } else {
                                return info;
                            }
                            return results;  
                        } else {
                            return info;
                        }
                    }
                    throw new Error("Unexpected info structure");
                default:
                    throw new Error("Invalid return type");
            }
        };
        mainFunction.showDeepestSelectedProperty = module.showDeepestSelectedProperty;
        mainFunction.getPropertyType = module.getPropertyType;
        mainFunction.collectPropertyHierarchyInfo = module.collectPropertyHierarchyInfo;
        mainFunction.constructPropertyPath = module.constructPropertyPath;
        return mainFunction;
    })();
var MainUI = (function () {
    var module = {};
    module.show = function (thisObj) {
            var isPanel = thisObj instanceof Panel;
            var win = isPanel ? thisObj : new Window("palette", "TuneSync", undefined, { closeButton: true, resizeable: true });
            win.preferredSize.width = 300;
            win.orientation = "column";
            var reactorGroup = win.add("group");
            reactorGroup.orientation = "row";
            var label = reactorGroup.add("statictext", undefined, "Pick Reactor:");
            label.size = [80, 25];
            var dropdown = reactorGroup.add("dropdownlist", undefined, []);
            dropdown.size = [150, 25];
            var buttonGroup = win.add("group");
            buttonGroup.orientation = "row";
            var tuneSyncButton = buttonGroup.add("button", undefined, "TuneSync");
            tuneSyncButton.size = [100, 25];
            var refreshButton = buttonGroup.add("button", undefined, "↺");
            refreshButton.size = [25, 25];
            function populateDropdown() {
                dropdown.removeAll();
                for (var i = 1; i <= app.project.numItems; i++) {
                    var currentItem = app.project.item(i);
                    if (currentItem && currentItem instanceof CompItem) {
                        var currentItemName = currentItem.name;
                        if (typeof currentItemName === 'string' && currentItemName.indexOf("AUDIO REACTOR") !== -1) {
                            dropdown.add("item", currentItemName);
                        }
                    }
                }
                if (dropdown.items.length > 0) {
                    dropdown.selection = 0;
                }
            }
            populateDropdown();
            refreshButton.onClick = function () {
                populateDropdown();
            };
            tuneSyncButton.onClick = function () {
                app.beginUndoGroup("Create Controls");
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    alert("No composition is active.");
                    return;
                }
                var layers = comp.selectedLayers;
                if (layers.length === 0) {
                    alert("No layer is selected.");
                    return;
                }
                var layer = layers[0];
                var props = layer.selectedProperties;
                if (props.length === 0) {
                    alert("No property is selected.");
                    return;
                }
                var propName = PropQuery(props, "propInfo", ["propName"]);
                var propMatchName = PropQuery(props, "propInfo", ["propMatchName"]);
                var propObj = PropQuery(props, "propObject");
                var propAddr = PropQuery(props, "propPath", ["useNames"]);
                var dd = dropdown;
                var audioReactorName = getAudioReactorName(dd);
                var propertyType = PropQuery(props, "propType");
                switch (propertyType) {
                    case '2D':
                        XYUnifyDialog(layer, propName, audioReactorName, propMatchName, propObj, propAddr);
                        break;
                    case '3D':
                        XYZUnifyDialog(layer, propName, audioReactorName, propMatchName, propObj)
                        break;
                    case '4D':
                        handleColorProperty(layer, propName, audioReactorName, propMatchName, propObj); 
                        break;
                    case '1D':
                    default:
                        handle1DProperty(layer, propName, audioReactorName, propMatchName, propObj, propAddr);
                        break;
                }
                app.endUndoGroup();
            };
        if (!isPanel) {
            win.show();
            } else {
                win.onResizing = win.onResize = function () {
                    this.layout.layout(true);
                    this.layout.resize();
                };
            }
        return win;
    };
            function XYUnifyDialog(layer, propName, audioReactorName, propMatchName, propObj, propAddr) {
                    var dialog = new Window('dialog', 'XY Unify');
                    var propObj = propObj;
                    var parentGroup = dialog.add('group');
                    parentGroup.orientation = 'row';
                    parentGroup.alignment = 'center';
                    var xGroup = parentGroup.add('group');
                    xGroup.orientation = 'column';
                    xGroup.alignment = 'center';
                    var xCheckBox = xGroup.add('checkbox', undefined, '');
                    xGroup.add('statictext', undefined, 'X').justify = 'center';
                    var yGroup = parentGroup.add('group');
                    yGroup.orientation = 'column';
                    yGroup.alignment = 'center';
                    var yCheckBox = yGroup.add('checkbox', undefined, '');
                    yGroup.add('statictext', undefined, 'Y').justify = 'center';
                    var unifiedGroup = parentGroup.add('group');
                    unifiedGroup.orientation = 'column';
                    unifiedGroup.alignment = 'center';
                    var unifiedCheckBox = unifiedGroup.add('checkbox', undefined, '');
                    var unifiedLabel = unifiedGroup.add('statictext', undefined, 'Unify Properties');
                    unifiedLabel.justify = 'center';
                    unifiedLabel.multiline = true;  
                    var buttonGroup = dialog.add('group');
                    buttonGroup.add('button', undefined, 'OK').onClick = function () {
                        handle2DProperty(layer, xCheckBox.value, yCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, propMatchName, propObj, propAddr);
                        dialog.close();
                    };
                    buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
                        dialog.close();
                    };
                dialog.show();
            }
            /**
             * @name XYZUnifyDialog
             * @description Creates a dialog box for 3D properties to be animated
             * @param {Layer} layer - The After Effects layer where the property resides.
             * @param {string} propName - name of 3D property add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to  
             * */
            function XYZUnifyDialog(layer, propName, audioReactorName, propMatchName) {
                    var dialog = new Window('dialog', 'XY Unify');
                    var parentGroup = dialog.add('group');
                    parentGroup.orientation = 'row';
                    parentGroup.alignment = 'center';
                    var xGroup = parentGroup.add('group');
                    xGroup.orientation = 'column';
                    xGroup.alignment = 'center';
                    var xCheckBox = xGroup.add('checkbox', undefined, '');
                    xGroup.add('statictext', undefined, 'X').justify = 'center';
                    var yGroup = parentGroup.add('group');
                    yGroup.orientation = 'column';
                    yGroup.alignment = 'center';
                    var yCheckBox = yGroup.add('checkbox', undefined, '');
                    yGroup.add('statictext', undefined, 'Y').justify = 'center';
                    var zGroup = parentGroup.add('group');
                    zGroup.orientation = 'column';
                    zGroup.alignment = 'center';
                    var zCheckBox = zGroup.add('checkbox', undefined, '');
                    zGroup.add('statictext', undefined, 'Z').justify = 'center';
                    var unifiedGroup = parentGroup.add('group');
                    unifiedGroup.orientation = 'column';
                    unifiedGroup.alignment = 'center';
                    var unifiedCheckBox = unifiedGroup.add('checkbox', undefined, '');
                    var unifiedLabel = unifiedGroup.add('statictext', undefined, 'Unify Properties');
                    unifiedLabel.justify = 'center';
                    unifiedLabel.multiline = true;  
                    var buttonGroup = dialog.add('group');
                    buttonGroup.add('button', undefined, 'OK').onClick = function () {
                        handle3DProperty(layer, xCheckBox.value, yCheckBox.value, zCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, propMatchName);
                        dialog.close();
                    };
                    buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
                        dialog.close();
                    };
                dialog.show();
            }
            function handleColorProperty(layer, propName, audioReactorName, propMatchName, propObj) {
                var parentName = propObj.parentProperty.name;
                var newPropName = parentName + "_" + propName;
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = easingDropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = newPropName + "_Easing Type";
                var startColorControl = layer.Effects.addProperty("ADBE Color Control");
                startColorControl.name = newPropName + "_Start";
                startColorControl.property("Color").setValue([0, 1, 0, 1]); 
                var endColorControl = layer.Effects.addProperty("ADBE Color Control");
                endColorControl.name = newPropName + "_End";
                endColorControl.property("Color").setValue([0, 0, 1, 1]); 
                var propLink = findPropertyByMatchName(layer, propMatchName);
                var expressionString = buildColorExpression(audioReactorName, newPropName); 
                propLink.expression = expressionString;
            };
            function buildColorExpression(audioReactorName, propName) {
                var expressionString = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");' + "\n"
                    + 'iMin = 0;' + "\n"
                    + 'iMax = 100;' + "\n"
                    + 'ctrlLayer = thisLayer;' + "\n"
                    + 'easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;' + "\n"
                    + 'startColor = ctrlLayer.effect("' + propName + '_Start")("Color");' + "\n"
                    + 'endColor = ctrlLayer.effect("' + propName + '_End")("Color");' + "\n"
                    + 'if (easeType == 1) linear(d, iMin, iMax, startColor, endColor);' + "\n"
                    + 'else if (easeType == 2) easeIn(d, iMin, iMax, startColor, endColor);' + "\n"
                    + 'else if (easeType == 3) easeOut(d, iMin, iMax, startColor, endColor);' + "\n"
                    + 'else ease(d, iMin, iMax, startColor, endColor);';
                return expressionString;
            };
            function handle1DProperty(layer, propName, audioReactorName, propMatchName, propObj, propAddr) {
                var outputSring = "Property-Vert";
                var referenceString = "Vertex";
                var isCaseSensitive = true;
                var parentName = propObj.parentProperty.name;
                if (propMatchName.indexOf("Pseudo") !== -1) {
                    var newPropName = compareAndReplace(parentName, referenceString, outputSring, isCaseSensitive) + " " + propName;
                } else {
                    var newPropName = compareAndReplace(propName, referenceString, outputSring, isCaseSensitive);
                }
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = easingDropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = newPropName + "_Easing Type";
                var minSlider = layer.Effects.addProperty("ADBE Slider Control");
                minSlider.name = newPropName + "_Min Output";
                var maxSlider = layer.Effects.addProperty("ADBE Slider Control");
                maxSlider.name = newPropName + "_Max Output";
                var propLink = findPropertyByAddress(propAddr);
                if (propLink) {
                    var expressionString = build1DExpression(audioReactorName, newPropName);
                    propLink.expression = expressionString;
                } else {
                    alert("Failed to update the expression. Property address could not be retrieved.");
                }
            }
            function build1DExpression( audioReactorName, propName){
                var expressionString = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");' + "\n"
                    + 'iMin = 0;' + "\n"
                    + 'iMax = 100;' + "\n"
                    + 'ctrlLayer = thisLayer;' + "\n"
                    + 'easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;' + "\n"
                    + 'outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");' + "\n"
                    + 'outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");' + "\n"
                    + 'if (easeType == 1) linear(d, iMin, iMax, outMin, outMax);' + "\n"
                    + 'else if (easeType == 2) easeIn(d, iMin, iMax, outMin, outMax);' + "\n"
                    + 'else if (easeType == 3) easeOut(d, iMin, iMax, outMin, outMax);' + "\n"
                    + 'else ease(d, iMin, iMax, outMin, outMax);';
                return expressionString
            }
            function handle2DProperty(layer, xSelected, ySelected, isUnified, propName, audioReactorName, propMatchName, propObj, propAddr) {
                var outputSring = "Property-Vert";
                var referenceString = "Vertex";
                var isCaseSensitive = true;
                var parentName = propObj.parentProperty.name;
                if (propMatchName.indexOf("Pseudo") !== -1) {
                    var newPropName = compareAndReplace(parentName, referenceString, outputSring, isCaseSensitive) + " " + propName;
                } else {
                    var newPropName = compareAndReplace(propName, referenceString, outputSring, isCaseSensitive);
                }
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = dropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = newPropName + "_Easing Type";
                if (isUnified) {
                    var outMinSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMinSlider.name = newPropName + "_Min Output";
                    var outMaxSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMaxSlider.name = newPropName + "_Max Output";
                } else {
                    if (!xSelected && !ySelected) {
                        var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMinXSlider.name = newPropName + "_Min Output X";
                        var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMaxXSlider.name = newPropName + "_Max Output X";
                        var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMinYSlider.name = newPropName + "_Min Output Y";
                        var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMaxYSlider.name = newPropName + "_Max Output Y";
                    } else {
                        if (xSelected) {
                            var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
                            outMinXSlider.name = newPropName + "_Min Output X";
                            var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
                            outMaxXSlider.name = newPropName + "_Max Output X";
                        }
                        if (ySelected) {
                            var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
                            outMinYSlider.name = newPropName + "_Min Output Y";
                            var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
                            outMaxYSlider.name = newPropName + "_Max Output Y";
                        }
                    }
                };
                var expression = build2DExpression(xSelected, ySelected, isUnified, newPropName, audioReactorName);
                var propLink = findPropertyByAddress(propAddr)
                propLink.expression = expression;
            }
            function build2DExpression(xSelected, ySelected, isUnified, newPropName, audioReactorName) {
                var expressionBase = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");\n' +
                    'iMin = 0;\n' +
                    'iMax = 100;\n' +
                    'originalValue = value;\n';
                var easingExpressionBase = 'ctrlLayer = thisLayer;\n' +
                    'easeType = ctrlLayer.effect("' + newPropName + '_Easing Type")("Menu").value;\n';
                var commonEasingLogic = '(easeType == 1 ? linear(d, iMin, iMax, outMin, outMax) : ' +
                    '(easeType == 2 ? easeIn(d, iMin, iMax, outMin, outMax) : ' +
                    '(easeType == 3 ? easeOut(d, iMin, iMax, outMin, outMax) : ' +
                    'ease(d, iMin, iMax, outMin, outMax))))';
                var finalExpression = expressionBase + easingExpressionBase;
                if (isUnified || (xSelected && ySelected)) {
                    finalExpression += 'outMin = ctrlLayer.effect("' + newPropName + '_Min Output")("Slider");\n';
                    finalExpression += 'outMax = ctrlLayer.effect("' + newPropName + '_Max Output")("Slider");\n';
                    finalExpression += 'xResult = yResult = ' + commonEasingLogic + ';\n';
                } else {
                    if (!xSelected && !ySelected) {
                        finalExpression += 'outMin = ctrlLayer.effect("' + newPropName + '_Min Output X")("Slider");\n';
                        finalExpression += 'outMax = ctrlLayer.effect("' + newPropName + '_Max Output X")("Slider");\n';
                        finalExpression += 'xResult = ' + commonEasingLogic + ';\n';
                        finalExpression += 'outMin = ctrlLayer.effect("' + newPropName + '_Min Output Y")("Slider");\n';
                        finalExpression += 'outMax = ctrlLayer.effect("' + newPropName + '_Max Output Y")("Slider");\n';
                        finalExpression += 'yResult = ' + commonEasingLogic + ';\n';
                    } else {
                        if (xSelected) {
                            finalExpression += 'outMin = ctrlLayer.effect("' + newPropName + '_Min Output X")("Slider");\n';
                            finalExpression += 'outMax = ctrlLayer.effect("' + newPropName + '_Max Output X")("Slider");\n';
                            finalExpression += 'xResult = ' + commonEasingLogic + ';\n';
                            finalExpression += 'yResult = originalValue[1];\n';
                        }
                        if (ySelected) {
                            finalExpression += 'outMin = ctrlLayer.effect("' + newPropName + '_Min Output Y")("Slider");\n';
                            finalExpression += 'outMax = ctrlLayer.effect("' + newPropName + '_Max Output Y")("Slider");\n';
                            finalExpression += 'yResult = ' + commonEasingLogic + ';\n';
                            finalExpression += 'xResult = originalValue[0];\n';
                        }
                    }
                }
                finalExpression += '[xResult, yResult];';
                return finalExpression;
            }
            function handle3DProperty(layer, xSelected, ySelected, zSelected, isUnified, propName, audioReactorName, propMatchName) {
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = dropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";
                if (isUnified) {
                    var outMinSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMinSlider.name = propName + "_Min Output";
                    var outMaxSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMaxSlider.name = propName + "_Max Output";
                } else {
                    var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMinXSlider.name = propName + "_Min Output X";
                    var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMaxXSlider.name = propName + "_Max Output X";
                    var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMinYSlider.name = propName + "_Min Output Y";
                    var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMaxYSlider.name = propName + "_Max Output Y";
                    var outMinZSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMinZSlider.name = propName + "_Min Output Z";
                    var outMaxZSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMaxZSlider.name = propName + "_Max Output Z";
                }
                var expression = build3DExpression(xSelected, ySelected, zSelected, isUnified, propName, audioReactorName);
                var propLink = findPropertyByMatchName(layer, propMatchName)
                propLink.expression = expression;
            }
            function build3DExpression(xSelected, ySelected, zSelected, isUnified, propName, audioReactorName) {
                var expr = 'var d = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");\n' +
                    'var iMin = 0;\n' +
                    'var iMax = 100;\n' +
                    'var ctrlLayer = thisLayer;\n' +
                    'var easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;\n';
                if (isUnified) {
                    expr += 'var outMin = ctrlLayer.effect("' + propName + '_Min Output")("Slider");\n' +
                        'var outMax = ctrlLayer.effect("' + propName + '_Max Output")("Slider");\n';
                } else {
                    expr += 'var outMinX = ctrlLayer.effect("' + propName + '_Min Output X")("Slider");\n' +
                        'var outMaxX = ctrlLayer.effect("' + propName + '_Max Output X")("Slider");\n' +
                        'var outMinY = ctrlLayer.effect("' + propName + '_Min Output Y")("Slider");\n' +
                        'var outMaxY = ctrlLayer.effect("' + propName + '_Max Output Y")("Slider");\n' +
                        'var outMinZ = ctrlLayer.effect("' + propName + '_Min Output Z")("Slider");\n' +
                        'var outMaxZ = ctrlLayer.effect("' + propName + '_Max Output Z")("Slider");\n';
                }
                expr += 'var x = value[0];\n' +
                    'var y = value[1];\n' +
                    'var z = value[2];\n';
                if (xSelected) {
                    expr += 'if (easeType == 1) x = ease(d, iMin, iMax, outMin, outMax);\n' +
                        'else if (easeType == 2) x = easeIn(d, iMin, iMax, outMin, outMax);\n' +
                        'else if (easeType == 3) x = easeOut(d, iMin, iMax, outMin, outMax);\n' +
                        'else x = easeInOut(d, iMin, iMax, outMin, outMax);\n';
                }
                if (ySelected) {
                    expr += 'if (easeType == 1) y = ease(d, iMin, iMax, outMin, outMax);\n' +
                        'else if (easeType == 2) y = easeIn(d, iMin, iMax, outMin, outMax);\n' +
                        'else if (easeType == 3) y = easeOut(d, iMin, iMax, outMin, outMax);\n' +
                        'else y = easeInOut(d, iMin, iMax, outMin, outMax);\n';
                }
                if (zSelected) {
                    expr += 'if (easeType == 1) z = ease(d, iMin, iMax, outMin, outMax);\n' +
                        'else if (easeType == 2) z = easeIn(d, iMin, iMax, outMin, outMax);\n' +
                        'else if (easeType == 3) z = easeOut(d, iMin, iMax, outMin, outMax);\n' +
                        'else z = easeInOut(d, iMin, iMax, outMin, outMax);\n';
                }
                expr += '[x, y, z];';
                return expr;
            }
            function compareAndReplace(inputString, referenceString, outputString, isCaseSensitive) {
                var searchStr = isCaseSensitive ? referenceString : referenceString.toLowerCase();
                var sourceStr = isCaseSensitive ? inputString : inputString.toLowerCase();
                if (sourceStr.indexOf(searchStr) !== -1) {
                    var regex = new RegExp(referenceString, isCaseSensitive ? "" : "i");
                    return inputString.replace(regex, outputString);
                } else {
                    return inputString;
                }
            };
            function getAudioReactorName(dd) {
                if (dd && dd.selection) {
                    return dd.selection.toString();
                } else {
                    return null;
                }
            };
            function findPropertyByMatchName(layerOrPropGroup, matchName) {
                for (var i = 1; i <= layerOrPropGroup.numProperties; i++) {
                    var prop = layerOrPropGroup.property(i);
                    if (prop.matchName === matchName) {
                        return prop;
                    }
                    if (prop.propertyType === PropertyType.INDEXED_GROUP || prop.propertyType === PropertyType.NAMED_GROUP) {
                        var foundProp = findPropertyByMatchName(prop, matchName);
                        if (foundProp) {
                            return foundProp;
                        }
                    }
                }
                return null;
            };
            function findPropertyByAddress(propAddr) {
                var parts = propAddr.match(/(?:layer|property)\("([^"]+)"\)/g);
                var myComp = app.project.activeItem;
                if (!(myComp instanceof CompItem)) {
                    alert('Active item is not a composition.');
                    return null;
                }
                var currentObject = myComp;
                for (var i = 0; i < parts.length; i++) {
                    var name = parts[i].match(/(?:layer|property)\("([^"]+)"\)/)[1];
                    if (i === 0 && parts[i].indexOf('layer') === 0) {
                        currentObject = myComp.layer(name);
                    } else {
                        currentObject = currentObject.property(name);
                    }
                    if (!currentObject) return null;
                }
                return currentObject;
            }
    return module;
})();
MainUI.show(this);