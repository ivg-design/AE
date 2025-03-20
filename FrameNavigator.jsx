// Frame Navigator for Adobe After Effects
// This script provides a small frame navigation window with timecode toggle

(function() {
    // Create the main window
    var mainWindow = new Window("dialog", "Frame Navigator", undefined, {
        borderless: false,
        resizeable: false,
        closeButton: true
    });
    mainWindow.orientation = "column";
    mainWindow.alignChildren = ["center", "top"];
    mainWindow.spacing = 10;
    mainWindow.margins = 16;
    mainWindow.preferredSize.width = 180;
    mainWindow.preferredSize.height = 90;
    
    // Set window background color
    mainWindow.graphics.backgroundColor = mainWindow.graphics.newBrush(mainWindow.graphics.BrushType.SOLID_COLOR, [0.2, 0.2, 0.2, 1]);
    
    // Create input group
    var inputGroup = mainWindow.add("group");
    inputGroup.orientation = "row";
    inputGroup.alignChildren = ["center", "center"];
    inputGroup.spacing = 0;
    inputGroup.margins = 0;
    
    // Create the frame input field
    var frameInput = inputGroup.add("edittext", undefined, "00000");
    frameInput.characters = 10;
    frameInput.preferredSize.width = 150;
    frameInput.preferredSize.height = 35;
    frameInput.alignment = ["center", "center"];
    frameInput.justify = "center";
    
    // Create the status text
    var statusText = mainWindow.add("statictext", undefined, "");
    statusText.characters = 20;
    statusText.justify = "center";
    statusText.alignment = ["center", "center"];
    
    // Flag to track display mode (true = frames, false = timecode)
    var isFrameMode = true;
    
    // Function to pad number with leading zeros
    function padNumber(num, size) {
        var s = num.toString();
        while (s.length < size) s = "0" + s;
        return s;
    }
    
    // Function to convert frames to timecode
    function framesToTimecode(frames, frameRate) {
        var framesPerSecond = Math.round(frameRate);
        var remainingFrames = frames % framesPerSecond;
        var totalSeconds = Math.floor(frames / framesPerSecond);
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;
        
        return hours + ":" + 
               padNumber(minutes, 2) + ":" + 
               padNumber(seconds, 2) + ":" + 
               padNumber(remainingFrames, 2);
    }
    
    // Function to convert timecode to frames
    function timecodeToFrames(timecode, frameRate) {
        var parts = timecode.split(':');
        if (parts.length !== 4) return 0;
        
        var hours = parseInt(parts[0], 10);
        var minutes = parseInt(parts[1], 10);
        var seconds = parseInt(parts[2], 10);
        var frames = parseInt(parts[3], 10);
        
        return Math.round(((hours * 3600 + minutes * 60 + seconds) * frameRate) + frames);
    }
    
    // Function to update the display
    function updateDisplay() {
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            var currentFrame = Math.round(comp.time * comp.frameRate);
            
            if (isFrameMode) {
                frameInput.text = padNumber(currentFrame, 5);
                statusText.text = framesToTimecode(currentFrame, comp.frameRate) + " (" + comp.frameRate + " fps)";
            } else {
                frameInput.text = framesToTimecode(currentFrame, comp.frameRate);
                statusText.text = padNumber(currentFrame, 5) + " (" + comp.frameRate + " fps)";
            }
        }
    }
    
    // Function to evaluate math expression
    function evaluateExpression(expression) {
        try {
            // Remove spaces and handle empty input
            expression = expression.replace(/\s/g, "");
            if (!expression) return 0;
            
            // Find the operator and position
            var operatorIndex = -1;
            var operator = "";
            var operators = ["+", "-", "*", "/"];
            
            for (var i = 0; i < operators.length; i++) {
                var index = expression.indexOf(operators[i]);
                if (index !== -1) {
                    operatorIndex = index;
                    operator = operators[i];
                    break;
                }
            }
            
            // If no operator found, just return the number
            if (operatorIndex === -1) {
                return parseInt(expression.replace(/^0+/, "") || "0", 10);
            }
            
            // Split the expression into left and right parts
            var leftPart = expression.substring(0, operatorIndex);
            var rightPart = expression.substring(operatorIndex + 1);
            
            // Parse the numbers
            var leftNum = parseInt(leftPart.replace(/^0+/, "") || "0", 10);
            var rightNum = parseInt(rightPart.replace(/^0+/, "") || "0", 10);
            
            // Perform the operation
            switch (operator) {
                case "+":
                    return leftNum + rightNum;
                case "-":
                    return leftNum - rightNum;
                case "*":
                    return leftNum * rightNum;
                case "/":
                    return rightNum === 0 ? leftNum : Math.floor(leftNum / rightNum);
                default:
                    return leftNum;
            }
        } catch (e) {
            return 0;
        }
    }
    
    // Function to handle navigation
    function navigateToFrame() {
        var targetFrame;
        if (isFrameMode) {
            targetFrame = evaluateExpression(frameInput.text);
        } else {
            targetFrame = timecodeToFrames(frameInput.text, app.project.activeItem.frameRate);
        }
        
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            comp.time = targetFrame / comp.frameRate;
        }
        mainWindow.close();
    }
    
    // Handle key events
    frameInput.addEventListener("keydown", function(evt) {
        if (evt.keyName === "Return" || evt.keyName === "Enter") {
            navigateToFrame();
            evt.preventDefault();
        } else if (evt.keyName === "Tab") {
            isFrameMode = !isFrameMode;
            updateDisplay();
            evt.preventDefault();
            evt.stopPropagation();
        } else if (evt.keyName === "Escape") {
            mainWindow.close();
            evt.preventDefault();
        }
    });
    
    // Add a default button that responds to Enter
    var defaultButton = mainWindow.add("button", undefined, "Go");
    defaultButton.onClick = navigateToFrame;
    defaultButton.visible = false;
    
    // Update the display when the window opens
    updateDisplay();
    
    // Make the input field active when the window opens
    frameInput.active = true;
    
    // Show the window
    mainWindow.center();
    mainWindow.show();
})(); 