//@include 'modules/json2.js';
//@include 'modules/PropQuery.js';

function get_prop_object(comp, layerName, propertyPath) {
    // Extract actual property names using regex
    var path = [];
    var regex = /property\("([^"]+)"\)/g;
    var match;
    while (match = regex.exec(propertyPath)) {
        path.push(match[1]);
    }

    function find_path(node, current_path_index) {
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
                var result = find_path(child, current_path_index + 1);
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
    return find_path(layer, 0);
}

// Example usage
var comp = app.project.activeItem;  // Replace with your CompItem
var layer = comp.selectedLayers[0];  // Replace with your layer
var layerName = layer.name;  // Replace with your layer name];
var propertyPath = PropQuery.main(layer.selectedProperties, "propPath", ["useMatchNames"])

try {
    var propertyObject = get_prop_object(comp, layerName, propertyPath);
    alert(JSON.stringify(propertyObject));
} catch (e) {
    // Handle error
    alert(e.toString());
}
