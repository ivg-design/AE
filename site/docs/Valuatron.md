# Valuatron
> Stamp a keyframe at the playhead for every selected property at once — capturing its current value, expressions included — in one undo.

**Category:** keyframes · **Version:** 2.0.1 · **UI:** HEADLESS (no dialog — runs immediately)

## What it does

Valuatron locks down values in time. Park the playhead where you want a keyframe, select one or more layers, highlight the property rows you want to affect (Position, Opacity, effect sliders — anything keyframeable), and run the script. Every selected property gets a keyframe at the current time holding its current evaluated value — for expression-driven properties, that's the value the expression is producing right now.

This is the classic "hold" or "anchor" move: freeze the animation at a value for a beat, or capture an expression's output as a real, editable keyframe at this instant. Because it sweeps every selected property on every selected layer in one pass, it's much faster than Option/Alt-clicking stopwatches property by property.

No dialog, no options. One immediate action wrapped in a single undo step, so one Cmd+Z / Ctrl+Z reverses the whole batch.

## Controls & options

There is no dialog and no settings — the inputs are the state of the AE UI when you run it:

| Input | Where it comes from | Requirement |
|---|---|---|
| Target time | Current time indicator | Position the playhead before running |
| Target layers | Selected layers | Select one or more layers |
| Target properties | Selected property rows | Highlight the specific properties in the Timeline panel (selecting a parent group like "Transform" is not enough) |
| Value written | The property's current evaluated value | Automatic — not user-editable |

## Usage

1. Move the playhead to the exact time you want the keyframe.
2. Select the layer(s) containing the properties.
3. In the Timeline panel, select the specific property rows (click "Position", Shift-click "Opacity", …).
4. Run Valuatron — it executes immediately, no dialog.
5. Each selected, keyframeable property now has a keyframe at the playhead with its current value.
6. Undo reverses the entire batch in one step.

## Notes

- Expression-driven properties: the keyframe captures the expression's *evaluated result*, not the underlying pre-expression value. The expression stays enabled afterward, so the new keyframe has no visible effect until you disable or remove the expression.
- Selected items that can't vary over time (a selected "Transform" *group*, or genuinely static properties) are silently skipped — only real keyframeable properties get keyframes.
- Zero external dependencies — a single small self-contained script.

## Requirements & edge cases

- After Effects CS6 or later.
- Requires an active composition — otherwise it alerts and exits without changing anything.
- Requires at least one selected layer — otherwise it alerts and exits.
- If a single property fails to read/write, the script alerts with that property's name and continues with the rest — one bad property doesn't abort the batch.
- Nothing persists between runs; each run depends only on the current selection and playhead.

## How it works

A single self-invoking function. It guards for an active `CompItem` and a non-empty `comp.selectedLayers` before opening the `"Valuatron"` undo group, then loops layers and each layer's `selectedProperties` (both genuine 0-based arrays in the AE object model). For every property whose `canVaryOverTime` is true, it reads `prop.value` (the post-expression evaluated value at `comp.time`) and calls `prop.setValueAtTime(comp.time, value)` — keyframe times are composition-relative, so no time-space conversion is needed. Each write is wrapped in a per-property try/catch that alerts and continues; the undo group closes after all layers are processed.
