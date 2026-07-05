/**
 * @name sfxMaster
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-01-13
 * @license MIT
 *
 * @changelog
 * - 2026-07-04 (2.0.1): Fixed inverted conditional in applyStereoMixer that never
 *   created the Stereo Mixer effect when a layer had none, causing a null-reference
 *   crash on the primary first-run use case; the guard now creates a mixer when
 *   missing (or adds a second one when the user declines to overwrite an existing
 *   one), and only reuses the existing mixer when overwrite is true. Also fixed the
 *   per-comp check pass in main() to OR-accumulate foundExisting across multiple
 *   selected comps so the overwrite-confirmation prompt is no longer silently
 *   skipped when a later selected comp has no pre-existing Stereo Mixer expressions.
 * @ui HEADLESS
 * @description Centralized audio control system that creates a master control layer with sliders for Voice Over, Sound Effects, and Music categories
 * 
 * @functionality
 * - Creates an "SFX CTRL" null layer with three slider controls (Voice Over, Sound Effects, Music)
 * - Automatically identifies audio layers in selected compositions
 * - Categorizes audio based on layer markers (voice over, music, or defaults to sound effects)
 * - Applies Stereo Mixer effect to all audio layers
 * - Links audio levels to appropriate control sliders via expressions
 * - Supports nested compositions with recursive processing
 * - Handles existing Stereo Mixer effects with overwrite options
 * - Processes multiple selected compositions simultaneously
 * 
 * @usage
 * 1. Select one or more compositions in the Project panel
 * 2. Run the script via File > Scripts > sfxMaster.jsx
 * 3. Script will automatically:
 *    - Create SFX CTRL null with three audio category sliders
 *    - Find all audio layers in compositions
 *    - Apply Stereo Mixer effects
 *    - Link levels to appropriate sliders based on markers
 * 4. Adjust master sliders to control audio mix levels
 * 
 * @requirements
 * - Adobe After Effects CC 2019 or later
 * - At least one composition selected in Project panel
 * - Audio layers in the composition(s)
 * 
 * @notes
 * - Audio categorization is based on first marker's comment text
 * - Markers should contain "voice over" or "music" for categorization
 * - Layers without markers default to "Sound Effects" category
 * - Nested compositions are processed recursively
 * - All operations wrapped in undo group named "SFX Master"
 */

(function () {
    /**
     * Creates a "SFX CTRL" null layer with three slider controls: Voice Over, Sound Effects, and Music.
     * @param {CompItem} comp - The composition in which to create the SFX CTRL layer.
     * @returns {AVLayer} The created SFX CTRL null layer.
     */
    function createSFXCTRL(comp) {
        var sfxCtrl = comp.layers.addNull();
        sfxCtrl.name = 'SFX CTRL';
        sfxCtrl.property('ADBE Transform Group').property('ADBE Position').setValue([100, 100]); // Position it appropriately

        var voiceOverSlider = sfxCtrl.Effects.addProperty('ADBE Slider Control');
        voiceOverSlider.name = 'Voice Over';

        var soundEffectsSlider = sfxCtrl.Effects.addProperty('ADBE Slider Control');
        soundEffectsSlider.name = 'Sound Effects';

        var musicSlider = sfxCtrl.Effects.addProperty('ADBE Slider Control');
        musicSlider.name = 'Music';

        return sfxCtrl;
    }

    /**
     * Determines the appropriate slider control (Voice Over, Music, or Sound Effects) based on the layer's marker comment.
     * @param {AVLayer} layer - The layer from which to determine the slider.
     * @returns {string} The name of the appropriate slider control.
     */
    function determineSlider(layer) {
        if (layer.property('Marker').numKeys > 0) {
            var firstMarker = layer.property('Marker').keyValue(1).comment.toLowerCase();
            if (firstMarker.indexOf('voice over') !== -1) {
                return 'Voice Over';
            } else if (firstMarker.indexOf('music') !== -1) {
                return 'Music';
            }
        }
        // Default to Sound Effects if no valid marker or no marker at all
        return 'Sound Effects';
    }

    /**
     * Checks if the given layer already has a Stereo Mixer effect with expressions applied.
     * @param {AVLayer} layer - The layer to check for an existing Stereo Mixer effect.
     * @returns {boolean} True if the layer has a Stereo Mixer effect with expressions applied, false otherwise.
     */
    function checkForExistingStereoMixer(layer) {
        var stereoMixer = layer.property('Effects').property('Stereo Mixer');
        if (stereoMixer) {
            var leftExpr = stereoMixer.property('Left Level').expression;
            var rightExpr = stereoMixer.property('Right Level').expression;
            return leftExpr || rightExpr; // Returns true if there is an existing expression
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
        var stereoMixer = layer.property('Effects').property('Stereo Mixer');

        // Add a new Stereo Mixer when the layer has none, or when one exists but
        // the user chose NOT to overwrite (in which case a second mixer is added,
        // leaving the original's expressions intact). Only reuse the existing
        // mixer when it is present and overwrite is true.
        if (!stereoMixer || !overwrite) {
            stereoMixer = layer.Effects.addProperty('Stereo Mixer');
        }

        // Apply or overwrite the expressions
        stereoMixer.property('Left Level').expression =
            "comp('" + mainCompName + "').layer('SFX CTRL').effect('" + sliderName + "')('Slider')";
        stereoMixer.property('Right Level').expression =
            "comp('" + mainCompName + "').layer('SFX CTRL').effect('" + sliderName + "')('Slider')";
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
                foundExisting =
                    foundExisting || processComp(layer.source, mainCompName, checkOnly, overwrite);
            }
        }

        return foundExisting;
    }

    /**
     * The main function that initiates the processing of selected compositions to apply or overwrite Stereo Mixer effects.
     */
    function main() {
        var selectedComps = app.project.selection;
        app.beginUndoGroup('Apply Stereo Mixer');

        if (selectedComps.length === 0) {
            alert('Please select at least one composition.');
            return;
        }

        var foundExisting = false;

        for (var i = 0; i < selectedComps.length; i++) {
            if (selectedComps[i] instanceof CompItem) {
                var comp = selectedComps[i];
                var mainCompName = comp.name;

                // Create SFX CTRL null with sliders if not already present
                var sfxCtrlLayer = comp.layer('SFX CTRL');
                if (!sfxCtrlLayer) {
                    sfxCtrlLayer = createSFXCTRL(comp);
                }

                // Check for existing Stereo Mixer effects with expressions.
                // OR-accumulate so a match in any selected comp is not lost when
                // a later comp reports none.
                foundExisting = foundExisting || processComp(comp, mainCompName, true, false);
            } else {
                alert('Please select only compositions.');
                return;
            }
        }

        var overwrite = true;
        if (foundExisting) {
            overwrite = confirm(
                'One or more layers already have a Stereo Mixer effect with expressions applied. Would you like to overwrite them?'
            );
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
