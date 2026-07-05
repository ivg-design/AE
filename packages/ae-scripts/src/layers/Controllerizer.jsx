/**
 * Controllerizer - Gather Selected Properties onto One Control Null
 *
 * @name Controllerizer
 * @author IVG Design
 * @version 1.0.0
 * @date 2026-07-04
 * @license MIT
 * @ui HEADLESS
 *
 * @description
 * Select any mix of properties across any layers, run Controllerizer, and they all
 * become expression controls on a single "Controller Null" - one place to animate an
 * entire scene. Each property gets a matching control type (Slider, Angle, Point,
 * 3D Point, or Color), pre-set to the property's current value and named
 * "<Layer> || <Property>", and the original property is wired to it by expression.
 * Re-running adds more controls to the same null.
 *
 * @functionality
 * • Creates (or reuses) a comp-long null named "Controller Null"
 * • Adds one expression control per selected property, matched by value type:
 *   1D → Slider (Rotation flavors → Angle), 2D / 2D-spatial → Point,
 *   3D / 3D-spatial → 3D Point (Point when the layer is 2D), Color → Color
 * • Controls are seeded with the property's current value, so nothing jumps
 * • Writes the linking expression onto every selected property
 * • Works across multiple layers in one run; re-runs append to the same null
 *
 * @usage
 * 1. Select the properties you want centralized (across any number of layers)
 * 2. Run Controllerizer
 * 3. Animate everything from the "Controller Null" layer's Effect Controls
 *
 * @requirements
 * • Adobe After Effects CS6 or later
 * • Active composition with at least one selected property
 *
 * @notes
 * • Expressions reference "Controller Null" and the control BY NAME - renaming
 *   the null or a control breaks its links. Duplicate layer names can misdirect
 *   Slider/Angle links only if their generated control names collide.
 * • Property groups and unsupported value types (e.g. Shape paths, text) are
 *   skipped and reported at the end of the run.
 */

(function controllerizer() {

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select composition first");
        return;
    }

    var props = comp.selectedProperties;
    if (!props || props.length === 0) {
        alert("Please select at least one property.");
        return;
    }

    var ThreeD_SPATIAL = 6413;
    var ThreeD = 6414;
    var TwoD_SPATIAL = 6415;
    var TwoD = 6416;
    var OneD = 6417;
    var Color = 6418;

    function layerParentOfProperty(property) {
        try {
            return property.propertyGroup(property.propertyDepth);
        } catch (e) {
            return property;
        }
    }

    app.beginUndoGroup("Controllerizer");
    try {
        var controllerNull = null;
        for (var l = 1; l <= comp.numLayers; l++) {
            if (comp.layer(l).name == "Controller Null") {
                controllerNull = comp.layer(l);
                break;
            }
        }
        if (controllerNull == null) {
            controllerNull = comp.layers.addNull(comp.duration);
            controllerNull.name = "Controller Null";
        }

        var effectsProp = controllerNull.property("ADBE Effect Parade");
        var skipped = [];
        var thisEffect;

        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            var layer = layerParentOfProperty(prop);
            var vt = prop.propertyValueType;
            var baseName = layer.name.toString() + " || " + prop.name.toString();

            try {
                if (vt == ThreeD_SPATIAL && layer.threeDLayer == false) {
                    thisEffect = effectsProp.addProperty("ADBE Point Control");
                    thisEffect.name = baseName;
                    thisEffect.property("Point").setValue([prop.value[0], prop.value[1]]);
                    prop.expression = 'thisComp.layer("Controller Null").effect("' + thisEffect.name + '")("Point")';
                } else if (vt == ThreeD_SPATIAL || vt == ThreeD) {
                    thisEffect = effectsProp.addProperty("ADBE Point3D Control");
                    thisEffect.name = baseName;
                    thisEffect.property("3D Point").setValue([prop.value[0], prop.value[1], prop.value[2]]);
                    prop.expression = 'thisComp.layer("Controller Null").effect("' + thisEffect.name + '")("3D Point")';
                } else if (vt == TwoD_SPATIAL || vt == TwoD) {
                    thisEffect = effectsProp.addProperty("ADBE Point Control");
                    thisEffect.name = baseName;
                    thisEffect.property("Point").setValue([prop.value[0], prop.value[1]]);
                    prop.expression = 'thisComp.layer("Controller Null").effect("' + thisEffect.name + '")("Point")';
                } else if (vt == Color) {
                    thisEffect = effectsProp.addProperty("ADBE Color Control");
                    thisEffect.name = baseName;
                    thisEffect.property("Color").setValue([prop.value[0], prop.value[1], prop.value[2], prop.value[3]]);
                    prop.expression = 'thisComp.layer("Controller Null").effect("' + thisEffect.name + '")("Color")';
                } else if (vt == OneD) {
                    if (prop.name == "Rotation" || prop.name == "X Rotation" || prop.name == "Y Rotation" || prop.name == "Z Rotation") {
                        thisEffect = effectsProp.addProperty("ADBE Angle Control");
                        thisEffect.name = layer.name.toString() + " |" + thisEffect.propertyIndex.toString() + "| " + prop.name.toString();
                        thisEffect.property("Angle").setValue(prop.value);
                        prop.expression = 'thisComp.layer("Controller Null").effect("' + thisEffect.name + '")("Angle")';
                    } else {
                        thisEffect = effectsProp.addProperty("ADBE Slider Control");
                        thisEffect.name = layer.name.toString() + " |" + thisEffect.propertyIndex.toString() + "| " + prop.name.toString();
                        thisEffect.property("Slider").setValue(prop.value);
                        prop.expression = 'thisComp.layer("Controller Null").effect("' + thisEffect.name + '")("Slider")';
                    }
                } else {
                    skipped.push(prop.name);
                }
            } catch (ePer) {
                skipped.push(prop.name + " (" + ePer.toString() + ")");
            }
        }

        if (skipped.length > 0) {
            alert("Controllerizer: skipped " + skipped.length + " item(s) with unsupported types:\n" + skipped.join("\n"));
        }
    } catch (err) {
        alert("Controllerizer error: " + err.toString() +
            (err.line ? "  (line " + err.line + ")" : ""));
    } finally {
        app.endUndoGroup();
    }

})();
