/**
 * Build-a-Bar - Dockable icon toolbar for the IVG script catalog
 *
 * @name Build-a-Bar
 * @author IVG Design
 * @version 1.2.2
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
 * 1. Copy "Build-a-Bar.jsx" AND the "ivg-scripts" folder into
 *    After Effects ▸ Scripts ▸ ScriptUI Panels.
 * 2. Restart AE (or rescan scripts) and open Window ▸ Build-a-Bar.jsx.
 * 3. Click any icon to run that script. Hover for the script's name.
 * 4. Resize/dock the panel anywhere - the buttons rearrange automatically.
 *
 * @changelog
 * - 1.2.2 (2026-07-07): When the panel is docked shorter than the button grid it
 *   now PAGES row-by-row via up/down (▲/▼) chevrons at the bottom instead of a
 *   scrollbar — ScriptUI's panel scrollbars are janky when docked. Only the rows
 *   that fit are built; the chevrons shift the visible window one row at a time
 *   and disable at the ends. Column reflow by width is unchanged.
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
    function tipFor(item, mode) {   // mode: 0 base, 1 Shift, 2 Cmd/Ctrl
        var tip = item.name;
        if (item.tip !== null) tip += "\n" + item.tip;
        var hasShift = item.shiftIcon !== null, hasCmd = item.cmdIcon !== null;
        if (hasShift || hasCmd) {
            if (mode === 1 && hasShift) tip += "\n[Shift variant armed - click to run it]";
            else if (mode === 2 && hasCmd) tip += "\n[Cmd/Ctrl variant armed - click to run it]";
            else {
                var hints = [];
                if (hasShift) hints.push("Shift");
                if (hasCmd) hints.push("Cmd/Ctrl");
                tip += "\nHold " + hints.join(" or ") + " for a variant.";
            }
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
            var icon = null, shiftIcon = null, cmdIcon = null;
            if (iconsFolder.exists) {
                var iconFile = new File(iconsFolder.fsName + "/" + slug + ".png");
                if (iconFile.exists) icon = iconFile;
                var shiftFile = new File(iconsFolder.fsName + "/" + slug + ".shift.png");
                if (shiftFile.exists) shiftIcon = shiftFile;
                var cmdFile = new File(iconsFolder.fsName + "/" + slug + ".cmd.png");
                if (cmdFile.exists) cmdIcon = cmdFile;
            }
            items.push({
                file: f,
                name: name,
                icon: icon,
                shiftIcon: shiftIcon,   // shown while Shift is held
                cmdIcon: cmdIcon,       // shown while Cmd/Ctrl is held
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
            alert("Build-a-Bar\n\nCould not run " + item.name + ":\n" + err.toString());
        }
    }

    function buildUI(host) {
        var win = (host instanceof Panel)
            ? host
            : new Window("palette", "Build-a-Bar", undefined, { resizeable: true });
        win.orientation = "column";
        win.alignChildren = ["fill", "fill"];
        win.margins = MARGIN;
        win.spacing = 0;

        var items = collectScripts();
        var lastCols = -1;
        var grid = null;
        var rowOffset = 0;     // index of the first visible row when paginating
        var modButtons = [];   // iconbuttons with a Shift and/or Cmd variant
        var modMode = 0;       // 0 base, 1 Shift, 2 Cmd/Ctrl
        var NAVH = 22;         // height of the pager (up/down chevron) row

        // Empty state: just the guidance message.
        if (items.length === 0) {
            var msg = win.add("statictext", undefined,
                "No scripts found.\n\nPlace this panel together with its \"" + SCRIPTS_DIRNAME +
                "\" folder inside Scripts ▸ ScriptUI Panels (build a bundle from the catalog site).",
                { multiline: true });
            msg.preferredSize = [260, 90];
            if (win instanceof Window) { win.center(); win.show(); }
            else { win.layout.layout(true); win.layout.resize(); }
            return win;
        }

        // A grid host that shows the CURRENT PAGE of rows, plus a pager row with
        // up/down chevrons. When the panel is docked shorter than the full grid,
        // only the rows that fit are shown and the chevrons page through them
        // row-by-row. (ScriptUI scrollbars are janky inside docked panels.)
        var gridHost = win.add("group");
        gridHost.orientation = "column";
        gridHost.alignment = ["fill", "fill"];
        gridHost.alignChildren = ["left", "top"];
        gridHost.spacing = GAP;
        gridHost.margins = 0;

        var nav = win.add("group");
        nav.orientation = "row";
        nav.alignment = ["fill", "bottom"];
        nav.alignChildren = ["center", "center"];
        nav.spacing = 6;
        nav.margins = 0;
        var upBtn = nav.add("button", undefined, "▲");
        var pageLabel = nav.add("statictext", undefined, "");
        pageLabel.preferredSize = [96, 16];
        pageLabel.justify = "center";
        var downBtn = nav.add("button", undefined, "▼");
        upBtn.preferredSize = [32, NAVH];
        downBtn.preferredSize = [32, NAVH];
        upBtn.helpTip = "Previous row";
        downBtn.helpTip = "Next row";

        function currentCols() {
            var w = (win.size !== null && win.size !== undefined) ? win.size.width : 0;
            if (w <= 0) w = 12 * (CELL + GAP); // first layout before a real size exists
            var inner = w - 2 * MARGIN;
            var cols = Math.floor((inner + GAP) / (CELL + GAP));
            if (cols < 1) cols = 1;
            if (cols > items.length) cols = items.length;
            return cols;
        }

        /** (Re)build only rows [startRow, startRow+nRows) of the grid. ScriptUI
         *  cannot re-parent controls, so the visible page is rebuilt on change. */
        function rebuild(cols, startRow, nRows) {
            if (grid !== null) gridHost.remove(grid);
            grid = gridHost.add("group");
            grid.orientation = "column";
            grid.alignChildren = ["left", "top"];
            grid.spacing = GAP;
            modButtons = [];

            var first = startRow * cols;
            var last = Math.min(items.length, (startRow + nRows) * cols);
            var row = null;
            for (var i = first; i < last; i++) {
                if ((i - first) % cols === 0) {
                    row = grid.add("group");
                    row.orientation = "row";
                    row.spacing = GAP;
                }
                var item = items[i];
                var btn;
                if (item.icon !== null) {
                    btn = row.add("iconbutton", undefined, ScriptUI.newImage(item.icon), { style: "toolbutton" });
                    if (item.shiftIcon !== null || item.cmdIcon !== null) {
                        btn.__mainImage = btn.image;
                        try { btn.__shiftImage = item.shiftIcon ? ScriptUI.newImage(item.shiftIcon) : null; } catch (eSh) { btn.__shiftImage = null; }
                        try { btn.__cmdImage = item.cmdIcon ? ScriptUI.newImage(item.cmdIcon) : null; } catch (eCm) { btn.__cmdImage = null; }
                        if (btn.__shiftImage !== null || btn.__cmdImage !== null) modButtons.push(btn);
                    }
                } else {
                    btn = row.add("button", undefined, shortLabelOf(item.name));
                }
                btn.preferredSize = [CELL, CELL];
                btn.helpTip = tipFor(item, 0);
                btn.__item = item;
                btn.onClick = function () { runScript(this.__item); };
            }
            lastCols = cols;
        }

        // How many CELL-tall rows fit in h logical px.
        function rowsThatFit(h) {
            return Math.floor((h + GAP) / (CELL + GAP));
        }

        function relayout() {
            var cols = currentCols();
            var totalRows = Math.ceil(items.length / cols);
            var availH = ((win.size !== null && win.size !== undefined) ? win.size.height : 0) - 2 * MARGIN;
            if (availH <= 0) availH = 1e6;   // pre-size pass: show everything

            var fitNoNav = rowsThatFit(availH);
            if (totalRows <= fitNoNav) {
                // Everything fits — hide the pager, show every row.
                rowOffset = 0;
                nav.visible = false;
                rebuild(cols, 0, totalRows);
            } else {
                // Paginate: reserve the pager, show the rows that fit, page by row.
                nav.visible = true;
                var visRows = rowsThatFit(availH - NAVH - GAP);
                if (visRows < 1) visRows = 1;
                var maxOffset = totalRows - visRows;
                if (maxOffset < 0) maxOffset = 0;
                if (rowOffset > maxOffset) rowOffset = maxOffset;
                if (rowOffset < 0) rowOffset = 0;
                rebuild(cols, rowOffset, visRows);
                upBtn.enabled = rowOffset > 0;
                downBtn.enabled = rowOffset < maxOffset;
                pageLabel.text = "rows " + (rowOffset + 1) + "–" +
                    Math.min(totalRows, rowOffset + visRows) + " / " + totalRows;
            }
            win.layout.layout(true);
            win.layout.resize();
        }

        upBtn.onClick = function () { if (rowOffset > 0) { rowOffset--; relayout(); } };
        downBtn.onClick = function () { rowOffset++; relayout(); };   // relayout clamps

        rebuild(currentCols(), 0, 1e6);   // build all initially; relayout right-sizes

        win.onResizing = win.onResize = function () { relayout(); };

        /** Poll the modifier state and swap alt icons + tooltips live. */
        function tickModifiers() {
            var mode = 0;   // 0 base, 1 Shift, 2 Cmd/Ctrl (matches the native bar)
            try {
                var kb = ScriptUI.environment.keyboardState;
                if (kb !== null) { if (kb.shiftKey) mode = 1; else if (kb.metaKey || kb.ctrlKey) mode = 2; }
            } catch (eKb) { }
            if (mode === modMode) return;
            modMode = mode;
            for (var i = 0; i < modButtons.length; i++) {
                var btn = modButtons[i];
                try {
                    var img = btn.__mainImage;
                    if (mode === 1 && btn.__shiftImage) img = btn.__shiftImage;
                    else if (mode === 2 && btn.__cmdImage) img = btn.__cmdImage;
                    btn.image = img;
                    btn.helpTip = tipFor(btn.__item, mode);
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
        relayout();   // apply initial scroll state now that a real size exists
        return win;
    }

    buildUI(thisObj);

})(this);
