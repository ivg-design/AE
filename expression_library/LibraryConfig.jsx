// LibraryConfig.jsx

var LibraryConfig = (function () {
    var script = {
        name: 'Expression Library',
        version: '1.0',
        developer: 'IVG Design',
        //developerURL: 'Your Website',
    };


    var module = {};

    module.get = function (key) {
        if (!script.hasOwnProperty(key)) {
            throw new Error('Cannot get script data by key "' + key + '"');
        }
        return script[key];
    };

    module.userFolder = function () {
        var userHomeFolder = Folder.userApplicationDataFolder;
        var scriptFolder;

        if ($.os.indexOf('Windows') !== -1) {
            // Windows
            scriptFolder = userHomeFolder.fsName + "/Adobe/After Effects/User Presets/Scripts/ScriptUI Panels/" + script.name;
        } else {
            // Mac
            scriptFolder = userHomeFolder.fsName + "/Library/Application Support/" + script.name;
        }

        var scriptFolderObj = new Folder(scriptFolder);
        if (!scriptFolderObj.exists) {
            scriptFolderObj.create();
        }
        return scriptFolderObj.fsName;
    };

    module.libFolder = function () {
        var libPath = module.userFolder() + "/lib";
        var libFolderObj = new Folder(libPath);
        if (!libFolderObj.exists) {
            libFolderObj.create();
        }
        return libFolderObj.fsName;
    };

    return module;
})();