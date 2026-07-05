# Rectangulator
> Convert a parametric (Rectangle tool) rectangle into a bezier shape with independent per-corner rounding and a 9-point anchor grid — all driven by a "Rectangulator Controls" effect.

**Category:** layers · **Version:** 2.1.5 · **UI:** HEADLESS (no dialog — runs immediately on the selected shape layer)

## What it does

Convert a parametric rectangle — the kind AE's Rectangle tool makes, with a single Roundness value and a fixed center anchor — into a fully custom bezier shape whose four corners round independently and whose anchor can sit at any of nine reference points. The replacement can have a sharp top-left corner and a fully rounded bottom-right corner at the same time, and can be anchored from any of its nine grid points for scaling and rotation.

So you can reshape and animate it without editing the path or writing expressions, the script attaches a custom "Rectangulator Controls" effect to the layer: two size sliders, four corner-rounding sliders, and a nine-item anchor popup, right in Effect Controls. The new shape's path, anchor, and position are all expression-driven from those controls, so animating the rectangle is just keyframing sliders. The original rectangle's fills, strokes (color, opacity, width, caps/joins, miter), and group transform are copied onto the new "Parametric Rectangle" group first, so nothing changes visually at conversion — only the underlying representation and the available controls do.

## Controls & options

After conversion, everything lives on the layer as the **Rectangulator Controls** effect. Names below are exact, including two quirks inherited from the effect definition (noted).

| Control | Type | Default | Range | Purpose |
|---|---|---|---|---|
| Rectangle Width (px) | Slider | 100 | 0–1,000,000 | Overall shape width; feeds the path, anchor, and position. |
| Rectangle Height (px) | Slider | 100 | 0–1,000,000 | Overall shape height. |
| Top Left Corner Rounding | Slider | 0 | 0–100% | Roundness of the top-left corner. |
| Top Right Corner Rounding | Slider | 0 | 0–100% | Roundness of the top-right corner. |
| Bottom Right Left Corner Rounding | Slider | 0 | 0–100% | Roundness of the bottom-right corner. The label reads "Bottom Right *Left*" — a naming quirk carried from the effect definition. |
| Bottom Left Corner Rounding | Slider | 0 | 0–100% | Roundness of the bottom-left corner. |
| Anchor Point (label has a trailing space) | Popup, 9 items | Center | — | Which of nine reference points the anchor is measured from: Top Left / Top Center / Top Right / Center Left / Center / Center Right / Bottom Left / Bottom Center / Bottom Right. The chosen corner stays pinned as Width/Height change. |

All seven controls are keyframeable.

## Usage

1. Create or locate a shape layer containing a parametric rectangle (AE's Rectangle tool).
2. Select that shape layer.
3. Run Rectangulator — no dialog; it runs immediately.
4. The rectangle (including inside nested/named groups) becomes a "Parametric Rectangle" group with the same fill/stroke/transform, the Rectangulator Controls effect is attached, and the original rectangle is removed.
5. In Effect Controls, adjust Rectangle Width/Height, the four corner-rounding sliders, and Anchor Point. Keyframe any of them to animate.

## Notes

- On creation the controller is **seeded from the original rectangle** — Width/Height from its Size, all four corner sliders from its Roundness (as a percentage of the shorter side) — so the rigged path replaces the parametric rectangle exactly, at its original size and position.

- Only the first rectangle found (depth-first) is converted per run; a layer with several separate rectangles needs one run each.
- Re-running on the same layer stacks a second identically named "Rectangulator Controls" effect — delete the previous one first, since AE resolves duplicate effect names to the first match.
- Corner-anchored resizing is handled by the anchor-point expression: as Width/Height change, the anchor recomputes so the selected corner stays put.
- The effect is embedded pseudo-effect data and the script is self-contained, so the result travels with the project.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active comp (else "Please open a composition first.") and a selected shape layer (else "Please select a shape layer with a rectangle.").
- Requires a detectable rectangle under the layer's contents — directly, inside a group named with "Rectangle", or nested arbitrarily deep — else "No rectangle found in the selected shape layer."
- Only the first selected layer is used if several are selected.
- A rectangle nested inside a parent group that has non-default rotation or scale may seed a slightly off initial position, since the starting position sums parent positions only.

## How it works

Guards run first (active comp → selected layer → shape layer → a rectangle exists under `ADBE Root Vectors Group`). `findRectangle()` walks the contents tree depth-first for an `ADBE Vector Shape - Rect`, records its size/position/roundness, and computes a composite starting position from ancestor group positions. Inside the "Rectangulator" undo group, it reads the original fills/strokes/transform, adds a new "Parametric Rectangle" group with a generic bezier path, re-creates the fills and strokes, and copies the transform.

It applies the embedded "Rectangulator Controls" pseudo-effect via `applyPreset()` first (preset application invalidates existing property references, so the group is built afterwards from fresh ones), then attaches three expressions: the path expression reads all seven controls, clamps the corner percentages against physical limits, and builds an eight-vertex rounded rectangle with `createPath()`; the anchor-point expression maps the 1–9 popup to an offset from the size controls; the position expression is a passthrough, since corner pinning is handled entirely by the anchor. Finally it removes or disables the original rectangle group with escalating fallbacks so a cleanup failure never leaves the layer broken.
