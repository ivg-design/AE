(function (thisObj) {// ----- EXTENDSCRIPT INCLUDES ------ //"object"!=typeof JSON&&(JSON={}),function(){"use strict";var rx_one=/^[\],:{}\s]*$/,rx_two=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,rx_three=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,rx_four=/(?:^|:|,)(?:\s*\[)+/g,rx_escapable=/[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,rx_dangerous=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta,rep;function f(t){return t<10?"0"+t:t}function this_value(){return this.valueOf()}function quote(t){return rx_escapable.lastIndex=0,rx_escapable.test(t)?'"'+t.replace(rx_escapable,function(t){var e=meta[t];return"string"==typeof e?e:"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+t+'"'}function str(t,e){var r,n,o,u,f,a=gap,i=e[t];switch(i&&"object"==typeof i&&"function"==typeof i.toJSON&&(i=i.toJSON(t)),"function"==typeof rep&&(i=rep.call(e,t,i)),typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";if(gap+=indent,f=[],"[object Array]"===Object.prototype.toString.apply(i)){for(u=i.length,r=0;r<u;r+=1)f[r]=str(r,i)||"null";return o=0===f.length?"[]":gap?"[\n"+gap+f.join(",\n"+gap)+"\n"+a+"]":"["+f.join(",")+"]",gap=a,o}if(rep&&"object"==typeof rep)for(u=rep.length,r=0;r<u;r+=1)"string"==typeof rep[r]&&(o=str(n=rep[r],i))&&f.push(quote(n)+(gap?": ":":")+o);else for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(o=str(n,i))&&f.push(quote(n)+(gap?": ":":")+o);return o=0===f.length?"{}":gap?"{\n"+gap+f.join(",\n"+gap)+"\n"+a+"}":"{"+f.join(",")+"}",gap=a,o}}"function"!=typeof Date.prototype.toJSON&&(Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},Boolean.prototype.toJSON=this_value,Number.prototype.toJSON=this_value,String.prototype.toJSON=this_value),"function"!=typeof JSON.stringify&&(meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},JSON.stringify=function(t,e,r){var n;if(gap="",indent="","number"==typeof r)for(n=0;n<r;n+=1)indent+=" ";else"string"==typeof r&&(indent=r);if(rep=e,e&&"function"!=typeof e&&("object"!=typeof e||"number"!=typeof e.length))throw new Error("JSON.stringify");return str("",{"":t})}),"function"!=typeof JSON.parse&&(JSON.parse=function(text,reviver){var j;function walk(t,e){var r,n,o=t[e];if(o&&"object"==typeof o)for(r in o)Object.prototype.hasOwnProperty.call(o,r)&&(void 0!==(n=walk(o,r))?o[r]=n:delete o[r]);return reviver.call(t,e,o)}if(text=String(text),rx_dangerous.lastIndex=0,rx_dangerous.test(text)&&(text=text.replace(rx_dangerous,function(t){return"\\u"+("0000"+t.charCodeAt(0).toString(16)).slice(-4)})),rx_one.test(text.replace(rx_two,"@").replace(rx_three,"]").replace(rx_four,"")))return j=eval("("+text+")"),"function"==typeof reviver?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}();// ---------------------------------- //// ----- EXTENDSCRIPT PONYFILLS -----function __objectFreeze(obj) { return obj; }// ---------------------------------- //var version = "0.0.1";

var config = {
  version: version,
  id: 'com.frame-navigator.cep',
  displayName: '',
  symlink: 'local',
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8860,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [{
    name: 'AEFT',
    version: '[0.0,99.9]'
  }],
  type: 'ModalDialog',
  iconDarkNormal: './src/assets/light-icon.png',
  iconNormal: './src/assets/dark-icon.png',
  iconDarkNormalRollOver: './src/assets/light-icon.png',
  iconNormalRollOver: './src/assets/dark-icon.png',
  parameters: ['--v=0', '--enable-nodejs', '--mixed-context'],
  width: 125,
  height: 46,
  minWidth: 125,
  minHeight: 46,
  maxWidth: 125,
  maxHeight: 46,
  standalone: true,
  panels: [{
    mainPath: './main/index.html',
    name: 'main',
    panelDisplayName: "\xA0",
    autoVisible: true,
    width: 125,
    height: 46,
    minWidth: 125,
    minHeight: 46,
    maxWidth: 125,
    maxHeight: 46,
    type: 'ModalDialog'
  }],
  build: {
    jsxBin: 'off',
    sourceMap: true
  },
  zxp: {
    country: 'US',
    province: 'CA',
    org: 'MyCompany',
    password: 'mypassword',
    tsa: 'http://timestamp.digicert.com/',
    sourceMap: false,
    jsxBin: 'off'
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: []
};

var ns = config.id;

// After Effects Frame Navigator Utility Functions

// Function to pad number with leading zeros
var padNumber = function padNumber(num, size) {
  var s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
};

// Function to convert frames to timecode
var framesToTimecode = function framesToTimecode(frames, frameRate) {
  var framesPerSecond = Math.round(frameRate);
  var remainingFrames = frames % framesPerSecond;
  var totalSeconds = Math.floor(frames / framesPerSecond);
  var hours = Math.floor(totalSeconds / 3600);
  var minutes = Math.floor(totalSeconds % 3600 / 60);
  var seconds = totalSeconds % 60;
  return hours + ":" + padNumber(minutes, 2) + ":" + padNumber(seconds, 2) + ":" + padNumber(remainingFrames, 2);
};

// Function to convert timecode to frames
var timecodeToFrames = function timecodeToFrames(timecode, frameRate) {
  var parts = timecode.split(':');
  if (parts.length !== 4) return 0;
  var hours = parseInt(parts[0], 10);
  var minutes = parseInt(parts[1], 10);
  var seconds = parseInt(parts[2], 10);
  var frames = parseInt(parts[3], 10);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * frameRate + frames);
};

// Get current frame information
var getCurrentFrameInfo = function getCurrentFrameInfo() {
  if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
    var comp = app.project.activeItem;
    var currentFrame = Math.round(comp.time * comp.frameRate);
    var timecode = framesToTimecode(currentFrame, comp.frameRate);
    return {
      frame: currentFrame,
      frameRate: comp.frameRate,
      timecode: timecode
    };
  }
  return null;
};

// Navigate to a specific frame
var navigateToFrame = function navigateToFrame(frameOrTimecode, isFrameMode) {
  if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
    return false;
  }
  var comp = app.project.activeItem;
  var targetFrame;
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
var evaluateExpression = function evaluateExpression(expression) {
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
};

var aeft = /*#__PURE__*/__objectFreeze({
  __proto__: null,
  padNumber: padNumber,
  framesToTimecode: framesToTimecode,
  timecodeToFrames: timecodeToFrames,
  getCurrentFrameInfo: getCurrentFrameInfo,
  navigateToFrame: navigateToFrame,
  evaluateExpression: evaluateExpression
});

var host = typeof $ !== "undefined" ? $ : window;

// A safe way to get the app name since some versions of Adobe Apps broken BridgeTalk in various places (e.g. After Effects 24-25)
// in that case we have to do various checks per app to deterimine the app name

var getAppNameSafely = function getAppNameSafely() {
  var compare = function compare(a, b) {
    return a.toLowerCase().indexOf(b.toLowerCase()) > -1;
  };
  var exists = function exists(a) {
    return typeof a !== "undefined";
  };
  var isBridgeTalkWorking = typeof BridgeTalk !== "undefined" && typeof BridgeTalk.appName !== "undefined";
  if (isBridgeTalkWorking) {
    return BridgeTalk.appName;
  } else if (app) {
    
    if (exists(app.name)) {
      
      var name = app.name;
      if (compare(name, "photoshop")) return "photoshop";
      if (compare(name, "illustrator")) return "illustrator";
      if (compare(name, "audition")) return "audition";
      if (compare(name, "bridge")) return "bridge";
      if (compare(name, "indesign")) return "indesign";
    }
    
    if (exists(app.appName)) {
      
      var appName = app.appName;
      if (compare(appName, "after effects")) return "aftereffects";
      if (compare(appName, "animate")) return "animate";
    }
    
    if (exists(app.path)) {
      
      var path = app.path;
      if (compare(path, "premiere")) return "premierepro";
    }
    
    if (exists(app.getEncoderHost) && exists(AMEFrontendEvent)) {
      return "ame";
    }
  }
  return "unknown";
};

// Create global expose variables for our functions

if (typeof $ !== "undefined") {
  
  $.padNumber = padNumber;
  
  $.framesToTimecode = framesToTimecode;
  
  $.timecodeToFrames = timecodeToFrames;
  
  $.getCurrentFrameInfo = getCurrentFrameInfo;
  
  $.navigateToFrame = navigateToFrame;
  
  $.evaluateExpression = evaluateExpression;
}
switch (getAppNameSafely()) {
  case "aftereffects":
  case "aftereffectsbeta":
    host[ns] = host[ns] || {};

    // Register the After Effects-specific functions
    for (var key in aeft) {
      if (Object.prototype.hasOwnProperty.call(aeft, key)) {
        host[ns][key] = aeft[key];

        // Also register for direct access in evalScript (without namespace)
        host[key] = aeft[key];
      }
    }
    break;
}

// https://extendscript.docsforadobe.dev/interapplication-communication/bridgetalk-class.html?highlight=bridgetalk#appname
})(this);//# sourceMappingURL=index.js.map
