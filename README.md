# Adobe After Effects JSX Scripts Collection

A comprehensive collection of 31 production-ready scripts and tools for Adobe After Effects, organized as a monorepo with categorized functionality.

## Quick Start

```bash
# Install dependencies
yarn install

# Navigate to a specific script category
cd packages/ae-scripts/src/

# For CEP extensions
cd packages/cep-extensions/frame-navigator
yarn dev
```

## Repository Structure

```
JSX/
├── packages/
│   ├── ae-scripts/          # After Effects Scripts (31 scripts)
│   │   └── src/
│   │       ├── animation/   # Motion and rigging tools
│   │       ├── composition/ # Comp management and navigation
│   │       ├── effects/     # Visual effects and audio sync
│   │       ├── keyframes/   # Keyframe manipulation
│   │       ├── layers/      # Layer utilities and control
│   │       ├── paths/       # Path and shape tools
│   │       └── utilities/   # General purpose tools
│   └── cep-extensions/
│       └── frame-navigator/ # React-based CEP extension
├── tools/                   # Scripting modules and utilities
├── docs/                    # Documentation
└── dist/                    # Production builds
```

## Script Catalog

### Animation Scripts (3)

| Script | Description |
|--------|-------------|
| **[PathMaster](packages/ae-scripts/src/animation/PathMaster.jsx)** | Advanced path following animation with easing, loops, segments, and markers |
| **[Linearizer](packages/ae-scripts/src/animation/Linearizer.jsx)** | Property linking with driver-based interpolation for complex animations |
| **[Limb-a-tron](packages/ae-scripts/src/animation/Limb-a-tron.jsx)** | Complete IK rig system for character limbs with curvature control |

### Composition Scripts (4)

| Script | Description |
|--------|-------------|
| **[Guiderator](packages/ae-scripts/src/composition/Guiderator.jsx)** | Guide creation with built-in calculator support |
| **[Slidotron_16x9](packages/ae-scripts/src/composition/Slidotron_16x9.jsx)** | 4K horizontal slider composition presets |
| **[Slidotron_9x16](packages/ae-scripts/src/composition/Slidotron_9x16.jsx)** | Vertical slider compositions for mobile formats |
| **[Split-o-matic_9x16](packages/ae-scripts/src/composition/Split-o-matic_9x16.jsx)** | Vertical split-screen composition templates |

### Effects Scripts (4)

| Script | Description |
|--------|-------------|
| **[ChromaBlenderizer](packages/ae-scripts/src/effects/ChromaBlenderizer.jsx)** | Advanced color interpolation across selected properties |
| **[sfxMaster](packages/ae-scripts/src/effects/sfxMaster.jsx)** | Centralized audio control system with Voice/SFX/Music sliders |
| **[BurstMate](packages/ae-scripts/src/effects/BurstMate.jsx)** | Animated stroke burst effect generator |
| **[Sync-o-tron](packages/ae-scripts/src/effects/Sync-o-tron.jsx)** | Audio-reactive visual property synchronization |

### Keyframe Scripts (3)

| Script | Description |
|--------|-------------|
| **[KeyCloneMatic](packages/ae-scripts/src/keyframes/KeyCloneMatic.jsx)** | Advanced keyframe duplication with temporal decay and easing |
| **[KeyBot](packages/ae-scripts/src/keyframes/KeyBot.jsx)** | Batch modify keyframe values with mathematical operations |
| **[Valuatron](packages/ae-scripts/src/keyframes/Valuatron.jsx)** | Records current values as keyframes with expression support |

### Layer Scripts (7)

| Script | Description |
|--------|-------------|
| **[TextMate](packages/ae-scripts/src/layers/TextMate.jsx)** | Text highlighting and animation with range selectors |
| **[Parent-o-bot](packages/ae-scripts/src/layers/Parent-o-bot.jsx)** | Advanced multi-parent constraint system |
| **[NullBot](packages/ae-scripts/src/layers/NullBot.jsx)** | Creates null objects at average position of selected layers |
| **[Rectangulator](packages/ae-scripts/src/layers/Rectangulator.jsx)** | Converts parametric rectangles to bezier paths with corner control |
| **[OrderMaster](packages/ae-scripts/src/layers/OrderMaster.jsx)** | Reorders layers or shape groups with randomize options |
| **[SubtitleForge](packages/ae-scripts/src/layers/SubtitleForge.jsx)** | Professional subtitle composition generator |
| **[TimeWarp-a-tron](packages/ae-scripts/src/layers/TimeWarp-a-tron.jsx)** | Advanced time remapping with control sliders |

### Path Scripts (6)

| Script | Description |
|--------|-------------|
| **[Centralizer](packages/ae-scripts/src/paths/Centralizer.jsx)** | Adds guides to path centers and bounding boxes |
| **[VertexMaster](packages/ae-scripts/src/paths/VertexMaster.jsx)** | Dynamic vertex control via null objects |
| **[Distributron](packages/ae-scripts/src/paths/Distributron.jsx)** | Distributes layers along shape paths with controls |
| **[PathDuplitron](packages/ae-scripts/src/paths/PathDuplitron.jsx)** | Copies and preserves position keyframe tangents |
| **[Originator](packages/ae-scripts/src/paths/Originator.jsx)** | Centers shape path origins for rotation |
| **[Trace-o-matic](packages/ae-scripts/src/paths/Trace-o-matic.jsx)** | Converts masks to shape layers with keyframe preservation |

### Utility Scripts (4)

| Script | Description |
|--------|-------------|
| **[Onionizer](packages/ae-scripts/src/utilities/Onionizer.jsx)** | Onion skinning system for shape layer animation |
| **[Iteratron](packages/ae-scripts/src/utilities/Iteratron.jsx)** | Incrementally changes property values between layers |
| **[RandoMatic](packages/ae-scripts/src/utilities/RandoMatic.jsx)** | Randomizes keyframe values within specified ranges |
| **[Triminator](packages/ae-scripts/src/utilities/Triminator.jsx)** | Adds trim paths with automatic keyframe animation |

## Featured Scripts

### Core Animation Tools
- **Limb-a-tron** - Industry-standard IK rigging system
- **PathMaster** - Professional path animation with cubic-bezier easing
- **Linearizer** - Complex property linking and driver systems

### Essential Workflow Tools
- **Rectangulator** - Bezier rectangle converter with individual corner control
- **Guiderator** - Precision guide placement with mathematical calculations
- **KeyBot** - Powerful batch keyframe modification system
- **sfxMaster** - Professional audio mixing and management

### Advanced Systems
- **Parent-o-bot** - Complex multi-parent relationships
- **VertexMaster** - Direct path vertex manipulation
- **TimeWarp-a-tron** - Advanced time manipulation suite
- **Distributron** - Object distribution along paths

## Installation

### For Individual Scripts
1. Copy the desired `.jsx` file to your After Effects Scripts folder:
   - **Windows**: `C:\Program Files\Adobe\Adobe After Effects [version]\Support Files\Scripts`
   - **macOS**: `/Applications/Adobe After Effects [version]/Scripts`
2. Restart After Effects
3. Access via `File > Scripts > [Script Name]`

### For ScriptUI Panels
Place scripts in the `ScriptUI Panels` folder to access them from `Window` menu.

### For CEP Extensions
1. Navigate to extension directory
2. Run `yarn install && yarn build`
3. Use ZXP installer or manually install to CEP extensions folder

## Development

### Prerequisites
- Node.js 16+
- Yarn package manager (required - do not use npm)
- Adobe After Effects CC 2019+

### Building Scripts
```bash
# Build all scripts
yarn build

# Build specific category
cd packages/ae-scripts
yarn build:animation
```

### Module System
The repository includes reusable scripting modules in `tools/scripting-modules/`:
- **Ae.js** - Core After Effects API wrapper
- **RefManager.js** - Reference management system
- **ApplyFFX.js** - Effect application utilities
- **ErrorLogging.js** - Centralized error handling

## Documentation

- [Script Functionality Catalog](docs/development/SCRIPT_FUNCTIONALITY_CATALOG.md) - Detailed descriptions of all scripts
- [Documentation Index](docs/TOC.md) - Complete documentation table of contents
- [Project Structure](docs/PROJECT_AUDIT_REPORT.md) - Repository organization details
- [Development Guide](CLAUDE.md) - Development context and guidelines

## Project Management

- [GitHub Issues](https://github.com/ivg-design/JSX/issues) - Active development tracking
- [Project Board](https://github.com/users/ivg-design/projects/6) - Script maintenance and development

## Script Categories Overview

| Category | Count | Purpose |
|----------|-------|---------|
| **Animation** | 3 | Motion control, IK rigging, path following |
| **Composition** | 4 | Layout tools, guides, templates |
| **Effects** | 4 | Visual effects, audio sync, color tools |
| **Keyframes** | 3 | Keyframe manipulation and automation |
| **Layers** | 7 | Layer management and control systems |
| **Paths** | 6 | Shape and path manipulation tools |
| **Utilities** | 4 | General purpose workflow enhancers |

## Version Information

All scripts are currently at version 2.0.0 following the major reorganization and standardization completed in January 2025. Each script includes comprehensive JSDoc documentation with:
- Detailed functionality descriptions
- Step-by-step usage instructions
- System requirements
- Technical implementation notes

## Contributing

1. Follow the established naming convention (-tron, -ator, -o-matic suffixes)
2. Place scripts in appropriate category folders
3. Include comprehensive JSDoc header comments
4. Test with After Effects CC 2019 or later
5. Update relevant documentation
6. Use Yarn for all package management (not npm)

## License

MIT License - See individual script headers for specific attribution.

## Credits

Created and maintained by IVG Design.

## Support

For issues, feature requests, or questions:
- Create an issue in this repository
- Check existing documentation in `/docs`
- Review script JSDoc headers for usage instructions
- Consult the [GitHub Project Board](https://github.com/users/ivg-design/projects/6) for development status

---

*This repository represents years of After Effects scripting expertise, organized for maximum productivity and reusability.*