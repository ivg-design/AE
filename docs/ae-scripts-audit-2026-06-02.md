# AE Scripts Audit - 2026-06-02

## Scope

Repository cloned from `https://github.com/ivg-design/ae.git` into:

`/Users/ivg/github/ae-script-catalog/ae`

Audited the 31 distributable After Effects scripts in `packages/ae-scripts/src`. I also syntax-checked the five ancillary `.jsx` files outside that package and the top-level helper modules in `tools/scripting-modules`, because some catalog scripts depend on those modules.

This was a static audit. I did not execute the scripts inside After Effects.

## Checks Performed

- Parsed every `.jsx` file in the repo with Acorn `--ecma3`.
- Parsed every top-level `tools/scripting-modules/*.js` helper with Acorn `--ecma3`.
- Scanned `packages/ae-scripts/src` for modern wrapper-runtime constructs outside comments/strings: `let`, `const`, arrows, spread, `JSON.*`, `Array.isArray`, `Object.keys`, `Object.assign`, `.map`, `.forEach`, `.filter`, `.reduce`, `.includes`, `.trim`.
- Parsed direct string-literal expression assignments as JavaScript function bodies. Result: 76 direct expression strings parsed cleanly; 9 concatenated/dynamic expression assignments were skipped because static reconstruction would require runtime values.
- Generated all `Limb-a-tron` `getExpression()` outputs from the imported `2.7.0` file and parsed the combined expression program as modern JavaScript.
- Reviewed front matter for name, version/date, UI mode, functionality claims, changelog presence where available, and dependency disclosure.

## Fixes Applied

- Removed ECMA-3-incompatible trailing commas from:
  - `packages/ae-scripts/src/composition/Slidotron_16x9.jsx`
  - `packages/ae-scripts/src/composition/Slidotron_9x16.jsx`
  - `packages/ae-scripts/src/composition/Split-o-matic_9x16.jsx`
  - `packages/ae-scripts/src/effects/BurstMate.jsx`
  - `packages/ae-scripts/src/layers/Parent-o-bot.jsx`
  - `packages/ae-scripts/src/layers/SubtitleForge.jsx`
  - `packages/ae-scripts/src/paths/Distributron.jsx`
  - `packages/ae-scripts/src/paths/VertexMaster.jsx`
  - `tools/scripting-modules/Ae.js`
  - `tools/scripting-modules/ApplyFFX.js`
- Replaced ExtendScript wrapper use of ES5+ APIs:
  - `Linearizer`: replaced `JSON.stringify` with an ECMA-3-safe serializer.
  - `PathMaster`: replaced `.map()` and `JSON.stringify` with ECMA-3-safe helpers.
  - `Sync-o-tron`: replaced `JSON.stringify` inside PropQuery output with an ECMA-3-safe serializer.
- Fixed Slidotron expression generation:
  - `Slidotron_16x9` no longer hard-codes `comp("Comp 1")`.
  - `Slidotron_9x16` no longer hard-codes `comp("Book Tutorial Short 9x16")`.
  - Both now escape and use the actual selected comp name.
- Removed a destructive placeholder expression assignment from `Onionizer`.
- Corrected front matter:
  - Added missing `@ui` tags to `Guiderator` and updated `ChromaBlenderizer` to `@ui PALETTE`.
  - Updated versions/changelogs for touched scripts.
  - Replaced `Limb-a-tron` with the provided `2.7.0` import and updated its feature summary/changelog to cover regular/noodle bodies, radial-safe outline logic, and intelligent bake mode.
  - Updated `ChromaBlenderizer` to `2.3.1` with vendored Smallpath AdobeColorPicker v2.0, modeless target-selection flow, swatch-only color picking, white default swatches, tooltips, and corrected swatch/config behavior.
  - Downgraded `Onionizer` documentation from finished/professional system to unfinished prototype status.
  - Updated `Rectangulator` front matter to disclose its dependency/bundling requirement.
  - Updated active README/catalog descriptions for `Limb-a-tron` and changed the README version note to per-script versioning.
  - Added an `Unreleased` repo changelog entry for the `Limb-a-tron` `2.7.0` replacement.
  - Corrected repo `CHANGELOG.md` 2.0.0 date from `2025-01-13` to `2025-08-13`, matching git history.

## Current Static Status

- All 35 repo `.jsx` files parse as ECMA-3.
- All top-level `tools/scripting-modules/*.js` files parse as ECMA-3.
- No scanned ES5+/modern runtime APIs remain outside strings/comments in `packages/ae-scripts/src`.
- Direct string-literal expressions parse cleanly, and the generated `Limb-a-tron` expression set parses as modern JavaScript. Remaining dynamic/concatenated expressions still need After Effects runtime validation.

## Remaining High-Risk Items

1. `Rectangulator` is not standalone in its current source form. It references `RefManager`, `ApplyFFX`, and `expressions`, but the include lines are commented and point to stale local module paths. The front matter now discloses this, but the script still needs a proper bundling/include fix before direct Script menu use.

2. `Onionizer` remains an unfinished prototype. The destructive placeholder expression write was removed, but the script still depends on `PropQuery` and does not yet create controller parameters, apply time offsets, or fully link selected properties. The available `tools/scripting-modules/PropQuery.js` also includes test code that runs on load, so it is not safe to include as-is without cleanup.

3. Some historical housekeeping documents still mention pre-reorganization Limb-a-tron source filenames and old version assumptions. Active README/catalog entries have been updated, but archival housekeeping notes were left unchanged.

## Per-Script State

| Script | State | Front Matter | ExtendScript ECMA-3 | Expression / Runtime Notes |
|---|---|---|---|---|
| `animation/Limb-a-tron.jsx` | Updated and passes static audit | Replaced with provided `2.7.0` version; feature summary/changelog now describe IK/FK controls, regular/noodle bodies, radial-safe outline logic, trim passes, and selected-rig bake mode. | Parses as ECMA-3; wrapper scan found no ES5+/modern API use outside strings/comments. | Generated `getExpression()` outputs parse as modern JavaScript and use AE expression APIs such as `createPath`; needs AE runtime test with embedded FFX and both create/bake workflows. |
| `animation/Linearizer.jsx` | Fixed | Updated to `1.5.2` with changelog. | `JSON.stringify` removed; parses as ECMA-3. | Generated expressions are intended for the expression engine and use serialized keyframe arrays. |
| `animation/PathMaster.jsx` | Fixed | Updated to `2.0.1` with changelog. | `.map()` and `JSON.stringify` removed; parses as ECMA-3. | Dynamic expression uses `pointOnPath`, marker parsing, and cubic bezier easing; needs AE runtime validation. |
| `composition/Guiderator.jsx` | Pass static audit | Added missing `@ui PANEL`; changelog already present. | Parses as ECMA-3. | Uses `eval()` for calculator input; acceptable as local UI behavior but worth keeping constrained to math-only input if hardened later. |
| `composition/Slidotron_16x9.jsx` | Fixed | Updated to `2.0.1` with changelog. | Trailing comma removed; parses as ECMA-3. | Fixed expressions to reference the actual selected comp name instead of hard-coded `Comp 1`. |
| `composition/Slidotron_9x16.jsx` | Fixed | Updated to `2.0.1` with changelog. | Trailing comma removed; parses as ECMA-3. | Fixed expressions to reference the actual selected comp name instead of hard-coded `Book Tutorial Short 9x16`. |
| `composition/Split-o-matic_9x16.jsx` | Fixed | Updated to `2.0.1` with changelog. | Trailing comma removed; parses as ECMA-3. | Many generated expression assignments; direct literal expressions parse. Runtime should be tested due compCode-generated structure. |
| `effects/BurstMate.jsx` | Fixed | Updated to `2.0.1`; requirement now says FFX data is embedded. | Trailing commas removed; parses as ECMA-3. | Direct expressions parse. Embedded FFX contains misspelled control label `Strokes Rotation Ofset`; code matches that label, so changing it would require preset regeneration. |
| `effects/ChromaBlenderizer.jsx` | Fixed | Updated to `2.3.1`; front matter now describes the modeless palette, vendored Smallpath AdobeColorPicker v2.0 origin/license, swatch-only color picking, target-selection guidance, white defaults, and swatch/config fix. | Parses as ECMA-3; embedded picker source is sanitized before embedding and also parses as ECMA-3. | No expressions applied. Uses `eval()` only to localize the vendored picker, captures its return/export, and restores any previous `$.global.colorPicker` so the script does not rely on Duik. Needs AE runtime smoke test for picker display and modeless target selection. |
| `effects/Sync-o-tron.jsx` | Fixed | Updated to `2.0.1` with changelog. | `JSON.stringify` removed; parses as ECMA-3. | Dynamic expressions depend on an Audio Reactor comp/layer/effect. Concatenated expression strings need AE runtime validation. |
| `effects/sfxMaster.jsx` | Pass static audit | Description matches centralized audio slider behavior; no changelog present. | Parses as ECMA-3. | Direct audio-level expressions parse. Categorization depends on first marker comment text. |
| `keyframes/KeyBot.jsx` | Pass static audit | Description matches keyframe math panel. | Parses as ECMA-3. | No expression assignments. Runtime validation should focus on selected-keyframe edge cases. |
| `keyframes/KeyCloneMatic.jsx` | Pass static audit | Description matches keyframe duplication/decay behavior. | Parses as ECMA-3. | No expression assignments. Static pass did not validate AE keyframe interpolation semantics. |
| `keyframes/Valuatron.jsx` | Pass static audit | Description matches current-value keyframing. | Parses as ECMA-3. | No expression assignments. It keyframes evaluated property values, including expression results. |
| `layers/NullBot.jsx` | Pass static audit | Description matches null-at-average-position behavior. | Parses as ECMA-3. | No expression assignments. Runtime test should verify parenting/selection behavior across 2D and 3D layers. |
| `layers/OrderMaster.jsx` | Pass static audit | Description matches layer/group reordering. | Parses as ECMA-3. | No expression assignments. Runtime risk is contiguous selection validation. |
| `layers/Parent-o-bot.jsx` | Fixed | Updated to `2.0.1` with changelog. | Trailing comma removed; parses as ECMA-3. | Expression generator builds multi-parent transform expressions. Needs AE runtime test for 3D layers and self-parent avoidance. |
| `layers/Rectangulator.jsx` | Blocked for standalone use | Updated to `2.0.1`; front matter now discloses dependency requirements. | Parses as ECMA-3. | References `RefManager`, `ApplyFFX`, and `expressions` without active valid includes. Needs bundling/include repair before runtime use. |
| `layers/SubtitleForge.jsx` | Fixed | Updated to `2.0.1`; requirement now says FFX data is embedded. | Trailing commas removed; parses as ECMA-3. | Direct expressions parse. Text style expression uses modern text style APIs, appropriate for current AE expression engine but needs version-specific AE test. |
| `layers/TextMate.jsx` | Pass static audit | Description matches text highlighting/range selector behavior. | Parses as ECMA-3. | No expression assignments. Runtime test should cover multiline text and repeated search terms. |
| `layers/TimeWarp-a-tron.jsx` | Pass static audit | Description matches time-remap/controller linking. | Parses as ECMA-3. | One generated expression; direct string assignment is dynamic and should be AE-tested. |
| `paths/Centralizer.jsx` | Pass static audit | Description matches path guide UI. | Parses as ECMA-3. | Dynamic path expressions/guide operations need AE runtime validation; stale commented include is non-executing. |
| `paths/Distributron.jsx` | Fixed | Updated to `1.1.1` with changelog. | Trailing comma removed; parses as ECMA-3. | Uses bundled ApplyFFX and path-following expressions. Runtime test needed for open/closed path math and selected layer range controls. |
| `paths/Originator.jsx` | Pass static audit | Description matches path origin centering. | Parses as ECMA-3. | No expression assignments. Runtime validation should confirm centroid/transform handling for nested groups. |
| `paths/PathDuplitron.jsx` | Pass static audit | Description matches copy/paste tangent workflow. | Parses as ECMA-3. | No expression assignments. Runtime test should verify 2D vs 3D position tangent transfer. |
| `paths/Trace-o-matic.jsx` | Pass static audit | Description matches mask-to-shape conversion. | Parses as ECMA-3. | Direct expression assignments are concatenated with layer names; static syntax reconstruction skipped them. Runtime test should verify names with quotes/backslashes. |
| `paths/VertexMaster.jsx` | Fixed | Updated to `2.0.1` with changelog. | Trailing comma removed from expression string array; parses as ECMA-3. | Generated expressions use `createPath`, `points`, `inTangents`, and `outTangents`, appropriate for modern AE expressions. Needs runtime test for tangent modes. |
| `utilities/Iteratron.jsx` | Pass static audit | Description matches interpolation between start/end layer property values. | Parses as ECMA-3. | No expression assignments. Runtime test should cover color, 1D, 2D, and 3D property interpolation. |
| `utilities/Onionizer.jsx` | Fixed but incomplete | Updated to `2.0.1`; front matter now says prototype/incomplete. | Placeholder expression write removed; parses as ECMA-3. | Still blocked by unsafe/missing PropQuery include and incomplete controller/time-offset implementation. |
| `utilities/RandoMatic.jsx` | Pass static audit | Description matches randomizing selected keyframes. | Parses as ECMA-3. | No expression assignments. Runtime test should verify dimensional range handling and selected keyframe detection. |
| `utilities/Triminator.jsx` | Pass static audit | Description matches adding Trim Paths and optional keyframes. | Parses as ECMA-3. | No expression assignments. Runtime test should cover selected groups vs entire shape layer behavior. |

## Ancillary JSX Files

These files also parse as ECMA-3 but were not treated as part of the 31-script AE catalog front-matter audit:

- `packages/cep-extensions/barebones/host/index.jsx`
- `packages/cep-extensions/frame-navigator/src/js/jsx/index.jsx`
- `packages/cep-extensions/frame-navigator/src/jsx/window-manager.jsx`
- `packages/cep-extensions/frame-navigator/test_frame_display.jsx`
- `packages/ph-scripts/export.jsx`

## Recommended Next Work

1. Fix and bundle `Rectangulator` dependencies so it can run as a standalone AE script.
2. Split `PropQuery.js` test/demo code away from the module, then repair `Onionizer` includes and finish its controller/time-offset behavior.
3. Run an After Effects smoke test for each script category, especially scripts that apply FFX binaries or generate dynamic expression strings.
4. Decide whether to revise or archive historical housekeeping docs that still reference old source names and version assumptions.
