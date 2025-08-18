// After Effects Frame Navigator Utility Functions

// Simple test function to verify communication
export const testConnection = (): string => {
  return "ExtendScript connection successful!";
};

// Function to pad number with leading zeros
export const padNumber = (num: number, size: number): string => {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
};

// Function to convert frames to timecode
export const framesToTimecode = (frames: number, frameRate: number): string => {
  const framesPerSecond = Math.round(frameRate);
  const remainingFrames = frames % framesPerSecond;
  const totalSeconds = Math.floor(frames / framesPerSecond);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return hours + ":" + 
         padNumber(minutes, 2) + ":" + 
         padNumber(seconds, 2) + ":" + 
         padNumber(remainingFrames, 2);
};

// Function to convert timecode to frames
export const timecodeToFrames = (timecode: string, frameRate: number): number => {
  const parts = timecode.split(':');
  if (parts.length !== 4) return 0;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const frames = parseInt(parts[3], 10);
  
  return Math.round(((hours * 3600 + minutes * 60 + seconds) * frameRate) + frames);
};

// Get current frame information
export const getCurrentFrameInfo = (): { frame: number, frameRate: number, timecode: string } => {
  try {
    if (app.project && app.project.activeItem && app.project.activeItem instanceof CompItem) {
      const comp = app.project.activeItem;
      const currentFrame = Math.round(comp.time * comp.frameRate);
      const timecode = framesToTimecode(currentFrame, comp.frameRate);
      
      return {
        frame: currentFrame,
        frameRate: comp.frameRate,
        timecode: timecode
      };
    }
  } catch (e) {
    // Return error info for debugging
    return {
      frame: -1,
      frameRate: 24,
      timecode: "ERROR: " + e.toString()
    };
  }
  
  // Return default values when no comp is open
  return {
    frame: 0,
    frameRate: 24,
    timecode: "00:00:00:00"
  };
};

// Navigate to a specific frame
export const navigateToFrame = (frameOrTimecode: string, isFrameMode: boolean): boolean => {
  if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
    return false;
  }
  
  const comp = app.project.activeItem;
  let targetFrame: number;
  
  try {
    if (isFrameMode) {
      // Evaluate expression first (support for math operations)
      targetFrame = evaluateExpression(frameOrTimecode);
    } else {
      targetFrame = timecodeToFrames(frameOrTimecode, comp.frameRate);
    }
    
    // Navigate to the frame
    comp.time = targetFrame / comp.frameRate;
    return true;
  } catch (e) {
    return false;
  }
};

// Function to evaluate math expression
export const evaluateExpression = (expression: string): number => {
  try {
    // Remove spaces and handle empty input
    expression = expression.replace(/\s/g, "");
    if (!expression) return 0;
    
    // Find the operator and position
    let operatorIndex = -1;
    let operator = "";
    const operators = ["+", "-", "*", "/"];
    
    for (let i = 0; i < operators.length; i++) {
      const index = expression.indexOf(operators[i]);
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
    const leftPart = expression.substring(0, operatorIndex);
    const rightPart = expression.substring(operatorIndex + 1);
    
    // Parse the numbers
    const leftNum = parseInt(leftPart.replace(/^0+/, "") || "0", 10);
    const rightNum = parseInt(rightPart.replace(/^0+/, "") || "0", 10);
    
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
};