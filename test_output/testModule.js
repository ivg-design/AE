//@include "modules/PropQuery.js";
//@include "modules/BuildTreeView.js";
//@include "modules/json2.js";
// Main function
function main() {
    var comp = app.project.activeItem;
    if (comp !== null && (comp instanceof CompItem)) {
        var layers = comp.selectedLayers;
        if (layers.length > 0) {
            var selectedLayer = layers[0];
            var output = PropQuery.extractTreeViewGroups(selectedLayer);
            
            function showUI(output) {
                // Create a new dialog window for the user interface
                var win = new Window("dialog", "Shape Layer Controls");
                win.orientation = "column";
                win.alignChildren = ["fill", "top"];

                // Create a tree view for displaying shape groups
                var treeView = win.add("treeview", undefined, undefined, { multiselect: true }); // Enable multi-select during creation
                treeView.preferredSize = [300, 200];

                // Populate the tree view with shape groups
                BuildTreeView.createTreeView(output, treeView, treeView);        

                // Show the dialog window
                win.show();
            }
            showUI(output);

        } else {
            alert("No layers are selected in the composition.");
        }
    } else {
        alert("No composition is currently active.");
    }
}

// Execute the main function
main();
