/**
 * KeyBot - Advanced Keyframe Value Manipulation Tool for Adobe After Effects
 *
 * @name KeyBot
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-08-13
 * @license MIT
 * @ui PANEL
 *
 * @changelog
 * • 2.0.1 (2026-07-04): Fixed a crash where OneD/Shape/Text properties aborted the whole
 *   operation. OneD scalar properties (Rotation, Opacity, Time Remap, slider/angle controls)
 *   returned a plain Number from keyValue(), so currentValue.slice() threw a TypeError. The
 *   keyframe loop now branches on value shape: array-valued properties (TwoD/ThreeD, spatial
 *   or not) are cloned and edited per X/Y/Z as before, while scalar OneD values are driven by
 *   the X input directly. Non-numeric SHAPE (Mask/vector Path) and TEXT_DOCUMENT (Source Text)
 *   types are no longer accepted by the property-type filter, since the X/Y/Z arithmetic model
 *   cannot apply to them; such properties are now skipped silently instead of crashing.
 *
 * @description
 * A sophisticated dockable panel that enables precise mathematical operations on keyframe values
 * across multiple dimensions (X, Y, Z). The script provides a comprehensive interface for modifying
 * selected keyframes using common mathematical operations while maintaining animation timing and
 * interpolation properties.
 *
 * @functionality
 * • Interactive dockable panel with real-time input validation
 * • Per-dimension control with individual X, Y, Z input fields and toggles
 * • Five mathematical operations: Set (=), Add (+), Subtract (-), Multiply (×), Divide (÷)
 * • Multi-layer and multi-property support for batch operations
 * • Automatic property type detection and validation
 * • Safe division with zero-division protection
 * • Preserves keyframe timing, interpolation, and ease settings
 * • Comprehensive undo group support for all operations
 * • Real-time UI feedback and input enabling/disabling
 *
 * @usage
 * 1. Open the script to dock the KeyBot panel in your workspace
 * 2. Select one or more layers in your composition
 * 3. Select specific properties with keyframes (Position, Scale, Rotation, etc.)
 * 4. Select the keyframes you want to modify in the timeline
 * 5. Check the dimension checkboxes (X, Y, Z) for the axes you want to modify
 * 6. Enter the desired values in the corresponding input fields
 * 7. Click the appropriate mathematical operation button (=, +, -, ×, ÷)
 * 8. The selected keyframes will be updated with the calculated values
 *
 * @requirements
 * • Adobe After Effects CS6 or later
 * • At least one composition with layers containing animatable properties
 * • Selected layers with keyframed properties
 * • Selected keyframes in the timeline for the target properties
 *
 * @notes
 * • Only works with numerical properties (Position, Scale, Rotation, etc.)
 * • Supports 2D and 3D spatial properties as well as single-value properties
 * • Input fields are automatically enabled/disabled based on checkbox selection
 * • Division by zero returns the original value to prevent errors
 * • Works with multiple selected keyframes across multiple layers simultaneously
 * • All operations are wrapped in undo groups for easy reversal
 * • The panel remains docked and available for repeated use across compositions
 */
{
	function addKeyBotScript(thisObj) {
		function buildUI(thisObj) {
			var panel =
				thisObj instanceof Panel
					? thisObj
					: new Window('palette', '🤖 KeyBot 🤖', undefined, { resizeable: true });

			if (panel !== null) {
				panel.orientation = 'column';
				panel.alignChildren = ['center', 'center'];
				panel.spacing = 2;
				panel.margins = 5;

				// INPUT GROUP
				var input_group = panel.add('group', undefined, { name: 'input_group' });
				input_group.preferredSize.width = 190;
				input_group.orientation = 'row';
				input_group.alignChildren = ['center', 'center'];
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
				var operation_group = panel.add('group', undefined, { name: 'operation_group' });
				operation_group.preferredSize.width = 190;
				operation_group.orientation = 'row';
				operation_group.alignChildren = ['fill', 'center'];

				// Checkboxes GROUP
				var checkboxes_group = operation_group.add('group', undefined, { name: 'x_group' });
				checkboxes_group.orientation = 'row';
				checkboxes_group.spacing = 0;
				checkboxes_group.margins = 0;

				var checkboxX = checkboxes_group.add('checkbox', undefined, undefined, {
					name: 'checkbox_x'
				});
				checkboxX.preferredSize.width = 30;
				checkboxX.text = 'X';
				var checkboxY = checkboxes_group.add('checkbox', undefined, undefined, {
					name: 'checkbox_y'
				});
				checkboxY.preferredSize.width = 30;
				checkboxY.text = 'Y';
				var checkboxZ = checkboxes_group.add('checkbox', undefined, undefined, {
					name: 'checkbox_z'
				});
				checkboxZ.preferredSize.width = 30;
				checkboxZ.text = 'Z';

				// ACTIONS GROUP
				var actions_group = operation_group.add('group', undefined, { name: 'actions_group' });
				actions_group.preferredSize.width = 17;
				actions_group.preferredSize.height = 17;
				actions_group.orientation = 'row';
				actions_group.alignChildren = ['right', 'center'];
				actions_group.spacing = 0;
				actions_group.margins = 0;

				var equalsButton = actions_group.add('button', undefined, undefined, {
					name: 'equals_button'
				});
				equalsButton.text = '=';
				equalsButton.preferredSize.width = 17;
				equalsButton.preferredSize.height = 17;

				var plusButton = actions_group.add('button', undefined, undefined, { name: 'plus_button' });
				plusButton.text = '+';
				plusButton.preferredSize.width = 17;
				plusButton.preferredSize.height = 17;

				var minusButton = actions_group.add('button', undefined, undefined, {
					name: 'minus_button'
				});
				minusButton.text = '-';
				minusButton.preferredSize.width = 17;
				minusButton.preferredSize.height = 17;

				var multiplyButton = actions_group.add('button', undefined, undefined, {
					name: 'multiply_button'
				});
				multiplyButton.text = '×';
				multiplyButton.preferredSize.width = 17;
				multiplyButton.preferredSize.height = 17;

				var divideButton = actions_group.add('button', undefined, undefined, {
					name: 'divide_button'
				});
				divideButton.text = '÷';
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
				equalsButton.onClick = function () {
					processKeyframes('=');
				};
				plusButton.onClick = function () {
					processKeyframes('+');
				};
				minusButton.onClick = function () {
					processKeyframes('-');
				};
				multiplyButton.onClick = function () {
					processKeyframes('×');
				};
				divideButton.onClick = function () {
					processKeyframes('÷');
				};

				function processKeyframes(operation) {
					var comp = app.project.activeItem;
					if (!(comp instanceof CompItem)) {
						alert('Please select a composition.');
						return;
					}

					var selectedLayers = comp.selectedLayers;
					if (selectedLayers.length === 0) {
						alert('Please select a layer with keyframes.');
						return;
					}

					app.beginUndoGroup('KeyBot');

					for (var i = 0; i < selectedLayers.length; i++) {
						var layer = selectedLayers[i];
						var properties = layer.selectedProperties;

						for (var j = 0; j < properties.length; j++) {
							var property = properties[j];

							if (
								property.propertyValueType === 6417 || // OneD (scalar: Rotation, Opacity, sliders, ...)
								property.propertyValueType === 6414 || // ThreeD
								property.propertyValueType === 6413 || // ThreeD_SPATIAL
								property.propertyValueType === 6416 || // TwoD
								property.propertyValueType === 6415 // TwoD_SPATIAL
							) {
								var keyCount = property.numKeys;
								if (keyCount === 0) {
									alert('No keyframes selected.');
									continue;
								}

								for (var k = 1; k <= keyCount; k++) {
									if (property.keySelected(k)) {
										var currentValue = property.keyValue(k);

										if (currentValue instanceof Array) {
											// Multi-dimensional value (TwoD/ThreeD, spatial or not).
											var newValue = currentValue.slice();

											if (checkboxX.value) {
												newValue[0] = calculateNewValue(
													currentValue[0],
													parseFloat(inputX.text) || 0,
													operation
												);
											}

											if (checkboxY.value && currentValue.length > 1) {
												newValue[1] = calculateNewValue(
													currentValue[1],
													parseFloat(inputY.text) || 0,
													operation
												);
											}

											if (checkboxZ.value && currentValue.length > 2) {
												newValue[2] = calculateNewValue(
													currentValue[2],
													parseFloat(inputZ.text) || 0,
													operation
												);
											}

											property.setValueAtKey(k, newValue);
										} else {
											// OneD scalar value (Rotation, Opacity, Time Remap, sliders, ...).
											// keyValue() returns a plain Number here, which has no .slice();
											// the single scalar is driven by the X axis input.
											var newScalar = currentValue;

											if (checkboxX.value) {
												newScalar = calculateNewValue(
													currentValue,
													parseFloat(inputX.text) || 0,
													operation
												);
											}

											property.setValueAtKey(k, newScalar);
										}
									}
								}
							}
						}
					}

					app.endUndoGroup();
				}

				function calculateNewValue(current, input, operation) {
					switch (operation) {
						case '=':
							return input;
						case '+':
							return current + input;
						case '-':
							return current - input;
						case '×':
							return current * input;
						case '÷':
							return input !== 0 ? current / input : current;
						default:
							return current;
					}
				}
				panel.layout.layout(true);
			}
			return panel;
		}

		var KeyBot = buildUI(thisObj);

		if (KeyBot !== null && KeyBot instanceof Window) {
			KeyBot.center();
			KeyBot.show();
		}
	}
	addKeyBotScript(this);
}
