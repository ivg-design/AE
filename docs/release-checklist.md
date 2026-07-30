# Release Checklist — Adding a New Script to the Catalog

Step-by-step process for taking a new script from "works on my machine" to released on
[forge.mograph.life/apps/ae](https://forge.mograph.life/apps/ae). Follow phases in order;
every phase lists the exact files touched. Git root is `ae/` (the outer
`ae-script-catalog/` folder is not a repo; outer `assets/` is untracked source material).

---

## Phase A — The script itself

- [ ] **A1. Author the script** at `packages/ae-scripts/src/<category>/<Name>.jsx`.
      Category folder must be one of: `animation`, `composition`, `effects`,
      `keyframes`, `layers`, `paths`, `utilities` (drives site grouping;
      `CATEGORIES` in `site/tools/build-data.mjs`).
- [ ] **A2. Frontmatter** (machine-parsed by `site/tools/build-data.mjs` — a malformed
      block silently degrades the site card). Required tags:
      `@name`, `@author IVG Design`, `@version` (semver), `@date YYYY-MM-DD`,
      `@license MIT`, `@ui` (one of `DIALOG|PALETTE|HEADLESS|PANEL|WINDOW|SCRIPTUI|CEP`),
      `@description`, `@functionality` (• bullets), `@usage` (numbered steps),
      `@requirements` (AE version floor + special permissions, e.g. "Allow Scripts to
      Write Files…" if the script writes temp files), `@notes`, `@changelog`
      (dated, reverse-chronological, cause-and-fix detail — see Rectangulator).
      Decorative ASCII banners go *after* nothing — keep the JSDoc block first or the
      parser must skip the banner (it can, but don't push it).
- [ ] **A3. Copyright**: MIT license boilerplate block in the header comment
      (see Linearizer/Rectangulator for the exact text), year + IVG Design.
- [ ] **A4. ES3 discipline**: `var`-only, no `let/const/=>/JSON/template literals`,
      no ES5+ array methods — in the script AND inside generated expression strings.
- [ ] **A5. Pseudo effects** (if any): embed the .ffx as a raw escaped ES3 string
      literal (repo convention — not base64); apply via the CamBot registration
      pattern (`canAddProperty` → temp-comp `applyPreset` → `addProperty`), and apply
      the FFX **before** building other property trees. Keep the source `.ffx` in
      `tools/templates/expression-controls/` and its PEM/JSON spec alongside.
      (FFX authoring/generation tooling lives in the private eXLib repo —
      `exlib/scripts/ffx-pseudo-gen/` — do not add generator code here.)
- [ ] **A6. Dev-install & test in AE**: copy to
      `/Applications/Adobe After Effects <year>/Scripts/ScriptUI Panels/ivg-scripts/<category>/<Name>.jsx`
      and validate manually (create/undo/redo, controls, edge cases: no selection,
      wrong item type, portrait source, etc.).

## Phase B — Icon set

- [ ] **B1. Curated SVG** in the catalog's "bot art" style — square viewBox, same
      palette/stroke treatment as the existing set (compare against
      `../assets/icons/` and `site/download/native/icons/*.svg`). Source lives in the
      outer `../assets/icons/` folder (untracked working material).
- [ ] **B2. Web-card raster** → `../assets/web-icons/<slug>.webp`
      (slug = slugified filename, lowercase):
      ```bash
      rsvg-convert -a -w 512 -h 512 icon.svg -o /tmp/i.png
      magick /tmp/i.png -background none -gravity center -extent 512x512 ../assets/web-icons/<slug>.webp
      ```
- [ ] **B3. Committed icon source of truth** → `site/download/native/icons/<slug>.svg`
      (+ optional `<slug>.cmd.svg` / `<slug>.shift.svg` rollover variants). This is
      what `build-bundle.mjs` uses for toolbar PNGs when the private `native/` repo
      isn't present.
- [ ] **B4. Lucide fallback** (optional safety net): add `<slug>: "<lucide-name>"` to
      `LUCIDE_MAP` in `site/tools/build-data.mjs`.

## Phase C — Documentation

- [ ] **C1. Per-script doc** `docs/scripts/<Name>.md` following the established
      template (compare CamBot.md / Rectangulator.md: overview, controls reference,
      usage walkthrough, requirements, changelog pointer).
- [ ] **C2. TOC**: add the script to `docs/TOC.md`.
- [ ] **C3. Site card copy**: add `"<slug>": { "tagline": "...", "description": "..." }`
      to `site/data/copy-overrides.json` (richer copy than the auto-parsed frontmatter).
- [ ] **C4. CHANGELOG.md**: entry under the release date, Keep-a-Changelog style:
      `**New script — \`<Name>\` \`<version>\`** (<category>): …` with feature bullets
      (see the CamBot entry for tone/depth).
- [ ] **C5. README.md**: bump the script counts — the intro line
      ("catalog of **NN production-ready…**"), the banner alt text, and the
      `src/ # NN source scripts (MM distributed)` comment in the structure tree.
      If `banner.png` bakes the count into pixels, regenerate it (or defer with a note).

## Phase D — Build & verify (local)

- [ ] **D1.** `cd ae && yarn build:catalog`
      (runs `build-data.mjs` → `build-bundle.mjs` → `build-data.mjs`;
      needs `rsvg-convert`, `magick`, `zip` on PATH).
- [ ] **D2. De-noise icons**: `build-bundle` re-rasterizes every toolbar PNG;
      `git checkout -- packages/ae-scripts/toolbar/icons/` then re-add only the new
      slug's PNGs so the diff stays clean.
- [ ] **D3. Verify generated data**:
      - `site/data/scripts.json` has the new record with a real `icon` (not the
        Lucide fallback), correct version/category/copy;
      - `site/data/meta.json` counts incremented;
      - `site/download/ae-scripts.zip` contains the script;
      - `unzip -l site/download/ae-scripts.zip | grep -i <name>`.
- [ ] **D4. Local site smoke-test**: `npx serve site`, check the card, doc page,
      count badges, icon rendering, download link.

## Phase E — Release

- [ ] **E1. Commit** everything in one logical commit (or script/docs/site-data split)
      from the `ae/` git root; message convention:
      `Add <Name> <version> (<category>): <one-line pitch>`.
- [ ] **E2. Push** to `origin main`.
- [ ] **E3. Deploy**: forge.mograph.life deploys from `main` via `vercel --prod`
      (NOT a production-branch hook — run the deploy explicitly; the AE catalog is
      wired at `/apps/ae`).
- [ ] **E4. Post-deploy verification** on the live site: script count, new card,
      doc page, icon, `download/ae-scripts.zip` freshness.
- [ ] **E5. Sync the AE install**: replace the dev copy in `ScriptUI Panels` with the
      final committed version (byte-compare with `diff -q`).

---

*Checklist added 2026-07-28 alongside the Verticalizer release.*
