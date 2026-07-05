# Onionizer
> An unfinished prototype for a shape-layer onion-skinning rig — duplicates the active comp, adds a controller null, and stacks seven time-remapped instances, but the property-analysis step and controller wiring are not yet functional.

**Category:** utilities · **Version:** 2.0.1 · **UI:** HEADLESS — no `Window`/ScriptUI of any kind; the only user-facing feedback is two `alert()` guard messages.

## What it does

Onionizer is an early-stage prototype for building an "onion skinning" rig for shape-layer animation — the kind of ghost-trail overlay traditional animators use to see a few frames before/after the current one while they work. The idea is to take whatever composition you're animating in, duplicate it into a clean reference copy named "CelSkin," and then stack seven instances of that duplicate back into your original comp, each with time remapping turned on and a Stroke + Fill effect ready to be styled as a faded "skin." A "CelMate Controller" null is also dropped into the original comp to eventually drive all seven skins from one place.

As shipped, this is explicitly a prototype and not a finished tool. Per its own changelog and frontmatter, the controller null has no parameters wired to it yet, the seven CelSkin layers all share the same (disabled-by-default-offset) time remap curve rather than each showing a different frame, and the "read the properties the user has selected and hook them up" step — the part that would make this genuinely useful — is unfinished. An earlier build (2.0.0) actually wrote a literal placeholder string (`"expression goes here"`) onto the user's selected properties; 2.0.1 removed that destructive behavior, so the current build no longer touches the user's original properties at all.

For a motion designer, the practical takeaway is: running this script will always create the CelSkin duplicate, the "Onionizer" controller null, and seven CelSkin_1…CelSkin_7 layers with Stroke/Fill effects and time remapping enabled — but if you follow the script's own documented workflow and select a specific property (e.g. Rotation, Position) before running it, the script currently throws a runtime error partway through and none of that layer-building work happens at all (see Audit findings below). Selecting only whole layers (no specific property drilled into) avoids the crash and lets the rest of the rig get built, just without any of the intended per-property analysis.

## How it works

### Entry flow
- `app.beginUndoGroup("Onionizer: The Onionizer for Shape Layers")` opens the undo group (line 59) *before* the main logic runs, and `app.endUndoGroup()` (line 205) closes it *after* the immediately-invoked function expression (IIFE) that holds all the logic (lines 61–202).
- The whole script body lives inside `(function () { ... })();` — an IIFE, not a named function — so the two guard clauses inside it use bare `return;` to bail out of the IIFE only. Execution then falls through to the outer `app.endUndoGroup()` line, so the undo group closes correctly on both guard paths.

### Guards
1. `comp = app.project.activeItem` must exist and be a `CompItem`, or it alerts `"Please select a composition."` and returns (lines 66–70).
2. `comp.selectedLayers.length` must be > 0, or it alerts `"Please select at least one layer."` and returns (lines 72–76).

### Step 2 — analyze selected layers/properties (`PropQuery` integration)
For every selected layer and every one of its `selectedProperties` that is **not** a `PropertyGroup` instance, the script calls `PropQuery.main(prop, "propPath", ["useMatchNames"])` and `PropQuery.main(prop, "propObject")` (lines 97–98) and pushes `{ layerIndex, propertyPath, propertyObject }` into `selectedInfoArray`.

This depends on `//@include 'modules/PropQuery.js'` (line 56) — a module documented at `tools/scripting-modules/PropQuery.js` in this repo. That module exports a single **callable function** (`var PropQuery = (function(){ ... return mainFunction; })();`) with four sub-functions attached directly to it (`PropQuery.showDeepestSelectedProperty`, `.getPropertyType`, `.collectPropertyHierarchyInfo`, `.constructPropertyPath`). **It has no `.main` property.** See Audit findings — this call is invalid and will throw in AE.

### Step 3 — duplicate the comp
`comp.duplicate()` → `celSkinComp`, renamed to `"CelSkin"` (lines 114–115). Straightforward, unconditional, and independent of the (buggy) analysis step above.

### Step 4 — "retarget to CelSkin" loop
For each entry in `selectedInfoArray`, the script:
- Fetches `celSkinComp.layer(info.layerIndex)` into `celSkinLayer` (line 126) — intended to be the CelSkin-side counterpart of the originally selected layer.
- Computes `pathComponents` by splitting `info.propertyPath` (line 129) and sets up `propertyObject = celSkinLayer` (line 132) for a walk down that path — but the loop that would actually walk it (lines 134–155) is entirely commented out. This is leftover code from the 2.0.0 placeholder-expression behavior that 2.0.1 deliberately disabled.
- Instead, it walks **up** the `parentProperty` chain starting from `info.propertyObject` (the property object taken from the **original** layer, not from `celSkinLayer`) until it finds a link whose `parentProperty` is a `ShapeLayer`, then sets `<that ShapeLayer>.containingComp.name = "CelSkin"` (lines 162–170). See Audit findings — because `info.propertyObject` traces back to the original comp's layer, this renames the **original active composition**, not the CelSkin duplicate.

### Step 5 — controller null
`comp.layers.addNull()` on the original comp, renamed `"Onionizer"` (lines 181–183). No pseudo-effect or controls are added to it — the frontmatter and changelog are explicit that this is not implemented yet.

### Step 6 — seven CelSkin instances
A `for (k = 0; k < 7; k++)` loop (lines 193–201) adds `celSkinComp` as a layer into the original comp seven times via `comp.layers.add(celSkinComp)`, names each `"CelSkin_" + (k+1)` (giving `CelSkin_1`…`CelSkin_7`, correctly 1-indexed), sets `timeRemapEnabled = true`, and adds `"ADBE Stroke"` and `"ADBE Fill"` effects to each via `.property("Effects").addProperty(...)`. Both match names are correct built-in effect match names. No per-layer time offset is assigned, so all seven layers currently show identical remap curves — an acknowledged, documented limitation, not a bug.

## Controls & options

Onionizer is headless — there is no dialog or palette. Instead of UI controls, it reads state from the AE UI directly:

| "Control" | Where it comes from | Meaning |
|---|---|---|
| Active composition | `app.project.activeItem` | Must be a `CompItem`; the comp that gets duplicated and that receives the controller null + 7 CelSkin layers. |
| Selected layer(s) | `comp.selectedLayers` | At least one required; drives `selectedInfoArray` (layer index used to look up the corresponding layer in the CelSkin duplicate). |
| Selected propert(ies) | `layer.selectedProperties` per selected layer | Optional. Only entries that are **not** `PropertyGroup` instances (i.e. leaf properties like Rotation, Position, a Slider) are processed by `PropQuery` — and that processing currently throws (see Audit). Selecting only property *groups*, or no properties at all, avoids the crash. |

No effect controls, sliders, or dropdowns are created for the user to configure — the controller null ships empty by design (prototype limitation).

## Usage

1. Open the composition you want to build an onion-skin rig for and select the shape layer(s) you're animating.
2. Optionally drill into and select specific properties on those layers (e.g. Rotation) that you'd eventually want wired to the controller — **note:** doing this currently crashes the script before it builds anything (see Requirements & edge cases).
3. Run the script — there is no dialog; it executes immediately.
4. If it completes, you'll have: a new "CelSkin" composition (a duplicate of your original), an "Onionizer" null layer in your original comp, and seven "CelSkin_1"…"CelSkin_7" precomp layers stacked in the original comp, each with time remapping enabled and Stroke + Fill effects added.
5. Because none of the timing, controller-null wiring, opacity fades, or color styling is implemented yet, you must manually configure all of that by hand afterward — set distinct time offsets on each CelSkin_N layer's time remap, style the Stroke/Fill effects, and decide how (or whether) to use the empty "Onionizer" null.

## Requirements & edge cases

- Adobe After Effects CS6 or later (frontmatter claim; the APIs used — `CompItem`, `duplicate()`, `layers.addNull()`, `layers.add(comp)`, `property("Effects").addProperty(...)`, `timeRemapEnabled` — are all long-standing and consistent with that floor, though this can't be independently verified from the code alone).
- An active composition must be open/selected in the Project panel, or the script alerts `"Please select a composition."` and exits cleanly (undo group closes normally on this path).
- At least one layer must be selected in that composition, or the script alerts `"Please select at least one layer."` and exits cleanly (undo group closes normally on this path).
- `modules/PropQuery.js` must resolve via the `//@include` include path for the script to load at all in AE. In this repository, the only copy of that module lives at `tools/scripting-modules/PropQuery.js` — there is no `modules/` folder alongside `Onionizer.jsx` itself in `src/utilities/`. (A sibling script, `effects/Sync-o-tron.jsx`, avoids this entirely by embedding the whole module inline rather than `@include`-ing it.) This is a deployment/packaging concern, separately flagged already by the test harness as "known-blocked," and is not re-reported below.
- Edge case — selecting only whole-layer selections or only `PropertyGroup`-level selections (e.g. "Transform" as a group, not a leaf property under it): `selectedInfoArray` stays empty, the buggy `PropQuery.main` call path is never entered, and the script proceeds normally through comp duplication, controller-null creation, and the seven-layer CelSkin stack.
- Edge case — selecting any leaf property (Position, Rotation, Opacity, a Slider, etc.), which is exactly what the script's own `@usage` docs tell the user to do: the script throws inside the analysis loop (see Audit finding #1) and aborts before duplicating the comp, adding the controller null, or building any CelSkin layers.

## Notes

- The CelSkin composition is a static `duplicate()`, not a live expression-linked proxy — explicitly documented as a known design limitation ("CelSkin composition is a duplicate, not a live expression-linked proxy").
- The 2.0.0 → 2.0.1 changelog specifically calls out removing a destructive placeholder-expression write (`"expression goes here"`) that used to land on the user's originally selected properties; that code path is now fully commented out (lines 134–155) rather than deleted, presumably kept for reference/future completion.
- The `PropQuery` module this script depends on is shared with `paths/Centralizer.jsx` (which has its own include disabled via a deliberately malformed comment, `// @'include modules/PropQuery.jsx'`) and `effects/Sync-o-tron.jsx` (which embeds the identical module inline and calls it correctly as `PropQuery(props, "propObject")`, `PropQuery(props, "propPath", [...])`, etc. — never `PropQuery.main(...)`). Cross-referencing that sibling script is what confirms the call convention used in Onionizer is wrong (see Audit finding #1).
- The repo's own capability model (`tools/ae-test-harness/capability/Onionizer.model.json`) also describes the script as using "`PropQuery.main()`" — i.e. the incorrect call convention has already propagated into generated documentation/specs without being caught, which is exactly the kind of AE-runtime-only defect static tooling and the harness's "known-blocked" classification are structurally unable to surface.

## Audit findings

### 1. `PropQuery.main(...)` is not a valid call — throws at runtime, defeating the core analysis feature (Critical)
**Evidence:** `Onionizer.jsx:97` — `var propPath = PropQuery.main(prop, "propPath", ["useMatchNames"]);` and `Onionizer.jsx:98` — `var propObject = PropQuery.main(prop, "propObject");`.

The included module (`tools/scripting-modules/PropQuery.js`) defines `var PropQuery = (function () { ... return mainFunction; })();` — `PropQuery` **is itself** the callable entry point (its own internal doc comments and every call site in it show usage as `PropQuery(selectedProperty, 'propPath', [...])`). The only properties attached to that function object are `showDeepestSelectedProperty`, `getPropertyType`, `collectPropertyHierarchyInfo`, and `constructPropertyPath` — there is no `.main`. A sibling script in this same repo, `effects/Sync-o-tron.jsx`, embeds the identical module and correctly calls it as `PropQuery(props, "propInfo", [...])`, `PropQuery(props, "propObject")`, `PropQuery(props, "propPath", [...])` (Sync-o-tron.jsx:588–591) — confirming the correct convention and that Onionizer's `.main` usage is simply wrong, not an alternate valid API surface.

**Failure scenario:** Any time a user selects a leaf property (Position, Rotation, a Slider, etc.) on a selected layer before running the script — which is precisely what the script's own `@usage` instructions in the header tell the user to do ("Select specific properties within those layers that you want to visualize") — the `for (j...)` loop over `selectedProperties` reaches a non-`PropertyGroup` entry, calls `PropQuery.main(...)`, and since `PropQuery.main` is `undefined`, AE's ExtendScript engine throws a TypeError ("PropQuery.main is not a function" / "undefined is not a function") at that line. There is no `try/catch` anywhere in the script, so the exception propagates all the way out of the top-level IIFE call, aborting the script immediately — before the comp is ever duplicated, before the controller null is created, and before any of the seven CelSkin layers are built. The user gets an AE error dialog and none of the advertised rig.

### 2. Undo group left open when the analysis step throws (Major)
**Evidence:** `Onionizer.jsx:59` (`app.beginUndoGroup(...)`), `Onionizer.jsx:61-202` (the IIFE containing all logic, with no `try/catch`), `Onionizer.jsx:205` (`app.endUndoGroup();`, positioned *outside* the IIFE).

Because the two `return;` guard clauses live inside the IIFE, they correctly fall through to the outer `app.endUndoGroup()` call when they fire. However, an *uncaught exception* thrown inside the IIFE (such as finding #1, above) unwinds the entire script — including the line `app.endUndoGroup();` that sits after the IIFE invocation at the top level. Since nothing catches the error, `endUndoGroup()` never executes on that path.

**Failure scenario:** Whenever finding #1 fires (i.e. whenever the user selects a leaf property, per the documented usage), the undo group opened by `beginUndoGroup("Onionizer: The Onionizer for Shape Layers")` is left unclosed when the script errors out, in addition to the feature failing outright.

### 3. Step-4 retargeting loop renames the original comp, not the CelSkin duplicate (Major, currently masked by finding #1)
**Evidence:** `Onionizer.jsx:126` (`var celSkinLayer = celSkinComp.layer(info.layerIndex);` — computed but never referenced again in the loop body), `Onionizer.jsx:157-170` (the `parentProperty` walk that operates on `info.propertyObject`, then does `tempPropertyObject.parentProperty.containingComp.name = "CelSkin";`).

`info.propertyObject` (populated in step 2 via `PropQuery.main(prop, "propObject")`) is the property object taken from the layer in the **original, active** composition (`selectedLayers[i]`), not from `celSkinLayer` — the CelSkin duplicate's corresponding layer that was specifically fetched for this purpose one line earlier and then left unused. Walking `parentProperty` up from an original-comp property and reading `.containingComp` off the `ShapeLayer` it lands on yields the **original active composition**, not `celSkinComp`.

**Failure scenario:** If finding #1 were fixed (so `selectedInfoArray` could ever be populated) and the resulting loop reached this code, it would rename the user's **original working composition** to `"CelSkin"` — leaving two compositions both named "CelSkin" in the Project panel (the original, renamed by mistake, and the actual duplicate created in step 3) — instead of doing anything to the intended CelSkin duplicate. In the current build this branch is unreachable in practice (see Requirements & edge cases: reaching it requires `selectedInfoArray` to be non-empty, which requires finding #1's call to have succeeded, which it cannot), so today it manifests as dead/unreachable logic rather than an active misnaming — but it would immediately misbehave the moment finding #1 is patched without this being fixed alongside it.
