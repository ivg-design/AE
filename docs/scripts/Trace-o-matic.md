# Trace-o-matic
> Convert a layer's masks into a new shape layer with hold-keyframed paths and opacity, all styled at once by five master fill/stroke controls.

**Category:** paths · **Version:** 2.0.1 · **UI:** HEADLESS (no dialog — runs immediately on the selected layer)

## What it does

Turn a layer's masks into independent vector shapes on a brand-new shape layer. Each mask becomes its own shape group, and its path animation and opacity animation copy over as frame-by-frame ("hold") keyframes, so the traced shapes reproduce the original masks' silhouette and on/off timing exactly — handy for taking rotoscoped or hand-animated masks into shape-only workflows (Lottie/Bodymovin export, shape effects, easy duplication).

Rather than style each traced shape by hand, the script adds one set of master controls to the new layer's Effect Controls and expression-links every shape's fill and stroke back to them. Nudge any of the five controls and every traced shape updates at once. It runs in one undo step and is non-destructive — the source layer and its masks are left untouched.

## Controls & options

All styling happens through the five master controls the script adds to the generated shape layer. Every traced shape's paint is expression-linked to these:

| Control | Effect type | Default | Drives |
|---|---|---|---|
| Fill Color | Color Control | opaque red | Every shape group's Fill → Color |
| Fill Opacity | Slider Control | 100 | Every shape group's Fill → Opacity |
| Stroke Color | Color Control | opaque blue | Every shape group's Stroke → Color |
| Stroke Opacity | Slider Control | 100 | Every shape group's Stroke → Opacity |
| Stroke Width | Slider Control | 5 | Every shape group's Stroke → Stroke Width |

There is no per-shape override — every traced mask shares these five values.

**Selection:** exactly one layer with at least one mask (any mask mode is accepted).

## Usage

1. Select a single layer that has one or more masks.
2. Run Trace-o-matic.
3. A new layer named "Shapes from `<original layer name>`" appears, with one shape group per mask (named after the mask) and the five master controls in Effect Controls.
4. Adjust Fill Color/Opacity and Stroke Color/Opacity/Width to restyle all traced shapes at once.
5. The traced shapes hold-step through the same path and opacity timing the masks had; the source layer is unchanged.

## Notes

- Output is hold-keyframed by design — every copied key is set to HOLD interpolation for a frame-by-frame look.
- Every shape's paint links to the master controls by the new layer's name; renaming that layer breaks the links (re-run to rebuild).
- Cleanup runs automatically: consecutive opacity keyframes with the same value are thinned, and path keyframes that fall where opacity is zero (invisible) are dropped.
- Static masks (no keyframes) copy their constant path/opacity over once, so they produce a visible shape rather than an empty one.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active comp (else "No comp selected") and exactly one selected layer (else "Please select one layer").
- The selected layer must have at least one mask (else "No masks in selected layer").
- The tool is self-contained and creates only native AE effects — no pseudo-effects or external modules.

## How it works

After guarding for an active comp, a single selected layer, and at least one mask, the script opens the "Trace-o-matic" undo group and creates a new shape layer named "Shapes from <layer name>". It adds the five master controls (three Slider Controls, two Color Controls) to that layer, then iterates the source's `ADBE Mask Parade`. For each mask it adds a shape group with a path, fill, and stroke, sets expressions on the fill/stroke properties that read the master controls by effect name, and copies every path and opacity keyframe over with `valueAtTime` + `setValueAtTime`, forcing HOLD interpolation on both sides of each key (static masks copy their constant value once).

A final cleanup pass walks each group's opacity and path keys — removing consecutive duplicate opacity values and any path key that lands where opacity is zero — then closes the undo group.
