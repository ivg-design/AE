/**
 * Slidotron 16x9 - Horizontal Slider Composition Generator for Adobe After Effects
 *
 * Creates professional 16:9 (4K) slider compositions for presentations and galleries.
 * Automatically generates animated slide transitions with customizable timing and masking.
 *
 * @name Slidotron_16x9
 * @author IVG Design
 * @version 2.0.0
 * @date 2025-08-13
 * @license MIT
 * @ui HEADLESS
 * 
 * @description
 * Slidotron 16x9 generates a complete horizontal slider system for creating professional
 * presentations and gallery-style animations. The script creates a nested composition
 * structure with animated masks that reveal content based on a slider control.
 * 
 * @functionality
 * • Creates two nested compositions: "Sliders 16x9" and "Slide 16x9"
 * • Generates animated mask layers for left and right slide transitions
 * • Adds expression-driven slider control for seamless animation
 * • Sets up track matte relationships for proper masking
 * • Configures parent-child relationships for coordinated movement
 * • Optimizes composition settings for 4K output (3840x2160)
 * 
 * @usage
 * 1. Select an existing composition in your project
 * 2. Run the script - no user interface required
 * 3. The script creates "Sliders 16x9" and "Slide 16x9" compositions
 * 4. Use the CTRL slider effect on the main layer to animate transitions
 * 5. Add content to the "Slide 16x9" composition for your slides
 * 6. Adjust slider values from 0-100 to control transition position
 * 
 * @requirements
 * • Adobe After Effects CS6 or later
 * • An existing composition must be selected in the project panel
 * • Sufficient memory for 4K composition handling
 * 
 * @notes
 * • Output resolution is 3840x2160 at 60fps for smooth playback
 * • Slider control uses linear interpolation for smooth transitions
 * • Mask layers are disabled by default to prevent visual interference
 * • Expression references specific composition names - avoid renaming
 * • Background color is set to dark gray (38, 38, 38) for professional look
 */

// Originally created using compCode v1.2.2

try {
	app.beginUndoGroup("Slidotron 16x9");
	compCode_20230624_205236();
	app.endUndoGroup();
} catch (error) {
	alert(error.toString() +
		"\nScript file: " + File.decode(error.fileName).replace(/^.*[\|\/]/, "") +
		"\nError on line: " + error.line
	);
}

function compCode_20230624_205236() {

	var tempStartingComp = app.project.activeItem;
	if (!tempStartingComp || !(tempStartingComp instanceof CompItem)) {
		alert("Please select a composition first");
		return;
	}



	// CREATE COMPOSITIONS START
	var comp1_comp = tempStartingComp;
	var sliders16x9_comp_properties = { "name": "Sliders 16x9", "label": 13, "comment": "", "height": 2160, "width": 3840, "pixelAspect": 1, "bgColor": [0.14901960784314, 0.14901960784314, 0.14901960784314], "duration": 600, "numLayers": 4, "frameRate": 60, "itemIsCompItem": { "type": "function", "arguments": ["item"], "body": "return item instanceof CompItem;" } };
	var sliders16x9_comp = app.project.items.addComp(sliders16x9_comp_properties.name, sliders16x9_comp_properties.width, sliders16x9_comp_properties.height, sliders16x9_comp_properties.pixelAspect, sliders16x9_comp_properties.duration, sliders16x9_comp_properties.frameRate);
	sliders16x9_comp.time = 0;
	sliders16x9_comp.bgColor = sliders16x9_comp_properties.bgColor;
	sliders16x9_comp.motionBlurAdaptiveSampleLimit = 90;
	sliders16x9_comp.resolutionFactor = [1, 1];
	var slide16x9_comp_properties = { "name": "Slide 16x9", "label": 13, "comment": "", "height": 2160, "width": 3840, "pixelAspect": 1, "bgColor": [0.14901960784314, 0.14901960784314, 0.14901960784314], "duration": 600, "numLayers": 1, "frameRate": 60, "itemIsCompItem": { "type": "function", "arguments": ["item"], "body": "return item instanceof CompItem;" } };
	var slide16x9_comp = app.project.items.addComp(slide16x9_comp_properties.name, slide16x9_comp_properties.width, slide16x9_comp_properties.height, slide16x9_comp_properties.pixelAspect, slide16x9_comp_properties.duration, slide16x9_comp_properties.frameRate);
	slide16x9_comp.time = 0;
	slide16x9_comp.bgColor = slide16x9_comp_properties.bgColor;
	slide16x9_comp.motionBlurAdaptiveSampleLimit = 90;
	slide16x9_comp.resolutionFactor = [1, 1];
	// CREATE COMPOSITIONS END

	// Working with comp "Comp 1", varName "comp1_comp";
	comp1_comp.openInViewer();
	// Add existing composition "Sliders 16x9", varName "sliders16x9_comp";
	var sliders16x9 = comp1_comp.layers.add(sliders16x9_comp);
	sliders16x9.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
	sliders16x9.property("ADBE Effect Parade").property(1).name = "CTRL";
	sliders16x9.property("ADBE Effect Parade").property(1).property("ADBE Slider Control-0001").setValue(116);
	sliders16x9.selected = false;


	// Apply hidden values

	// Working with comp "Sliders 16x9", varName "sliders16x9_comp";
	// Add Shape Layer "Mask L", varName "maskL";
	var maskL = sliders16x9_comp.layers.addShape();
	maskL.name = "Mask L";
	maskL.enabled = false;
	maskL.outPoint = 2100;
	maskL.moveToEnd();
	maskL.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	maskL.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
	maskL.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([1920, 2160]);
	maskL.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372550725937, 0.3098039329052, 0.08627451211214, 1]);
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
	maskL.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
	maskL.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	maskL.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").setValue([-282.207763671875, -11.171630859375]);
	maskL.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([-1242.20776367188, -11.171630859375, 0]);
	maskL.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = true;
	maskL.property("ADBE Transform Group").property("ADBE Position_0").setValue(1920);
	maskL.property("ADBE Transform Group").property("ADBE Scale").setValue([-100, 100, 100]);
	maskL.selected = false;
	// Add Shape Layer "Mask R", varName "maskR";
	var maskR = sliders16x9_comp.layers.addShape();
	maskR.name = "Mask R";
	maskR.enabled = false;
	maskR.outPoint = 2100;
	maskR.moveToEnd();
	maskR.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	maskR.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
	maskR.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([1920, 2160]);
	maskR.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372550725937, 0.3098039329052, 0.08627451211214, 1]);
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
	maskR.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
	maskR.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	maskR.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").setValue([-282.207763671875, -11.171630859375]);
	maskR.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([-1242.20776367188, -11.171630859375, 0]);
	maskR.property("ADBE Transform Group").property("ADBE Position").dimensionsSeparated = true;
	maskR.property("ADBE Transform Group").property("ADBE Position_0").setValue(1920);
	maskR.selected = false;
	// Add existing composition "Slide 16x9", varName "slide16x9_comp";
	var slide16x9 = sliders16x9_comp.layers.add(slide16x9_comp);
	slide16x9.moveToEnd();
	slide16x9.setTrackMatte(maskL, TrackMatteType.ALPHA);
	slide16x9.selected = false;
	// Add existing composition "Slide 16x9", varName "slide16x9_comp";
	var slide16x10 = sliders16x9_comp.layers.add(slide16x9_comp);
	slide16x10.moveToEnd();
	slide16x10.setTrackMatte(maskR, TrackMatteType.ALPHA);
	slide16x10.selected = false;
	// Apply parents
	slide16x9.parent = maskL;
	slide16x10.parent = maskR;


	// Apply expressions to properties
	maskL.property("ADBE Transform Group").property("ADBE Position_0").expression = "d = comp(\"Comp 1\").layer(\"Sliders 16x9\").effect(\"CTRL\")(\"Slider\")\riMin = 0;\riMax = 100;\roMin = -5;\roMax = 1920;\rlinear(d, iMin, iMax, oMin, oMax)";
	maskR.property("ADBE Transform Group").property("ADBE Position_0").expression = "d = comp(\"Comp 1\").layer(\"Sliders 16x9\").effect(\"CTRL\")(\"Slider\")\riMin = 0;\riMax = 100;\roMin = 1920*2;\roMax = 1920;\rlinear(d, iMin, iMax, oMin, oMax)";

	comp1_comp.openInViewer();

	return {
		compItem: comp1_comp,
	};

}

