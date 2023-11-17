/**
 * @module JavaScriptLibraryParser
 * @description A module for parsing JavaScript libraries to identify their name and list of functions.
 */
x
const esprima = require('esprima');
const fs = require('fs');
const path = require('path');

/**
 * @function findRequiredFunctions
 * @memberof JavaScriptLibraryParser
 * @description Recursively find all required functions in a given AST node.
 * @param {Object} node - The AST node.
 * @returns {string[]} An array of required function names.
 * @example
 * const astNode = { ... }; // Some AST node
 * const requiredFunctions = findRequiredFunctions(astNode);
 */
function findRequiredFunctions(node) {
	let required = [];
	if (node.type === 'CallExpression' && node.callee.object && node.callee.object.name === 'module') {
		required.push(node.callee.property.name);
	}
	for (let key in node) {
		if (node[key] && typeof node[key] === 'object') {
			required = required.concat(findRequiredFunctions(node[key]));
		}
	}
	return required;
}

/**
 * @function parseLibrary
 * @memberof JavaScriptLibraryParser
 * @description Parse a JavaScript library to identify its name and functions.
 * @param {string} content - The content of the JavaScript file.
 * @returns {Object} An object containing the library name and a list of its functions.
 * @example
 * const fileContent = fs.readFileSync('some-library.js', 'utf-8');
 * const parsedLibrary = parseLibrary(fileContent);
 */
function parseLibrary(content) {
	const ast = esprima.parseScript(content);
	let result = { listOfFunctions: [] };

	esprima.parseScript(content, {}, function (node) {
		if (node.type === 'VariableDeclaration' && node.declarations[0].init) {
			if (node.declarations[0].init.type === 'CallExpression' &&
				node.declarations[0].init.callee.type === 'FunctionExpression') {
				result.libraryName = node.declarations[0].id.name;
			}
		} else if (node.type === 'AssignmentExpression' && node.left.object && node.left.object.name === 'module') {
			const functionName = node.left.property.name;
			const functionArgs = node.right.params.map(function (p) { return p.name; }).join(', ');
			const requires = findRequiredFunctions(node.right.body);
			result.listOfFunctions.push({
				name: functionName,
				args: functionArgs,
				require: requires.length ? requires : 'none'
			});
		}
	});
	return result;
}

/**
 * @function parseLibrariesInFolder
 * @memberof JavaScriptLibraryParser
 * @description Parse all JavaScript libraries in a given folder.
 * @param {string} folderPath - The path to the folder containing the JavaScript files.
 * @param {string} [outputFilePath] - Optional path to write the output to. If not provided, the function will return the parsed data.
 * @returns {Object[]} An array of objects containing library names and their functions, if outputFilePath is not provided.
 * @example
 * const folderPath = './libraries';
 * const outputFilePath = './parsedLibraries.txt';
 * parseLibrariesInFolder(folderPath, outputFilePath);
 */
function parseLibrariesInFolder(folderPath, outputFilePath) {
	const files = fs.readdirSync(folderPath);
	const parsedLibraries = [];

	files.forEach(function (file) {
		const filePath = path.join(folderPath, file);
		const content = fs.readFileSync(filePath, 'utf-8');
		const parsed = parseLibrary(content);
		parsedLibraries.push(parsed);
	});

	if (outputFilePath) {
		let output = '';
		parsedLibraries.forEach(function (lib) {
			output += `Library Name: ${lib.libraryName}\nFunctions:\n`;
			lib.listOfFunctions.forEach(function (func) {
				output += `  - Name: ${func.name}, Args: ${func.args}, Requires: ${func.require}\n`;
			});
			output += '\n';
		});

		fs.writeFileSync(outputFilePath, output);
	}

	return parsedLibraries;
}

module.exports = {
	parseLibrary: parseLibrary,
	parseLibrariesInFolder: parseLibrariesInFolder
};
