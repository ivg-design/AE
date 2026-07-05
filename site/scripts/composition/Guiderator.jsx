/**
 * Guiderator - Advanced Guide Creation Tool with Calculator for Adobe After Effects
 *
 * This script provides a dockable panel that allows users to easily add guides to compositions
 * with the added functionality of performing calculations directly in the input field.
 *
 * FUNCTIONALITY:
 * - Displays a compact, dockable panel with an input field and buttons
 * - Supports basic mathematical calculations in the input field (e.g., "540/2", "1920*0.25")
 * - Adds horizontal or vertical guides at specified positions
 * - Includes a lock/unlock toggle for guides
 * - Automatically evaluates calculations when input changes
 *
 * USAGE:
 * 1. Open a composition in After Effects
 * 2. Run the script to display the panel
 * 3. Enter a value or calculation in the input field
 * 4. Click "H" to add a horizontal guide or "V" to add a vertical guide
 * 5. Use the lock button (🔐/🔓) to toggle guide locking
 *
 * CALCULATION EXAMPLES:
 * - "540" - Adds a guide at position 540
 * - "1920/2" - Adds a guide at the center (960)
 * - "1080*0.33" - Adds a guide at approximately 356.4
 *
 * @name Guiderator
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-01-13
 * @license MIT
 * @ui PANEL
 * @changelog
 * - 2.0.0: Renamed from Guiderator_w_calc, enhanced documentation
 * - 1.0.3: Improved ECMA3 compatibility
 * - 1.0.2: Fixed string handling for input values
 * - 1.0.1: Added calculation functionality
 * - 1.0.0: Initial release
 */

{
	function addGuideScript(thisObj) {
		function buildUI(thisObj) {
			var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Guiderator", undefined, { resizeable: true });

			if (myPanel !== null) {
				myPanel.orientation = "row";
				myPanel.alignChildren = ["left", "center"];

				// Input field
				var inputField = myPanel.add("edittext", undefined, "");
				inputField.characters = 5;

				// Function to evaluate simple calculations
				function evaluateCalculation(input) {
					try {
						// Use eval() to evaluate the input as a mathematical expression
						var result = eval(input);
						var roundedResult = Number(result.toFixed(2));
						return roundedResult;
					} catch (error) {
						// If an error occurs during evaluation, return the original input
						return input;
					}
				}

				// Add change handler for the input field (ECMA3 compatible)
				inputField.onChange = function () {
					var input = inputField.text;
					var calculationResult = evaluateCalculation(input);
					inputField.text = calculationResult.toString();
				};

				// Define a fixed size for the buttons
				var buttonSize = 20; // Adjust this value as needed

				// Horizontal button (now for horizontal guides)
				var hButton = myPanel.add("button", undefined, "H");
				hButton.size = [buttonSize, buttonSize]; // Make button square

				// Vertical button (now for vertical guides)
				var vButton = myPanel.add("button", undefined, "V");
				vButton.size = [buttonSize, buttonSize]; // Make button square

				// Lock/Unlock button
				var lockButton = myPanel.add("button", undefined, "🔐");
				lockButton.size = [buttonSize, buttonSize]; // Make button square

				// Function to update the lock button's label based on the current state
				function updateLockButtonLabel() {
					var view = app.activeViewer ? app.activeViewer.views[0] : null;
					if (view) {
						lockButton.text = view.options.guidesLocked ? "🔐" : "🔓";
					} else {
						lockButton.text = "🔐";
					}
				}

				// Function to lock/unlock guides
				function toggleGuidesLock() {
					var view = app.activeViewer ? app.activeViewer.views[0] : null;
					if (view) {
						view.options.guidesLocked = !view.options.guidesLocked;
						updateLockButtonLabel();
					}
				}

				// Initial update of the lock button's label
				updateLockButtonLabel();

				// Function to add guide
				function addGuide(isHorizontal) {
					var inputValue = inputField.text;
					// Convert to string and trim in ECMA3 compatible way
					var inputValueStr = String(inputValue);
					// ECMA3 compatible trim (removing whitespace from both ends)
					inputValueStr = inputValueStr.replace(/^\s+|\s+$/g, "");

					// First check if the input is empty
					if (inputValueStr === "") {
						alert("Please enter a value.");
						return;
					}

					// Try to parse the value as a number
					var value = parseFloat(inputValueStr);

					// Check if the parsed value is a valid number
					if (isNaN(value)) {
						alert("Please enter a valid number.");
						return;
					}

					var comp = app.project.activeItem;
					if (comp instanceof CompItem) {
						app.beginUndoGroup("Add Guide");
						if (isHorizontal) {
							comp.addGuide(0, value); // 0 for vertical
						} else {
							comp.addGuide(1, value); // 1 for horizontal
						}
						app.endUndoGroup();
					} else {
						alert("Please select a composition.");
					}
				}

				// Button click events
				hButton.onClick = function () {
					addGuide(true); // Now adds horizontal guide
				};

				vButton.onClick = function () {
					addGuide(false); // Now adds vertical guide
				};

				lockButton.onClick = function () {
					toggleGuidesLock();
				};

				myPanel.layout.layout(true);
			}

			return myPanel;
		}

		var myScriptPal = buildUI(thisObj);

		if (myScriptPal !== null && myScriptPal instanceof Window) {
			myScriptPal.center();
			myScriptPal.show();
		}

	}

	addGuideScript(this);
}
