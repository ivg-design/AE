var csInterface = new CSInterface();

// Function to handle communication with ExtendScript
function callExtendScript() {
    csInterface.evalScript('$.writeln("Hello from ExtendScript!")', function(result) {
        console.log('ExtendScript result:', result);
    });
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', function() {
    // Set theme color
    var hostEnv = csInterface.getHostEnvironment();
    console.log('Host Environment:', hostEnv);
    
    // Add any initialization code here
    callExtendScript();
}); 