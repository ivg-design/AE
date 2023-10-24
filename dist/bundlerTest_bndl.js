/************************ START OF INCLUDED FUNCTIONS ************************/
var Ae = (function () {
  var module = {};
  module.getDeepestSelectedProperty = module.getDeepestSelectedProperty = function (selectedProperties) {
		/**
		 * Finds the deepest selected property or property group from the given array of selected properties.
		 * 
		 * @returns {Property|PropertyGroup|null} The deepest selected property or property group, or null if none or multiple are selected.
		 */
		function findDeepestSelectedProp() {
			var deepestProp, numDeepestProps = 0, deepestPropDepth = 0;
			var prop;

			for (var i = 0; i < selectedProperties.length; i++) {
				prop = selectedProperties[i];

				if (prop.propertyDepth >= deepestPropDepth) {
					if (prop.propertyDepth > deepestPropDepth)
						numDeepestProps = 0;
					deepestProp = prop;
					numDeepestProps++;
					deepestPropDepth = prop.propertyDepth;
				}
			}

			return (numDeepestProps > 1) ? null : deepestProp;
		}

		return findDeepestSelectedProp();
	};
  module.checkPropertyType = module.checkPropertyType = function (selectedProperties) {
		var deepestProperty = this.getDeepestSelectedProperty(selectedProperties);

		if (!deepestProperty) {
			alert("No deepest property found!");
			return "Unknown";
		}

		var originalExpression = deepestProperty.expression;
		var propertyType = "Unknown";

		for (var i = 1; i <= 4; i++) {
			var testExpressionArray = [];
			for (var j = 0; j < i; j++) {
				testExpressionArray.push("value[" + j + "]");
			}
			var testExpression = "[" + testExpressionArray.join(", ") + "]";

			try {
				deepestProperty.expression = testExpression;

				// Check for expression error
				if (deepestProperty.expressionError === "") {
					// If it reaches here, the expression was successfully set
					if (i === 4) {
						propertyType = "Color";
					} else {
						propertyType = i + "D";
					}
				}
			} catch (e) {
				// Log the error if needed
			}
		}

		// Restore the original expression
		deepestProperty.expression = originalExpression;

		return propertyType;
	};
  return module;
})();
var ArrayEx = (function () {
  var module = {};
  module.filter = module.filter = function (array, callback) {
    var filteredArray = [];
    var index = 0;

    module.forEach(array, function (element, i, array) {
      if (callback(element, i, array)) {
        filteredArray[index++] = element;
      }
    });

    return filteredArray;
  };
  return module;
})();
var ApplyFFX = (function () {
  var module = {};
  module.config = module.config = function (layer, binaryData, matchName, version, name) {
		var config = {
			binary: binaryData,
			matchName: 'Pseudo/' + matchName,
			name: name,
			version: version,
		};

		var tempFolder = Folder.temp;
		var ffxFile = File(tempFolder.fsName + '/' + config.name + '_v' + config.version + '.ffx');
		ffxFile.encoding = 'BINARY';
		ffxFile.open('w');
		ffxFile.write(config.binary);
		ffxFile.close();

		var myComp = app.project.activeItem;
		module.deselectAll(myComp);
		layer.selected = true;
		layer.applyPreset(ffxFile);
	};
  return module;
})();
/************************ END OF INCLUDED FUNCTIONS ************************/
