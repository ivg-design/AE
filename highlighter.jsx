// Highlighter for Adobe After Effects
// This script allows you to highlight specific text instances in a text layer
// by creating text animators with range selectors.
//
// Usage:
// 1. Select a text layer
// 2. Run the script
// 3. Enter the text you want to highlight
// 4. The script will create a text animator that highlights all instances in a random color
//
// Note: The script handles multi-line text correctly by ignoring carriage returns
// in the position calculations.
//
// Author: IVG
// Version: 1.2.0
// License: MIT
//
// Changelog:
// 1.2.0 - Improved color randomization
//       - Added predefined set of bright, contrasting colors
//       - Prevents similar colors from appearing in consecutive runs
// 1.1.0 - Added random color generation for highlights
//       - Each run now uses a different color
//       - Colors are bright and saturated for better visibility
//       - Fixed newline character handling in position calculations
// 1.0.0 - Initial release
//       - Basic text highlighting functionality
//       - Support for multi-line text
//       - Character-accurate positioning

{
	// Store the last used color index between script runs
	var lastColorIndex = null;

	/**
	 * Predefined set of bright, contrasting colors
	 * Each color is an RGB array with values between 0 and 1
	 */
	var HIGHLIGHT_COLORS = [
		[1, 0, 0],       // Red
		[0, 0.8, 0],     // Green
		[0, 0, 1],       // Blue
		[1, 0.8, 0],     // Yellow
		[1, 0, 1],       // Magenta
		[0, 0.8, 0.8],   // Cyan
		[1, 0.5, 0],     // Orange
		[0.5, 0, 1],     // Purple
		[0, 1, 0.5],     // Spring Green
		[1, 0, 0.5],     // Rose
		[0.8, 0.8, 0],   // Chartreuse
		[0, 0.5, 1]      // Azure
	];

	/**
	 * Gets a random color that's different from the last used color
	 * @returns {Array} RGB color array with values between 0 and 1
	 */
	function getRandomColor() {
		var availableIndices = [];
		
		// Get all indices except the last used one
		for (var i = 0; i < HIGHLIGHT_COLORS.length; i++) {
			if (i !== lastColorIndex) {
				availableIndices.push(i);
			}
		}
		
		// Pick a random index from available ones
		var randomIndex = Math.floor(Math.random() * availableIndices.length);
		var selectedIndex = availableIndices[randomIndex];
		
		// Store this index for next time
		lastColorIndex = selectedIndex;
		
		return HIGHLIGHT_COLORS[selectedIndex];
	}

	/**
	 * Main function that handles the text highlighting process
	 * Creates text animators with range selectors to highlight specific text
	 */
	function main() {
		app.beginUndoGroup('Highlight Words');

		// Get active comp and ensure it's valid
		var comp = app.project.activeItem;
		if (!(comp && comp instanceof CompItem)) {
			alert('Please open and select a composition.');
			return;
		}

		// Check that exactly one layer is selected
		if (comp.selectedLayers.length !== 1) {
			alert('Please select exactly one text layer.');
			return;
		}

		var textLayer = comp.selectedLayers[0];
		if (!textLayer.property('Source Text')) {
			alert('The selected layer does not have a Source Text property.');
			return;
		}

		// Get the text layer's source text
		var textProp = textLayer.property('Source Text');
		var textDocument = textProp.value;
		var fullText = textDocument.text;

		// Ask the user for the search term
		var searchTerm = prompt('Enter the word/symbol/number to highlight:', '');
		if (!searchTerm) {
			alert('No search term entered. Exiting.');
			return;
		}

		// Find all occurrences of the search term (case-sensitive)
		var indices = [];
		var lastIndex = 0;
		var position = 0;

		while (true) {
			position = fullText.indexOf(searchTerm, lastIndex);
			if (position === -1) break;
			
			// Calculate adjusted position by counting carriage returns before this position
			var textBefore = fullText.substring(0, position);
			var crCount = 0;
			for (var i = 0; i < textBefore.length; i++) {
				if (textBefore.charCodeAt(i) === 13) {
					crCount++;
				}
			}
			
			var adjustedPosition = position - crCount;
			indices.push({
				start: adjustedPosition,
				end: adjustedPosition + searchTerm.length
			});
			
			lastIndex = position + searchTerm.length;
		}

		if (indices.length === 0) {
			alert("No instances of '" + searchTerm + "' were found.");
			return;
		}

		// Access the text property group and then the animators
		var textGroup = textLayer.property('ADBE Text Properties');
		var animators = textGroup.property('ADBE Text Animators');
		if (!animators) {
			alert('Unable to access text animators property.');
			return;
		}

		// Create a new text animator for highlighting
		var animator = animators.addProperty('ADBE Text Animator');
		animator.name = 'Highlight Animator (' + searchTerm + ')';

		// Add a Fill Color property to the animator and set it to a random color
		var animatorProps = animator.property('ADBE Text Animator Properties');
		var fillColorProp = animatorProps.addProperty('ADBE Text Fill Color');
		fillColorProp.setValue(getRandomColor());

		// For each found match, add a Range Selector and set its properties
		var selectors = animator.property('ADBE Text Selectors');
		
		for (var i = 0; i < indices.length; i++) {
			// Add the selector
			var sel = selectors.addProperty('ADBE Text Selector');
			
			// Set to use index units
			var advanced = sel.property('ADBE Text Range Advanced');
			advanced.property('ADBE Text Range Units').setValue(2);
			
			// Set the ranges using character indices
			var startProp = sel.property(4); // Start Offset
			var endProp = sel.property(5);   // End Offset
			startProp.setValue(indices[i].start);
			endProp.setValue(indices[i].end);
		}

		alert('Found ' + indices.length + " instance(s) of '" + searchTerm + "'.");
		app.endUndoGroup();
	}

	main();
} 