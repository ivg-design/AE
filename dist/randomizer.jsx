(function () {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition");
        return;
    }

    var selectedProperties = comp.selectedProperties;

    if (selectedProperties.length === 0) {
        alert("Please select some keyframes");
        return;
    }

    var win = new Window("dialog", "Randomize Keyframes");
    win.orientation = "column";
    win.alignChildren = ["left", "top"];

    var rangeGroup = win.add("group");
    rangeGroup.orientation = "row";
    rangeGroup.add("statictext", undefined, "Start Range:");
    var startRangeInput = rangeGroup.add("edittext", undefined, "0");
    startRangeInput.characters = 5;

    rangeGroup.add("statictext", undefined, "End Range:");
    var endRangeInput = rangeGroup.add("edittext", undefined, "100");
    endRangeInput.characters = 5;

    var buttonGroup = win.add("group");
    buttonGroup.orientation = "row";
    buttonGroup.add("button", undefined, "OK");
    buttonGroup.add("button", undefined, "Cancel");

    buttonGroup.children[0].onClick = function () {
        var startRange = parseFloat(startRangeInput.text);
        var endRange = parseFloat(endRangeInput.text);

        if (isNaN(startRange) || isNaN(endRange)) {
            alert("Please enter valid numbers for the range");
            return;
        }

        app.beginUndoGroup("Randomize Keyframes");

        for (var i = 0; i < selectedProperties.length; i++) {

            var property = selectedProperties[i];

            if (property.selectedKeys.length > 0) {

                for (var j = 1; j <= property.numKeys; j++) {

                    if (property.keySelected(j)) {
                        var randomValue;

                        randomValue = startRange + Math.random() * (endRange - startRange);

                        // Convert the random value from frames to seconds
                        randomValue = randomValue / comp.frameRate;

                        property.setValueAtKey(j, randomValue);
                    }
                }
            }
        }

        app.endUndoGroup();
        win.close();
    };

    buttonGroup.children[1].onClick = function () {
        win.close();
    };

    win.center();
    win.show();
})();