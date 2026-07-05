# Reseterator
> Zero the transform origin of selected layers in one click — layer anchor to [0,0,0] and every nested shape-group anchor/position to [0,0].

**Category:** layers · **Version:** 1.0.0 · **UI:** HEADLESS

## What it does

Reseterator cleans up layers whose anchors and shape groups carry stray offsets — a common state after imports (Illustrator/SVG), duplications, or heavy group shuffling. One run sets each selected layer's Anchor Point to `[0,0,0]` and recursively walks its contents, resetting every shape group's internal Transform ▸ Anchor Point and Position to `[0,0]`, no matter how deeply nested.

## Controls & options

None — it's a one-shot utility driven entirely by your layer selection.

| Acts on | Reset to |
|---|---|
| Layer ▸ Anchor Point | [0,0,0] |
| Every `ADBE Vector Transform Group` ▸ Anchor Point | [0,0] |
| Every `ADBE Vector Transform Group` ▸ Position | [0,0] |

Layer Position, Scale and Rotation are deliberately left untouched.

## Usage

1. Select one or more layers.
2. Run Reseterator. Done — one undo step ("Reset PSR").

## Notes

- Layers can shift visually: zeroing an offset anchor moves the layer's pivot, not its Position. Follow up by repositioning if needed.
- Non-shape layers simply get their anchor reset; the recursive group pass only finds work on shape layers.

## Requirements & edge cases

- Needs an open comp and at least one selected layer (alerts otherwise).
- Keyframed anchors/positions on shape groups get a new value at the current time if the stopwatch is on — check for keys first on animated rigs.

## How it works

For each selected layer it calls a recursive `resetPSR()` that walks every INDEXED/NAMED property group; whenever a group's matchName is `ADBE Vector Transform Group`, its first two properties (Anchor Point, Position) are `setValue([0,0])`-ed, then recursion continues into the group. After the walk, the layer's own `anchorPoint` is set to `[0,0,0]`. Everything runs inside a single undo group.
