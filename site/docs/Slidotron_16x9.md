# Slidotron_16x9
> Build a ready-to-use horizontal slide-reveal rig in one click — two nested 4K comps, mirrored alpha mattes, and a single 0–100 "CTRL" slider that plays the transition.

**Category:** composition · **Version:** 2.0.1 · **UI:** HEADLESS (no dialog)

## What it does

Slidotron 16x9 gives you a complete horizontal slider/gallery transition without building a single mask by hand. Select a composition, run the script, and it creates two nested 4K (3840×2160, 60 fps) comps — **"Sliders 16x9"** and **"Slide 16x9"** — wires them together with two mirrored rectangular alpha mattes, and drops a "Sliders 16x9" layer carrying a Slider Control effect named **"CTRL"** into your original comp. Drag that one slider from 0 to 100 and the two matte panels slide in from opposite edges, progressively revealing whatever artwork you place in "Slide 16x9".

The mechanism is a classic two-panel reveal: "Mask L" and "Mask R" are hidden shape layers, each holding a half-width (1920×2160) rectangle on opposite sides of frame. Two instances of "Slide 16x9" are alpha-matted by — and parented to — those masks, so the visible slice of your content physically travels with the mask edge revealing it. Expressions on each mask's X position remap the CTRL value into screen-space offsets.

Your only remaining job: put content in "Slide 16x9" and animate the slider.

## Controls & options

There is no dialog. The control surface is what the script builds — and the expressions look these up **by name**, so don't rename them:

| Item | Location | Default | Purpose |
|---|---|---|---|
| **"CTRL"** slider (Slider Control effect) | On the "Sliders 16x9" layer in your original comp | 116 (effectively 100 — the expression clamps to 0–100) | The one control: drives both masks' horizontal position. Usable range 0–100. |
| "Mask L" / "Mask R" shape layers | Inside "Sliders 16x9" | Hidden (eye off) | Alpha-matte sources for the two slide instances. Leave disabled. |
| "Slide 16x9" comp | Project panel | Empty, 3840×2160 @ 60 fps | Put your slide/gallery artwork here. Used twice, once per mask. |
| "Sliders 16x9" comp | Project panel | 4 layers (2 masks + 2 slide instances) | The whole rig; this comp is the layer added to your original composition. |

**Name binding:** each mask's expression reads `comp("<your comp>").layer("Sliders 16x9").effect("CTRL")("Slider")`. Renaming the "Sliders 16x9" layer or the "CTRL" effect afterward breaks the rig (expression error). Renaming your original comp is safe — its name is read fresh and escaped when the script runs.

## Usage

1. Select an existing composition — it becomes the host for the rig.
2. Run the script. No dialog appears; the rig is built immediately.
3. Open **"Slide 16x9"** and add your slide/gallery artwork.
4. Back in your original comp, select the **"Sliders 16x9"** layer and keyframe its **CTRL** slider from 0 to 100 to play the reveal. Reset it to 0 first — the script leaves it at 116, which reads as "fully open".
5. Only re-enable "Mask L"/"Mask R" if you need to debug the matte shapes; leave them off for normal use.

## Notes

- The slider starts at 116, outside the 0–100 range the expressions map; `linear()` clamps it, so the rig first appears in the fully-transitioned position until you set the slider to 0.
- Both generated comps are 600 s (10 min) long at 60 fps with a dark-gray (38,38,38) background — trim to taste.
- Running the script again doesn't error: AE auto-suffixes the duplicate comp names ("Sliders 16x9 2"), and the new rig's expressions point at whatever comp was active on that run, so rigs don't cross-reference.
- The whole build is one "Slidotron 16x9" undo group.

## Requirements & edge cases

- **After Effects 23.0 (2023) or later.** The rig is wired with `AVLayer.setTrackMatte()`, which doesn't exist before AE 23.0. Unlike the 9x16 sibling script, this version has no runtime version check — on older hosts it errors mid-build with a partial rig, so don't run it there.
- A composition must be selected/active before running; otherwise it alerts "Please select a composition first" and exits cleanly.
- The generated expressions have no try/catch — renaming the "Sliders 16x9" layer or "CTRL" effect surfaces as an AE expression error on the mask position properties.

## How it works

The script is a single top-level `try { beginUndoGroup; compCode_…(); endUndoGroup } catch { alert }` block; the timestamped function name is a leftover from the "compCode" recorder tool used to capture a hand-built template (which is also why the geometry constants are long recorded decimals rather than round numbers).

After the comp guard, it creates the two 4K comps with `app.project.items.addComp()`, adds "Sliders 16x9" as a layer in your original comp, and gives it an `ADBE Slider Control` renamed "CTRL". Inside "Sliders 16x9" it builds each mask shape layer property-group by property-group — vector group, 1920×2160 rect, zero-width stroke, black fill — then separates Position dimensions to expose `ADBE Position_0` as the driven X channel. Mask L gets Scale `[-100, 100, 100]`: the same rectangle geometry, horizontally flipped, serves as the mirror-image left panel.

Two "Slide 16x9" layer instances get `setTrackMatte(mask, TrackMatteType.ALPHA)` and are parented to their masks. Finally, each mask's X position receives a `linear(CTRL, 0, 100, oMin, oMax)` expression (Mask L maps to −5→1920, Mask R to 3840→1920), with your comp's name escaped into the `comp("…")` reference so quotes and backslashes in comp names can't break it.
