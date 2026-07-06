#!/usr/bin/env node
/**
 * build-data.mjs
 *
 * Scans ae/packages/ae-scripts/src/<category>/*.jsx, parses the JSDoc-style
 * frontmatter block at the top of each file, and emits:
 *   - site/data/scripts.json  (array of script records)
 *   - site/data/meta.json     (counts + generation timestamp)
 *
 * This script only READS from ae/ and assets/ and only WRITES under site/.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", ".."); // .../ae-script-catalog (site now lives in ae/site)
const SRC_ROOT = path.join(REPO_ROOT, "ae", "packages", "ae-scripts", "src");
const ASSETS_IMG_DIR = path.join(REPO_ROOT, "assets", "img");
const SITE_DATA_DIR = path.join(REPO_ROOT, "ae", "site", "data");

const CATEGORIES = [
  "animation",
  "composition",
  "effects",
  "keyframes",
  "layers",
  "paths",
  "utilities",
];

// ---------------------------------------------------------------------------
// Lucide fallback-icon mapping (from ASSETS-NEEDED.md), keyed by slug.
// ---------------------------------------------------------------------------
const LUCIDE_MAP = {
  centralizer: "crosshair",
  burstmate: "asterisk",
  "elast-o-matic": "activity",
  reseterator: "rotate-ccw",
  "opac-o-bot": "blend",
  controllerizer: "settings-2",
  guiderator: "ruler",
  "slidotron-16x9": "gallery-horizontal",
  "slidotron-9x16": "gallery-vertical",
  "split-o-matic-9x16": "columns-2",
  "sync-o-tron": "audio-lines",
  keybot: "calculator",
  textmate: "type",
  rectangulator: "vector-square",
  subtitleforge: "captions",
  distributron: "waypoints",
  originator: "crosshair",
  linearizer: "trending-up",
  "trace-o-matic": "pen-tool",
  keyclonematic: "copy",
  valuatron: "sliders-horizontal",
  nullbot: "box-select",
  onionizer: "layers",
  randomatic: "shuffle",
  triminator: "scissors",
};
const DEFAULT_LUCIDE = "square-code";

const KNOWN_UI_TOKENS = ["DIALOG", "PALETTE", "HEADLESS", "PANEL", "WINDOW", "SCRIPTUI", "CEP"];

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

// Tag keys we care about, mapped to internal bucket names.
// Anything not in this map (author, date, license, thirdParty, namespace,
// changelog, etc.) is tracked as "ignore" -- its content is discarded but it
// still correctly terminates whatever section came before it.
const TAG_TO_BUCKET = {
  name: "name",
  version: "version",
  ui: "ui",
  description: "description",
  functionality: "functionality",
  features: "functionality", // alias seen in ChromaBlenderizer.jsx
  usage: "usage",
  requirements: "requirements",
  notes: "notes",
  selectionnotes: "notes", // alias seen in ChromaBlenderizer.jsx
  changelog: "changelog",
};

// Prose "ALL CAPS:" pseudo-headers used by a few files instead of @tags
// (Limb-a-tron.jsx, PathMaster.jsx, Guiderator.jsx).
const PROSE_TO_BUCKET = {
  functionality: "functionality",
  usage: "usage",
  requirements: "requirements",
  notes: "notes",
  changelog: "changelog",
};

const SCALAR_BUCKETS = new Set(["name", "version", "ui", "description", "preamble"]);
const LIST_BUCKETS = new Set(["functionality", "usage", "requirements", "notes", "changelog"]);

function isPseudoHeaderLine(trimmed) {
  return /^[A-Z][A-Z0-9 '&/-]*:$/.test(trimmed);
}

function isBulletStart(line, bucket) {
  if (bucket === "usage") return /^\d+[.)]\s*/.test(line);
  return /^[-•*]\s*/.test(line);
}

function stripBulletMarker(line, bucket) {
  if (bucket === "usage") return line.replace(/^\d+[.)]\s*/, "").trim();
  return line.replace(/^[-•*]\s*/, "").trim();
}

/**
 * Extract the leading /** ... *\/ block comment from raw file source.
 * Returns the inner text (between /** and the matching closing *\/), or null.
 */
function extractFrontmatterBlock(source) {
  const match = source.match(/\/\*\*([\s\S]*?)\*\//);
  return match ? match[1] : null;
}

/**
 * Turn a raw JSDoc block's inner text into an array of de-commented lines,
 * i.e. strip the leading " * " (or "*") prefix from every line.
 */
function toRawLines(innerBlock) {
  return innerBlock.split("\n").map((line) => line.replace(/^[ \t]*\*[ \t]?/, ""));
}

function parseFrontmatter(source) {
  const inner = extractFrontmatterBlock(source);
  const scalars = { name: "", version: "", ui: "", description: "", preamble: "" };
  const lists = { functionality: [], usage: [], requirements: [], notes: [], changelog: [] };
  const tagsSeen = new Set();

  if (!inner) {
    return { scalars, lists, tagsSeen };
  }

  const lines = toRawLines(inner);

  // Skip a leading plain "Title - Subtitle" line (no @tag on it) which some
  // files use before their real description paragraph / @name block.
  let idx = 0;
  while (idx < lines.length && lines[idx].trim() === "") idx++;
  if (idx < lines.length) {
    const firstTrimmed = lines[idx].trim();
    if (!firstTrimmed.startsWith("@") && !isPseudoHeaderLine(firstTrimmed)) {
      idx++;
    }
  }

  let current = "preamble";

  for (; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();
    if (trimmed === "") continue;

    const tagMatch = trimmed.match(/^@([A-Za-z]+)\b(.*)$/);
    if (tagMatch) {
      const rawTag = tagMatch[1].toLowerCase();
      const rest = tagMatch[2].trim();
      tagsSeen.add(rawTag);
      current = TAG_TO_BUCKET[rawTag] || "ignore";
      if (SCALAR_BUCKETS.has(current)) {
        scalars[current] = rest;
      } else if (LIST_BUCKETS.has(current) && rest) {
        lists[current].push(stripBulletMarker(rest, current));
      }
      continue;
    }

    if (isPseudoHeaderLine(trimmed)) {
      const key = trimmed.slice(0, -1).trim().toLowerCase();
      const bucket = PROSE_TO_BUCKET[key];
      if (bucket) tagsSeen.add(bucket === "functionality" ? "functionality" : bucket);
      current = bucket || "ignore";
      continue;
    }

    if (current === "ignore") continue;

    if (SCALAR_BUCKETS.has(current)) {
      // Some prose-style descriptions (no @description tag) run a bulleted
      // sub-list directly into the intro paragraph -- strip the bullet
      // marker so the flattened description/tagline reads as prose instead
      // of leaving a stray "- " in the middle of a sentence.
      const cleaned = isBulletStart(trimmed, "notes") ? stripBulletMarker(trimmed, "notes") : trimmed;
      scalars[current] = scalars[current] ? `${scalars[current]} ${cleaned}` : cleaned;
    } else if (LIST_BUCKETS.has(current)) {
      if (isBulletStart(trimmed, current)) {
        lists[current].push(stripBulletMarker(trimmed, current));
      } else if (lists[current].length > 0) {
        // Wrapped continuation line -- merge into the previous bullet.
        lists[current][lists[current].length - 1] += ` ${trimmed}`;
      } else {
        lists[current].push(stripBulletMarker(trimmed, current));
      }
    }
  }

  return { scalars, lists, tagsSeen };
}

function normalizeUi(raw) {
  if (!raw) return "";
  const upper = raw.toUpperCase();
  for (const token of KNOWN_UI_TOKENS) {
    if (new RegExp(`\\b${token}\\b`).test(upper)) return token;
  }
  const firstWord = upper.split(/\s+/)[0] || "";
  return firstWord.replace(/[^A-Z0-9]/g, "");
}

function firstSentence(text) {
  if (!text) return "";
  const m = text.match(/^(.*?[.!?])(\s|$)/);
  return (m ? m[1] : text).trim();
}

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

function slugify(baseName) {
  return baseName.toLowerCase().replace(/_/g, "-");
}

function normalizeForIconMatch(s) {
  return s.toLowerCase().replace(/[-_]/g, "");
}

// ---------------------------------------------------------------------------
// Icon lookup
// ---------------------------------------------------------------------------

function buildIconIndex() {
  let files = [];
  try {
    files = fs.readdirSync(ASSETS_IMG_DIR);
  } catch {
    return new Map();
  }
  const index = new Map(); // normalized basename -> relative path "assets/img/<file>"
  for (const file of files) {
    if (!/\.png$/i.test(file)) continue;
    const base = file.replace(/\.png$/i, "");
    const norm = normalizeForIconMatch(base);
    if (!index.has(norm)) {
      index.set(norm, `assets/img/${file}`);
    }
  }
  return index;
}

function findIcon(scriptBaseName, iconIndex) {
  const norm = normalizeForIconMatch(scriptBaseName);
  return iconIndex.get(norm) || null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const REQUIRED_TAGS_FOR_REPORT = [
  "name",
  "version",
  "description",
  "ui",
  "functionality",
  "usage",
  "requirements",
  "notes",
  "changelog",
];

function main() {
  const iconIndex = buildIconIndex();
  const entries = [];
  const warnings = []; // { script, missing: [tags] }
  const iconFound = [];
  const iconMissing = [];

  for (const category of CATEGORIES) {
    const dir = path.join(SRC_ROOT, category);
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".jsx"))
      .sort();

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const baseName = file.replace(/\.jsx$/i, "");
      const source = fs.readFileSync(fullPath, "utf8");

      const { scalars, lists, tagsSeen } = parseFrontmatter(source);

      const displayName = scalars.name.trim() || baseName;
      const description = collapseWhitespace(scalars.description || scalars.preamble);
      const tagline = firstSentence(description);
      const ui = normalizeUi(scalars.ui);
      const version = scalars.version.trim();

      let icon = findIcon(baseName, iconIndex);
      // Owner-verified art corrections: "Centralizer.png" is actually the
      // Originator glyph, and "PathDuplitron.png" is the Distributron glyph.
      if (baseName === "Distributron") icon = findIcon("PathDuplitron", iconIndex);
      if (baseName === "Reseterator") icon = "assets/img/reset-psr.png";
      if (baseName === "Opac-o-bot") icon = "assets/img/parent-opacity-to-parent.png";
      if (baseName === "Controllerizer") icon = "assets/img/create-control-null.png";
      if (baseName === "Linearizer") icon = "assets/img/apply-linear-expression.png";
      if (baseName === "Trace-o-matic") icon = "assets/img/auto-trace.png";
      // 2026-07-04 icon drop: high-res sources in assets/img/, web-sized copies
      // (256px) generated in assets/img/web/ keyed by slug. Originator's art was
      // re-rendered from assets/icons/Centralizer.svg after the PNG was reclaimed
      // by Centralizer's own new icon.
      const WEB_ICONS = ["guiderator", "slidotron-16x9", "slidotron-9x16", "burstmate",
        "sync-o-tron", "keybot", "rectangulator", "subtitleforge", "textmate",
        "centralizer", "originator"];
      const webSlug = baseName.toLowerCase().replace(/_/g, "-");
      if (WEB_ICONS.indexOf(webSlug) !== -1) icon = "assets/img/web/" + webSlug + ".png";
      const slug = slugify(baseName);
      const lucide = LUCIDE_MAP[slug] || DEFAULT_LUCIDE;

      if (icon) iconFound.push(slug);
      else iconMissing.push(slug);

      const missingTags = REQUIRED_TAGS_FOR_REPORT.filter((tag) => {
        if (tag === "description") return !description;
        if (tag === "name") return !displayName;
        if (tag === "version") return !version;
        if (tag === "ui") return !ui;
        if (tag === "changelog") return !tagsSeen.has("changelog");
        return lists[tag].length === 0;
      });
      if (missingTags.length > 0) {
        warnings.push({ script: baseName, missing: missingTags });
      }

      // Onionizer is excluded from distribution: it depends on an external
      // @include module (PropQuery) and is known-blocked. Keep it in the repo
      // and the harness, but off the site / bundles.
      if (baseName === "Onionizer") continue;
      // PathDuplitron is excluded from distribution by owner decision.
      if (baseName === "PathDuplitron") continue;
      // Split-o-matic_9x16 held out for now (owner decision).
      if (baseName === "Split-o-matic_9x16") continue;

      entries.push({
        id: slug,
        name: baseName,
        displayName,
        category,
        version,
        ui,
        tagline,
        description,
        functionality: lists.functionality,
        usage: lists.usage,
        requirements: lists.requirements,
        notes: lists.notes,
        icon,
        lucide,
        docPath: `ae/docs/scripts/${baseName}.md`,
        srcPath: `ae/packages/ae-scripts/src/${category}/${file}`,
      });
    }
  }

  // Curated copy overrides (site/data/copy-overrides.json): hand-written,
  // purpose-first taglines/descriptions that take precedence over the
  // frontmatter-derived text. Keyed by slug id.
  try {
    const ovPath = path.join(SITE_DATA_DIR, "copy-overrides.json");
    const overrides = JSON.parse(fs.readFileSync(ovPath, "utf8"));
    for (const e of entries) {
      const ov = overrides[e.id];
      if (ov) {
        if (ov.tagline) e.tagline = ov.tagline;
        if (ov.description) e.description = ov.description;
      }
    }
  } catch (err) { /* no overrides file — fine */ }

  entries.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  // ---------------------------------------------------------------------------
  // Self-contained assembly: copy everything the site fetches into site/ and
  // rewrite the JSON paths to be internal (no "../"). This lets site/ deploy
  // as a standalone Vercel project served at any base path.
  // ---------------------------------------------------------------------------
  const SITE_DIR = path.join(REPO_ROOT, "ae", "site");
  const cp = (src, dest) => {
    if (!fs.existsSync(src)) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return true;
  };
  for (const dir of ["assets/icons", "docs", "scripts", "scripts/toolbar", "scripts/toolbar/icons", "scripts/projects"]) {
    fs.mkdirSync(path.join(SITE_DIR, dir), { recursive: true });
  }
  for (const e of entries) {
    if (e.icon) {
      const iconSrc = path.join(REPO_ROOT, e.icon);
      if (cp(iconSrc, path.join(SITE_DIR, "assets", "icons", `${e.id}.png`))) {
        e.icon = `assets/icons/${e.id}.png`;
      } else {
        e.icon = null;
      }
    }
    if (cp(path.join(REPO_ROOT, e.docPath), path.join(SITE_DIR, "docs", `${e.name}.md`))) {
      e.docPath = `docs/${e.name}.md`;
    }
    const jsxFile = e.srcPath.split("/").pop();
    if (cp(path.join(REPO_ROOT, e.srcPath), path.join(SITE_DIR, "scripts", e.category, jsxFile))) {
      e.srcPath = `scripts/${e.category}/${jsxFile}`;
    }
  }
  const TOOLBAR = path.join(REPO_ROOT, "ae/packages/ae-scripts/toolbar");
  cp(path.join(TOOLBAR, "IVGD Command Bar.jsx"), path.join(SITE_DIR, "scripts/toolbar/IVGD Command Bar.jsx"));
  const iconDir = path.join(TOOLBAR, "icons");
  for (const f of fs.existsSync(iconDir) ? fs.readdirSync(iconDir) : []) {
    if (/\.png$/i.test(f)) cp(path.join(iconDir, f), path.join(SITE_DIR, "scripts/toolbar/icons", f));
  }
  cp(path.join(REPO_ROOT, "assets/projects/Sync-o-tron.aep"), path.join(SITE_DIR, "scripts/projects/Sync-o-tron.aep"));

  fs.mkdirSync(SITE_DATA_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(SITE_DATA_DIR, "scripts.json"),
    JSON.stringify(entries, null, 2) + "\n",
    "utf8"
  );

  const categories = {};
  for (const cat of CATEGORIES) {
    categories[cat] = entries.filter((e) => e.category === cat).length;
  }
  const meta = {
    total: entries.length,
    categories,
    generated: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(SITE_DATA_DIR, "meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
    "utf8"
  );

  // -------------------------------------------------------------------------
  // Inline a lean copy of the catalog into index.html between markers, so the
  // landing page's grids render synchronously on first paint instead of after
  // a data fetch. That fetch used to leave the grids empty until it resolved,
  // growing the sections under the reader and causing large layout shift (CLS)
  // — the #builder/#library issue Cloudflare RUM flagged. Only the fields the
  // landing UI reads are inlined; the full docs text stays in scripts.json.
  // -------------------------------------------------------------------------
  const LITE_FIELDS = ["id", "name", "category", "version", "ui", "tagline", "icon", "lucide", "srcPath"];
  const lite = entries.map((e) => {
    const o = {};
    for (const k of LITE_FIELDS) o[k] = e[k];
    return o;
  });
  const INDEX_HTML = path.join(SITE_DIR, "index.html");
  const START = "<!-- INLINE_SCRIPTS_DATA:START -->";
  const END = "<!-- INLINE_SCRIPTS_DATA:END -->";
  try {
    let html = fs.readFileSync(INDEX_HTML, "utf8");
    // Escape "<" so a tagline can never break out of the <script> element.
    const json = JSON.stringify(lite).replace(/</g, "\\u003c");
    const block = `${START}\n  <script>window.__SCRIPTS__=${json};</script>\n  ${END}`;
    const re = new RegExp(`${START}[\\s\\S]*?${END}`);
    if (re.test(html)) {
      fs.writeFileSync(INDEX_HTML, html.replace(re, block), "utf8");
      console.log(`  ${INDEX_HTML} (inlined ${lite.length} scripts)`);
    } else {
      console.warn(`  ! index.html missing INLINE_SCRIPTS_DATA markers — inline skipped`);
    }
  } catch (err) {
    console.warn(`  ! could not inline catalog into index.html: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // Console report
  // -------------------------------------------------------------------------
  console.log(`\nParsed ${entries.length} scripts.\n`);

  const emptyTagline = entries.filter((e) => !e.tagline);
  const emptyDescription = entries.filter((e) => !e.description);
  console.log(`Entries with empty tagline: ${emptyTagline.length}`);
  console.log(`Entries with empty description: ${emptyDescription.length}`);

  if (warnings.length > 0) {
    console.log(`\nFrontmatter tags missing/empty per script:`);
    for (const w of warnings) {
      console.log(`  - ${w.script}: ${w.missing.join(", ")}`);
    }
  } else {
    console.log(`\nNo missing frontmatter tags detected.`);
  }

  console.log(`\nIcons found (${iconFound.length}): ${iconFound.sort().join(", ")}`);
  console.log(`Icons missing -> lucide fallback (${iconMissing.length}): ${iconMissing.sort().join(", ")}`);

  console.log(`\nSummary table:`);
  const rows = entries.map((e) => ({
    name: e.name,
    category: e.category,
    ui: e.ui,
    iconFound: e.icon ? "yes" : "no",
  }));
  const nameWidth = Math.max(...rows.map((r) => r.name.length), 4);
  const catWidth = Math.max(...rows.map((r) => r.category.length), 8);
  const uiWidth = Math.max(...rows.map((r) => r.ui.length), 2);
  const pad = (s, w) => String(s).padEnd(w);
  console.log(`${pad("name", nameWidth)}  ${pad("category", catWidth)}  ${pad("ui", uiWidth)}  icon`);
  for (const r of rows) {
    console.log(`${pad(r.name, nameWidth)}  ${pad(r.category, catWidth)}  ${pad(r.ui, uiWidth)}  ${r.iconFound}`);
  }

  console.log(`\nWrote:`);
  console.log(`  ${path.join(SITE_DATA_DIR, "scripts.json")}`);
  console.log(`  ${path.join(SITE_DATA_DIR, "meta.json")}`);
}

main();
