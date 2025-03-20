// Frame Navigator for Adobe After Effects
// This script provides a frame navigation panel with math operations support

(function () {
    // Create the main panel
    var mainPanel = new Window("palette", "Frame Navigator", undefined, {
        resizeable: true,
        closeButton: true,
        independent: false,
        borderless: false
    });

    mainPanel.orientation = "column";
    mainPanel.alignChildren = ["center", "top"];
    mainPanel.spacing = 10;
    mainPanel.margins = 16;

    // Create the frame input group
    var frameGroup = mainPanel.add("group");
    frameGroup.orientation = "row";
    frameGroup.alignChildren = ["left", "center"];
    frameGroup.spacing = 10;


    // Create the frame input field
    var frameInput = frameGroup.add("edittext", undefined, "");
    frameInput.characters = 10; // Width for 5 digits plus some extra space
    frameInput.text = "0";

    // Create the frame rate display
    var frameRateText = mainPanel.add("statictext", undefined, "Frame Rate: 0 fps");

    // Function to update the frame display
    function updateFrameDisplay() {
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            var currentFrame = Math.round(comp.time * comp.frameRate);
            frameInput.text = currentFrame.toString();
            frameRateText.text = "Frame Rate: " + comp.frameRate + " fps";
        }
    }

    // Function to evaluate math expression
    function evaluateExpression(expression) {
        try {
            // Remove any spaces from the expression
            expression = expression.replace(/\s/g, "");

            // Check if it's a simple number
            if (/^\d+$/.test(expression)) {
                return parseInt(expression);
            }

            // Check for math operations
            if (expression.startsWith("+")) {
                return parseInt(frameInput.text) + parseInt(expression.substring(1));
            } else if (expression.startsWith("-")) {
                return parseInt(frameInput.text) - parseInt(expression.substring(1));
            } else if (expression.startsWith("*")) {
                return parseInt(frameInput.text) * parseInt(expression.substring(1));
            } else if (expression.startsWith("/")) {
                return Math.floor(parseInt(frameInput.text) / parseInt(expression.substring(1)));
            }

            return parseInt(expression);
        } catch (e) {
            return parseInt(frameInput.text);
        }
    }

    // Handle the enter key in the frame input
    frameInput.addEventListener("keydown", function (evt) {
        if (evt.keyName === "Return") {
            var targetFrame = evaluateExpression(frameInput.text);
            if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
                var comp = app.project.activeItem;
                comp.time = targetFrame / comp.frameRate;
            }
            frameInput.active = false; // Remove focus from input
        }
    });

    // Set up event handlers for composition changes
    app.onAfterNew = function () {
        updateFrameDisplay();
    };

    app.onCompRendered = function () {
        updateFrameDisplay();
    };

    // Create a timer to check for timeline changes
    var checkTimer = new Timer();
    checkTimer.interval = 100; // Check every 100ms
    checkTimer.addEventListener("timer", function () {
        updateFrameDisplay();
    });
    checkTimer.start();

    // Update the display when the panel opens
    updateFrameDisplay();

    // Show the panel
    mainPanel.show();
})(); 