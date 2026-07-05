# RandoMatic
> Replace every selected keyframe's value with a fresh uniform-random number inside a per-axis range you type in — timing, interpolation, and easing untouched.

**Category:** utilities · **Version:** 2.0.0 · **UI:** DIALOG (per-axis Start/End range fields, OK / Cancel)

## What it does

Randomize the values of keyframes you've already selected, without disturbing their time, interpolation, or easing. Instead of re-keying a shaky-cam pan or a flickering opacity by hand, select the keyframes, run RandoMatic, type a low/high range for each axis, and click OK — every selected keyframe on every selected property gets its own independent value drawn uniformly from that range.

The dialog is dimensionality-aware: it inspects your selection up front and shows exactly the range rows you need — one X row for 1D properties like Opacity or Rotation, X+Y for 2D Position/Scale, X+Y+Z for 3D. Each keyframe is drawn independently, so a Position with three selected keyframes gets three different random positions, not one repeated value.

## Controls & options

| Control | Meaning | Default |
|---|---|---|
| Start Range X / End Range X | Low/high bound for axis 0 (or the whole value on a scalar property). | 0 / 100 |
| Start Range Y / End Range Y | Bounds for axis 1 — shown only if any selected property is 2D or 3D. | 0 / 100 |
| Start Range Z / End Range Z | Bounds for axis 2 — shown only if any selected property is 3D. | 0 / 100 |
| OK | Validates the ranges, then rewrites every selected keyframe on every selected property in one undo step. | — |
| Cancel | Closes with no changes. | — |

Ranges accept negatives (e.g. -50 to 50), and a start above its end still works — the spread is just negative.

## Usage

1. Make the composition active.
2. In the Timeline, select the properties to randomize (Position, Scale, Rotation, Opacity…), then select the individual keyframes to affect.
3. Run RandoMatic — the dialog shows one range row per axis needed across your selection.
4. Type a start and end for each shown axis (defaults 0/100).
5. Click OK — every selected keyframe is independently rewritten with a new uniform-random value in your range, grouped into one "RandoMatic" undo step.

## Notes

- Every keyframe is an independent uniform draw — values aren't correlated or smoothed across keyframes.
- The axis rows are always labeled X / Y / Z regardless of what the property's components represent.
- Aimed at numeric and vector properties (Position, Scale, Rotation, Opacity); it rewrites values on keyframes that already exist rather than creating new ones.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active comp (else "Please select a composition") and at least one selected property (else "Please select some keyframes").
- All range fields must parse as numbers, or it alerts "Please enter valid numbers for the range" and leaves the dialog open.
- A selected property with no individually-selected keyframes is silently skipped.

## How it works

The script guards for an active comp and a non-empty property selection, then scans those properties to find the maximum dimensionality (the array length of each property's value, or 1 for scalars) and builds that many Start/End range rows. On OK it parses every field with `parseFloat`, rejects any non-numeric input, then opens the "RandoMatic" undo group and loops each selected property: for every selected key it builds a value with the standard `start + random × (end − start)` formula — an array for vector properties, a single number for scalars — and writes it with `setValueAtKey`. No expressions and no new keyframes; only existing selected keys are rewritten.
