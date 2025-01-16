const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require('fs');

/**
 * Parses a JavaScript file to identify library includes and function usages.
 * 
 * @function parseIncludesAndUsage
 * @param {string} filePath - Path to the JavaScript file to parse.
 * @param {boolean} [writeToFile=false] - Whether to write the parsed information to a text file.
 */
function parseIncludesAndUsage(filePath, writeToFile = false) {
    const code = fs.readFileSync(filePath, 'utf-8');

    const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx"]
    });

    const includes = [];
    const usages = {};

    traverse(ast, {
        enter(path) {
            // Check for include comments
            if (path.node.leadingComments) {
                path.node.leadingComments.forEach(comment => {
                    if (comment.value.includes("@include")) {
                        const libraryName = comment.value.split("'")[1].split('/').pop().replace('.js', '');
                        includes.push(libraryName);
                        usages[libraryName] = [];
                    }
                });
            }

            // Check for MemberExpressions (e.g., Library.function())
            if (path.isMemberExpression()) {
                const objectName = path.node.object.name;
                const propertyName = path.node.property.name;

                if (usages[objectName]) {
                    usages[objectName].push(propertyName);
                }
            }
        }
    });

    // Remove duplicates
    Object.keys(usages).forEach(key => {
        usages[key] = [...new Set(usages[key])];
    });

    const output = includes.map(library => ({
        library,
        functions: usages[library] || []
    }));

    console.log("Output:", output);

    if (writeToFile) {
        const writeStream = fs.createWriteStream('parsedInfo.txt');
        output.forEach(item => {
            writeStream.write(`Library: ${item.library}\n`);
            writeStream.write(`Functions: ${item.functions.join(', ')}\n`);
        });
        writeStream.end();
    }

    return output; // Add this line
}

module.exports = {
    parseIncludesAndUsage
};