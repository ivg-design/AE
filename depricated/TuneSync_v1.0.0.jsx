/**
 * Include this file in your After Effects scripts folder to use TuneSync in your scripts. 
 * TuneSync is a script that allows you to sync properties to audio in After Effects. 
 * Itended to be use with Audio Reactor Template.header
 * @author IVG Design
 * @version 1.1.0
 * @license MIT
 * @usage - You can use the code herein for your own projects, but please do not redistribute or sell this code as your own. Please attrubute the author if you use this code in your own projects.
 * @ChangeLog 
 * - 1.0.0  - Initial Release
 * - 1.1.0  - improve handling of pseudo effects with names that contain the word "Vertex"
 *          - fix handling of color properties
 */

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
         * @private
         * @name isArray
         * @description Utility function to check if an object is an array.
         * @param {*} obj - Object to check.
         * @returns {boolean} - True if object is an array, false otherwise.
         */
        function isArray(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
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
            if (isArray(optionalArg)) {
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
            if (isArray(optionalArg)) {
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
            if (isArray(optionalArg)) {
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
                    if (isArray(info) || typeof info === 'string') {
                        if (isArray(info)) {
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

var MainUI = (function () {
    var module = {};
    // Create a dockable panel
    module.show = function (thisObj) {
        //LAYOUT
            var isPanel = thisObj instanceof Panel;
            var win = isPanel ? thisObj : new Window("palette", "TuneSync", undefined, { closeButton: true, resizeable: true });
            win.preferredSize.width = 300;
            win.orientation = "column";
            // Add a group to hold the label and the dropdown
            var reactorGroup = win.add("group");
            reactorGroup.orientation = "row";

            // Label for the dropdown
            var label = reactorGroup.add("statictext", undefined, "Pick Reactor:");
            label.size = [80, 25];

            // Dropdown for selecting the AUDIO REACTOR
            var dropdown = reactorGroup.add("dropdownlist", undefined, []);
            dropdown.size = [150, 25];

            // Add a group to hold the TuneSync and refresh buttons
            var buttonGroup = win.add("group");
            buttonGroup.orientation = "row";

            // Button for triggering the TuneSync function
            var tuneSyncButton = buttonGroup.add("button", undefined, "TuneSync");
            tuneSyncButton.size = [100, 25];

            // Refresh button to update the dropdown
            var refreshButton = buttonGroup.add("button", undefined, "↺");
            refreshButton.size = [25, 25];

        //DROPDOWN 
            // Populate the dropdown with AUDIO REACTOR compositions
            function populateDropdown() {
                // Clear current items
                dropdown.removeAll();

                // Find and add AUDIO REACTOR compositions to the dropdown
                for (var i = 1; i <= app.project.numItems; i++) {
                    var currentItem = app.project.item(i);

                    if (currentItem && currentItem instanceof CompItem) {
                        var currentItemName = currentItem.name;

                        if (typeof currentItemName === 'string' && currentItemName.indexOf("AUDIO REACTOR") !== -1) {
                            dropdown.add("item", currentItemName);
                        }
                    }
                }

                // Select the first item in the dropdown if available
                if (dropdown.items.length > 0) {
                    dropdown.selection = 0;
                }
            }
            populateDropdown();
        //ONCLICK FUNCTIONS

            // Refresh button functionality
            refreshButton.onClick = function () {
                populateDropdown();
            };

            // Add functionality to the TuneSync button (this is where you'll add the main logic of your script)
            tuneSyncButton.onClick = function () {
                app.beginUndoGroup("Create Controls");
                var comp = app.project.activeItem;
                if (!comp || !(comp instanceof CompItem)) {
                    alert("No composition is active.");
                    return;
                }

                // Get the selected layers
                var layers = comp.selectedLayers;
                if (layers.length === 0) {
                    alert("No layer is selected.");
                    return;
                }

                // Get the selected layer
                var layer = layers[0];

                // Get the selected properties
                var props = layer.selectedProperties;
                if (props.length === 0) {
                    alert("No property is selected.");
                    return;
                }
                var propName = PropQuery(props, "propInfo", ["propName"]);
                var propMatchName = PropQuery(props, "propInfo", ["propMatchName"]);
                var propObj = PropQuery(props, "propObject");
                var dd = dropdown;
                var audioReactorName = getAudioReactorName(dd);

                // Determine the property type (1D, 2D, 3D)
                var propertyType = PropQuery(props, "propType");

                switch (propertyType) {
                    case '2D':
                        XYUnifyDialog(layer, propName, audioReactorName, propMatchName, propObj);
                        break;
                    case '3D':
                        XYZUnifyDialog(layer, propName, audioReactorName, propMatchName, propObj)
                        break;
                    case '4D':
                        handleColorProperty(layer, propName, audioReactorName, propMatchName, propObj); 
                        break;
                    case '1D':
                    default:
                        handle1DProperty(layer, propName, audioReactorName, propMatchName, propObj);
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
    //DIALOGS
        //2D DIALOG
            /**
             * @name XYUnifyDialog
             * @discription Creates a dialog box for 2D properties to be animated
             * @param {Layer} layer - The After Effects layer where the property resides.
             * @param {string} propName - name of 2D property add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to 
             */
            function XYUnifyDialog(layer, propName, audioReactorName, propMatchName, propObj) {
                //LAYOUT
                    var dialog = new Window('dialog', 'XY Unify');
                    var propObj = propObj;
                    // Parent group with row alignment
                    var parentGroup = dialog.add('group');
                    parentGroup.orientation = 'row';
                    parentGroup.alignment = 'center';

                    // First column for X
                    var xGroup = parentGroup.add('group');
                    xGroup.orientation = 'column';
                    xGroup.alignment = 'center';
                    var xCheckBox = xGroup.add('checkbox', undefined, '');
                    xGroup.add('statictext', undefined, 'X').justify = 'center';

                    // Second column for Y
                    var yGroup = parentGroup.add('group');
                    yGroup.orientation = 'column';
                    yGroup.alignment = 'center';
                    var yCheckBox = yGroup.add('checkbox', undefined, '');
                    yGroup.add('statictext', undefined, 'Y').justify = 'center';

                    // Third column for Unified
                    var unifiedGroup = parentGroup.add('group');
                    unifiedGroup.orientation = 'column';
                    unifiedGroup.alignment = 'center';
                    var unifiedCheckBox = unifiedGroup.add('checkbox', undefined, '');
                    var unifiedLabel = unifiedGroup.add('statictext', undefined, 'Unify Properties');
                    unifiedLabel.justify = 'center';
                    unifiedLabel.multiline = true;  // Set to multiline

                    // Fourth Line: OK/Cancel buttons
                    var buttonGroup = dialog.add('group');
                //ON CLICK FUNCTIONS
                    buttonGroup.add('button', undefined, 'OK').onClick = function () {
                        handle2DProperty(layer, xCheckBox.value, yCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, propMatchName, propObj);
                        dialog.close();
                    };
                    buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
                        dialog.close();
                    };

                dialog.show();
            }
        //3D DIALOG
            /**
             * @name XYZUnifyDialog
             * @description Creates a dialog box for 3D properties to be animated
             * @param {Layer} layer - The After Effects layer where the property resides.
             * @param {string} propName - name of 3D property add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to  
             * */
            function XYZUnifyDialog(layer, propName, audioReactorName, propMatchName) {
                //LAYOUT
                    var dialog = new Window('dialog', 'XY Unify');

                    // Parent group with row alignment
                    var parentGroup = dialog.add('group');
                    parentGroup.orientation = 'row';
                    parentGroup.alignment = 'center';

                    // First column for X
                    var xGroup = parentGroup.add('group');
                    xGroup.orientation = 'column';
                    xGroup.alignment = 'center';
                    var xCheckBox = xGroup.add('checkbox', undefined, '');
                    xGroup.add('statictext', undefined, 'X').justify = 'center';

                    // Second column for Y
                    var yGroup = parentGroup.add('group');
                    yGroup.orientation = 'column';
                    yGroup.alignment = 'center';
                    var yCheckBox = yGroup.add('checkbox', undefined, '');
                    yGroup.add('statictext', undefined, 'Y').justify = 'center';

                    // New column for Z
                    var zGroup = parentGroup.add('group');
                    zGroup.orientation = 'column';
                    zGroup.alignment = 'center';
                    var zCheckBox = zGroup.add('checkbox', undefined, '');
                    zGroup.add('statictext', undefined, 'Z').justify = 'center';

                    // Third column for Unified
                    var unifiedGroup = parentGroup.add('group');
                    unifiedGroup.orientation = 'column';
                    unifiedGroup.alignment = 'center';
                    var unifiedCheckBox = unifiedGroup.add('checkbox', undefined, '');
                    var unifiedLabel = unifiedGroup.add('statictext', undefined, 'Unify Properties');
                    unifiedLabel.justify = 'center';
                    unifiedLabel.multiline = true;  // Set to multiline

                    // Fourth Line: OK/Cancel buttons
                    var buttonGroup = dialog.add('group');
                //ON CLICK FUNCTIONS
                    buttonGroup.add('button', undefined, 'OK').onClick = function () {
                        // Adjust the handle2DProperty function to accommodate the new Z checkbox
                        handle3DProperty(layer, xCheckBox.value, yCheckBox.value, zCheckBox.value, unifiedCheckBox.value, propName, audioReactorName, propMatchName);
                        dialog.close();
                    };
                    buttonGroup.add('button', undefined, 'Cancel').onClick = function () {
                        dialog.close();
                    };

                dialog.show();
            }

    //HANDLERS
        //COLOR HANDLER
            /**
             * @name handleColorProperty
             * @description Configures a color property to react to audio in the audioreactor comp and adds controls for the expression
             * @param {Layer} layer - The After Effects layer where the color property resides 
             * @param {string} propName - name of color property to add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to
             * @returns {void}  
             */
            function handleColorProperty(layer, propName, audioReactorName, propMatchName) {

                // Create Easing dropdown
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = easingDropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";

                // Create Start and End Color controls
                var startColorControl = layer.Effects.addProperty("ADBE Color Control");
                startColorControl.name = propName + "_Start Color";
                startColorControl.property("Color").setValue([0, 1, 0, 1]); // Set to Green (RGBA)

                var endColorControl = layer.Effects.addProperty("ADBE Color Control");
                endColorControl.name = propName + "_End Color";
                endColorControl.property("Color").setValue([0, 0, 1, 1]); // Set to Blue (RGBA)

                var propLink = findPropertyByMatchName(layer, propMatchName);
                var expressionString = buildColorExpression(audioReactorName, propName); // Replace with your actual function for building color expressions
                propLink.expression = expressionString;
                
            };

            /** 
             * @name buildColorExpression
             * @description Generates a color expression string based on the parameters provided.   
             * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
             * @param {string} propName - The name of the property being affected (e.g., "Position", "Scale").
             * @returns {string} A string containing the complete expression for After Effects using the parameters provided.
            */
            function buildColorExpression(audioReactorName, propName) {
                // Create the expression
                var expressionString = 'd = comp("' + audioReactorName + '").layer("Select Frequency").effect("Audio Reactor")("Output Power");' + "\n"
                    + 'iMin = 0;' + "\n"
                    + 'iMax = 100;' + "\n"
                    + 'ctrlLayer = thisLayer;' + "\n"
                    + 'easeType = ctrlLayer.effect("' + propName + '_Easing Type")("Menu").value;' + "\n"
                    + 'startColor = ctrlLayer.effect("' + propName + '_Start Color")("Color");' + "\n"
                    + 'endColor = ctrlLayer.effect("' + propName + '_End Color")("Color");' + "\n"
                    + 'if (easeType == 1) linear(d, iMin, iMax, startColor, endColor);' + "\n"
                    + 'else if (easeType == 2) easeIn(d, iMin, iMax, startColor, endColor);' + "\n"
                    + 'else if (easeType == 3) easeOut(d, iMin, iMax, startColor, endColor);' + "\n"
                    + 'else ease(d, iMin, iMax, startColor, endColor);';
                return expressionString;
            };
        
        //1D HANDLER
            /**
             * @name handle1DProperty
             * @description Configures a 1D property to react to audio in the audioreactor comp and adds controls for the expression - rotation/opacity
             * @param {Layer} layer - The After Effects layer where the property resides
             * @param {string} propName - name of 1D property to add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to
             * @returns {void}
             */
            function handle1DProperty(layer, propName, audioReactorName, propMatchName, propObj) {
                var outputSring = "Property-Vert";
                var referenceString = "Vertex";
                var isCaseSensitive = true;
                var parentName = propObj.parentProperty.name;
                if (propMatchName.indexOf("Pseudo") !== -1) {
                    var newPropName = compareAndReplace(parentName, referenceString, outputSring, isCaseSensitive) + " " + propName;
                } else {
                    var newPropName = compareAndReplace(propName, referenceString, outputSring, isCaseSensitive);
                }// Create Easing dropdown
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var easingDropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = easingDropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = newPropName + "_Easing Type";

                // Create Min and Max sliders
                var minSlider = layer.Effects.addProperty("ADBE Slider Control");
                minSlider.name = newPropName + "_Min Output";
                var maxSlider = layer.Effects.addProperty("ADBE Slider Control");
                maxSlider.name = newPropName + "_Max Output";
                var propLink = findPropertyByMatchName(layer, propMatchName);
                if (propLink) {
                    var expressionString = build1DExpression(audioReactorName, newPropName);
                    propLink.expression = expressionString;
                } else {
                    alert("Failed to update the expression. Property address could not be retrieved.");
                }
            }

            /**
             * @name build1DExpression
             * @description Generates a 1D expression string based on the parameters provided.
             * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
             * @param {string} propName - The name of the property being affected (e.g., "Position", "Scale").
             * @returns {string} A string containing the complete expression for After Effects using the parameters provided. 
             */ 
            function build1DExpression( audioReactorName, propName){
                // Create the expression
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
        //2D HANDLER
            /**
             * @name handle2DProperty
             * @description Configures a 2D property and adds relevant expression controls to react to audio in the audioreactor comp and adds controls for the expression - 2D position/2D scale/2D anchor point, based on the options selected in the 2D dialog
             * @param {Layer} layer - The After Effects layer where the property resides    
             * @param {boolean} xSelected - Determines if the x value is affected by the expression - based on the selection in 2D dialog.
             * @param {boolean} ySelected - Determines if the y value is affected by the expression - based on the selection in 2D dialog.
             * @param {boolean} isUnified - Determines if the effect should be applied uniformly to both X & Y axis - based on the selection in 2D dialog.
             * @param {string} propName - name of 2D property to add the expression to  
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to
             * @returns {void}
            */
            function handle2DProperty(layer, xSelected, ySelected, isUnified, propName, audioReactorName, propMatchName, propObj) {
                var outputSring = "Property-Vert";
                var referenceString = "Vertex";
                var isCaseSensitive = true;
                var parentName = propObj.parentProperty.name;
                if (propMatchName.indexOf("Pseudo") !== -1) {
                    var newPropName = compareAndReplace(parentName, referenceString, outputSring, isCaseSensitive) + " " + propName;
                } else {
                    var newPropName = compareAndReplace(propName, referenceString, outputSring, isCaseSensitive);
                }
                // Add Easing dropdown
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = dropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = newPropName + "_Easing Type";

                if (isUnified) {
                    // Unified sliders for Min and Max Output
                    var outMinSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMinSlider.name = newPropName + "_Min Output";

                    var outMaxSlider = layer.Effects.addProperty("ADBE Slider Control");
                    outMaxSlider.name = newPropName + "_Max Output";
                } else {
                    if (!xSelected && !ySelected) {
                        // Create individual sliders for X and Y Min and Max Output
                        var outMinXSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMinXSlider.name = newPropName + "_Min Output X";

                        var outMaxXSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMaxXSlider.name = newPropName + "_Max Output X";

                        var outMinYSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMinYSlider.name = newPropName + "_Min Output Y";

                        var outMaxYSlider = layer.Effects.addProperty("ADBE Slider Control");
                        outMaxYSlider.name = newPropName + "_Max Output Y";
                    } else {
                        // Individual sliders for X and Y Min and Max Output
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

                // Build the expression based on the selections
                var expression = build2DExpression(xSelected, ySelected, isUnified, newPropName, audioReactorName);
                var propLink = findPropertyByMatchName(layer, propMatchName)
                // Apply the expression to the selected property
                propLink.expression = expression;
            }

            /**
             * @name build2DExpression
             * @description Generates a 2D expression string based on the parameters provided.
             * @param {boolean} xSelected - Determines if the x value is affected by the expression - basedon on the selection in the 2D dialog.
             * @param {boolean} ySelected - Determines if the y value is affected by the expression - basedon on the selection in the 2D dialog.
             * @param {boolean} isUnified - Determines if the effect should be applied uniformly to both X & Y axis - basedon on the selection in the 2D dialog.
             * @param {string} propName - name of 2D property to add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @returns {string} A string containing the complete expression for After Effects using the parameters provided.
            */
            function build2DExpression(xSelected, ySelected, isUnified, propName, audioReactorName) {
                var outputSring = "Property-Vert";
                var referenceString = "Vertex";
                var isCaseSensitive = true;
                var newPropName = compareAndReplace(propName, referenceString, outputSring, isCaseSensitive);
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
        //3D HANDLER
            /**
             * @name handle3DProperty
             * @description Configures a 3D property and adds relevant expression controls to react to audio in the audioreactor comp and adds controls for the expression - 3D position/3D scale/3D anchor point, based on the options selected in the 3D dialog 
             * @param {Layer} layer - The After Effects layer where the property resides
             * @param {boolean} xSelected - Determines if the x value is affected by the expression - basedon on the selection in the 3D dialog.
             * @param {boolean} ySelected - Determines if the y value is affected by the expression - basedon on the selection in the 3D dialog.
             * @param {boolean} zSelected - Determines if the z value is affected by the expression - basedon on the selection in the 3D dialog.
             * @param {boolean} isUnified - Determines if the effect should be applied uniformly to all axes - basedon on the selection in the 3D dialog.
             * @param {string} propName - name of 3D property to add the expression to
             * @param {string} audioReactorName - name of the composition that contains the audio reactor.
             * @param {string} propMatchName - matchName of the property to add the expression to
             * @returns {void}
             *  
            */
            function handle3DProperty(layer, xSelected, ySelected, zSelected, isUnified, propName, audioReactorName, propMatchName) {
                // Add Easing dropdown
                var dropDownParams = ["Linear", "EaseIn", "EaseOut", "EaseInOut"];
                var dropdown = layer.Effects.addProperty("ADBE Dropdown Control");
                var setDropDownParams = dropdown.property(1).setPropertyParameters(dropDownParams);
                setDropDownParams.propertyGroup(1).name = propName + "_Easing Type";

                // Create Sliders based on whether it's unified or individual
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

                // Build the expression
                var expression = build3DExpression(xSelected, ySelected, zSelected, isUnified, propName, audioReactorName);
                var propLink = findPropertyByMatchName(layer, propMatchName)

                // Apply the expression to the property
                propLink.expression = expression;
            }

            /**
             * @name build3DExpression
             * @description Generates a 3D expression string based on the parameters provided.
             * @param {boolean} xSelected - Determines if the x-axis is affected by the expression.
             * @param {boolean} ySelected - Determines if the y-axis is affected by the expression.
             * @param {boolean} zSelected - Determines if the z-axis is affected by the expression.
             * @param {boolean} isUnified - Determines if the effect should be applied uniformly to all axes.
             * @param {string} propName - The name of the property being affected (e.g., "Position", "Scale").
             * @param {string} audioReactorName - The name of the composition that contains the audio reactor.
             * @returns {string} A string containing the complete expression for After Effects.
             * 
             * 
             */
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

            //HELPER FUNCTIONS
            /**
             * @name compareAndReplace
             * @description - compares two strings and replaces the first string with the second string, if a string contains multiple words it will replace only the word that matches the reference string, if the string does not contain the reference string it will return the original string. Using the isCaseSensitive parameter you can determine if the comparison should be case sensitive.
             * @param {string} inputString - The string to be modified.
             * @param {string} referenceString - The string to that you want to compare input string to.
             * @param {string} outputString - The string that you want to replace the input string with.
             * @param {boolean} isCaseSensitive - Determines if the comparison should be case sensitive.
             * @returns {string} if input string was matched to reference string it will return the modified string, if not it will return the original string.
            */
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

            /**
             * @name getAudioReactorName
             * @description - gets the name of the audioreactor selected in the dropdown menu of the main UI.
             * @param {string} dd - The dropdown object that contains the name of the composition that contains the audio reactor.
             * @returns {string|null} returns the name of the selected audioreactor.
            */
            function getAudioReactorName(dd) {
                if (dd && dd.selection) {
                    return dd.selection.toString();
                } else {
                    return null;
                }
            };
            
            /**
             * @name findPropertyByMatchName
             * @description - finds a property by matchName and returns the property object.
             * @param {Layer||PropertyGroup} layerOrPropGroup - The layer or property group that contains the property you want to find.
             * @param {string} matchName - The matchName of the property you want to find.
             * @returns {Object} returns the property object that matches the matchName. 
            */
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

    return module;
})();

// Run the script
MainUI.show(this);