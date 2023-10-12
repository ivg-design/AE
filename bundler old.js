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

function parseFunctions(content) {
    let functions = {};
    let lines = content.split('\n');
    let insideFunction = false;
    let buffer = [];
    let functionName = null;

    lines.forEach(line => {
        if (line.trim().startsWith("module.")) {
            insideFunction = true;
            functionName = line.trim().split(' ')[0].split('.')[1];
        }

        if (insideFunction) {
            buffer.push(line);
        }

        if (line.trim() === '};' && insideFunction) {
            insideFunction = false;
            functions[functionName] = buffer.join('\n');
            buffer = [];
        }
    });

    return functions;
}

function includeRequiredFunctions(libName, filePath, requiredFunctions, allIncludedFunctions) {
    const content = fs.readFileSync(filePath, 'utf-8').replace(/\/\*\*[\s\S]*?\*\//gm, '');
    const functions = parseFunctions(content);

    let includedContent = '';
    requiredFunctions.forEach(func => {
        const funcIdentifier = `${libName}:${func}`;
        if (allIncludedFunctions.has(funcIdentifier)) return;

        allIncludedFunctions.add(funcIdentifier);

        if (functions.hasOwnProperty(func)) {
            includedContent += `${functions[func]}\n`;
        }
    });

    return includedContent;
}

const libraries = {
    'Ae': 'modules/Ae.js',
    'ArrayEx': 'modules/ArrayEx.js',
    'ApplyFFX': 'modules/ApplyFFX.js',
};

const outputPaths = [
    'dist',
];

let allIncludedFunctions = new Set();
const mainFilePath = process.argv[2];
const basePath = path.dirname(mainFilePath);
let mainContent = fs.readFileSync(mainFilePath, 'utf-8').replace(/\/\/\s*@include.*\n/g, '');

let cleanedBundledContent = `//========== INCLUDED FUNCTIONS ============//\n`;

Object.keys(libraries).forEach(libName => {
    const requiredFunctions = extractFunctions(mainContent, libName);
    if (requiredFunctions.size > 0) {
        const libPath = path.join(basePath, libraries[libName]);
        let functionContent = includeRequiredFunctions(libName, libPath, requiredFunctions, allIncludedFunctions);

        cleanedBundledContent += `var ${libName} = (function () {\n var module = {};\n${functionContent}\n return module;\n})();\n`;
    }
});

cleanedBundledContent += `//========== END OF INCLUDED FUNCTIONS ============//\n\n${mainContent}`;

const outputFileName = `${path.basename(mainFilePath, '.jsx')}_Bundled.jsx`;

outputPaths.forEach(outputPath => {
    const fullOutputPath = path.join(basePath, outputPath);
    if (!fs.existsSync(fullOutputPath)) {
        fs.mkdirSync(fullOutputPath);
    }
    fs.writeFileSync(path.join(fullOutputPath, outputFileName), cleanedBundledContent, 'utf-8');
});
