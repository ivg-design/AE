# PathMaster
> Animate a layer's Position along any shape-layer path — then retime, re-ease, trim to a segment, loop or ping-pong the ride after the fact by editing a single layer marker.

**Category:** animation · **Version:** 2.0.2 · **UI:** DIALOG (three quick steps: layer → path → settings)

## What it does

PathMaster animates a selected Position property along a path you pick from any shape layer in the comp. Run it once and the layer travels the path — no keyframes, no hand-written expressions.

The controls live where you actually work: on a **layer marker**. The marker's position in the Timeline is the animation start, its duration bar is the animation length, and its comment text carries the easing, path segment, and loop mode. Slide or stretch the marker to retime the move; edit one line of comment text to change easing, ride only part of the path, or make it loop or ping-pong — all without reopening the script. A "Reverse Direction" checkbox on the layer flips travel direction at any time.

Because the expression resolves the shape layer and path by name at render time, the animation follows along if you reshape the path later, and it works whether or not the animated layer is parented.

## Controls & options

### The marker (the main control surface)

The expression reads the first layer marker whose comment contains the word `Animation`.

| Marker property | Controls |
|---|---|
| Position in Timeline | Animation **start time** |
| Duration (drag the marker's right edge) | Animation **length** (if 0, the duration you typed in the dialog is used) |
| Comment text | Easing curve, path segment, loop mode — see syntax below |

**Comment syntax** — up to three parts separated by `||`, in any order:

```
Animation Easing: 0.42,0,0.58,1 || Segment 20 - 75% || Ping-Pong
```

| Part | Syntax | Meaning |
|---|---|---|
| Easing | `Easing: x1,y1,x2,y2` | Cubic-bezier curve (same numbers as CSS `cubic-bezier`). Invalid or missing → linear |
| Segment | `Segment 20 - 75%` | Ride only 20%→75% of the path. Missing → full path (0–100%) |
| Loop | `Loop` or `Ping-Pong` | Repeat from the start, or bounce back and forth. Missing → play once and hold |

The script writes a starter marker for you (with your chosen easing and `Segment 0 - 100%`); segments and looping are enabled purely by editing the comment. Re-running the script replaces the old "Animation Easing" marker instead of stacking a second one.

### The dialogs

| Step | Control | Default |
|---|---|---|
| 1 — Select Shape Layer | List of every shape layer in the comp | — |
| 2 — Select Path | Tree of the layer's groups and paths; click the path leaf | — |
| 3 — Settings | Easing preset (26 named cubic-bezier curves: Sine/Quad/Cubic/Quart/Quint/Expo/Circ, in/out/in-out) | Ease (0.25, 0.1, 0.25, 1.0) |
| | Duration in **frames** | 60 |
| | "Reverse Direction?" checkbox | off |

### On the layer

| Control | Meaning |
|---|---|
| "Reverse Direction" (Checkbox Control effect) | Flip travel direction live, without touching the marker |
| "Animation Easing: …" marker | Everything else — see above |

## Usage

1. Select the **Position property** of the layer you want to animate (the property itself, not just the layer).
2. Run PathMaster. Pick the shape layer → pick the path in the tree → choose easing and duration, then OK.
3. The layer now rides the path. To adjust:
   - **Retime** — slide the marker; stretch its duration bar to slow the move down.
   - **Custom ease** — edit the four `Easing:` numbers in the marker comment.
   - **Partial path** — add `|| Segment 25 - 80%` to the comment.
   - **Loop / bounce** — add `|| Loop` or `|| Ping-Pong`.
   - **Reverse** — tick the "Reverse Direction" effect on the layer.

## Notes

- Segments and loop/ping-pong have no dialog controls **by design** — the marker comment is the intended interface, so you can change them mid-project without re-running the script.
- The expression is fully self-contained (bezier solver and loop math included), so the layer stays portable — no external files or global effects.
- Layer and shape names are baked into the expression by name; renaming the shape layer or the path group afterward breaks the reference (re-run the script to rebind).

## Requirements & edge cases

- Needs an open comp, a selected `Position` property, and at least one shape layer — each missing piece gets its own alert and the script exits cleanly.
- Duration must be a positive number of frames.
- Don't pick the animated layer itself as the path source — Position would then depend on itself and AE rejects the expression as a circular reference.
- If two sibling groups/paths inside the shape layer share the same name, the name-based lookup can bind to the wrong one — give paths unique names.
- Cancel in any dialog aborts with no changes.

## How it works

One IIFE wrapped in a "PathMaster" undo group. Guards (comp → selected property → `ADBE Position` → shape layers exist) run first; shape layers are detected by the presence of a `Contents` property group. `extractGroups()` recursively walks `Contents`, collecting `ADBE Vector Group` folders and `ADBE Vector Shape - Group` path leaves into a tree shown in dialog 2. `getAEPathAndObject()` converts the clicked tree leaf into both a live property reference and a `("Contents")("Name")…("Path")` string spliced into the expression.

The generated expression: scans `thisLayer.marker` for an "Animation" comment, parses `Easing:` / `Segment A - B%` / `Loop|Ping-Pong` from the `||`-separated parts (regex-based, with linear/full-path/no-loop fallbacks), computes looped progress from marker time and duration, eases it through a Newton-iteration cubic-bezier solver, optionally flips it via the "Reverse Direction" checkbox effect, remaps into the segment window with `linear()`, and finally samples `path.pointOnPath()` converted through `shapeLayer.toComp()` (and `parent.fromComp()` when the layer is parented).

Script-side, it then creates or finds the "Reverse Direction" Checkbox Control (walking the Effect Parade by name), sets it from the dialog, removes any previous "Animation Easing" marker, and writes the fresh one at the layer in-point with your duration.
