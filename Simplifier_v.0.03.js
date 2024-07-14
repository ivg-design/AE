// ShapeLayerSimplifier.jsx
// Author: [Your Name]
// Description: Simplifies the selected path of a shape layer using the Douglas-Peucker algorithm and adjusts vertices and tangents using B-spline and least squares curve fitting.

(function () {
    // UI Setup
    var ui = {
        slider: null,
        sliderValue: null,
        entireTimelineCheckbox: null,
        simplifyButton: null,

        createUI: function (thisObj) {
            var window = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Shape Layer Simplifier", undefined, { resizeable: true });

            var sliderGroup = window.add("group");
            sliderGroup.add("statictext", undefined, "Simplification Strength:");
            this.slider = sliderGroup.add("slider", undefined, 50, 1, 100);
            this.slider.preferredSize.width = 200;
            this.sliderValue = sliderGroup.add("statictext", undefined, "50");
            this.sliderValue.preferredSize.width = 30;
            this.slider.onChanging = function () {
                ui.sliderValue.text = Math.round(this.value);
            };

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
    function douglasPeucker(points, epsilon, maxDepth, currentDepth) {
        if (currentDepth === undefined) {
            currentDepth = 0;
        }

        if (currentDepth >= maxDepth) {
            return points;
        }

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
            var results1 = douglasPeucker(points.slice(0, index + 1), epsilon, maxDepth, currentDepth + 1);
            var results2 = douglasPeucker(points.slice(index), epsilon, maxDepth, currentDepth + 1);
            var results = results1.slice(0, -1).concat(results2);
            return results;
        } else {
            return [points[0], points[end]];
        }
    }

    function perpendicularDistance(pt, lineStart, lineEnd) {
        var dx = lineEnd[0] - lineStart[0];
        var dy = lineEnd[1] - lineStart[1];
        return Math.abs(dy * pt[0] - dx * pt[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0]) / Math.sqrt(dx * dx + dy * dy);
    }

    function bSplineCurve(points, degree) {
        var n = points.length - 1;

        if (n < 1) {
            // If there are not enough points, return the original points
            alert("Not enough points for B-spline curve fitting. Returning original points.");
            return points;
        }

        var k = degree + 1;
        var knots = [];

        // Generate uniform knot vector
        for (var i = 0; i <= degree; i++) {
            knots[i] = 0;
        }
        for (var i = degree + 1; i <= n; i++) {
            knots[i] = i - degree;
        }
        for (var i = n + 1; i <= n + k; i++) {
            knots[i] = n - degree + 1;
        }

        alert("Knot Vector: " + knots);

        var controlPoints = leastSquaresCurveFitting(points, degree, knots);
        alert("Control Points: " + controlPoints);
        return controlPoints;
    }

    function leastSquaresCurveFitting(points, degree, knots) {
        var n = points.length - 1;
        var k = degree + 1;
        var A = [];
        var B = [];

        for (var i = 0; i <= n; i++) {
            var row = [];
            for (var j = 0; j <= n; j++) {
                row[j] = 0;
            }
            var t = i / n;
            var span = findSpan(n, k, t, knots);
            var basisFuncs = basisFunctions(span, t, degree, knots);

            alert("Basis Functions (i = " + i + "): " + basisFuncs);

            for (var j = 0; j < k; j++) {
                row[span - degree + j] = basisFuncs[j];
            }

            A[i] = row;
            B[i] = [points[i][0], points[i][1]];
        }

        alert("Matrix A: " + A);
        alert("Matrix B: " + B);

        var controlPoints;
        try {
            controlPoints = solveLinearSystem(A, B);
        } catch (error) {
            alert("Error solving linear system: " + error.message);
            return points;
        }

        return controlPoints;
    }

    function findSpan(n, k, t, knots) {
        if (t >= knots[n]) {
            return n;
        }

        var low = k - 1;
        var high = n;

        while (low < high) {
            var mid = Math.floor((low + high) / 2);

            if (t < knots[mid]) {
                high = mid;
            } else if (t >= knots[mid + 1]) {
                low = mid + 1;
            } else {
                return mid;
            }
        }

        return low;
    }
    function basisFunctions(i, t, degree, knots) {
        var N = [1];
        var eps = 1e-10; // Small epsilon value to avoid division by zero

        for (var j = 1; j <= degree; j++) {
            var left = [];
            var right = [];
            for (var k = 0; k <= j; k++) {
                left[k] = 0;
                right[k] = 0;
            }

            left[0] = 1;
            for (var k = 1; k <= j; k++) {
                var denom = knots[i + j + 1 - k] - knots[i + 1 - k];
                if (Math.abs(denom) < eps) {
                    denom = (denom < 0) ? -eps : eps;
                }
                var a = (t - knots[i + 1 - k]) / denom;
                left[k] = a * left[k - 1];
                right[k - 1] = (1 - a) * right[k - 1];
            }

            for (var k = 0; k < j; k++) {
                N[k] = left[k] + right[j - 1 - k];
            }

            N[j] = left[j];
        }

        return N;
    }

    function solveLinearSystem(A, B) {
        var n = A.length;
        var X = [];

        for (var i = 0; i < n; i++) {
            var sum = [0, 0];
            for (var j = 0; j < n; j++) {
                sum[0] += A[i][j] * B[j][0];
                sum[1] += A[i][j] * B[j][1];
            }
            X[i] = sum;
        }

        return X;
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
            if (props[i].matchName.toString() === "ADBE Vector Shape") {
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
            if (path.numKeys === 0) {
                // No keyframes on the path property
                var shape = path.valueAtTime(comp.time, false);
                var simplifiedShape = simplifyShape(shape, epsilon);
                path.setValue(simplifiedShape);
            } else {
                for (var i = 1; i <= path.numKeys; i++) {
                    var t = path.keyTime(i);
                    var shape = path.valueAtTime(t, true);
                    var simplifiedShape = simplifyShape(shape, epsilon);
                    path.setValueAtTime(t, simplifiedShape);
                }
            }
        } else {
            var currentTime = comp.time;
            var shape;

            if (path.numKeys === 0) {
                // No keyframes on the path property
                shape = path.valueAtTime(currentTime, false);
            } else {
                var currentKeyframeIndex = path.nearestKeyIndex(currentTime);
                if (currentKeyframeIndex === 0 || path.keyTime(currentKeyframeIndex) !== currentTime) {
                    shape = path.valueAtTime(currentTime, false);
                } else {
                    shape = path.valueAtTime(path.keyTime(currentKeyframeIndex), false);
                }
            }

            var simplifiedShape = simplifyShape(shape, epsilon);
            path.setValueAtTime(currentTime, simplifiedShape);
        }
    }


    function simplifyShape(shape, epsilon) {
        var vertices = shape.vertices;
        var inTangents = shape.inTangents;
        var outTangents = shape.outTangents;
        var closed = shape.closed;

        alert("Original Vertices: " + vertices.length);

        var simplifiedVertices = douglasPeucker(vertices, epsilon, 100);

        alert("Simplified Vertices: " + simplifiedVertices.length);

        var simplifiedShape = new Shape();
        simplifiedShape.vertices = simplifiedVertices;
        simplifiedShape.closed = closed;

        // Preserve the original tangents
        var simplifiedInTangents = [];
        var simplifiedOutTangents = [];
        for (var i = 0; i < simplifiedVertices.length; i++) {
            var originalIndex = vertices.indexOf(simplifiedVertices[i]);
            if (originalIndex !== -1) {
                simplifiedInTangents[i] = inTangents[originalIndex];
                simplifiedOutTangents[i] = outTangents[originalIndex];
            } else {
                simplifiedInTangents[i] = simplifiedVertices[i];
                simplifiedOutTangents[i] = simplifiedVertices[i];
            }
        }
        simplifiedShape.inTangents = simplifiedInTangents;
        simplifiedShape.outTangents = simplifiedOutTangents;

        return simplifiedShape;
    }

    // Run the script
    ui.createUI(this);
})();