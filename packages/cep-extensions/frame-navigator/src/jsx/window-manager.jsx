function setWindowSize(width, height) {
    var csInterface = new CSInterface();
    var extensionWindow = csInterface.getSystemPath(SystemPath.EXTENSION) + "/index.html";
    var windowObj = csInterface.getWindow(extensionWindow);
    
    if (windowObj) {
        windowObj.resize(width, height);
        return true;
    }
    return false;
}

function getWindowSize() {
    var csInterface = new CSInterface();
    var extensionWindow = csInterface.getSystemPath(SystemPath.EXTENSION) + "/index.html";
    var windowObj = csInterface.getWindow(extensionWindow);
    
    if (windowObj) {
        return {
            width: windowObj.width,
            height: windowObj.height
        };
    }
    return null;
}

function setWindowMinSize(width, height) {
    var csInterface = new CSInterface();
    var extensionWindow = csInterface.getSystemPath(SystemPath.EXTENSION) + "/index.html";
    var windowObj = csInterface.getWindow(extensionWindow);
    
    if (windowObj) {
        windowObj.minWidth = width;
        windowObj.minHeight = height;
        return true;
    }
    return false;
}

function setWindowMaxSize(width, height) {
    var csInterface = new CSInterface();
    var extensionWindow = csInterface.getSystemPath(SystemPath.EXTENSION) + "/index.html";
    var windowObj = csInterface.getWindow(extensionWindow);
    
    if (windowObj) {
        windowObj.maxWidth = width;
        windowObj.maxHeight = height;
        return true;
    }
    return false;
} 