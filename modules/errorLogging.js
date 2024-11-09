/**
 * ErrorLogging Module
 * 
 * This module provides functionality to log debug messages to a file and the console.
 * 
 * Example usage:
 * 
 * var debug = ErrorLogging("MyScript");
 * debug.log("This is a debug message.");
 * 
 * This will create a file named "MyScript_Log.txt" (or "Log.txt" if no script name is provided)
 * and write the debug message to it, along with a timestamp.
 */

var ErrorLogging = (function (scriptName) {
    var module = {}; // Create a variable to control the start of a new debug session
    var isNewDebugSession = true;
    var filepath = scriptName ? scriptName + "_Log.txt" : "Log.txt"; // Generate file name based on script name

    /**
     * Writes debug information to a file with a timestamp.
     *
     * @param {string} info - The information to be written to the file.
     */
    function writeDebugToFile(info) {
        var outfile = new File(filepath);

        // Open the file for appending
        if (outfile.open('a')) { // Check if file opened successfully
            // If this is the start of a new debug session, add session headers
            if (isNewDebugSession) {
                outfile.writeln("============================");
                outfile.writeln("THIS IS A NEW DEBUG SESSION @ " + new Date().toLocaleTimeString());
                outfile.writeln("============================");
                isNewDebugSession = false; // Set to false for subsequent messages
            }

            outfile.writeln(new Date().toLocaleTimeString() + " - " + info);
            outfile.close();
        } else {
            // Handle file opening failure
            if (typeof writeLn === "function") {
                writeLn("Failed to open file: " + filepath);
            }
        }
    }

    /**
     * Writes a debug message to the console and a file.
     *
     * @param {string} message - The debug message to be written.
     */
    module.log = function (message) {
        if (typeof writeLn === "function") {
            writeLn(message); // Write to the Info Panel (only 3 last lines are visible)
        }
        writeDebugToFile(message);
    };

    // Use log for new debugging messages
    module.log("Debug Starting");

    return module;
});

