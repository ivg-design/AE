# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Adobe After Effects (AE) scripting and CEP extension development repository containing automation tools, UI extensions, and workflow utilities for motion graphics and animation work.

## Key Commands

### Development
```bash
# Frame Navigator CEP Extension
cd frame-navigator && yarn dev     # Start development server
cd frame-navigator && yarn build    # Build for production
cd frame-navigator && yarn zxp      # Package as ZXP for distribution

# Run linting and type checking (when available)
yarn lint          # Currently not configured - needs setup
yarn typecheck     # Currently not configured - needs setup
```

### Testing
No test framework currently configured. When implementing tests, use Vitest or Jest.

## High-Level Architecture

### Project Structure
The repository contains three main components:

1. **frame-navigator/** - Modern CEP extension built with React 18, TypeScript, and Vite. Uses a dual-context architecture:
   - Panel context: React UI running in CEF browser
   - Host context: ExtendScript (.jsx) running in After Effects
   - Communication via CSInterface event system

2. **Root-level JSX scripts** - Standalone After Effects automation scripts:
   - Animation tools (parametric_limb_v2.jsx)
   - Path utilities (CenterPathGuides_1.2.0.jsx, motionPathDuplicator.jsx)
   - Layer management (rectangulator_v2.jsx, KeyDuplicator_v1.3.jsx)
   - UI tools (FrameNavigator.jsx, Framifier.jsx)

3. **modules/** - Shared utility libraries used across scripts:
   - Ae.js: Core After Effects API wrapper
   - RefManager.js: Reference management for complex scripts
   - ApplyFFX.js: Effect application utilities
   - ErrorLogging.js: Centralized error handling

### Key Technical Patterns

**CEP Extension Communication:**
- Panel → Host: `CSInterface.evalScript()` executes ExtendScript
- Host → Panel: `CSInterface.addEventListener()` + `CSXSEvent` dispatching
- Shared types defined in TypeScript, transpiled to ES3 for AE compatibility

**Script Module System:**
- Uses `@include` directive for file inclusion in JSX scripts
- Modules export to global scope (ES3 limitation)
- Minified versions available for production deployment

**Build Pipeline:**
- Vite handles React/TypeScript compilation for panel
- Rollup compiles modern JS to ES3 for ExtendScript compatibility
- XML manifests generated programmatically from config

### Important Constraints

**Adobe After Effects Environment:**
- ExtendScript runs in ES3 environment (no modern JS features)
- Limited debugging capabilities (use $.writeln() for console output)
- CSInterface version compatibility varies by Adobe CC version
- File system access restricted to user-approved locations

**Performance Considerations:**
- ExtendScript execution blocks AE UI thread
- Large operations should be batched
- Avoid frequent panel ↔ host communication
- Memory management critical for large compositions

## Development Guidelines

### When Working with ExtendScript (.jsx)
- Target ES3 compatibility
- Use `$.writeln()` for debugging output
- Handle errors gracefully - AE crashes affect user work
- Test with various composition sizes and complexities
- Use modules from /modules directory for common functionality

### When Working with CEP Extensions
- Maintain separation between panel and host logic
- Use TypeScript for panel code, transpile to ES3 for host
- Test across multiple Adobe CC versions if possible
- Sign extensions with valid certificate for distribution
- Update manifest.xml for new Adobe CC versions

### Code Conventions
- Use loglevel instead of console.log for logging
- Follow existing patterns in neighboring files
- Maintain consistent error handling with ErrorLogging module
- Document complex ExtendScript operations with comments
- Use meaningful variable names (ExtendScript debugger is limited)

## Common Issues & Solutions

**Script Not Running:**
- Check Adobe preferences: Enable "Allow Scripts to Write Files"
- Verify ExtendScript target is set to After Effects
- Check for syntax errors (ES3 is unforgiving)

**CEP Panel Not Loading:**
- Enable debug mode: Run scripts/enable-cef-debug.sh
- Check manifest.xml for correct CC version ranges
- Verify symlink exists in CEP extensions folder
- Clear CEF cache if panel shows old content

**Performance Issues:**
- Profile ExtendScript execution time
- Batch operations when possible
- Use app.beginUndoGroup() for multiple operations
- Minimize property access in loops

## Critical Project Rules

1. **ONLY use Yarn** - Never use npm for package management
2. **Use loglevel** - No console.log statements
3. **Documentation in /docs** - All documentation goes in docs folder
4. **Test before marking complete** - Verify all changes work in After Effects
5. **Check log files** - Review fresh logs when debugging

## Repository Maintenance Status

### Cleanup Needed
- Remove test_output/ directory
- Consolidate multiple script versions
- Update outdated dependencies (TypeScript 4→5, Vite 4→5)
- Remove duplicate babel-preset-env dependency

### Missing Configurations
- ESLint configuration needed
- Prettier formatting rules needed
- Testing framework setup required
- Pre-commit hooks would be beneficial

### Active Development Areas
- frame-navigator: Primary active development
- rectangulator_v2: Recently updated with modular architecture
- parametric_limb_v2: Production-ready rigging system