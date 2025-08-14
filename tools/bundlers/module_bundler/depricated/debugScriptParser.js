// debugScriptParser.js
const { parseIncludesAndUsage } = require('../scriptParser.js');

const filePath = '../testbed.js'; // Replace with the path to the JavaScript file you want to parse.

const parsedScript = parseIncludesAndUsage(filePath, false); // The second argument controls whether to save to a text file. Set to false for now.

console.log("Parsed Script:", parsedScript);
