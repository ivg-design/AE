{
	function setupDebuggingEnvironment() {
		var comp = app.project.activeItem;
		if (!(comp instanceof CompItem)) {
			alert("Please select a composition.");
			return;
		}

		app.beginUndoGroup("Create Debugging Layers");

		// Create the CONSOLE layer (IDE)
		var consoleLayer = comp.layers.addText("CONSOLE");
		consoleLayer.name = "CONSOLE";
		var consoleTextProp = consoleLayer.property("Source Text");

		// Create the OUTPUT layer (Evaluator)
		var outputLayer = comp.layers.addText("OUTPUT");
		outputLayer.name = "OUTPUT";
		var outputTextProp = outputLayer.property("Source Text");

		// Set up the OUTPUT layer's expression to evaluate the expression from the CONSOLE layer
		var outputExpression =
			"try {\n" +
			"    var logs = [];\n" +
			"    var console = { log: function(message) { logs.push(message); } };\n" +
			"    eval(thisComp.layer('CONSOLE').text.sourceText.value);\n" +
			"    if (logs.length > 0) logs.join('\\n'); else 'No logs.';\n" +  // Ensure logs are displayed
			"} catch (e) {\n" +
			"    'Error: ' + e.message;\n" +
			"}";

		outputTextProp.expression = outputExpression;

		app.endUndoGroup();
	}

	setupDebuggingEnvironment();
}
