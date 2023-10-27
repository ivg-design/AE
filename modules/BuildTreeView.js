

var BuildTreeView = (function (shapeGroups) {
    var module = {};

    module.createTreeView = function (shapeGroups, parentNode, treeView){
        if (shapeGroups && typeof shapeGroups == "object") {
            for (var i = 0; i < shapeGroups.length; i++) {
                var group = shapeGroups[i];
                if (group.type === "group") {
                    var node = parentNode.add("node", group.name);
                    module.createTreeView(group.groups, node, treeView);
                    node.expanded = true;
                } else if (group.type === "shape") {
                    parentNode.add("item", group.name);
                }
            }
        }
    }
    return module;
})();