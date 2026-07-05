# Iteratron
> Spread a property evenly across a stack of layers — link a start value on one layer and an end value on another, and every layer in between gets its interpolated step.

**Category:** utilities · **Version:** 2.0.1 · **UI:** DIALOG (non-modal palette window)

## What it does

Iteratron solves the "I have N layers and want property X to progress smoothly from layer 1 to layer N" problem without hand-typing intermediate values. Highlight a property on a start layer and click **Link Start Property**; highlight the same property on an end layer and click **Link End Property**; click **OK**. Iteratron computes evenly spaced steps and writes an interpolated value to that property on every valid layer sitting between the two in the layer stack.

It's deliberately property-agnostic: it reads whatever single property you highlight in the Timeline and rebuilds its path on each in-between layer, so it works on Position, Scale, Rotation, Opacity, effect sliders, colors — any numeric 1D/2D/3D/color property, not a fixed list. Locked or hidden layers in the range are skipped from both the step math and the writes, so a rough range with a few disabled placeholders still produces a clean, even ramp across the layers that matter.

It also respects existing animation: if a target property already has keyframes, the value is written as a keyframe at the current playhead time (`setValueAtTime`) instead of overwriting the whole property. Typical uses: staggering duplicated shape layers' X positions, a color ramp across solids, rotation spread across clock hands or spokes, an opacity gradient across a card stack.

## Controls & options

| Control | Default | Role |
|---|---|---|
| Link Start Property ⚪️ | white circle | Captures the currently selected layer + its one highlighted property as the start. Turns 🟢 on success |
| Link End Property ⚪️ | white circle | Same capture for the end layer/property. Turns 🟢 on success |
| OK | — | Validates both ends, computes the steps, writes values to the in-between layers, closes the palette |
| Cancel | — | Closes the palette with no changes |

There are no numeric fields — all input comes from your Timeline selection at the moment you click each link button. Exactly **one** property must be highlighted when you click a link button; zero or multiple highlighted properties are rejected with an alert and the button stays white.

## Usage

1. Select the *start* layer and highlight exactly one property on it (click the word "Position" so the row is selected).
2. Run Iteratron and click **Link Start Property** — it should turn 🟢.
3. Select the *end* layer, highlight the same property, click **Link End Property** (⚪️ → 🟢). The palette is non-modal, so you can freely change Timeline selections while it's open.
4. Click **OK**. Iteratron counts the unlocked, visible layers strictly between the two layer indices and writes evenly interpolated values to each — at the current playhead time on properties that already have keyframes, as a static value otherwise.
5. On success the palette closes; one undo reverses the whole write.

## Notes

- Works in either direction — the end layer's index can be above or below the start layer's.
- The range is split into (valid layers + 1) equal segments, so the in-between layers land exactly on the even steps between your start and end values.
- Each in-between layer's property is resolved using the **start** layer's property path, which assumes the layers share that property structure — the normal case when ramping the same property across similar layers. A layer where the path doesn't resolve is simply left untouched.
- Multi-component values (Position, Scale, colors) are interpolated component-wise.

## Requirements & edge cases

- After Effects CS6 or later.
- Needs an active composition — every button guards for this and alerts "Please open or select a composition before using Iteratron." otherwise.
- Needs at least one unlocked, visible layer strictly between the start and end layers — otherwise "No valid layers found between start and end layers."
- The start and end layers themselves must be unlocked and visible at OK time, even if they linked successfully earlier.
- An in-between property that exists but can't vary over time is silently skipped (it still occupies its slot in the spacing, so the ramp stays even).
- If OK hits a validation alert, the palette stays open so you can fix the selection and try again.

## How it works

The script builds a non-modal `Window("palette")` — three rows: two label + status-button pairs and OK/Cancel — and shows it immediately. Each link button reads the active comp's `selectedProperties`, resolves exactly one property via `findDeepestSelectedProp()` (tracks the greatest `propertyDepth`; returns null on ties, which is what rejects ambiguous multi-selections), stores the selected layer's index, and serializes the property's location with `constructPropPathString()` — walking up `parentProperty` and collecting each level's `matchName` into a comma-joined path like `ADBE Transform Group,ADBE Position`.

OK opens the "Link Properties" undo group, re-resolves both endpoint properties via `getPropertyFromPath()` (splits the path and chains `.property()` calls, returning null if any segment fails), and validates that neither endpoint layer is locked or hidden. A first pass counts valid layers in the exclusive index range; `stepValue = (end − start) / (validLayers + 1)`, component-wise for arrays (detected with an ES3-safe `Object.prototype.toString` check). A second pass walks the same range, and for each valid layer with a resolvable, time-varying property writes `start + step × counter` — via `setValueAtTime(comp.time, …)` when the property has keys, `setValue(…)` otherwise — with `isFinite` guards refusing to write NaN/Infinity. The undo group closes and the palette closes.
