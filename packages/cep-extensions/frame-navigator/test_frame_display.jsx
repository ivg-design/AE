// Test Frame Display - Standalone JSX for After Effects

(function() {
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
        
        return hours + ":" + padNumber(minutes, 2) + ":" + padNumber(seconds, 2) + ":" + padNumber(remainingFrames, 2);
    }

    // Get current frame information
    function getCurrentFrameInfo() {
        try {
            if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
                var comp = app.project.activeItem;
                var currentTime = comp.time;
                var frameRate = comp.frameRate;
                var currentFrame = Math.round(currentTime * frameRate);
                var timecode = framesToTimecode(currentFrame, frameRate);
                
                return {
                    compName: comp.name,
                    time: currentTime,
                    frame: currentFrame,
                    frameRate: frameRate,
                    timecode: timecode
                };
            }
        } catch (e) {
            return {
                compName: "ERROR",
                time: 0,
                frame: -1,
                frameRate: 24,
                timecode: "ERROR: " + e.toString()
            };
        }
        
        // No comp is open
        return {
            compName: "No Comp Open",
            time: 0,
            frame: 0,
            frameRate: 24,
            timecode: "00:00:00:00"
        };
    }

    // Create UI Window
    var win = new Window("dialog", "Frame Info Test");
    win.orientation = "column";
    win.alignChildren = "fill";
    win.spacing = 10;
    win.margins = 20;

    // Get frame info
    var info = getCurrentFrameInfo();

    // Comp name
    var compGroup = win.add("group");
    compGroup.add("statictext", undefined, "Comp:");
    var compText = compGroup.add("statictext", undefined, info.compName);
    compText.characters = 20;

    // Current time
    var timeGroup = win.add("group");
    timeGroup.add("statictext", undefined, "Time:");
    var timeText = timeGroup.add("statictext", undefined, info.time.toFixed(3) + " sec");
    timeText.characters = 20;

    // Frame number
    var frameGroup = win.add("group");
    frameGroup.add("statictext", undefined, "Frame:");
    var frameText = frameGroup.add("statictext", undefined, info.frame.toString());
    frameText.characters = 20;

    // Frame rate
    var fpsGroup = win.add("group");
    fpsGroup.add("statictext", undefined, "FPS:");
    var fpsText = fpsGroup.add("statictext", undefined, info.frameRate.toFixed(2));
    fpsText.characters = 20;

    // Timecode
    var tcGroup = win.add("group");
    tcGroup.add("statictext", undefined, "Timecode:");
    var tcText = tcGroup.add("statictext", undefined, info.timecode);
    tcText.characters = 20;

    // Refresh button
    var refreshBtn = win.add("button", undefined, "Refresh");
    refreshBtn.onClick = function() {
        var newInfo = getCurrentFrameInfo();
        compText.text = newInfo.compName;
        timeText.text = newInfo.time.toFixed(3) + " sec";
        frameText.text = newInfo.frame.toString();
        fpsText.text = newInfo.frameRate.toFixed(2);
        tcText.text = newInfo.timecode;
    };

    // Close button
    var closeBtn = win.add("button", undefined, "Close");
    closeBtn.onClick = function() {
        win.close();
    };

    // Show the window
    win.show();
})();