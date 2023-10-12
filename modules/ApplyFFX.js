/**
 * @fileoverview
 * The applyFFX module provides methods to apply pseudo effects to layers in After Effects.
 * 
 * @module applyFFX
 * 
 * @example
 * // Import the applyFFX module
 * //@include "path/to/applyFFX.js"
 * 
 * // Get the active layer in the active composition
 * var layer = app.project.activeItem.layer(1);
 * 
 * // Configuration data
 * var binaryData = "...";
 * var matchName = "Multiparent";
 * var version = "1.0.0";
 * var name = "MultiParent";
 * 
 * // Apply the pseudo effect to the layer
 * applyFFX.config(layer, binaryData, matchName, version, name);
 * 
 * @usageNotes
 * 1. Place the applyFFX.js file in a location accessible to your After Effects scripts.
 * 2. Use the @include directive to include applyFFX.js in your script.
 * 3. Use applyFFX.config() to apply a pseudo effect to a layer based on your configuration.
 */

var ApplyFFX = (function () {
	var module = {};

	/**
 * Deselects all layers in a given composition.
 * 
 * @function deselectAll
 * @memberof applyFFX
 * 
 * @param {object} theComp - The composition whose layers should be deselected.
 * 
 * @example 
 * var comp = app.project.activeItem;
 * applyFFX.deselectAll(comp);
 */
	module.deselectAll = function (theComp) {
		for (var i = 1, il = theComp.numLayers; i <= il; i++) {
			theComp.layer(i).selected = false;
		}
	};

	/**
	 * Applies a pseudo effect to a given layer based on the configuration provided.
	 * 
	 * @function config
	 * @memberof applyFFX
	 * 
	 * @param {object} layer - The layer to which the pseudo effect should be applied.
	 * @param {string} binaryData - The binary data for the effect.
	 * @param {string} matchName - The match name for the pseudo effect.
	 * @param {string} version - The version of the pseudo effect.
	 * @param {string} name - The name of the pseudo effect.
	 * 
	 * @example 
	 * var layer = someLayerObject;
	 * var binaryData = "...";
	 * var matchName = "Multiparent";
	 * var version = "1.0.0";
	 * var name = "MultiParent";
	 * applyFFX.config(layer, binaryData, matchName, version, name);
	 */
	module.config = function (layer, binaryData, matchName, version, name) {
		var config = {
			binary: binaryData,
			matchName: 'Pseudo/' + matchName,
			name: name,
			version: version,
		};

		var tempFolder = Folder.temp;
		var ffxFile = File(tempFolder.fsName + '/' + config.name + '_v' + config.version + '.ffx');
		ffxFile.encoding = 'BINARY';
		ffxFile.open('w');
		ffxFile.write(config.binary);
		ffxFile.close();

		var myComp = app.project.activeItem;
		module.deselectAll(myComp);
		layer.selected = true;
		layer.applyPreset(ffxFile);
	};
	return module;
})();

