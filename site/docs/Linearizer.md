# Linearizer
> Drive an existing keyframed animation from any slider, position, or rotation — the keyframes become a value map, so scrubbing the driver scrubs the animation.

**Category:** animation · **Version:** 1.5.8 · **UI:** DIALOG (main window is a floating palette; the axis chooser is a modal dialog)

## What it does

Linearizer takes a property that already has two or more keyframes (the "target") and rewires it so its value is driven by another property (the "driver") instead of time. Each pair of adjacent keyframes becomes a segment; as the driver sweeps across a Min/Max range you define, the generated expression finds the segment the driver value falls into and linearly interpolates the original keyframe values across it. The result: dragging a slider, moving a null, or rotating a dial now plays an animation you authored with ordinary timeline keyframes — the classic rig-building move for putting multi-frame animation on a single control.

It handles 1D properties (Opacity, Rotation, sliders), 2D/3D properties (Position, Scale, Anchor Point — driven per axis), and Shape/Mask path properties, where vertices and tangents are interpolated between path keyframes (with Hold keyframes preserved as hard cuts). It can apply to many target properties in one batch, and it computes one shared timing frame across the whole batch so staggered sequences — a row of text layers popping on one after another — stay staggered after being re-driven.

After applying, a **"Uniform Interpolation"** checkbox appears on the driver layer's Effect Controls: toggle it to switch every linked property between *relative* spacing (segments proportional to original keyframe timing) and *even* spacing (equal segments) — live, without reopening the script.

## Controls & options

| Control | Where | Meaning |
|---|---|---|
| Select Target Property | Palette (only shown when nothing with keyframes was pre-selected) | Captures the currently selected property as the single target. Needs ≥2 keyframes and a compatible type. Click again to deselect |
| *(batch mode — no button)* | Palette | If you pre-selected one or more properties with ≥2 keyframes before running the script, they all become targets and the Target button is skipped |
| Select Driver Property | Palette | Captures the selected property as the driver. Selecting an effect header (e.g. "Slider Control") resolves to its value parameter. Multi-dimensional drivers open a "Select Property Dimension" dialog (X/Y/Z/W radio buttons) to pick the driving axis |
| Min Value / Max Value | Palette text fields | The driver-value range that maps end-to-end across the target's keyframes. Replace the placeholder text with numbers |
| Apply Linear Expression | Palette | Creates the checkbox controller and writes the expression(s), all in one undo group |
| Cancel | Palette | Closes with no changes |
| "Uniform Interpolation …" checkbox | Effect Controls on the **driver layer** (created by Apply) | Toggles all linked properties between relative and even segment spacing. Named `Uniform Interpolation ||<layer>><property>` for a single target, `Uniform Interpolation || Multiple Properties` for a batch |

## Usage

1. Open the composition containing the animation to re-drive.
2. Either pre-select one or more keyframed properties in the Timeline and then run the script (batch mode), or run the script first and use **Select Target Property**.
3. Select the property that should drive the animation (a Slider Control, Position, Rotation, …) and click **Select Driver Property**. Pick the axis if asked.
4. Type the **Min Value** and **Max Value** — the driver range that spans the full keyframe sequence.
5. Click **Apply Linear Expression**.
6. Scrub the driver: the animation follows. Toggle the new **Uniform Interpolation** checkbox on the driver layer at any time to switch between relative and even spacing.

## Notes

- The Uniform Interpolation checkbox is not a palette control — it's an AE effect created by Apply, meant to be flipped afterward in Effect Controls.
- Shape-path targets sample the path data at the original key times inside the expression rather than baking coordinates, so later edits to the path keyframes flow through.
- Batch runs share one timing scale: even-spacing mode distributes segments across the combined keyframe times of all targets, keeping staggered layers staggered.
- Re-applying with the same target/driver pair reuses the existing checkbox controller instead of stacking a duplicate.
- The generated expressions are self-contained ES3 — the keyframe values, timing tables, and hold flags are baked into the expression text, so no external files are needed.

## Requirements & edge cases

- After Effects CS6 or later.
- Needs an active composition, or the script alerts and exits.
- Every target needs at least 2 keyframes — in batch mode a single under-keyframed property aborts the whole run with an alert before anything is changed.
- Color, text, and grouped properties are rejected up front in both modes ("Linearizer doesn't work with color, text, or grouped properties…"). 1D, 2D, and 3D numeric properties, plus shape/mask paths, are supported.
- The driver must resolve to a numeric value; cancelling the axis dialog safely aborts driver selection.
- Min/Max must parse as numbers, or Apply alerts and stops.
- The generated expression references the driver layer and the checkbox effect **by name** — renaming either afterward breaks the link.
- One undo cleanly reverts a full Apply (checkbox creation plus all expression assignments are in a single undo group).

## How it works

`main()` guards for an active comp, snapshots `comp.selectedProperties` (filtered to real `Property` objects), and builds the palette in single-target or batch mode accordingly. Target selection resolves the deepest selected property and validates keyframe count and value type; driver selection additionally drills effect groups down to their value child (`resolveDriverValueProperty`), classifies dimensionality, and stores the chosen axis on the driver as a `dimensionIndex`.

`getPropertyExpressionPath()` walks `parentProperty` from the driver up to its layer, producing the `thisComp.layer("…")("…")…` reference (plus an `[axis]` suffix) read at the top of every generated expression. Keyframes are captured as `{value, time, in/out interpolation}`; `buildTimingContext()` merges all targets' key times into one sorted list and overall span, which powers both the `relativeTimes` and `evenTimes` tables baked into each expression.

`createExpression()` emits a self-contained expression per target: clamp the driver into Min/Max, choose the segment, and either hard-cut (Hold) or linearly interpolate — per axis for 2D/3D, or vertex/tangent-wise via a `readPathAtKey()` sampler and `createPath()` for shapes. The even/relative choice is read live from the driver layer's Checkbox Control. Apply wraps checkbox creation and all `expression` assignments in a "Linearizer" undo group with a guard flag so the group closes exactly once even on errors. A hand-rolled serializer replaces `JSON.stringify` for baking arrays into the expression text, keeping everything ES3-safe.
