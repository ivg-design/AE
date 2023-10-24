//========== INCLUDED FUNCTIONS ============//
var Ae = (function () {
 var module = {};
	module.getDeepestSelectedProperty = function (selectedProperties) {
		
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
	module.checkPropertyType = function (selectedProperties) {
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

 return module;
})();
var ApplyFFX = (function () {
 var module = {};
	module.config = function (layer, binaryData, matchName, version, name) {
		var config = {
			binary: binaryData,
			matchName: 'Pseudo/' + matchName,
			name: name,
			version: version,
		};

 return module;
})();
//========== END OF INCLUDED FUNCTIONS ============//

// Test script for bundler


// Using a function from the Ae library
Ae.getDeepestSelectedProperty(selectedProperties);
Ae.checkPropertyType(selectedProperties);

// Using a function from the ArrayEx library
ArrayEx.filter(array, callback);

// Using a function from the ApplyFFX library
ApplyFFX.config(layer, binaryData, matchName, version, shapeName);

// Some random code to make the script do something
console.log("This is a test script for the bundler.");
