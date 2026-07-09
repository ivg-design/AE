/* IVG Toolkit landing — behavior. Data comes from data/scripts.json (built from script frontmatter). */
(async function () {
  'use strict';

  const CATEGORIES = [
    { key: 'animation',   label: 'Animation & Rigging', color: '#7C5CFF' },
    { key: 'composition', label: 'Composition',         color: '#2E9BFF' },
    { key: 'effects',     label: 'Effects & Audio',     color: '#FF6B9D' },
    { key: 'keyframes',   label: 'Keyframes',           color: '#FFB454' },
    { key: 'layers',      label: 'Layers',              color: '#5AD19A' },
    { key: 'paths',       label: 'Paths & Shapes',      color: '#C77DFF' },
    { key: 'utilities',   label: 'Utilities',           color: '#4ED8E0' },
  ];
  const catByKey = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
  const REPO = 'https://github.com/ivg-design/ae';

  // Prefer the catalog data inlined in the page (window.__SCRIPTS__) so the
  // grids render synchronously on first paint — no fetch round-trip, no layout
  // shift. Fall back to the JSON fetch if the inline block is absent.
  const scripts = Array.isArray(window.__SCRIPTS__)
    ? window.__SCRIPTS__
    : await fetch('data/scripts.json').then(r => r.json());
  scripts.sort((a, b) => a.name.localeCompare(b.name));
  const byId = Object.fromEntries(scripts.map(s => [s.id, s]));

  // ---------- helpers ----------
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function icons(root) { if (window.lucide) lucide.createIcons({ attrs: {}, root }); }
  function tileImg(s, px) {
    if (s.icon) return `<img src="${esc(s.icon)}" alt="" width="${px}" height="${px}" loading="lazy" />`;
    return `<i data-lucide="${esc(s.lucide || 'square-code')}"></i>`;
  }
  function uiBadge(s, extra) {
    const ui = (s.ui || 'DIALOG').toUpperCase();
    const cls = ui === 'HEADLESS' ? 'is-headless' : ui === 'PALETTE' || ui === 'PANEL' ? 'is-palette' : '';
    return `<span class="ui-badge ${cls} ${extra || ''}">${esc(ui)}</span>`;
  }
  function srcUrl(s) { return s.srcPath; }
  function jsxName(s) { return s.srcPath.split('/').pop(); }
  function docUrl(s) { return 'docs.html?s=' + encodeURIComponent(s.id); }

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  async function copyText(text, label) {
    try { await navigator.clipboard.writeText(text); toast(label || 'Copied to clipboard'); }
    catch { toast('Copy failed — clipboard unavailable'); }
  }
  function downloadScript(s) {
    const a = document.createElement('a');
    a.href = srcUrl(s);
    a.download = jsxName(s);
    document.body.appendChild(a); a.click(); a.remove();
    toast(`Downloading ${jsxName(s)}`);
  }

  // ---------- bundle builder (02 — THE COMMAND BAR) ----------
  const selected = new Set();
  let platform = 'jsx';
  const PANEL_PATH = 'scripts/toolbar/Build-a-Bar.jsx';
  const PANEL_ICON = id => `scripts/toolbar/icons/${id}.png`;
  const NATIVE = 'download/native';
  const ICON_MODS = ['shift', 'alt', 'cmd', 'ctrl'];
  // jsx = the cross-platform ScriptUI panel; the rest ship a native .plugin/.aex
  // (crisp vector icons) that scans an external ivg-scripts folder beside it.
  const PLATFORMS = {
    jsx:           { label: 'ScriptUI bundle (.zip)',        file: 'build-a-bar-scriptui.zip' },
    'mac-silicon': { label: 'Mac · Apple Silicon (.zip)',    file: 'build-a-bar-mac-arm64.zip', bin: 'mac-silicon.zip', kind: 'mac', os: 'macOS Apple Silicon' },
    'mac-intel':   { label: 'Mac · Intel (.zip)',            file: 'build-a-bar-mac-intel.zip', bin: 'mac-intel.zip',   kind: 'mac', os: 'macOS Intel' },
    windows:       { label: 'Windows · x64 (.zip)',          file: 'build-a-bar-win-x64.zip',   bin: 'windows-x64.aex', kind: 'win', os: 'Windows x64' },
  };
  // Extra files some scripts need beside them in the bundle (dest -> source URL).
  const BUNDLE_EXTRAS = {
    'sync-o-tron': [{ dest: 'ivg-scripts/projects/Sync-o-tron.aep', src: 'scripts/projects/Sync-o-tron.aep' }],
  };

  function renderBuilder() {
    const grid = $('#builderGrid');
    if (!grid) return;
    const rows = [];
    for (let i = 0; i < scripts.length; i += 12) rows.push(scripts.slice(i, i + 12));
    grid.innerHTML = rows.map(row =>
      `<div class="kbar-row">${row.map(s =>
        `<button class="kbar-tile ${selected.has(s.id) ? 'sel' : ''}" data-pick="${s.id}"
           title="${esc(s.name)}" aria-pressed="${selected.has(s.id)}" aria-label="Include ${esc(s.name)}">
           ${tileImg(s, 68)}<span class="tick"><i data-lucide="check"></i></span>
         </button>`
      ).join('')}</div>`
    ).join('');
    icons(grid);
    if (infoOpenId) closeInfo();
    $('#builderCount').textContent = `${selected.size} of ${scripts.length} selected`;
  }

  let infoOpenId = null;
  function closeInfo() {
    infoOpenId = null;
    const pop = $('#tilePop');
    if (pop) pop.remove();
    $('#builderGrid').classList.remove('info-open');
    $$('#builderGrid .kbar-tile.info-src').forEach(t => t.classList.remove('info-src'));
  }
  function openInfo(tile, id) {
    closeInfo();
    const s = byId[id];
    if (!s) return;
    infoOpenId = id;
    const grid = $('#builderGrid');
    grid.classList.add('info-open');
    tile.classList.add('info-src');
    const pop = document.createElement('div');
    pop.id = 'tilePop';
    pop.className = 'tile-pop';
    pop.innerHTML = `
      <div class="hd">
        <span class="tile">${tileImg(s, 48)}</span>
        <span class="nc"><b>${esc(s.name)}</b><i>${esc(catByKey[s.category].label)} · v${esc(s.version || '1.0')}</i></span>
      </div>
      <p>${esc(s.tagline)}</p>
      <div class="acts">
        <button class="p-sel">${selected.has(id) ? 'Remove' : 'Select'}</button>
        <button class="p-cxl">Cancel</button>
      </div>`;
    document.body.appendChild(pop);
    icons(pop);
    const r = tile.getBoundingClientRect();
    const pw = 280;
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    pop.style.left = left + 'px';
    pop.style.top = (r.bottom + window.scrollY + 10) + 'px';
    pop.style.setProperty('--arrow-x', (r.left + r.width / 2 - left) + 'px');
    $('.p-sel', pop).addEventListener('click', () => {
      selected.has(id) ? selected.delete(id) : selected.add(id);
      closeInfo();
      renderBuilder();
    });
    $('.p-cxl', pop).addEventListener('click', closeInfo);
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#tilePop')) return;
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      const id = pick.dataset.pick;
      if (infoOpenId === id) { closeInfo(); return; }
      openInfo(pick, id);
      return;
    }
    if (infoOpenId) closeInfo();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && infoOpenId) closeInfo(); });
  window.addEventListener('scroll', () => { if (infoOpenId) closeInfo(); }, { passive: true });
  $('#selAll') && $('#selAll').addEventListener('click', () => { scripts.forEach(s => selected.add(s.id)); renderBuilder(); });
  $('#selNone') && $('#selNone').addEventListener('click', () => { selected.clear(); renderBuilder(); });

  function bundleReadme(list) {
    return `Build-a-Bar bundle — ${list.length} script${list.length === 1 ? '' : 's'} (MIT)
=========================================================

INSTALL
  1. Copy "Build-a-Bar.jsx" AND the whole "ivg-scripts" folder into:
       After Effects > Scripts > ScriptUI Panels
  2. Restart After Effects (or File > Scripts > Rescan Script Folder).
  3. Open Window > Build-a-Bar.jsx — a dockable, resizable toolbar
     with one icon button per script. Buttons reflow when you dock it
     vertical, horizontal, or as a grid.

Only the command bar appears in the Window menu; your scripts live in
the ivg-scripts subfolder and are launched by the bar.

Prefer the classic way? Drop any .jsx from ivg-scripts/<category>/
directly into Scripts or Scripts > ScriptUI Panels.

INCLUDED
${list.map(s => `  - ${s.name} v${s.version || '1.0'} (${s.category})`).join('\n')}

Docs & updates: ${REPO}
`;
  }

  // ---- platform picker (WAI-ARIA radiogroup: roving tabindex + arrow keys) ----
  function setPlatform(p, focus) {
    if (!PLATFORMS[p]) return;
    platform = p;
    $$('#builderPlat .plat-btn').forEach(b => {
      const on = b.dataset.plat === p;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;            // only the checked radio is a tab stop
      if (on && focus) b.focus();
    });
    const lbl = $('#buildBtnLabel');
    if (lbl) lbl.textContent = `Download ${PLATFORMS[p].label}`;
    const note = $('#builderNote');
    if (note) note.textContent = p === 'jsx'
      ? 'ScriptUI panel — drop the .jsx + ivg-scripts into Scripts › ScriptUI Panels. Any AE, no install.'
      : 'Native plugin — drop the IVGD folder into AE’s Plug-ins folder (INSTALL.txt inside). Crisp vector icons at any size.';
  }
  const platGroup = $('#builderPlat');
  if (platGroup) {
    platGroup.addEventListener('click', e => {
      const b = e.target.closest('[data-plat]');
      if (b) setPlatform(b.dataset.plat);
    });
    platGroup.addEventListener('keydown', e => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      const order = Object.keys(PLATFORMS);
      const next = order[(order.indexOf(platform) + keys[e.key] + order.length) % order.length];
      setPlatform(next, true);             // arrow moves selection AND focus (radio pattern)
    });
  }

  function triggerDownload(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function fetchText(url, label) {
    const r = await fetch(url); if (!r.ok) throw new Error(label || url); return r.text();
  }
  async function fetchBuf(url, label) {
    const r = await fetch(url); if (!r.ok) throw new Error(label || url); return r.arrayBuffer();
  }

  // ScriptUI (.jsx): the cross-platform panel + PNG icons + category subfolders.
  async function assembleJsx(zip, list) {
    zip.file('Build-a-Bar.jsx', await fetchText(encodeURI(PANEL_PATH), 'panel'));
    for (const s of list) {
      zip.file(`ivg-scripts/${s.category}/${jsxName(s)}`, await fetchText(s.srcPath, s.name));
      // base (24px) + @2x HiDPI sibling + Shift/Cmd rollover variants (+ their @2x)
      for (const suffix of ['', '@2x', '.shift', '.shift@2x', '.cmd', '.cmd@2x']) {
        const r = await fetch(`scripts/toolbar/icons/${s.id}${suffix}.png`);
        if (r.ok) zip.file(`ivg-scripts/icons/${s.id}${suffix}.png`, await r.arrayBuffer());
      }
    }
    for (const s of list) for (const ex of (BUNDLE_EXTRAS[s.id] || [])) {
      const xr = await fetch(encodeURI(ex.src));
      if (xr.ok) zip.file(ex.dest, await xr.arrayBuffer());
    }
    zip.file('ivg-scripts/tooltips.txt',
      list.map(s => `${jsxName(s).replace(/\.jsx$/, '')}|${(s.tagline || '').replace(/\|/g, '/')}`).join('\n'));
    zip.file('README.txt', bundleReadme(list));
  }

  // Native: the platform binary + an EXTERNAL ivg-scripts folder (flat jsx + SVG
  // icons + manifests) — the exact layout the .plugin/.aex scans beside itself.
  async function assembleNative(zip, list, plat) {
    const R = 'IVGD';
    if (plat.kind === 'mac') {                      // unzip the hosted .plugin bundle into IVGD/
      const inner = await JSZip.loadAsync(await fetchBuf(`${NATIVE}/${plat.bin}`, `${plat.os} plugin`));
      const paths = [];
      inner.forEach((path, f) => { if (!f.dir) paths.push(path); });
      for (const p of paths) zip.file(`${R}/${p}`, await inner.file(p).async('arraybuffer'));
    } else {                                        // Windows: single .aex file
      zip.file(`${R}/IvgdBar.aex`, await fetchBuf(`${NATIVE}/${plat.bin}`, `${plat.os} plugin`));
    }
    for (const s of list) {
      zip.file(`${R}/ivg-scripts/${jsxName(s)}`, await fetchText(s.srcPath, s.name));
      const base = await fetch(`${NATIVE}/icons/${s.id}.svg`);
      if (base.ok) zip.file(`${R}/ivg-scripts/icons/${s.id}.svg`, await base.text());
      for (const mod of ICON_MODS) {
        const v = await fetch(`${NATIVE}/icons/${s.id}.${mod}.svg`);
        if (v.ok) zip.file(`${R}/ivg-scripts/icons/${s.id}.${mod}.svg`, await v.text());
      }
    }
    for (const s of list) for (const ex of (BUNDLE_EXTRAS[s.id] || [])) {
      const xr = await fetch(encodeURI(ex.src));
      if (xr.ok) zip.file(`${R}/${ex.dest}`, await xr.arrayBuffer());
    }
    for (const lg of ['logo-landscape.svg', 'logo-portrait.svg']) {   // fixed header logo
      const r = await fetch(`${NATIVE}/${lg}`);
      if (r.ok) zip.file(`${R}/ivg-scripts/${lg}`, await r.text());
    }
    const man = {}, clean = v => String(v || '').replace(/[\t\r\n]+/g, ' ').trim();
    for (const s of list) man[s.id] = { name: s.displayName || s.name || s.id, desc: s.tagline || '' };
    zip.file(`${R}/ivg-scripts/manifest.json`, JSON.stringify(man));
    zip.file(`${R}/ivg-scripts/manifest.tsv`,
      list.map(s => `${s.id}\t${clean(man[s.id].name)}\t${clean(man[s.id].desc)}`).join('\n'));
    zip.file(`${R}/INSTALL.txt`, nativeReadme(list, plat));
  }

  function nativeReadme(list, plat) {
    const mac = plat.kind === 'mac';
    const dest = mac
      ? '/Applications/Adobe After Effects <version>/Plug-ins/'
      : 'C:\\Program Files\\Adobe\\Adobe After Effects <version>\\Support Files\\Plug-ins\\';
    const bin = mac ? 'IvgdBar.plugin' : 'IvgdBar.aex';
    return `Build-a-Bar — native plugin (${plat.os})
${'='.repeat(56)}

INSTALL
  1. Quit After Effects.
  2. Copy this whole "IVGD" folder into AE's plug-ins folder:
       ${dest}
     (it must contain ${bin} AND the ivg-scripts folder, side by side)
  3. Launch After Effects.
  4. Window menu -> "Build-a-Bar" opens the dockable panel.
${mac ? `
  If macOS blocks it (downloaded + ad-hoc signed), clear quarantine once in Terminal:
     xattr -dr com.apple.quarantine "<plug-ins path>/IVGD/IvgdBar.plugin"
` : ''}
NOTES
  - Crisp vector icons at any panel size. Hold Shift or Ctrl over an icon for
    rollover variants (where a script provides them).
  - The gear (bottom-right) sets icon size + spacing (persisted).

INCLUDED (${list.length})
${list.map(s => `  - ${s.name} v${s.version || '1.0'}`).join('\n')}

Docs & updates: ${REPO}
`;
  }

  async function buildBundle() {
    const list = scripts.filter(s => selected.has(s.id));
    if (!list.length) { toast('Pick at least one script first'); return; }
    const plat = PLATFORMS[platform];
    const btn = $('#buildBundle');
    btn.disabled = true;
    toast(`Building ${plat.label} — ${list.length} script${list.length === 1 ? '' : 's'}…`);
    try {
      const zip = new JSZip();
      if (platform === 'jsx') await assembleJsx(zip, list);
      else await assembleNative(zip, list, plat);
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, plat.file);
      toast(`Bundle ready — ${plat.label}`);
    } catch (err) {
      toast('Bundle failed: ' + err.message);
    } finally {
      btn.disabled = false;
    }
  }
  $('#buildBundle') && $('#buildBundle').addEventListener('click', buildBundle);
  setPlatform('jsx');

  // ---------- library ----------
  let activeCat = 'layers';
  let view = 'list';
  let query = '';

  function visibleScripts() {
    let list = scripts.filter(s => s.category === activeCat);
    if (query) {
      const q = query.toLowerCase();
      list = scripts.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.tagline || '').toLowerCase().includes(q) ||
        s.category.includes(q));
    }
    return list;
  }

  function buildSidebar() {
    const nav = $('#catList');
    const grow = $('.side-grow', nav);
    $$('.cat-item', nav).forEach(el => el.remove());
    CATEGORIES.forEach(c => {
      const count = scripts.filter(s => s.category === c.key).length;
      const btn = document.createElement('button');
      btn.className = 'cat-item' + (c.key === activeCat && !query ? ' active' : '');
      btn.dataset.cat = c.key;
      btn.innerHTML = `<span class="dot" style="background:${c.color}"></span><span class="n">${esc(c.label)}</span><span class="ct">${count}</span>`;
      btn.addEventListener('click', () => {
        activeCat = c.key; query = ''; $('#libSearch').value = '';
        renderLibrary();
      });
      nav.insertBefore(btn, grow);
    });
  }

  function renderLibrary() {
    buildSidebar();
    const list = visibleScripts();
    const cat = catByKey[activeCat];
    $('#cHeadTitle').textContent = query ? `Search “${query}”` : cat.label.replace(' & Rigging', '').replace(' & Audio', '').replace(' & Shapes', '');
    $('#cHeadCount').textContent = `${list.length} script${list.length === 1 ? '' : 's'}`;

    const listEl = $('#scriptList');
    const gridEl = $('#scriptGrid');
    listEl.hidden = view !== 'list';
    gridEl.hidden = view !== 'grid';

    if (view === 'list') {
      listEl.innerHTML = list.map(s => `
        <button class="script-row" data-script="${s.id}">
          <span class="tile">${tileImg(s, 48)}</span>
          <span class="nc">
            <span class="n">${esc(s.name)}</span>
            <span class="d">${esc(s.tagline)}</span>
          </span>
          <span class="sp"></span>
          <span class="v">v${esc(s.version || '1.0')}</span>
          ${uiBadge(s)}
          <i class="chev" data-lucide="chevron-right"></i>
        </button>`).join('') ||
        `<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:14px">No scripts match “${esc(query)}”.</div>`;
      icons(listEl);
    } else {
      gridEl.innerHTML = list.map(s => `
        <button class="script-card" data-script="${s.id}">
          <span class="top">
            <span class="hd">
              <span class="tile">${tileImg(s, 56)}</span>
              <span class="nc">
                <span class="n">${esc(s.name)}</span>
                <span class="mt">${uiBadge(s)}<span class="v">v${esc(s.version || '1.0')}</span></span>
              </span>
            </span>
            <span class="d">${esc(s.tagline)}</span>
          </span>
          <span class="dl"><i data-lucide="download"></i>Download .jsx</span>
        </button>`).join('') ||
        `<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:14px;grid-column:1/-1">No scripts match “${esc(query)}”.</div>`;
      icons(gridEl);
      $$('.script-card .dl', gridEl).forEach(dl => {
        dl.addEventListener('click', e => {
          e.stopPropagation();
          downloadScript(byId[dl.closest('[data-script]').dataset.script]);
        });
      });
    }
  }

  $('#libSearch').addEventListener('input', e => { query = e.target.value.trim(); renderLibrary(); });
  $('#viewList').addEventListener('click', () => { view = 'list'; setSeg(); renderLibrary(); });
  $('#viewGrid').addEventListener('click', () => { view = 'grid'; setSeg(); renderLibrary(); });
  function setSeg() {
    $('#viewList').classList.toggle('active', view === 'list');
    $('#viewGrid').classList.toggle('active', view === 'grid');
  }

  // ---------- overlays ----------
  const overlays = {
    detail: $('#detailOverlay'),
    palette: $('#paletteOverlay'),
    download: $('#downloadOverlay'),
  };
  function openOverlay(name) {
    closeAll();
    overlays[name].classList.add('open');
    document.body.classList.add('modal-open');
    if (name === 'palette') { const inp = $('#palInput'); inp.value = ''; palSel = 0; renderPalette(''); inp.focus(); }
  }
  function closeAll() {
    Object.values(overlays).forEach(o => o.classList.remove('open'));
    document.body.classList.remove('modal-open');
  }
  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener) { openOverlay(opener.dataset.open); return; }
    if (e.target.closest('[data-close]')) { closeAll(); return; }
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) { copyText(copyBtn.dataset.copy); return; }
    if (e.target.closest('[data-goto-library]')) {
      closeAll();
      $('#library').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const sBtn = e.target.closest('[data-script]');
    if (sBtn) { openDetail(sBtn.dataset.script); return; }
    // click on overlay backdrop closes
    if (e.target.classList && e.target.classList.contains('overlay')) closeAll();
  });

  // ---------- detail modal ----------
  let currentId = null;
  function openDetail(id) {
    const s = byId[id];
    if (!s) return;
    currentId = id;
    const cat = catByKey[s.category];
    const headless = (s.ui || '').toUpperCase() === 'HEADLESS';
    const idx = scripts.findIndex(x => x.id === id);
    const prev = scripts[(idx - 1 + scripts.length) % scripts.length];
    const next = scripts[(idx + 1) % scripts.length];
    const feats = (s.functionality || []).slice(0, 8);
    const notes = (s.notes || []).slice(0, 6);
    const usage = (s.usage || []).slice(0, 7);
    const reqs = (s.requirements || []).slice(0, 4);
    const updated = (s.changelogDate || '').slice(0, 10);

    const runLine = headless ? '▸ File ▸ Scripts ▸ ' + jsxName(s) : '▸ File ▸ Scripts ▸ Run Script File…';
    const runNote = headless
      ? 'HEADLESS script — runs instantly with no dialog. Assign it to a shortcut or launcher for one-keystroke use.'
      : `${esc((s.ui || 'DIALOG').toUpperCase())} script — runs from the Scripts menu. Panel tools dock via the ScriptUI Panels folder.`;

    $('#detailModal').innerHTML = `
      <div class="dm-header">
        <div class="dm-id">
          <div class="dm-tile">${tileImg(s, 68)}</div>
          <div class="dm-col">
            <span class="dm-name">${esc(s.name)}</span>
            <div class="dm-meta">
              <span class="chip"><span class="dot" style="background:${cat.color}"></span>${esc(cat.label)}</span>
              <span class="chip">v${esc(s.version || '1.0')}</span>
              ${uiBadge(s)}
            </div>
          </div>
        </div>
        <button class="modal-close" data-close><i data-lucide="x"></i></button>
      </div>
      <div class="dm-summary">
        <span class="bar"></span>
        <p>${esc(s.description || s.tagline)}</p>
      </div>
      <div class="dm-body">
        <div class="dm-left">
          ${feats.length ? `
          <div class="dm-sec">
            <span class="sec-label"><i data-lucide="workflow"></i>HOW IT WORKS</span>
            <div class="f-list">
              ${feats.map(f => `<div class="f-item"><span class="c"><i data-lucide="check"></i></span><p>${esc(f)}</p></div>`).join('')}
            </div>
          </div>` : ''}
          ${notes.length ? `
          <div class="dm-sec">
            <span class="sec-label"><i data-lucide="lightbulb"></i>GOOD TO KNOW</span>
            <div class="n-list">
              ${notes.map(n => `<div class="n-item"><span class="dw"><i></i></span><p>${esc(n)}</p></div>`).join('')}
            </div>
          </div>` : ''}
        </div>
        <div class="dm-right">
          ${usage.length ? `
          <div class="side-card">
            <span class="sec-label"><i data-lucide="list-ordered"></i>HOW TO USE</span>
            ${usage.map((u, i) => `<div class="u-step"><span class="n">${i + 1}</span><p>${esc(u)}</p></div>`).join('')}
          </div>` : ''}
          <div class="side-card">
            <span class="sec-label"><i data-lucide="terminal"></i>RUN IT</span>
            <div class="term"><span>${runLine}</span></div>
            <p class="note">${runNote}</p>
          </div>
          ${reqs.length ? `
          <div class="side-card">
            <span class="sec-label"><i data-lucide="clipboard-check"></i>REQUIREMENTS</span>
            ${reqs.map(r => `<div class="r-item"><span class="dw"><i></i></span><p>${esc(r)}</p></div>`).join('')}
          </div>` : ''}
          <button class="dm-dl" data-dl="${s.id}"><i data-lucide="download"></i>Download ${esc(jsxName(s))}</button>
          <a class="dm-src" href="${REPO}" target="_blank" rel="noopener"><i data-lucide="github"></i>View source</a>
          <a class="dm-src" href="${docUrl(s)}"><i data-lucide="book-open"></i>Open full docs</a>
        </div>
      </div>
      <div class="dm-footer">
        <span class="l">${updated ? 'Updated ' + esc(updated) + ' · ' : ''}v${esc(s.version || '1.0')} · MIT</span>
        <span class="r">
          <button data-nav="${prev.id}">‹ ${esc(prev.name)}</button>
          <button data-nav="${next.id}">${esc(next.name)} ›</button>
        </span>
      </div>`;

    const overlay = overlays.detail;
    overlay.classList.toggle('headless-glow', headless);
    $('#detailModal').classList.toggle('headless-accent', headless);
    icons($('#detailModal'));
    $$('#detailModal [data-nav]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openDetail(b.dataset.nav); }));
    const dl = $('#detailModal [data-dl]');
    if (dl) dl.addEventListener('click', e => { e.stopPropagation(); downloadScript(s); });
    // clicking the modal body shouldn't re-trigger data-script handlers
    openOverlay('detail');
    overlay.scrollTop = 0;
  }

  // ---------- command palette ----------
  const ACTIONS = [
    { id: 'a-zip', name: 'Download all (.zip)', sub: 'Full toolkit, one archive', icon: 'download', hint: '⌘D', run: () => { closeAll(); openOverlay('download'); } },
    { id: 'a-repo', name: 'Open repository', sub: 'github.com/ivg-design/ae', icon: 'github', run: () => window.open(REPO, '_blank') },
    { id: 'a-path', name: 'Copy Scripts folder path', sub: '/Applications/Adobe After Effects/Scripts', icon: 'copy', run: () => copyText('/Applications/Adobe After Effects 2025/Scripts/ScriptUI Panels', 'Scripts folder path copied') },
  ];
  let palSel = 0;
  let palItems = [];

  function renderPalette(q) {
    const ql = q.trim().toLowerCase();
    const matches = ql
      ? scripts.filter(s => s.name.toLowerCase().includes(ql) || (s.tagline || '').toLowerCase().includes(ql))
      : scripts.slice(0, 4);
    const actions = ql ? ACTIONS.filter(a => a.name.toLowerCase().includes(ql)) : ACTIONS;
    palItems = [...matches.map(s => ({ kind: 'script', s })), ...actions.map(a => ({ kind: 'action', a }))];
    palSel = Math.min(palSel, Math.max(0, palItems.length - 1));

    const rows = [];
    if (matches.length) rows.push(`<div class="pal-group">SCRIPTS</div>`);
    matches.forEach((s, i) => {
      const cat = catByKey[s.category];
      rows.push(`
        <button class="pal-row ${i === palSel ? 'sel' : ''}" data-pi="${i}">
          <span class="bar"></span>
          <span class="tile">${tileImg(s, 40)}</span>
          <span class="c">
            <span class="n">${esc(s.name)}</span>
            <span class="s">${esc(cat.label)} · ${esc(shortTag(s))}</span>
          </span>
          <span class="sp"></span>
          <span class="h">↵ open</span>
        </button>`);
    });
    if (actions.length) rows.push(`<div class="pal-group" style="padding-top:${matches.length ? 14 : 8}px">ACTIONS</div>`);
    actions.forEach((a, j) => {
      const i = matches.length + j;
      rows.push(`
        <button class="pal-row ${i === palSel ? 'sel' : ''}" data-pi="${i}">
          <span class="bar"></span>
          <span class="tile"><i data-lucide="${a.icon}"></i></span>
          <span class="c">
            <span class="n">${esc(a.name)}</span>
            <span class="s">${esc(a.sub)}</span>
          </span>
          <span class="sp"></span>
          <span class="h">${a.hint || '↵'}</span>
        </button>`);
    });
    if (!palItems.length) rows.push(`<div style="padding:28px;text-align:center;color:var(--text-muted);font-size:13.5px">Nothing matches “${esc(q)}”.</div>`);
    const el = $('#palResults');
    el.innerHTML = rows.join('');
    icons(el);
    $$('.pal-row', el).forEach(r => r.addEventListener('click', () => runPalItem(+r.dataset.pi)));
  }
  function shortTag(s) {
    const t = s.tagline || '';
    return t.length > 46 ? t.slice(0, 46).replace(/\s+\S*$/, '') + '…' : t;
  }
  function runPalItem(i) {
    const item = palItems[i];
    if (!item) return;
    if (item.kind === 'script') { closeAll(); openDetail(item.s.id); }
    else item.a.run();
  }
  $('#palInput').addEventListener('input', e => { palSel = 0; renderPalette(e.target.value); });
  $('#palInput').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, palItems.length - 1); renderPalette($('#palInput').value); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); renderPalette($('#palInput').value); }
    else if (e.key === 'Enter') { e.preventDefault(); runPalItem(palSel); }
  });

  // ---------- global keys ----------
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      overlays.palette.classList.contains('open') ? closeAll() : openOverlay('palette');
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      if (overlays.detail.classList.contains('open') && currentId) downloadScript(byId[currentId]);
      else openOverlay('download');
    } else if (e.key === 'Escape') {
      closeAll();
    }
  });

  // ---------- misc ----------
  // real zip size
  fetch('download/ae-scripts.zip', { method: 'HEAD' }).then(r => {
    const len = +r.headers.get('content-length');
    if (len) $('#zipSize').textContent = '≈ ' + Math.round(len / 1024) + ' KB';
  }).catch(() => {});

  // scroll reveal
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .2 });
  $$('.reveal').forEach(el => io.observe(el));

  renderLibrary();
  renderBuilder();
  icons(document.body);
  // Grids are populated — release the first-render height reserve so filtering
  // to a smaller category resizes the catalog window instead of leaving a gap.
  document.documentElement.classList.remove('pre-render');
})();
