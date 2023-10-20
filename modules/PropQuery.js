/**
 * @file
 * @module PropQuery
 * @name PropQuery
 * @exports PropQuery
 * @description A JavaScript module to query properties in After Effects.
 */
var PropQuery = (function () {
    var module = {};
    //=============== FLAG ARRAY =================//
    /**
     * @typedef {Array} FlagArray
     * @description An array of flags to be used with the PropQuery module.
     */ 
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
    //=============== MODULES =================//

        /**
         * @function
         * @private
         * @name indexOf
         * @description Utility function to find index of element in array.
         * @param {Array} arr - Array to search.
         * @param {*} elem - Element to find.
         * @returns {number} - Index of element, -1 if not found.
         */
        function indexOf(arr, elem) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] === elem) {
                    return i;
                }
            }
            return -1;
        }
    
        /**
         * @function
         * @memberof PropQuery
         * @name showDeepestSelectedProperty
         * @description - Returns the deepest selected property, if the selected properties are pseudo effects, it will return the last property in the pseudo effect - since the first one is the pseudo effect itself.
         * @param {Object[]} selectedProperties - The selected properties in the After Effects UI.
         * @returns {Object|null} - The deepest selected property.
         * @example 
         * 
         * var selectedProp = PropQuery.showDeepestSelectedProperty(selectedProperties);
         */
    
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
        };
    
        /**
         * @function
         * @memberof PropQuery
         * @name getPropertyType
         * @description - Returns the type of the property, such as "Color", "3D", "2D" or "1D" if the property returns a value and can have an expression, or if it is propertyGroup, it will return "Indexed Group" or "Named Group" with the name and matchName of the group.
         * @param {Object} selectedProperty - should use the result of the showDeepestSelectedProperty function as the argument to make sure it works with pseudo effects.
         * @returns {String} - a string with the type of the selected property, eg( "Color", "3D", "2D" or "1D" or "Indexed Group" or "Named Group" with the name and matchName of the group).
         * @example
         * individual use
         * var propType =  PropQuery.getPropertyType(selectedProperty)
         * module use:
         * var propType = PropQuery(selectedProperty, 'propType')  
         */
        
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
        };


        /**
         * @function
         * @memberof PropQuery
         * @name collectPropertyHierarchyInfo
         * @description - Returns an array of objects with information about the property hierarchy, such as the name, matchName, propertyDepth, aS WELL as layerIndex and containingComp for the topmost parentProperty - which is the layer
         * @param {Object} selectedProperty - should use the result of the showDeepestSelectedProperty function as the argument to make sure it works with pseudo effects.
         * @param {FlagArray} optionalArg - An array of flags to be used with the PropQuery module - "layer", "layerName", "layerMatchName", "layerIndex", "hierarchy", "propName", "propMatchName". Flags can be combined, such as ["layer", "layerName"],["layer", "layerMatchName"],["layer", "layerIndex"] or ["layer", "hierarchy"].
         * @returns {Object[]} - An array of objects with information about the property hierarchy.
         * @example
         * individual use
         * var propHierarchy =  PropQuery.collectPropertyHierarchyInfo(selectedProperty)
         * module use:
         * var propHierarchy = PropQuery(selectedProperty, 'propInfo')     
         */
    
        module.collectPropertyHierarchyInfo = function (prop, optionalArg) {
            
            // Handle optionalArg being passed as an array, so it can be used with the module - this converts the array of flags to an object with a flags properties
            if (Array.isArray(optionalArg)) {
                optionalArg = { flags: optionalArg };
            }
            
            // Validate flags against allowedFlags
            var flags = optionalArg && optionalArg.flags || [];
            for (var i = 0; i < flags.length; i++) {
                if (indexOf(allowedFlags, flags[i]) === -1) {
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
        };
        
        /**
         * @function
         * @memberof PropQuery
         * @name constructPropertyPath
         * @description - Returns a string with the property path, based on the flags provided such as "useNames", "useMatchNames", "useGroupIndices". Flags can be combined, such as ["useNames", "useGroupIndices"],["useMatchNames", "useGroupIndices"],["useNames"] or ["useMatchNames"].
         * @param {Object[]} collectedHierarchy - must use the result of the collectPropertyHierarchyInfo function as this function is designed to work in tandem with it - parsing the object returned from collectPropertyHierarchyInfo.
         * @param {FlagArray} optionalArg - An array of flags to be used with the PropQuery module - "useNames", "useMatchNames", "useGroupIndices". Flags can be combined, such as ["useNames", "useGroupIndices"],["useMatchNames", "useGroupIndices"],["useNames"] or ["useMatchNames"].
         * @returns {String} - A string with the property path based on selected flags.
         * @example
         *  individual use
         * var propPath =  PropQuery.constructPropertyPath(collectedHierarchy, optionalArg)
         * module use:
         * var propPath = PropQuery(selectedProperty, 'propPath', optionalArg) 
         */
        module.constructPropertyPath = function (collectedHierarchy, optionalArg) {
            
            // Handle optionalArg being passed as an array, so it can be used with the module - this converts the array of flags to an object with a flags properties
            if (Array.isArray(optionalArg)) {
                optionalArg = { flags: optionalArg };
            }

            // Validate flags against allowedFlags
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
        };
        /**
         * @function    
         * @memberof PropQuery
         * @name mainFunction
         * @description - Returns the result of the selected return type, based on the selected property, return type and optionalArg.
         * @param {Object} selectedProperty - should use the result of the showDeepestSelectedProperty function as the argument to make sure it works with pseudo effects.
         * @param {String} returnType - The type of information to return - "propObject", "propType", "propPath", "propInfo".
         * @param {Array} optionalArg - The optionalArg is an array of flags to be used with the PropQuery module - "useNames", "useGroupIndices", "useMatchNames", "comp", "layerName", "layerMatchName", "layerIndex", "hierarchy", "propName", "propMatchName". Used only for "propPath" and "propInfo" return types. Flags can be combined, such as ["useNames", "useGroupIndices"],["useMatchNames", "useGroupIndices"],["useNames"] or ["useMatchNames"], or ["layerName", "comp"].
         * @returns {String||Object} - The result of the selected return type. selectedProperty object is returned by using returnType "propObject", property type string is returned by using returnType "propType", "propPath", property info object (consisting of the constructed hierarchy) is returned by using returnType "propInfo" without flags.
         * @example
         * var propPath = PropQuery(selectedProperty, 'propPath', ["useNames"])
         * var propInfo = PropQuery(selectedProperty, 'propInfo', ["layerName", "comp"])
         */
        var mainFunction = function (selectedProperty, returnType, optionalArg) {
            // Handle optionalArg being passed as an array, so it can be used with the module - this converts the array of flags to an object with a flags properties
            if (Array.isArray(optionalArg)) {
                optionalArg = { flags: optionalArg };
            }
            
            // Validate flags against allowedFlags
            var flags = optionalArg && optionalArg.flags || [];
            for (var i = 0; i < flags.length; i++) {
                if (indexOf(allowedFlags, flags[i]) === -1) {
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
        };
    //============== EXPOSE MODULES FOR INDIVIDUAL USE ==================//
        mainFunction.showDeepestSelectedProperty = module.showDeepestSelectedProperty;
        
        mainFunction.getPropertyType = module.getPropertyType;
        
        mainFunction.collectPropertyHierarchyInfo = module.collectPropertyHierarchyInfo;
        
        mainFunction.constructPropertyPath = module.constructPropertyPath;
    
    return mainFunction;

})();


/*********************TESTER MODULE**********************/

    function testPropPathModule() {
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem) {
            var selectedProperties = comp.selectedProperties;
            if (selectedProperties.length === 0) {
                alert('No property selected.');
                return;
            }

            // Create the palette
            var win = new Window('palette', 'Property Info', undefined, { resizeable: true });
            win.orientation = 'column';

            // Create the text area
            var textArea = win.add('edittext', undefined, '', {
                multiline: true,
                scrolling: true
            });
            textArea.size = [500, 200];

            win.onResizing = win.onResize = function () {
                this.layout.resize();
                textArea.size = [this.size[0] - 30, this.size[1] - 40];
            };
        
            var result = PropQuery(selectedProperties, 'propInfo', ["propName"])
            
            textArea.text = result;

            // Show the palette
            win.layout.layout(true);
            win.center();
            win.show();
        } else {
            alert('No composition is currently active.');
        }
    }

    // Run the test in After Effects
    testPropPathModule();
