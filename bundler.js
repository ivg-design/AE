const fs = require('fs');
const path = require('path');

function extractFunctions(content, prefix) {
    const regex = new RegExp(`\\b${prefix}\\.([a-zA-Z0-9_]+)`, 'g');
    const functions = new Set();
    let match;
    while ((match = regex.exec(content))) {
        functions.add(match[1]);
    }
    return functions;
}

function includeRequiredFunctions(filePath, requiredFunctions, logFlag = true) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let includedContent = '';

    if (logFlag) {
        console.log(`Reading from file: ${filePath}`);
    }

    requiredFunctions.forEach(func => {
        const regex = new RegExp(`(\\/\\*\\*[\\s\\S]*?\\*\\/\\s*)?module\\.${func}\\s*=\\s*function\\s*\\([^]*?}\\s*;`, 'g');
        const found = content.match(regex);
        if (found) {
            console.log(`Found function: ${func}`);
            includedContent += found.join('\n') + '\n';
            logContent += `Included ${func} from ${path.basename(filePath)}\n`;
            const innerRequired = extractFunctions(found.join('\n'), 'Ae|ArrayEx');
            if (innerRequired.size > 0) {
                console.log(`Inner required functions for ${func}: ${Array.from(innerRequired).join(', ')}`);
                includedContent += includeRequiredFunctions(filePath, innerRequired, false);
            }
        } else {
            console.log(`Function ${func} not found in ${filePath}`);
        }
    });

    if (requiredFunctions.size > 0) {
        includedContent = `var ${path.basename(filePath, '.js')} = (function() {\n var module = {};\n${includedContent}\n return module;\n})();\n`;
    }

    return includedContent;
}

let logContent = '';

const mainFilePath = process.argv[2] || path.join(__dirname, 'TuneSync.jsx');
const basePath = path.dirname(mainFilePath);
let mainContent = fs.readFileSync(mainFilePath, 'utf-8');

// Remove //@include lines from mainContent (with or without space after //)
mainContent = mainContent.replace(/\/\/\s*@include.*\n/g, '');

const aeFunctions = extractFunctions(mainContent, 'Ae');
const arrayExFunctions = extractFunctions(mainContent, 'ArrayEx');

aeFunctions.delete('js');
arrayExFunctions.delete('js');

console.log(`Functions to include from Ae.js: ${Array.from(aeFunctions).join(', ')}`);
console.log(`Functions to include from ArrayEx.js: ${Array.from(arrayExFunctions).join(', ')}`);

let functionContent = '';

if (aeFunctions.size > 0) {
    const aePath = path.join(basePath, 'modules', 'Ae.js');
    functionContent += includeRequiredFunctions(aePath, aeFunctions);
}

if (arrayExFunctions.size > 0) {
    const arrayExPath = path.join(basePath, 'modules', 'ArrayEx.js');
    functionContent += includeRequiredFunctions(arrayExPath, arrayExFunctions);
}

const cleanedBundledContent = `//========== INCLUDED FUNCTIONS ============//\n${functionContent}//========== END OF INCLUDED FUNCTIONS ============//\n\n${mainContent}`;

const outputFileName = `${path.basename(mainFilePath, '.jsx')}_Bundled.jsx`;
fs.writeFileSync(path.join(basePath, 'dist', outputFileName), cleanedBundledContent, 'utf-8');

const now = new Date().toLocaleString();
logContent = `${now}\nBundled File: ${outputFileName}\n${logContent}//================ END OF BUNDLING ${outputFileName} ==============//\n`;

fs.appendFileSync(path.join(basePath, 'dist', 'include_log.txt'), logContent, 'utf-8');

console.log(`Bundling the file: ${mainFilePath}`);
