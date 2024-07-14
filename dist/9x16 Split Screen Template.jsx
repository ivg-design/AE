// Created using compCode v1.2.2
// 20230625 from composition "Comp 2" in project "~/Desktop/Extrudalizer/DEMO VIDEOS/BOOK/Book Tutorial.aep"
//
// aescripts.com/compCode

try {
	app.beginUndoGroup("Comp 2");
	compCode_20230625_131536();
	app.endUndoGroup();
} catch (error) {
	alert(error.toString() +
		"\nScript file: " + File.decode(error.fileName).replace(/^.*[\|\/]/, "") +
		"\nError on line: " + error.line
	);
}

function compCode_20230625_131536() {

	var tempStartingComp = app.project.activeItem;
	if (!tempStartingComp || !(tempStartingComp instanceof CompItem)) {
		alert("Please select a composition first");
		return;
	}

	// Create array to save strings to replace in expressions
	var renamedPropertiesArray = [];

	// CREATE FOLDER HIERARCHY START
	var x16Template_folder_properties = { "name": "9x16 Template", "label": 2, "comment": "", "itemIsFolderItem": { "type": "function", "arguments": ["item"], "body": "return item instanceof FolderItem;" } };
	var x16Template_folder = findProjectItem(app.project.rootFolder, false, x16Template_folder_properties);
	if (x16Template_folder === null) {
		x16Template_folder = app.project.items.addFolder(x16Template_folder_properties.name);
		x16Template_folder.label = x16Template_folder_properties.label;
	}
	// CREATE FOLDER HIERARCHY END
	
	var prefix = null;
	// CREATE COMPOSITIONS START
	var comp2_comp = tempStartingComp;
	// CREATE COMPOSITIONS END

	// Working with comp "Comp 2", varName "comp2_comp";
	comp2_comp.openInViewer();
	// Add Shape Layer "name:S- PiP Content PSR", varName "sPipContentPsr3";
	var sPipContentPsr3 = comp2_comp.layers.addShape();
	sPipContentPsr3.name = "name:S- PiP Content PSR";
	promptName("Please enter Layer name (Timeline).", sPipContentPsr3);
	sPipContentPsr3.label = 9;
	sPipContentPsr3.guideLayer = true;
	sPipContentPsr3.moveToEnd();
	var sPipContentPsr3_marker1 = new MarkerValue("Controller");
	sPipContentPsr3_marker1.label = 0;
	sPipContentPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "C";
	flashVideoCuePointParameters["duik.controllerType"] = "4";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Controller";
	flashVideoCuePointParameters["duaef"] = "true";
	sPipContentPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sPipContentPsr3.property("ADBE Marker").setValueAtTime(0, sPipContentPsr3_marker1);
	sPipContentPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sPipContentPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sPipContentPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Path 1";
	var sPipContentPsr3Path = sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).property("ADBE Vector Shape");
	var sPipContentPsr3Path_newShape = new Shape();
	sPipContentPsr3Path_newShape.vertices = [[-4.37136840820312, 6.12120056152344], [-4.32662963867188, 6.210693359375], [-1.1944580078125, 9.34286499023438], [-0.03108215332031, 10.2825164794922], [1.17703247070312, 9.29811096191406], [3.36955261230469, 7.1055908203125], [4.35395812988281, 5.85272216796875], [2.60888671875, 5.31578063964844], [-1.95512390136719, 5.31578063964844]];
	sPipContentPsr3Path_newShape.inTangents = [[-0.33901977539062, -1.08132934570312], [-0.02835083007812, -0.0350341796875], [-1.06901550292969, -1.06901550292969], [-0.44099426269531, 0.00202941894531], [-0.287353515625, 0.287353515625], [-0.74656677246094, 0.74658203125], [0.03565979003906, 0.48486328125], [0.93760681152344, 0], [1.48287963867188, 0]];
	sPipContentPsr3Path_newShape.outTangents = [[0.01744079589844, 0.05563354492188], [0.89497375488281, 1.10601806640625], [0.29437255859375, 0.29437255859375], [0.5064697265625, -0.00233459472656], [0.812255859375, -0.81224060058594], [0.30743408203125, -0.30741882324219], [-0.04267883300781, -0.58038330078125], [-1.57394409179688, 0], [-0.99119567871094, 0]];
	sPipContentPsr3Path_newShape.closed = true;
	sPipContentPsr3Path.setValue(sPipContentPsr3Path_newShape);
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Path 2";
	var sPipContentPsr3Path1 = sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Shape");
	var sPipContentPsr3Path1_newShape = new Shape();
	sPipContentPsr3Path1_newShape.vertices = [[-4.37837219238281, -5.72264099121094], [-2.23060607910156, -5.31993103027344], [2.51239013671875, -5.31993103027344], [4.34695434570312, -5.90162658691406], [3.36256408691406, -7.1097412109375], [1.1700439453125, -9.30226135253906], [-0.08282470703125, -10.2866668701172], [-1.29095458984375, -9.30226135253906], [-3.48347473144531, -7.1097412109375]];
	sPipContentPsr3Path1_newShape.inTangents = [[-0.17442321777344, -0.57173156738281], [-0.81723022460938, 0], [-1.21969604492188, 0], [-0.01921081542969, 0.65528869628906], [0.28921508789062, 0.28921508789062], [0.77938842773438, 0.77938842773438], [0.48147583007812, -0.01341247558594], [0.3587646484375, -0.3587646484375], [0.70394897460938, -0.70394897460938]];
	sPipContentPsr3Path1_newShape.outTangents = [[0.17921447753906, 0.58746337890625], [1.20896911621094, 0], [0.92657470703125, 0], [0.01382446289062, -0.47140502929688], [-0.76698303222656, -0.76698303222656], [-0.30264282226562, -0.30264282226562], [-0.48069763183594, 0.01339721679688], [-0.8038330078125, 0.8038330078125], [-0.36590576171875, 0.36590576171875]];
	sPipContentPsr3Path1_newShape.closed = true;
	sPipContentPsr3Path1.setValue(sPipContentPsr3Path1_newShape);
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(3).name = "Path 3";
	var sPipContentPsr3Path2 = sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(3).property("ADBE Vector Shape");
	var sPipContentPsr3Path2_newShape = new Shape();
	sPipContentPsr3Path2_newShape.vertices = [[5.77256774902344, -4.40451049804688], [5.36985778808594, -2.25674438476562], [5.36985778808594, 2.48625183105469], [5.95155334472656, 4.32081604003906], [7.15966796875, 3.33641052246094], [9.35218811035156, 1.14390563964844], [10.3365936279297, -0.10896301269531], [9.35218811035156, -1.31709289550781], [7.15966796875, -3.50961303710938]];
	sPipContentPsr3Path2_newShape.inTangents = [[0.57173156738281, -0.17442321777344], [0, -0.81723022460938], [0, -1.21969604492188], [-0.65528869628906, -0.01922607421875], [-0.28921508789062, 0.28923034667969], [-0.77938842773438, 0.77938842773438], [0.01341247558594, 0.48147583007812], [0.3587646484375, 0.3587646484375], [0.70394897460938, 0.70394897460938]];
	sPipContentPsr3Path2_newShape.outTangents = [[-0.58746337890625, 0.17921447753906], [0, 1.20896911621094], [0, 0.92657470703125], [0.47142028808594, 0.01382446289062], [0.76698303222656, -0.7669677734375], [0.30264282226562, -0.30264282226562], [-0.01339721679688, -0.48069763183594], [-0.8038330078125, -0.8038330078125], [-0.36590576171875, -0.36590576171875]];
	sPipContentPsr3Path2_newShape.closed = true;
	sPipContentPsr3Path2.setValue(sPipContentPsr3Path2_newShape);
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(4).name = "Path 4";
	var sPipContentPsr3Path3 = sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(4).property("ADBE Vector Shape");
	var sPipContentPsr3Path3_newShape = new Shape();
	sPipContentPsr3Path3_newShape.vertices = [[-5.69650268554688, 4.16021728515625], [-5.29379272460938, 2.012451171875], [-5.29379272460938, -2.73054504394531], [-5.87548828125, -4.56510925292969], [-7.08360290527344, -3.58070373535156], [-9.276123046875, -1.38818359375], [-10.2605285644531, -0.13531494140625], [-9.276123046875, 1.07279968261719], [-7.08360290527344, 3.26531982421875]];
	sPipContentPsr3Path3_newShape.inTangents = [[-0.57173156738281, 0.17442321777344], [0, 0.81723022460938], [0, 1.21969604492188], [0.65528869628906, 0.01922607421875], [0.28921508789062, -0.28923034667969], [0.77938842773438, -0.77938842773438], [-0.01341247558594, -0.48149108886719], [-0.3587646484375, -0.3587646484375], [-0.70394897460938, -0.70393371582031]];
	sPipContentPsr3Path3_newShape.outTangents = [[0.58746337890625, -0.17919921875], [0, -1.20896911621094], [0, -0.92657470703125], [-0.47140502929688, -0.01382446289062], [-0.76698303222656, 0.7669677734375], [-0.30264282226562, 0.30262756347656], [0.01339721679688, 0.48068237304688], [0.8038330078125, 0.8038330078125], [0.36590576171875, 0.36590576171875]];
	sPipContentPsr3Path3_newShape.closed = true;
	sPipContentPsr3Path3.setValue(sPipContentPsr3Path3_newShape);
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Fill");
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(5).name = "Fill 1";
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(5).property("ADBE Vector Fill Color").setValue([0.92150002717972, 0.86104410886765, 0.17640000581741, 1]);
	sPipContentPsr3.property("ADBE Root Vectors Group").property(2).property(3).property("ADBE Vector Scale").setValue([300, 300]);
	sPipContentPsr3.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0, 0]);
	sPipContentPsr3.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
	sPipContentPsr3.selected = false;
	// Add Shape Layer "name:S- PiP MASK PSR", varName "sPipMaskPsr3";
	var sPipMaskPsr3 = comp2_comp.layers.addShape();
	sPipMaskPsr3.name = "name:S- PiP MASK PSR";
	promptName("Please enter Layer name (Timeline).", sPipMaskPsr3);
	sPipMaskPsr3.label = 9;
	sPipMaskPsr3.guideLayer = true;
	sPipMaskPsr3.moveToEnd();
	var sPipMaskPsr3_marker1 = new MarkerValue("Controller");
	sPipMaskPsr3_marker1.label = 0;
	sPipMaskPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "C";
	flashVideoCuePointParameters["duik.controllerType"] = "1";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Controller";
	flashVideoCuePointParameters["duaef"] = "true";
	sPipMaskPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sPipMaskPsr3.property("ADBE Marker").setValueAtTime(0, sPipMaskPsr3_marker1);
	sPipMaskPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sPipMaskPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Path 1";
	var sPipMaskPsr3Path = sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).property("ADBE Vector Shape");
	var sPipMaskPsr3Path_newShape = new Shape();
	sPipMaskPsr3Path_newShape.vertices = [[2.056640625, -9.75], [0.990234375, -8.68359375], [2.58984375, -6.703125], [6.626953125, -0.076171875], [0.076171875, 6.626953125], [-5.865234375, -3.123046875], [-4.875, -4.5703125], [-6.85546875, -6.703125], [-8.759765625, -4.265625], [-9.75, -0.837890625], [-9.75, 0.837890625], [-0.9140625, 9.75], [0.9140625, 9.75], [9.75, 0.9140625], [9.75, -0.9140625], [8.2265625, -5.33203125], [7.083984375, -6.703125], [7.998046875, -7.693359375], [8.07421875, -9.75]];
	sPipMaskPsr3Path_newShape.inTangents = [[2.005859375, 0], [0.0015869140625, -0.69969177246094], [-0.49990844726562, -0.48155212402344], [-0.04017639160156, -3.57786560058594], [3.85107421875, -0.04324340820312], [-2.50245666503906, 4.65560913085938], [-0.01554870605469, 0.42816162109375], [0.33816528320312, 0.01190185546875], [0.25460815429688, -0.52194213867188], [0.08270263671875, -0.79292297363281], [0, -0.55859375], [-5.07618713378906, -0.83979797363281], [-0.609375, 0], [-0.84111022949219, 5.04954528808594], [0, 0.609375], [0.709716796875, 1.11143493652344], [0, 0], [-0.19541931152344, 0.19938659667969], [1.10447692871094, 0.51457214355469]];
	sPipMaskPsr3Path_newShape.outTangents = [[-0.73707580566406, 0.23561096191406], [-0.00164794921875, 0.72453308105469], [1.75889587402344, 1.69425964355469], [0.04222106933594, 3.75981140136719], [-4.633544921875, 0.05203247070312], [0.24662780761719, -0.45884704589844], [0.01921081542969, -0.52926635742188], [-0.65528869628906, -0.02305603027344], [-0.56880187988281, 1.166015625], [0, 0.55859375], [0.79978942871094, 5.11613464355469], [0.609375, 0], [5.06004333496094, -0.83062744140625], [0, -0.609375], [-0.28445434570312, -1.82806396484375], [-0.24267578125, -0.38003540039062], [0, 0], [0.67193603515625, -0.685546875], [-2.005859375, 0]];
	sPipMaskPsr3Path_newShape.closed = true;
	sPipMaskPsr3Path.setValue(sPipMaskPsr3Path_newShape);
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Fill");
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Fill 1";
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 1, 0.82979226112366, 1]);
	sPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(3).property("ADBE Vector Scale").setValue([500, 500]);
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(1).name = "Mask Size X";
	sPipMaskPsr3.property("ADBE Effect Parade").property(1).property("ADBE Slider Control-0001").setValue(466);
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(2).name = "Mask Size Y";
	sPipMaskPsr3.property("ADBE Effect Parade").property(2).property("ADBE Slider Control-0001").setValue(413);
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(3).name = "PiP Shadow Opacity";
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(4).name = "PiP Shadow Distance";
	sPipMaskPsr3.property("ADBE Effect Parade").property(4).property("ADBE Slider Control-0001").setValue(22);
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(5).name = "PiP Shadow Softness";
	sPipMaskPsr3.property("ADBE Effect Parade").property(5).property("ADBE Slider Control-0001").setValue(6);
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Color Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(6).name = "PiP Shadow Color";
	sPipMaskPsr3.property("ADBE Effect Parade").property(6).property("ADBE Color Control-0001").setValue([0, 0, 0, 1]);
	sPipMaskPsr3.property("ADBE Effect Parade").addProperty("ADBE Angle Control");
	sPipMaskPsr3.property("ADBE Effect Parade").property(7).name = "Pip Shadow Angle";
	sPipMaskPsr3.property("ADBE Effect Parade").property(7).property("ADBE Angle Control-0001").setValue(134);
	sPipMaskPsr3.property("ADBE Transform Group").property("ADBE Position").setValue([27, -298, 0]);
	sPipMaskPsr3.property("ADBE Transform Group").property("ADBE Scale").setValue([120, 120, 100]);
	sPipMaskPsr3.selected = false;
	// Add Shape Layer "name:S- Top PSR", varName "sTopPsr3";
	var sTopPsr3 = comp2_comp.layers.addShape();
	sTopPsr3.name = "name:S- Top PSR";
	promptName("Please enter Layer name (Timeline).", sTopPsr3);
	sTopPsr3.label = 9;
	sTopPsr3.guideLayer = true;
	sTopPsr3.moveToEnd();
	var sTopPsr3_marker1 = new MarkerValue("Controller");
	sTopPsr3_marker1.label = 0;
	sTopPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "C";
	flashVideoCuePointParameters["duik.controllerType"] = "4";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Controller";
	flashVideoCuePointParameters["duaef"] = "true";
	sTopPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sTopPsr3.property("ADBE Marker").setValueAtTime(0, sTopPsr3_marker1);
	sTopPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sTopPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sTopPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sTopPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Path 1";
	var sTopPsr3Path = sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).property("ADBE Vector Shape");
	var sTopPsr3Path_newShape = new Shape();
	sTopPsr3Path_newShape.vertices = [[-4.37136840820312, 6.12120056152344], [-4.32662963867188, 6.210693359375], [-1.1944580078125, 9.34286499023438], [-0.03108215332031, 10.2825164794922], [1.17703247070312, 9.29811096191406], [3.36955261230469, 7.1055908203125], [4.35395812988281, 5.85272216796875], [2.60888671875, 5.31578063964844], [-1.95512390136719, 5.31578063964844]];
	sTopPsr3Path_newShape.inTangents = [[-0.33901977539062, -1.08132934570312], [-0.02835083007812, -0.0350341796875], [-1.06901550292969, -1.06901550292969], [-0.44099426269531, 0.00202941894531], [-0.287353515625, 0.287353515625], [-0.74656677246094, 0.74658203125], [0.03565979003906, 0.48486328125], [0.93760681152344, 0], [1.48287963867188, 0]];
	sTopPsr3Path_newShape.outTangents = [[0.01744079589844, 0.05563354492188], [0.89497375488281, 1.10601806640625], [0.29437255859375, 0.29437255859375], [0.5064697265625, -0.00233459472656], [0.812255859375, -0.81224060058594], [0.30743408203125, -0.30741882324219], [-0.04267883300781, -0.58038330078125], [-1.57394409179688, 0], [-0.99119567871094, 0]];
	sTopPsr3Path_newShape.closed = true;
	sTopPsr3Path.setValue(sTopPsr3Path_newShape);
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Path 2";
	var sTopPsr3Path1 = sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Shape");
	var sTopPsr3Path1_newShape = new Shape();
	sTopPsr3Path1_newShape.vertices = [[-4.37837219238281, -5.72264099121094], [-2.23060607910156, -5.31993103027344], [2.51239013671875, -5.31993103027344], [4.34695434570312, -5.90162658691406], [3.36256408691406, -7.1097412109375], [1.1700439453125, -9.30226135253906], [-0.08282470703125, -10.2866668701172], [-1.29095458984375, -9.30226135253906], [-3.48347473144531, -7.1097412109375]];
	sTopPsr3Path1_newShape.inTangents = [[-0.17442321777344, -0.57173156738281], [-0.81723022460938, 0], [-1.21969604492188, 0], [-0.01921081542969, 0.65528869628906], [0.28921508789062, 0.28921508789062], [0.77938842773438, 0.77938842773438], [0.48147583007812, -0.01341247558594], [0.3587646484375, -0.3587646484375], [0.70394897460938, -0.70394897460938]];
	sTopPsr3Path1_newShape.outTangents = [[0.17921447753906, 0.58746337890625], [1.20896911621094, 0], [0.92657470703125, 0], [0.01382446289062, -0.47140502929688], [-0.76698303222656, -0.76698303222656], [-0.30264282226562, -0.30264282226562], [-0.48069763183594, 0.01339721679688], [-0.8038330078125, 0.8038330078125], [-0.36590576171875, 0.36590576171875]];
	sTopPsr3Path1_newShape.closed = true;
	sTopPsr3Path1.setValue(sTopPsr3Path1_newShape);
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(3).name = "Path 3";
	var sTopPsr3Path2 = sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(3).property("ADBE Vector Shape");
	var sTopPsr3Path2_newShape = new Shape();
	sTopPsr3Path2_newShape.vertices = [[5.77256774902344, -4.40451049804688], [5.36985778808594, -2.25674438476562], [5.36985778808594, 2.48625183105469], [5.95155334472656, 4.32081604003906], [7.15966796875, 3.33641052246094], [9.35218811035156, 1.14390563964844], [10.3365936279297, -0.10896301269531], [9.35218811035156, -1.31709289550781], [7.15966796875, -3.50961303710938]];
	sTopPsr3Path2_newShape.inTangents = [[0.57173156738281, -0.17442321777344], [0, -0.81723022460938], [0, -1.21969604492188], [-0.65528869628906, -0.01922607421875], [-0.28921508789062, 0.28923034667969], [-0.77938842773438, 0.77938842773438], [0.01341247558594, 0.48147583007812], [0.3587646484375, 0.3587646484375], [0.70394897460938, 0.70394897460938]];
	sTopPsr3Path2_newShape.outTangents = [[-0.58746337890625, 0.17921447753906], [0, 1.20896911621094], [0, 0.92657470703125], [0.47142028808594, 0.01382446289062], [0.76698303222656, -0.7669677734375], [0.30264282226562, -0.30264282226562], [-0.01339721679688, -0.48069763183594], [-0.8038330078125, -0.8038330078125], [-0.36590576171875, -0.36590576171875]];
	sTopPsr3Path2_newShape.closed = true;
	sTopPsr3Path2.setValue(sTopPsr3Path2_newShape);
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(4).name = "Path 4";
	var sTopPsr3Path3 = sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(4).property("ADBE Vector Shape");
	var sTopPsr3Path3_newShape = new Shape();
	sTopPsr3Path3_newShape.vertices = [[-5.69650268554688, 4.16021728515625], [-5.29379272460938, 2.012451171875], [-5.29379272460938, -2.73054504394531], [-5.87548828125, -4.56510925292969], [-7.08360290527344, -3.58070373535156], [-9.276123046875, -1.38818359375], [-10.2605285644531, -0.13531494140625], [-9.276123046875, 1.07279968261719], [-7.08360290527344, 3.26531982421875]];
	sTopPsr3Path3_newShape.inTangents = [[-0.57173156738281, 0.17442321777344], [0, 0.81723022460938], [0, 1.21969604492188], [0.65528869628906, 0.01922607421875], [0.28921508789062, -0.28923034667969], [0.77938842773438, -0.77938842773438], [-0.01341247558594, -0.48149108886719], [-0.3587646484375, -0.3587646484375], [-0.70394897460938, -0.70393371582031]];
	sTopPsr3Path3_newShape.outTangents = [[0.58746337890625, -0.17919921875], [0, -1.20896911621094], [0, -0.92657470703125], [-0.47140502929688, -0.01382446289062], [-0.76698303222656, 0.7669677734375], [-0.30264282226562, 0.30262756347656], [0.01339721679688, 0.48068237304688], [0.8038330078125, 0.8038330078125], [0.36590576171875, 0.36590576171875]];
	sTopPsr3Path3_newShape.closed = true;
	sTopPsr3Path3.setValue(sTopPsr3Path3_newShape);
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Fill");
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(5).name = "Fill 1";
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(5).property("ADBE Vector Fill Color").setValue([0.92150002717972, 0.17640000581741, 0.89414429664612, 1]);
	sTopPsr3.property("ADBE Root Vectors Group").property(2).property(3).property("ADBE Vector Scale").setValue([400, 400]);
	sTopPsr3.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0, 0]);
	sTopPsr3.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
	sTopPsr3.selected = false;
	// Add Shape Layer "name:S- Bottom PSR", varName "sBottomPsr3";
	var sBottomPsr3 = comp2_comp.layers.addShape();
	sBottomPsr3.name = "name:S- Bottom PSR";
	promptName("Please enter Layer name (Timeline).", sBottomPsr3);
	sBottomPsr3.label = 9;
	sBottomPsr3.guideLayer = true;
	sBottomPsr3.moveToEnd();
	var sBottomPsr3_marker1 = new MarkerValue("Controller");
	sBottomPsr3_marker1.label = 0;
	sBottomPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "C";
	flashVideoCuePointParameters["duik.controllerType"] = "4";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Controller";
	flashVideoCuePointParameters["duaef"] = "true";
	sBottomPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sBottomPsr3.property("ADBE Marker").setValueAtTime(0, sBottomPsr3_marker1);
	sBottomPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sBottomPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Path 1";
	var sBottomPsr3Path = sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).property("ADBE Vector Shape");
	var sBottomPsr3Path_newShape = new Shape();
	sBottomPsr3Path_newShape.vertices = [[-4.37136840820312, 6.12120056152344], [-4.32662963867188, 6.210693359375], [-1.1944580078125, 9.34286499023438], [-0.03108215332031, 10.2825164794922], [1.17703247070312, 9.29811096191406], [3.36955261230469, 7.1055908203125], [4.35395812988281, 5.85272216796875], [2.60888671875, 5.31578063964844], [-1.95512390136719, 5.31578063964844]];
	sBottomPsr3Path_newShape.inTangents = [[-0.33901977539062, -1.08132934570312], [-0.02835083007812, -0.0350341796875], [-1.06901550292969, -1.06901550292969], [-0.44099426269531, 0.00202941894531], [-0.287353515625, 0.287353515625], [-0.74656677246094, 0.74658203125], [0.03565979003906, 0.48486328125], [0.93760681152344, 0], [1.48287963867188, 0]];
	sBottomPsr3Path_newShape.outTangents = [[0.01744079589844, 0.05563354492188], [0.89497375488281, 1.10601806640625], [0.29437255859375, 0.29437255859375], [0.5064697265625, -0.00233459472656], [0.812255859375, -0.81224060058594], [0.30743408203125, -0.30741882324219], [-0.04267883300781, -0.58038330078125], [-1.57394409179688, 0], [-0.99119567871094, 0]];
	sBottomPsr3Path_newShape.closed = true;
	sBottomPsr3Path.setValue(sBottomPsr3Path_newShape);
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Path 2";
	var sBottomPsr3Path1 = sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Shape");
	var sBottomPsr3Path1_newShape = new Shape();
	sBottomPsr3Path1_newShape.vertices = [[-4.37837219238281, -5.72264099121094], [-2.23060607910156, -5.31993103027344], [2.51239013671875, -5.31993103027344], [4.34695434570312, -5.90162658691406], [3.36256408691406, -7.1097412109375], [1.1700439453125, -9.30226135253906], [-0.08282470703125, -10.2866668701172], [-1.29095458984375, -9.30226135253906], [-3.48347473144531, -7.1097412109375]];
	sBottomPsr3Path1_newShape.inTangents = [[-0.17442321777344, -0.57173156738281], [-0.81723022460938, 0], [-1.21969604492188, 0], [-0.01921081542969, 0.65528869628906], [0.28921508789062, 0.28921508789062], [0.77938842773438, 0.77938842773438], [0.48147583007812, -0.01341247558594], [0.3587646484375, -0.3587646484375], [0.70394897460938, -0.70394897460938]];
	sBottomPsr3Path1_newShape.outTangents = [[0.17921447753906, 0.58746337890625], [1.20896911621094, 0], [0.92657470703125, 0], [0.01382446289062, -0.47140502929688], [-0.76698303222656, -0.76698303222656], [-0.30264282226562, -0.30264282226562], [-0.48069763183594, 0.01339721679688], [-0.8038330078125, 0.8038330078125], [-0.36590576171875, 0.36590576171875]];
	sBottomPsr3Path1_newShape.closed = true;
	sBottomPsr3Path1.setValue(sBottomPsr3Path1_newShape);
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(3).name = "Path 3";
	var sBottomPsr3Path2 = sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(3).property("ADBE Vector Shape");
	var sBottomPsr3Path2_newShape = new Shape();
	sBottomPsr3Path2_newShape.vertices = [[5.77256774902344, -4.40451049804688], [5.36985778808594, -2.25674438476562], [5.36985778808594, 2.48625183105469], [5.95155334472656, 4.32081604003906], [7.15966796875, 3.33641052246094], [9.35218811035156, 1.14390563964844], [10.3365936279297, -0.10896301269531], [9.35218811035156, -1.31709289550781], [7.15966796875, -3.50961303710938]];
	sBottomPsr3Path2_newShape.inTangents = [[0.57173156738281, -0.17442321777344], [0, -0.81723022460938], [0, -1.21969604492188], [-0.65528869628906, -0.01922607421875], [-0.28921508789062, 0.28923034667969], [-0.77938842773438, 0.77938842773438], [0.01341247558594, 0.48147583007812], [0.3587646484375, 0.3587646484375], [0.70394897460938, 0.70394897460938]];
	sBottomPsr3Path2_newShape.outTangents = [[-0.58746337890625, 0.17921447753906], [0, 1.20896911621094], [0, 0.92657470703125], [0.47142028808594, 0.01382446289062], [0.76698303222656, -0.7669677734375], [0.30264282226562, -0.30264282226562], [-0.01339721679688, -0.48069763183594], [-0.8038330078125, -0.8038330078125], [-0.36590576171875, -0.36590576171875]];
	sBottomPsr3Path2_newShape.closed = true;
	sBottomPsr3Path2.setValue(sBottomPsr3Path2_newShape);
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Group");
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(4).name = "Path 4";
	var sBottomPsr3Path3 = sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(4).property("ADBE Vector Shape");
	var sBottomPsr3Path3_newShape = new Shape();
	sBottomPsr3Path3_newShape.vertices = [[-5.69650268554688, 4.16021728515625], [-5.29379272460938, 2.012451171875], [-5.29379272460938, -2.73054504394531], [-5.87548828125, -4.56510925292969], [-7.08360290527344, -3.58070373535156], [-9.276123046875, -1.38818359375], [-10.2605285644531, -0.13531494140625], [-9.276123046875, 1.07279968261719], [-7.08360290527344, 3.26531982421875]];
	sBottomPsr3Path3_newShape.inTangents = [[-0.57173156738281, 0.17442321777344], [0, 0.81723022460938], [0, 1.21969604492188], [0.65528869628906, 0.01922607421875], [0.28921508789062, -0.28923034667969], [0.77938842773438, -0.77938842773438], [-0.01341247558594, -0.48149108886719], [-0.3587646484375, -0.3587646484375], [-0.70394897460938, -0.70393371582031]];
	sBottomPsr3Path3_newShape.outTangents = [[0.58746337890625, -0.17919921875], [0, -1.20896911621094], [0, -0.92657470703125], [-0.47140502929688, -0.01382446289062], [-0.76698303222656, 0.7669677734375], [-0.30264282226562, 0.30262756347656], [0.01339721679688, 0.48068237304688], [0.8038330078125, 0.8038330078125], [0.36590576171875, 0.36590576171875]];
	sBottomPsr3Path3_newShape.closed = true;
	sBottomPsr3Path3.setValue(sBottomPsr3Path3_newShape);
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Fill");
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(5).name = "Fill 1";
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(5).property("ADBE Vector Fill Color").setValue([0.23456498980522, 0.92150002717972, 0.17640000581741, 1]);
	sBottomPsr3.property("ADBE Root Vectors Group").property(2).property(3).property("ADBE Vector Scale").setValue([400, 400]);
	sBottomPsr3.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0, 0]);
	sBottomPsr3.selected = false;
	// Add Shape Layer "name:S- PiP Mask", varName "sPipMask3";
	var sPipMask3 = comp2_comp.layers.addShape();
	sPipMask3.name = "name:S- PiP Mask";
	promptName("Please enter Layer name (Timeline).", sPipMask3);
	sPipMask3.moveToEnd();
	sPipMask3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sPipMask3.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([563.318359375, 553.2041015625]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Position").setValue([0, 0]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Roundness").setValue(0);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(2).enabled = false;
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372549019608, 0.30980392156863, 0.08627450980392, 1]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Anchor").setValue([0, 0]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").setValue([172.7, 62.60205078125]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Scale").setValue([196, 196]);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew").setValue(0);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew Axis").setValue(0);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Rotation").setValue(0);
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Group Opacity").setValue(100);

	sPipMask3.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0, 0]);
	sPipMask3.property("ADBE Transform Group").property("ADBE Position").setValue([209, -81, 0]);
	sPipMask3.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
	sPipMask3.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(0);
	sPipMask3.property("ADBE Transform Group").property("ADBE Opacity").setValue(100);
	sPipMask3.shy = true;
	sPipMask3.selected = false;

	// Add Shape Layer "name:S- PiP Mask Shadow", varName "sPipMask4";
	var sPipMask4 = comp2_comp.layers.addShape();
	sPipMask4.name = "name:S- PiP Mask Shadow";
	promptName("Please enter Layer name (Timeline).", sPipMask4);
	sPipMask4.moveToEnd();
	sPipMask4.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sPipMask4.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([563.318359375, 553.2041015625]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Position").setValue([0, 0]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Roundness").setValue(0);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(2).enabled = false;
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372549019608, 0.30980392156863, 0.08627450980392, 1]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Anchor").setValue([0, 0]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").setValue([172.7, 62.60205078125]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Scale").setValue([196, 196]);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew").setValue(0);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew Axis").setValue(0);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Rotation").setValue(0);
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Group Opacity").setValue(100);
	sPipMask4.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
	sPipMask4.property("ADBE Effect Parade").property(1).name = "Drop Shadow";
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0001").setValue([0, 0, 0, 1]);
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0002").setValue(127.5);
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0003").setValue(135);
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0004").setValue(5);
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0005").setValue(0);
	sPipMask4.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0, 0]);
	sPipMask4.property("ADBE Transform Group").property("ADBE Position").setValue([209, -81, 0]);
	sPipMask4.property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100]);
	sPipMask4.property("ADBE Transform Group").property("ADBE Rotate Z").setValue(0);
	sPipMask4.property("ADBE Transform Group").property("ADBE Opacity").setValue(100);
	sPipMask4.enabled = false;
	sPipMask4.shy = true;
	sPipMask4.selected = false;


	// Add Shape Layer "name:S- Mask Bottom", varName "sMaskBottom3";
	var sMaskBottom3 = comp2_comp.layers.addShape();
	sMaskBottom3.name = "name:S- Mask Bottom";
	promptName("Please enter Layer name (Timeline).", sMaskBottom3);
	sMaskBottom3.enabled = false;
	sMaskBottom3.moveToEnd();
	sMaskBottom3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([1080, 960]);
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372549019608, 0.30980392156863, 0.08627450980392, 1]);
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
	sMaskBottom3.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0.62038406671262, 0.21767193663354, 0.21767193663354, 1]);
	sMaskBottom3.property("ADBE Effect Parade").addProperty("ADBE Drop Shadow");
	sMaskBottom3.property("ADBE Effect Parade").property(1).name = "Drop Shadow";
	sMaskBottom3.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, -480, 0]);
	sMaskBottom3.enabled = false;
	sMaskBottom3.shy = true;
	sMaskBottom3.selected = false;
	// Add Shape Layer "name:S- Mask Top", varName "sMaskTop3";
	var sMaskTop3 = comp2_comp.layers.addShape();
	sMaskTop3.name = "name:S- Mask Top";
	promptName("Please enter Layer name (Timeline).", sMaskTop3);
	sMaskTop3.enabled = false;
	sMaskTop3.moveToEnd();
	sMaskTop3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sMaskTop3.property("ADBE Root Vectors Group").property(1).name = "Rectangle 1";
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Rect");
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Rectangle Path 1";
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").setValue([1080, 960]);
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Stroke 1";
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.71372549019608, 0.30980392156863, 0.08627450980392, 1]);
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Stroke Width").setValue(0);
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(3).name = "Fill 1";
	sMaskTop3.property("ADBE Root Vectors Group").property(1).property(2).property(3).property("ADBE Vector Fill Color").setValue([0.62038406671262, 0.21767193663354, 0.21767193663354, 1]);
	sMaskTop3.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 480, 0]);
	sMaskTop3.enabled = false;
	sMaskTop3.shy = true;
	sMaskTop3.selected = false;
	// Add Shape Layer "name:S- Z < Bottom PSR >", varName "sZBottomPsr3";
	var sZBottomPsr3 = comp2_comp.layers.addShape();
	sZBottomPsr3.name = "name:S- Z < Bottom PSR >";
	promptName("Please enter Layer name (Timeline).", sZBottomPsr3);
	sZBottomPsr3.enabled = false;
	sZBottomPsr3.shy = true;
	sZBottomPsr3.guideLayer = true;
	sZBottomPsr3.moveToEnd();
	var sZBottomPsr3_marker1 = new MarkerValue("Zero");
	sZBottomPsr3_marker1.label = 0;
	sZBottomPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "Z";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Zero";
	flashVideoCuePointParameters["duaef"] = "true";
	sZBottomPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sZBottomPsr3.property("ADBE Marker").setValueAtTime(0, sZBottomPsr3_marker1);
	sZBottomPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sZBottomPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sZBottomPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Rect");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Rectangle Path 1";
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Stroke 1";
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.74110001325607, 0.18430000543594, 0.76859998703003, 1]);
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Width").setValue(1);
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Line Cap").setValue(2);
	sZBottomPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property(9).property("ADBE Vector Stroke Dash 1").setValue(2);
	sZBottomPsr3.property("ADBE Transform Group").property("ADBE Position").setValue([540, 1440, 0]);
	sZBottomPsr3.selected = false;
	// Add Shape Layer "name:S- Z < Top PSR >", varName "sZTopPsr3";
	var sZTopPsr3 = comp2_comp.layers.addShape();
	sZTopPsr3.name = "name:S- Z < Top PSR >";
	promptName("Please enter Layer name (Timeline).", sZTopPsr3);
	sZTopPsr3.enabled = false;
	sZTopPsr3.shy = true;
	sZTopPsr3.guideLayer = true;
	sZTopPsr3.moveToEnd();
	var sZTopPsr3_marker1 = new MarkerValue("Zero");
	sZTopPsr3_marker1.label = 0;
	sZTopPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "Z";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Zero";
	flashVideoCuePointParameters["duaef"] = "true";
	sZTopPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sZTopPsr3.property("ADBE Marker").setValueAtTime(0, sZTopPsr3_marker1);
	sZTopPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sZTopPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sZTopPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Rect");
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Rectangle Path 1";
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Stroke 1";
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.74110001325607, 0.18430000543594, 0.76859998703003, 1]);
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Width").setValue(1);
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Line Cap").setValue(2);
	sZTopPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property(9).property("ADBE Vector Stroke Dash 1").setValue(2);
	sZTopPsr3.property("ADBE Transform Group").property("ADBE Position").setValue([540, 480.008666992188, 0]);
	sZTopPsr3.selected = false;
	// Add Shape Layer "name:S- Z < PiP MASK PSR >", varName "sZPipMaskPsr3";
	var sZPipMaskPsr3 = comp2_comp.layers.addShape();
	sZPipMaskPsr3.name = "name:S- Z < PiP MASK PSR >";
	promptName("Please enter Layer name (Timeline).", sZPipMaskPsr3);
	sZPipMaskPsr3.enabled = false;
	sZPipMaskPsr3.shy = true;
	sZPipMaskPsr3.guideLayer = true;
	sZPipMaskPsr3.moveToEnd();
	var sZPipMaskPsr3_marker1 = new MarkerValue("Zero");
	sZPipMaskPsr3_marker1.label = 0;
	sZPipMaskPsr3_marker1.eventCuePoint = true;
	var flashVideoCuePointParameters = {};
	flashVideoCuePointParameters["duik.type"] = "Z";
	flashVideoCuePointParameters["keys"] = "\nfunction anonymous() {\n    [compiled code]\n}\n";
	flashVideoCuePointParameters["groups"] = "Zero";
	flashVideoCuePointParameters["duaef"] = "true";
	sZPipMaskPsr3_marker1.setParameters(flashVideoCuePointParameters);
	sZPipMaskPsr3.property("ADBE Marker").setValueAtTime(0, sZPipMaskPsr3_marker1);
	sZPipMaskPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).name = "Anchor";
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Shape - Ellipse");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).name = "Ellipse Path 1";
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Ellipse Size").setValue([4, 4]);
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).addProperty("ADBE Vector Graphic - Fill");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).name = "Fill 1";
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(1).property(2).property(2).property("ADBE Vector Fill Color").setValue([0, 0, 0, 1]);
	sZPipMaskPsr3.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).name = "Icon";
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Shape - Rect");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(1).name = "Rectangle Path 1";
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).addProperty("ADBE Vector Graphic - Stroke");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).name = "Stroke 1";
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Dashes").addProperty("ADBE Vector Stroke Dash 1");
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Color").setValue([0.74110001325607, 0.18430000543594, 0.76859998703003, 1]);
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Width").setValue(1);
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property("ADBE Vector Stroke Line Cap").setValue(2);
	sZPipMaskPsr3.property("ADBE Root Vectors Group").property(2).property(2).property(2).property(9).property("ADBE Vector Stroke Dash 1").setValue(2);
	sZPipMaskPsr3.selected = false;
	// Apply parents
	sPipContentPsr3.setParentWithJump(sPipMaskPsr3);
	sPipMaskPsr3.setParentWithJump(sZPipMaskPsr3);
	sTopPsr3.setParentWithJump(sZTopPsr3);
	sBottomPsr3.setParentWithJump(sZBottomPsr3);
	sPipMask3.setParentWithJump(sPipMaskPsr3);
	sPipMask4.setParentWithJump(sPipMaskPsr3);



	// Apply expressions to properties
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").expression = "x = thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"Mask Size X\")(\"Slider\");\ry = thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"Mask Size Y\")(\"Slider\");\r[x,y]";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Position").expression = "[0, 0]";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Roundness").expression = "0";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Anchor").expression = "[0, 0]";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").expression = "[0,0]";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Scale").expression = "[100, 100]";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew").expression = "0";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew Axis").expression = "0";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Rotation").expression = "0";
	sPipMask4.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Group Opacity").expression = "100";
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0001").expression = "thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"PiP Shadow Color\")(\"Color\")";
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0002").expression = "thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"PiP Shadow Opacity\")(\"Slider\")";
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0003").expression = "thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"Pip Shadow Angle\")(\"Angle\")";
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0004").expression = "thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"PiP Shadow Distance\")(\"Slider\")";
	sPipMask4.property("ADBE Effect Parade").property(1).property("ADBE Drop Shadow-0005").expression = "thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"PiP Shadow Softness\")(\"Slider\")";
	sPipMask4.property("ADBE Transform Group").property("ADBE Anchor Point").expression = "[0, 0, 0]";
	sPipMask4.property("ADBE Transform Group").property("ADBE Position").expression = "[0, 0, 0]";
	sPipMask4.property("ADBE Transform Group").property("ADBE Scale").expression = "[100, 100, 100]";
	sPipMask4.property("ADBE Transform Group").property("ADBE Rotate Z").expression = "0";
	sPipMask4.property("ADBE Transform Group").property("ADBE Opacity").expression = "100";

	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Size").expression = "x = thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"Mask Size X\")(\"Slider\");\ry = thisComp.layer(\"name:S- PiP MASK PSR\").effect(\"Mask Size Y\")(\"Slider\");\r[x,y]";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Position").expression = "[0, 0]";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(2).property(1).property("ADBE Vector Rect Roundness").expression = "0";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Anchor").expression = "[0, 0]";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Position").expression = "[0,0]";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Scale").expression = "[100, 100]";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew").expression = "0";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Skew Axis").expression = "0";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Rotation").expression = "0";
	sPipMask3.property("ADBE Root Vectors Group").property(1).property(3).property("ADBE Vector Group Opacity").expression = "100";
	sPipMask3.property("ADBE Transform Group").property("ADBE Anchor Point").expression = "[0, 0, 0]";
	sPipMask3.property("ADBE Transform Group").property("ADBE Position").expression = "[0, 0, 0]";
	sPipMask3.property("ADBE Transform Group").property("ADBE Scale").expression = "[100, 100, 100]";
	sPipMask3.property("ADBE Transform Group").property("ADBE Rotate Z").expression = "0";
	sPipMask3.property("ADBE Transform Group").property("ADBE Opacity").expression = "100";

	for (var i = 0, il = renamedPropertiesArray.length; i < il; i++) {
		var curRenamedProperty = renamedPropertiesArray[i];
		var indicesArray = curRenamedProperty["indicesArray"];
		var propertyObject = unpackPropertyObject(indicesArray);
		var oldPropertyName = propertyObject.name;
		var newPropertyName = curRenamedProperty["newPropertyName"];
		propertyObject.name = newPropertyName;
		app.project.autoFixExpressions(oldPropertyName, newPropertyName);
	}
	
	//Lock Layers
	sPipMask3.locked = true;
	sPipMask4.locked = true;
	sZBottomPsr3.locked = true;
	sZTopPsr3.locked = true;
	sZPipMaskPsr3.locked = true;
	sMaskBottom3.locked = true;
	sMaskTop3.locked = true;
	
	comp2_comp.openInViewer();

	return {
		compItem: comp2_comp,
	};

	function findProjectItem(searchFolder, recursion, userData) {
		var folderItem;
		for (var i = 1, il = searchFolder.items.length; i <= il; i++) {
			folderItem = searchFolder.items[i];
			if (propertiesMatch(folderItem, userData)) {
				return folderItem;
			} else if (recursion === true && folderItem instanceof FolderItem && folderItem.numItems > 0) {
				var item = findProjectItem(folderItem, recursion, userData);
				if (item !== null) return item;
			}
		}
		return null;
	}

	function propertiesMatch(projectItem, userData) {
		if (typeof userData === 'undefined') return true;

		for (var propertyName in userData) {
			if (!userData.hasOwnProperty(propertyName)) continue;

			if (isFunctionObject(userData[propertyName])) {
				var functionConstructor = new Function(
					userData[propertyName].arguments,
					userData[propertyName].body);
				if (!functionConstructor(projectItem)) {
					return false;
				}
			} else {
				if (typeof userData[propertyName] !== typeof projectItem[propertyName]) {
					return false;
				}

				if (isArray(userData[propertyName]) && isArray(projectItem[propertyName])) {
					if (userData[propertyName].toString() !== projectItem[propertyName].toString()) {
						return false;
					}
				} else if (isObject(userData[propertyName]) && isObject(projectItem[propertyName])) {
					if (!propertiesMatch(projectItem[propertyName], userData[propertyName])) {
						return false;
					}
				} else if (projectItem[propertyName] !== userData[propertyName]) {
					return false;
				}
			}
		}
		return true;

		function isFunctionObject(object) {
			// Object needs to be of Object type;
			if (!isObject(object)) return false;

			// Object needs to have a 'type' property equal to string 'function';
			if (!object.hasOwnProperty('type') || !isString(object.type) || object.type !== 'function') {
				return false;
			}

			// Object needs to have an 'arguments' property of Array type;
			if (!object.hasOwnProperty('arguments') || !isArray(object.arguments)) {
				return false;
			}

			// Object needs to have a 'body' property of String type;
			if (!object.hasOwnProperty('body') || !isString(object.body)) {
				return false;
			}

			return true;
		}
	}

	function isArray(object) {
		return Object.prototype.toString.apply(object) === '[object Array]';
	}

	function isObject(object) {
		return typeof object === 'object';
	}

	function isString(value) {
		return typeof value === 'string' || value instanceof String;
	}
	

	function getPrefix() {
		if (prefix === null) {
			prefix = prompt('Enter a prefix to prepend to all property names:', '');
		}

		return prefix;
	}

	function promptName(message, propertyObject) {
		var prefix = getPrefix();

		var strippedName = propertyObject.name.replace(/^name:/, "");
		var indicesArray = packPropertyObject(propertyObject);

		var newPropertyName = prefix + strippedName;

		renamedPropertiesArray.push({ "indicesArray": indicesArray, "newPropertyName": newPropertyName });
	}

	// function promptName(message, propertyObject) {
	// 	var strippedName = propertyObject.name.replace(/^name:/, "");
	// 	var indicesArray = packPropertyObject(propertyObject);
	// 	var newPropertyName = prompt(message, strippedName);
	// 	if (newPropertyName) { renamedPropertiesArray.push({ "indicesArray": indicesArray, "newPropertyName": newPropertyName }); }
	// 	else { renamedPropertiesArray.push({ "indicesArray": indicesArray, "newPropertyName": strippedName }); }
	// }

	function unpackPropertyObject(indicesArray) {
		var propertyObject;
		if (typeof indicesArray.length === "undefined") {
			propertyObject = indicesArray;
		} else {
			propertyObject = indicesArray[0];
			for (var c = 1, cl = indicesArray.length; c < cl; c++) {
				propertyObject = propertyObject.property(indicesArray[c]);
			}
		}
		return propertyObject;
	}

	function  packPropertyObject(propertyObject) {
		var indicesArray = [];
		if (!propertyObject.parentProperty) {
			indicesArray.push(propertyObject);
		} else {
			while (propertyObject) {
				indicesArray.unshift(propertyObject.propertyDepth < 1 ? propertyObject : propertyObject.propertyIndex);
				propertyObject = propertyObject.parentProperty;
			}
		}
		return indicesArray;
	}

}

