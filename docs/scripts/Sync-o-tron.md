# Sync-o-tron
> Make any property audio-reactive in one click — select it, hit TuneSync, and get auto-built Easing/Min/Max controls wired to your AUDIO REACTOR comp.

**Category:** effects · **Version:** 2.1.4 · **UI:** DIALOG (main window is a floating palette; the 2D/3D axis choosers are modal dialogs)

## What it does

Sync-o-tron wires an arbitrary property on an arbitrary layer — Opacity, Position, Scale, a color, even a slider inside a nested pseudo effect — to an audio-amplitude value, without you hand-writing the linking expression or building the range controls. It ships **with its Audio Reactor template project** (`Sync-o-tron.aep`, in the bundle's `ivg-scripts/projects/` folder): a comp whose name contains "AUDIO REACTOR" that measures amplitude and exposes it on a layer named "Select Frequency" via an "Audio Reactor" effect's "Output Power" slider. On launch (and again on TuneSync), if the current project has no AUDIO REACTOR comp, the script offers to import the template for you.

The workflow: open the palette, pick the reactor comp from the dropdown, select a layer and one property on it in the Timeline, click **TuneSync**. The script detects whether the property is 1D (Opacity, Rotation, a slider), 2D or 3D (Position/Scale/Anchor Point), or a Color. For 2D/3D it pops a follow-up dialog asking which axes should react and whether they share one Min/Max pair ("Unify Properties") or get independent per-axis sliders. It then adds the matching expression controls to the layer — an Easing Type dropdown plus Min/Max sliders, or Start/End color swatches — and writes an expression on the property that reads the audio value, runs it through `linear`/`easeIn`/`easeOut`/`ease`, and outputs between your Min and Max (or blends Start→End color).

It's built to be re-run per property: each TuneSync adds an independent, property-named control set without touching previously wired properties.

## Controls & options

### The naming contract (what the template must provide)

The generated expression always reads:

```
comp("<reactor comp>").layer("Select Frequency").effect("Audio Reactor")("Output Power")
```

| Name | What it must be |
|---|---|
| Comp name containing `AUDIO REACTOR` | How the dropdown finds reactor comps (substring match, exact case) |
| Layer `Select Frequency` | Layer inside the reactor comp exposing the audio value |
| Effect `Audio Reactor`, property `Output Power` | The amplitude output the expression reads (expected range 0–100) |

These names come from the companion template and are not validated — if they don't match, the generated expression errors at evaluation time.

### Main palette

| Control | Notes |
|---|---|
| Pick Reactor | Dropdown of every comp whose name contains "AUDIO REACTOR"; first match auto-selected |
| ↺ (refresh) | Re-scans the project (use after adding/renaming a reactor comp) |
| TuneSync | Wires the currently selected property |

### Axis dialog (2D and 3D properties only)

| Control | Meaning |
|---|---|
| X / Y (/ Z) checkboxes | Which axes react to audio |
| Unify Properties | One shared Min/Max pair for all checked axes instead of per-axis sliders |
| OK / Cancel | Apply or abort |

### Generated controls on the target layer

Controls are named `<property prefix>_<suffix>`:

| Suffix | Effect type | Created for |
|---|---|---|
| `_Easing Type` | Dropdown: Linear, EaseIn, EaseOut, EaseInOut | All property types |
| `_Min Output` / `_Max Output` | Sliders | 1D properties; 2D/3D with Unify checked |
| `_Min Output X/Y/Z` / `_Max Output X/Y/Z` | Sliders | 2D/3D without Unify — one pair per axis |
| `_Start` / `_End` | Color controls (defaults Green → Blue) | Color properties |

## Usage

1. Launch Sync-o-tron. If the project has no "AUDIO REACTOR" comp yet, accept the offer to import the bundled template (it looks for `Sync-o-tron.aep` next to the script, then in `ivg-scripts/projects/`; you can also point at it manually). Put your audio track inside the imported AUDIO REACTOR comp.
2. Run Sync-o-tron; the reactor comp should already be selected in the dropdown (↺ if you added it after opening the palette).
3. In your working comp, select the layer, then select the **single** property to make reactive.
4. Click **TuneSync**. 1D and Color properties wire immediately; 2D/3D properties show the axis dialog first — check the axes, optionally Unify, OK.
5. Open Effect Controls on the layer and shape the reaction with the new Easing Type and Min/Max (or Start/End color) controls.
6. Repeat from step 3 for more properties or layers.

## Notes

- The reactor dropdown finds AUDIO REACTOR comps nested in folders (case-insensitive), so the imported template inside its "Sync-o-tron.aep" folder shows up. Hit ↺ to rescan after importing.
- After a successful TuneSync the floating palette closes itself (a docked panel stays open — panels can't self-close).
- Rigging additional properties on the same layer is instant now; the old version froze for a few seconds per additional property (expression-probe type detection).

- Controls inside pseudo effects are fully supported — the script resolves the deepest selected property, so clicking a control inside a pseudo-effect group targets that control, not the group.
- For 1D/2D controls inside pseudo effects, the generated control names are prefixed with the parent effect's name (with "Vertex" rewritten to "Property-Vert") so multiple same-named controls stay distinguishable; 3D and Color properties use the raw property name.
- In 3D non-unified mode all six per-axis sliders are created even for unchecked axes — the unchecked axes' sliders are simply never read by the expression. Harmless clutter; delete them if you like.
- Re-running TuneSync on the same property adds a second control set rather than reusing the first — remove old sets manually if you re-wire.
- Only the first selected layer is used; extra selected layers are ignored.

## Requirements & edge cases

- Needs an active comp, a selected layer, and a selected property — each missing piece gets its own alert.
- With no "AUDIO REACTOR" comp present, TuneSync no longer writes a broken expression — it offers the template import and stops cleanly if declined.
- The selected property must accept expressions; non-expressible selections (and property groups) fall through to the 1D handler, which may not be what you want — select a leaf property.
- Renaming the reactor comp, the "Select Frequency" layer, the generated control effects, or the layer itself breaks the name-bound expressions.

## How it works

Two modules. **PropQuery** resolves and classifies the selection: `showDeepestSelectedProperty()` picks the entry with the greatest property depth (pseudo effects report both the group and its child as selected); `getPropertyType()` detects dimensionality by *temporarily assigning* probe expressions (`value`, `[value[0],value[1]]`, …) to the live property and checking `expressionError`, then restoring the original; `collectPropertyHierarchyInfo()`/`constructPropertyPath()` walk `parentProperty` up to the layer and serialize a `layer("…").property("…")…` address used later to re-find the property. Hand-rolled `indexOf`/`isArray` helpers stand in for the ES5 methods ExtendScript lacks.

**MainUI** builds the palette and dropdown (scanning `app.project` items for the "AUDIO REACTOR" substring), offering to `importFile()` the bundled template when none is found. TuneSync runs its guards first, classifies the property by value length plus the layer's 3D toggle (a 2D-layer Scale, which AE pads with an unused Z, uses the 2D handler so only X/Y controls are made; no expression probing — the old probe forced whole-comp expression re-evaluation through the audio chain and stalled for seconds on layers that already had a rigged property), then opens the "Create Controls" undo group and dispatches: 1D and Color wire immediately; 2D/3D route through the modal axis dialogs into their handlers. Each handler adds `ADBE Dropdown Control`/`ADBE Slider Control`/`ADBE Color Control` effects (the dropdown's items set via `setPropertyParameters`, which also renames the effect), then assembles the expression string: read Output Power from the reactor comp, branch on the Easing Type menu value to pick `linear`/`easeIn`/`easeOut`/`ease` over an input range of 0–100, and output between the Min/Max sliders (per axis or unified) or `linear`-blend the Start/End colors.
