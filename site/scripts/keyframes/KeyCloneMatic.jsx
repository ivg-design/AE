/**
 * KeyCloneMatic - Advanced Keyframe Duplication and Distribution System
 *
 * @name KeyCloneMatic
 * @author IVG Design
 * @version 2.0.1
 * @date 2025-08-13
 * @license MIT
 * @ui DIALOG
 *
 * @changelog
 * 2.0.1 (2026-07-04)
 *   - Fixed compounding positional drift: the main loop no longer reassigns the
 *     working set to the previous pass's clones and no longer double-counts the
 *     per-repetition offset, so repetitions stay evenly spaced.
 *   - Fixed 'Comp Duration' mode silently producing zero clones: durationPerSet
 *     is now assigned before it is used, so the repetitions count is no longer NaN.
 *   - Wired 'Decay Duration (frames)' into the decay math: it now normalizes the
 *     decay progress instead of being ignored.
 *   - Fixed decay curves: 'Ease In'/'Ease Out' now genuinely shrink the interval
 *     (previously 'Ease Out' was a no-op and 'Ease In' widened the gap). The now
 *     unused linear ease() helper is retained for reference.
 * 
 * @description
 * A sophisticated keyframe duplication tool that replicates selected keyframes across time with
 * advanced temporal control features. The script provides precise control over timing, repetition
 * patterns, and temporal decay effects, making it ideal for creating complex animation sequences
 * and rhythmic patterns in After Effects compositions.
 * 
 * @functionality
 * • Intelligent keyframe selection and duplication across multiple layers
 * • Customizable interval timing with frame-based precision control
 * • Flexible repetition system with composition duration auto-calculation
 * • Advanced temporal decay system with multiple easing curve options
 * • Complete keyframe property preservation (values, interpolation, spatial tangents)
 * • Support for all keyframe types (spatial, temporal, color, custom properties)
 * • Automatic global time range detection from selected keyframes
 * • Mathematical decay calculations with Linear, Ease In, and Ease Out curves
 * • Comprehensive error handling and user input validation
 * • Full undo group support for safe operation reversal
 * 
 * @usage
 * 1. Select one or more layers in your composition timeline
 * 2. Select specific properties and keyframes you want to duplicate
 * 3. Run the script to open the KeyCloneMatic dialog
 * 4. Configure the interval duration (in frames) between duplications
 * 5. Set the number of repetitions or enable "Comp Duration" for auto-calculation
 * 6. Optionally enable "Temporal Decay" for progressive timing variations
 * 7. If using decay, set the decay duration and choose the decay type (Linear/Ease In/Ease Out)
 * 8. Click "Proceed" to execute the duplication with your specified settings
 * 9. The script will create multiple copies of your keyframes with calculated timing
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with selected layers containing keyframed properties
 * • At least one selected keyframe in the timeline
 * • Sufficient composition duration for the planned duplications
 * 
 * @notes
 * • The script automatically calculates global in/out points from selected keyframes
 * • Temporal decay progressively reduces intervals over time for organic timing variation
 * • All keyframe properties are preserved including spatial tangents and interpolation types
 * • Supports complex property types including paths, masks, and custom effect parameters
 * • Composition duration mode automatically calculates maximum possible repetitions
 * • The decay system uses mathematical easing functions for smooth temporal transitions
 * • Memory-efficient processing handles large keyframe selections without performance impact
 */

// Begin undo group
app.beginUndoGroup('KeyCloneMatic');

// Create dialog
var dialog = new Window('dialog', 'KeyCloneMatic');
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

// Keyframe constructor function
function Keyframe(property, keyIndex) {
    this.spatial = (property.propertyValueType === PropertyValueType.TwoD_SPATIAL) || (property.propertyValueType === PropertyValueType.ThreeD_SPATIAL);
    if (property.matchName == "ADBE Orientation") {
        this.spatial = false;
    }
    this.path = (property.matchName == "ADBE Mask Shape") || (property.matchName == "ADBE Vector Shape");
    this.color = property.propertyValueType === PropertyValueType.COLOR;
    this.custom = property.propertyValueType === PropertyValueType.CUSTOM_VALUE;
    this.property = property;
    this.index = keyIndex;
    this.time = property.keyTime(keyIndex);
    this.value = this.custom ? null : property.keyValue(keyIndex);
    this.inInterpolationType = property.keyInInterpolationType(keyIndex);
    this.outInterpolationType = property.keyOutInterpolationType(keyIndex);
    this.inTemporalEase = property.keyInTemporalEase(keyIndex);
    this.outTemporalEase = property.keyOutTemporalEase(keyIndex);
    this.temporalContinuous = property.keyTemporalContinuous(keyIndex);
    this.temporalAutoBezier = property.keyTemporalAutoBezier(keyIndex);
    this.labelColor = property.keyLabel(keyIndex);
    this.roving = this.spatial ? property.keyRoving(keyIndex) : false;
    if (this.spatial) {
        this.inSpatialTangent = property.keyInSpatialTangent(keyIndex);
        this.outSpatialTangent = property.keyOutSpatialTangent(keyIndex);
        this.spatialContinuous = property.keySpatialContinuous(keyIndex);
        this.spatialAutoBezier = property.keySpatialAutoBezier(keyIndex);
    }
    this.remove = function () {
        this.property.removeKey(this.index);
    };
    this.clone = function (newTime, select) {
        if (arguments.length < 2) {
            select = false;
        }
        var newKeyIndex = this.property.addKey(newTime);
        this.update(newKeyIndex);
        var newKeyframe = new Keyframe(this.property, newKeyIndex);
        if ((select !== undefined) && (select == true)) {
            property.setSelectedAtKey(newKeyIndex, true);
        }
        return newKeyframe;
    };
    this.select = function () {
        this.property.setSelectedAtKey(this.index, true);
    };
    this.deselect = function () {
        this.property.setSelectedAtKey(this.index, false);
    };
    this.update = function (newKeyIndex) {
        var keyIndex = arguments.length < 1 ? this.index : newKeyIndex;
        this.property.setValueAtKey(keyIndex, this.value);
        if (this.inInterpolationType === KeyframeInterpolationType.BEZIER || this.outInterpolationType === KeyframeInterpolationType.BEZIER) {
            this.property.setTemporalEaseAtKey(keyIndex, this.inTemporalEase, this.outTemporalEase);
            this.property.setTemporalContinuousAtKey(keyIndex, this.temporalContinuous);
        } else if (this.inInterpolationType === KeyframeInterpolationType.AUTO_BEZIER || this.outInterpolationType === KeyframeInterpolationType.AUTO_BEZIER) {
            // Do not set temporal ease for AutoBezier keyframes
            if (this.spatial) {
                this.property.setTemporalAutoSpatialBezierAtKey(keyIndex, true);
            } else {
                this.property.setTemporalAutoBezierAtKey(keyIndex, true);
            }
        } else {
            this.property.setInterpolationTypeAtKey(keyIndex, this.inInterpolationType, this.outInterpolationType);
        }
        this.property.setLabelAtKey(keyIndex, this.labelColor);
        if (this.spatial) {
            this.property.setSpatialTangentsAtKey(keyIndex, this.inSpatialTangent, this.outSpatialTangent);
            this.property.setSpatialContinuousAtKey(keyIndex, this.spatialContinuous);
        }
        this.property.setRovingAtKey(keyIndex, this.roving);
    };
    this.move = function (newTime) {
        this.remove();
        this.clone(newTime);
    };
}

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
    var keyframeObjects = [];

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
                keyframeObjects.push(new Keyframe(property, i));
            }
        }
    }

    if (globalInPoint == comp.duration) {
        alert("No keyframes selected.");
        return;
    }

    var duplicateTime = globalInPoint;
    var durationPerSet = globalOutPoint - globalInPoint;
    if (useCompDuration) {
        // A single selected keyframe (durationPerSet 0) combined with a zero
        // interval would make this denominator 0 and repetitions infinite.
        var setSpacing = durationPerSet + interval / frameRate;
        if (setSpacing <= 0) {
            alert("Interval must be greater than 0 when a single keyframe (or keyframes sharing one time) is selected with Comp Duration.");
            return;
        }
        repetitions = Math.floor((comp.duration - duplicateTime) / setSpacing) + 1;
    } else {
        duplicateTime += interval / frameRate;
    }

    // Calculate temporal decay factors based on decay type.
    // Progress `t` is normalized over the Decay Duration (in frames): the
    // interval fully decays once the cumulative nominal offset (i * interval
    // frames) reaches decayDuration. When decayDuration is not a usable
    // positive number, fall back to per-repetition progress. Every curve
    // returns a factor that shrinks from 1 (full interval) toward 0, so the
    // gap between repetitions genuinely reduces over time.
    var decayFactors = [];
    for (var i = 0; i < repetitions; i++) {
        var t;
        if (!isNaN(decayDuration) && decayDuration > 0) {
            t = (i * interval) / decayDuration;
        } else {
            t = (repetitions > 1) ? (i / (repetitions - 1)) : 0;
        }
        if (t > 1) t = 1;
        var factor;
        switch (decayType) {
            case 'Ease In':
                // Interval holds near full at first, then decays faster.
                factor = 1 - (t * t);
                break;
            case 'Ease Out':
                // Interval decays quickly at first, then eases toward zero.
                factor = (1 - t) * (1 - t);
                break;
            default: // Linear
                factor = 1 - t;
                break;
        }
        decayFactors.push(factor);
    }

    // Duplicate the keyframes. keyframeObjects always holds the ORIGINAL
    // selected pattern; each pass clones that same pattern forward in time using
    // the pattern-relative offset (keyframe.time - globalInPoint). Time is
    // advanced by exactly one mechanism (duplicateTime below), so repetitions
    // stay evenly spaced instead of compounding pass over pass.
    for (var i = 0; i < repetitions; i++) {
        var decayFactor = useTemporalDecay ? decayFactors[i] : 1;
        var decayedInterval = interval * decayFactor;

        for (var j = 0; j < keyframeObjects.length; j++) {
            var keyframe = keyframeObjects[j];
            var newKeyTime = duplicateTime + (keyframe.time - globalInPoint);
            if (newKeyTime > comp.duration) continue;

            keyframe.clone(newKeyTime, true);
        }

        // Advance to the next set: one full pattern length plus the
        // (optionally decayed) interval gap.
        duplicateTime = duplicateTime + durationPerSet + decayedInterval / frameRate;
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