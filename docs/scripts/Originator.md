# Originator
> Recenter a shape layer's bezier path origin on (0,0) so it scales and rotates predictably — instantly for a single path, or via a tree-view picker when several exist.

**Category:** paths · **Version:** 2.0.0 · **UI:** DIALOG (conditional — a tree picker appears only when the layer has more than one path)

## What it does

Recenter a bezier path's origin on (0,0) so scaling and rotating it — via its own transform or a parent — behave predictably instead of pivoting around wherever AE happened to drop the origin when the path was drawn. Originator computes the bounding-box center of the path's vertices and shifts every vertex by that offset, so the shape's geometry is now centered on the origin while its on-screen position stays exactly the same (only the path's internal coordinate space moves).

Run it on a selected shape layer. If the layer has exactly one bezier path, it's centered immediately with a confirmation — no dialog. If it has several (nested in groups, or multiple paths in one layer), a resizable tree view of the layer's contents opens so you can pick the specific path (or a whole group of paths) to center, then click Center Selected.

For animated paths, the offset is computed once from the first keyframe and applied to every keyframe, so the shape recenters while its existing motion is preserved rather than flattened.

## Controls & options

Originator has no persistent settings; its only UI is the conditional picker (shown for multiple paths):

| Element | Type | Purpose |
|---|---|---|
| Tree view | Multiselect | Mirrors the layer's contents; groups are expandable nodes, bezier paths are leaves. Selecting a group centers every path under it. |
| Center Selected | Button | Centers each selected path (or every path under a selected group) and closes. |
| Cancel | Button | Closes without centering. |

A single-path layer is centered headlessly — the only "control" is which shape layer is selected.

## Usage

1. Select one shape layer containing at least one custom (hand-drawn) bezier path.
2. Run Originator.
3. One path → it's centered immediately, with a confirmation alert.
4. Several paths → the tree dialog opens; select one or more paths (or a group), then click Center Selected.
5. The path's vertices are now centered on the origin; the shape's on-screen position is unchanged.

## Notes

- Only vertices are offset — bezier tangent handles are stored relative to their vertex, so they ride along automatically and need no adjustment.
- For keyframed paths, the offset comes from the first keyframe and is applied uniformly, preserving the animation's relative motion.
- Only custom bezier paths are recognized. Parametric Rectangle, Ellipse, and Star shapes are not centered by this tool.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Exactly one selected layer, and it must be a shape layer — any other type triggers the type-guard alert.
- The layer must contain at least one custom bezier path; a layer with only parametric shapes reports "No shape paths were found in the selected layer."
- The tree dialog is resizable and supports multiselect; selecting a group centers every path nested under it.

## How it works

The script opens a "Center Shape Path Origin" undo group, guards for an active comp and a single selected shape layer, then walks `Contents` with an embedded tree-view helper to collect every bezier path (`ADBE Vector Shape - Group`). It flattens that list: one path → center it directly; several → show a multiselect tree and center whatever the user picks.

Centering resolves the path property by walking `.property("Contents")…("Path")`, reads its vertices, and computes the bounding-box center offset. It builds a new `Shape()` with every vertex shifted by that offset and the original tangents and closed-state copied unchanged. Keyframed paths take the offset from keyframe 1 and rewrite each key with `setValueAtKey`; static paths rewrite the single value with `setValue`.
