const fs = require('fs');
const path = require('path');

const { parseIncludesAndUsage } = require('./scriptParser.js');
const { parseLibrary, parseLibrariesInFolder } = require('./libParser.js');

const libFolder = '../modules';
const filePath = '../testbed.js'; // The file is in the root folder above the parser folder
console.log("File Path: ", filePath);

const parsedLibraries = parseLibrariesInFolder(libFolder, false);
console.log("Parsed Libraries: ", parsedLibraries);

const parsedScript = parseIncludesAndUsage(filePath, false);
console.log("Parsed Script: ", parsedScript);

let importedFunctions = '//===================== START OF INCLUDED FUNCTIONS ==================//\n';

// Iterate over each library used in the script
for (const scriptLib of parsedScript) {
    const scriptLibName = scriptLib.library;
    const scriptFunctions = scriptLib.functions;

    // Find the corresponding library from the parsed libraries
    const matchingLibrary = parsedLibraries.find(lib => lib.libraryName === scriptLibName);

    if (matchingLibrary) {
        let functionsToImport = [];

        // Check each function used in the script
        for (const func of scriptFunctions) {
            const matchingFunction = matchingLibrary.listOfFunctions.find(f => f.name === func);

            if (matchingFunction) {
                functionsToImport.push(matchingFunction);

                // Include any required functions
                if (matchingFunction.require !== 'none') {
                    functionsToImport = functionsToImport.concat(
                        matchingLibrary.listOfFunctions.filter(f => matchingFunction.require.includes(f.name))
                    );
                }
            }
        }
        // Utility function to add indentation to each line of a string
        function indentString(str, numSpaces) {
            const indent = ' '.repeat(numSpaces);
            return str.split('\n').map(line => indent + line).join('\n');
        }

        // Generate the import code
        if (functionsToImport.length > 0) {
            let functionCode = functionsToImport.map(f => indentString(f.body, 4)).join('\n');  // Change here, indent by 4 spaces
            importedFunctions += `
var ${scriptLibName} = (function() {
    var module = {};
${functionCode}  // Function bodies should be indented correctly here
    return module;
})();
`;
        }

    }
}

importedFunctions += '//===================== END OF INCLUDED FUNCTIONS ==================//\n';

// Determine the output folder and file name
const outputFolder = '../test'; // replace with your desired output folder
const originalFileName = path.basename(filePath);
const originalFileExt = path.extname(filePath);
const bundledFileName = `${path.basename(originalFileName, originalFileExt)}_bundled${originalFileExt}`;
const outputPath = path.join(outputFolder, bundledFileName);

// Create the output folder if it doesn't exist
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// Read the original script content
const originalScriptContent = fs.readFileSync(filePath, 'utf-8');

// Combine the original script content with the imported functions
const bundledScriptContent = `${importedFunctions}\n${originalScriptContent}`;

// Write the bundled content to a new file
fs.writeFileSync(outputPath, bundledScriptContent);

console.log(`Bundled script written to ${outputPath}`);
