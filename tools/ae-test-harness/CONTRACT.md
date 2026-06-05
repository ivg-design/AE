# ae-test-harness — FROZEN CONTRACT

This document is the single source of truth for every interface in the harness. It is **frozen**:
build agents implement against it and must not change the shapes below. All shared types,
validators, and constants live in `src/contracts/` and are re-exported from `src/contracts/index.js`.

## Global rules

- **ESM only** (`"type":"module"`). Use `import`/`export` and `.js` extensions on relative imports.
- Node 25, Vitest, Acorn, acorn-walk, Playwright.
- Import shared schemas/validators/constants from `src/contracts/index.js` via a correct relative path.
- Validators **never throw**; they return `{ ok: boolean, errors: string[] }`.
- Scripts under test live in
  `/Users/ivg/github/ae-script-catalog/ae/packages/ae-scripts/src/{animation,composition,effects,keyframes,layers,paths,utilities}/*.jsx` (31 total).
- Deterministic artifacts are written to `.out/<command>/`. Screenshots go to `screenshots/`.

## Contracts module exports (`src/contracts/index.js`)

Validators: `validateHostSnapshot`, `validateUITree`, `validateOperation`,
`validateExpressionRecord`, `validateFixture`, `validateReportRecord`, `validateCheckStatus`.

Constants: `OPERATION_KINDS`, `CONFIDENCE_LEVELS`, `CHECK_STATUS_VALUES`, `ITEM_TYPE_NAMES`,
`LAYER_TYPES`, `PROPERTY_VALUE_TYPES`, `UI_TREE_TYPES`, `EXPRESSION_SOURCES`,
`EXPRESSION_PARSE_STATUSES`, `ACTION_TYPES`, `SCENARIO_KINDS`, `SCENARIO_CONFIDENCE`.

Typedefs (JSDoc): `HostSnapshot`, `ItemRef`, `CompDef`, `LayerDef`, `PropertyDef`, `Keyframe`,
`UITree`, `UINode`, `Operation`, `ExpressionRecord`, `Fixture`, `Scenario`, `Action`,
`ReportRecord`, `CheckStatus`, `RiskStatus`.

---

## SCHEMA SPEC (frozen)

```
HostSnapshot { appVersion:string, project:{items:ItemRef[]}, activeItemId:string|null, comps:CompDef[], selection:{layerIds:string[], propertyPaths:string[]} }
ItemRef { id:string, name:string, typeName:'Composition'|'Footage'|'Folder' }
CompDef { id, name, width, height, duration, frameRate, pixelAspect, layers:LayerDef[] }
LayerDef { id, index:int, name, type:'AV'|'Shape'|'Text'|'Null'|'Camera'|'Light', threeDLayer:bool, parentId:string|null, inPoint, outPoint, properties:PropertyDef[], markers?:[], source?:object, text?:object, masks?:[] }
PropertyDef { matchName, name, path:string(slash-separated), propertyValueType:'OneD'|'TwoD'|'ThreeD'|'Color'|'Shape'|'NoValue'|'CustomValue', value?, expression?:string, keyframes?:Keyframe[], canSetExpression:bool, numProperties?:int, properties?:PropertyDef[] }
Keyframe { time, value, interpolationIn?, interpolationOut? }
Action { type:'click'|'change'|'select'|'type'|'selectLayers'|'selectProperties'|'run', target?:string, value?:any }
Operation { kind, target?:string, value?, meta?:object }; OPERATION_KINDS=['createLayer','deleteLayer','setValue','setValueAtTime','setExpression','addKeyframe','setMarker','alert','prompt','confirm','beginUndoGroup','endUndoGroup','fileWrite','applyPreset','executeCommand','setParent','reorder']
ExpressionRecord { script, targetPath, source:'literal'|'runtime', expression:string, parseStatus:'ok'|'error'|'dynamic-unresolved', error?:string }
UITree { type:'Window'|'Panel'|'Palette'|'Dialog', title?:string, bounds?:any, children:UINode[] }
UINode { type:string, name?:string, text?:string, properties?:object, value?:any, children?:UINode[], handlers?:string[] }
Fixture { script:{name,category,relPath,ui}, scenarios:Scenario[] }
Scenario { name, kind:'success'|'guard'|'known-blocked', host:HostSnapshot, actions:Action[], expectedOperations:Partial<Operation>[], expectedExpressions?:Partial<ExpressionRecord>[], expectedAlerts?:string[], expectedConfidence:'high'|'medium'|'low'|'known-blocked' }
ReportRecord { name, category, ui, static:CheckStatus, expressions:CheckStatus, functional:CheckStatus, uiStatus:CheckStatus, risk:RiskStatus, confidence, artifacts:string[], notes:string[] }
CheckStatus { status:'pass'|'fail'|'skip'|'warn', detail?:string, evidence?:any }
RiskStatus { aeOnly:bool, knownBlocked:bool, items:string[] }
CONFIDENCE_LEVELS=['high','medium','low','known-blocked']
```

---

## SUBSYSTEM CONTRACTS (verbatim — implement exactly these signatures)

- **src/host/index.js (Integrate):** export function `createHost(snapshot)` -> `{ app, File, Folder, $, __log:Operation[] }`. Composes sandbox+project+layers+properties+media+io-effects. Every mutation pushes an Operation to `__log`.
- **src/host/sandbox/index.js (agent):** export function `runScript(code, globals, {timeoutMs=5000})` -> `{ error:Error|null, log:Operation[] }` using `node:vm` with the globals injected (app, alert, prompt, confirm, File, Folder, $, CompItem, AVLayer, ShapeLayer, TextLayer, parseFloat, etc.).
- **src/host/project/index.js:** export function `createProject(snapshot, log)` -> `{ app, project }` with `app.project.activeItem`, `CompItem` class, `ItemCollection`, `app.beginUndoGroup`/`endUndoGroup` (log), `app.executeCommand` (log), `app.version`, `app.activeViewer` stub.
- **src/host/layers/index.js:** export function `buildLayers(compDef, ctx)` -> layer objects (AVLayer/ShapeLayer/TextLayer/Null) with index,name,parent (setParent logs setParent), selectedLayers, transform props, 3D flag.
- **src/host/properties/index.js:** export function `buildProperties(propDefs, ctx)` -> PropertyGroup/Property with `.property(nameOrIndex)` traversal, `.value`, `.setValue` (log setValue), `.setValueAtTime` (log setValueAtTime+addKeyframe), `.expression` setter (log setExpression), `.numKeys`, selectedProperties.
- **src/host/media/index.js:** export function `buildMedia(ctx)` -> shape groups/paths, masks, TextDocument, text animators, `sourceRectAtTime` stub.
- **src/host/io-effects/index.js:** export function `createIO(log)` -> `{ File, Folder }` (writes log fileWrite to a temp dir, real write to os tmp ok), `applyPreset(file)` logs applyPreset, effect injection helper, executeCommand passthrough.
- **src/scriptui/index.js:** export function `createScriptUIRuntime()` -> `{ Window, ScriptUI, captureTree(win):UITree }`. Capture controls (panel,group,button,statictext,edittext,checkbox,radiobutton,dropdownlist,listbox,slider,progressbar,image) into a UITree; store onClick/onChange handlers by name in `handlers[]`.
- **src/scriptui/actions/index.js:** export function `runActions(runtime, actions:Action[])` -> drives click/change/select/type against captured controls (invokes stored handlers).
- **src/static/index.js:** export `parseECMA3(code)`->`{ok,errors[]}` (acorn ecmaVersion 3, allowReturnOutsideFunction), `scanModernAPI(code)`->`findings[]` (let/const/arrow/=>/Array.map etc), `validateFrontmatter(code)`->`{fields,findings[]}` (parse @name/@version/@ui/@changelog block), `scanIncludes(code)`->`{includes:string[], blocked:boolean}` (`//@include` or `#include` => blocked:true).
- **src/expressions/index.js:** export `extractLiteralExpressions(code, scriptName)`->`ExpressionRecord[]` (find string args to `.expression=` / `property(...).expression` assignments and expression string literals), `parseExpression(expr)`->`{ok,error}` (acorn ecmaVersion 2018), `classifyRecord(rec)` marks `'dynamic-unresolved'` when expression is built from runtime concatenation/variables not statically resolvable.
- **src/visualization/index.js:** export `renderHTML(uiTree)`->`htmlString` (fallback renderer of the UITree), `screenshot(html, outPngPath)`->`{ok,skipped,reason}` via Playwright chromium (if browser/launch fails return `{ok:false,skipped:true,reason}`), `sdbAdapter` behind `process.env.SDB_ROOT` (no-op `{skipped:true}` when unset).
- **src/reports/index.js:** export `buildReport(records:ReportRecord[])`->`{json, markdown}`, `writeReport(records, outDir)` writes `report.json` + `report.md`. Markdown has a per-script table (static/expressions/functional/ui/risk/confidence) and separates standalone-confidence from AE-runtime-only risk.
- **src/cli/index.js:** CLI dispatch for commands `static|expressions|functional|ui|report|ae-smoke`. discovers scripts (via `src/discovery.js` from Integrate), loads fixtures (via `src/fixtures/loader.js` from Integrate), writes deterministic artifacts to `/Users/ivg/github/ae-script-catalog/ae/tools/ae-test-harness/.out/<command>/`.
- **src/ae-smoke/index.js:** export `runAeSmoke()` optional; skips cleanly (returns `{skipped:true,reason}`) unless `process.env.AE_SMOKE_CONFIG` points to a config; `importJsonLog(path)` parses AE-side JSON logs into Operation[].

---

## Ownership map

- **Contracts agent (this file's owner):** `package.json`, `vitest.config.js`, `jsconfig.json`,
  `README.md`, `.gitignore`, `CONTRACT.md`, `src/contracts/**`, and all `.gitkeep` skeleton dirs.
- **Integrate:** `src/host/index.js`, `src/index.js`, `src/discovery.js`, `src/fixtures/loader.js`.
- All other subsystems own their respective directories per the SUBSYSTEM CONTRACTS above.

Build agents must NOT touch `package.json` / `vitest.config.js` / `src/contracts/**` /
`src/host/index.js` / `src/index.js`.
