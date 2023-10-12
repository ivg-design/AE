// Test script for bundler
//@include 'modules/Ae.js'
//@include 'modules/ArrayEx.js'
//@include 'modules/ApplyFFX.js'


// Using a function from the Ae library
Ae.getDeepestSelectedProperty(selectedProperties);
Ae.checkPropertyType(selectedProperties);

// Using a function from the ArrayEx library
ArrayEx.filter(array, callback);

// Using a function from the ApplyFFX library
ApplyFFX.config(layer, binaryData, matchName, version, shapeName);

// Some random code to make the script do something
console.log("This is a test script for the bundler.");
