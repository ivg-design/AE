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
├── dist/                    # Production builds
├── docs/                    # Documentation
└── .customBundler/         # Build tools
```

## Script Catalog

### 🎬 Animation (3 scripts)
| Script | Description |
|--------|-------------|
| **it_follows.jsx** | Advanced path following with easing, loops, segments, and markers |
| **Linearizer.jsx** | Property linking with driver-based interpolation |
| **Parametric_IK_Limb** | Complete IK rig system for character limbs with curvature control |

### 📐 Composition (3 scripts)
| Script | Description |
|--------|-------------|
| **Guiderator_w_calc** | Guide creation with calculation support |
| **Slider_16x9** | 4K slider composition presets |
| **Slider_9x16** | Vertical slider compositions for mobile |
| **9x16_Split_Screen** | Vertical split-screen templates |

### ✨ Effects (4 scripts)
| Script | Description |
|--------|-------------|
| **ColorInterpolator** | Interpolates colors across selected properties |
| **sfxMaster** | Centralized audio control system with Voice/SFX/Music sliders |
| **StrokeBurst** | Animated stroke burst effect generator |
| **TuneSync** | Syncs visual properties to audio amplitude |

### 🔑 Keyframes (3 scripts)
| Script | Description |
|--------|-------------|
| **KeyDuplicator** | Duplicates keyframes with temporal decay and easing |
| **keyMate** | Batch modify keyframe values with math operations |
| **Record_Keyframe_Value** | Records current values as keyframes |

### 📚 Layers (7 scripts)
| Script | Description |
|--------|-------------|
| **highlighter** | Text highlighting with animators |
| **Multi_Parent2** | Advanced multi-parent system |
| **ParentNull** | Creates nulls at average position |
| **rectangulator_v2** | Converts parametric rectangles to bezier paths |
| **Reorderer** | Reorders layers or shape groups |
| **SubtitlePreset** | Subtitle composition generator |
| **TimeRemapController** | Advanced time remapping controls |

### 🛤️ Paths (6 scripts)
| Script | Description |
|--------|-------------|
| **CenterPathGuides** | Adds guides to path centers and bounds |
| **ControlVertices** | Dynamic vertex control via nulls |
| **Distributron.jsx** | Distributes layers along shape paths |
| **motionPathDuplicator** | Copies position keyframe tangents |
| **originator** | Centers shape path origins |
| **Trace-o-matic.jsx** | Converts masks to shape layers with keyframes |

### 🔧 Utilities (4 scripts)
| Script | Description |
|--------|-------------|
| **celMate** | Onion skinning for shape layers |
| **iterator** | Incrementally changes properties between layers |
| **Randomize_in_Range** | Randomizes keyframes within ranges |
| **Trimmer** | Adds trim paths with animation |

## Featured Scripts

### 🏆 Most Popular
- **Rectangulator** - Iconic bezier rectangle converter
- **Guiderator** - Essential guide creation tool  
- **keyMate** - Powerful keyframe modifier
- **sfxMaster** - Professional audio management

### 🚀 Advanced Tools
- **Parametric_IK_Limb** - Full IK rigging system
- **Multi_Parent2** - Complex parenting relationships
- **ControlVertices** - Direct path manipulation
- **TimeRemapController** - Time manipulation suite

## Installation

### For Individual Scripts
1. Copy the desired `.jsx` or `.js` file to your After Effects Scripts folder:
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
- Yarn package manager
- Adobe After Effects CC 2019+

### Building Scripts
```bash
# Build all scripts
yarn build

# Build specific category
cd packages/ae-scripts
yarn build:animation
```

### Custom Bundler
The repository includes a custom bundler for optimizing script output:
```bash
cd .customBundler
node bundler.js --input ../packages/ae-scripts/src/[script].jsx
```

## Documentation

- [Script Functionality Catalog](docs/SCRIPT_FUNCTIONALITY_CATALOG.md) - Detailed descriptions of all scripts
- [Naming Convention & Proposals](docs/CLEVER_NAMING_PROPOSALS.md) - Script naming guidelines
- [Project Audit Report](docs/PROJECT_AUDIT_REPORT.md) - Repository structure and organization
- [AI Context](CLAUDE.md) - Development context for AI assistants

## Contributing

1. Follow the established naming convention (see docs)
2. Place scripts in appropriate category folders
3. Include comprehensive header comments
4. Test with After Effects CC 2019+
5. Update documentation

## License

MIT License - See individual script headers for specific attribution.

## Credits

Created and maintained by IVG Design.

## Support

For issues, feature requests, or questions:
- Create an issue in this repository
- Check existing documentation in `/docs`
- Review script headers for usage instructions

---

*This repository represents years of After Effects scripting expertise, organized for maximum productivity and reusability.*