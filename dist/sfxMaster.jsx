/**
 * @file SFXMaster.js
 * @description This script automates the process of managing audio layers within selected compositions in Adobe After Effects. It creates a centralized control layer with sliders for 'Voice Over', 'Sound Effects', and 'Music'. The script identifies pure audio layers based on their source and marker comments, linking them to the appropriate slider control. Audio layers without specific markers or with unrecognized markers default to the 'Sound Effects' slider. This improves efficiency in handling audio mixing across complex projects.
 * 
 * @usage Select the compositions you want to process and run the script. It will create a 'SFX CTRL' null layer with three sliders ('Voice Over', 'Sound Effects', 'Music'). The script will then analyze the audio layers, apply the 'Stereo Mixer' effect, and link the levels to the appropriate slider based on the first marker's comment.
 * 
 * @disclaimer This script is provided "as is", without warranty of any kind, express or implied. In no event shall the creators be liable for any claim, damages, or other liability arising from, out of, or in connection with the software.
 * 
 * @license MIT License
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 * @creator IVG Design
 */


(function () {
    /**
     * Creates a "SFX CTRL" null layer with three slider controls: Voice Over, Sound Effects, and Music.
     * @param {CompItem} comp - The composition in which to create the SFX CTRL layer.
     * @returns {AVLayer} The created SFX CTRL null layer.
     */
    function createSFXCTRL(comp) {
        var sfxCtrl = comp.layers.addNull();
        sfxCtrl.name = "SFX CTRL";
        sfxCtrl.property("ADBE Transform Group").property("ADBE Position").setValue([100, 100]); // Position it appropriately

        var voiceOverSlider = sfxCtrl.Effects.addProperty("ADBE Slider Control");
        voiceOverSlider.name = "Voice Over";

        var soundEffectsSlider = sfxCtrl.Effects.addProperty("ADBE Slider Control");
        soundEffectsSlider.name = "Sound Effects";

        var musicSlider = sfxCtrl.Effects.addProperty("ADBE Slider Control");
        musicSlider.name = "Music";

        return sfxCtrl;
    }

    /**
     * Determines the appropriate slider control (Voice Over, Music, or Sound Effects) based on the layer's marker comment.
     * @param {AVLayer} layer - The layer from which to determine the slider.
     * @returns {string} The name of the appropriate slider control.
     */
    function determineSlider(layer) {
        if (layer.property("Marker").numKeys > 0) {
            var firstMarker = layer.property("Marker").keyValue(1).comment.toLowerCase();
            if (firstMarker.indexOf("voice over") !== -1) {
                return "Voice Over";
            } else if (firstMarker.indexOf("music") !== -1) {
                return "Music";
            }
        }
        // Default to Sound Effects if no valid marker or no marker at all
        return "Sound Effects";
    }

    /**
     * Checks if the given layer already has a Stereo Mixer effect with expressions applied.
     * @param {AVLayer} layer - The layer to check for an existing Stereo Mixer effect.
     * @returns {boolean} True if the layer has a Stereo Mixer effect with expressions applied, false otherwise.
     */
    function checkForExistingStereoMixer(layer) {
        var stereoMixer = layer.property("Effects").property("Stereo Mixer");
        if (stereoMixer) {
            var leftExpr = stereoMixer.property("Left Level").expression;
            var rightExpr = stereoMixer.property("Right Level").expression;
            return (leftExpr || rightExpr); // Returns true if there is an existing expression
        }
        return false;
    }

    /**
     * Applies or overwrites the Stereo Mixer effect with expressions linked to the specified slider.
     * @param {AVLayer} layer - The layer on which to apply the Stereo Mixer effect.
     * @param {string} mainCompName - The name of the main composition.
     * @param {string} sliderName - The name of the slider control to link the Stereo Mixer effect to.
     * @param {boolean} overwrite - Whether to overwrite an existing Stereo Mixer effect or add a new one.
     */
    function applyStereoMixer(layer, mainCompName, sliderName, overwrite) {
        var stereoMixer = layer.property("Effects").property("Stereo Mixer");

        if (stereoMixer && !overwrite) {
            stereoMixer = layer.Effects.addProperty("Stereo Mixer");
        }

        // Apply or overwrite the expressions
        stereoMixer.property("Left Level").expression = "comp('" + mainCompName + "').layer('SFX CTRL').effect('" + sliderName + "')('Slider')";
        stereoMixer.property("Right Level").expression = "comp('" + mainCompName + "').layer('SFX CTRL').effect('" + sliderName + "')('Slider')";
    }

    /**
     * Processes a composition and its layers to check for or apply Stereo Mixer effects.
     * @param {CompItem} comp - The composition to process.
     * @param {string} mainCompName - The name of the main composition.
     * @param {boolean} checkOnly - If true, only checks for existing Stereo Mixer effects; if false, applies the effects.
     * @param {boolean} overwrite - Whether to overwrite existing Stereo Mixer effects if found.
     * @returns {boolean} True if any layer in the composition has an existing Stereo Mixer effect with expressions.
     */
    function processComp(comp, mainCompName, checkOnly, overwrite) {
        var foundExisting = false;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (layer.source instanceof FootageItem && !layer.source.hasVideo) {
                if (checkOnly) {
                    foundExisting = foundExisting || checkForExistingStereoMixer(layer);
                } else {
                    var sliderName = determineSlider(layer);
                    applyStereoMixer(layer, mainCompName, sliderName, overwrite);
                }
            } else if (layer.source instanceof CompItem) {
                foundExisting = foundExisting || processComp(layer.source, mainCompName, checkOnly, overwrite);
            }
        }

        return foundExisting;
    }

    /**
     * The main function that initiates the processing of selected compositions to apply or overwrite Stereo Mixer effects.
     */
    function main() {
        var selectedComps = app.project.selection;
        app.beginUndoGroup("Apply Stereo Mixer");

        if (selectedComps.length === 0) {
            alert("Please select at least one composition.");
            return;
        }

        var foundExisting = false;

        for (var i = 0; i < selectedComps.length; i++) {
            if (selectedComps[i] instanceof CompItem) {
                var comp = selectedComps[i];
                var mainCompName = comp.name;

                // Create SFX CTRL null with sliders if not already present
                var sfxCtrlLayer = comp.layer("SFX CTRL");
                if (!sfxCtrlLayer) {
                    sfxCtrlLayer = createSFXCTRL(comp);
                }

                // Check for existing Stereo Mixer effects with expressions
                foundExisting = processComp(comp, mainCompName, true, false);
            } else {
                alert("Please select only compositions.");
                return;
            }
        }

        var overwrite = true;
        if (foundExisting) {
            overwrite = confirm("One or more layers already have a Stereo Mixer effect with expressions applied. Would you like to overwrite them?");
        }

        for (var i = 0; i < selectedComps.length; i++) {
            if (selectedComps[i] instanceof CompItem) {
                var comp = selectedComps[i];
                var mainCompName = comp.name;

                // Apply the Stereo Mixer effects based on user's decision
                processComp(comp, mainCompName, false, overwrite);
            }
        }

        app.endUndoGroup();
    }

    main();
})();

