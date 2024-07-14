// @include 'modules/PropQuery.js'
//@include 'modules/ApplyFFX.js'
function getPropObject(comp, layerName, propertyPath) {
    // Extract actual property names using regex
    var path = [];
    var regex = /property\("([^"]+)"\)/g;
    var match;
    while (match = regex.exec(propertyPath)) {
        path.push(match[1]);
    }
    function findPath(node, current_path_index) {
        if (node.name !== path[current_path_index]) {
            return null;
        }

        // Found the property
        if (current_path_index === path.length - 1) {
            return node;
        }

        // Navigate through child properties
        if (node.numProperties > 0) {
            for (var j = 1; j <= node.numProperties; j++) { // Property indices start from 1
                var child = node.property(j);
                var result = findPath(child, current_path_index + 1);
                if (result !== null) {
                    return result;
                }
            }
        }

        return null;
    }

    // Main logic
    var layer = comp.layer(layerName);
    if (!layer) {
        throw new Error("Layer not found: " + layerName);
    }
    return findPath(layer, 0);
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
                var propAddress = PropQuery.main(selectedProperties, 'propPath', ["useMatchNames"]);
                var layerName = selectedLayer.name;
                getPropObject(comp, layerName, propAddress)
                
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