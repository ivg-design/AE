# JSX Scripts Naming Convention

## Suffix Guidelines

### Power & Transformation
- **-tron**: Electronic-age powerful tools that transform or control complex systems
- **-inator**: Dr. Doofenshmirtz-style powerful transformation tools

### Generation & Manipulation
- **-ator**: Tools that generate, duplicate, or manipulate elements
- **-forge**: Tools that create something from scratch
- **-smith**: Precision crafting and shaping tools

### Automation & Intelligence
- **-matic/-oMatic/-OMatic**: Smart automation with emphasized power levels
- **-bot**: Simple automated assistants for repetitive tasks

### Enhancement & Modification
- **-ifier**: Enhancement and modification tools
- **-izer**: Conversion and optimization tools
- **-ify**: Simple verb converters for basic actions

### Control & Management
- **-master**: Comprehensive control and management systems
- **-ology**: Analysis and study tools

### Companionship
- **-mate**: Helper and companion tools

### Versioning
- **Mk** (Mark): Major version iterations (e.g., `Rectangulator_Mk3`)

## File Naming Structure

### Format
`ScriptName.v{MAJOR}-{MINOR}-{PATCH}.{category}.jsx`

### Categories
- `.ae` - General After Effects scripts
- `.fx` - Effects-specific scripts
- `.util` - Utility scripts

### Case Conventions
| Context | Convention | Example |
|---------|------------|---------|
| File names | PascalCase with hyphenated version | `ColorBlendOMatic.v2-1-0.fx.jsx` |
| Display names | PascalCase with spaces | `Color Blend O Matic` |
| Internal IDs | camelCase | `colorBlendOMatic` |

## Version Format
- Semantic versioning: `v{MAJOR}-{MINOR}-{PATCH}`
- MAJOR: Breaking changes or complete rewrites
- MINOR: New features, backwards compatible
- PATCH: Bug fixes and minor improvements

## Suffix Selection Guide

1. **-tron**: Complex systems with multiple components (IK rigs, comprehensive tools)
2. **-inator**: Dramatic transformations with wow factor
3. **-ator**: Repetitive generation or manipulation
4. **-forge**: Creating complex structures from nothing
5. **-smith**: Precise crafting requiring finesse
6. **-OMatic**: Fully automated complex processes
7. **-matic**: Standard automation
8. **-bot**: Simple, single-purpose automation
9. **-master**: Complete control over a domain
10. **-ifier**: Making something better
11. **-izer**: Converting from one form to another
12. **-mate**: Friendly helper that works alongside you
13. **-ology**: Deep analysis and understanding

## Examples

```
LimbKinematron.v1-4-1.ae.jsx     // Powerful IK system
Rectangulator.v2-0-0.ae.jsx      // Rectangle generator
ColorBlendOMatic.v3-1-0.fx.jsx   // Smart color automation
NullMate.v1-0-0.util.jsx         // Null helper companion
PathCentrifuge.v1-2-0.ae.jsx     // Origin centering tool
AudioMixMaster.v1-0-0.fx.jsx     // Audio control system
```