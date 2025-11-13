/* ECMA-3 compliant ExtendScript for Photoshop
   Exports composites of a background + each overlay group named v1..v12
   PNG-24 output; restores original visibility state.
*/

(function () {
    if (!app.documents.length) {
        alert("Open a document first.");
        return;
    }

    var doc = app.activeDocument;

    // Choose output folder
    var outFolder = Folder.selectDialog("Choose output folder for composites");
    if (!outFolder) return;

    // Helpers ---------------------------------------------------------------
    function endsWithCI(s, suf) {
        return s.slice(-suf.length).toLowerCase() === suf.toLowerCase();
    }
    function baseNameNoExt(name) {
        var idx = name.lastIndexOf(".");
        return idx > 0 ? name.substring(0, idx) : name;
    }
    function forAllLayers(parent, fn) {
        // recurse through layerSets and artLayers
        var i;
        for (i = 0; i < parent.layerSets.length; i++) {
            fn(parent.layerSets[i]);
            forAllLayers(parent.layerSets[i], fn);
        }
        for (i = 0; i < parent.artLayers.length; i++) {
            fn(parent.artLayers[i]);
        }
    }
    function snapshotVisibility(parent) {
        var snaps = [];
        forAllLayers(parent, function (lyr) {
            // Some layers may throw if you read .visible; wrap defensively
            try {
                snaps.push({ layer: lyr, visible: lyr.visible });
            } catch (e) {}
        });
        return snaps;
    }
    function restoreVisibility(snaps) {
        for (var i = 0; i < snaps.length; i++) {
            try {
                snaps[i].layer.visible = snaps[i].visible;
            } catch (e) {}
        }
    }
    function findBackgroundLayer(d) {
        try {
            // Real "Background" layer (locked, special)
            if (d.backgroundLayer) return d.backgroundLayer;
        } catch (e) {}
        // Otherwise, prefer a layer named "background" (case-insensitive)
        var found = null;
        forAllLayers(d, function (lyr) {
            try {
                if (lyr.typename === "ArtLayer" && lyr.name.toLowerCase() === "background") {
                    found = lyr;
                }
            } catch (e) {}
        });
        if (found) return found;

        // Fallback: bottom-most top-level layer
        // (Photoshop stacks topmost at index 0 visually; DOM order differs by version,
        // so we’ll pick the last top-level thing we can access.)
        if (d.layers && d.layers.length > 0) return d.layers[d.layers.length - 1];
        return null;
    }
    function getVersionGroups(d) {
        // Collect any layerSet whose name matches /^v\d+$/i
        var arr = [];
        forAllLayers(d, function (lyr) {
            try {
                if (lyr.typename === "LayerSet") {
                    var n = lyr.name;
                    if (n && /^v\d+$/i.test(n)) arr.push(lyr);
                }
            } catch (e) {}
        });
        // Sort naturally by number: v1, v2, ... v12
        arr.sort(function (a, b) {
            function num(x) {
                return parseInt(x.name.replace(/[^0-9]/g, ""), 10);
            }
            return num(a) - num(b);
        });
        return arr;
    }
    function hideAllVersionGroups(groups) {
        for (var i = 0; i < groups.length; i++) {
            try { groups[i].visible = false; } catch (e) {}
        }
    }
    function exportPNG24(d, file) {
        var opts = new ExportOptionsSaveForWeb();
        opts.format = SaveDocumentType.PNG;
        opts.PNG8 = false;           // PNG-24
        opts.transparency = false;   // background should be present; set true if you want transparent
        opts.interlaced = false;
        opts.includeProfile = true;
        d.exportDocument(file, ExportType.SAVEFORWEB, opts);
    }

    // Work ---------------------------------------------------------------
    var bg = findBackgroundLayer(doc);
    if (!bg) {
        alert("Could not find a background layer. Name one 'Background' or keep a bottom layer present.");
        return;
    }

    var versionGroups = getVersionGroups(doc);
    if (!versionGroups.length) {
        alert("No groups found matching v1..v12. Name your overlay groups like v1, v2, ...");
        return;
    }

    var visSnap = snapshotVisibility(doc);
    var base = baseNameNoExt(doc.name);

    // Make sure background is visible
    try { bg.visible = true; } catch (e) {}

    // Hide all version groups first
    hideAllVersionGroups(versionGroups);

    // Export each composite
    for (var i = 0; i < versionGroups.length; i++) {
        var g = versionGroups[i];

        // Toggle only this group on
        hideAllVersionGroups(versionGroups);
        try { g.visible = true; } catch (e) {}

        // Compose filename: <docBase>_<group>.png
        var fname = base + "_" + g.name + ".png";
        var outFile = File(outFolder.fsName + "/" + fname);

        exportPNG24(doc, outFile);
    }

    // Restore prior visibility
    restoreVisibility(visSnap);

    alert("Done! Exported " + versionGroups.length + " files to:\n" + outFolder.fsName);
})();