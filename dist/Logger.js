var LoggerModule = (function () {
    var module = {};

    // LogLevel Definition
    module.LogLevel = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    // Logger Constructor
    module.Logger = function (level, scriptName) {
        this.logLevel = level != null ? level : module.LogLevel.DEBUG;
        this.scriptName = scriptName || "DefaultScript";
        // Set a full path to a known writable location
        //this.logFilePath = Folder.desktop.fsName + "/" + this.scriptName + "-Log.txt";
        this.logFilePath = "/Users/ivg/GOOGLE DRIVE/Code/ADOBE SCRIPTING/dist/" + this.scriptName + "-Log.txt";
    };

    // Logger Methods
    module.Logger.prototype.debug = function (msg) { this.log(module.LogLevel.DEBUG, msg); };
    module.Logger.prototype.info = function (msg) { this.log(module.LogLevel.INFO, msg); };
    module.Logger.prototype.warn = function (msg) { this.log(module.LogLevel.WARN, msg); };
    module.Logger.prototype.error = function (msg) { this.log(module.LogLevel.ERROR, msg); };

    // Log Method
    module.Logger.prototype.log = function (lvl, msg) {
        if (this.logLevel > lvl) {
            return; // Do not log if the message level is lower than the logger's level
        }

        var file = new File(this.logFilePath);
        if (!file.open("a")) {
            alert("Failed to open log file at: " + this.logFilePath); // Debugging output
            return;
        }

        file.writeln("[" + levelToString(lvl) + "] " + formatDate(new Date()) + " - " + msg);
        file.close();
    };


    // Helper Functions
    function levelToString(level) {
        switch (level) {
            case module.LogLevel.DEBUG: return "DEBUG";
            case module.LogLevel.INFO: return "INFO";
            case module.LogLevel.WARN: return "WARN";
            case module.LogLevel.ERROR: return "ERROR";
            default: return "UNKNOWN";
        }
    }

    function formatDate(date) {
        function pad(number) { return number < 10 ? '0' + number : number; }
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    return module;
})();

// Usage Example:
//update the absolute path to the log file!!!
//var logger = new LoggerModule.Logger(LoggerModule.LogLevel.DEBUG, "TuneSync");
//logger.info("This is an info message.");
