# Limb-a-tron
> Rig a two-segment IK/FK limb in seconds — drag one null to bend it, tune everything from a single Limb Control effect, and bake the rig into plain keyframes when you're done.

**Category:** animation · **Version:** 2.7.0 · **UI:** DIALOG ("Name the Limb" for creation; a Yes/No confirmation for baking)

## What it does

Limb-a-tron builds two-segment limbs (arms, legs, tentacles, tails) without hand-animating a single bone. Run it with nothing selected, type a name (e.g. "Left Arm"), and it creates a shape layer whose limb body is drawn procedurally by expressions, plus a null controller ("Left Arm CTRL") carrying a "Left Arm Limb Control" pseudo-effect with every rig parameter: segment lengths, joint widths, curvature, IK/FK angles, noodle mode, fill/stroke appearance, pop prevention. Drag the null and the limb bends toward it with inverse kinematics; check "Disable IK" to pose it manually with FK angle sliders instead.

Two body styles share the same solve and controls: **Regular Limb** renders a classic tapered two-bone shape with a rounded elbow, and **Noodle Limb** (via the "Noodle Mode" checkbox) renders a continuously curved tube for soft, rubbery appendages — switching modes never requires re-rigging. Lightweight linked stroke passes trace whichever body is active, with trim toggles to hide the cap where a limb plugs into a torso.

The second superpower: Limb-a-tron recognizes its own rigs. Run it again with a limb layer or its controller selected and it switches to **bake mode** — it samples the animated path, simplifies it to a minimal keyframe set, strips out whichever render mode wasn't in use, and removes the controller null. A live procedural rig becomes a lightweight, controller-free animated shape layer, ready for handoff or performance-sensitive comps.

## Controls & options

All rig tuning lives on the **`<name> Limb Control`** pseudo-effect on the **`<name> CTRL`** null.

**Dimensions — Upper Limb / Lower Limb** (one group per segment)

| Control | Type | Default (Upper / Lower) | Range | Purpose |
|---|---|---|---|---|
| Limb Length | Slider | 100 / 100 | 0–100 | Segment length |
| Top Width | Slider | 50 / 30 | 0–100 | Width at the near (shoulder/elbow) end |
| Top Curvature | Slider | 100 / 100 | 0–100 | Roundness of that end |
| Bottom Width | Slider | 30 / 15 | 0–100 | Width at the far (elbow/wrist) end |
| Bottom Curvature | Slider | 100 / 0 | 0–100 | Roundness of that end |
| Enable Side Curvature | Checkbox | Off | — | Asymmetric bulge/pinch along one side |
| Enable Inverse Curvature | Checkbox | Off | — | Flips the bulge to a pinch |
| Side Curvature Center Point | Slider | 0 | −100–100 | Where the bulge sits along the segment |
| Side Curvature Bend | Slider | 0 | 0–100 | Bulge amount |
| Left/Right Side Weight | Slider | 0 | −100–100 | Balances the bulge between edges |

**Noodle**

| Control | Type | Default | Purpose |
|---|---|---|---|
| Noodle Mode | Checkbox | Off | Switch the body from Regular to the sampled-tube Noodle |
| Noodle Curvature | Slider | 100 | How far the tube bulges toward the elbow |
| Noodle Tension | Slider | 100 | Smoothing/tangent tension of the tube |

**FK / IK**

| Control | Type | Default | Purpose |
|---|---|---|---|
| Disable IK | Checkbox | Off | Switch to manual FK angles |
| Upper Limb Angle | Angle | 0° | Manual shoulder angle (FK) |
| Lower Limb Angle | Angle | 0° | Manual elbow angle, added to the shoulder (FK) |
| IK Direction | Slider | −100 | Elbow bend direction / solve blend |
| Pop Prevent | Slider | 0 | Anti-pop softening as the controller nears full reach |

**Appearance**

| Control | Type | Default | Purpose |
|---|---|---|---|
| Arm Fill Color / Opacity | Color / Slider | — / 100 | Body fill (both modes) |
| Arm Stroke Color / Width | Color / Slider | — / 0 | Outline stroke (0 = none) |
| Shoulder Stroke / Wrist Stroke | Checkboxes | On / On | Include/exclude the cap nearest the shoulder/wrist in the outline |

**Parenting Data** (expression-driven outputs — don't hand-edit): `IK Angles`, `Elbow (comp space)`, `Elbow (layer space)`, `Wrist  (comp space)`, `Wrist  (layer space)`, `Proximity / Pop Prevent Factor`, `Adjusted U/L Limb Lengths`. Tap these to attach hands, feet, or props to the solved joints. Note the Wrist controls really have **two spaces** before "(comp space)"/"(layer space)" — match that exactly if you reference them in your own expressions.

## Usage

**Create a limb**
1. Make the target comp active and make sure **no layers are selected**.
2. Run the script, name the limb (e.g. "Arm L"), OK.
3. The limb shape layer and its `"<name> CTRL"` null appear at comp center.
4. Drag the null to bend the limb. Open the null's Effect Controls for everything else — lengths, widths, curvature, Noodle Mode, colors, FK, pop prevention.
5. Parent hands/props to the shape layer, or wire them to the `Wrist  (comp space)` / `Elbow (comp space)` outputs.

**Bake a finished rig**
1. Select the limb's shape layer *or* its CTRL null.
2. Run the script again and confirm "Bake the animation…".
3. The path animation is sampled and simplified to minimal keyframes, the unused render mode is stripped, and the controller null is removed — leaving a self-contained animated shape layer.

## Notes

- The rig is entirely name-bound: expressions reference `"<name> CTRL"`, the limb layer name, and the `"<name> Limb Control"` effect. Renaming any of them after creation breaks the rig.
- Both body groups always exist; the inactive one collapses to a zero-area path, so mode switching is instant and keyframeable.
- Bake mode also understands rigs built by older Limb-a-tron versions (legacy "Limb Body"/"Upper Limb"/"Lower Limb" groups).
- Bake simplification uses a fixed error threshold (2.25) — it trades tiny path deviations for far fewer keyframes; the threshold isn't user-exposed.
- Appearance/trim properties driven by animated controls get baked to keyframes; ones with static controls collapse to plain static values.

## Requirements & edge cases

- Needs an active composition; alerts and exits otherwise.
- Needs **"Allow Scripts to Write Files and Access Network"** enabled — the pseudo-effect is installed by writing a temp `.ffx` and calling `applyPreset()`.
- Needs the modern JavaScript expression engine — the path expressions use `createPath()` and other features the legacy ExtendScript engine lacks.
- Creation requires an empty selection; with anything selected the run is treated as a bake attempt (and alerts if the selection isn't a recognized rig).
- Baking requires at least one keyframe somewhere on the controller or the limb's parent chain; otherwise it alerts and does nothing.
- If the controller null is locked, the bake still completes and reports that the controller couldn't be removed.
- The bake runs in its own undo group that closes on every path, including errors — a failed bake never leaves the undo stack dangling.

## How it works

One self-invoking block. The entry guard checks for a comp, then branches: any selected layers route to bake mode; an empty selection opens the "Name the Limb" dialog, whose OK handler runs the whole creation flow inside a "Limb-a-tron" undo group.

Creation builds the shape layer with two parallel body groups under the root vector group — "Regular Limb" and "Noodle Limb", each a path whose `ADBE Vector Shape` carries a fully self-contained procedural expression — plus an "Arm Stroke" group of four linked stroke passes that reference the body paths by `content(...).path` expression (no duplicated geometry) with per-mode Trim Paths wiring. A null named `"<name> CTRL"` is added, both layers get cross-referencing `.comment` tags for later rig discovery, and the ~105 KB embedded FFX preset (matchname `Pseudo/LimbControlsV3`) is applied via a temp file, then renamed to `"<name> Limb Control"`. Seven of the effect's own point controls receive expressions so they self-compute (elbow/wrist positions, IK angles, adjusted lengths, pop-prevent factor), and the Noodle Curvature/Tension sliders are bumped to 100 over the preset's zero defaults.

The IK expression is a standard analytic two-bone solve: law of cosines for the elbow, `atan2` for the shoulder, sign from IK Direction, with the layer's own rotation and up to four ancestors' rotations subtracted so nesting doesn't skew the solve; "Disable IK" falls back to the FK angle sliders. Pop prevention smoothly shortens effective segment lengths as the controller approaches full reach. The Regular body samples a tapered outline with rounded caps and a filleted elbow; the Noodle body samples a curved centerline into two side rails, repairs self-intersections in tight folds, and switches to a radial-sweep envelope for extreme fold angles.

Bake mode (`intelligentBakeLimb`, in its own try/finally-guarded undo group) collects every keyframe time across the controller and parent chain, snaps to whole frames, identifies the active render mode, samples the active body path(s) at each frame, simplifies with a recursive Ramer–Douglas–Peucker-style pass over vertices and tangents, writes linear keyframes back, deletes or freezes the inactive groups, bakes or collapses the driven appearance properties, and finally removes the controller null (best-effort), reporting the results in an alert.
