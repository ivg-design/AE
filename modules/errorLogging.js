var errorLogging = (function () {
    var module = {};// Create a variable to control the start of a new debug session
    var isNewDebugSession = true;

    /**
     * Writes debug information to a file with a timestamp.
     *
     * @param {string} info - The information to be written to the file.
     */
    function writeDebugToFile(info) {
        var filepath = "Log.txt";  // You can update this path
        var outfile = File(filepath);

        // Open the file for appending
        outfile.open('a');

        if (outfile !== '') {
            // If this is the start of a new debug session, add session headers
            if (isNewDebugSession) {
                outfile.writeln("============================");
                outfile.writeln("THIS IS A NEW DEBUG SESSION @ " + new Date().toLocaleTimeString());
                outfile.writeln("============================");
                isNewDebugSession = false; // Set to false for subsequent messages
            }

            outfile.writeln(new Date().toLocaleTimeString() + " - " + info);
            outfile.close();
        }
    }

    /**
     * Writes a debug message to the console and a file.
     *
     * @param {string} message - The debug message to be written.
     */
    module.debugWrite = function (message) {
        writeLn(message); // Write to the Info Panel (only 3 last lines are visible)
        writeDebugToFile(message);
    };

    // Use debugWrite for new debugging messages
    module.debugWrite("Debug Starting");

    return module;
})();
