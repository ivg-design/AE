/**
 * Centralizer - Path Guide Generation Tool for Adobe After Effects
 *
 * Provides intelligent guide generation for selected paths in shape layers with interactive
 * tree view selection and customizable guide options for center point and bounding box visualization.
 *
 * @name Centralizer
 * @author IVG Design
 * @version 2.1.0
 * @date 2026-07-04
 * @license MIT
 *
 * @changelog
 * • 2026-07-04 (2.1.0): Major capability upgrade. The shape picker is now a
 *   MULTISELECT list — Cmd/Ctrl-click several shapes and the guides describe their
 *   combined (union) bounding box. Parametric shapes (Rectangle, Ellipse,
 *   Polystar) are now listed and measured alongside bezier paths. Text, footage,
 *   precomp and solid layers now get the same options dialog, measured via
 *   sourceRectAtTime() and converted to comp space (parenting/transform-safe).
 *   Measurement moved from a six-slider expression rig to direct ExtendScript
 *   geometry reads — faster, no leftover effects, one temp Point Control only.
 * • 2026-07-04 (2.0.3): Removed a mangled include-comment ("// @'include ...") that
 *   After Effects' preprocessor parsed as a malformed directive, aborting the whole
 *   script with "Unable to execute script at line 87. Syntax error" before any code ran.
 * • 2026-07-04 (2.0.2): Fixed guide placement. The expression now accumulates the
 *   transforms of ancestor ADBE Vector Groups (previously the condition was
 *   inverted and one failed lookup aborted the whole walk, so group offsets were
 *   ignored). The "Center" option now converts the layer anchor to comp space via
 *   toComp() instead of writing layer-space coordinates as guides (which landed at
 *   the comp's top-left for default shape layers). The six temporary slider
 *   effects are now removed after their values are read.
 * • 2026-07-04 (2.0.1): Fixed composition-space conversion for shape-layer path
 *   guides. thisLayer.toComp(...) now runs unconditionally instead of only when
 *   the layer has a parent, so un-parented layers get their own Position/Anchor/
 *   Rotation/Scale applied. Removed the ExtendScript-side scale multiplication
 *   that previously double-applied the layer's scale on top of toComp().
 * @ui DIALOG
 * 
 * @description
 * Centralizer streamlines the process of adding precise guides to shape layer paths in After Effects.
 * The tool extracts shape groups and paths from selected layers, presents them in an intuitive
 * tree view interface, and generates accurate center point and bounding box guides based on user
 * selection, enhancing precision in motion graphics and animation workflows.
 * 
 * @functionality
 * • Extracts and analyzes shape groups and paths from selected shape layers
 * • Displays interactive tree view interface for intuitive path selection
 * • Generates precise center point guides based on path geometry calculations
 * • Creates bounding box guides for comprehensive path boundary visualization
 * • Supports multiple guide type selection through checkbox interface
 * • Implements comprehensive undo functionality for all guide operations
 * • Maintains shape layer integrity while adding composition-level guides
 * 
 * @usage
 * 1. Select a shape layer containing paths in your active composition
 * 2. Run the script to analyze the layer and open the selection dialog
 * 3. Browse the hierarchical tree view to locate your desired path
 * 4. Select the path and choose guide options (center and/or bounding box)
 * 5. Click "Proceed" to generate guides at calculated positions
 * 6. Review the added guides in your composition for alignment reference
 * 7. Use generated guides for precise positioning and layout operations
 * 
 * @requirements
 * • Adobe After Effects CS6 or later with shape layer and guide support
 * • Active composition must be selected with at least one shape layer
 * • Shape layer must contain path data for meaningful guide generation
 * • Sufficient system memory for tree view dialog rendering
 * 
 * @notes
 * • Tree view provides clear hierarchical visualization of shape layer contents
 * • Guide calculations account for complex path geometries and transformations
 * • All operations support full undo functionality for non-destructive workflow
 * • Center guides are positioned at calculated path centroids for accuracy
 * • Bounding box guides create comprehensive rectangular boundary references
 * • Tool maintains composition guide organization and naming conventions
 */
/**
 * @license MIT
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
(function () {
    /****************** HELPER FUNCTIONS ******************/

    // Leaf shape types the picker understands. Bezier paths are measured from
    // their vertices; parametric shapes from their size/position properties.
    var LEAF_KINDS = {
        "ADBE Vector Shape - Group": "path",
        "ADBE Vector Shape - Rect": "rect",
        "ADBE Vector Shape - Ellipse": "ellipse",
        "ADBE Vector Shape - Star": "star"
    };

    function extractGroups(group, parentName, parentChain) {
        var groups = [];
        parentChain = parentChain || [];
        for (var i = 1; i <= group.numProperties; i++) {
            var property = group.property(i);
            var groupName = property.name;
            var currentChain = parentChain.concat([groupName]);
            if (property.matchName === "ADBE Vector Group") {
                groups.push({
                    name: groupName,
                    type: "group",
                    propertyChain: currentChain,
                    groups: extractGroups(property.property("Contents"), groupName, currentChain)
                });
            } else if (LEAF_KINDS[property.matchName]) {
                groups.push({
                    name: groupName,
                    type: "shape",
                    kind: LEAF_KINDS[property.matchName],
                    propertyChain: currentChain
                });
            }
        }
        return groups;
    }

    /** Flatten the group tree into selectable leaf rows for the multiselect list. */
    function flattenLeaves(groups, out) {
        out = out || [];
        for (var i = 0; i < groups.length; i++) {
            var g = groups[i];
            if (g.type === "group") {
                flattenLeaves(g.groups, out);
            } else {
                var kindTag = (g.kind === "path") ? "" : "   [" + g.kind + "]";
                out.push({
                    label: g.propertyChain.join(" \u25B8 ") + kindTag,
                    chain: g.propertyChain,
                    kind: g.kind
                });
            }
        }
        return out;
    }

    /** Re-resolve a leaf from its name chain (live references go stale). */
    function resolveChain(fromLayer, chain) {
        var node = fromLayer;
        for (var i = 0; i < chain.length; i++) {
            if (!node) return null;
            var contents = node.property("Contents");
            if (!contents) return null;
            node = contents.property(chain[i]);
        }
        return node;
    }

    /** Accumulated (position - anchor) of every ancestor Vector Group, so a
     *  group-local box can be shifted into LAYER space. Group scale/rotation
     *  are not compounded (documented approximation). */
    function groupOffsetOf(node) {
        var off = [0, 0];
        var parent = node.parentProperty;
        while (parent) {
            try {
                if (parent.matchName === "ADBE Vector Group") {
                    var tr = parent.property("ADBE Vector Transform Group");
                    if (tr) {
                        var gp = tr.property("ADBE Vector Position").value;
                        var ga = tr.property("ADBE Vector Anchor Point").value;
                        off[0] += gp[0] - ga[0];
                        off[1] += gp[1] - ga[1];
                    }
                }
            } catch (e) { }
            if (parent.matchName === "ADBE Root Vectors Group") break;
            parent = parent.parentProperty;
        }
        return off;
    }

    /** Layer-space bounding box of one leaf, or null when unmeasurable. */
    function bboxOfLeaf(node, kind) {
        var minX, minY, maxX, maxY, pos, size;
        try {
            if (kind === "path") {
                var sh = node.property("ADBE Vector Shape").value;
                var verts = sh.vertices;
                if (!verts || verts.length === 0) return null;
                minX = maxX = verts[0][0];
                minY = maxY = verts[0][1];
                for (var i = 1; i < verts.length; i++) {
                    if (verts[i][0] < minX) minX = verts[i][0];
                    if (verts[i][0] > maxX) maxX = verts[i][0];
                    if (verts[i][1] < minY) minY = verts[i][1];
                    if (verts[i][1] > maxY) maxY = verts[i][1];
                }
            } else if (kind === "rect") {
                pos = node.property("ADBE Vector Rect Position").value;
                size = node.property("ADBE Vector Rect Size").value;
                minX = pos[0] - size[0] / 2; maxX = pos[0] + size[0] / 2;
                minY = pos[1] - size[1] / 2; maxY = pos[1] + size[1] / 2;
            } else if (kind === "ellipse") {
                pos = node.property("ADBE Vector Ellipse Position").value;
                size = node.property("ADBE Vector Ellipse Size").value;
                minX = pos[0] - size[0] / 2; maxX = pos[0] + size[0] / 2;
                minY = pos[1] - size[1] / 2; maxY = pos[1] + size[1] / 2;
            } else if (kind === "star") {
                pos = node.property("ADBE Vector Star Position").value;
                var r = node.property("ADBE Vector Star Outer Radius").value;
                minX = pos[0] - r; maxX = pos[0] + r;
                minY = pos[1] - r; maxY = pos[1] + r;
            } else {
                return null;
            }
            var off = groupOffsetOf(node);
            return {
                minX: minX + off[0], maxX: maxX + off[0],
                minY: minY + off[1], maxY: maxY + off[1]
            };
        } catch (e) {
            return null;
        }
    }

    function unionBox(a, b) {
        if (!b) return a;
        if (!a) return b;
        return {
            minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX),
            minY: Math.min(a.minY, b.minY), maxY: Math.max(a.maxY, b.maxY)
        };
    }

    /** Convert a layer-space point to comp space via a throwaway point-control
     *  expression, so parenting and layer transforms are respected. */
    function layerToComp(effectsProperty, pt) {
        try {
            var ctl = effectsProperty.addProperty("ADBE Point Control");
            ctl.name = "Centralizer Temp";
            ctl.property("ADBE Point Control-0001").expression =
                "thisLayer.toComp([" + pt[0] + ", " + pt[1] + "])";
            var v = ctl.property("ADBE Point Control-0001").value;
            ctl.remove();
            return [v[0], v[1]];
        } catch (e) {
            return pt;
        }
    }

    /****************** CREATE UI ******************/

    function showUI(leaves) {
        var win = new Window("palette", "Centralizer", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

        var listbox = null;
        if (leaves !== null && leaves.length > 0) {
            win.add("statictext", undefined, "Shapes (Cmd/Ctrl-click to select several):");
            var labels = [];
            for (var i = 0; i < leaves.length; i++) labels.push(leaves[i].label);
            listbox = win.add("listbox", undefined, labels, { multiselect: true });
            listbox.size = [340, 220];
            listbox.selection = 0;
        }

        var checkboxGroup = win.add("group", undefined, "Options");
        checkboxGroup.orientation = "row";
        var centerCheckbox = checkboxGroup.add("checkbox", undefined, "Center");
        centerCheckbox.value = true;
        var boundingBoxCheckbox = checkboxGroup.add("checkbox", undefined, "BoundingBox");
        var bboxCenterCheckbox = checkboxGroup.add("checkbox", undefined, "BBox Center");

        var buttonGroup = win.add("group", undefined, "Buttons");
        buttonGroup.orientation = "row";
        var proceedButton = buttonGroup.add("button", undefined, "Proceed");
        var cancelButton = buttonGroup.add("button", undefined, "Cancel");
        cancelButton.onClick = function () {
            win.close();
        };

        proceedButton.onClick = function () {
            // Validate the selection BEFORE opening the undo group so a
            // validation alert leaves the palette open and AE untouched.
            var picked = [];
            if (listbox !== null) {
                var sel = listbox.selection;
                if (sel === null) {
                    alert("Select at least one shape in the list.");
                    return;
                }
                if (!(sel instanceof Array)) sel = [sel];
                for (var s = 0; s < sel.length; s++) {
                    var idx = (typeof sel[s].index === "number") ? sel[s].index : 0;
                    picked.push(leaves[idx]);
                }
            }

            app.beginUndoGroup("Add Guides");
            try {
                var box = null;

                if (listbox !== null) {
                    // Union bounding box across every selected shape.
                    for (var k = 0; k < picked.length; k++) {
                        var node = resolveChain(layer, picked[k].chain);
                        var b = node ? bboxOfLeaf(node, picked[k].kind) : null;
                        box = unionBox(box, b);
                    }
                    if (!box) {
                        alert("Could not measure the selected shape(s).");
                        return;
                    }
                } else {
                    // Text / footage / precomp / solid: rendered extents.
                    if (!layer.sourceRectAtTime) {
                        alert("This layer type has no measurable bounds.");
                        return;
                    }
                    var rect = layer.sourceRectAtTime(layer.time, false);
                    box = {
                        minX: rect.left, minY: rect.top,
                        maxX: rect.left + rect.width, maxY: rect.top + rect.height
                    };
                }

                var effectsProperty = layer.property("ADBE Effect Parade");

                // Convert the box (and its center) to comp space. With layer
                // rotation the guides stay axis-aligned, so extremes are
                // re-min/maxed after conversion.
                var c1 = layerToComp(effectsProperty, [box.minX, box.minY]);
                var c2 = layerToComp(effectsProperty, [box.maxX, box.maxY]);
                var cc = layerToComp(effectsProperty, [(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2]);
                var gMinX = Math.min(c1[0], c2[0]);
                var gMaxX = Math.max(c1[0], c2[0]);
                var gMinY = Math.min(c1[1], c2[1]);
                var gMaxY = Math.max(c1[1], c2[1]);

                if (centerCheckbox.value) {
                    // Layer anchor in comp space (parenting-safe).
                    var anchorComp;
                    try {
                        var anchorCtl = effectsProperty.addProperty("ADBE Point Control");
                        anchorCtl.name = "Centralizer Temp Anchor";
                        anchorCtl.property("ADBE Point Control-0001").expression =
                            "thisLayer.toComp(thisLayer.anchorPoint)";
                        anchorComp = anchorCtl.property("ADBE Point Control-0001").value;
                        anchorCtl.remove();
                    } catch (eAnchor) {
                        anchorComp = layer.position.value;
                    }
                    activeItem.addGuide(1, anchorComp[0]); // Vertical guide
                    activeItem.addGuide(0, anchorComp[1]); // Horizontal guide
                }

                if (bboxCenterCheckbox.value) {
                    activeItem.addGuide(1, cc[0]); // Vertical guide
                    activeItem.addGuide(0, cc[1]); // Horizontal guide
                }

                if (boundingBoxCheckbox.value) {
                    activeItem.addGuide(1, gMinX); // Left guide
                    activeItem.addGuide(1, gMaxX); // Right guide
                    activeItem.addGuide(0, gMinY); // Top guide
                    activeItem.addGuide(0, gMaxY); // Bottom guide
                }

                win.close();
            } catch (err) {
                alert("Centralizer error: " + err.toString() +
                    (err.line ? "  (line " + err.line + ")" : ""));
            } finally {
                app.endUndoGroup();
            }
        };

        win.center();
        win.show();
    }

    /****************** INITIAL CHECKS ******************/

    var activeItem = app.project.activeItem;
    if (!(activeItem instanceof CompItem)) {
        alert("Please select a layer in a composition.");
        return;
    }

    var selectedLayers = activeItem.selectedLayers;
    if (selectedLayers.length === 0) {
        alert("Please select a layer.");
        return;
    }

    var layer = selectedLayers[0];
    var shapeGroups = [];

    if (layer instanceof ShapeLayer) {
        shapeGroups = extractGroups(layer.property("Contents"));
        var leaves = flattenLeaves(shapeGroups);
        if (leaves.length === 0) {
            alert("No paths or parametric shapes found in the selected shape layer.");
            return;
        }
        showUI(leaves);
    } else {
        // KBar integration
        if (typeof kbar !== 'undefined' && kbar.button) {
            var button = kbar.button;

            switch (button.argument) {
                case 'Center':
                    app.beginUndoGroup("Add Center Guides");
                    if (layer instanceof TextLayer) {
                        addTextLayerCenterGuides(layer);
                    } else if (layer instanceof AVLayer) {
                        addAVLayerCenterGuides(layer);
                    }
                    app.endUndoGroup();
                    break;
                case 'BoundingBox':
                    app.beginUndoGroup("Add Bounding Box Guides");
                    if (layer instanceof TextLayer) {
                        addTextLayerBoundingBoxGuides(layer);
                    } else if (layer instanceof AVLayer) {
                        addAVLayerBoundingBoxGuides(layer);
                    }
                    app.endUndoGroup();
                    break;
                default:
                    alert("Unknown argument: " + button.argument);
                    break;
            }
        } else {
            // Text / footage / precomp / solid layers get the same options
            // dialog; bounds come from sourceRectAtTime() at Proceed time.
            showUI(null);
        }
    }

    /****************** HELPER FUNCTIONS FOR ADDING GUIDES ******************/

    function addTextLayerCenterGuides(layer) {
        var activeItem = app.project.activeItem;
        var centerPosition = getTextLayerCenterPosition(layer);

        activeItem.addGuide(1, centerPosition[0]); // Vertical guide
        activeItem.addGuide(0, centerPosition[1]); // Horizontal guide
    }

    function addTextLayerBoundingBoxGuides(layer) {
        var activeItem = app.project.activeItem;
        var boundingBox = getTextLayerBoundingBox(layer);

        activeItem.addGuide(1, boundingBox.minX); // Left guide
        activeItem.addGuide(1, boundingBox.maxX); // Right guide
        activeItem.addGuide(0, boundingBox.minY); // Top guide
        activeItem.addGuide(0, boundingBox.maxY); // Bottom guide
    }

    function addAVLayerCenterGuides(layer) {
        var activeItem = app.project.activeItem;
        var position = layer.position.value;

        activeItem.addGuide(1, position[0]); // Vertical guide
        activeItem.addGuide(0, position[1]); // Horizontal guide
    }

    function addAVLayerBoundingBoxGuides(layer) {
        var activeItem = app.project.activeItem;
        var boundingBox = getAVLayerBoundingBox(layer);

        activeItem.addGuide(1, boundingBox.minX); // Left guide
        activeItem.addGuide(1, boundingBox.maxX); // Right guide
        activeItem.addGuide(0, boundingBox.minY); // Top guide
        activeItem.addGuide(0, boundingBox.maxY); // Bottom guide
    }

    function getTextLayerCenterPosition(layer) {
        var centerPositionControl = layer.property("ADBE Effect Parade").addProperty("ADBE Point Control");
        centerPositionControl.name = "TempCenterPositionControl";
        centerPositionControl.property("ADBE Point Control-0001").expression =
            "var rect = thisLayer.sourceRectAtTime();" +
            "thisLayer.toComp([rect.left + rect.width / 2, rect.top + rect.height / 2])";

        var centerPosition = centerPositionControl.property("ADBE Point Control-0001").value;
        centerPositionControl.remove();

        return centerPosition;
    }

    function getTextLayerBoundingBox(layer) {
        var effectsProperty = layer.property("ADBE Effect Parade");

        var minXSlider = effectsProperty.addProperty("ADBE Slider Control");
        minXSlider.name = "Min X";
        var minXIndex = minXSlider.propertyIndex;

        var maxXSlider = effectsProperty.addProperty("ADBE Slider Control");
        maxXSlider.name = "Max X";
        var maxXIndex = maxXSlider.propertyIndex;

        var minYSlider = effectsProperty.addProperty("ADBE Slider Control");
        minYSlider.name = "Min Y";
        var minYIndex = minYSlider.propertyIndex;

        var maxYSlider = effectsProperty.addProperty("ADBE Slider Control");
        maxYSlider.name = "Max Y";
        var maxYIndex = maxYSlider.propertyIndex;

        var expression =
            "var rect = thisLayer.sourceRectAtTime();" +
            "var minX = thisLayer.toComp([rect.left, rect.top])[0];" +
            "var maxX = thisLayer.toComp([rect.left + rect.width, rect.top])[0];" +
            "var minY = thisLayer.toComp([rect.left, rect.top])[1];" +
            "var maxY = thisLayer.toComp([rect.left + rect.width, rect.top + rect.height])[1];" +
            "var sliderName = thisProperty.propertyGroup(1).name;" +
            "if (sliderName === 'Min X') minX;" +
            "else if (sliderName === 'Max X') maxX;" +
            "else if (sliderName === 'Min Y') minY;" +
            "else if (sliderName === 'Max Y') maxY;" +
            "else 0;";

        effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").expression = expression;
        effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").expression = expression;

        var minX = effectsProperty.property(minXIndex).property("ADBE Slider Control-0001").value;
        var maxX = effectsProperty.property(maxXIndex).property("ADBE Slider Control-0001").value;
        var minY = effectsProperty.property(minYIndex).property("ADBE Slider Control-0001").value;
        var maxY = effectsProperty.property(maxYIndex).property("ADBE Slider Control-0001").value;

        effectsProperty.property("Min X").remove();
        effectsProperty.property("Max X").remove();
        effectsProperty.property("Min Y").remove();
        effectsProperty.property("Max Y").remove();

        return {
            minX: minX,
            maxX: maxX,
            minY: minY,
            maxY: maxY
        };
    }

    function getAVLayerBoundingBox(layer) {
        var width = layer.width * (layer.scale.value[0] / 100);
        var height = layer.height * (layer.scale.value[1] / 100);
        var position = layer.position.value;

        return {
            minX: position[0] - width / 2,
            maxX: position[0] + width / 2,
            minY: position[1] - height / 2,
            maxY: position[1] + height / 2
        };
    }

    function getLayerPosition(layer) {
        if (layer instanceof TextLayer) {
            var centerPosition = getTextLayerCenterPosition(layer);
            return centerPosition;
        } else if (layer instanceof AVLayer) {
            return layer.position.value;
        }
        return [0, 0]; // Default return value if layer type is not handled
    }
})();