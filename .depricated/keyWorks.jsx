(function keyframeProcessorUI(thisObj) {
	function buildUI(parent) {
		var win = parent instanceof Panel ? parent : new Window("palette", "🔸 KeyMate 🔸", undefined, { resizeable: true });
		win.orientation = "column";
		win.alignChildren = ["center", "center"];
		win.spacing = 2;
		win.margins = 5;

		// INPUT GROUP
		var input_group = win.add("group", undefined, { name: "input_group" });
		input_group.preferredSize.width = 190;
		input_group.orientation = "row";
		input_group.alignChildren = ["center", "center"];
		input_group.spacing = 5;
		input_group.margins = 0;

		var inputX = input_group.add('edittext {properties: {name: "edittext1"}}');
		inputX.preferredSize.width = 60;
		inputX.enabled = false;

		var inputY = input_group.add('edittext {properties: {name: "edittext2"}}');
		inputY.preferredSize.width = 60;
		inputY.enabled = false;

		var inputZ = input_group.add('edittext {properties: {name: "edittext3"}}');
		inputZ.preferredSize.width = 60;
		inputZ.enabled = false;

		// OPERATION GROUP
		var operation_group = win.add("group", undefined, { name: "operation_group" });
		operation_group.preferredSize.width = 190;
		operation_group.orientation = "row";
		operation_group.alignChildren = ["fill", "center"];

		// Checkboxes GROUP
		var checkboxes_group = operation_group.add("group", undefined, { name: "x_group" });
		checkboxes_group.orientation = "row";
		checkboxes_group.spacing = 0;
		checkboxes_group.margins = 0;

		var checkboxX = checkboxes_group.add("checkbox", undefined, undefined, { name: "checkbox_x" });
		checkboxX.preferredSize.width = 30;
		checkboxX.text = "X";
		var checkboxY = checkboxes_group.add("checkbox", undefined, undefined, { name: "checkbox_y" });
		checkboxY.preferredSize.width = 30;
		checkboxY.text = "Y";
		var checkboxZ = checkboxes_group.add("checkbox", undefined, undefined, { name: "checkbox_z" });
		checkboxZ.preferredSize.width = 30;
		checkboxZ.text = "Z";

		// ACTIONS GROUP
		var actions_group = operation_group.add("group", undefined, { name: "actions_group" });
		actions_group.preferredSize.width = 17;
		actions_group.preferredSize.height = 17;
		actions_group.orientation = "row";
		actions_group.alignChildren = ["right", "center"];
		actions_group.spacing = 0;
		actions_group.margins = 0;

		var equalsButton = actions_group.add("button", undefined, undefined, { name: "equals_button" });
		equalsButton.text = "=";
		equalsButton.preferredSize.width = 17;
		equalsButton.preferredSize.height = 17;

		var plusButton = actions_group.add("button", undefined, undefined, { name: "plus_button" });
		plusButton.text = "+";
		plusButton.preferredSize.width = 17;
		plusButton.preferredSize.height = 17;

		var minusButton = actions_group.add("button", undefined, undefined, { name: "minus_button" });
		minusButton.text = "-";
		minusButton.preferredSize.width = 17;
		minusButton.preferredSize.height = 17;

		var multiplyButton = actions_group.add("button", undefined, undefined, { name: "multiply_button" });
		multiplyButton.text = "×";
		multiplyButton.preferredSize.width = 17;
		multiplyButton.preferredSize.height = 17;

		var divideButton = actions_group.add("button", undefined, undefined, { name: "divide_button" });
		divideButton.text = "÷";
		divideButton.preferredSize.width = 17;
		divideButton.preferredSize.height = 17;

		// Enable/Disable Inputs Based on Checkboxes
		checkboxX.onClick = function () {
			inputX.enabled = checkboxX.value;
		};

		checkboxY.onClick = function () {
			inputY.enabled = checkboxY.value;
		};

		checkboxZ.onClick = function () {
			inputZ.enabled = checkboxZ.value;
		};

		// Button Actions
		equalsButton.onClick = function () { processKeyframes("="); };
		plusButton.onClick = function () { processKeyframes("+"); };
		minusButton.onClick = function () { processKeyframes("-"); };
		multiplyButton.onClick = function () { processKeyframes("×"); };
		divideButton.onClick = function () { processKeyframes("÷"); };

		return win;
	}

	function processKeyframes(operation) {
		var comp = app.project.activeItem;
		if (!(comp instanceof CompItem)) {
			alert("Please select a composition.");
			return;
		}

		var selectedLayers = comp.selectedLayers;
		if (selectedLayers.length === 0) {
			alert("Please select a layer with keyframes.");
			return;
		}

		app.beginUndoGroup("Keyframe Processing");

		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var properties = layer.selectedProperties;

			for (var j = 0; j < properties.length; j++) {
				var property = properties[j];

				if (property.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||
					property.propertyValueType === PropertyValueType.ThreeD ||
					property.propertyValueType === PropertyValueType.TwoD) {

					var keyCount = property.numKeys;
					if (keyCount === 0) {
						alert("No keyframes selected.");
						continue;
					}

					for (var k = 1; k <= keyCount; k++) {
						if (property.keySelected(k)) {
							var currentValue = property.keyValue(k);
							var newValue = currentValue.slice();

							if (checkboxX.value) {
								newValue[0] = calculateNewValue(currentValue[0], parseFloat(inputX.text) || 0, operation);
							}

							if (checkboxY.value) {
								newValue[1] = calculateNewValue(currentValue[1], parseFloat(inputY.text) || 0, operation);
							}

							if (checkboxZ.value && currentValue.length > 2) {
								newValue[2] = calculateNewValue(currentValue[2], parseFloat(inputZ.text) || 0, operation);
							}

							property.setValueAtKey(k, newValue);
						}
					}
				}
			}
		}

		app.endUndoGroup();
	}

	function calculateNewValue(current, input, operation) {
		switch (operation) {
			case "=":
				return input;
			case "+":
				return current + input;
			case "-":
				return current - input;
			case "×":
				return current * input;
			case "÷":
				return input !== 0 ? current / input : current;
			default:
				return current;
		}
	}

	var win = buildUI(thisObj);

	if (win instanceof Window) {
		win.center();
		win.show();
	}
})(this);
