# BurstMate
> Drop a fully rigged radial stroke-burst into your comp — two animated stroke layers driven entirely from one "StrokeBurst" control panel on a hidden BURST CTRL layer.

**Category:** effects · **Version:** 2.0.1 · **UI:** HEADLESS (no dialog — all tuning happens afterward in Effect Controls)

## What it does

BurstMate builds a ready-made starburst rig — impact bursts, badge decorations, energy pulses, transition accents — with one run and no setup. It creates three shape layers in the active comp: a hidden guide layer named **"BURST CTRL"** carrying a custom "StrokeBurst" effect with every tunable parameter, plus two visible spoke layers, **"Stroke 1"** and **"Stroke 2"**, each built from a two-point path, a stroke, and a repeater.

The point of the rig is single-panel control: every visual property of both stroke layers — colors, widths, spoke lengths, dash/gap patterns, spoke count ("Density"), and the rotation offset between the two stroke sets — is expression-linked back to the StrokeBurst effect on BURST CTRL. Select that one layer, open Effect Controls, and dial in (or keyframe) the whole burst. The "burst out" reveal is pre-animated with eased Trim Paths keyframes, and both stroke layers are parented to BURST CTRL, so moving or scaling the control layer moves the whole burst as a unit.

No layer selection is needed — the script only requires an active composition and always builds its own fresh three-layer rig.

## Controls & options

There is no dialog. Tuning happens on the **"StrokeBurst"** pseudo-effect on the "BURST CTRL" layer. Values the script sets on creation:

| Group | Control | Set on creation | Notes |
|---|---|---|---|
| — | Strokes Rotation Ofset | 25° (preset default) | Angle of Stroke 2's spokes relative to Stroke 1's. (The missing "f" is baked into the preset — that's its real name in Effect Controls.) |
| Color Properties | Stroke 1 / Stroke 2 Color | Red (preset default) | Edit freely |
| Width | Stroke 1 / Stroke 2 Width | 5 / 5 | Stroke line width |
| Length | Stroke 1 / Stroke 2 Length | 231.9 / 151.7 | Length of each spoke in pixels |
| Density | Stroke 1 / Stroke 2 Density | 14 / 7 | Number of spokes (repeater copies) per stroke set |
| Dashes | Stroke 1 Dash 1 / Gap 1 | 10 / 30 | First dash pattern for Stroke 1 (Dash 2/Gap 2 available, left at 0) |
| Dashes | Stroke 2 Dash 1 / Gap 1 | 20 / 10 | First dash pattern for Stroke 2 (Dash 2/Gap 2 available, left at 0) |

A small "Void" helper effect (Width/Height/Offset X/Y) also lands on BURST CTRL — it only drives the guide rectangle placeholder and isn't meant to be touched.

On the stroke layers themselves:
- Repeater **Copies** is expression-driven by Density — don't hand-edit it, the expression wins.
- Rotation per copy is derived as `360 / copies`, so spokes always distribute evenly.
- The Trim Paths keyframes (the reveal animation) are ordinary keyframes — retime or re-ease them freely.

## Usage

1. Make the target composition active (no layer selection needed).
2. Run BurstMate. Three layers appear: "BURST CTRL" (guide layer, excluded from render), "Stroke 1", and "Stroke 2" (both marked shy — toggle the Timeline's Shy filter if you don't see them).
3. Select **BURST CTRL** and open Effect Controls. Adjust colors, widths, lengths, density, dashes, and the rotation offset — everything can be keyframed.
4. Move/scale BURST CTRL's transform to reposition or resize the whole burst.
5. Retime the Trim Paths keyframes on the stroke layers if you want a different reveal.

## Notes

- Expressions reference `thisComp.layer("BURST CTRL").effect("StrokeBurst")(…)` **by name** — renaming the BURST CTRL layer or the StrokeBurst effect breaks the rig.
- Running the script again builds an additional, fully independent rig (layer names are not deduplicated) — it does not update an existing one.
- The rotation-offset control really is spelled "Strokes Rotation Ofset" in Effect Controls; the expressions reference the same spelling, so it works correctly.
- Stroke 2's rotation is chained to Stroke 1's rotation plus the offset, so rotating Stroke 1 rotates the whole burst pattern.

## Requirements & edge cases

- Requires an active composition; otherwise it alerts "Please select a composition first" and exits cleanly.
- Applies the pseudo-effects by writing a temp `.ffx` file and calling `applyPreset()`, so AE's "Allow Scripts to Write Files and Access Network" preference must be enabled and the temp folder writable.
- After Effects CS6 or later per the script header.
- Each run is additive — delete an old rig's three layers if you want to start over.

## How it works

One recorder-generated function wrapped in `try { beginUndoGroup("BurstMate"); …; endUndoGroup() } catch { alert }`. Two RIFX/FFX preset binaries (the "StrokeBurst" and "Void" pseudo-effects) are embedded as string literals; `applyFxFromBinary()` writes one to `Folder.temp` and applies it to a layer with `layer.applyPreset(ffxFile)`.

The build order: add the "BURST CTRL" shape layer, set `guideLayer = true`, give it a placeholder rectangle group, apply StrokeBurst, then initialize ten of its sliders by their auto-assigned property names (`Pseudo/stroke_burst-000N`), and apply the Void helper. Each stroke layer gets a two-vertex open path, a stroke with explicit dash/gap sub-properties, a disabled fill, a Trim Paths filter with hand-authored bezier-eased keyframes (via an `applyEasing` helper that builds `KeyframeEase` objects and calls `setTemporalEaseAtKey`/`setInterpolationTypeAtKey`), and a Repeater. Both layers are parented to BURST CTRL with `setParentWithJump()`.

Finally ~16 expressions are wired: the path expression rebuilds each spoke with `createPath()` at BURST CTRL's position with length from the matching Length slider; color/width/dash/gap read their StrokeBurst controls; Repeater copies read Density with per-copy rotation `360/copies`; and Stroke 2's layer rotation follows Stroke 1's plus the Strokes Rotation Ofset angle.
