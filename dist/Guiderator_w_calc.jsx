{
	function addGuideScript(thisObj) {
		function buildUI(thisObj) {
			var myPanel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Add Guide", undefined, { resizeable: true });

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

				// Add event listener for the "change" event on the input field
				inputField.addEventListener("change", function () {
					var input = inputField.text;
					var calculationResult = evaluateCalculation(input);
					inputField.text = calculationResult.toString();
				});

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
					if (!isNaN(inputValue) && inputValue.trim() !== "") {
						var value = parseFloat(inputValue);
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
					} else {
						alert("Please enter a valid number.");
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