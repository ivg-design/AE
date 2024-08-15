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

/**
 * Creates a 'SFX CTRL' Null layer and adds three sliders: 'Voice Over', 'Sound Effects', and 'Music'.
 * @param {CompItem} comp - The composition where the 'SFX CTRL' layer will be created.
 * @returns {AVLayer} The created 'SFX CTRL' null layer.
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
 * Determines which slider ('Voice Over', 'Music', or 'Sound Effects') to connect based on the first marker's comment.
 * Defaults to 'Sound Effects' if no valid marker is found or if the marker is empty.
 * @param {AVLayer} layer - The audio layer to analyze.
 * @returns {string} The name of the slider to which the audio layer should be connected.
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
 * Adds the 'Stereo Mixer' effect to the audio layer and links it to the specified slider control.
 * @param {AVLayer} layer - The audio layer to which the 'Stereo Mixer' effect will be applied.
 * @param {string} mainCompName - The name of the main composition.
 * @param {string} sliderName - The name of the slider to connect the audio layer to.
 */
function applyStereoMixer(layer, mainCompName, sliderName) {
    var stereoMixer = layer.Effects.addProperty("Stereo Mixer");
    var expression = "comp('" + mainCompName + "').layer('SFX CTRL').effect('" + sliderName + "')('Slider')";
    stereoMixer.property("Left Level").expression = expression;
    stereoMixer.property("Right Level").expression = expression;
}

/**
 * Recursively processes all layers within the composition, applying the 'Stereo Mixer' effect to audio layers 
 * and linking them to the appropriate slider based on marker comments.
 * @param {CompItem} comp - The composition to process.
 * @param {string} mainCompName - The name of the main composition.
 */
function processComp(comp, mainCompName) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);

        if (layer.source instanceof FootageItem && !layer.source.hasVideo) {
            var sliderName = determineSlider(layer);
            applyStereoMixer(layer, mainCompName, sliderName);
        } else if (layer.source instanceof CompItem) {
            processComp(layer.source, mainCompName);
        }
    }
}

/**
 * The main function that runs the script, processing selected compositions and managing audio layers.
 * It creates the 'SFX CTRL' layer if not present and applies the necessary effects and expressions to audio layers.
 */
function main() {
    var selectedComps = app.project.selection;
    app.beginUndoGroup("Apply Stereo Mixer");

    if (selectedComps.length === 0) {
        alert("Please select at least one composition.");
        return;
    }

    for (var i = 0; i < selectedComps.length; i++) {
        if (selectedComps[i] instanceof CompItem) {
            var comp = selectedComps[i];
            var mainCompName = comp.name;

            // Create SFX CTRL null with sliders if not already present
            var sfxCtrlLayer = comp.layer("SFX CTRL");
            if (!sfxCtrlLayer) {
                sfxCtrlLayer = createSFXCTRL(comp);
            }

            processComp(comp, mainCompName);
        } else {
            alert("Please select only compositions.");
            return;
        }
    }

    app.endUndoGroup();
}

main();
