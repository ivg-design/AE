# 2-3 IK Rigger
> Rig a 2- or 3-segment IK chain from existing layers — pick your segments, tip, and goal null, and it parents the chain and wires the IK rotation expressions in one click.

**Category:** animation · **Version:** 1.0.0 · **UI:** PALETTE

## What it does

2-3 IK Rigger turns layers you have already built into a working inverse-kinematics chain. You choose a **two-layer** (upper + lower) or **three-layer** (upper + middle + lower) setup, tell it which layers are the segments, which is the **Limb Tip** (the end of the chain), and which is the **Goal / Controller** null, and it does two things: it **parents** the segments into a chain, and it writes a closed-form **law-of-cosines IK expression** onto each segment's Rotation so the whole chain bends to keep the tip reaching toward the goal.

The rig is driven entirely by the **Goal null** — animate or drag it and the limb solves in real time. A **Change IK Direction** checkbox is added to the goal so you can flip which way the elbow/knee bends; in three-layer mode a **Rotate Tip** checkbox controls whether the tip layer rotates along with the chain.

## How to set up the rig

The script wires layers you provide — it does **not** create them. Before running it, build the pieces:

| Layer | What it is | Anchor point |
|---|---|---|
| **Upper segment** | The first bone (upper arm / thigh). | On the **root joint** (shoulder / hip). |
| **Middle segment** *(3-layer only)* | The middle bone. | On its **upper joint**. |
| **Lower segment** | The next bone (forearm / shin). | On the **elbow / knee joint**. |
| **Limb Tip** | The end of the chain (hand / foot). Any layer; a null works well. | On the **end joint** (wrist / ankle). |
| **Goal / Controller** | A layer — usually a **Null** — that you animate to drive the chain. | Anywhere; you animate its **Position**. |

**Anchor points are the whole game.** The IK math measures distances between each layer's anchor point (in world space), so each segment's anchor must sit on the joint it rotates around. If the anchors are in the wrong place the chain will solve to the wrong lengths and bend oddly.

The chain does **not** need to be pre-parented — the script parents it for you: lower → upper (and middle in between for 3-layer), and tip → lower. The Goal is left un-parented so it stays free to animate.

## Controls & options

| Control | Type | Role |
|---|---|---|
| Inverse Kinematics Type | Dropdown | `Two Layer IK Setup` or `Three Layer IK Setup`. Enables/disables the Middle Limb row. |
| Set Upper / Middle / Lower Limb | Dropdowns | The chain segments (Middle only used in 3-layer). |
| Set Limb Tip | Dropdown | The layer at the end of the chain. |
| Set Limb Controller/Goal | Dropdown | The null you animate to drive the chain. |
| **Refresh** | Button | Re-reads the active comp's layers into every dropdown (keeps your current picks where possible). |
| **Apply** | Button | Validates, parents the chain, and applies the IK expressions inside one undo group. |
| **Close** | Button | Closes the palette. |

**Added to the Goal on Apply**

| Effect | Mode | Role |
|---|---|---|
| Change IK Direction (checkbox) | both | Flip the elbow/knee bend direction. |
| Rotate Tip (checkbox, on by default) | 3-layer | Whether the tip rotates with the chain. |

## Usage

1. Build the layers above and set each segment's **anchor point on its joint**.
2. Run **2-3 IK Rigger** and choose Two- or Three-Layer IK.
3. Assign every dropdown; set **Limb Controller/Goal** to your null.
4. Click **Apply** — the chain is parented and the IK expressions are applied.
5. Animate the **Goal null** to pose the limb. Toggle **Change IK Direction** on the goal if the bend flips the wrong way.

## Notes

- Needs an active composition with at least 4 layers (upper, lower, tip, goal; 5 for three-layer). All chosen layers must be unlocked and distinct.
- Re-running **Apply** reuses the existing goal checkboxes rather than stacking duplicates.
- The toolbar rollover previews the **2-layer icon on Alt** and the **3-layer icon on Cmd**.
- The rig logic lives in AE expressions on each segment's Rotation (`length()`, `clamp()`, `radiansToDegrees()`, `toWorld()`), so it evaluates live as you animate the goal.
