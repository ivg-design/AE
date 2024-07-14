function showDeepestSelectedProperty(selectedProperties) {
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

function getPropertyType(selectedProperty) {
    var originalExpression = selectedProperty.expression;
    var propertyType = "unknown";

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

function testGetPropertyType() {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }3

    var selectedProperties = showDeepestSelectedProperty(comp.selectedProperties);
    if (!selectedProperties || selectedProperties.length === 0) {
        alert("Please select a property.");
        return;
    }

    var selectedProperty = selectedProperties;
    var propertyType = getPropertyType(selectedProperty);

    alert("The selected property is of type: " + propertyType);
}

// Run the test
testGetPropertyType();
