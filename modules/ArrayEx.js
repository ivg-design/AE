var ArrayEx = (function () {
  var module = {};

  module.ensureIsArray = function (array) {
    if (!module.isArray(array)) {
      array = [array];
    }

    return array;
  };

  module.every = function (array, callback) {
    for (var i = 0, il = array.length; i < il; i++) {
      if (!callback(array[i], i, array)) {
        return false;
      }
    }

    return true;
  };

  module.filter = function (array, callback) {
    var filteredArray = [];
    var index = 0;

    module.forEach(array, function (element, i, array) {
      if (callback(element, i, array)) {
        filteredArray[index++] = element;
      }
    });

    return filteredArray;
  };

  module.filterColl = function (array, callback) {
    var filteredArray = [];
    var index = 0;

    module.forEachColl(array, function (element, i, array) {
      if (callback(element, i, array)) {
        filteredArray[index++] = element;
      }
    });

    return filteredArray;
  };

  module.forEach = function (array, callback) {
    for (var i = 0, il = array.length; i < il; i++) {
      callback(array[i], i, array);
    }
  };

  module.forEachColl = function (array, callback) {
    for (var i = 1, il = array.length; i <= il; i++) {
      callback(array[i], i, array);
    }
  };

  module.includes = function (array, element) {
    return module.indexOf(array, element) >= 0;
  };

  module.indexOf = function (array, element) {
    for (var i = 0, il = array.length; i < il; i++) {
      if (array[i] === element) {
        return i;
      }
    }
    return -1;
  };

  module.isArray = function (array) {
    return Object.prototype.toString.call(array) === '[object Array]';
  };

  module.map = function (array, callback) {
    var mappedArray = [];
    module.forEach(array, function (item, i, array) {
      mappedArray[i] = callback(item, i, array);
    });

    return mappedArray;
  };

  module.arraysEqual = function (a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0, il = a.length; i < il; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  };

  module.hasNoneZeroValues2D = function (array2D) {
    //return array2D.some((array) => array.some((value) => value !== 0));
    var is_zero = function(arr) {
      return module.arraysEqual(arr, [0,0])
    }
    return (!module.every(array2D, is_zero));
  };

  return module;
})();
