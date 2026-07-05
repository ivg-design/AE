# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2026-07-04]

### Added
- **New scripts (4):**
  - `Elast-o-matic` `1.0.0` — elastic overshoot / gravity bounce after a keyframe; hold Cmd/Ctrl at launch to switch variant.
  - `Reseterator` `1.0.0` — zero the transform origin of selected layers (layer anchor to `[0,0,0]`, nested shape groups re-centered).
  - `Opac-o-bot` `1.0.0` — parenting for Opacity via expression.
  - `Controllerizer` `1.0.0` — gather selected properties from any layers onto one Controller Null as expression controls.
- **IVGD Command Bar** (`packages/ae-scripts/toolbar/IVGD Command Bar.jsx`) — dockable, resizable ScriptUI panel with one icon button per bundled script; responsive reflow, bundled tooltips, `ivg-scripts/` auto-discovery, and live Cmd/Ctrl variant-icon swapping.
- **Website** (`site/`) — self-contained static catalog, per-script docs viewer, animated hero, and a **Build-a-bar** client-side ZIP generator (checked scripts + the Command Bar). Deployed as an independent Vercel project to https://forge.mograph.life/apps/ae.
- **Test harness** (`tools/ae-test-harness`) — vitest pipeline: ES3 static parse (acorn), malformed-`@include` scan, expression syntax, functional sandbox, and ScriptUI capture. All 32 distributed scripts pass.
- `site/tools/build-data.mjs` — parses script front matter into `scripts.json` / `meta.json`, applies curated taglines from `copy-overrides.json`, and copies icons/docs/scripts/toolbar/template project into `site/` for self-containment.
- Bundled `Sync-o-tron.aep` template project that auto-imports on launch.

### Changed
- Rewrote all 32 distributed-script docs with a fixed section order (What it does → Controls & options → Usage → Notes → Requirements & edge cases → How it works) and purpose-first taglines.
- Bumped audited scripts: `Sync-o-tron` `2.1.4`, `Rectangulator` `2.1.5`, `Centralizer` `2.1.0`, `Distributron` `1.1.2`.

### Fixed
- `Centralizer` — removed a malformed `@include` comment that raised a line-87 syntax error; added multiselect, parametric-shape (Rect/Ellipse/Star), and image/precomp support with a union bounding box.
- `Rectangulator` — inlined dependencies, seeded the controller from the original rectangle, guarded expression control lookups, and fixed a stale path-group reference and the anchor-point control.
- `Sync-o-tron` — fixed the property-type probe (no value read / expression probing), a folder-nested reactor lookup, a multi-property build stall (expression suspend/restore), 3D per-axis expression generation, and the palette not closing after apply.

### Removed
- Excluded `Onionizer`, `PathDuplitron`, and `Split-o-matic_9x16` from distribution (still present in `src/`, omitted from the bundle, Command Bar, and website).

## [Earlier Unreleased]

### Added
- Vendored Smallpath `AdobeColorPicker` v2.0 under `vendors/AdobeColorPicker` and embedded a sanitized local copy in `ChromaBlenderizer`.

### Changed
- Replaced `Limb-a-tron` with the imported `2.7.0` regular/noodle limb rig and updated its front matter, feature descriptions, and catalog documentation.
- Updated `ChromaBlenderizer` to `2.3.1` with a modeless palette, swatch-only color picking, clearer target-selection guidance, swatch/picker tooltips, white default swatches, and repeat-apply workflow.

### Fixed
- Fixed `ChromaBlenderizer` swatch picks so the selected picker color updates the config used by `Apply Colors`.

## [2.0.0] - 2025-08-13

### Added
- Comprehensive monorepo structure with `packages/` organization
- 3 new scripts recovered from dist folder:
  - **[Linearizer](packages/ae-scripts/src/animation/Linearizer.jsx)** - Property linking with driver-based interpolation
  - **[Distributron](packages/ae-scripts/src/paths/Distributron.jsx)** - Layer distribution along shape paths  
  - **[Trace-o-matic](packages/ae-scripts/src/paths/Trace-o-matic.jsx)** - Mask to shape conversion with keyframes
- Complete JSDoc documentation for all 31 scripts
- [GitHub project](https://github.com/users/ivg-design/projects/6) for script maintenance and development
- Individual tracking issues for each script ([#2](https://github.com/ivg-design/JSX/issues/2)-[#39](https://github.com/ivg-design/JSX/issues/39))

### Changed
- Reorganized all scripts into categorized folders (animation, composition, effects, keyframes, layers, paths, utilities)
- Renamed all scripts to follow consistent naming convention:
  - it_follows → PathMaster
  - Parametric_IK_Limb → Limb-a-tron
  - All scripts now use "-tron", "-ator", "-o-matic" suffixes
- Updated all UI window titles and undo groups to match new names
- Standardized all scripts to version 2.0.0
- Moved frame-navigator to packages/cep-extensions/

### Fixed
- Documentation inconsistencies in [SCRIPT_FUNCTIONALITY_CATALOG.md](docs/development/SCRIPT_FUNCTIONALITY_CATALOG.md)
- Missing script descriptions in [README.md](README.md)
- Incorrect script counts (now correctly shows 31 scripts)

### Removed
- Duplicate scripts (Guiderator_calc, DualParentator)
- Old dist folder with outdated versions
- Deprecated test folders and files
- Legacy bundler configurations

## [1.0.0] - 2024-12-15

### Initial Release
- 28 production-ready After Effects scripts
- Basic folder organization
- Initial documentation
