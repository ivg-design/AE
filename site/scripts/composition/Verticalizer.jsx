/**
 * Verticalizer - Landscape to Portrait Split-Screen Rig Builder for Adobe After Effects
 *
 * @name Verticalizer
 * @author IVG Design
 * @version 1.9.4
 * @date 2026-07-30
 * @license MIT
 * @ui PANEL
 *
 * @description
 * Turns any landscape video (or composition) into a fully rigged portrait split-screen build
 * in one click, at 1080x1920 or any size picked in the panel (HD / 2K / 4K portrait, 4:5
 * feed, square, or custom). The script creates a native-resolution source precomp,
 * a portrait master composition, and a complete expression-driven rig: two independently
 * zoomable and pannable windows separated by a draggable split line, an animatable
 * picture-in-picture morph that floats either window over the other, an auto-sizing caption
 * system, a blurred/solid/gradient background stack, and platform-aware safe-zone overlays.
 * Every parameter lives on a single "Verticalizer" pseudo effect applied to the
 * "[CTRL] Verticalizer" guide layer, and every on-canvas control is a Duik-style guide-layer
 * handle whose shape paths are locked with a "value" expression so dragging always moves the
 * layer instead of editing the glyph. Every expression reads thisComp.width / thisComp.height
 * at runtime, so the rig keeps working after a comp-settings resize or when the effect is
 * applied to a non-1080x1920 composition.
 *
 * @functionality
 * • Builds the portrait master comp at a size chosen in the panel - presets for HD / 2K / 4K
 *   portrait, 4:5 feed, square and 720 portrait, or two custom pixel fields, clamped to After
 *   Effects' own limits - plus a native-resolution SRC precomp, filed under
 *   a per-source project folder ("Verticalizer/<name>/"). Building again from the same source
 *   version-stamps the whole rig - "<name> v2", "v3", ... - across the folder, both comps and
 *   the footage layer names, so repeat builds never collide in the Project panel
 * • Applies an embedded "Verticalizer" pseudo effect (69 controls in 9 top-level groups, with
 *   a full mirrored "Top Card" / "Bottom Card" tree) to a single guide-layer controller - no
 *   external .ffx file required. A second embedded pseudo effect, "Verticalizer Caption"
 *   (13 controls), is applied once per added caption handle
 * • Warns before building if the source cannot fill the rig at 100 % (or is so much larger
 *   than the rig that most of it is thrown away), naming both sizes and the cover percentage,
 *   and offering to proceed or to go back and change the rig size
 * • Draggable SPLIT handle (X locked, Y free) drives both window heights, both mattes, the
 *   divider bar and both source layers through one clamped expression chain
 * • Per-section window resolver: each window can be Cover, 1:1, 16:9, 9:16, Fit Height or
 *   Fit Width inside its section, with an independent pixel Inset, and every consumer (matte,
 *   footage scale, footage position, card, pan null) re-derives the same window box
 * • Keyable Aspect: the "Aspect" popup is a hold-keyframeable control and a per-card
 *   "Aspect Ease" (in FRAMES, default 15) turns each of its keyframes into a MORPH instead of
 *   a jump - for the "Aspect Ease" frames after an Aspect key the window box eases linearly
 *   from the previous key's aspect to the new one, in split mode and mid-PiP alike, while the
 *   split, seam, insets and "PiP Transition" all keep animating live underneath. "Aspect Ease"
 *   0, or a card whose Aspect carries no keyframes, is the pre-1.8.0 behaviour to the pixel
 * • The Inset only shrinks the COMP-FACING edges; the seam is governed by "Seam Mode" -
 *   "Gap" holds the two windows exactly Gap apart whatever the insets are, "Inset" pushes each
 *   card off the split line by its OWN Inset x "Seam Inset %" so the middle spacing matches the
 *   outer framing (Gap is ignored in that mode)
 * • TOP / BOT PAN handles parented to shy, disabled "Z TOP" / "Z BOT" nulls give per-window
 *   pan and rotation, with optional edge clamping so panning can never reveal empty frame
 * • Per-card "Scale Mode" decides what Zoom is a percentage OF: "Fill Window" re-fits the
 *   footage to the window every time the window changes (the pre-1.4.0 behaviour), while
 *   "Fixed" anchors it to a comp-cover baseline, so dragging the split only re-crops the matte
 *   and the footage holds its size - Zoom is then the only thing that scales it
 * • Animatable picture-in-picture morph: "PiP Panel" nominates the floating card, "PiP Transition"
 *   (0-100 %, keyframeable) blends every window box between its split position and its PiP
 *   target and "PiP Scale" sets the floating window's width as a percentage of the comp. The
 *   floating window centres itself on a new draggable orange PIP handle and keeps its own
 *   Aspect; the other card grows to fill the comp minus its own Inset. Amount = 0 is the split
 *   layout to the pixel, so the whole feature is inert until it is keyframed
 * • Stacking-independent PiP occlusion: each matte carries a second "Hole" rect and a Merge
 *   Paths (Subtract), live only on the BACKGROUND card, that punches the floating card's
 *   window plus its border ring out of the background window - so the floating card reads
 *   correctly whichever side it is on, without ever restacking layers at runtime
 * • Stacking-independent PiP shadow: a dedicated "PiP Shadow" layer (Drop Shadow with Shadow
 *   Only, alpha-matted by the comp minus the floating card) sits above both cards and casts
 *   the floating card's shadow for either "PiP Panel" choice, cross-fading with that card's
 *   own shadow so the two never draw at once
 * • Fully independent cards: each side owns its Aspect, Inset, Scale Mode, Zoom, Clamp Pan,
 *   Corner Radius, Edge Feather (Fast Box Blur on the alpha matte), Opacity, Border Width /
 *   Color, Shadow Opacity / Softness / Distance / Angle, Speed and Time Offset
 * • "TOP Card" / "BOT Card" layers behind each window draw an expression-driven border and a
 *   Drop Shadow around the window box, both read from that card's own controls
 * • Audio Source routes sound to the top window, the bottom window, or mutes both, by
 *   expression on the footage layers' Audio Levels
 * • Per-card retiming without unlocking anything: Time Remapping is enabled on both windows
 *   and driven by an expression that INTEGRATES "Top / Bottom Speed" (0-400 %, 0 = freeze)
 *   frame by frame, so a speed ramp behaves like a variable-speed transport and restoring
 *   speed after a freeze resumes from the frame the freeze parked on; "Top / Bottom Time
 *   Offset" is in FRAMES and adds to the integrated position, and a read-only
 *   "Top / Bottom Source Frames" readout shows how many frames the source actually has
 * • Auto-sizing caption system: point text with style-driven size and colour, shrink-to-fit
 *   Max Width scaling, a freely draggable CAPTION handle (both axes), and a rounded caption
 *   box with its own fill opacity plus an optional outline stroke
 * • Independent captions: "Add Caption" builds a complete caption of its own - "Caption NN
 *   Handle" carrying its own "Verticalizer Caption" control panel, plus its own text and box
 *   wired to it - and the number increments with every caption added, so any number of
 *   captions can be sized, coloured, moved and switched off without touching each other
 * • Marker-driven captions: every caption has a "Caption Source" of Manual (type into the
 *   text layer, the pre-1.7.0 behaviour) or Markers (the caption becomes a subtitle track,
 *   showing each marker's comment for exactly that marker's duration and nothing between
 *   markers). The BUILT-IN caption reads COMP markers; each STANDALONE caption reads the
 *   markers on its OWN "Caption NN Handle" layer, so caption tracks cannot collide
 * • Caption fades: "Caption Fade" plus an integer "Fade Frames" fades the caption text and
 *   its box together - inside the marker segment in Markers mode (the first and last N
 *   frames of the segment, so the caption never draws outside its own marker), and against
 *   the text layer's in/out points in Manual mode
 * • Background stack with four modes (Blurred Video / Solid / Gradient / Transparent), blur
 *   amount, darken amount and a two-stop Gradient Ramp
 * • Platform-aware safe zones (All / TikTok / Reels / Shorts) drawn as translucent red bands
 *   plus a green safe-rect outline, built in ABSOLUTE comp coordinates (every band carries an
 *   expression on both its Size and its Position, on a layer parked at anchor [0,0] /
 *   position [0,0]) so nothing can shift them, with adjustable opacity
 * • Lock + shy hygiene: every structural layer is shied and locked at the end of the build and
 *   Hide Shy Layers is turned on, so the timeline opens showing only "[CTRL] Verticalizer",
 *   the five handles and "Caption Text" (7 visible layers)
 * • Handle transform locks: every handle and the controller carry a static "[100,100]" Scale
 *   expression, and SPLIT / CAPTION / PIP / [CTRL] a static "0" Rotation expression, so a
 *   stray corner-drag or rotate gesture in the viewer cannot distort a handle. The two PAN
 *   handles deliberately keep a free Rotation, because that IS the per-window rotation input.
 *   Each handle's inner "Glyph" group is pinned the same way (Rotation "0", Position "[0,0]",
 *   Scale already driven by "Handle Size")
 * • "Add Caption" duplicates the caption text/box pair at the current time indicator with a
 *   three second duration and rewires the new box to the new text layer
 * • Re-apply / Upgrade Rig: pressing "Create Portrait Rig" on a composition that already
 *   holds a rig offers to REPAIR it instead of building another one - every expression on
 *   every rig layer is re-derived from the current builders, anything this version expects
 *   and cannot find (matte and card PiP holes, the PiP Shadow pair, the PIP handle, the
 *   "Z TOP" / "Z BOT" nulls) is added, and an out-of-date control panel is replaced with the
 *   current one carrying the editor's values AND keyframes across by control name. Layers
 *   the rig does not own are never touched, and no keyframe anywhere is moved or removed
 * • "Apply Rig FFX to Selected Layer" registers and applies the pseudo effect to any layer
 *
 * @usage
 * 1. Select a landscape footage item or composition in the Project panel (or select an AV
 *    layer inside an open composition).
 * 2. Run Verticalizer, set "Rig Size" (pick a preset or type a width and height), and press
 *    "Create Portrait Rig". If the source cannot fill that size at 100 %, a warning names
 *    both sizes and lets you go back and change them or build anyway. Building again from
 *    the same source version-stamps the whole rig ("<name> v2", "v3", ...).
 * 3. The portrait master comp opens. Drag the cyan SPLIT handle to move the split line.
 * 4. Drag the green TOP and magenta BOT crosshair handles to pan each window; rotate them to
 *    rotate the footage inside its window.
 * 5. Drag the yellow CAPTION handle anywhere on the frame to move the caption block, and the
 *    orange PIP handle to place the picture-in-picture window. A handle that cannot do
 *    anything takes itself off the canvas: the PIP handle is hidden while "PiP Transition"
 *    is 0, and a caption handle is hidden while its own "Show Captions" is off.
 * 6. Select "[CTRL] Verticalizer" and use the "Verticalizer" effect: Interface, Layout (Gap,
 *    Seam Mode, Seam Inset %, Audio Source), PiP (PiP Panel, PiP Transition, PiP Scale), the
 *    mirrored "Top Card" / "Bottom Card" trees (Framing, Style, Border & Shadow, Time),
 *    Divider, Background, Captions and Safe Zones.
 * 7. Choose how the middle reads: leave "Seam Mode" on "Gap" to hold the windows exactly
 *    "Gap" pixels apart at any Inset, or switch it to "Inset" so each card steps off the
 *    split line by its own Inset x "Seam Inset %" (50 % = the two half-insets add up to one
 *    full inset of seam, matching the comp-edge framing).
 * 8. Decide whether a window's footage may resize when the window does: "Top / Bottom Scale
 *    Mode" = "Fill Window" keeps the pre-1.4.0 behaviour (the footage always fills the window,
 *    so dragging the split rescales it), "Fixed" pins the footage to a comp-cover baseline so
 *    the split only re-crops it. Set the punch-in with Zoom in Fixed mode - 100 % covers the
 *    whole comp - then drag the split freely.
 * 9. Retime a window from "Top Time" / "Bottom Time": Speed is a percentage of real time and
 *    is INTEGRATED, so keyframing it 100 -> 0 -> 100 freezes the frame and then carries on
 *    from that frame instead of jumping. "Time Offset" is in FRAMES and adds to that
 *    position - keyframe it while Speed is 0 to scrub the source by hand. "Source Frames"
 *    is a read-only readout of the source length.
 * 10. Animate the picture-in-picture: pick which window floats with "PiP Panel" (Top |
 *    Bottom), drag the orange PIP handle to where that window should sit, set its size with
 *    "PiP Scale" (percentage of comp width - the height follows that card's own Aspect), then
 *    keyframe "PiP Transition" from 0 to 100. At 0 the layout is exactly the split build, at 100
 *    the chosen window is a floating card on the PIP handle and the other one fills the comp
 *    (minus its own Inset); everything in between is a straight interpolation of the same
 *    window box, so the mattes, footage, borders, shadows and pan clamps all follow.
 *    To change a card's SHAPE on the way - a Cover pane becoming a 1:1 picture-in-picture, say
 *    - drop a HOLD keyframe on that card's "Aspect" popup somewhere inside the transition (right
 *    click the keyframe > Toggle Hold Keyframe; a popup should always be held) and set its
 *    "Aspect Ease" to how many FRAMES the shape change should take. The window then eases from
 *    the previous key's aspect to the new one over those frames instead of snapping on the key,
 *    and it does so while "PiP Transition" is still running, so the two morphs read as one move.
 *    Leave "Aspect Ease" at 0 to get the old hard cut back.
 * 11. Type your caption into the "Caption Text" layer. Press "Add Caption" to add another
 *    caption starting at the current time indicator - it arrives with its own "Caption NN
 *    Handle" and its own "Verticalizer Caption" control panel on that handle, so it is fully
 *    independent of the first one. Select that handle to reach its controls.
 * 12. To drive a caption from markers instead of typing into it, set that caption's
 *    "Caption Source" to "Markers" and put markers where the subtitles go. WHICH markers is
 *    different per caption, and it is deliberate:
 *    - the BUILT-IN caption ("Caption Text", controlled from the "Captions" group on
 *      "[CTRL] Verticalizer") reads the COMPOSITION's markers - the marker row under the
 *      timeline, added with * on the numeric keypad with no layer selected.
 *    - a STANDALONE caption ("Caption NN Text") reads the markers on its OWN
 *      "Caption NN Handle" layer - select that handle and press * to add one.
 *    Either way the caption shows a marker's COMMENT for exactly that marker's DURATION and
 *    nothing in the gaps, so give every marker a duration (drag its right edge, or set it in
 *    the marker dialog); a zero-duration marker shows nothing at all.
 * 13. Turn "Caption Fade" on and set "Fade Frames" to fade a caption in and out. In Markers
 *    mode the fade is INSIDE the marker - the first and last "Fade Frames" of the segment -
 *    so the caption is never visible outside its own marker, and a marker shorter than two
 *    fades simply never reaches full opacity. In Manual mode the fade runs against the text
 *    layer's own in and out points, so trim the layer to time it. Text and box always fade
 *    together, outline included.
 * 14. Turn "Show Handles" and "Show Safe Zones" off before reviewing (both live on guide
 *    layers, so they never render either way).
 * 15. Every other layer is shy and locked and the master comp has Hide Shy Layers on. Turn Hide
 *    Shy Layers off and clear the lock switch on a layer if you need manual access to it.
 * 16. To FIX a rig - expressions that stopped working, a rig built by an older version, a
 *    layer that came back from a round trip with its wiring gone - open that rig's portrait
 *    comp (or select it in the Project panel) and press "Create Portrait Rig" again. A
 *    dialog offers "Re-apply / Upgrade Rig", "Create New Rig" or Cancel. The repair
 *    re-writes every expression the rig owns, adds any structural piece this version
 *    expects and cannot find, and upgrades an older control panel to the current one -
 *    carrying every value and every keyframe over by control name. Your own layers in the
 *    comp are never touched, and no keyframe is moved or deleted. Anything the repair could
 *    not carry across (a control that no longer exists, a pan handle whose Position is
 *    keyframed and so was not re-parented) is NAMED in the summary at the end, so you know
 *    exactly what is left to set by hand.
 * 17. Run as a floating window, Verticalizer closes itself after a successful action; docked
 *    as a panel it stays where you put it.
 *
 * @requirements
 * • Adobe After Effects 2023 (23.0) or later - uses AVLayer.setTrackMatte() and text style
 *   expressions (getStyleAt / setFontSize / setFillColor)
 * • "Allow Scripts to Write Files and Access Network" must be enabled in
 *   Preferences > Scripting & Expressions (the embedded .ffx is written to the temp folder
 *   once, to register the pseudo effect with After Effects)
 * • A footage item, composition, or AV layer to build the rig from
 *
 * @notes
 * • The rig controller's pseudo effect match name is "Pseudo/IVGD Verticalizer9" and its
 *   display name is "Verticalizer"; the caption panel's are "Pseudo/IVGD VerticalizerCap2"
 *   and "Verticalizer Caption". Expressions address controls by their exact display names.
 * • Captions differ in exactly TWO things, and both live in the expression prelude so that
 *   every expression BODY is shared and the two paths cannot drift apart. (1) Where the
 *   controls come from: the first caption reads the controller's "Captions" group, every
 *   caption added afterwards reads the "Verticalizer Caption" effect on its own handle
 *   (ePre vs ePreCaption). (2) Where MARKERS come from, when "Caption Source" is Markers:
 *   the built-in caption reads the COMP's markers (thisComp.marker) - one comp-wide subtitle
 *   track, which is what a comp marker row already is - while a standalone caption reads the
 *   markers on its OWN "Caption NN Handle" layer, so two caption tracks can never collide on
 *   one marker row (ePreCaptionMk binds MKSRC). Because "Add Caption" duplicates the first
 *   caption (to inherit the font and any styling already applied), every inherited expression
 *   is then repointed at the new handle; missing even one would leave a caption that looks
 *   independent but silently follows caption one.
 * • Marker captions follow SubtitleForge's semantics exactly, including the two edge cases.
 *   The active segment is [marker.time, marker.time + marker.duration) - HALF-OPEN, so a
 *   caption stops on the frame its marker ends. A ZERO-duration marker therefore never shows
 *   anything (duration is what makes a marker a caption), and OVERLAPPING or adjacent markers
 *   resolve to the LAST one starting at or before now, so a new marker supersedes a still-
 *   running one instead of the two fighting over a single caption.
 * • The caption fade is emitted by ONE builder and multiplied into the text layer's opacity
 *   and the box layer's opacity, never into the rect's fill opacity: the box outline is a
 *   stroke operator with no opacity of its own, so it can only fade by riding the layer, and
 *   putting the factor on the fill as well would square it on the plate while leaving the
 *   outline linear. "Box Opacity" therefore keeps meaning exactly what it always meant. In
 *   Manual mode the BOX fades against the TEXT layer's in/out points rather than its own, so
 *   the pair stays welded together even if their trims drift. With "Caption Fade" off the
 *   factor is exactly 1 and every caption value is bit for bit what 1.6.1 produced.
 * • Nothing about the rig is tied to 1080x1920. "Rig Size" only decides what comp gets built:
 *   every expression reads thisComp.width / thisComp.height, so a rig also survives a
 *   comp-settings resize afterwards. The only build-time pixel numbers are initial handle
 *   positions, and they are stated as fractions of the chosen size.
 * • "PiP Transition" is a blend, not a switch. The window resolver first works out the SPLIT box
 *   exactly as before (sW / sH / sCx / sCy) and then a PiP target (pW / pH / pCx / pCy), and
 *   every window quantity is the straight lerp between them at t = PiP Transition / 100. t = 0
 *   therefore multiplies every delta by zero and reproduces the 1.4.0 geometry bit for bit -
 *   the feature cannot alter a rig that never touches it. The floating card's PiP target is
 *   "CW x PiP Scale % wide, that card's own Aspect tall, centred on the PIP handle"; the
 *   background card's is "the whole comp shrunk by its own Inset on all four sides".
 * • The Aspect blend is a blend of two whole WINDOW BOXES, not of an aspect number. The
 *   resolver emits everything downstream of the Aspect popup as one expression-local function
 *   geomFor(am) that returns the finished [winW, winH, winCx, winCy] for aspect mode "am" -
 *   the split-box fit AND the PiP floating box's aspect ratio, because the floating box reads
 *   the same popup; easing only the split fit would leave the PiP snapping mid-morph. Within
 *   "Aspect Ease" frames of an Aspect keyframe the result is geomFor(previous key's aspect)
 *   lerped into geomFor(current aspect). Everything the aspect does NOT decide - the box edges
 *   from the SPLIT handle, Gap, Seam Mode and Inset, the "PiP Transition" factor and the panel
 *   role - is computed ONCE outside the function and captured by it, so both geometries are
 *   evaluated against the CURRENT box at the CURRENT PiP amount and every one of those controls
 *   keeps animating live through the blend. The fast paths are exact: with no Aspect keyframes,
 *   with "Aspect Ease" 0, or past the ease window, geomFor() is called once and the emitted
 *   arithmetic is the 1.7.4 resolver verbatim - not merely close to it. The blend also needs a
 *   PREVIOUS key to come from, so the first Aspect keyframe on a card never moves anything, and
 *   two keys closer together than the ease always blend from the immediately previous one.
 *   Because the function name would otherwise collide in the expressions that resolve BOTH
 *   cards at once (the matte and card holes), it carries the resolver prefix too - "ogeomFor".
 * • The PiP occlusion does NOT restack layers. "TOP Matte / TOP / TOP Card" always sit above
 *   "BOT Matte / BOT / BOT Card", so with "PiP Panel" = Bottom the floating card would be
 *   buried under the background card's full-comp window. Instead each matte carries a second
 *   "Hole" rect and a Merge Paths in Subtract mode, and the hole is LIVE only on the
 *   background card (on the floating card it collapses to [0, 0]). The hole is expressed as
 *   the OTHER card's lerped window inflated by that card's Border Width, with that card's
 *   Corner Radius + Border Width of roundness - i.e. exactly the other card's card rect - so
 *   the background window is cut away precisely where the floating card draws. At PiP Transition
 *   0 the two windows are separated by the seam, so the subtraction removes nothing that was
 *   ever visible: any part of the hole that does cross the seam (only reachable with a Border
 *   Width wider than half the Gap) is covered pixel-for-pixel by the floating card's own
 *   opaque border rect, which is stacked above that matte.
 * • The floating card's DROP SHADOW does not come from the card. A card cannot escape its
 *   own place in the layer stack, and "TOP Matte / TOP / TOP Card" is always above
 *   "BOT Matte / BOT / BOT Card", so with "PiP Panel" = Bottom a card-drawn shadow is buried
 *   under the background card's full-comp window and never seen. The shadow is therefore
 *   drawn by a dedicated pair of layers sitting above BOTH card assemblies: "PiP Shadow" (a
 *   rect the size of the floating card's card rect, carrying an "ADBE Drop Shadow" with
 *   Shadow Only ON, so it contributes the cast shadow and nothing else) and "PiP Shadow
 *   Matte" (the whole comp MINUS that same rect, used as its alpha matte - a track matte is
 *   applied after effects, so it clips the finished shadow rather than the rect casting it,
 *   which is what stops the soft inner edge spilling back over the card). Both read whichever
 *   card "PiP Panel" currently nominates, so the shadow follows the animatable panel choice,
 *   and the layer opacity is "PiP Transition", so at 0 the pair contributes exactly nothing.
 *   The floating card's OWN shadow is cross-faded out by (1 - t) over the same interval, so
 *   the two never draw at once and split mode is bit-identical to before.
 * • Shadows are opt-in: "Top / Bottom Shadow Opacity" default to 0. The PiP reads the
 *   FLOATING card's Shadow Opacity / Softness / Distance / Angle, so to give the
 *   picture-in-picture a shadow, raise the Shadow Opacity on the card named by "PiP Panel".
 * • The handle transforms are pinned with static literal expressions ("[100,100]" on Scale,
 *   "0" on Rotation) so a stray corner-drag or rotate gesture in the viewer cannot distort a
 *   handle glyph - a handle is a position input and nothing else. The exception is deliberate
 *   and load-bearing: "TOP PAN Handle" / "BOT PAN Handle" have NO Rotation expression,
 *   because their Rotation is what "TOP / BOT" footage rotation reads. Each handle's inner
 *   "Glyph" group is pinned the same way (Rotation "0", Position "[0,0]"); its Scale already
 *   carries the "Handle Size" expression.
 * • "Top / Bottom Scale Mode" only changes what the Zoom percentage is measured against.
 *   "Fill Window" takes the baseline from the resolved window (max(winW/sw, winH/sh)), so any
 *   control that moves the window - the SPLIT handle, Gap, Seam Mode, Seam Inset %, Inset,
 *   Aspect - also resizes the footage. "Fixed" takes it from the COMP (max(CW/sw, CH/sh)),
 *   which nothing in the window resolver can touch, so the window becomes a pure crop. The
 *   scale expression and the pan-clamp inside the position expression are emitted from ONE
 *   builder (eSourceScale), so the clamp always knows the true drawn size. In Fixed mode the
 *   footage is allowed to end up SMALLER than its window (Zoom below that window's own fill
 *   percentage); the clamp then centres it - Math.max(0, ...) collapses both limits to zero -
 *   and matte void shows at the edges. That is the mode doing what it was asked to do, so
 *   nothing special-cases it.
 * • The seam between the two windows is never the sum of the two Insets. "Seam Mode" = Gap
 *   pins each card's seam edge Gap/2 from the split line (insets touch the comp-facing edges
 *   only); "Seam Mode" = Inset pins it at that card's own Inset x "Seam Inset %" and ignores
 *   Gap. Because the resulting box is asymmetric about the section, the window centre is the
 *   centre of the BOX, and every consumer - including the "Z TOP" / "Z BOT" pan nulls -
 *   re-derives it from the one resolver builder.
 * • Time Remap is the INTEGRAL of Speed, not "elapsed time x current Speed": every frame from
 *   the layer's in point contributes Speed x frameDuration, which is what makes a 100 -> 0 ->
 *   100 speed ramp resume from the held frame instead of snapping to where a constant-speed
 *   clip would have been. The loop only runs when Speed carries keyframes; a static Speed
 *   takes the closed-form fast path. "Time Offset" is in FRAMES (x thisComp.frameDuration),
 *   and the two "Source Frames" sliders are read-only readouts - the script bakes the source
 *   length onto them as a numeric-literal expression, which is also what makes them
 *   un-draggable.
 * • Every card-scoped control name carries its side as a prefix ("Top Corner Radius",
 *   "Bottom Shadow Angle", ...), so the two cards can never read each other's values and every
 *   display name in the effect is unique.
 * • The Safe Zones layer sits at anchorPoint [0,0] / position [0,0] with no transform
 *   expression, which makes its layer space identical to comp space; every band's Size AND
 *   Position are expressions in absolute comp coordinates, so the overlay cannot drift, shrink
 *   or mis-place at any comp size.
 * • Structural layers are locked at the very end of the build. Locking blocks property writes,
 *   so every expression, matte assignment and stacking move must already be done by then.
 * • No comp dimension is ever baked into an expression - every expression opens with
 *   "var CW = thisComp.width, CH = thisComp.height;" and derives from those. Only the SOURCE
 *   width/height are baked as numeric literals, because they describe the footage (and so
 *   collapse transformations cannot break source.width lookups).
 * • Every shape path on the handles and on the [CTRL] glyph carries the expression "value",
 *   which makes the glyph geometry un-editable in the viewer - clicking and dragging a handle
 *   always moves the layer.
 * • Both matte layers must stay directly above their footage layers; the rig uses
 *   setTrackMatte() when available and falls back to trackMatteType plus adjacency. The card
 *   layers sit BELOW their footage layers, so they never interfere with that adjacency.
 * • The "Z TOP" / "Z BOT" nulls are shy AND disabled (they render nothing either way) and the
 *   master comp has Hide Shy Layers enabled; parenting and expression reads are unaffected.
 * • The whole build is a single undo step ("Verticalizer: Create Rig"), and so is a whole
 *   repair ("Verticalizer: Repair Rig") - a repair that throws undoes itself completely,
 *   because a half-repaired rig is worse than a broken one.
 * • The repair is expression-first by construction. Wiring a rig layer means assigning
 *   expression strings, which is the one operation that cannot disturb a keyframe; the only
 *   static writes go through setStaticSafe, which REFUSES a property that has keys; and the
 *   pseudo-effect migration re-lays every captured key at its original time, value and
 *   interpolation type (a popup or a checkbox is a hold control and its captured
 *   interpolation says so, so it stays hold). Nothing in the repair removes a key.
 * • What the repair may touch is decided by an INVENTORY, not by a guess. The rig's own
 *   layer names are a fixed list, plus "Caption NN Text / Box / Handle", plus the three
 *   source instances - and a source instance has to be BOTH named "TOP / BOT / BG ..." and
 *   be an AV layer whose source is a composition. That second half is what keeps a text
 *   layer called "TOP Secret" out of the rig: it is not an AV layer with a comp source, so
 *   it is not inventoried, so nothing in the repair can reach it. Everything not
 *   inventoried is counted and reported as left alone.
 * • The one inference the migration is allowed to make is a documented RENAME
 *   ("PiP Amount" became "PiP Transition" in 1.6.0). A control that carried a value or
 *   keyframes and has no equivalent in the current panel - pre-1.2.0's single
 *   "Corner Radius", which became a per-card pair and cannot be split automatically - is
 *   NAMED in the report and left for the editor to re-dial. Guessing there would silently
 *   change a look.
 * • Headless/test hook: set $.global.VERTICALIZER_AUTORUN = true to skip the UI and run
 *   "Create Portrait Rig" immediately, $.global.VERTICALIZER_REPAIR = true to make that run
 *   choose the repair when the target comp already holds a rig (without it, an autorun
 *   always builds fresh), and $.global.VERTICALIZER_SILENT = true to accumulate every
 *   message into $.global.VERTICALIZER_LOG instead of showing alert() dialogs.
 *
 * @changelog
 * - 1.9.4 (2026-07-30): Fixes the 1.9.3 reorder, which made things worse before it
 *   made them better. Moving a property inside a shape group invalidates the sibling
 *   references captured before the move - the same trap applyPreset() sets - so
 *   1.9.3, which grabbed all five items up front and then moved them in turn, had
 *   its first move succeed and the other four throw into their own catch. Every
 *   group came out rotated by exactly one item, and a matte whose Window ended up
 *   below its Fill draws no alpha at all, which took both panes off the frame. Each
 *   item is now looked up again immediately before its own move.
 * - 1.9.3 (2026-07-30): Repairing a rig no longer scrambles the card groups. The PiP
 *   hole was inserted by index arithmetic ("move the hole to the fill's slot"), and
 *   when the first move failed inside its own catch the group was left as
 *   "Card Rect, Fill, Subtract, Hole": the Subtract had no path above it and the Fill
 *   painted the un-cut rectangle, so a repaired rig lost its border ring to a solid
 *   block and its Border Width / Border Color appeared to do nothing (field-diagnosed
 *   from a rig dump - the mattes, built in one pass, were correctly ordered while the
 *   retrofitted cards were not). Order is now enforced by moving each item to the END
 *   in canonical sequence, which cannot half-succeed, and both wireMatte and wireCard
 *   run it on every build AND every repair - so an already-scrambled rig heals by
 *   pressing Re-apply / Upgrade Rig again.
 * - 1.9.2 (2026-07-30): The aspect blend inherits the driver's keyframe easing. 1.8.0
 *   ran the blend on LINEAR time, so an aspect change dropped inside an eased
 *   "PiP Transition" reshaped the window on a mechanical ramp while everything else
 *   followed the eased curve - the morph read as if the easing had been lost. When
 *   PiP Transition moves across the ease window the blend now rides its normalised
 *   progress, so the reshape follows whatever easing is on those keyframes; a static
 *   driver (nothing to inherit) still blends on linear time, and the endpoints are
 *   unchanged either way.
 * - 1.9.1 (2026-07-30): The repair prompt now fires from the normal build workflow.
 *   1.9.0 only looked for a rig in the ACTIVE or project-selected comp, but the way
 *   an editor actually reaches this button is by selecting the SOURCE - so pressing
 *   it again on a source that already had a rig silently built "<name> v2" instead
 *   of offering the repair. When nothing rig-shaped is active, the project is now
 *   searched for rigs built FROM THAT SOURCE (a rig whose SRC precomp contains it)
 *   and the same three-way dialog opens, worded for that route. Selecting the rig
 *   comp itself still works exactly as before.
 * - 1.9.0 (2026-07-30): A rig can now be REPAIRED and UPGRADED in place.
 *   CAUSE. Two failures had the same non-answer: "rebuild it". Expressions break - a layer
 *   renamed, an expression cleared by a paste, a project round-tripped through a machine
 *   missing the pseudo effect - and the rig then looks built while behaving wrongly, with
 *   nothing to press. And versions move on: a rig built by 1.5.0 has no matte or card PiP
 *   holes, no PiP Shadow pair, no PIP handle and a 43-control panel, so every feature added
 *   since is unreachable in the comp the editor has already animated. Rebuilding means
 *   losing every keyframe, every caption and every tweak in that comp.
 *   EFFECT. Pressing "Create Portrait Rig" on a composition that already contains
 *   "[CTRL] Verticalizer" now asks: Re-apply / Upgrade Rig, Create New Rig, or Cancel. The
 *   repair re-derives every expression the rig owns, adds the structural pieces the current
 *   version expects and cannot find, upgrades an out-of-date control panel to the current
 *   one - carrying the editor's values AND keyframes across by control name, including the
 *   "PiP Amount" -> "PiP Transition" rename - and reports exactly what it did.
 *   NOTHING IS LOST, AND NOTHING ELSE IS TOUCHED. These are working comps: titles, logos,
 *   an alternative take called "TOP Secret". The repair therefore acts only on an INVENTORY
 *   of rig layers (a fixed name list, "Caption NN ..." and the three source instances,
 *   where a source instance must be both TOP/BOT/BG-named AND an AV layer with a comp
 *   source), and counts everything else as left alone. Keyframes survive by construction,
 *   not by care: wiring only ever assigns expressions, the few static writes go through a
 *   helper that refuses a keyed property, and the effect migration re-lays every captured
 *   key at its original time, value and interpolation. A control the new panel has no
 *   equivalent for, or a PAN handle whose Position is keyframed and so cannot be re-parented
 *   without re-writing those keys, is NAMED in the summary instead of being guessed at.
 *   HOW. The wiring was pulled out of the builders into one wire* function per layer type,
 *   and the builders now call them - so "how a matte is wired" is stated once and a repaired
 *   rig cannot drift away from a freshly built one. That refactor is also why the build is
 *   unchanged to the property: it runs the same code it always did, just from one place.
 *   Every expression now goes through the counting setExprSafe, so a build that could not
 *   write one says so instead of shipping a rig with a silently dead property.
 * - 1.8.0 (2026-07-30): Keyframing a card's Aspect now MORPHS the window instead of cutting.
 *   CAUSE. The Aspect popup was always keyframeable, but nothing in the rig treated a key as
 *   anything other than "the aspect is different from this frame on": the resolver read the
 *   popup once and every window quantity came out of that single read, so the window box, the
 *   matte, the footage fit, the card, the border, the shadow and the PiP hole all changed
 *   shape on one frame. The case that made it untenable is the one this feature was asked
 *   for: a Cover bottom card turning into a 1:1 picture-in-picture, "PiP Transition" keyed
 *   0 -> 100 over frames 1726-1756 with a hold keyframe on "Bottom Aspect" = 1:1 dropped
 *   inside that range. The PiP glided; the aspect JUMPED in the middle of it, and there was
 *   no way to spread the shape change across the same interval.
 *   EFFECT. Every card gains an "Aspect Ease" slider (in FRAMES, default 15) directly under
 *   its "Aspect". For that many frames after each Aspect keyframe the window geometry is a
 *   straight interpolation from the geometry of the PREVIOUS key's aspect to the geometry of
 *   the new one, so the shape change reads as a move. Author it exactly as above: hold-key
 *   the Aspect inside the transition and give it an ease.
 *   HOW. The resolver now emits everything downstream of the Aspect popup as one
 *   expression-local function geomFor(am), returning the finished window box for aspect mode
 *   "am". That deliberately includes the PiP floating box's aspect ratio as well as the
 *   split-box fit, because both read the same popup - easing one and not the other would have
 *   left the picture-in-picture snapping halfway through its own morph. What the aspect does
 *   NOT decide - the box edges from the SPLIT handle, Gap, Seam Mode and Inset, the "PiP
 *   Transition" factor, which card floats - is computed once outside the function and captured
 *   by it, so both aspects' geometries are evaluated against the CURRENT box at the CURRENT
 *   PiP amount: the split can be dragged and the PiP can be running while an aspect blend is
 *   in flight, and all of it stays continuous. Consumers needed no changes at all; they inline
 *   the same resolver and read winW / winH / winCx / winCy, so the mattes, both matte holes,
 *   the cards and their holes, the footage scale and pan clamp, the Z nulls and the PiP Shadow
 *   pair follow the blend for free.
 *   INERT UNTIL USED. With no Aspect keyframes, or "Aspect Ease" 0, or past the ease window,
 *   geomFor() is called exactly once and the emitted arithmetic is the 1.7.4 resolver verbatim,
 *   so an existing rig is unchanged to the pixel. Blending also requires a PREVIOUS keyframe,
 *   which is why a card's first Aspect key never moves anything, and keys closer together than
 *   the ease always blend from the immediately previous one rather than chaining.
 *   CONTROLS. Two new controls means a new definition, so the rig match name is bumped to
 *   "Pseudo/IVGD Verticalizer9" - After Effects registers exactly one pseudo-effect definition
 *   per match name per session - and the registration probe now asks for "Top Aspect Ease",
 *   which exists only in this binary. Embedded rig FFX regenerated at v1.9 (78,432 bytes,
 *   69 controls) from tools/ffx-pseudo-gen. The caption panel is untouched
 *   ("Pseudo/IVGD VerticalizerCap2", 11,866 bytes, 13 controls) and the display name stays
 *   "Verticalizer", so every expression still resolves.
 * - 1.7.4 (2026-07-30): PiP no longer exposes the background card's fill. A card is a
 *   FILLED rect whose interior is normally covered by its own video; the PiP hole
 *   removes that video from the background card, so the fill showed through as a solid
 *   block over the floating pane (field-diagnosed from a live rig dump - the matte-hole
 *   gating itself was correct, and the dump also confirmed AE renders the Merge
 *   Subtract as Window minus Hole, settling the one operand-order unknown). Both cards
 *   now carry the same Window-minus-Hole subtract as their mattes, live only on the
 *   background card - the exact same three hole expressions, reused verbatim.
 * - 1.7.3 (2026-07-30): The SPLIT handle can now collapse a pane completely. The split
 *   clamp kept the line CH/12 from either edge and the window boxes had an 8 px floor,
 *   so a pane could never shrink past a sliver - both guards are gone: the split
 *   travels the full comp height (still rubber-banded to 0..CH), a collapsed pane's
 *   window reaches exactly zero, and the card's border/shadow now also gate on window
 *   size so no border dot survives at the edge. Drag the handle to the bottom to show
 *   only the top pane, to the top for only the bottom pane.
 * - 1.7.2 (2026-07-30): Marker semantics locked in per field review. Zero-duration
 *   markers are back to showing NOTHING - duration is what makes a marker a caption
 *   (1.7.1 briefly ran them to the next marker; rejected). And a guard rail: with
 *   "Caption Fade" on, a marker whose duration is shorter than fade-in + fade-out
 *   (2 x "Fade Frames") now makes the opacity expression THROW with a message naming
 *   the marker's frame count and the required minimum, surfacing the bad marker as an
 *   expression error right where it happens instead of silently mis-fading. Markers
 *   still live on the caption's text layer with comp markers as fallback (the 1.7.1
 *   correction that stays).
 * - 1.7.1 (2026-07-30): Marker captions, field-tested and corrected. 1.7.0 read the
 *   COMP markers for the built-in caption and the HANDLE layer markers for standalone
 *   ones - nobody guessed either, and markers placed on the text layer (the natural
 *   spot) did nothing. Markers now live on the caption's TEXT layer, with the comp's
 *   markers as the fallback when the text layer has none, one rule for both caption
 *   types. Second correction: a ZERO-duration marker (what a plain double-click
 *   creates) showed nothing because the half-open segment was empty - it now runs
 *   until the next marker starts (or forever if it is the last), so default markers
 *   work out of the box; a hand-set duration still wins. No control or matchname
 *   changes - both binaries are unchanged from 1.7.0.
 * - 1.7.0 (2026-07-30): Marker-driven captions and caption fades, in both caption systems.
 *   SOURCE. A caption could only ever be a single block of typed text held for as long as
 *   its layer was on screen, so subtitling a clip meant duplicating the whole caption per
 *   line and trimming each copy by hand - the one job short-form captions are actually for.
 *   Every caption now carries a "Caption Source" popup (Manual | Markers) directly under its
 *   "Show Captions". Manual is the old behaviour untouched. Markers turns that caption into
 *   a subtitle track: the text becomes the ACTIVE marker's comment for exactly that marker's
 *   duration and the empty string in the gaps, so one caption layer plays a whole script.
 *   The scan is SubtitleForge's, semantics included - the segment is [marker.time,
 *   marker.time + marker.duration), half-open, so a caption stops on the frame its marker
 *   ends; a zero-duration marker shows nothing (duration is what makes a marker a caption);
 *   and overlapping or adjacent markers resolve to the last one starting at or before now,
 *   so a new marker supersedes a still-running one instead of the two fighting.
 *   WHICH MARKERS. Deliberately different per caption type, because one shared marker row
 *   would make independent captions un-independent again the moment a second one went to
 *   Markers. The BUILT-IN caption ("Caption Text", driven from the controller's "Captions"
 *   group) reads the COMPOSITION's markers - a comp marker row already IS a single
 *   comp-wide subtitle track. Every STANDALONE caption reads the markers on its OWN
 *   "Caption NN Handle" layer, the same layer that already carries its own controls, so any
 *   number of caption tracks coexist without ever addressing the same marker. That binding
 *   joins FX in the expression PRELUDE (ePreCaptionMk binds MKSRC), which keeps the rule
 *   1.6.0 established: only the prelude differs between the two caption paths and every
 *   expression body is shared, so they cannot drift apart.
 *   FADE. New "Caption Fade" checkbox and integer "Fade Frames" slider. One builder emits
 *   the fade factor and it is multiplied into the text layer's opacity and the box layer's
 *   opacity - never into the rect's fill opacity, because the outline is a stroke operator
 *   with no opacity of its own and can only fade by riding the layer, and doubling the
 *   factor onto the fill would square it on the plate while leaving the outline linear. In
 *   Markers mode the fade lives strictly INSIDE the segment (the first and last "Fade
 *   Frames" of it), so a caption never draws a single frame outside its own marker; a
 *   segment shorter than two fades caps its peak below full opacity instead of overshooting.
 *   In Manual mode it runs against the TEXT layer's in/out points, and the box reads the
 *   text layer's in/out rather than its own so the pair can never fade apart. With
 *   "Caption Fade" off the factor is exactly 1, so a Manual rig is bit for bit 1.6.1.
 *   ROBUSTNESS. A marker caption is empty between markers, so every sourceRectAtTime() call
 *   in the caption system now falls back to a zero rect instead of risking a red expression
 *   error across the frame; the box is already invisible there, because the fade factor is 0.
 *   CONTROLS. Adding controls changes the definition, so both match names are bumped -
 *   "Pseudo/IVGD Verticalizer8" and "Pseudo/IVGD VerticalizerCap2" - because After Effects
 *   registers exactly one pseudo-effect definition per match name per session, and both
 *   registration probes now ask for "Caption Source", which exists only in these binaries.
 *   Embedded FFX regenerated: the rig controller at v1.8 (76,793 bytes, 67 controls) and the
 *   caption panel at v2 (11,866 bytes, 13 controls), both from tools/ffx-pseudo-gen. The
 *   display names stay "Verticalizer" / "Verticalizer Caption", so every expression still
 *   resolves.
 * - 1.6.1 (2026-07-30): Four field fixes. (1) The source-size warning measured comp
 *   cover, so a 1920x1080 source warned at "178 %" even though a split window only
 *   needs ~87 % of it - it now measures the default split window (comp width x half
 *   the comp height) and warns only above 110 %; the oversized-source nag is gone
 *   (extra pixels are punch-in headroom). (2) The pseudo-effect registration wrote its
 *   temp .ffx to Folder.temp, which on recent macOS resolves to .../T/TemporaryItems -
 *   a folder the OS may empty before After Effects reads the preset back, failing with
 *   "File not found (3 :: 0)". The preset now goes to a stable IVGD folder under
 *   Folder.userData (with temp and Desktop as fallbacks) and the write is only trusted
 *   if the file exists afterwards. (3) A caption handle's visibility expression
 *   addressed the caption effect by a CONTROL name ('H.effect("Show Captions")'), which
 *   errors in AE and left the handle visible forever - it now goes through the effect
 *   name, so turning a caption's own "Show Captions" off hides its handle again.
 *   (4) Add Caption trimmed new captions to CTI + 3 s; a new caption (text, box and
 *   handle) now spans the full comp and trimming is left to the editor.
 * - 1.6.0 (2026-07-30): A shadow the PiP can actually cast, per-caption control panels,
 *   a rig size you choose at run time, and versioned rig names.
 *   SHADOW. The floating card had no usable drop shadow. A card draws its own shadow and
 *   cannot escape its own place in the layer stack, so with "PiP Panel" = Bottom the shadow
 *   was drawn under the background card's full-comp window and never seen; 1.5.0 shipped
 *   that as a known caveat. It is now fixed rather than documented: a new "PiP Shadow" layer
 *   sits above BOTH card assemblies carrying an "ADBE Drop Shadow" with Shadow Only ON, so
 *   it contributes the cast shadow and nothing else (TOP / BOT Card still draws the card;
 *   drawing it twice would double the border). Because that layer is above the floating
 *   card, the shadow's soft inner edge would spill back over the card casting it, so a
 *   "PiP Shadow Matte" layer - the whole comp MINUS the floating card's rect, built from the
 *   same Merge Paths / Subtract pair the window mattes use - is applied as its alpha matte;
 *   a track matte runs AFTER effects, so it clips the finished shadow rather than the rect
 *   that casts it. Both layers read whichever card "PiP Panel" nominates, so the shadow
 *   follows the animatable panel choice, and the layer opacity is "PiP Transition", so the
 *   pair contributes exactly nothing at 0. The floating card's own shadow is cross-faded out
 *   by (1 - t) across the same interval, so the two never draw at once.
 *   CAPTIONS. Every caption shared the controller's single "Captions" group and the single
 *   CAPTION handle, so a second caption could not be moved, resized, recoloured or switched
 *   off without dragging the first one with it. "Add Caption" now builds a complete,
 *   independent caption: its own "Caption NN Handle" carrying its own instance of a NEW
 *   second pseudo effect, "Verticalizer Caption" (match name "Pseudo/IVGD VerticalizerCap1",
 *   10 controls - Show Captions, Captions Size, Caption Max Width, Text Color, Box Color /
 *   Opacity / Stroke Width / Stroke Color / Padding X / Padding Y), plus its own text and
 *   box wired to it. The index walks past every caption already in the comp, so adding the
 *   tenth is the same operation as adding the second and the name, handle and control panel
 *   all carry the same number. Only the prelude differs between a first-caption expression
 *   and an added-caption one (ePre binds FX to the controller, ePreCaption binds it to that
 *   handle's caption effect), so every expression body is shared and the two can never drift
 *   apart. Duplicated layers inherit the first caption's expressions, so ALL of them - text
 *   document, position, scale, opacity, box size, roundness, position, opacity, plate colour
 *   and opacity, stroke colour and width - are repointed, or the new caption would look
 *   independent while silently following caption one.
 *   HANDLE AUTO-HIDE. A handle that cannot do anything is clutter: the PIP handle now hides
 *   itself whenever "PiP Transition" is 0, and every caption handle hides itself when its own
 *   "Show Captions" is off. The master "Show Handles" still wins over both.
 *   RIG SIZE. The rig was hard-wired to 1080x1920 at build time even though every expression
 *   already reads thisComp.width / height. The panel now carries a "Rig Size" section - a
 *   preset list (HD / 2K / 4K portrait, 4:5 feed, square, 720 portrait, Custom) over two
 *   pixel fields - and the chosen size is what the master comp is built at; typing in either
 *   field switches the list to Custom, and values are clamped to After Effects' own 4..30000
 *   limits. The one baked pixel number left in the build (the caption block's starting Y) is
 *   now a fraction of comp height, so it lands in the same place at any size. A headless run
 *   can set $.global.VERTICALIZER_WIDTH / _HEIGHT. Before building, the source is checked
 *   against a split WINDOW of the rig (comp width x half the comp height - only the blurred
 *   background ever covers the whole comp, and blur does not care about resolution): a
 *   warning fires only when the window needs a real upscale (above 110 %), naming both
 *   sizes and the scale percentage and offering Proceed or go back - answering "go back"
 *   creates nothing and leaves the panel open on the size fields, and "No" is the default
 *   button. A 1920x1080 source in a 1080x1920 rig fills its window at ~87 % and builds
 *   silently; oversized sources never warn (extra pixels are punch-in headroom).
 *   NAMING. Building a second rig from the same source filed a second folder and a second
 *   "<name> Portrait" comp under the same names as the first, so the Project panel gave no
 *   way to tell the builds apart. The base name is now version-stamped before anything is
 *   created - "<name>", then "<name> v2", "v3", ... - and every derived name (job folder,
 *   "SRC <name>", "<name> Portrait" and the TOP / BOT / BG footage layers) is built from that
 *   one stamped base. A candidate counts as free only if the job folder AND both comps it
 *   implies are free, and the comps are checked project-wide, so a rig whose folder was
 *   deleted or whose comps were dragged elsewhere still counts as taken.
 *   CONTROLS. "PiP Amount" is renamed "PiP Transition". Renaming a control changes the
 *   definition, so the match name is bumped to "Pseudo/IVGD Verticalizer7" (After Effects
 *   registers exactly one pseudo-effect definition per match name per session) and the
 *   registration probe now asks for "PiP Transition", which exists only in this binary.
 *   Embedded FFX regenerated (v1.7, 74,604 bytes, 64 controls) alongside the new caption
 *   binary (v1.0, 9,677 bytes, 10 controls); both are produced by tools/ffx-pseudo-gen from
 *   a JSON spec. The display names stay "Verticalizer" / "Verticalizer Caption", so every
 *   expression still resolves.
 * - 1.5.0 (2026-07-30): PiP mode - an animatable picture-in-picture morph. The rig could only
 *   ever be two windows sharing a split line, so the single most common short-form move -
 *   pull one window out into a floating card while the other takes the whole frame - could
 *   not be built at all, let alone keyframed. A new "PiP" group (directly after Layout) adds
 *   "PiP Panel" (Top | Bottom - which window floats), "PiP Transition" (0-100 %, ANIMATABLE) and
 *   "PiP Scale" (the floating window's width as a percentage of comp width), plus a new
 *   draggable orange "PIP Handle" that the floating window centres itself on. The per-section
 *   window resolver - the one builder every consumer inlines - now derives the split box
 *   first (renamed sW / sH / sCx / sCy) and a PiP target second, then LERPS between them at
 *   t = PiP Transition / 100: the floating card's target is "CW x PiP Scale % wide by its own
 *   Aspect, centred on the PIP handle", the background card's is "the comp shrunk by its own
 *   Inset on all four sides". Because it is a lerp and not a mode switch, t = 0 multiplies
 *   every delta by zero and reproduces the 1.4.0 geometry exactly, and because every consumer
 *   (matte, card, footage scale and position, pan clamp, Z nulls) already re-derives that one
 *   builder, all of them morph together for free. The hard part was occlusion: layer order is
 *   fixed at build time and TOP always sits above BOT, so "PiP Panel" = Bottom would bury the
 *   floating card under the background card's full-comp window, and an expression cannot
 *   restack layers. Each matte therefore gained a second "Hole" rect and a Merge Paths in
 *   Subtract mode (contents order Window, Hole, Merge Paths, Fill - the operator consumes
 *   both paths above it), whose size is ZERO on the floating card and, on the background
 *   card, exactly the other card's lerped window inflated by its Border Width and rounded by
 *   its Corner Radius + Border Width - i.e. the other card's card rect, expressed in this
 *   matte's own rect space as (otherCentre - thisCentre). The background window is cut away
 *   precisely where the floating card draws, whichever side floats, with no runtime
 *   restacking. KNOWN CAVEAT: with "PiP Panel" = Bottom the floating card's drop shadow is
 *   clipped to the hole (the shadow is drawn by "BOT Card", which is only visible through
 *   that hole, and the hole is exactly the card rect); "PiP Panel" = Top renders its shadow
 *   in full. That is a consequence of the fixed layer order and is left alone rather than
 *   traded for a build-time choice that would freeze "PiP Panel". The Divider's opacity is
 *   multiplied by (1 - t) so the split line fades out as the PiP engages. Separately, every
 *   handle and the controller now carry static literal "[100,100]" Scale expressions, and
 *   SPLIT / CAPTION / PIP / [CTRL] a static "0" Rotation expression, so a stray corner-drag
 *   or rotate gesture in the viewer can no longer distort a handle; "TOP PAN Handle" /
 *   "BOT PAN Handle" keep a FREE Rotation on purpose, because that is the per-window footage
 *   rotation input. Each handle's inner "Glyph" group is pinned the same way (Rotation "0",
 *   Position "[0,0]"). The timeline now opens with 7 visible layers instead of 6. Match name
 *   bumped to "Pseudo/IVGD Verticalizer6" because the control set grew again and After
 *   Effects registers exactly one pseudo-effect definition per match name per session; the
 *   registration probe now asks for "PiP Transition", which exists only in this binary. Embedded
 *   FFX regenerated (v1.6, 74,612 bytes, 64 controls); the display name stays "Verticalizer"
 *   so every expression still resolves.
 * - 1.4.0 (2026-07-30): Per-card "Scale Mode" - a footage scale that stops following the
 *   window. Every version so far derived the footage scale as "fill the current window x
 *   Zoom", where the window is whatever the split line, Gap, Seam Mode, Inset and Aspect
 *   currently resolve to. That is right for a full-bleed window and wrong for everything
 *   framed by hand: pushing Zoom to 180 % to punch in on a face and then dragging the SPLIT
 *   handle re-fitted the footage on every mouse move, so the shot breathed in and out and the
 *   framing had to be re-found at every split position - and the same happened when Gap, Seam
 *   Mode or an Inset moved the window under a finished framing. New "Top Scale Mode" /
 *   "Bottom Scale Mode" popups (Fill Window | Fixed, in each card's Framing group directly
 *   above Zoom) decide what Zoom is a percentage of: "Fill Window" is the old baseline,
 *   max(winW / sw, winH / sh), while "Fixed" takes the baseline from the COMP,
 *   max(CW / sw, CH / sh), which no window control can move - so in Fixed mode dragging the
 *   split only re-crops the matte, the footage holds exactly the size Zoom gives it and
 *   Zoom = 100 % means "covers the comp". Because the pan clamp has to agree with the drawn
 *   size or it clamps to the wrong rectangle, the baseline/Zoom maths is now emitted from a
 *   single builder (eSourceScale) into BOTH the scale expression and the position expression
 *   instead of being written out twice. Fixed mode may leave the footage smaller than its
 *   window (Zoom under that window's own fill percentage); the clamp then centres it and
 *   matte void shows, which is the mode being used as asked and is left alone. Match name
 *   bumped to "Pseudo/IVGD Verticalizer5" because the control set grew again and After Effects
 *   registers exactly one pseudo-effect definition per match name per session; the
 *   registration probe now asks for "Top Scale Mode", which exists only in this binary.
 *   Embedded FFX regenerated (v1.5, 71,007 bytes, 61 controls); the display name stays
 *   "Verticalizer" so every expression still resolves.
 * - 1.3.0 (2026-07-30): Seam control, an integrating time remap and a self-closing window.
 *   The window resolver inset all four sides of its section, so with both cards inset the
 *   visible seam came out "Top Inset + Gap + Bottom Inset" wide - insetting a card to lift it
 *   off the comp edge silently tore the two windows apart in the middle, and the only way back
 *   was to wind Gap negative until the numbers cancelled. The Inset now shrinks the
 *   COMP-FACING edges only and the seam edge is owned by two new Layout controls: "Seam Mode"
 *   = Gap holds the seam at exactly "Gap" whatever the insets are, "Seam Mode" = Inset puts
 *   each card's seam edge at its OWN Inset x "Seam Inset %" from the split line and ignores
 *   Gap, so the middle spacing can be made to match the outer framing (50 % means the two
 *   half-insets add up to one full inset of seam). The section box is asymmetric as a result,
 *   so the window centre is now the centre of that box instead of the centre of the section,
 *   and the "Z TOP" / "Z BOT" pan nulls were switched from the old gap-only section edges onto
 *   the same resolver so the pan handles keep landing on the window they pan. Time Remap read
 *   "(time - inPoint) * Speed", which is only correct while Speed is constant: keyframing
 *   Speed 100 -> 0 -> 100 to hold a frame made the clip JUMP the instant speed came back,
 *   because that formula re-derives the position from the CURRENT speed and the WHOLE elapsed
 *   time and so never accounts for the freeze. Position is now the integral of Speed - each
 *   frame from the layer's in point contributes Speed x frameDuration - so a freeze resumes
 *   from the frame it parked on and a speed ramp reads as a real variable-speed transport; the
 *   loop only runs when Speed actually carries keyframes, so a static Speed still costs one
 *   multiply. "Top / Bottom Time Offset" changed from seconds to FRAMES (it adds to the
 *   integrated position, so keyframing it at Speed 0 is now the manual frame picker) and new
 *   read-only "Top / Bottom Source Frames" info sliders carry a script-baked numeric-literal
 *   expression showing the source length, so the legal offset range is visible in the same
 *   panel. Finally, the floating palette used to sit on top of the rig it had just built:
 *   after a successful Create Portrait Rig / Add Caption / Apply Rig FFX it now closes itself
 *   (a DOCKED panel cannot close itself and is left alone, and a run that failed or had to
 *   warn stays open so the buttons are still there). Match name bumped to
 *   "Pseudo/IVGD Verticalizer4" because the control set grew again and After Effects registers
 *   exactly one pseudo-effect definition per match name per session; the registration probe
 *   now asks for "Top Source Frames", which exists only in this binary. Embedded FFX
 *   regenerated (v1.4, 69,584 bytes, 59 controls); the display name stays "Verticalizer" so
 *   every expression still resolves.
 * - 1.2.0 (2026-07-28): Per-card controls, expression-driven retiming, absolute safe zones and
 *   lock/shy hygiene. Corner Radius, Edge Feather, Border Width / Color and the four Shadow
 *   parameters were shared by both windows, so a rounded top window forced a rounded bottom
 *   one - every one of them is now duplicated per side ("Top Corner Radius" / "Bottom Corner
 *   Radius", ...) inside mirrored "Top Card" / "Bottom Card" trees (Framing / Style / Border &
 *   Shadow / Time), and every consumer expression was repointed at its own side's control.
 *   Time Remapping was only switched on and left for the editor to keyframe, which stopped
 *   working the moment the footage layers became locked - each window's Time Remap now carries
 *   an expression reading new "Top / Bottom Speed" (0-400 %, 0 = freeze frame) and "Top /
 *   Bottom Time Offset" (-60..60 s) sliders and clamps to the source duration, so retiming is
 *   keyframed on the controller and never needs the layer unlocked; if After Effects refuses
 *   to enable Time Remapping the build now warns naming the layer instead of silently
 *   shipping a rig with no retime. The safe zones were still landing misplaced and undersized
 *   because their bands were rects positioned RELATIVE to a layer that was itself parked at
 *   the comp centre - the layer is now pinned at anchorPoint [0,0] / position [0,0] with no
 *   transform expression at all, and all five elements (four bands plus the safe rect) carry
 *   expressions on BOTH Size and Position in absolute comp coordinates, so the bands tile the
 *   comp edges exactly at any comp size. The timeline opened with 20 layers of rig plumbing,
 *   so every structural layer (mattes, footage, cards, divider, background stack, caption box,
 *   safe zones, Z nulls) is now shy AND locked and the master comp gets Hide Shy Layers on,
 *   leaving only "[CTRL] Verticalizer", the four handles and "Caption Text" visible; the
 *   locking pass runs dead last because a locked layer refuses property writes. Match name
 *   bumped a third time to "Pseudo/IVGD Verticalizer3" because the control set changed again
 *   and After Effects registers exactly one pseudo-effect definition per match name per
 *   session - reusing "...Verticalizer2" for a 55-control panel would resurrect the "effect
 *   control conversion required" resets against existing 43-control projects. Embedded FFX
 *   regenerated (v1.3, 66,407 bytes, 55 controls); the display name stays "Verticalizer" so
 *   every expression still resolves.
 * - 1.1.1 (2026-07-28): Matchname bumped to "Pseudo/IVGD Verticalizer2" (display name
 *   unchanged, so no expression is affected). AE registers ONE pseudo-effect definition
 *   per matchname per session (first loaded wins), so the 43-control panel colliding with
 *   the 29-control test builds under the old matchname triggered "effect control
 *   conversion required" resets on project open. New rigs now use a fresh identity and
 *   coexist safely with any older test project. Embedded FFX regenerated (v1.2.1).
 * - 1.1.0 (2026-07-28): Resolution-agnostic rig plus card, audio and caption upgrades.
 *   Every expression baked 1080/1920 before, so a comp-settings resize silently broke the
 *   rig - all expressions now read thisComp.width / thisComp.height at runtime (split clamp
 *   CH/12..CH-CH/12, window edge minimum CH/96, SPLIT handle rail thisComp.width * 0.05) and
 *   the safe zones became fractions of the comp instead of pixel bands. Windows could only be
 *   full-bleed, so a new per-section resolver adds Top/Bottom Aspect (Cover / 1:1 / 16:9 /
 *   9:16 / Fit Height / Fit Width) and Top/Bottom Inset, re-derived inline by every consumer
 *   (matte, footage scale, footage position, card) so they can never disagree. Windows had no
 *   edge treatment, so new "TOP Card" / "BOT Card" layers under each window draw a Border
 *   Width / Border Color ring and an "ADBE Drop Shadow" driven by Shadow Opacity / Softness /
 *   Distance / Angle (the opacity expression auto-scales when the parameter is 0-255). Both
 *   source clips played their own audio, so an Audio Source popup now routes Audio Levels to
 *   the top window, the bottom window or silence and the BG instance is muted at build. Speed
 *   changes needed manual setup, so Time Remapping is enabled on both windows (out point
 *   restored to comp duration). The caption handle was X-locked, so it now drags freely on
 *   both axes, box translucency moved from layer opacity onto the rect fill's own Opacity
 *   (Box Opacity) and the box gained a Box Stroke Width / Box Stroke Color outline. Safe zones
 *   gained a Safe Zone Opacity control and the layer is locked after the build; the "Z TOP" /
 *   "Z BOT" nulls are disabled so they stop cluttering the viewer. Embedded pseudo effect
 *   binary replaced with v1.2 (47,242 bytes, 43 controls) and the registration path now probes
 *   for a v1.2-only control so an installation still holding the 29-control v1.1 definition
 *   is re-registered instead of silently producing broken expressions. A legacy-engine
 *   project is switched to the JavaScript expression engine before building (the caption
 *   styling expressions require it), and a failed build now closes its undo group and
 *   undoes itself so no half-wired rig is ever left behind. Fit Height / Fit Width were
 *   mathematically identical to a contain-fit as first implemented; they now pin the
 *   window to the section height (cropping sides) or the full width (cropping
 *   top/bottom) respectively.
 * - 1.0.0 (2026-07-28): Initial release. Builds the full portrait rig (SRC precomp, master
 *   comp, 18-layer stack), embeds and registers the "Verticalizer" pseudo effect binary
 *   (35,072 bytes, v1.1) via the temp-comp registration trick so the effect can be added by
 *   match name without replaying a preset onto the real controller, and wires every layer
 *   with expressions driven from that single effect. Includes the Duik-style locked-path
 *   handle system, the auto-sizing caption pair, the four-mode background stack, and the
 *   four-platform safe-zone overlay.
 */

{
	function addVerticalizerScript(thisObj) {
		//=====================================================================
		// CONSTANTS
		//=====================================================================

		var SCRIPT_NAME = 'Verticalizer';
		var SCRIPT_VERSION = '1.9.4';

		// Build-time comp dimensions. These are used ONLY to create the master comp
		// and to seed initial (non-expression) property values. No expression ever
		// interpolates them - expressions read thisComp.width / thisComp.height.
		// Build-time rig dimensions. DEFAULT_* is what the panel opens on; CW / CH are
		// overwritten from the panel (or from $.global.VERTICALIZER_WIDTH / _HEIGHT)
		// before a build, so the same script makes a 1080x1920, 2K, 4K or custom rig.
		// They are used ONLY to create the master comp and to seed initial
		// (non-expression) property values - no expression ever interpolates them,
		// because every expression reads thisComp.width / thisComp.height.
		var DEFAULT_CW = 1080;
		var DEFAULT_CH = 1920;
		var CW = DEFAULT_CW;
		var CH = DEFAULT_CH;

		// After Effects' own composition limits.
		var MIN_DIM = 4;
		var MAX_DIM = 30000;

		// Where the caption block starts, as a fraction of comp height (1420/1920),
		// so it lands in the same place whatever size the rig is built at.
		var CAPTION_Y_RATIO = 1420 / 1920;

		// Rig size presets offered by the panel, [label, width, height].
		var SIZE_PRESETS = [
			['HD Portrait - 1080 x 1920', 1080, 1920],
			['2K Portrait - 1440 x 2560', 1440, 2560],
			['4K Portrait - 2160 x 3840', 2160, 3840],
			['Feed 4:5 - 1080 x 1350', 1080, 1350],
			['Square - 1080 x 1080', 1080, 1080],
			['720 Portrait - 720 x 1280', 720, 1280],
			['Custom', 0, 0]
		];

		// Safe-zone insets as fractions of the comp dimension, per platform, in the
		// order [top/CH, bottom/CH, right/CW, left/CW]. The source numbers are the
		// 1080x1920 pixel table; expressing them as ratios keeps the overlay correct
		// at any comp size. Index order matches the "Platform" popup (1-based).
		var SAFE_RATIOS = [
			[380 / 1920, 400 / 1920, 140 / 1080, 65 / 1080], // 1 All
			[150 / 1920, 320 / 1920, 140 / 1080, 60 / 1080], // 2 TikTok
			[270 / 1920, 400 / 1920, 120 / 1080, 65 / 1080], // 3 Reels
			[380 / 1920, 400 / 1920, 120 / 1080, 60 / 1080] // 4 Shorts
		];

		var CTRL_LAYER_NAME = '[CTRL] Verticalizer';
		var EFFECT_NAME = 'Verticalizer';
		var EFFECT_MATCH_NAME = 'Pseudo/IVGD Verticalizer9';

		// The standalone caption pseudo effect. Every caption added after the first
		// one carries its OWN instance of this on its OWN handle, so captions stop
		// sharing the controller's single Captions group. The display name is fixed,
		// so every caption expression addresses it the same way whatever the handle
		// is called.
		var CAPTION_EFFECT_NAME = 'Verticalizer Caption';
		var CAPTION_EFFECT_MATCH_NAME = 'Pseudo/IVGD VerticalizerCap2';

		// The PiP window centres itself on this handle, so the name is referenced from
		// the window resolver as well as from the builder.
		var PIP_HANDLE_NAME = 'PIP Handle';

		// Handle glyph stroke colours (0-1 RGB)
		var COL_SPLIT = [0.0, 0.784, 1.0]; // #00C8FF
		var COL_TOP = [0.216, 0.839, 0.478]; // #37D67A
		var COL_BOT = [1.0, 0.353, 0.784]; // #FF5AC8
		var COL_CAPTION = [1.0, 0.769, 0.0]; // #FFC400
		var COL_PIP = [1.0, 0.541, 0.071]; // #FF8A12
		var COL_CTRL = [0.78, 0.78, 0.86];

		// After Effects label indices: 2 Yellow, 5 Lavender, 9 Green, 11 Orange,
		// 13 Fuchsia, 14 Cyan
		var LBL_SPLIT = 14;
		var LBL_TOP = 9;
		var LBL_BOT = 13;
		var LBL_CAPTION = 2;
		var LBL_PIP = 11;
		var LBL_CTRL = 5;

		var KAPPA = 0.5522847498307936;
		var NL = '\n';

		//=====================================================================
		// EMBEDDED PSEUDO EFFECT BINARIES
		//
		// Two of them since 1.6.0. The rig controller was regenerated in 1.8.0 for the
		// two new per-card "Aspect Ease" sliders; the caption panel is unchanged since
		// 1.7.0 (Caption Source / Caption Fade / Fade Frames):
		//
		//   Verticalizer-v1.9.ffx         78,432 bytes, 69 controls - the rig
		//                                controller, one instance on "[CTRL] Verticalizer".
		//   VerticalizerCaption-v2.ffx    11,866 bytes, 13 controls - the standalone
		//                                caption panel, one instance per added caption
		//                                handle.
		//
		// Both are (RIFX body + PEM JSON tail) embedded verbatim as ES3 single-quoted
		// string literals (repo convention - see Rectangulator.jsx / CamBot.jsx).
		// Printable ASCII is verbatim, backslash and single quote are escaped, other
		// bytes below 0x80 are \xHH and bytes at or above 0x80 are \u00HH;
		// ExtendScript writes the string back out byte-for-byte with BINARY file
		// encoding. Both were produced by tools/ffx-pseudo-gen from a JSON spec.
		//=====================================================================

		var VERTICALIZER_FFX_BINARY = 'RIFX\x00\x00\u00D1\u00FCFaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00\u00D1\u00D8bescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x0DVerticalizer\x00\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\u00D0Vsspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00V,parTparn\x00\x00\x00\x04\x00\x00\x00jtdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DInterface\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00 \x00\x00\x00\x00\x00\x00\x00\x0DDrag the on-canvas handles\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Show Handles\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0AHandle Size\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A\u00C8\x00\x00C\u00C8\x00\x00A\u00C8\x00\x00C\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DLayout\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0008\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0AGap\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00C8\x00\x00\x00\x00\x00\x00C\u00C8\x00\x00A@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0009\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Seam Mode\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x0AGap|Inset\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0010\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ASeam Inset %\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00BH\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0011\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Audio Source\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x1DTop Video|Bottom Video|Muted\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0012\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0013\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DPiP\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0014\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07PiP Panel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x0BTop|Bottom\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0015\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0APiP Transition\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0016\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0APiP Scale\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00@\u00A0\x00\x00CH\x00\x00A \x00\x00B\u00C8\x00\x00B \x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0017\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0018\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DTop Card\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0019\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DTop Framing\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0020\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Top Aspect\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00)Cover|1:1|16:9|9:16|Fit Height|Fit Width\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0021\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Aspect Ease\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dy\u00C0\x00\x00\x00\x00\x00B\u00F0\x00\x00Ap\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0022\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Inset\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0023\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Top Scale Mode\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x12Fill Window|Fixed\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0024\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Zoom\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A \x00\x00Dz\x00\x00A \x00\x00Dz\x00\x00B\u00C8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0025\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Top Clamp Pan\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0026\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0027\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DTop Style\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0028\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Corner Radius\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0029\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Edge Feather\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0030\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0031\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0032\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DTop Border & Shadow\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0033\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Border Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00BH\x00\x00\x00\x00\x00\x00BH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0034\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Top Border Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0035\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Shadow Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0036\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Shadow Softness\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00A\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0037\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Shadow Distance\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00A@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0038\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03Top Shadow Angle\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u0087\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0039\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0040\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DTop Time\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0041\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Speed\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00C8\x00\x00\x00\x00\x00\x00C\u00C8\x00\x00B\u00C8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0042\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Time Offset\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C7\u00C3P\x00G\u00C3P\x00\u00C4z\x00\x00Dz\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0043\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ATop Source Frames\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0044\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0045\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0046\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DBottom Card\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0047\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DBottom Framing\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0048\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Bottom Aspect\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00)Cover|1:1|16:9|9:16|Fit Height|Fit Width\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0049\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Aspect Ease\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dy\u00C0\x00\x00\x00\x00\x00B\u00F0\x00\x00Ap\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0050\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Inset\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0051\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Bottom Scale Mode\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x12Fill Window|Fixed\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0052\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Zoom\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A \x00\x00Dz\x00\x00A \x00\x00Dz\x00\x00B\u00C8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0053\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Bottom Clamp Pan\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0054\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0055\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DBottom Style\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0056\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Corner Radius\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0057\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Edge Feather\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0058\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0059\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0060\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DBottom Border & Shadow\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0061\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Border Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00BH\x00\x00\x00\x00\x00\x00BH\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0062\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Bottom Border Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0063\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Shadow Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0064\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Shadow Softness\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00A\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0065\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Shadow Distance\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00A@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0066\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x03Bottom Shadow Angle\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u0087\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0067\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0068\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DBottom Time\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0069\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Speed\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00C8\x00\x00\x00\x00\x00\x00C\u00C8\x00\x00B\u00C8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0070\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Time Offset\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00C7\u00C3P\x00G\u00C3P\x00\u00C4z\x00\x00Dz\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0071\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABottom Source Frames\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0072\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0073\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0074\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DDivider\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0075\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Show Divider\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0076\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0AThickness\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00@\u00C0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0077\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Divider Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0078\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0079\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DBackground\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07BG Mode\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00)Blurred Video|Solid|Gradient|Transparent\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0081\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABG Blur\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00FA\x00\x00\x00\x00\x00\x00C\u00FA\x00\x00B\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0082\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABG Darken\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00A\u00F0\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0083\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05BG Color A\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\x10\x10\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0084\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05BG Color B\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF**3\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0085\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0086\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DCaptions\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0087\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Show Captions\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0088\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Caption Source\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x0FManual|Markers\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0089\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Caption Fade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0090\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0AFade Frames\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dy\u00C0\x00\x00\x00\x00\x00B\u00F0\x00\x00A@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0091\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ACaptions Size\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A \x00\x00C\u0096\x00\x00A \x00\x00C\u0096\x00\x00B\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0092\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ACaption Max Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A \x00\x00B\u00C8\x00\x00A \x00\x00B\u00C8\x00\x00B\u00AC\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0093\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Text Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Box Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0095\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u0082\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0096\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Stroke Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00A\u00A0\x00\x00\x00\x00\x00\x00A\u00A0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0097\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Box Stroke Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0098\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Padding X\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00A\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0099\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Padding Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00CH\x00\x00A\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0100\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0101\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DSafe Zones\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0102\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Show Safe Zones\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0103\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ASafe Zone Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B \x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0104\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Platform\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\'All (conservative)|TikTok|Reels|Shorts\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0105\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00y\u00DEtdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0AInterface\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1BDrag the on-canvas handles\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DShow Handles\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CHandle Size\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@9\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x07Layout\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0008\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x04Gap\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0009\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ASeam Mode\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0010\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DSeam Inset %\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@I\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0011\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DAudio Source\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0012\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0013\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x04PiP\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0014\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0APiP Panel\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0015\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FPiP Transition\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0016\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0APiP Scale\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@D\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0017\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0018\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x09Top Card\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0019\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CTop Framing\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0020\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BTop Aspect\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0021\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x10Top Aspect Ease\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@.\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@^\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0022\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ATop Inset\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0023\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FTop Scale Mode\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0024\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x09Top Zoom\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@\u008F@\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0025\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ETop Clamp Pan\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0026\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0027\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ATop Style\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0028\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Top Corner Radius\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0029\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Top Edge Feather\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0030\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CTop Opacity\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0031\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0032\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Top Border & Shadow\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0033\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Top Border Width\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@I\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0034\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x16tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Top Border Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0035\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x13Top Shadow Opacity\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0036\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Top Shadow Softness\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@>\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0037\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Top Shadow Distance\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0038\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Top Shadow Angle\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@`\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0039\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0040\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x09Top Time\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0041\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ATop Speed\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0042\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x10Top Time Offset\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\u00C0\u008F@\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@\u008F@\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0043\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Top Source Frames\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08A.\u0084\u0080\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0044\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0045\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0046\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CBottom Card\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0047\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FBottom Framing\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0048\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EBottom Aspect\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0049\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x13Bottom Aspect Ease\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@.\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@^\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0050\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DBottom Inset\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0051\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Bottom Scale Mode\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0052\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CBottom Zoom\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@\u008F@\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0053\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Bottom Clamp Pan\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0054\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0055\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DBottom Style\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0056\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Bottom Corner Radius\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0057\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Bottom Edge Feather\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0058\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FBottom Opacity\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0059\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0060\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17Bottom Border & Shadow\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0061\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Bottom Border Width\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@I\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0062\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x18tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Bottom Border Color\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0063\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x16Bottom Shadow Opacity\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0064\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x04tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17Bottom Shadow Softness\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@>\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0065\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x04tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17Bottom Shadow Distance\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0066\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E0tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x14Bottom Shadow Angle\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@`\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0067\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0068\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CBottom Time\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0069\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DBottom Speed\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0070\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x00tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x13Bottom Time Offset\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\u00C0\u008F@\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@\u008F@\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0071\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Bottom Source Frames\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08A.\u0084\u0080\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0072\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0073\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0074\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x08Divider\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0075\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DShow Divider\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0076\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0AThickness\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\x18\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0077\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x12tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EDivider Color\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0078\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0079\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BBackground\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x08BG Mode\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0081\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x08BG Blur\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@^\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@\x7F@\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0082\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ABG Darken\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@>\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0083\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x10tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BBG Color A\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@0\x00\x00\x00\x00\x00\x00@0\x00\x00\x00\x00\x00\x00@4\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0084\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x10tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BBG Color B\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@E\x00\x00\x00\x00\x00\x00@E\x00\x00\x00\x00\x00\x00@I\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0085\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0086\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x09Captions\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0087\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EShow Captions\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0088\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FCaption Source\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0089\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DCaption Fade\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0090\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CFade Frames\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@^\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0091\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ECaptions Size\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@P\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@r\u00C0\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0092\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Caption Max Width\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@U\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0093\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x10tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BText Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x0Etdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ABox Color\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0095\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CBox Opacity\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@P@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0096\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Box Stroke Width\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@4\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0097\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x16tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Box Stroke Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0098\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EBox Padding X\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@<\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0099\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EBox Padding Y\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0100\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0101\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BSafe Zones\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0102\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x10Show Safe Zones\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0103\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Safe Zone Opacity\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@D\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0104\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x09Platform\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD Verticalizer9-0105\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00E6tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DVerticalizer\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{"controlName":"Verticalizer","matchname":"Pseudo/IVGD Verticalizer9","controlArray":[{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000000,"error":[],"name":"Interface","type":"group","children":[],"open":true},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000001,"error":[],"name":"Drag the on-canvas handles","type":"label","dim":true},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000002,"error":[],"name":"EndLabel","type":"endLabel","labelId":0},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000003,"error":[],"name":"Show Handles","type":"checkbox","default":true,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000004,"error":[],"name":"Handle Size","type":"slider","default":100,"sliderMin":25,"sliderMax":400,"validMin":25,"validMax":400,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000005,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000006,"error":[],"name":"Layout","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000007,"error":[],"name":"Gap","type":"slider","default":12,"sliderMin":0,"sliderMax":400,"validMin":0,"validMax":400,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"name":"Seam Mode","type":"popup","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8300000000,"default":1,"content":"Gap|Inset","error":[]},{"name":"Seam Inset %","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8300000001,"default":50,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[],"error":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000008,"error":[],"name":"Audio Source","type":"popup","default":1,"content":"Top Video|Bottom Video|Muted"},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000009,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8500000000,"error":[],"name":"PiP","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8500000001,"error":[],"name":"PiP Panel","type":"popup","default":1,"content":"Top|Bottom"},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8500000002,"error":[],"name":"PiP Transition","type":"slider","default":0,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":1,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8500000003,"error":[],"name":"PiP Scale","type":"slider","default":40,"sliderMin":10,"sliderMax":100,"validMin":5,"validMax":200,"precision":1,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8500000004,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000010,"error":[],"name":"Top Card","type":"group","children":[],"open":true},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000011,"error":[],"name":"Top Framing","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000012,"error":[],"name":"Top Aspect","type":"popup","default":1,"content":"Cover|1:1|16:9|9:16|Fit Height|Fit Width"},{"name":"Top Aspect Ease","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8700000000,"default":15,"sliderMin":0,"sliderMax":120,"validMin":0,"validMax":999,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[],"error":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000013,"error":[],"name":"Top Inset","type":"slider","default":0,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"name":"Top Scale Mode","type":"popup","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8400000000,"default":1,"content":"Fill Window|Fixed","error":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000014,"error":[],"name":"Top Zoom","type":"slider","default":100,"sliderMin":10,"sliderMax":1000,"validMin":10,"validMax":1000,"precision":1,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000015,"error":[],"name":"Top Clamp Pan","type":"checkbox","default":true,"label":""},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000016,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000017,"error":[],"name":"Top Style","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000018,"error":[],"name":"Top Corner Radius","type":"slider","default":0,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000019,"error":[],"name":"Top Edge Feather","type":"slider","default":0,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000020,"error":[],"name":"Top Opacity","type":"slider","default":100,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000021,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000022,"error":[],"name":"Top Border & Shadow","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000023,"error":[],"name":"Top Border Width","type":"slider","default":0,"sliderMin":0,"sliderMax":50,"validMin":0,"validMax":50,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000024,"error":[],"name":"Top Border Color","type":"color","red":255,"green":255,"blue":255},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000025,"error":[],"name":"Top Shadow Opacity","type":"slider","default":0,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000026,"error":[],"name":"Top Shadow Softness","type":"slider","default":30,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000027,"error":[],"name":"Top Shadow Distance","type":"slider","default":12,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000028,"error":[],"name":"Top Shadow Angle","type":"angle","default":135},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000029,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000030,"error":[],"name":"Top Time","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000031,"error":[],"name":"Top Speed","type":"slider","default":100,"sliderMin":0,"sliderMax":400,"validMin":0,"validMax":400,"precision":1,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8200000000,"error":[],"name":"Top Time Offset","type":"slider","default":0,"sliderMin":-1000,"sliderMax":1000,"validMin":-100000,"validMax":100000,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"name":"Top Source Frames","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8200000001,"default":0,"sliderMin":0,"sliderMax":1000000,"validMin":0,"validMax":1000000,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[],"error":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000033,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000034,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000035,"error":[],"name":"Bottom Card","type":"group","children":[],"open":true},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000036,"error":[],"name":"Bottom Framing","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000037,"error":[],"name":"Bottom Aspect","type":"popup","default":1,"content":"Cover|1:1|16:9|9:16|Fit Height|Fit Width"},{"name":"Bottom Aspect Ease","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8700000001,"default":15,"sliderMin":0,"sliderMax":120,"validMin":0,"validMax":999,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[],"error":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000038,"error":[],"name":"Bottom Inset","type":"slider","default":0,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"name":"Bottom Scale Mode","type":"popup","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8400000001,"default":1,"content":"Fill Window|Fixed","error":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000039,"error":[],"name":"Bottom Zoom","type":"slider","default":100,"sliderMin":10,"sliderMax":1000,"validMin":10,"validMax":1000,"precision":1,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000040,"error":[],"name":"Bottom Clamp Pan","type":"checkbox","default":true,"label":""},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000041,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000042,"error":[],"name":"Bottom Style","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000043,"error":[],"name":"Bottom Corner Radius","type":"slider","default":0,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000044,"error":[],"name":"Bottom Edge Feather","type":"slider","default":0,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000045,"error":[],"name":"Bottom Opacity","type":"slider","default":100,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000046,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000047,"error":[],"name":"Bottom Border & Shadow","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000048,"error":[],"name":"Bottom Border Width","type":"slider","default":0,"sliderMin":0,"sliderMax":50,"validMin":0,"validMax":50,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000049,"error":[],"name":"Bottom Border Color","type":"color","red":255,"green":255,"blue":255},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000050,"error":[],"name":"Bottom Shadow Opacity","type":"slider","default":0,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000051,"error":[],"name":"Bottom Shadow Softness","type":"slider","default":30,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000052,"error":[],"name":"Bottom Shadow Distance","type":"slider","default":12,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000053,"error":[],"name":"Bottom Shadow Angle","type":"angle","default":135},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000054,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000055,"error":[],"name":"Bottom Time","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000056,"error":[],"name":"Bottom Speed","type":"slider","default":100,"sliderMin":0,"sliderMax":400,"validMin":0,"validMax":400,"precision":1,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8200000002,"error":[],"name":"Bottom Time Offset","type":"slider","default":0,"sliderMin":-1000,"sliderMax":1000,"validMin":-100000,"validMax":100000,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"name":"Bottom Source Frames","type":"slider","canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8200000003,"default":0,"sliderMin":0,"sliderMax":1000000,"validMin":0,"validMax":1000000,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[],"error":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000058,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000059,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000060,"error":[],"name":"Divider","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000061,"error":[],"name":"Show Divider","type":"checkbox","default":false,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000062,"error":[],"name":"Thickness","type":"slider","default":6,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000063,"error":[],"name":"Divider Color","type":"color","red":255,"green":255,"blue":255},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000064,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000065,"error":[],"name":"Background","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000066,"error":[],"name":"BG Mode","type":"popup","default":1,"content":"Blurred Video|Solid|Gradient|Transparent"},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000067,"error":[],"name":"BG Blur","type":"slider","default":120,"sliderMin":0,"sliderMax":500,"validMin":0,"validMax":500,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000068,"error":[],"name":"BG Darken","type":"slider","default":30,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000069,"error":[],"name":"BG Color A","type":"color","red":16,"green":16,"blue":20},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000070,"error":[],"name":"BG Color B","type":"color","red":42,"green":42,"blue":51},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000071,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000072,"error":[],"name":"Captions","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000073,"error":[],"name":"Show Captions","type":"checkbox","default":true,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8600000000,"error":[],"name":"Caption Source","type":"popup","default":1,"content":"Manual|Markers"},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8600000001,"error":[],"name":"Caption Fade","type":"checkbox","default":false,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8600000002,"error":[],"name":"Fade Frames","type":"slider","default":12,"sliderMin":0,"sliderMax":120,"validMin":0,"validMax":999,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000074,"error":[],"name":"Captions Size","type":"slider","default":64,"sliderMin":10,"sliderMax":300,"validMin":10,"validMax":300,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000075,"error":[],"name":"Caption Max Width","type":"slider","default":86,"sliderMin":10,"sliderMax":100,"validMin":10,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000076,"error":[],"name":"Text Color","type":"color","red":255,"green":255,"blue":255},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000077,"error":[],"name":"Box Color","type":"color","red":0,"green":0,"blue":0},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000078,"error":[],"name":"Box Opacity","type":"slider","default":65,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000079,"error":[],"name":"Box Stroke Width","type":"slider","default":0,"sliderMin":0,"sliderMax":20,"validMin":0,"validMax":20,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000080,"error":[],"name":"Box Stroke Color","type":"color","red":255,"green":255,"blue":255},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000081,"error":[],"name":"Box Padding X","type":"slider","default":28,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000082,"error":[],"name":"Box Padding Y","type":"slider","default":16,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000083,"error":[],"name":"EndGroup","type":"endgroup","groupId":0},{"canHaveKeyframes":false,"canBeInvisible":true,"invisible":false,"keyframes":false,"hold":false,"id":8100000084,"error":[],"name":"Safe Zones","type":"group","children":[],"open":true},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000085,"error":[],"name":"Show Safe Zones","type":"checkbox","default":true,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8100000086,"error":[],"name":"Safe Zone Opacity","type":"slider","default":40,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false,"open":false,"errors":[]},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8100000087,"error":[],"name":"Platform","type":"popup","default":1,"content":"All (conservative)|TikTok|Reels|Shorts"},{"canHaveKeyframes":false,"canBeInvisible":false,"invisible":false,"keyframes":false,"hold":false,"id":8100000088,"error":[],"name":"EndGroup","type":"endgroup","groupId":0}],"version":3}';

		var VERTICALIZER_CAPTION_FFX_BINARY = 'RIFX\x00\x00%\u00DCFaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00%\u00B8bescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x15Verticalizer Caption\x00\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00$.sspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x0E\u0094parTparn\x00\x00\x00\x04\x00\x00\x00\x12tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0000\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0001\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DCaption\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0002\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Show Captions\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0003\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Caption Source\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x03\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x0FManual|Markers\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0004\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04Caption Fade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00\x01\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0005\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0AFade Frames\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00Dy\u00C0\x00\x00\x00\x00\x00B\u00F0\x00\x00A@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0006\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ACaptions Size\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00?\u0080\x00\x00D\u00FA\x00\x00A \x00\x00C\u0096\x00\x00B\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0007\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ACaption Max Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00?\u0080\x00\x00B\u00C8\x00\x00A \x00\x00B\u00C8\x00\x00B\u00AC\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0008\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Text Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0009\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0010\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0DCaption Box\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0011\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Box Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0012\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Opacity\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u0082\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0013\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Stroke Width\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00CH\x00\x00\x00\x00\x00\x00A\u00A0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0014\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05Box Stroke Color\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0015\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Padding X\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00FA\x00\x00\x00\x00\x00\x00CH\x00\x00A\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0016\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0ABox Padding Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00C\u00FA\x00\x00\x00\x00\x00\x00CH\x00\x00A\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0017\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x15Ntdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Verticalizer Caption\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0000\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0001\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D4tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x08Caption\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0002\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EShow Captions\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0003\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DCtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0FCaption Source\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0004\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0DCaption Fade\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0005\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CFade Frames\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@^\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0006\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ECaptions Size\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@P\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@r\u00C0\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0007\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x12Caption Max Width\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@U\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08@$\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0008\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x10tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0BText Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0009\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00EEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Verticalizer Caption\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0010\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00D8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CCaption Box\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0011\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x0Etdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0ABox Color\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0012\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00F8tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0CBox Opacity\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@P@\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0013\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Box Stroke Width\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@4\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0014\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x16tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x11Box Stroke Color\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x04\x00\x07\x00\x01\x00\x02\u00FF\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00`@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00@o\u00E0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0015\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EBox Padding X\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@<\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0016\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00FAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EBox Padding Y\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\x08\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\x08@i\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/IVGD VerticalizerCap2-0017\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00EEtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Verticalizer Caption\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x04\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{"controlName":"Verticalizer Caption","matchname":"Pseudo/IVGD VerticalizerCap2","layerWidth":1080,"layerHeight":1920,"version":3,"controlArray":[{"type":"group","name":"Caption"},{"type":"checkbox","name":"Show Captions","default":true,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8600000003,"error":[],"name":"Caption Source","type":"popup","default":1,"content":"Manual|Markers"},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":true,"id":8600000004,"error":[],"name":"Caption Fade","type":"checkbox","default":false,"label":""},{"canHaveKeyframes":true,"canBeInvisible":true,"invisible":false,"keyframes":true,"hold":false,"id":8600000005,"error":[],"name":"Fade Frames","type":"slider","default":12,"sliderMin":0,"sliderMax":120,"validMin":0,"validMax":999,"precision":0,"percent":false,"pixel":false,"open":false,"errors":[]},{"type":"slider","name":"Captions Size","default":64,"sliderMin":10,"sliderMax":300,"validMin":1,"validMax":2000,"precision":0,"percent":false,"pixel":false},{"type":"slider","name":"Caption Max Width","default":86,"sliderMin":10,"sliderMax":100,"validMin":1,"validMax":100,"precision":0,"percent":true,"pixel":false},{"type":"color","name":"Text Color","red":255,"green":255,"blue":255},{"type":"endgroup"},{"type":"group","name":"Caption Box"},{"type":"color","name":"Box Color","red":0,"green":0,"blue":0},{"type":"slider","name":"Box Opacity","default":65,"sliderMin":0,"sliderMax":100,"validMin":0,"validMax":100,"precision":0,"percent":true,"pixel":false},{"type":"slider","name":"Box Stroke Width","default":0,"sliderMin":0,"sliderMax":20,"validMin":0,"validMax":200,"precision":0,"percent":false,"pixel":false},{"type":"color","name":"Box Stroke Color","red":255,"green":255,"blue":255},{"type":"slider","name":"Box Padding X","default":28,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":500,"precision":0,"percent":false,"pixel":false},{"type":"slider","name":"Box Padding Y","default":16,"sliderMin":0,"sliderMax":200,"validMin":0,"validMax":500,"precision":0,"percent":false,"pixel":false},{"type":"endgroup"}]}';

		var pseudoEffectData = {
			matchName: EFFECT_MATCH_NAME,
			name: 'Verticalizer',
			version: '1.9.0',
			// Registration probe. The match name is fresh in 1.8.0, so no stale
			// definition can be holding it - but the probe costs nothing and keeps the
			// safety net in place for any future in-place control change: if the
			// effect adds without this control, the binary is replayed instead of
			// shipping expressions that resolve against a stale definition. The probed
			// control is deliberately a v1.9-ONLY one ("Top Aspect Ease" is new in
			// 1.8.0, so it exists in this binary and in no earlier one), which catches
			// a session somehow still holding an older definition under this match
			// name instead of silently producing a rig whose window resolver - which
			// reads it in EVERY geometry expression on both cards - resolves against a
			// control that is not there.
			probe: 'Top Aspect Ease',
			binary: VERTICALIZER_FFX_BINARY
		};

		// The caption panel. Applied once per added caption handle, never to the
		// controller. The probe is "Caption Source", which is new in the v2 binary -
		// the name also exists in the main effect, but the probe reads the instance
		// this script just added to the handle, so there is no ambiguity.
		var captionPseudoEffectData = {
			matchName: CAPTION_EFFECT_MATCH_NAME,
			name: CAPTION_EFFECT_NAME,
			version: '2.0.0',
			probe: 'Caption Source',
			binary: VERTICALIZER_CAPTION_FFX_BINARY
		};

		//=====================================================================
		// APPLY FFX HELPER
		//
		// Inlined from tools/scripting-modules/ApplyFFX.js, implemented as the
		// CamBot registration variant (CamBot.jsx:390-402): applyPreset() replays
		// every property baked into the preset AND invalidates existing property
		// references, so the preset is only ever applied to a throwaway shape
		// layer in a throwaway comp - purely to teach After Effects the match
		// name. The real controller then gets exactly one instance via
		// addProperty().
		//
		// 1.1.0 addition: an installation that already ran 1.0.0 has the match name
		// registered against the OLD 29-control definition, so canAddProperty() is
		// already true and the binary would never be replayed. Every instance is
		// therefore probed for a control that only exists in the current binary, and
		// registration is forced when it is missing.
		//=====================================================================

		// On recent macOS builds Folder.temp resolves to .../T/TemporaryItems, a
		// folder the OS manages and may empty between our write and AE reading the
		// preset back - applyPreset() then fails with "File not found (3 :: 0)".
		// So the preset is written to a stable user-owned folder first, and the
		// write is only trusted if the file actually EXISTS afterwards; each
		// candidate location is tried in order.
		function writePresetFile(data) {
			var name = data.name + '_v' + data.version + '.ffx';
			var homes = [];
			try {
				var ivgd = new Folder(Folder.userData.fsName + '/IVGD');
				if (!ivgd.exists) {
					ivgd.create();
				}
				if (ivgd.exists) {
					homes.push(ivgd.fsName);
				}
			} catch (eHome) {}
			homes.push(Folder.temp.fsName);
			try {
				homes.push(Folder.desktop.fsName);
			} catch (eDesk) {}
			for (var h = 0; h < homes.length; h++) {
				var f = new File(homes[h] + '/' + name);
				f.encoding = 'BINARY';
				var opened = f.open('w');
				var wrote = opened === false ? false : f.write(data.binary);
				f.close();
				if (opened !== false && wrote !== false && f.exists) {
					return f;
				}
			}
			return null;
		}

		function registerPseudoEffect(data) {
			var ffx = writePresetFile(data);
			if (ffx === null) {
				throw new Error(
					'Could not write the temporary .ffx preset anywhere writable.\n' +
						'Enable "Allow Scripts to Write Files and Access Network" in ' +
						'Preferences > Scripting & Expressions, then run again.'
				);
			}
			var tmp = app.project.items.addComp('__verticalizer_tmp', 100, 100, 1, 1, 24);
			try {
				tmp.layers.addShape().applyPreset(ffx);
			} catch (applyErr) {
				try {
					tmp.remove();
				} catch (e1) {}
				try {
					ffx.remove();
				} catch (e2) {}
				throw new Error('Could not register the Verticalizer pseudo effect: ' + applyErr.toString());
			}
			try {
				tmp.remove();
			} catch (e3) {}
			try {
				ffx.remove();
			} catch (e4) {}
		}

		function hasPseudoControl(fx, name) {
			var p = null;
			try {
				p = fx.property(name);
			} catch (e) {
				p = null;
			}
			return p !== null;
		}

		// The layer is passed (not its Effects group) because applyPreset invalidates
		// property references, so the parade is re-read after every registration.
		function applyPseudoEffect(data, layer) {
			var parade = layer.property('ADBE Effect Parade');
			if (parade.canAddProperty && !parade.canAddProperty(data.matchName)) {
				registerPseudoEffect(data);
				parade = layer.property('ADBE Effect Parade');
			}
			var fx = parade.addProperty(data.matchName);
			if (data.probe && !hasPseudoControl(fx, data.probe)) {
				try {
					fx.remove();
				} catch (eRem) {}
				registerPseudoEffect(data);
				parade = layer.property('ADBE Effect Parade');
				fx = parade.addProperty(data.matchName);
			}
			return fx;
		}

		//=====================================================================
		// SMALL UTILITIES
		//=====================================================================

		// Every user-facing message goes through notify() so a headless run can be
		// driven with $.global.VERTICALIZER_SILENT and read back from
		// $.global.VERTICALIZER_LOG instead of blocking on a modal dialog.
		function notify(msg) {
			if ($.global.VERTICALIZER_SILENT === true) {
				if (typeof $.global.VERTICALIZER_LOG !== 'string') {
					$.global.VERTICALIZER_LOG = '';
				}
				$.global.VERTICALIZER_LOG = $.global.VERTICALIZER_LOG + msg + '\n';
				return;
			}
			alert(msg);
		}

		// A warning the editor can act on: Yes builds anyway, No goes back to the panel
		// with nothing created. "No" is the default button, so a stray Return is the
		// safe answer. A headless run records the warning and proceeds, because there
		// is nobody there to answer it.
		function askProceed(msg) {
			if ($.global.VERTICALIZER_SILENT === true || $.global.VERTICALIZER_AUTORUN === true) {
				notify(SCRIPT_NAME + '\n\n' + msg);
				return true;
			}
			var full =
				msg +
				'\n\nProceed anyway?\n\n' +
				'Yes  -  build the rig at this size.\n' +
				'No   -  go back and change the rig size.';
			var answer = false;
			try {
				answer = confirm(full, true, SCRIPT_NAME);
			} catch (e) {
				answer = true;
			}
			return answer === true;
		}

		// Coerce a panel field to a legal comp dimension. Anything unparseable falls
		// back to the supplied default rather than building a broken comp.
		function parseDim(text, fallback) {
			var v = parseInt(trimStr(String(text)), 10);
			if (isNaN(v)) {
				return fallback;
			}
			v = Math.round(v);
			if (v < MIN_DIM) {
				v = MIN_DIM;
			}
			if (v > MAX_DIM) {
				v = MAX_DIM;
			}
			return v;
		}

		function trimStr(s) {
			return String(s)
				.replace(/^[\s]+/, '')
				.replace(/[\s]+$/, '');
		}

		// Format a build-time ratio as a compact decimal literal for an expression.
		// Ratios (never comp pixel counts) are what gets baked into expressions.
		function ratioStr(v) {
			var s = v.toFixed(10);
			if (s.indexOf('.') !== -1) {
				s = s.replace(/0+$/, '');
				s = s.replace(/\.$/, '');
			}
			return s;
		}

		function stripExtension(name) {
			return String(name).replace(/\.[A-Za-z0-9]{1,8}$/, '');
		}

		function sanitizeName(name) {
			var out = trimStr(String(name).replace(/[\/\\:*?"<>|\r\n\t]/g, '_'));
			if (out === '') {
				out = 'Source';
			}
			return out;
		}

		function pad2n(n) {
			return n < 10 ? '0' + n : '' + n;
		}

		function getLayerByName(comp, name) {
			for (var i = 1; i <= comp.numLayers; i++) {
				if (comp.layer(i).name === name) {
					return comp.layer(i);
				}
			}
			return null;
		}

		function findOrCreateFolder(name, parent) {
			for (var i = 1; i <= app.project.numItems; i++) {
				var it = app.project.item(i);
				if (it instanceof FolderItem && it.name === name) {
					if (it.parentFolder && parent && it.parentFolder.id === parent.id) {
						return it;
					}
				}
			}
			var f = app.project.items.addFolder(name);
			f.parentFolder = parent;
			return f;
		}

		// ------------------------------------------------------------------
		// RIG VERSIONING (1.5.1)
		//
		// Building a second rig from the same source used to file a second folder
		// called "<name>" next to the first one and a second "<name> Portrait" comp -
		// two items with the same name, and no way to tell in the Project panel which
		// build was which. The base name is therefore version-stamped BEFORE anything
		// is created: the first build is "<name>", the next is "<name> v2", then
		// "v3", and so on. Every derived name is built from that one stamped base, so
		// the folder, the SRC precomp, the master comp and the footage layer names all
		// carry the same version.
		// ------------------------------------------------------------------

		function folderHasChildNamed(parent, name) {
			if (!parent) {
				return false;
			}
			try {
				for (var i = 1; i <= parent.numItems; i++) {
					if (parent.item(i).name === name) {
						return true;
					}
				}
			} catch (e) {}
			return false;
		}

		function projectHasItemNamed(name) {
			for (var i = 1; i <= app.project.numItems; i++) {
				if (app.project.item(i).name === name) {
					return true;
				}
			}
			return false;
		}

		// A candidate is free only if the job folder AND both comps it implies are
		// free - the comps are checked project-wide, so a rig whose folder was deleted
		// or whose comps were dragged elsewhere still counts as taken.
		function baseNameTaken(rootFolder, name) {
			return (
				folderHasChildNamed(rootFolder, name) ||
				projectHasItemNamed('SRC ' + name) ||
				projectHasItemNamed(name + ' Portrait')
			);
		}

		function versionedBaseName(rootFolder, baseName) {
			if (!baseNameTaken(rootFolder, baseName)) {
				return baseName;
			}
			// The cap is a guard against an unforeseen always-taken condition turning
			// this into an infinite loop; 999 rigs from one source is already absurd.
			for (var n = 2; n <= 999; n++) {
				var candidate = baseName + ' v' + n;
				if (!baseNameTaken(rootFolder, candidate)) {
					return candidate;
				}
			}
			return baseName + ' v' + new Date().getTime();
		}

		function fxProp(effect, matchName, displayName) {
			var p = null;
			try {
				p = effect.property(matchName);
			} catch (e) {
				p = null;
			}
			if (p === null && displayName) {
				try {
					p = effect.property(displayName);
				} catch (e2) {
					p = null;
				}
			}
			return p;
		}

		function setSafe(prop, value) {
			if (prop === null) {
				return;
			}
			try {
				prop.setValue(value);
			} catch (e) {}
		}

		// Every expression the rig sets goes through here, and every one of them is
		// counted: the build reports a partial failure instead of shipping a rig with
		// a silently missing expression, and the repair reports how much it rewired.
		var exprWriteCount = 0;
		var exprFailCount = 0;

		function setExprSafe(prop, expr) {
			if (prop === null || prop === undefined) {
				exprFailCount++;
				return;
			}
			try {
				prop.expression = expr;
				exprWriteCount++;
			} catch (e) {
				exprFailCount++;
			}
		}

		//=====================================================================
		// EXPRESSION BUILDERS
		//
		// Every expression is a plain string assembled by concatenation. They run
		// in the After Effects expression engine, so clamp(), thisComp,
		// sourceRectAtTime() and the text style API are all available there.
		//
		// NOTHING about the composition is baked in: every expression opens with
		// "var CW = thisComp.width, CH = thisComp.height;" and derives from those,
		// so the rig survives a comp-settings resize and works on non-1080x1920
		// comps ("Apply Rig FFX to Selected Layer"). Only the SOURCE width/height
		// are baked as numeric literals, because they describe the footage - which
		// also keeps collapse transformations from breaking source.width lookups.
		//=====================================================================

		// Runtime composition dimensions.
		function eDims() {
			return 'var CW = thisComp.width, CH = thisComp.height;' + NL;
		}

		// Common prelude: comp dimensions, the controller layer and its pseudo effect.
		function ePre() {
			return (
				eDims() +
				'var C = thisComp.layer("' +
				CTRL_LAYER_NAME +
				'");' +
				NL +
				'var FX = C.effect("' +
				EFFECT_NAME +
				'");' +
				NL
			);
		}

		// Clamped split line position (comp space Y). The 1/12 margin is the
		// 160px-at-1920 clamp of 1.0.0 expressed as a ratio.
		//
		// pfx (1.5.0) prefixes every local this builder declares. The matte "Hole"
		// expressions have to resolve BOTH cards' windows in one expression, so the
		// second copy is emitted under the "o" (other) prefix and cannot collide with
		// the first. Everything else passes no prefix and reads exactly as before.
		function eSplit(pfx) {
			if (!pfx) {
				pfx = '';
			}
			return (
				'var ' +
				pfx +
				'splitY = clamp(thisComp.layer("SPLIT Handle").transform.yPosition, 0, CH);' +
				NL
			);
		}

		// ------------------------------------------------------------------
		// PER-SECTION WINDOW RESOLVER
		//
		// Emitted inline into every consumer (matte size, matte position, footage
		// scale, footage position, card size, card position, Z null position) so they
		// always agree by construction - there is no shared runtime state between
		// expressions. Declares: splitY, inset, seamOff, boxL, boxR, boxTop, boxBot,
		// boxW, boxH, t, floating, geomFor(), ap, g, winW, winH, winCx, winCy.
		//
		// 1.3.0 semantics. The Inset shrinks the COMP-FACING edges only (left, right and
		// the outer top/bottom). The seam edge is governed by "Seam Mode":
		//
		//   Gap mode (1)   - the seam edge sits Gap / 2 from the split line, so the
		//                    visible seam is exactly Gap no matter what the insets are.
		//   Inset mode (2) - the seam edge sits (that card's OWN Inset x Seam Inset %)
		//                    from the split line and Gap is ignored, so the middle
		//                    breathing space matches the outer framing. Unequal insets
		//                    deliberately give an asymmetric seam: each card owns its
		//                    own side of the split.
		//
		// 1.2.0 inset all four sides of the section, which made the seam
		// "Top Inset + Gap + Bottom Inset" wide - so insetting a card to lift it off the
		// comp edge also tore the two windows apart in the middle, and the only way back
		// was to wind Gap negative. Neither mode can double an inset now.
		//
		// The box is therefore ASYMMETRIC about the section, and the window centre must
		// be the centre of the box, (boxTop + boxBot) / 2 - deriving it from the section
		// instead would push the window back across the seam by half the inset.
		//
		// 1.5.0 - PiP MORPH. The split box above is no longer the answer, it is the
		// FIRST of two: it is emitted as sW / sH / sCx / sCy, a PiP target is worked out
		// as pW / pH / pCx / pCy, and the winW / winH / winCx / winCy every consumer
		// reads is the straight lerp between them at t = "PiP Transition" / 100.
		//
		//   floating card ("PiP Panel" names it)  - a box CW x "PiP Scale" % wide, as
		//       tall as that card's OWN Aspect makes it, centred on the PIP handle.
		//   background card (the other one)       - the whole comp shrunk by that
		//       card's OWN Inset on all four sides, centred on the comp.
		//
		// Because it is a lerp and not a mode switch, t = 0 multiplies every delta by
		// zero and reproduces the pre-1.5.0 geometry EXACTLY (sW + (pW - sW) * 0 is sW,
		// not merely close to it), so a rig that never touches PiP Transition is untouched
		// by this change. And because every consumer inlines this one builder, mattes,
		// cards, footage scale, footage position, the pan clamp and the Z nulls all
		// morph together with no extra plumbing.
		//
		// NOTE on names: sW / sH here are the SPLIT window, and are deliberately
		// distinct from the sw / sh of eSourceScale() (which are the baked SOURCE pixel
		// dimensions). They now live inside geomFor()'s own scope, so they cannot alias
		// anything a consumer declares either; the expression engine is case sensitive,
		// so they never aliased in the first place.
		//
		// 1.8.0 - KEYABLE ASPECT. Everything downstream of the Aspect popup - the
		// split-box fit AND the PiP floating box's aspect ratio - is emitted as one
		// expression-local function geomFor(am) returning the finished
		// [winW, winH, winCx, winCy] for the aspect mode "am". The resolver then calls
		// it for the CURRENT aspect and, for the "Aspect Ease" frames that follow an
		// Aspect keyframe, once more for the PREVIOUS key's aspect and interpolates the
		// two linearly. Everything the aspect does NOT decide - the box edges from
		// split / inset / seam, the PiP blend factor and the panel role - stays outside
		// the function, so all of it keeps animating live through the blend. With no
		// Aspect keys, or "Aspect Ease" 0, the second call never happens and the result
		// is the 1.7.4 resolver verbatim.
		// ------------------------------------------------------------------
		function eWindow(isTop, sw, sh, pfx) {
			if (!pfx) {
				pfx = '';
			}
			var P = pfx;
			var insetCtl = isTop ? 'Top Inset' : 'Bottom Inset';
			var aspectCtl = isTop ? 'Top Aspect' : 'Bottom Aspect';
			var easeCtl = isTop ? 'Top Aspect Ease' : 'Bottom Aspect Ease';
			var s = eSplit(P);
			s += 'var ' + P + 'inset = FX("' + insetCtl + '");' + NL;
			s +=
				'var ' +
				P +
				'seamOff = (FX("Seam Mode") == 2) ? ' +
				P +
				'inset * FX("Seam Inset %") / 100 : FX("Gap") / 2;' +
				NL;
			s += 'var ' + P + 'boxL = ' + P + 'inset, ' + P + 'boxR = CW - ' + P + 'inset;' + NL;
			if (isTop) {
				s += 'var ' + P + 'boxTop = ' + P + 'inset;' + NL;
				s += 'var ' + P + 'boxBot = ' + P + 'splitY - ' + P + 'seamOff;' + NL;
			} else {
				s += 'var ' + P + 'boxTop = ' + P + 'splitY + ' + P + 'seamOff;' + NL;
				s += 'var ' + P + 'boxBot = CH - ' + P + 'inset;' + NL;
			}
			s += 'var ' + P + 'boxW = Math.max(0, ' + P + 'boxR - ' + P + 'boxL);' + NL;
			s += 'var ' + P + 'boxH = Math.max(0, ' + P + 'boxBot - ' + P + 'boxTop);' + NL;
			// ---- PiP blend factor and the panel role --------------------------
			// Neither depends on the Aspect, so both are hoisted ABOVE the geometry
			// function and captured by it. That is what keeps a simultaneously
			// animating "PiP Transition" (and a dragged SPLIT, and Gap / Seam / Inset)
			// live THROUGH an aspect blend: both aspects' geometries are evaluated
			// against the CURRENT box and the CURRENT t, and only the aspect is
			// interpolated.
			//
			// "floating" is true when this card is the one PiP Panel names. The
			// comparison is written against a baked true/false so the card's identity
			// is decided at BUILD time and the panel choice at RUN time.
			s += 'var ' + P + 't = FX("PiP Transition") / 100;' + NL;
			s +=
				'var ' +
				P +
				'floating = (FX("PiP Panel") == 1) == ' +
				(isTop ? 'true' : 'false') +
				';' +
				NL;

			// ---- the aspect-dependent geometry, as a FUNCTION of the aspect ----
			// 1.8.0. Everything downstream of the Aspect popup lives in this one
			// expression-local function, so the whole of it can be evaluated twice -
			// once for the aspect the card is on now and once for the aspect it was on
			// before the current Aspect keyframe - and the two results blended. That
			// is the split-box fit AND the PiP floating box's aspect ratio, because
			// pAR reads the same popup: leaving either outside would leave that half
			// of the geometry snapping while the other half eased.
			//
			// The function name carries the resolver prefix as well ("ogeomFor"),
			// because the hole and card expressions emit BOTH cards' resolvers into
			// one expression and two declarations of one name would collide.
			//
			// It returns the finished [winW, winH, winCx, winCy] for that aspect -
			// PiP lerp included - so a blend of two returns is a blend of two whole
			// window boxes and nothing downstream has to know the aspect moved.
			s += 'function ' + P + 'geomFor(' + P + 'am) {' + NL;
			s += '  var ' + P + 'sW, ' + P + 'sH, ' + P + 'a;' + NL;
			s +=
				'  if (' + P + 'am == 1) { ' + P + 'sW = ' + P + 'boxW; ' + P + 'sH = ' + P + 'boxH; }' + NL;
			s += '  else {' + NL;
			s += '    if (' + P + 'am == 2) ' + P + 'a = 1;' + NL;
			s += '    else if (' + P + 'am == 3) ' + P + 'a = 16 / 9;' + NL;
			s += '    else if (' + P + 'am == 4) ' + P + 'a = 9 / 16;' + NL;
			s += '    else ' + P + 'a = ' + sw + ' / ' + sh + ';' + NL;
			s +=
				'    if (' +
				P +
				'am == 5) { ' +
				P +
				'sH = ' +
				P +
				'boxH; ' +
				P +
				'sW = Math.min(' +
				P +
				'boxW, ' +
				P +
				'boxH * ' +
				P +
				'a); }' +
				NL;
			s +=
				'    else if (' +
				P +
				'am == 6) { ' +
				P +
				'sW = ' +
				P +
				'boxW; ' +
				P +
				'sH = Math.min(' +
				P +
				'boxH, ' +
				P +
				'boxW / ' +
				P +
				'a); }' +
				NL;
			s +=
				'    else { ' +
				P +
				'sW = Math.min(' +
				P +
				'boxW, ' +
				P +
				'boxH * ' +
				P +
				'a); ' +
				P +
				'sH = ' +
				P +
				'sW / ' +
				P +
				'a; }' +
				NL;
			s += '  }' + NL;
			s += '  var ' + P + 'sCx = CW / 2;' + NL;
			s += '  var ' + P + 'sCy = (' + P + 'boxTop + ' + P + 'boxBot) / 2;' + NL;
			s +=
				'  var ' +
				P +
				'pW, ' +
				P +
				'pH, ' +
				P +
				'pCx, ' +
				P +
				'pCy, ' +
				P +
				'pAR, ' +
				P +
				'hp;' +
				NL;
			s += '  if (' + P + 'floating) {' + NL;
			// The floating window keeps this card's own Aspect. Cover / Fit Height /
			// Fit Width have no aspect of their own once the section is gone, so they
			// all fall back to the SOURCE aspect - which is what "Cover" means.
			s += '    if (' + P + 'am == 2) ' + P + 'pAR = 1;' + NL;
			s += '    else if (' + P + 'am == 3) ' + P + 'pAR = 16 / 9;' + NL;
			s += '    else if (' + P + 'am == 4) ' + P + 'pAR = 9 / 16;' + NL;
			s += '    else ' + P + 'pAR = ' + sw + ' / ' + sh + ';' + NL;
			s += '    ' + P + 'pW = CW * FX("PiP Scale") / 100;' + NL;
			s += '    ' + P + 'pH = ' + P + 'pW / ' + P + 'pAR;' + NL;
			s += '    ' + P + 'hp = thisComp.layer("' + PIP_HANDLE_NAME + '").transform.position;' + NL;
			s += '    ' + P + 'pCx = ' + P + 'hp[0]; ' + P + 'pCy = ' + P + 'hp[1];' + NL;
			s += '  } else {' + NL;
			// The background card fills the comp minus its OWN Inset on all four edges -
			// there is no seam left to own, so the Inset finally reads as plain framing.
			s += '    ' + P + 'pW = Math.max(8, CW - 2 * ' + P + 'inset);' + NL;
			s += '    ' + P + 'pH = Math.max(8, CH - 2 * ' + P + 'inset);' + NL;
			s += '    ' + P + 'pCx = CW / 2; ' + P + 'pCy = CH / 2;' + NL;
			s += '  }' + NL;
			s +=
				'  return [' +
				P +
				'sW + (' +
				P +
				'pW - ' +
				P +
				'sW) * ' +
				P +
				't, ' +
				P +
				'sH + (' +
				P +
				'pH - ' +
				P +
				'sH) * ' +
				P +
				't, ' +
				P +
				'sCx + (' +
				P +
				'pCx - ' +
				P +
				'sCx) * ' +
				P +
				't, ' +
				P +
				'sCy + (' +
				P +
				'pCy - ' +
				P +
				'sCy) * ' +
				P +
				't];' +
				NL;
			s += '}' + NL;

			// ---- the aspect blend (1.8.0) --------------------------------------
			// A hold keyframe on the Aspect popup used to make the window JUMP on the
			// frame it landed on. It now eases: for the "Aspect Ease" frames that
			// follow an Aspect keyframe the window box is a straight interpolation
			// from the geometry of the PREVIOUS key's aspect to the geometry of the
			// current one.
			//
			// The fast paths are exact, not approximate. No keys, Aspect Ease 0, or a
			// time already past the ease window all leave "g" as the single geomFor()
			// call above, which is the 1.7.4 resolver verbatim - so a rig that never
			// keyframes an Aspect (or sets the ease to 0) is bit-for-bit unchanged,
			// and the second geomFor() call only ever happens while actually blending.
			//
			// ki is the last Aspect key at or before now (nearestKey can return the
			// one AFTER now, hence the step back). Blending needs ki >= 2 so there is
			// a previous key to come FROM: before the first key there is no previous
			// aspect and nothing to ease, which is also why the very first Aspect key
			// on a card never moves anything.
			s += 'var ' + P + 'ap = FX("' + aspectCtl + '");' + NL;
			s += 'var ' + P + 'g = ' + P + 'geomFor(' + P + 'ap.value);' + NL;
			s += 'var ' + P + 'easeT = FX("' + easeCtl + '") * thisComp.frameDuration;' + NL;
			s += 'if (' + P + 'easeT > 0 && ' + P + 'ap.numKeys > 0) {' + NL;
			s += '  var ' + P + 'ki = ' + P + 'ap.nearestKey(time).index;' + NL;
			s += '  if (' + P + 'ap.key(' + P + 'ki).time > time) ' + P + 'ki--;' + NL;
			s += '  if (' + P + 'ki >= 2) {' + NL;
			s += '    var ' + P + 'dtk = time - ' + P + 'ap.key(' + P + 'ki).time;' + NL;
			s += '    if (' + P + 'dtk < ' + P + 'easeT) {' + NL;
			s +=
				'      var ' + P + 'gp = ' + P + 'geomFor(' + P + 'ap.key(' + P + 'ki - 1).value);' + NL;
			// 1.9.2: the blend used to run on LINEAR time, which flattened the
			// motion an editor had eased on the "PiP Transition" keyframes - the
			// window changed shape on a mechanical ramp while everything else
			// followed the eased curve. When PiP Transition actually moves across
			// the ease window, the blend now rides ITS normalised progress, so the
			// aspect change inherits whatever keyframe easing is on the driver.
			// Only when the driver is static over that window (nothing to inherit)
			// does it fall back to linear time.
			s += '      var ' + P + 'b = ' + P + 'dtk / ' + P + 'easeT;' + NL;
			s += '      var ' + P + 'pipP = FX("PiP Transition");' + NL;
			s += '      var ' + P + 'kT = ' + P + 'ap.key(' + P + 'ki).time;' + NL;
			s += '      var ' + P + 'pA = ' + P + 'pipP.valueAtTime(' + P + 'kT);' + NL;
			s += '      var ' + P + 'pB = ' + P + 'pipP.valueAtTime(' + P + 'kT + ' + P + 'easeT);' + NL;
			s += '      if (Math.abs(' + P + 'pB - ' + P + 'pA) > 0.000001) {' + NL;
			s +=
				'        ' +
				P +
				'b = Math.max(0, Math.min(1, (' +
				P +
				't * 100 - ' +
				P +
				'pA) / (' +
				P +
				'pB - ' +
				P +
				'pA)));' +
				NL;
			s += '      }' + NL;
			s +=
				'      ' +
				P +
				'g = [' +
				P +
				'gp[0] + (' +
				P +
				'g[0] - ' +
				P +
				'gp[0]) * ' +
				P +
				'b, ' +
				P +
				'gp[1] + (' +
				P +
				'g[1] - ' +
				P +
				'gp[1]) * ' +
				P +
				'b, ' +
				P +
				'gp[2] + (' +
				P +
				'g[2] - ' +
				P +
				'gp[2]) * ' +
				P +
				'b, ' +
				P +
				'gp[3] + (' +
				P +
				'g[3] - ' +
				P +
				'gp[3]) * ' +
				P +
				'b];' +
				NL;
			s += '    }' + NL;
			s += '  }' + NL;
			s += '}' + NL;
			s +=
				'var ' +
				P +
				'winW = ' +
				P +
				'g[0], ' +
				P +
				'winH = ' +
				P +
				'g[1], ' +
				P +
				'winCx = ' +
				P +
				'g[2], ' +
				P +
				'winCy = ' +
				P +
				'g[3];' +
				NL;
			return s;
		}

		// Window box size - drives the matte rect.
		function exprWindowSize(isTop, sw, sh) {
			return ePre() + eWindow(isTop, sw, sh) + '[winW, winH]';
		}

		// Window box centre - drives the matte layer and the card layer.
		function exprWindowCenter(isTop, sw, sh) {
			return ePre() + eWindow(isTop, sw, sh) + '[winCx, winCy]';
		}

		// The pan nulls park on their window's centre. They used to be derived from the
		// gap-only section edges, which no longer describe where the window actually is
		// once Seam Mode or an Inset is in play - so they run the same resolver as
		// everything else. Only the handle GLYPH position depends on this: the handles
		// are parented here and sit at [0, 0] in parent space, so the pan offset the
		// footage expressions read is unaffected.
		function exprZTopPosition(sw, sh) {
			return ePre() + eWindow(true, sw, sh) + '[winCx, winCy]';
		}

		function exprZBotPosition(sw, sh) {
			return ePre() + eWindow(false, sw, sh) + '[winCx, winCy]';
		}

		// Corner radius and edge feather are per-card from 1.2.0 - the matte and the
		// card behind it must both read the SAME side's control or the border ring
		// stops following the window it frames.
		function exprCornerRadius(isTop) {
			return ePre() + 'FX("' + (isTop ? 'Top Corner Radius' : 'Bottom Corner Radius') + '")';
		}

		function exprEdgeFeather(isTop) {
			return ePre() + 'FX("' + (isTop ? 'Top Edge Feather' : 'Bottom Edge Feather') + '")';
		}

		// ------------------------------------------------------------------
		// MATTE HOLE (1.5.0) - stacking-independent PiP occlusion
		//
		// Layer order is fixed at build time and TOP always sits above BOT, so with
		// "PiP Panel" = Bottom the floating card would be buried under the background
		// card's full-comp window - and no expression can restack layers. So instead of
		// moving anything, the BACKGROUND card's matte gets a hole cut out of it exactly
		// where the FLOATING card draws, and the floating card's own matte gets a hole of
		// size [0, 0]. Whichever card floats, it is the one that reads.
		//
		// The hole is the other card's CARD rect, not its window rect: window inflated by
		// that card's Border Width on every edge, rounded by its Corner Radius + Border
		// Width. That is bit-for-bit what exprCardSize / exprCardRoundness draw, so the
		// hole and the thing filling it can never disagree.
		//
		// Both cards' resolvers therefore have to run in one expression: this card's
		// under no prefix (for "floating" and this matte's own centre) and the other
		// card's under the "o" prefix.
		//
		// The matte LAYER is positioned at [winCx, winCy] and the Window rect sits at
		// group [0, 0], so group space is comp space translated by this window's centre -
		// which makes the hole's position simply (otherCentre - thisCentre).
		//
		// At PiP Transition 0 the two windows are separated by the seam, so the subtraction
		// removes nothing that was ever visible. The hole CAN cross the seam if a Border
		// Width is wider than half the Gap, but that strip is covered pixel-for-pixel by
		// the floating card's own opaque border rect, which is stacked above this matte.
		// ------------------------------------------------------------------
		function exprHoleSize(isTop, sw, sh) {
			return (
				ePre() +
				eWindow(isTop, sw, sh) +
				eWindow(!isTop, sw, sh, 'o') +
				'var obw = FX("' +
				cardCtl(!isTop, 'Border Width') +
				'");' +
				NL +
				'floating ? [0, 0] : [owinW + 2 * obw, owinH + 2 * obw]'
			);
		}

		function exprHolePosition(isTop, sw, sh) {
			return (
				ePre() +
				eWindow(isTop, sw, sh) +
				eWindow(!isTop, sw, sh, 'o') +
				'[owinCx - winCx, owinCy - winCy]'
			);
		}

		function exprHoleRoundness(isTop) {
			return (
				ePre() +
				'FX("' +
				cardCtl(!isTop, 'Corner Radius') +
				'") + FX("' +
				cardCtl(!isTop, 'Border Width') +
				'")'
			);
		}

		// ------------------------------------------------------------------
		// SHARED FOOTAGE-SCALE SNIPPET (1.4.0)
		//
		// Emitted into BOTH the footage scale expression and the footage
		// position/clamp expression, because the pan clamp has to know exactly how
		// big the footage is drawn: two separately written copies of the same maths
		// are two chances to disagree, and a clamp that disagrees with the scale
		// either lets the footage edge slide into the window or refuses pan the
		// window can legitimately show. Requires eWindow() to have run (reads winW /
		// winH). Declares: sw, sh, base, s - where s is the LINEAR scale factor
		// (1 = 100 %), so the scale property emits s * 100.
		//
		// "Scale Mode" decides what the zoom is a percentage OF:
		//
		//   Fill Window (1) - base fills the current window, so the footage is
		//                     re-fitted every time the window changes. This is the
		//                     1.0.0-1.3.0 behaviour.
		//   Fixed (2)       - base covers the COMP, which no window control can
		//                     move, so dragging the split (or changing Gap, Seam
		//                     Mode, Inset or Aspect) only re-crops the matte and the
		//                     footage holds its size. Zoom alone scales it, and
		//                     Zoom = 100 % means "exactly covers the comp".
		//
		// Fill mode made a pinned punch-in breathe while riding the divider, which
		// is unusable for a shot framed on a face. Fixed mode is deliberately free
		// to leave the window bigger than the footage (Zoom below the window's own
		// fill), in which case the pan clamp below centres the footage (mx / my
		// collapse to 0) and matte void shows - that is the user asking for it, not
		// a case to special-case away.
		// ------------------------------------------------------------------
		function eSourceScale(isTop, sw, sh) {
			var modeCtl = isTop ? 'Top Scale Mode' : 'Bottom Scale Mode';
			var zoomCtl = isTop ? 'Top Zoom' : 'Bottom Zoom';
			var s = 'var sw = ' + sw + ', sh = ' + sh + ';' + NL;
			s += 'var base;' + NL;
			s += 'if (FX("' + modeCtl + '") == 2) { base = Math.max(CW / sw, CH / sh); }' + NL;
			s += 'else { base = Math.max(winW / sw, winH / sh); }' + NL;
			s += 'var s = base * FX("' + zoomCtl + '") / 100;' + NL;
			return s;
		}

		// TOP / BOT source layer scale. isTop picks the window and the control prefix.
		function exprSourceScale(isTop, sw, sh) {
			var s = ePre() + eWindow(isTop, sw, sh) + eSourceScale(isTop, sw, sh);
			s += 'var z = s * 100;' + NL;
			s += '[z, z]';
			return s;
		}

		// TOP / BOT source layer position, including optional pan clamping.
		function exprSourcePosition(isTop, sw, sh) {
			var handle = isTop ? 'TOP PAN Handle' : 'BOT PAN Handle';
			var clampCtl = isTop ? 'Top Clamp Pan' : 'Bottom Clamp Pan';
			var s = ePre() + eWindow(isTop, sw, sh) + eSourceScale(isTop, sw, sh);
			s += 'var ctr = [winCx, winCy];' + NL;
			s += 'var pan = thisComp.layer("' + handle + '").transform.position;' + NL;
			s += 'if (FX("' + clampCtl + '") == 1) {' + NL;
			s += '  var mx = Math.max(0, (sw * s - winW) / 2);' + NL;
			s += '  var my = Math.max(0, (sh * s - winH) / 2);' + NL;
			s += '  pan = [clamp(pan[0], -mx, mx), clamp(pan[1], -my, my)];' + NL;
			s += '}' + NL;
			s += 'ctr + pan';
			return s;
		}

		// Audio routing: exactly one window is audible (or neither).
		function exprSourceAudioLevels(isTop) {
			return ePre() + 'FX("Audio Source") == ' + (isTop ? '1' : '2') + ' ? [0, 0] : [-192, -192]';
		}

		// Per-card Time Remap - INTEGRATED from 1.3.0.
		//
		// The footage layers are locked (see the lock/shy pass), so retiming is driven
		// from the controller instead of from keyframes on the layer: Speed is a
		// percentage of real time (0 freezes the frame) and Time Offset shifts the clip
		// in FRAMES.
		//
		// 1.2.0 evaluated "(time - inPoint) * speed", which is only correct while Speed
		// is constant. Keyframing Speed 100 -> 0 -> 100 to hold on a frame made the clip
		// JUMP the moment speed came back, because that formula always re-derives the
		// position from the CURRENT speed and the whole elapsed time - the freeze was
		// never accounted for. The position is therefore now the INTEGRAL of Speed:
		// every frame from the layer's in point to now contributes speed * frameDuration,
		// so restoring Speed resumes from the frame the freeze parked on and a speed ramp
		// reads as a real variable-speed transport.
		//
		// The integral is only walked when Speed actually carries keyframes; a static
		// Speed collapses to the closed form, so the common case costs nothing.
		//
		// The SOURCE duration is baked as a numeric literal - it describes the footage,
		// not the comp - and the result is clamped to the last addressable frame so the
		// tail never goes blank. Time Offset is converted frames -> seconds through
		// thisComp.frameDuration (the master comp is built at the source frame rate) and
		// ADDS to the integrated position, so it is the manual frame picker while Speed
		// is 0.
		function exprTimeRemap(isTop, durSeconds) {
			var speedCtl = isTop ? 'Top Speed' : 'Bottom Speed';
			var offsetCtl = isTop ? 'Top Time Offset' : 'Bottom Time Offset';
			var s = 'var C = thisComp.layer("' + CTRL_LAYER_NAME + '");' + NL;
			s += 'var FX = C.effect("' + EFFECT_NAME + '");' + NL;
			s += 'var fd = thisComp.frameDuration;' + NL;
			s += 'var sp = FX("' + speedCtl + '");' + NL;
			s += 'var off = FX("' + offsetCtl + '") * fd;' + NL;
			s += 'var acc = 0;' + NL;
			s += 'if (sp.numKeys > 0) {' + NL;
			s += '  var n = Math.round((time - inPoint) / fd);' + NL;
			s += '  for (var i = 0; i < n; i++) {' + NL;
			s += '    acc += (sp.valueAtTime(inPoint + i * fd) / 100) * fd;' + NL;
			s += '  }' + NL;
			s += '} else {' + NL;
			s += '  acc = (time - inPoint) * sp.value / 100;' + NL;
			s += '}' + NL;
			s += 'clamp(acc + off, 0, ' + ratioStr(durSeconds) + ' - fd)';
			return s;
		}

		// The two read-only "Source Frames" info sliders. The script bakes the source
		// length (in frames) onto them as a numeric-literal expression, which both
		// displays the number and makes the slider un-draggable - so the editor can see
		// the legal range for Time Offset without a second panel. It is a plain integer
		// literal, so no comp property is baked into it.
		function exprSourceFrames(frames) {
			return String(frames);
		}

		// ------------------------------------------------------------------
		// CARD LAYERS (border + drop shadow behind each window)
		// ------------------------------------------------------------------

		// Every card control is side-scoped from 1.2.0.
		function cardCtl(isTop, suffix) {
			return (isTop ? 'Top ' : 'Bottom ') + suffix;
		}

		// The morph blend on its own, for consumers that need to know how far the PiP
		// has gone (and which card floats) but not where any window actually is.
		// Declares: t, topFloats.
		function ePipBlend() {
			return 'var t = FX("PiP Transition") / 100;' + NL + 'var topFloats = FX("PiP Panel") == 1;' + NL;
		}

		// The control that belongs to whichever card is currently floating.
		function pipCtl(suffix) {
			return '(topFloats ? FX("Top ' + suffix + '") : FX("Bottom ' + suffix + '"))';
		}

		function exprCardSize(isTop, sw, sh) {
			return (
				ePre() +
				eWindow(isTop, sw, sh) +
				'var bw = FX("' +
				cardCtl(isTop, 'Border Width') +
				'");' +
				NL +
				'[winW + 2 * bw, winH + 2 * bw]'
			);
		}

		function exprCardRoundness(isTop) {
			return (
				ePre() +
				'FX("' +
				cardCtl(isTop, 'Corner Radius') +
				'") + FX("' +
				cardCtl(isTop, 'Border Width') +
				'")'
			);
		}

		function exprCardColor(isTop) {
			return ePre() + 'FX("' + cardCtl(isTop, 'Border Color') + '")';
		}

		// The window-size gate (1.7.3) keeps the border ring from surviving as a
		// tiny dot when a pane is collapsed by dragging the SPLIT handle all the
		// way to a comp edge - a zero window must render literally nothing.
		function exprCardOpacity(isTop, sw, sh) {
			return (
				ePre() +
				eWindow(isTop, sw, sh) +
				'(winW > 0.5 && winH > 0.5 && (FX("' +
				cardCtl(isTop, 'Border Width') +
				'") > 0 || FX("' +
				cardCtl(isTop, 'Shadow Opacity') +
				'") > 0)) ? 100 : 0'
			);
		}

		// "ADBE Drop Shadow" opacity is 0-255 in some builds and 0-100 in others,
		// so the scale is decided from the live property at build time.
		//
		// 1.5.1: the FLOATING card's own shadow is cross-faded out as the PiP engages
		// and the dedicated "PiP Shadow" layer takes over (see buildPipShadow). Two
		// shadows drawn at once would double up, and the card-drawn one cannot escape
		// the layer stack - that is the whole reason the PiP Shadow layer exists. The
		// BACKGROUND card keeps its shadow untouched (it grows to fill the comp, so
		// its shadow leaves the frame on its own). At t = 0 the multiplier is exactly
		// 1, so split-mode shadows are bit-identical to 1.4.0.
		function exprCardShadowOpacity(is255, isTop) {
			var e =
				ePre() +
				ePipBlend() +
				'var floating = topFloats == ' +
				(isTop ? 'true' : 'false') +
				';' +
				NL +
				'var so = FX("' +
				cardCtl(isTop, 'Shadow Opacity') +
				'") * (floating ? 1 - t : 1);' +
				NL;
			return e + (is255 ? 'so / 100 * 255' : 'so');
		}

		// ------------------------------------------------------------------
		// PiP SHADOW (1.5.1)
		//
		// A card draws its own drop shadow, and a card cannot escape its own place in
		// the layer stack: "TOP Matte / TOP / TOP Card" is always above "BOT Matte /
		// BOT / BOT Card", so with "PiP Panel" = Bottom the floating card's shadow is
		// drawn UNDER the background card's full-comp window and is never seen. There
		// is no expression that can restack layers, so the shadow is lifted off the
		// card entirely and onto a dedicated pair of layers that sit above BOTH card
		// assemblies:
		//
		//   "PiP Shadow"       - a rect the size of the floating card's CARD rect,
		//                        carrying an "ADBE Drop Shadow" with Shadow Only on,
		//                        so the layer contributes the shadow and nothing else
		//                        (the card itself is still drawn by TOP / BOT Card -
		//                        drawing it twice would double the border).
		//   "PiP Shadow Matte" - the whole comp MINUS that same card rect, used as its
		//                        alpha matte. Without it the shadow, being above the
		//                        floating card, would spill its soft inner edge back
		//                        over the card it is supposed to be cast BY.
		//
		// Both read whichever card "PiP Panel" currently nominates, so the shadow
		// follows the animatable panel choice, and the layer opacity is 100 * t, so at
		// PiP Transition 0 the pair contributes exactly nothing and split mode is untouched.
		// ------------------------------------------------------------------

		// The floating card's CARD rect - window + its own border on all four edges.
		// Both cards' resolvers are emitted (the second under the "o" prefix) and the
		// panel choice picks between them at runtime.
		function exprPipShadowSize(sw, sh) {
			return (
				ePre() +
				eWindow(true, sw, sh) +
				eWindow(false, sw, sh, 'o') +
				'var topFloats = FX("PiP Panel") == 1;' +
				NL +
				'var fw = topFloats ? winW : owinW, fh = topFloats ? winH : owinH;' +
				NL +
				'var fbw = ' +
				pipCtl('Border Width') +
				';' +
				NL +
				'[fw + 2 * fbw, fh + 2 * fbw]'
			);
		}

		function exprPipShadowPosition(sw, sh) {
			return (
				ePre() +
				eWindow(true, sw, sh) +
				eWindow(false, sw, sh, 'o') +
				'var topFloats = FX("PiP Panel") == 1;' +
				NL +
				'[topFloats ? winCx : owinCx, topFloats ? winCy : owinCy]'
			);
		}

		// Same rect, stated in the matte layer's space. That layer is pinned to the
		// comp centre, so the offset is (floating centre - comp centre).
		function exprPipMatteCardPosition(sw, sh) {
			return (
				ePre() +
				eWindow(true, sw, sh) +
				eWindow(false, sw, sh, 'o') +
				'var topFloats = FX("PiP Panel") == 1;' +
				NL +
				'[(topFloats ? winCx : owinCx) - CW / 2, (topFloats ? winCy : owinCy) - CH / 2]'
			);
		}

		function exprPipShadowRoundness() {
			return (
				ePre() +
				'var topFloats = FX("PiP Panel") == 1;' +
				NL +
				pipCtl('Corner Radius') +
				' + ' +
				pipCtl('Border Width')
			);
		}

		// 100 * t - nothing at all at PiP Transition 0, full weight at 100.
		function exprPipShadowLayerOpacity() {
			return ePre() + 'FX("PiP Transition")';
		}

		function exprPipShadowOpacity(is255) {
			var e =
				ePre() + 'var topFloats = FX("PiP Panel") == 1;' + NL + 'var so = ' + pipCtl('Shadow Opacity') + ';' + NL;
			return e + (is255 ? 'so / 100 * 255' : 'so');
		}

		function exprPipShadowDirection() {
			return ePre() + 'var topFloats = FX("PiP Panel") == 1;' + NL + pipCtl('Shadow Angle');
		}

		function exprPipShadowDistance() {
			return ePre() + 'var topFloats = FX("PiP Panel") == 1;' + NL + pipCtl('Shadow Distance');
		}

		function exprPipShadowSoftness() {
			return ePre() + 'var topFloats = FX("PiP Panel") == 1;' + NL + pipCtl('Shadow Softness');
		}

		// The full comp, for the PiP Shadow Matte's outer rect.
		function exprCompSize() {
			return eDims() + '[CW, CH]';
		}

		function exprCardShadowDirection(isTop) {
			return ePre() + 'FX("' + cardCtl(isTop, 'Shadow Angle') + '")';
		}

		function exprCardShadowDistance(isTop) {
			return ePre() + 'FX("' + cardCtl(isTop, 'Shadow Distance') + '")';
		}

		function exprCardShadowSoftness(isTop) {
			return ePre() + 'FX("' + cardCtl(isTop, 'Shadow Softness') + '")';
		}

		function exprSourceRotation(isTop) {
			return 'thisComp.layer("' + (isTop ? 'TOP PAN Handle' : 'BOT PAN Handle') + '").transform.rotation';
		}

		function exprSourceOpacity(isTop) {
			return ePre() + 'FX("' + (isTop ? 'Top Opacity' : 'Bottom Opacity') + '")';
		}

		function exprDividerPosition() {
			return ePre() + eSplit() + '[CW / 2, splitY]';
		}

		function exprDividerSize() {
			return ePre() + '[CW, Math.max(1, FX("Thickness"))]';
		}

		function exprDividerColor() {
			return ePre() + 'FX("Divider Color")';
		}

		// The divider marks the split line, and the split line is what the PiP morph
		// dissolves - so it fades out on the same t the windows travel on, instead of
		// being left hanging across a finished picture-in-picture.
		function exprDividerOpacity() {
			return (
				ePre() +
				'(FX("Show Divider") == 1 ? 100 : 0) * (1 - FX("PiP Transition") / 100)'
			);
		}

		function exprBgScale(sw, sh) {
			return (
				eDims() +
				'var sw = ' +
				sw +
				', sh = ' +
				sh +
				';' +
				NL +
				'var s = Math.max(CW / sw, CH / sh) * 110;' +
				NL +
				'[s, s]'
			);
		}

		// Centre of the composition - used by the full-frame layers.
		function exprCompCenter() {
			return eDims() + '[CW / 2, CH / 2]';
		}

		// Cover scale for a solid, read from the solid's own dimensions so a comp
		// resize still leaves it covering the frame.
		function exprSolidCoverScale() {
			return (
				eDims() +
				'var s = Math.max(CW / thisLayer.width, CH / thisLayer.height) * 100;' +
				NL +
				'[s, s]'
			);
		}

		function exprBgBlur() {
			return ePre() + 'FX("BG Blur")';
		}

		function exprBgOpacity() {
			return ePre() + 'FX("BG Mode") == 1 ? 100 : 0';
		}

		function exprBgDarkenOpacity() {
			return ePre() + 'FX("BG Mode") == 4 ? 0 : FX("BG Darken")';
		}

		function exprBgFillStartColor() {
			return ePre() + 'FX("BG Color A")';
		}

		function exprBgFillEndColor() {
			return ePre() + 'FX("BG Mode") == 2 ? FX("BG Color A") : FX("BG Color B")';
		}

		function exprBgFillOpacity() {
			return ePre() + '(FX("BG Mode") == 2 || FX("BG Mode") == 3) ? 100 : 0';
		}

		// ------------------------------------------------------------------
		// CAPTION EXPRESSIONS (1.6.0: one control source per caption)
		//
		// The first caption reads the controller's own "Captions" group, exactly as
		// before. Every caption added afterwards owns a "Verticalizer Caption" pseudo
		// effect on its OWN handle, so a second caption can be sized, coloured and
		// switched off without touching the first.
		//
		// The only thing that changes between the two is where FX comes from, so the
		// prelude is swapped and every expression BODY below is left untouched:
		// ePre() binds FX to the controller's effect, ePreCaption(handle) binds it to
		// that handle's caption effect. Both are called the same way, so
		// FX("Box Padding X") resolves either way.
		//
		// 1.7.0 adds a SECOND thing that differs per caption type - where marker
		// captions read their markers from - so that binding joins FX in the prelude
		// (ePreCaptionMk) rather than leaking into the bodies. The bodies stay shared.
		// ------------------------------------------------------------------
		function ePreCaption(handleName) {
			if (!handleName) {
				return ePre();
			}
			return (
				eDims() +
				'var H = thisComp.layer("' +
				handleName +
				'");' +
				NL +
				'var FX = function (n) { return H.effect("' +
				CAPTION_EFFECT_NAME +
				'")(n); };' +
				NL
			);
		}

		// The same prelude plus the marker SOURCE, for the three expressions that can
		// read markers (source text, text opacity, box opacity).
		//
		// 1.7.1: markers live on the caption's TEXT layer - the layer an editor
		// actually selects and types into (1.7.0 read the comp / the handle, which
		// nobody guessed; field-tested and corrected). If the text layer has no
		// markers at all, the COMP's markers are read instead, so a classic
		// ruler-level subtitle track still drives the caption. One rule for both
		// caption types.
		//
		//   textLayerName - the caption's text layer, for expressions hosted on
		//       ANOTHER layer (the box). Omitted on the text layer's own
		//       expressions, where thisLayer is the marker host itself.
		function ePreCaptionMk(handleName, textLayerName) {
			var host = textLayerName ? 'thisComp.layer("' + textLayerName + '")' : 'thisLayer';
			return (
				ePreCaption(handleName) +
				'var MKSRC = ' + host + ';' + NL +
				'if (MKSRC.marker.numKeys == 0) { MKSRC = thisComp; }' + NL
			);
		}

		// ------------------------------------------------------------------
		// MARKER SCAN (1.7.0) - SubtitleForge semantics
		//
		// Requires ePreCaptionMk() to have run (reads MKSRC). Declares MK, mi,
		// mActive, segStart, segEnd.
		//
		// The scan is SubtitleForge's, semantics included: take the nearest key, step
		// back one if it turns out to be in the future, and treat the segment as
		// [key.time, key.time + key.duration) - HALF-OPEN, so a caption stops on the
		// exact frame its marker ends and shows nothing between markers.
		//
		//   - a ZERO-duration marker never displays anything: duration is what makes
		//     a marker a caption (1.7.2 - confirmed as the intended behavior after a
		//     brief 1.7.1 experiment with run-to-next-marker semantics).
		//   - OVERLAPPING (or adjacent) markers resolve to the LAST one starting at or
		//     before now; an earlier marker still running is superseded the instant
		//     the next one starts, so two markers never fight over one caption.
		// ------------------------------------------------------------------
		function eMarkerScan() {
			var s = 'var MK = MKSRC.marker;' + NL;
			s += 'var mi = 0;' + NL;
			s += 'if (MK.numKeys > 0) {' + NL;
			s += '  mi = MK.nearestKey(time).index;' + NL;
			s += '  if (MK.key(mi).time > time) mi--;' + NL;
			s += '}' + NL;
			s += 'var mActive = false;' + NL;
			s += 'var segStart = 0;' + NL;
			s += 'var segEnd = 0;' + NL;
			s += 'if (mi > 0) {' + NL;
			s += '  segStart = MK.key(mi).time;' + NL;
			s += '  segEnd = segStart + MK.key(mi).duration;' + NL;
			s += '  mActive = time >= segStart && time < segEnd;' + NL;
			s += '}' + NL;
			return s;
		}

		// ------------------------------------------------------------------
		// CAPTION FADE (1.7.0)
		//
		// ONE builder feeds both the text layer's opacity and the box layer's, so the
		// caption and its plate can never fade at different rates. Requires
		// eMarkerScan() to have run. Declares fd, fadeT, f.
		//
		// The two sources fade against different edges, because they have different
		// edges to fade against:
		//
		//   Markers - the fade lives strictly INSIDE the marker segment. The first
		//       "Fade Frames" of [segStart, segEnd) ramp up and the last ramp down, so
		//       the caption never draws a single frame outside its own marker. A
		//       segment shorter than two fades simply caps the peak below 1 - the
		//       min() does that for free - instead of overshooting or clipping. No
		//       active segment is f = 0, which also collapses the box.
		//   Manual - the fade runs against the TEXT layer's own in/out points, so
		//       trimming the layer is what times the fade. The BOX reads the text
		//       layer's in/out rather than its own, so the pair stays welded together
		//       even if their trims drift apart.
		//
		// With "Caption Fade" off (or "Fade Frames" at 0) fadeT is 0 and f stays
		// exactly 1 in Manual mode, so a rig that never touches either control behaves
		// bit for bit as it did in 1.6.1.
		//
		// textLayerName is the layer whose in/out the MANUAL fade reads: empty for the
		// text layer itself, the text layer's name for its box.
		// ------------------------------------------------------------------
		function eCaptionFade(textLayerName) {
			var inRef = textLayerName ? 'thisComp.layer("' + textLayerName + '").inPoint' : 'inPoint';
			var outRef = textLayerName ? 'thisComp.layer("' + textLayerName + '").outPoint' : 'outPoint';
			var s = 'var fd = thisComp.frameDuration;' + NL;
			s += 'var fadeT = (FX("Caption Fade") == 1) ? Math.max(0, FX("Fade Frames")) * fd : 0;' + NL;
			s += 'var f = 1;' + NL;
			s += 'if (FX("Caption Source") == 2) {' + NL;
			s += '  if (!mActive) { f = 0; }' + NL;
			s += '  else if (fadeT > 0) {' + NL;
			s += '    if (segEnd - segStart < 2 * fadeT) {' + NL;
			s +=
				'      throw new Error("Verticalizer: marker duration (" + Math.round((segEnd - segStart) / fd) + " frames) is insufficient for a " + FX("Fade Frames") + "-frame fade in + out (needs at least " + 2 * FX("Fade Frames") + " frames)");' +
				NL;
			s += '    }' + NL;
			s +=
				'    f = Math.max(0, Math.min(1, Math.min((time - segStart) / fadeT, (segEnd - time) / fadeT)));' +
				NL;
			s += '  }' + NL;
			s += '} else if (fadeT > 0) {' + NL;
			s +=
				'  f = Math.max(0, Math.min(1, Math.min((time - ' +
				inRef +
				') / fadeT, (' +
				outRef +
				' - time) / fadeT)));' +
				NL;
			s += '}' + NL;
			return s;
		}

		// sourceRectAtTime on an EMPTY text layer is not something the box expressions
		// can afford to trust: in Markers mode a caption is empty between markers, and
		// a throwing rect call takes the whole expression down (a red banner across
		// the frame, not a hidden box). This is the one try/catch in the caption
		// system - it falls back to a zero rect, and the box is already invisible
		// there because the fade factor is 0. Declares r.
		function eTextRect(target) {
			return (
				'var r;' +
				NL +
				'try { r = ' +
				target +
				'.sourceRectAtTime(time, false); }' +
				NL +
				'catch (eRect) { r = { left: 0, top: 0, width: 0, height: 0 }; }' +
				NL
			);
		}

		// A caption's handle: the shared "CAPTION Handle" for the first one, its own
		// "Caption NN Handle" for every one added afterwards.
		function captionHandleName(handleName) {
			return handleName ? handleName : 'CAPTION Handle';
		}

		// The caption handle drags freely on both axes, so the text simply follows it.
		function exprCaptionTextPosition(handleName) {
			return 'thisComp.layer("' + captionHandleName(handleName) + '").transform.position';
		}

		// The styling is unchanged; only what gets typed into it depends on "Caption
		// Source". Manual replays the layer's own typed/keyframed source text (the
		// 1.6.1 path, character for character); Markers replaces it with the active
		// marker's comment, and with the empty string wherever no marker is active -
		// which is what makes the caption disappear between subtitles.
		function exprCaptionSourceText(handleName) {
			return (
				ePreCaptionMk(handleName) +
				eMarkerScan() +
				'var st = text.sourceText.getStyleAt(0, 0);' +
				NL +
				'st = st.setFontSize(FX("Captions Size"));' +
				NL +
				'var tc = FX("Text Color");' +
				NL +
				'st = st.setFillColor([tc[0], tc[1], tc[2]]);' +
				NL +
				'var out;' +
				NL +
				'if (FX("Caption Source") == 2) { out = st.setText(mActive ? MK.key(mi).comment : ""); }' +
				NL +
				'else { out = st.setText(text.sourceText); }' +
				NL +
				'out'
			);
		}

		function exprCaptionTextScale(handleName) {
			return (
				ePreCaption(handleName) +
				'var maxW = CW * FX("Caption Max Width") / 100;' +
				NL +
				eTextRect('thisLayer') +
				'var s = (r.width > 0) ? Math.min(1, maxW / r.width) * 100 : 100;' +
				NL +
				'[s, s]'
			);
		}

		// "Show Captions" is still the gate; the fade factor rides on top of it, so a
		// caption that is switched off stays off and one that is on fades in and out
		// at its marker edges (Markers) or its own in/out points (Manual). f is 1
		// whenever "Caption Fade" is off, so this is the 1.6.1 value unchanged.
		function exprCaptionTextOpacity(handleName) {
			return (
				ePreCaptionMk(handleName) +
				eMarkerScan() +
				eCaptionFade('') +
				'(FX("Show Captions") == 1 ? 100 : 0) * f'
			);
		}

		function exprCaptionBoxSize(textLayerName, handleName) {
			return (
				ePreCaption(handleName) +
				'var t = thisComp.layer("' +
				textLayerName +
				'");' +
				NL +
				eTextRect('t') +
				'var s = t.transform.scale[0] / 100;' +
				NL +
				'[r.width * s + 2 * FX("Box Padding X"), r.height * s + 2 * FX("Box Padding Y")]'
			);
		}

		function exprCaptionBoxRoundness(handleName) {
			return ePreCaption(handleName) + 'Math.min(FX("Box Padding Y"), 24)';
		}

		function exprCaptionBoxPosition(textLayerName) {
			return (
				'var t = thisComp.layer("' +
				textLayerName +
				'");' +
				NL +
				eTextRect('t') +
				'var s = t.transform.scale[0] / 100;' +
				NL +
				'var p = t.transform.position;' +
				NL +
				'[p[0] + (r.left + r.width / 2) * s, p[1] + (r.top + r.height / 2) * s]'
			);
		}

		function exprCaptionBoxColor(handleName) {
			return ePreCaption(handleName) + 'FX("Box Color")';
		}

		// Translucency lives on the rect FILL, so the stroke can stay fully opaque.
		function exprCaptionBoxFillOpacity(handleName) {
			return ePreCaption(handleName) + 'FX("Box Opacity")';
		}

		function exprCaptionBoxStrokeColor(handleName) {
			return ePreCaption(handleName) + 'FX("Box Stroke Color")';
		}

		function exprCaptionBoxStrokeWidth(handleName) {
			return ePreCaption(handleName) + 'FX("Box Stroke Width")';
		}

		// The LAYER switches the whole box on or off and, from 1.7.0, carries the fade.
		// The fade deliberately lives HERE rather than on the rect's fill opacity: the
		// stroke is a separate operator with no opacity of its own, so it can only
		// fade by riding the layer, and putting the factor on the fill as well would
		// square it on the plate while leaving the outline linear. One multiply on the
		// layer fades plate and outline together, and "Box Opacity" keeps meaning
		// exactly what it meant before.
		//
		// The marker scan runs against the same source as this box's text layer, and
		// the manual-mode fade reads that TEXT layer's in/out points (not the box's),
		// so the pair can never fade apart.
		function exprCaptionBoxOpacity(textLayerName, handleName) {
			return (
				ePreCaptionMk(handleName, textLayerName) +
				eMarkerScan() +
				eCaptionFade(textLayerName) +
				'(FX("Show Captions") == 1 ? 100 : 0) * f'
			);
		}

		// Platform safe-zone insets. The spec table is a set of 1080x1920 pixel
		// values; they are emitted as FRACTIONS of the comp dimension and scaled by
		// CW / CH at runtime, so the overlay is correct at any comp size.
		// declare === true emits one "var" declaration list, otherwise plain
		// re-assignments - so every one of tF/bF/rF/lF is a declared local.
		function safeRow(i, declare) {
			var r = SAFE_RATIOS[i];
			if (declare) {
				return (
					'var tF = ' +
					ratioStr(r[0]) +
					', bF = ' +
					ratioStr(r[1]) +
					', rF = ' +
					ratioStr(r[2]) +
					', lF = ' +
					ratioStr(r[3]) +
					';'
				);
			}
			return (
				'tF = ' +
				ratioStr(r[0]) +
				'; bF = ' +
				ratioStr(r[1]) +
				'; rF = ' +
				ratioStr(r[2]) +
				'; lF = ' +
				ratioStr(r[3]) +
				';'
			);
		}

		function eSafe() {
			return (
				ePre() +
				'var p = FX("Platform");' +
				NL +
				safeRow(0, true) +
				NL +
				'if (p == 2) { ' +
				safeRow(1, false) +
				' }' +
				NL +
				'else if (p == 3) { ' +
				safeRow(2, false) +
				' }' +
				NL +
				'else if (p == 4) { ' +
				safeRow(3, false) +
				' }' +
				NL +
				'var T = tF * CH, B = bF * CH, R = rF * CW, L = lF * CW;' +
				NL
			);
		}

		// Band geometry, in ABSOLUTE comp coordinates.
		//
		// The Safe Zones layer is pinned at anchorPoint [0,0] / position [0,0] with no
		// transform expression (see buildSafeZones), which makes its layer space
		// identical to comp space: layer (0,0) is the top-left comp pixel. A parametric
		// rect's Position is the CENTRE of that rect in layer space, so every band can
		// be stated directly against the comp edges - no comp-centre offsets, no group
		// transforms, nothing that a layer move or a comp resize can knock out of
		// register. The four bands tile the comp edges exactly and the safe rect is
		// exactly what is left over.
		function exprSafeSize(which) {
			if (which === 'top') {
				return eSafe() + '[CW, T]';
			}
			if (which === 'bottom') {
				return eSafe() + '[CW, B]';
			}
			if (which === 'right') {
				return eSafe() + '[R, CH]';
			}
			if (which === 'left') {
				return eSafe() + '[L, CH]';
			}
			return eSafe() + '[CW - L - R, CH - T - B]';
		}

		function exprSafePosition(which) {
			if (which === 'top') {
				return eSafe() + '[CW / 2, T / 2]';
			}
			if (which === 'bottom') {
				return eSafe() + '[CW / 2, CH - B / 2]';
			}
			if (which === 'right') {
				return eSafe() + '[CW - R / 2, CH / 2]';
			}
			if (which === 'left') {
				return eSafe() + '[L / 2, CH / 2]';
			}
			return eSafe() + '[L + (CW - L - R) / 2, T + (CH - T - B) / 2]';
		}

		function exprSafeOpacity() {
			return ePre() + 'FX("Show Safe Zones") == 1 ? FX("Safe Zone Opacity") : 0';
		}

		// "Show Handles" is the master switch, but a handle that cannot do anything is
		// just clutter on the canvas: the PIP handle only means something once the
		// morph is engaged, and a caption handle only means something while captions
		// are on. extraCond (1.5.1) ANDs that per-handle condition in, so each handle
		// disappears on its own as soon as it stops being an input.
		function exprHandleOpacity(extraCond) {
			var c = 'FX("Show Handles") == 1';
			if (extraCond) {
				c += ' && (' + extraCond + ')';
			}
			return ePre() + c + ' ? 100 : 0';
		}

		// Same, for a caption handle that owns its controls instead of reading the
		// pseudo effect: "Show Handles" and "Handle Size" still come from the
		// controller, but "Show Captions" is that caption's own.
		function exprCaptionHandleOpacity(handleName) {
			return (
				ePre() +
				'var H = thisComp.layer("' +
				handleName +
				'");' +
				NL +
				'(FX("Show Handles") == 1 && H.effect("' +
				CAPTION_EFFECT_NAME +
				'")("Show Captions") == 1) ? 100 : 0'
			);
		}

		function exprHandleGlyphScale() {
			return ePre() + 'var s = FX("Handle Size");' + NL + '[s, s]';
		}

		// ------------------------------------------------------------------
		// HANDLE TRANSFORM LOCKS (1.5.0)
		//
		// A handle is a POSITION input and nothing else, but in the viewer it is an
		// ordinary layer with an ordinary selection box: a corner drag scales it, a
		// drag just outside a corner rotates it, and either one silently changes what
		// the rig reads (the pan handles) or how the glyph reads (all of them). These
		// are static LITERAL expressions - the plain value in the expression field - so
		// the property is pinned, still shows its real number and needs no control.
		//
		// The one deliberate exception is the PAN handles' Rotation: that IS the
		// per-window footage rotation input (exprSourceRotation reads it), so it must
		// stay free. Locking it would silently kill window rotation.
		// ------------------------------------------------------------------
		function exprLockScale() {
			return '[100,100]';
		}

		function exprLockRotation() {
			return '0';
		}

		function exprLockGlyphPosition() {
			return '[0,0]';
		}

		// The controller reads its own effect - no layer-name lookup needed.
		function exprCtrlGlyphScale() {
			return (
				'var FX = thisLayer.effect("' +
				EFFECT_NAME +
				'");' +
				NL +
				'var s = FX("Handle Size");' +
				NL +
				'[s, s]'
			);
		}

		//=====================================================================
		// SHAPE GEOMETRY HELPERS
		//=====================================================================

		function shapeRoundRect(w, h, r) {
			var hw = w / 2;
			var hh = h / 2;
			var s = new Shape();
			if (r <= 0) {
				s.vertices = [
					[-hw, -hh],
					[hw, -hh],
					[hw, hh],
					[-hw, hh]
				];
				s.inTangents = [
					[0, 0],
					[0, 0],
					[0, 0],
					[0, 0]
				];
				s.outTangents = [
					[0, 0],
					[0, 0],
					[0, 0],
					[0, 0]
				];
				s.closed = true;
				return s;
			}
			if (r > hw) {
				r = hw;
			}
			if (r > hh) {
				r = hh;
			}
			var c = r * KAPPA;
			s.vertices = [
				[-hw + r, -hh],
				[hw - r, -hh],
				[hw, -hh + r],
				[hw, hh - r],
				[hw - r, hh],
				[-hw + r, hh],
				[-hw, hh - r],
				[-hw, -hh + r]
			];
			s.inTangents = [
				[-c, 0],
				[0, 0],
				[0, -c],
				[0, 0],
				[c, 0],
				[0, 0],
				[0, c],
				[0, 0]
			];
			s.outTangents = [
				[0, 0],
				[c, 0],
				[0, 0],
				[0, c],
				[0, 0],
				[-c, 0],
				[0, 0],
				[0, -c]
			];
			s.closed = true;
			return s;
		}

		function shapeEllipse(rx, ry) {
			var kx = rx * KAPPA;
			var ky = ry * KAPPA;
			var s = new Shape();
			s.vertices = [
				[rx, 0],
				[0, ry],
				[-rx, 0],
				[0, -ry]
			];
			s.inTangents = [
				[0, -ky],
				[kx, 0],
				[0, ky],
				[-kx, 0]
			];
			s.outTangents = [
				[0, ky],
				[-kx, 0],
				[0, -ky],
				[kx, 0]
			];
			s.closed = true;
			return s;
		}

		function shapeLine(x1, y1, x2, y2) {
			var s = new Shape();
			s.vertices = [
				[x1, y1],
				[x2, y2]
			];
			s.inTangents = [
				[0, 0],
				[0, 0]
			];
			s.outTangents = [
				[0, 0],
				[0, 0]
			];
			s.closed = false;
			return s;
		}

		function shapePoly(pts) {
			var s = new Shape();
			var it = [];
			var ot = [];
			for (var i = 0; i < pts.length; i++) {
				it.push([0, 0]);
				ot.push([0, 0]);
			}
			s.vertices = pts;
			s.inTangents = it;
			s.outTangents = ot;
			s.closed = true;
			return s;
		}

		//=====================================================================
		// SHAPE LAYER BUILDING HELPERS
		//=====================================================================

		function contentsOf(layer) {
			return layer.property('ADBE Root Vectors Group');
		}

		function addVGroup(parentContents, name) {
			var g = parentContents.addProperty('ADBE Vector Group');
			g.name = name;
			return g;
		}

		function vContents(group) {
			return group.property('ADBE Vectors Group');
		}

		function vTransform(group) {
			return group.property('ADBE Vector Transform Group');
		}

		// A free bezier path whose Path property is locked with the "value" expression -
		// this is the single place any handle/controller path geometry is created, so
		// every glyph path in the rig is un-editable in the viewer by construction.
		function addLockedPath(contents, name, shape) {
			var p = contents.addProperty('ADBE Vector Shape - Group');
			p.name = name;
			var sp = p.property('ADBE Vector Shape');
			sp.setValue(shape);
			sp.expression = 'value';
			return p;
		}

		function addRect(contents, name) {
			var r = contents.addProperty('ADBE Vector Shape - Rect');
			r.name = name;
			return r;
		}

		// Null-safe from 1.9.0 (propNamed): the repair pass reaches for rects that a
		// rig built by an older version may simply not have.
		function rectSize(rect) {
			return propNamed(rect, 'ADBE Vector Rect Size');
		}

		function rectPosition(rect) {
			return propNamed(rect, 'ADBE Vector Rect Position');
		}

		function rectRoundness(rect) {
			return propNamed(rect, 'ADBE Vector Rect Roundness');
		}

		// The PiP occlusion hole and its Merge Paths (Subtract), as one piece: a path
		// operator consumes the paths ABOVE it in the same group and the Fill then
		// paints what the operator produced, so the pair has to end up between the
		// window rect and the fill. During a build there is no fill yet and the two
		// simply append; during a repair (1.9.0) the fill is already there, so they
		// are moved into the fill's slot instead of landing under it, where the
		// subtraction would silently do nothing.
		// A shape group only does what its ORDER says: a Merge Paths consumes the
		// paths listed above it, and the Fill paints whatever is above IT. The one
		// correct order for a windowed group is therefore
		//     &lt;primary path&gt;, Hole, Subtract, [Stroke], Fill
		//
		// 1.9.3: this is enforced by moving every item to the end in that sequence
		// rather than by computing insertion indices. Index arithmetic was how the
		// repair path broke: `hole.moveTo(fillIdx)` failed silently inside its own
		// catch and left "Card Rect, Fill, Subtract, Hole" behind - a group whose
		// subtract has nothing above it and whose fill paints the un-cut rect, which
		// is exactly the solid block that swallowed the border ring. Moving to the
		// end cannot half-succeed: whatever the group looked like before, it ends up
		// canonical, so this doubles as the repair for an already-scrambled group.
		// 1.9.4: the reference is looked up again for EVERY move. Moving a property
		// inside a group invalidates the sibling references taken before it - the
		// same trap applyPreset() sets - so the 1.9.3 version, which captured all
		// five up front and then moved them in turn, had its first move succeed and
		// the remaining four throw into their own catch. That left a group rotated by
		// exactly one item: a matte whose Window sat BELOW its Fill, which empties
		// the alpha and takes both panes off the frame.
		function moveChildToEnd(contents, name, matchName, ordinal) {
			var p = null;
			if (name) {
				p = propNamed(contents, name);
			}
			if (p === null && matchName) {
				p = childByMatch(contents, matchName, ordinal === undefined ? 0 : ordinal);
			}
			if (p === null) {
				return;
			}
			try {
				p.moveTo(contents.numProperties);
			} catch (eMove) {}
		}

		function normalizeShapeOrder(contents, primaryName, holeName) {
			if (contents === null || contents === undefined) {
				return;
			}
			moveChildToEnd(contents, primaryName, null, 0);
			if (holeName) {
				moveChildToEnd(contents, holeName, null, 0);
			}
			moveChildToEnd(contents, null, 'ADBE Vector Filter - Merge', 0);
			moveChildToEnd(contents, null, 'ADBE Vector Graphic - Stroke', 0);
			moveChildToEnd(contents, null, 'ADBE Vector Graphic - Fill', 0);
		}

		function addHoleAndSubtract(contents, name, primaryName) {
			var hole = addRect(contents, name);
			var merge = contents.addProperty('ADBE Vector Filter - Merge');
			merge.name = 'Subtract Hole';
			// 1 Merge, 2 Add, 3 Subtract, 4 Intersect, 5 Exclude Intersections.
			setSafe(merge.property('ADBE Vector Merge Type'), 3);
			normalizeShapeOrder(contents, primaryName, name);
			return hole;
		}

		function addFill(contents, color, opacity) {
			var f = contents.addProperty('ADBE Vector Graphic - Fill');
			f.property('ADBE Vector Fill Color').setValue(color);
			if (opacity !== undefined && opacity !== null) {
				setSafe(f.property('ADBE Vector Fill Opacity'), opacity);
			}
			return f;
		}

		function addStroke(contents, color, width) {
			var s = contents.addProperty('ADBE Vector Graphic - Stroke');
			s.property('ADBE Vector Stroke Color').setValue(color);
			s.property('ADBE Vector Stroke Width').setValue(width);
			setSafe(s.property('ADBE Vector Stroke Line Cap'), 2); // round cap
			setSafe(s.property('ADBE Vector Stroke Line Join'), 2); // round join
			return s;
		}

		function xform(layer) {
			return layer.property('ADBE Transform Group');
		}

		function setPosition(layer, value) {
			xform(layer).property('ADBE Position').setValue(value);
		}

		function setPositionExpr(layer, expr) {
			xform(layer).property('ADBE Position').expression = expr;
		}

		function setOpacityExpr(layer, expr) {
			xform(layer).property('ADBE Opacity').expression = expr;
		}

		//=====================================================================
		// STRUCTURE LOCATORS (1.9.0)
		//
		// A builder always knows where the group, rect or effect it just created
		// lives. The repair pass does not: it is handed a composition some earlier
		// version built, possibly missing a piece or carrying a renamed one. Every
		// locator below therefore asks by name first, falls back to position or
		// match name, and returns null instead of throwing - so one missing piece
		// can never abort a whole repair.
		//=====================================================================

		function propNamed(group, name) {
			if (group === null || group === undefined) {
				return null;
			}
			var p = null;
			try {
				p = group.property(name);
			} catch (e) {
				p = null;
			}
			return p === undefined ? null : p;
		}

		// The (ordinal + 1)-th direct child carrying this match name, or null.
		function childByMatch(group, matchName, ordinal) {
			if (group === null || group === undefined) {
				return null;
			}
			var want = ordinal === undefined ? 0 : ordinal;
			var seen = 0;
			try {
				for (var i = 1; i <= group.numProperties; i++) {
					var it = group.property(i);
					if (it !== null && it !== undefined && it.matchName === matchName) {
						if (seen === want) {
							return it;
						}
						seen++;
					}
				}
			} catch (e) {}
			return null;
		}

		// 1-based index of the first child with this match name, 0 when absent.
		function indexOfMatch(group, matchName) {
			if (group === null || group === undefined) {
				return 0;
			}
			try {
				for (var i = 1; i <= group.numProperties; i++) {
					if (group.property(i).matchName === matchName) {
						return i;
					}
				}
			} catch (e) {}
			return 0;
		}

		function shapeGroup(layer, name) {
			var root = null;
			try {
				root = contentsOf(layer);
			} catch (e) {
				return null;
			}
			var g = propNamed(root, name);
			if (g === null) {
				g = propNamed(root, 1);
			}
			return g;
		}

		function shapeGroupContents(layer, name) {
			return propNamed(shapeGroup(layer, name), 'ADBE Vectors Group');
		}

		function findRect(contents, name, ordinal) {
			var r = propNamed(contents, name);
			if (r !== null) {
				return r;
			}
			return childByMatch(contents, 'ADBE Vector Shape - Rect', ordinal);
		}

		function layerEffect(layer, matchName) {
			var parade = null;
			try {
				parade = layer.property('ADBE Effect Parade');
			} catch (e) {
				return null;
			}
			return childByMatch(parade, matchName, 0);
		}

		// The rig controller's pseudo effect, WHATEVER version built it: the display
		// name has been "Verticalizer" since 1.0.0, and the match name has moved with
		// every control change, so the name is tried first and the parade is then
		// scanned for any "Pseudo/IVGD Verticalizer<n>" that is not the caption panel.
		function findRigEffect(layer) {
			var parade = null;
			try {
				parade = layer.property('ADBE Effect Parade');
			} catch (e) {
				return null;
			}
			var fx = propNamed(parade, EFFECT_NAME);
			if (fx !== null) {
				return fx;
			}
			try {
				for (var i = 1; i <= parade.numProperties; i++) {
					var it = parade.property(i);
					var mn = String(it.matchName);
					if (mn.indexOf('Pseudo/IVGD Verticalizer') === 0 && mn.indexOf('Cap') < 0) {
						return it;
					}
				}
			} catch (e2) {}
			return null;
		}

		function findCaptionEffect(layer) {
			var parade = null;
			try {
				parade = layer.property('ADBE Effect Parade');
			} catch (e) {
				return null;
			}
			var fx = propNamed(parade, CAPTION_EFFECT_NAME);
			if (fx !== null) {
				return fx;
			}
			try {
				for (var i = 1; i <= parade.numProperties; i++) {
					if (String(parade.property(i).matchName).indexOf('Pseudo/IVGD VerticalizerCap') === 0) {
						return parade.property(i);
					}
				}
			} catch (e2) {}
			return null;
		}

		// setValue is only ever allowed on a property carrying NO keyframes - the
		// repair's whole contract is that it cannot destroy a single key, and the
		// build never reaches a keyed property in the first place.
		function setStaticSafe(prop, value) {
			if (prop === null || prop === undefined) {
				return true;
			}
			try {
				if (prop.numKeys > 0) {
					return false;
				}
			} catch (e) {}
			try {
				prop.setValue(value);
			} catch (e2) {}
			return true;
		}

		function propHasKeys(prop) {
			if (prop === null || prop === undefined) {
				return false;
			}
			try {
				return prop.numKeys > 0;
			} catch (e) {}
			return false;
		}

		// After Effects' Drop Shadow "Opacity" is 0-255 in some versions and 0-100 in
		// others; the expression builders take the answer as a flag.
		function shadowIs255(op) {
			try {
				if (op !== null && op.hasMax && op.maxValue > 100.5) {
					return true;
				}
			} catch (e) {}
			return false;
		}

		//=====================================================================
		// WIRING (1.9.0)
		//
		// One wiring function per rig layer type, called BY the builder that creates
		// that layer and by repairRig() on a layer that already exists. That is the
		// whole point of the split: there is exactly one description of how a rig
		// layer is wired, so a repaired rig and a freshly built one cannot drift
		// apart.
		//
		// A wiring function only ever ASSIGNS EXPRESSIONS (setExprSafe) or writes a
		// static value through setStaticSafe, which refuses a keyed property. It
		// never adds, removes or moves a keyframe, and it never touches a property
		// the rig leaves free (a handle's Position, a PAN handle's Rotation, Time
		// Remap's keys), so running it over a rig the editor has animated is a
		// no-op everywhere except the expression fields.
		//=====================================================================

		// Every shape path in a glyph carries the "value" lock, which is what makes
		// dragging a handle move the LAYER instead of editing the glyph.
		function wireGlyphPaths(contents) {
			if (contents === null || contents === undefined) {
				return;
			}
			try {
				for (var i = 1; i <= contents.numProperties; i++) {
					var it = contents.property(i);
					if (it.matchName === 'ADBE Vector Shape - Group') {
						setExprSafe(propNamed(it, 'ADBE Vector Shape'), 'value');
					}
				}
			} catch (e) {}
		}

		function wireGlyphGroup(group, scaleExpr) {
			if (group === null) {
				return;
			}
			var gt = propNamed(group, 'ADBE Vector Transform Group');
			setExprSafe(propNamed(gt, 'ADBE Vector Scale'), scaleExpr);
			setExprSafe(propNamed(gt, 'ADBE Vector Rotation'), exprLockRotation());
			setExprSafe(propNamed(gt, 'ADBE Vector Position'), exprLockGlyphPosition());
			wireGlyphPaths(propNamed(group, 'ADBE Vectors Group'));
		}

		// Which opacity rule a handle gets is decided by its NAME, so the build and
		// the repair can never disagree about it.
		function isCaptionHandleName(name) {
			return /^Caption [0-9]+ Handle$/.test(String(name));
		}

		function handleOpacityExpr(name) {
			if (name === PIP_HANDLE_NAME) {
				return exprHandleOpacity('FX("PiP Transition") > 0');
			}
			if (isCaptionHandleName(name)) {
				return exprCaptionHandleOpacity(name);
			}
			if (name === 'CAPTION Handle') {
				return exprHandleOpacity('FX("Show Captions") == 1');
			}
			return exprHandleOpacity();
		}

		// lockRotation is FALSE for the two PAN handles and only for them: their
		// Rotation is the per-window footage rotation input, so it has to stay free.
		function wireHandleLayer(layer, lockRotation, opacityExpr) {
			wireGlyphGroup(shapeGroup(layer, 'Glyph'), exprHandleGlyphScale());
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprLockScale());
			if (lockRotation === true) {
				setExprSafe(propNamed(xform(layer), 'ADBE Rotate Z'), exprLockRotation());
			}
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), opacityExpr);
		}

		// The SPLIT handle's X rides the left rail so it tracks a comp resize; its Y
		// IS the split line and is never written. The X expression only exists while
		// the position dimensions are separated, and separating them re-writes the
		// position value (and every key on it), so a rig that somehow lost the switch
		// is reported rather than "fixed".
		function wireSplitHandleAxis(layer) {
			var separated = false;
			try {
				separated = xform(layer).property('ADBE Position').dimensionsSeparated === true;
			} catch (e) {
				separated = false;
			}
			if (!separated) {
				return false;
			}
			setExprSafe(propNamed(xform(layer), 'ADBE Position_0'), 'thisComp.width * 0.05');
			return true;
		}

		function wireCtrlLayer(layer) {
			wireGlyphGroup(shapeGroup(layer, 'Glyph'), exprCtrlGlyphScale());
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprLockScale());
			setExprSafe(propNamed(xform(layer), 'ADBE Rotate Z'), exprLockRotation());
		}

		function wireZNull(layer, positionExpr) {
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), positionExpr);
		}

		function wireMatte(layer, isTop, sizeExpr, positionExpr, sw, sh) {
			var gc = shapeGroupContents(layer, 'Win');
			normalizeShapeOrder(gc, 'Window', 'Hole');
			var win = findRect(gc, 'Window', 0);
			setExprSafe(rectSize(win), sizeExpr);
			setExprSafe(rectRoundness(win), exprCornerRadius(isTop));

			var hole = findRect(gc, 'Hole', 1);
			setExprSafe(rectSize(hole), exprHoleSize(isTop, sw, sh));
			setExprSafe(rectPosition(hole), exprHolePosition(isTop, sw, sh));
			setExprSafe(rectRoundness(hole), exprHoleRoundness(isTop));

			setExprSafe(propNamed(xform(layer), 'ADBE Position'), positionExpr);

			var blur = layerEffect(layer, 'ADBE Box Blur2');
			setExprSafe(fxProp(blur, 'ADBE Box Blur2-0001', 'Blur Radius'), exprEdgeFeather(isTop));
		}

		function wireCard(layer, isTop, sw, sh) {
			var gc = shapeGroupContents(layer, 'Card');
			normalizeShapeOrder(gc, 'Card Rect', 'Hole');
			var r = findRect(gc, 'Card Rect', 0);
			setExprSafe(rectSize(r), exprCardSize(isTop, sw, sh));
			setExprSafe(rectRoundness(r), exprCardRoundness(isTop));

			var hole = findRect(gc, 'Hole', 1);
			setExprSafe(rectSize(hole), exprHoleSize(isTop, sw, sh));
			setExprSafe(rectPosition(hole), exprHolePosition(isTop, sw, sh));
			setExprSafe(rectRoundness(hole), exprHoleRoundness(isTop));

			var f = childByMatch(gc, 'ADBE Vector Graphic - Fill', 0);
			setExprSafe(propNamed(f, 'ADBE Vector Fill Color'), exprCardColor(isTop));

			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprWindowCenter(isTop, sw, sh));
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprCardOpacity(isTop, sw, sh));

			var ds = layerEffect(layer, 'ADBE Drop Shadow');
			var op = fxProp(ds, 'ADBE Drop Shadow-0002', 'Opacity');
			setExprSafe(op, exprCardShadowOpacity(shadowIs255(op), isTop));
			setExprSafe(fxProp(ds, 'ADBE Drop Shadow-0003', 'Direction'), exprCardShadowDirection(isTop));
			setExprSafe(fxProp(ds, 'ADBE Drop Shadow-0004', 'Distance'), exprCardShadowDistance(isTop));
			setExprSafe(fxProp(ds, 'ADBE Drop Shadow-0005', 'Softness'), exprCardShadowSoftness(isTop));
			setStaticSafe(fxProp(ds, 'ADBE Drop Shadow-0006', 'Shadow Only'), 0);
		}

		function wireSourceLayer(layer, isTop, sw, sh) {
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprSourceScale(isTop, sw, sh));
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprSourcePosition(isTop, sw, sh));
			setExprSafe(propNamed(xform(layer), 'ADBE Rotate Z'), exprSourceRotation(isTop));
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprSourceOpacity(isTop));
			setAudioLevelsExpr(layer, exprSourceAudioLevels(isTop));
		}

		function wirePipShadow(layer, sw, sh) {
			var gc = shapeGroupContents(layer, 'Card');
			var r = findRect(gc, 'Card Rect', 0);
			setExprSafe(rectSize(r), exprPipShadowSize(sw, sh));
			setExprSafe(rectRoundness(r), exprPipShadowRoundness());
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprPipShadowPosition(sw, sh));
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprPipShadowLayerOpacity());

			var ds = layerEffect(layer, 'ADBE Drop Shadow');
			var op = fxProp(ds, 'ADBE Drop Shadow-0002', 'Opacity');
			setExprSafe(op, exprPipShadowOpacity(shadowIs255(op)));
			setExprSafe(fxProp(ds, 'ADBE Drop Shadow-0003', 'Direction'), exprPipShadowDirection());
			setExprSafe(fxProp(ds, 'ADBE Drop Shadow-0004', 'Distance'), exprPipShadowDistance());
			setExprSafe(fxProp(ds, 'ADBE Drop Shadow-0005', 'Softness'), exprPipShadowSoftness());
			setStaticSafe(fxProp(ds, 'ADBE Drop Shadow-0006', 'Shadow Only'), 1);
		}

		function wirePipShadowMatte(layer, sw, sh) {
			var gc = shapeGroupContents(layer, 'Cut');
			setExprSafe(rectSize(findRect(gc, 'Frame', 0)), exprCompSize());
			var card = findRect(gc, 'Card', 1);
			setExprSafe(rectSize(card), exprPipShadowSize(sw, sh));
			setExprSafe(rectPosition(card), exprPipMatteCardPosition(sw, sh));
			setExprSafe(rectRoundness(card), exprPipShadowRoundness());
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprCompCenter());
		}

		function wireDivider(layer) {
			var gc = shapeGroupContents(layer, 'Bar');
			setExprSafe(rectSize(findRect(gc, 'Bar Rect', 0)), exprDividerSize());
			var f = childByMatch(gc, 'ADBE Vector Graphic - Fill', 0);
			setExprSafe(propNamed(f, 'ADBE Vector Fill Color'), exprDividerColor());
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprDividerPosition());
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprDividerOpacity());
		}

		function wireBgVideo(layer, sw, sh) {
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprCompCenter());
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprBgScale(sw, sh));
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprBgOpacity());
			var blur = layerEffect(layer, 'ADBE Box Blur2');
			setExprSafe(fxProp(blur, 'ADBE Box Blur2-0001', 'Blur Radius'), exprBgBlur());
		}

		function wireBgDarken(layer) {
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprCompCenter());
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprSolidCoverScale());
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprBgDarkenOpacity());
		}

		function wireBgFill(layer) {
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprCompCenter());
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprSolidCoverScale());
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprBgFillOpacity());
			var ramp = layerEffect(layer, 'ADBE Ramp');
			setExprSafe(fxProp(ramp, 'ADBE Ramp-0002', 'Start Color'), exprBgFillStartColor());
			setExprSafe(fxProp(ramp, 'ADBE Ramp-0004', 'End Color'), exprBgFillEndColor());
		}

		// The bands are stated in ABSOLUTE comp coordinates, which is only true while
		// the layer's own transform is the identity - so the anchor / position / scale
		// zeroing is part of the wiring, not of the build.
		function wireSafeZones(layer) {
			var bands = [
				['Top Band', 'top'],
				['Bottom Band', 'bottom'],
				['Right Rail', 'right'],
				['Left Rail', 'left'],
				['Safe Rect', 'safe']
			];
			for (var i = 0; i < bands.length; i++) {
				var gc = shapeGroupContents(layer, bands[i][0]);
				var r = findRect(gc, 'Rect', 0);
				setExprSafe(rectSize(r), exprSafeSize(bands[i][1]));
				setExprSafe(rectPosition(r), exprSafePosition(bands[i][1]));
			}
			if (!propHasKeys(propNamed(xform(layer), 'ADBE Position'))) {
				try {
					xform(layer).property('ADBE Position').dimensionsSeparated = false;
				} catch (eSep) {}
			}
			setStaticSafe(propNamed(xform(layer), 'ADBE Anchor Point'), [0, 0]);
			setStaticSafe(propNamed(xform(layer), 'ADBE Position'), [0, 0]);
			setStaticSafe(propNamed(xform(layer), 'ADBE Scale'), [100, 100]);
			setStaticSafe(propNamed(xform(layer), 'ADBE Rotate Z'), 0);
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprSafeOpacity());
		}

		function wireCaptionText(layer, handleName) {
			var td = null;
			try {
				td = layer.property('ADBE Text Properties').property('ADBE Text Document');
			} catch (e) {
				td = null;
			}
			setExprSafe(td, exprCaptionSourceText(handleName));
			setExprSafe(propNamed(xform(layer), 'ADBE Position'), exprCaptionTextPosition(handleName));
			setExprSafe(propNamed(xform(layer), 'ADBE Scale'), exprCaptionTextScale(handleName));
			setExprSafe(propNamed(xform(layer), 'ADBE Opacity'), exprCaptionTextOpacity(handleName));
		}

		//=====================================================================
		// HANDLE BUILDERS
		//
		// Every handle is a guide layer holding one top-level group named "Glyph"
		// whose transform scale is driven by the "Handle Size" control. All glyph
		// geometry is built from free bezier paths so that every Path property can
		// carry the "value" lock expression.
		//=====================================================================

		function newHandleLayer(comp, name, label) {
			var L = comp.layers.addShape();
			L.name = name;
			L.guideLayer = true;
			L.label = label;
			return L;
		}

		// lockRotation is FALSE for the two PAN handles and only for them: their
		// Rotation is the per-window footage rotation input, so it has to stay
		// keyframeable. Every other transform lock applies to every handle.
		//
		// The wiring itself is wireHandleLayer(), shared with the repair pass, and
		// the opacity rule comes from the handle's NAME - so a rebuilt handle and a
		// repaired one are wired by the same two lines.
		function finishHandle(layer, glyphGroup, strokeColor, glyphContents, lockRotation) {
			// The stroke is added last so it sits below every path in the group and
			// therefore applies to all of them.
			addStroke(glyphContents, strokeColor, 4);
			wireHandleLayer(layer, lockRotation, handleOpacityExpr(layer.name));
		}

		function buildSplitHandle(comp) {
			var L = newHandleLayer(comp, 'SPLIT Handle', LBL_SPLIT);
			var g = addVGroup(contentsOf(L), 'Glyph');
			var gc = vContents(g);
			addLockedPath(gc, 'Pill', shapeRoundRect(120, 36, 18));
			addLockedPath(
				gc,
				'Arrow Up',
				shapePoly([
					[0, -46],
					[-14, -26],
					[14, -26]
				])
			);
			addLockedPath(
				gc,
				'Arrow Down',
				shapePoly([
					[0, 46],
					[-14, 26],
					[14, 26]
				])
			);
			finishHandle(L, g, COL_SPLIT, gc, true);

			// X is locked to the left rail (5% in, so it tracks a comp resize);
			// Y is the split line and stays free.
			xform(L).property('ADBE Position').dimensionsSeparated = true;
			xform(L).property('ADBE Position_1').setValue(CH / 2);
			wireSplitHandleAxis(L);
			return L;
		}

		function buildPanHandle(comp, name, color, label) {
			var L = newHandleLayer(comp, name, label);
			var g = addVGroup(contentsOf(L), 'Glyph');
			var gc = vContents(g);
			addLockedPath(gc, 'Ring', shapeEllipse(46, 46));
			addLockedPath(gc, 'Cross H', shapeLine(-32, 0, 32, 0));
			addLockedPath(gc, 'Cross V', shapeLine(0, -32, 0, 32));
			addLockedPath(gc, 'Dot', shapeEllipse(4, 4));
			// NO rotation lock: exprSourceRotation() reads this handle's Rotation as the
			// per-window footage rotation, so pinning it would kill window rotation.
			finishHandle(L, g, color, gc, false);
			return L;
		}

		// ownControls (1.6.0) gives this handle its own "Verticalizer Caption" pseudo
		// effect, which is what makes an added caption independent of the first one.
		// The effect has to go on FIRST for the same reason it does on the controller:
		// applyPreset (used by the registration path) invalidates property references
		// taken before it runs, so nothing else may exist on the layer yet.
		function buildCaptionHandle(comp, name, ownControls) {
			if (!name) {
				name = 'CAPTION Handle';
			}
			var L = comp.layers.addShape();
			L.name = name;
			if (ownControls === true) {
				var cfx = applyPseudoEffect(captionPseudoEffectData, L);
				try {
					cfx.name = CAPTION_EFFECT_NAME;
				} catch (eNm) {}
			}
			L.guideLayer = true;
			L.label = LBL_CAPTION;

			var g = addVGroup(contentsOf(L), 'Glyph');
			var gc = vContents(g);
			addLockedPath(gc, 'Plate', shapeRoundRect(84, 44, 10));
			addLockedPath(gc, 'Line 1', shapeLine(-26, -6, 26, -6));
			addLockedPath(gc, 'Line 2', shapeLine(-16, 8, 16, 8));
			// A caption handle is only an input while captions are on, so it hides
			// itself with them - the master "Show Handles" still wins. An owning
			// handle reads its OWN "Show Captions" (handleOpacityExpr picks that off
			// the "Caption NN Handle" name); the first caption's handle reads the
			// controller's.
			finishHandle(L, g, COL_CAPTION, gc, true);

			// Both axes are free - the caption block follows this handle exactly.
			// The initial spot is a build-time value; nothing drives it afterwards.
			try {
				xform(L).property('ADBE Position').dimensionsSeparated = false;
			} catch (eSep) {}
			setPosition(L, [CW / 2, CH * CAPTION_Y_RATIO]);
			return L;
		}

		// The PiP window centres itself on this handle. Like the caption handle it is a
		// free two-axis position with nothing driving it - the resolver reads it, so
		// dragging it moves the floating window, and only in proportion to PiP Transition.
		function buildPipHandle(comp) {
			var L = newHandleLayer(comp, PIP_HANDLE_NAME, LBL_PIP);
			var g = addVGroup(contentsOf(L), 'Glyph');
			var gc = vContents(g);
			addLockedPath(gc, 'Plate', shapeRoundRect(56, 34, 8));
			addLockedPath(gc, 'Tick TL', shapeLine(-36, -25, -28, -17));
			addLockedPath(gc, 'Tick TR', shapeLine(36, -25, 28, -17));
			addLockedPath(gc, 'Tick BR', shapeLine(36, 25, 28, 17));
			addLockedPath(gc, 'Tick BL', shapeLine(-36, 25, -28, 17));
			// The PIP handle only means something once the morph is engaged, so it
			// takes itself off the canvas at PiP Transition 0 instead of sitting there
			// as clutter over a plain split-screen (handleOpacityExpr, by name).
			finishHandle(L, g, COL_PIP, gc, true);

			try {
				xform(L).property('ADBE Position').dimensionsSeparated = false;
			} catch (eSep) {}
			// A build-time starting spot only, stated as a fraction of the build
			// dimensions so it lands in the same place at any comp size. No expression
			// drives it afterwards - it is the user's to move.
			setPosition(L, [CW * 0.72, CH * 0.25]);
			return L;
		}

		//=====================================================================
		// LAYER BUILDERS
		//=====================================================================

		function buildCtrlLayer(comp) {
			var L = comp.layers.addShape();
			L.name = CTRL_LAYER_NAME;

			// The pseudo effect goes on FIRST - applyPreset (used by the
			// registration path) invalidates property references obtained before
			// it runs, so nothing else may exist on this layer yet.
			var fx = applyPseudoEffect(pseudoEffectData, L);
			try {
				fx.name = EFFECT_NAME;
			} catch (e) {}

			L.guideLayer = true;
			L.label = LBL_CTRL;

			var g = addVGroup(contentsOf(L), 'Glyph');
			var gc = vContents(g);
			addLockedPath(gc, 'Tab', shapeRoundRect(28, 28, 6));
			addStroke(gc, COL_CTRL, 4);

			// Same transform pinning as the handles - the gizmo may be parked anywhere,
			// but it may not be scaled or rotated by a stray viewer gesture.
			wireCtrlLayer(L);

			setPosition(L, [24, 24]);
			// Deliberately NO opacity expression: the controller is the way back to
			// the controls and must stay visible even with Show Handles off.
			return L;
		}

		function buildZNull(comp, name, positionExpr) {
			var L = comp.layers.addNull(comp.duration);
			L.name = name;
			setSafe(xform(L).property('ADBE Anchor Point'), [0, 0]);
			setSafe(xform(L).property('ADBE Scale'), [100, 100]);
			setSafe(xform(L).property('ADBE Rotate Z'), 0);
			wireZNull(L, positionExpr);
			L.shy = true;
			// The nulls render nothing, so switching them off as well keeps the
			// comp viewer clean. Parenting and expression reads are unaffected.
			try {
				L.enabled = false;
			} catch (eEn) {}
			return L;
		}

		// Contents order is Window, Hole, Merge Paths (Subtract), Fill - built in that
		// order because addProperty() appends. A path operation acts on the paths ABOVE
		// it in the same group, so the Merge Paths consumes both rects and the Fill
		// then paints the single composite path it produces. The hole is [0, 0] on the
		// floating card, so on that layer the subtraction is a no-op by construction.
		function buildMatte(comp, name, isTop, sizeExpr, positionExpr, sw, sh) {
			var L = comp.layers.addShape();
			L.name = name;
			var g = addVGroup(contentsOf(L), 'Win');
			var gc = vContents(g);
			var r = addRect(gc, 'Window');
			rectPosition(r).setValue([0, 0]);

			addHoleAndSubtract(gc, 'Hole', 'Window');

			addFill(gc, [1, 1, 1], 100);

			var blur = L.property('ADBE Effect Parade').addProperty('ADBE Box Blur2');
			setSafe(fxProp(blur, 'ADBE Box Blur2-0002', 'Iterations'), 3);
			setSafe(fxProp(blur, 'ADBE Box Blur2-0004', 'Repeat Edge Pixels'), 0);

			wireMatte(L, isTop, sizeExpr, positionExpr, sw, sh);
			return L;
		}

		// Audio Levels lives outside the Transform group and only exists when the
		// source actually carries audio, so it is reached defensively.
		function setAudioLevelsExpr(layer, expr) {
			try {
				var ag = layer.property('ADBE Audio Group');
				if (ag) {
					var al = ag.property('ADBE Audio Levels');
					if (al) {
						al.expression = expr;
					}
				}
			} catch (e) {}
		}

		// Time remapping is enabled AND expressioned from 1.2.0: the footage layers end
		// the build locked, so keyframing Time Remap on the layer is no longer the way
		// in - "Top / Bottom Speed" and "Top / Bottom Time Offset" on the controller
		// are. Enabling Time Remap retimes the layer's out point, so the out point is
		// put back to the comp duration afterwards. A failure to enable it is reported
		// (the rig would otherwise look complete but ignore both Time controls).
		function enableTimeRemap(layer, comp, isTop, durSeconds) {
			var enabled = false;
			try {
				if (layer.canSetTimeRemapEnabled) {
					layer.timeRemapEnabled = true;
				}
				enabled = layer.timeRemapEnabled === true;
			} catch (e) {
				enabled = false;
			}
			if (!enabled) {
				notify(
					SCRIPT_NAME +
						'\n\nTime Remapping could not be enabled on "' +
						layer.name +
						'".\n\n' +
						'The "' +
						(isTop ? 'Top' : 'Bottom') +
						' Speed" and "' +
						(isTop ? 'Top' : 'Bottom') +
						' Time Offset" controls will have no effect on this window. ' +
						'The rest of the rig is unaffected.'
				);
				return false;
			}
			try {
				layer.outPoint = comp.duration;
			} catch (eOut) {}
			// The Time Remap keyframes After Effects creates when the switch is thrown
			// stay put; the expression simply overrides them.
			wireTimeRemap(layer, isTop, durSeconds);
			return true;
		}

		// The expression half of the above, on its own, because a repair must never
		// re-throw the Time Remap switch on a layer that already has it: enabling it
		// re-times the out point and stamps keyframes, and any USER keys on Time
		// Remap are the editor's, not the rig's. The expression overrides them all
		// without touching one of them.
		function wireTimeRemap(layer, isTop, durSeconds) {
			var tr = null;
			try {
				tr = layer.property('ADBE Time Remapping');
			} catch (eTr) {
				tr = null;
			}
			if (tr === null) {
				return false;
			}
			setExprSafe(tr, exprTimeRemap(isTop, durSeconds));
			return true;
		}

		// Bake the source length onto both "Source Frames" info sliders. These are
		// display-only readouts for the frames-based Time Offset, so a failure here
		// costs the editor a hint and nothing else - but it is reported rather than
		// swallowed, because a blank readout otherwise looks like a broken control.
		function bakeSourceFrames(ctrl, frames) {
			// ExtendScript reaches the effect through the parade (the "effect(...)"
			// form in the spec is expression syntax, which the DOM does not provide).
			var fx = null;
			var parade = null;
			try {
				parade = ctrl.property('ADBE Effect Parade');
			} catch (ePar) {
				parade = null;
			}
			if (parade !== null) {
				// By display name first (buildCtrlLayer renames the instance), then by
				// match name in case that rename was refused.
				try {
					fx = parade.property(EFFECT_NAME);
				} catch (eByName) {
					fx = null;
				}
				if (fx === null) {
					try {
						fx = parade.property(EFFECT_MATCH_NAME);
					} catch (eByMatch) {
						fx = null;
					}
				}
			}
			if (fx === null) {
				notify(
					SCRIPT_NAME +
						'\n\nCould not reach the "' +
						EFFECT_NAME +
						'" effect to fill in the "Top / Bottom Source Frames" readouts.\n\n' +
						'The rig is otherwise complete; the source is ' +
						frames +
						' frames long.'
				);
				return false;
			}
			var names = ['Top Source Frames', 'Bottom Source Frames'];
			var failed = [];
			for (var i = 0; i < names.length; i++) {
				var okOne = false;
				try {
					fx.property(names[i]).expression = exprSourceFrames(frames);
					okOne = true;
				} catch (eSet) {
					okOne = false;
				}
				if (!okOne) {
					failed.push(names[i]);
				}
			}
			if (failed.length > 0) {
				notify(
					SCRIPT_NAME +
						'\n\nCould not fill in the read-only info slider(s): ' +
						failed.join(', ') +
						'.\n\n' +
						'The rig is otherwise complete; the source is ' +
						frames +
						' frames long, which is the range "Top / Bottom Time Offset" ' +
						'addresses.'
				);
				return false;
			}
			return true;
		}

		function buildSourceLayer(comp, srcComp, name, isTop, sw, sh) {
			var L = comp.layers.add(srcComp);
			L.name = name;
			L.collapseTransformation = true;
			setSafe(xform(L).property('ADBE Anchor Point'), [sw / 2, sh / 2]);
			wireSourceLayer(L, isTop, sw, sh);
			return L;
		}

		// The card sits directly BELOW its window and draws the border ring plus the
		// drop shadow. Its rect is fully parametric, so there is no path to lock.
		function buildCard(comp, name, isTop, sw, sh) {
			var L = comp.layers.addShape();
			L.name = name;
			var g = addVGroup(contentsOf(L), 'Card');
			var gc = vContents(g);
			var r = addRect(gc, 'Card Rect');
			rectPosition(r).setValue([0, 0]);

			// 1.7.4: the card is a FILLED rect that relies on its own video to cover
			// everything but the border ring - and the PiP hole removes that video
			// from the background card, exposing the fill as a solid block (field
			// diagnosed: "the pane below clips the PiP window" was the background
			// card's fill showing through the matte hole). The card therefore
			// carries the SAME Window-minus-Hole subtract as its matte: live only
			// on the background card, [0,0] on the floating one.
			addHoleAndSubtract(gc, 'Hole', 'Card Rect');

			addFill(gc, [1, 1, 1], 100);
			L.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');

			wireCard(L, isTop, sw, sh);
			return L;
		}

		// The floating card's shadow, lifted out of the layer stack (see the PiP SHADOW
		// note above). Shadow Only is ON: this layer contributes the cast shadow and
		// nothing else, because TOP / BOT Card still draws the card itself.
		function buildPipShadow(comp, sw, sh) {
			var L = comp.layers.addShape();
			L.name = 'PiP Shadow';
			var g = addVGroup(contentsOf(L), 'Card');
			var gc = vContents(g);
			var r = addRect(gc, 'Card Rect');
			rectPosition(r).setValue([0, 0]);
			addFill(gc, [0, 0, 0], 100);
			L.property('ADBE Effect Parade').addProperty('ADBE Drop Shadow');

			wirePipShadow(L, sw, sh);
			return L;
		}

		// Alpha matte for "PiP Shadow": the whole comp minus the floating card's rect.
		// A track matte is applied AFTER the layer's effects, which is exactly what is
		// needed here - it clips the finished SHADOW, not the rect that casts it, so
		// the soft inner edge cannot spill back over the card.
		function buildPipShadowMatte(comp, sw, sh) {
			var L = comp.layers.addShape();
			L.name = 'PiP Shadow Matte';
			var g = addVGroup(contentsOf(L), 'Cut');
			var gc = vContents(g);
			var frame = addRect(gc, 'Frame');
			rectPosition(frame).setValue([0, 0]);

			addRect(gc, 'Card');

			var merge = gc.addProperty('ADBE Vector Filter - Merge');
			merge.name = 'Subtract Card';
			setSafe(merge.property('ADBE Vector Merge Type'), 3);

			addFill(gc, [1, 1, 1], 100);

			wirePipShadowMatte(L, sw, sh);
			return L;
		}

		function buildDivider(comp) {
			var L = comp.layers.addShape();
			L.name = 'Divider';
			var g = addVGroup(contentsOf(L), 'Bar');
			var gc = vContents(g);
			var r = addRect(gc, 'Bar Rect');
			rectPosition(r).setValue([0, 0]);
			addFill(gc, [1, 1, 1], 100);

			wireDivider(L);
			return L;
		}

		function buildBgVideo(comp, srcComp, name, sw, sh) {
			var L = comp.layers.add(srcComp);
			L.name = name;
			L.collapseTransformation = false;
			setSafe(xform(L).property('ADBE Anchor Point'), [sw / 2, sh / 2]);
			// The background instance never contributes sound - "Audio Source"
			// routes audio through the two window instances only.
			try {
				if (L.hasAudio) {
					L.audioEnabled = false;
				}
			} catch (eAud) {}

			var blur = L.property('ADBE Effect Parade').addProperty('ADBE Box Blur2');
			setSafe(fxProp(blur, 'ADBE Box Blur2-0002', 'Iterations'), 3);
			setSafe(fxProp(blur, 'ADBE Box Blur2-0004', 'Repeat Edge Pixels'), 1);

			wireBgVideo(L, sw, sh);
			return L;
		}

		function buildBgDarken(comp) {
			var L = comp.layers.addSolid([0, 0, 0], 'BG Darken', CW, CH, 1, comp.duration);
			// A solid cannot resize itself, so it is centred and cover-scaled from
			// its own dimensions instead - a comp resize still leaves it full frame.
			wireBgDarken(L);
			return L;
		}

		function buildBgFill(comp) {
			var L = comp.layers.addSolid([0.063, 0.063, 0.078], 'BG Fill', CW, CH, 1, comp.duration);
			var ramp = L.property('ADBE Effect Parade').addProperty('ADBE Ramp');
			setSafe(fxProp(ramp, 'ADBE Ramp-0001', 'Start of Ramp'), [CW / 2, 0]);
			setSafe(fxProp(ramp, 'ADBE Ramp-0003', 'End of Ramp'), [CW / 2, CH]);
			setSafe(fxProp(ramp, 'ADBE Ramp-0005', 'Ramp Shape'), 1); // linear ramp

			wireBgFill(L);
			return L;
		}

		function buildSafeZones(comp) {
			var L = comp.layers.addShape();
			L.name = 'Safe Zones';
			L.guideLayer = true;
			var contents = contentsOf(L);

			var bands = [
				['Top Band', 'top'],
				['Bottom Band', 'bottom'],
				['Right Rail', 'right'],
				['Left Rail', 'left']
			];
			for (var i = 0; i < bands.length; i++) {
				var g = addVGroup(contents, bands[i][0]);
				var gc = vContents(g);
				addRect(gc, 'Rect');
				addFill(gc, [1, 0.15, 0.15], 50);
			}

			var sg = addVGroup(contents, 'Safe Rect');
			var sgc = vContents(sg);
			addRect(sgc, 'Rect');
			addStroke(sgc, [0.2, 1, 0.4], 3);

			// Pin the layer so its layer space IS comp space: anchor and position are
			// static zeros (size-independent, so a comp resize cannot move them),
			// scale is 100 and there is deliberately NO transform expression. Every
			// band then states its own absolute comp rectangle and nothing about the
			// layer can put the overlay out of register.
			// Separated position dimensions would make the [0,0] write fail, and a
			// swallowed failure here is exactly the misplaced-overlay bug, so the
			// switch is cleared first (inside wireSafeZones, which is what the
			// repair pass runs too).
			wireSafeZones(L);
			// NOTE: the layer is locked at the very end of the build, once the
			// stacking pass has finished moving it - a locked layer cannot be moved.
			return L;
		}

		function buildCaptionText(comp, name, handleName) {
			var L = comp.layers.addText('Your caption here');
			L.name = name;
			var td = L.property('ADBE Text Properties').property('ADBE Text Document');
			var doc = td.value;
			try {
				doc.text = 'Your caption here';
			} catch (e1) {}
			try {
				doc.fontSize = 64;
			} catch (e2) {}
			try {
				doc.applyFill = true;
				doc.fillColor = [1, 1, 1];
			} catch (e3) {}
			try {
				doc.applyStroke = false;
			} catch (e4) {}
			try {
				doc.justification = ParagraphJustification.CENTER_JUSTIFY;
			} catch (e5) {}
			td.setValue(doc);

			wireCaptionText(L, handleName);
			return L;
		}

		function buildCaptionBox(comp, name, textLayerName, handleName) {
			var L = comp.layers.addShape();
			L.name = name;
			var g = addVGroup(contentsOf(L), 'Box');
			var gc = vContents(g);
			var r = addRect(gc, 'Box Rect');
			rectPosition(r).setValue([0, 0]);

			// Contents order ends up Rect / Stroke / Fill, which is exactly what the
			// shape tool produces: both operators apply to the path above them, and
			// the higher of the two (the stroke) draws on top of the fill.
			addStroke(gc, [1, 1, 1], 0);
			// Translucency is a property of the plate, not of the whole layer, so
			// the outline stays solid at any Box Opacity.
			addFill(gc, [0, 0, 0], 100);

			wireCaptionBox(L, textLayerName, handleName);
			return L;
		}

		// Re-point an existing caption box at a different caption text layer AND, from
		// 1.6.0, at a different control source. A duplicated box inherits the
		// original's expressions, so EVERY one of them has to be rewritten or the new
		// caption silently keeps reading the first caption's controls.
		function wireCaptionBox(boxLayer, textLayerName, handleName) {
			var gc = shapeGroupContents(boxLayer, 'Box');
			var r = findRect(gc, 'Box Rect', 0);
			setExprSafe(rectSize(r), exprCaptionBoxSize(textLayerName, handleName));
			setExprSafe(rectRoundness(r), exprCaptionBoxRoundness(handleName));
			setExprSafe(propNamed(xform(boxLayer), 'ADBE Position'), exprCaptionBoxPosition(textLayerName));
			setExprSafe(
				propNamed(xform(boxLayer), 'ADBE Opacity'),
				exprCaptionBoxOpacity(textLayerName, handleName)
			);

			// The plate colours and the outline live on the shape operators, not the
			// layer, so they need repointing too.
			var st = childByMatch(gc, 'ADBE Vector Graphic - Stroke', 0);
			var f = childByMatch(gc, 'ADBE Vector Graphic - Fill', 0);
			setExprSafe(propNamed(st, 'ADBE Vector Stroke Color'), exprCaptionBoxStrokeColor(handleName));
			setExprSafe(propNamed(st, 'ADBE Vector Stroke Width'), exprCaptionBoxStrokeWidth(handleName));
			setExprSafe(propNamed(f, 'ADBE Vector Fill Color'), exprCaptionBoxColor(handleName));
			setExprSafe(propNamed(f, 'ADBE Vector Fill Opacity'), exprCaptionBoxFillOpacity(handleName));
		}

		//=====================================================================
		// TRACK MATTE
		//=====================================================================

		function applyAlphaMatte(fillLayer, matteLayer) {
			var done = false;
			try {
				if (typeof fillLayer.setTrackMatte === 'function') {
					fillLayer.setTrackMatte(matteLayer, TrackMatteType.ALPHA);
					done = true;
				}
			} catch (e) {
				done = false;
			}
			if (!done) {
				// Legacy path: the matte must sit directly above the fill layer,
				// which the explicit ordering pass guarantees.
				try {
					fillLayer.trackMatteType = TrackMatteType.ALPHA;
				} catch (e2) {}
			}
		}

		//=====================================================================
		// SOURCE RESOLUTION
		//=====================================================================

		function resolveSource() {
			var sel = app.project.selection;
			var i;
			for (i = 0; i < sel.length; i++) {
				if (sel[i] instanceof CompItem) {
					return sel[i];
				}
			}
			for (i = 0; i < sel.length; i++) {
				if (sel[i] instanceof FootageItem && sel[i].hasVideo) {
					return sel[i];
				}
			}
			var act = app.project.activeItem;
			if (act && act instanceof CompItem) {
				var ls = act.selectedLayers;
				for (i = 0; i < ls.length; i++) {
					if (ls[i] instanceof AVLayer && ls[i].source) {
						return ls[i].source;
					}
				}
			}
			return null;
		}

		//=====================================================================
		// REPAIR / UPGRADE AN EXISTING RIG (1.9.0)
		//
		// Expressions break. A layer gets renamed, a property gets its expression
		// deleted by a stray paste, a project comes back from another machine with
		// half the rig disabled - and every one of those leaves a rig that looks
		// built but no longer behaves. Versions also move on: a rig built by 1.5.0
		// has no matte holes, no PiP shadow pair, no PIP handle and a 43-control
		// panel, and nothing short of rebuilding it used to close that gap.
		//
		// repairRig() closes both. It re-derives every expression from the SAME
		// builders a fresh build uses, adds the structural pieces the current
		// version expects, and replaces an out-of-date pseudo effect with the
		// current one, carrying the editor's values AND keyframes across by display
		// name. Two rules make it safe to run on real work:
		//
		//   1. It only ever touches layers it has INVENTORIED as rig layers. These
		//      comps are working comps - logos, titles, adjustment layers, an
		//      alternative take called "TOP Secret" - and none of that is the rig's
		//      business.
		//   2. It never destroys a keyframe. Wiring assigns expressions, which
		//      leaves keys untouched; the only setValue calls go through
		//      setStaticSafe, which refuses a keyed property; and the migration
		//      re-lays every captured key back down at its original time, value and
		//      interpolation. What it cannot map, it NAMES in the report instead of
		//      guessing.
		//=====================================================================

		// Every layer name the rig owns outright. Anything else in the comp is the
		// editor's, with one exception: the three source instances, which carry the
		// footage name and are recognised by shape instead (see below).
		var RIG_FIXED_NAMES = [
			CTRL_LAYER_NAME,
			'SPLIT Handle',
			'TOP PAN Handle',
			'BOT PAN Handle',
			PIP_HANDLE_NAME,
			'CAPTION Handle',
			'Z TOP',
			'Z BOT',
			'Safe Zones',
			'Divider',
			'BG Darken',
			'BG Fill',
			'PiP Shadow',
			'PiP Shadow Matte',
			'TOP Matte',
			'BOT Matte',
			'TOP Card',
			'BOT Card',
			'Caption Text',
			'Caption Box'
		];

		// The layers the build hides and write-protects, in build order. Named here
		// because the repair applies exactly the same pass at the end.
		var RIG_HIDDEN_NAMES = [
			'PiP Shadow',
			'PiP Shadow Matte',
			'TOP Matte',
			'BOT Matte',
			'TOP Card',
			'BOT Card',
			'Divider',
			'BG Fill',
			'BG Darken',
			'Caption Box',
			'Safe Zones',
			'Z TOP',
			'Z BOT'
		];

		function isRigFixedName(name) {
			for (var i = 0; i < RIG_FIXED_NAMES.length; i++) {
				if (RIG_FIXED_NAMES[i] === name) {
					return true;
				}
			}
			return false;
		}

		// A source instance is "TOP <name>" / "BOT <name>" / "BG <name>" AND an AV
		// layer whose source is a composition (the SRC precomp). Both halves are
		// load-bearing: "TOP Matte" and "TOP Card" are excluded by exact name, and a
		// text layer the editor called "TOP Secret" is excluded by shape, because it
		// is not an AV layer with a comp source.
		function isSourceInstanceLayer(layer) {
			var n = String(layer.name);
			if (isRigFixedName(n)) {
				return false;
			}
			if (n.indexOf('TOP ') !== 0 && n.indexOf('BOT ') !== 0 && n.indexOf('BG ') !== 0) {
				return false;
			}
			try {
				if (!(layer instanceof AVLayer)) {
					return false;
				}
			} catch (eAV) {
				return false;
			}
			var src = null;
			try {
				src = layer.source;
			} catch (eS) {
				src = null;
			}
			if (src === null || src === undefined) {
				return false;
			}
			try {
				return src instanceof CompItem;
			} catch (eC) {
				return false;
			}
		}

		// Inventory by NAME rather than by reference: registering a pseudo effect
		// goes through applyPreset, which invalidates every object taken before it,
		// so the repair re-fetches every layer from the comp at the moment it uses
		// it and the inventory is just a list of names.
		function inventoryRig(comp) {
			var inv = {
				names: [],
				has: {},
				captions: [],
				topName: null,
				botName: null,
				bgName: null,
				foreign: 0
			};
			var i;
			for (i = 1; i <= comp.numLayers; i++) {
				var L = comp.layer(i);
				var n = String(L.name);
				var claimed = false;
				if (isRigFixedName(n)) {
					claimed = true;
				} else if (/^Caption [0-9]+ (Text|Box|Handle)$/.test(n)) {
					claimed = true;
				} else if (isSourceInstanceLayer(L)) {
					claimed = true;
					if (n.indexOf('TOP ') === 0 && inv.topName === null) {
						inv.topName = n;
					} else if (n.indexOf('BOT ') === 0 && inv.botName === null) {
						inv.botName = n;
					} else if (n.indexOf('BG ') === 0 && inv.bgName === null) {
						inv.bgName = n;
					}
				}
				if (!claimed) {
					inv.foreign++;
					continue;
				}
				if (inv.has['#' + n] !== true) {
					inv.has['#' + n] = true;
					inv.names.push(n);
				}
			}
			if (inv.has['#Caption Text'] === true) {
				inv.captions.push({ text: 'Caption Text', box: 'Caption Box', handle: null });
			}
			for (i = 0; i < inv.names.length; i++) {
				var m = /^Caption ([0-9]+) Text$/.exec(inv.names[i]);
				if (m !== null) {
					inv.captions.push({
						text: inv.names[i],
						box: 'Caption ' + m[1] + ' Box',
						handle: 'Caption ' + m[1] + ' Handle'
					});
				}
			}
			return inv;
		}

		// ------------------------------------------------------------------
		// PSEUDO EFFECT MIGRATION
		//
		// A pseudo effect is a DEFINITION, not a container: the only way to move a
		// rig from a 43-control panel to a 69-control one is to delete the instance
		// and add an instance of the new definition. Everything the editor set on
		// the old one - static values, keyframes, expressions - therefore has to be
		// captured first and laid back down afterwards, addressed by DISPLAY NAME,
		// because the display name is also what every expression in the rig uses.
		// ------------------------------------------------------------------

		// Controls that changed name between versions. A rename is the only thing
		// that may be inferred; anything else that has no target is reported by
		// name, never guessed at.
		var CONTROL_RENAMES = [['PiP Amount', 'PiP Transition']];

		function renamedControl(name) {
			for (var i = 0; i < CONTROL_RENAMES.length; i++) {
				if (CONTROL_RENAMES[i][0] === name) {
					return CONTROL_RENAMES[i][1];
				}
			}
			return name;
		}

		// An effect's parameters are a FLAT list in After Effects - the group markers
		// in a pseudo effect are parameters too - so one pass reads every control.
		// Group markers carry no value and no keys and simply fall through.
		function captureEffectControls(fx) {
			var out = [];
			if (fx === null || fx === undefined) {
				return out;
			}
			var count = 0;
			try {
				count = fx.numProperties;
			} catch (eN) {
				count = 0;
			}
			for (var i = 1; i <= count; i++) {
				var p = null;
				try {
					p = fx.property(i);
				} catch (eP) {
					p = null;
				}
				if (p === null || p === undefined) {
					continue;
				}
				var rec = { name: '', value: null, hasValue: false, keys: [], expr: '', modified: false };
				try {
					rec.name = String(p.name);
				} catch (eNm) {
					continue;
				}
				try {
					rec.modified = p.isModified === true;
				} catch (eMod) {
					rec.modified = false;
				}
				try {
					if (typeof p.expression === 'string') {
						rec.expr = p.expression;
					}
				} catch (eEx) {
					rec.expr = '';
				}
				var nk = 0;
				try {
					nk = p.numKeys;
				} catch (eK) {
					nk = 0;
				}
				if (nk > 0) {
					for (var k = 1; k <= nk; k++) {
						var key = { t: 0, v: null, inT: null, outT: null };
						try {
							key.t = p.keyTime(k);
							key.v = p.keyValue(k);
						} catch (eKV) {
							continue;
						}
						try {
							key.inT = p.keyInInterpolationType(k);
							key.outT = p.keyOutInterpolationType(k);
						} catch (eIn) {}
						rec.keys.push(key);
					}
				} else {
					try {
						rec.value = p.value;
						rec.hasValue = true;
					} catch (eV) {
						rec.hasValue = false;
					}
				}
				out.push(rec);
			}
			return out;
		}

		// Lay a capture back down on a fresh instance. Keyframed controls are rebuilt
		// key by key at their original time, value and interpolation (a popup or a
		// checkbox is a HOLD control and stays HOLD, because its captured
		// interpolation says so); everything else is a single setValue.
		function restoreEffectControls(fx, captured, rep, where) {
			for (var i = 0; i < captured.length; i++) {
				var rec = captured[i];
				var target = propNamed(fx, renamedControl(rec.name));
				if (target === null) {
					// A group marker with nothing on it is not a loss; a control the
					// editor actually touched is, and it is NAMED rather than mapped
					// onto whatever looks closest.
					if (rec.keys.length > 0 || rec.modified === true) {
						rep.unmapped.push(where + ': "' + rec.name + '"');
					}
					continue;
				}
				var restored = false;
				if (rec.keys.length > 0) {
					var laid = 0;
					for (var k = 0; k < rec.keys.length; k++) {
						try {
							target.setValueAtTime(rec.keys[k].t, rec.keys[k].v);
							laid++;
						} catch (eSet) {}
					}
					for (var j = 0; j < rec.keys.length; j++) {
						if (rec.keys[j].inT === null) {
							continue;
						}
						try {
							target.setInterpolationTypeAtKey(j + 1, rec.keys[j].inT, rec.keys[j].outT);
						} catch (eInt) {}
					}
					if (laid > 0) {
						rep.keyed++;
						rep.keys += laid;
						restored = true;
					}
				} else if (rec.hasValue) {
					try {
						target.setValue(rec.value);
						restored = true;
					} catch (eVal) {
						rep.failed.push(where + ': "' + rec.name + '"');
					}
				}
				if (rec.expr !== '') {
					try {
						target.expression = rec.expr;
						restored = true;
					} catch (eE) {}
				}
				if (restored) {
					rep.migrated++;
				}
			}
		}

		// Bring one pseudo-effect instance up to the current definition, or leave it
		// exactly as it is when it already IS the current one - which is the common
		// case and the one that must not cost the editor a single value.
		//
		// finder resolves the instance whatever version applied it (the match name
		// moves, the display name does not).
		function upgradePseudoEffect(comp, layerName, data, finder, rep) {
			var L = getLayerByName(comp, layerName);
			if (L === null) {
				return null;
			}
			var fx = finder(L);
			if (fx !== null && hasPseudoControl(fx, data.probe)) {
				// Current definition: the values and keyframes already live on it,
				// so nothing is captured, deleted or re-applied.
				try {
					if (String(fx.name) !== data.name) {
						fx.name = data.name;
					}
				} catch (eName) {}
				return fx;
			}
			var captured = fx === null ? [] : captureEffectControls(fx);
			// Registration replays a preset onto a throwaway layer, which invalidates
			// every property reference taken before it - including fx and L. Nothing
			// captured above is read again, and both are re-fetched below.
			registerPseudoEffect(data);
			L = getLayerByName(comp, layerName);
			if (L === null) {
				throw new Error('"' + layerName + '" disappeared while the effect was being registered.');
			}
			var old = finder(L);
			if (old !== null) {
				try {
					old.remove();
				} catch (eRem) {
					throw new Error('Could not remove the out-of-date "' + data.name + '" effect from "' + layerName + '".');
				}
			}
			var fresh = L.property('ADBE Effect Parade').addProperty(data.matchName);
			try {
				fresh.name = data.name;
			} catch (eNm) {}
			restoreEffectControls(fresh, captured, rep, layerName);
			rep.effects++;
			return fresh;
		}

		// ------------------------------------------------------------------
		// STRUCTURAL COMPLETION
		//
		// Only what is MISSING, and always through the builder that makes it during
		// a fresh build, so a piece added by a repair is the same piece.
		// ------------------------------------------------------------------

		function ensureHole(comp, layerName, groupName, rep) {
			var L = getLayerByName(comp, layerName);
			if (L === null) {
				return false;
			}
			var gc = shapeGroupContents(L, groupName);
			if (gc === null || propNamed(gc, 'Hole') !== null) {
				return false;
			}
			addHoleAndSubtract(gc, 'Hole', groupName === 'Win' ? 'Window' : 'Card Rect');
			rep.added.push(layerName + ' PiP hole + Subtract');
			return true;
		}

		function ensurePipShadowPair(comp, sw, sh, rep) {
			if (getLayerByName(comp, 'PiP Shadow') !== null && getLayerByName(comp, 'PiP Shadow Matte') !== null) {
				return false;
			}
			try {
				var stale = getLayerByName(comp, 'PiP Shadow');
				if (stale !== null) {
					stale.locked = false;
					stale.remove();
				}
				var staleMatte = getLayerByName(comp, 'PiP Shadow Matte');
				if (staleMatte !== null) {
					staleMatte.locked = false;
					staleMatte.remove();
				}
			} catch (eHalf) {}

			var shadow = buildPipShadow(comp, sw, sh);
			var matte = buildPipShadowMatte(comp, sw, sh);
			// Directly above the TOP Matte assembly, which is where the build puts
			// the pair and the only place it is above BOTH cards.
			var anchor = getLayerByName(comp, 'TOP Matte');
			if (anchor !== null) {
				try {
					shadow.moveBefore(anchor);
					matte.moveBefore(shadow);
				} catch (eMove) {}
			}
			applyAlphaMatte(shadow, matte);
			rep.added.push('PiP Shadow + PiP Shadow Matte');
			return true;
		}

		function ensurePipHandle(comp, rep) {
			if (getLayerByName(comp, PIP_HANDLE_NAME) !== null) {
				return false;
			}
			var L = buildPipHandle(comp);
			var anchor = getLayerByName(comp, 'BOT PAN Handle');
			try {
				if (anchor !== null) {
					L.moveAfter(anchor);
				} else {
					L.moveToBeginning();
				}
			} catch (eMove) {}
			rep.added.push(PIP_HANDLE_NAME);
			return true;
		}

		// The PAN handles hang off shy, disabled nulls whose position IS the window
		// centre. Re-parenting through the .parent setter preserves the handle's
		// appearance by re-writing its position value - which is exactly why a
		// KEYFRAMED handle position is left alone and reported instead: rewriting it
		// would rewrite every one of the editor's pan keys.
		function ensureZNulls(comp, sw, sh, rep) {
			var made = false;
			if (getLayerByName(comp, 'Z BOT') === null) {
				var zb = buildZNull(comp, 'Z BOT', exprZBotPosition(sw, sh));
				placeZNull(comp, zb);
				rep.added.push('Z BOT');
				made = true;
			}
			if (getLayerByName(comp, 'Z TOP') === null) {
				var zt = buildZNull(comp, 'Z TOP', exprZTopPosition(sw, sh));
				placeZNull(comp, zt);
				rep.added.push('Z TOP');
				made = true;
			}
			if (!made) {
				return false;
			}
			reparentPanHandle(comp, 'TOP PAN Handle', 'Z TOP', rep);
			reparentPanHandle(comp, 'BOT PAN Handle', 'Z BOT', rep);
			return true;
		}

		function placeZNull(comp, znull) {
			var anchor = getLayerByName(comp, 'Safe Zones');
			try {
				if (anchor !== null) {
					znull.moveBefore(anchor);
				}
			} catch (eMove) {}
		}

		function reparentPanHandle(comp, handleName, nullName, rep) {
			var H = getLayerByName(comp, handleName);
			var Z = getLayerByName(comp, nullName);
			if (H === null || Z === null) {
				return false;
			}
			try {
				if (H.parent !== null && H.parent !== undefined) {
					return false;
				}
			} catch (eP) {}
			if (propHasKeys(propNamed(xform(H), 'ADBE Position'))) {
				rep.warnings.push(
					'"' +
						handleName +
						'" was NOT parented to "' +
						nullName +
						'" - its Position is keyframed, and parenting would have re-written every one of those keys. ' +
						'Parent it by hand (with the keys where you want them) if you want per-window pan nulls.'
				);
				return false;
			}
			try {
				H.parent = Z;
			} catch (eSet) {
				rep.warnings.push('"' + handleName + '" could not be parented to "' + nullName + '".');
				return false;
			}
			return true;
		}

		// ------------------------------------------------------------------
		// THE REPAIR ITSELF
		// ------------------------------------------------------------------

		function repairRig(comp) {
			var inv = inventoryRig(comp);
			var srcName = inv.topName !== null ? inv.topName : inv.botName !== null ? inv.botName : inv.bgName;
			if (srcName === null) {
				notify(
					SCRIPT_NAME +
						'\n\n"' +
						comp.name +
						'" has a "' +
						CTRL_LAYER_NAME +
						'" layer but no source layers\n("TOP ...", "BOT ..." or "BG ..." pointing at a SRC precomp).\n\n' +
						'There is nothing to re-wire the rig against, so nothing was changed. ' +
						'Build a new rig from the source instead.'
				);
				return false;
			}
			var srcLayer = getLayerByName(comp, srcName);
			var src = srcLayer === null ? null : srcLayer.source;
			if (src === null || src === undefined) {
				notify(SCRIPT_NAME + '\n\nThe rig\'s source layer "' + srcName + '" has lost its source. Nothing was changed.');
				return false;
			}
			var sw = src.width;
			var sh = src.height;
			var dur = src.duration;
			if (!dur || dur <= 0) {
				dur = comp.duration;
			}

			var rep = {
				layers: 0,
				exprs: 0,
				exprFails: 0,
				effects: 0,
				migrated: 0,
				keyed: 0,
				keys: 0,
				unmapped: [],
				failed: [],
				added: [],
				warnings: []
			};
			var undoGroupOpen = false;
			var savedCW = CW;
			var savedCH = CH;
			var exprBefore = exprWriteCount;
			var exprFailBefore = exprFailCount;
			try {
				app.beginUndoGroup('Verticalizer: Repair Rig');
				undoGroupOpen = true;

				try {
					if (app.project.expressionEngine !== 'javascript-1.0') {
						app.project.expressionEngine = 'javascript-1.0';
					}
				} catch (engineErr) {}

				// Any piece the repair BUILDS is seeded from the comp it is going
				// into, not from whatever size the panel happens to be showing.
				CW = comp.width;
				CH = comp.height;

				// ---- unlock (a locked layer refuses every write below) -----------
				var flags = [];
				var i;
				for (i = 0; i < inv.names.length; i++) {
					var LU = getLayerByName(comp, inv.names[i]);
					if (LU === null) {
						continue;
					}
					var f = { name: inv.names[i], locked: false, shy: false };
					try {
						f.locked = LU.locked === true;
					} catch (eL) {}
					try {
						f.shy = LU.shy === true;
					} catch (eS) {}
					try {
						LU.locked = false;
					} catch (eU) {}
					flags.push(f);
				}

				// ---- pseudo effects ---------------------------------------------
				upgradePseudoEffect(comp, CTRL_LAYER_NAME, pseudoEffectData, findRigEffect, rep);
				for (i = 0; i < inv.captions.length; i++) {
					var hName = inv.captions[i].handle;
					if (hName === null || getLayerByName(comp, hName) === null) {
						continue;
					}
					if (findCaptionEffect(getLayerByName(comp, hName)) === null) {
						continue;
					}
					upgradePseudoEffect(comp, hName, captionPseudoEffectData, findCaptionEffect, rep);
				}
				// Registration invalidates references, so the inventory is retaken
				// against the comp as it now stands (which also picks up nothing new -
				// it is the layer OBJECTS that went stale, not the names).
				inv = inventoryRig(comp);

				// ---- structural completion ---------------------------------------
				ensureHole(comp, 'TOP Matte', 'Win', rep);
				ensureHole(comp, 'BOT Matte', 'Win', rep);
				ensureHole(comp, 'TOP Card', 'Card', rep);
				ensureHole(comp, 'BOT Card', 'Card', rep);
				ensurePipShadowPair(comp, sw, sh, rep);
				ensurePipHandle(comp, rep);
				ensureZNulls(comp, sw, sh, rep);

				// ---- re-wire everything -------------------------------------------
				rep.layers = rewireRig(comp, inv, sw, sh, dur, rep);

				// ---- lock + shy hygiene, exactly as the build leaves it ------------
				for (i = 0; i < flags.length; i++) {
					var LR = getLayerByName(comp, flags[i].name);
					if (LR === null) {
						continue;
					}
					try {
						LR.shy = flags[i].shy;
					} catch (eS2) {}
					try {
						LR.locked = flags[i].locked;
					} catch (eL2) {}
				}
				var hidden = RIG_HIDDEN_NAMES.concat([]);
				if (inv.topName !== null) {
					hidden.push(inv.topName);
				}
				if (inv.botName !== null) {
					hidden.push(inv.botName);
				}
				if (inv.bgName !== null) {
					hidden.push(inv.bgName);
				}
				for (i = 0; i < inv.captions.length; i++) {
					if (inv.captions[i].handle !== null) {
						hidden.push(inv.captions[i].box);
					}
				}
				for (i = 0; i < hidden.length; i++) {
					var LH = getLayerByName(comp, hidden[i]);
					if (LH === null) {
						continue;
					}
					try {
						LH.shy = true;
					} catch (eShy) {}
					try {
						LH.locked = true;
					} catch (eLock) {}
				}
				comp.hideShyLayers = true;

				app.endUndoGroup();
				undoGroupOpen = false;
			} catch (error) {
				CW = savedCW;
				CH = savedCH;
				if (undoGroupOpen) {
					app.endUndoGroup();
					// 16 = Edit > Undo. A half-repaired rig is worse than a broken
					// one, so the whole pass goes back.
					try {
						app.executeCommand(16);
					} catch (eUndo) {}
				}
				notify(
					SCRIPT_NAME +
						'\n\nCould not repair the rig - every change was undone.\n\n' +
						error.toString() +
						(error.line ? '\n(line ' + error.line + ')' : '')
				);
				return false;
			}
			CW = savedCW;
			CH = savedCH;
			rep.exprs = exprWriteCount - exprBefore;
			rep.exprFails = exprFailCount - exprFailBefore;
			notify(repairReport(comp, inv, rep));
			return (
				rep.unmapped.length === 0 &&
				rep.failed.length === 0 &&
				rep.warnings.length === 0 &&
				rep.exprFails === 0
			);
		}

		// Every expression the rig owns, re-derived from the builders. Returns the
		// number of rig layers that were re-wired.
		function rewireRig(comp, inv, sw, sh, dur, rep) {
			var n = 0;
			var L;

			L = getLayerByName(comp, CTRL_LAYER_NAME);
			if (L !== null) {
				wireCtrlLayer(L);
				n++;
			}

			var handles = [
				['SPLIT Handle', true],
				['TOP PAN Handle', false],
				['BOT PAN Handle', false],
				[PIP_HANDLE_NAME, true],
				['CAPTION Handle', true]
			];
			var i;
			for (i = 0; i < inv.captions.length; i++) {
				if (inv.captions[i].handle !== null) {
					handles.push([inv.captions[i].handle, true]);
				}
			}
			for (i = 0; i < handles.length; i++) {
				L = getLayerByName(comp, handles[i][0]);
				if (L === null) {
					continue;
				}
				wireHandleLayer(L, handles[i][1], handleOpacityExpr(handles[i][0]));
				if (handles[i][0] === 'SPLIT Handle' && !wireSplitHandleAxis(L)) {
					rep.warnings.push(
						'"SPLIT Handle" has its Position dimensions joined, so the X rail expression was not ' +
							'restored (separating them would re-write the position and any keys on it). ' +
							'Right click its Position > Separate Dimensions and repair again to get it back.'
					);
				}
				n++;
			}

			L = getLayerByName(comp, 'Z TOP');
			if (L !== null) {
				wireZNull(L, exprZTopPosition(sw, sh));
				n++;
			}
			L = getLayerByName(comp, 'Z BOT');
			if (L !== null) {
				wireZNull(L, exprZBotPosition(sw, sh));
				n++;
			}

			L = getLayerByName(comp, 'TOP Matte');
			if (L !== null) {
				wireMatte(L, true, exprWindowSize(true, sw, sh), exprWindowCenter(true, sw, sh), sw, sh);
				n++;
			}
			L = getLayerByName(comp, 'BOT Matte');
			if (L !== null) {
				wireMatte(L, false, exprWindowSize(false, sw, sh), exprWindowCenter(false, sw, sh), sw, sh);
				n++;
			}
			L = getLayerByName(comp, 'TOP Card');
			if (L !== null) {
				wireCard(L, true, sw, sh);
				n++;
			}
			L = getLayerByName(comp, 'BOT Card');
			if (L !== null) {
				wireCard(L, false, sw, sh);
				n++;
			}

			var sources = [
				[inv.topName, true],
				[inv.botName, false]
			];
			for (i = 0; i < sources.length; i++) {
				if (sources[i][0] === null) {
					continue;
				}
				L = getLayerByName(comp, sources[i][0]);
				if (L === null) {
					continue;
				}
				wireSourceLayer(L, sources[i][1], sw, sh);
				// Time Remap is only ENABLED when it is off; when it is already on,
				// only the expression is written, so the editor's own remap keys and
				// the layer's out point are left exactly where they are.
				var remapped = false;
				try {
					remapped = L.timeRemapEnabled === true;
				} catch (eTR) {
					remapped = false;
				}
				if (remapped) {
					wireTimeRemap(L, sources[i][1], dur);
				} else if (enableTimeRemap(L, comp, sources[i][1], dur)) {
					rep.added.push(sources[i][0] + ' Time Remapping');
				}
				n++;
			}

			L = getLayerByName(comp, 'PiP Shadow');
			if (L !== null) {
				wirePipShadow(L, sw, sh);
				n++;
			}
			L = getLayerByName(comp, 'PiP Shadow Matte');
			if (L !== null) {
				wirePipShadowMatte(L, sw, sh);
				n++;
			}
			L = getLayerByName(comp, 'Divider');
			if (L !== null) {
				wireDivider(L);
				n++;
			}
			if (inv.bgName !== null) {
				L = getLayerByName(comp, inv.bgName);
				if (L !== null) {
					wireBgVideo(L, sw, sh);
					n++;
				}
			}
			L = getLayerByName(comp, 'BG Darken');
			if (L !== null) {
				wireBgDarken(L);
				n++;
			}
			L = getLayerByName(comp, 'BG Fill');
			if (L !== null) {
				wireBgFill(L);
				n++;
			}
			L = getLayerByName(comp, 'Safe Zones');
			if (L !== null) {
				wireSafeZones(L);
				n++;
			}

			for (i = 0; i < inv.captions.length; i++) {
				var cap = inv.captions[i];
				L = getLayerByName(comp, cap.text);
				if (L !== null) {
					wireCaptionText(L, cap.handle === null ? undefined : cap.handle);
					n++;
				}
				L = getLayerByName(comp, cap.box);
				if (L !== null) {
					wireCaptionBox(L, cap.text, cap.handle === null ? undefined : cap.handle);
					n++;
				}
			}

			// The read-only "Source Frames" readouts are baked, not typed, so they
			// are re-baked from the source the rig actually points at.
			var ctrl = getLayerByName(comp, CTRL_LAYER_NAME);
			if (ctrl !== null) {
				bakeSourceFrames(ctrl, Math.round(dur / comp.frameDuration));
			}
			return n;
		}

		function repairReport(comp, inv, rep) {
			var msg =
				SCRIPT_NAME +
				'\n\nRepaired "' +
				comp.name +
				'".\n\n' +
				'Rig layers re-wired: ' +
				rep.layers +
				'\n' +
				'Expressions written: ' +
				rep.exprs +
				'\n' +
				'Layers left untouched (not part of the rig): ' +
				inv.foreign +
				'\n' +
				'Control panels upgraded: ' +
				rep.effects;
			if (rep.effects > 0) {
				msg +=
					'\nControls carried over: ' +
					rep.migrated +
					' (' +
					rep.keyed +
					' keyframed, ' +
					rep.keys +
					' keyframes preserved)';
			}
			if (rep.exprFails > 0) {
				msg +=
					'\n\n' +
					rep.exprFails +
					' expression(s) had nowhere to go - the property they drive is missing from this rig ' +
					'(a deleted effect or shape group). Those parts of the rig are still not driven.';
			}
			if (rep.added.length > 0) {
				msg += '\n\nAdded (was missing):\n  - ' + rep.added.join('\n  - ');
			}
			if (rep.unmapped.length > 0) {
				msg +=
					'\n\nThese controls had a value or keyframes but no equivalent in the current ' +
					'panel, so nothing was guessed - set them again by hand:\n  - ' +
					rep.unmapped.join('\n  - ');
			}
			if (rep.failed.length > 0) {
				msg += '\n\nCould not be restored (value out of range for the new control):\n  - ' + rep.failed.join('\n  - ');
			}
			if (rep.warnings.length > 0) {
				msg += '\n\nWarnings:\n  - ' + rep.warnings.join('\n  - ');
			}
			if (
				rep.unmapped.length === 0 &&
				rep.failed.length === 0 &&
				rep.warnings.length === 0 &&
				rep.exprFails === 0
			) {
				msg += '\n\nEvery keyframe in the rig was preserved.';
			}
			return msg;
		}

		// ------------------------------------------------------------------
		// THE FORK
		//
		// "Create Portrait Rig" pressed on a comp that already holds a rig almost
		// never means "build a second one on top of this": it means the rig is
		// broken, or it is old. The choice is put to the editor before anything is
		// resolved, created or undone.
		// ------------------------------------------------------------------

		function findExistingRigComp() {
			var act = app.project.activeItem;
			if (act && act instanceof CompItem && getLayerByName(act, CTRL_LAYER_NAME) !== null) {
				return act;
			}
			var sel = app.project.selection;
			for (var i = 0; i < sel.length; i++) {
				if (sel[i] instanceof CompItem && getLayerByName(sel[i], CTRL_LAYER_NAME) !== null) {
					return sel[i];
				}
			}
			return null;
		}

		// 1.9.1: the rig comp is only ever the ACTIVE item when the editor is already
		// looking at it. The far more common way to land here is the build workflow -
		// select the source footage, press the button - and that silently produced a
		// second rig ("<name> v2") for a source that already had one. So when nothing
		// is active, the project is searched for rigs BUILT FROM THIS SOURCE: a rig
		// whose SRC precomp contains it.
		function rigUsesSource(rigComp, src) {
			for (var i = 1; i <= rigComp.numLayers; i++) {
				var mid = null;
				try {
					mid = rigComp.layer(i).source;
				} catch (eSrc) {
					mid = null;
				}
				if (mid === null || !(mid instanceof CompItem)) {
					continue;
				}
				if (mid === src) {
					return true;
				}
				for (var j = 1; j <= mid.numLayers; j++) {
					var inner = null;
					try {
						inner = mid.layer(j).source;
					} catch (eIn) {
						inner = null;
					}
					if (inner === src) {
						return true;
					}
				}
			}
			return false;
		}

		function findRigCompsForSource(src) {
			var out = [];
			if (src === null) {
				return out;
			}
			var items = app.project.items;
			for (var i = 1; i <= items.length; i++) {
				var it = items[i];
				if (!(it instanceof CompItem)) {
					continue;
				}
				if (getLayerByName(it, CTRL_LAYER_NAME) === null) {
					continue;
				}
				if (rigUsesSource(it, src)) {
					out.push(it);
				}
			}
			return out;
		}

		// 'repair' | 'new' | 'cancel'. A headless run builds fresh unless
		// $.global.VERTICALIZER_REPAIR asks for the repair, so the autorun
		// regression path is unchanged.
		function askRigAction(comp, fromSource) {
			if ($.global.VERTICALIZER_REPAIR === true) {
				return 'repair';
			}
			if ($.global.VERTICALIZER_AUTORUN === true || $.global.VERTICALIZER_SILENT === true) {
				return 'new';
			}
			var choice = 'cancel';
			try {
				var w = new Window('dialog', SCRIPT_NAME);
				w.orientation = 'column';
				w.alignChildren = ['fill', 'top'];
				w.spacing = 8;
				w.margins = 14;
				var msg = w.add(
					'statictext',
					undefined,
					'"' +
						comp.name +
						(fromSource
							? '" was already built from this source.\n\n'
							: '" already contains a Verticalizer rig.\n\n') +
						'Re-apply / Upgrade Rig re-writes every expression on the rig layers, adds anything ' +
						'this version expects and is missing, and upgrades an older control panel - keeping ' +
						'your keyframes and leaving your own layers alone.\n\n' +
						'Create New Rig ignores it and builds another one from the selected source.',
					{ multiline: true }
				);
				msg.characters = 58;
				var repairBtn = w.add('button', undefined, 'Re-apply / Upgrade Rig');
				var newBtn = w.add('button', undefined, 'Create New Rig');
				var cancelBtn = w.add('button', undefined, 'Cancel', { name: 'cancel' });
				repairBtn.onClick = function () {
					choice = 'repair';
					w.close();
				};
				newBtn.onClick = function () {
					choice = 'new';
					w.close();
				};
				cancelBtn.onClick = function () {
					choice = 'cancel';
					w.close();
				};
				w.show();
			} catch (e) {
				choice = 'cancel';
			}
			return choice;
		}

		//=====================================================================
		// MAIN ACTION: CREATE PORTRAIT RIG
		//=====================================================================

		function createPortraitRig() {
			// The fork comes FIRST, before anything is resolved or created: pressing
			// the build button on a rig comp is almost always "fix this rig".
			var existing = findExistingRigComp();
			if (existing !== null) {
				var action = askRigAction(existing);
				if (action === 'cancel') {
					return false;
				}
				if (action === 'repair') {
					return repairRig(existing);
				}
			}

			var src = resolveSource();
			// "Create New Rig" with nothing selected but the rig comp itself would
			// build a rig out of a rig. Say so and stop instead.
			if (existing !== null && src === existing) {
				notify(
					SCRIPT_NAME +
						'\n\n"' +
						existing.name +
						'" is the rig itself, not a source.\n\n' +
						'Select the footage or composition the new rig should be built from in the ' +
						'Project panel, then press "Create Portrait Rig" again.'
				);
				return false;
			}
			if (src === null) {
				notify(
					SCRIPT_NAME +
						'\n\nNothing to build from.\n\n' +
						'Select a footage item or a composition in the Project panel, or select an ' +
						'AV layer inside an open composition, then press "Create Portrait Rig".'
				);
				return false;
			}

			// Same fork, reached the other way round: the source is selected and a rig
			// already exists for it. Without this the run just built "<name> v2".
			if (existing === null) {
				var built = findRigCompsForSource(src);
				if (built.length > 0) {
					var target = built[built.length - 1];
					var srcAction = askRigAction(target, true);
					if (srcAction === 'cancel') {
						return false;
					}
					if (srcAction === 'repair') {
						return repairRig(target);
					}
				}
			}

			// Set false by any partial-failure notify below. A run that had to warn
			// about something keeps the (floating) UI open, so the message is not the
			// last thing on screen with no way back to the buttons.
			var clean = true;
			var undoGroupOpen = false;
			var exprFailBefore = exprFailCount;
			try {
				app.beginUndoGroup('Verticalizer: Create Rig');
				undoGroupOpen = true;

				// The caption styling expressions (getStyleAt/setFontSize/setFillColor)
				// require the JavaScript expression engine; a legacy-engine project
				// would error on every caption expression.
				try {
					if (app.project.expressionEngine !== 'javascript-1.0') {
						app.project.expressionEngine = 'javascript-1.0';
					}
				} catch (engineErr) {}

				var baseName = sanitizeName(stripExtension(src.name));
				var sw = src.width;
				var sh = src.height;

				// Does the footage have to be blown up to fill a WINDOW of this rig?
				// That is the question the editor actually cares about, and comp
				// cover is the wrong metric for a split rig: only the blurred
				// background covers the whole comp, and blur does not care about
				// resolution. What shows sharp pixels is a card window - roughly
				// comp width x half the comp height at the default split - so a
				// 1920x1080 source in a 1080x1920 rig fills its window at ~87 %
				// and must NOT warn. Warn only when the default window needs a
				// real upscale (>110 %); an oversized source is punch-in headroom,
				// not a problem.
				var windowFill = Math.max(CW / sw, CH / 2 / sh);
				var sizeWarning = null;
				if (windowFill > 1.1) {
					sizeWarning =
						'The source is on the small side for this rig.\n\n' +
						'Source: ' +
						sw +
						' x ' +
						sh +
						'   Rig: ' +
						CW +
						' x ' +
						CH +
						'\n\nEach split window (about ' +
						CW +
						' x ' +
						Math.round(CH / 2) +
						') needs the footage scaled up to about ' +
						Math.round(windowFill * 100) +
						' % before any punch-in, so the windows may look soft.';
				}
				if (sizeWarning !== null && !askProceed(sizeWarning)) {
					// The editor chose to go back and change the rig size. Nothing has
					// been created yet, so there is nothing to undo - just close the
					// group and leave the panel open on the size fields.
					app.endUndoGroup();
					undoGroupOpen = false;
					return false;
				}
				var par = src.pixelAspect;
				if (!par || par <= 0) {
					par = 1;
				}
				var fps = src.frameRate;
				if (!fps || fps <= 0) {
					fps = 30;
				}
				var dur = src.duration;
				if (!dur || dur <= 0) {
					dur = 10;
				}

				// ---- project structure ------------------------------------------
				var rootFolder = findOrCreateFolder('Verticalizer', app.project.rootFolder);
				// Stamp the version BEFORE anything is created, so the folder, both
				// comps and the footage layer names all agree on which build this is.
				baseName = versionedBaseName(rootFolder, baseName);
				var jobFolder = app.project.items.addFolder(baseName);
				jobFolder.parentFolder = rootFolder;

				var srcComp = app.project.items.addComp('SRC ' + baseName, sw, sh, par, dur, fps);
				srcComp.parentFolder = jobFolder;
				srcComp.layers.add(src);

				var master = app.project.items.addComp(baseName + ' Portrait', CW, CH, 1, dur, fps);
				master.parentFolder = jobFolder;
				master.bgColor = [0, 0, 0];

				// ---- controller FIRST (everything else references its effect) ----
				var ctrl = buildCtrlLayer(master);

				// ---- background stack --------------------------------------------
				var bgFill = buildBgFill(master);
				var bgVideo = buildBgVideo(master, srcComp, 'BG ' + baseName, sw, sh);
				var bgDarken = buildBgDarken(master);

				// ---- windows ------------------------------------------------------
				var divider = buildDivider(master);
				var botCard = buildCard(master, 'BOT Card', false, sw, sh);
				var botLayer = buildSourceLayer(master, srcComp, 'BOT ' + baseName, false, sw, sh);
				var botMatte = buildMatte(
					master,
					'BOT Matte',
					false,
					exprWindowSize(false, sw, sh),
					exprWindowCenter(false, sw, sh),
					sw,
					sh
				);
				var topCard = buildCard(master, 'TOP Card', true, sw, sh);
				var topLayer = buildSourceLayer(master, srcComp, 'TOP ' + baseName, true, sw, sh);
				var topMatte = buildMatte(
					master,
					'TOP Matte',
					true,
					exprWindowSize(true, sw, sh),
					exprWindowCenter(true, sw, sh),
					sw,
					sh
				);

				// Retiming is expression-driven from the controller, because the footage
				// layers are locked at the end of the build. dur is the SRC precomp
				// duration, which is what Time Remap addresses.
				if (!enableTimeRemap(topLayer, master, true, dur)) {
					clean = false;
				}
				if (!enableTimeRemap(botLayer, master, false, dur)) {
					clean = false;
				}

				// The frames-based Time Offset needs a visible range, so the source
				// length is baked onto the two read-only info sliders. The master comp
				// runs at the source frame rate, so its frameDuration is the source's.
				var srcFrames = Math.round(dur / master.frameDuration);
				if (!bakeSourceFrames(ctrl, srcFrames)) {
					clean = false;
				}

				// ---- PiP shadow (above BOTH card assemblies, so it never gets
				//      buried by whichever card happens to be the background) --------
				var pipShadow = buildPipShadow(master, sw, sh);
				var pipShadowMatte = buildPipShadowMatte(master, sw, sh);

				// ---- captions -----------------------------------------------------
				var capBox = buildCaptionBox(master, 'Caption Box', 'Caption Text');
				var capText = buildCaptionText(master, 'Caption Text');

				// ---- overlays and rig nulls ---------------------------------------
				var safeZones = buildSafeZones(master);
				var zBot = buildZNull(master, 'Z BOT', exprZBotPosition(sw, sh));
				var zTop = buildZNull(master, 'Z TOP', exprZTopPosition(sw, sh));

				// ---- handles ------------------------------------------------------
				var pipHandle = buildPipHandle(master);
				var capHandle = buildCaptionHandle(master);
				var botPan = buildPanHandle(master, 'BOT PAN Handle', COL_BOT, LBL_BOT);
				var topPan = buildPanHandle(master, 'TOP PAN Handle', COL_TOP, LBL_TOP);
				var splitHandle = buildSplitHandle(master);

				// Parent AFTER the nulls carry their expressions, then zero the
				// handles so they sit exactly on the window centres.
				topPan.parent = zTop;
				setPosition(topPan, [0, 0]);
				botPan.parent = zBot;
				setPosition(botPan, [0, 0]);

				// ---- explicit stacking order (top -> bottom) -----------------------
				var order = [
					ctrl,
					splitHandle,
					topPan,
					botPan,
					pipHandle,
					capHandle,
					zTop,
					zBot,
					safeZones,
					capText,
					capBox,
					pipShadowMatte,
					pipShadow,
					topMatte,
					topLayer,
					topCard,
					botMatte,
					botLayer,
					botCard,
					divider,
					bgDarken,
					bgVideo,
					bgFill
				];
				for (var k = order.length - 1; k >= 0; k--) {
					order[k].moveToBeginning();
				}

				// ---- track mattes (matte sits directly above its fill layer) -------
				applyAlphaMatte(topLayer, topMatte);
				applyAlphaMatte(botLayer, botMatte);
				// Clips the finished shadow to everything OUTSIDE the floating card.
				applyAlphaMatte(pipShadow, pipShadowMatte);

				// ---- lock + shy hygiene (DEAD LAST) --------------------------------
				// Everything structural is hidden and write-protected, so the timeline
				// opens showing only the controller, the five handles and the caption
				// text (7 visible layers). The PIP handle joins that visible set - it is
				// a user input, not plumbing - so it is deliberately absent from the list
				// below. This runs after every expression, the stacking pass and the
				// track-matte assignment, because a locked layer refuses property
				// writes and a locked layer cannot be moved.
				var hidden = [
					pipShadow,
					pipShadowMatte,
					topMatte,
					botMatte,
					topLayer,
					botLayer,
					topCard,
					botCard,
					divider,
					bgFill,
					bgVideo,
					bgDarken,
					capBox,
					safeZones,
					zTop,
					zBot
				];
				for (var h = 0; h < hidden.length; h++) {
					try {
						hidden[h].shy = true;
					} catch (eShy) {}
					try {
						hidden[h].locked = true;
					} catch (eLock) {}
				}
				master.hideShyLayers = true;

				try {
					master.openInViewer();
				} catch (eView) {}
				// Per-layer guard: most of the stack is locked by now, and a locked
				// layer can refuse a selection change without that costing the rest.
				for (var d = 1; d <= master.numLayers; d++) {
					try {
						master.layer(d).selected = false;
					} catch (eDes) {}
				}
				try {
					ctrl.selected = true;
				} catch (eSel) {}

				// Every expression in the rig goes through setExprSafe, which counts
				// the ones it could not write. A rig missing even one of them looks
				// complete and behaves wrongly, so it is reported rather than shipped
				// quietly (1.9.0).
				if (exprFailCount > exprFailBefore) {
					clean = false;
					notify(
						SCRIPT_NAME +
							'\n\n' +
							(exprFailCount - exprFailBefore) +
							' expression(s) could not be written during the build.\n\n' +
							'The rig is up, but at least one property is not driven by the controller. ' +
							'Run "Create Portrait Rig" on this comp again and choose ' +
							'"Re-apply / Upgrade Rig" to try re-wiring it.'
					);
				}

				app.endUndoGroup();
				undoGroupOpen = false;
			} catch (error) {
				if (undoGroupOpen) {
					app.endUndoGroup();
					// Roll the partial build back so a failure never leaves a
					// half-wired rig in the project (16 = Edit > Undo).
					try {
						app.executeCommand(16);
					} catch (eUndo) {}
				}
				notify(
					SCRIPT_NAME +
						'\n\nCould not build the rig - the partial build was undone.\n\n' +
						error.toString() +
						(error.line ? '\n(line ' + error.line + ')' : '')
				);
				return false;
			}
			return clean;
		}

		//=====================================================================
		// ACTION: ADD CAPTION
		//=====================================================================

		function addCaption() {
			var comp = app.project.activeItem;
			if (!comp || !(comp instanceof CompItem)) {
				notify(SCRIPT_NAME + '\n\nOpen a Verticalizer portrait comp first.');
				return false;
			}
			if (getLayerByName(comp, CTRL_LAYER_NAME) === null) {
				notify(
					SCRIPT_NAME +
						'\n\nThis composition is not a Verticalizer master comp\n(no "' +
						CTRL_LAYER_NAME +
						'" layer found).'
				);
				return false;
			}
			var baseText = getLayerByName(comp, 'Caption Text');
			var baseBox = getLayerByName(comp, 'Caption Box');
			if (baseText === null || baseBox === null) {
				notify(SCRIPT_NAME + '\n\nCould not find the "Caption Text" / "Caption Box" pair.');
				return false;
			}
			var baseHandle = getLayerByName(comp, 'CAPTION Handle');

			var undoGroupOpen = false;
			try {
				app.beginUndoGroup('Verticalizer: Add Caption');
				undoGroupOpen = true;

				// The index walks past every caption already in the comp, so adding a
				// tenth is the same operation as adding the second - name, handle and
				// control panel all carry the same number.
				var n = 2;
				while (
					getLayerByName(comp, 'Caption ' + pad2n(n) + ' Text') !== null ||
					getLayerByName(comp, 'Caption ' + pad2n(n) + ' Handle') !== null
				) {
					n++;
				}
				var textName = 'Caption ' + pad2n(n) + ' Text';
				var boxName = 'Caption ' + pad2n(n) + ' Box';
				var handleName = 'Caption ' + pad2n(n) + ' Handle';

				// The handle is built FIRST and carries its own "Verticalizer Caption"
				// pseudo effect, so this caption has a complete, independent control
				// panel of its own. Building it first also gets the applyPreset
				// registration (which invalidates property references) out of the way
				// before anything else is touched.
				var newHandle = buildCaptionHandle(comp, handleName, true);

				// Registering a pseudo effect goes through applyPreset, which
				// invalidates references taken before it ran. The template layers were
				// looked up above, so they are re-fetched by name here rather than
				// trusted across that boundary.
				baseText = getLayerByName(comp, 'Caption Text');
				baseBox = getLayerByName(comp, 'Caption Box');
				baseHandle = getLayerByName(comp, 'CAPTION Handle');
				if (baseText === null || baseBox === null) {
					throw new Error('The "Caption Text" / "Caption Box" pair went missing during registration.');
				}

				// The template box is shy + locked after a 1.2.0 build, and a locked
				// layer refuses every write below - so it is unlocked for the
				// duplication and put straight back.
				var boxWasLocked = false;
				try {
					boxWasLocked = baseBox.locked === true;
					baseBox.locked = false;
				} catch (eUnlock) {}

				var newText = baseText.duplicate();
				var newBox = baseBox.duplicate();

				try {
					baseBox.locked = boxWasLocked;
				} catch (eRelock) {}
				try {
					newBox.locked = false;
				} catch (eNewUnlock) {}

				newText.name = textName;
				newBox.name = boxName;

				newBox.moveAfter(newText);

				// Duplicates inherit the FIRST caption's expressions, every one of
				// which points at the controller's Captions group and the shared
				// CAPTION handle. Repoint the whole set at this caption's own handle,
				// or it looks independent while silently following caption one.
				setExprSafe(
					newText.property('ADBE Text Properties').property('ADBE Text Document'),
					exprCaptionSourceText(handleName)
				);
				setExprSafe(xform(newText).property('ADBE Position'), exprCaptionTextPosition(handleName));
				setExprSafe(xform(newText).property('ADBE Scale'), exprCaptionTextScale(handleName));
				setExprSafe(xform(newText).property('ADBE Opacity'), exprCaptionTextOpacity(handleName));
				wireCaptionBox(newBox, textName, handleName);

				// Park the new handle just below wherever the previous one sits, so it
				// is visible instead of stacked exactly on top of the last one.
				var seed = [CW / 2, CH * CAPTION_Y_RATIO];
				try {
					if (baseHandle !== null) {
						var bp = xform(baseHandle).property('ADBE Position').value;
						seed = [bp[0], bp[1] + 90 * (n - 1)];
					}
				} catch (eSeed) {}
				try {
					if (seed[1] > comp.height - 40) {
						seed[1] = comp.height - 40;
					}
				} catch (eClamp) {}
				setPosition(newHandle, seed);

				// Keep the handles together at the top of the stack.
				try {
					if (baseHandle !== null) {
						newHandle.moveAfter(baseHandle);
					} else {
						newHandle.moveToBeginning();
					}
				} catch (eMove) {}

				// The caption spans the whole comp - trimming is the editor's call.
				// (Earlier builds trimmed to CTI + 3 s, which meant every caption
				// needed its in/out dragged back out before it could be timed.)
				var tIn = 0;
				var tOut = comp.duration;
				newText.inPoint = tIn;
				newText.outPoint = tOut;
				newBox.inPoint = tIn;
				newBox.outPoint = tOut;

				// The new text layer is the thing the editor types into, so it stays
				// visible and editable; its box joins the hidden, write-protected stack.
				try {
					newText.shy = false;
					newText.locked = false;
				} catch (eTextFlags) {}
				try {
					newBox.shy = true;
					newBox.locked = true;
				} catch (eBoxFlags) {}
				// The handle is an input, so it joins the visible set with the others.
				try {
					newHandle.shy = false;
					newHandle.locked = false;
					newHandle.inPoint = newText.inPoint;
					newHandle.outPoint = newText.outPoint;
				} catch (eHandleFlags) {}

				for (var i = 1; i <= comp.numLayers; i++) {
					try {
						comp.layer(i).selected = false;
					} catch (eDesel) {}
				}
				newText.selected = true;

				app.endUndoGroup();
				undoGroupOpen = false;
			} catch (error) {
				if (undoGroupOpen) {
					app.endUndoGroup();
				}
				notify(SCRIPT_NAME + '\n\nCould not add the caption.\n\n' + error.toString());
				return false;
			}
			return true;
		}

		//=====================================================================
		// ACTION: APPLY RIG FFX TO SELECTED LAYER
		//=====================================================================

		function applyRigFFX() {
			var comp = app.project.activeItem;
			if (!comp || !(comp instanceof CompItem)) {
				notify(SCRIPT_NAME + '\n\nOpen a composition and select a layer first.');
				return false;
			}
			var sel = comp.selectedLayers;
			if (sel.length < 1) {
				notify(SCRIPT_NAME + '\n\nSelect at least one layer to apply the Verticalizer effect to.');
				return false;
			}

			var undoGroupOpen = false;
			try {
				app.beginUndoGroup('Verticalizer: Apply Rig FFX');
				undoGroupOpen = true;

				for (var i = 0; i < sel.length; i++) {
					var fx = applyPseudoEffect(pseudoEffectData, sel[i]);
					try {
						fx.name = EFFECT_NAME;
					} catch (e) {}
				}

				app.endUndoGroup();
				undoGroupOpen = false;
			} catch (error) {
				if (undoGroupOpen) {
					app.endUndoGroup();
				}
				notify(SCRIPT_NAME + '\n\nCould not apply the effect.\n\n' + error.toString());
				return false;
			}
			return true;
		}

		//=====================================================================
		// USER INTERFACE (dockable panel)
		//=====================================================================

		function buildUI(thisObj) {
			var panel =
				thisObj instanceof Panel
					? thisObj
					: new Window('palette', SCRIPT_NAME, undefined, { resizeable: true });

			if (panel === null) {
				return null;
			}

			panel.orientation = 'column';
			panel.alignChildren = ['fill', 'top'];
			panel.spacing = 6;
			panel.margins = 10;

			// ---- rig size ---------------------------------------------------
			// The rig is resolution-agnostic at runtime (every expression reads
			// thisComp.width / height), so the only thing the size decides is what
			// comp gets built. Presets cover the usual targets; Custom is the same
			// two fields with nothing overwriting them.
			var sizePanel = panel.add('panel', undefined, 'Rig Size');
			sizePanel.orientation = 'column';
			sizePanel.alignChildren = ['fill', 'top'];
			sizePanel.spacing = 4;
			sizePanel.margins = 10;

			var presetLabels = [];
			for (var pi = 0; pi < SIZE_PRESETS.length; pi++) {
				presetLabels.push(SIZE_PRESETS[pi][0]);
			}
			var presetList = sizePanel.add('dropdownlist', undefined, presetLabels);
			presetList.selection = 0;
			presetList.helpTip = 'Pick a target size, or Custom to type your own.';

			var dimRow = sizePanel.add('group');
			dimRow.orientation = 'row';
			dimRow.alignChildren = ['left', 'center'];
			dimRow.spacing = 4;
			dimRow.add('statictext', undefined, 'W');
			var widthField = dimRow.add('edittext', undefined, String(DEFAULT_CW));
			widthField.characters = 6;
			widthField.helpTip = 'Rig width in pixels.';
			dimRow.add('statictext', undefined, 'H');
			var heightField = dimRow.add('edittext', undefined, String(DEFAULT_CH));
			heightField.characters = 6;
			heightField.helpTip = 'Rig height in pixels.';

			// Typing in the fields means Custom - the dropdown must not keep claiming
			// a preset the numbers no longer match.
			function selectCustom() {
				presetList.selection = SIZE_PRESETS.length - 1;
			}
			presetList.onChange = function () {
				var idx = presetList.selection ? presetList.selection.index : 0;
				var row = SIZE_PRESETS[idx];
				if (row[1] > 0 && row[2] > 0) {
					widthField.text = String(row[1]);
					heightField.text = String(row[2]);
				}
			};
			widthField.onChanging = selectCustom;
			heightField.onChanging = selectCustom;

			// Read the fields back, normalise them and publish them to the builders.
			function applyRigSize() {
				CW = parseDim(widthField.text, DEFAULT_CW);
				CH = parseDim(heightField.text, DEFAULT_CH);
				widthField.text = String(CW);
				heightField.text = String(CH);
			}

			var createBtn = panel.add('button', undefined, 'Create Portrait Rig');
			createBtn.preferredSize.width = 210;
			createBtn.helpTip =
				'Build the split-screen rig at the size above, from the selected footage, comp, or layer. ' +
				'On a comp that already holds a rig it offers to re-apply / upgrade that rig instead ' +
				'(fixes broken expressions, brings an old rig up to date, keeps every keyframe).';

			var captionBtn = panel.add('button', undefined, 'Add Caption');
			captionBtn.preferredSize.width = 210;
			captionBtn.helpTip =
				'Add a caption with its own handle and its own control panel, at the current ' +
				'time indicator (3 second duration).';

			var applyBtn = panel.add('button', undefined, 'Apply Rig FFX to Selected Layer');
			applyBtn.preferredSize.width = 210;
			applyBtn.helpTip = 'Register and add the Verticalizer pseudo effect to the selected layer(s).';

			var footer = panel.add(
				'statictext',
				undefined,
				SCRIPT_NAME + ' v' + SCRIPT_VERSION + ' - IVG Design'
			);
			footer.alignment = ['center', 'bottom'];

			// A floating palette gets out of the way once the work is done - the rig is
			// the thing the editor now wants to look at, and the panel is one keystroke
			// away. A DOCKED Panel cannot close itself (there is no API for it and the
			// object is owned by After Effects), so it simply stays put; this is the same
			// split Linearizer uses. A run that failed or had to warn about something
			// keeps the window open, so the buttons are still there to retry.
			function closeIfFloating(didSucceed) {
				if (didSucceed !== true) {
					return;
				}
				if (!(panel instanceof Window)) {
					return;
				}
				try {
					panel.close();
				} catch (eClose) {}
			}

			createBtn.onClick = function () {
				applyRigSize();
				closeIfFloating(createPortraitRig());
			};
			captionBtn.onClick = function () {
				closeIfFloating(addCaption());
			};
			applyBtn.onClick = function () {
				closeIfFloating(applyRigFFX());
			};

			panel.layout.layout(true);
			panel.layout.resize();
			panel.onResizing = panel.onResize = function () {
				this.layout.resize();
			};

			return panel;
		}

		//=====================================================================
		// ENTRY POINT
		//
		// $.global.VERTICALIZER_AUTORUN === true skips the UI entirely and builds
		// the rig, which is what the headless test harness drives (usually paired
		// with $.global.VERTICALIZER_SILENT so nothing blocks on a dialog).
		// $.global.VERTICALIZER_REPAIR === true makes that run take the repair fork
		// when the target comp already holds a rig; without it an autorun always
		// builds fresh, which is the pre-1.9.0 behaviour the regression relies on.
		//=====================================================================

		if ($.global.VERTICALIZER_AUTORUN === true) {
			// Headless size overrides, so the harness can build a 4K rig without a UI.
			if ($.global.VERTICALIZER_WIDTH) {
				CW = parseDim($.global.VERTICALIZER_WIDTH, DEFAULT_CW);
			}
			if ($.global.VERTICALIZER_HEIGHT) {
				CH = parseDim($.global.VERTICALIZER_HEIGHT, DEFAULT_CH);
			}
			createPortraitRig();
		} else {
			var Verticalizer = buildUI(thisObj);

			if (Verticalizer !== null && Verticalizer instanceof Window) {
				Verticalizer.center();
				Verticalizer.show();
			}
		}
	}
	addVerticalizerScript(this);
}
