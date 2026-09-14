const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
      // A cell may legitimately contain a pipe (a popup's item list, a name with
      // "||" in it), so the row is walked rather than split: "\|" is an escaped
      // literal, every other "|" is a cell boundary. A plain split('|') turned
      // one escaped pipe into an extra column, which pushed the row past the
      // header's column count and blew the table out over the page.
      const splitRow = (r) => {
        const cells = [];
        let cur = '';
        for (let i = 0; i < r.length; i++) {
          const ch = r[i];
          if (ch === '\\' && r[i + 1] === '|') { cur += '|'; i++; continue; }
          if (ch === '|') { cells.push(cur); cur = ''; continue; }
          cur += ch;
        }
        cells.push(cur);
        return cells.slice(1, -1).map(c => c.trim());
      };
      const rows = tableBuf.map(splitRow);
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


export { renderMd };
