# Opac-o-bot
> Parenting for Opacity — the one property AE parenting ignores. Selected layers' Opacity follows their parent via a one-line expression.

**Category:** layers · **Version:** 1.0.0 · **UI:** HEADLESS

## What it does

When you parent layers in AE, Position, Scale and Rotation follow the parent — Opacity never does. Opac-o-bot completes the rig: select any number of parented layers, run it, and each one's Opacity gets the expression `thisComp.layer("<parent>").transform.opacity`. Fade the parent, and the whole family fades with it.

## Controls & options

None — it reads each selected layer's existing parent assignment.

## Usage

1. Parent your layers as usual.
2. Select the child layers (any number) and run Opac-o-bot.
3. Animate the parent's Opacity — children follow. One undo step.

## Notes

- The link is by parent **name**: renaming the parent (or duplicate layer names in the comp) breaks or misdirects it. Re-run after renames.
- Children multiply nothing — they *mirror* the parent's opacity exactly. For relative fading, edit the expression to `...opacity * value / 100`.
- Delete the expression from a child's Opacity to detach it.

## Requirements & edge cases

- Needs an open comp and at least one selected layer (alerts otherwise).
- A selected layer without a parent is skipped with a per-layer alert, and the rest still process.

## How it works

Guards (comp, selection), one undo group, then a loop over `selectedLayers`: for each layer with a `.parent`, it assigns the linking expression to the layer's Opacity; layers without a parent trigger a skip alert. Nothing else is modified.
