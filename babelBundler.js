const fs = require('fs');
const parser = require('/usr/local/lib/node_modules/@babel/parser');
const traverse = require('/usr/local/lib/node_modules/@babel/traverse').default;
const generate = require("/usr/local/lib/node_modules/@babel/generator").default;
const t = require("/usr/local/lib/node_modules/@babel/types");

// Read the source and library code from files
const sourceCode = fs.readFileSync('Distribute Along Path_v1.1.0.jsx', 'utf-8');
const libraryCode = fs.readFileSync('modules/ApplyFFX.js', 'utf-8');


// Parse both source and library to AST
const sourceAst = parser.parse(sourceCode);
const libraryAst = parser.parse(libraryCode);

// Step 1: Identify used functions in source code
const usedFunctions = new Set();
traverse(sourceAst, {
    CallExpression(path) {
        const callee = path.node.callee;
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.object, { name: "AE" })) {
            usedFunctions.add(callee.property.name);
        }
    },
});

let iifeVariable = null;

// Step 2: Identify the IIFE variable in library
traverse(libraryAst, {
    VariableDeclaration(path) {
        const declarations = path.node.declarations;
        if (declarations.length === 1 && t.isCallExpression(declarations[0].init)) {
            iifeVariable = declarations[0].id.name;
        }
    },
});

// Step 3: Extract used functions from the library
const extractedFunctions = [];
traverse(libraryAst, {
    AssignmentExpression(path) {
        const left = path.node.left;
        if (
            t.isMemberExpression(left) &&
            t.isMemberExpression(left.object) &&
            t.isIdentifier(left.object.object, { name: iifeVariable }) &&
            usedFunctions.has(left.object.property.name)
        ) {
            extractedFunctions.push(path.parent);
        }
    },
});

// Create the AST nodes for the comment banners manually
const bannerStart = {
    type: "CommentBlock",
    value: "=============== START OF INCLUDED FUNCTIONS ================"
};

const bannerEnd = {
    type: "CommentBlock",
    value: "================ END OF INCLUDED FUNCTIONS ================"
};

// Create a new AST from the source code
const newAst = parser.parse(sourceCode);

// Traverse to find the include comment, and remember its position
let includeCommentPosition = null;
traverse(newAst, {
    CommentBlock(path) {
        if (path.node.value.includes('@include "module/AE.js"')) {
            includeCommentPosition = path.key;
        }
    },
});

// Manually insert the banners and extracted functions into the AST
if (includeCommentPosition !== null) {
    newAst.program.body.splice(includeCommentPosition + 1, 0, bannerStart, ...extractedFunctions, bannerEnd);
}

const { code } = generate(newAst, {
    comments: true
});

console.log(code);