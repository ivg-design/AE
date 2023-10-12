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

function includeRequiredFunctions(filePath, requiredFunctions, allIncludedFunctions, logFlag = true) {
    const content = fs.readFileSync(filePath, 'utf-8');
    let includedContent = '';

    if (logFlag) {
        console.log(`Reading from file: ${filePath}`);
    }

    requiredFunctions.forEach(func => {
        const funcIdentifier = `${path.basename(filePath)}:${func}`;

        if (allIncludedFunctions.has(funcIdentifier)) {
            console.log(`Function ${func} already included.`);
            return;
        }

        allIncludedFunctions.add(funcIdentifier);

        const regex = new RegExp(`(\\/\\*\\*[\\s\\S]*?\\*\\/\\s*)?module\\.${func}\\s*=\\s*function\\s*\\([^]*?}\\s*;`, 'g');
        const found = content.match(regex);
        if (found && !allIncludedFunctions.has(func)) {
            console.log(`Found function: ${func}`);
            includedContent += found.join('\n') + '\n';
            allIncludedFunctions.add(func);
            const innerRequired = extractFunctions(found.join('\n'), 'Ae|ArrayEx|ApplyFFX');
            if (innerRequired.size > 0) {
                console.log(`Inner required functions for ${func}: ${Array.from(innerRequired).join(', ')}`);
                includedContent += includeRequiredFunctions(filePath, innerRequired, allIncludedFunctions, false);
            }
        } else {
            console.log(`Function ${func} not found in ${filePath}`);
        }
    });

    return includedContent;
}

let logContent = '';
let allIncludedFunctions = new Set();

const mainFilePath = process.argv[2];
const basePath = path.dirname(mainFilePath);
let mainContent = fs.readFileSync(mainFilePath, 'utf-8');
mainContent = mainContent.replace(/\/\/\s*@include.*\n/g, '');

const aeFunctions = extractFunctions(mainContent, 'Ae');
const arrayExFunctions = extractFunctions(mainContent, 'ArrayEx');
const applyFFXFunctions = extractFunctions(mainContent, 'ApplyFFX');

console.log(`Functions to include from Ae.js: ${Array.from(aeFunctions).join(', ')}`);
console.log(`Functions to include from ArrayEx.js: ${Array.from(arrayExFunctions).join(', ')}`);
console.log(`Functions to include from ApplyFFX.js: ${Array.from(applyFFXFunctions).join(', ')}`);

let functionContentAe = '';
let functionContentArrayEx = '';
let functionContentApplyFFX = '';

if (aeFunctions.size > 0) {
    const aePath = path.join(basePath, 'modules', 'Ae.js');
    functionContentAe += includeRequiredFunctions(aePath, aeFunctions, allIncludedFunctions);
}

if (arrayExFunctions.size > 0) {
    const arrayExPath = path.join(basePath, 'modules', 'ArrayEx.js');
    functionContentArrayEx += includeRequiredFunctions(arrayExPath, arrayExFunctions, allIncludedFunctions);
}

if (applyFFXFunctions.size > 0) {
    const applyFFXpath = path.join(basePath, 'modules', 'ApplyFFX.js');
    functionContentApplyFFX += includeRequiredFunctions(applyFFXpath, applyFFXFunctions, allIncludedFunctions);
}

let cleanedBundledContent = `//========== INCLUDED FUNCTIONS ============//\n`;

const appendLibraryContent = (libName, libContent) => {
    if (libContent.trim() !== '') {
        return `var ${libName} = (function () {\n var module = {};\n${libContent}\n return module;\n})();\n`;
    }
    return '';
};

cleanedBundledContent += appendLibraryContent('Ae', functionContentAe);
cleanedBundledContent += appendLibraryContent('ArrayEx', functionContentArrayEx);
cleanedBundledContent += appendLibraryContent('ApplyFFX', functionContentApplyFFX);

cleanedBundledContent += `//========== END OF INCLUDED FUNCTIONS ============//\n\n${mainContent}`;

const outputFileName = `${path.basename(mainFilePath, '.jsx')}_Bundled.jsx`;
fs.writeFileSync(path.join(basePath, 'dist', outputFileName), cleanedBundledContent, 'utf-8');

const now = new Date().toLocaleString();
logContent = `${now}\nBundled File: ${outputFileName}\n${logContent}//================ END OF BUNDLING ${outputFileName} ==============//\n`;
fs.appendFileSync(path.join(basePath, 'dist', 'include_log.txt'), logContent, 'utf-8');

console.log(`Bundling the file: ${mainFilePath}`);
