

app.beginUndoGroup("Setup Distribution Along Path");

// Step 1: Get the active composition and the selected layers
var comp = app.project.activeItem;
var selectedLayers = comp.selectedLayers;

if (selectedLayers.length !== 1) {
	alert("Please select exactly one shape layer with a path.");
	app.endUndoGroup();
}

// Step 2: Create a mask on the selected layer and parent it to the shape path
var shapeLayer = selectedLayers[0];
var mask = shapeLayer.Masks.addProperty("Mask");
mask.property("Mask Path").expression = "thisLayer.content(1).content(1).path";

// Step 3: Create the CTRL layer and add necessary controls
var ctrlLayer = comp.layers.addNull();
ctrlLayer.name = "CTRL";

var randomizeRotationControl = ctrlLayer.Effects.addProperty("ADBE Slider Control");
randomizeRotationControl.name = "Randomize Rotation";

var offsetRotationControl = ctrlLayer.Effects.addProperty("ADBE Angle Control");
offsetRotationControl.name = "Offset Rotation";
offsetRotationControl.property("Angle").setValue(90); // Setting offset rotation to 90 degrees

var startIndexControl = ctrlLayer.Effects.addProperty("ADBE Slider Control");
startIndexControl.name = "Start Index";

var endIndexControl = ctrlLayer.Effects.addProperty("ADBE Slider Control");
endIndexControl.name = "End Index";

var distributionPathSelector = ctrlLayer.Effects.addProperty("ADBE Layer Control");
distributionPathSelector.name = "Distribution Path Selector";
distributionPathSelector.property("Layer").setValue(shapeLayer.index);

// Step 4: Set highest and lowest index, parent layers to CTRL and add expression to Position and Rotation of other layers
var layers = comp.layers;
var minIndex = shapeLayer.index + 1;
var maxIndex = layers.length;

ctrlLayer("ADBE Effect Parade")("Start Index")("ADBE Slider Control-0001").setValue(minIndex);
ctrlLayer("ADBE Effect Parade")("End Index")("ADBE Slider Control-0001").setValue(maxIndex);


var expression = 'function calcPathLength(path) {' + '\n' +
	'  var length = 0;' + '\n' +
	'  var numPoints = path.length;' + '\n' +
	'  for (var i = 1; i < numPoints; i++) {' + '\n' +
	'    length += lengthTo(path[i - 1], path[i]);' + '\n' +
	'  }' + '\n' +
	'  return length;' + '\n' +
	'}' + '\n' +
	'' + '\n' +
	'function lengthTo(point1, point2) {' + '\n' +
	'  return Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2));' + '\n' +
	'}' + '\n' +
	'' + '\n' +
	'var controlLayer = thisComp.layer("CTRL");' + '\n' +
	'var selectedPathLayer = controlLayer.effect("Distribution Path Selector")("Layer");' + '\n' +
	'var pathProperty = selectedPathLayer.mask("Mask 1").maskPath;' + '\n' +
	'var time = time;' + '\n' +
	'var path = pathProperty.points(time);' + '\n' +
	'var pathLength = calcPathLength(path);' + '\n' +
	'' + '\n' +
	'var randomRotation = controlLayer.effect("Randomize Rotation")("Slider");' + '\n' +
	'var offsetRotation = controlLayer.effect("Offset Rotation")("Angle");' + '\n' +
	'var startIndex = controlLayer.effect("Start Index")("Slider");' + '\n' +
	'var endIndex = controlLayer.effect("End Index")("Slider");' + '\n' +
	'' + '\n' +
	'var myIndex = index - startIndex;' + '\n' +
	'var t = myIndex / (endIndex - startIndex) * pathLength;' + '\n' +
	'var pos = pathProperty.pointOnPath(t / pathLength, time);' + '\n' +
	'var tangent = pathProperty.normalOnPath(t / pathLength, time);' + '\n' +
	'var angle = Math.atan2(tangent[1], tangent[0]) * 180 / Math.PI;' + '\n' +
	'var rotation = angle + 90 + offsetRotation + randomRotation * (Math.random() - 0.5) * 2;' + '\n' +
	'' + '\n' +
	'if (thisProperty.name === "Position") {' + '\n' +
	'  pos;' + '\n' +
	'} else if (thisProperty.name === "Rotation") {' + '\n' +
	'  rotation;' + '\n' +
	'}' + '\n';


for (var i = 1; i <= layers.length; i++) {
	var layer = layers[i];
	if (layer.index >= minIndex && layer.index <= maxIndex) {
		layer.parent = ctrlLayer;
		layer.property("Position").expression = expression;
		layer.property("Rotation").expression = expression;
	}
}

	app.endUndoGroup();
