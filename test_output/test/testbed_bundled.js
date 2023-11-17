//===================== START OF INCLUDED FUNCTIONS ==================//

var PropQuery = (function() {
    var module = {};
    module.main = function (selectedProperty, returnType, optionalArg) {
                module._init();
                var allowedFlags = module.allowedFlags;
    
                // Handle optionalArg being passed as an array, so it can be used with the module - this converts the array of flags to an object with a flags properties
                if (Array.isArray(optionalArg)) {
                    optionalArg = { flags: optionalArg };
                }
    
                // Validate flags against allowedFlags
                var flags = optionalArg && optionalArg.flags || [];
                for (var i = 0; i < flags.length; i++) {
                    if (module.indexOf(allowedFlags, flags[i]) === -1) {
                        throw new Error("Invalid flag: " + flags[i]);
                    }
                }
    
                // Get the deepest selected property
                var deepestProp = module.showDeepestSelectedProperty(selectedProperty);
    
                if (!deepestProp) {
                    throw new Error("No deepest property found");
                }
    
                // Handle each return type accordingly
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
                        if (Array.isArray(info) || typeof info === 'string') {
                            if (Array.isArray(info)) {
                                var firstInfo = info[0]; // First should contain the selected property info
                                var lastInfo = info[info.length - 1]; // Last usually contains layer info
                                var results = '';
    
                                if (optionalArg && optionalArg.flags) {
                                    if (indexOf(optionalArg.flags, "propName") !== -1) results += firstInfo.name + ',';
                                    if (indexOf(optionalArg.flags, "propMatchName") !== -1) results += firstInfo.matchName + ',';
                                    if (indexOf(optionalArg.flags, "layerName") !== -1) results += lastInfo.name + ',';
                                    if (indexOf(optionalArg.flags, "layerMatchName") !== -1) results += lastInfo.matchName + ',';
                                    if (indexOf(optionalArg.flags, "layerIndex") !== -1) results += lastInfo.layerIndex + ',';
                                    if (indexOf(optionalArg.flags, "comp") !== -1) results += lastInfo.containingComp + ',';
    
                                    // Remove the trailing comma
                                    if (results.length > 0) {
                                        results = results.substring(0, results.length - 1);
                                    }
                                } else {
                                    return info;
                                }
    
                                return results;  // Return the comma-separated string
                            } else {
                                // If it's already a string, just return it
                                return info;
                            }
                        }
                        throw new Error("Unexpected info structure");
                    default:
                        throw new Error("Invalid return type");
                }
            }
    module._init = function () {
            module.allowedFlags
            
            /**
             * Checks if the given argument is an array.
             * 
             * @param {*} arg - The argument to check.
             * @returns {boolean} True if the argument is an array, false otherwise.
             */
            if (!Array.isArray) {
                Array.isArray = function (arg) {
                    return Object.prototype.toString.call(arg) === '[object Array]';
                };
            };
        }
    module.indexOf = function(arr, elem) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === elem) {
                    return i;
                }
            }
            return -1;
        }
    module.showDeepestSelectedProperty = function (selectedProperties) {
                if (selectedProperties.length === 1) {
                    return selectedProperties[0]; // Directly return if only one property is selected
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
    module.getPropertyType = function (selectedProperty) {
                var originalExpression = selectedProperty.expression;
                var propertyType = "unknown";
    
                // Check for Indexed Group or Named Group
                if (selectedProperty.propertyType === 6214) {
                    return "Indexed Group, Name: " + selectedProperty.name + ", MatchName: " + (selectedProperty.matchName || "N/A");
                } else if (selectedProperty.propertyType === 6213) {
                    return "Named Group, Name: " + selectedProperty.name + ", MatchName: " + (selectedProperty.matchName || "N/A");
                }
    
                // Check if the property can have an expression
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
    
                        // Check for Expression Error
                        if (selectedProperty.expressionError === "") {
                            lastSuccessful = i + 1;
                        }
                    } catch (e) {
                        // Handle the exception if needed
                        // Do nothing here to let the loop continue
                    }
                }
    
                // Determine the property type based on the last successful index
                if (lastSuccessful > 0) {
                    propertyType = lastSuccessful + "D";
                } else {
                    propertyType = "unknown";
                }
    
    
    
                // Restore the original expression
                selectedProperty.expression = originalExpression;
    
                return propertyType;
            }
    module.collectPropertyHierarchyInfo = function (prop, optionalArg) {
                module._init();
                var allowedFlags = module.allowedFlags;
    
                // Handle optionalArg being passed as an array, so it can be used with the module - this converts the array of flags to an object with a flags properties
                if (Array.isArray(optionalArg)) {
                    optionalArg = { flags: optionalArg };
                }
                
                // Validate flags against allowedFlags
                var flags = optionalArg && optionalArg.flags || [];
                for (var i = 0; i < flags.length; i++) {
                    if (module.indexOf(allowedFlags, flags[i]) === -1) {
                        throw new Error("Invalid flag: " + flags[i]);
                    }
                }
    
    
                var propInfo = []; // Array to store property hierarchy information
    
                // Loop to collect parent properties
                while (prop && prop.parentProperty) {
                    // Create an object with information about the current property
                    var info = {
                        name: prop.name,
                        matchName: prop.matchName,
                        propertyDepth: prop.propertyIndex
                    };
                    propInfo.push(info);
    
                    // Move up to the parent property for the next iteration
                    prop = prop.parentProperty;
                }
    
                // Add consolidated layer info
                if (prop && prop.containingComp) {
                    var layerInfo = {
                        name: prop.name,
                        matchName: prop.matchName,
                        layerIndex: prop.index,
                        containingComp: prop.containingComp.name
                    };
                    propInfo.push(layerInfo);
                }
                // Return based on the flag
                if (flags.length > 0) {
                    var lastInfo = propInfo[propInfo.length - 1]; // Last usually contains layer info
                    var firstInfo = propInfo[0]; // First should contain the selected property info
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
                            case 'propName': // Handle new flag
                                if (firstInfo) {
                                    results += firstInfo.name + ',';
                                }
                                break;
                            case 'propMatchName': // Handle new flag
                                if (firstInfo) {
                                    results += firstInfo.matchName + ',';
                                }
                                break;
                            default:
                                throw new Error("Invalid flag provided");
                        }
                    }
    
                    // Remove the trailing comma
                    if (results.length > 0) {
                        results = results.substring(0, results.length - 1);
                    }
    
                    return results;
                } else {
                    return propInfo;
                }
            }
    module.constructPropertyPath = function (collectedHierarchy, optionalArg) {
                module._init();
                var allowedFlags = module.allowedFlags;
    
                // Handle optionalArg being passed as an array, so it can be used with the module - this converts the array of flags to an object with a flags properties
                if (Array.isArray(optionalArg)) {
                    optionalArg = { flags: optionalArg };
                }
    
                // Validate flags against allowedFlags
                var flags = optionalArg && optionalArg.flags || [];
                for (var i = 0; i < flags.length; i++) {
                    if (module.indexOf(allowedFlags, flags[i]) === -1) {
                        throw new Error("Invalid flag: " + flags[i]);
                    }
                };
    
                var useNames = indexOf(flags,"useNames") !== -1;
                var useMatchNames = indexOf(flags, "useMatchNames") !== -1;
                var useGroupIndices = indexOf(flags, "useGroupIndices") !== -1;
                var propertyPath = '';
    
                // Process layer information first
                var layerInfo = collectedHierarchy[collectedHierarchy.length - 1];
    
                if (!layerInfo) {
                    throw new Error("Layer information not found in collectedHierarchy.");
                }
    
                if (useGroupIndices) {
                    propertyPath += 'layer(' + layerInfo.layerIndex + ')';
                } else {
                    propertyPath += 'layer("' + layerInfo.name + '")';
                }
    
                // Process remaining property information
                for (var i = collectedHierarchy.length - 2; i >= 0; i--) {
                    var info = collectedHierarchy[i];
                    var part = '';
    
                    // For the deepest property, use either matchName or name, never index
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
            }  // Function bodies should be indented correctly here
    return module;
})();
//===================== END OF INCLUDED FUNCTIONS ==================//

// @include 'modules/PropQuery.js'

// Main function
function main() {
    var comp = app.project.activeItem;
    if (comp !== null && (comp instanceof CompItem)) {
        var layers = comp.selectedLayers;
        if (layers.length > 0) {
            var selectedLayer = layers[0];
            var selectedProperties = selectedLayer.selectedProperties;
            if (selectedProperties.length > 0) {
                var propName = PropQuery.main(selectedProperties, "propInfo", ["layerName","propMatchName"]);
                var propAddress = PropQuery.main(selectedProperties, 'propPath', ["useNames", "useGroupIndices"]);
                var propType = PropQuery.main(selectedProperties, 'propType')
                
                alert("the Property Name is: " + propName + "\n" + "the Property Address is: " + propAddress + "\n" + "the Property Type is: " + propType + "\n")
            } else {
                alert("No property is selected in the layer.");
            }
        } else {
            alert("No layers are selected in the composition.");
        }
    } else {
        alert("No composition is currently active.");
    }
}

// Execute the main function
main();