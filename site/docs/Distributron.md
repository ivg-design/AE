# Distributron
> Spread a comp's layers evenly along a shape-layer path — each one auto-rotating to follow the curve — and steer the whole arrangement live from one CTRL null.

**Category:** paths · **Version:** 1.1.2 · **UI:** HEADLESS (no dialog — rigs the selected path instantly)

## What it does

Distributron takes one shape layer's path and arranges every other layer in the composition along it, evenly spaced, with each layer automatically rotating to point along the curve. Select the shape layer that owns the path, run the script, and it builds a compact rig: the path layer is moved to the top of the stack, a **CTRL** null is created and parented to it, and every other layer is re-parented to CTRL and given expressions that walk it along the path.

Because the distribution is expression-driven rather than baked into keyframes, it stays **live** — animate or reshape the path and every distributed layer re-flows along the new shape automatically, no re-running required. All ongoing control lives on a single pseudo-effect named **Distribute Along the Path** on the CTRL null, where sliders and an angle dial let you jitter each layer's rotation, offset all rotations at once, trim distance off the start or end of the path, and pick which range of layer indices takes part. It's built for things like beads-on-a-string arrangements, icons or characters flowing along a hand-drawn curve, and radial or wavy layouts that keep tracking the path as it moves.

## Controls & options

Distributron is headless. Once it runs, everything is adjusted from the **Distribute Along the Path** effect on the **CTRL** null (select CTRL and open Effect Controls). The script fills in the three index/picker controls for you; the rest are yours to animate.

| Control | Type | Default | Set by script | Meaning |
|---|---|---|---|---|
| Randomize Rotation | Slider | 0 | — | Amplitude of a random per-layer rotation jitter added on top of the path-follow rotation |
| Rotation Offset | Angle | 0° | — | Degrees added to every distributed layer's rotation at once |
| Start Distribution Offset | Slider | 0 | — | Distance trimmed off the start of the path before layers are spread |
| End Distribution Offset | Slider | 0 | — | Distance trimmed off the end of the path |
| Distribution setup | Group | — | — | Twirl-down section header in the panel; no value of its own |
| First Layer Index | Slider | 0 | Yes → path layer's index + 1 | Lowest layer index treated as "first along the path" |
| Last Layer Index | Slider | 0 | Yes → total layer count | Highest layer index treated as "last along the path" |
| Distribution Path Layer | Layer picker | — | Yes → the shape/path layer | Points the rig at the layer whose path defines the curve |

Narrow **First / Last Layer Index** to distribute only a subset of layers; the layers whose indices fall in that range are the ones swept onto the path. (The layer-picker control's exact name carries a trailing space — `Distribution Path Layer ` — but you set it from the picker, not by typing.)

## Usage

1. Draw or place a path on a shape layer (e.g. with the Pen tool) in the target composition.
2. Add the layers you want distributed — icons, images, text, solids — to the same comp.
3. Select **only** the shape layer that owns the path (exactly one layer must be selected).
4. Run Distributron. There is no dialog; it executes immediately.
5. The script moves the shape layer to the top if needed, links a mask to its path, creates and configures the CTRL null, and parents plus expression-drives every other layer along the path.
6. Select **CTRL** and open Effect Controls to adjust Randomize Rotation, Rotation Offset, Start/End Distribution Offset, and the First/Last Layer Index range.

## Notes

- Distribution is fully live: animating the path, or animating its shape over time, makes every distributed layer re-flow along the new curve automatically.
- There is no per-layer picker for what gets distributed — every layer in the comp except the path layer and the newly created CTRL null is swept in and re-parented. Worth knowing before running it in a comp that already holds backgrounds, adjustment layers, or cameras; narrow the First/Last Layer Index range afterward to exclude them.
- All distributed layers are parented to CTRL, so moving, scaling, or rotating CTRL moves the whole arrangement as a group.
- The rig links a mask on the shape layer to the shape's own path and reads that mask by its actual created name, so a shape layer that already carries other masks still distributes correctly.
- The rig follows the path in 2D; per-layer Z depth isn't part of the distribution, which is inherent to building on a mask path.

## Requirements & edge cases

- Adobe After Effects CS6 or later; nothing in the tool requires a newer version.
- Needs an open composition as the active item and exactly one selected layer — otherwise it alerts `Please select exactly one shape layer with a path.` and exits cleanly.
- The selected layer should be a shape layer whose path is the first path in its first group (the default structure when you draw directly on a shape layer with the Pen tool). Other layer types, or shapes with the path reordered behind other content, won't bind a valid curve.
- Needs at least one other layer besides the shape layer to have anything to distribute; with none, CTRL and the mask are still created but nothing is placed.
- With exactly one distributable layer, First Layer Index equals Last Layer Index and that single layer's position/rotation expression can't resolve a spacing fraction. Give it at least two layers to distribute.

## How it works

Everything runs inside `main()` under an `app.beginUndoGroup("Distributron")`. It reads `app.project.activeItem` and its `selectedLayers`, requires exactly one selection, and moves that shape layer to the top with `moveToBeginning()` if it isn't already there. It then adds a mask to the shape layer and drives the mask path from the layer's own first path via the expression `thisLayer.content(1).content(1).path`, so the mask always mirrors the live shape.

A null named **CTRL** is created (`comp.layers.addNull()`), parented to the shape layer, and placed at the shape's anchor point. The **Distribute Along the Path** pseudo-effect — a RIFX/FFX binary embedded in the script — is installed onto CTRL through the bundled `ApplyFFX` module (write to temp file, `applyPreset()`). The script then sets three of its controls from the scripting DOM using the callable property-group shorthand: `Distribution Path Layer ` to the shape layer's index, `First Layer Index` to that index + 1, and `Last Layer Index` to the total layer count.

Finally it loops over the comp, and for every layer whose index falls in the First–Last range it sets `layer.parent = ctrlLayer` and assigns the same expression string to both **Position** and **Rotation**. That expression walks the mask's point array to measure total path length (`points()` plus a segment-length sum), reads the CTRL effect's controls with the expression-side `effect(name)(name)` accessor, computes each layer's arc-length target from its index relative to First/Last (offset by Start/End Distribution Offset), and samples `pointOnPath()` for position and `normalOnPath()` for the tangent. Rotation is `atan2` of the tangent in degrees, plus 90°, plus Rotation Offset, plus a Randomize Rotation jitter term; the shared string returns position or rotation by branching on `thisProperty.name`.
