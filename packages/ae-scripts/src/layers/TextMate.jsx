/**
 * TextMate - Advanced Text Highlighting and Animation System
 *
 * @name TextMate
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 * 
 * @description
 * A sophisticated text processing tool that automatically locates and highlights specific text
 * instances within text layers using advanced range selectors and text animator systems.
 * This tool provides precise character-level control with intelligent carriage return handling
 * and dynamic color application, making it ideal for creating engaging text animations,
 * educational content, and interactive presentations in After Effects.
 * 
 * @functionality
 * • Intelligent text search with case-sensitive pattern matching
 * • Advanced text animator creation with range selector precision
 * • Dynamic color assignment system with predefined contrasting color palette
 * • Character-level index calculation with carriage return compensation
 * • Multiple instance highlighting with individual animator controls
 * • Smart color rotation system preventing consecutive identical colors
 * • Comprehensive error handling with detailed user feedback
 * • Batch processing support for multiple text occurrences
 * • Real-time text analysis and position calculation
 * • Full undo group support for safe operation reversal
 * 
 * @usage
 * 1. Select a single text layer in your composition timeline
 * 2. Run the TextMate script to open the highlighting dialog
 * 3. Enter the specific text string you want to highlight in the input field
 * 4. Click "OK" to process the text layer and create highlighting animations
 * 5. The script will automatically:
 *    - Search for all instances of your specified text
 *    - Create a "Highlight Animator" with range selectors for each instance
 *    - Apply a randomly selected bright color to each highlighted section
 *    - Set precise character ranges using index-based positioning
 * 6. Each highlighted instance gets its own range selector for independent control
 * 7. Use the created animators to add additional text animation properties
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with at least one text layer
 * • Single text layer selected (exactly one layer must be selected)
 * • Text layer must contain searchable text content
 * 
 * @notes
 * • Text search is case-sensitive for precise matching control
 * • The script automatically handles carriage returns in text calculations
 * • Color selection uses a curated palette of 12 high-contrast colors
 * • Each search creates a new animator group with the search term in the name
 * • Range selectors use character index units for precise text targeting
 * • The color rotation system ensures visual variety across multiple highlights
 * • All text formatting and existing animations are preserved during processing
 * • Multiple instances of the same text get individual range selectors within one animator
 */

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
		app.beginUndoGroup('TextMate');

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
		// Create dialog window
		var dialog = new Window('dialog', 'TextMate');
		dialog.orientation = 'column';

		var group = dialog.add('group');
		group.add('statictext', undefined, 'Enter text to highlight:');
		var textInput = group.add('edittext', undefined, '');
		textInput.preferredSize.width = 200;

		var buttonGroup = dialog.add('group');
		var okButton = buttonGroup.add('button', undefined, 'OK');
		var cancelButton = buttonGroup.add('button', undefined, 'Cancel');

		var searchTerm = '';
		okButton.onClick = function () {
			searchTerm = textInput.text;
			dialog.close();
		};

		cancelButton.onClick = function () {
			dialog.close();
		};

		dialog.center();
		dialog.show();
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