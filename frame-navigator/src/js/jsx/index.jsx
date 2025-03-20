/**
 * Get current frame information as a JSON string
 */
$.getCurrentFrameInfo = function() {
  try {
    $.writeln("Getting current frame info");
    // Validate we have an active composition first
    if (!app.project) {
      $.writeln("No active project");
      return null;
    }
    
    if (!app.project.activeItem) {
      $.writeln("No active item");
      return null;
    }
    
    if (!(app.project.activeItem instanceof CompItem)) {
      $.writeln("Active item is not a composition");
      return null;
    }
    
    // Now safely get frame information
    var comp = app.project.activeItem;
    var currentTime = comp.time;
    var frameRate = comp.frameRate;
    var currentFrame = Math.floor(currentTime * frameRate);
    
    // Format timecode
    var totalFrames = currentFrame;
    var framesPerSecond = Math.round(frameRate);
    var frames = totalFrames % framesPerSecond;
    var totalSeconds = Math.floor(totalFrames / framesPerSecond);
    var seconds = totalSeconds % 60;
    var totalMinutes = Math.floor(totalSeconds / 60);
    var minutes = totalMinutes % 60;
    var hours = Math.floor(totalMinutes / 60);
  
    // padStart isn't available in ExtendScript - use custom padding
    function padZero(num, size) {
      var s = "000000000" + num;
      return s.substr(s.length - size);
    }
  
    var timecode = padZero(hours, 2) + ':' + 
                   padZero(minutes, 2) + ':' + 
                   padZero(seconds, 2) + ':' + 
                   padZero(frames, 2);
                  
    // Make sure we're returning a properly escaped JSON string
    // Use simple concatenation to avoid JSON.stringify issues
    var jsonString = '{"frame":' + currentFrame + 
                    ',"timecode":"' + timecode + 
                    '","frameRate":' + frameRate + '}';
    
    // Verify we have a valid result before returning
    if (currentFrame >= 0 && frameRate > 0) {
      $.writeln("Frame info: frame=" + currentFrame + ", timecode=" + timecode + ", frameRate=" + frameRate);
      return jsonString;
    } else {
      $.writeln("Invalid frame or framerate values: frame=" + currentFrame + ", rate=" + frameRate);
      return null;
    }
  } catch (e) {
    // Don't use alert as it disrupts UI
    $.writeln("Error in getCurrentFrameInfo: " + e.toString());
  }
  return null;
};

/**
 * Return current frame information
 * Always try to get the most current information
 */
function getCurrentFrame() {
  try {
    $.writeln("getCurrentFrame called");
    var result = $.getCurrentFrameInfo();
    
    // Check if we got a valid result
    if (result && typeof result === "string" && result.indexOf("{") === 0) {
      return result;
    }
    
    return "null";
  } catch (e) {
    $.writeln("Error in getCurrentFrame: " + e.toString());
    return "null";
  }
}

/**
 * Navigate to the specified frame directly
 * @param {number} frameNumber - The frame to navigate to
 */
function navigateToFrame(frameNumber) {
  try {
    $.writeln("navigateToFrame called with frame: " + frameNumber);
    
    if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
      var comp = app.project.activeItem;
      var frameRate = comp.frameRate;
      
      // Make sure frameNumber is actually a number
      if (typeof frameNumber === "string") {
        frameNumber = parseInt(frameNumber, 10);
      }
      
      // Convert frame to time (exact conversion)
      var time = frameNumber / frameRate;
      
      $.writeln("Converting frame " + frameNumber + " to time " + time + " at frameRate " + frameRate);
      
      // Set time
      comp.time = time;
      
      // Force an update to the viewer
      app.activeViewer.refresh();
      
      // Force a UI update
      app.update();
      
      $.writeln("Successfully navigated to frame " + frameNumber);
      return "success: navigated to frame " + frameNumber;
    } else {
      $.writeln("No active composition found for navigation");
      return "error: no active composition found";
    }
  } catch (e) {
    // Alert will disrupt the UI, use a return value instead
    $.writeln("Error in navigateToFrame: " + e.toString());
    return "error: " + e.toString();
  }
}

// Keep the old method for backward compatibility
$.navigateToFrame = function(inputValue, isFrameMode) {
  try {
    $.writeln("$.navigateToFrame called with input: " + inputValue + ", isFrameMode: " + isFrameMode);
    
    if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
      var comp = app.project.activeItem;
      var frameRate = comp.frameRate;
      var frameNumber;
      
      if (isFrameMode) {
        // Remove leading zeros and parse as number or evaluate as expression
        var cleanedInput = inputValue.replace(/^0+/, '');
        try {
          // Try to evaluate as expression
          $.writeln("Evaluating expression: " + cleanedInput);
          frameNumber = eval(cleanedInput);
        } catch (e) {
          // If fails, try to parse as integer
          $.writeln("Expression eval failed, parsing as integer");
          frameNumber = parseInt(cleanedInput, 10);
          if (isNaN(frameNumber)) {
            $.writeln("Invalid frame number: " + inputValue);
            throw new Error("Invalid frame number: " + inputValue);
          }
        }
      } else {
        // Parse timecode
        $.writeln("Parsing timecode: " + inputValue);
        var parts = inputValue.split(':');
        if (parts.length === 4) {
          var hours = parseInt(parts[0], 10);
          var minutes = parseInt(parts[1], 10);
          var seconds = parseInt(parts[2], 10);
          var frames = parseInt(parts[3], 10);
          
          frameNumber = (hours * 3600 + minutes * 60 + seconds) * frameRate + frames;
          $.writeln("Timecode parsed to frame: " + frameNumber);
        } else {
          $.writeln("Invalid timecode format");
          throw new Error("Invalid timecode format");
        }
      }
      
      // Call the direct method
      return navigateToFrame(frameNumber);
    }
  } catch (e) {
    $.writeln("Error in $.navigateToFrame: " + e.toString());
    alert("Error in navigateToFrame: " + e.toString());
    return "error: " + e.toString();
  }
  
  $.writeln("No active composition");
  return "error: no active composition";
};

/**
 * Update menu visibility status
 * This helps ensure the menu checkmark is properly updated
 */
function updateMenuVisibility() {
  try {
    $.writeln("updateMenuVisibility called");
    
    // Force menu update in AE
    if (app.updateMenus) {
      app.updateMenus();
    }
    
    // Try to trigger a UI refresh to update menu state
    if (app.refresh) {
      app.refresh();
    }
    
    // This sometimes helps in AE to refresh specific menus
    if (app.updateUI) {
      app.updateUI();
    }
    
    return "success: menu updated";
  } catch (e) {
    $.writeln("Error in updateMenuVisibility: " + e.toString());
    return "error: " + e.toString();
  }
}

/**
 * Kill the extension completely - most reliable method
 */
function killExtension() {
  try {
    $.writeln("killExtension called - attempting to close panel");
    
    // Attempt direct command first (most reliable)
    if (app.executeCommand) {
      $.writeln("Executing command 3773 (Close Panel)");
      // 3773 is the Close Panel command
      app.executeCommand(3773);
      $.writeln("Command 3773 execution complete");
    }
    
    // If still running, try more aggressive methods
    if (app.preferences) {
      try {
        $.writeln("Forcing UI refresh with preferences save");
        // Try to force a refresh of the UI
        app.preferences.saveToDisk();
        app.refresh();
        $.writeln("UI refresh complete");
      } catch (e) {
        $.writeln("Error refreshing UI: " + e.toString());
      }
    }
    
    // Last resort: try to use BridgeTalk to tell Ae to close all panels
    try {
      $.writeln("Attempting BridgeTalk close method");
      var bt = new BridgeTalk();
      bt.target = "aftereffects";
      bt.body = "app.executeCommand(3773);";
      bt.onError = function(errObj) { 
        $.writeln("BridgeTalk error: " + errObj.body);
      };
      bt.onResult = function(resObj) {
        $.writeln("BridgeTalk result: " + resObj.body);
      };
      bt.send(100); // Send with timeout
      $.writeln("BridgeTalk message sent");
    } catch (e) {
      $.writeln("BridgeTalk error: " + e.toString());
    }
    
    $.writeln("Kill sequence complete");
    return "killed";
  } catch (e) {
    $.writeln("Error in killExtension: " + e);
    return "error: " + e.toString();
  }
}

/**
 * Navigate to a frame and kill the extension
 */
function navigateAndKill(frameNumber) {
  try {
    $.writeln("navigateAndKill called with frame: " + frameNumber);
    var result = navigateToFrame(frameNumber);
    $.writeln("Navigation result: " + result);
    
    // Give AE a moment to process the navigation before killing
    $.writeln("Sleeping for 100ms before killing extension");
    $.sleep(100);
    
    $.writeln("Calling killExtension after navigation");
    killExtension();
    return result;
  } catch (e) {
    $.writeln("Error in navigateAndKill: " + e);
    killExtension();
    return "error: " + e.toString();
  }
}

// Initialize all functions globally for direct access
(function() {
  $.writeln("=== Frame Navigator Initialized ===");
  
  if (typeof getCurrentFrame === 'undefined') {
    this.getCurrentFrame = getCurrentFrame;
  }
  
  if (typeof navigateToFrame === 'undefined') {
    this.navigateToFrame = navigateToFrame;
  }
  
  if (typeof killExtension === 'undefined') {
    this.killExtension = killExtension;
  }
  
  if (typeof updateMenuVisibility === 'undefined') {
    this.updateMenuVisibility = updateMenuVisibility;
  }
  
  if (typeof navigateAndKill === 'undefined') {
    this.navigateAndKill = navigateAndKill;
  }
})(); 