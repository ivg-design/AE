# Changelog

All notable changes to the Frame Navigator CEP extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Critical: JSON.stringify not working in ExtendScript context**
  - Added JSON polyfill for ExtendScript environment
  - Fixed evalTS function to properly return JSON stringified results
  - Resolved frame display showing 000000 instead of actual frame numbers

- **Build Process Issues**
  - Fixed `__objectFreeze` undefined error by adding custom Rollup plugin
  - Added Object.freeze polyfill for CEP compatibility
  - Fixed missing React entry point (src/js/main/index.tsx)

- **TypeScript Configuration**
  - Configured ExtendScript files to use ES3 target (required for After Effects)
  - Excluded problematic files from strict type checking
  - Fixed tsconfig to support ExtendScript global types

- **CEP Debugging**
  - Fixed debug port configuration (port 8860)
  - Resolved CEF debugger accessibility issues
  - Fixed process.env references causing runtime errors

### Added
- Test utilities for verifying ExtendScript functionality (test_frame_display.jsx)
- JSON polyfill for ExtendScript compatibility
- Custom output style "Verified Execution" for development workflow

### Changed
- Updated vite.es.config.ts with custom Rollup plugin for __objectFreeze replacement
- Modified bolt.ts evalTS function for better error handling and JSON serialization
- Enhanced frame navigation hooks with better error handling

## [0.0.1] - Initial Release
- Basic frame navigation functionality
- Frame/timecode display toggle
- Keyboard navigation support