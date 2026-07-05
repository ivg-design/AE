# CAPABILITY.md — FROZEN capability-model + dashboard data contract

This document is the single source of truth for the **interactive per-script dashboard**.
It is **frozen**: every agent (SDB capture, expr-eval, RenderEval, dashboard assembler)
builds against the shapes below and must not change them. The machine-readable copy lives
in [`src/capability/schema.js`](./src/capability/schema.js) and is the authority if the two
ever disagree.

This contract is **additive** on top of the harness `CONTRACT.md`. It does not replace any
shape there; it distills analyzer + fixture output into a presentation-grade model and pairs
it with render-side artifacts.

## Global rules

- **ESM only** (`"type":"module"`). Import the schema from `src/capability/schema.js`.
- Validators **never throw**; they return `{ ok: boolean, errors: string[] }`.
- A capability model is **documentation-grade**, not an assertion harness: free-form string
  fields are validated for presence/type only.

## Exports (`src/capability/schema.js`)

- Validators: `validateCapabilityModel(m)`, `validateRenderArtifacts(r)`.
- Constants: `UI_MODES`, `SELECTION_KINDS`, `OPERATION_KINDS`, `CONTROL_TYPES`, `SIM_VARIABLES`.
- Typedefs (JSDoc): `CapabilityModel`, `ConsumesSpec`, `ControlSpec`, `ScriptSim`,
  `SimOperation`, `ExpressionSpec`, `ControlBinding`, `ExprSim`, `RenderArtifacts`,
  `ExpressionCurve`, `CurveSample`.

---

## SCHEMA SPEC (frozen)

### CapabilityModel — produced by analyzers → `capability/<name>.model.json`

```
CapabilityModel {
  name:     string,                 // script name, no extension
  category: string,                 // catalog category (folder)
  ui:       'DIALOG'|'PANEL'|'PALETTE'|'HEADLESS',   // from @ui frontmatter

  consumes: {
    selection:   string[],          // subset of SELECTION_KINDS
    minimum:     string,            // human-readable minimum precondition
    description: string             // what the script reads from the host
  },

  controls: [ {
    name:    string,                // control label / identifier
    type:    string,               // one of CONTROL_TYPES
    role:    string,               // verb phrase: what the control does
    default: any,                  // string|number|boolean|null (key MUST be present)
    range?:  [min:number, max:number],   // numeric controls
    options?: string[]             // dropdown/radio/listbox option labels
  } ],

  functions: string[],             // short verb phrases of what the script does

  scriptSim: {                     // distilled from the fixture SUCCESS scenario
    scenario:   string,            // the success scenario name
    inputs:     string,            // summary of host inputs
    operations: [ { kind:string, target:string, value?:any } ]
  },

  expressions: [ {                 // for scripts that WRITE AE expressions; [] if none
    target: string,                // property path the expression is applied to
    controlBinding: {              // which UI control drives it, or null
      control: string,
      param:   string,
      range:   [min:number, max:number]
    } | null,
    expression: string,            // AE expression source (templated strings resolved to a concrete sample)
    sim: {
      variable: 'controlValue'|'time',
      range:    [min:number, max:number],
      steps:    number,            // >= 2
      note:     string
    }
  } ],

  notes: string[]                  // caveats, AE-only behaviour
}
```

### RenderArtifacts — produced later by RenderEval → `capability/<name>.render.json`

```
RenderArtifacts {
  name:       string,              // must match the model's name
  screenshot: string|null,         // path to captured ScriptUI PNG, or null
  uiTreePath: string|null,         // path to captured UITree JSON, or null
  expressionCurves: [ {
    target: string,                // property path the curve plots
    xLabel: string,
    yLabel: string,
    samples: [ { x:number, y:number } ]   // evaluated points
  } ],
  notes: string[]
}
```

### Enumerations

```
UI_MODES        = ['DIALOG','PANEL','PALETTE','HEADLESS']
SELECTION_KINDS = ['layers','keyframes','properties','comp','masks','text','none']
CONTROL_TYPES   = ['slider','number','text','checkbox','dropdown','radio','color','button','listbox','group','static']
SIM_VARIABLES   = ['controlValue','time']
OPERATION_KINDS = ['createLayer','deleteLayer','setValue','setValueAtTime','setExpression',
                   'addKeyframe','setMarker','alert','prompt','confirm','beginUndoGroup',
                   'endUndoGroup','fileWrite','applyPreset','executeCommand','setParent','reorder']
```

Validation notes:
- `controls[].default` — the **key must be present**; use `null` to mean "no default".
- `expressions[].controlBinding` — the **key must be present**; use `null` when the
  expression is not driven by a UI control.
- `expressions[].sim.steps` must be `>= 2`.
- `scriptSim.operations[].kind` accepts any non-empty string (typically an `OPERATION_KINDS`
  member), since the model is documentation-grade.

---

## DASHBOARD DATA CONTRACT

Per-script data is assembled from two files, both keyed by the script `name`:

| File | Producer | Shape |
|------|----------|-------|
| `capability/<name>.model.json`  | analyzers (SDB + expr-eval)         | `CapabilityModel` |
| `capability/<name>.render.json` | RenderEval                          | `RenderArtifacts` |

These are **merged by `name`** into a single per-script record. The dashboard reads a single
manifest assembled at the very end:

```
dashboard/data/index.json
```

`index.json` is a manifest listing **all** scripts. Recommended shape (frozen at the
top-level keys; per-entry fields are additive but must include at least the following):

```
{
  "generatedAt": string,           // ISO timestamp
  "count":       number,
  "scripts": [ {
    "name":      string,
    "category":  string,
    "ui":        string,
    "model":     "capability/<name>.model.json",   // path, relative to harness root
    "render":    "capability/<name>.render.json" | null,
    "hasExpressions": boolean,
    "hasScreenshot":  boolean
  } ]
}
```

The dashboard front-end (under `dashboard/`) consumes only `dashboard/data/index.json` and
the referenced model/render JSON files. Render assets (screenshots, UI tree captures) live
under `dashboard/assets/ui/`.

### Folder layout (owned by SCHEMA gate; populated by downstream agents)

```
src/capability/        # this schema (owned: SCHEMA)
src/sdb/               # SDB capture analyzer (downstream)
src/expr-eval/         # expression evaluation analyzer (downstream)
capability/            # <name>.model.json + <name>.render.json (downstream)
dashboard/             # dashboard front-end (downstream)
dashboard/assets/ui/   # captured screenshots / UI tree assets (RenderEval)
dashboard/data/        # index.json manifest (assembler, end of pipeline)
```

---

## Pipeline order

1. **SDB / analyzers** read `<category>/<Name>.jsx` + `<Name>.fixture.js`, emit
   `capability/<name>.model.json` (validated by `validateCapabilityModel`).
2. **expr-eval** enriches the `expressions[]` of scripts that write AE expressions.
3. **RenderEval** evaluates expression curves + captures ScriptUI, emits
   `capability/<name>.render.json` (validated by `validateRenderArtifacts`) and writes
   assets to `dashboard/assets/ui/`.
4. **Assembler** merges model + render by `name`, writes `dashboard/data/index.json`.
5. **Dashboard** reads `dashboard/data/index.json` and renders.
