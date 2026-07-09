/**
 * 2-3 IK Rigger - Inverse Kinematics chain setup for Adobe After Effects
 *
 * Turns a set of existing layers into a working 2- or 3-segment IK chain. You
 * pick the limb segments, the limb tip, and a controller/goal layer; the script
 * parents the chain and writes a law-of-cosines IK rotation expression onto each
 * segment so the whole chain solves to follow the goal. A "Change IK Direction"
 * checkbox is added to the goal so you can flip the elbow/knee bend, and (in
 * 3-layer mode) a "Rotate Tip" checkbox controls whether the tip tracks the chain.
 *
 * FUNCTIONALITY:
 * - Builds a 2-layer (upper/lower/tip) or 3-layer (upper/middle/lower/tip) IK chain.
 * - Parents the segments into a chain and drives each segment's Rotation via a
 *   closed-form IK expression (2-bone and 3-bone law-of-cosines solvers).
 * - Adds a "Change IK Direction" checkbox to the goal to flip the bend direction.
 * - Adds a "Rotate Tip" checkbox to the goal in 3-layer mode.
 * - Refresh re-reads the active comp's layers into every dropdown.
 * - Validates the active comp, the layer count, distinct picks, and locked layers
 *   before it touches anything, inside a single undo group.
 *
 * USAGE:
 * 1. In your composition, create/position the layers you want as the chain:
 *    - Upper segment, (Middle segment for 3-layer), Lower segment, a Limb Tip
 *      layer at the very end of the chain (e.g. the hand/foot), and a Goal layer
 *      (typically a Null) that you will animate to drive the chain.
 * 2. Set each segment layer's ANCHOR POINT on the joint it rotates around (the
 *    upper anchor at the shoulder/hip, lower anchor at the elbow/knee, tip anchor
 *    at the wrist/ankle). The IK math measures from these anchors.
 * 3. Run the script, choose "Two Layer IK Setup" or "Three Layer IK Setup", and
 *    assign each dropdown to the matching layer (Set Limb Controller/Goal = the null).
 * 4. Click Apply. Animate the Goal null to pose the chain; toggle "Change IK
 *    Direction" on the goal to flip the bend.
 *
 * REQUIREMENTS:
 * - An active composition with at least the required number of layers
 *   (4 for 2-layer: upper, lower, tip, goal; 5 for 3-layer).
 * - Layers unlocked. Expression engine support for length(), clamp(),
 *   radiansToDegrees(), toWorld(), and effect() references.
 *
 * NOTES:
 * - The catalog filename is 2-3_IK_Rigger.jsx; the toolbar slug is 2-3-ik-rigger.
 * - ExtendScript wrapper code is ECMA-3 compatible; the rig logic lives in AE
 *   expressions applied to each segment's Rotation.
 * - Re-running Apply reuses the existing goal checkboxes instead of duplicating them.
 *
 * @name 2-3 IK Rigger
 * @author IVG Design
 * @version 1.0.0
 * @date 2026-07-07
 * @ui PALETTE
 * @license MIT
 * @changelog
 * 1.0.0 initial catalog release; fixed refresh, lock-check, undefined rotateHand
 *       in the 3-layer expression, duplicate goal effect on re-apply, and added
 *       active-comp/selection validation and a single guarded undo group.
 */

(function ik_rigger() {
    // ---- helpers -----------------------------------------------------------
    function activeComp() {
        var item = app.project ? app.project.activeItem : null;
        return (item && item instanceof CompItem) ? item : null;
    }

    function layerNames(comp) {
        var names = [];
        for (var i = 1; i <= comp.numLayers; i++) names.push(comp.layer(i).name);
        return names;
    }

    function getLayerNamed(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name) return comp.layer(i);
        }
        return null;
    }

    function populateDD(dd, names) {
        var prev = dd.selection ? dd.selection.text : null;
        dd.removeAll();
        for (var i = 0; i < names.length; i++) dd.add("item", names[i]);
        var restored = false;
        if (prev) {
            for (var j = 0; j < dd.items.length; j++) {
                if (dd.items[j].text === prev) { dd.selection = j; restored = true; break; }
            }
        }
        if (!restored && dd.items.length) dd.selection = 0;
    }

    // Reuse an existing Checkbox Control by name, or add a new one.
    function ensureCheckbox(layer, effectName, defaultOn) {
        var parade = layer.property("ADBE Effect Parade");
        for (var i = 1; i <= parade.numProperties; i++) {
            if (parade.property(i).name === effectName) return parade.property(i);
        }
        var fx = parade.addProperty("ADBE Checkbox Control");
        fx.name = effectName;
        if (defaultOn) fx.property("ADBE Checkbox Control-0001").setValue(1);
        return fx;
    }

    var comp = activeComp();
    if (!comp) { alert("2-3 IK Rigger\nOpen a composition first."); return; }
    if (comp.numLayers < 4) {
        alert("2-3 IK Rigger\nNeed at least 4 layers (upper, lower, tip, goal).");
        return;
    }
    var names = layerNames(comp);

    // ---- UI -----------------------------------------------------------------
    var palette = new Window("palette", "IK Rig Setup", undefined, { resizeable: true });
    palette.orientation = "column";
    palette.alignChildren = ["left", "top"];
    palette.spacing = 10;
    palette.margins = 16;

    var ik_type_selector = palette.add("panel", undefined, "Select IK Type");
    ik_type_selector.orientation = "column";
    ik_type_selector.alignChildren = ["left", "top"];
    ik_type_selector.spacing = 10;
    ik_type_selector.margins = 14;

    var IK_Picker = ik_type_selector.add("group");
    IK_Picker.orientation = "row";
    IK_Picker.alignChildren = ["left", "center"];
    IK_Picker.spacing = 10;
    var it1 = IK_Picker.add("statictext", undefined, "Inverse Kinematics Type");
    it1.preferredSize.width = 160;
    var ik_type_picker = IK_Picker.add("dropdownlist", undefined, ["Two Layer IK Setup", "Three Layer IK Setup"]);
    ik_type_picker.selection = 0;
    ik_type_picker.preferredSize.width = 200;

    var layer_picker = palette.add("panel", undefined, "Pick Your Layers");
    layer_picker.orientation = "column";
    layer_picker.alignChildren = ["left", "top"];
    layer_picker.spacing = 10;
    layer_picker.margins = 14;
    var hint = layer_picker.add("statictext", undefined,
        "Set each segment's anchor point on its joint. Assign the Limb Tip (chain end) and the Goal/Controller null.",
        { multiline: true });
    hint.preferredSize.width = 360;

    function addRow(labelText) {
        var g = layer_picker.add("group");
        g.orientation = "row";
        g.alignChildren = ["left", "center"];
        g.spacing = 10;
        var t = g.add("statictext", undefined, labelText);
        t.preferredSize.width = 160;
        var dd = g.add("dropdownlist", undefined, names);
        dd.selection = 0;
        dd.preferredSize.width = 200;
        g.dd = dd;
        return g;
    }

    var group1 = addRow("Set Upper Limb");
    var group2 = addRow("Set Middle Limb"); group2.enabled = false;   // 3-layer only
    var group3 = addRow("Set Lower Limb");
    var group4 = addRow("Set Limb Tip");
    var group5 = addRow("Set Limb Controller/Goal");
    var upper_limb_selector = group1.dd;
    var middle_limb_selector = group2.dd;
    var lower_limb_selector = group3.dd;
    var limb_tip_selector = group4.dd;
    var goal_selector = group5.dd;

    var group6 = palette.add("group");
    group6.orientation = "row";
    group6.alignChildren = ["center", "top"];
    group6.spacing = 10;
    var btn_refresh = group6.add("button", undefined, "Refresh"); btn_refresh.preferredSize.width = 75;
    var btn_apply = group6.add("button", undefined, "Apply"); btn_apply.preferredSize.width = 75;
    var btn_close = group6.add("button", undefined, "Close"); btn_close.preferredSize.width = 75;

    ik_type_picker.onChange = function () {
        group2.enabled = (this.selection.index === 1);
    };

    btn_close.onClick = function () { palette.close(); };

    btn_refresh.onClick = function () {
        var c = activeComp();
        if (!c) { alert("2-3 IK Rigger\nOpen a composition first."); return; }
        names = layerNames(c);
        populateDD(upper_limb_selector, names);
        populateDD(middle_limb_selector, names);
        populateDD(lower_limb_selector, names);
        populateDD(limb_tip_selector, names);
        populateDD(goal_selector, names);
    };

    // ---- IK expressions (law-of-cosines solvers; math preserved verbatim) ---
    function buildIK2(upper, lower, tip, goal) {
        return [
            'var upperLimb = thisComp.layer("' + upper.name + '");',
            'var lowerLimb = thisComp.layer("' + lower.name + '");',
            'var limbTip = thisComp.layer("' + tip.name + '");',
            'var goal = thisComp.layer("' + goal.name + '");',
            'var flip = thisComp.layer("' + goal.name + '").effect("Change IK Direction")("Checkbox");',
            'function worldPos(a) { return a.toWorld(a.anchorPoint); }',
            'function rotationFunction(from, x) {',
            '    var d = x - from;',
            '    return radiansToDegrees(Math.atan2(d[1], d[0]));',
            '}',
            'var lTip = limbTip.index;',
            'var uLimb = upperLimb.index;',
            'var lLimb = lowerLimb.index;',
            'var limbTipPosition = worldPos(limbTip);',
            'var upperLimbPosition = worldPos(upperLimb);',
            'var lowerLimbPosition = worldPos(lowerLimb);',
            'var controllerPosition = worldPos(goal);',
            'var upperToLowerDist = length(upperLimbPosition, lowerLimbPosition);',
            'var lowerToTipDist = length(lowerLimbPosition, limbTipPosition);',
            'var IKlength = length(controllerPosition, upperLimbPosition);',
            'var LofC = (upperToLowerDist * upperToLowerDist - lowerToTipDist * lowerToTipDist + IKlength * IKlength) / (2 * IKlength);',
            'var midPointIK = IKlength - LofC;',
            'var angleB = Math.acos(clamp(midPointIK / lowerToTipDist, -1, 1));',
            'var angleA = Math.acos(clamp(LofC / upperToLowerDist, -1, 1));',
            'var lowerLimbRotationAngle = (flip == 1) ? (angleB + angleA) : -(angleB + angleA);',
            'lowerLimbRotationAngle = radiansToDegrees(lowerLimbRotationAngle);',
            'var uLimbAngleToIKline = (flip == 1) ? (-angleA) : (angleA);',
            'uLimbAngleToIKline = radiansToDegrees(uLimbAngleToIKline);',
            'var uLimbToIKLineAngle = rotationFunction(upperLimbPosition, controllerPosition);',
            'var i = rotationFunction(upperLimbPosition, lowerLimbPosition);',
            'var t = rotationFunction(lowerLimbPosition, limbTipPosition);',
            'var output = value;',
            'if (index == uLimb) {',
            '    output = uLimbAngleToIKline + uLimbToIKLineAngle - i + value;',
            '} else if (index == lLimb) {',
            '    output = lowerLimbRotationAngle + i - t + value;',
            '} else if (index == lTip) {',
            '    output = value - uLimbAngleToIKline - lowerLimbRotationAngle;',
            '}',
            'output'
        ].join('\n');
    }

    function buildIK3(upper, middle, lower, tip, goal) {
        return [
            'var upperLimb = thisComp.layer("' + upper.name + '");',
            'var middleLimb = thisComp.layer("' + middle.name + '");',
            'var lowerLimb = thisComp.layer("' + lower.name + '");',
            'var limbTip = thisComp.layer("' + tip.name + '");',
            'var goal = thisComp.layer("' + goal.name + '");',
            'var flip = thisComp.layer("' + goal.name + '").effect("Change IK Direction")("Checkbox");',
            'var rotateHand = thisComp.layer("' + goal.name + '").effect("Rotate Tip")("Checkbox");',
            'function j(a) { return a.toWorld(a.anchorPoint); }',
            'function i(a, d) { var c = d - a; return radiansToDegrees(Math.atan2(c[1], c[0])); }',
            'var z = limbTip.index;',
            'var p = upperLimb.index;',
            'var h = middleLimb.index;',
            'var k = lowerLimb.index;',
            'var w = j(limbTip);',
            'var v = j(upperLimb);',
            'var u = j(middleLimb);',
            'var t = j(lowerLimb);',
            'var r = j(goal);',
            'var O = length(v, u); if (O == 0) { O = 1; }',
            'var N = length(u, t); if (N == 0) { N = 1; }',
            'var J = length(t, w); if (J == 0) { J = 1; }',
            'var H = length(v, r); if (H == 0) { H = 1; }',
            'var y = N * N - H * H - (O - J) * (O - J);',
            'var e = H * H * (O + J);',
            'var o = -H * H * O * J;',
            'var n = (-1 * e - Math.sqrt(e * e - 4 * y * o)) / (2 * y);',
            'var I = Math.acos(clamp(H / (2 * n), -1, 1));',
            'var f = (flip == 1) ? -I : I;',
            'f = radiansToDegrees(f);',
            'var l = Math.sqrt(H * H + J * J - 2 * H * J * Math.cos(I));',
            'var g = Math.acos(clamp((l * l - O * O - N * N) / (-2 * O * N), -1, 1));',
            'g = (flip == 1) ? radiansToDegrees(-g) : radiansToDegrees(g);',
            'var F = Math.sqrt(H * H + O * O - 2 * H * O * Math.cos(I));',
            'var x = Math.acos(clamp((F * F - J * J - N * N) / (-2 * J * N), -1, 1));',
            'x = (flip == 1) ? radiansToDegrees(-x) : radiansToDegrees(x);',
            'var K = i(v, r);',
            'var m = i(v, u);',
            'var C = i(u, t);',
            'var s = i(t, w);',
            'var q = value;',
            'if (index == p) {',
            '    q = f + K - m + value;',
            '} else if (index == h) {',
            '    q = g + m - C + value + 180;',
            '} else if (index == k) {',
            '    q = x + C - s + value + 180;',
            '} else if (index == z && rotateHand == 1) {',
            '    q = value - f - g - x - K;',
            '}',
            'q'
        ].join('\n');
    }

    btn_apply.onClick = function () {
        var c = activeComp();
        if (!c) { alert("2-3 IK Rigger\nOpen a composition first."); return; }
        var threeLayer = (ik_type_picker.selection.index === 1);

        // resolve + validate selections
        function pick(dd, role) {
            if (!dd.selection) { alert("2-3 IK Rigger\nChoose a layer for: " + role); return null; }
            var lyr = getLayerNamed(c, dd.selection.text);
            if (!lyr) { alert("2-3 IK Rigger\nLayer not found (Refresh): " + dd.selection.text); return null; }
            return lyr;
        }
        var upper = pick(upper_limb_selector, "Upper Limb"); if (!upper) return;
        var middle = threeLayer ? pick(middle_limb_selector, "Middle Limb") : null;
        if (threeLayer && !middle) return;
        var lower = pick(lower_limb_selector, "Lower Limb"); if (!lower) return;
        var tip = pick(limb_tip_selector, "Limb Tip"); if (!tip) return;
        var goal = pick(goal_selector, "Controller/Goal"); if (!goal) return;

        var chain = threeLayer ? [upper, middle, lower, tip, goal] : [upper, lower, tip, goal];
        var seen = {};
        for (var i = 0; i < chain.length; i++) {
            if (seen[chain[i].index]) { alert("2-3 IK Rigger\nEach role needs a distinct layer."); return; }
            seen[chain[i].index] = true;
            if (chain[i].locked) { alert("2-3 IK Rigger\nPlease unlock layer: " + chain[i].name); return; }
        }

        app.beginUndoGroup("2-3 IK Rig Setup");
        try {
            ensureCheckbox(goal, "Change IK Direction", false);
            if (threeLayer) ensureCheckbox(goal, "Rotate Tip", true);

            if (!threeLayer) {
                var ik2 = buildIK2(upper, lower, tip, goal);
                lower.parent = upper;
                tip.parent = lower;
                upper.rotation.expression = ik2;
                lower.rotation.expression = ik2;
                tip.rotation.expression = ik2;
                alert("Two Layer IK Chain Rigged");
            } else {
                var ik3 = buildIK3(upper, middle, lower, tip, goal);
                middle.parent = upper;
                lower.parent = middle;
                tip.parent = lower;
                upper.rotation.expression = ik3;
                middle.rotation.expression = ik3;
                lower.rotation.expression = ik3;
                tip.rotation.expression = ik3;
                alert("Three Layer IK Chain Rigged");
            }
        } catch (err) {
            alert("2-3 IK Rigger\n" + err.toString());
        } finally {
            app.endUndoGroup();
        }
        palette.close();
    };

    palette.layout.layout(true);
    palette.show();
})();
