function main() {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("No composition is active.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("No layer selected.");
        return;
    }

    var layer = selectedLayers[0];

    var win1 = new Window("dialog", "Select a Property for Expression");
    var treeView = win1.add("treeview", [0, 0, 300, 400], "Properties");

    var properties = extractProperties(layer);
    createTreeView(properties, treeView);

    var btnSelect = win1.add("button", undefined, "Select");
    var btnCancel = win1.add("button", undefined, "Cancel");

    btnSelect.onClick = function () {
        // Your code to handle the selection
        win1.close();
    };

    btnCancel.onClick = function () {
        win1.close();
    };

    win1.show();
}

function extractProperties(group) {
    var properties = [];
    for (var i = 1; i <= group.numProperties; i++) {
        var property = group.property(i);
        if (property.isPropertyGroup) {
            properties.push({
                name: property.name,
                type: 'group',
                properties: extractProperties(property)
            });
        } else if (property.canSetExpression) {
            properties.push({
                name: property.name,
                type: 'property'
            });
        }
    }
    return properties;
}

function createTreeView(properties, parentNode) {
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (property.type === 'group') {
            var node = parentNode.add('node', property.name);
            createTreeView(property.properties, node);
            node.expanded = true;
        } else if (property.type === 'property') {
            parentNode.add('item', property.name);
        }
    }
}

main();
