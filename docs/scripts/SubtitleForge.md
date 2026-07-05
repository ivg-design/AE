# SubtitleForge
> Drop a ready-to-style caption rig into any comp — a text layer plus a self-sizing background box with stroke and drop shadow — then author each line by typing it into a layer marker, and restyle everything from one "Subtitle Setup" effect.

**Category:** layers · **Version:** 2.0.1 · **UI:** HEADLESS (no dialog — builds the rig instantly in the active comp)

## What it does

SubtitleForge builds a complete, reusable subtitle rig in a single run so you can caption a comp without hand-keyframing anything. It creates a text layer named **SUBTITLE** and a shape layer named **TXTBox** that automatically grows and positions itself as a rounded background box behind the text. The two layers are wired together entirely with expressions, so once the rig exists you only ever touch two things: the **layer markers** on SUBTITLE (each marker's comment becomes the on-screen line, and its time + duration decide when that line is visible) and a single custom effect called **Subtitle Setup** on the SUBTITLE layer.

Every visual choice — font size and color, box color/roundness/opacity, padding around the text, an optional outline, and a full drop shadow — is exposed as sliders, color swatches, checkboxes, and an angle dial in the Subtitle Setup effect. The background box reads the text's live bounds and reshapes itself as you edit, so captions of any length stay wrapped in a readable panel. An optional typewriter reveal is available through a separate **Enable Type On** checkbox. Because every parameter is a real, keyframeable control, the whole rig doubles as an animatable template you can copy from comp to comp.

## Controls & options

### Subtitle text — the layer markers on SUBTITLE

You author caption lines by editing **layer markers** on the SUBTITLE layer. The text expression finds the marker under the current time and puts its comment on screen for the marker's duration window; outside every marker window the text is empty.

| Marker property | Controls |
|---|---|
| Comment text | The exact line shown on screen |
| Position in Timeline | When that line appears |
| Duration (the marker's bar length) | How long it stays up |

**Example** — a marker placed at 2s with a 3s duration and the comment `Welcome to the show` displays "Welcome to the show" from 2s to 5s, wrapped in the auto-sized box. Duplicate the placeholder marker (or add more), slide/retime them, and edit each comment to build out the rest of the captions.

### Subtitle Setup effect (on the SUBTITLE layer)

All styling lives here. The controls sit in two twirl-down groups — **Font** and **Box** — with the Stroke and Shadow controls following as checkbox-gated sections.

| Section | Control | Type | Default | Drives |
|---|---|---|---|---|
| Font | Font Color | Color | White (255,255,255) | Text fill color |
| Font | Font Size | Slider | 50 | Text point size |
| Font | Font Opacity | Slider | 100% | SUBTITLE layer opacity |
| Box | Offset X | Slider | 50 | Horizontal padding added to the text width |
| Box | Offset Y | Slider | 50 | Vertical padding added to the text height |
| Box | Box Roundness | Slider | 20 | Corner roundness of the box |
| Box | Box Color | Color | Black (0,0,0) | Box fill color |
| Box | Opacity | Slider | 50% | Box fill opacity |
| Stroke | Stroke | Checkbox | Off | Turns the box outline on (gates Stroke Width) |
| Stroke | Stroke Width | Slider | 0 | Outline thickness when Stroke is on |
| Stroke | Stroke Color | Color | White (255,255,255) | Outline color |
| Shadow | Shadow | Checkbox | Off | Turns the drop shadow on (gates Shadow Opacity) |
| Shadow | Shadow Color | Color | Black (0,0,0) | Drop shadow color |
| Shadow | Shadow Opacity | Slider | 25% | Drop shadow opacity when Shadow is on |
| Shadow | Distance | Slider | 10 | Drop shadow distance |
| Shadow | Spread | Slider | 10% | Drop shadow spread (choke) |
| Shadow | Size | Slider | 20 | Drop shadow blur size |
| Shadow | Angle | Angle dial | 135° | Drop shadow direction |

### Enable Type On (separate checkbox on SUBTITLE)

A standalone **Enable Type On** checkbox (default off) turns on a per-character typewriter reveal. When checked, each line types on over the first fifth of its marker's duration; unchecked, the line simply appears fully for the whole window. This checkbox is independent of the Subtitle Setup effect.

## Usage

1. Open or create the composition you want to caption and make it the active item.
2. Run SubtitleForge. No dialog appears; it builds the rig immediately and opens the comp in the viewer.
3. Two layers appear: **SUBTITLE** (text, carrying one placeholder marker near 0.1s) and **TXTBox** (the background box, parented to SUBTITLE and already tracking it).
4. Author lines: duplicate/retime the marker on SUBTITLE (or add more markers) and edit each marker's **comment** — that text becomes the caption for that marker's window.
5. Select SUBTITLE, open Effect Controls, and style everything from **Subtitle Setup** (font, box, stroke, shadow). Toggle **Enable Type On** if you want the typewriter reveal.

## Notes

- The background box sizes itself from the text's live bounding box plus the **Offset X / Offset Y** padding, so it re-wraps automatically as line length changes — no manual box resizing.
- The box's position and anchor follow SUBTITLE through the parent relationship, but its roundness, fill, stroke, and shadow expressions reference the text layer by the name **SUBTITLE**. Keep that layer named "SUBTITLE"; renaming it makes those expressions show the expression-error marker.
- **Enable Type On** and **Subtitle Setup** are separate controllers — toggling the Subtitle Setup effect off/on in the Effects panel does not affect the typewriter reveal.
- Running the script again in the same comp creates a second, independent SUBTITLE/TXTBox pair rather than updating the existing rig.
- The text layer is created with the font **Inter-Medium** at size 50; you can restyle it from Font Size / Font Color or the Character panel afterward.

## Requirements & edge cases

- Adobe After Effects CS6 or later. Some text-document properties are applied only on newer versions (gated by AE version) and degrade gracefully on older builds.
- Needs an active composition — otherwise it alerts `Please select a composition first` and exits without creating anything. There is no dependence on the current layer selection; it always adds the two new layers.
- The drop shadow is added as a Layer Style, which relies on Layer Styles being available in your AE version.
- With the typewriter reveal off (the default), captions are fully visible for their entire marker window with no reveal animation.

## How it works

The whole tool runs inside one `try`/`app.beginUndoGroup("SubtitleForge")` wrapper. After confirming `app.project.activeItem` is a `CompItem`, it adds the SUBTITLE text layer (font, size, fill, and paragraph properties set via `ADBE Text Document`, with version checks around the newer text attributes), writes one placeholder marker, and builds a text animator with an opacity property and a Range Selector whose Percent Start is used to drive the type-on reveal.

The **Subtitle Setup** effect is a bundled pseudo-effect: a RIFX/FFX binary embedded in the script as a string, written to a temp file and installed with `layer.applyPreset()`. Its footer defines the exact control names used everywhere — `Font Color`, `Font Size`, `Font Opacity`, `Offset X`, `Offset Y`, `Box Roundness`, `Box Color`, `Opacity`, `Stroke`, `Stroke Width`, `Stroke Color`, `Shadow`, `Shadow Color`, `Shadow Opacity`, `Distance`, `Spread`, `Size`, and `Angle`. A separate `ADBE Checkbox Control` is added and renamed **Enable Type On**.

The TXTBox shape layer is created with a rectangle group (path, stroke, fill), parented to SUBTITLE, and given a Drop Shadow layer style (attached via `app.executeCommand(3739)` then `9000`). Every visual property is then driven by an `.expression` referencing `effect("Subtitle Setup")(…)`: the text `sourceText` pulls the current marker's comment and applies Font Size/Font Color; the rect size reads `sourceRectAtTime()` of SUBTITLE plus the offsets; roundness, fill, stroke width/color, and each `dropShadow/*` property read their matching control (with the Stroke and Shadow checkboxes gating width and shadow opacity); the box position uses `parent.sourceRectAtTime()`; and both the text and the box opacity are gated to the current marker's time window.
