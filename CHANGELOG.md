# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
