const fs = require('fs');
const esprima = require('esprima');
const estraverse = require('estraverse');
const path = require('path');

const logStream = fs.createWriteStream('debug_log.txt');

const inputFilePath = process.argv[2];
const outputDir = process.argv[3] || './';

const mainContent = fs.readFileSync(inputFilePath, 'utf-8');

const includeStatements = mainContent.match(/\/\/\s*@include\s*['"]([^'"]+)['"]/g) || [];
logStream.write(`Found include statements: ${JSON.stringify(includeStatements)}\n`);

let bundledCode = '/************************ START OF INCLUDED FUNCTIONS ************************/\n';

includeStatements.forEach(includeStatement => {
    const libraryPath = includeStatement.match(/['"]([^'"]+)['"]/)[1];
    const libraryContent = fs.readFileSync(libraryPath, 'utf-8');
    const astLibrary = esprima.parseScript(libraryContent, { range: true });

    let availableFunctions = new Map();
    let functionDependencies = {};

    estraverse.traverse(astLibrary, {
        enter: function (node, parent) {
            if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && node.left.object.name === 'module') {
                const functionName = node.left.property.name;
                availableFunctions.set(functionName, node);
            }

            if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.object.name === 'module') {
                const calledFunction = node.callee.property.name;
                let declaringFunction = null;

                if (parent && parent.type === 'AssignmentExpression' && parent.left && parent.left.type === 'MemberExpression' && parent.left.property) {
                    declaringFunction = parent.left.property.name;
                }

                if (declaringFunction) {
                    if (!functionDependencies[declaringFunction]) {
                        functionDependencies[declaringFunction] = new Set();
                    }
                    functionDependencies[declaringFunction].add(calledFunction);
                }
            }
        }
    });

    const astScript = esprima.parseScript(mainContent);
    let functionsUsed = new Set();

    estraverse.traverse(astScript, {
        enter: function (node) {
            if (node.type === 'MemberExpression' && node.object.name === path.basename(libraryPath, '.js')) {
                functionsUsed.add(node.property.name);
            }
        }
    });

    function includeDependencies(funcName) {
        if (functionDependencies[funcName]) {
            functionDependencies[funcName].forEach(dependency => {
                functionsUsed.add(dependency);
                includeDependencies(dependency);
            });
        }
    }

    functionsUsed.forEach(includeDependencies);

    bundledCode += `var ${path.basename(libraryPath, '.js')} = (function () {\n  var module = {};\n`;

    functionsUsed.forEach(fn => {
        const functionNode = availableFunctions.get(fn);
        if (functionNode) {
            const functionCode = libraryContent.substring(functionNode.range[0], functionNode.range[1]);
            bundledCode += `  module.${fn} = ${functionCode};\n`;
        }
    });

    bundledCode += '  return module;\n})();\n';
});

bundledCode += '/************************ END OF INCLUDED FUNCTIONS ************************/\n';

const outputFileName = path.basename(inputFilePath, path.extname(inputFilePath)) + '_bndl' + path.extname(inputFilePath);

fs.writeFileSync(path.join(outputDir, outputFileName), bundledCode);

logStream.end();

console.log(`Bundling completed. Output written to ${path.join(outputDir, outputFileName)}`);
