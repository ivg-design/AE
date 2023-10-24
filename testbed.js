// @include 'modules/PropQuery.js'
//@include 'modules/ApplyFFX.js'

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
                var ffx = ApplyFFX.config(selectedLayer, "binaryData", "matchName", "version", "name");
                ffx();
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