/**
 * Keyframe Duplicator v1.2
 * 
 * An After Effects script to duplicate selected keyframes across layers and time,
 * with options for temporal decay and easing.
 * 
 * @version 1.2
 * @author IVG Design
 * @license MIT
 * 
 * Copyright (c) 2024 IVG Design
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * Disclaimer:
 * This script is provided as-is and without any guarantees. Use it at your own risk.
 * Always backup your projects before running scripts.
 */

// Begin undo group
app.beginUndoGroup('Duplicate Keyframes With Easing');

// Create dialog
var dialog = new Window('dialog', 'Keyframe Duplicator');
dialog.orientation = 'column';
dialog.alignChildren = 'left';

// Interval Duration
var intervalGroup = dialog.add('group', undefined, 'Interval Group');
intervalGroup.add('statictext', undefined, 'Interval Duration (frames):');
var intervalInput = intervalGroup.add('edittext', undefined, '100');
intervalInput.characters = 15;

// Number of Repetitions
var repetitionGroup = dialog.add('group', undefined, 'Repetition Group');
repetitionGroup.add('statictext', undefined, 'No. of Repetitions:');
var repetitionsInput = repetitionGroup.add('edittext', undefined, '5');
repetitionsInput.characters = 15;

// Comp Duration Checkbox
var checkboxGroup = dialog.add('group', undefined, 'Checkbox Group');
var compDurationCheckbox = checkboxGroup.add('checkbox', undefined, 'Comp Duration');

// Temporal Decay Checkbox
var temporalDecayCheckbox = checkboxGroup.add('checkbox', undefined, 'Temporal Decay');

// Decay Duration
var decayGroup = dialog.add('group', undefined, 'Decay Group');
decayGroup.add('statictext', undefined, 'Decay Duration (frames):');
var decayDurationInput = decayGroup.add('edittext', undefined, '1200');
decayDurationInput.characters = 15;

// Decay Type Dropdown
var decayTypeGroup = dialog.add('group', undefined, 'Decay Type Group');
decayTypeGroup.add('statictext', undefined, 'Decay Type:');
var decayTypeDropdown = decayTypeGroup.add('dropdownlist', undefined, ['Linear', 'Ease In', 'Ease Out']);
decayTypeDropdown.selection = 0;

// Buttons
var buttonsGroup = dialog.add('group', undefined, 'Buttons Group');
buttonsGroup.orientation = 'row';
var cancelButton = buttonsGroup.add('button', undefined, 'Cancel');
var proceedButton = buttonsGroup.add('button', undefined, 'Proceed');

cancelButton.onClick = function () {
    dialog.close();
};

proceedButton.onClick = function () {
    var interval = parseInt(intervalInput.text, 10);
    var repetitions = parseInt(repetitionsInput.text, 10);
    var useTemporalDecay = temporalDecayCheckbox.value;
    var decayDuration = parseInt(decayDurationInput.text, 10);
    var decayType = decayTypeDropdown.selection.text;

    if (isNaN(interval) || (!compDurationCheckbox.value && isNaN(repetitions)) || (useTemporalDecay && isNaN(decayDuration))) {
        alert('Please enter valid numbers for interval, repetitions, and decay duration.');
        return;
    }
    dialog.close();
    duplicateKeyframesAcrossLayers(interval, repetitions, compDurationCheckbox.value, useTemporalDecay, decayDuration, decayType);
};

dialog.show();

/**
 * Duplicates selected keyframes across layers and time.
 * @param {number} interval - The interval duration in frames between each duplication.
 * @param {number} repetitions - The number of times to duplicate the keyframes.
 * @param {boolean} useCompDuration - Whether to use the composition duration for duplication.
 * @param {boolean} useTemporalDecay - Whether to apply temporal decay to the duplication intervals.
 * @param {number} decayDuration - The duration in frames over which the temporal decay occurs.
 * @param {string} decayType - The type of temporal decay: 'Linear', 'Ease In', or 'Ease Out'.
 */
function duplicateKeyframesAcrossLayers(interval, repetitions, useCompDuration, useTemporalDecay, decayDuration, decayType) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert('No active composition selected.');
        return;
    }

    var frameRate = comp.frameRate;
    var globalInPoint = comp.duration;
    var globalOutPoint = 0;

    // Find the earliest and latest keyframes in the selection
    var selectedLayers = comp.selectedLayers;
    for (var layerIndex = 0; layerIndex < selectedLayers.length; layerIndex++) {
        var layer = selectedLayers[layerIndex];
        var selectedProperties = layer.selectedProperties;
        for (var propertyIndex = 0; propertyIndex < selectedProperties.length; propertyIndex++) {
            var property = selectedProperties[propertyIndex];
            if (!property.isTimeVarying) continue;
            var numKeys = property.numKeys;
            for (var i = 1; i <= numKeys; i++) {
                if (!property.keySelected(i)) continue;
                var keyTime = property.keyTime(i);
                globalInPoint = Math.min(globalInPoint, keyTime);
                globalOutPoint = Math.max(globalOutPoint, keyTime);
            }
        }
    }

    if (globalInPoint == comp.duration) {
        alert("No keyframes selected.");
        return;
    }

    var duplicateTime = globalOutPoint + interval / frameRate;
    var durationPerSet = globalOutPoint - globalInPoint;

    if (useCompDuration) {
        repetitions = Math.floor((comp.duration - duplicateTime) / (durationPerSet + interval / frameRate)) + 1;
    }

    // Calculate temporal decay factors based on decay type
    var decayFactors = [];
    for (var i = 0; i < repetitions; i++) {
        var t = i / (repetitions - 1);
        var factor;
        switch (decayType) {
            case 'Ease In':
                factor = ease(t, 0, 1, 1);
                break;
            case 'Ease Out':
                factor = ease(t, 1, 0, 1);
                break;
            default:
                factor = 1 - t;
                break;
        }
        decayFactors.push(factor);
    }

    // Initialize the duplicate time for the first set of duplications
    var duplicateTime = comp.time;

    // Loop through each repetition
    for (var i = 0; i < repetitions; i++) {
        var decayFactor = useTemporalDecay ? decayFactors[i] : 1;
        var decayedInterval = interval * decayFactor;

        // Loop through each layer that has selected properties
        for (var layerIndex = 0; layerIndex < selectedLayers.length; layerIndex++) {
            var layer = selectedLayers[layerIndex];
            var selectedProperties = layer.selectedProperties;

            // Loop through each selected property of the layer
            for (var propertyIndex = 0; propertyIndex < selectedProperties.length; propertyIndex++) {
                var property = selectedProperties[propertyIndex];
                if (!property.isTimeVarying) continue;
                var numKeys = property.numKeys;

                // Loop through each keyframe of the property
                for (var j = 1; j <= numKeys; j++) {
                    if (!property.keySelected(j)) continue;

                    var keyTime = property.keyTime(j);
                    var newKeyTime = duplicateTime + (keyTime - globalInPoint) + (i * decayedInterval);
                    if (newKeyTime > comp.duration) continue;

                    // Duplicate the keyframe
                    var keyValue = property.keyValue(j);
                    var newKeyIndex = property.addKey(newKeyTime);
                    property.setValueAtKey(newKeyIndex, keyValue);

                    // Set interpolation type for the new key
                    var inType = property.keyInInterpolationType(j);
                    var outType = property.keyOutInterpolationType(j);
                    property.setInterpolationTypeAtKey(newKeyIndex, inType, outType);

                    // Set temporal ease for the new key
                    var inEase = property.keyInTemporalEase(j);
                    var outEase = property.keyOutTemporalEase(j);
                    property.setTemporalEaseAtKey(newKeyIndex, inEase, outEase);

                    // For spatial properties, set spatial tangents and roving
                    if (property.propertyValueType === PropertyValueType.ThreeD_SPATIAL || property.propertyValueType === PropertyValueType.TwoD_SPATIAL) {
                        var inSpatialTangent = property.keyInSpatialTangent(j);
                        var outSpatialTangent = property.keyOutSpatialTangent(j);
                        property.setSpatialTangentsAtKey(newKeyIndex, inSpatialTangent, outSpatialTangent);
                        var roving = property.keyRoving(j);
                        property.setRovingAtKey(newKeyIndex, roving);
                    }

                    // Set other properties like continuous, auto bezier if applicable
                    if (property.keyTemporalContinuous(j)) {
                        property.setTemporalContinuousAtKey(newKeyIndex, true);
                    }
                    if (property.keyTemporalAutoBezier(j)) {
                        property.setTemporalAutoBezierAtKey(newKeyIndex, true);
                    }
                    if (property.propertyValueType === PropertyValueType.TwoD_SPATIAL || property.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {
                        if (property.keySpatialContinuous(j)) {
                            property.setSpatialContinuousAtKey(newKeyIndex, true);
                        }
                        if (property.keySpatialAutoBezier(j)) {
                            property.setSpatialAutoBezierAtKey(newKeyIndex, true);
                        }
                    }

                    // Copy the label color of the keyframe
                    var labelColor = property.keyLabel(j);
                    property.setLabelAtKey(newKeyIndex, labelColor);
                }
            }
        }

        // Update the duplicateTime for the next repetition
        duplicateTime += decayedInterval;
    }


}

/**
 * Calculates the eased value based on the input time and easing parameters.
 * @param {number} t - The current time normalized between 0 and 1.
 * @param {number} b - The starting value.
 * @param {number} c - The change in value (ending value - starting value).
 * @param {number} d - The total duration of the easing.
 * @returns {number} The eased value.
 */
function ease(t, b, c, d) {
    return c * t / d + b;
}

// End undo group
app.endUndoGroup();