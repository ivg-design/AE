# Site generation

Run `node site/tools/build-docs.mjs` from the repository root after published catalog or Markdown guide updates. This generates the 35 static guides, directory, sitemap, redirect map, and llms.txt. Native app builds are separate.

For icon updates, run `yarn --cwd site/tools install --frozen-lockfile`, then `yarn --cwd site/tools build:images`. The committed 68/136/224px WebP variants preserve original artwork, which remains available for packaging. The hero uses 224px icons; interactive tiles use responsive sources.

Fonts are self-hosted from Google Fonts with their OFL licenses in site/assets/fonts. css/fonts.css includes Latin and Latin Extended subsets and uses font-display: swap. Keep the source-family names and matching license when regenerating.

The decorative Three.js logo loads on approach to its section; reduced-motion and unsupported browsers retain the supplied static logo.
