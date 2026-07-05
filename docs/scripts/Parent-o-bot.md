# Parent-o-bot
> Blend a layer's Position, Scale, Rotation, and Opacity toward up to two "parent" layers, each with its own 0–100% influence slider — a multi-parent rig you can animate after the fact.

**Category:** layers · **Version:** 2.0.2 · **UI:** DIALOG (multi-select layer list, OK / Cancel)

## What it does

Let one or two layers act as blended "parents" for others. Instead of After Effects' single hard parent link, each rigged layer gets a custom "Multi_Parent" effect that mixes its own Position, Scale, Rotation, and Opacity toward one or two chosen parent layers — per property, by an influence amount you set. A prop can track 70% of a hand's rotation and 30% of a body root's, or sit free until you raise its influence, all without native parenting.

Select the layer(s) to rig, run Parent-o-bot, pick one or two layers from the dialog to serve as parents, and click OK. Each target layer receives a fresh Multi_Parent effect with its Parent 1 / Parent 2 pickers already pointed at your choices, and expressions on its Position, Scale, Rotation, and Opacity that read the effect's controls at render time. Because the blend is expression-driven rather than keyframed, you can animate the influence sliders — and re-point the parents — directly in Effect Controls afterward, without touching the script again.

## Controls & options

Everything after applying lives on each target layer as the **Multi_Parent** effect. These control names are exact — the driving expressions reference them verbatim.

| Control | Type | Default | Meaning |
|---|---|---|---|
| Parent 1 | Layer picker | none | First parent layer (set from your dialog choice). |
| Parent 2 | Layer picker | none | Optional second parent. |
| Position | Checkbox | Off | Enables Position blending. |
| Rotation | Checkbox | Off | Enables Rotation blending. |
| Scale | Checkbox | Off | Enables Scale blending. |
| Opacity | Checkbox | Off | Enables Opacity blending. |
| Position Influence | Slider (%) | 0 | 0–100% blend weight toward the parent(s) for Position. |
| Scale Influence | Slider (%) | 0 | 0–100% blend weight for Scale. |
| Rotation Influence | Slider (%) | 0 | 0–100% blend weight for Rotation. |
| Opacity Influence | Slider (%) | 0 | 0–100% blend weight for Opacity. |

With one parent, influence blends the layer's own value toward that parent's value. With two parents assigned and a property enabled, influence blends between the two parents' values.

The dialog itself is just a multi-select layer list plus OK / Cancel: pick one or two layers to serve as parents.

## Usage

1. Select the layer(s) you want to rig.
2. Run Parent-o-bot. A dialog lists every layer in the comp.
3. Select one or two layers to act as Parent 1 (and optionally Parent 2), then click OK.
4. Each target layer gets a Multi_Parent effect with its parent pickers set.
5. In Effect Controls, check the properties you want to blend (Position/Rotation/Scale/Opacity) and raise the matching Influence slider. Keyframe the sliders to animate the blend over time.

## Notes

- Influence sliders and parent assignments are all animatable in Effect Controls — the rig needs no re-running to change over time.
- A layer can appear in the list as its own parent; the expressions detect self-reference and leave that property untouched.
- Scale blending is computed for 2D (X/Y) scale.
- The effect stores its layout as embedded pseudo-effect data, so the rig travels with the project.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active comp with at least one selected layer, or it alerts "Please select at least one layer in the active composition." and exits.
- Select only one or two parents in the list. Selecting three or more shows a warning; clicking OK with three or more selected applies nothing.
- Re-running on a layer replaces its existing Multi_Parent effect with a fresh one rather than stacking a second copy.

## How it works

The script guards for an active comp and a non-empty selection, then shows a dialog listing every layer by name. On OK it reads the one or two chosen parent names and, inside a "Parent-o-bot" undo group, processes each originally selected layer: it removes any existing Multi_Parent effect, applies a fresh copy from an embedded FFX binary via `applyPreset()`, sets the Parent 1 / Parent 2 layer pickers by name, and wires expressions on Position, Scale, Rotation, and Opacity.

The expressions read the effect's checkbox and matching Influence slider, resolve the Parent 1 / Parent 2 pickers to layer objects, and `linear()`-interpolate between the layer's own transform value and the parent's — the Scale expression working in scale ratios, the others blending the transform value directly. All control names come straight from the FFX binary's control metadata, so the expressions and the visible Effect Controls always agree.
