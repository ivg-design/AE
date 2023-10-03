// @include 'modules/Ae.js'
// @include 'modules/ArrayEx.js'
// Main function
function main() {
    var comp = app.project.activeItem;
    if (comp !== null && (comp instanceof CompItem)) {
        var layers = comp.selectedLayers;
        if (layers.length > 0) {
            var selectedLayer = layers[0];
            var selectedProperties = selectedLayer.selectedProperties;
            if (selectedProperties.length > 0) {
                var propName = Ae.getPropName(selectedProperties);
                var propAddress = Ae.retrieveProp();
                propAddress.expression = "loopOut()"
                alert(propName)
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