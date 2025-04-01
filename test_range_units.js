{
	function main() {
		app.beginUndoGroup('Test Range Units');

		// Get active comp and ensure it's valid.
		var comp = app.project.activeItem;
		if (!(comp && comp instanceof CompItem)) {
			alert('Please open and select a composition.');
			return;
		}

		// Check that exactly one layer is selected.
		if (comp.selectedLayers.length !== 1) {
			alert('Please select exactly one text layer.');
			return;
		}

		var textLayer = comp.selectedLayers[0];
		if (!textLayer.property('Source Text')) {
			alert('The selected layer does not have a Source Text property.');
			return;
		}

		// Access the text property group and then the animators
		var textGroup = textLayer.property('ADBE Text Properties');
		var animators = textGroup.property('ADBE Text Animators');
		if (!animators || animators.numProperties === 0) {
			alert('No text animators found on the selected layer.');
			return;
		}

		// Get the first text animator
		var animator = animators.property(1);
		alert('Found animator: ' + animator.name);

		// Get the first selector
		var selectors = animator.property('ADBE Text Selectors');
		if (!selectors || selectors.numProperties === 0) {
			alert('No selectors found in the animator.');
			return;
		}

		var selector = selectors.property(1);
		alert('Found selector');

		// Try to access and modify the Advanced property
		var advanced = selector.property('ADBE Text Range Advanced');
		alert('Found Advanced property');

		try {
			advanced.property('ADBE Text Range Units').setValue(2);
			alert('Successfully set range units to index (2)');
		} catch (e) {
			alert('Error setting range units: ' + e.toString());
		}

		app.endUndoGroup();
	}

	main();
} 