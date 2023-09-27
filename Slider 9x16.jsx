//// IVG Design (c) 2023
// Slider 9x16 1080p preset
// Created using compCode v1.2.2


try {
	app.beginUndoGroup("Book Tutorial Short 9x16");
	compCode_20230624_201440();
	app.endUndoGroup();
} catch (error) {
	alert(error.toString() +
		"\nScript file: " + File.decode(error.fileName).replace(/^.*[\|\/]/, "") +
		"\nError on line: " + error.line
	);
}

function compCode_20230624_201440() {

var tempStartingComp = app.project.activeItem;
if (!tempStartingComp || !(tempStartingComp instanceof CompItem)) {
	alert("Please select a composition first");
	return;
}

// CREATE COMPOSITIONS START
	var bookTutorialShort9x16_comp = tempStartingComp;
	var sliders9x16_comp_properties = {"name":"Sliders 9x16","label":13,"comment":"","height":1920,"width":1080,"pixelAspect":1,"bgColor":[0.14901960784314,0.14901960784314,0.14901960784314],"duration":2100,"numLayers":4,"frameRate":60,"itemIsCompItem":{"type":"function","arguments":["item"],"body":"return item instanceof CompItem;"}};
	var sliders9x16_comp = app.project.items.addComp(sliders9x16_comp_properties.name, sliders9x16_comp_properties.width, sliders9x16_comp_properties.height, sliders9x16_comp_properties.pixelAspect, sliders9x16_comp_properties.duration, sliders9x16_comp_properties.frameRate);
		sliders9x16_comp.time = 0.96666666666667;
		sliders9x16_comp.bgColor = sliders9x16_comp_properties.bgColor;
		sliders9x16_comp.motionBlurAdaptiveSampleLimit = 90;
		sliders9x16_comp.resolutionFactor = [1,1];
	var slide9x16_comp_properties = {"name":"Slide 9x16","label":13,"comment":"","height":1920,"width":1080,"pixelAspect":1,"bgColor":[0.14901960784314,0.14901960784314,0.14901960784314],"duration":2100,"numLayers":0,"frameRate":60,"itemIsCompItem":{"type":"function","arguments":["item"],"body":"return item instanceof CompItem;"}};
	var slide9x16_comp = app.project.items.addComp(slide9x16_comp_properties.name, slide9x16_comp_properties.width, slide9x16_comp_properties.height, slide9x16_comp_properties.pixelAspect, slide9x16_comp_properties.duration, slide9x16_comp_properties.frameRate);
		slide9x16_comp.time = 0.96666666666667;
		slide9x16_comp.bgColor = slide9x16_comp_properties.bgColor;
		slide9x16_comp.motionBlurAdaptiveSampleLimit = 90;
		slide9x16_comp.resolutionFactor = [1,1];
// CREATE COMPOSITIONS END

// Working with comp "Book Tutorial Short 9x16", varName "bookTutorialShort9x16_comp";
	bookTutorialShort9x16_comp.openInViewer();
	// Add existing composition "Sliders 9x16", varName "sliders9x16_comp";
	var sliders9x16 = bookTutorialShort9x16_comp.layers.add(sliders9x16_comp);
		sliders9x16.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
		sliders9x16.property("ADBE Effect Parade").property(1).name = "CTRL";
		sliders9x16.property("ADBE Effect Parade").property(1).property("ADBE Slider Control-0001").setValue(100);
		sliders9x16.selected = false;


	// Apply hidden values

// Working with comp "Sliders 9x16", varName "sliders9x16_comp";
	// Add Shape Layer "Mask L", varName "maskL";
	var maskL = sliders9x16_comp.layers.addShape();
		maskL.name = "Mask L";
		maskL.enabled = false;
		maskL.moveToEnd();
		maskL.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
		maskL.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
		maskL.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([540,1920]);
		maskL.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372549019608,0.30980392156863,0.08627450980392,1]);
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
		maskL.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
		maskL.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0,0,0,1]);
		maskL.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").setValue([-282.207763671875,-11.171630859375]);
		maskL.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([-552.207763671875,-11.171630859375,0]);
		maskL.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = true;
		maskL.property("ADBE Transform Group").property("ADBE Position_0").setValue(540);
		maskL.property("ADBE Transform Group").property("ADBE Scale").setValue([-100,100,100]);
		maskL.selected = false;
	// Add Shape Layer "Mask R", varName "maskR";
	var maskR = sliders9x16_comp.layers.addShape();
		maskR.name = "Mask R";
		maskR.enabled = false;
		maskR.moveToEnd();
		maskR.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
		maskR.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
		maskR.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([540,1920]);
		maskR.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372549019608,0.30980392156863,0.08627450980392,1]);
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
		maskR.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
		maskR.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0,0,0,1]);
		maskR.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").setValue([-282.207763671875,-11.171630859375]);
		maskR.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([-552.207763671875,-11.171630859375,0]);
		maskR.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = true;
		maskR.property("ADBE Transform Group").property("ADBE Position_0").setValue(540);
		maskR.selected = false;
	// Add existing composition "Slide 9x16", varName "slide9x16_comp";
	var slide9x16 = sliders9x16_comp.layers.add(slide9x16_comp);
		slide9x16.moveToEnd();
        slide9x16.setTrackMatte(maskL, TrackMatteType.ALPHA);
		slide9x16.selected = false;
	// Add existing composition "Slide 9x16", varName "slide9x16_comp";
	var slide9x17 = sliders9x16_comp.layers.add(slide9x16_comp);
		slide9x17.moveToEnd();
        slide9x17.setTrackMatte(maskR, TrackMatteType.ALPHA);
		slide9x17.selected = false;


    // Apply parents
    slide9x16.parent = maskL;
    slide9x17.parent = maskR;
// Working with comp "Slide 9x16", varName "slide9x16_comp";


	// Apply hidden values



	// Apply expressions to properties
		maskL.property("ADBE Transform Group").property("ADBE Position_0").expression = "d = comp(\"Book Tutorial Short 9x16\").layer(\"Sliders 9x16\").effect(\"CTRL\")(\"Slider\")\riMin = 0;\riMax = 100;\roMin = -5;\roMax = 540;\rlinear(d, iMin, iMax, oMin, oMax)";
		maskR.property("ADBE Transform Group").property("ADBE Position_0").expression = "d = comp(\"Book Tutorial Short 9x16\").layer(\"Sliders 9x16\").effect(\"CTRL\")(\"Slider\")\riMin = 0;\riMax = 100;\roMin = 1085;\roMax = 540;\rlinear(d, iMin, iMax, oMin, oMax)";

bookTutorialShort9x16_comp.openInViewer();

return {
	compItem: bookTutorialShort9x16_comp,
};

}

