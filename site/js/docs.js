/* Docs page — renders ae/docs/scripts/<Name>.md into the article shell. */
(async function () {
  'use strict';

  const CATEGORIES = [
    { key: 'animation',   label: 'Animation & Rigging', short: 'ANIMATION',   color: '#7C5CFF' },
    { key: 'composition', label: 'Composition',         short: 'COMPOSITION', color: '#2E9BFF' },
    { key: 'effects',     label: 'Effects & Audio',     short: 'EFFECTS',     color: '#FF6B9D' },
    { key: 'keyframes',   label: 'Keyframes',           short: 'KEYFRAMES',   color: '#FFB454' },
    { key: 'layers',      label: 'Layers',              short: 'LAYERS',      color: '#5AD19A' },
    { key: 'paths',       label: 'Paths & Shapes',      short: 'PATHS',       color: '#C77DFF' },
    { key: 'utilities',   label: 'Utilities',           short: 'UTILITIES',   color: '#4ED8E0' },
  ];
  const catByKey = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

  const scripts = await fetch('data/scripts.json').then(r => r.json());
  scripts.sort((a, b) => a.name.localeCompare(b.name));
  const byId = Object.fromEntries(scripts.map(s => [s.id, s]));

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const icons = root => { if (window.lucide) lucide.createIcons({ root }); };

  const params = new URLSearchParams(location.search);
  const current = byId[params.get('s')] || byId['parent-o-bot'] || scripts[0];

  // ---------- sidebar ----------
  function buildSide(filter) {
    const side = $('#docSide');
    $$('.grp, a', side).forEach(el => el.remove());
    const f = (filter || '').toLowerCase();
    for (const cat of CATEGORIES) {
      const items = scripts.filter(s => s.category === cat.key &&
        (!f || s.name.toLowerCase().includes(f)));
      if (!items.length) continue;
      const g = document.createElement('span');
      g.className = 'grp';
      g.textContent = cat.short;
      side.appendChild(g);
      for (const s of items) {
        const a = document.createElement('a');
        a.href = 'docs.html?s=' + encodeURIComponent(s.id);
        a.className = s.id === current.id ? 'on' : '';
        a.innerHTML = s.icon
          ? `<img src="${esc(s.icon)}" alt="" /><span>${esc(s.name)}</span>`
          : `<i data-lucide="${esc(s.lucide || 'square-code')}"></i><span>${esc(s.name)}</span>`;
        side.appendChild(a);
      }
    }
    icons(side);
  }
  $('#docSearch').addEventListener('input', e => buildSide(e.target.value));

  // ---------- tiny markdown renderer ----------
  function inline(md) {
    return esc(md)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  function renderMd(md) {
    const lines = md.split(/\r?\n/);
    const out = [];
    const toc = [];
    let i = 0, listType = null, inCode = false, codeBuf = [], tableBuf = [];

    const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
    const flushTable = () => {
      if (!tableBuf.length) return;
      const rows = tableBuf.map(r => r.split('|').slice(1, -1).map(c => c.trim()));
      tableBuf = [];
      if (rows.length < 2) return;
      const head = rows[0], body = rows.slice(2);
      out.push('<table><thead><tr>' + head.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>'
        + body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('')
        + '</tbody></table>');
    };

    for (; i < lines.length; i++) {
      const line = lines[i];
      if (inCode) {
        if (/^```/.test(line)) { out.push(`<pre><code>${esc(codeBuf.join('\n'))}</code></pre>`); inCode = false; codeBuf = []; }
        else codeBuf.push(line);
        continue;
      }
      if (/^```/.test(line)) { closeList(); flushTable(); inCode = true; continue; }
      if (/^\|/.test(line)) { closeList(); tableBuf.push(line); continue; }
      flushTable();

      let m;
      if ((m = line.match(/^#\s+(.*)/))) { closeList(); /* h1 handled separately */ continue; }
      if ((m = line.match(/^##\s+(.*)/))) {
        closeList();
        const t = m[1].trim(), id = slug(t);
        toc.push({ t, id });
        out.push(`<h2 id="${id}">${inline(t)}</h2>`);
        continue;
      }
      if ((m = line.match(/^###\s+(.*)/))) { closeList(); out.push(`<h3>${inline(m[1].trim())}</h3>`); continue; }
      if ((m = line.match(/^>\s?(.*)/))) { closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
      if (/^(---|\*\*\*)\s*$/.test(line)) { closeList(); out.push('<hr/>'); continue; }
      if ((m = line.match(/^\s*[-*•]\s+(.*)/))) {
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push(`<li>${inline(m[1])}</li>`);
        continue;
      }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) {
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push(`<li>${inline(m[1])}</li>`);
        continue;
      }
      if (!line.trim()) { closeList(); continue; }
      closeList();
      out.push(`<p>${inline(line.trim())}</p>`);
    }
    closeList(); flushTable();
    return { html: out.join('\n'), toc };
  }

  // ---------- page ----------
  const cat = catByKey[current.category];
  document.title = current.name + ' — IVG Toolkit Docs';
  $('#docBc').innerHTML = `Docs <span>/</span> ${esc(cat.label)} <span>/</span> <b>${esc(current.name)}</b>`;
  $('#docH1').textContent = current.name;
  const uiCls = (current.ui || '').toUpperCase() === 'HEADLESS' ? 'is-headless'
    : ['PALETTE', 'PANEL'].includes((current.ui || '').toUpperCase()) ? 'is-palette' : '';
  $('#docBadges').innerHTML = `
    <span class="chip"><span class="dot" style="background:${cat.color}"></span>${esc(cat.label)}</span>
    <span class="chip">v${esc(current.version || '1.0')}</span>
    <span class="ui-badge ${uiCls}">${esc((current.ui || 'DIALOG').toUpperCase())}</span>`;

  buildSide('');

  const mdEl = $('#docMd');
  try {
    const res = await fetch(current.docPath);
    if (!res.ok) throw new Error(res.status);
    const raw = await res.text();
    const { html, toc } = renderMd(raw);
    mdEl.innerHTML = html;

    const tocEl = $('#docToc');
    toc.forEach(({ t, id }) => {
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = t;
      tocEl.appendChild(a);
    });
    // active-section highlight
    const heads = $$('.md h2');
    const links = $$('a', tocEl);
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-10% 0px -70% 0px' });
    heads.forEach(h => io.observe(h));
  } catch (err) {
    mdEl.innerHTML = `<p>Documentation for <strong>${esc(current.name)}</strong> hasn’t been generated yet
      (looked for <code>${esc(current.docPath)}</code>).</p>
      <p>${esc(current.description || current.tagline || '')}</p>`;
  }

  const dl = $('#docDl');
  dl.hidden = false;
  $('#dlT').textContent = `Get ${current.name}`;
  $('#dlS').textContent = `v${current.version || '1.0'} · ${(current.ui || 'DIALOG').toUpperCase()} · MIT`;
  const btn = $('#dlBtn');
  btn.href = current.srcPath;
  btn.setAttribute('download', current.srcPath.split('/').pop());
  btn.innerHTML = `<i data-lucide="download"></i>Download ${esc(current.srcPath.split('/').pop())}`;

  icons(document.body);
})();
