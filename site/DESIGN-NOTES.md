# Design spec — extracted from ae-scripts.pen (source of truth)

Implementation reference for the static site in `site/`. All values verbatim from the .pen.

## Tokens

| token | value |
|---|---|
| bg | #0C0D11 |
| bg-alt | #101218 |
| surface | #16181F |
| surface-2 | #1C1F29 |
| border | #272B36 |
| border-soft | #1F222C |
| accent | #7C5CFF |
| accent-soft | #7C5CFF26 |
| accent-text | #C3B5FF |
| on-accent | #FFFFFF |
| text-primary | #F5F6F8 |
| text-secondary | #A2A8B5 |
| text-muted | #6A7080 |
| font-display | Space Grotesk |
| font-body | Inter |
| font-mono | JetBrains Mono |

Category colors: animation #7C5CFF · composition #2E9BFF · effects #FF6B9D · keyframes #FFB454 · layers #5AD19A · paths #C77DFF · utilities #4ED8E0
Category display names: Animation & Rigging, Composition, Effects & Audio, Keyframes, Layers, Paths & Shapes, Utilities (counts 3/4/4/3/7/6/4).

Page width 1440, content column 1184. Hero bg: linear gradient 180deg #0E1019 → #0B0C10; radial purple glow (#7C5CFF → transparent, blur 40, opacity .5, 760×620 right-top) + blue glow (#2E6BFF, opacity .32, 560×520 left).

## Landing sections

1. **Hero** pad 96/128, vertical gap 34, content 1184:
   - Eyebrow pill: radius 100, fill accent-soft, border $border, pad 7/14, gap 8 — lucide `sparkles` 14 accent-text + "IVG DESIGN · FREEWARE TOOLKIT" mono 12 ls 1 accent-text
   - H1 "31 scripts that delete the tedious parts of After Effects." Space Grotesk 62/600, ls -1.5, lh 1.05, width 980
   - Sub: "Production-ready tools for rigging, keyframes, paths, effects and audio — built over years of motion work and free under MIT. Grab the whole panel, or just the one tool you need." Inter 18, lh 1.55, width 720, text-secondary
   - CTAs gap 14: primary fill accent radius 12 pad 14/22 gap 9, `download` 18 + "Download all (.zip)" Inter 15/600 white; secondary fill surface border $border, `github` + "Browse on GitHub"
   - Stat strip: accent rule 160×2, then stats gap 44: (31 scripts / 7 categories / 0 dependencies / MIT license / CS6+ compatible) — value Space Grotesk 30/600 ls-1, label mono 11 ls .5 muted, align end
   - Toolbar caption row (space-between, align end, pad-top 18): left kicker "01 — THE COMMAND BAR" mono 12 ls 1.5 accent-text, title "One panel. Every tool a keystroke away." SG 18/500, sub "The full IVG toolbar — dock it once, fire any script from the command bar." Inter 13.5 muted; right "31 tools" mono 12 muted
   - **kbar Toolbar** (signature): radius 16, fill surface, border, shadow 0 24 60 -20 #00000080; header (bg-alt pad 14/16, space-between): search box 420w surface-2 radius 10 border pad 11/14 (`search` 16 + "Search 31 scripts…" Inter 14 muted) | right: "jump to" 13 muted + kbd "⌘ K" mono 12 surface-2 radius 7 border pad 6/10; 1px border divider; icon grid pad 16 gap 10, 3 rows × 12/12/7 tiles: tile h64 fill_container surface-2 radius 10 border-soft, centered 34px icon img (assets/img/*.png) or lucide 24 text-secondary for the 11 missing
2. **Library / Console** (bg-alt, pad 88/128, gap 30):
   - Head space-between align-end: "02 — THE LIBRARY" kicker; "Every tool, one click away" SG 36/600 ls-.8 | pill surface border radius 100 pad 8/14: `mouse-pointer-click` 14 accent-text + "Click any script to open its full docs" 13
   - App window: radius 16 surface border shadow 0 30 70 -24 #00000088. Titlebar bg-alt pad 12/16: mac dots 11px (#FF5F57/#FEBC2E/#28C840 op .9 gap 7) + "ivg-toolkit · browser" mono 12.5; right: search 300w (radius 8 pad 8/12, icon 14 + 13px text) + segmented list/grid (surface-2 radius 8 pad 3 border; active btn fill accent radius 6 pad 5/9 white icon 14, inactive muted)
   - Body h574: Sidebar 284 bg-alt pad 14 gap 3 border-right: "CATEGORIES" mono 11 ls 1.2 muted; item radius 8 pad 10/12 gap 11: dot 8px cat color + name Inter 14 (active: fill accent-soft, text-primary 600, count accent-text) + count mono 12 muted; footer card surface-2 radius 10 border pad 14 gap 10: `package` 16 accent-text + "Get everything" SG 14/600, "All 31 scripts in one bundle." 12 muted, btn accent radius 8 pad 9/12: `download` 15 + "Download .zip" 13/600
   - Content: CHead pad 16/20 border-bottom-soft: "Layers" SG 20/600 + "7 scripts" mono 12 muted | "sorted by name" mono 11.5 muted
   - List rows pad 13/18 gap 14 border-bottom-soft (hover/active fill surface-2): tile 38 surface-2 radius 9 border-soft w/ 22px img; name-col w430: name SG 15/600 + desc Inter 12.5 lh1.4 muted; spacer; "v2.0.0" mono 11 muted; UI badge fill #7C5CFF22 radius 5 pad 3/7 text mono 10 #C3B5FF (DIALOG/PALETTE/HEADLESS); chevron-right 18 (active accent-text, else muted)
   - WinFoot bg-alt pad 11/18 border-top: "31 scripts · 7 categories · all MIT" | "↩ open docs    ⌘D download" mono 11.5
3. **Install** (bg, pad 84/128, gap 40): kicker "03 — GET STARTED"; "Install in three steps" SG 38/600. 3 cards fill surface radius 14 border pad 26 gap 14: num tile 42 accent-soft radius 10 (SG number), title SG 19/600, desc Inter 14 lh 1.55 text-secondary. Steps: Download / Drop it in / Run it (copy in .pen).
4. **CTA panel**: radius 22 gradient 115° #8A6BFF→#5B3FD6, pad 64, centered: "Get the whole toolkit." SG 40/600 white; sub Inter 17 #EFEBFF w600 center; btns: white pill (#5B3FD6 text+icon) "Download all (.zip)"; ghost #FFFFFF1F border #FFFFFF55 "View source"
5. **Footer** bg-alt pad 28/128 space-between: "Made by IVG Design · Free & open-source under MIT" Inter 13 muted | "github.com/ivg-design/ae" mono 13 text-secondary

## Overlays

- **Detail modal** 980w radius 18 surface border shadow 0 40 90 -20 #000000AA, scrim #06070ACC + purple glow. Header pad 22/28 border-b-soft: tile 58 surface-2 radius 13 w/ 34 img; name SG 27/600 ls-.5; meta chips gap 8 (cat chip w/ dot, vVERSION chip surface-2 border radius 6 pad 4/9 mono, UI badge #7C5CFF22); close 38 surface-2 radius 9 border. Summary pad 20/28: accent bar 3×46 + tagline Inter 16 lh 1.5. Body pad 28 gap 32: left fill (HOW IT WORKS: label `workflow` 15 + mono 12 ls1 accent-text; items gap 11: 18px check chip accent-soft + Inter 14 lh1.45; GOOD TO KNOW list muted 13.5 w/ dots) right 372 (cards surface-2 radius 12 border pad 18: HOW TO USE numbered 22px chips; RUN IT `terminal` + term box #0A0B0F radius 8 pad 11/13 mono 12.5 accent-text "▸ File ▸ Scripts ▸ Run Script File…" + note 12 muted; REQUIREMENTS 13; btn accent radius 10 pad 13/16 "Download {name}.jsx"; ghost "View source"). Footer bg-alt pad 14/28: "Updated {date} · v{ver} · MIT" | "‹ prev   next ›" mono 11.5. Headless variant: cyan #4ED8E0 accents, HEADLESS badge, run-block mentions ⇧ Shift.
- **⌘K palette** 720w radius 16: search row pad 17/20 border-b (`search` 19 accent-text, query 15, caret, esc chip); results pad 8 gap 2: group label mono 11 muted pad; row radius 9 pad 9/10 gap 11: 3px accent bar (selected) + tile 32 + name SG 14.5/600 + sub 12 muted + hint mono 11; ACTIONS group (Download all ⌘D, Open repository, Copy Scripts folder path); footer bg-alt "↑↓ navigate ↵ open ⌘D download esc close" gap 18
- **Download modal** 560w radius 18: header pad 22/26 (tile 50 accent-soft radius 12; "Download the toolkit" SG 22/600; "31 scripts · MIT · no sign-up" mono 12); body pad 26 gap 18: Everything card surface-2 radius 13 ACCENT border pad 18 ("Everything" SG 17/600, desc 13, "≈ 480 KB" chip, btn "Download ae-scripts.zip"); "or" divider; Individual card ("Grab individual scripts", "Browse the library and download single .jsx files.", "Open library →" accent-text 13/600); "PREFER GIT?" + term "git clone https://github.com/ivg-design/ae" + copy icon; foot: `shield-check` "No sign-up · no tracking · MIT licensed"
- **Grid view**: cards h194 surface-2 radius 12 border pad 16, space-between vertical: header (tile 42 bg radius 10 + name SG 15/600 + meta), desc 12.5, "Download .jsx" accent-text 12.5 + icon 14
- **Docs page**: nav bg-alt pad 16/40 border-b (mark 28 accent radius 8, "IVG Toolkit" SG 16/600, version chip; links Library/Docs*/Changelog/GitHub 14, Download btn accent radius 9 pad 9/16); body 3-col: DocNav 262 bg-alt pad 26/20 (search, groups mono 10.5, items radius 7 pad 8/11, active accent-soft); Article pad 44/64 gap 26 (breadcrumb; H1 SG 42/600 ls-1; badges; lead 17 lh1.6; H2 rows w/ icon; feature list; steps; term; rules between); OnThisPage 222 pad 44/24 border-l (mono 10.5 "ON THIS PAGE", links 13, active accent-text)
