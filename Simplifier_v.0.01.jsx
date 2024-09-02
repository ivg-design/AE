//@include "dist/helloWord.js"

function simplifyBezierPath(path) {
    var vertices = path.vertices.map(function (v) {
        return { x: v[0], y: v[1] };
    });

    if (!vertices || vertices.length === 0) {
        alert("No vertices found in the path.");
        return path;
    }

    var bezier = new _v(vertices);
    if (typeof bezier.reduce !== "function") {
        alert("reduce() is not a function on bezier");
        return path;
    }



    var simplifiedCurves = bezier.reduce();
    if (!simplifiedCurves || simplifiedCurves.length === 0) {
        alert("Bezier reduction failed or returned no curves.");
        return path;
    }

    var newVertices = [];
    simplifiedCurves.forEach(function (curve) {
        curve.points.forEach(function (point) {
            newVertices.push([point.x, point.y]);
        });
    });

    var newShape = new Shape();
    newShape.vertices = newVertices.length ? newVertices : path.vertices;
    newShape.inTangents = path.inTangents;
    newShape.outTangents = path.outTangents;
    newShape.closed = path.closed;

    return newShape;
}


function main() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selectedLayer = comp.selectedLayers[0];
    if (!selectedLayer) {
        alert("Please select a layer.");
        return;
    }

    
    var selectedProperties = selectedLayer.selectedProperties;
    if (selectedProperties.length === 0) {
        alert("Please select a path.");
        return;
    }

    var pathProp = selectedProperties[selectedProperties.length - 1];
    if (pathProp.matchName !== "ADBE Vector Shape") {
        alert("Please select a valid path.");
        return;
    }

    var path = pathProp.value;
    var simplifiedPath = simplifyBezierPath(path);

    pathProp.setValue(simplifiedPath);
}

app.beginUndoGroup("Simplify Path");
main();
app.endUndoGroup();
