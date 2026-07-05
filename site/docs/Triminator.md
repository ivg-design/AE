# Triminator
> Add a Trim Paths effect — pre-keyframed 0→100% for an instant reveal — to a shape layer's contents, or to whichever specific shape groups you've selected.

**Category:** utilities · **Version:** 2.0.0 · **UI:** HEADLESS (no dialog; Shift modifier read at launch)

## What it does

Drop a Trim Paths effect on a shape's contents and pre-keyframe it from 0% to 100% for an instant reveal/wipe — the thing motion designers otherwise do by hand every time. Select one or more shape layers, run Triminator, and each gets a Trim Paths on its top-level contents with a ready-to-retime "grow-in" animation.

It also honors targeted selections: drill into a layer's shape hierarchy in the Timeline and select specific shape Groups, and Triminator adds a separate Trim Paths inside each selected group's own contents instead of at the layer root — so you can trim one letter in a lettering rig or one icon in a set independently. Hold Shift while launching to add the effect only, with no keyframes, leaving Start/End at their defaults for you to animate. Non-shape layers in a mixed selection are silently skipped, so it's safe to run across several layer types at once.

## Controls & options

The only explicit control is a keyboard modifier read at launch:

| Control | Effect |
|---|---|
| (no modifier) | Adds Trim Paths **and** writes 0%→100% keyframes on Start and End, from the layer's in-point to one second later. |
| Shift (held while launching) | Adds Trim Paths only — Start/End stay at their defaults, no keyframes. |

Selection state acts as an implicit control:

| Selection | Result |
|---|---|
| Layer(s) selected, no shape groups drilled into | One Trim Paths added to each layer's root contents. |
| Shape Group(s) selected inside a layer | A separate Trim Paths added inside each selected group's own contents. |
| Non-shape layer in the selection | Silently skipped — no alert, no effect. |

## Usage

1. Select one or more shape layers in the active comp.
2. Optional: expand a layer's tree and select specific shape Groups to trim a sub-shape rather than the whole layer.
3. Run Triminator (hold Shift to skip keyframes).
4. Open Effect Controls or the Timeline to see the new Trim Paths effect(s).
5. Retime the generated keyframes — or add your own, if you used the Shift variant.

## Notes

- Shift is sampled once, at launch — hold it as you invoke the script (via shortcut or button); holding it later has no effect.
- The keyframe ramp is a fixed one second from the layer's in-point, not the full comp/layer duration; retime it as needed.
- Re-running on the same layer/selection adds a second, independent Trim Paths (they stack) — delete the previous one if you don't want two.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active comp (else "Please select a composition!") and at least one selected layer (else "Please select some layers!").
- Only true shape layers are processed; any other selected type (footage, text, camera, light, precomp) is skipped with no alert.
- Selecting a shape item that isn't a Group (a Fill, Stroke, Transform, or raw path) is handled gracefully — no effect is added for that item, and no error is raised.

## How it works

The single function reads the Shift state first (`ScriptUI.environment.keyboardState.shiftKey`), guards for an active comp and a non-empty selection, then opens the "Add Trim Paths" undo group. Each selected layer is checked for `matchName === "ADBE Vector Layer"` (non-shape layers are skipped), and its selected properties are scanned for named-group items. With no groups selected it targets the layer's `ADBE Root Vectors Group`; with groups selected it targets each group's own `ADBE Vectors Group`.

For each target it adds an `ADBE Vector Filter - Trim` and, unless Shift was held, writes two keyframes each on `ADBE Vector Trim Start` and `ADBE Vector Trim End` via `setValuesAtTimes` — 0% at `layer.inPoint`, 100% one second later — then closes the undo group.
