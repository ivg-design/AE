// Simple JSON polyfill for ExtendScript
//@ts-nocheck
if (typeof JSON === 'undefined') {
  JSON = {
    stringify: function(obj: any): string {
      if (obj === null) return 'null';
      if (obj === undefined) return undefined;
      if (typeof obj === 'string') return '"' + obj.replace(/"/g, '\\"') + '"';
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      if (obj instanceof Array) {
        var arr = [];
        for (var i = 0; i < obj.length; i++) {
          arr.push(JSON.stringify(obj[i]));
        }
        return '[' + arr.join(',') + ']';
      }
      if (typeof obj === 'object') {
        var pairs = [];
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            pairs.push('"' + key + '":' + JSON.stringify(obj[key]));
          }
        }
        return '{' + pairs.join(',') + '}';
      }
      return '{}';
    },
    parse: function(str: string): any {
      return eval('(' + str + ')');
    }
  };
}

import { ns } from "../shared/shared";

import * as aeft from "./aeft/aeft";

//@ts-ignore
const host = typeof $ !== "undefined" ? $ : window;

// A safe way to get the app name since some versions of Adobe Apps broken BridgeTalk in various places (e.g. After Effects 24-25)
// in that case we have to do various checks per app to deterimine the app name

const getAppNameSafely = (): ApplicationName | "unknown" => {
  const compare = (a: string, b: string) => {
    return a.toLowerCase().indexOf(b.toLowerCase()) > -1;
  };
  const exists = (a: any) => typeof a !== "undefined";
  const isBridgeTalkWorking =
    typeof BridgeTalk !== "undefined" &&
    typeof BridgeTalk.appName !== "undefined";

  if (isBridgeTalkWorking) {
    return BridgeTalk.appName;
  } else if (app) {
    //@ts-ignore
    if (exists(app.name)) {
      //@ts-ignore
      const name: string = app.name;
      if (compare(name, "photoshop")) return "photoshop";
      if (compare(name, "illustrator")) return "illustrator";
      if (compare(name, "audition")) return "audition";
      if (compare(name, "bridge")) return "bridge";
      if (compare(name, "indesign")) return "indesign";
    }
    //@ts-ignore
    if (exists(app.appName)) {
      //@ts-ignore
      const appName: string = app.appName;
      if (compare(appName, "after effects")) return "aftereffects";
      if (compare(appName, "animate")) return "animate";
    }
    //@ts-ignore
    if (exists(app.path)) {
      //@ts-ignore
      const path = app.path;
      if (compare(path, "premiere")) return "premierepro";
    }
    //@ts-ignore
    if (exists(app.getEncoderHost) && exists(AMEFrontendEvent)) {
      return "ame";
    }
  }
  return "unknown";
};

// Create global expose variables for our functions
//@ts-ignore
if (typeof $ !== "undefined") {
  //@ts-ignore
  $.padNumber = aeft.padNumber;
  //@ts-ignore
  $.framesToTimecode = aeft.framesToTimecode;
  //@ts-ignore
  $.timecodeToFrames = aeft.timecodeToFrames;
  //@ts-ignore
  $.getCurrentFrameInfo = aeft.getCurrentFrameInfo;
  //@ts-ignore
  $.navigateToFrame = aeft.navigateToFrame;
  //@ts-ignore
  $.evaluateExpression = aeft.evaluateExpression;
}

switch (getAppNameSafely()) {
  case "aftereffects":
  case "aftereffectsbeta":
    host[ns] = host[ns] || {};
    
    // Register the After Effects-specific functions
    for (const key in aeft) {
      if (Object.prototype.hasOwnProperty.call(aeft, key)) {
        host[ns][key] = (aeft as any)[key];
        
        // Also register for direct access in evalScript (without namespace)
        host[key] = (aeft as any)[key];
      }
    }
    
    // Debug: Log what's registered
    //@ts-ignore
    if (typeof $.writeln !== "undefined") {
      //@ts-ignore
      $.writeln("Registered functions in namespace '" + ns + "':");
      for (const key in host[ns]) {
        //@ts-ignore
        $.writeln(" - " + key + ": " + typeof host[ns][key]);
      }
    }
    break;
}

export type Scripts = typeof aeft

// https://extendscript.docsforadobe.dev/interapplication-communication/bridgetalk-class.html?highlight=bridgetalk#appname
type ApplicationName =
  | "aftereffects"
  | "aftereffectsbeta"
  | "ame"
  | "amebeta"
  | "audition"
  | "auditionbeta"
  | "animate"
  | "animatebeta"
  | "bridge"
  | "bridgebeta"
  // | "flash"
  | "illustrator"
  | "illustratorbeta"
  | "indesign"
  | "indesignbeta"
  // | "indesignserver"
  | "photoshop"
  | "photoshopbeta"
  | "premierepro"
  | "premiereprobeta";
