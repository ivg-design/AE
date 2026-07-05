# Catalog audit & fix report — 2026-07-04

Full-catalog verification of all 31 scripts, in three layers:

1. **Test harness** (`ae/tools/ae-test-harness`) — 176/176 unit/integration tests pass; all 30 in-scope scripts pass the static (ES3 parse, frontmatter, includes), expression-syntax, functional (sandboxed AE host simulation), and UI-capture pipelines. Onionizer remains intentionally known-blocked (external `@include 'modules/PropQuery.js'`).
2. **Deep audit** — one agent per script read every line hunting for AE-runtime-only defects the harness cannot see (name mismatches against embedded FFX binaries, ES3 violations, expression/runtime API errors, logic bugs). Every raw finding was then attacked by 3 independent adversarial verifiers; only majority-upheld findings survived. Result: **49 confirmed issues** (11 critical / 19 major / 19 minor); 38 further claims were refuted and discarded.
3. **Fix pass** — all 29 in-scope critical+major issues were fixed (surgical, minimal diffs), each fix double-reviewed, and the whole harness re-run green.

## Sandbox improvements (test harness)

To model AE faithfully (needed to unblock Rectangulator, and load-bearing for RefManager-style walks):
- Root-level property groups now expose `parentProperty` → the owning layer (AE: the layer IS the top-level PropertyGroup).
- Layers expose an explicit `parentProperty: null` (scripts test `!== null`).

## Critical/major fixes applied (18 scripts)

| Script | New version | Fixes |
|---|---|---|
| Rectangulator | 2.1.0 → 2.1.1 | Inlined RefManager/ApplyFFX/expressions (was dead-include-blocked); corrected all expression control names to the real "Rectangulator Controls" pseudo-effect (incl. its baked-in `"Anchor Point "` trailing space and `"Bottom Right Left Corner Rounding"` typo); removed nonexistent Position Offset logic; hardened `__state` re-baselining |
| PathMaster | (no tag) | Replaced invalid `layer.effect(...)` scripting call; wired the dead "Reverse Direction?" checkbox |
| Sync-o-tron | (no tag) | Removed ES3-fatal `Array.prototype.indexOf`; fixed 2D expression referencing never-created sliders |
| KeyBot | (no tag) | `currentValue.slice()` no longer applied to non-array (OneD/SHAPE/TEXT) property values |
| KeyCloneMatic | 2.0.0 → 2.0.1 | Fixed clone-time drift/compounding; fixed NaN `repetitions` on "Comp Duration" (+ divide-by-zero guard); wired the dead "Decay Duration" input; fixed inverted/no-op ease curves |
| Valuatron | 2.0.0 → 2.0.1 | Removed undefined-global `writeLn` call that aborted every run with an open undo group |
| Parent-o-bot | 2.0.1 → 2.0.2 | Expressions now wired to every selected target layer, not just the last |
| TimeWarp-a-tron | 2.0.0 → 2.0.1 | Slider-row selection normalized to its parent effect; fixed `controllerName` shadowing |
| Trace-o-matic | 2.0.0 → 2.0.1 | Fixed wrong path-group name lookup that threw on every run; static mask path/opacity values now copied |
| PathDuplitron | 2.0.0 → 2.0.1 | Removed the crashing shape-layer intermediate (invalid SHAPE-property writes); copy/paste now drives AE's native keyframe clipboard so tangents/ease genuinely transfer |
| Linearizer | 1.5.7 → 1.5.8 | Batch mode gained the property-type compatibility guard; batch controller names no longer malformed/colliding |
| OrderMaster | 2.0.0 → 2.0.1 | activeItem guard (no more unclosed undo group); shape groups reordered by object reference, not name |
| VertexMaster | 2.0.1 → 2.0.2 | `vertexControlNull` undeclared-global fixed; removed hardcoded `propertyGroup(3)` depth assumption; tree selection validated by property type, not display-name substring |
| sfxMaster | 2.0.0 → 2.0.1 | Inverted conditional meant Stereo Mixer was never created when missing; `foundExisting` now OR-accumulates across comps |
| Centralizer | 2.0.0 → 2.0.1 | `toComp()` conversion no longer gated on `hasParent` (scale was double-applied for parented layers) |
| Distributron | 1.1.1 → 1.1.2 | Expression binds to the actually-created mask's name instead of hardcoded "Mask 1" |
| Iteratron | 2.0.0 → 2.0.1 | All three button handlers guard `app.project.activeItem` being an open comp |
| Slidotron_9x16 | 2.0.1 → 2.0.2 | `setTrackMatte()` (AE 23+) vs "CS6 or later" claim resolved honestly (compatibility statement corrected) |

Every fix was verified by two independent reviewers; the two reviewer-flagged problems (a divide-by-zero hang path introduced in KeyCloneMatic's Comp-Duration fix, stale PathDuplitron frontmatter) were remediated afterwards. One fixture (`PathDuplitron.fixture.js`) was updated because the fix legitimately changed the operation flow.

## Confirmed minor issues — documented, not yet fixed

- **Limb-a-tron** — Noodle-mode stroke trim models the wrong point order, so "Shoulder Stroke" off doesn't hide the shoulder cap in Noodle Mode (3/3)
- **PathMaster** — path lookup in a shape's Contents matches by child name; duplicate sibling names resolve to the wrong shape (2/3)
- **Split-o-matic_9x16** — cancelling the mandatory prefix prompt corrupts generated layer names (3/3)
- **sfxMaster** — partial mutation happens before the "select only compositions" guard on mixed selections (3/3)
- **Sync-o-tron** — no guard when no "AUDIO REACTOR" comp exists; silently generates a broken `comp("null")` expression (3/3)
- **KeyCloneMatic** — Auto Bezier keyframes clone as frozen Bezier (3/3)
- **OrderMaster** — shape-group filter accepts any NAMED_GROUP, not just ADBE Vector Group (3/3)
- **Parent-o-bot** — selecting >2 parents + OK silently does nothing (2/3)
- **Rectangulator** — `getCompositePosition()` ignores parent rotation/scale (3/3); repeated runs stack duplicate same-named pseudo effects (3/3)
- **TextMate** — color-rotation "avoid repeat" logic never excludes anything (2/3)
- **TimeWarp-a-tron** — no null-check on activeItem before reading selectedLayers (3/3)
- **Centralizer** — temporary Slider Control effects are never removed (3/3)
- **Distributron** — no check that the selected layer is a shape layer (3/3)
- **VertexMaster** — vertex control null isn't positioned at the actual path vertex on creation (3/3)
- **RandoMatic** — range-row labels sized for 3 axes but Color properties have 4 (3/3); guard alert promises a keyframe-selection check the code doesn't perform (3/3)

(Onionizer's confirmed critical — `PropQuery.main(...)` is not a valid call — is excluded from fixing by request; it remains known-blocked.)

## Related

- Per-script reference docs: [`docs/scripts/`](scripts/README.md)
- Harness report: `ae/tools/ae-test-harness/.out/report/report.md`
