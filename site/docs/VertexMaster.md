# VertexMaster
> Turn a bezier path's vertices and tangents into draggable null-object handles you can keyframe, parent, and expression-link — or flip a null to Follow mode to read out an already-animated path.

**Category:** paths · **Version:** 2.0.2 · **UI:** DIALOG (tree-view path picker + Vertex / InTangent / OutTangent checkboxes)

## What it does

VertexMaster rigs a shape layer's bezier path so you can reshape it by dragging null objects — keyframing, parenting, and expression-linking each vertex the way you would any other layer, instead of hand-editing points on the Path property.

Run it with a single shape layer selected and a dialog opens with a tree of that layer's shape content (its groups and paths) and three checkboxes: **Vertex**, **InTangent**, **OutTangent**. Pick a path, choose which handles you want, and click **Create**. The script adds one or more null layers — a vertex control null, plus optional in/out tangent nulls parented to it — and writes a fresh expression onto the shape's actual Path property that rebuilds the whole path with `createPath()`, substituting in whichever nulls you've activated. Any vertex you leave inactive is passed through untouched, so the original path animation keeps playing.

Each vertex null carries a **Control/Follow** checkbox. In Control mode (the default) the null pushes its position into the path. Flip it to Follow and the null instead reads the path's current vertex location and sits on it — so the same handle becomes a live read-out of an already-animated path rather than a driver of it. A third **Open/Closed Path** checkbox on the vertex null toggles whether the path's first and last vertices are joined.

This is built for organic and character path work — tentacles, limbs, hand-drawn silhouettes — where you want the tactile feel of null-based control over a bezier path.

## Controls & options

### The dialog

| Control | Type | Default | Meaning |
|---|---|---|---|
| Path tree | Tree view | — | Every group and path inside the selected shape layer's Contents. Click the **Path** leaf you want to rig (not a group node). |
| Vertex | Checkbox | on | Create a vertex control null for one path vertex. |
| InTangent | Checkbox | off | Create an incoming-tangent handle, parented to the vertex null. |
| OutTangent | Checkbox | off | Create an outgoing-tangent handle, parented to the vertex null. |
| Create | Button | — | Build the nulls and write the Path expression. |
| Cancel | Button | — | Close with no changes. |

### The nulls it creates

Nulls are named after the selected path's parent group. For a group named **Ellipse 1**, checking all three boxes produces:

```
Ellipse 1 Vertex 1                    ← vertex control null
Ellipse 1 inTangent for Vertex 1      ← parented to the vertex null
Ellipse 1 outTangent for Vertex 1     ← parented to the vertex null
```

The vertex null carries three effects that drive the rig:

| Effect on the vertex null | Type | Default | Meaning |
|---|---|---|---|
| Vertex Control | Slider | 0 | 1-based index of the path vertex this null drives or tracks. `0` = inactive: that null is ignored and the path is left untouched. |
| Control/Follow | Checkbox | 0 | `0` = Control (the null's position is pushed into the path); `1` = Follow (the null reads and displays the path's current vertex location). |
| Open/Closed Path | Checkbox | 0 | Toggles the path's closed/open topology (whether the first and last vertices are joined). |

The tangent nulls carry no effects of their own — they are bare handles you keyframe by hand, and the Path expression reads their world position back as the tangent offset.

## Usage

1. Select a single shape layer that contains at least one bezier path, with a comp active.
2. Run VertexMaster. Expand the tree and click the specific **Path** leaf you want to control.
3. Leave **Vertex** checked; optionally check **InTangent** and/or **OutTangent**. Click **Create**.
4. On the new vertex null, set **Vertex Control** to the 1-based index of the vertex you want to drive.
5. Move the null (and its tangent children, if created) to reshape the path. Keyframe, parent, or expression-link it like any layer.
6. To make a handle track the path instead of driving it, set **Control/Follow** to `1`.
7. To open or close the path, toggle **Open/Closed Path**.
8. For more vertices, duplicate the vertex null together with its tangent children — see Notes.

## Notes

- **Snap the null to its vertex before driving it.** A freshly created vertex null appears at the composition center (After Effects' default null position), not on the path. In Control mode the null's starting position is what gets pushed onto the path, so position the null over the target vertex first — or briefly set **Control/Follow** to `1` with the right index to snap it there, then switch back to Control — so the vertex doesn't jump.
- **Controlling more than one vertex.** Duplicate the vertex null together with its parented tangent children. After Effects' auto-numbering advances the trailing token (`Vertex 1` → `Vertex 2`) on both the null and its tangents, and the Path expression pairs each tangent to its vertex by that trailing token, so duplicated sets stay wired correctly. Give each duplicate its own **Vertex Control** index.
- **Follow mode** is per-null: any null with **Control/Follow** on becomes a passive read-out of the live path rather than a control, which is handy for tracking a vertex on an already-animated path.
- The Path expression rebuilds the entire path with `createPath()` on every frame and finds the nulls by matching their names, so keep the created nulls named as generated.

## Requirements & edge cases

- Needs an active composition and exactly one selected shape layer; otherwise the script alerts and exits before the dialog opens.
- Works on shape-layer paths only. Layer **masks** are not surfaced in the tree — only paths inside the shape layer's Contents appear.
- Select a **Path** leaf, not a group node. Selecting a group is rejected with "Please select a Path from the tree view."
- The path must sit **exactly one shape group** below the layer's Contents. A path at the top level of Contents, or nested two or more groups deep, is rejected with an alert — the vertex/tangent coordinate math is built around that one-group depth.
- **Vertex** must be checked to add tangent handles, since the tangent nulls are parented to the vertex null. Checking InTangent/OutTangent alone is rejected with "Tangent controls must be attached to a Vertex control."
- Cancel aborts with no changes.

## How it works

The whole tool runs in `main()`. It first checks for an active `CompItem` and exactly one selected `ADBE Vector Layer`, then `extractGroups()` recursively walks the layer's `Contents`, recording `ADBE Vector Group` folders and `ADBE Vector Shape - Group` path leaves into a plain-object tree. `createTreeView()` mirrors that into the ScriptUI dialog — groups become expandable nodes, paths become selectable items.

When you click **Create**, it validates the selection by its ScriptUI item type (leaf item vs group node) and counts the selection's ancestor depth to enforce the one-group-deep rule, then calls `getAEPathAndObject()` to turn the tree selection into both a live Path property reference and a `("Contents")("…")("Path")` string for the expression. `createControls()` adds the nulls via `comp.layers.addNull()`, wires the Vertex Control slider and the Control/Follow and Open/Closed Path checkboxes onto the vertex null, and parents any tangent nulls to it.

`createExpression()` writes the string assigned to the shape's Path property. Each frame it reads the path's current `points()`, `inTangents()`, and `outTangents()`, scans the comp's layers for the vertex and tangent nulls by name prefix, and — for any vertex null in Control mode with a non-zero index — converts the null's world position into shape-local space (`toWorld`/`fromWorld`, offset by the enclosing group's Position minus Anchor Point via `propertyGroup(3)`), overwriting that vertex and its paired tangents. Finally it calls `createPath(points, inTangents, outTangents, isOpenPath)` to rebuild the path.
