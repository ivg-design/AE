# TextMate
> Type a word or phrase and highlight every case-sensitive occurrence of it inside a text layer, each with its own Range Selector on a new, color-filled text animator.

**Category:** layers · **Version:** 2.0.0 · **UI:** DIALOG (one text field, OK / Cancel)

## What it does

Call out specific words inside a block of text without building Range Selectors by hand. Select a single text layer, run TextMate, and type the text you want highlighted — a word, a name, "IMPORTANT", anything. TextMate scans the layer's Source Text for every case-sensitive occurrence of that string and, for each one, builds a character-index Range Selector inside a single new text animator, then applies one shared Fill Color drawn at random from a 12-color, high-contrast palette.

All matches of a given term live in one animator named after the term (see Controls & options), so they share a fill color, but each occurrence gets its own Range Selector — so you can still keyframe or animate each highlight independently afterward. It's aimed at lower-thirds, kinetic typography, and captions where you want to draw attention to words that already exist in a paragraph.

The run is a single undo step and is purely additive: it never changes the layer's text, formatting, or existing animators.

## Controls & options

The dialog is a single input; the naming convention it produces is what you work with afterward.

| Control | Type | Purpose |
|---|---|---|
| "Enter text to highlight:" field | Text input | The exact, case-sensitive string to find. |
| OK | Button | Runs the search and builds the animator. |
| Cancel | Button | Closes without changes. |

**What gets created**, for a search term like `Hello`:

| Item | Name / value |
|---|---|
| Text animator | `Highlight Animator (Hello)` |
| Range Selectors | One per occurrence, in character-index units |
| Fill Color | One shared color for the animator, random from a 12-color palette |

Re-running with a different term adds another independent animator; re-running with the same term adds a second, identically named one rather than updating the first.

## Usage

1. Select exactly one text layer in the active composition.
2. Run TextMate.
3. Type the exact text to highlight (case-sensitive) and click OK.
4. TextMate creates `Highlight Animator (<your text>)` with one Range Selector per occurrence and a shared random fill color, then reports how many instances it found.
5. Open the layer's Text properties to see the animator; add further animator properties (Position, Scale, Tracking…) or keyframe the selectors/fill to build out the animation.

## Notes

- Search is strictly case-sensitive — there's no case-insensitive option and no trimming of the typed term.
- Matching is left-to-right and non-overlapping, so searching `aa` in `aaa` finds one match, not two.
- Paragraph breaks are accounted for: character indices are corrected for carriage returns so a selector lands on the right characters even when line breaks precede a match.
- Output is a plain, native text animator — no pseudo-effects — editable like any hand-built animator.

## Requirements & edge cases

- Adobe After Effects CS6 or later.
- Requires an active composition — alerts "Please open and select a composition." otherwise.
- Requires exactly one selected layer — alerts "Please select exactly one text layer." for zero or multiple.
- The layer must expose a Source Text property (i.e. be a text layer).
- Cancel, or OK with an empty field, both exit with "No search term entered. Exiting."
- If the term isn't found, alerts "No instances of '<term>' were found."

## How it works

`main()` opens the "TextMate" undo group, guards for an active comp, exactly one selected layer, and a Source Text property, then reads the layer's text and shows a modal dialog for the search term. It scans the text with repeated `indexOf`, and for each match counts preceding carriage returns and subtracts that count from the raw string offset — because Range Selector index units don't count paragraph breaks as characters.

Each match becomes a `{start, end}` pair. The script adds one animator under `ADBE Text Animators` (renamed `Highlight Animator (<term>)`), one `ADBE Text Fill Color` set from a random-palette helper, and one `ADBE Text Selector` per match switched to index units with its start/end set to the match's character range. Every value is written once with `setValue()` — no expressions.
