const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default; // For generating code from AST nodes

function findRequiredFunctions(node, required = []) {
    if (node.type === 'CallExpression' && node.callee.object && node.callee.object.name === 'module') {
        required.push(node.callee.property.name);
    }
    for (let key in node) {
        if (node[key] && typeof node[key] === 'object') {
            findRequiredFunctions(node[key], required);
        }
    }
    return required;
}

// function parseLibrary(content) {
//     const ast = parser.parse(content, { sourceType: 'script' });
//     let result = { listOfFunctions: [] };
//     traverse(ast, {
//         enter(path) {
//             if (path.isVariableDeclaration() && path.node.declarations[0].init) {
//                 if (path.node.declarations[0].init.type === 'CallExpression' &&
//                     path.node.declarations[0].init.callee.type === 'FunctionExpression') {
//                     result.libraryName = path.node.declarations[0].id.name;
//                 }
//             } else if (path.isAssignmentExpression() && path.node.left.object && path.node.left.object.name === 'module') {
//                 const functionName = path.node.left.property.name;
//                 const functionArgs = path.node.right.params ? path.node.right.params.map(p => p.name).join(', ') : '';
//                 const functionBody = `module.${functionName} = function(${functionArgs}) ${generate(path.node.right.body).code};`;
//                 const requires = findRequiredFunctions(path.node);
//                 result.listOfFunctions.push({
//                     name: functionName,
//                     args: functionArgs,
//                     require: requires.length ? requires : 'none',
//                     body: functionBody  // Store the entire function string
//                 });
//             }

//         }
//     });
//     return result;
// }
function parseLibrary(content) {
    const ast = parser.parse(content, { sourceType: 'script' });
    let result = { listOfFunctions: [] };
    traverse(ast, {
        enter(path) {
            if (path.isVariableDeclaration() && path.node.declarations[0].init) {
                if (path.node.declarations[0].init.type === 'CallExpression' &&
                    path.node.declarations[0].init.callee.type === 'FunctionExpression') {
                    result.libraryName = path.node.declarations[0].id.name;
                }
            } else if (path.isAssignmentExpression() && path.node.left.object && path.node.left.object.name === 'module') {
                const functionName = path.node.left.property.name;
                const functionArgs = path.node.right.params ? path.node.right.params.map(p => p.name).join(', ') : '';

                // Capture the original source code for this function
                const functionStart = path.node.start;
                const functionEnd = path.node.end;
                const functionBody = content.substring(functionStart, functionEnd);

                const requires = findRequiredFunctions(path.node);

                result.listOfFunctions.push({
                    name: functionName,
                    args: functionArgs,
                    require: requires.length ? requires : 'none',
                    body: functionBody  // Store the original source code
                });
            }
        }
    });
    return result;
}



function parseLibrariesInFolder(folderPath, createLogFile = false) {
    const files = fs.readdirSync(folderPath);
    const parsedLibraries = [];

    files.forEach((file) => {
        const filePath = path.join(folderPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = parseLibrary(content);
        parsedLibraries.push(parsed);
    });

    if (createLogFile) {
        const currentDate = new Date();
        const formattedDate = `${currentDate.getMonth() + 1}-${currentDate.getDate()}-${currentDate.getFullYear()}`;
        const outputFilePath = `logs/libParserLog-${formattedDate}.txt`;  // <-- Dynamic file name
        let output = '';
        parsedLibraries.forEach((lib) => {
            output += `Library Name: ${lib.libraryName}\nFunctions:\n`;
            lib.listOfFunctions.forEach((func) => {
                output += `  - Name: ${func.name}, Args: ${func.args}, Requires: ${func.require}\n`;
            });
            output += '\n';
        });
        fs.writeFileSync(outputFilePath, output);
    }

    return parsedLibraries;  // <-- Add this line to return the parsed libraries
}

module.exports = {
    parseLibrary,
    parseLibrariesInFolder
};
