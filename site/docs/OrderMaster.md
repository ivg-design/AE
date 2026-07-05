# OrderMaster
> Reverse or shuffle the stacking order of a contiguous run of selected layers — or the contiguous shape groups inside one shape layer — in place.

**Category:** layers · **Version:** 2.0.1 · **UI:** DIALOG (one checkbox, Proceed / Cancel)

## What it does

Flip or randomize the stacking order of a run of adjacent layers — or a run of adjacent shape groups inside a single shape layer — in one step, without dragging each item in the Timeline by hand. Select the contiguous set, run OrderMaster, choose Reverse (the default) or Randomize, and click Proceed; the layers or shape groups swap positions in place, occupying exactly the same index range they started in.

The tool auto-detects its target from the selection. Multiple layers selected in a comp reorders layers; a single shape layer with several of its shape groups selected reorders those groups (handy for changing the paint/stacking order of overlapping shapes without redrawing them). Both paths require the selection to be contiguous — no gaps in layer index or shape-group order — because the operation rearranges items strictly within their own index range; a gapped selection is rejected with an alert rather than guessed at.

## Controls & options

| Control | Type | Meaning | Default |
|---|---|---|---|
| Randomize | Checkbox | Unchecked = reverse the selection's order. Checked = shuffle it into a random order. | Unchecked (reverse) |
| Proceed | Button | Runs the reorder in one undo step, then leaves the dialog open. | — |
| Cancel | Button | Closes the dialog with no changes. | — |

**Selection requirements** (checked when you click Proceed):

- Layer mode: two or more layers selected in the active comp, with consecutive indices.
- Shape-group mode: exactly one shape layer selected, with two or more of its contiguous shape groups selected inside it.
- Anything else produces a guidance alert and no change.

## Usage

1. Select two or more adjacent layers in the Timeline (no gaps) — or select one shape layer and, inside it, two or more adjacent shape groups.
2. Run OrderMaster.
3. Leave Randomize unchecked to reverse, or check it to shuffle.
4. Click Proceed. If the selection is contiguous, the items swap positions within the same index range; otherwise an alert explains what's wrong.
5. Undo reverses the whole operation as a single step.

## Notes

- Reverse is the default; Randomize uses a Fisher-Yates shuffle for an even random order.
- Reordering keeps every layer/group property and animation intact — only stacking position changes.
- The dialog stays open after Proceed, so you can reorder several selections in a row.

## Requirements & edge cases

- Layer mode needs an active comp with two or more index-contiguous selected layers.
- Shape-group mode needs exactly one selected shape layer with two or more contiguous selected groups.
- Any other selection (0–1 layer, non-contiguous items, a non-shape layer alone) shows one of two guidance alerts and changes nothing.
- With no active composition, Proceed shows the guidance alert and exits cleanly.
- No hard version gate — everything used predates CS6.

## How it works

The dialog is built from four ES3-style helper namespaces (UI, LayerUtils, ShapeLayerUtils, Utils). Clicking Proceed guards that the active item is a comp, opens the "OrderMaster" undo group, and dispatches: two or more contiguous layers → reorder layers; a single shape layer with two or more contiguous named-group properties → reorder shape groups. Contiguity is a consecutive-index check on a sorted copy of the selection, so the caller's selection is never mutated.

Both reorder paths keep live object references (never re-resolving by name), reverse or Fisher-Yates-shuffle that array, then move each item to its target index left-to-right — layers via `moveBefore()`, shape groups via `moveTo()`. The reorder body runs inside `try`/`finally` so the undo group always closes. No expressions, keyframes, or pseudo-effects are involved.
