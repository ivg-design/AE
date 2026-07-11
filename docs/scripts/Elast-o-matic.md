# Elast-o-matic
> Give any keyframed property physical follow-through in one click — springy elastic overshoot by default, or gravity bounces when you hold Cmd/Ctrl at launch.

**Category:** keyframes · **Version:** 1.1.1 · **UI:** HEADLESS (variant chosen by the modifier key held at launch)

## What it does

Elast-o-matic adds automatic follow-through after your keyframes, with no baking and no extra keyframes. Select one or more keyframed properties, run it, and each **layer** with a selection gets one controller effect plus an expression on every selected property that reacts to that property's existing keys — every keyframe arrival gets the overshoot treatment, not just the last one.

It works across a whole selection at once. Select properties on several layers and each layer gets **its own** controller (added once per layer) driving all of that layer's selected properties. And you can pick which keyframes bounce: select just **some** of a property's keyframes (two or more) and only those keys overshoot — the unselected keyframes, and the motion after them, stay native.

There are two variants in one tool. The default **Inertial Bounce** is a decaying spring: motion overshoots and oscillates back like elastic. Hold **Cmd (macOS) / Ctrl (Windows) while launching** — from the IVGD Command Bar the icon swaps to the bounce curve while the key is down — to apply **Bounce** instead: gravity bounces that settle, like a ball hitting the floor. Everything stays editable afterwards from the Effect Controls panel.

The Inertial variant can even follow *another* layer's motion: tick External Driver, pick the layer and which of its transform channels to listen to, and this property bounces whenever that layer's keyframes land.

## Controls & options

Each layer with a selection gets one controller effect, named `Inertial Bounce` or `Bounce`, shared by all the selected properties on that layer (each property still reacts to its own keyframes; they share the tuning below). Re-running reuses a layer's existing controller instead of stacking a new one.

**Inertial Bounce controls**

| Control | Default | Meaning |
|---|---|---|
| Amplitude | 20 | Overshoot strength (% of arrival velocity) |
| Frequency | 2 | Oscillations per second |
| Decay | 2 | How fast the spring settles (higher = faster) |
| Duration | 1.5 | Seconds after a keyframe during which the spring is active |
| Delay (in frames) | 0 | Offset applied when following an External Driver |
| External Driver | off | Follow another layer's keyframes instead of this property's |
| External Driver Layer | — | The layer to follow |
| External Animated Property | position | Which driver channel to read: position / rotation / scale / opacity / xPosition / yPosition |

**Bounce controls**

| Control | Default | Meaning |
|---|---|---|
| Elasticity | 0.7 | Energy kept per bounce (0–1: higher = bouncier) |
| Gravity | 5000 | Pull strength — higher lands each bounce faster |
| Number of bounces | 5 | Bounces before the value settles for good |

## Usage

1. Animate a property normally (at least one keyframe).
2. Select the property (or several, across layers) and run Elast-o-matic — hold Cmd/Ctrl for the Bounce variant.
3. To bounce only off certain keyframes, select just those (two or more) before running; the unselected keys stay native. Select the whole property (or all its keys) to bounce off every keyframe.
4. Scrub: motion now overshoots (or bounces) after each keyframe. Tune from Effect Controls.

## Notes

- One controller per layer: re-running reuses it, and selecting properties on multiple layers rigs each layer independently (the effect no longer piles onto the first selected layer).
- Selecting a subset of a property's keyframes overshoots only off the selected keys; unselected keyframes, and the motion after them, return the native value unchanged.
- Remove the expression from the property to un-rig it (the effect can stay or go).
- The FFX-registration snippet (temp .ffx + throwaway comp) is based on "Apply Pseudo Effect as Animation Preset" © 2017 Tomas Šinkūnas, rendertom.com; the tool itself is IVG Design's.

## Requirements & edge cases

- Needs an open comp and at least one selected keyframeable property — each missing piece alerts and exits cleanly.
- First run in a project may need "Allow Scripts to Write Files and Access Network" enabled (the controller is registered from a temporary .ffx).
- The Bounce variant needs real arrival velocity — properties eased to zero velocity at the key won't bounce.
- Expressions reference the controller by name; renaming it breaks the link.

## How it works

The script picks its variant from `ScriptUI.environment.keyboardState` at launch (metaKey/ctrlKey → Bounce). It walks every layer in the comp, reads `layer.selectedProperties`, and for each layer that has expressible selections it registers the pseudo effect if needed (`canAddProperty` check; if missing, the embedded FFX binary is written to the temp folder and applied once on a throwaway comp), adds or reuses one controller via `addProperty(matchName)`, and assigns each selected property an expression pointing at that controller. When a proper subset of a property's keyframes is selected, their times are captured first (before the controller is added, since `addProperty` reshuffles the timeline selection) and baked into the expression, which overshoots only when the keyframe driving the value at that moment is one of the selected ones. The Inertial expression finds the last keyframe before the current time (its own keys, or the External Driver's), measures arrival velocity with `velocityAtTime()`, and adds a decaying sine (`sin(freq·t·2π) / e^(decay·t)`); the Bounce expression converts arrival velocity into a gravity-bounce series, each bounce losing energy by the Elasticity factor, until Number of bounces is exhausted. One undo group wraps the whole run.
