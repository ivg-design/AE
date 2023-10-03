{
	/**
	 * This function creates the necessary controllers for the layer: "Parent 1", "Parent 2", and "Influence".
	 *
	 * @param {Layer} layer - The layer where the controllers will be added.
	 */
	function createControllers(layer) {
		var parent1 = layer("Effects").addProperty("Layer Control");
		parent1.name = "Parent 1";

		var parent2 = layer("Effects").addProperty("Layer Control");
		parent2.name = "Parent 2";

		var influence = layer("Effects").addProperty("Slider Control");
		influence.name = "Influence";
	}

	/**
	 * This function creates and sets an expression on the position property of the given layer.
	 * The expression calculates the position of the layer based on the values of the "Parent 1", "Parent 2", and "Influence" controllers.
	 *
	 * @param {Layer} layer - The layer where the expression will be set.
	 */
    function createExpression(layer) {
        var expression =
            "var influence = effect(\"Influence\")(\"Slider\") / 100;\n" +
            "var parent1 = effect(\"Parent 1\")(\"Layer\");\n" +
            "var parent2 = effect(\"Parent 2\")(\"Layer\");\n" +
            "\n" +
            "if ((!parent1 || parent1.index == thisLayer.index) && (!parent2 || parent2.index == thisLayer.index)) {\n" +
            "    position;\n" +
            "} else if (parent1 && parent1.index != thisLayer.index && parent2 && parent2.index != thisLayer.index) {\n" +
            "    linear(influence, 0, 1, parent1.transform.position, parent2.transform.position);\n" +
            "} else {\n" +
            "    var parentLayer = (parent1 && parent1.index != thisLayer.index) ? parent1 : parent2;\n" +
            "    if (parentLayer) {\n" +
            "        linear(influence, 0, 1, position, parentLayer.transform.position);\n" +
            "    } else {\n" +
            "        position;\n" +
            "    }\n" +
            "}";

        layer.property("Position").expression = expression;
    }

	/**
	 * The main part of the script:
	 * - Grabs the active composition and selected layer.
	 * - If a layer is selected, it calls the `createControllers` and `createExpression` functions on the selected layer.
	 * - If no layer is selected, an alert prompts the user to select a layer.
	 */
	var comp = app.project.activeItem;
	if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
		var selectedLayer = comp.selectedLayers[0];

		app.beginUndoGroup("Add Controllers and Expression");
		createControllers(selectedLayer);
		createExpression(selectedLayer);
		app.endUndoGroup();
	} else {
		alert("Please select a layer in the active composition.");
	}
}
