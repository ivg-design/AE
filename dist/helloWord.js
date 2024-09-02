//trim.js
/*
https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
*/
if (!String.prototype.trim) {
	// Вырезаем BOM и неразрывный пробел
	String.prototype.trim = function() {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}
//every.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every
*/
if (!Array.prototype.every) {
  Array.prototype.every = function(callback, thisArg) {
    var T, k;

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.every called on null or undefined');
    }

    // 1. Let O be the result of calling ToObject passing the this 
    //    value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal method
    //    of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    if (callback.__class__ !== 'Function') {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    T = (arguments.length > 1) ? thisArg : void 0;

    // 6. Let k be 0.
    k = 0;

    // 7. Repeat, while k < len
    while (k < len) {

      var kValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal 
      //    method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal method
        //    of O with argument Pk.
        kValue = O[k];

        // ii. Let testResult be the result of calling the Call internal method
        //     of callback with T as the this value and argument list 
        //     containing kValue, k, and O.
        var testResult = callback.call(T, kValue, k, O);

        // iii. If ToBoolean(testResult) is false, return false.
        if (!testResult) {
          return false;
        }
      }
      k++;
    }
    return true;
  };
}
//filter.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
*/
if (!Array.prototype.filter) {
  Array.prototype.filter = function(callback, thisArg) {

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.filter called on null or undefined');
    }

    var t = Object(this);
    var len = t.length >>> 0;

    if (callback.__class__ !== 'Function') {
      throw new TypeError(callback + ' is not a function');
    }

    var res = [];

    var T = (arguments.length > 1) ? thisArg : void 0;
    
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i];

        // NOTE: Technically this should Object.defineProperty at
        //       the next index, as push can be affected by
        //       properties on Object.prototype and Array.prototype.
        //       But that method's new, and collisions should be
        //       rare, so use the more-compatible alternative.
        if (callback.call(T, val, i, t)) {
          res.push(val);
        }
      }
    }

    return res;
  };
}
//forEach.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.18
// Reference: http://es5.github.io/#x15.4.4.18
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg) {


        if (this === void 0 || this === null) {
            throw new TypeError('Array.prototype.forEach called on null or undefined');
        }

        // 1. Let O be the result of calling toObject() passing the
        // |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get() internal
        // method of O with the argument "length".
        // 3. Let len be toUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If isCallable(callback) is false, throw a TypeError exception. 
        // See: http://es5.github.com/#x9.11
        if (callback.__class__ !== 'Function') {
            throw new TypeError(callback + ' is not a function');
        }

        // 5. If thisArg was supplied, let T be thisArg; else let
        // T be undefined.
        var T = (arguments.length > 1) ? thisArg : void 0;


        // 6. Let k be 0
        //k = 0;

        // 7. Repeat, while k < len
        for (var k = 0; k < len; k++) {
            var kValue;
            // a. Let Pk be ToString(k).
            //    This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty
            //    internal method of O with argument Pk.
            //    This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {
                // i. Let kValue be the result of calling the Get internal
                // method of O with argument Pk.
                kValue = O[k];
                // ii. Call the Call internal method of callback with T as
                // the this value and argument list containing kValue, k, and O.
                callback.call(T, kValue, k, O);
            }
        }
        // 8. return undefined
    }
}
//indexOf.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.14
// Reference: http://es5.github.io/#x15.4.4.14
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(searchElement, fromIndex) {


    // 1. Let o be the result of calling ToObject passing
    //    the this value as the argument.
    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.indexOf called on null or undefined');
    }

    var k;
    var o = Object(this);

    // 2. Let lenValue be the result of calling the Get
    //    internal method of o with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = o.length >>> 0;

    // 4. If len is 0, return -1.
    if (len === 0) {
      return -1;
    }

    // 5. If argument fromIndex was passed let n be
    //    ToInteger(fromIndex); else let n be 0.
    var n = +fromIndex || 0;

    if (Math.abs(n) === Infinity) {
      n = 0;
    }

    // 6. If n >= len, return -1.
    if (n >= len) {
      return -1;
    }

    // 7. If n >= 0, then Let k be n.
    // 8. Else, n<0, Let k be len - abs(n).
    //    If k is less than 0, then let k be 0.
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    // 9. Repeat, while k < len
    while (k < len) {
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the
      //    HasProperty internal method of o with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      //    i.  Let elementK be the result of calling the Get
      //        internal method of o with the argument ToString(k).
      //   ii.  Let same be the result of applying the
      //        Strict Equality Comparison Algorithm to
      //        searchElement and elementK.
      //  iii.  If same is true, return k.
      if (k in o && o[k] === searchElement) {
        return k;
      }
      k++;
    }
    return -1;
  };
}
//isArray.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
*/
if (!Array.isArray) {
  Array.isArray = function(arg) {

    if (arg === void 0 || arg === null) {
      return false;
    }
  	return (arg.__class__ === 'Array');
  };
}
//lastIndexOf.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.15
// Reference: http://es5.github.io/#x15.4.4.15
if (!Array.prototype.lastIndexOf) {
  Array.prototype.lastIndexOf = function(searchElement, fromIndex) {

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.lastIndexOf called on null or undefined');
    }

    var n, k,
      t = Object(this),
      len = t.length >>> 0;
    if (len === 0) {
      return -1;
    }

    n = len - 1;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) {
        n = 0;
      }
      else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }

    for (k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n); k >= 0; k--) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  };
}
//map.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {

  Array.prototype.map = function(callback, thisArg) {

    var T, A, k;

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.map called on null or undefined');
    }

    // 1. Let O be the result of calling ToObject passing the |this| 
    //    value as the argument.
    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get internal 
    //    method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If IsCallable(callback) is false, throw a TypeError exception.
    // See: http://es5.github.com/#x9.11
    if (callback.__class__ !== 'Function') {
      throw new TypeError(callback + ' is not a function');
    }

    // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
    T = (arguments.length > 1) ? thisArg : void 0;

    // 6. Let A be a new array created as if by the expression new Array(len) 
    //    where Array is the standard built-in constructor with that name and 
    //    len is the value of len.
    A = new Array(len);

    for (var k = 0; k < len; k++) {

      var kValue, mappedValue;

      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the HasProperty internal 
      //    method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      if (k in O) {

        // i. Let kValue be the result of calling the Get internal 
        //    method of O with argument Pk.
        kValue = O[k];

        // ii. Let mappedValue be the result of calling the Call internal 
        //     method of callback with T as the this value and argument 
        //     list containing kValue, k, and O.
        mappedValue = callback.call(T, kValue, k, O);

        // iii. Call the DefineOwnProperty internal method of A with arguments
        // Pk, Property Descriptor
        // { Value: mappedValue,
        //   Writable: true,
        //   Enumerable: true,
        //   Configurable: true },
        // and false.

        // In browsers that support Object.defineProperty, use the following:
        // Object.defineProperty(A, k, {
        //   value: mappedValue,
        //   writable: true,
        //   enumerable: true,
        //   configurable: true
        // });

        // For best browser support, use the following:
        A[k] = mappedValue;
      }
    }
    // 9. return A
    return A;
  };
}
//reduce.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(callback, initialValue) {

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.reduce called on null or undefined');
    }

    if (callback.__class__ !== 'Function') {
      throw new TypeError(callback + ' is not a function');
    }

    var t = Object(this), len = t.length >>> 0, k = 0, value;

    if (arguments.length > 1) 
      {
        value = initialValue;
      } 
    else 
      {
        while (k < len && !(k in t)) {
          k++; 
        }
        if (k >= len) {
          throw new TypeError('Reduce of empty array with no initial value');
        }
        value = t[k++];
      }

    for (; k < len; k++) {
      if (k in t) {
        value = callback(value, t[k], k, t);
      }
    }
    return value;
  };
}
//reduceRight.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/ReduceRight
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.22
// Reference: http://es5.github.io/#x15.4.4.22
if (!Array.prototype.reduceRight) {
  Array.prototype.reduceRight = function(callback, initialValue) {

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.reduceRight called on null or undefined');
    }

    if (callback.__class__ !== 'Function') {
      throw new TypeError(callback + ' is not a function');
    }

    var t = Object(this), len = t.length >>> 0, k = len - 1, value;
    if (arguments.length > 1) 
      {
        value = initialValue;
      } 
    else 
      {
        while (k >= 0 && !(k in t)) {
          k--;
        }
        if (k < 0) {
          throw new TypeError('Reduce of empty array with no initial value');
        }
        value = t[k--];
      }
      
    for (; k >= 0; k--) {
      if (k in t) {
        value = callback(value, t[k], k, t);
      }
    }
    return value;
  };
}
//some.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some
*/
// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if (!Array.prototype.some) {
  Array.prototype.some = function(callback, thisArg) {

    if (this === void 0 || this === null) {
      throw new TypeError('Array.prototype.some called on null or undefined');
    }

    if (callback.__class__ !== 'Function') {
      throw new TypeError(callback + ' is not a function');
    }

    var t = Object(this);
    var len = t.length >>> 0;

    var T = arguments.length > 1 ? thisArg : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t && callback.call(T, t[i], i, t)) {
        return true;
      }
    }

    return false;
  };
}
//create.js
if (!Object.create) {
  // Production steps of ECMA-262, Edition 5, 15.2.3.5
  // Reference: http://es5.github.io/#x15.2.3.5
  Object.create = (function() {
    // To save on memory, use a shared constructor
    function Temp() {}

    // make a safe reference to Object.prototype.hasOwnProperty
    var hasOwn = Object.prototype.hasOwnProperty;

    return function(O) {
      // 1. If Type(O) is not Object or Null throw a TypeError exception.
      if (Object(O) !== O && O !== null) {
        throw TypeError('Object prototype may only be an Object or null');
      }

      // 2. Let obj be the result of creating a new object as if by the
      //    expression new Object() where Object is the standard built-in
      //    constructor with that name
      // 3. Set the [[Prototype]] internal property of obj to O.
      Temp.prototype = O;
      var obj = new Temp();
      Temp.prototype = null; // Let's not keep a stray reference to O...

      // 4. If the argument Properties is present and not undefined, add
      //    own properties to obj as if by calling the standard built-in
      //    function Object.defineProperties with arguments obj and
      //    Properties.
      if (arguments.length > 1) {
        // Object.defineProperties does ToObject on its first argument.
        var Properties = Object(arguments[1]);
        for (var prop in Properties) {
          if (hasOwn.call(Properties, prop)) {
            var descriptor = Properties[prop];
            if (Object(descriptor) !== descriptor) {
              throw TypeError(prop + 'must be an object');
            }
            if ('get' in descriptor || 'set' in descriptor) {
              throw new TypeError('getters & setters can not be defined on this javascript engine');
            }
            if ('value' in descriptor) {
              obj[prop] = Properties[prop];
            }

          }
        }
      }

      // 5. Return obj
      return obj;
    };
  })();
}
//defineProperties.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties#Polyfill
*/
if (!Object.defineProperties) {

  Object.defineProperties = function(object, props) {

    function hasProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function convertToDescriptor(desc) {

      if (Object(desc) !== desc) {
        throw new TypeError('Descriptor can only be an Object.');
      }


      var d = {};

      if (hasProperty(desc, "enumerable")) {
        d.enumerable = !!desc.enumerable;
      }

      if (hasProperty(desc, "configurable")) {
        d.configurable = !!desc.configurable;
      }

      if (hasProperty(desc, "value")) {
        d.value = desc.value;
      }

      if (hasProperty(desc, "writable")) {
        d.writable = !!desc.writable;
      }

      if (hasProperty(desc, "get")) {
        throw new TypeError('getters & setters can not be defined on this javascript engine');
      }

      if (hasProperty(desc, "set")) {
        throw new TypeError('getters & setters can not be defined on this javascript engine');
      }

      return d;
    }

    if (Object(object) !== object) {
      throw new TypeError('Object.defineProperties can only be called on Objects.');
    }

    if (Object(props) !== props) {
      throw new TypeError('Properties can only be an Object.');
    }

    var properties = Object(props);
    for (propName in properties) {
      if (hasOwnProperty.call(properties, propName)) {
        var descr = convertToDescriptor(properties[propName]);
        object[propName] = descr.value;
      }
    }
    return object;
  }
}
//defineProperty.js
if (!Object.defineProperty) {
  Object.defineProperty = function defineProperty(object, property, descriptor) {
    if (Object(object) !== object) {
      throw new TypeError('Object.defineProperty can only be called on Objects.');
    }
    if (Object(descriptor) !== descriptor) {
      throw new TypeError('Property description can only be an Object.');
    }

    // Safe use of Object.defineProperty: Only allow value properties
    if ('value' in descriptor) {
      object[property] = descriptor.value;  // Define property value
    }

    // Optionally support writable, enumerable, and configurable
    // But you may ignore these in ES3 if they are not critical

    return object;
  };
}


//freeze.js
/*
https://github.com/es-shims/es5-shim/blob/master/es5-sham.js
*/
// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        if (Object(object) !== object) {
            throw new TypeError('Object.freeze can only be called on Objects.');
        }
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}
//getOwnPropertyNames.js
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {

        if (Object(object) !== object) {
            throw new TypeError('Object.getOwnPropertyNames can only be called on Objects.');
        }
        var names = [];
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var propertyIsEnumerable = Object.prototype.propertyIsEnumerable;
        for (var prop in object) {
            if (hasOwnProperty.call(object, prop)) {
                names.push(prop);
            }
        }
        var properties = object.reflect.properties;
        var methods = object.reflect.methods;
        var all = methods.concat(properties);
        for (var i = 0; i < all.length; i++) {
            var prop = all[i].name;
            if (hasOwnProperty.call(object, prop) && !(propertyIsEnumerable.call(object, prop))) {
                names.push(prop);
            }
        }
        return names;
    };
}
//getOwnPropertyDescriptor.js
if (!Object.getOwnPropertyDescriptor) {

    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if (Object(object) !== object) {
            throw new TypeError('Object.getOwnPropertyDescriptor can only be called on Objects.');
        }

        var descriptor;
        if (!Object.prototype.hasOwnProperty.call(object, property)) {
            return descriptor;
        }

        descriptor = {
            enumerable: Object.prototype.propertyIsEnumerable.call(object, property),
            configurable: true
        };

        descriptor.value = object[property];

        var psPropertyType = object.reflect.find(property).type;
        descriptor.writable = !(psPropertyType === "readonly");

        return descriptor;
    }
}
//getPrototypeOf.js
if (!Object.getPrototypeOf) {
	Object.getPrototypeOf = function(object) {
		if (Object(object) !== object) {
			throw new TypeError('Object.getPrototypeOf can only be called on Objects.');
		}
		return object.__proto__;
	}
}
//isExtensible.js
// ES5 15.2.3.13
// http://es5.github.com/#x15.2.3.13
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        if (Object(object) !== object) {
            throw new TypeError('Object.isExtensible can only be called on Objects.');
        }
        return true;
    };
}
//isFrozen.js
/*
https://github.com/es-shims/es5-shim/blob/master/es5-sham.js
*/
// ES5 15.2.3.12
// http://es5.github.com/#x15.2.3.12
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        if (Object(object) !== object) {
            throw new TypeError('Object.isFrozen can only be called on Objects.');
        }
        return false;
    };
}
//isSealed.js
/*
https://github.com/es-shims/es5-shim/blob/master/es5-sham.js
*/
// ES5 15.2.3.11
// http://es5.github.com/#x15.2.3.11
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        if (Object(object) !== object) {
            throw new TypeError('Object.isSealed can only be called on Objects.');
        }
        return false;
    };
}
//keys.js
if (!Object.keys) {
    Object.keys = function(object) {
        if (Object(object) !== object) {
            throw new TypeError('Object.keys can only be called on Objects.');
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var result = [];
        for (var prop in object) {
            if (hasOwnProperty.call(object, prop)) {
                result.push(prop);
            }
        }
        return result;
    };
}
//preventExtensions.js
/*
https://github.com/es-shims/es5-shim/blob/master/es5-sham.js
*/
// ES5 15.2.3.10
// http://es5.github.com/#x15.2.3.10
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {

        if (Object(object) !== object) {
            throw new TypeError('Object.preventExtensions can only be called on Objects.');
        }
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}
//seal.js
/*
https://github.com/es-shims/es5-shim/blob/master/es5-sham.js
*/
// ES5 15.2.3.8
// http://es5.github.com/#x15.2.3.8
if (!Object.seal) {
    Object.seal = function seal(object) {
        if (Object(object) !== object) {
            throw new TypeError('Object.seal can only be called on Objects.');
        }
        // this is misleading and breaks feature-detection, but
        // allows "securable" code to "gracefully" degrade to working
        // but insecure code.
        return object;
    };
}
//bind.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Polyfill

WARNING! Bound functions used as constructors NOT supported by this polyfill!
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Bound_functions_used_as_constructors
*/
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (this.__class__ !== 'Function') {
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype; 
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}
//toISOString.js
/*
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
*/
if (!Date.prototype.toISOString) {
  (function() {

    function pad(number) {
      if (number < 10) {
        return '0' + number;
      }
      return number;
    }

    Date.prototype.toISOString = function() {
      return this.getUTCFullYear() +
        '-' + pad(this.getUTCMonth() + 1) +
        '-' + pad(this.getUTCDate()) +
        'T' + pad(this.getUTCHours()) +
        ':' + pad(this.getUTCMinutes()) +
        ':' + pad(this.getUTCSeconds()) +
        '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
        'Z';
    };

  }());
}
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
(function () {
  var J = Math.abs,
    N = Math.cos,
    P = Math.sin,
    $ = Math.acos,
    L = Math.atan2,
    F = Math.sqrt,
    T = Math.pow;
  function D(c) {
    return c < 0 ? -T(-c, 1 / 3) : T(c, 1 / 3);
  }
  var Q = Math.PI,
    W = 2 * Q,
    U = Q / 2,
    B = 1e-6,
    Y = Number.MAX_SAFE_INTEGER || 9007199254740991,
    Z = Number.MIN_SAFE_INTEGER || -9007199254740991,
    tt = {
      x: 0,
      y: 0,
      z: 0
    },
    h = {
      Tvalues: [-.06405689286260563, .06405689286260563, -.1911188674736163, .1911188674736163, -.3150426796961634, .3150426796961634, -.4337935076260451, .4337935076260451, -.5454214713888396, .5454214713888396, -.6480936519369755, .6480936519369755, -.7401241915785544, .7401241915785544, -.820001985973903, .820001985973903, -.8864155270044011, .8864155270044011, -.9382745520027328, .9382745520027328, -.9747285559713095, .9747285559713095, -.9951872199970213, .9951872199970213],
      Cvalues: [.12793819534675216, .12793819534675216, .1258374563468283, .1258374563468283, .12167047292780339, .12167047292780339, .1155056680537256, .1155056680537256, .10744427011596563, .10744427011596563, .09761865210411388, .09761865210411388, .08619016153195327, .08619016153195327, .0733464814110803, .0733464814110803, .05929858491543678, .05929858491543678, .04427743881741981, .04427743881741981, .028531388628933663, .028531388628933663, .0123412297999872, .0123412297999872],
      arcfn: function arcfn(c, n) {
        var e = n(c),
          i = e.x * e.x + e.y * e.y;
        return typeof e.z != "undefined" && (i += e.z * e.z), F(i);
      },
      compute: function compute(c, n, e) {
        if (c === 0) return n[0].t = 0, n[0];
        var i = n.length - 1;
        if (c === 1) return n[i].t = 1, n[i];
        var s = 1 - c,
          o = n;
        if (i === 0) return n[0].t = c, n[0];
        if (i === 1) {
          var u = {
            x: s * o[0].x + c * o[1].x,
            y: s * o[0].y + c * o[1].y,
            t: c
          };
          return e && (u.z = s * o[0].z + c * o[1].z), u;
        }
        if (i < 4) {
          var _u = s * s,
            f = c * c,
            l,
            y,
            a,
            x = 0;
          i === 2 ? (o = [o[0], o[1], o[2], tt], l = _u, y = s * c * 2, a = f) : i === 3 && (l = _u * s, y = _u * c * 3, a = s * f * 3, x = c * f);
          var p = {
            x: l * o[0].x + y * o[1].x + a * o[2].x + x * o[3].x,
            y: l * o[0].y + y * o[1].y + a * o[2].y + x * o[3].y,
            t: c
          };
          return e && (p.z = l * o[0].z + y * o[1].z + a * o[2].z + x * o[3].z), p;
        }
        var r = JSON.parse(JSON.stringify(n));
        for (; r.length > 1;) {
          for (var _u2 = 0; _u2 < r.length - 1; _u2++) r[_u2] = {
            x: r[_u2].x + (r[_u2 + 1].x - r[_u2].x) * c,
            y: r[_u2].y + (r[_u2 + 1].y - r[_u2].y) * c
          }, typeof r[_u2].z != "undefined" && (r[_u2].z = r[_u2].z + (r[_u2 + 1].z - r[_u2].z) * c);
          r.splice(r.length - 1, 1);
        }
        return r[0].t = c, r[0];
      },
      computeWithRatios: function computeWithRatios(c, n, e, i) {
        var s = 1 - c,
          o = e,
          r = n,
          u = o[0],
          f = o[1],
          l = o[2],
          y = o[3],
          a;
        if (u *= s, f *= c, r.length === 2) return a = u + f, {
          x: (u * r[0].x + f * r[1].x) / a,
          y: (u * r[0].y + f * r[1].y) / a,
          z: i ? (u * r[0].z + f * r[1].z) / a : !1,
          t: c
        };
        if (u *= s, f *= 2 * s, l *= c * c, r.length === 3) return a = u + f + l, {
          x: (u * r[0].x + f * r[1].x + l * r[2].x) / a,
          y: (u * r[0].y + f * r[1].y + l * r[2].y) / a,
          z: i ? (u * r[0].z + f * r[1].z + l * r[2].z) / a : !1,
          t: c
        };
        if (u *= s, f *= 1.5 * s, l *= 3 * s, y *= c * c * c, r.length === 4) return a = u + f + l + y, {
          x: (u * r[0].x + f * r[1].x + l * r[2].x + y * r[3].x) / a,
          y: (u * r[0].y + f * r[1].y + l * r[2].y + y * r[3].y) / a,
          z: i ? (u * r[0].z + f * r[1].z + l * r[2].z + y * r[3].z) / a : !1,
          t: c
        };
      },
      derive: function derive(c, n) {
        var e = [];
        for (var i = c, s = i.length, o = s - 1; s > 1; s--, o--) {
          var r = [];
          for (var u = 0, f; u < o; u++) f = {
            x: o * (i[u + 1].x - i[u].x),
            y: o * (i[u + 1].y - i[u].y)
          }, n && (f.z = o * (i[u + 1].z - i[u].z)), r.push(f);
          e.push(r), i = r;
        }
        return e;
      },
      between: function between(c, n, e) {
        return n <= c && c <= e || h.approximately(c, n) || h.approximately(c, e);
      },
      approximately: function approximately(c, n, e) {
        return J(c - n) <= (e || B);
      },
      length: function length(c) {
        var n = .5,
          e = h.Tvalues.length,
          i = 0;
        for (var s = 0, o; s < e; s++) o = n * h.Tvalues[s] + n, i += h.Cvalues[s] * h.arcfn(o, c);
        return n * i;
      },
      map: function map(c, n, e, i, s) {
        var o = e - n,
          r = s - i,
          u = c - n,
          f = u / o;
        return i + r * f;
      },
      lerp: function lerp(c, n, e) {
        var i = {
          x: n.x + c * (e.x - n.x),
          y: n.y + c * (e.y - n.y)
        };
        return n.z !== void 0 && e.z !== void 0 && (i.z = n.z + c * (e.z - n.z)), i;
      },
      pointToString: function pointToString(c) {
        var n = c.x + "/" + c.y;
        return typeof c.z != "undefined" && (n += "/" + c.z), n;
      },
      pointsToString: function pointsToString(c) {
        return "[" + c.map(h.pointToString).join(", ") + "]";
      },
      copy: function copy(c) {
        return JSON.parse(JSON.stringify(c));
      },
      angle: function angle(c, n, e) {
        var i = n.x - c.x,
          s = n.y - c.y,
          o = e.x - c.x,
          r = e.y - c.y,
          u = i * r - s * o,
          f = i * o + s * r;
        return L(u, f);
      },
      round: function round(c, n) {
        var e = "" + c,
          i = e.indexOf(".");
        return parseFloat(e.substring(0, i + 1 + n));
      },
      dist: function dist(c, n) {
        var e = c.x - n.x,
          i = c.y - n.y;
        return F(e * e + i * i);
      },
      closest: function closest(c, n) {
        var e = T(2, 63),
          i,
          s;
        return c.forEach(function (o, r) {
          s = h.dist(n, o), s < e && (e = s, i = r);
        }), {
          mdist: e,
          mpos: i
        };
      },
      abcratio: function abcratio(c, n) {
        if (n !== 2 && n !== 3) return !1;
        if (typeof c == "undefined") c = .5;else if (c === 0 || c === 1) return c;
        var e = T(c, n) + T(1 - c, n),
          i = e - 1;
        return J(i / e);
      },
      projectionratio: function projectionratio(c, n) {
        if (n !== 2 && n !== 3) return !1;
        if (typeof c == "undefined") c = .5;else if (c === 0 || c === 1) return c;
        var e = T(1 - c, n),
          i = T(c, n) + e;
        return e / i;
      },
      lli8: function lli8(c, n, e, i, s, o, r, u) {
        var f = (c * i - n * e) * (s - r) - (c - e) * (s * u - o * r),
          l = (c * i - n * e) * (o - u) - (n - i) * (s * u - o * r),
          y = (c - e) * (o - u) - (n - i) * (s - r);
        return y == 0 ? !1 : {
          x: f / y,
          y: l / y
        };
      },
      lli4: function lli4(c, n, e, i) {
        var s = c.x,
          o = c.y,
          r = n.x,
          u = n.y,
          f = e.x,
          l = e.y,
          y = i.x,
          a = i.y;
        return h.lli8(s, o, r, u, f, l, y, a);
      },
      lli: function lli(c, n) {
        return h.lli4(c, c.c, n, n.c);
      },
      makeline: function makeline(c, n) {
        return new _v(c.x, c.y, (c.x + n.x) / 2, (c.y + n.y) / 2, n.x, n.y);
      },
      findbbox: function findbbox(c) {
        var n = Y,
          e = Y,
          i = Z,
          s = Z;
        return c.forEach(function (o) {
          var r = o.bbox();
          n > r.x.min && (n = r.x.min), e > r.y.min && (e = r.y.min), i < r.x.max && (i = r.x.max), s < r.y.max && (s = r.y.max);
        }), {
          x: {
            min: n,
            mid: (n + i) / 2,
            max: i,
            size: i - n
          },
          y: {
            min: e,
            mid: (e + s) / 2,
            max: s,
            size: s - e
          }
        };
      },
      shapeintersections: function shapeintersections(c, n, e, i, s) {
        if (!h.bboxoverlap(n, i)) return [];
        var o = [],
          r = [c.startcap, c.forward, c.back, c.endcap],
          u = [e.startcap, e.forward, e.back, e.endcap];
        return r.forEach(function (f) {
          f.virtual || u.forEach(function (l) {
            if (l.virtual) return;
            var y = f.intersects(l, s);
            y.length > 0 && (y.c1 = f, y.c2 = l, y.s1 = c, y.s2 = e, o.push(y));
          });
        }), o;
      },
      makeshape: function makeshape(c, n, e) {
        var i = n.points.length,
          s = c.points.length,
          o = h.makeline(n.points[i - 1], c.points[0]),
          r = h.makeline(c.points[s - 1], n.points[0]),
          u = {
            startcap: o,
            forward: c,
            back: n,
            endcap: r,
            bbox: h.findbbox([o, c, n, r])
          };
        return u.intersections = function (f) {
          return h.shapeintersections(u, u.bbox, f, f.bbox, e);
        }, u;
      },
      getminmax: function getminmax(c, n, e) {
        if (!e) return {
          min: 0,
          max: 0
        };
        var i = Y,
          s = Z,
          o,
          r;
        e.indexOf(0) === -1 && (e = [0].concat(e)), e.indexOf(1) === -1 && e.push(1);
        for (var u = 0, f = e.length; u < f; u++) o = e[u], r = c.get(o), r[n] < i && (i = r[n]), r[n] > s && (s = r[n]);
        return {
          min: i,
          mid: (i + s) / 2,
          max: s,
          size: s - i
        };
      },
      align: function align(c, n) {
        var e = n.p1.x,
          i = n.p1.y,
          s = -L(n.p2.y - i, n.p2.x - e),
          o = function o(r) {
            return {
              x: (r.x - e) * N(s) - (r.y - i) * P(s),
              y: (r.x - e) * P(s) + (r.y - i) * N(s)
            };
          };
        return c.map(o);
      },
      roots: function roots(c, n) {
        n = n || {
          p1: {
            x: 0,
            y: 0
          },
          p2: {
            x: 1,
            y: 0
          }
        };
        var e = c.length - 1,
          i = h.align(c, n),
          s = function s(d) {
            return 0 <= d && d <= 1;
          };
        if (e === 2) {
          var d = i[0].y,
            z = i[1].y,
            A = i[2].y,
            k = d - 2 * z + A;
          if (k !== 0) {
            var j = -F(z * z - d * A),
              C = -d + z,
              R = -(j + C) / k,
              I = -(-j + C) / k;
            return [R, I].filter(s);
          } else if (z !== A && k === 0) return [(2 * z - A) / (2 * z - 2 * A)].filter(s);
          return [];
        }
        var o = i[0].y,
          r = i[1].y,
          u = i[2].y,
          f = i[3].y,
          l = -o + 3 * r - 3 * u + f,
          y = 3 * o - 6 * r + 3 * u,
          a = -3 * o + 3 * r,
          x = o;
        if (h.approximately(l, 0)) {
          if (h.approximately(y, 0)) return h.approximately(a, 0) ? [] : [-x / a].filter(s);
          var _d = F(a * a - 4 * y * x),
            _z = 2 * y;
          return [(_d - a) / _z, (-a - _d) / _z].filter(s);
        }
        y /= l, a /= l, x /= l;
        var p = (3 * a - y * y) / 3,
          g = p / 3,
          _ = (2 * y * y * y - 9 * y * a + 27 * x) / 27,
          q = _ / 2,
          O = q * q + g * g * g,
          M,
          w,
          S,
          m,
          E;
        if (O < 0) {
          var _d2 = -p / 3,
            _z2 = _d2 * _d2 * _d2,
            _A = F(_z2),
            _k = -_ / (2 * _A),
            _j = _k < -1 ? -1 : _k > 1 ? 1 : _k,
            _C = $(_j),
            _R = D(_A),
            _I = 2 * _R;
          return S = _I * N(_C / 3) - y / 3, m = _I * N((_C + W) / 3) - y / 3, E = _I * N((_C + 2 * W) / 3) - y / 3, [S, m, E].filter(s);
        } else {
          if (O === 0) return M = q < 0 ? D(-q) : -D(q), S = 2 * M - y / 3, m = -M - y / 3, [S, m].filter(s);
          {
            var _d3 = F(O);
            return M = D(-q + _d3), w = D(q + _d3), [M - w - y / 3].filter(s);
          }
        }
      },
      droots: function droots(c) {
        if (c.length === 3) {
          var n = c[0],
            e = c[1],
            i = c[2],
            s = n - 2 * e + i;
          if (s !== 0) {
            var o = -F(e * e - n * i),
              r = -n + e,
              u = -(o + r) / s,
              f = -(-o + r) / s;
            return [u, f];
          } else if (e !== i && s === 0) return [(2 * e - i) / (2 * (e - i))];
          return [];
        }
        if (c.length === 2) {
          var _n = c[0],
            _e = c[1];
          return _n !== _e ? [_n / (_n - _e)] : [];
        }
        return [];
      },
      curvature: function curvature(c, n, e, i, s) {
        var o,
          r,
          u,
          f,
          l = 0,
          y = 0,
          a = h.compute(c, n),
          x = h.compute(c, e),
          p = a.x * a.x + a.y * a.y;
        if (i ? (o = F(T(a.y * x.z - x.y * a.z, 2) + T(a.z * x.x - x.z * a.x, 2) + T(a.x * x.y - x.x * a.y, 2)), r = T(p + a.z * a.z, 3 / 2)) : (o = a.x * x.y - a.y * x.x, r = T(p, 3 / 2)), o === 0 || r === 0) return {
          k: 0,
          r: 0
        };
        if (l = o / r, y = r / o, !s) {
          var g = h.curvature(c - .001, n, e, i, !0).k,
            _ = h.curvature(c + .001, n, e, i, !0).k;
          f = (_ - l + (l - g)) / 2, u = (J(_ - l) + J(l - g)) / 2;
        }
        return {
          k: l,
          r: y,
          dk: f,
          adk: u
        };
      },
      inflections: function inflections(c) {
        if (c.length < 4) return [];
        var n = h.align(c, {
            p1: c[0],
            p2: c.slice(-1)[0]
          }),
          e = n[2].x * n[1].y,
          i = n[3].x * n[1].y,
          s = n[1].x * n[2].y,
          o = n[3].x * n[2].y,
          r = 18 * (-3 * e + 2 * i + 3 * s - o),
          u = 18 * (3 * e - i - 3 * s),
          f = 18 * (s - e);
        if (h.approximately(r, 0)) {
          if (!h.approximately(u, 0)) {
            var x = -f / u;
            if (0 <= x && x <= 1) return [x];
          }
          return [];
        }
        var l = 2 * r;
        if (h.approximately(l, 0)) return [];
        var y = u * u - 4 * r * f;
        if (y < 0) return [];
        var a = Math.sqrt(y);
        return [(a - u) / l, -(u + a) / l].filter(function (x) {
          return 0 <= x && x <= 1;
        });
      },
      bboxoverlap: function bboxoverlap(c, n) {
        var e = ["x", "y"],
          i = e.length;
        for (var s = 0, o, r, u, f; s < i; s++) if (o = e[s], r = c[o].mid, u = n[o].mid, f = (c[o].size + n[o].size) / 2, J(r - u) >= f) return !1;
        return !0;
      },
      expandbox: function expandbox(c, n) {
        n.x.min < c.x.min && (c.x.min = n.x.min), n.y.min < c.y.min && (c.y.min = n.y.min), n.z && n.z.min < c.z.min && (c.z.min = n.z.min), n.x.max > c.x.max && (c.x.max = n.x.max), n.y.max > c.y.max && (c.y.max = n.y.max), n.z && n.z.max > c.z.max && (c.z.max = n.z.max), c.x.mid = (c.x.min + c.x.max) / 2, c.y.mid = (c.y.min + c.y.max) / 2, c.z && (c.z.mid = (c.z.min + c.z.max) / 2), c.x.size = c.x.max - c.x.min, c.y.size = c.y.max - c.y.min, c.z && (c.z.size = c.z.max - c.z.min);
      },
      pairiteration: function pairiteration(c, n, e) {
        var i = c.bbox(),
          s = n.bbox(),
          o = 1e5,
          r = e || .5;
        if (i.x.size + i.y.size < r && s.x.size + s.y.size < r) return [(o * (c._t1 + c._t2) / 2 | 0) / o + "/" + (o * (n._t1 + n._t2) / 2 | 0) / o];
        var u = c.split(.5),
          f = n.split(.5),
          l = [{
            left: u.left,
            right: f.left
          }, {
            left: u.left,
            right: f.right
          }, {
            left: u.right,
            right: f.right
          }, {
            left: u.right,
            right: f.left
          }];
        l = l.filter(function (a) {
          return h.bboxoverlap(a.left.bbox(), a.right.bbox());
        });
        var y = [];
        return l.length === 0 || (l.forEach(function (a) {
          y = y.concat(h.pairiteration(a.left, a.right, r));
        }), y = y.filter(function (a, x) {
          return y.indexOf(a) === x;
        })), y;
      },
      getccenter: function getccenter(c, n, e) {
        var i = n.x - c.x,
          s = n.y - c.y,
          o = e.x - n.x,
          r = e.y - n.y,
          u = i * N(U) - s * P(U),
          f = i * P(U) + s * N(U),
          l = o * N(U) - r * P(U),
          y = o * P(U) + r * N(U),
          a = (c.x + n.x) / 2,
          x = (c.y + n.y) / 2,
          p = (n.x + e.x) / 2,
          g = (n.y + e.y) / 2,
          _ = a + u,
          q = x + f,
          O = p + l,
          M = g + y,
          w = h.lli8(a, x, _, q, p, g, O, M),
          S = h.dist(w, c),
          m = L(c.y - w.y, c.x - w.x),
          E = L(n.y - w.y, n.x - w.x),
          d = L(e.y - w.y, e.x - w.x),
          z;
        return m < d ? ((m > E || E > d) && (m += W), m > d && (z = d, d = m, m = z)) : d < E && E < m ? (z = d, d = m, m = z) : d += W, w.s = m, w.e = d, w.r = S, w;
      },
      numberSort: function numberSort(c, n) {
        return c - n;
      }
    };
  var _b = /*#__PURE__*/function () {
    function b(n) {
      _classCallCheck(this, b);
      this.curves = [], this._3d = !1, n && (this.curves = n, this._3d = this.curves[0]._3d);
    }
    return _createClass(b, [{
      key: "valueOf",
      value: function valueOf() {
        return this.toString();
      }
    }, {
      key: "toString",
      value: function toString() {
        return "[" + this.curves.map(function (n) {
          return h.pointsToString(n.points);
        }).join(", ") + "]";
      }
    }, {
      key: "addCurve",
      value: function addCurve(n) {
        this.curves.push(n), this._3d = this._3d || n._3d;
      }
    }, {
      key: "length",
      value: function length() {
        return this.curves.map(function (n) {
          return n.length();
        }).reduce(function (n, e) {
          return n + e;
        });
      }
    }, {
      key: "curve",
      value: function curve(n) {
        return this.curves[n];
      }
    }, {
      key: "bbox",
      value: function bbox() {
        var n = this.curves;
        for (var e = n[0].bbox(), i = 1; i < n.length; i++) h.expandbox(e, n[i].bbox());
        return e;
      }
    }, {
      key: "offset",
      value: function offset(n) {
        var e = [];
        return this.curves.forEach(function (i) {
          e.push.apply(e, _toConsumableArray(i.offset(n)));
        }), new _b(e);
      }
    }]);
  }();
  var G = Math.abs,
    V = Math.min,
    H = Math.max,
    nt = Math.cos,
    et = Math.sin,
    it = Math.acos,
    X = Math.sqrt,
    rt = Math.PI;
  var _v = /*#__PURE__*/function () {
    function v(n) {
      _classCallCheck(this, v);
      var e = n && n.forEach ? n : Array.from(arguments).slice(),
        i = !1;
      if (_typeof(e[0]) == "object") {
        i = e.length;
        var p = [];
        e.forEach(function (g) {
          ["x", "y", "z"].forEach(function (_) {
            typeof g[_] != "undefined" && p.push(g[_]);
          });
        }), e = p;
      }
      var s = !1,
        o = e.length;
      if (i) {
        if (i > 4) {
          if (arguments.length !== 1) throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
          s = !0;
        }
      } else if (o !== 6 && o !== 8 && o !== 9 && o !== 12 && arguments.length !== 1) throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
      var r = this._3d = !s && (o === 9 || o === 12) || n && n[0] && typeof n[0].z != "undefined",
        u = this.points = [];
      for (var _p = 0, g = r ? 3 : 2; _p < o; _p += g) {
        var f = {
          x: e[_p],
          y: e[_p + 1]
        };
        r && (f.z = e[_p + 2]), u.push(f);
      }
      var l = this.order = u.length - 1,
        y = this.dims = ["x", "y"];
      r && y.push("z"), this.dimlen = y.length;
      var a = h.align(u, {
          p1: u[0],
          p2: u[l]
        }),
        x = h.dist(u[0], u[l]);
      this._linear = a.reduce(function (p, g) {
        return p + G(g.y);
      }, 0) < x / 50, this._lut = [], this._t1 = 0, this._t2 = 1, this.update();
    }
    return _createClass(v, [{
      key: "getUtils",
      value: function getUtils() {
        return _v.getUtils();
      }
    }, {
      key: "valueOf",
      value: function valueOf() {
        return this.toString();
      }
    }, {
      key: "toString",
      value: function toString() {
        return h.pointsToString(this.points);
      }
    }, {
      key: "toSVG",
      value: function toSVG() {
        if (this._3d) return !1;
        var n = this.points,
          e = n[0].x,
          i = n[0].y,
          s = ["M", e, i, this.order === 2 ? "Q" : "C"];
        for (var o = 1, r = n.length; o < r; o++) s.push(n[o].x), s.push(n[o].y);
        return s.join(" ");
      }
    }, {
      key: "setRatios",
      value: function setRatios(n) {
        if (n.length !== this.points.length) throw new Error("incorrect number of ratio values");
        this.ratios = n, this._lut = [];
      }
    }, {
      key: "verify",
      value: function verify() {
        var n = this.coordDigest();
        n !== this._print && (this._print = n, this.update());
      }
    }, {
      key: "coordDigest",
      value: function coordDigest() {
        return this.points.map(function (n, e) {
          return "" + e + n.x + n.y + (n.z ? n.z : 0);
        }).join("");
      }
    }, {
      key: "update",
      value: function update() {
        this._lut = [], this.dpoints = h.derive(this.points, this._3d), this.computedirection();
      }
    }, {
      key: "computedirection",
      value: function computedirection() {
        var n = this.points,
          e = h.angle(n[0], n[this.order], n[1]);
        this.clockwise = e > 0;
      }
    }, {
      key: "length",
      value: function length() {
        return h.length(this.derivative.bind(this));
      }
    }, {
      key: "getABC",
      value: function getABC(n, e) {
        e = e || this.get(n);
        var i = this.points[0],
          s = this.points[this.order];
        return _v.getABC(this.order, i, e, s, n);
      }
    }, {
      key: "getLUT",
      value: function getLUT(n) {
        if (this.verify(), n = n || 100, this._lut.length === n + 1) return this._lut;
        this._lut = [], n++, this._lut = [];
        for (var e = 0, i, s; e < n; e++) s = e / (n - 1), i = this.compute(s), i.t = s, this._lut.push(i);
        return this._lut;
      }
    }, {
      key: "on",
      value: function on(n, e) {
        e = e || 5;
        var i = this.getLUT(),
          s = [];
        for (var o = 0, r, u = 0; o < i.length; o++) r = i[o], h.dist(r, n) < e && (s.push(r), u += o / i.length);
        return s.length ? t /= s.length : !1;
      }
    }, {
      key: "project",
      value: function project(n) {
        var e = this.getLUT(),
          i = e.length - 1,
          s = h.closest(e, n),
          o = s.mpos,
          r = (o - 1) / i,
          u = (o + 1) / i,
          f = .1 / i,
          l = s.mdist,
          y = r,
          a = y,
          x;
        l += 1;
        for (var p; y < u + f; y += f) x = this.compute(y), p = h.dist(n, x), p < l && (l = p, a = y);
        return a = a < 0 ? 0 : a > 1 ? 1 : a, x = this.compute(a), x.t = a, x.d = l, x;
      }
    }, {
      key: "get",
      value: function get(n) {
        return this.compute(n);
      }
    }, {
      key: "point",
      value: function point(n) {
        return this.points[n];
      }
    }, {
      key: "compute",
      value: function compute(n) {
        return this.ratios ? h.computeWithRatios(n, this.points, this.ratios, this._3d) : h.compute(n, this.points, this._3d, this.ratios);
      }
    }, {
      key: "raise",
      value: function raise() {
        var n = this.points,
          e = [n[0]],
          i = n.length;
        for (var s = 1, o, r; s < i; s++) o = n[s], r = n[s - 1], e[s] = {
          x: (i - s) / i * o.x + s / i * r.x,
          y: (i - s) / i * o.y + s / i * r.y
        };
        return e[i] = n[i - 1], new _v(e);
      }
    }, {
      key: "derivative",
      value: function derivative(n) {
        return h.compute(n, this.dpoints[0], this._3d);
      }
    }, {
      key: "dderivative",
      value: function dderivative(n) {
        return h.compute(n, this.dpoints[1], this._3d);
      }
    }, {
      key: "align",
      value: function align() {
        var n = this.points;
        return new _v(h.align(n, {
          p1: n[0],
          p2: n[n.length - 1]
        }));
      }
    }, {
      key: "curvature",
      value: function curvature(n) {
        return h.curvature(n, this.dpoints[0], this.dpoints[1], this._3d);
      }
    }, {
      key: "inflections",
      value: function inflections() {
        return h.inflections(this.points);
      }
    }, {
      key: "normal",
      value: function normal(n) {
        return this._3d ? this.__normal3(n) : this.__normal2(n);
      }
    }, {
      key: "__normal2",
      value: function __normal2(n) {
        var e = this.derivative(n),
          i = X(e.x * e.x + e.y * e.y);
        return {
          t: n,
          x: -e.y / i,
          y: e.x / i
        };
      }
    }, {
      key: "__normal3",
      value: function __normal3(n) {
        var e = this.derivative(n),
          i = this.derivative(n + .01),
          s = X(e.x * e.x + e.y * e.y + e.z * e.z),
          o = X(i.x * i.x + i.y * i.y + i.z * i.z);
        e.x /= s, e.y /= s, e.z /= s, i.x /= o, i.y /= o, i.z /= o;
        var r = {
            x: i.y * e.z - i.z * e.y,
            y: i.z * e.x - i.x * e.z,
            z: i.x * e.y - i.y * e.x
          },
          u = X(r.x * r.x + r.y * r.y + r.z * r.z);
        r.x /= u, r.y /= u, r.z /= u;
        var f = [r.x * r.x, r.x * r.y - r.z, r.x * r.z + r.y, r.x * r.y + r.z, r.y * r.y, r.y * r.z - r.x, r.x * r.z - r.y, r.y * r.z + r.x, r.z * r.z];
        return {
          t: n,
          x: f[0] * e.x + f[1] * e.y + f[2] * e.z,
          y: f[3] * e.x + f[4] * e.y + f[5] * e.z,
          z: f[6] * e.x + f[7] * e.y + f[8] * e.z
        };
      }
    }, {
      key: "hull",
      value: function hull(n) {
        var e = this.points,
          i = [],
          s = [],
          o = 0;
        for (s[o++] = e[0], s[o++] = e[1], s[o++] = e[2], this.order === 3 && (s[o++] = e[3]); e.length > 1;) {
          i = [];
          for (var r = 0, u, f = e.length - 1; r < f; r++) u = h.lerp(n, e[r], e[r + 1]), s[o++] = u, i.push(u);
          e = i;
        }
        return s;
      }
    }, {
      key: "split",
      value: function split(n, e) {
        if (n === 0 && !!e) return this.split(e).left;
        if (e === 1) return this.split(n).right;
        var i = this.hull(n),
          s = {
            left: this.order === 2 ? new _v([i[0], i[3], i[5]]) : new _v([i[0], i[4], i[7], i[9]]),
            right: this.order === 2 ? new _v([i[5], i[4], i[2]]) : new _v([i[9], i[8], i[6], i[3]]),
            span: i
          };
        return s.left._t1 = h.map(0, 0, 1, this._t1, this._t2), s.left._t2 = h.map(n, 0, 1, this._t1, this._t2), s.right._t1 = h.map(n, 0, 1, this._t1, this._t2), s.right._t2 = h.map(1, 0, 1, this._t1, this._t2), e ? (e = h.map(e, n, 1, 0, 1), s.right.split(e).left) : s;
      }
    }, {
      key: "extrema",
      value: function extrema() {
        var n = {},
          e = [];
        return this.dims.forEach(function (i) {
          var s = function s(r) {
              return r[i];
            },
            o = this.dpoints[0].map(s);
          n[i] = h.droots(o), this.order === 3 && (o = this.dpoints[1].map(s), n[i] = n[i].concat(h.droots(o))), n[i] = n[i].filter(function (r) {
            return r >= 0 && r <= 1;
          }), e = e.concat(n[i].sort(h.numberSort));
        }.bind(this)), n.values = e.sort(h.numberSort).filter(function (i, s) {
          return e.indexOf(i) === s;
        }), n;
      }
    }, {
      key: "bbox",
      value: function bbox() {
        var n = this.extrema(),
          e = {};
        return this.dims.forEach(function (i) {
          e[i] = h.getminmax(this, i, n[i]);
        }.bind(this)), e;
      }
    }, {
      key: "overlaps",
      value: function overlaps(n) {
        var e = this.bbox(),
          i = n.bbox();
        return h.bboxoverlap(e, i);
      }
    }, {
      key: "offset",
      value: function offset(n, e) {
        if (typeof e != "undefined") {
          var i = this.get(n),
            s = this.normal(n),
            o = {
              c: i,
              n: s,
              x: i.x + s.x * e,
              y: i.y + s.y * e
            };
          return this._3d && (o.z = i.z + s.z * e), o;
        }
        if (this._linear) {
          var _i = this.normal(0),
            _s = this.points.map(function (o) {
              var r = {
                x: o.x + n * _i.x,
                y: o.y + n * _i.y
              };
              return o.z && _i.z && (r.z = o.z + n * _i.z), r;
            });
          return [new _v(_s)];
        }
        return this.reduce().map(function (i) {
          return i._linear ? i.offset(n)[0] : i.scale(n);
        });
      }
    }, {
      key: "simple",
      value: function simple() {
        if (this.order === 3) {
          var s = h.angle(this.points[0], this.points[3], this.points[1]),
            o = h.angle(this.points[0], this.points[3], this.points[2]);
          if (s > 0 && o < 0 || s < 0 && o > 0) return !1;
        }
        var n = this.normal(0),
          e = this.normal(1),
          i = n.x * e.x + n.y * e.y;
        return this._3d && (i += n.z * e.z), G(it(i)) < rt / 3;
      }
    }, {
      key: "reduce",
      value: function reduce() {
        var n,
          e = 0,
          i = 0,
          s = .01,
          o,
          r = [],
          u = [],
          f = this.extrema().values;
        for (f.indexOf(0) === -1 && (f = [0].concat(f)), f.indexOf(1) === -1 && f.push(1), e = f[0], n = 1; n < f.length; n++) i = f[n], o = this.split(e, i), o._t1 = e, o._t2 = i, r.push(o), e = i;
        return r.forEach(function (l) {
          for (e = 0, i = 0; i <= 1;) for (i = e + s; i <= 1 + s; i += s) if (o = l.split(e, i), !o.simple()) {
            if (i -= s, G(e - i) < s) return [];
            o = l.split(e, i), o._t1 = h.map(e, 0, 1, l._t1, l._t2), o._t2 = h.map(i, 0, 1, l._t1, l._t2), u.push(o), e = i;
            break;
          }
          e < 1 && (o = l.split(e, 1), o._t1 = h.map(e, 0, 1, l._t1, l._t2), o._t2 = l._t2, u.push(o));
        }), u;
      }
    }, {
      key: "translate",
      value: function translate(n, e, i) {
        i = typeof i == "number" ? i : e;
        var s = this.order,
          o = this.points.map(function (r, u) {
            return (1 - u / s) * e + u / s * i;
          });
        return new _v(this.points.map(function (r, u) {
          return {
            x: r.x + n.x * o[u],
            y: r.y + n.y * o[u]
          };
        }));
      }
    }, {
      key: "scale",
      value: function scale(n) {
        var _this = this;
        var e = this.order,
          i = !1;
        if (typeof n == "function" && (i = n), i && e === 2) return this.raise().scale(i);
        var s = this.clockwise,
          o = this.points;
        if (this._linear) return this.translate(this.normal(0), i ? i(0) : n, i ? i(1) : n);
        var r = i ? i(0) : n,
          u = i ? i(1) : n,
          f = [this.offset(0, 10), this.offset(1, 10)],
          l = [],
          y = h.lli4(f[0], f[0].c, f[1], f[1].c);
        if (!y) throw new Error("cannot scale this curve. Try reducing it first.");
        return [0, 1].forEach(function (a) {
          var x = l[a * e] = h.copy(o[a * e]);
          x.x += (a ? u : r) * f[a].n.x, x.y += (a ? u : r) * f[a].n.y;
        }), i ? ([0, 1].forEach(function (a) {
          if (!(e === 2 && !!a)) {
            var x = o[a + 1],
              p = {
                x: x.x - y.x,
                y: x.y - y.y
              },
              g = i ? i((a + 1) / e) : n;
            i && !s && (g = -g);
            var _ = X(p.x * p.x + p.y * p.y);
            p.x /= _, p.y /= _, l[a + 1] = {
              x: x.x + g * p.x,
              y: x.y + g * p.y
            };
          }
        }), new _v(l)) : ([0, 1].forEach(function (a) {
          if (e === 2 && !!a) return;
          var x = l[a * e],
            p = _this.derivative(a),
            g = {
              x: x.x + p.x,
              y: x.y + p.y
            };
          l[a + 1] = h.lli4(x, g, y, o[a + 1]);
        }), new _v(l));
      }
    }, {
      key: "outline",
      value: function outline(n, e, i, s) {
        if (e = e === void 0 ? n : e, this._linear) {
          var m = this.normal(0),
            E = this.points[0],
            d = this.points[this.points.length - 1],
            z,
            A,
            k;
          i === void 0 && (i = n, s = e), z = {
            x: E.x + m.x * n,
            y: E.y + m.y * n
          }, k = {
            x: d.x + m.x * i,
            y: d.y + m.y * i
          }, A = {
            x: (z.x + k.x) / 2,
            y: (z.y + k.y) / 2
          };
          var j = [z, A, k];
          z = {
            x: E.x - m.x * e,
            y: E.y - m.y * e
          }, k = {
            x: d.x - m.x * s,
            y: d.y - m.y * s
          }, A = {
            x: (z.x + k.x) / 2,
            y: (z.y + k.y) / 2
          };
          var C = [k, A, z],
            R = h.makeline(C[2], j[0]),
            I = h.makeline(j[2], C[0]),
            K = [R, new _v(j), I, new _v(C)];
          return new _b(K);
        }
        var o = this.reduce(),
          r = o.length,
          u = [],
          f = [],
          l,
          y = 0,
          a = this.length(),
          x = typeof i != "undefined" && typeof s != "undefined";
        function p(m, E, d, z, A) {
          return function (k) {
            var j = z / d,
              C = (z + A) / d,
              R = E - m;
            return h.map(k, 0, 1, m + j * R, m + C * R);
          };
        }
        o.forEach(function (m) {
          var E = m.length();
          x ? (u.push(m.scale(p(n, i, a, y, E))), f.push(m.scale(p(-e, -s, a, y, E)))) : (u.push(m.scale(n)), f.push(m.scale(-e))), y += E;
        }), f = f.map(function (m) {
          return l = m.points, l[3] ? m.points = [l[3], l[2], l[1], l[0]] : m.points = [l[2], l[1], l[0]], m;
        }).reverse();
        var g = u[0].points[0],
          _ = u[r - 1].points[u[r - 1].points.length - 1],
          q = f[r - 1].points[f[r - 1].points.length - 1],
          O = f[0].points[0],
          M = h.makeline(q, g),
          w = h.makeline(_, O),
          S = [M].concat(u).concat([w]).concat(f);
        return new _b(S);
      }
    }, {
      key: "outlineshapes",
      value: function outlineshapes(n, e, i) {
        e = e || n;
        var s = this.outline(n, e).curves,
          o = [];
        for (var r = 1, u = s.length; r < u / 2; r++) {
          var f = h.makeshape(s[r], s[u - r], i);
          f.startcap.virtual = r > 1, f.endcap.virtual = r < u / 2 - 1, o.push(f);
        }
        return o;
      }
    }, {
      key: "intersects",
      value: function intersects(n, e) {
        if (!n) {
          return this.selfintersects(e);
        }

        if (n.p1 && n.p2) {
          return this.lineIntersects(n);
        }

        if (n instanceof _v) {
          n = n.reduce();
        }

        return this.curveintersects(this.reduce(), n, e);
      }

    }, {
      key: "lineIntersects",
      value: function lineIntersects(n) {
        var _this2 = this;
        var e = V(n.p1.x, n.p2.x),
          i = V(n.p1.y, n.p2.y),
          s = H(n.p1.x, n.p2.x),
          o = H(n.p1.y, n.p2.y);
        return h.roots(this.points, n).filter(function (r) {
          var u = _this2.get(r);
          return h.between(u.x, e, s) && h.between(u.y, i, o);
        });
      }
    }, {
      key: "selfintersects",
      value: function selfintersects(n) {
        var e = this.reduce(),
          i = e.length - 2,
          s = [];
        for (var o = 0, r, u, f; o < i; o++) u = e.slice(o, o + 1), f = e.slice(o + 2), r = this.curveintersects(u, f, n), s.push.apply(s, _toConsumableArray(r));
        return s;
      }
    }, {
      key: "curveintersects",
      value: function curveintersects(n, e, i) {
        var s = [];
        n.forEach(function (r) {
          e.forEach(function (u) {
            r.overlaps(u) && s.push({
              left: r,
              right: u
            });
          });
        });
        var o = [];
        return s.forEach(function (r) {
          var u = h.pairiteration(r.left, r.right, i);
          u.length > 0 && (o = o.concat(u));
        }), o;
      }
    }, {
      key: "arcs",
      value: function arcs(n) {
        return n = n || .5, this._iterate(n, []);
      }
    }, {
      key: "_error",
      value: function _error(n, e, i, s) {
        var o = (s - i) / 4,
          r = this.get(i + o),
          u = this.get(s - o),
          f = h.dist(n, e),
          l = h.dist(n, r),
          y = h.dist(n, u);
        return G(l - f) + G(y - f);
      }
    }, {
      key: "_iterate",
      value: function _iterate(n, e) {
        var i = 0,
          s = 1,
          o;
        do {
          o = 0, s = 1;
          var r = this.get(i),
            u = void 0,
            f = void 0,
            l = void 0,
            y = void 0,
            a = !1,
            x = !1,
            p = void 0,
            g = s,
            _ = 1,
            q = 0;
          do if (x = a, y = l, g = (i + s) / 2, q++, u = this.get(g), f = this.get(s), l = h.getccenter(r, u, f), l.interval = {
            start: i,
            end: s
          }, a = this._error(l, r, i, s) <= n, p = x && !a, p || (_ = s), a) {
            if (s >= 1) {
              if (l.interval.end = _ = 1, y = l, s > 1) {
                var M = {
                  x: l.x + l.r * nt(l.e),
                  y: l.y + l.r * et(l.e)
                };
                l.e += h.angle({
                  x: l.x,
                  y: l.y
                }, M, this.get(1));
              }
              break;
            }
            s = s + (s - i) / 2;
          } else s = g; while (!p && o++ < 100);
          if (o >= 100) break;
          y = y || l, e.push(y), i = _;
        } while (s < 1);
        return e;
      }
    }], [{
      key: "quadraticFromPoints",
      value: function quadraticFromPoints(n, e, i, s) {
        if (typeof s == "undefined" && (s = .5), s === 0) return new _v(e, e, i);
        if (s === 1) return new _v(n, e, e);
        var o = _v.getABC(2, n, e, i, s);
        return new _v(n, o.A, i);
      }
    }, {
      key: "cubicFromPoints",
      value: function cubicFromPoints(n, e, i, s, o) {
        typeof s == "undefined" && (s = .5);
        var r = _v.getABC(3, n, e, i, s);
        typeof o == "undefined" && (o = h.dist(e, r.C));
        var u = o * (1 - s) / s,
          f = h.dist(n, i),
          l = (i.x - n.x) / f,
          y = (i.y - n.y) / f,
          a = o * l,
          x = o * y,
          p = u * l,
          g = u * y,
          _ = {
            x: e.x - a,
            y: e.y - x
          },
          q = {
            x: e.x + p,
            y: e.y + g
          },
          O = r.A,
          M = {
            x: O.x + (_.x - O.x) / (1 - s),
            y: O.y + (_.y - O.y) / (1 - s)
          },
          w = {
            x: O.x + (q.x - O.x) / s,
            y: O.y + (q.y - O.y) / s
          },
          S = {
            x: n.x + (M.x - n.x) / s,
            y: n.y + (M.y - n.y) / s
          },
          m = {
            x: i.x + (w.x - i.x) / (1 - s),
            y: i.y + (w.y - i.y) / (1 - s)
          };
        return new _v(n, S, m, i);
      }
    }, {
      key: "getUtils",
      value: function getUtils() {
        return h;
      }
    }, {
      key: "PolyBezier",
      get: function get() {
        return _b;
      }
    }, {
      key: "getABC",
      value: function getABC() {
        var n = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
        var e = arguments.length > 1 ? arguments[1] : undefined;
        var i = arguments.length > 2 ? arguments[2] : undefined;
        var s = arguments.length > 3 ? arguments[3] : undefined;
        var o = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : .5;
        var r = h.projectionratio(o, n),
          u = 1 - r,
          f = {
            x: r * e.x + u * s.x,
            y: r * e.y + u * s.y
          },
          l = h.abcratio(o, n);
        return {
          A: {
            x: i.x + (i.x - f.x) / l,
            y: i.y + (i.y - f.y) / l
          },
          B: i,
          C: f,
          S: e,
          E: s
        };
      }
    }]);
  }();
})();

},{}]},{},[1]);
