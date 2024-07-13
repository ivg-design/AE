// ShapeLayerSimplifier.jsx
// Author: [Your Name]
// Description: Simplifies the selected path of a shape layer using the Douglas-Peucker algorithm.

(function () {
    // UI Setup
    var ui = {
        slider: null,
        entireTimelineCheckbox: null,
        simplifyButton: null,

        createUI: function (thisObj) {
            var window = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Shape Layer Simplifier", undefined, { resizeable: true });

            var sliderGroup = window.add("group");
            sliderGroup.add("statictext", undefined, "Simplification Strength:");
            this.slider = sliderGroup.add("slider", undefined, 50, 1, 100);
            this.slider.preferredSize.width = 200;

            this.entireTimelineCheckbox = window.add("checkbox", undefined, "Entire Timeline");

            this.simplifyButton = window.add("button", undefined, "Simplify");
            this.simplifyButton.onClick = function () {
                app.beginUndoGroup("Shape Layer Simplification");
                simplifySelectedPath();
                app.endUndoGroup();
            };

            if (window instanceof Window) {
                window.center();
                window.show();
            }
        }
    };

    // Douglas-Peucker Algorithm
    function douglasPeucker(points, epsilon) {
        var dmax = 0;
        var index = 0;
        var end = points.length - 1;

        for (var i = 1; i < end; i++) {
            var d = perpendicularDistance(points[i], points[0], points[end]);
            if (d > dmax) {
                index = i;
                dmax = d;
            }
        }

        if (dmax > epsilon) {
            var recResults1 = douglasPeucker(points.slice(0, index + 1), epsilon);
            var recResults2 = douglasPeucker(points.slice(index), epsilon);
            return recResults1.slice(0, -1).concat(recResults2);
        } else {
            return [points[0], points[end]];
        }
    }

    function perpendicularDistance(pt, lineStart, lineEnd) {
        var dx = lineEnd[0] - lineStart[0];
        var dy = lineEnd[1] - lineStart[1];
        return Math.abs(dy * pt[0] - dx * pt[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]) / Math.sqrt(dx * dx + dy * dy);
    }

    // Main Logic
    function simplifySelectedPath() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var layer = comp.selectedLayers[0];
        if (!layer || !(layer instanceof ShapeLayer)) {
            alert("Please select a shape layer.");
            return;
        }

        var props = layer.selectedProperties;
        if (!props || props.length === 0) {
            alert("Please select a shape path.");
            return;
        }

        var path = null;
        for (var i = 0; i < props.length; i++) {
            if (props[i].matchName === "ADBE Vector Shape") {
                path = props[i];
                break;
            }
        }

        if (!path) {
            alert("Please select a shape path.");
            return;
        }

        var epsilon = ui.slider.value;
        var entireTimeline = ui.entireTimelineCheckbox.value;

        if (entireTimeline) {
            for (var i = 1; i <= path.numKeys; i++) {
                var t = path.keyTime(i);
                var shape = path.valueAtTime(t, true);
                var simplifiedShape = simplifyShape(shape, epsilon);
                path.setValueAtTime(t, simplifiedShape);
            }
        } else {
            var currentTime = comp.time;
            var shape = path.valueAtTime(currentTime, false);
            var simplifiedShape = simplifyShape(shape, epsilon);
            path.setValue(simplifiedShape);
        }
    }

    function simplifyShape(shape, epsilon) {
        var vertices = shape.vertices;
        var inTangents = shape.inTangents;
        var outTangents = shape.outTangents;
        var closed = shape.closed;

        var simplifiedVertices = douglasPeucker(vertices, epsilon);
        var simplifiedInTangents = [];
        var simplifiedOutTangents = [];

        for (var i = 0; i < simplifiedVertices.length; i++) {
            var index = vertices.indexOf(simplifiedVertices[i]);
            simplifiedInTangents.push(inTangents[index]);
            simplifiedOutTangents.push(outTangents[index]);
        }

        var simplifiedShape = new Shape();
        simplifiedShape.vertices = simplifiedVertices;
        simplifiedShape.inTangents = simplifiedInTangents;
        simplifiedShape.outTangents = simplifiedOutTangents;
        simplifiedShape.closed = closed;

        return simplifiedShape;
    }

    // Run the script
    ui.createUI(this);
})();