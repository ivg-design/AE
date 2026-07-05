# Per-script documentation

One reference document per catalog script, generated 2026-07-04 from a full read of each script's source (not just its frontmatter). Each doc covers: what the script does, how the implementation works (entry flow, guards, algorithm, AE APIs used), every control/option, step-by-step usage, requirements & edge cases, and audit notes.

These files are also rendered by the landing site (`site/docs.html?s=<slug>`).

## Animation & Rigging
- [Limb-a-tron](Limb-a-tron.md) — IK/FK limb rig with regular/noodle body modes
- [Linearizer](Linearizer.md) — link any property to a driver via linear() expressions
- [PathMaster](PathMaster.md) — animate layers along mask paths

## Composition
- [Guiderator](Guiderator.md) — guide placement with calculator input
- [Slidotron_16x9](Slidotron_16x9.md) — horizontal slider comp scaffolding
- [Slidotron_9x16](Slidotron_9x16.md) — vertical slider comp scaffolding

## Effects & Audio
- [BurstMate](BurstMate.md) — radial stroke-burst preset applier
- [ChromaBlenderizer](ChromaBlenderizer.md) — modeless color interpolation palette
- [sfxMaster](sfxMaster.md) — audio import & marker-driven SFX management
- [Sync-o-tron](Sync-o-tron.md) — property synchronization across layers

## Keyframes
- [Elast-o-matic](Elast-o-matic.md) — elastic overshoot / gravity bounce after keyframes (Cmd/Ctrl switches variant)
- [KeyBot](KeyBot.md) — keyframe value/velocity batch editor
- [KeyCloneMatic](KeyCloneMatic.md) — clone keyframes across layers & properties
- [Valuatron](Valuatron.md) — relative/absolute keyframe value offsets

## Layers
- [Controllerizer](Controllerizer.md) — gather selected properties onto one Controller Null
- [NullBot](NullBot.md) — average-position parent null creation
- [OrderMaster](OrderMaster.md) — precise reordering of contiguous layers
- [Opac-o-bot](Opac-o-bot.md) — parent Opacity to the layer's parent via expression
- [Parent-o-bot](Parent-o-bot.md) — multi-parent constraint system
- [Reseterator](Reseterator.md) — zero layer anchors and shape-group offsets
- [Rectangulator](Rectangulator.md) — parametric rectangle → controllable bezier group
- [SubtitleForge](SubtitleForge.md) — expression-driven subtitle system
- [TextMate](TextMate.md) — find & style text instances across layers
- [TimeWarp-a-tron](TimeWarp-a-tron.md) — time-remap automation & layer timing links

## Paths & Shapes
- [Centralizer](Centralizer.md) — center path guides on layers
- [Distributron](Distributron.md) — distribute layers along a motion path
- [Originator](Originator.md) — move anchor/origin to path features
- [Trace-o-matic](Trace-o-matic.md) — auto-trace layer outlines to shapes
- [VertexMaster](VertexMaster.md) — vertex-level path editing utilities

## Utilities
- [Iteratron](Iteratron.md) — interpolate a property across intermediate layers
- [RandoMatic](RandoMatic.md) — randomize keyframe values/timing
- [Triminator](Triminator.md) — batch trim-paths application

---

*Excluded from distribution:* [Split-o-matic_9x16](Split-o-matic_9x16.md) and [PathDuplitron](PathDuplitron.md) are withheld by owner decision (it stays in the repo but is not listed on the site or included in bundles). [Onionizer](Onionizer.md) is known-blocked (depends on an external `@include` module and `PropQuery.main()` is not a valid call). It stays in the repo for reference but is not listed on the site or included in bundles.
