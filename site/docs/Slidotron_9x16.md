# Slidotron_9x16
> Build a ready-to-use vertical (9:16) slide-reveal rig in one click — two nested 1080×1920 comps, mirrored alpha mattes, and a single 0–100 "CTRL" slider that plays the transition.

**Category:** composition · **Version:** 2.0.2 · **UI:** HEADLESS (no dialog)

## What it does

Slidotron 9x16 gives you a complete slide/gallery transition sized for Instagram Stories, TikTok, and other vertical formats — without building a single mask by hand. Select a composition, run the script, and it creates two nested 1080×1920, 60 fps comps — **"Sliders 9x16"** and **"Slide 9x16"** — wires them together with two mirrored rectangular alpha mattes, and drops a "Sliders 9x16" layer carrying a Slider Control effect named **"CTRL"** into your original comp. Animate that one slider from 0 to 100 and the two matte panels slide horizontally, progressively revealing whatever artwork you place in "Slide 9x16".

The mechanism is a two-panel reveal: "Mask L" and "Mask R" are hidden shape layers, each holding a half-width (540×1920) rectangle. Two instances of "Slide 9x16" are alpha-matted by — and parented to — those masks, so the visible slice of your content physically travels with the mask edge revealing it. Expressions on each mask's X position remap the CTRL value into screen-space offsets.

Your only remaining job: put content in "Slide 9x16" and animate the slider.

## Controls & options

There is no dialog. The control surface is what the script builds — and the expressions look these up **by name**, so don't rename them:

| Item | Location | Default | Purpose |
|---|---|---|---|
| **"CTRL"** slider (Slider Control effect) | On the "Sliders 9x16" layer in your original comp | 100 (fully open) | The one control: drives both masks' horizontal position. Usable range 0–100. |
| "Mask L" / "Mask R" shape layers | Inside "Sliders 9x16" | Hidden (eye off) | Alpha-matte sources for the two slide instances. Leave disabled. |
| "Slide 9x16" comp | Project panel | Empty, 1080×1920 @ 60 fps | Put your slide/gallery artwork here. Used twice, once per mask. |
| "Sliders 9x16" comp | Project panel | 4 layers (2 masks + 2 slide instances) | The whole rig; this comp is the layer added to your original composition. |

**Name binding:** each mask's expression reads `comp("<your comp>").layer("Sliders 9x16").effect("CTRL")("Slider")`. Renaming the "Sliders 9x16" layer or the "CTRL" effect afterward breaks the rig (expression error). Renaming your original comp is safe — its name is read fresh and escaped when the script runs.

## Usage

1. Select an existing composition — it becomes the host for the rig.
2. Run the script. No dialog appears; the rig is built immediately.
3. Open **"Slide 9x16"** and add your slide/gallery artwork.
4. Back in your original comp, select the **"Sliders 9x16"** layer and keyframe its **CTRL** slider from 0 to 100 to play the reveal. It starts at 100 (fully open), so there's no visual jump when the script finishes.
5. Only re-enable "Mask L"/"Mask R" if you need to debug the matte shapes; leave them off for normal use.

## Notes

- Both generated comps are 2100 s (35 min) long at 60 fps with a dark-gray (38,38,38) background — an artifact of the template project it was captured from; trim to taste.
- Running the script again doesn't error: AE auto-suffixes the duplicate comp names ("Sliders 9x16 2"), and the new rig's expressions point at whatever comp was active on that run, so rigs don't cross-reference.
- The whole build is one "Slidotron 9x16" undo group.

## Requirements & edge cases

- **After Effects 23.0 (2023) or later.** The rig is wired with `AVLayer.setTrackMatte()`, introduced in AE 23.0. On older hosts the script detects this up front and exits cleanly with an explanatory alert — no partial rig is left behind.
- A composition must be selected/active before running; otherwise it alerts "Please select a composition first" and exits cleanly.
- The generated expressions have no try/catch — renaming the "Sliders 9x16" layer or "CTRL" effect surfaces as an AE expression error on the mask position properties.

## How it works

The script is a single top-level `try { beginUndoGroup; compCode_…(); endUndoGroup } catch { alert }` block; the timestamped function name is a leftover from the "compCode" recorder tool used to capture a hand-built template (which is also why the geometry constants are long recorded decimals rather than round numbers). Two guards run first: active comp, then `parseFloat(app.version) < 23` — the version check bails out with a clear alert before anything is created.

It then creates the two 1080×1920 comps with `app.project.items.addComp()`, adds "Sliders 9x16" as a layer in your original comp, and gives it an `ADBE Slider Control` renamed "CTRL", set to 100. Inside "Sliders 9x16" it builds each mask shape layer property-group by property-group — vector group, 540×1920 rect, zero-width stroke, black fill — then separates Position dimensions to expose `ADBE Position_0` as the driven X channel. Mask L gets Scale `[-100, 100, 100]`: the same rectangle geometry, horizontally flipped, serves as the mirror-image left panel.

Two "Slide 9x16" layer instances get `setTrackMatte(mask, TrackMatteType.ALPHA)` — the modern AE 23+ API that doesn't require the matte to sit directly above its target — and are parented to their masks. Finally, each mask's X position receives a `linear(CTRL, 0, 100, oMin, oMax)` expression (Mask L maps to −5→540, Mask R to 1085→540), with your comp's name escaped into the `comp("…")` reference so quotes and backslashes in comp names can't break it. At the default CTRL of 100 both expressions evaluate to 540, matching the static value already set, so the rig lands with no visual jump.
