# Documentation Table of Contents

## Overview
- [README](../README.md) - Project overview and quick start
- [CHANGELOG](../CHANGELOG.md) - Version history and changes
- [CLAUDE.md](../CLAUDE.md) - AI assistant context and guidelines

## Script Documentation
- [Per-Script Reference Docs](scripts/README.md) - One in-depth doc per script (what it does, how it works, controls, usage, edge cases)
- [Audit & Fix Report 2026-07-04](audit-and-fixes-2026-07-04.md) - Full-catalog audit: 49 verified findings, 29 fixed, remaining minors
- [Script Functionality Catalog](development/SCRIPT_FUNCTIONALITY_CATALOG.md) - Complete list of all 31 scripts with descriptions
- [Naming Convention](NAMING_CONVENTION_FINAL.md) - Script naming guidelines
- [Clever Naming Proposals](CLEVER_NAMING_PROPOSALS.md) - Alternative naming ideas

## Project Organization
- [Project Audit Report](PROJECT_AUDIT_REPORT.md) - Repository structure analysis
- [Reorganization Summary](REORGANIZATION_SUMMARY.md) - Monorepo migration details

## Development
- [API Documentation](api/) - Technical API references
- [Development Guides](development/) - Development best practices
- [User Guides](guides/) - User documentation

## GitHub Integration
- [Issues Tracker](https://github.com/ivg-design/JSX/issues) - Active development issues
- [Project Board](https://github.com/users/ivg-design/projects/6) - AE Scripts Maintenance & Development

## Script Categories

### Animation (3 scripts)
- [PathMaster](../packages/ae-scripts/src/animation/PathMaster.jsx) - Path following animations
- [Linearizer](../packages/ae-scripts/src/animation/Linearizer.jsx) - Property linking system
- [Limb-a-tron](../packages/ae-scripts/src/animation/Limb-a-tron.jsx) - IK/FK limb rig with regular/noodle body modes

### Composition (4 scripts)
- [Guiderator](../packages/ae-scripts/src/composition/Guiderator.jsx) - Guide placement with calculator
- [Slidotron_16x9](../packages/ae-scripts/src/composition/Slidotron_16x9.jsx) - Horizontal slider compositions
- [Slidotron_9x16](../packages/ae-scripts/src/composition/Slidotron_9x16.jsx) - Vertical slider compositions
- [Split-o-matic_9x16](../packages/ae-scripts/src/composition/Split-o-matic_9x16.jsx) - Split-screen templates

### Effects (4 scripts)
- [ChromaBlenderizer](../packages/ae-scripts/src/effects/ChromaBlenderizer.jsx) - Modeless color interpolation palette
- [sfxMaster](../packages/ae-scripts/src/effects/sfxMaster.jsx) - Audio control system
- [BurstMate](../packages/ae-scripts/src/effects/BurstMate.jsx) - Stroke burst effects
- [Sync-o-tron](../packages/ae-scripts/src/effects/Sync-o-tron.jsx) - Audio-visual sync

### Keyframes (3 scripts)
- [KeyBot](../packages/ae-scripts/src/keyframes/KeyBot.jsx) - Keyframe value modification
- [KeyCloneMatic](../packages/ae-scripts/src/keyframes/KeyCloneMatic.jsx) - Keyframe duplication
- [Valuatron](../packages/ae-scripts/src/keyframes/Valuatron.jsx) - Expression baking

### Layers (7 scripts)
- [NullBot](../packages/ae-scripts/src/layers/NullBot.jsx) - Automatic null creation
- [OrderMaster](../packages/ae-scripts/src/layers/OrderMaster.jsx) - Layer reordering
- [Parent-o-bot](../packages/ae-scripts/src/layers/Parent-o-bot.jsx) - Multi-parent system
- [Rectangulator](../packages/ae-scripts/src/layers/Rectangulator.jsx) - Rectangle conversion
- [SubtitleForge](../packages/ae-scripts/src/layers/SubtitleForge.jsx) - Subtitle presets
- [TextMate](../packages/ae-scripts/src/layers/TextMate.jsx) - Text highlighting
- [TimeWarp-a-tron](../packages/ae-scripts/src/layers/TimeWarp-a-tron.jsx) - Time remapping

### Paths (6 scripts)
- [Centralizer](../packages/ae-scripts/src/paths/Centralizer.jsx) - Path center guides
- [Distributron](../packages/ae-scripts/src/paths/Distributron.jsx) - Layer distribution
- [Originator](../packages/ae-scripts/src/paths/Originator.jsx) - Origin centering
- [PathDuplitron](../packages/ae-scripts/src/paths/PathDuplitron.jsx) - Motion path copying
- [Trace-o-matic](../packages/ae-scripts/src/paths/Trace-o-matic.jsx) - Mask to shape conversion
- [VertexMaster](../packages/ae-scripts/src/paths/VertexMaster.jsx) - Vertex control

### Utilities (4 scripts)
- [Iteratron](../packages/ae-scripts/src/utilities/Iteratron.jsx) - Property interpolation
- [Onionizer](../packages/ae-scripts/src/utilities/Onionizer.jsx) - Onion skinning
- [RandoMatic](../packages/ae-scripts/src/utilities/RandoMatic.jsx) - Randomization
- [Triminator](../packages/ae-scripts/src/utilities/Triminator.jsx) - Trim paths
