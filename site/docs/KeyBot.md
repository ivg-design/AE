# KeyBot
> Batch-edit selected keyframe values with =, +, −, ×, ÷ per axis — timing, easing, and interpolation stay exactly as they were.

**Category:** keyframes · **Version:** 2.0.1 · **UI:** PANEL (dockable palette)

## What it does

KeyBot applies one math operation to every selected keyframe at once — across all selected properties on all selected layers — without touching when the keyframes sit or how they ease. Tick the X/Y/Z checkboxes for the axes you want, type a number into the matching field, and click one of five operator buttons: `=` (set), `+` (add), `-` (subtract), `×` (multiply), or `÷` (divide).

That's the pitch: keep a keyframe's timing and interpolation exactly as they are and only change the value. Nudge every keyframe of a bounce 20 px higher after a client note, or multiply a Scale animation's amplitude by 1.5 across dozens of keyframes, without re-keying anything or dragging points in the graph editor.

It handles 1D, 2D, and 3D numeric properties. For vector values, X/Y/Z map to components 0/1/2; for single-value properties (Rotation, Opacity, sliders), the one value is driven by the X field. As a dockable palette it stays open between operations — select keyframes, click, select more, click again.

## Controls & options

| Control | Default | Meaning |
|---|---|---|
| X / Y / Z checkboxes | unchecked | Include that axis in the operation; also enables its input field |
| X / Y / Z input fields | empty, disabled until checked | The operand for that axis |
| `=` | — | Set the checked axes to the typed value |
| `+` | — | Add the typed value |
| `-` | — | Subtract the typed value |
| `×` | — | Multiply by the typed value |
| `÷` | — | Divide by the typed value (dividing by 0 leaves values unchanged) |

Unchecked axes are never written — their values pass through untouched. An input left blank is treated as 0.

## Usage

1. Run the script once to dock the KeyBot panel (it also runs as a floating palette).
2. Select one or more layers in the Timeline.
3. Select the animated property rows you want to edit (Position, Scale, Rotation, …).
4. Select the specific keyframes to modify — only individually selected keyframes are changed.
5. Check X/Y/Z for the axes you want, type the operand(s).
6. Click `=`, `+`, `-`, `×`, or `÷`.
7. All selected keyframes update in a single undo step named "KeyBot".

## Notes

- On 1D properties (Rotation, Opacity, Time Remap, slider/angle controls), only the **X** checkbox and field apply — Y and Z are ignored.
- On 2D properties, the Z checkbox has no effect even if checked.
- Mask/shape paths and Source Text aren't numeric and are skipped silently.
- Values are changed with `setValueAtKey`, so keyframe time, interpolation type, and ease handles are all preserved.
- The panel persists across comps — no need to relaunch between edits.

## Requirements & edge cases

- After Effects CS6 or later.
- Needs an active composition and at least one selected layer — each missing piece gets its own alert.
- A layer with no property rows selected is simply skipped, silently.
- If a selected property has keyframes but none are individually selected, nothing happens for that property (no alert) — select the keyframes themselves, not just the property.
- A selected numeric property with zero keyframes triggers a "No keyframes selected." alert and the run continues with the next property.

## How it works

One `buildUI(thisObj)` function builds the palette (docked `Panel` or standalone `Window('palette')`): three edittext fields, three checkboxes whose `onClick` toggles the matching field's enabled state, and five operator buttons that each call `processKeyframes(op)`.

`processKeyframes` guards for an active `CompItem` and non-empty layer selection, opens the "KeyBot" undo group, then loops `selectedLayers` → `layer.selectedProperties`. Properties are accepted if their `propertyValueType` is one of AE's five numeric types (OneD, TwoD, ThreeD, spatial or not). For each accepted property it walks keyframes 1-based, and for every `keySelected(k)` key reads `keyValue(k)`: array values are cloned with `.slice()` and components 0/1/2 recomputed per the checked boxes (Z only when the value has more than two components); scalar values are recomputed from the X input. `calculateNewValue()` is a plain switch over the five operators with a zero-division guard on `÷`. Results are written back with `setValueAtKey(k, value)`, which changes only the value — never the key's time or interpolation — and the undo group closes after all layers are processed.
