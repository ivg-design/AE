# Centralizer
> Drop comp guides around anything — one shape, several multiselected shapes (combined bounding box), text, footage or a precomp — at its center, bounding box, and/or the layer anchor.

**Category:** paths · **Version:** 2.1.0 · **UI:** DIALOG (multiselect shape list + guide checkboxes)

## What it does

Centralizer adds alignment guides to the active composition from real geometry. For a **shape layer**, it lists every drawable item in the layer — bezier paths *and* parametric Rectangles, Ellipses and Polystars — with full group breadcrumbs. Pick one, or **Cmd/Ctrl-click several**: with a multiselection the guides describe the *union* bounding box of everything you picked, which is exactly what you want when a logo or rig spans multiple shapes.

For a **text, footage, precomp or solid layer**, the same options dialog appears and the bounds come from the layer's rendered extents (`sourceRectAtTime`), so a precomp is measured by what it actually shows.

Everything is converted to comp space through the layer's real transform chain, so parented, moved, or scaled layers still get correct guides. Guides land in one "Add Guides" undo step; the layer itself is never modified.

## Controls & options

| Control | Type | Default | Adds |
|---|---|---|---|
| Shape list | Multiselect list (shape layers only) | first item | Every path / rect / ellipse / star leaf, labeled `Group ▸ … ▸ Name [kind]`. Cmd/Ctrl-click for multiple; guides use the combined box. |
| Center | Checkbox | checked | Guides at the layer's Anchor Point in comp space (the layer anchor, not the shape center). |
| BBox Center | Checkbox | unchecked | Two guides at the (union) bounding-box center. |
| BoundingBox | Checkbox | unchecked | Four guides (left / right / top / bottom) at the (union) bounding extents. |
| Proceed | Button | — | Adds the checked guides and closes. |
| Cancel | Button | — | Closes with no changes. |

KBar still works headlessly on text/AV layers with the `Center` / `BoundingBox` button arguments.

## Usage

1. Select a layer — shape, text, footage, precomp or solid.
2. Run Centralizer.
3. Shape layer: click the shape you want, or Cmd/Ctrl-click several for a combined box.
4. Check any mix of Center, BBox Center, BoundingBox and hit Proceed.

## Notes

- Parametric shapes are measured from their properties: Rect/Ellipse from Size around Position, Polystar from its Outer Radius (a circle-bound approximation for the spokes).
- Bezier paths are measured from their vertices; extreme curve bulges beyond the vertices are not included (same fidelity as before).
- Group offsets (Transform ▸ Position/Anchor) are accounted for; group Scale/Rotation are not — boxes are approximate inside scaled or rotated groups.
- With a rotated layer, guides stay axis-aligned to the comp: the converted extremes are re-min/maxed, so the box bounds the rotated shape.
- Measurement uses one temporary Point Control for the comp-space conversion; it's removed immediately.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Needs an active comp and at least one selected layer (alerts otherwise). Only the first selected layer is used.
- A shape layer with no paths or parametric shapes reports "No paths or parametric shapes found."
- Proceed with an empty list selection alerts and keeps the dialog open.
- Camera/light layers have no measurable bounds and are declined politely.

## How it works

The shape branch walks `Contents` recursively, collecting `ADBE Vector Shape - Group/Rect/Ellipse/Star` leaves with their name chains, flattened into a multiselect ScriptUI listbox. On Proceed each picked leaf is re-resolved from its chain (live references go stale), measured in ExtendScript — path vertices min/maxed, or parametric Size/Radius around Position — then shifted by the accumulated `(position − anchor)` of its ancestor Vector Groups into layer space, and union-merged across the selection. Non-shape layers use `sourceRectAtTime(time, false)` instead.

The layer-space box corners and center are converted to comp space via a throwaway Point Control whose expression evaluates `thisLayer.toComp([x, y])` (an equivalent one converts the anchor for the Center option), then `activeItem.addGuide()` places each checked guide (orientation 1 = vertical, 0 = horizontal). No slider rig, no leftover effects.
