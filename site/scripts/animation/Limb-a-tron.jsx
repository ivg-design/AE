/**
 * Limb-a-tron - Advanced IK Limb System for Adobe After Effects
 *
 * This script creates an IK/FK limb rig in Adobe After Effects. It builds a shape layer
 * driven by a controller null and an embedded pseudo effect, then wires expressions for
 * IK angles, FK/manual angles, body paths, trim ranges, and regular/noodle render modes.
 * When an existing Limb-a-tron rig is selected, the same script can intelligently bake
 * the current animated appearance and optionally remove the controller.
 *
 * FUNCTIONALITY:
 * - Creates a named limb shape layer plus a controller null with the LimbControlsV3 pseudo effect.
 * - Supports IK, FK/manual angles, dynamic IK direction, adjusted lengths, and pop prevention.
 * - Builds both regular and noodle limb bodies, with regular/noodle stroke render passes.
 * - Adds noodle curvature, tension, side-curvature, inverse-curvature, and center-point controls.
 * - Uses linked shoulder/wrist stroke trim ranges for regular and noodle modes.
 * - Includes radial/closest safe noodle outline logic for tight bends and folded poses.
 * - Detects selected Limb-a-tron rigs and can bake paths, trim values, and visibility state.
 * - Simplifies baked keys, freezes static appearances, removes inactive render groups, and can remove the controller.
 *
 * USAGE:
 * 1. Select a composition in Adobe After Effects.
 * 2. Run the script with no existing Limb-a-tron rig selected to create a new rig.
 * 3. Enter the limb name when prompted.
 * 4. Select an existing Limb-a-tron shape layer or controller and run the script to bake it.
 * 5. Confirm the bake prompt to sample animated expressions, simplify keys, and optionally remove the controller.
 *
 * REQUIREMENTS:
 * - Active composition.
 * - Adobe After Effects shape layers, pseudo effects, and expression support.
 * - Modern expression engine support for shape path APIs such as createPath(), points(), inTangents(), and outTangents().
 *
 * NOTES:
 * - The catalog filename remains Limb-a-tron.jsx even when imported from a KBar-exported filename.
 * - ExtendScript wrapper code is ECMA-3 compatible; property expressions use the After Effects expression engine.
 * - Bake mode preserves animated appearances while pruning inactive regular/noodle groups where possible.
 *
 * @name Limb-a-tron
 * @author IVG Design
 * @version 2.7.0
 * @date 2026-05-09
 * @ui DIALOG
 * @license MIT
 * @changelog
 * 1.1.0 added shoulder/wrist stroke controls
 * 1.1.1 fixed bug that broke the rig when limb or CTRL is parented
 * 1.2.0 fixed issue with limb layer, parent of limb layer rotation
 * 1.3.0 added curvature controls to the limb
 * 1.3.1 removed z value from position arrays in IK Angles calculation
 *       (was causing Lottie errors in browser with mapped linear expressions)
 * 1.4.0 added pop prevent control, and dynamic IK direction control
 * 1.4.1 fixed issue with multiple parents of limb layer breaking IK angles
 *       calculation
 * 2.1.0 added noodle limb mode with a single curved body/stroke path
 * 2.2.0 rebuilt the visible limb as one canonical path and added intelligent path bake
 * 2.3.0 rebuilt the body as a low-point cubic path, removed stroke-only paths,
 *       and fixed selected-rig smart bake/removal behavior
 * 2.4.0 rebuilt angular elbow joins, restored side-curvature controls,
 *       replaced noodle math with a two-segment cubic tube, and hardened bake errors
 * 2.5.0 switched angular joins to two-sided miter joins, rebuilt noodle as a sampled
 *       Hermite tube, added light linked stroke render passes, and restricted bake to
 *       the canonical body path
 * 2.6.0 restored the v2-style sampled offset-ribbon noodle body and fixed
 *       path bake cloning/filtering for inactive body paths
 * 2.6.1 ECMA-3 ExtendScript cleanup and fixed smart-bake shape interpolation
 *       so no empty Shape.vertices array is assigned during baking
 * 2.6.2 stabilized noodle self-overlap at tight bends, removed inactive body groups
 *       after static-mode baking, and simplified baked path keyframes
 * 2.6.4 added noodle side-curvature wiring, smoother cap tangents, a safer unified regular elbow,
 *       and rebuilt smart bake around frame-aligned samples plus path simplification
 * 2.6.5 removed the tight-bend shrink guard, added an inner-elbow bridge for
 *       folded noodle poses, and recursively removes inactive stroke render passes on bake
 * 2.7.0 added a unified regular limb body path with rounded elbow overlap and
 *       avoids baking static appearance/trim expressions into unnecessary keys
 *
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
 */

{
    function createLimbScript() {
        //FFX Module
        var ApplyFFX = (function () {
            var module = {};

            module.deselectAll = function (theComp) {
                for (var i = 1, il = theComp.numLayers; i <= il; i++) {
                    theComp.layer(i).selected = false;
                }
            };

            module.config = function (layer, binaryData, matchName, version, name) {
                var config = {
                    binary: binaryData,
                    matchName: 'Pseudo/' + matchName,
                    name: name,
                    version: version
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

        function getEffectsGroup(layer) {
            try {
                return layer.property('ADBE Effect Parade');
            } catch (err) {
                return null;
            }
        }

        function hasNamedProperty(group, propertyName) {
            try {
                return group && group.property(propertyName) !== null;
            } catch (err) {
                return false;
            }
        }

        function getLimbControlEffect(layer) {
            if (!layer) {
                return null;
            }
            var effects = getEffectsGroup(layer);
            if (!effects) {
                return null;
            }
            for (var i = 1; i <= effects.numProperties; i++) {
                var effect = effects.property(i);
                if (!effect) {
                    continue;
                }
                if (
                    hasNamedProperty(effect, 'IK Angles') &&
                    hasNamedProperty(effect, 'Adjusted U/L Limb Lengths') &&
                    hasNamedProperty(effect, 'Elbow (layer space)') &&
                    hasNamedProperty(effect, 'Wrist  (layer space)')
                ) {
                    return effect;
                }
                try {
                    if (effect.matchName && effect.matchName.indexOf('Pseudo/LimbControls') === 0) {
                        return effect;
                    }
                } catch (err2) {}
            }
            return null;
        }

        function endsWithText(value, suffix) {
            if (!value || value.length < suffix.length) {
                return false;
            }
            return value.substring(value.length - suffix.length) === suffix;
        }

        function getLimbNameFromControl(ctrlLayer, limbEffect) {
            var suffix = ' Limb Control';
            if (limbEffect && endsWithText(limbEffect.name, suffix)) {
                return limbEffect.name.substring(0, limbEffect.name.length - suffix.length);
            }
            if (ctrlLayer && endsWithText(ctrlLayer.name, ' CTRL')) {
                return ctrlLayer.name.substring(0, ctrlLayer.name.length - 5);
            }
            return null;
        }

        function layerByNameSafe(comp, layerName) {
            if (!layerName) {
                return null;
            }
            try {
                return comp.layer(layerName);
            } catch (err) {
                return null;
            }
        }

        function findLimbShapeLayer(comp, limbName, ctrlLayer) {
            var byName = layerByNameSafe(comp, limbName);
            if (byName && byName !== ctrlLayer) {
                return byName;
            }
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer === ctrlLayer) {
                    continue;
                }
                try {
                    if (layer.comment && layer.comment.indexOf('Limb-a-tron limb') !== -1 && layer.comment.indexOf('controller=' + ctrlLayer.name) !== -1) {
                        return layer;
                    }
                } catch (err) {}
            }
            return byName;
        }

        function getSelectedLimbInfo(comp) {
            var selectedLayers = comp.selectedLayers;
            var i;
            for (i = 0; i < selectedLayers.length; i++) {
                var possibleCtrl = selectedLayers[i];
                var limbEffect = getLimbControlEffect(possibleCtrl);
                if (limbEffect) {
                    var limbName = getLimbNameFromControl(possibleCtrl, limbEffect);
                    var shapeLayer = findLimbShapeLayer(comp, limbName, possibleCtrl);
                    if (shapeLayer) {
                        return {
                            limbName: limbName,
                            shapeLayer: shapeLayer,
                            ctrlLayer: possibleCtrl,
                            limbEffect: limbEffect
                        };
                    }
                }
            }

            for (i = 0; i < selectedLayers.length; i++) {
                var possibleShape = selectedLayers[i];
                var ctrlLayer = layerByNameSafe(comp, possibleShape.name + ' CTRL');
                var effect = getLimbControlEffect(ctrlLayer);
                if (effect) {
                    return {
                        limbName: possibleShape.name,
                        shapeLayer: possibleShape,
                        ctrlLayer: ctrlLayer,
                        limbEffect: effect
                    };
                }
            }
            return null;
        }

        function propertyHasKeys(prop) {
            try {
                if (prop.numKeys && prop.numKeys > 0) {
                    return true;
                }
            } catch (err) {}
            try {
                for (var i = 1; i <= prop.numProperties; i++) {
                    if (propertyHasKeys(prop.property(i))) {
                        return true;
                    }
                }
            } catch (err2) {}
            return false;
        }

        function layerChainHasKeys(layer) {
            var currentLayer = layer;
            while (currentLayer) {
                if (propertyHasKeys(currentLayer)) {
                    return true;
                }
                currentLayer = currentLayer.parent;
            }
            return false;
        }

        function collectKeyTimes(prop, times) {
            try {
                if (prop.numKeys && prop.numKeys > 0) {
                    for (var k = 1; k <= prop.numKeys; k++) {
                        times.push(prop.keyTime(k));
                    }
                }
            } catch (err) {}
            try {
                for (var i = 1; i <= prop.numProperties; i++) {
                    collectKeyTimes(prop.property(i), times);
                }
            } catch (err2) {}
        }

        function collectLayerChainKeyTimes(layer, times) {
            var currentLayer = layer;
            while (currentLayer) {
                collectKeyTimes(currentLayer, times);
                currentLayer = currentLayer.parent;
            }
        }

        function collectTransformChainKeyTimes(layer, times) {
            var currentLayer = layer;
            while (currentLayer) {
                try {
                    collectKeyTimes(currentLayer.property('ADBE Transform Group'), times);
                } catch (err) {}
                currentLayer = currentLayer.parent;
            }
        }

        function sortUniqueTimes(times) {
            times.sort(function (a, b) {
                return a - b;
            });
            var result = [];
            var tolerance = 0.00001;
            for (var i = 0; i < times.length; i++) {
                if (result.length === 0 || Math.abs(times[i] - result[result.length - 1]) > tolerance) {
                    result.push(times[i]);
                }
            }
            return result;
        }

        function compDisplayStartTime(comp) {
            try {
                return comp.displayStartTime;
            } catch (err) {
                return 0;
            }
        }

        function frameIndexForTime(comp, timeValue) {
            var frameDuration = comp.frameDuration;
            if (!frameDuration || frameDuration <= 0) {
                frameDuration = 1 / 24;
            }
            return Math.round((timeValue - compDisplayStartTime(comp)) / frameDuration);
        }

        function timeForFrameIndex(comp, frameIndex) {
            var frameDuration = comp.frameDuration;
            if (!frameDuration || frameDuration <= 0) {
                frameDuration = 1 / 24;
            }
            return compDisplayStartTime(comp) + frameIndex * frameDuration;
        }

        function snapTimeToFrame(comp, timeValue) {
            return timeForFrameIndex(comp, frameIndexForTime(comp, timeValue));
        }

        function sortUniqueFrameTimes(times, comp) {
            var snapped = [];
            for (var i = 0; i < times.length; i++) {
                snapped.push(snapTimeToFrame(comp, times[i]));
            }
            return sortUniqueTimes(snapped);
        }

        function buildFrameSampleTimes(sourceTimes, comp) {
            var result = [];
            if (sourceTimes.length === 0) {
                return result;
            }
            var startFrame = frameIndexForTime(comp, sourceTimes[0]);
            var endFrame = frameIndexForTime(comp, sourceTimes[sourceTimes.length - 1]);
            if (endFrame < startFrame) {
                var tempFrame = startFrame;
                startFrame = endFrame;
                endFrame = tempFrame;
            }
            for (var frameIndex = startFrame; frameIndex <= endFrame; frameIndex++) {
                result.push(timeForFrameIndex(comp, frameIndex));
            }
            if (result.length === 0) {
                result.push(snapTimeToFrame(comp, sourceTimes[0]));
            }
            return sortUniqueFrameTimes(result, comp);
        }

        function isExpressionDrivenProperty(prop) {
            try {
                return prop.canSetExpression && prop.expression !== '';
            } catch (err) {
                return false;
            }
        }

        function isVectorShapeProperty(prop) {
            try {
                return prop.matchName === 'ADBE Vector Shape';
            } catch (err) {
                return false;
            }
        }

        function pushUniqueProperty(list, prop) {
            for (var i = 0; i < list.length; i++) {
                if (list[i] === prop) {
                    return;
                }
            }
            list.push(prop);
        }

        function collectExpressionProperties(prop, pathProps, otherProps) {
            try {
                if (isExpressionDrivenProperty(prop)) {
                    if (isVectorShapeProperty(prop)) {
                        pushUniqueProperty(pathProps, prop);
                    } else {
                        pushUniqueProperty(otherProps, prop);
                    }
                }
            } catch (err) {}
            try {
                for (var i = 1; i <= prop.numProperties; i++) {
                    collectExpressionProperties(prop.property(i), pathProps, otherProps);
                }
            } catch (err2) {}
        }

        function collectVectorShapeProperties(prop, pathProps) {
            try {
                if (isVectorShapeProperty(prop)) {
                    pushUniqueProperty(pathProps, prop);
                }
            } catch (err) {}
            try {
                for (var i = 1; i <= prop.numProperties; i++) {
                    collectVectorShapeProperties(prop.property(i), pathProps);
                }
            } catch (err2) {}
        }

        function cloneArrayValue(value) {
            var result = [];
            for (var i = 0; i < value.length; i++) {
                if (value[i] instanceof Array) {
                    result.push(cloneArrayValue(value[i]));
                } else {
                    result.push(value[i]);
                }
            }
            return result;
        }

        function isUsableShape(shape) {
            try {
                return shape && shape.vertices && shape.inTangents && shape.outTangents &&
                    shape.vertices.length > 0 &&
                    shape.vertices.length === shape.inTangents.length &&
                    shape.vertices.length === shape.outTangents.length;
            } catch (err) {
                return false;
            }
        }

        function makeSafeZeroShape(count, closedPath) {
            var pointCount = Math.max(count || 3, 3);
            var pts = [];
            var tans = [];
            for (var i = 0; i < pointCount; i++) {
                pts.push([0, 0]);
                tans.push([0, 0]);
            }
            var result = new Shape();
            result.vertices = pts;
            result.inTangents = cloneArrayValue(tans);
            result.outTangents = cloneArrayValue(tans);
            result.closed = closedPath !== false;
            return result;
        }

        function cloneShape(shape) {
            try {
                if (!isUsableShape(shape)) {
                    return null;
                }
                var result = new Shape();
                result.vertices = cloneArrayValue(shape.vertices);
                result.inTangents = cloneArrayValue(shape.inTangents);
                result.outTangents = cloneArrayValue(shape.outTangents);
                result.closed = shape.closed;
                return result;
            } catch (err) {
                return null;
            }
        }

        function findPathByVectorGroupName(shapeLayer, groupName) {
            try {
                var root = shapeLayer.property('ADBE Root Vectors Group');
                var group = root.property(groupName);
                if (!group) {
                    return null;
                }
                var contents = group.property('ADBE Vectors Group');
                var pathGroup = contents.property('Path 1');
                if (pathGroup) {
                    return pathGroup.property('ADBE Vector Shape');
                }
                for (var i = 1; i <= contents.numProperties; i++) {
                    var candidate = contents.property(i);
                    if (candidate && candidate.matchName === 'ADBE Vector Shape - Group') {
                        return candidate.property('ADBE Vector Shape');
                    }
                }
            } catch (err) {}
            return null;
        }

        function rootVectorGroupExists(shapeLayer, groupName) {
            try {
                var root = shapeLayer.property('ADBE Root Vectors Group');
                return root.property(groupName) !== null;
            } catch (err) {}
            return false;
        }

        function findCanonicalBodyPaths(shapeLayer) {
            var result = [];
            var names = ['Limb Body', 'Regular Limb', 'Upper Limb', 'Lower Limb', 'Noodle Limb'];
            for (var i = 0; i < names.length; i++) {
                var prop = findPathByVectorGroupName(shapeLayer, names[i]);
                if (prop) {
                    pushUniqueProperty(result, prop);
                }
            }
            return result;
        }

        function getVectorGroupNameForPathProperty(pathProp) {
            try {
                var group = pathProp.propertyGroup(3);
                if (group && group.name) {
                    return group.name;
                }
            } catch (err) {}
            return '';
        }

        function getNoodleModeInfo(ctrlLayer, sampleTime) {
            var info = { hasNoodleMode: false, animated: false, enabled: false };
            try {
                var limbEffect = getLimbControlEffect(ctrlLayer);
                if (!limbEffect) { return info; }
                var noodleMode = limbEffect.property('Noodle Mode');
                if (!noodleMode) { return info; }
                info.hasNoodleMode = true;
                var keyCount = 0;
                try { keyCount = noodleMode.numKeys || 0; } catch (errKeys) { keyCount = 0; }
                if (keyCount > 1) {
                    var firstModeValue = null;
                    var modeChanges = false;
                    for (var k = 1; k <= keyCount; k++) {
                        var keyMode = 0;
                        try { keyMode = noodleMode.keyValue(k) == 1 ? 1 : 0; }
                        catch (errKeyValue) {
                            try { keyMode = noodleMode.valueAtTime(noodleMode.keyTime(k), false) == 1 ? 1 : 0; } catch (errKeyTimeValue) { keyMode = 0; }
                        }
                        if (firstModeValue === null) {
                            firstModeValue = keyMode;
                        } else if (keyMode !== firstModeValue) {
                            modeChanges = true;
                            break;
                        }
                    }
                    info.animated = modeChanges;
                    if (!modeChanges && firstModeValue !== null) {
                        info.enabled = firstModeValue == 1;
                        return info;
                    }
                } else if (keyCount === 1) {
                    try { info.enabled = noodleMode.keyValue(1) == 1; }
                    catch (errSingleKey) {
                        try { info.enabled = noodleMode.valueAtTime(sampleTime, false) == 1; } catch (errSingleTime) {}
                    }
                    return info;
                }
                try { info.enabled = noodleMode.valueAtTime(sampleTime, false) == 1; }
                catch (errValueAtTime) {
                    try { info.enabled = noodleMode.value == 1; } catch (errValue) {}
                }
            } catch (err) {}
            return info;
        }

        function shouldBakeBodyPathForMode(pathProp, noodleInfo) {
            if (!noodleInfo.hasNoodleMode || noodleInfo.animated) { return true; }
            var groupName = getVectorGroupNameForPathProperty(pathProp);
            if (groupName === 'Limb Body') { return true; }
            if (noodleInfo.enabled) { return groupName === 'Noodle Limb'; }
            return groupName === 'Regular Limb' || groupName === 'Upper Limb' || groupName === 'Lower Limb';
        }


        function removeRootVectorGroupByName(shapeLayer, groupName) {
            try {
                var root = shapeLayer.property('ADBE Root Vectors Group');
                var group = root.property(groupName);
                if (group) {
                    group.remove();
                    return 1;
                }
            } catch (err) {}
            return 0;
        }

        function removeNestedVectorGroupByName(parentGroup, groupName) {
            try {
                var contents = parentGroup.property('ADBE Vectors Group');
                var group = contents.property(groupName);
                if (group) {
                    group.remove();
                    return 1;
                }
            } catch (err) {}
            return 0;
        }

        function nameInList(name, names) {
            for (var i = 0; i < names.length; i++) {
                if (name === names[i]) { return true; }
            }
            return false;
        }

        function removeVectorGroupsByNamesInPropertyGroup(propertyGroup, names) {
            var removed = 0;
            if (!propertyGroup) { return removed; }
            try {
                for (var i = propertyGroup.numProperties; i >= 1; i--) {
                    var prop = propertyGroup.property(i);
                    if (prop && prop.matchName === 'ADBE Vector Group') {
                        if (nameInList(prop.name, names)) {
                            prop.remove();
                            removed++;
                        } else {
                            removed += removeVectorGroupsByNamesInPropertyGroup(prop.property('ADBE Vectors Group'), names);
                        }
                    }
                }
            } catch (err) {}
            return removed;
        }

        function removeVectorGroupsByNames(shapeLayer, names) {
            try {
                return removeVectorGroupsByNamesInPropertyGroup(shapeLayer.property('ADBE Root Vectors Group'), names);
            } catch (err) {}
            return 0;
        }

        function removeInactiveGroupsForMode(shapeLayer, noodleInfo) {
            var removed = 0;
            if (!noodleInfo.hasNoodleMode || noodleInfo.animated) {
                return removed;
            }

            if (noodleInfo.enabled) {
                removed += removeVectorGroupsByNames(shapeLayer, [
                    'Regular Limb',
                    'Upper Limb',
                    'Lower Limb',
                    'Regular Stroke Main Range',
                    'Regular Stroke Return Range',
                    'Upper Limb Stroke',
                    'Lower Limb Stroke'
                ]);
            } else {
                var removeRegularFallbacks = rootVectorGroupExists(shapeLayer, 'Regular Limb');
                var inactiveNames = [
                    'Noodle Limb',
                    'Noodle Stroke Main Range',
                    'Noodle Stroke Return Range',
                    'Noodle Right Stroke',
                    'Noodle Left Stroke',
                    'Noodle Shoulder Stroke',
                    'Noodle Wrist Stroke'
                ];
                if (removeRegularFallbacks) {
                    inactiveNames.push('Upper Limb');
                    inactiveNames.push('Lower Limb');
                    inactiveNames.push('Upper Limb Stroke');
                    inactiveNames.push('Lower Limb Stroke');
                }
                removed += removeVectorGroupsByNames(shapeLayer, inactiveNames);
            }
            return removed;
        }

        function freezeRemainingInactivePathsForMode(shapeLayer, noodleInfo, sampleTime) {
            var frozen = 0;
            if (!noodleInfo.hasNoodleMode || noodleInfo.animated) {
                return frozen;
            }
            var names;
            if (noodleInfo.enabled) {
                names = ['Regular Limb', 'Upper Limb', 'Lower Limb'];
            } else {
                names = ['Noodle Limb'];
                if (rootVectorGroupExists(shapeLayer, 'Regular Limb')) {
                    names.push('Upper Limb');
                    names.push('Lower Limb');
                }
            }
            for (var i = 0; i < names.length; i++) {
                var pathProp = findPathByVectorGroupName(shapeLayer, names[i]);
                if (pathProp) {
                    freezePathPropertyAtTime(pathProp, sampleTime);
                    frozen++;
                }
            }
            return frozen;
        }

        function freezePathPropertyAtTime(pathProp, sampleTime) {
            var shape = null;
            try { shape = cloneShape(pathProp.valueAtTime(sampleTime, false)); } catch (errValue) {}
            if (!isUsableShape(shape)) { shape = makeSafeZeroShape(3, true); }
            clearExpressionAndKeys(pathProp);
            try { pathProp.setValue(shape); }
            catch (errSet) {
                throw new Error('Failed to freeze inactive path "' + getVectorGroupNameForPathProperty(pathProp) + '". ' + errSet.toString());
            }
        }

        function cloneValue(value) {
            try {
                if (value && value.vertices && value.inTangents && value.outTangents) {
                    var shapeClone = cloneShape(value);
                    return shapeClone ? shapeClone : makeSafeZeroShape(3, true);
                }
            } catch (err) {}
            if (value instanceof Array) { return cloneArrayValue(value); }
            return value;
        }

        function clearExpressionAndKeys(prop) {
            try {
                prop.expressionEnabled = false;
            } catch (err) {}
            try {
                prop.expression = '';
            } catch (err2) {}
            try {
                while (prop.numKeys > 0) {
                    prop.removeKey(1);
                }
            } catch (err3) {}
        }

        function valuesNearlyEqual(a, b) {
            if (a instanceof Array && b instanceof Array) {
                if (a.length !== b.length) { return false; }
                for (var i = 0; i < a.length; i++) {
                    if (!valuesNearlyEqual(a[i], b[i])) { return false; }
                }
                return true;
            }
            if (typeof a === 'number' && typeof b === 'number') {
                return Math.abs(a - b) < 0.0001;
            }
            return a === b;
        }

        function propertyKeysActuallyChange(prop) {
            var keyCount = 0;
            try { keyCount = prop.numKeys || 0; } catch (errCount) { keyCount = 0; }
            if (keyCount < 2) { return false; }
            var firstValue;
            try { firstValue = prop.keyValue(1); } catch (errFirst) { return true; }
            for (var i = 2; i <= keyCount; i++) {
                try {
                    if (!valuesNearlyEqual(firstValue, prop.keyValue(i))) { return true; }
                } catch (errValue) {
                    return true;
                }
            }
            return false;
        }

        function effectControlHasChangingKeys(ctrlLayer, controlName) {
            try {
                var limbEffect = getLimbControlEffect(ctrlLayer);
                if (!limbEffect) { return false; }
                var controlProp = limbEffect.property(controlName);
                if (!controlProp) { return false; }
                return propertyKeysActuallyChange(controlProp);
            } catch (err) {}
            return false;
        }

        function expressionPropertyDriverNames(prop) {
            var matchName = '';
            try { matchName = prop.matchName; } catch (err) { matchName = ''; }

            if (matchName === 'ADBE Vector Fill Color') { return ['Arm Fill Color']; }
            if (matchName === 'ADBE Vector Fill Opacity') { return ['Arm Fill Opacity']; }
            if (matchName === 'ADBE Vector Stroke Color') { return ['Arm Stroke Color']; }
            if (matchName === 'ADBE Vector Stroke Width') { return ['Arm Stroke Width', 'Noodle Mode']; }
            if (matchName === 'ADBE Vector Trim Start' || matchName === 'ADBE Vector Trim End' || matchName === 'ADBE Vector Trim Offset') {
                return ['Shoulder Stroke', 'Wrist Stroke', 'Noodle Mode'];
            }
            return null;
        }

        function expressionPropertyNeedsAnimatedBake(prop, ctrlLayer) {
            var driverNames = expressionPropertyDriverNames(prop);
            if (driverNames === null) { return true; }
            for (var i = 0; i < driverNames.length; i++) {
                if (effectControlHasChangingKeys(ctrlLayer, driverNames[i])) { return true; }
            }
            return false;
        }

        function collectExpressionPropertyDriverTimes(prop, ctrlLayer, comp) {
            var result = [];
            var driverNames = expressionPropertyDriverNames(prop);
            if (driverNames === null) { return result; }
            var limbEffect = null;
            try { limbEffect = getLimbControlEffect(ctrlLayer); } catch (errEffect) { limbEffect = null; }
            if (!limbEffect) { return result; }
            for (var i = 0; i < driverNames.length; i++) {
                try {
                    var controlProp = limbEffect.property(driverNames[i]);
                    if (controlProp && propertyKeysActuallyChange(controlProp)) {
                        collectKeyTimes(controlProp, result);
                    }
                } catch (errControl) {}
            }
            return sortUniqueFrameTimes(result, comp);
        }

        function setExpressionPropertyStaticValue(prop, sampleTime) {
            var value = cloneValue(prop.valueAtTime(sampleTime, false));
            clearExpressionAndKeys(prop);
            try { prop.setValue(value); }
            catch (errSetStatic) {
                throw new Error('Failed while setting static baked value for "' + prop.name + '". ' + errSetStatic.toString());
            }
            return 0;
        }

        function distance2D(a, b) {
            var dx = a[0] - b[0];
            var dy = a[1] - b[1];
            return Math.sqrt(dx * dx + dy * dy);
        }

        function lerpPoint(a, b, t) {
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        }

        function canCompareShapes(a, b) {
            return a && b && a.vertices && b.vertices &&
                a.vertices.length === b.vertices.length &&
                a.inTangents.length === b.inTangents.length &&
                a.outTangents.length === b.outTangents.length &&
                a.closed === b.closed;
        }

        function lerpShape(a, b, t) {
            if (!canCompareShapes(a, b)) {
                return null;
            }
            var vertices = [];
            var inTangents = [];
            var outTangents = [];
            for (var i = 0; i < a.vertices.length; i++) {
                vertices.push(lerpPoint(a.vertices[i], b.vertices[i], t));
                inTangents.push(lerpPoint(a.inTangents[i], b.inTangents[i], t));
                outTangents.push(lerpPoint(a.outTangents[i], b.outTangents[i], t));
            }
            if (vertices.length < 1) {
                return null;
            }
            var shape = new Shape();
            shape.vertices = vertices;
            shape.inTangents = inTangents;
            shape.outTangents = outTangents;
            shape.closed = a.closed;
            return shape;
        }

        function shapeError(a, b) {
            if (!canCompareShapes(a, b)) {
                return 999999;
            }
            var maxError = 0;
            var tangentWeight = 0.25;
            var i;
            for (i = 0; i < a.vertices.length; i++) {
                maxError = Math.max(maxError, distance2D(a.vertices[i], b.vertices[i]));
                maxError = Math.max(maxError, distance2D(a.inTangents[i], b.inTangents[i]) * tangentWeight);
                maxError = Math.max(maxError, distance2D(a.outTangents[i], b.outTangents[i]) * tangentWeight);
            }
            return maxError;
        }


        function simplifyBakeKeyRange(times, values, keep, startIndex, endIndex, threshold) {
            if (endIndex <= startIndex + 1) {
                return;
            }
            if (!canCompareShapes(values[startIndex], values[endIndex])) {
                for (var ci = startIndex + 1; ci < endIndex; ci++) {
                    keep[ci] = true;
                }
                return;
            }
            var duration = times[endIndex] - times[startIndex];
            if (duration <= 0.000001) {
                return;
            }
            var maxError = -1;
            var maxIndex = -1;
            for (var i = startIndex + 1; i < endIndex; i++) {
                var t = (times[i] - times[startIndex]) / duration;
                var expected = lerpShape(values[startIndex], values[endIndex], t);
                var error = expected ? shapeError(values[i], expected) : 999999;
                if (error > maxError) {
                    maxError = error;
                    maxIndex = i;
                }
            }
            if (maxIndex >= 0 && maxError > threshold) {
                keep[maxIndex] = true;
                simplifyBakeKeyRange(times, values, keep, startIndex, maxIndex, threshold);
                simplifyBakeKeyRange(times, values, keep, maxIndex, endIndex, threshold);
            }
        }

        function simplifyBakeKeys(times, values, threshold) {
            if (times.length <= 2) {
                return { times: times, values: values };
            }
            var keep = [];
            var i;
            for (i = 0; i < times.length; i++) {
                keep.push(false);
            }
            keep[0] = true;
            keep[times.length - 1] = true;
            simplifyBakeKeyRange(times, values, keep, 0, times.length - 1, threshold);
            var simplifiedTimes = [];
            var simplifiedValues = [];
            for (i = 0; i < times.length; i++) {
                if (keep[i]) {
                    simplifiedTimes.push(times[i]);
                    simplifiedValues.push(values[i]);
                }
            }
            return { times: simplifiedTimes, values: simplifiedValues };
        }

        function addAdaptiveBakeSegment(pathProp, t0, shape0, t1, shape1, times, values, threshold, minStep, depth, maxDepth) {
            if (t1 <= t0 + 0.000001) {
                return;
            }
            var midTime = (t0 + t1) / 2;
            var actualMid = cloneShape(pathProp.valueAtTime(midTime, false));
            if (!isUsableShape(actualMid)) {
                times.push(t1);
                values.push(shape1);
                return;
            }
            var expectedMid = lerpShape(shape0, shape1, 0.5);
            var error = expectedMid ? shapeError(actualMid, expectedMid) : 999999;

            if (error > threshold && depth < maxDepth && (t1 - t0) > minStep) {
                addAdaptiveBakeSegment(pathProp, t0, shape0, midTime, actualMid, times, values, threshold, minStep, depth + 1, maxDepth);
                addAdaptiveBakeSegment(pathProp, midTime, actualMid, t1, shape1, times, values, threshold, minStep, depth + 1, maxDepth);
            } else {
                times.push(t1);
                values.push(shape1);
            }
        }

        function bakePathProperty(pathProp, sourceTimes, comp) {
            var sampleTimes = buildFrameSampleTimes(sourceTimes, comp);
            var sampleValues = [];
            var threshold = 2.25;
            var i;

            if (sampleTimes.length === 0) {
                return 0;
            }

            for (i = 0; i < sampleTimes.length; i++) {
                var sampleShape = cloneShape(pathProp.valueAtTime(sampleTimes[i], false));
                if (!isUsableShape(sampleShape)) {
                    throw new Error('A limb path evaluated to an empty/invalid shape at ' + sampleTimes[i] + 's. The expression must return a Shape with at least one vertex before it can be baked.');
                }
                sampleValues.push(sampleShape);
            }

            var simplified = simplifyBakeKeys(sampleTimes, sampleValues, threshold);
            var validTimes = sortUniqueFrameTimes(simplified.times, comp);
            var validValues = [];
            for (i = 0; i < validTimes.length; i++) {
                var valueAtFrame = null;
                for (var j = 0; j < simplified.times.length; j++) {
                    if (Math.abs(validTimes[i] - snapTimeToFrame(comp, simplified.times[j])) < 0.00001) {
                        valueAtFrame = simplified.values[j];
                        break;
                    }
                }
                if (!isUsableShape(valueAtFrame)) {
                    valueAtFrame = cloneShape(pathProp.valueAtTime(validTimes[i], false));
                }
                if (!isUsableShape(valueAtFrame)) {
                    throw new Error('The bake produced an invalid path shape at ' + validTimes[i] + 's.');
                }
                validValues.push(valueAtFrame);
            }

            if (validValues.length === 0) {
                throw new Error('The bake produced no valid path shapes.');
            }

            clearExpressionAndKeys(pathProp);

            if (validValues.length === 1) {
                try {
                    pathProp.setValue(validValues[0]);
                } catch (errOnePath) {
                    throw new Error('Failed while setting baked static path. Vertex count: ' + validValues[0].vertices.length + '. ' + errOnePath.toString());
                }
                return 0;
            }

            for (i = 0; i < validTimes.length; i++) {
                try {
                    pathProp.setValueAtTime(validTimes[i], validValues[i]);
                } catch (errSetPath) {
                    throw new Error('Failed while setting baked path key ' + (i + 1) + ' at ' + validTimes[i] + 's. Vertex count: ' + validValues[i].vertices.length + '. ' + errSetPath.toString());
                }
            }
            for (i = 1; i <= pathProp.numKeys; i++) {
                try {
                    pathProp.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
                } catch (err3) {}
            }
            return validTimes.length;
        }

        function bakeSimpleExpressionProperty(prop, sourceTimes, ctrlLayer, comp) {
            if (sourceTimes.length === 0) {
                return 0;
            }
            var staticSampleTime = sourceTimes[0];
            try { staticSampleTime = comp.time; } catch (errCompTime) {}

            var bakeTimes = sourceTimes;
            var driverNames = expressionPropertyDriverNames(prop);
            if (driverNames !== null) {
                bakeTimes = collectExpressionPropertyDriverTimes(prop, ctrlLayer, comp);
                if (bakeTimes.length === 0) {
                    return setExpressionPropertyStaticValue(prop, staticSampleTime);
                }
            } else if (!expressionPropertyNeedsAnimatedBake(prop, ctrlLayer)) {
                return setExpressionPropertyStaticValue(prop, staticSampleTime);
            }

            var values = [];
            var i;
            for (i = 0; i < bakeTimes.length; i++) {
                values.push(cloneValue(prop.valueAtTime(bakeTimes[i], false)));
            }

            clearExpressionAndKeys(prop);

            if (bakeTimes.length === 1) {
                try {
                    prop.setValue(values[0]);
                    return 0;
                } catch (errSet) {}
            }

            var keyCount = 0;
            for (i = 0; i < bakeTimes.length; i++) {
                try {
                    prop.setValueAtTime(bakeTimes[i], values[i]);
                    keyCount++;
                } catch (errKey) {
                    try {
                        prop.setValue(values[i]);
                    } catch (errValue) {}
                }
            }
            for (i = 1; i <= prop.numKeys; i++) {
                try {
                    prop.setInterpolationTypeAtKey(i, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
                } catch (errInterp) {}
            }
            return keyCount;
        }

        function intelligentBakeLimb(comp, shapeLayer, ctrlLayer) {
            var sourceTimes = [];
            collectLayerChainKeyTimes(ctrlLayer, sourceTimes);
            collectTransformChainKeyTimes(shapeLayer, sourceTimes);
            sourceTimes = sortUniqueFrameTimes(sourceTimes, comp);

            if (sourceTimes.length === 0) {
                return {
                    pathCount: 0,
                    pathKeyCount: 0,
                    otherCount: 0,
                    otherKeyCount: 0,
                    reason: 'No keyframes were found on the controller/limb layer chain.'
                };
            }

            var collectedPathProps = [];
            var collectedOtherProps = [];
            collectExpressionProperties(shapeLayer, collectedPathProps, collectedOtherProps);

            var pathProps = findCanonicalBodyPaths(shapeLayer);
            if (pathProps.length === 0 && collectedPathProps.length > 0) {
                for (var cp = 0; cp < collectedPathProps.length; cp++) {
                    pushUniqueProperty(pathProps, collectedPathProps[cp]);
                }
            }

            if (pathProps.length === 0) {
                return {
                    pathCount: 0,
                    pathKeyCount: 0,
                    otherCount: 0,
                    otherKeyCount: 0,
                    reason: 'No bakeable limb body paths were found on the limb layer.'
                };
            }

            var noodleInfo = getNoodleModeInfo(ctrlLayer, sourceTimes[0]);
            var activePathProps = [];
            var inactivePathProps = [];
            var i;
            for (i = 0; i < pathProps.length; i++) {
                if (shouldBakeBodyPathForMode(pathProps[i], noodleInfo)) { pushUniqueProperty(activePathProps, pathProps[i]); }
                else { pushUniqueProperty(inactivePathProps, pathProps[i]); }
            }
            if (activePathProps.length > 0) { pathProps = activePathProps; }
            if (noodleInfo.hasNoodleMode && !noodleInfo.animated && !noodleInfo.enabled && rootVectorGroupExists(shapeLayer, 'Regular Limb')) {
                var regularOnlyPathProps = [];
                for (i = 0; i < pathProps.length; i++) {
                    if (getVectorGroupNameForPathProperty(pathProps[i]) === 'Regular Limb') {
                        pushUniqueProperty(regularOnlyPathProps, pathProps[i]);
                    }
                }
                if (regularOnlyPathProps.length > 0) { pathProps = regularOnlyPathProps; }
            }

            var totalPathKeys = 0;
            var totalOtherKeys = 0;
            for (i = 0; i < pathProps.length; i++) {
                totalPathKeys += bakePathProperty(pathProps[i], sourceTimes, comp);
            }

            var removedGroupCount = removeInactiveGroupsForMode(shapeLayer, noodleInfo);
            var frozenInactiveCount = freezeRemainingInactivePathsForMode(shapeLayer, noodleInfo, sourceTimes[0]);
            if (removedGroupCount === 0 && frozenInactiveCount === 0) {
                for (i = 0; i < inactivePathProps.length; i++) {
                    freezePathPropertyAtTime(inactivePathProps[i], sourceTimes[0]);
                }
            }

            var freshPathProps = [];
            var otherProps = [];
            collectExpressionProperties(shapeLayer, freshPathProps, otherProps);
            for (i = 0; i < otherProps.length; i++) {
                totalOtherKeys += bakeSimpleExpressionProperty(otherProps[i], sourceTimes, ctrlLayer, comp);
            }

            var controllerRemoved = false;
            try {
                ctrlLayer.locked = false;
            } catch (errUnlock) {}
            try {
                ctrlLayer.remove();
                controllerRemoved = true;
            } catch (errRemove) {}

            return {
                pathCount: pathProps.length,
                pathKeyCount: totalPathKeys,
                otherCount: otherProps.length,
                otherKeyCount: totalOtherKeys,
                removedGroupCount: removedGroupCount,
                controllerRemoved: controllerRemoved,
                reason: controllerRemoved ? '' : 'Path baking completed, but the controller layer could not be removed. Check whether the controller is locked or protected.'
            };
        }

        function askBakeAnimation(limbName) {
            var result = false;
            try {
                var dialog = new Window('dialog', 'Limb-a-tron');
                dialog.orientation = 'column';
                dialog.alignChildren = ['fill', 'top'];
                var message = dialog.add('statictext', undefined, 'Bake the animation for "' + limbName + '"?');
                message.characters = 36;
                var note = dialog.add('statictext', undefined, 'This will bake the generated limb path and remove the controller layer.');
                note.characters = 46;
                var buttons = dialog.add('group');
                buttons.alignment = 'right';
                var yesButton = buttons.add('button', undefined, 'Yes');
                var noButton = buttons.add('button', undefined, 'No');
                yesButton.onClick = function () {
                    result = true;
                    dialog.close();
                };
                noButton.onClick = function () {
                    result = false;
                    dialog.close();
                };
                dialog.center();
                dialog.show();
                return result;
            } catch (err) {
                return confirm('Bake the animation for "' + limbName + '"?');
            }
        }

        function handleSelectedLayerMode(comp) {
            var info = getSelectedLimbInfo(comp);
            if (!info) {
                alert('The selected layer is not part of a Limb-a-tron rig. Deselect all layers to create a new limb.');
                return true;
            }

            if (!layerChainHasKeys(info.ctrlLayer) && !layerChainHasKeys(info.shapeLayer)) {
                alert('Found the Limb-a-tron rig, but there are no keyframes on the controller/limb layer chain.');
                return true;
            }

            if (!askBakeAnimation(info.limbName)) {
                return true;
            }

            var bakeResult = null;
            var undoOpen = false;
            try {
                app.beginUndoGroup('Limb-a-tron Intelligent Bake');
                undoOpen = true;
                bakeResult = intelligentBakeLimb(comp, info.shapeLayer, info.ctrlLayer);
                app.endUndoGroup();
                undoOpen = false;
            } catch (errBake) {
                try {
                    if (undoOpen) {
                        app.endUndoGroup();
                    }
                } catch (errUndo) {}
                alert('Bake failed before the controller could be removed.\n\n' + errBake.toString());
                return true;
            }

            if (bakeResult.pathCount === 0) {
                alert(bakeResult.reason);
            } else if (!bakeResult.controllerRemoved) {
                alert('Baked ' + bakeResult.pathCount + ' body path property/properties with ' + bakeResult.pathKeyCount + ' path keyframes.\nRemoved ' + bakeResult.removedGroupCount + ' inactive limb/stroke group(s).\n\n' + bakeResult.reason);
            } else {
                alert('Baked ' + bakeResult.pathCount + ' body path property/properties with ' + bakeResult.pathKeyCount + ' path keyframes.\nRemoved ' + bakeResult.removedGroupCount + ' inactive limb/stroke group(s).\nRemoved the controller layer.');
            }
            return true;
        }

        var activeComp = app.project.activeItem;
        if (!(activeComp && activeComp instanceof CompItem)) {
            alert('Please select a composition.');
            return;
        }
        if (activeComp.selectedLayers.length > 0) {
            handleSelectedLayerMode(activeComp);
            return;
        }

        // Create UI for name input
        var win = new Window('dialog', 'Name the Limb');
        var nameInput = win.add('edittext', undefined, '');
        nameInput.characters = 20;
        var buttonGroup = win.add('group');
        var okButton = buttonGroup.add('button', undefined, 'OK');
        var cancelButton = buttonGroup.add('button', undefined, 'Cancel');

        // Handle OK button click
        okButton.onClick = function () {
            var limbName = nameInput.text;
            if (limbName === '') {
                alert('Please enter a name.');
                return;
            }

            win.close();

            app.beginUndoGroup('Limb-a-tron');

            var comp = app.project.activeItem;
            if (!(comp && comp instanceof CompItem)) {
                alert('Please select a composition.');
                return;
            }

            // Create shape layer
            var shapeLayer = comp.layers.addShape();
            shapeLayer.name = limbName;
            shapeLayer.comment = 'Limb-a-tron limb';
            shapeLayer
                .property('ADBE Transform Group')
                .property('ADBE Position')
                .setValue([comp.width / 2, comp.height / 2]);

            // Add Regular Limb shape group. This is the unified regular/angular renderer.
            // It replaces separate upper/lower body paths so baked regular limbs cannot drift apart at the elbow.
            var regularLimb = shapeLayer
                .property('ADBE Root Vectors Group')
                .addProperty('ADBE Vector Group');
            regularLimb.name = 'Regular Limb';
            var regularLimbPath = regularLimb
                .property('ADBE Vectors Group')
                .addProperty('ADBE Vector Shape - Group');
            regularLimbPath.property('ADBE Vector Shape').setValue(makeSafeZeroShape(8, true));
            regularLimbPath.property('ADBE Vector Shape').expression = getExpression(
                'regularLimbExpression',
                limbName
            );

            var regularLimbFill = regularLimb
                .property('ADBE Vectors Group')
                .addProperty('ADBE Vector Graphic - Fill');
            regularLimbFill.property('ADBE Vector Fill Color').expression = getExpression(
                'armFillColorExpression',
                limbName
            );
            regularLimbFill.property('ADBE Vector Fill Opacity').expression = getExpression(
                'armFillOpacityExpression',
                limbName
            );

            // Add Noodle Limb shape group. This is a higher-resolution sampled tube.
            // It stays collapsed while Noodle Mode is off.
            var noodleLimb = shapeLayer
                .property('ADBE Root Vectors Group')
                .addProperty('ADBE Vector Group');
            noodleLimb.name = 'Noodle Limb';
            var noodleLimbPath = noodleLimb
                .property('ADBE Vectors Group')
                .addProperty('ADBE Vector Shape - Group');
            noodleLimbPath.property('ADBE Vector Shape').setValue(makeSafeZeroShape(3, true));
            noodleLimbPath.property('ADBE Vector Shape').expression = getExpression(
                'noodleLimbExpression',
                limbName
            );

            var noodleLimbFill = noodleLimb
                .property('ADBE Vectors Group')
                .addProperty('ADBE Vector Graphic - Fill');
            noodleLimbFill.property('ADBE Vector Fill Color').expression = getExpression(
                'armFillColorExpression',
                limbName
            );
            noodleLimbFill.property('ADBE Vector Fill Opacity').expression = getExpression(
                'armFillOpacityExpression',
                limbName
            );
            try {
                noodleLimbFill.property('ADBE Vector Fill Rule').setValue(1);
            } catch (errNoodleFillRule) {}

            // Create Arm Stroke group
            var armStroke = shapeLayer
                .property('ADBE Root Vectors Group')
                .addProperty('ADBE Vector Group');
            armStroke.name = 'Arm Stroke';

            function addLinkedStrokePass(parentGroup, passName, pathExpressionName, widthExpressionName, startExpressionName, endExpressionName, offsetExpressionName) {
                var passGroup = parentGroup
                    .property('ADBE Vectors Group')
                    .addProperty('ADBE Vector Group');
                passGroup.name = passName;

                var passPath = passGroup
                    .property('ADBE Vectors Group')
                    .addProperty('ADBE Vector Shape - Group');
                passPath.property('ADBE Vector Shape').setValue(makeSafeZeroShape(3, true));
                passPath.property('ADBE Vector Shape').expression = getExpression(
                    pathExpressionName,
                    limbName
                );

                var passStroke = passGroup
                    .property('ADBE Vectors Group')
                    .addProperty('ADBE Vector Graphic - Stroke');
                passStroke.property('ADBE Vector Stroke Color').expression = getExpression(
                    'armStrokeColorExpression',
                    limbName
                );
                passStroke.property('ADBE Vector Stroke Width').expression = getExpression(
                    widthExpressionName,
                    limbName
                );
                passStroke.property('ADBE Vector Stroke Line Cap').setValue(2); // Round Cap
                passStroke.property('ADBE Vector Stroke Line Join').setValue(2); // Round Join

                if (startExpressionName || endExpressionName || offsetExpressionName) {
                    var passTrim = passGroup
                        .property('ADBE Vectors Group')
                        .addProperty('ADBE Vector Filter - Trim');
                    if (startExpressionName) {
                        passTrim.property('ADBE Vector Trim Start').expression = getExpression(
                            startExpressionName,
                            limbName
                        );
                    }
                    if (endExpressionName) {
                        passTrim.property('ADBE Vector Trim End').expression = getExpression(
                            endExpressionName,
                            limbName
                        );
                    }
                    if (offsetExpressionName) {
                        passTrim.property('ADBE Vector Trim Offset').expression = getExpression(
                            offsetExpressionName,
                            limbName
                        );
                    }
                }
            }

            // Noodle outline uses lightweight linked stroke passes. The path expression is only on Noodle Limb > Path 1.
            addLinkedStrokePass(
                armStroke,
                'Noodle Stroke Main Range',
                'noodleBodyPathReferenceExpression',
                'noodleArmStrokeWidthExpression',
                'noodleStrokeRange1StartExpression',
                'noodleStrokeRange1EndExpression',
                null
            );
            addLinkedStrokePass(
                armStroke,
                'Noodle Stroke Return Range',
                'noodleBodyPathReferenceExpression',
                'noodleArmStrokeWidthExpression',
                'noodleStrokeRange2StartExpression',
                'noodleStrokeRange2EndExpression',
                null
            );

            // Regular outline uses lightweight linked stroke passes from the unified Regular Limb path.
            addLinkedStrokePass(
                armStroke,
                'Regular Stroke Main Range',
                'regularBodyPathReferenceExpression',
                'regularArmStrokeWidthExpression',
                'regularStrokeRange1StartExpression',
                'regularStrokeRange1EndExpression',
                null
            );
            addLinkedStrokePass(
                armStroke,
                'Regular Stroke Return Range',
                'regularBodyPathReferenceExpression',
                'regularArmStrokeWidthExpression',
                'regularStrokeRange2StartExpression',
                'regularStrokeRange2EndExpression',
                null
            );

            // Create null layer
            var nullLayer = comp.layers.addNull();
            nullLayer.name = limbName + ' CTRL';
            nullLayer.comment = 'Limb-a-tron controller; limb=' + limbName;
            shapeLayer.comment = 'Limb-a-tron limb; controller=' + nullLayer.name;
            nullLayer
                .property('ADBE Transform Group')
                .property('ADBE Position')
                .setValue([comp.width / 2, comp.height / 2 + 100]);

            // Add pseudo effect to null layer
            var binaryData =
				'RIFX\x00\x00p\x0EFaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00o\u00EAbescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x0ELimb Controls\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00nhsspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00-\x00parTparn\x00\x00\x00\x04\x00\x00\x008tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rDimensions\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rUpper Limb\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUpper Limb Length\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUpper Limb Top Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00BH\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUpper Limb Top Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUpper Limb Bottom Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00A\u00F0\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUpper Limb Bottom Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0008\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04UL Enable Side Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0009\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04UL Enable Inverse Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0010\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUL Side Curvature Center Point\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0011\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUL Side Curvature Bend\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C4z\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0012\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nUL Left/Right Side Weight\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0013\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0014\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rLower Limb\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0015\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLower Limb Length\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0016\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLower Limb Top Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00A\u00F0\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0017\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLower Limb Top Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0018\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLower Limb Bottom Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00Ap\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0019\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLower Limb Bottom Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0020\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04LL Enable Side Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0021\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04LL Enable Inverse Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0022\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLL Side Curvature Center Point\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0023\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLL Side Curvature Bend\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C4z\x00\x00Dz\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0024\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nLL Left/Right Side Weight\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0025\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0026\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0027\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rNoodle\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0028\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Noodle Mode\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0029\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nNoodle Curvature\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C3H\x00\x00C\u00FA\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0030\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nNoodle Tension\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u0096\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0031\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0032\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rParenting Data\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0033\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06IK Angles\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0034\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06Elbow (comp space)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0035\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06Elbow (layer space)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0036\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06Wrist  (comp space)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0037\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06Wrist  (layer space)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0038\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06Proximity / Pop Prevent Factor\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0039\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06Adjusted U/L Limb Lengths\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0040\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0041\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rAppearance\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0042\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Arm Fill Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0043\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nArm Fill Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0044\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Arm Stroke Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0045\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nArm Stroke Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00FA\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0046\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Shoulder Stroke\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0047\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Wrist Stroke\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0048\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0049\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\rFK\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0050\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Disable IK\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0051\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03Upper Limb Angle\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0052\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03Lower Limb Angle\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0053\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0054\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nIK Direction\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\u00C2\u00C8\x00\x00B\u00C8\x00\x00\u00C2\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0055\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nPop Prevent\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00A\x1Ctdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BDimensions\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BUpper Limb\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Upper Limb Length\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Upper Limb Top Width\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@I\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x19Upper Limb Top Curvature\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x04tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x18Upper Limb Bottom Width\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@>\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\btdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1CUpper Limb Bottom Curvature\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0008\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x19UL Enable Side Curvature\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0009\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1CUL Enable Inverse Curvature\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0010\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\ftdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1FUL Side Curvature Center Point\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\u00C0Y\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0011\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x04tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17UL Side Curvature Bend\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0012\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1AUL Left/Right Side Weight\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\u00C0Y\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0013\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0014\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BLower Limb\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0015\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Lower Limb Length\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0016\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Lower Limb Top Width\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@>\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0017\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x19Lower Limb Top Curvature\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0018\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x04tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x18Lower Limb Bottom Width\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@.\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0019\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\btdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1CLower Limb Bottom Curvature\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0020\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x19LL Enable Side Curvature\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0021\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1CLL Enable Inverse Curvature\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0022\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\ftdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1FLL Side Curvature Center Point\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\u00C0Y\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0023\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x04tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17LL Side Curvature Bend\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0024\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1ALL Left/Right Side Weight\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\u00C0Y\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0025\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0026\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0027\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Noodle\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0028\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\fNoodle Mode\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0029\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Noodle Curvature\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0030\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FNoodle Tension\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0031\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0032\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FParenting Data\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0033\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\nIK Angles\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0034\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x13Elbow (comp space)\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0035\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Elbow (layer space)\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0036\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Wrist  (comp space)\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0037\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00EAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Wrist  (layer space)\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0038\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1FProximity / Pop Prevent Factor\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0039\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00EEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1AAdjusted U/L Limb Lengths\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x02\x00\x0F\x00\x03\u00FF\u00FF\u00FF\u00FF\x00\x00]\u00A8=\u009B|\u00DF\u00D9\u00D7\u00BD\u00BC?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x06\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0040\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0041\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BAppearance\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0042\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x14tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FArm Fill Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0043\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Arm Fill Opacity\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0044\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x16tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Arm Stroke Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0045\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Arm Stroke Width\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0046\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x10Shoulder Stroke\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0047\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\rWrist Stroke\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0048\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0049\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x03FK\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0050\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BDisable IK\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0051\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Upper Limb Angle\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0052\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Lower Limb Angle\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0053\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ELimb Controls\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/LimbControlsV3-0054\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\rIK Direction\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\u00C0Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\u00C0Y\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/LimbControlsV3-0055\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\fPop Prevent\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{"controlName":"Limb Controls","matchname":"Pseudo/LimbControlsV3","controlArray":[{"name":"Dimensions","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":2610712937,"hold":false,"children":[\n\n],"open":false,"error":[\n\n]},{"name":"Upper Limb","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":4524689371,"hold":false,"children":[\n\n],"open":false,"error":[\n\n]},{"name":"Upper Limb Length","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":6221072049,"hold":false,"default":100,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Upper Limb Top Width","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":5302406533,"hold":false,"default":50,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Upper Limb Top Curvature","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":3059736784,"hold":false,"default":100,"sliderMax":100,"sliderMin":0,"validMax":100,"validMin":0,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Upper Limb Bottom Width","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":4288674835,"hold":false,"default":30,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Upper Limb Bottom Curvature","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":3243364586,"hold":false,"default":100,"sliderMax":100,"sliderMin":0,"validMax":100,"validMin":0,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"UL Enable Side Curvature","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":false,"keyframes":true,"id":6781376834,"hold":true,"label":"","error":[\n\n]},{"name":"UL Enable Inverse Curvature","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":false,"keyframes":true,"id":7804939527,"hold":true,"label":"","error":[\n\n]},{"name":"UL Side Curvature Center Point","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":5319191347,"hold":false,"default":0,"sliderMax":100,"sliderMin":-100,"validMax":100,"validMin":-100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"UL Side Curvature Bend","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":6485938355,"hold":false,"default":0,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":-1000,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"UL Left/Right Side Weight","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":9746752387,"hold":false,"default":0,"sliderMax":100,"sliderMin":-100,"validMax":100,"validMin":-100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"EndGroup","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":3970225895,"groupId":0,"error":[\n\n]},{"name":"Lower Limb","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":2051090864,"hold":false,"children":[\n\n],"open":true,"error":[\n\n]},{"name":"Lower Limb Length","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":8017920015,"hold":false,"default":100,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Lower Limb Top Width","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":2020798088,"hold":false,"default":30,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Lower Limb Top Curvature","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":5210423003,"hold":false,"default":100,"sliderMax":100,"sliderMin":0,"validMax":100,"validMin":0,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Lower Limb Bottom Width","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":8027887234,"hold":false,"default":15,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Lower Limb Bottom Curvature","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":7899385580,"hold":false,"default":0,"sliderMax":100,"sliderMin":0,"validMax":100,"validMin":0,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"LL Enable Side Curvature","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":false,"keyframes":true,"id":4831922281,"hold":true,"label":"","error":[\n\n]},{"name":"LL Enable Inverse Curvature","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":false,"keyframes":true,"id":4261763522,"hold":true,"label":"","error":[\n\n]},{"name":"LL Side Curvature Center Point","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":4945787220,"hold":false,"default":0,"sliderMax":100,"sliderMin":-100,"validMax":100,"validMin":-100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"LL Side Curvature Bend","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":2092104533,"hold":false,"default":0,"sliderMax":100,"sliderMin":0,"validMax":1000,"validMin":-1000,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"LL Left/Right Side Weight","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":1881965536,"hold":false,"default":0,"sliderMax":100,"sliderMin":-100,"validMax":100,"validMin":-100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"EndGroup","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":1364823393,"groupId":0,"error":[\n\n]},{"name":"EndGroup 1","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":1974848903,"groupId":0,"error":[\n\n]},{"name":"Noodle","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":4618568753,"hold":false,"children":[\n\n],"open":false,"error":[\n\n]},{"name":"Noodle Mode","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":false,"keyframes":true,"id":3867826310,"hold":true,"label":"","error":[\n\n]},{"name":"Noodle Curvature","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":6084697098,"hold":false,"default":0,"sliderMax":200,"sliderMin":0,"validMax":500,"validMin":-200,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Noodle Tension","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":8665122890,"hold":false,"default":0,"sliderMax":200,"sliderMin":0,"validMax":300,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":true,"errors":[\n\n],"error":[\n\n]},{"name":"EndGroup 6","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":9112730868,"groupId":0,"error":[\n\n]},{"name":"Parenting Data","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":4943924837,"hold":false,"children":[\n\n],"open":false,"error":[\n\n]},{"name":"IK Angles","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":3879658467,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"Elbow (comp space)","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":3183775319,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"Elbow (layer space)","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":6699423579,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"Wrist  (comp space)","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":1722176766,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"Wrist  (layer space)","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":2889117909,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"Proximity / Pop Prevent Factor","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":3919530274,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"Adjusted U/L Limb Lengths","type":"point","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":2293324987,"hold":false,"percentX":0,"percentY":0,"error":[\n\n]},{"name":"EndGroup 3","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":7967276841,"groupId":0,"error":[\n\n]},{"name":"Appearance","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":9299794378,"hold":false,"children":[\n\n],"open":false,"error":[\n\n]},{"name":"Arm Fill Color","type":"color","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"red":255,"green":0,"blue":0,"keyframes":true,"id":2076740842,"hold":false,"error":[\n\n]},{"name":"Arm Fill Opacity","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":5005848599,"hold":false,"default":100,"sliderMax":100,"sliderMin":0,"validMax":100,"validMin":0,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Arm Stroke Color","type":"color","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"red":255,"green":0,"blue":0,"keyframes":true,"id":3972336304,"hold":false,"error":[\n\n]},{"name":"Arm Stroke Width","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":9184114721,"hold":false,"default":0,"sliderMax":100,"sliderMin":0,"validMax":500,"validMin":0,"precision":1,"percent":false,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Shoulder Stroke","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":true,"keyframes":true,"id":4034315257,"hold":true,"label":"","error":[\n\n]},{"name":"Wrist Stroke","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":true,"keyframes":true,"id":4247102957,"hold":true,"label":"","error":[\n\n]},{"name":"EndGroup 4","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":9981118275,"groupId":0,"error":[\n\n]},{"name":"FK","type":"group","canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"id":8564934977,"hold":false,"children":[\n\n],"open":false,"error":[\n\n]},{"name":"Disable IK","type":"checkbox","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"default":false,"keyframes":true,"id":8937377224,"hold":true,"label":"","error":[\n\n]},{"name":"Upper Limb Angle","type":"angle","canHaveKeyframes":true,"canBeInvisible":false,"default":0,"keyframes":true,"id":9864915146,"hold":false,"open":false,"error":[\n\n]},{"name":"Lower Limb Angle","type":"angle","canHaveKeyframes":true,"canBeInvisible":false,"default":0,"keyframes":true,"id":3486213947,"hold":false,"open":false,"error":[\n\n]},{"name":"EndGroup 5","type":"endgroup","canBeInvisible":false,"canHaveKeyframes":false,"keyframes":false,"hold":false,"id":8374665470,"groupId":0,"error":[\n\n]},{"name":"IK Direction","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":5679771380,"hold":false,"default":-100,"sliderMax":100,"sliderMin":-100,"validMax":100,"validMin":-100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]},{"name":"Pop Prevent","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"id":6805764734,"hold":false,"default":0,"sliderMax":100,"sliderMin":0,"validMax":100,"validMin":0,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[\n\n],"error":[\n\n]}],"version":3}';
            ApplyFFX.config(nullLayer, binaryData, 'Limb Control', '3.2.0', 'Temp Limb Control1');

            // Rename the pseudo effect
            var pseudoEffect = nullLayer.property('Effects').property('Limb Controls');
            pseudoEffect.name = limbName + ' Limb Control';

            // Add expressions for IK Angles, Elbow and Wrist in comp and layer space
            var elbowCompControl = pseudoEffect.property('Elbow (comp space)');
            elbowCompControl.expression = getExpression('elbowCompExpression', limbName);

            var elbowLayerControl = pseudoEffect.property('Elbow (layer space)');
            elbowLayerControl.expression = getExpression('elbowLayerExpression', limbName);

            var wristCompControl = pseudoEffect.property('Wrist  (comp space)');
            wristCompControl.expression = getExpression('wristCompExpression', limbName);

            var wristLayerControl = pseudoEffect.property('Wrist  (layer space)');
            wristLayerControl.expression = getExpression('wristLayerExpression', limbName);

            var ikAnglesControl = pseudoEffect.property('IK Angles');
            ikAnglesControl.expression = getExpression('ikAnglesExpression', limbName);

            var adjustedLimbLengthsControl = pseudoEffect.property('Adjusted U/L Limb Lengths');
            adjustedLimbLengthsControl.expression = getExpression('adjustedLengthExpression', limbName);

            var proximityFactorControl = pseudoEffect.property('Proximity / Pop Prevent Factor');
            proximityFactorControl.expression = getExpression('popPreventExpression', limbName);

            // The binary currently ships the noodle sliders at 0. Set useful creation defaults without changing the binary.
            try { pseudoEffect.property('Noodle Curvature').setValue(100); } catch (errNC) {}
            try { pseudoEffect.property('Noodle Tension').setValue(100); } catch (errNT) {}

            app.endUndoGroup();
        };

        // Handle Cancel button click
        cancelButton.onClick = function () {
            win.close();
        };

        win.center();
        win.show();
    }
    createLimbScript();
}

//Expressions
function getExpression(expressionName, limbName) {
    function joinLines(lines) {
        return lines.join('\n') + '\n';
    }

    function controlHeader() {
        return joinLines([
            'var ctrlLayer = thisComp.layer("' + limbName + ' CTRL");',
            'var effect = ctrlLayer.effect("' + limbName + ' Limb Control");'
        ]);
    }

    function expressionEffectValueHelper() {
        return joinLines([
            'function effectValue(name, defaultValue) {',
            '    try {',
            '        return effect(name).value;',
            '    } catch (err) {',
            '        return defaultValue;',
            '    }',
            '}',
            'function emptyClosedPath() {',
            '    var pts = [[0, 0], [0, 0], [0, 0]];',
            '    var tans = [[0, 0], [0, 0], [0, 0]];',
            '    return createPath(pts, tans, tans, true);',
            '}'
        ]);
    }

    function upperLimbExpression() {
        return controlHeader() + expressionEffectValueHelper() + joinLines([
            'var resultPath;',
            'if (effectValue("Noodle Mode", 0) == 1) {',
            '    resultPath = emptyClosedPath();',
            '} else {',
            '    var adjustedLimbLengths = effect("Adjusted U/L Limb Lengths").value;',
            '    var upperLimbLength = adjustedLimbLengths[0];',
            '    var lowerLimbLength = adjustedLimbLengths[1];',
            '    var upperLimbTopWidth = effect("Upper Limb Top Width").value;',
            '    var upperLimbBottomWidth = effect("Upper Limb Bottom Width").value;',
            '    var upperLimbTopCurvature = Math.min(Math.max(effect("Upper Limb Top Curvature").value, 0), 100) / 100;',
            '    var upperLimbBottomCurvature = Math.min(Math.max(effect("Upper Limb Bottom Curvature").value, 0), 100) / 100;',
            '    var ikAngles = effect("IK Angles").value;',
            '    var enableSideCurvature = effect("UL Enable Side Curvature").value;',
            '    var enableInverseCurvature = effect("UL Enable Inverse Curvature").value;',
            '    var sideCurvatureCenter = effect("UL Side Curvature Center Point").value / 100;',
            '    var sideCurvatureBend = effect("UL Side Curvature Bend").value;',
            '    var sideWeight = effect("UL Left/Right Side Weight").value / 100;',
            '    var ratio = 1.5523;',
            '    var topRadius = (upperLimbTopWidth / ratio) * upperLimbTopCurvature;',
            '    var bottomRadius = (upperLimbBottomWidth / ratio) * upperLimbBottomCurvature;',
            '    var rotation = degreesToRadians(ikAngles[0]);',
            '    function rotate(point, angle) {',
            '        var x = point[0] * Math.cos(angle) - point[1] * Math.sin(angle);',
            '        var y = point[0] * Math.sin(angle) + point[1] * Math.cos(angle);',
            '        return [x, y];',
            '    }',
            '    function interpolate(pointA, pointB, t) {',
            '        return [pointA[0] + t * (pointB[0] - pointA[0]), pointA[1] + t * (pointB[1] - pointA[1])];',
            '    }',
            '    var upperLimb = [',
            '        rotate([-upperLimbTopWidth / 2, 0], rotation),',
            '        rotate([upperLimbTopWidth / 2, 0], rotation),',
            '        rotate([upperLimbBottomWidth / 2, upperLimbLength], rotation),',
            '        rotate([-upperLimbBottomWidth / 2, upperLimbLength], rotation)',
            '    ];',
            '    var centerPoint03 = interpolate(upperLimb[0], upperLimb[3], 0.5 + sideCurvatureCenter * 0.5);',
            '    var centerPoint12 = interpolate(upperLimb[1], upperLimb[2], 0.5 + sideCurvatureCenter * 0.5);',
            '    var totalBendAmount = sideCurvatureBend;',
            '    var bendAmount03 = totalBendAmount * (1 - sideWeight) / 2;',
            '    var bendAmount12 = totalBendAmount * (1 + sideWeight) / 2;',
            '    var inTan0, outTan3, outTan1, inTan2;',
            '    var inTangents, outTangents;',
            '    if (enableSideCurvature) {',
            '        var influence03 = 0.5 * (1 - sideCurvatureCenter);',
            '        var influence03Opposite = 0.5 * (1 + sideCurvatureCenter);',
            '        if (enableInverseCurvature) {',
            '            inTan0 = rotate([bendAmount03 * influence03Opposite, 0], rotation);',
            '            outTan3 = rotate([-bendAmount03 * influence03, 0], rotation);',
            '            outTan1 = rotate([-bendAmount12 * influence03Opposite, 0], rotation);',
            '            inTan2 = rotate([bendAmount12 * influence03, 0], rotation);',
            '        } else {',
            '            inTan0 = rotate([bendAmount03 / 2 * influence03Opposite, 0], rotation);',
            '            outTan3 = rotate([bendAmount03 / 2 * influence03, 0], rotation);',
            '            outTan1 = rotate([-bendAmount12 / 2 * influence03Opposite, 0], rotation);',
            '            inTan2 = rotate([-bendAmount12 / 2 * influence03, 0], rotation);',
            '        }',
            '        inTan0 = [inTan0[0] + centerPoint03[0] - upperLimb[0][0], inTan0[1] + centerPoint03[1] - upperLimb[0][1]];',
            '        outTan3 = [outTan3[0] + centerPoint03[0] - upperLimb[3][0], outTan3[1] + centerPoint03[1] - upperLimb[3][1]];',
            '        outTan1 = [outTan1[0] + centerPoint12[0] - upperLimb[1][0], outTan1[1] + centerPoint12[1] - upperLimb[1][1]];',
            '        inTan2 = [inTan2[0] + centerPoint12[0] - upperLimb[2][0], inTan2[1] + centerPoint12[1] - upperLimb[2][1]];',
            '        inTangents = [',
            '            inTan0,',
            '            rotate([0, -topRadius], rotation),',
            '            inTan2,',
            '            rotate([0, bottomRadius], rotation)',
            '        ];',
            '        outTangents = [',
            '            rotate([0, -topRadius], rotation),',
            '            outTan1,',
            '            rotate([0, bottomRadius], rotation),',
            '            outTan3',
            '        ];',
            '    } else {',
            '        var zeroPoint = rotate([0, 0], rotation);',
            '        var negativeTopRadius = rotate([0, -topRadius], rotation);',
            '        var positiveBottomRadius = rotate([0, bottomRadius], rotation);',
            '        inTangents = [',
            '            zeroPoint,',
            '            negativeTopRadius,',
            '            zeroPoint,',
            '            positiveBottomRadius',
            '        ];',
            '        outTangents = [',
            '            negativeTopRadius,',
            '            zeroPoint,',
            '            positiveBottomRadius,',
            '            zeroPoint',
            '        ];',
            '    }',
            '    resultPath = createPath(upperLimb, inTangents, outTangents, true);',
            '}',
            'resultPath;'
        ]);
    }

    function lowerLimbExpression() {
        return controlHeader() + expressionEffectValueHelper() + joinLines([
            'var resultPath;',
            'if (effectValue("Noodle Mode", 0) == 1) {',
            '    resultPath = emptyClosedPath();',
            '} else {',
            '    var adjustedLimbLengths = effect("Adjusted U/L Limb Lengths").value;',
            '    var upperLimbLength = adjustedLimbLengths[0];',
            '    var lowerLimbLength = adjustedLimbLengths[1];',
            '    var lowerLimbTopWidth = effect("Lower Limb Top Width").value;',
            '    var lowerLimbBottomWidth = effect("Lower Limb Bottom Width").value;',
            '    var lowerLimbTopCurvature = Math.min(Math.max(effect("Lower Limb Top Curvature").value, 0), 100) / 100;',
            '    var lowerLimbBottomCurvature = Math.min(Math.max(effect("Lower Limb Bottom Curvature").value, 0), 100) / 100;',
            '    var ikAngles = effect("IK Angles").value;',
            '    var enableSideCurvature = effect("LL Enable Side Curvature").value;',
            '    var enableInverseCurvature = effect("LL Enable Inverse Curvature").value;',
            '    var sideCurvatureCenter = effect("LL Side Curvature Center Point").value / 100;',
            '    var sideCurvatureBend = effect("LL Side Curvature Bend").value;',
            '    var sideWeight = effect("LL Left/Right Side Weight").value / 100;',
            '    var ratio = 1.5523;',
            '    var topRadius = (lowerLimbTopWidth / ratio) * lowerLimbTopCurvature;',
            '    var bottomRadius = (lowerLimbBottomWidth / ratio) * lowerLimbBottomCurvature;',
            '    var upperLimbRotation = degreesToRadians(ikAngles[0]);',
            '    var lowerLimbRotation = degreesToRadians(ikAngles[1]);',
            '    function rotate(point, angle, origin) {',
            '        var x = origin[0] + (point[0] - origin[0]) * Math.cos(angle) - (point[1] - origin[1]) * Math.sin(angle);',
            '        var y = origin[1] + (point[0] - origin[0]) * Math.sin(angle) + (point[1] - origin[1]) * Math.cos(angle);',
            '        return [x, y];',
            '    }',
            '    function interpolate(pointA, pointB, t) {',
            '        return [pointA[0] + t * (pointB[0] - pointA[0]), pointA[1] + t * (pointB[1] - pointA[1])];',
            '    }',
            '    var upperLimbEndpoint = rotate([0, upperLimbLength], upperLimbRotation, [0, 0]);',
            '    var anchorX = upperLimbEndpoint[0];',
            '    var anchorY = upperLimbEndpoint[1];',
            '    var lowerLimb = [',
            '        rotate([-lowerLimbTopWidth / 2, 0], lowerLimbRotation, [0, 0]),',
            '        rotate([lowerLimbTopWidth / 2, 0], lowerLimbRotation, [0, 0]),',
            '        rotate([lowerLimbBottomWidth / 2, lowerLimbLength], lowerLimbRotation, [0, 0]),',
            '        rotate([-lowerLimbBottomWidth / 2, lowerLimbLength], lowerLimbRotation, [0, 0])',
            '    ];',
            '    lowerLimb = lowerLimb.map(function(point) {',
            '        return [point[0] + anchorX, point[1] + anchorY];',
            '    });',
            '    var centerPoint03 = interpolate(lowerLimb[0], lowerLimb[3], 0.5 + sideCurvatureCenter * 0.5);',
            '    var centerPoint12 = interpolate(lowerLimb[1], lowerLimb[2], 0.5 + sideCurvatureCenter * 0.5);',
            '    var totalBendAmount = sideCurvatureBend;',
            '    var bendAmount03 = totalBendAmount * (1 - sideWeight) / 2;',
            '    var bendAmount12 = totalBendAmount * (1 + sideWeight) / 2;',
            '    var inTan0, outTan3, outTan1, inTan2;',
            '    var inTangents, outTangents;',
            '    if (enableSideCurvature) {',
            '        var influence03 = 0.5 * (1 - sideCurvatureCenter);',
            '        var influence03Opposite = 0.5 * (1 + sideCurvatureCenter);',
            '        if (enableInverseCurvature) {',
            '            inTan0 = rotate([bendAmount03 * influence03Opposite, 0], lowerLimbRotation, [0, 0]);',
            '            outTan3 = rotate([-bendAmount03 * influence03, 0], lowerLimbRotation, [0, 0]);',
            '            outTan1 = rotate([-bendAmount12 * influence03Opposite, 0], lowerLimbRotation, [0, 0]);',
            '            inTan2 = rotate([bendAmount12 * influence03, 0], lowerLimbRotation, [0, 0]);',
            '        } else {',
            '            inTan0 = rotate([bendAmount03 / 2 * influence03Opposite, 0], lowerLimbRotation, [0, 0]);',
            '            outTan3 = rotate([bendAmount03 / 2 * influence03, 0], lowerLimbRotation, [0, 0]);',
            '            outTan1 = rotate([-bendAmount12 / 2 * influence03Opposite, 0], lowerLimbRotation, [0, 0]);',
            '            inTan2 = rotate([-bendAmount12 / 2 * influence03, 0], lowerLimbRotation, [0, 0]);',
            '        }',
            '        inTan0 = [inTan0[0] + centerPoint03[0] - lowerLimb[0][0], inTan0[1] + centerPoint03[1] - lowerLimb[0][1]];',
            '        outTan3 = [outTan3[0] + centerPoint03[0] - lowerLimb[3][0], outTan3[1] + centerPoint03[1] - lowerLimb[3][1]];',
            '        outTan1 = [outTan1[0] + centerPoint12[0] - lowerLimb[1][0], outTan1[1] + centerPoint12[1] - lowerLimb[1][1]];',
            '        inTan2 = [inTan2[0] + centerPoint12[0] - lowerLimb[2][0], inTan2[1] + centerPoint12[1] - lowerLimb[2][1]];',
            '        inTangents = [',
            '            inTan0,',
            '            rotate([0, -topRadius], lowerLimbRotation, [0, 0]),',
            '            inTan2,',
            '            rotate([0, bottomRadius], lowerLimbRotation, [0, 0])',
            '        ];',
            '        outTangents = [',
            '            rotate([0, -topRadius], lowerLimbRotation, [0, 0]),',
            '            outTan1,',
            '            rotate([0, bottomRadius], lowerLimbRotation, [0, 0]),',
            '            outTan3',
            '        ];',
            '    } else {',
            '        var zeroPoint = rotate([0, 0], lowerLimbRotation, [0, 0]);',
            '        var negativeTopRadius = rotate([0, -topRadius], lowerLimbRotation, [0, 0]);',
            '        var positiveBottomRadius = rotate([0, bottomRadius], lowerLimbRotation, [0, 0]);',
            '        inTangents = [',
            '            zeroPoint,',
            '            negativeTopRadius,',
            '            zeroPoint,',
            '            positiveBottomRadius',
            '        ];',
            '        outTangents = [',
            '            negativeTopRadius,',
            '            zeroPoint,',
            '            positiveBottomRadius,',
            '            zeroPoint',
            '        ];',
            '    }',
            '    resultPath = createPath(lowerLimb, inTangents, outTangents, true);',
            '}',
            'resultPath;'
        ]);
    }

    function regularLimbExpression() {
        return controlHeader() + expressionEffectValueHelper() + joinLines([
            'var resultPath;',
            'function clampValue(value, minValue, maxValue) { return Math.min(Math.max(value, minValue), maxValue); }',
            'function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }',
            'function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }',
            'function mul(a, amount) { return [a[0] * amount, a[1] * amount]; }',
            'function interpolate(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }',
            'function length2(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }',
            'function normalize(a, fallback) { var len = length2(a); return len < 0.001 ? fallback : [a[0] / len, a[1] / len]; }',
            'function rotateVector(point, angle) {',
            '    return [point[0] * Math.cos(angle) - point[1] * Math.sin(angle), point[0] * Math.sin(angle) + point[1] * Math.cos(angle)];',
            '}',
            'function cross2(a, b) { return a[0] * b[1] - a[1] * b[0]; }',
            'function dot2(a, b) { return a[0] * b[0] + a[1] * b[1]; }',
            'function normal(a) { return [-a[1], a[0]]; }',
            'function fixedZeroPath(count) {',
            '    var pts = []; var tans = []; var zi;',
            '    for (zi = 0; zi < count; zi++) { pts.push([0, 0]); tans.push([0, 0]); }',
            '    return createPath(pts, tans, tans, true);',
            '}',
            'function appendPoints(target, source, startIndex, endIndex, step) {',
            '    var i;',
            '    if (step > 0) { for (i = startIndex; i <= endIndex; i += step) { target.push(source[i]); } }',
            '    else { for (i = startIndex; i >= endIndex; i += step) { target.push(source[i]); } }',
            '}',
            'function capPoints(center, tangent, normalVec, width, curve, isStart, steps) {',
            '    var radius = Math.max(width, 0) / 2; var pts = []; var i;',
            '    var leftPoint = add(center, mul(normalVec, radius)); var rightPoint = sub(center, mul(normalVec, radius));',
            '    for (i = 0; i <= steps; i++) {',
            '        var u = i / steps; var linePoint; var arcPoint; var theta;',
            '        if (radius < 0.001) { pts.push(center); }',
            '        else if (isStart) {',
            '            linePoint = interpolate(leftPoint, rightPoint, u); theta = Math.PI * u;',
            '            arcPoint = add(center, add(mul(normalVec, Math.cos(theta) * radius), mul(tangent, -Math.sin(theta) * radius)));',
            '            pts.push(interpolate(linePoint, arcPoint, curve));',
            '        } else {',
            '            linePoint = interpolate(rightPoint, leftPoint, u); theta = Math.PI * (1 - u);',
            '            arcPoint = add(center, add(mul(normalVec, Math.cos(theta) * radius), mul(tangent, Math.sin(theta) * radius)));',
            '            pts.push(interpolate(linePoint, arcPoint, curve));',
            '        }',
            '    }',
            '    return pts;',
            '}',
            'function arcPoints(center, startUnit, endUnit, startRadius, endRadius, curve, steps) {',
            '    var pts = []; var startPoint = add(center, mul(startUnit, startRadius)); var endPoint = add(center, mul(endUnit, endRadius));',
            '    var delta = Math.atan2(cross2(startUnit, endUnit), dot2(startUnit, endUnit));',
            '    var i;',
            '    for (i = 0; i <= steps; i++) {',
            '        var u = i / steps; var radius = startRadius + (endRadius - startRadius) * u;',
            '        var angle = delta * u; var ca = Math.cos(angle); var sa = Math.sin(angle);',
            '        var unit = [startUnit[0] * ca - startUnit[1] * sa, startUnit[0] * sa + startUnit[1] * ca];',
            '        var arcPoint = add(center, mul(unit, radius)); var linePoint = interpolate(startPoint, endPoint, u);',
            '        pts.push(interpolate(linePoint, arcPoint, curve));',
            '    }',
            '    return pts;',
            '}',
            'function smoothBell(u, centerParam) {',
            '    var center = clampValue(0.5 + centerParam * 0.5, 0, 1);',
            '    var w = 1 - Math.abs(u - center) / 0.5;',
            '    w = clampValue(w, 0, 1);',
            '    return w * w * (3 - 2 * w);',
            '}',
            'function sidePoints(startPoint, endPoint, normalVec, outwardSign, steps, bendAmount, centerParam, inverse) {',
            '    var pts = []; var i; var sign = inverse ? -1 : 1;',
            '    for (i = 0; i <= steps; i++) {',
            '        var u = i / steps; var p = interpolate(startPoint, endPoint, u);',
            '        if (Math.abs(bendAmount) > 0.001) { p = add(p, mul(normalVec, outwardSign * bendAmount * smoothBell(u, centerParam) * sign)); }',
            '        pts.push(p);',
            '    }',
            '    return pts;',
            '}',
            'function buildTangents(pts, closedPath, smoothAmount) {',
            '    var inTangents = []; var outTangents = []; var n = pts.length; var i;',
            '    for (i = 0; i < n; i++) {',
            '        var prev = pts[(i - 1 + n) % n]; var next = pts[(i + 1) % n];',
            '        if (!closedPath) { prev = pts[Math.max(i - 1, 0)]; next = pts[Math.min(i + 1, n - 1)]; }',
            '        var toPrev = sub(prev, pts[i]); var toNext = sub(next, pts[i]);',
            '        var prevLen = length2(toPrev); var nextLen = length2(toNext);',
            '        if (smoothAmount <= 0 || prevLen < 0.001 || nextLen < 0.001) { inTangents.push([0, 0]); outTangents.push([0, 0]); }',
            '        else {',
            '            var tangent = mul(sub(next, prev), smoothAmount / 6);',
            '            var inT = mul(tangent, -1); var outT = tangent;',
            '            var inLen = length2(inT); var outLen = length2(outT);',
            '            var maxIn = prevLen * 0.62; var maxOut = nextLen * 0.62;',
            '            if (inLen > maxIn && inLen > 0.001) { inT = mul(inT, maxIn / inLen); }',
            '            if (outLen > maxOut && outLen > 0.001) { outT = mul(outT, maxOut / outLen); }',
            '            inTangents.push(inT); outTangents.push(outT);',
            '        }',
            '    }',
            '    return [inTangents, outTangents];',
            '}',
            'function makePathFromPoints(pts, closedPath, smoothAmount) {',
            '    if (pts.length < 3) { return fixedZeroPath(3); }',
            '    var tangents = buildTangents(pts, closedPath, smoothAmount);',
            '    return createPath(pts, tangents[0], tangents[1], closedPath);',
            '}',
            'var SIDE_STEPS = 4; var CAP_STEPS = 8; var ELBOW_STEPS = 6;',
            'var FIXED_REGULAR_VERTEX_COUNT = (CAP_STEPS + 1) + SIDE_STEPS + ELBOW_STEPS + SIDE_STEPS + CAP_STEPS + SIDE_STEPS + ELBOW_STEPS + SIDE_STEPS;',
            'if (effectValue("Noodle Mode", 0) == 1) {',
            '    resultPath = fixedZeroPath(FIXED_REGULAR_VERTEX_COUNT);',
            '} else {',
            '    var adjustedLimbLengths = effectValue("Adjusted U/L Limb Lengths", [effectValue("Upper Limb Length", 50), effectValue("Lower Limb Length", 50)]);',
            '    var upperLimbLength = Math.max(adjustedLimbLengths[0], 0.001);',
            '    var lowerLimbLength = Math.max(adjustedLimbLengths[1], 0.001);',
            '    var startWidth = Math.max(effectValue("Upper Limb Top Width", 50), 0);',
            '    var upperJointWidth = Math.max(effectValue("Upper Limb Bottom Width", 15), 0);',
            '    var lowerJointWidth = Math.max(effectValue("Lower Limb Top Width", 30), 0);',
            '    var endWidth = Math.max(effectValue("Lower Limb Bottom Width", 15), 0);',
            '    var startCurve = clampValue(effectValue("Upper Limb Top Curvature", 100), 0, 100) / 100;',
            '    var upperJointCurve = clampValue(effectValue("Upper Limb Bottom Curvature", 100), 0, 100) / 100;',
            '    var lowerJointCurve = clampValue(effectValue("Lower Limb Top Curvature", 100), 0, 100) / 100;',
            '    var endCurve = clampValue(effectValue("Lower Limb Bottom Curvature", 100), 0, 100) / 100;',
            '    var jointCurve = clampValue((upperJointCurve + lowerJointCurve) / 2, 0, 1);',
            '    var ikAngles = effectValue("IK Angles", [0, 0]);',
            '    var upperRot = degreesToRadians(ikAngles[0]); var lowerRot = degreesToRadians(ikAngles[1]);',
            '    var d1 = normalize([Math.sin(-upperRot), Math.cos(-upperRot)], [0, 1]);',
            '    var d2 = normalize([Math.sin(-lowerRot), Math.cos(-lowerRot)], d1);',
            '    var n1 = normal(d1); var n2 = normal(d2);',
            '    var shoulder = [0, 0]; var elbow = mul(d1, upperLimbLength); var wrist = add(elbow, mul(d2, lowerLimbLength));',
            '    var startRadius = startWidth / 2; var upperJointRadius = upperJointWidth / 2; var lowerJointRadius = lowerJointWidth / 2; var endRadius = endWidth / 2;',
            '    var ulEnable = effectValue("UL Enable Side Curvature", 0) == 1;',
            '    var ulInverse = effectValue("UL Enable Inverse Curvature", 0) == 1;',
            '    var ulCenter = effectValue("UL Side Curvature Center Point", 0) / 100;',
            '    var ulBend = ulEnable ? effectValue("UL Side Curvature Bend", 0) : 0;',
            '    var ulWeight = effectValue("UL Left/Right Side Weight", 0) / 100;',
            '    var ulLeftBend = ulBend * (1 - ulWeight) / 2; var ulRightBend = ulBend * (1 + ulWeight) / 2;',
            '    var llEnable = effectValue("LL Enable Side Curvature", 0) == 1;',
            '    var llInverse = effectValue("LL Enable Inverse Curvature", 0) == 1;',
            '    var llCenter = effectValue("LL Side Curvature Center Point", 0) / 100;',
            '    var llBend = llEnable ? effectValue("LL Side Curvature Bend", 0) : 0;',
            '    var llWeight = effectValue("LL Left/Right Side Weight", 0) / 100;',
            '    var llLeftBend = llBend * (1 - llWeight) / 2; var llRightBend = llBend * (1 + llWeight) / 2;',
            '    var shoulderLeft = add(shoulder, mul(n1, startRadius)); var shoulderRight = sub(shoulder, mul(n1, startRadius));',
            '    var upperRight = sub(elbow, mul(n1, upperJointRadius)); var upperLeft = add(elbow, mul(n1, upperJointRadius));',
            '    var lowerRight = sub(elbow, mul(n2, lowerJointRadius)); var lowerLeft = add(elbow, mul(n2, lowerJointRadius));',
            '    var wristRight = sub(wrist, mul(n2, endRadius)); var wristLeft = add(wrist, mul(n2, endRadius));',
            '    var startCap = capPoints(shoulder, d1, n1, startWidth, startCurve, true, CAP_STEPS);',
            '    var endCap = capPoints(wrist, d2, n2, endWidth, endCurve, false, CAP_STEPS);',
            '    var upperRightSide = sidePoints(shoulderRight, upperRight, n1, -1, SIDE_STEPS, ulRightBend, ulCenter, ulInverse);',
            '    var lowerRightSide = sidePoints(lowerRight, wristRight, n2, -1, SIDE_STEPS, llRightBend, llCenter, llInverse);',
            '    var lowerLeftSide = sidePoints(wristLeft, lowerLeft, n2, 1, SIDE_STEPS, llLeftBend, llCenter, llInverse);',
            '    var upperLeftSide = sidePoints(upperLeft, shoulderLeft, n1, 1, SIDE_STEPS, ulLeftBend, ulCenter, ulInverse);',
            '    var rightArc = arcPoints(elbow, mul(n1, -1), mul(n2, -1), upperJointRadius, lowerJointRadius, jointCurve, ELBOW_STEPS);',
            '    var leftArc = arcPoints(elbow, n2, n1, lowerJointRadius, upperJointRadius, jointCurve, ELBOW_STEPS);',
            '    var body = [];',
            '    appendPoints(body, startCap, 0, startCap.length - 1, 1);',
            '    appendPoints(body, upperRightSide, 1, upperRightSide.length - 1, 1);',
            '    appendPoints(body, rightArc, 1, rightArc.length - 1, 1);',
            '    appendPoints(body, lowerRightSide, 1, lowerRightSide.length - 1, 1);',
            '    appendPoints(body, endCap, 1, endCap.length - 1, 1);',
            '    appendPoints(body, lowerLeftSide, 1, lowerLeftSide.length - 1, 1);',
            '    appendPoints(body, leftArc, 1, leftArc.length - 1, 1);',
            '    appendPoints(body, upperLeftSide, 1, upperLeftSide.length - 1, 1);',
            '    var smoothAmount = clampValue(0.28 + Math.max(startCurve, endCurve, jointCurve) * 0.62, 0.18, 0.92);',
            '    resultPath = makePathFromPoints(body, true, smoothAmount);',
            '}',
            'resultPath;'
        ]);
    }

    function regularStrokeTrimExpression(rangeName, trimPart) {
        return controlHeader() + joinLines([
            'function effectValue(name, defaultValue) { try { return effect(name).value; } catch (err) { return defaultValue; } }',
            'function clampValue(value, minValue, maxValue) { return Math.min(Math.max(value, minValue), maxValue); }',
            'var adjustedLimbLengths = effectValue("Adjusted U/L Limb Lengths", [effectValue("Upper Limb Length", 50), effectValue("Lower Limb Length", 50)]);',
            'var upperLimbLength = Math.max(adjustedLimbLengths[0], 0.001);',
            'var lowerLimbLength = Math.max(adjustedLimbLengths[1], 0.001);',
            'var startWidth = Math.max(effectValue("Upper Limb Top Width", 50), 0);',
            'var upperJointWidth = Math.max(effectValue("Upper Limb Bottom Width", 15), 0);',
            'var lowerJointWidth = Math.max(effectValue("Lower Limb Top Width", 30), 0);',
            'var endWidth = Math.max(effectValue("Lower Limb Bottom Width", 15), 0);',
            'var startCurve = clampValue(effectValue("Upper Limb Top Curvature", 100), 0, 100) / 100;',
            'var upperJointCurve = clampValue(effectValue("Upper Limb Bottom Curvature", 100), 0, 100) / 100;',
            'var lowerJointCurve = clampValue(effectValue("Lower Limb Top Curvature", 100), 0, 100) / 100;',
            'var endCurve = clampValue(effectValue("Lower Limb Bottom Curvature", 100), 0, 100) / 100;',
            'var jointCurve = clampValue((upperJointCurve + lowerJointCurve) / 2, 0, 1);',
            'var shoulderCapLength = Math.max(0.001, startWidth * (1 - startCurve) + Math.PI * (startWidth / 2) * startCurve);',
            'var wristCapLength = Math.max(0.001, endWidth * (1 - endCurve) + Math.PI * (endWidth / 2) * endCurve);',
            'var elbowArcLength = Math.PI * ((upperJointWidth + lowerJointWidth) / 4) * jointCurve;',
            'var rightSideLength = upperLimbLength + elbowArcLength + lowerLimbLength;',
            'var leftSideLength = rightSideLength;',
            'var perimeter = Math.max(shoulderCapLength + rightSideLength + wristCapLength + leftSideLength, 0.001);',
            'var shoulderEnd = shoulderCapLength / perimeter * 100;',
            'var sideEnd = (shoulderCapLength + rightSideLength) / perimeter * 100;',
            'var wristEnd = (shoulderCapLength + rightSideLength + wristCapLength) / perimeter * 100;',
            'var value = 0;',
            'if (effectValue("Noodle Mode", 0) == 1) {',
            '    value = 0;',
            '} else if ("' + rangeName + '" == "range1") {',
            '    if ("' + trimPart + '" == "start") { value = effectValue("Shoulder Stroke", 1) == 1 ? 0 : shoulderEnd; }',
            '    else { value = effectValue("Wrist Stroke", 1) == 1 ? wristEnd : sideEnd; }',
            '} else {',
            '    if ("' + trimPart + '" == "start") { value = wristEnd; }',
            '    else { value = 100; }',
            '}',
            'value;'
        ]);
    }

    function noodlePathExpression(partName) {
        return controlHeader() + joinLines([
            'var pathPart = "' + partName + '";',
            "function effectValue(name, defaultValue) {",
            "    try { return effect(name).value; } catch (err) { return defaultValue; }",
            "}",
            "function clampValue(value, minValue, maxValue) { return Math.min(Math.max(value, minValue), maxValue); }",
            "function smoothStep(edge0, edge1, x) { var t = clampValue((x - edge0) / Math.max(edge1 - edge0, 0.001), 0, 1); return t * t * (3 - 2 * t); }",
            "function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }",
            "function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }",
            "function mul(a, amount) { return [a[0] * amount, a[1] * amount]; }",
            "function interpolate(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }",
            "function length2(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }",
            "function dot2(a, b) { return a[0] * b[0] + a[1] * b[1]; }",
            "function cross2(a, b) { return a[0] * b[1] - a[1] * b[0]; }",
            "function normalize(a, fallback) { var len = length2(a); return len < 0.001 ? fallback : [a[0] / len, a[1] / len]; }",
            "function normal(a) { return [-a[1], a[0]]; }",
            "function fixedZeroPath(closedPath, count) {",
            "    var pts = []; var tans = []; var zi;",
            "    for (zi = 0; zi < count; zi++) { pts.push([0, 0]); tans.push([0, 0]); }",
            "    return createPath(pts, tans, tans, closedPath);",
            "}",
            "function smoothBell(u, centerParam) {",
            "    var center = clampValue(0.5 + centerParam * 0.5, 0, 1);",
            "    var w = 1 - Math.abs(u - center) / 0.5;",
            "    w = clampValue(w, 0, 1);",
            "    return w * w * (3 - 2 * w);",
            "}",
            "function capPoints(center, tangent, normalVec, width, curve, isStart, steps) {",
            "    var radius = Math.max(width, 0) / 2; var pts = []; var i;",
            "    var leftPoint = add(center, mul(normalVec, radius)); var rightPoint = sub(center, mul(normalVec, radius));",
            "    for (i = 0; i <= steps; i++) {",
            "        var u = i / steps; var linePoint; var arcPoint; var theta;",
            "        if (radius < 0.001) { pts.push(center); }",
            "        else if (isStart) {",
            "            linePoint = interpolate(leftPoint, rightPoint, u);",
            "            theta = Math.PI * u;",
            "            arcPoint = add(center, add(mul(normalVec, Math.cos(theta) * radius), mul(tangent, -Math.sin(theta) * radius)));",
            "            pts.push(interpolate(linePoint, arcPoint, curve));",
            "        } else {",
            "            linePoint = interpolate(rightPoint, leftPoint, u);",
            "            theta = Math.PI * (1 - u);",
            "            arcPoint = add(center, add(mul(normalVec, Math.cos(theta) * radius), mul(tangent, Math.sin(theta) * radius)));",
            "            pts.push(interpolate(linePoint, arcPoint, curve));",
            "        }",
            "    }",
            "    return pts;",
            "}",
            "function pushPoint(pts, weights, p, w) { pts.push(p); weights.push(clampValue(w, 0, 1)); }",
            "function appendRange(pts, weights, source, sourceWeights, startIndex, endIndex, step, defaultWeight) {",
            "    var i;",
            "    if (step > 0) {",
            "        for (i = startIndex; i <= endIndex; i += step) { pushPoint(pts, weights, source[i], sourceWeights ? sourceWeights[i] : defaultWeight); }",
            "    } else {",
            "        for (i = startIndex; i >= endIndex; i += step) { pushPoint(pts, weights, source[i], sourceWeights ? sourceWeights[i] : defaultWeight); }",
            "    }",
            "}",
            "function buildTangents(pts, weights, closedPath, smoothAmount) {",
            "    var inTangents = []; var outTangents = []; var n = pts.length; var i;",
            "    for (i = 0; i < n; i++) {",
            "        var w = weights && weights.length > i ? clampValue(weights[i], 0, 1) : 1;",
            "        if (w <= 0.001 || smoothAmount <= 0 || (!closedPath && (i == 0 || i == n - 1))) { inTangents.push([0, 0]); outTangents.push([0, 0]); }",
            "        else {",
            "            var prev = pts[(i - 1 + n) % n]; var next = pts[(i + 1) % n];",
            "            if (!closedPath) { prev = pts[Math.max(i - 1, 0)]; next = pts[Math.min(i + 1, n - 1)]; }",
            "            var tangent = mul(sub(next, prev), smoothAmount * w / 6);",
            "            var prevLen = length2(sub(pts[i], prev)); var nextLen = length2(sub(next, pts[i]));",
            "            var inT = mul(tangent, -1); var outT = tangent;",
            "            var inLen = length2(inT); var outLen = length2(outT);",
            "            var maxIn = prevLen * 0.42; var maxOut = nextLen * 0.42;",
            "            if (inLen > maxIn && inLen > 0.001) { inT = mul(inT, maxIn / inLen); }",
            "            if (outLen > maxOut && outLen > 0.001) { outT = mul(outT, maxOut / outLen); }",
            "            inTangents.push(inT); outTangents.push(outT);",
            "        }",
            "    }",
            "    return [inTangents, outTangents];",
            "}",
            "function makePathFromPoints(pts, weights, closedPath, smoothAmount) {",
            "    if (pts.length < 2 || (closedPath && pts.length < 3)) { return fixedZeroPath(closedPath, 3); }",
            "    var tangents = buildTangents(pts, weights, closedPath, smoothAmount);",
            "    return createPath(pts, tangents[0], tangents[1], closedPath);",
            "}",
            "function segmentIntersection(p0, p1, p2, p3) {",
            "    var r = sub(p1, p0); var s = sub(p3, p2); var denom = cross2(r, s);",
            "    if (Math.abs(denom) < 0.0001) { return null; }",
            "    var qp = sub(p2, p0); var t = cross2(qp, s) / denom; var u = cross2(qp, r) / denom;",
            "    if (t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999) { return add(p0, mul(r, t)); }",
            "    return null;",
            "}",
            "function lineIntersection(p0, d0, p1, d1) {",
            "    var denom = cross2(d0, d1);",
            "    if (Math.abs(denom) < 0.0001) { return null; }",
            "    return add(p0, mul(d0, cross2(sub(p1, p0), d1) / denom));",
            "}",
            "function polygonArea(pts) {",
            "    var a = 0; var i; var n = pts.length;",
            "    if (n < 3) { return 0; }",
            "    for (i = 0; i < n; i++) {",
            "        var p = pts[i]; var q = pts[(i + 1) % n];",
            "        a += p[0] * q[1] - p[1] * q[0];",
            "    }",
            "    return a * 0.5;",
            "}",
            "function loopAreaWithHit(pts, hitPoint, startIndex, endIndex) {",
            "    var loop = []; var i;",
            "    loop.push(hitPoint);",
            "    if (startIndex <= endIndex) {",
            "        for (i = startIndex; i <= endIndex; i++) { loop.push(pts[i]); }",
            "    } else {",
            "        for (i = startIndex; i < pts.length; i++) { loop.push(pts[i]); }",
            "        for (i = 0; i <= endIndex; i++) { loop.push(pts[i]); }",
            "    }",
            "    return Math.abs(polygonArea(loop));",
            "}",
            "function buildLoopWithHit(pts, weights, hitPoint, hitWeight, startIndex, endIndex) {",
            "    var outPts = []; var outWeights = []; var i;",
            "    outPts.push(hitPoint); outWeights.push(hitWeight);",
            "    if (startIndex <= endIndex) {",
            "        for (i = startIndex; i <= endIndex; i++) { outPts.push(pts[i]); outWeights.push(weights[i]); }",
            "    } else {",
            "        for (i = startIndex; i < pts.length; i++) { outPts.push(pts[i]); outWeights.push(weights[i]); }",
            "        for (i = 0; i <= endIndex; i++) { outPts.push(pts[i]); outWeights.push(weights[i]); }",
            "    }",
            "    return [outPts, outWeights];",
            "}",
            "function repairSelfIntersections(pts, weights) {",
            "    var guard;",
            "    for (guard = 0; guard < 8; guard++) {",
            "        var n = pts.length; var found = false; var bestSmall = 999999999;",
            "        var bestI = -1; var bestJ = -1; var bestPoint = null; var bestArea1 = 0; var bestArea2 = 0; var i; var j;",
            "        for (i = 0; i < n; i++) {",
            "            for (j = i + 1; j < n; j++) {",
            "                if (j == i || j == (i + 1) % n || i == (j + 1) % n) { continue; }",
            "                var hit = segmentIntersection(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n]);",
            "                if (hit !== null) {",
            "                    var area1 = loopAreaWithHit(pts, hit, i + 1, j);",
            "                    var area2 = loopAreaWithHit(pts, hit, j + 1, i);",
            "                    var smallArea = Math.min(area1, area2);",
            "                    if (smallArea < bestSmall) {",
            "                        found = true; bestSmall = smallArea; bestI = i; bestJ = j; bestPoint = hit; bestArea1 = area1; bestArea2 = area2;",
            "                    }",
            "                }",
            "            }",
            "        }",
            "        if (!found) { break; }",
            "        var hitWeight = 0.75;",
            "        if (weights.length > bestI && weights.length > bestJ) { hitWeight = Math.min(weights[bestI], weights[bestJ]); }",
            "        var rebuilt;",
            "        if (bestArea1 > bestArea2) { rebuilt = buildLoopWithHit(pts, weights, bestPoint, hitWeight, bestI + 1, bestJ); }",
            "        else { rebuilt = buildLoopWithHit(pts, weights, bestPoint, hitWeight, bestJ + 1, bestI); }",
            "        pts = rebuilt[0]; weights = rebuilt[1];",
            "        if (pts.length < 3) { break; }",
            "    }",
            "    return [pts, weights];",
            "}",
            "function forceFullFoldOutline(pts, weights) {",
            "    if (pts.length < 42) { return [pts, weights]; }",
            "    var outPts = []; var outWeights = []; var i;",
            "    for (i = 36; i <= 41; i++) { outPts.push(pts[i]); outWeights.push(weights[i]); }",
            "    for (i = 0; i <= 15; i++) { outPts.push(pts[i]); outWeights.push(weights[i]); }",
            "    return [outPts, outWeights];",
            "}",
            "var STEPS = 20;",
            "var CAP_STEPS = 6;",
            "var FIXED_BODY_VERTEX_COUNT = (STEPS * 2) + (CAP_STEPS * 2);",
            "var resultPath;",
            "if (effectValue(\"Noodle Mode\", 0) != 1) {",
            "    resultPath = fixedZeroPath(true, FIXED_BODY_VERTEX_COUNT);",
            "} else {",
            "    var adjustedLimbLengths = effectValue(\"Adjusted U/L Limb Lengths\", [effectValue(\"Upper Limb Length\", 50), effectValue(\"Lower Limb Length\", 50)]);",
            "    var upperLimbLength = Math.max(adjustedLimbLengths[0], 0.001);",
            "    var lowerLimbLength = Math.max(adjustedLimbLengths[1], 0.001);",
            "    var totalLength = Math.max(upperLimbLength + lowerLimbLength, 0.001);",
            "    var split = clampValue(upperLimbLength / totalLength, 0.02, 0.98);",
            "    var ikAngles = effectValue(\"IK Angles\", [0, 0]);",
            "    var upperLimbRotation = degreesToRadians(ikAngles[0]); var lowerLimbRotation = degreesToRadians(ikAngles[1]);",
            "    var upperDir = normalize([Math.sin(-upperLimbRotation), Math.cos(-upperLimbRotation)], [0, 1]);",
            "    var lowerDir = normalize([Math.sin(-lowerLimbRotation), Math.cos(-lowerLimbRotation)], upperDir);",
            "    var shoulder = [0, 0]; var elbow = mul(upperDir, upperLimbLength); var wrist = add(elbow, mul(lowerDir, lowerLimbLength));",
            "    var startWidth = Math.max(effectValue(\"Upper Limb Top Width\", 50), 0);",
            "    var endWidth = Math.max(effectValue(\"Lower Limb Bottom Width\", 15), 0);",
            "    var startCapCurve = clampValue(effectValue(\"Upper Limb Top Curvature\", 100), 0, 100) / 100;",
            "    var endCapCurve = clampValue(effectValue(\"Lower Limb Bottom Curvature\", 100), 0, 100) / 100;",
            "    var upperJointCurve = clampValue(effectValue(\"Upper Limb Bottom Curvature\", 100), 0, 100) / 100;",
            "    var lowerJointCurve = clampValue(effectValue(\"Lower Limb Top Curvature\", 100), 0, 100) / 100;",
            "    var jointCurve = clampValue((upperJointCurve + lowerJointCurve) / 2, 0, 1);",
            "    var curvature = clampValue(effectValue(\"Noodle Curvature\", 100), -200, 500) / 100;",
            "    var tension = clampValue(effectValue(\"Noodle Tension\", 100), 0, 300) / 100;",
            "    var straightMid = interpolate(shoulder, wrist, split);",
            "    var targetMid = add(straightMid, mul(sub(elbow, straightMid), curvature));",
            "    var denom = Math.max(2 * (1 - split) * split, 0.001);",
            "    var centerControl = [",
            "        (targetMid[0] - ((1 - split) * (1 - split) * shoulder[0]) - (split * split * wrist[0])) / denom,",
            "        (targetMid[1] - ((1 - split) * (1 - split) * shoulder[1]) - (split * split * wrist[1])) / denom",
            "    ];",
            "    var chordDir = normalize(sub(wrist, shoulder), upperDir);",
            "    function centerPointAt(t) { var mt = 1 - t; return add(add(mul(shoulder, mt * mt), mul(centerControl, 2 * mt * t)), mul(wrist, t * t)); }",
            "    function rawTangentAt(t) { return normalize(add(mul(sub(centerControl, shoulder), 2 * (1 - t)), mul(sub(wrist, centerControl), 2 * t)), chordDir); }",
            "    function blendDir(a, b, t) { return normalize(add(mul(a, 1 - t), mul(b, t)), b); }",
            "    function tangentAt(t) {",
            "        var raw = rawTangentAt(t); var edge = 0.16; var k;",
            "        if (t <= 0.0001) { return upperDir; }",
            "        if (t >= 0.9999) { return lowerDir; }",
            "        if (t < edge) { k = smoothStep(0, edge, t); raw = blendDir(upperDir, raw, k); }",
            "        if (t > 1 - edge) { k = smoothStep(1 - edge, 1, t); raw = blendDir(raw, lowerDir, k); }",
            "        return raw;",
            "    }",
            "    function widthAt(t) { return startWidth + (endWidth - startWidth) * t; }",
            "    function insideSweepApprox(p) {",
            "        var sampleCount = 36; var best = 999999; var si;",
            "        for (si = 0; si <= sampleCount; si++) {",
            "            var st = si / sampleCount; var sc = centerPointAt(st); var sr = Math.max(widthAt(st), 0) / 2;",
            "            var sd = length2(sub(p, sc)) - sr;",
            "            if (sd < best) { best = sd; }",
            "        }",
            "        if (startCapCurve <= 0.001 && dot2(sub(p, shoulder), upperDir) < -0.001) { return false; }",
            "        if (endCapCurve <= 0.001 && dot2(sub(p, wrist), lowerDir) > 0.001) { return false; }",
            "        return best <= 0.001;",
            "    }",
            "    function radialSweepEnvelopePath() {",
            "        var radialSteps = 64; var pts = []; var weights = []; var ri;",
            "        var origin = [0, 0]; var originWeight = 0; var oi;",
            "        for (oi = 0; oi <= 36; oi++) {",
            "            var ot = oi / 36; var oc = centerPointAt(ot); var orad = Math.max(widthAt(ot), 0) / 2; var ow = Math.max(orad * orad, 0.001);",
            "            origin = add(origin, mul(oc, ow)); originWeight += ow;",
            "        }",
            "        origin = mul(origin, 1 / Math.max(originWeight, 0.001));",
            "        if (!insideSweepApprox(origin)) { origin = centerPointAt(split); }",
            "        var maxSideBend = Math.max(Math.abs(ulLeftBend), Math.abs(ulRightBend), Math.abs(llLeftBend), Math.abs(llRightBend));",
            "        var maxDistance = upperLimbLength + lowerLimbLength + Math.max(startWidth, endWidth) + maxSideBend + 50;",
            "        for (ri = 0; ri < radialSteps; ri++) {",
            "            var phi = -Math.PI + Math.PI * 2 * ri / radialSteps;",
            "            var ray = [Math.cos(phi), Math.sin(phi)];",
            "            var lo = 0; var hi = maxDistance; var expand;",
            "            for (expand = 0; expand < 8; expand++) {",
            "                if (!insideSweepApprox(add(origin, mul(ray, hi)))) { break; }",
            "                hi *= 1.5;",
            "            }",
            "            var bi;",
            "            for (bi = 0; bi < 20; bi++) {",
            "                var mid = (lo + hi) / 2;",
            "                if (insideSweepApprox(add(origin, mul(ray, mid)))) { lo = mid; } else { hi = mid; }",
            "            }",
            "            pts.push(add(origin, mul(ray, lo))); weights.push(1);",
            "        }",
            "        return makePathFromPoints(pts, weights, true, 1.0);",
            "    }",
            "    var ulEnable = effectValue(\"UL Enable Side Curvature\", 0) == 1;",
            "    var ulInverse = effectValue(\"UL Enable Inverse Curvature\", 0) == 1;",
            "    var ulCenter = effectValue(\"UL Side Curvature Center Point\", 0) / 100;",
            "    var ulBend = ulEnable ? effectValue(\"UL Side Curvature Bend\", 0) : 0;",
            "    var ulWeight = effectValue(\"UL Left/Right Side Weight\", 0) / 100;",
            "    var ulLeftBend = ulBend * (1 - ulWeight) / 2; var ulRightBend = ulBend * (1 + ulWeight) / 2;",
            "    var llEnable = effectValue(\"LL Enable Side Curvature\", 0) == 1;",
            "    var llInverse = effectValue(\"LL Enable Inverse Curvature\", 0) == 1;",
            "    var llCenter = effectValue(\"LL Side Curvature Center Point\", 0) / 100;",
            "    var llBend = llEnable ? effectValue(\"LL Side Curvature Bend\", 0) : 0;",
            "    var llWeight = effectValue(\"LL Left/Right Side Weight\", 0) / 100;",
            "    var llLeftBend = llBend * (1 - llWeight) / 2; var llRightBend = llBend * (1 + llWeight) / 2;",
            "    function sideBendAt(t, isLeftSide) {",
            "        var bend = 0; var u; var inverse = false; var center = 0;",
            "        if (t <= split) {",
            "            if (!ulEnable) { return 0; }",
            "            u = clampValue(t / split, 0, 1); center = ulCenter; inverse = ulInverse; bend = isLeftSide ? ulLeftBend : ulRightBend;",
            "        } else {",
            "            if (!llEnable) { return 0; }",
            "            u = clampValue((t - split) / (1 - split), 0, 1); center = llCenter; inverse = llInverse; bend = isLeftSide ? llLeftBend : llRightBend;",
            "        }",
            "        return bend * smoothBell(u, center) * (inverse ? -1 : 1);",
            "    }",
            "    var rightSide = []; var leftSide = []; var rightWeights = []; var leftWeights = []; var i;",
            "    for (i = 0; i <= STEPS; i++) {",
            "        var t = i / STEPS; var c = centerPointAt(t); var tangent = tangentAt(t); var n = normal(tangent); var w = widthAt(t);",
            "        if (i == 0) { c = shoulder; tangent = upperDir; n = normal(tangent); }",
            "        if (i == STEPS) { c = wrist; tangent = lowerDir; n = normal(tangent); }",
            "        var rBend = sideBendAt(t, false); var lBend = sideBendAt(t, true);",
            "        rightSide.push(sub(c, mul(n, w / 2 + rBend))); rightWeights.push(1);",
            "        leftSide.push(add(c, mul(n, w / 2 + lBend))); leftWeights.push(1);",
            "    }",
            "    var turn = cross2(upperDir, lowerDir);",
            "    var relRot = lowerLimbRotation - upperLimbRotation; while (relRot > Math.PI) { relRot -= Math.PI * 2; } while (relRot < -Math.PI) { relRot += Math.PI * 2; }",
            "    if (Math.abs(turn) < 0.0001) { turn = relRot >= 0 ? 1 : -1; }",
            "    var innerIsLeft = turn > 0;",
            "    var innerSide = innerIsLeft ? leftSide : rightSide; var innerWeights = innerIsLeft ? leftWeights : rightWeights;",
            "    var outerSide = innerIsLeft ? rightSide : leftSide; var outerWeights = innerIsLeft ? rightWeights : leftWeights;",
            "    var foldAngle = Math.acos(clampValue(dot2(upperDir, lowerDir), -1, 1));",
            "    var foldMix = smoothStep(degreesToRadians(150), degreesToRadians(165), foldAngle);",
            "    var bestPoint = null; var bestA = -1; var bestB = -1; var bestScore = 999999; var j;",
            "    for (i = 0; i < STEPS; i++) {",
            "        for (j = i + 2; j < STEPS; j++) {",
            "            var hit = segmentIntersection(innerSide[i], innerSide[i + 1], innerSide[j], innerSide[j + 1]);",
            "            if (hit !== null) {",
            "                var score = Math.abs(((i + j) * 0.5) - (split * STEPS));",
            "                if (score < bestScore) { bestScore = score; bestPoint = hit; bestA = i; bestB = j; }",
            "            }",
            "        }",
            "    }",
            "    if (bestPoint === null && foldMix > 0.0001) {",
            "        var midWidthForJoin = Math.max(widthAt(split), 0);",
            "        var innerSignForJoin = innerIsLeft ? 1 : -1;",
            "        var upperInner = add(elbow, mul(normal(upperDir), innerSignForJoin * midWidthForJoin / 2));",
            "        var lowerInner = add(elbow, mul(normal(lowerDir), innerSignForJoin * midWidthForJoin / 2));",
            "        bestPoint = lineIntersection(upperInner, upperDir, lowerInner, lowerDir);",
            "        if (bestPoint === null || length2(sub(bestPoint, elbow)) > midWidthForJoin * 3 + 20) { bestPoint = elbow; }",
            "        var midIndexForJoin = Math.round(split * STEPS);",
            "        bestA = Math.max(0, midIndexForJoin - 1); bestB = Math.min(STEPS, midIndexForJoin + 1);",
            "    }",
            "    var midIndexForArc = Math.round(split * STEPS);",
            "    if (bestPoint !== null && foldMix <= 0.0001) {",
            "        for (i = bestA + 1; i <= bestB; i++) {",
            "            innerSide[i] = bestPoint;",
            "            innerWeights[i] = 0;",
            "        }",
            "    }",
            "    if (foldMix > 0.0001) {",
            "        var arcWidth = Math.max(widthAt(split), 0);",
            "        var innerArcStart = Math.max(1, midIndexForArc - 2); var innerArcEnd = Math.min(STEPS - 1, midIndexForArc + 2);",
            "        var innerSignForArc = innerIsLeft ? 1 : -1;",
            "        var innerRadius = Math.max(arcWidth / 2, 0.001);",
            "        var innerStart = add(elbow, mul(normal(upperDir), innerSignForArc * innerRadius));",
            "        var innerEnd = add(elbow, mul(normal(lowerDir), innerSignForArc * innerRadius));",
            "        var innerA0 = Math.atan2(innerStart[1] - elbow[1], innerStart[0] - elbow[0]); var innerA1 = Math.atan2(innerEnd[1] - elbow[1], innerEnd[0] - elbow[0]);",
            "        var innerDelta = innerA1 - innerA0; while (innerDelta > Math.PI) { innerDelta -= Math.PI * 2; } while (innerDelta < -Math.PI) { innerDelta += Math.PI * 2; }",
            "        if (Math.abs(Math.abs(innerDelta) - Math.PI) < 0.0001) { innerDelta = (turn >= 0 ? 1 : -1) * Math.PI; }",
            "        var innerWeight = Math.max(0.35, jointCurve);",
            "        for (i = innerArcStart; i <= innerArcEnd; i++) {",
            "            var innerU = (i - innerArcStart) / Math.max(innerArcEnd - innerArcStart, 1); var innerAngle = innerA0 + innerDelta * innerU;",
            "            var innerPoint = add(elbow, [Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius]);",
            "            innerSide[i] = interpolate(innerSide[i], innerPoint, foldMix);",
            "            innerWeights[i] = innerWeights[i] * (1 - foldMix) + innerWeight * foldMix;",
            "        }",
            "        var outerArcStart = Math.max(1, midIndexForArc - 2); var outerArcEnd = Math.min(STEPS - 1, midIndexForArc + 2);",
            "        var outerSignForArc = innerIsLeft ? -1 : 1;",
            "        var outerRadius = Math.max(arcWidth / 2, 0.001);",
            "        var outerStart = add(elbow, mul(normal(upperDir), outerSignForArc * outerRadius));",
            "        var outerEnd = add(elbow, mul(normal(lowerDir), outerSignForArc * outerRadius));",
            "        var outerA0 = Math.atan2(outerStart[1] - elbow[1], outerStart[0] - elbow[0]); var outerA1 = Math.atan2(outerEnd[1] - elbow[1], outerEnd[0] - elbow[0]);",
            "        var outerDelta = outerA1 - outerA0; while (outerDelta > Math.PI) { outerDelta -= Math.PI * 2; } while (outerDelta < -Math.PI) { outerDelta += Math.PI * 2; }",
            "        if (Math.abs(Math.abs(outerDelta) - Math.PI) < 0.0001) { outerDelta = (turn >= 0 ? 1 : -1) * Math.PI; }",
            "        for (i = outerArcStart; i <= outerArcEnd; i++) {",
            "            var outerU = (i - outerArcStart) / Math.max(outerArcEnd - outerArcStart, 1); var outerAngle = outerA0 + outerDelta * outerU;",
            "            var outerPoint = add(elbow, [Math.cos(outerAngle) * outerRadius, Math.sin(outerAngle) * outerRadius]);",
            "            outerSide[i] = interpolate(outerSide[i], outerPoint, foldMix); outerWeights[i] = 1;",
            "        }",
            "    }",
            "    rightWeights[0] = startCapCurve; rightWeights[STEPS] = endCapCurve; leftWeights[0] = startCapCurve; leftWeights[STEPS] = endCapCurve;",
            "    var startCap = capPoints(shoulder, upperDir, normal(upperDir), startWidth, startCapCurve, true, CAP_STEPS);",
            "    var endCap = capPoints(wrist, lowerDir, normal(lowerDir), endWidth, endCapCurve, false, CAP_STEPS);",
            "    var startWeights = []; var endWeights = []; for (i = 0; i <= CAP_STEPS; i++) { startWeights.push(startCapCurve); endWeights.push(endCapCurve); }",
            "    var body = []; var weights = [];",
            "    appendRange(body, weights, startCap, startWeights, 0, startCap.length - 1, 1, startCapCurve);",
            "    appendRange(body, weights, rightSide, rightWeights, 1, rightSide.length - 1, 1, 1);",
            "    appendRange(body, weights, endCap, endWeights, 1, endCap.length - 1, 1, endCapCurve);",
            "    appendRange(body, weights, leftSide, leftWeights, leftSide.length - 2, 1, -1, 1);",
            "    if (foldAngle > degreesToRadians(179.5)) {",
            "        var fullFold = forceFullFoldOutline(body, weights);",
            "        body = fullFold[0]; weights = fullFold[1];",
            "    } else {",
            "        var repairedBody = repairSelfIntersections(body, weights);",
            "        body = repairedBody[0]; weights = repairedBody[1];",
            "    }",
            "    var smoothAmount = clampValue(0.30 + tension * 0.70, 0.25, 1.20);",
            "    if (foldAngle > degreesToRadians(150)) { smoothAmount = Math.min(smoothAmount, 0.72); }",
            "    if (foldAngle > degreesToRadians(170)) { smoothAmount = Math.min(smoothAmount, 0.58); }",
            "    if (pathPart === \"body\") {",
            "        if (foldAngle >= degreesToRadians(162) && startCapCurve > 0.001 && endCapCurve > 0.001 && !ulEnable && !llEnable) {",
            "            resultPath = radialSweepEnvelopePath();",
            "        } else {",
            "            resultPath = makePathFromPoints(body, weights, true, smoothAmount);",
            "        }",
            "    } else { resultPath = fixedZeroPath(false, 3); }",
            "}",
            "resultPath;"
        ]);
    }

    function noodleStrokeTrimExpression(rangeName, trimPart) {
        return controlHeader() + joinLines([
            "function effectValue(name, defaultValue) {",
            "    try { return effect(name).value; } catch (err) { return defaultValue; }",
            "}",
            "function clampValue(value, minValue, maxValue) { return Math.min(Math.max(value, minValue), maxValue); }",
            "var adjustedLimbLengths = effectValue(\"Adjusted U/L Limb Lengths\", [effectValue(\"Upper Limb Length\", 50), effectValue(\"Lower Limb Length\", 50)]);",
            "var upperLimbLength = Math.max(adjustedLimbLengths[0], 0.001);",
            "var lowerLimbLength = Math.max(adjustedLimbLengths[1], 0.001);",
            "var sideLength = Math.max(upperLimbLength + lowerLimbLength, 0.001);",
            "var startWidth = Math.max(effectValue(\"Upper Limb Top Width\", 50), 0);",
            "var endWidth = Math.max(effectValue(\"Lower Limb Bottom Width\", 15), 0);",
            "var startCurve = clampValue(effectValue(\"Upper Limb Top Curvature\", 100), 0, 100) / 100;",
            "var endCurve = clampValue(effectValue(\"Lower Limb Bottom Curvature\", 100), 0, 100) / 100;",
            "var shoulderCapLength = Math.max(0.001, startWidth * (1 - startCurve) + Math.PI * (startWidth / 2) * startCurve);",
            "var wristCapLength = Math.max(0.001, endWidth * (1 - endCurve) + Math.PI * (endWidth / 2) * endCurve);",
            "var perimeter = Math.max(sideLength + wristCapLength + sideLength + shoulderCapLength, 0.001);",
            "var sideEnd = sideLength / perimeter * 100;",
            "var wristEnd = (sideLength + wristCapLength) / perimeter * 100;",
            "var shoulderStart = (sideLength + wristCapLength + sideLength) / perimeter * 100;",
            "var value = 0;",
            "if (effectValue(\"Noodle Mode\", 0) != 1) {",
            "    value = 0;",
            '} else if ("' + rangeName + '" == "range1") {',
            '    if ("' + trimPart + '" == "start") { value = 0; }',
            "    else { value = effectValue(\"Wrist Stroke\", 1) == 1 ? wristEnd : sideEnd; }",
            "} else {",
            '    if ("' + trimPart + '" == "start") { value = wristEnd; }',
            "    else { value = effectValue(\"Shoulder Stroke\", 1) == 1 ? 100 : shoulderStart; }",
            "}",
            "value;"
        ]);
    }

    function ikAnglesExpression() {
        return joinLines([
            'var ctrlLayer = thisComp.layer("' + limbName + ' CTRL");',
            'var adjustedLimbLengths = ctrlLayer.effect("' + limbName + ' Limb Control")("Adjusted U/L Limb Lengths").value;',
            'var upperLimbLength = adjustedLimbLengths[0];',
            'var lowerLimbLength = adjustedLimbLengths[1];',
            'var disableIK = ctrlLayer.effect("' + limbName + ' Limb Control")("Disable IK").value;',
            'var upperLimbAngle = ctrlLayer.effect("' + limbName + ' Limb Control")("Upper Limb Angle").value;',
            'var lowerLimbAngle = ctrlLayer.effect("' + limbName + ' Limb Control")("Lower Limb Angle").value;',
            'var ikDirection = ctrlLayer.effect("' + limbName + ' Limb Control")("IK Direction").value;',
            'if (disableIK == 1) {',
            '    var ikAngles = [upperLimbAngle, upperLimbAngle + lowerLimbAngle];',
            '} else {',
            '    var goalLayer = ctrlLayer;',
            '    function ensure2DArray(value) {',
            '        if (value instanceof Array) {',
            '            if (value.length > 2) {',
            '                return [value[0], value[1]];',
            '            }',
            '        }',
            '        return value;',
            '    }',
            '    function worldPosition(target) {',
            '        var pos = target.toWorld(target.anchorPoint);',
            '        return ensure2DArray(pos);',
            '    }',
            '    function calculateRotationAngle(pointA, pointB) {',
            '        var diff = ensure2DArray(pointB - pointA);',
            '        return Math.atan2(diff[1], diff[0]);',
            '    }',
            '    var limbLayer = thisComp.layer("' + limbName + '");',
            '    var upperLimbStartPos = worldPosition(limbLayer);',
            '    var goalPos = worldPosition(goalLayer);',
            '    var upperToGoalVector = ensure2DArray(goalPos - upperLimbStartPos);',
            '    var distanceToGoal = length(upperToGoalVector);',
            '    var jointAngle2 = - (ikDirection > 0 ? -1 : 1) * Math.acos(clamp((upperToGoalVector[0] * upperToGoalVector[0] + upperToGoalVector[1] * upperToGoalVector[1] - upperLimbLength * upperLimbLength - lowerLimbLength * lowerLimbLength) / (2 * upperLimbLength * lowerLimbLength), -1, 1));',
            '    var jointAngle1 = Math.atan2(-upperToGoalVector[0] * (upperLimbLength + lowerLimbLength * Math.cos(jointAngle2)) - upperToGoalVector[1] * (lowerLimbLength * Math.sin(jointAngle2)), upperToGoalVector[1] * (upperLimbLength + lowerLimbLength * Math.cos(jointAngle2)) - upperToGoalVector[0] * (lowerLimbLength * Math.sin(jointAngle2)));',
            '    var upperLimbRotation = radiansToDegrees(jointAngle1);',
            '    var lowerLimbRotation = radiansToDegrees(jointAngle2 + jointAngle1);',
            '    var limbLayerRotation = limbLayer.transform.rotation.value;',
            '    upperLimbRotation -= limbLayerRotation;',
            '    lowerLimbRotation -= limbLayerRotation;',
            '    var cumulativeParentRotation = 0;',
            '    var currentLayer = limbLayer;',
            '    for (var i = 0; i < 4; i++) {',
            '        if (currentLayer.hasParent) {',
            '            currentLayer = currentLayer.parent;',
            '            cumulativeParentRotation += currentLayer.transform.rotation.value;',
            '        } else {',
            '            break;',
            '        }',
            '    }',
            '    upperLimbRotation -= cumulativeParentRotation;',
            '    lowerLimbRotation -= cumulativeParentRotation;',
            '    var ikAngles = [upperLimbRotation, lowerLimbRotation];',
            '}',
            'ikAngles;'
        ]);
    }

    function popPreventExpression() {
        return joinLines([
            'var ctrlLayer = thisComp.layer("' + limbName + ' CTRL");',
            'var limbLayer = thisComp.layer("' + limbName + '");',
            'var upperLimbLength = ctrlLayer.effect("' + limbName + ' Limb Control")("Upper Limb Length").value;',
            'var lowerLimbLength = ctrlLayer.effect("' + limbName + ' Limb Control")("Lower Limb Length").value;',
            'var popAvert = ctrlLayer.effect("' + limbName + ' Limb Control")("Pop Prevent").value / 100;',
            'var disableIK = ctrlLayer.effect("' + limbName + ' Limb Control")("Disable IK").value;',
            'if (disableIK == 1) { [0, 1]; } else {',
            'var goal = ctrlLayer;',
            'var ikDirection = ctrlLayer.effect("' + limbName + ' Limb Control")("IK Direction").value;',
            'var ikDirectionMultiplier = Math.abs(ikDirection) / 100;',
            'function ensure2DArray(value) {',
            '    if (value instanceof Array) {',
            '        if (value.length > 2) {',
            '            return [value[0], value[1]];',
            '        }',
            '    }',
            '    return value;',
            '}',
            'function worldPosition(layer) {',
            '    var pos = layer.toWorld(layer.anchorPoint);',
            '    return ensure2DArray(pos);',
            '}',
            'function linearInterpolation(t, tMin, tMax, value1, value2) {',
            '    if (t <= tMin) return value1;',
            '    if (t >= tMax) return value2;',
            '    return value1 + (value2 - value1) * (t - tMin) / (tMax - tMin);',
            '}',
            'var upperLimbInitialPos = worldPosition(limbLayer);',
            'var goalPos = worldPosition(goal);',
            'var upperToGoalDist = length(ensure2DArray(goalPos - upperLimbInitialPos));',
            'var upperToLowerDist = upperLimbLength;',
            'var lowerToGoalDist = lowerLimbLength;',
            'var totalLimbLength = upperToLowerDist + lowerToGoalDist;',
            'var distanceToGoal = upperToGoalDist;',
            'var proximityFactor = linearInterpolation(Math.abs(distanceToGoal - totalLimbLength / 2), 0, totalLimbLength / 2, 0, 1);',
            'var popPreventFactor = linearInterpolation(linearInterpolation(proximityFactor * proximityFactor * proximityFactor, 0, 1, 0.833, 1), 0, 1, (1 - popAvert), 1);',
            'var result = [proximityFactor, popPreventFactor];',
            'result;',
            '}'
        ]);
    }

    function adjustedLengthExpression() {
        return joinLines([
            'var ctrlLayer = thisComp.layer("' + limbName + ' CTRL");',
            'var limbLayer = thisComp.layer("' + limbName + '");',
            'var upperLimbLength = ctrlLayer.effect("' + limbName + ' Limb Control")("Upper Limb Length").value;',
            'var lowerLimbLength = ctrlLayer.effect("' + limbName + ' Limb Control")("Lower Limb Length").value;',
            'var popPreventFactor = ctrlLayer.effect("' + limbName + ' Limb Control")("Proximity / Pop Prevent Factor").value[1];',
            'var disableIK = ctrlLayer.effect("' + limbName + ' Limb Control")("Disable IK").value;',
            'if (disableIK == 1) { [upperLimbLength, lowerLimbLength]; } else {',
            'var ikDirection = ctrlLayer.effect("' + limbName + ' Limb Control")("IK Direction").value;',
            'var ikDirectionMultiplier = Math.abs(ikDirection) / 100;',
            'function ensure2DArray(value) {',
            '    if (value instanceof Array) {',
            '        if (value.length > 2) {',
            '            return [value[0], value[1]];',
            '        }',
            '    }',
            '    return value;',
            '}',
            'function worldPosition(layer) {',
            '    var pos = layer.toWorld(layer.anchorPoint);',
            '    return ensure2DArray(pos);',
            '}',
            'var upperLimbInitialPos = worldPosition(limbLayer);',
            'var goalPos = worldPosition(ctrlLayer);',
            'var distanceToGoal = length(ensure2DArray(goalPos - upperLimbInitialPos));',
            'var totalLimbLength = upperLimbLength + lowerLimbLength;',
            'if (distanceToGoal > totalLimbLength) {',
            '    var adjustedUpperLimbLength = upperLimbLength;',
            '    var adjustedLowerLimbLength = lowerLimbLength;',
            '} else {',
            '    var antiPopAdjustedLength = totalLimbLength * popPreventFactor;',
            '    var upperLimbLengthAdjusted = antiPopAdjustedLength * (upperLimbLength / totalLimbLength);',
            '    var lowerLimbLengthAdjusted = antiPopAdjustedLength * (lowerLimbLength / totalLimbLength);',
            '    var directionBlend = ikDirectionMultiplier;',
            '    var upperLimbLengthBlended = (upperLimbLengthAdjusted * directionBlend) + ((upperLimbLengthAdjusted / (upperLimbLengthAdjusted + lowerLimbLengthAdjusted)) * distanceToGoal) * (1 - directionBlend);',
            '    var lowerLimbLengthBlended = (lowerLimbLengthAdjusted * directionBlend) + ((lowerLimbLengthAdjusted / (upperLimbLengthAdjusted + lowerLimbLengthAdjusted)) * distanceToGoal) * (1 - directionBlend);',
            '    var adjustedUpperLimbLength = upperLimbLengthBlended;',
            '    var adjustedLowerLimbLength = lowerLimbLengthBlended;',
            '}',
            '[adjustedUpperLimbLength, adjustedLowerLimbLength];',
            '}'
        ]);
    }

    function elbowLayerExpression() {
        return joinLines([
            'function calculateLimbPositions(ctrlLayerName, limbLayerName) {',
            '    var ctrlLayer = thisComp.layer(ctrlLayerName);',
            '    var limbLayer = thisComp.layer(limbLayerName);',
            '    var adjustedLengths = ctrlLayer.effect("' + limbName + ' Limb Control")("Adjusted U/L Limb Lengths").value;',
            '    var upperLimbLength = adjustedLengths[0];',
            '    var ikAngles = ctrlLayer.effect("' + limbName + ' Limb Control")("IK Angles").value;',
            '    var upperLimbRotation = degreesToRadians(ikAngles[0]);',
            '    var lowerLimbRotation = degreesToRadians(ikAngles[1]);',
            '    return [',
            '        upperLimbLength * Math.sin(-upperLimbRotation),',
            '        upperLimbLength * Math.cos(-upperLimbRotation)',
            '    ];',
            '}',
            'calculateLimbPositions("' + limbName + ' CTRL", "' + limbName + '");'
        ]);
    }

    function wristLayerExpression() {
        return joinLines([
            'function calculateLimbPositions(ctrlLayerName, limbLayerName) {',
            '    var ctrlLayer = thisComp.layer(ctrlLayerName);',
            '    var limbLayer = thisComp.layer(limbLayerName);',
            '    var adjustedLengths = ctrlLayer.effect("' + limbName + ' Limb Control")("Adjusted U/L Limb Lengths").value;',
            '    var upperLimbLength = adjustedLengths[0];',
            '    var lowerLimbLength = adjustedLengths[1];',
            '    var ikAngles = ctrlLayer.effect("' + limbName + ' Limb Control")("IK Angles").value;',
            '    var popPreventFactor = ctrlLayer.effect("' + limbName + ' Limb Control")("Proximity / Pop Prevent Factor").value[1];',
            '    var upperLimbRotation = degreesToRadians(ikAngles[0]);',
            '    var lowerLimbRotation = degreesToRadians(ikAngles[1]);',
            '    var elbowPosLayerSpace = [',
            '        upperLimbLength * Math.sin(-upperLimbRotation),',
            '        upperLimbLength * Math.cos(-upperLimbRotation)',
            '    ];',
            '    return [',
            '        elbowPosLayerSpace[0] + lowerLimbLength * Math.sin(-lowerLimbRotation),',
            '        elbowPosLayerSpace[1] + lowerLimbLength * Math.cos(-lowerLimbRotation)',
            '    ];',
            '}',
            'calculateLimbPositions("' + limbName + ' CTRL", "' + limbName + '");'
        ]);
    }

    function trimExpression(limbPrefix, trimPart) {
        var isUpper = limbPrefix == 'upper';
        var lengthIndex = isUpper ? 0 : 1;
        var topName = isUpper ? 'Upper Limb Top Width' : 'Lower Limb Top Width';
        var bottomName = isUpper ? 'Upper Limb Bottom Width' : 'Lower Limb Bottom Width';
        var topCurvName = isUpper ? 'Upper Limb Top Curvature' : 'Lower Limb Top Curvature';
        var bottomCurvName = isUpper ? 'Upper Limb Bottom Curvature' : 'Lower Limb Bottom Curvature';
        var strokeName = isUpper ? 'Shoulder Stroke' : 'Wrist Stroke';
        var lengthVarName = isUpper ? 'upperLimbLength' : 'lowerLimbLength';
        var topVarName = isUpper ? 'upperLimbTop' : 'lowerLimbTop';
        var bottomVarName = isUpper ? 'upperLimbBottom' : 'lowerLimbBottom';
        var topCurvVarName = isUpper ? 'upperLimbTopCurvature' : 'lowerLimbTopCurvature';
        var bottomCurvVarName = isUpper ? 'upperLimbBottomCurvature' : 'lowerLimbBottomCurvature';
        var strokeVarName = isUpper ? 'disableShoulderStroke' : 'disableWristStroke';
        var endExpression;
        if (isUpper && trimPart == 'end') {
            endExpression = 'var endPercentage = ((segment1_2 + segment2_3 + segment3_0) / totalLength) * 100;';
        } else if (isUpper && trimPart == 'offset') {
            endExpression = 'var offset = (segment0_1 / totalLength) * 360;';
        } else if (!isUpper && trimPart == 'end') {
            endExpression = 'var endPercentage = ((segment0_1 + segment1_2 + segment3_0) / totalLength) * 100;';
        } else {
            endExpression = 'var offset = ((segment0_1 + segment1_2 + segment2_3) / totalLength) * 360;';
        }
        return joinLines([
            'var ctrlLayer = thisComp.layer("' + limbName + ' CTRL");',
            'var adjustedLengths = ctrlLayer.effect("' + limbName + ' Limb Control")("Adjusted U/L Limb Lengths").value;',
            'var ' + lengthVarName + ' = adjustedLengths[' + lengthIndex + '];',
            'var ' + topVarName + ' = ctrlLayer.effect("' + limbName + ' Limb Control")("' + topName + '").value;',
            'var ' + bottomVarName + ' = ctrlLayer.effect("' + limbName + ' Limb Control")("' + bottomName + '").value;',
            'var ' + topCurvVarName + ' = Math.min(Math.max(ctrlLayer.effect("' + limbName + ' Limb Control")("' + topCurvName + '").value, 0), 100) / 100;',
            'var ' + bottomCurvVarName + ' = Math.min(Math.max(ctrlLayer.effect("' + limbName + ' Limb Control")("' + bottomCurvName + '").value, 0), 100) / 100;',
            'var ' + strokeVarName + ' = ctrlLayer.effect("' + limbName + ' Limb Control")("' + strokeName + '").value;',
            'var segment0_1 = ' + topVarName + ' * (1 - ' + topCurvVarName + ') + Math.PI * (' + topVarName + ' / 2) * ' + topCurvVarName + ';',
            'var segment2_3 = ' + bottomVarName + ' * (1 - ' + bottomCurvVarName + ') + Math.PI * (' + bottomVarName + ' / 2) * ' + bottomCurvVarName + ';',
            'var segment1_2 = Math.sqrt(Math.pow((' + topVarName + ' - ' + bottomVarName + ') / 2, 2) + Math.pow(' + lengthVarName + ', 2));',
            'var segment3_0 = segment1_2;',
            'var totalLength = segment0_1 + segment1_2 + segment2_3 + segment3_0;',
            'if (' + strokeVarName + ' == 0) {',
            '    ' + endExpression,
            '} else {',
            trimPart == 'end' ? '    var endPercentage = 100;' : '    var offset = 0;',
            '}',
            trimPart == 'end' ? 'endPercentage;' : 'offset;'
        ]);
    }

    function limbStrokeTrimExpression(rangeName, trimPart) {
        return controlHeader() + joinLines([
            'function effectValue(name, defaultValue) {',
            '    try {',
            '        return effect(name).value;',
            '    } catch (err) {',
            '        return defaultValue;',
            '    }',
            '}',
            'function clampValue(value, minValue, maxValue) {',
            '    return Math.min(Math.max(value, minValue), maxValue);',
            '}',
            'function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }',
            'function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }',
            'function mul(a, amount) { return [a[0] * amount, a[1] * amount]; }',
            'function length2(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }',
            'function normalize(a, fallback) {',
            '    var len = length2(a);',
            '    if (len < 0.001) { return fallback; }',
            '    return [a[0] / len, a[1] / len];',
            '}',
            'function interpolate(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }',
            'var adjustedLimbLengths = effectValue("Adjusted U/L Limb Lengths", [effectValue("Upper Limb Length", 50), effectValue("Lower Limb Length", 50)]);',
            'var upperLimbLength = Math.max(adjustedLimbLengths[0], 0.001);',
            'var lowerLimbLength = Math.max(adjustedLimbLengths[1], 0.001);',
            'var startWidth = Math.max(effectValue("Upper Limb Top Width", 50), 0);',
            'var upperJointWidth = Math.max(effectValue("Upper Limb Bottom Width", 15), 0);',
            'var lowerJointWidth = Math.max(effectValue("Lower Limb Top Width", 30), 0);',
            'var midWidth = Math.max((upperJointWidth + lowerJointWidth) / 2, 0);',
            'var endWidth = Math.max(effectValue("Lower Limb Bottom Width", 15), 0);',
            'var startCurve = clampValue(effectValue("Upper Limb Top Curvature", 100), 0, 100) / 100;',
            'var endCurve = clampValue(effectValue("Lower Limb Bottom Curvature", 100), 0, 100) / 100;',
            'var sideLength = upperLimbLength + lowerLimbLength;',
            'if (effectValue("Noodle Mode", 0) == 1) {',
            '    var totalLength = Math.max(upperLimbLength + lowerLimbLength, 0.001);',
            '    var split = clampValue(upperLimbLength / totalLength, 0.02, 0.98);',
            '    var ikAngles = effectValue("IK Angles", [0, 0]);',
            '    var upperRot = degreesToRadians(ikAngles[0]);',
            '    var lowerRot = degreesToRadians(ikAngles[1]);',
            '    var upperDir = normalize([Math.sin(-upperRot), Math.cos(-upperRot)], [0, 1]);',
            '    var lowerDir = normalize([Math.sin(-lowerRot), Math.cos(-lowerRot)], upperDir);',
            '    var shoulder = [0, 0];',
            '    var elbow = [upperLimbLength * upperDir[0], upperLimbLength * upperDir[1]];',
            '    var wrist = [elbow[0] + lowerLimbLength * lowerDir[0], elbow[1] + lowerLimbLength * lowerDir[1]];',
            '    var straightMid = interpolate(shoulder, wrist, split);',
            '    var curvature = clampValue(effectValue("Noodle Curvature", 100), -200, 500) / 100;',
            '    var centerMid = add(straightMid, mul(sub(elbow, straightMid), curvature));',
            '    sideLength = length2(sub(centerMid, shoulder)) + length2(sub(wrist, centerMid));',
            '}',
            'var shoulderCapLength = Math.max(0.001, Math.PI * (startWidth / 2) * Math.max(startCurve, 0.001));',
            'var wristCapLength = Math.max(0.001, Math.PI * (endWidth / 2) * Math.max(endCurve, 0.001));',
            'var perimeter = Math.max(sideLength + wristCapLength + sideLength + shoulderCapLength, 0.001);',
            'var sideEnd = sideLength / perimeter * 100;',
            'var wristEnd = (sideLength + wristCapLength) / perimeter * 100;',
            'var shoulderStart = (sideLength + wristCapLength + sideLength) / perimeter * 100;',
            'var value = 0;',
            'if (effectValue("Noodle Mode", 0) != 1) {',
            '    value = 0;',
            '} else if ("' + rangeName + '" == "range1") {',
            '    if ("' + trimPart + '" == "start") { value = 0; }',
            '    else { value = effectValue("Wrist Stroke", 1) == 1 ? wristEnd : sideEnd; }',
            '} else {',
            '    if ("' + trimPart + '" == "start") { value = wristEnd; }',
            '    else { value = effectValue("Shoulder Stroke", 1) == 1 ? 100 : shoulderStart; }',
            '}',
            'value;'
        ]);
    }

    var expressions = {
        upperLimbExpression: upperLimbExpression(),
        lowerLimbExpression: lowerLimbExpression(),
        regularLimbExpression: regularLimbExpression(),
        noodleLimbExpression: noodlePathExpression('body'),
        noodleBodyPathReferenceExpression: 'content("Noodle Limb").content("Path 1").path',
        regularBodyPathReferenceExpression: 'content("Regular Limb").content("Path 1").path',
        regularStrokeRange1StartExpression: regularStrokeTrimExpression('range1', 'start'),
        regularStrokeRange1EndExpression: regularStrokeTrimExpression('range1', 'end'),
        regularStrokeRange2StartExpression: regularStrokeTrimExpression('range2', 'start'),
        regularStrokeRange2EndExpression: regularStrokeTrimExpression('range2', 'end'),
        noodleStrokeRange1StartExpression: noodleStrokeTrimExpression('range1', 'start'),
        noodleStrokeRange1EndExpression: noodleStrokeTrimExpression('range1', 'end'),
        noodleStrokeRange2StartExpression: noodleStrokeTrimExpression('range2', 'start'),
        noodleStrokeRange2EndExpression: noodleStrokeTrimExpression('range2', 'end'),
        armFillColorExpression: "thisComp.layer('" + limbName + " CTRL').effect('" + limbName + " Limb Control')('Arm Fill Color')",
        armFillOpacityExpression: "thisComp.layer('" + limbName + " CTRL').effect('" + limbName + " Limb Control')('Arm Fill Opacity')",
        armStrokeColorExpression: "thisComp.layer('" + limbName + " CTRL').effect('" + limbName + " Limb Control')('Arm Stroke Color')",
        armStrokeWidthExpression: "thisComp.layer('" + limbName + " CTRL').effect('" + limbName + " Limb Control')('Arm Stroke Width')",
        noodleArmStrokeWidthExpression: joinLines([
            'var ctrlLayer = thisComp.layer(\"' + limbName + ' CTRL\");',
            'var effect = ctrlLayer.effect(\"' + limbName + ' Limb Control\");',
            'function effectValue(name, defaultValue) {',
            '    try {',
            '        return effect(name).value;',
            '    } catch (err) {',
            '        return defaultValue;',
            '    }',
            '}',
            'effectValue(\"Noodle Mode\", 0) == 1 ? effect(\"Arm Stroke Width\").value : 0;'
        ]),
        regularArmStrokeWidthExpression: joinLines([
            'var ctrlLayer = thisComp.layer(\"' + limbName + ' CTRL\");',
            'var effect = ctrlLayer.effect(\"' + limbName + ' Limb Control\");',
            'function effectValue(name, defaultValue) {',
            '    try {',
            '        return effect(name).value;',
            '    } catch (err) {',
            '        return defaultValue;',
            '    }',
            '}',
            'effectValue(\"Noodle Mode\", 0) == 1 ? 0 : effect(\"Arm Stroke Width\").value;'
        ]),
        ikAnglesExpression: ikAnglesExpression(),
        popPreventExpression: popPreventExpression(),
        adjustedLengthExpression: adjustedLengthExpression(),
        upperLimbStrokePathExpression: "content('Upper Limb').content('Path 1').path",
        lowerLimbStrokePathExpression: "content('Lower Limb').content('Path 1').path",
        elbowCompExpression: "var limbLayer = thisComp.layer('" + limbName + "');\n" +
            "var elbowPosLayerSpace = thisLayer('Effects')('" + limbName + " Limb Control')('Elbow (layer space)').value;\n" +
            "limbLayer.toWorld(elbowPosLayerSpace);\n",
        elbowLayerExpression: elbowLayerExpression(),
        wristCompExpression: "var limbLayer = thisComp.layer('" + limbName + "');\n" +
            "var wristPosLayerSpace = effect('" + limbName + " Limb Control')('Wrist  (layer space)').value;\n" +
            "limbLayer.toWorld(wristPosLayerSpace);\n",
        wristLayerExpression: wristLayerExpression(),
        upperEndTrimExpression: trimExpression('upper', 'end'),
        upperOffsetTrimExpression: trimExpression('upper', 'offset'),
        lowerEndTrimExpression: trimExpression('lower', 'end'),
        lowerOffsetTrimExpression: trimExpression('lower', 'offset')
    };
    return expressions[expressionName];
}
