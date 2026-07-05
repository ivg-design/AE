# NullBot
> Parent a whole group of layers to one master null placed at their average position — then move, scale, or rotate the group from a single handle.

**Category:** layers · **Version:** 2.0.0 · **UI:** HEADLESS (no dialog — runs immediately on the current selection)

## What it does

Rig a group of layers to a single master control in one step: select any number of layers, run NullBot, and it creates one null at the averaged position of the selection and parents every selected layer to it. Nudge, scale, or rotate that null and the whole group follows — no hunting for a parent layer, no eyeballing where to place the control.

The null is sized to the selection it drives. Its in-point is set to the earliest in-point among the selected layers and its out-point to the latest out-point, so the control is on screen exactly as long as any layer it drives (time-reversed layers are normalized so the span stays correct). If any selected layer is 3D, the null is created as a 3D layer too. Finally the null is lifted to sit just above the topmost selected layer rather than wherever a freshly created layer lands.

There is no dialog and nothing to configure — it's built to be bound to a keyboard shortcut and used repeatedly while rigging.

## Controls & options

NullBot is headless. The "controls" are the selection state when you run it, and the null it creates is always named `NullBot`.

| Requirement | Meaning |
|---|---|
| Active composition | The active item must be a comp, or the script alerts and exits. |
| At least one selected layer | The selection drives the average position, the 3D flag, and the timing span. |
| (implicit) 3D layers | If any selected layer is 3D, the created null is set to 3D. |
| (implicit) Reversed layers | Layers with negative stretch are handled so the combined in/out span is still computed correctly. |

## Usage

1. Select one or more layers in the Timeline.
2. Run NullBot (File ▸ Scripts ▸ NullBot.jsx, or a bound shortcut).
3. A new null named `NullBot` appears at the averaged position of the selection, with in/out points spanning the earliest-to-latest selected layer.
4. Every originally selected layer is now parented to `NullBot` — moving, scaling, or rotating it drives the whole group. The whole operation is a single undo step.

## Notes

- The null is always named `NullBot`; there is no rename option in the script.
- Position is averaged from each layer's X and Y only, and the null is placed at the top of the layer stack near the layers it controls.
- The tool operates purely on layer transform, timing, and hierarchy — it never adds expressions, effects, or keyframes, so the result stays fully portable.

## Requirements & edge cases

- Requires an active composition — alerts "Please select a composition!" otherwise.
- Requires at least one selected layer — alerts "Select at least one layer!" otherwise.
- Works with any layer type that exposes Position, in/out points, and index (AV, Shape, Text, Null). Averaging uses X/Y, so it's aimed at grouping 2D or predominantly 2D layers.
- No version gate — nothing it uses requires anything beyond long-standing After Effects scripting APIs.

## How it works

NullBot runs top-to-bottom inside a single "NullBot" undo group, after two guards (active comp, at least one selected layer). One pass over the selection accumulates four things at once: a running X/Y position sum for the average, a 3D flag (true if any layer's `threeDLayer` is set), the earliest in-point and latest out-point (with a stretch-aware swap so time-reversed layers normalize correctly), and the smallest layer index seen (the topmost selected layer).

It then creates the null with `comp.layers.addNull()`, sets its 3D flag and its position to the computed average, parents each selected layer with a simple `layer.parent` assignment, moves it above the topmost selected layer via `moveBefore()`, and narrows its in/out points to the selection's actual span. No expressions, matchNames, or pseudo-effects are involved anywhere.
