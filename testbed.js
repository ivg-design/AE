// @include 'modules/Ae.js'
// @include 'modules/ArrayEx.js'


Ae.
// Utility function to get layer from a property
function getLayerFromProperty(property) {
    var layer = property;
    while (layer.parentProperty) {
        layer = layer.parentProperty;
    }
    return layer;
}

// Function to retrieve the property name
function getPropertyName(properties) {
    if (properties.length === 2) {
        return properties[0].name + " - " + properties[1].name;
    } else {
        return properties[0].name;
    }
}

// Function to retrieve the property address for setting expressions
function getPropertyAddress(property) {
    var hierarchy = [];
    var layer = getLayerFromProperty(property);
    var layerName = layer.name;

    while (property !== null && property !== undefined) {
        if (property instanceof PropertyGroup || property instanceof Property) {
            hierarchy.unshift('property("' + property.name + '")');
        }
        property = property.parentProperty;
    }

    var address = 'layer("' + layerName + '").' + hierarchy.join('.');
    return address;
}

// Main function
function main() {
    var comp = app.project.activeItem;
    if (comp !== null && (comp instanceof CompItem)) {
        var layers = comp.selectedLayers;
        if (layers.length > 0) {
            var selectedLayer = layers[0];
            var selectedProperties = selectedLayer.selectedProperties;
            if (selectedProperties.length > 0) {
                var selectedProperty = selectedProperties[selectedProperties.length - 1];
                var propName = getPropertyName(selectedProperties);
                var propAddress = getPropertyAddress(selectedProperty);
                alert("Property Name: " + propName + "\nProperty Address: " + propAddress);
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