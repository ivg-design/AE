# @jsx-workspace/ae-test-harness

A test harness for the After Effects ExtendScript (`.jsx`) script catalog. It exercises catalog
scripts **without** After Effects by combining static analysis, expression validation, a simulated
ExtendScript host (sandbox + fake `app`/`File`/`Folder`/ScriptUI), and deterministic reporting.

## What it does

- **static** — parses each script as ECMAScript 3 (ExtendScript dialect), flags modern-JS API usage,
  validates frontmatter (`@name`/`@version`/`@ui`/`@changelog`), and detects `#include`/`//@include`.
- **expressions** — extracts AE expression string literals assigned to `.expression`, parses them, and
  classifies records that can only be resolved at runtime as `dynamic-unresolved`.
- **functional** — runs each script in a `node:vm` sandbox against a simulated host built from a
  `HostSnapshot`, capturing every mutation as an `Operation` log and comparing against fixtures.
- **ui** — captures ScriptUI window trees into a `UITree`, drives `Action`s against captured controls,
  and renders/screenshots them via the visualization subsystem.
- **report** — aggregates `ReportRecord`s into `report.json` + `report.md`, separating standalone
  confidence from AE-runtime-only risk.
- **ae-smoke** — optional; only runs when `AE_SMOKE_CONFIG` is set, otherwise skips cleanly.

## Commands

```sh
yarn test:ae             # run the vitest suite
yarn test:ae:static      # static analysis pass
yarn test:ae:expressions # expression extraction + parse pass
yarn test:ae:functional  # functional host-simulation pass
yarn test:ae:ui          # ScriptUI capture + interaction pass
yarn test:ae:report      # aggregate report (report.json + report.md)
yarn test:ae:ae-smoke    # optional live-AE smoke (needs AE_SMOKE_CONFIG)
```

Deterministic artifacts are written under `.out/<command>/`. Screenshots land in `screenshots/`.

## Script discovery

Scripts under test are discovered from:

```
/Users/ivg/github/ae-script-catalog/ae/packages/ae-scripts/src/{animation,composition,effects,keyframes,layers,paths,utilities}/*.jsx
```

(31 scripts total at time of writing.)

## SDB (optional)

Visualization can route through an external SDB renderer when `SDB_ROOT` is set in the environment.
When `SDB_ROOT` is unset, the SDB adapter is a no-op (`{ skipped: true }`) and the harness falls back
to its built-in HTML renderer + Playwright screenshots.

## Contracts

All inter-agent interfaces are frozen in [`CONTRACT.md`](./CONTRACT.md) and implemented as JSDoc
typedefs + runtime validators in [`src/contracts/`](./src/contracts/). Import shared schemas,
validators, and constants from `src/contracts/index.js`.
