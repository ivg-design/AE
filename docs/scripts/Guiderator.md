# Guiderator
> Drop exact ruler guides by typing a number — or a formula like `1920/2` — into a dockable panel, then click H or V.

**Category:** composition · **Version:** 2.0.0 · **UI:** PANEL (dockable palette)

## What it does

Guiderator places precise ruler guides in the active composition without making you do the math first. Type a plain number or a simple arithmetic expression (`1920/2`, `1080*0.33`) into the panel's field — the moment the field loses focus, the expression is evaluated and replaced with the computed result — then click **H** for a horizontal guide or **V** for a vertical one.

That built-in calculator is the point: "where's the exact center / third / quarter of my comp" becomes typing the formula and clicking once, instead of grabbing a calculator or eyeballing a guide into place. Because it's a dockable panel, it lives permanently in your workspace next to the Timeline rather than being a one-shot dialog.

A third button doubles as a guide-lock indicator and toggle: 🔐 when the active viewer's guides are locked, 🔓 when they're not; clicking flips the state. You can unlock guides to reposition them by hand, then re-lock — without hunting through the View menu.

## Controls & options

| Control | Type | Default | Role |
|---|---|---|---|
| Position field | Text field (5 characters wide) | empty | Accepts a number or arithmetic expression (`1920/2`, `1080*0.33`). Auto-evaluates and replaces its own text with the result (rounded to 2 decimals) when the field loses focus. |
| **H** | Button | — | Adds a **horizontal** guide at the field's evaluated value. |
| **V** | Button | — | Adds a **vertical** guide at the field's evaluated value. |
| 🔐 / 🔓 | Button | 🔐 (when no viewer is available) | Toggles guide locking for the active viewer and updates its own icon. Does nothing if no viewer is active. |

**Calculator examples**

| You type | Guide lands at |
|---|---|
| `540` | 540 |
| `1920/2` | 960 |
| `1080*0.33` | 356.4 |

## Usage

1. Make the target composition active and open/dock the Guiderator panel.
2. Type a number (`540`) or formula (`1920/2`) into the field.
3. Tab or click away — the field updates to the computed value (e.g. `960`). Clicking H or V also triggers the evaluation first, since the click moves focus off the field.
4. Click **H** for a horizontal guide or **V** for a vertical guide at that position.
5. Optionally click the lock button to lock/unlock guides (🔐 = locked, 🔓 = unlocked).
6. Repeat as needed — the panel stays open between guides.

## Notes

- Each guide is added inside its own "Add Guide" undo group, so a single undo removes one guide.
- The lock button reflects the real lock state at panel open and after each click of its own — but it does **not** update itself if you lock/unlock guides through AE's View menu while the panel is open.
- The field is evaluated with ExtendScript's `eval()`, so it technically accepts any ExtendScript — a deliberate trade-off for the formula convenience. Stick to arithmetic.
- Fully self-contained: no layers, effects, or expressions are touched. Its only footprint is `addGuide()` calls and the viewer's guide-lock flag.

## Requirements & edge cases

- Needs an AE version with `CompItem.addGuide()` (CS6 or later); no explicit version check is made.
- An active composition is required — clicking H/V with a footage/folder item active alerts "Please select a composition." and does nothing.
- Empty field → "Please enter a value." Non-numeric text → "Please enter a valid number."
- If an un-evaluated expression somehow remains in the field when you click H/V, only its leading number is used (`1920/2` → 1920). In normal use this can't happen, because clicking the button blurs the field and triggers evaluation first.
- The lock toggle is a silent no-op when there's no active viewer.

## How it works

The whole script is one self-invoking block calling `addGuideScript(this)`. `buildUI()` checks `thisObj instanceof Panel` to decide between a docked panel and a standalone `Window("palette")`, lays out the field and three 20×20 buttons in a row, and only calls `.center()/.show()` for the standalone window case (AE manages visibility for real docked panels).

The calculator wraps `eval(input)` in try/catch, rounding the result with `Number(result.toFixed(2))`; on any failure it returns the input untouched. It's wired to the field's `onChange`, which ScriptUI fires when the field loses focus — including when a button click steals focus, so the H/V handlers always see the evaluated text.

`addGuide()` trims the text with an ES3-safe regex, guards against empty/`NaN` input and non-comp active items, then calls `comp.addGuide(0, value)` for H (0 = horizontal in the AE API) or `comp.addGuide(1, value)` for V, wrapped in an undo group. The lock button reads and flips `app.activeViewer.views[0].options.guidesLocked`, updating its own label after each toggle.
