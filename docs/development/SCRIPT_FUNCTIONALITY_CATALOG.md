# Complete Script Functionality Catalog

## Animation Scripts

### 1. **[PathMaster.jsx](../../packages/ae-scripts/src/animation/PathMaster.jsx)**
- **Function**: Animates position properties along shape paths with advanced easing
- **Features**: Extended easing functions (cubic-bezier presets), duration control, loop/ping-pong modes, marker-based configuration
- **Use Case**: Create smooth animations that follow paths with professional easing

### 2. **[Linearizer.jsx](../../packages/ae-scripts/src/animation/Linearizer.jsx)**
- **Function**: Links properties with driver-based interpolation for complex animations
- **Features**: 1D/2D/3D property support, min/max value range controls, even vs relative interpolation modes, shape path vertex interpolation, automatic keyframe value capturing
- **Use Case**: Property linking, complex animation control, driver-based interpolation

### 3. **[Limb-a-tron.jsx](../../packages/ae-scripts/src/animation/Limb-a-tron.jsx)**
- **Function**: Creates and bakes an IK/FK limb rig for character limbs
- **Features**: Controller null with embedded LimbControlsV3 pseudo effect, IK and manual/FK angles, dynamic IK direction, adjusted lengths, pop prevention, regular and noodle body modes, side-curvature controls, linked outline/trim stroke passes, radial-safe folded-pose noodle outlines, and selected-rig intelligent bake/removal workflow
- **Use Case**: Character limbs, noodle arms, robotic arms, and cleanup baking for animated two-segment rigs

## Composition Scripts

### 4. **[Split-o-matic_9x16.jsx](../../packages/ae-scripts/src/composition/Split-o-matic_9x16.jsx)**
- **Function**: Generates 9:16 vertical split-screen composition templates
- **Features**: Pre-configured layouts for mobile/vertical video formats
- **Use Case**: Social media content, mobile video production

### 5. **[Guiderator.jsx](../../packages/ae-scripts/src/composition/Guiderator.jsx)**
- **Function**: Add guides with built-in calculator support
- **Features**: Mathematical calculations in input field, horizontal/vertical guides, guide locking
- **Use Case**: Precisely place guides using calculations (e.g., "1920/3")

### 6. **[Slidotron_16x9.jsx](../../packages/ae-scripts/src/composition/Slidotron_16x9.jsx)**
- **Function**: Creates 16:9 (4K) slider composition presets
- **Features**: Pre-built 3840x2160 compositions with slider animations
- **Use Case**: Presentation slides, image galleries

### 7. **[Slidotron_9x16.jsx](../../packages/ae-scripts/src/composition/Slidotron_9x16.jsx)**
- **Function**: Creates 9:16 (1080p vertical) slider composition presets
- **Features**: Pre-built 1080x1920 vertical slider compositions
- **Use Case**: Mobile presentations, Instagram stories

## Effects Scripts

### 8. **[ChromaBlenderizer.jsx](../../packages/ae-scripts/src/effects/ChromaBlenderizer.jsx)**
- **Function**: Modeless palette that interpolates or randomizes colors between start and end values across selected AE color properties
- **Features**: Bundled Smallpath AdobeColorPicker swatches, white default swatches, target property counter, tooltips, linear interpolation, random color assignment
- **Use Case**: Create color gradients across multiple layers or properties

### 9. **[sfxMaster.jsx](../../packages/ae-scripts/src/effects/sfxMaster.jsx)**
- **Function**: Centralized audio control system for compositions
- **Features**: Creates SFX CTRL null with Voice Over, Sound Effects, and Music sliders, auto-links audio layers based on markers
- **Use Case**: Complex audio mixing, multi-track audio management

### 10. **[BurstMate.jsx](../../packages/ae-scripts/src/effects/BurstMate.jsx)**
- **Function**: Creates animated stroke burst effects
- **Features**: Pre-configured stroke animations for burst effects
- **Use Case**: Motion graphics, explosion effects, emphasis animations

### 11. **[Sync-o-tron.jsx](../../packages/ae-scripts/src/effects/Sync-o-tron.jsx)**
- **Function**: Syncs visual properties to audio amplitude
- **Features**: Works with Audio Reactor Template, handles pseudo effects, color properties support
- **Use Case**: Music visualizations, audio-reactive animations

## Keyframe Scripts

### 12. **[KeyCloneMatic.jsx](../../packages/ae-scripts/src/keyframes/KeyCloneMatic.jsx)**
- **Function**: Duplicates keyframes across layers and time with advanced options
- **Features**: Temporal decay, easing preservation, maintains interpolation types, velocity, spatial properties, label colors
- **Use Case**: Create cascading animations, offset timing across multiple layers

### 13. **[KeyBot.jsx](../../packages/ae-scripts/src/keyframes/KeyBot.jsx)**
- **Function**: Batch modify keyframe values with mathematical operations
- **Features**: X/Y/Z dimension control, math operations (+, -, ×, ÷, =), selective dimension editing
- **Use Case**: Bulk keyframe adjustments, proportional scaling of animations

### 14. **[Valuatron.jsx](../../packages/ae-scripts/src/keyframes/Valuatron.jsx)**
- **Function**: Records keyframes at current time with current/post-expression values
- **Features**: Handles expressions, batch processing, undo grouping
- **Use Case**: Bake expression values to keyframes

## Layer Scripts

### 15. **[TextMate.jsx](../../packages/ae-scripts/src/layers/TextMate.jsx)**
- **Function**: Highlights specific text instances in text layers
- **Features**: Text animator creation, range selectors, random bright colors, multi-line support
- **Use Case**: Emphasize keywords, create highlighted text effects

### 16. **[Parent-o-bot.jsx](../../packages/ae-scripts/src/layers/Parent-o-bot.jsx)**
- **Function**: Advanced multi-parent system with embedded FFX binary
- **Features**: Multiple parent support, complex expression-based control
- **Use Case**: Advanced character rigging, complex hierarchies

### 17. **[NullBot.jsx](../../packages/ae-scripts/src/layers/NullBot.jsx)**
- **Function**: Creates null object at average position of selected layers
- **Features**: Automatic positioning, parent relationship setup
- **Use Case**: Group control, creating control handles

### 18. **[Rectangulator.jsx](../../packages/ae-scripts/src/layers/Rectangulator.jsx)**
- **Function**: Converts parametric rectangles to bezier paths with individual corner controls
- **Features**: Per-corner rounding, maintains rectangle properties as bezier
- **Use Case**: Advanced shape animation, corner animations

### 19. **[OrderMaster.jsx](../../packages/ae-scripts/src/layers/OrderMaster.jsx)**
- **Function**: Reorders contiguous layers or shape groups
- **Features**: Randomize or reverse order, works with layers and shape groups
- **Use Case**: Randomize layer stacking, reverse animations

### 20. **[SubtitleForge.jsx](../../packages/ae-scripts/src/layers/SubtitleForge.jsx)**
- **Function**: Creates subtitle composition presets
- **Features**: Pre-configured text layers for subtitles
- **Use Case**: Video subtitling, lower thirds

### 21. **[TimeWarp-a-tron.jsx](../../packages/ae-scripts/src/layers/TimeWarp-a-tron.jsx)**
- **Function**: Advanced time remapping with control sliders
- **Features**: In/Out range controller, slider-based time control, expression linking
- **Use Case**: Speed ramping, time manipulation effects

## Path Scripts

### 22. **[Centralizer.jsx](../../packages/ae-scripts/src/paths/Centralizer.jsx)**
- **Function**: Adds guides to center and bounding box of shape paths
- **Features**: Path selection tree view, center guides, bounding box guides
- **Use Case**: Align objects to path centers, layout assistance

### 23. **[VertexMaster.jsx](../../packages/ae-scripts/src/paths/VertexMaster.jsx)**
- **Function**: Dynamic control of path vertices and tangents via null objects
- **Features**: Vertex/tangent control nulls, follow mode, open/closed path toggle, works with animated paths
- **Use Case**: Advanced path animation, character animation

### 24. **[Distributron.jsx](../../packages/ae-scripts/src/paths/Distributron.jsx)**
- **Function**: Distributes layers along shape paths with advanced control options
- **Features**: Even distribution along paths, control null with pseudo effects, randomization options, start/end offset controls, automatic path-following expressions
- **Use Case**: Distribute objects along paths, create path-based animations

### 25. **[PathDuplitron.jsx](../../packages/ae-scripts/src/paths/PathDuplitron.jsx)**
- **Function**: Copies and pastes position keyframe tangents
- **Features**: Preserves motion path curves when copying
- **Use Case**: Duplicate complex motion paths

### 26. **[Originator.jsx](../../packages/ae-scripts/src/paths/Originator.jsx)**
- **Function**: Centers shape path origins
- **Features**: Automatic centroid calculation, vertex offset adjustment, tree view for multi-path selection
- **Use Case**: Fix shape layer pivot points, prepare for rotation animations

## Utility Scripts

### 27. **[Trace-o-matic.jsx](../../packages/ae-scripts/src/paths/Trace-o-matic.jsx)**
- **Function**: Converts mask paths with keyframes to shape layers with hold interpolation
- **Features**: Preserves mask animations, applies hold interpolation, centralized fill/stroke controls, keyframe cleanup, removes redundant keyframes
- **Use Case**: Convert masks to shapes, frame-by-frame animation, cleanup animated masks

### 28. **[Onionizer.jsx](../../packages/ae-scripts/src/utilities/Onionizer.jsx)**
- **Function**: "The Onionizer for Shape Layers" - creates onion skinning effects
- **Features**: Visual reference frames for animation
- **Use Case**: Traditional animation techniques, motion studies

### 29. **[Iteratron.jsx](../../packages/ae-scripts/src/utilities/Iteratron.jsx)**
- **Function**: Incrementally changes property values between start and end layers
- **Features**: Supports 1D/2D/3D properties, color properties, interpolation between values
- **Use Case**: Create gradients of values, distributed animations

### 30. **[RandoMatic.jsx](../../packages/ae-scripts/src/utilities/RandoMatic.jsx)**
- **Function**: Randomizes selected keyframe values within specified ranges
- **Features**: X/Y/Z range control, validation, batch processing
- **Use Case**: Add organic variation to animations, create random movements

### 31. **[Triminator.jsx](../../packages/ae-scripts/src/utilities/Triminator.jsx)**
- **Function**: Adds trim paths to shape layers with optional keyframe animation
- **Features**: Auto-keyframe creation, works on selected groups or entire layer, shift-key modifier
- **Use Case**: Reveal animations, write-on effects

## Summary Statistics

- **Total Scripts**: 31
- **Categories**: 6 (Animation, Composition, Effects, Keyframes, Layers, Paths, Utilities)
- **Most Complex**: Limb-a-tron (IK/FK rig creation, noodle/regular body generation, and intelligent bake workflow)
- **Most Used Patterns**: UI dialogs, tree views, expression generation
- **Common Features**: Undo grouping, property validation, marker usage
