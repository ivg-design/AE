# PathDuplitron
> Copy the easing and tangent feel of one layer's Position keyframes onto another's, using AE's own keyframe clipboard so ease and tangents transfer intact.

**Category:** paths · **Version:** 2.0.1 · **UI:** PANEL (dockable — Copy / Paste / Close)

## What it does

Copy the velocity character of one layer's Position keyframes — their temporal ease, spatial tangents, and interpolation type — onto another layer's Position keyframes, so two different motion paths share the same feel without hand-matching each velocity graph. It's a small dockable panel with three buttons: Copy, Paste, Close.

Under the hood it drives After Effects' own keyframe clipboard. Copy validates your selection and fires AE's Edit ▸ Copy on the selected Position keyframes; Paste validates the target and fires Edit ▸ Paste. Because AE's keyframe round-trip already carries the complete ease, spatial tangents, and interpolation type, nothing is read or rebuilt in script — the data is preserved by AE itself, and the menu commands are resolved by name so they stay correct across AE versions.

## Controls & options

| Control | Type | Meaning |
|---|---|---|
| Copy | Button | After the selection guards pass, runs AE's Edit ▸ Copy on the selected Position keyframes, placing them on the clipboard with full ease/tangent data. |
| Paste | Button | Re-checks the guards, then runs AE's Edit ▸ Paste onto the target layer's selected Position keyframes. |
| Close | Button | Dismisses the panel. |

**Selection requirements** (Copy and Paste): an active composition, one selected layer with a Position property, and at least one selected keyframe on that property.

## Usage

1. Select the source layer and select one or more of its Position keyframes.
2. Click Copy.
3. Select the target layer and select the destination Position keyframe(s).
4. Click Paste.
5. Click Close when done.

## Notes

- The transfer is AE's native keyframe Copy/Paste, so temporal ease, spatial tangents, and interpolation type all come across — including the Z component of 3D Position.
- The panel is dockable and can stay open for repeated copy/paste passes.
- Each Copy or Paste lands as its own entry in AE's Undo history (the operations aren't wrapped in a single undo group).

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active comp, a selected layer with a resolvable Position property, and at least one selected keyframe — each missing piece produces its own alert and a clean exit.
- A Position property with no keyframes yields an empty selection, so Copy/Paste alerts "Please select one or more keyframes."

## How it works

The whole tool is one function that builds a dockable `palette` window with Copy / Paste / Close buttons. `copyTangents()` guards for an active comp, a selected layer, a Position property, and at least one selected keyframe, then resolves Edit ▸ Copy via `app.findMenuCommandId("Copy")` and runs it with `executeCommand` — AE copies the selected Position keyframes with their full ease/tangent data. `pasteTangents()` re-runs the same guards and fires the resolved Paste command onto the target Position property. No temporary layers, no per-keyframe reads, no expressions — AE's clipboard does the work.
