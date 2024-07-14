/**
 * @file Keyframe Duplicator
 * @version 1.1.0
 * @author IVGDesign
 * @description Duplicates keyframes across layers with a specified interval and number of repetitions.
 * @license MIT
 */

/**
 * @description Keyframe Duplicator constructor
 * @constructor
 */
var KeyframeDuplicator = function () {
    /**
     * @description Initializes the script
     */
    this.init = function () {
        this.createDialog();
        this.dialog.show();
    };

    /**
     * @description Creates the user interface dialog
     */
    this.createDialog = function () {
        var dialog = new Window('dialog', 'Keyframe Duplicator');
        dialog.orientation = 'column';
        dialog.alignChildren = 'left';

        var intervalGroup = dialog.add('group', undefined, 'Interval Group');
        intervalGroup.add('statictext', undefined, 'Interval Duration (frames):');
        var intervalInput = intervalGroup.add('edittext', undefined, '100');
        intervalInput.characters = 15;

        var repetitionGroup = dialog.add('group', undefined, 'Repetition Group');
        repetitionGroup.add('statictext', undefined, 'No. of Repetitions:');
        var repetitionsInput = repetitionGroup.add('edittext', undefined, '5');
        repetitionsInput.characters = 15;

        var checkboxGroup = dialog.add('group', undefined, 'Checkbox Group');
        var compDurationCheckbox = checkboxGroup.add('checkbox', undefined, 'Comp Duration');

        var buttonsGroup = dialog.add('group', undefined, 'Buttons Group');
        buttonsGroup.orientation = 'row';
        var cancelButton = buttonsGroup.add('button', undefined, 'Cancel');
        var proceedButton = buttonsGroup.add('button', undefined, 'Proceed');

        var self = this;

        cancelButton.onClick = function () {
            dialog.close();
        };

        proceedButton.onClick = function () {
            var interval = parseInt(intervalInput.text, 10);
            var repetitions = parseInt(repetitionsInput.text, 10);
            if (isNaN(interval) || (!compDurationCheckbox.value && isNaN(repetitions))) {
                alert('Please enter valid numbers for interval and repetitions.');
                return;
            }
            dialog.close();
            self.duplicateKeyframesAcrossLayers(interval, repetitions, compDurationCheckbox.value);
        };

        this.dialog = dialog;
    };

    /**
     * @description Duplicates keyframes across layers
     * @param {number} interval - The interval duration in frames
     * @param {number} repetitions - The number of repetitions
     * @param {boolean} useCompDuration - Whether to use the composition duration
     */
    this.duplicateKeyframesAcrossLayers = function (interval, repetitions, useCompDuration) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert('No active composition selected.');
            return;
        }

        var frameRate = comp.frameRate;
        var globalInPoint = comp.duration;
        var globalOutPoint = 0;

        var selectedLayers = comp.selectedLayers;
        var properties = [];
        var keysSelected = false;

        // Iterate through selected layers and properties to find selected keyframes
        for (var layerIndex = 0; layerIndex < selectedLayers.length; layerIndex++) {
            var layer = selectedLayers[layerIndex];
            var selectedProperties = layer.selectedProperties;
            for (var propertyIndex = 0; propertyIndex < selectedProperties.length; propertyIndex++) {
                var property = selectedProperties[propertyIndex];
                if (!property.isTimeVarying) continue;

                var pi = properties.push({ keys: [], prop: property, times: [], newKeyIndices: [] }) - 1;
                for (var i = 1; i <= property.numKeys; i++) {
                    if (!property.keySelected(i)) continue;
                    keysSelected = true;

                    var keyIndex = i;
                    var keyTime = property.keyTime(keyIndex);
                    globalInPoint = Math.min(globalInPoint, keyTime);
                    globalOutPoint = Math.max(globalOutPoint, keyTime);

                    var keyframe = new Keyframe(property, keyIndex);
                    properties[pi].keys.push(keyframe);
                    properties[pi].times.push(keyTime);
                }
            }
        }

        if (!keysSelected) {
            alert(strings.errors.noKeysSelected);
            return;
        }

        var duplicateTime = globalOutPoint + interval / frameRate;
        var durationPerSet = globalOutPoint - globalInPoint;

        if (useCompDuration) {
            repetitions = Math.floor((comp.duration - duplicateTime) / (durationPerSet + interval / frameRate)) + 1;
        }

        app.beginUndoGroup('Duplicate Keyframes With Easing');

        // Duplicate keyframes for each repetition
        for (var i = 0; i < repetitions; i++) {
            // Step 1: Create new keyframes at the calculated times
            for (var m = 0; m < properties.length; m++) {
                var prop = properties[m].prop;
                for (var n = 0; n < properties[m].keys.length; n++) {
                    var keyTime = duplicateTime + (properties[m].times[n] - globalInPoint);
                    if (keyTime > comp.duration) continue;

                    var newKeyIndex = prop.addKey(keyTime);
                    properties[m].newKeyIndices.push(newKeyIndex);
                }
            }

            // Step 2: Set keyframe parameters based on the original keyframes
            for (var m = 0; m < properties.length; m++) {
                var prop = properties[m].prop;
                for (var n = 0; n < properties[m].keys.length; n++) {
                    var kf = properties[m].keys[n];
                    var newKeyIndex = properties[m].newKeyIndices[i * properties[m].keys.length + n];

                    // Set keyframe value
                    prop.setValueAtKey(newKeyIndex, prop.keyValue(kf.index));

                    // Set temporal interpolation and easing
                    if (kf.inInterpolationType === KeyframeInterpolationType.BEZIER || kf.outInterpolationType === KeyframeInterpolationType.BEZIER) {
                        prop.setTemporalEaseAtKey(newKeyIndex, kf.inTemporalEase, kf.outTemporalEase);
                        prop.setTemporalContinuousAtKey(newKeyIndex, kf.temporalContinuous);
                        prop.setTemporalAutoBezierAtKey(newKeyIndex, kf.temporalAutoBezier);
                    }

                    prop.setInterpolationTypeAtKey(newKeyIndex, kf.inInterpolationType, kf.outInterpolationType);

                    // Set spatial interpolation and roving
                    if (kf.spatial) {
                        prop.setSpatialTangentsAtKey(newKeyIndex, kf.inSpatialTangent, kf.outSpatialTangent);
                        prop.setSpatialContinuousAtKey(newKeyIndex, kf.spatialContinuous);
                        prop.setSpatialAutoBezierAtKey(newKeyIndex, kf.spatialAutoBezier);

                        if (kf.roving && newKeyIndex !== 1 && newKeyIndex !== prop.numKeys) {
                            prop.setRovingAtKey(newKeyIndex, true);
                        }
                    }
                }
            }

            duplicateTime += durationPerSet + interval / frameRate;
        }

        app.endUndoGroup();
    };

    /**
     * @description Keyframe constructor
     * @constructor
     * @param {Property} prop - The property associated with the keyframe
     * @param {number} index - The index of the keyframe
     */
    function Keyframe(prop, index) {
        this.index = index;
        this.inInterpolationType = prop.keyInInterpolationType(index);
        this.outInterpolationType = prop.keyOutInterpolationType(index);
        this.inTemporalEase = prop.keyInTemporalEase(index);
        this.outTemporalEase = prop.keyOutTemporalEase(index);
        this.temporalContinuous = prop.keyTemporalContinuous(index);
        this.temporalAutoBezier = prop.keyTemporalAutoBezier(index);
        this.spatial = prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL;
        if (this.spatial) {
            this.inSpatialTangent = prop.keyInSpatialTangent(index);
            this.outSpatialTangent = prop.keyOutSpatialTangent(index);
            this.spatialContinuous = prop.keySpatialContinuous(index);
            this.spatialAutoBezier = prop.keySpatialAutoBezier(index);
            this.roving = prop.keyRoving(index);
        }
    }
};

/**
 * @description Initializes the Keyframe Duplicator script
 */
var keyframeDuplicator = new KeyframeDuplicator();
keyframeDuplicator.init();