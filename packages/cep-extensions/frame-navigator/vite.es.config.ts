import fs from "fs";
import { rollup, watch, RollupOptions, OutputOptions } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import { jsxInclude, jsxBin, jsxPonyfill } from "vite-cep-plugin";
import { CEP_Config } from "vite-cep-plugin";
import json from "@rollup/plugin-json";
import path from "path";

const GLOBAL_THIS = "thisObj";

// Custom plugin to replace __objectFreeze with a simple function
const replaceObjectFreeze = () => {
  return {
    name: 'replace-object-freeze',
    renderChunk(code: string, chunk: any) {
      // Replace __objectFreeze with a simple function that returns the object
      const newCode = code.replace(/__objectFreeze/g, 'function(obj) { return obj; }');
      return {
        code: newCode,
        map: null // Return null to indicate no sourcemap changes
      };
    },
  };
};

export const extendscriptConfig = (
  extendscriptEntry: string,
  outPath: string,
  cepConfig: CEP_Config,
  extensions: string[],
  isProduction: boolean,
  isPackage: boolean
) => {
  console.log(outPath);
  const config: RollupOptions = {
    input: extendscriptEntry,
    treeshake: true,
    output: {
      file: outPath,
      sourcemap: isPackage
        ? cepConfig.zxp.sourceMap
        : cepConfig.build?.sourceMap,
    },
    plugins: [
      json(),
      nodeResolve({
        extensions,
      }),
      babel({
        extensions,
        exclude: /node_modules/,
        babelrc: false,
        babelHelpers: "inline",
        presets: [
          ["@babel/preset-env", {
            loose: true,
            modules: false,
            targets: {
              browsers: ["ie 11"]
            }
          }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-syntax-dynamic-import",
          ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      }),
      jsxPonyfill(),
      jsxInclude({
        iife: true,
        globalThis: GLOBAL_THIS,
      }),
      jsxBin(isPackage ? cepConfig.zxp.jsxBin : cepConfig.build?.jsxBin),
      replaceObjectFreeze(),
    ],
  };

  async function build() {
    const bundle = await rollup(config);
    await bundle.write(config.output as OutputOptions);
    await bundle.close();
  }

  const triggerHMR = () => {
    // No built-in way to trigger Vite's HMR reload from outside the root folder
    // Workaround will read and save index.html file for each panel to triggger reload
    console.log("ExtendScript Change");
    cepConfig.panels.map((panel) => {
      const tmpPath = path.join(process.cwd(), "src", "js", panel.mainPath);
      if (fs.existsSync(tmpPath)) {
        const txt = fs.readFileSync(tmpPath, { encoding: "utf-8" });
        fs.writeFileSync(tmpPath, txt, { encoding: "utf-8" });
      }
    });
  };

  const watchRollup = async () => {
    const watcher = watch(config);
    watcher.on("event", ({ result }: any) => {
      if (result) {
        triggerHMR();
        result.close();
      }
    });
    watcher.close();
  };

  if (isProduction) {
    build();
  } else {
    watchRollup();
  }
};
