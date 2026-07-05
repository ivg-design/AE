# ChromaBlenderizer
> Ramp a color range across any set of selected color properties — pick Start and End colors, select fills, strokes, or effect colors, and apply a linear blend or random scatter in one click.

**Category:** effects · **Version:** 2.3.1 · **UI:** PALETTE (modeless — stays open while you work)

## What it does

ChromaBlenderizer distributes a color range across After Effects color properties so you don't hand-pick a color for every shape fill, stroke, or effect color control. Set a Start color and an End color — via the bundled color-wheel picker or HSB sliders — select two or more color property rows anywhere in the Timeline or Effect Controls, and click **Apply Colors**. Each selected property receives one color along the interpolation path between Start and End (or a random color inside that range).

The palette is modeless by design: adjust colors, go re-select different properties in AE, click **Refresh Count** to confirm the palette sees them, apply again — repeatedly, without relaunching. Two modes shape the blend: **Color Gamut** walks hue (always the shortest way around the color wheel), a shared saturation, and per-endpoint brightness; **Grayscale** ignores hue/saturation and interpolates brightness only. The **Randomize Colors** checkbox swaps the even linear spread for an independent random position per property, still bounded by your Start/End range.

Color picking is handled by a vendored, self-contained copy of the AdobeColorPicker v2.0 color wheel — no dependency on Duik or any external picker. The tool writes values directly with `setValue()`; it adds no expressions, effects, or keyframes.

## Controls & options

| Control | Default | Meaning |
|---|---|---|
| Start Color swatch | white | Opens the color-wheel picker; sets the start hue/brightness and the shared saturation |
| End Color swatch | white | Same for the end color |
| Start Hue slider | 0° | Hue of the range's starting color (Color Gamut mode) |
| End Hue slider | 0° | Hue of the range's ending color |
| Saturation slider | 0% | **Shared** by Start and End — picking either swatch updates it |
| Start Brightness slider | 100% | Brightness of the starting color (both modes) |
| End Brightness slider | 100% | Brightness of the ending color |
| Randomize Colors | off | Each target gets an independent random color in the range instead of an even spread |
| Grayscale / Color Gamut | Color Gamut | Grayscale interpolates brightness only; Color Gamut uses hue + shared saturation + brightness |
| Refresh Count | — | Re-counts the currently selected color properties without applying anything |
| What Counts? | — | Explains which AE properties qualify as targets |
| Apply Colors | — | Writes the computed colors to every selected color property in one undo group; the palette stays open |
| Close | — | Closes the palette |

**What counts as a target:** properties whose value type is COLOR — shape Fill Color, shape Stroke Color, effect Color controls, text animator colors. Selecting *layers* is not enough; the actual color property rows must be highlighted, and you need at least two.

## Usage

1. Open a composition and run the script (with no active comp it alerts and exits before the palette opens).
2. Click the Start swatch and pick a color on the wheel (or drag the HSB sliders). Repeat for End.
3. Choose Grayscale or Color Gamut; optionally enable Randomize Colors.
4. In AE, select two or more color property rows — the palette stays open while you do.
5. Click **Refresh Count** to confirm the target count reads at least 2.
6. Click **Apply Colors**. The status line reports how many properties were written.
7. Change colors or selection and apply again as often as you like; **Close** when done.

## Notes

- With everything at defaults (Start = End = white, saturation 0), applying writes plain white to every target — set your colors first.
- Hue interpolation always takes the shortest path around the wheel, so a red→magenta ramp goes through violet, not all the way around through green.
- `setValue()` writes the property's current value: on properties with existing keyframes this changes the value at the current time; it doesn't add keyframes of its own.
- Only one ChromaBlenderizer palette can exist — relaunching the script closes a leftover palette from a previous run first.
- If the bundled color picker fails to load, the swatch buttons tell you to use the HSB sliders instead — the tool keeps working without the wheel.

## Requirements & edge cases

- After Effects CS6 or later.
- Requires an active composition — checked before the palette opens and again at apply time (the comp can close while the modeless palette stays open).
- Requires at least two selected COLOR-type properties; fewer triggers an alert and nothing is written.
- Per-property write failures are caught individually and counted; the rest of the batch still applies, and the status line reports "Applied to N properties; M failed."
- The bundled picker remembers its screen position in a small file under `Folder.userData/Aescripts/colorPicker/` — this needs AE's "Allow Scripts to Write Files and Access Network" preference, like any script that writes to disk.

## How it works

One self-invoking function. At launch it `eval()`s the embedded AdobeColorPicker v2.0 source (the bulk of the file — the picker ships with its color-wheel PNG escaped into the string), carefully saving and restoring any pre-existing `$.global.colorPicker` so it can't clobber another tool's picker. After an active-comp guard, it builds the `Window('palette')`, closes any stale palette registered on `$.global.ChromaBlenderizerPalette`, and stores the new one there so event handlers survive after the script returns.

The color math is standard fractional HSB↔RGB conversion plus `interpolateHue()`, which folds the hue delta into [−0.5, 0.5] before applying the ratio — that's what guarantees shortest-path travel around the wheel. Target discovery filters `comp.selectedProperties` down to `PropertyValueType.COLOR` (inside try/catch so exotic selections are skipped, not fatal); the count refreshes on Refresh Count clicks and whenever the palette regains focus via `onActivate`.

Apply re-checks the comp and target count, then opens the 'ChromaBlenderizer' undo group and loops the targets: ratio `i/(n−1)` for the linear spread (or fresh `Math.random()` per property when randomizing), `hsbToRgb(...)` per mode, and `setValue([r,g,b,1])` inside a per-property try/catch. A `finally` block guarantees the undo group closes exactly once regardless of how the loop exits.
