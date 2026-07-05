/**
 * IVGD Command Bar - Dockable icon toolbar for the IVG script catalog
 *
 * @name IVGD Command Bar
 * @author IVG Design
 * @version 1.2.1
 * @date 2026-07-04
 * @license MIT
 * @ui PANEL
 *
 * @description
 * A dockable, resizable ScriptUI panel that shows one icon button per catalog
 * script and launches the script on click. The panel is manifest-free: on
 * startup it scans the "ivg-scripts" folder that sits NEXT TO this file and
 * builds a button for every .jsx it finds (one level of category subfolders
 * is scanned too). Icons are loaded from "ivg-scripts/icons/<slug>.png";
 * scripts without an icon get a compact text button instead.
 *
 * Hover a button for its tooltip (name + one-line usage, read from
 * "ivg-scripts/tooltips.txt" when the bundle provides it). Scripts that ship
 * an alternate icon ("icons/<slug>.alt.png") have a Cmd/Ctrl variant: hold
 * Cmd (macOS) / Ctrl (Windows) and the icon swaps to the variant - click
 * while holding to run it (the script itself reads the modifier key).
 *
 * Because the bundled scripts live inside the "ivg-scripts" subfolder, After
 * Effects lists ONLY this panel in the Window menu - the tools themselves
 * don't clutter it. Buttons reflow responsively: dock the panel wide and flat
 * for a horizontal toolbar, narrow for a vertical strip, or square for a grid.
 *
 * @usage
 * 1. Copy "IVGD Command Bar.jsx" AND the "ivg-scripts" folder into
 *    After Effects ▸ Scripts ▸ ScriptUI Panels.
 * 2. Restart AE (or rescan scripts) and open Window ▸ IVGD Command Bar.jsx.
 * 3. Click any icon to run that script. Hover for the script's name.
 * 4. Resize/dock the panel anywhere - the buttons rearrange automatically.
 *
 * @changelog
 * - 1.2.1 (2026-07-04): HiDPI icons via ScriptUI's @2x convention — each 24px
 *   "<slug>.png" now ships with a 48px "<slug>@2x.png" sibling that ScriptUI auto-detects
 *   and draws crisp at 1x logical size on Retina (the 1.2.0 "oversized base image"
 *   attempt just enlarged the icons, so it was reverted).
 *
 * @notes
 * - You can also keep using individual scripts the classic way: drop any .jsx
 *   from ivg-scripts/ directly into the Scripts or ScriptUI Panels folder.
 * - Scripts are executed with $.evalFile() using their absolute path, so the
 *   bundle keeps working wherever the ScriptUI Panels folder lives.
 */

(function ivgCommandBar(thisObj) {

    var SCRIPTS_DIRNAME = "ivg-scripts";
    var ICONS_DIRNAME = "icons";
    var TOOLTIPS_FILENAME = "tooltips.txt";
    var CELL = 40;   // button cell size (logical px); base icons are 24px
    // HiDPI: each "<slug>.png" (24px) ships alongside a "<slug>@2x.png" (48px).
    // ScriptUI's image loader auto-detects the @2x sibling and draws it at the
    // 1x logical size on Retina displays — crisp without enlarging. (Documented
    // ScriptUI @2x convention; the base file must stay at the 1x display size.)
    var GAP = 4;
    var MARGIN = 6;

    //==================================================================
    // Discovery
    //==================================================================

    function panelFolder() {
        try {
            return new File($.fileName).parent;
        } catch (e) {
            return null;
        }
    }

    /** Strip extension and normalize a file name to the icon slug used by the
     *  bundle (lower-case, underscores to dashes). */
    function slugOf(fileName) {
        var base = fileName.replace(/\.jsx(bin)?$/i, "");
        var out = "";
        for (var i = 0; i < base.length; i++) {
            var ch = base.charAt(i);
            out += (ch === "_") ? "-" : ch.toLowerCase();
        }
        return out;
    }

    function displayNameOf(fileName) {
        return decodeURI(fileName).replace(/\.jsx(bin)?$/i, "");
    }

    /** Compact label for scripts without an icon: capitals + digits, max 3. */
    function shortLabelOf(name) {
        var label = "";
        for (var i = 0; i < name.length && label.length < 3; i++) {
            var ch = name.charAt(i);
            if ((ch >= "A" && ch <= "Z") || (ch >= "0" && ch <= "9")) label += ch;
        }
        if (label.length === 0) label = name.substring(0, 2);
        return label;
    }

    /** Parse ivg-scripts/tooltips.txt: one `basename|tip` per line. */
    function loadTooltips(scriptsFolder) {
        var map = {};
        try {
            var f = new File(scriptsFolder.fsName + "/" + TOOLTIPS_FILENAME);
            if (!f.exists) return map;
            f.encoding = "UTF-8";
            if (!f.open("r")) return map;
            while (!f.eof) {
                var line = f.readln();
                var sep = line.indexOf("|");
                if (sep > 0) {
                    map[line.substring(0, sep)] = line.substring(sep + 1);
                }
            }
            f.close();
        } catch (e) { }
        return map;
    }

    /** Tooltip text: name + usage line + modifier hint when a variant exists. */
    function tipFor(item, modifierDown) {
        var tip = item.name;
        if (item.tip !== null) tip += "\n" + item.tip;
        if (item.altIcon !== null) {
            tip += modifierDown
                ? "\n[Cmd/Ctrl variant armed - click to run it]"
                : "\nHold Cmd/Ctrl for the alternate variant.";
        }
        return tip;
    }

    /** Scan ivg-scripts/ (and one level of category subfolders) for .jsx. */
    function collectScripts() {
        var items = [];
        var root = panelFolder();
        if (root === null) return items;
        var scriptsFolder = new Folder(root.fsName + "/" + SCRIPTS_DIRNAME);
        if (!scriptsFolder.exists) return items;
        var iconsFolder = new Folder(scriptsFolder.fsName + "/" + ICONS_DIRNAME);
        var tooltips = loadTooltips(scriptsFolder);

        function addFile(f) {
            var name = displayNameOf(f.name);
            var slug = slugOf(f.name);
            var icon = null, altIcon = null;
            if (iconsFolder.exists) {
                var iconFile = new File(iconsFolder.fsName + "/" + slug + ".png");
                if (iconFile.exists) icon = iconFile;
                var altFile = new File(iconsFolder.fsName + "/" + slug + ".alt.png");
                if (altFile.exists) altIcon = altFile;
            }
            items.push({
                file: f,
                name: name,
                icon: icon,
                altIcon: altIcon,
                tip: tooltips[name] || tooltips[slug] || null
            });
        }

        var top = scriptsFolder.getFiles();
        for (var i = 0; i < top.length; i++) {
            var entry = top[i];
            if (entry instanceof File) {
                if (entry.name.match(/\.jsx(bin)?$/i)) addFile(entry);
            } else if (entry instanceof Folder && entry.name !== ICONS_DIRNAME) {
                var sub = entry.getFiles();
                for (var j = 0; j < sub.length; j++) {
                    if (sub[j] instanceof File && sub[j].name.match(/\.jsx(bin)?$/i)) {
                        addFile(sub[j]);
                    }
                }
            }
        }

        // Sort by display name (simple ES3 comparator).
        items.sort(function (a, b) {
            var an = a.name.toLowerCase();
            var bn = b.name.toLowerCase();
            return an < bn ? -1 : an > bn ? 1 : 0;
        });
        return items;
    }

    //==================================================================
    // UI
    //==================================================================

    function runScript(item) {
        try {
            $.evalFile(item.file);
        } catch (err) {
            alert("IVGD Command Bar\n\nCould not run " + item.name + ":\n" + err.toString());
        }
    }

    function buildUI(host) {
        var win = (host instanceof Panel)
            ? host
            : new Window("palette", "IVGD Command Bar", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = MARGIN;
        win.spacing = GAP;

        var items = collectScripts();
        var lastCols = -1;
        var grid = null;
        var modButtons = [];   // iconbuttons that have an alt (Cmd/Ctrl) icon
        var modDown = false;

        function currentCols() {
            var w = (win.size !== null && win.size !== undefined) ? win.size.width : 0;
            if (w <= 0) w = 12 * (CELL + GAP); // first layout before a real size exists
            var inner = w - 2 * MARGIN;
            var cols = Math.floor((inner + GAP) / (CELL + GAP));
            if (cols < 1) cols = 1;
            if (cols > items.length) cols = items.length;
            return cols;
        }

        /** (Re)build the button grid for the given column count. ScriptUI
         *  cannot re-parent controls, so rows are rebuilt when cols change. */
        function rebuild(cols) {
            if (grid !== null) win.remove(grid);
            grid = win.add("group");
            grid.orientation = "column";
            grid.alignChildren = ["left", "top"];
            grid.spacing = GAP;
            modButtons = [];

            var row = null;
            for (var i = 0; i < items.length; i++) {
                if (i % cols === 0) {
                    row = grid.add("group");
                    row.orientation = "row";
                    row.spacing = GAP;
                }
                var item = items[i];
                var btn;
                if (item.icon !== null) {
                    btn = row.add("iconbutton", undefined, ScriptUI.newImage(item.icon), { style: "toolbutton" });
                    if (item.altIcon !== null) {
                        btn.__mainImage = btn.image;
                        try { btn.__altImage = ScriptUI.newImage(item.altIcon); } catch (eAlt) { btn.__altImage = null; }
                        if (btn.__altImage !== null) modButtons.push(btn);
                    }
                } else {
                    btn = row.add("button", undefined, shortLabelOf(item.name));
                }
                btn.preferredSize = [CELL, CELL];
                btn.helpTip = tipFor(item, false);
                btn.__item = item;
                btn.onClick = function () { runScript(this.__item); };
            }
            lastCols = cols;
        }

        function relayout() {
            var cols = currentCols();
            if (cols !== lastCols) rebuild(cols);
            win.layout.layout(true);
            win.layout.resize();
        }

        if (items.length === 0) {
            var msg = win.add("statictext", undefined,
                "No scripts found.\n\nPlace this panel together with its \"" + SCRIPTS_DIRNAME +
                "\" folder inside Scripts ▸ ScriptUI Panels (build a bundle from the catalog site).",
                { multiline: true });
            msg.preferredSize = [260, 90];
        } else {
            rebuild(currentCols());
        }

        win.onResizing = win.onResize = function () { relayout(); };

        /** Poll the modifier state and swap alt icons + tooltips live. */
        function tickModifiers() {
            var down = false;
            try {
                var kb = ScriptUI.environment.keyboardState;
                down = kb !== null && (kb.metaKey || kb.ctrlKey) ? true : false;
            } catch (eKb) { }
            if (down === modDown) return;
            modDown = down;
            for (var i = 0; i < modButtons.length; i++) {
                var btn = modButtons[i];
                try {
                    btn.image = down ? btn.__altImage : btn.__mainImage;
                    btn.helpTip = tipFor(btn.__item, down);
                } catch (eSwap) { }
            }
        }

        // Modifier watcher (only when at least one alt icon exists).
        if (modButtons.length > 0 && app.scheduleTask) {
            try {
                $.global.__ivgdBarTick = tickModifiers;
                app.scheduleTask("if ($.global.__ivgdBarTick) $.global.__ivgdBarTick();", 200, true);
            } catch (eTask) { }
        }

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
            win.layout.resize();
        }
        return win;
    }

    buildUI(thisObj);

})(this);
