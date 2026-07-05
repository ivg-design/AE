# TimeWarp-a-tron
> Drive a layer's Time Remap from a single 0–100 slider that scrubs it through an in/out frame range you set — framerate-correct, keyframe-free, and shareable across layers.

**Category:** layers · **Version:** 2.0.1 · **UI:** DIALOG (two-button pick: time-remapped layer → controller)

## What it does

TimeWarp-a-tron gives a time-remapped layer a single **0–100 slider** that scrubs it through an in/out frame range you define — no Time Remap keyframes, no hand-written expression. Point the tool at a layer that already has Time Remapping enabled, point it at a second layer to hold the controller, and it links the two with a generated expression: the slider's 0–100 value is remapped into a time (in seconds) between your in-point and out-point, and that time drives the source layer's Time Remap.

To keep the in/out boundaries adjustable without touching the expression, the tool adds a repurposed Point Control named **In/Out Range** to the source layer. Its X and Y values stand in for the start and end frame numbers (not a screen position), defaulting to frame 0 and frame 60. The expression converts those two frame numbers to seconds using the comp's frame rate, so the boundaries always track whatever you dial into that point control.

The dialog is a two-button pick flow. The first button starts red and turns green once you've selected a valid time-remapped layer; the second turns green once a controller is established (either an existing Slider Control you select, or a new one the tool creates). OK does its work only when both buttons are green. Because the controller is just a slider, one controller layer can drive several time-remapped layers at once.

This is for motion designers who want a single scrubber — a slider rig, a custom panel, or a puppet control — to drive a clip's playback position without animating Time Remap by hand.

## Controls & options

| Control | Meaning | Default |
|---|---|---|
| Pick Time Remapped Layer (button) | Captures the selected layer's Time Remap property. Turns from red to green on success. | — |
| Pick Time Remap Controller (button) | Captures or creates the controller Slider Control. Turns from red to green on success. | — |
| OK | Writes the linking expression once both buttons are green. | — |
| Cancel | Closes the dialog with no changes. | — |
| **In/Out Range** — Point Control added to the source layer | X = in frame, Y = out frame (a number pair, not a screen position). | `[0, 60]` |
| **`<Source Layer>` \|\| Time Control** — Slider Control added to the controller layer | Driven 0–100 to scrub between the in/out frames. | `0` |

The controller slider is named after the source layer. If the time-remapped layer is **Clip.mov**, the tool looks for (or creates) a slider named `Clip.mov || Time Control` on the controller layer.

## Usage

1. Enable Time Remapping on your source layer (Layer → Time → Enable Time Remapping).
2. Run TimeWarp-a-tron with that layer selected. Click the first button — it turns green if the layer qualifies.
3. Select the layer that should host the controller — an existing layer with a Slider Control, or any layer to receive a new one — then click the second button. If no slider is found, confirm the prompt to add one. The button turns green on success.
4. Click **OK**. This adds (or reuses) the **In/Out Range** point control on the source layer, adds (or reuses) the slider on the controller layer, and writes the linking expression onto the source layer's Time Remap.
5. Drive the slider from **0 to 100** — by hand, expression, or rig — to scrub the source layer's time between the boundaries.
6. Adjust the **In/Out Range** point control's X and Y (in frames) at any time to redefine the boundaries; the expression recalculates live.

## Notes

- **In/Out Range is a Point Control used as a number pair.** Its X and Y hold the in-frame and out-frame — a common trick, since After Effects has no built-in two-value numeric control other than Point/Point3D.
- **Sharing one controller across layers.** Because the controller is just a slider, several time-remapped layers can reference the same one for synchronized scrubbing. The auto-generated slider name is scoped to a single source layer, so to reuse one shared slider select that slider's effect header on the controller layer when picking the controller — the tool then adopts it directly instead of creating a per-layer-named one.
- The frame rate used to convert frames to seconds is read from the active comp when the expression is written. The in/out frames themselves stay live (the expression re-reads the In/Out Range point control every frame), but if you later change the comp's frame rate, re-run the tool so the conversion matches.

## Requirements & edge cases

- Needs an active composition and a layer selected at each pick-button click.
- The source layer must have Time Remapping enabled (`canSetTimeRemapEnabled`); otherwise the first button alerts "Please select a layer with Time Remapping enabled."
- Pick the time-remapped layer before the controller — the second button alerts "Please pick a Time Remapped Layer first." if you don't.
- OK requires both a valid time-remapped layer and a valid controller; otherwise it alerts and does nothing.
- The generated expression binds both layers **by name**. Renaming the source or controller layer afterward breaks the expression (After Effects shows a red expression error), so rename before running or re-run the tool to rebind.

## How it works

The tool is one IIFE wrapped in a "TimeWarp-a-tron" undo group. `createUI()` builds the modal dialog and blocks on it; four variables (`timeRemapPropPath`, `controllerLayer`, `controllerProp`, `controllerName`) are shared across the button handlers by closure.

Picking the source layer stores its `ADBE Time Remapping` property when `canSetTimeRemapEnabled` is true. Picking the controller computes the target name `<source layer> || Time Control` and looks for an existing effect by that name via `findEffectByName()`; failing that, it adopts a Slider Control you've selected (normalizing the selection up to the effect header if you clicked the inner "Slider" value row) or offers to add a new one.

On **OK**, it ensures the source layer has an `ADBE Point Control` named **In/Out Range** (seeded to `[0, 60]`), ensures the controller has its slider, then builds the expression string. That expression defines a `linearExpression()` helper and reads `effect("In/Out Range")("Point")` for the `[inFrame, outFrame]` pair and `effect("<controller>")("Slider")` for the 0–100 value; it divides the two frames by the comp's `frameRate` to get seconds and linearly maps the slider from 0–100 into that second range. The result is assigned to the source layer's Time Remap `expression`.
