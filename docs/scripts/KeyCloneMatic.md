# KeyCloneMatic
> Repeat a hand-tuned set of keyframes down the timeline at a fixed or decaying interval — values, easing, and spatial tangents cloned faithfully.

**Category:** keyframes · **Version:** 2.0.1 · **UI:** DIALOG

## What it does

KeyCloneMatic clones whatever keyframes you've selected — on one property or many, one layer or many — and stamps repeated copies of that whole set later in time, spaced by an interval you choose. Animate one cycle of a bounce, blink, or gesture by hand, then repeat it N more times (or fill the rest of the comp) without copy/pasting.

A small dialog collects the spacing in frames, the repetition count (or a "Comp Duration" auto-fill), and an optional **Temporal Decay** that progressively shrinks the gap between repeats — so cycles accelerate over time like a ball settling — shaped by a Linear, Ease In, or Ease Out curve over a decay window you set.

Each cloned keyframe carries over its value, in/out interpolation types, temporal ease, spatial tangents and continuity, roving, and label color — a faithful copy, not a simplified one. The script only touches keyframes you selected; it never creates layers, effects, or expressions, and the whole run is one "KeyCloneMatic" undo step.

## Controls & options

| Control | Default | Meaning |
|---|---|---|
| Interval Duration (frames) | 100 | Frame gap between the end of one repeated set and the start of the next |
| No. of Repetitions | 5 | How many copies to stamp out. Ignored when Comp Duration is checked |
| Comp Duration | unchecked | Auto-computes the repetition count to fill the remaining comp duration |
| Temporal Decay | unchecked | Shrinks the interval per repetition instead of keeping it constant |
| Decay Duration (frames) | 1200 | Window over which the decay completes — larger values decay more slowly. Only used when Temporal Decay is checked |
| Decay Type | Linear | Curve for the shrink: **Linear** (steady), **Ease In** (holds near full, then decays faster), **Ease Out** (decays fast at first, then eases toward zero) |
| Cancel / Proceed | — | Proceed validates the numbers, closes the dialog, and runs the duplication |

With decay enabled, the gap shrinks from the full interval toward zero as repetitions progress — repeats bunch closer and closer together.

## Usage

1. In the Timeline, select the layer(s), the property/properties, and then the specific keyframes that make up the cycle you want repeated.
2. Run KeyCloneMatic.
3. Set the interval (frames) between repeats.
4. Type a repetition count, or check **Comp Duration** to fill the rest of the comp.
5. Optionally check **Temporal Decay**, set a decay duration, and pick a curve.
6. Click **Proceed**. Copies appear down the timeline; one undo reverses everything.

## Notes

- The selected keyframes' overall span defines the pattern: each repetition places the whole pattern, then advances by the pattern length plus the (possibly decayed) interval — repeats stay evenly spaced.
- Auto Bezier keyframes are cloned as ordinary Bezier keyframes with the ease frozen at clone time — the clones won't re-adjust themselves the way Auto Bezier keys do.
- Clones that would land past the end of the comp are silently dropped.
- New keyframes come in selected, so you can immediately nudge or re-run on the result.

## Requirements & edge cases

- After Effects CS6 or later.
- Needs an active composition — otherwise "No active composition selected."
- Needs at least one selected keyframe on a selected property — otherwise "No keyframes selected."
- With **Comp Duration** checked and a single selected keyframe (or keys all at one time), the interval must be greater than 0 — the script alerts and stops rather than computing infinite repetitions.
- Non-numeric input in any required field is rejected with an alert before anything runs (decay duration is only required when Temporal Decay is checked; repetitions only when Comp Duration is unchecked).

## How it works

The script opens its undo group, builds the `Window('dialog')`, and blocks on `dialog.show()`; Proceed parses and validates the fields, closes the dialog, and calls `duplicateKeyframesAcrossLayers()`. The undo group closes after the dialog returns, so both alert paths stay balanced.

A local `Keyframe(property, keyIndex)` helper snapshots everything about one key — time, value, in/out interpolation, temporal ease and continuity, label, roving, and (for spatial properties) tangents and continuity — and its `.clone(newTime)` re-creates the key elsewhere via `addKey` + `setValueAtKey` + the matching `set…AtKey` calls.

The main routine sweeps `selectedLayers` → `selectedProperties` → `keySelected` keys into a pattern array while tracking the earliest/latest selected times. `durationPerSet` is the pattern's span; in Comp Duration mode the repetition count is derived from the remaining comp length divided by (span + interval). A decay-factor table is precomputed per repetition — progress `t = i·interval / decayDuration`, clamped to 1, shaped as `1−t`, `1−t²`, or `(1−t)²`. Each pass then clones the original pattern at `duplicateTime + (keyTime − patternStart)` and advances `duplicateTime` by span plus the decayed interval, so drift can't accumulate across passes.
