# sfxMaster
> Mix all your Voice Over, Sound Effects, and Music from three master sliders — audio layers are auto-categorized by marker comments and wired up in one pass.

**Category:** effects · **Version:** 2.0.1 · **UI:** HEADLESS (no dialog; alert/confirm prompts only)

## What it does

sfxMaster turns a composition's scattered audio layers into a centrally mixable session. Select one or more compositions in the Project panel and run it: the script builds a null named **"SFX CTRL"** holding three Slider Control effects — **Voice Over**, **Sound Effects**, and **Music** — that act as master volume knobs. It then walks every layer in each comp (recursing into precomps), finds all audio-only footage layers, and buckets each one into a category by reading the layer's **first marker comment**.

Every audio layer gets a Stereo Mixer effect whose Left/Right Level parameters are expression-linked to the matching master slider, so nudging one slider scales every layer in that category at once — "duck the music", "boost the VO", "mute all SFX" without hand-wiring dozens of layers. Because it recurses into nested comps and can process several selected comps in one run, it's a one-shot pass that standardizes audio control across an entire project structure.

## Controls & options

### Marker-based categorization (the routing surface)

The category is decided by the **first marker** on each audio layer. The comment is lowercased and substring-matched:

| First marker comment contains | Category slider |
|---|---|
| `voice over` | Voice Over |
| `music` | Music |
| anything else, or no marker at all | Sound Effects |

Example: a marker comment of `Voice Over - intro narration` routes that layer to the Voice Over slider. Matching is case-insensitive; only the first marker is read — later markers are ignored.

### What it builds

| Control | Location | Default | Purpose |
|---|---|---|---|
| Voice Over (Slider Control) | "SFX CTRL" null → Effects | 0 | Master level for voice-over layers |
| Sound Effects (Slider Control) | "SFX CTRL" null → Effects | 0 | Master level for uncategorized/SFX layers |
| Music (Slider Control) | "SFX CTRL" null → Effects | 0 | Master level for music layers |
| Overwrite prompt | confirm dialog | — | Appears only when some layer already has an expression-linked Stereo Mixer; your yes/no applies to every selected comp in one shot |

The Stereo Mixer levels are set equal to the slider value, and they behave as percentages — so **raise each slider to 100 for original volume**; the sliders start at 0 (silent).

## Usage

1. Tag audio layers with a layer marker whose comment contains "voice over" or "music" where you want those buckets; leave the rest unmarked to route them to Sound Effects.
2. Select one or more compositions in the **Project panel** (not layers in the Timeline).
3. Run sfxMaster.
4. If prompted about existing linked Stereo Mixers, choose whether to overwrite them.
5. In each processed comp, adjust the Voice Over / Sound Effects / Music sliders on the "SFX CTRL" null to mix. Start by setting them to 100 (unity), then ride them from there.

## Notes

- The generated expressions reference the comp and control layer **by name**: `comp('<comp name>').layer('SFX CTRL').effect('<slider>')('Slider')`. Renaming the comp, the "SFX CTRL" null, or the sliders afterward breaks the links.
- Precomp layers are wired back to the **top-level** comp's SFX CTRL, not to a control inside the precomp — one console rules the whole nested structure.
- If a layer already had a linked Stereo Mixer and you decline to overwrite, a second Stereo Mixer is added alongside it, leaving the original's expressions intact.
- An existing layer named "SFX CTRL" is reused as-is; its sliders are not re-created or repaired.
- Everything runs in a single undo group.

## Requirements & edge cases

- After Effects CC 2019 or later.
- At least one item selected in the Project panel, and every selected item must be a composition — otherwise the script alerts and stops.
- Only footage layers with **no video** count as audio (e.g. imported `.wav`/`.mp3`). A video file that also carries audio is skipped entirely — its audio is not wired to the console.
- The overwrite decision is one global yes/no for the whole run; there is no per-layer choice.
- Nested comps are walked with unlimited depth; a precomp used in several places is processed once per appearance.

## How it works

A single self-invoking `main()`. It reads `app.project.selection`, opens the "Apply Stereo Mixer" undo group, and makes two passes over the selected comps. Pass one ensures each comp has an "SFX CTRL" null (`comp.layers.addNull()` plus three `ADBE Slider Control` effects renamed Voice Over / Sound Effects / Music) and runs `processComp()` in check-only mode, OR-accumulating whether any layer anywhere already carries an expression-linked Stereo Mixer — if so, a single `confirm()` asks about overwriting. Pass two runs `processComp()` in apply mode with that answer.

`processComp()` iterates layers 1-based; audio-only footage layers (`FootageItem` with `hasVideo === false`) get categorized and wired, precomp layers recurse with the same top-level `mainCompName`, and everything else is skipped. `determineSlider()` lowercases the first marker's comment and checks `indexOf('voice over')` / `indexOf('music')`, defaulting to Sound Effects. `applyStereoMixer()` finds the layer's "Stereo Mixer" by display name, adds one when missing (or adds a second when the user declined overwrite), then assigns the slider-reference expression to both Left Level and Right Level.
