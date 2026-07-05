# Controllerizer
> Gather any mix of selected properties — across any layers — onto one "Controller Null" as matching expression controls, all pre-set to their current values.

**Category:** layers · **Version:** 1.0.0 · **UI:** HEADLESS

## What it does

Controllerizer builds a one-stop control panel for a scene. Select properties on as many layers as you like (positions, rotations, opacities, colors…), run it, and a comp-long null called **Controller Null** appears (or is reused) carrying one expression control per property — Slider for 1D values, Angle for rotations, Point for 2D, 3D Point for 3D, Color for colors. Each control is seeded with the property's current value so nothing jumps, and each source property is wired to its control by expression. Animate everything from a single Effect Controls panel.

Re-running with new selections appends more controls to the same null, so the panel can grow with the project.

## Controls & options

The generated controls, by property type:

| Property value type | Control created | Control name |
|---|---|---|
| 1D (Slider-like) | Slider Control | `<Layer> \|N\| <Property>` (N = effect index) |
| 1D named *Rotation / X/Y/Z Rotation* | Angle Control | `<Layer> \|N\| <Property>` |
| 2D / 2D spatial | Point Control | `<Layer> \|\| <Property>` |
| 3D / 3D spatial | 3D Point Control | `<Layer> \|\| <Property>` |
| 3D spatial on a 2D layer | Point Control (X/Y only) | `<Layer> \|\| <Property>` |
| Color | Color Control | `<Layer> \|\| <Property>` |

Unsupported types (shape paths, text, gradients, property groups) are skipped and listed in a summary alert.

## Usage

1. Select the properties you want centralized (across any number of layers).
2. Run Controllerizer.
3. Open **Controller Null ▸ Effect Controls** and animate from there.

## Notes

- Links are by name — renaming "Controller Null" or a control breaks its expression. The `|N|` index in Slider/Angle names keeps same-named properties from colliding.
- Deleting a control leaves an erroring expression on the source property; delete the expression too.
- The null spans the comp duration and can be moved/parented freely (its transform isn't referenced).

## Requirements & edge cases

- Needs an open comp and at least one selected property (alerts otherwise).
- Keyframes already on a source property are overridden by the expression while it's active (standard AE behavior).

## How it works

Guards, then one undo group. It finds a layer named "Controller Null" (or `layers.addNull(comp.duration)` + rename). For each selected property it resolves the owning layer via `propertyGroup(propertyDepth)`, branches on `propertyValueType` to pick the control matchName (`ADBE Slider Control` / `ADBE Angle Control` / `ADBE Point Control` / `ADBE Point3D Control` / `ADBE Color Control`), adds it to the null's Effect Parade, seeds it with `setValue(current value)`, and writes the `thisComp.layer("Controller Null").effect("<name>")("<param>")` expression onto the source property. Per-property try/catch keeps one bad property from aborting the batch; skipped items are reported at the end.
