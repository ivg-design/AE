# Split-o-matic_9x16
> Inject a ready-made picture-in-picture split-screen rig into your 9:16 comp — mask, shadow, crop bars, and on-canvas controllers, all named with a prefix you choose.

**Category:** composition · **Version:** 2.0.1 · **UI:** HEADLESS (one native prompt for the naming prefix; no other UI)

## What it does

Split-o-matic 9x16 drops a complete picture-in-picture kit into the currently active composition — the classic vertical "inset video over a background" layout used in TikTok/Reels/Shorts content. One run adds ten pre-wired shape layers: a rounded PiP mask, a matching shadow copy with a Drop Shadow effect, top and bottom crop rectangles, and a set of hidden guide/controller layers (with DUIK-style controller markers) that act as on-canvas handles and stable parents.

The mask's size and the shadow's look are exposed as sliders, a color, and an angle on the **"PiP MASK PSR"** controller layer — expressions keep the visible mask and its shadow copy in lockstep, so the rig is tuned from one Effect Controls panel rather than by editing shapes.

Before building anything, the script asks for a text prefix to prepend to every layer it creates (e.g. `A_`), so multiple rigs in the same comp stay visually distinct without hand-renaming. All layers are created with placeholder names, bulk-renamed to `<prefix><name>` at the end, and every expression is automatically repointed to the final names.

Note: despite the name, the script does not create a new composition or check the comp's size — it augments whatever comp is active, and its baked-in geometry fits a 1080×1920 frame.

## Controls & options

The one interactive prompt: **"Enter a prefix to prepend to all property names:"** — type a prefix or leave blank (don't Cancel; see edge cases).

Ongoing tuning lives on the **`<prefix>S- PiP MASK PSR`** layer's Effect Controls:

| Control | Effect type | Default | Drives |
|---|---|---|---|
| Mask Size X | Slider | 466 | Width of both PiP mask rectangles |
| Mask Size Y | Slider | 413 | Height of both PiP mask rectangles |
| PiP Shadow Opacity | Slider | 0 (unset) | Drop Shadow opacity — raise it to see the shadow |
| PiP Shadow Distance | Slider | 22 | Drop Shadow distance |
| PiP Shadow Softness | Slider | 6 | Drop Shadow softness |
| PiP Shadow Color | Color | black | Drop Shadow color |
| Pip Shadow Angle | Angle | 134° | Drop Shadow direction (the "Pip" casing is how it appears in Effect Controls) |

Layout is handled by moving the controller layers on-canvas: **PiP Content PSR** (the PiP handle, parented to PiP MASK PSR), **Top PSR** and **Bottom PSR** (crop-bar handles). The crop rectangles ("Mask Top"/"Mask Bottom", 1080×960 each) and the mask/shadow shapes start disabled and/or locked as scaffolding — unlock before editing them directly.

## Usage

1. Open or select the composition to receive the rig — ideally 1080×1920; the script does not create one.
2. Run the script and type a naming prefix (or leave blank) at the prompt, then OK.
3. Ten new layers appear at the top of the stack, pre-parented and pre-wired.
4. Select **`<prefix>S- PiP MASK PSR`** and set Mask Size X/Y plus the shadow controls (raise PiP Shadow Opacity and enable the shadow layer if you want the shadow).
5. Drag the PiP/Top/Bottom PSR controller layers to compose the layout.
6. You can ignore the empty "9x16 Template" folder that appears in the Project panel — nothing is placed in it.

## Notes

- Mask expressions reference the controller layer and control names (`Mask Size X`, `PiP Shadow Color`, …) **by name** — renaming the PiP MASK PSR layer or its effects afterward breaks the wiring. Renaming during creation is safe: the script uses AE's expression auto-fix when it applies your prefix.
- The shadow layer starts disabled *and* its opacity slider starts at 0 — two switches to flip before a shadow shows.
- Seven of the ten layers are locked after creation (masks, crop rectangles, Zero anchors) so the scaffolding can't be dragged accidentally; unlock to modify.
- Guide layers carry DUIK-style marker metadata — inert unless a DUIK-family rigging tool reads them.
- Running the script again adds another full ten-layer rig with the new prefix; it never modifies an existing rig.

## Requirements & edge cases

- After Effects CS6 or later.
- A composition must be active before running — otherwise "Please select a composition first" and a clean exit.
- Geometry is hardcoded for **1080×1920**: crop rectangles are 1080×960 and anchor positions sit at 1080-wide coordinates. Other resolutions run without error but land the crop bars and anchors in the wrong places.
- **Don't Cancel the prefix prompt.** Cancel returns null, and every layer name comes out as `nullS- PiP Content PSR`, `nullS- PiP MASK PSR`, etc. The rig still works (expressions follow the actual names), but the names are ugly — leave the field blank instead.
- The prompt blocks execution, so the script isn't suitable for unattended/batch invocation.

## How it works

One recorder-generated function (`compCode_…` — a compCode v1.2.2 artifact) inside a `try { beginUndoGroup; …; endUndoGroup } catch { alert }` wrapper. After the active-comp guard, it finds-or-creates the "9x16 Template" project folder (a leftover — the folder is never used afterward), then builds ten `layers.addShape()` layers in sequence: hand-icon PSR controllers with DUIK controller markers, the master PiP MASK PSR controller with its Slider/Color/Angle Control effects, the two mask rectangles (visible + Drop Shadow copy), the 1080×960 top/bottom crop rectangles, and three hidden "Zero" anchor layers.

Parenting is applied with `setParentWithJump()` (content → mask controller → Zero anchor; both mask copies → mask controller), preserving screen positions. Expressions are written on the two mask rectangles' Rect Size (and the shadow's Drop Shadow parameters), all reading the controller's effects by name.

Every created layer is registered with its placeholder `name:`-prefixed name; a final pass renames each to `<prefix><name>` and calls `app.project.autoFixExpressions(oldName, newName)` — AE's project-wide expression find/replace — so the freshly written expressions repoint to the final names. Last, the scaffolding layers are locked.
