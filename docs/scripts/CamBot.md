# CamBot
> A one‑node camera you direct from a single control panel — free‑fly it like an FPS cam, dial in a target to smoothly become a two‑node tracking cam, blend between multiple subjects, and play 26 procedural camera moves by keyframing one slider.

**Category:** animation · **Version:** 3.15.1 · **UI:** HEADLESS (run to build a rig; no dialog)

## What it does

CamBot builds a complete, fully‑rigged 3D camera that you control entirely from one effect panel — no hand‑animating rotation, no wrestling with After Effects' two‑node camera quirks. Run it on an open comp and it creates two layers:

- **`CamBot N Target`** — a shape layer with a crosshair graphic. This is both the **control host** (it carries the `CamBot` effect with every rig parameter) **and** the camera's default aim target. Move it to reposition where the camera looks.
- **`CamBot N Cam`** — the camera itself. Every one of its channels (position, orientation, roll, zoom, focus, aperture, blur) is driven by expressions that read the control host, so you never touch the camera directly.

The heart of CamBot is a single continuous dial between **one‑node** and **two‑node** behaviour. At **`Look‑At‑Influence` 0** the camera is a genuine free/FPS camera — you aim it with `Pan` / `Tilt` / `Roll` and it depends on no target at all. Raise `Look‑At‑Influence` and the aim **smoothly crossfades** to face a target; at 100 it's a locked two‑node tracking cam. There's no mode switch to flip and nothing breaks in the transition, because every rotation channel is owned by the rig (there are no stray manual rotation values to fight the aim).

On top of that sit the features you'd expect from a proper camera rig: **Dolly** and **Orbit**, intuitive **Focal Length in millimetres**, **smart depth of field** (auto‑focus that locks to the subject, F‑Stop, near/far blur, focus‑area width), **handheld shake** and follow **smoothing**, a **Realistic Limits** clamp that keeps lens/focus values physically plausible (or off, for stylized work), **multi‑target blending** (point at several layers and crossfade the look‑at between them), and a **procedural Moves engine** — 26 ready‑made camera moves you perform by keyframing a single `Progress` slider.

## How it works

- **Two layers, everything expression‑driven.** The camera reads all of its behaviour from the `CamBot` effect on the `CamBot N Target` shape. You animate the *controls*, never the camera.
- **Orientation‑driven aim (true one‑node).** Auto‑orient is turned off. The camera's **Orientation** is an expression that blends a *free direction* (from `Pan`/`Tilt`) with a *target direction* (toward the resolved target) by the **effective look‑at**. `X`/`Y Rotation` are locked to 0 and `Z Rotation` carries **Roll** — so all four rotation channels are owned by the rig and mode changes can never leave stray values behind.
- **Effective look‑at = `Look‑At‑Influence` × total target influence.** This is the master signal. If nothing is targeted (all target influences 0), the camera is one‑node even at Look‑At‑Influence 100. If Look‑At‑Influence is 0, it's one‑node regardless. Everything in between is a smooth blend, and target‑dependent features (auto‑focus, target aiming, tracking moves) fade in on the same signal.
- **The target is the crosshair.** `CamBot Target 1` (a small controller effect on the shape) defaults to targeting the shape itself at 100% — so out of the box, raising Look‑At‑Influence looks at the crosshair. Move the crosshair to aim.
- **Sensible defaults on build.** Focal 50 mm, Film 36 mm, F‑Stop 5.6, Blur 100, Realistic Limits + Auto‑Focus on, DOF off, Manual Focus 1500, Shake Rotation 0 / Speed 2.

## The control panel — `CamBot` effect (on `CamBot N Target`)

### ▸ MOVES — the procedural move engine

| Control | Type | Default | Purpose |
|---|---|---|---|
| Move | Dropdown | None | Pick a camera move (see the catalog below) |
| Progress | Slider | 0 | The move's playhead, 0→100. **Keyframe this to perform the move.** |
| Intensity | Slider | 100 | Scales the move's distance / angle |
| Reverse | Checkbox | Off | Flip the move's direction / spin |

Moves are **additive on top of your manual controls** — at Progress 0 nothing changes; keyframe Progress 0→100 and the bot performs the move relative to the current position and target.

### ▸ MOVE SHAPING — resize the selected move

Every move ships with sensible default dimensions (scaled to your comp). When you pick a move these controls **auto‑fill with that move's defaults** (via an expression) yet stay fully scrubbable — drag to resize the move, or keyframe them for a move that grows/shrinks as it plays. All units are absolute.

| Control | Type | Units | Purpose |
|---|---|---|---|
| Radius | Slider | px | Arc width for orbit / spiral / helix / swoop moves |
| Depth | Slider | px | Travel distance along the view axis (push / fly / helix advance) |
| Height | Slider | px | Vertical rise or drop (crane, swoop, pedestal‑style moves) |
| Turns | Slider | count (0–50) | Revolutions an orbit / spiral / helix makes |
| Spin | Angle | ° | Extra longitudinal roll added over the whole move (barrel‑roll a fly‑through) |

Only the dimensions a given move actually uses have any effect (`Turns` drives Helix, not Push In). Leave them at their auto‑filled defaults for the stock look.

### ▸ FRAMING — aim & roll

| Control | Type | Default | Purpose |
|---|---|---|---|
| Pan | Angle | 0° | Yaw — aim left/right (free‑aim direction) |
| Tilt | Angle | 0° | Pitch — aim up/down (free‑aim direction) |
| Roll | Angle | 0° | Camera roll / Dutch angle (drives Z Rotation) |
| Level Horizon | Checkbox | Off | Force Roll to 0 to keep the horizon flat |

`Pan`/`Tilt` define where a free camera looks. As `Look‑At‑Influence` rises, the aim crossfades from this free direction toward the target, so at full look‑at the target dominates and `Pan`/`Tilt` become fine offsets.

### ▸ POSITION

| Control | Type | Default | Purpose |
|---|---|---|---|
| Camera Position | 3D Point | 0,0,0 | Additive rig offset — the camera stays draggable, this adds on top |
| Separate Position Controls | Checkbox | Off | Use the individual X/Y/Z sliders instead of the 3D point (for **per‑axis easing**) |
| X / Y / Z Position | Sliders | 0 | Per‑axis offsets — keyframe each with independent easing |
| Dolly | Slider | 0 | Move along the view axis toward/away from the target — **without changing zoom** |
| Orbit | Angle | 0° | Swing around the target, horizontally |
| Orbit Elevation | Angle | 0° | Swing around the target, vertically |

**Why Separate Position?** A single 3D Position gives you an authorable motion path but one shared temporal ease. The `X/Y/Z Position` sliders trade the path for **independent easing per axis** — useful when one axis should snap while another glides. (Author a spatial path by moving the camera/target directly; use these offsets when you need per‑axis timing.)

### ▸ LENS

| Control | Type | Default | Purpose |
|---|---|---|---|
| Focal Length | Slider | 50 | Lens length in **millimetres** — drives the camera Zoom |
| Film Width | Slider | 36 | Sensor back in mm (36 = full frame). Change to match a format: Super35 ≈ 24.9, APS‑C ≈ 23.6, 16mm ≈ 12.5 |
| Realistic Limits Lock | Checkbox | On | Clamp lens/focus/aperture/blur to real‑camera ranges. Turn **off** for stylized/extreme values |

`Zoom = Focal Length × (comp width / Film Width)`. Think in real lenses; the rig does the pixel maths.

### ▸ FOCUS — look‑at, target appearance & depth of field

| Control | Type | Default | Purpose |
|---|---|---|---|
| **Look‑At‑Influence** | Slider | 0 | **The one‑node ↔ two‑node dial.** 0 = free camera; 100 = locked on the target |
| Target Scale | Slider | 100 | Scales the crosshair graphic |
| Target Opacity | Slider | 100 | Crosshair opacity |
| Target Hide | Checkbox | Off | Force crosshair opacity to 0 — the target still works, just no visible marker |
| DOF | Checkbox | Off | Enable depth‑of‑field blur |
| Auto‑Focus Lock | Checkbox | On | Lock focus to the target's distance (fades to Manual when not looking at a target) |
| Focus Offset | Slider | 0 | Pull focus in front of / behind the subject |
| Manual Focus Distance | Slider | 1500 | Focus distance when Auto‑Focus is off / one‑node |
| Focus Area Width | Slider | 0 | Depth of the sharp zone around the focus plane |
| F‑Stop (Aperture) | Slider | 5.6 | Lower = shallower depth of field, more blur |
| Blur Level | Slider | 100 | Master DOF blur — scales Near + Far together |
| Near Blur | Slider | 100 | Foreground blur strength (base for the master) |
| Far Blur | Slider | 100 | Background blur strength (base for the master) |

**Smart focus:** Auto‑Focus fades from **Manual → auto by the effective look‑at**, so in one‑node mode (no target) it focuses at the Manual distance, and the DOF focus plane always agrees with where the camera is aiming.

**Blur mapping:** the camera's Near/Far Blur = `[Near Blur × Blur Level%, Far Blur × Blur Level%]` — set a Near/Far ratio, then animate the single `Blur Level` to scale both proportionally (like a locked pair).

### ▸ FEEL

| Control | Type | Default | Purpose |
|---|---|---|---|
| Shake Position | Slider | 0 | Positional handheld amount (px) |
| Shake Rotation | Slider | 0 | Rotational handheld — jitters the **aim**, so it reads whether free or tracking |
| Shake Speed | Slider | 2 | Shake frequency |
| Shake Seed | Slider | 0 | Change for a different shake pattern |
| Smoothing | Slider | 0 | Follow‑lag — the camera eases up to ~0.6 s behind the target's motion |

## Targets & multi‑target blending — the `CamBot Target` controller

Aiming is handled by one or more small **`CamBot Target`** controller effects that live on the `CamBot N Target` shape. Each one has:

| Control | Type | Purpose |
|---|---|---|
| Target Layer | Layer Control | Which layer the camera should look at |
| Target Influence | Slider (0–100) | How strongly this target pulls the aim |

The camera aims at the **weighted average** of all `CamBot Target` layers (equal influences → the midpoint of the two). The resolved target also becomes the pivot for `Orbit`/`Dolly` and the reference for Auto‑Focus.

- **Add a target:** select the `CamBot Target 1` effect on the shape and **duplicate it** (⌘/Ctrl‑D). After Effects auto‑numbers the copy `CamBot Target 2`, `3`… — CamBot iterates them automatically. (The effect itself contains a note reminding you to duplicate.)
- **Blend / hand off:** point each copy's `Target Layer` at a different subject and **animate their `Target Influence` sliders**. Raising one 0→100 while lowering another 100→0 crossfades the aim smoothly through the midpoint.
- **Two subjects at 100% each:** the camera splits the difference and looks at their midpoint.

## The Move catalog (26 moves)

Keyframe `Progress` 0→100 to perform. `Intensity` scales the amount; `Reverse` flips direction/spin; the **Move Shaping** controls resize each move.

> **Departure vs arrival.** Most moves *depart* from your framed shot: Progress 0 = current view, 100 = the destination. A few *arrive* at it — **Reveal**, **Establish**, **Pull‑Back Reveal** and **Swoop High/Low** begin offset (Progress 0) and settle into the framed shot at Progress 100. `Reverse` flips either direction.

| Move | What the bot does |
|---|---|
| **Push In / Pull Out** | Dolly toward / away from the target |
| **Dolly Zoom In / Out** | Dolly + counter‑zoom (Vertigo): subject stays the same size, background warps |
| **Truck Left / Right** | Slide the rig sideways |
| **Pedestal Up / Down** | Raise / lower the whole rig |
| **Orbit** | Arc ~120° around the target · **Orbit 360** — a full lap |
| **Spiral In / Out** | Orbit while the radius shrinks / grows (flat spiral) |
| **Helix In / Out** | Corkscrew *around the view axis* toward / away from the target — wide→narrow (In) or narrow→wide (Out) |
| **Fly‑By** | Travel a straight path past the target |
| **Fly‑Through** | Travel forward through and beyond the target |
| **Swoop High / Low** | *Arrival* — start offset and high (High, clears floors) or low (Low), then swoop in along a curved arc to settle on the framed shot, with a roll bank |
| **Crane Up / Down** | Vertical boom |
| **Reveal** | Start tilted down, rise to the aim |
| **Establish** | High & wide → descend/push to the subject |
| **Pull‑Back Reveal** | Big pull‑back + slight rise + focal widen |
| **Whip Pan** | Fast whip that lands the aim on the target |
| **Parallax** | Sideways truck locked on the target for strong parallax |
| **Drift (Handheld)** | Continuous organic float using the shake feel |

> Some moves are inherently target‑centric (Orbit, Fly‑By tracking, Whip Pan, Parallax). Raise `Look‑At‑Influence` so the camera is actually looking at the target for those to read; the free moves (Push/Pull, Truck, Pedestal, Drift…) work in one‑node mode too.

## Usage

**Build a rig**
1. Open or select a composition.
2. Run **CamBot**. You get `CamBot N Target` (the crosshair + control panel) and `CamBot N Cam`.
3. Everything is driven from the `CamBot` effect on `CamBot N Target`. Open its Effect Controls.

**One‑node (free) camera**
1. Leave `Look‑At‑Influence` at 0.
2. Aim with `Pan` / `Tilt` / `Roll`. Move it with `Camera Position` / `Dolly`, dial a lens with `Focal Length`.
3. It depends on no target — a pure free/FPS camera.

**Two‑node (tracking) camera**
1. Move the `CamBot N Target` crosshair onto your subject (or point `CamBot Target 1`'s `Target Layer` at an existing layer).
2. Raise `Look‑At‑Influence` toward 100 — the camera smoothly turns to face it. Keyframe the influence to "find" and lock a subject.
3. Turn on **Auto‑Focus Lock** and **DOF** for rack‑focus that follows the subject.

**Blend between subjects**
1. Duplicate the `CamBot Target 1` effect (⌘/Ctrl‑D) → `CamBot Target 2`.
2. Point each at a different layer.
3. Keyframe their `Target Influence` sliders to crossfade / hand off the aim.

**Play a move**
1. Frame your shot, pick a **Move** from the dropdown.
2. Keyframe **Progress** 0→100 across the range you want. Ease the Progress keyframes to taste.
3. Tune with `Intensity` and `Reverse`.

## Key concepts & tips

- **The dial is everything.** `Look‑At‑Influence` × total target influence = how "two‑node" you are. 0 = free, 1 = locked. Continuous — animate it.
- **Never keyframe the camera's own Rotation/Orientation.** The rig owns all four rotation channels by expression. Steer with `Pan`/`Tilt`/`Roll` — hand‑rotating an expression‑driven camera fights the rig.
- **Dolly ≠ Zoom.** `Dolly` moves the camera (parallax/perspective changes); `Focal Length` changes the lens. Dolly Zoom uses both against each other.
- **Realistic Limits.** On = physically plausible focal/F‑Stop/focus/blur. Off = anything AE allows, for stylized FOVs and extreme DOF.
- **Multiple rigs** coexist — each run makes `CamBot 2 Target` / `CamBot 2 Cam`, etc., fully independent.

## Requirements & edge cases

- **"Allow Scripts to Write Files and Access Network"** must be enabled (Preferences ▸ Scripting & Expressions) — CamBot registers its control effects from a temporary preset on first use.
- **Renaming layers breaks the rig.** The camera references `CamBot N Target` by name; don't rename the target shape or camera.
- **JavaScript expression engine** recommended (CamBot uses `lookAt`, vector helpers, `noise`). This is AE's default for modern projects.
- **Editing the control effect?** After Effects caches registered pseudo‑effects — if the panel ever looks out of date after an update, restart AE.
- The **crosshair graphic ignores scene lights/shadows** by design (so it stays readable); hide it entirely with `Target Hide` while keeping the target functional.
